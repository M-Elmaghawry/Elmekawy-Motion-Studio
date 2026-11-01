import React from 'react';
import type { FlexibleProject, PromptWorkspaceRecord } from '@elmekawy/shared/flexible';
import { sceneLabels } from '@elmekawy/shared/flexible';
export function PromptWorkspace({
  project,
  disabled,
  onChange,
  onUpload,
  onReview,
  onNotice,
  onError,
}: {
  project: FlexibleProject;
  disabled: boolean;
  onChange: (project: FlexibleProject) => void;
  onUpload: (file: File, prompt: PromptWorkspaceRecord) => void;
  onReview: (assetId: string, note: string, approved: boolean) => void;
  onNotice: (message: string) => void;
  onError: (error: unknown) => void;
}) {
  const prompts = project.prompts ?? [];
  const edit = (id: string, values: Partial<PromptWorkspaceRecord>) =>
    onChange({
      ...project,
      prompts: prompts.map((prompt) => (prompt.id === id ? { ...prompt, ...values } : prompt)),
    });
  async function copy(prompt: PromptWorkspaceRecord) {
    try {
      await navigator.clipboard.writeText(
        prompt.text +
          (prompt.negativeConstraints ? '\n\nتجنّب: ' + prompt.negativeConstraints : ''),
      );
      if (prompt.status === 'draft') edit(prompt.id, { status: 'ready-to-copy' });
      onNotice('تم النسخ. ولّد الصورة يدويًا خارج الاستوديو ثم ارفعها هنا.');
    } catch (error) {
      onError(error);
    }
  }
  return (
    <section className="panel" id="prompt-workspace" data-testid="prompt-workspace">
      <h2>ورشة البرومبتات اليدوية</h2>
      <p className="inline-note">
        اكتب وانسخ، ثم ولّد وحمّل الملف يدويًا في الموقع الذي تختاره وارفعه هنا.
      </p>
      {prompts.map((prompt) => {
        const asset = project.assets.find((asset) => asset.id === prompt.assetId);
        return (
          <fieldset key={prompt.id} disabled={disabled} className="prompt-record">
            <label className="field">
              <span>المشهد المرتبط</span>
              <select
                value={prompt.sceneId}
                onChange={(event) => edit(prompt.id, { sceneId: event.target.value })}
              >
                {project.scenes.map((scene, index) => (
                  <option key={scene.id} value={scene.id}>
                    {index + 1}. {sceneLabels[scene.type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>البرومبت</span>
              <textarea
                data-testid="prompt-text"
                maxLength={20000}
                rows={5}
                dir="auto"
                value={prompt.text}
                onChange={(event) =>
                  edit(prompt.id, {
                    text: event.target.value,
                    status: asset ? 'uploaded' : 'draft',
                  })
                }
              />
            </label>
            <label className="field">
              <span>القيود والعناصر غير المطلوبة</span>
              <textarea
                maxLength={5000}
                value={prompt.negativeConstraints}
                onChange={(event) => edit(prompt.id, { negativeConstraints: event.target.value })}
              />
            </label>
            <label className="field">
              <span>المصدر وملاحظات المراجعة</span>
              <input
                maxLength={1000}
                value={prompt.source}
                onChange={(event) => edit(prompt.id, { source: event.target.value })}
              />
            </label>
            <p className="inline-note">
              الحالة:{' '}
              {
                {
                  draft: 'مسودة',
                  'ready-to-copy': 'جاهز للنسخ',
                  uploaded: 'ملف مرفوع',
                  approved: 'معتمد',
                }[prompt.status]
              }
            </p>
            <div className="actions">
              <button disabled={!prompt.text.trim()} onClick={() => void copy(prompt)}>
                نسخ البرومبت
              </button>
              <label className="upload-button">
                رفع نتيجة يدوية
                <input
                  data-testid="prompt-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,video/mp4"
                  disabled={disabled}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onUpload(file, prompt);
                    event.target.value = '';
                  }}
                />
              </label>
              {asset && (
                <button
                  disabled={!prompt.source.trim()}
                  onClick={() => onReview(asset.id, prompt.source, asset.approval !== 'approved')}
                >
                  {asset.approval === 'approved' ? 'إلغاء الاعتماد' : 'اعتماد النتيجة'}
                </button>
              )}
              <button
                onClick={() =>
                  onChange({ ...project, prompts: prompts.filter((item) => item.id !== prompt.id) })
                }
              >
                حذف البرومبت
              </button>
            </div>
          </fieldset>
        );
      })}
      <button
        data-testid="add-prompt"
        disabled={disabled || prompts.length >= 100}
        onClick={() =>
          onChange({
            ...project,
            prompts: [
              ...prompts,
              {
                id: 'prompt-' + crypto.randomUUID().replaceAll('-', ''),
                sceneId: project.scenes[0].id,
                text: '',
                negativeConstraints: '',
                source: '',
                status: 'draft',
                assetId: null,
              },
            ],
          })
        }
      >
        ＋ برومبت مرتبط بمشهد
      </button>
    </section>
  );
}
