import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { openBrowser } from '@remotion/renderer';
import type { MultipartFile } from '@fastify/multipart';
import { browserPath } from '@elmekawy/motion-engine/server';
import {
  parseFlexibleProject,
  FlexibleValidationError,
  assertFlexibleCreate,
  applyFlexibleEdit,
  flexibleEditableOf,
  brandProfiles,
  newFlexibleScene,
  fitScenesToDuration,
  portraitProfile,
  outputProfiles,
  safeAreaFor,
  projectWarnings,
  upgradeFlexibleDocument,
  compileTimeline,
  renderReadinessErrors,
} from '@elmekawy/shared/flexible';
import type {
  FlexibleProject,
  FlexibleAsset,
  EditableFlexible,
  FlexibleDescriptor,
} from '@elmekawy/shared/flexible';
import {
  AppError,
  dataRoot,
  sharedRoot,
  stateRoot,
  workspace,
  safePath,
  validId,
  makeId,
  hashFile,
  atomicJson,
  withLock,
} from './storage.ts';
import { loadCatalog } from './projects.ts';

export const flexibleRoot = path.join(dataRoot, 'flexible-projects');
export const flexibleLock = <T>(id: string, action: () => Promise<T>) =>
  withLock('flexible:' + id, action);
export async function initializeFlexible() {
  for (const folder of [flexibleRoot, path.join(flexibleRoot, '.staging')]) {
    await fs.mkdir(folder, { recursive: true });
    if ((await fs.lstat(folder)).isSymbolicLink())
      throw new Error('Flexible project roots cannot be links');
  }
}
export const flexibleFolder = (id: string) => safePath(flexibleRoot, validId(id));
export function validateFlexible(value: unknown): FlexibleProject {
  try {
    return parseFlexibleProject(value);
  } catch (error) {
    if (error instanceof FlexibleValidationError)
      throw new AppError(
        422,
        'INVALID_FLEXIBLE',
        'راجع النصوص ومدد المشاهد وإعدادات الصورة.',
        error.issues,
      );
    throw error;
  }
}
export async function readFlexible(id: string): Promise<FlexibleProject> {
  const folder = await flexibleFolder(id);
  try {
    const file = await safePath(folder, 'project.json');
    if ((await fs.stat(file)).size > 1024 ** 2)
      throw new AppError(422, 'PROJECT_SIZE', 'ملف المشروع أكبر من الحد المسموح.');
    const project = validateFlexible(
      JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, '')),
    );
    if (project.id !== id) throw new AppError(422, 'IDENTITY_MISMATCH', 'هوية المشروع غير مطابقة.');
    return project;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      throw new AppError(404, 'NOT_FOUND', 'المشروع المرن غير موجود.');
    if (error instanceof SyntaxError)
      throw new AppError(
        422,
        'PROJECT_UNREADABLE',
        'ملف المشروع غير قابل للقراءة؛ راجع إصدارًا سابقًا.',
      );
    throw error;
  }
}
export async function listFlexible() {
  const projects: FlexibleProject[] = [],
    errors: { id: string; message: string }[] = [];
  for (const entry of await fs.readdir(flexibleRoot, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || (!entry.isDirectory() && !entry.isSymbolicLink())) continue;
    try {
      projects.push(await readFlexible(entry.name));
    } catch {
      errors.push({
        id: entry.name,
        message: 'تعذّر قراءة مشروع مرن محفوظ؛ راجع النسخة الاحتياطية.',
      });
    }
  }
  return { projects: projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), errors };
}
export async function flexibleAssetPath(project: FlexibleProject, asset: FlexibleAsset) {
  if (asset.storage.scope === 'shared') {
    const catalog = await loadCatalog();
    if (
      !catalog.resources.some(
        (item) =>
          item.storage?.path === asset.storage.path &&
          item.sha256 === asset.sha256 &&
          item.mimeType === asset.mimeType,
      )
    )
      throw new AppError(422, 'UNREGISTERED_RESOURCE', 'أصل مشترك غير مسجل.');
  }
  const file = await safePath(
    asset.storage.scope === 'shared' ? sharedRoot : await flexibleFolder(project.id),
    asset.storage.path,
  );
  let stat;
  try {
    stat = await fs.stat(file);
  } catch {
    throw new AppError(422, 'MISSING_MEDIA', 'ملف صورة أو خط محفوظ غير موجود.');
  }
  if (!stat.isFile() || stat.size !== asset.byteSize || (await hashFile(file)) !== asset.sha256)
    throw new AppError(
      422,
      'CHANGED_MEDIA',
      'تغيّر ملف وسائط محفوظ؛ استعد الأصل أو ارفع نسخة جديدة.',
    );
  return file;
}
export async function libraryImage(id: string, hash?: string) {
  const asset = (await loadCatalog()).resources.find(
    (asset) => asset.id === id && asset.kind === 'image' && asset.storage?.scope === 'shared',
  );
  if (!asset || !asset.storage || !asset.sha256 || (hash && hash !== asset.sha256))
    throw new AppError(404, 'IMAGE_NOT_FOUND', 'الصورة غير موجودة في المكتبة.');
  const file = await safePath(sharedRoot, asset.storage.path);
  if ((await hashFile(file)) !== asset.sha256)
    throw new AppError(422, 'CHANGED_MEDIA', 'تغيّرت صورة المكتبة.');
  return { asset, file };
}
async function stageFlexible(project: FlexibleProject, copy: (folder: string) => Promise<void>) {
  const valid = validateFlexible(project),
    stage = await safePath(flexibleRoot, '.staging/' + randomUUID());
  await fs.mkdir(stage);
  for (const child of ['assets/images', 'renders', 'history'])
    await fs.mkdir(path.join(stage, child), { recursive: true });
  await copy(stage);
  await atomicJson(path.join(stage, 'project.json'), valid);
  await fs.rename(stage, await flexibleFolder(project.id));
  return valid;
}
export async function createFlexible(value: unknown) {
  try {
    assertFlexibleCreate(value);
  } catch (error) {
    if (error instanceof FlexibleValidationError)
      throw new AppError(
        400,
        'INVALID_CREATE',
        'راجع الاسم والعميل والهدف والهوية والمدة.',
        error.issues,
      );
    throw error;
  }
  const preset = brandProfiles.find((profile) => profile.profileId === value.brandProfileId)!;
  const image = await libraryImage(value.libraryImageId),
    catalog = await loadCatalog();
  const fonts: FlexibleAsset[] = catalog.resources
    .filter((asset) => ['font-cairo', 'font-inter'].includes(asset.id))
    .map((asset) => ({
      id: asset.id,
      kind: 'font',
      sha256: asset.sha256!,
      byteSize: asset.byteSize!,
      mimeType: 'font/ttf',
      storage: structuredClone(asset.storage!),
      approval: 'approved',
      sourceNote: 'خط محلي مرخّص OFL.',
      license: { status: 'documented', note: asset.license.note ?? 'OFL' },
    }));
  if (fonts.length !== 2)
    throw new AppError(503, 'FONTS_UNAVAILABLE', 'الخطوط المحلية غير مجهّزة.');
  const imageAsset: FlexibleAsset = {
    id: 'image-initial',
    kind: 'image',
    sha256: image.asset.sha256!,
    byteSize: image.asset.byteSize!,
    mimeType: image.asset.mimeType as FlexibleAsset['mimeType'],
    storage: { scope: 'project', path: 'assets/images/image-initial' + path.extname(image.file) },
    approval: value.approveImage ? 'approved' : 'pending',
    sourceNote: 'صورة توضيحية من المكتبة المحلية؛ ليست نتيجة مشروع عميل.',
    license: {
      status: image.asset.license.status,
      note: image.asset.license.note ?? 'حقوق الاستخدام التجاري غير متحققة.',
    },
  };
  const now = new Date().toISOString(),
    id = makeId(value.name);
  const scenes = value.sceneTypes.map((type, index) => ({
    ...newFlexibleScene(type, 'scene-' + (index + 1), imageAsset),
    transitionOut:
      index === value.sceneTypes.length - 1
        ? { type: 'cut' as const, durationFrames: 0 as const }
        : { type: 'crossfade' as const, durationFrames: 15 },
  }));
  const project: FlexibleProject = {
    schemaVersion: '2.1.0',
    id,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    name: value.name.trim(),
    template: { id: 'flexible-reel', version: '1.1.0' },
    brief: { client: value.client.trim(), objective: value.objective.trim() },
    locale: { language: 'ar-EG', direction: 'rtl' },
    brand: {
      profileId: preset.profileId,
      version: '1.0.0',
      displayName: value.displayName.trim(),
      colors: structuredClone(value.colors),
      fonts: { arabicAssetId: 'font-cairo', latinAssetId: 'font-inter' },
      safeArea: safeAreaFor(
        (outputProfiles.find((profile) => profile.id === value.outputProfileId) ?? portraitProfile)
          .aspectRatio,
      ),
    },
    outputProfile: {
      ...(outputProfiles.find((profile) => profile.id === value.outputProfileId) ??
        portraitProfile),
      crf: value.crf,
    },
    targetDurationFrames: value.durationFrames,
    scenes: fitScenesToDuration(scenes, value.durationFrames),
    assets: [...fonts, imageAsset],
    audio: { mode: 'none' },
    prompts: [],
  };
  return stageFlexible(project, async (folder) => {
    const target = path.join(folder, imageAsset.storage.path);
    await fs.copyFile(image.file, target, fs.constants.COPYFILE_EXCL);
    if ((await hashFile(target)) !== imageAsset.sha256)
      throw new AppError(422, 'CHANGED_MEDIA', 'تغيّرت الصورة أثناء إنشاء المشروع.');
  });
}
async function recordHistory(project: FlexibleProject) {
  const file = await safePath(
    await flexibleFolder(project.id),
    'history/revision-' + project.revision + '.json',
  );
  try {
    await fs.writeFile(file, JSON.stringify(project, null, 2) + '\n', { flag: 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    const existing = JSON.parse(await fs.readFile(file, 'utf8'));
    if (JSON.stringify(existing) !== JSON.stringify(project))
      throw new AppError(409, 'HISTORY_CONFLICT', 'يوجد إصدار تاريخي مختلف؛ لم تُستبدل أي نسخة.');
  }
}
export async function commitFlexible(current: FlexibleProject, next: FlexibleProject) {
  const valid = validateFlexible(next);
  await recordHistory(current);
  valid.revision = current.revision + 1;
  valid.updatedAt = new Date().toISOString();
  await atomicJson(await safePath(await flexibleFolder(current.id), 'project.json'), valid);
  return valid;
}
export async function saveFlexible(id: string, value: unknown, revision: number) {
  return flexibleLock(id, async () => {
    const current = await readFlexible(id);
    assertRevision(current, revision);
    let next: FlexibleProject;
    try {
      next = validateFlexible(applyFlexibleEdit(current, value as EditableFlexible));
    } catch (error) {
      if (error instanceof FlexibleValidationError)
        throw new AppError(
          422,
          'INVALID_EDIT',
          'راجع الحقول القابلة للتحرير ومدد المشاهد.',
          error.issues,
        );
      throw error;
    }
    for (const asset of next.assets) await flexibleAssetPath(current, asset);
    return commitFlexible(current, next);
  });
}
export function assertRevision(project: FlexibleProject, revision: number) {
  if (project.revision !== revision)
    throw new AppError(412, 'STALE_REVISION', 'المشروع تغيّر؛ أعد تحميله قبل الحفظ أو الرفع.');
}
export async function duplicateFlexible(id: string, name: string) {
  if (typeof name !== 'string' || !name.trim() || name.length > 120)
    throw new AppError(400, 'INVALID_NAME', 'اسم النسخة مطلوب.');
  return flexibleLock(id, async () => {
    const source = await readFlexible(id),
      clone = structuredClone(source);
    clone.id = makeId(name);
    clone.name = name.trim();
    clone.revision = 1;
    clone.createdAt = clone.updatedAt = new Date().toISOString();
    return stageFlexible(clone, async (folder) => {
      for (const asset of clone.assets) {
        const file = await flexibleAssetPath(source, asset);
        if (asset.storage.scope === 'project') {
          const target = path.join(folder, asset.storage.path);
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.copyFile(file, target, fs.constants.COPYFILE_EXCL);
        }
      }
    });
  });
}
export async function resolveFlexible(
  project: FlexibleProject,
  origin: string,
): Promise<FlexibleDescriptor> {
  const valid = validateFlexible(project),
    media: Record<string, string> = {},
    warnings: string[] = projectWarnings(project);
  for (const asset of valid.assets) {
    await flexibleAssetPath(valid, asset);
    media[asset.id] = origin + '/media/flexible/' + valid.id + '/' + asset.id + '/' + asset.sha256;
  }
  media['fonts/Cairo.ttf'] = media[valid.brand.fonts.arabicAssetId];
  media['fonts/Inter.ttf'] = media[valid.brand.fonts.latinAssetId];
  if (renderReadinessErrors(valid).length) warnings.push('راجع الصور واعتمدها قبل التصدير.');
  if (valid.assets.some((asset) => asset.kind === 'image' && asset.license.status === 'unknown'))
    warnings.push('حقوق استخدام بعض الصور غير موثّقة؛ راجع المصدر قبل الاستخدام التجاري.');
  return {
    compositionId: 'FlexibleReel',
    projectRevision: valid.revision,
    metadata: {
      width: valid.outputProfile.width,
      height: valid.outputProfile.height,
      fps: valid.outputProfile.fps,
      durationFrames: compileTimeline(valid.scenes).durationFrames,
      aspectRatio: valid.outputProfile.aspectRatio,
    },
    inputProps: { project: valid, media },
    warnings,
  };
}
export async function approveFlexibleImage(
  id: string,
  assetId: string,
  revision: number,
  approved: boolean,
  note: string,
) {
  if (
    typeof approved !== 'boolean' ||
    typeof note !== 'string' ||
    !note.trim() ||
    note.length > 1000
  )
    throw new AppError(400, 'INVALID_REVIEW', 'اكتب مصدر الصورة أو ملاحظة المراجعة.');
  return flexibleLock(id, async () => {
    const current = await readFlexible(id);
    assertRevision(current, revision);
    const next = structuredClone(current),
      asset = next.assets.find((asset) => asset.id === assetId && asset.kind !== 'font');
    if (!asset) throw new AppError(404, 'IMAGE_NOT_FOUND', 'الصورة غير موجودة.');
    await flexibleAssetPath(current, asset);
    asset.approval = approved ? 'approved' : 'pending';
    asset.sourceNote = note.trim();
    if (next.prompts)
      next.prompts = next.prompts.map((prompt) =>
        prompt.assetId === assetId
          ? { ...prompt, status: approved ? 'approved' : 'uploaded' }
          : prompt,
      );
    return commitFlexible(current, next);
  });
}
export async function uploadFlexibleImage(
  id: string,
  sceneId: string,
  revision: number,
  part: MultipartFile,
) {
  const temp = await safePath(stateRoot, 'staging/' + randomUUID() + '.upload');
  try {
    await pipeline(part.file, createWriteStream(temp, { flags: 'wx' }));
    if (part.file.truncated)
      throw new AppError(413, 'FILE_TOO_LARGE', 'أقصى حجم للصورة 50 ميجابايت.');
    if ((await fs.stat(temp)).size > 50 * 1024 * 1024)
      throw new AppError(413, 'FILE_TOO_LARGE', 'أقصى حجم للصورة 50 ميجابايت.');
    const bytes = await fs.readFile(temp);
    let mime: FlexibleAsset['mimeType'], extension: string;
    if (
      bytes.length >= 24 &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ) {
      mime = 'image/png';
      extension = '.png';
    } else if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
      mime = 'image/jpeg';
      extension = '.jpg';
    } else if (
      bytes.length >= 16 &&
      bytes.subarray(0, 4).toString() === 'RIFF' &&
      bytes.subarray(8, 12).toString() === 'WEBP'
    ) {
      mime = 'image/webp';
      extension = '.webp';
    } else throw new AppError(415, 'UNSUPPORTED_IMAGE', 'ارفع صورة PNG أو JPEG أو WebP سليمة.');
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
      const size = await page.evaluate(
        async (src: string) => {
          const image = new Image();
          image.src = src;
          await image.decode();
          return { width: image.naturalWidth, height: image.naturalHeight };
        },
        'data:' + mime + ';base64,' + bytes.toString('base64'),
      );
      if (
        size.width < 1 ||
        size.height < 1 ||
        size.width > 20000 ||
        size.height > 20000 ||
        size.width * size.height > 100000000
      )
        throw new AppError(422, 'IMAGE_DIMENSIONS', 'أبعاد الصورة تتجاوز الحد المسموح.');
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(422, 'CORRUPT_IMAGE', 'تعذّر فك الصورة.');
    } finally {
      await browser.close({ silent: true });
    }
    const sha256 = await hashFile(temp);
    return await flexibleLock(id, async () => {
      const current = await readFlexible(id);
      assertRevision(current, revision);
      const next = structuredClone(current),
        scene = next.scenes.find(
          (scene) => scene.id === sceneId && scene.type === 'media-showcase',
        );
      if (!scene) throw new AppError(422, 'INVALID_SCENE', 'اختر مشهد عرض صورة.');
      if (
        next.assets.length >= 100 ||
        next.assets.reduce((sum, asset) => sum + asset.byteSize, 0) + bytes.length > 2 * 1024 ** 3
      )
        throw new AppError(413, 'ASSET_LIMIT', 'وصل المشروع إلى حد الوسائط المسموح.');
      const assetId = 'image-' + randomUUID().replaceAll('-', ''),
        relative = 'assets/images/' + assetId + extension;
      await fs.copyFile(
        temp,
        await safePath(await flexibleFolder(id), relative),
        fs.constants.COPYFILE_EXCL,
      );
      next.assets.push({
        id: assetId,
        kind: 'image',
        sha256,
        byteSize: bytes.length,
        mimeType: mime,
        storage: { scope: 'project', path: relative },
        approval: 'pending',
        sourceNote: 'رفع يدوي: ' + part.filename.slice(0, 250),
        license: { status: 'unknown', note: 'راجع حقوق الصورة ومصدرها.' },
      });
      scene.mediaBindings[0] = { ...scene.mediaBindings[0], assetId, assetSha256: sha256 };
      return commitFlexible(current, next);
    });
  } finally {
    await fs.unlink(temp).catch(() => {});
  }
}
export { flexibleEditableOf };

