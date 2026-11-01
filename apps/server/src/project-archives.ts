import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { zipSync, unzipSync } from 'fflate';
import type { MultipartFile } from '@fastify/multipart';
import type { Project } from '@elmekawy/shared';
import { parseProjectDocument } from '@elmekawy/shared/flexible';
import type { FlexibleProject } from '@elmekawy/shared/flexible';
import {
  AppError,
  safePath,
  stateRoot,
  makeId,
  readProject,
  projectFolder,
  verifyAsset,
  stageProject,
  atomicJson,
  withLock,
  commitProject,
} from './storage.ts';
import {
  readFlexible,
  flexibleFolder,
  flexibleAssetPath,
  stageFlexible,
  flexibleLock,
} from './flexible-projects.ts';
import { inspectMedia } from './flexible-media.ts';

type Document = Project | FlexibleProject;
const maxArchive = 512 * 1024 ** 2;
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const flexible = (document: Document): document is FlexibleProject =>
  document.schemaVersion !== '1.0.0';
const json = (bytes: Uint8Array) => {
  if (bytes.length > 1024 ** 2)
    throw new AppError(413, 'JSON_TOO_LARGE', 'ملف بيانات أكبر من الحد المسموح.');
  return JSON.parse(Buffer.from(bytes).toString('utf8'));
};
const ext: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'font/ttf': '.ttf',
  'video/mp4': '.mp4',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/wav': '.wav',
};
export async function legacyHistory(id: string) {
  await readProject(id);
  const folder = await projectFolder(id),
    history = [];
  for (const name of await fs.readdir(await safePath(folder, 'history'))) {
    if (!/^revision-\d+\.json$/.test(name)) continue;
    const previous = parseProjectDocument(
      JSON.parse(await fs.readFile(await safePath(folder, 'history/' + name), 'utf8')),
    );
    if (previous.id !== id || flexible(previous))
      throw new AppError(422, 'INVALID_HISTORY', 'إصدار تاريخي غير صالح.');
    history.push({
      revision: previous.revision,
      name: previous.name,
      updatedAt: previous.updatedAt,
    });
  }
  return history.sort((a, b) => b.revision - a.revision);
}
export async function restoreLegacy(id: string, revision: number, target: number) {
  return withLock(id, async () => {
    const current = await readProject(id),
      folder = await projectFolder(id);
    if (current.revision !== revision)
      throw new AppError(412, 'STALE_REVISION', 'أعد تحميل الإصدار الحالي.');
    if (!Number.isSafeInteger(target) || target < 1 || target >= current.revision)
      throw new AppError(400, 'INVALID_HISTORY', 'اختر إصدارًا سابقًا.');
    const previous = parseProjectDocument(
      JSON.parse(
        await fs.readFile(await safePath(folder, 'history/revision-' + target + '.json'), 'utf8'),
      ),
    );
    if (flexible(previous) || previous.id !== id || previous.revision !== target)
      throw new AppError(422, 'INVALID_HISTORY', 'الإصدار غير متوافق.');
    const next = structuredClone(previous),
      ids = new Set(next.assets.map((asset) => asset.id));
    next.assets.push(
      ...current.assets
        .filter((asset) => !ids.has(asset.id))
        .map((asset) => ({ ...asset, state: 'retired' as const })),
    );
    for (const asset of next.assets)
      if (asset.state !== 'missing') await verifyAsset(current, asset);
    next.revision = current.revision + 1;
    next.updatedAt = new Date().toISOString();
    await atomicJson(
      await safePath(folder, 'history/revision-' + current.revision + '.json'),
      current,
    );
    await commitProject(next);
    return next;
  });
}
export async function exportProjectArchive(id: string, kind: 'legacy' | 'flexible') {
  const lock = kind === 'flexible' ? flexibleLock : withLock;
  return lock(id, async () => {
    const current = kind === 'flexible' ? await readFlexible(id) : await readProject(id);
    const folder = kind === 'flexible' ? await flexibleFolder(id) : await projectFolder(id);
    const documents: { name: string; document: Document }[] = [
      { name: 'project.json', document: current },
    ];
    for (const entry of await fs.readdir(await safePath(folder, 'history'))) {
      if (!/^revision-\d+\.json$/.test(entry)) continue;
      if (documents.length > 100)
        throw new AppError(413, 'HISTORY_LIMIT', 'النسخة الاحتياطية تدعم حتى 100 إصدار سابق.');
      const previous = parseProjectDocument(
        JSON.parse(await fs.readFile(await safePath(folder, 'history/' + entry), 'utf8')),
      );
      if (
        previous.id !== id ||
        entry !== 'revision-' + previous.revision + '.json' ||
        previous.revision >= current.revision
      )
        throw new AppError(422, 'INVALID_HISTORY', 'بيانات التاريخ غير متطابقة.');
      documents.push({ name: 'history/' + entry, document: previous });
    }
    const files: Record<string, Uint8Array> = {},
      records: { path: string; sha256: string; byteSize: number }[] = [];
    let total = 0;
    const add = (name: string, bytes: Uint8Array) => {
      total += bytes.length;
      if (total > maxArchive)
        throw new AppError(413, 'ARCHIVE_TOO_LARGE', 'أقصى حجم للنسخة الاحتياطية 512 ميجابايت.');
      files[name] = bytes;
      records.push({ path: name, sha256: digest(bytes), byteSize: bytes.length });
    };
    for (const { name, document } of documents) {
      add(name, Buffer.from(JSON.stringify(document, null, 2) + '\n'));
      for (const asset of document.assets) {
        if (!flexible(document) && 'state' in asset && asset.state === 'missing') continue;
        if (!asset.sha256 || files['assets/' + asset.sha256]) continue;
        const file = flexible(document)
          ? await flexibleAssetPath(document, asset as FlexibleProject['assets'][number])
          : await verifyAsset(document, asset as Project['assets'][number]);
        const bytes = await fs.readFile(file);
        if (digest(bytes) !== asset.sha256)
          throw new AppError(422, 'CHANGED_MEDIA', 'تغيّر ملف أثناء التصدير.');
        add('assets/' + asset.sha256, bytes);
      }
    }
    files['manifest.json'] = Buffer.from(
      JSON.stringify({ format: 'elmekawy-project-archive', version: '1.0.0', files: records }),
    );
    return Buffer.from(zipSync(files, { level: 0 }));
  });
}
export async function importProjectArchive(part: MultipartFile) {
  const temporary = await safePath(stateRoot, 'staging/' + randomUUID() + '.zip');
  try {
    await pipeline(part.file, createWriteStream(temporary, { flags: 'wx' }));
    if (part.file.truncated || (await fs.stat(temporary)).size > maxArchive)
      throw new AppError(413, 'ARCHIVE_TOO_LARGE', 'النسخة الاحتياطية أكبر من الحد المسموح.');
    let count = 0,
      total = 0;
    const names = new Set<string>();
    const files = unzipSync(await fs.readFile(temporary), {
      filter: (file) => {
        if (
          ++count > 250 ||
          !Number.isSafeInteger(file.originalSize) ||
          file.originalSize < 0 ||
          (total += file.originalSize) > maxArchive ||
          names.has(file.name) ||
          !/^(manifest\.json|project\.json|history\/revision-[1-9]\d*\.json|assets\/[a-f0-9]{64})$/.test(
            file.name,
          )
        )
          throw new AppError(
            422,
            'UNSAFE_ARCHIVE',
            'تحتوي النسخة على مسارات أو أحجام غير مسموح بها.',
          );
        names.add(file.name);
        return true;
      },
    });
    if (!files['manifest.json'] || !files['project.json'])
      throw new AppError(422, 'INVALID_ARCHIVE', 'ملف بيانات أو بيان النسخة الاحتياطية مفقود.');
    const manifest = json(files['manifest.json']) as {
      format: string;
      version: string;
      files: { path: string; sha256: string; byteSize: number }[];
    };
    if (
      manifest.format !== 'elmekawy-project-archive' ||
      manifest.version !== '1.0.0' ||
      !Array.isArray(manifest.files) ||
      manifest.files.length !== Object.keys(files).length - 1
    )
      throw new AppError(422, 'INVALID_MANIFEST', 'بيان نسخة احتياطية غير صالح.');
    const listed = new Set<string>();
    for (const record of manifest.files) {
      if (
        !record ||
        typeof record.path !== 'string' ||
        listed.has(record.path) ||
        record.path === 'manifest.json' ||
        !files[record.path] ||
        record.byteSize !== files[record.path].length ||
        record.sha256 !== digest(files[record.path])
      )
        throw new AppError(422, 'ARCHIVE_HASH_MISMATCH', 'فشل التحقق من سلامة النسخة الاحتياطية.');
      listed.add(record.path);
    }
    const current = parseProjectDocument(json(files['project.json'])),
      id = makeId(current.name),
      documents = new Map<string, Document>();
    const media = new Map<string, { bytes: Uint8Array; relative: string }>();
    for (const [name, bytes] of Object.entries(files)) {
      if (!name.endsWith('.json') || name === 'manifest.json') continue;
      const document = parseProjectDocument(json(bytes));
      if (
        document.id !== current.id ||
        flexible(document) !== flexible(current) ||
        (name !== 'project.json' &&
          (name !== 'history/revision-' + document.revision + '.json' ||
            document.revision >= current.revision))
      )
        throw new AppError(422, 'INVALID_ARCHIVE_HISTORY', 'تاريخ المشروع غير متوافق.');
      const next = structuredClone(document);
      next.id = id;
      for (const asset of next.assets) {
        if (!flexible(next) && 'state' in asset && asset.state === 'missing') continue;
        const data = files['assets/' + asset.sha256];
        if (
          !data ||
          data.length !== asset.byteSize ||
          digest(data) !== asset.sha256 ||
          !ext[asset.mimeType!]
        )
          throw new AppError(422, 'MISSING_ARCHIVE_MEDIA', 'ملف وسائط مفقود أو غير مطابق.');
        let entry = media.get(asset.sha256!);
        if (!entry) {
          const inspect = await safePath(stateRoot, 'staging/' + randomUUID() + '.media');
          try {
            await fs.writeFile(inspect, data, { flag: 'wx' });
            const info = await inspectMedia(inspect, true);
            const expectedKind = asset.kind === 'logo' ? 'image' : asset.kind;
            if (info.kind !== expectedKind || info.mimeType !== asset.mimeType)
              throw new AppError(
                422,
                'ARCHIVE_MEDIA_MISMATCH',
                'نوع الملف الفعلي غير مطابق للبيانات.',
              );
            if (
              flexible(next) &&
              'metadata' in asset &&
              asset.metadata &&
              JSON.stringify(info.metadata) !== JSON.stringify(asset.metadata)
            )
              throw new AppError(
                422,
                'ARCHIVE_METADATA_MISMATCH',
                'مدة الوسائط أو أبعادها غير مطابقة.',
              );
          } finally {
            await fs.unlink(inspect).catch(() => {});
          }
          entry = {
            bytes: data,
            relative: 'assets/archive/' + asset.sha256 + ext[asset.mimeType!],
          };
          media.set(asset.sha256!, entry);
        }
        asset.storage = { scope: 'project', path: entry.relative };
      }
      documents.set(name, parseProjectDocument(next));
    }
    const restored = documents.get('project.json')!;
    const copy = async (folder: string) => {
      for (const entry of media.values()) {
        const target = await safePath(folder, entry.relative);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, entry.bytes, { flag: 'wx' });
      }
      for (const [name, document] of documents)
        if (name !== 'project.json') await atomicJson(await safePath(folder, name), document);
    };
    return flexible(restored)
      ? { format: 'flexible' as const, project: await stageFlexible(restored, copy) }
      : { format: 'legacy' as const, project: await stageProject(restored, copy) };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      422,
      'INVALID_ARCHIVE',
      'تعذّر استيراد النسخة الاحتياطية. لم يُستبدل أي مشروع موجود.',
    );
  } finally {
    await fs.unlink(temporary).catch(() => {});
  }
}
