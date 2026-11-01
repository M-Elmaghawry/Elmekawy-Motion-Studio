import fs from 'node:fs/promises';
import path from 'node:path';
import { createWriteStream } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream/promises';
import { openBrowser } from '@remotion/renderer';
import { browserPath } from '@elmekawy/motion-engine/server';
import type { MultipartFile } from '@fastify/multipart';
import type { FlexibleAsset } from '@elmekawy/shared/flexible';
import { AppError, workspace, stateRoot, safePath, hashFile } from './storage.ts';
import {
  readFlexible,
  flexibleLock,
  assertRevision,
  flexibleFolder,
  commitFlexible,
} from './flexible-projects.ts';

const run = promisify(execFile);
export const mediaLimits = {
  image: 50 * 1024 ** 2,
  font: 50 * 1024 ** 2,
  video: 250 * 1024 ** 2,
  audio: 100 * 1024 ** 2,
  maxSeconds: 180,
};
export async function inspectMedia(
  file: string,
  allowFont = false,
): Promise<Pick<FlexibleAsset, 'kind' | 'mimeType' | 'metadata'>> {
  const handle = await fs.open(file, 'r'),
    header = Buffer.alloc(32);
  try {
    await handle.read(header, 0, 32, 0);
  } finally {
    await handle.close();
  }
  const size = (await fs.stat(file)).size;
  if (!size) throw new AppError(422, 'EMPTY_MEDIA', 'الملف فارغ.');
  let mime: FlexibleAsset['mimeType'] | undefined;
  if (header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    mime = 'image/png';
  else if (header[0] === 255 && header[1] === 216 && header[2] === 255) mime = 'image/jpeg';
  else if (header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP')
    mime = 'image/webp';
  const font =
    allowFont && (header.readUInt32BE(0) === 65536 || header.toString('ascii', 0, 4) === 'OTTO');
  if (mime || font) {
    if (size > mediaLimits.image)
      throw new AppError(413, 'MEDIA_TOO_LARGE', 'أقصى حجم للصورة أو الخط 50 ميجابايت.');
    const browser = await openBrowser('chrome', {
      browserExecutable: browserPath(workspace),
      chromeMode: 'headless-shell',
      logLevel: 'error',
    });
    try {
      const page = await browser.newPage({
        context: () => null,
        logLevel: 'error',
        indent: false,
        pageIndex: 0,
        onBrowserLog: null,
        onLog: () => {},
      });
      const data =
        'data:' + (mime ?? 'font/ttf') + ';base64,' + (await fs.readFile(file)).toString('base64');
      const dimensions = await page.evaluate(
        async ({ src, font }: { src: string; font: boolean }) => {
          if (font) {
            await new FontFace('ImportedFont', `url("${src}")`).load();
            return { width: 1, height: 1 };
          }
          const image = new Image();
          image.src = src;
          await image.decode();
          return { width: image.naturalWidth, height: image.naturalHeight };
        },
        { src: data, font },
      );
      if (
        dimensions.width < 1 ||
        dimensions.height < 1 ||
        dimensions.width > 20000 ||
        dimensions.height > 20000 ||
        dimensions.width * dimensions.height > 100000000
      )
        throw new Error('Invalid dimensions');
    } catch {
      throw new AppError(422, 'CORRUPT_MEDIA', 'تعذّر فك الصورة أو الخط فعليًا.');
    } finally {
      await browser.close({ silent: true });
    }
    return { kind: font ? 'font' : 'image', mimeType: mime ?? 'font/ttf' };
  }
  const mp4 = header.toString('ascii', 4, 8) === 'ftyp';
  const wav =
    header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WAVE';
  const mp3 =
    header.toString('ascii', 0, 3) === 'ID3' || (header[0] === 255 && (header[1] & 224) === 224);
  if (!mp4 && !wav && !mp3)
    throw new AppError(
      415,
      'UNSUPPORTED_MEDIA',
      'الملفات المدعومة: PNG، JPEG، WebP، MP4/H.264، MP3، WAV وM4A.',
    );
  if (size > mediaLimits.video)
    throw new AppError(413, 'MEDIA_TOO_LARGE', 'أقصى حجم للفيديو 250 ميجابايت.');
  const bin = path.join(workspace, 'node_modules/@remotion/compositor-win32-x64-msvc');
  try {
    const result = await run(
      path.join(bin, 'ffprobe.exe'),
      [
        '-v',
        'error',
        '-protocol_whitelist',
        'file,pipe',
        '-show_streams',
        '-show_format',
        '-of',
        'json',
        file,
      ],
      { windowsHide: true, timeout: 30000, maxBuffer: 1024 ** 2 },
    );
    const probe = JSON.parse(result.stdout),
      streams = probe.streams as {
        codec_type: string;
        codec_name: string;
        width?: number;
        height?: number;
        duration?: string;
      }[];
    const video = streams.find((stream) => stream.codec_type === 'video'),
      audio = streams.find((stream) => stream.codec_type === 'audio');
    const duration = Number(probe.format.duration);
    if (
      !Number.isFinite(duration) ||
      duration <= 0 ||
      duration > mediaLimits.maxSeconds ||
      streams.some((stream) => !['video', 'audio'].includes(stream.codec_type)) ||
      (!audio && !video)
    )
      throw new Error('Invalid streams or duration');
    if (
      video &&
      (!mp4 ||
        video.codec_name !== 'h264' ||
        !video.width ||
        !video.height ||
        video.width > 3840 ||
        video.height > 3840 ||
        video.width * video.height > 3840 * 2160)
    )
      throw new Error('Unsupported video');
    if (
      audio &&
      !['aac', 'mp3', 'pcm_s16le', 'pcm_s24le', 'pcm_s32le', 'pcm_f32le'].includes(audio.codec_name)
    )
      throw new Error('Unsupported audio');
    if (!video && size > mediaLimits.audio) throw new Error('Audio too large');
    // Fully decode the real payload; headers/FFprobe alone do not prove a usable file.
    await run(
      path.join(bin, 'ffmpeg.exe'),
      [
        '-v',
        'error',
        '-xerror',
        '-protocol_whitelist',
        'file,pipe',
        '-i',
        file,
        '-map',
        '0:v:0?',
        '-map',
        '0:a:0?',
        '-c:v',
        'rawvideo',
        '-c:a',
        'pcm_s16le',
        '-f',
        'null',
        '-',
      ],
      { windowsHide: true, timeout: 60000, maxBuffer: 1024 ** 2 },
    );
    return {
      kind: video ? 'video' : 'audio',
      mimeType: video ? 'video/mp4' : wav ? 'audio/wav' : mp3 ? 'audio/mpeg' : 'audio/mp4',
      metadata: {
        durationSeconds: duration,
        width: video?.width ?? 0,
        height: video?.height ?? 0,
        hasAudio: !!audio,
        codec: video?.codec_name ?? audio!.codec_name,
      },
    };
  } catch {
    throw new AppError(
      422,
      'INVALID_TIMED_MEDIA',
      'تعذّر فحص الوسائط أو فكها. استخدم MP4/H.264 أو MP3/WAV/M4A لمدة لا تتجاوز 180 ثانية.',
    );
  }
}
const extension: Record<FlexibleAsset['mimeType'], string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'font/ttf': '.ttf',
  'video/mp4': '.mp4',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/mp4': '.m4a',
};
export async function uploadFlexibleMedia(
  id: string,
  revision: number,
  part: MultipartFile,
  sceneId?: string,
  slot = 0,
  promptId?: string,
) {
  const temporary = await safePath(stateRoot, 'staging/' + randomUUID() + '.upload');
  try {
    await pipeline(part.file, createWriteStream(temporary, { flags: 'wx' }));
    if (part.file.truncated)
      throw new AppError(413, 'MEDIA_TOO_LARGE', 'حجم الملف يتجاوز الحد المسموح.');
    const info = await inspectMedia(temporary),
      sha256 = await hashFile(temporary),
      byteSize = (await fs.stat(temporary)).size;
    return await flexibleLock(id, async () => {
      const current = await readFlexible(id);
      assertRevision(current, revision);
      if (current.schemaVersion !== '2.1.0')
        throw new AppError(422, 'UPGRADE_REQUIRED', 'فعّل أدوات الوسائط الجديدة للمشروع أولًا.');
      if (
        current.assets.length >= 100 ||
        current.assets.reduce((sum, asset) => sum + asset.byteSize, 0) + byteSize > 2 * 1024 ** 3
      )
        throw new AppError(413, 'ASSET_LIMIT', 'وصل المشروع إلى حد الوسائط.');
      const next = structuredClone(current),
        scene = sceneId ? next.scenes.find((scene) => scene.id === sceneId) : undefined;
      if (
        sceneId &&
        (!scene ||
          !Number.isInteger(slot) ||
          !scene.mediaBindings[slot] ||
          !['image', 'video'].includes(info.kind) ||
          (info.kind === 'video' && scene.type !== 'media-showcase'))
      )
        throw new AppError(422, 'INVALID_SLOT', 'اختر خانة صورة أو مشهد عرض وسائط يدعم الفيديو.');
      if (
        scene &&
        info.kind === 'video' &&
        scene.durationFrames >
          Math.floor(info.metadata!.durationSeconds * next.outputProfile.fps) + 1
      )
        throw new AppError(
          422,
          'VIDEO_TOO_SHORT',
          'الفيديو أقصر من المشهد. قصّر مدة المشهد أو ارفع فيديو أطول.',
        );
      if (
        promptId &&
        !next.prompts?.some(
          (prompt) => prompt.id === promptId && (!sceneId || prompt.sceneId === sceneId),
        )
      )
        throw new AppError(422, 'INVALID_PROMPT', 'البرومبت غير مرتبط بهذا المشهد.');
      const assetId = info.kind + '-' + randomUUID().replaceAll('-', ''),
        relative = 'assets/' + info.kind + 's/' + assetId + extension[info.mimeType];
      const folder = await flexibleFolder(id);
      await fs.mkdir(path.dirname(await safePath(folder, relative)), { recursive: true });
      await fs.copyFile(temporary, await safePath(folder, relative), fs.constants.COPYFILE_EXCL);
      const asset: FlexibleAsset = {
        id: assetId,
        ...info,
        sha256,
        byteSize,
        storage: { scope: 'project', path: relative },
        approval: 'pending',
        sourceNote: 'رفع يدوي: ' + part.filename.slice(0, 250),
        license: { status: 'unknown', note: 'راجع المصدر وحقوق الاستخدام.' },
      };
      next.assets.push(asset);
      if (scene)
        scene.mediaBindings[slot] = {
          ...scene.mediaBindings[slot],
          assetId,
          assetSha256: sha256,
          ...(info.kind === 'video' ? { trimStartFrame: 0 } : {}),
        };
      if (promptId)
        next.prompts = next.prompts!.map((prompt) =>
          prompt.id === promptId ? { ...prompt, assetId, status: 'uploaded' } : prompt,
        );
      return commitFlexible(current, next);
    });
  } finally {
    await fs.unlink(temporary).catch(() => {});
  }
}
