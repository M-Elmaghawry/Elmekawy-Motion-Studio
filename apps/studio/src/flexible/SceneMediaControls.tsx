import React, { useState } from 'react';
import { ImageControls } from './ImageControls';
import type { FlexibleProject, FlexibleScene } from '@elmekawy/shared/flexible';
export function SceneMediaControls({
  project,
  scene,
  media,
  disabled,
  onChange,
  onUpload,
  onReview,
}: {
  project: FlexibleProject;
  scene: FlexibleScene;
  media: Record<string, string>;
  disabled: boolean;
  onChange: (scene: FlexibleScene) => void;
  onUpload: (file: File, slot: number) => void;
  onReview: (assetId: string, note: string, approved: boolean) => void;
}) {
  const [slot, setSlot] = useState(0),
    [note, setNote] = useState('');
  const index = Math.min(slot, scene.mediaBindings.length - 1),
    binding = scene.mediaBindings[index],
    asset = project.assets.find((asset) => asset.id === binding?.assetId);
  if (!binding || !asset) return null;
  const replace = (value: typeof binding) =>
    onChange({
      ...scene,
      mediaBindings: scene.mediaBindings.map((item, i) => (i === index ? value : item)),
    });
  const videoEnabled = project.schemaVersion === '2.1.0' && scene.type === 'media-showcase';
  return (
    <section className="scene-media-controls" data-testid="scene-media-controls">
      <h3>حجم الصورة أو الفيديو وموضعه في المشهد</h3>
      <fieldset disabled={disabled}>
        {scene.mediaBindings.length > 1 && (
          <label className="field">
            <span>الصورة المراد تعديلها</span>
            <select
              value={index}
              onChange={(event) => {
                setSlot(Number(event.target.value));
                setNote('');
              }}
            >
              {scene.mediaBindings.map((item, i) => (
                <option value={i} key={i}>
                  {item.slot === 'before'
                    ? 'صورة قبل'
                    : item.slot === 'after'
                      ? 'صورة بعد'
                      : 'الصورة'}
                </option>
              ))}
            </select>
          </label>
        )}
        <ImageControls
          key={scene.id + index}
          binding={binding}
          disabled={disabled}
          onChange={(value) =>
            replace({
              ...value,
              slot: binding.slot,
              ...(asset.kind === 'video' ? { trimStartFrame: binding.trimStartFrame ?? 0 } : {}),
            })
          }
        />
        <div className="asset">
          {asset.kind === 'video' ? (
            <video controls src={media[asset.id]} style={{ maxWidth: 160, maxHeight: 100 }} />
          ) : (
            <img src={media[asset.id]} alt="الصورة المستخدمة في المشهد" />
          )}
          <div className="asset-description">
            <strong>{asset.approval === 'approved' ? 'وسائط معتمدة' : 'بانتظار المراجعة'}</strong>
            <small>{(asset.byteSize / 1024 / 1024).toFixed(2)} MB</small>
            <label className="upload-button">
              رفع {videoEnabled ? 'صورة أو فيديو' : 'صورة'} بديلة
              <input
                data-testid="editor-image-file"
                type="file"
                disabled={disabled}
                accept={'image/png,image/jpeg,image/webp' + (videoEnabled ? ',video/mp4' : '')}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUpload(file, index);
                  event.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
        <label className="field">
          <span>اختيار ملف محفوظ بالمشروع</span>
          <select
            value={asset.id}
            onChange={(event) => {
              const next = project.assets.find((asset) => asset.id === event.target.value)!;
              const { trimStartFrame: _trim, ...rest } = binding;
              replace({
                ...rest,
                assetId: next.id,
                assetSha256: next.sha256,
                ...(next.kind === 'video' ? { trimStartFrame: 0 } : {}),
              });
              setNote('');
            }}
          >
            {project.assets
              .filter((asset) => asset.kind === 'image' || (videoEnabled && asset.kind === 'video'))
              .map((asset, i) => (
                <option key={asset.id} value={asset.id}>
                  {asset.kind === 'video' ? 'فيديو' : 'صورة'} {i + 1} ·{' '}
                  {asset.approval === 'approved' ? 'معتمد' : 'بانتظار المراجعة'}
                </option>
              ))}
          </select>
        </label>
        {asset.kind === 'video' && (
          <label className="field">
            <span>القص من بداية الفيديو · ثانية</span>
            <input
              type="number"
              min={0}
              max={asset.metadata?.durationSeconds}
              step={1 / project.outputProfile.fps}
              value={(binding.trimStartFrame ?? 0) / project.outputProfile.fps}
              onChange={(event) =>
                replace({
                  ...binding,
                  trimStartFrame: Math.round(
                    Number(event.target.value) * project.outputProfile.fps,
                  ),
                })
              }
            />
          </label>
        )}
        <label className="field">
          <span>المصدر وملاحظات المراجعة</span>
          <textarea
            maxLength={1000}
            value={note || asset.sourceNote}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <button
          data-testid="approve-image"
          disabled={disabled || !(note || asset.sourceNote).trim()}
          onClick={() =>
            onReview(asset.id, note || asset.sourceNote, asset.approval !== 'approved')
          }
        >
          {asset.approval === 'approved' ? 'إلغاء الاعتماد' : 'اعتماد الملف بعد المراجعة'}
        </button>
      </fieldset>
    </section>
  );
}
