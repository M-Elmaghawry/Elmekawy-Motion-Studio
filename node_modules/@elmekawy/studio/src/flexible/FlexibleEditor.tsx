import { AudioTimeline } from './AudioTimeline';
import { PromptWorkspace } from './PromptWorkspace';
import { ProjectBackups } from '../ProjectBackups';
import { AdditionalSceneFields } from './AdditionalSceneFields';
import { SceneMediaControls } from './SceneMediaControls';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import { FlexibleReel } from '@elmekawy/motion-engine/flexible';
import {
  brandProfiles,
  sceneLabels,
  flexibleEditableOf,
  parseFlexibleProject,
  compileTimeline,
  fitScenesToDuration,
  moveScene,
  newFlexibleScene,
  renderReadinessErrors,
  projectWarnings,
  outputProfiles,
  safeAreaFor,
} from '@elmekawy/shared/flexible';
import type {
  FlexibleProject,
  FlexibleScene,
  FlexibleDescriptor,
  SupportedSceneType as ImplementedType,
  PromptWorkspaceRecord,
} from '@elmekawy/shared/flexible';
import type { RenderJob } from '@elmekawy/shared';
import { api } from '../api';

const stateLabels: Record<string, string> = {
  queued: 'في الانتظار',
  bundling: 'تجهيز المحرك',
  resolving: 'فحص المشاهد',
  rendering: 'تصيير الفيديو',
  verifying: 'فحص الفيديو',
  completed: 'مكتمل',
  failed: 'فشل التصدير',
  cancelled: 'ملغى',
  interrupted: 'متوقف',
};
const active = (job: RenderJob) =>
  ['queued', 'bundling', 'resolving', 'rendering', 'verifying'].includes(job.state);
