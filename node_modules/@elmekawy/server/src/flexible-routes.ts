import { exportProjectArchive } from './project-archives.ts';
import { uploadFlexibleMedia } from './flexible-media.ts';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { brandProfiles, sceneLabels, flexibleManifest } from '@elmekawy/shared/flexible';
import { AppError } from './storage.ts';
import { loadCatalog } from './projects.ts';
import {
  initializeFlexible,
  listFlexible,
  readFlexible,
  createFlexible,
  saveFlexible,
  duplicateFlexible,
  resolveFlexible,
  flexibleAssetPath,
  uploadFlexibleImage,
  approveFlexibleImage,
  libraryImage,
  upgradeFlexible,
  flexibleHistory,
  restoreFlexible,
  findFlexibleMedia,
} from './flexible-projects.ts';
import { enqueueFlexibleRender, listJobs } from './renders.ts';

type StreamFile = (
  request: FastifyRequest,
  reply: FastifyReply,
  file: string,
  mime: string,
  immutable?: boolean,
) => Promise<unknown>;
const params = (request: FastifyRequest) => request.params as Record<string, string>;
function body(request: FastifyRequest, keys: string[]) {
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body))
    throw new AppError(400, 'INVALID_BODY', 'صيغة الطلب غير صالحة.');
  const value = request.body as Record<string, unknown>;
  if (Object.keys(value).some((key) => !keys.includes(key)))
    throw new AppError(400, 'UNKNOWN_FIELD', 'الطلب يحتوي حقولًا غير مدعومة.');
  return value;
}
function revision(request: FastifyRequest) {
  const match = request.headers['if-match']?.match(/^"r(\d+)"$/);
  if (!match || !Number.isSafeInteger(Number(match[1])))
    throw new AppError(428, 'REVISION_REQUIRED', 'يلزم رقم الإصدار الحالي.');
  return Number(match[1]);
}
const etag = (reply: FastifyReply, value: { revision: number }) =>
  reply.header('ETag', '"r' + value.revision + '"');