export async function upgradeFlexible(id: string, revision: number) {
  return flexibleLock(id, async () => {
    const current = await readFlexible(id);
    assertRevision(current, revision);
    if (current.schemaVersion === '2.1.0') return current;
    return commitFlexible(current, upgradeFlexibleDocument(current));
  });
}
export async function flexibleHistory(id: string) {
  const folder = await flexibleFolder(id);
  const history = [];
  for (const entry of await fs.readdir(await safePath(folder, 'history'))) {
    if (!/^revision-\d+\.json$/.test(entry)) continue;
    const previous = validateFlexible(
      JSON.parse(await fs.readFile(await safePath(folder, 'history/' + entry), 'utf8')),
    );
    if (previous.id !== id)
      throw new AppError(422, 'INVALID_HISTORY', 'هوية الإصدار التاريخي غير مطابقة.');
    history.push({
      revision: previous.revision,
      name: previous.name,
      updatedAt: previous.updatedAt,
    });
  }
  return history.sort((a, b) => b.revision - a.revision);
}
export async function restoreFlexible(id: string, revision: number, target: number) {
  return flexibleLock(id, async () => {
    const current = await readFlexible(id);
    assertRevision(current, revision);
    if (!Number.isSafeInteger(target) || target < 1 || target >= current.revision)
      throw new AppError(400, 'INVALID_HISTORY', 'اختر إصدارًا سابقًا.');
    const next = validateFlexible(
      JSON.parse(
        await fs.readFile(
          await safePath(await flexibleFolder(id), 'history/revision-' + target + '.json'),
          'utf8',
        ),
      ),
    );
    if (next.id !== id || next.revision !== target)
      throw new AppError(422, 'INVALID_HISTORY', 'نسخة تاريخية غير متوافقة.');
    // Keep all registered files available to previous queued renders and future recovery.
    const assets = new Map(
      [...current.assets, ...next.assets]
        .filter(
          (asset) =>
            next.schemaVersion === '2.1.0' || asset.kind === 'image' || asset.kind === 'font',
        )
        .map((asset) => [asset.id, asset]),
    );
    next.assets = [...assets.values()];
    for (const asset of next.assets) await flexibleAssetPath(current, asset);
    return commitFlexible(current, next);
  });
}
export { stageFlexible };
export async function findFlexibleMedia(project: FlexibleProject, id: string, hash: string) {
  let asset = project.assets.find((asset) => asset.id === id && asset.sha256 === hash);
  if (!asset)
    for (const item of await flexibleHistory(project.id)) {
      const previous = validateFlexible(
        JSON.parse(
          await fs.readFile(
            await safePath(
              await flexibleFolder(project.id),
              'history/revision-' + item.revision + '.json',
            ),
            'utf8',
          ),
        ),
      );
      asset = previous.assets.find((asset) => asset.id === id && asset.sha256 === hash);
      if (asset) break;
    }
  return asset;
}
