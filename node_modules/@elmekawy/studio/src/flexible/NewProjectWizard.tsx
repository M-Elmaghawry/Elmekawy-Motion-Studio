import React, { useEffect, useState } from 'react';
import {
  brandProfiles,
  sceneLabels,
  outputProfiles,
  portraitProfile,
} from '@elmekawy/shared/flexible';
import type {
  FlexibleProject,
  SupportedSceneType as ImplementedType,
  FlexibleCreate,
} from '@elmekawy/shared/flexible';
import { api } from '../api';
import type { FlexibleOptions } from './types';

const steps = ['بيانات المشروع', 'الهوية', 'المقاس والمشاهد', 'الصور', 'المراجعة'];
const initialTypes: ImplementedType[] = [
  'kinetic-title',
  'stat-proof',
  'media-showcase',
  'process-flow',
  'offer-cta',
];
export function NewProjectWizard({
  onCreated,
  onBack,
}: {
  onCreated: (project: FlexibleProject, note?: string) => void;
  onBack: () => void;
}) {
  const [options, setOptions] = useState<FlexibleOptions | null>(null),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [form, setForm] = useState<FlexibleCreate>({
    name: '',
    client: '',
    objective: '',
    brandProfileId: brandProfiles[0].profileId,
    displayName: brandProfiles[0].displayName,
    colors: { ...brandProfiles[0].colors },
    durationFrames: 600,
    outputProfileId: portraitProfile.id,
    sceneTypes: initialTypes,
    libraryImageId: '',
    approveImage: false,
    crf: 18,
  });
  const [file, setFile] = useState<File | null>(null),
    [fileUrl, setFileUrl] = useState(''),
    [reviewNote, setReviewNote] = useState('');
  useEffect(() => {
    let active = true;
    void api<FlexibleOptions>('/api/flexible/options')
      .then((value) => {
        if (active) {
          setOptions(value);
          setForm((previous) => ({ ...previous, libraryImageId: value.images[0]?.id ?? '' }));
        }
      })
      .catch((value) => {
        if (active) setError(String(value instanceof Error ? value.message : value));
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!file) {
      setFileUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function chooseBrand(id: string) {
    const profile = options?.brandProfiles.find((profile) => profile.profileId === id);
    if (profile)
      setForm({
        ...form,
        brandProfileId: id,
        displayName: profile.displayName,
        colors: { ...profile.colors },
      });
  }
  function moveType(index: number, offset: number) {
    const next = [...form.sceneTypes];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setForm({ ...form, sceneTypes: next });
  }
  const nextAllowed =
    step === 0
      ? !!(form.name.trim() && form.client.trim() && form.objective.trim())
      : step === 1
        ? !!form.displayName.trim()
        : step === 2
          ? Number.isInteger(form.durationFrames) &&
            form.durationFrames >= 600 &&
            form.durationFrames <= 1350
          : true;
  async function create() {
    setBusy(true);
    setError('');
    let created: FlexibleProject | null = null;
    try {
      created = await api<FlexibleProject>('/api/flexible/projects', {
        method: 'POST',
        body: JSON.stringify({ ...form, approveImage: !file && form.approveImage }),
      });
      if (file) {
        const scene = created.scenes.find((scene) => scene.mediaBindings.length > 0);
        if (scene) {
          const body = new FormData();
          body.append('file', file);
          created = await api<FlexibleProject>(
            '/api/flexible/projects/' + created.id + '/assets/' + scene.id,
            { method: 'POST', headers: { 'If-Match': '"r' + created.revision + '"' }, body },
          );
          if (form.approveImage) {
            const image = created.assets.find(
              (asset) =>
                asset.id ===
                created!.scenes.find((item) => item.id === scene.id)!.mediaBindings[0].assetId,
            )!;
            created = await api<FlexibleProject>(
              '/api/flexible/projects/' + created.id + '/review/' + image.id,
              {
                method: 'POST',
                headers: { 'If-Match': '"r' + created.revision + '"' },
                body: JSON.stringify({
                  approved: true,
                  sourceNote: reviewNote.trim() || 'صورة محلية رفعها المستخدم وراجعها يدويًا.',
                }),
              },
            );
          }
        }
      }
      onCreated(created, 'تم إنشاء المشروع وحفظه.');
    } catch (value) {
      const message = value instanceof Error ? value.message : String(value);
      if (created)
        onCreated(
          created,
          'تم إنشاء المشروع، لكن تعذّر استكمال رفع الصورة أو اعتمادها: ' + message,
        );
      else setError(message);
    } finally {
      setBusy(false);
    }
  }
  const selectedImage = options?.images.find((image) => image.id === form.libraryImageId);
  return (
    <section className="flexible" data-testid="flexible-wizard">
      <div className="pagehead">
        <div>
          <h1>مشروع بمشاهد مرنة</h1>
          <p>جهّز الفكرة والهوية والصور، ثم عدّل المشاهد داخل المحرر.</p>
        </div>
        <button disabled={busy} onClick={onBack}>
          العودة للمشاريع
        </button>
      </div>
      {error && (
        <div className="message error" role="alert">
          {error}
        </div>
      )}
      {!options ? (
        <p>جاري تحميل القالب والموارد المحلية…</p>
      ) : (
        <>
          <ol className="wizard-steps">
            {steps.map((title, index) => (
              <li key={title} aria-current={step === index ? 'step' : undefined}>
                <span>{index + 1}</span>
                {title}
              </li>
            ))}
          </ol>
          <form
            className="panel create-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (step < 4 && nextAllowed) setStep(step + 1);
              else if (step === 4) void create();
            }}
          >
            <fieldset disabled={busy}>
              <h2>{steps[step]}</h2>
              {step === 0 && (
                <>
                  <label className="field">
                    <span>اسم المشروع</span>
                    <input
                      data-testid="wizard-name"
                      required
                      maxLength={120}
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>العميل</span>
                    <input
                      data-testid="wizard-client"
                      required
                      maxLength={120}
                      value={form.client}
                      onChange={(event) => setForm({ ...form, client: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>هدف الفيديو</span>
                    <textarea
                      data-testid="wizard-goal"
                      required
                      maxLength={10000}
                      value={form.objective}
                      onChange={(event) => setForm({ ...form, objective: event.target.value })}
                    />
                  </label>
                </>
              )}
              {step === 1 && (
                <>
                  <label className="field">
                    <span>الهوية</span>
                    <select
                      data-testid="wizard-brand"
                      value={form.brandProfileId}
                      onChange={(event) => chooseBrand(event.target.value)}
                    >
                      {options.brandProfiles.map((profile) => (
                        <option key={profile.profileId} value={profile.profileId}>
                          {profile.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>اسم العلامة داخل الفيديو</span>
                    <input
                      data-testid="wizard-brand-name"
                      required
                      maxLength={120}
                      value={form.displayName}
                      onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                    />
                  </label>
                  <div className="color-fields">
                    {(Object.keys(form.colors) as (keyof typeof form.colors)[]).map((key) => (
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
                          aria-label={'لون ' + key}
                          type="color"
                          value={form.colors[key]}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              colors: { ...form.colors, [key]: event.target.value },
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <p className="inline-note">الخطوط المحلية: Cairo للعربية وInter للإنجليزية.</p>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="form-grid">
                    <label className="field">
                      <span>المدة بالثواني</span>
                      <input
                        data-testid="wizard-duration"
                        type="number"
                        min={20}
                        max={45}
                        step={1}
                        value={form.durationFrames / 30}
                        onChange={(event) =>
                          setForm({ ...form, durationFrames: Number(event.target.value) * 30 })
                        }
                      />
                    </label>
                    <label className="field">
                      <span>المقاس ونسبة العرض</span>
                      <select
                        data-testid="wizard-output-profile"
                        aria-label="المقاس"
                        value={form.outputProfileId ?? portraitProfile.id}
                        onChange={(event) =>
                          setForm({ ...form, outputProfileId: event.target.value })
                        }
                      >
                        {outputProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.aspectRatio} · {profile.width} × {profile.height} ·{' '}
                            {profile.fps} FPS
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="inline-note">
                    هذا الإصدار يدعم المقاس الرأسي. تتوزع المدة المطلوبة على المشاهد مع احتساب
                    الانتقالات.
                  </p>
                  <div className="storyboard-choices">
                    {form.sceneTypes.map((type, index) => (
                      <div className="actions" key={index}>
                        <span>{index + 1}</span>
                        <select
                          aria-label={'نوع المشهد ' + (index + 1)}
                          value={type}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              sceneTypes: form.sceneTypes.map((item, i) =>
                                i === index ? (event.target.value as ImplementedType) : item,
                              ),
                            })
                          }
                        >
                          {Object.entries(sceneLabels).map(([id, label]) => (
                            <option key={id} value={id}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          aria-label={'رفع المشهد ' + (index + 1)}
                          disabled={index === 0}
                          onClick={() => moveType(index, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={'خفض المشهد ' + (index + 1)}
                          disabled={index === form.sceneTypes.length - 1}
                          onClick={() => moveType(index, 1)}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          disabled={form.sceneTypes.length <= 3}
                          onClick={() =>
                            setForm({
                              ...form,
                              sceneTypes: form.sceneTypes.filter((_, i) => i !== index),
                            })
                          }
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={form.sceneTypes.length >= 8}
                    onClick={() =>
                      setForm({ ...form, sceneTypes: [...form.sceneTypes, 'kinetic-title'] })
                    }
                  >
                    ＋ مشهد
                  </button>
                </>
              )}
              {step === 3 && (
                <>
                  {form.sceneTypes.includes('media-showcase') ? (
                    <>
                      <label className="field">
                        <span>صورة توضيحية من المكتبة</span>
                        <select
                          data-testid="wizard-image"
                          value={form.libraryImageId}
                          onChange={(event) => {
                            setFile(null);
                            setForm({
                              ...form,
                              libraryImageId: event.target.value,
                              approveImage: false,
                            });
                          }}
                        >
                          {options.images.map((image) => (
                            <option key={image.id} value={image.id}>
                              {image.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <img
                        className="wizard-image"
                        src={fileUrl || selectedImage?.url}
                        alt="الصورة المختارة للمراجعة"
                      />
                      <label className="field">
                        <span>أو ارفع صورتك · PNG / JPEG / WebP · 50 MB</span>
                        <input
                          data-testid="wizard-file"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => {
                            setFile(event.target.files?.[0] ?? null);
                            setForm({ ...form, approveImage: false });
                          }}
                        />
                      </label>
                      <label className="field">
                        <span>مصدر الصورة وملاحظات المراجعة</span>
                        <input
                          maxLength={1000}
                          value={reviewNote}
                          onChange={(event) => setReviewNote(event.target.value)}
                        />
                      </label>
                      <label className="check">
                        <input
                          data-testid="wizard-approve"
                          type="checkbox"
                          checked={form.approveImage}
                          onChange={(event) =>
                            setForm({ ...form, approveImage: event.target.checked })
                          }
                        />
                        راجعت الصورة وأعتمد استخدامها في هذا المشروع
                      </label>
                      <p className="inline-note">
                        يمكن إنشاء مسودة ومراجعة الصورة لاحقًا. اعتماد الصورة مطلوب قبل التصدير؛
                        راجع مصدرها وحقوق استخدامها.
                      </p>
                    </>
                  ) : (
                    <p className="inline-note">
                      المشاهد المختارة لا تحتاج صورة. تقدر تضيف مشهد عرض صورة لاحقًا.
                    </p>
                  )}
                </>
              )}
              {step === 4 && (
                <>
                  <dl className="review-summary">
                    <dt>المشروع</dt>
                    <dd>{form.name}</dd>
                    <dt>العميل</dt>
                    <dd>{form.client}</dd>
                    <dt>العلامة</dt>
                    <dd>{form.displayName}</dd>
                    <dt>الفيديو</dt>
                    <dd>
                      {form.durationFrames / 30} ثانية · {form.sceneTypes.length} مشاهد ·{' '}
                      {outputProfiles.find((profile) => profile.id === form.outputProfileId)
                        ?.aspectRatio ?? '9:16'}
                    </dd>
                    <dt>الإخراج</dt>
                    <dd>MP4 · H.264 · بدون صوت</dd>
                  </dl>
                  <label className="field quality">
                    <span>جودة التصدير CRF · الأقل أعلى جودة</span>
                    <input
                      type="number"
                      min={0}
                      max={51}
                      value={form.crf}
                      onChange={(event) => setForm({ ...form, crf: Number(event.target.value) })}
                    />
                  </label>
                  <p className="inline-note">
                    ستقدر تعدّل النصوص وترتيب المشاهد وحجم الصور وتحفظ نسخك من المحرر.
                  </p>
                </>
              )}
              <div className="actions wizard-actions">
                {step > 0 && (
                  <button type="button" onClick={() => setStep(step - 1)}>
                    السابق
                  </button>
                )}
                <button
                  data-testid={step === 4 ? 'wizard-create' : 'wizard-next'}
                  className="primary"
                  type="submit"
                  disabled={!nextAllowed || busy}
                >
                  {busy ? 'جاري الإنشاء…' : step === 4 ? 'إنشاء وفتح المحرر' : 'التالي'}
                </button>
                <span className="muted">
                  {step + 1} / {steps.length}
                </span>
              </div>
            </fieldset>
          </form>
        </>
      )}
    </section>
  );
}
