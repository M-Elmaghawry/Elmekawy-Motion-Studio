import React, { useEffect, useState } from 'react';
import { defaultImageLayout, legacySceneImageRoles } from '@elmekawy/shared';
import type { Project, EditableProject, Descriptor } from '@elmekawy/shared';
import { ImageControls } from './flexible/ImageControls';
import './flexible/flexible.css';

export function LegacyImageControls({
  project,
  draft,
  descriptor,
  sceneId,
  disabled,
  onChange,
  onEnable,
}: {
  project: Project;
  draft: EditableProject;
  descriptor: Descriptor;
  sceneId: string;
  disabled: boolean;
  onChange: (value: EditableProject) => void;
  onEnable: () => void;
}) {
  const roles = legacySceneImageRoles[project.template.id][sceneId] ?? [];
  const assets = project.assets.filter(
    (asset) => roles.includes(asset.role) && asset.state !== 'retired',
  );
  const [selected, setSelected] = useState('');
  useEffect(() => setSelected(assets[0]?.id ?? ''), [sceneId, project.id]);
  const asset = assets.find((asset) => asset.id === selected) ?? assets[0];
  return (
    <section className="flexible panel legacy-images" data-testid="legacy-image-panel">
      <h2>حجم الصورة وموضعها في المشهد</h2>
      {project.template.version !== '1.2.0' ? (
        <>
          <p>فعّل أدوات الصور في نسخة مستقلة من المشروع. تظل النسخة الأصلية محفوظة.</p>
          <button data-testid="enable-legacy-images" disabled={disabled} onClick={onEnable}>
            إنشاء نسخة تدعم التحكم بالصور
          </button>
        </>
      ) : !asset ? (
        <p className="inline-note">
          المشهد المحدد لا يحتوي على صورة. اختر مشهدًا به صورة من القائمة.
        </p>
      ) : (
        <>
          <label className="field">
            <span>الصورة داخل هذا المشهد</span>
            <select
              data-testid="legacy-image-select"
              value={asset.id}
              onChange={(event) => setSelected(event.target.value)}
            >
              {assets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))}
            </select>
          </label>
          {asset.state === 'missing' ? (
            <p>ارفع الصورة من تبويب الوسائط أولًا.</p>
          ) : (
            <>
              <img
                src={descriptor.inputProps.media[asset.mediaKey]}
                alt={asset.displayName}
                style={{ maxHeight: 130, maxWidth: '100%', objectFit: 'contain' }}
              />
              <ImageControls
                key={sceneId + asset.id}
                resetFit={asset.role === 'logo' ? 'contain' : 'cover'}
                disabled={disabled}
                binding={{
                  slot: 'image',
                  assetId: asset.id,
                  assetSha256: asset.sha256!,
                  ...(draft.imageLayouts?.[sceneId]?.[asset.id] ??
                    defaultImageLayout(asset.role === 'logo' ? 'contain' : 'cover')),
                }}
                onChange={({ slot: _slot, assetId: _id, assetSha256: _hash, ...layout }) =>
                  onChange({
                    ...draft,
                    imageLayouts: {
                      ...draft.imageLayouts,
                      [sceneId]: { ...draft.imageLayouts?.[sceneId], [asset.id]: layout },
                    },
                  })
                }
              />
            </>
          )}
        </>
      )}
    </section>
  );
}