export function FlexibleEditor({
  id,
  onBack,
  onDirtyChange,
  onProjectsChanged,
  onOpen,
  note,
}: {
  id: string;
  onBack: () => void;
  onDirtyChange: (value: boolean) => void;
  onProjectsChanged: () => Promise<unknown>;
  onOpen: (project: FlexibleProject, note?: string) => void;
  note: string;
}) {
  const [saved, setSaved] = useState<FlexibleProject | null>(null),
    [draft, setDraft] = useState<FlexibleProject | null>(null),
    [descriptor, setDescriptor] = useState<FlexibleDescriptor | null>(null);
  const [selected, setSelected] = useState(''),
    [newType, setNewType] = useState<ImplementedType>('kinetic-title'),
    [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(note),
    [jobs, setJobs] = useState<RenderJob[]>([]),
    [frame, setFrame] = useState(0),
    [safeArea, setSafeArea] = useState(false),
    [layoutWarnings, setLayoutWarnings] = useState<string[]>([]);
  const player = useRef<PlayerRef>(null),
    viewer = useRef<HTMLDivElement>(null),
    lastPreview = useRef<FlexibleProject | null>(null),
    warningKey = useRef('');
  const dirty = !!(
    saved &&
    draft &&
    JSON.stringify(flexibleEditableOf(saved)) !== JSON.stringify(flexibleEditableOf(draft))
  );
  const validation = useMemo(() => {
    if (!draft) return { project: null, message: '' };
    try {
      return { project: parseFlexibleProject(draft), message: '' };
    } catch (error) {
      const issues = error instanceof Error ? error.message : '';
      const message = issues.includes('AUDIO_OVERLAPS_SILENCE')
        ? 'علامة الصمت تتداخل مع مسار مسموع. قصّر المسار أو غيّر توقيته.'
        : issues.includes('INVALID_AUDIO_TIMING')
          ? 'راجع بداية الصوت ومدته والقص والتدرج. يجب أن يبقى داخل الفيديو والملف الأصلي.'
          : issues.includes('VIDEO_TOO_SHORT')
            ? 'مدة ملف الفيديو أو نقطة القص لا تغطي مدة المشهد.'
            : issues.includes('MOTION_EXCEEDS_SCENE')
              ? 'حركة الدخول والتتابع والخروج أطول من مدة المشهد.'
              : issues.includes('BEAT_OUT_OF_RANGE') || issues.includes('PAUSE_OUT_OF_RANGE')
                ? 'علامة إيقاع أو وقفة تقع خارج مدة الفيديو.'
                : 'راجع مدد المشاهد وقيم الحقول. المدة الإجمالية يجب أن تكون بين 20 و45 ثانية.';
      return { project: null, message };
    }
  }, [draft]);
  const parsed = validation.project;
  if (parsed) lastPreview.current = parsed;
  const preview = parsed ?? lastPreview.current;
  const inputProps = useMemo(
    () =>
      preview && descriptor
        ? { project: preview, media: descriptor.inputProps.media, preview: true }
        : null,
    [preview, descriptor],
  );
  const timeline = useMemo(() => {
    if (!preview) return null;
    return compileTimeline(preview.scenes);
  }, [preview]);
  const scene = draft?.scenes.find((scene) => scene.id === selected) ?? draft?.scenes[0];
  const sceneIndex = draft && scene ? draft.scenes.findIndex((item) => item.id === scene.id) : 0;
  const fail = (value: unknown) => {
    setError(value instanceof Error ? value.message : String(value));
    setNotice('');
  };
  const base = '/api/flexible/projects/' + id;
  async function apply(project: FlexibleProject) {
    const resolved = await api<FlexibleDescriptor>(base + '/resolve', {
      method: 'POST',
      body: JSON.stringify({ baseRevision: project.revision }),
    });
    setSaved(project);
    setDraft(project);
    setDescriptor(resolved);
    if (!selected || !project.scenes.some((scene) => scene.id === selected))
      setSelected(project.scenes[0].id);
  }
  async function load() {
    setBusy('loading');
    setError('');
    try {
      const current = await api<FlexibleProject>(base);
      await apply(current);
      setJobs(await api<RenderJob[]>(base + '/renders'));
    } catch (value) {
      fail(value);
    } finally {
      setBusy('');
    }
  }
  useEffect(() => {
    void load();
    return () => onDirtyChange(false);
  }, [id]);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => {
    let disposed = false;
    const timer = setInterval(() => {
      void api<RenderJob[]>(base + '/renders')
        .then((value) => {
          if (!disposed) setJobs(value);
        })
        .catch(() => {});
    }, 1500);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [base]);
  useEffect(() => {
    const current = player.current;
    if (!current) return;
    const update = ({ detail }: { detail: { frame: number } }) => setFrame(detail.frame);
    current.addEventListener('frameupdate', update);
    return () => current.removeEventListener('frameupdate', update);
  }, [descriptor]);
  useEffect(() => {
    const update = (event: Event) => {
      if (!(event.target instanceof Node) || !viewer.current?.contains(event.target)) return;
      const issues = (event as CustomEvent<{ issues: string[] }>).detail.issues;
      const key = JSON.stringify(issues);
      if (key !== warningKey.current) {
        warningKey.current = key;
        setLayoutWarnings(issues);
      }
    };
    document.addEventListener('elmekawy:layout-warning', update);
    return () => document.removeEventListener('elmekawy:layout-warning', update);
  }, []);
  const selectedEntry = timeline?.scenes.find((item) => item.id === selected);
  useEffect(() => {
    if (selectedEntry) {
      const target = selectedEntry.startFrame + Math.floor(selectedEntry.durationFrames / 2);
      player.current?.seekTo(target);
      setFrame(target);
    }
  }, [selected, selectedEntry?.startFrame, selectedEntry?.durationFrames]);
  function change(update: (project: FlexibleProject) => FlexibleProject) {
    setDraft((previous) => (previous ? update(structuredClone(previous)) : previous));
    setNotice('');
  }
  function changeScene(update: (value: FlexibleScene) => FlexibleScene) {
    if (!scene) return;
    change((project) => ({
      ...project,
      scenes: project.scenes.map((item) => (item.id === scene.id ? update(item) : item)),
    }));
  }
  function content(key: string, value: string | number) {
    changeScene(
      (item) => ({ ...item, content: { ...item.content, [key]: value } }) as FlexibleScene,
    );
  }
  function setScenes(next: FlexibleScene[]) {
    change((project) => {
      let target = project.targetDurationFrames;
      try {
        target = compileTimeline(next).durationFrames;
      } catch {}
      return {
        ...project,
        scenes: next,
        targetDurationFrames: target,
        ...(project.prompts
          ? {
              prompts: project.prompts.filter((prompt) =>
                next.some((scene) => scene.id === prompt.sceneId),
              ),
            }
          : {}),
      };
    });
  }
  function chooseScene(sceneId: string) {
    setSelected(sceneId);
    const entry = timeline?.scenes.find((scene) => scene.id === sceneId);
    if (entry) {
      const target = entry.startFrame + Math.floor(entry.durationFrames / 2);
      player.current?.seekTo(target);
      setFrame(target);
    }
  }
  function addScene() {
    if (!draft) return;
    const asset = draft.assets.find((asset) => asset.kind === 'image');
    const next = [
      ...draft.scenes,
      newFlexibleScene(newType, 'scene-' + crypto.randomUUID().replaceAll('-', ''), asset),
    ];
    next[next.length - 2].transitionOut = { type: 'crossfade', durationFrames: 15 };
    setScenes(fitScenesToDuration(next, draft.targetDurationFrames));
    setSelected(next[next.length - 1].id);
  }
  function deleteScene() {
    if (!draft || !scene) return;
    const next = draft.scenes.filter((item) => item.id !== scene.id);
    setScenes(fitScenesToDuration(next, draft.targetDurationFrames));
    setSelected(next[Math.min(sceneIndex, next.length - 1)].id);
  }
  async function persist() {
    if (!draft || !saved || !parsed) return null;
    const updated = await api<FlexibleProject>(base, {
      method: 'PUT',
      headers: { 'If-Match': '"r' + saved.revision + '"' },
      body: JSON.stringify(flexibleEditableOf(draft)),
    });
    await apply(updated);
    await onProjectsChanged();
    return updated;
  }
  async function save() {
    setBusy('saving');
    setError('');
    try {
      const updated = await persist();
      if (updated) setNotice('تم الحفظ · الإصدار ' + updated.revision);
    } catch (value) {
      fail(value);
    } finally {
      setBusy('');
    }
  }
  async function exportVideo() {
    if (!saved || !draft) return;
    setBusy('render');
    setError('');
    try {
      const current = dirty ? await persist() : saved;
      if (!current) return;
      const job = await api<RenderJob>(base + '/renders', {
        method: 'POST',
        body: JSON.stringify({ revision: current.revision }),
      });
      setJobs((previous) => [job, ...previous]);
      setNotice('بدأ تصدير الإصدار ' + current.revision + '. أي تعديل لاحق لن يغيّر هذا الفيديو.');
    } catch (value) {
      fail(value);
    } finally {
      setBusy('');
    }
  }
  async function duplicate() {
    if (!saved || !draft) return;
    setBusy('duplicate');
    setError('');
    try {
      const current = dirty ? await persist() : saved;
      if (!current) return;
      const copy = await api<FlexibleProject>(base + '/duplicate', {
        method: 'POST',
        body: JSON.stringify({ name: current.name.slice(0, 108) + ' — نسخة' }),
      });
      await onProjectsChanged();
      onOpen(copy, 'تم إنشاء نسخة مستقلة من البيانات والصور.');
    } catch (value) {
      fail(value);
    } finally {
      setBusy('');
    }
  }
  async function mutate(action: (current: FlexibleProject) => Promise<FlexibleProject>) {
    if (!saved || !draft) return;
    setBusy('media');
    setError('');
    try {
      const current = dirty ? await persist() : saved;
      if (!current) return;
      const updated = await action(current);
      await apply(updated);
      await onProjectsChanged();
      setNotice('تم الحفظ.');
    } catch (value) {
      fail(value);
    } finally {
      setBusy('');
    }
  }
  async function uploadMedia(file: File, sceneId?: string, slot = 0, promptId?: string) {
    await mutate(async (current) => {
      const body = new FormData();
      body.append('file', file);
      const query = new URLSearchParams({ slot: String(slot), ...(promptId ? { promptId } : {}) });
      return api<FlexibleProject>(
        base + (sceneId ? '/assets/' + sceneId : '/media') + '?' + query,
        { method: 'POST', headers: { 'If-Match': '"r' + current.revision + '"' }, body },
      );
    });
  }
  async function reviewAsset(assetId: string, sourceNote: string, approved: boolean) {
    await mutate((current) =>
      api<FlexibleProject>(base + '/review/' + assetId, {
        method: 'POST',
        headers: { 'If-Match': '"r' + current.revision + '"' },
        body: JSON.stringify({ sourceNote, approved }),
      }),
    );
  }
  function uploadPrompt(file: File, prompt: PromptWorkspaceRecord) {
    const scene = draft?.scenes.find((scene) => scene.id === prompt.sceneId);
    void uploadMedia(file, scene?.mediaBindings.length ? scene.id : undefined, 0, prompt.id);
  }
  function field(key: string, label: string, value: string, max = 200, multiline = false) {
    return (
      <label className="field" key={key}>
        <span>{label}</span>
        {multiline ? (
          <textarea
            data-testid={'scene-' + key}
            maxLength={max}
            value={value}
            onChange={(event) => content(key, event.target.value)}
          />
        ) : (
          <input
            data-testid={'scene-' + key}
            maxLength={max}
            value={value}
            onChange={(event) => content(key, event.target.value)}
          />
        )}
      </label>
    );
  }
  if (!draft || !saved || !descriptor || !preview || !inputProps || !timeline)
    return (
      <section className="flexible">
        <div className="actions">
          <button onClick={onBack}>المشاريع</button>
          <button onClick={() => void load()}>إعادة المحاولة</button>
        </div>
        {error ? (
          <p className="message error" role="alert">
            {error}
          </p>
        ) : (
          <p>جاري فتح المشروع المرن…</p>
        )}
      </section>
    );
  const ready = renderReadinessErrors(draft).length === 0;
  const disabled = !!busy;
  return (
    <section className="flexible" data-testid="flexible-editor" data-project-id={id}>
      <div className="pagehead">
        <div>
          <h1>{draft.name}</h1>
          <p data-testid="flex-save-state">
            {dirty ? 'تغييرات غير محفوظة' : 'محفوظ · الإصدار ' + saved.revision} ·{' '}
            {Number((preview.targetDurationFrames / 30).toFixed(2))} ثانية
          </p>
        </div>
        <div className="actions">
          <button onClick={onBack}>المشاريع</button>
          <button
            data-testid="flex-save"
            disabled={disabled || !dirty || !parsed}
            onClick={() => void save()}
          >
            حفظ المشروع
          </button>
          <button
            data-testid="flex-export"
            className="primary"
            disabled={disabled || !parsed || !ready || layoutWarnings.length > 0}
            onClick={() => void exportVideo()}
          >
            {dirty ? 'حفظ وتصدير MP4' : 'تصدير MP4'}
          </button>
          <button
            data-testid="flex-duplicate"
            disabled={disabled || !parsed}
            onClick={() => void duplicate()}
          >
            {dirty ? 'حفظ ونسخ' : 'نسخ المشروع'}
          </button>
        </div>
      </div>
      {error && (
        <div className="message error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="message success" role="status">
          {notice}
        </div>
      )}
      {!parsed && (
        <p className="message error" role="alert">
          {validation.message} المعاينة تعرض آخر إعدادات صالحة.
        </p>
      )}
      <nav className="editor-tabs" aria-label="أدوات المشروع المرن">
        <a href="#flex-scenes">المشاهد والصور</a>
        {draft.schemaVersion === '2.1.0' && (
          <>
            <a href="#audio-timeline">الوسائط والصوت</a>
            <a href="#prompt-workspace">البرومبتات</a>
          </>
        )}
        <a href="#project-backups">النسخ والاسترجاع</a>
      </nav>
      <div className="editor-grid">
        <div className="editor-fields">
          <details className="panel project-details">
            <summary>بيانات المشروع والهوية</summary>
            <fieldset disabled={disabled}>
              <label className="field">
                <span>اسم المشروع</span>
                <input
                  maxLength={120}
                  value={draft.name}
                  onChange={(event) =>
                    change((project) => ({ ...project, name: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span>العميل</span>
                <input
                  maxLength={120}
                  value={draft.brief.client}
                  onChange={(event) =>
                    change((project) => ({
                      ...project,
                      brief: { ...project.brief, client: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>هدف الفيديو</span>
                <textarea
                  maxLength={10000}
                  value={draft.brief.objective}
                  onChange={(event) =>
                    change((project) => ({
                      ...project,
                      brief: { ...project.brief, objective: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>الهوية</span>
                <select
                  value={draft.brand.profileId}
                  onChange={(event) => {
                    const profile = brandProfiles.find(
                      (profile) => profile.profileId === event.target.value,
                    )!;
                    change((project) => ({
                      ...project,
                      brand: {
                        ...project.brand,
                        profileId: profile.profileId,
                        displayName: profile.displayName,
                        colors: { ...profile.colors },
                      },
                    }));
                  }}
                >
                  {brandProfiles.map((profile) => (
                    <option key={profile.profileId} value={profile.profileId}>
                      {profile.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>اسم العلامة داخل الفيديو</span>
                <input
                  maxLength={120}
                  value={draft.brand.displayName}
                  onChange={(event) =>
                    change((project) => ({
                      ...project,
                      brand: { ...project.brand, displayName: event.target.value },
                    }))
                  }
                />
              </label>
              <div className="color-fields">
                {(Object.keys(draft.brand.colors) as (keyof typeof draft.brand.colors)[]).map(
                  (key) => (
                    <label className="field" key={key}>
                      <span>
                        {
                          {
                            background: 'الخلفية',
                            surface: 'البطاقات',
                            foreground: 'النص',
                            accent: 'اللون المميز',
                            muted: 'النص الثانوي',
                          }[key]
                        }
                      </span>
                      <input
                        type="color"
                        value={draft.brand.colors[key]}
                        onChange={(event) =>
                          change((project) => ({
                            ...project,
                            brand: {
                              ...project.brand,
                              colors: { ...project.brand.colors, [key]: event.target.value },
                            },
                          }))
                        }
                      />
                    </label>
                  ),
                )}
              </div>
            </fieldset>
          </details>
          <div className="panel scene-tools" id="flex-scenes">
            <h2>المشاهد</h2>
            {draft.schemaVersion === '2.0.0' ? (
              <button
                data-testid="upgrade-flexible-media"
                disabled={disabled || !parsed}
                onClick={() =>
                  void mutate((current) =>
                    api<FlexibleProject>(base + '/upgrade', {
                      method: 'POST',
                      headers: { 'If-Match': '"r' + current.revision + '"' },
                      body: '{}',
                    }),
                  )
                }
              >
                تفعيل أدوات الفيديو والصوت والمقاسات الجديدة
              </button>
            ) : (
              <label className="field">
                <span>مقاس الفيديو</span>
                <select
                  data-testid="editor-output-profile"
                  disabled={disabled}
                  value={draft.outputProfile.id}
                  onChange={(event) => {
                    const profile = outputProfiles.find(
                      (profile) => profile.id === event.target.value,
                    )!;
                    change((project) => ({
                      ...project,
                      outputProfile: { ...profile, crf: project.outputProfile.crf },
                      brand: { ...project.brand, safeArea: safeAreaFor(profile.aspectRatio) },
                    }));
                  }}
                >
                  {outputProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.aspectRatio} · {profile.width} × {profile.height}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="actions">
              <select
                aria-label="نوع المشهد الجديد"
                data-testid="new-scene-type"
                disabled={disabled}
                value={newType}
                onChange={(event) => setNewType(event.target.value as ImplementedType)}
              >
                {Object.entries(sceneLabels)
                  .filter(
                    ([id]) =>
                      draft.schemaVersion === '2.1.0' ||
                      !['ui-demo', 'product-hero', 'before-after', 'data-explainer'].includes(id),
                  )
                  .map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
              </select>
              <button
                data-testid="add-scene"
                disabled={disabled || !parsed || draft.scenes.length >= 8}
                onClick={addScene}
              >
                ＋ إضافة مشهد
              </button>
            </div>
            <p className="inline-note">
              الإضافة والحذف يعيدان توزيع المدة الحالية. يمكنك تغيير مدة كل مشهد أو المدة الإجمالية.
            </p>
            <label className="field">
              <span>المدة الإجمالية بالثواني · إعادة توزيع المشاهد</span>
              <input
                data-testid="total-duration"
                type="number"
                min={20}
                max={45}
                step={1}
                disabled={disabled}
                value={draft.targetDurationFrames / 30}
                onChange={(event) => {
                  const target = Number(event.target.value) * 30;
                  if (Number.isInteger(target) && target >= 600 && target <= 1350)
                    change((project) => ({
                      ...project,
                      targetDurationFrames: target,
                      scenes: fitScenesToDuration(project.scenes, target),
                    }));
                }}
              />
            </label>
            <div className="scene-list">
              {draft.scenes.map((item, index) => (
                <button
                  type="button"
                  data-testid="flex-scene-select"
                  data-scene-id={item.id}
                  key={item.id}
                  className={item.id === scene?.id ? 'scene active-scene' : 'scene'}
                  onClick={() => chooseScene(item.id)}
                >
                  <span className="scene-number">{index + 1}</span>
                  <span>
                    <strong>{sceneLabels[item.type]}</strong>
                    <small>
                      {item.durationFrames} إطار · {Number((item.durationFrames / 30).toFixed(2))}{' '}
                      ثانية
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </div>
          {scene && (
            <div className="panel scene-properties">
              <div className="sectionhead">
                <h2>{sceneLabels[scene.type]}</h2>
                <div className="actions">
                  <button
                    data-testid="scene-up"
                    aria-label="نقل المشهد لأعلى"
                    disabled={disabled || sceneIndex === 0}
                    onClick={() => setScenes(moveScene(draft.scenes, sceneIndex, sceneIndex - 1))}
                  >
                    ↑
                  </button>
                  <button
                    data-testid="scene-down"
                    aria-label="نقل المشهد لأسفل"
                    disabled={disabled || sceneIndex === draft.scenes.length - 1}
                    onClick={() => setScenes(moveScene(draft.scenes, sceneIndex, sceneIndex + 1))}
                  >
                    ↓
                  </button>
                  <button
                    data-testid="delete-scene"
                    disabled={disabled || draft.scenes.length <= 3 || !parsed}
                    onClick={deleteScene}
                  >
                    حذف المشهد
                  </button>
                </div>
              </div>
              {scene.mediaBindings.length > 0 && (
                <SceneMediaControls
                  key={scene.id}
                  project={draft}
                  scene={scene}
                  media={descriptor.inputProps.media}
                  disabled={disabled || !parsed}
                  onChange={(value) => changeScene(() => value)}
                  onUpload={(file, slot) => void uploadMedia(file, scene.id, slot)}
                  onReview={(assetId, note, approved) => void reviewAsset(assetId, note, approved)}
                />
              )}
              <fieldset disabled={disabled}>
                <AdditionalSceneFields
                  scene={scene}
                  onChange={(value) => changeScene(() => value)}
                />
                <div className="form-grid">
                  <label className="field">
                    <span>مدة المشهد بالإطارات</span>
                    <input
                      data-testid="scene-duration"
                      type="number"
                      min={1}
                      max={1530}
                      step={1}
                      value={scene.durationFrames}
                      onChange={(event) =>
                        setScenes(
                          draft.scenes.map((item) =>
                            item.id === scene.id
                              ? { ...item, durationFrames: Number(event.target.value) }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="field">
                    <span>اتجاه النص</span>
                    <select
                      value={scene.direction}
                      onChange={(event) =>
                        changeScene((item) => ({
                          ...item,
                          direction: event.target.value as 'rtl' | 'ltr',
                        }))
                      }
                    >
                      <option value="rtl">العربية · RTL</option>
                      <option value="ltr">الإنجليزية · LTR</option>
                    </select>
                  </label>
                </div>
                {scene.type === 'kinetic-title' && (
                  <>
                    {field('headline', 'العنوان', scene.content.headline)}
                    {field('subtitle', 'النص الفرعي', scene.content.subtitle ?? '')}
                  </>
                )}
                {scene.type === 'stat-proof' && (
                  <>
                    {field('label', 'عنوان الرقم', scene.content.label)}
                    <label className="field">
                      <span>القيمة</span>
                      <input
                        data-testid="scene-value"
                        type="number"
                        value={scene.content.value}
                        onChange={(event) => content('value', Number(event.target.value))}
                      />
                    </label>
                    {field('prefix', 'قبل الرقم', scene.content.prefix, 30)}
                    {field('suffix', 'بعد الرقم', scene.content.suffix, 30)}
                    {field(
                      'sourceNote',
                      'مصدر الرقم أو ملاحظة المثال',
                      scene.content.sourceNote,
                      400,
                      true,
                    )}
                  </>
                )}
                {scene.type === 'media-showcase' && (
                  <>
                    {field('headline', 'عنوان الصورة', scene.content.headline)}
                    {field('caption', 'التعليق', scene.content.caption, 400, true)}
                  </>
                )}
                {scene.type === 'process-flow' && (
                  <>
                    {field('headline', 'عنوان الخطوات', scene.content.headline)}
                    {scene.content.steps.map((step, index) => (
                      <div className="actions step-edit" key={step.id}>
                        <label className="field">
                          <span>الخطوة {index + 1}</span>
                          <input
                            maxLength={120}
                            value={step.label}
                            onChange={(event) =>
                              changeScene((item) =>
                                item.type === 'process-flow'
                                  ? {
                                      ...item,
                                      content: {
                                        ...item.content,
                                        steps: item.content.steps.map((value) =>
                                          value.id === step.id
                                            ? { ...value, label: event.target.value }
                                            : value,
                                        ),
                                      },
                                    }
                                  : item,
                              )
                            }
                          />
                        </label>
                        <button
                          type="button"
                          disabled={scene.content.steps.length <= 1}
                          onClick={() =>
                            changeScene((item) =>
                              item.type === 'process-flow'
                                ? {
                                    ...item,
                                    content: {
                                      ...item.content,
                                      steps: item.content.steps.filter(
                                        (value) => value.id !== step.id,
                                      ),
                                    },
                                  }
                                : item,
                            )
                          }
                        >
                          حذف الخطوة
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={scene.content.steps.length >= 8}
                      onClick={() =>
                        changeScene((item) =>
                          item.type === 'process-flow'
                            ? {
                                ...item,
                                content: {
                                  ...item.content,
                                  steps: [
                                    ...item.content.steps,
                                    {
                                      id: 'step-' + crypto.randomUUID().replaceAll('-', ''),
                                      label: 'خطوة جديدة',
                                    },
                                  ],
                                },
                              }
                            : item,
                        )
                      }
                    >
                      ＋ خطوة
                    </button>
                  </>
                )}
                {scene.type === 'offer-cta' && (
                  <>
                    {field('headline', 'العنوان', scene.content.headline)}
                    {field('offer', 'العرض أو الوصف', scene.content.offer ?? '')}
                    {field('action', 'دعوة التواصل', scene.content.action, 120)}
                    {field('contact', 'الرابط أو وسيلة التواصل', scene.content.contact)}
                  </>
                )}
                <details>
                  <summary>الحركة والانتقال</summary>
                  <div className="form-grid">
                    {(['enterFrames', 'staggerFrames', 'exitFrames'] as const).map((key) => (
                      <label className="field" key={key}>
                        <span>
                          {
                            {
                              enterFrames: 'زمن الدخول',
                              staggerFrames: 'التتابع',
                              exitFrames: 'زمن الخروج',
                            }[key]
                          }{' '}
                          · إطار
                        </span>
                        <input
                          type="number"
                          min={key === 'enterFrames' ? 1 : 0}
                          max={key === 'staggerFrames' ? 60 : 180}
                          value={scene.motion[key]}
                          onChange={(event) =>
                            changeScene((item) => ({
                              ...item,
                              motion: { ...item.motion, [key]: Number(event.target.value) },
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={scene.motion.reducedMotion}
                      onChange={(event) =>
                        changeScene((item) => ({
                          ...item,
                          motion: { ...item.motion, reducedMotion: event.target.checked },
                        }))
                      }
                    />
                    تقليل حركة العناصر
                  </label>
                  <label className="field">
                    <span>الانتقال للمشهد التالي</span>
                    <select
                      disabled={sceneIndex === draft.scenes.length - 1}
                      value={scene.transitionOut.type}
                      onChange={(event) =>
                        setScenes(
                          draft.scenes.map((item) =>
                            item.id === scene.id
                              ? {
                                  ...item,
                                  transitionOut:
                                    event.target.value === 'cut'
                                      ? { type: 'cut', durationFrames: 0 }
                                      : { type: 'crossfade', durationFrames: 15 },
                                }
                              : item,
                          ),
                        )
                      }
                    >
                      <option value="cut">قطع مباشر</option>
                      <option value="crossfade">تلاشي متداخل · 15 إطار</option>
                    </select>
                  </label>
                </details>
              </fieldset>
            </div>
          )}
          {draft.schemaVersion === '2.1.0' && (
            <>
              <AudioTimeline
                project={draft}
                media={descriptor.inputProps.media}
                disabled={disabled}
                onChange={(project) => change(() => project)}
                onUpload={(file) => void uploadMedia(file)}
                onReview={(id, note, approved) => void reviewAsset(id, note, approved)}
              />
              <PromptWorkspace
                project={draft}
                disabled={disabled}
                onChange={(project) => change(() => project)}
                onUpload={uploadPrompt}
                onReview={(id, note, approved) => void reviewAsset(id, note, approved)}
                onNotice={setNotice}
                onError={fail}
              />
            </>
          )}
          <ProjectBackups
            project={saved}
            base={base}
            disabled={disabled || !parsed}
            prepare={() => (dirty ? persist() : Promise.resolve(saved))}
            onRestored={async (project) => {
              await apply(project as FlexibleProject);
              await onProjectsChanged();
              setNotice('تمت استعادة الإصدار السابق كإصدار جديد.');
            }}
            onError={fail}
          />
          <div className="panel render-panel">
            <h2>التصدير</h2>
            <p className="inline-note">
              {draft.outputProfile.width} × {draft.outputProfile.height} · {draft.outputProfile.fps}{' '}
              FPS · MP4 / H.264 ·{' '}
              {draft.audio.mode === 'timeline' &&
              draft.audio.tracks.some((track) => track.volume > 0)
                ? 'بصوت'
                : 'بدون صوت'}
            </p>
            <label className="field quality">
              <span>جودة CRF · الأقل أعلى جودة</span>
              <input
                type="number"
                min={0}
                max={51}
                disabled={disabled}
                value={draft.outputProfile.crf}
                onChange={(event) =>
                  change((project) => ({
                    ...project,
                    outputProfile: { ...project.outputProfile, crf: Number(event.target.value) },
                  }))
                }
              />
            </label>
            {!ready && <p className="inline-note">راجع الصور المستخدمة واعتمدها قبل التصدير.</p>}
            {[...new Set([...descriptor.warnings, ...projectWarnings(draft)])].map((message) => (
              <p className="inline-note" key={message}>
                {message}
              </p>
            ))}
            <div className="jobs">
              {!jobs.some((job) => job.state === 'completed') && (
                <p className="inline-note">لا توجد نسخة فيديو مكتملة لهذا المشروع بعد.</p>
              )}
              {jobs.map((job) => (
                <article className="job" key={job.id}>
                  <div className="sectionhead">
                    <strong>{stateLabels[job.state] ?? job.state}</strong>
                    <small>الإصدار {job.projectRevision}</small>
                  </div>
                  {active(job) && (
                    <>
                      <progress value={job.progress} max={1} aria-label="تقدم التصدير" />
                      <button
                        className="quiet"
                        onClick={() =>
                          void api('/api/renders/' + job.id + '/cancel', {
                            method: 'POST',
                            body: '{}',
                          })
                            .then(() => api<RenderJob[]>(base + '/renders'))
                            .then(setJobs)
                            .catch(fail)
                        }
                      >
                        إلغاء
                      </button>
                    </>
                  )}
                  {job.error && <p className="job-error">{job.error}</p>}
                  {job.state === 'completed' && (
                    <a data-testid="flex-download" className="download" href={job.downloadUrl}>
                      تنزيل MP4 · {((job.outputBytes ?? 0) / 1024 / 1024).toFixed(2)} MB
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
          <div className="actions">
            <button
              disabled={disabled}
              onClick={() => {
                if (
                  !dirty ||
                  window.confirm('إعادة تحميل النسخة المحفوظة وتجاهل التعديلات الحالية؟')
                )
                  void load();
              }}
            >
              إعادة تحميل المحفوظ
            </button>
          </div>
        </div>
        <section className="viewer panel" ref={viewer}>
          <div className="sectionhead">
            <h2>المعاينة المباشرة</h2>
            <span className="tag">{dirty ? 'غير محفوظة' : 'الإصدار ' + saved.revision}</span>
          </div>
          <div className="player-shell" data-testid="flexible-preview" dir="ltr">
            <Player
              key={id}
              ref={player}
              component={FlexibleReel}
              inputProps={inputProps}
              compositionWidth={preview.outputProfile.width}
              compositionHeight={preview.outputProfile.height}
              durationInFrames={preview.targetDurationFrames}
              fps={preview.outputProfile.fps}
              controls
              initialFrame={60}
              style={{ width: '100%' }}
              moveToBeginningWhenEnded={false}
              errorFallback={({ error }) => (
                <div className="player-error">تعذّرت المعاينة: {error.message}</div>
              )}
            />
            {safeArea && (
              <div
                className="safe-overlay"
                style={{
                  left: (preview.brand.safeArea.left / preview.outputProfile.width) * 100 + '%',
                  right: (preview.brand.safeArea.right / preview.outputProfile.width) * 100 + '%',
                  top: (preview.brand.safeArea.top / preview.outputProfile.height) * 100 + '%',
                  bottom:
                    (preview.brand.safeArea.bottom / preview.outputProfile.height) * 100 + '%',
                }}
              />
            )}
          </div>
          <div className="viewer-footer">
            <label>
              <input
                type="checkbox"
                checked={safeArea}
                onChange={(event) => setSafeArea(event.target.checked)}
              />
              المنطقة الآمنة
            </label>
            <bdi>
              F {frame} / {preview.targetDurationFrames - 1}
            </bdi>
          </div>
          {layoutWarnings.length > 0 && (
            <p className="message error" role="alert">
              نص يتجاوز المنطقة الآمنة:{' '}
              {layoutWarnings
                .map((id) =>
                  id === 'brand'
                    ? 'اسم العلامة'
                    : 'المشهد ' + (draft.scenes.findIndex((scene) => scene.id === id) + 1),
                )
                .join('، ')}
              . اختصر النص قبل التصدير.
            </p>
          )}
          <div className="scene-timeline" aria-label="مخطط المشاهد">
            {timeline.scenes.map((entry) => (
              <button
                key={entry.id}
                title={sceneLabels[preview.scenes[entry.index].type]}
                style={{ flex: entry.durationFrames }}
                onClick={() => chooseScene(entry.id)}
              >
                {entry.index + 1}
              </button>
            ))}
          </div>
          <p className="viewer-note">
            المعاينة تعرض المسودة. التصدير يستخدم الإصدار المحفوظ والصور المعتمدة.
          </p>
        </section>
      </div>
    </section>
  );
}