export async function registerFlexibleRoutes(
  server: FastifyInstance,
  origin: string,
  streamFile: StreamFile,
) {
  await initializeFlexible();
  server.get('/api/flexible/options', async () => ({
    manifest: flexibleManifest,
    brandProfiles,
    sceneLabels,
    images: (await loadCatalog()).resources
      .filter((asset) => asset.kind === 'image')
      .map((asset) => ({
        id: asset.id,
        name: asset.displayName,
        sha256: asset.sha256,
        url: '/api/flexible/library/' + asset.id + '/' + asset.sha256,
      })),
  }));
  server.get('/api/flexible/library/:id/:hash', async (request, reply) => {
    const { asset, file } = await libraryImage(params(request).id, params(request).hash);
    return streamFile(request, reply, file, asset.mimeType!, true);
  });
  server.post('/api/flexible/projects/:id/upgrade', async (request, reply) => {
    const project = await upgradeFlexible(params(request).id, revision(request));
    etag(reply, project);
    return project;
  });
  server.get('/api/flexible/projects/:id/history', async (request) => {
    await readFlexible(params(request).id);
    return flexibleHistory(params(request).id);
  });
  server.post('/api/flexible/projects/:id/restore', async (request, reply) => {
    const value = body(request, ['revision']);
    const project = await restoreFlexible(
      params(request).id,
      revision(request),
      value.revision as number,
    );
    etag(reply, project);
    return project;
  });
  server.post(
    '/api/flexible/projects/:id/media',
    { bodyLimit: 251 * 1024 * 1024 },
    async (request, reply) => {
      const part = await request.file();
      if (!part) throw new AppError(400, 'MISSING_UPLOAD', 'اختر ملفًا.');
      const project = await uploadFlexibleMedia(
        params(request).id,
        revision(request),
        part,
        undefined,
        0,
        (request.query as { promptId?: string }).promptId,
      );
      etag(reply, project);
      return project;
    },
  );
  server.get('/api/flexible/projects/:id/archive', async (request, reply) => {
    const bytes = await exportProjectArchive(params(request).id, 'flexible');
    reply
      .type('application/zip')
      .header('Content-Disposition', 'attachment; filename="' + params(request).id + '.zip"');
    return reply.send(bytes);
  });
  server.get('/api/flexible/projects', async () => listFlexible());
  server.post('/api/flexible/projects', async (request, reply) => {
    const project = await createFlexible(request.body);
    etag(reply, project);
    reply.code(201).header('Location', '/api/flexible/projects/' + project.id);
    return project;
  });
  server.get('/api/flexible/projects/:id', async (request, reply) => {
    const project = await readFlexible(params(request).id);
    etag(reply, project);
    return project;
  });
  server.put('/api/flexible/projects/:id', async (request, reply) => {
    const project = await saveFlexible(params(request).id, request.body, revision(request));
    etag(reply, project);
    return project;
  });
  server.post('/api/flexible/projects/:id/duplicate', async (request, reply) => {
    const value = body(request, ['name']);
    const project = await duplicateFlexible(params(request).id, value.name as string);
    etag(reply, project);
    reply.code(201);
    return project;
  });
  server.post('/api/flexible/projects/:id/resolve', async (request) => {
    const value = body(request, ['baseRevision']);
    const project = await readFlexible(params(request).id);
    if (value.baseRevision !== undefined && value.baseRevision !== project.revision)
      throw new AppError(412, 'STALE_REVISION', 'المشروع تغيّر؛ أعد تحميله.');
    return resolveFlexible(project, origin);
  });
  server.post(
    '/api/flexible/projects/:id/assets/:sceneId',
    { bodyLimit: 251 * 1024 * 1024 },
    async (request, reply) => {
      const expected = revision(request);
      await readFlexible(params(request).id);
      const part = await request.file();
      if (!part) throw new AppError(400, 'MISSING_UPLOAD', 'اختر صورة.');
      const current = await readFlexible(params(request).id),
        query = request.query as { slot?: string; promptId?: string };
      const project =
        current.schemaVersion === '2.0.0'
          ? await uploadFlexibleImage(current.id, params(request).sceneId, expected, part)
          : await uploadFlexibleMedia(
              current.id,
              expected,
              part,
              params(request).sceneId,
              Number(query.slot ?? 0),
              query.promptId,
            );
      etag(reply, project);
      return project;
    },
  );
  server.post('/api/flexible/projects/:id/review/:assetId', async (request, reply) => {
    const value = body(request, ['approved', 'sourceNote']);
    const project = await approveFlexibleImage(
      params(request).id,
      params(request).assetId,
      revision(request),
      value.approved as boolean,
      value.sourceNote as string,
    );
    etag(reply, project);
    return project;
  });
  server.post('/api/flexible/projects/:id/renders', async (request, reply) => {
    const value = body(request, ['revision']);
    if (!Number.isSafeInteger(value.revision))
      throw new AppError(400, 'INVALID_REVISION', 'احفظ الإصدار الحالي قبل التصدير.');
    const job = await enqueueFlexibleRender(params(request).id, value.revision as number, origin);
    reply.code(202);
    return job;
  });
  server.get('/api/flexible/projects/:id/renders', async (request) => {
    await readFlexible(params(request).id);
    return listJobs(params(request).id, 'flexible');
  });
  server.get('/media/flexible/:projectId/:assetId/:hash', async (request, reply) => {
    const { projectId, assetId, hash } = params(request);
    if (!/^[a-z][a-z0-9_-]{0,63}$/.test(assetId) || !/^[a-f0-9]{64}$/.test(hash))
      throw new AppError(400, 'INVALID_MEDIA', 'مرجع صورة غير صالح.');
    const project = await readFlexible(projectId),
      asset = await findFlexibleMedia(project, assetId, hash);
    if (!asset) throw new AppError(404, 'MEDIA_NOT_FOUND', 'الصورة غير موجودة.');
    return streamFile(
      request,
      reply,
      await flexibleAssetPath(project, asset),
      asset.mimeType,
      true,
    );
  });
}
