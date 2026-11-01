import React from 'react';
import type { FlexibleScene } from '@elmekawy/shared/flexible';
export function AdditionalSceneFields({
  scene,
  onChange,
}: {
  scene: FlexibleScene;
  onChange: (scene: FlexibleScene) => void;
}) {
  const field = (key: string, label: string, value: string) => (
    <label className="field" key={key}>
      <span>{label}</span>
      <input
        maxLength={200}
        value={value}
        onChange={(event) =>
          onChange({
            ...scene,
            content: { ...scene.content, [key]: event.target.value },
          } as FlexibleScene)
        }
      />
    </label>
  );
  if (scene.type === 'product-hero')
    return (
      <>
        {field('headline', 'عنوان المنتج', scene.content.headline)}
        {field('tagline', 'الوصف', scene.content.tagline)}
        {field('badge', 'شارة المنتج', scene.content.badge)}
      </>
    );
  if (scene.type === 'before-after')
    return (
      <>
        {field('headline', 'عنوان المقارنة', scene.content.headline)}
        {field('beforeLabel', 'عنوان قبل', scene.content.beforeLabel)}
        {field('afterLabel', 'عنوان بعد', scene.content.afterLabel)}
      </>
    );
  if (scene.type === 'ui-demo')
    return (
      <>
        {field('headline', 'العنوان', scene.content.headline)}
        {field('appName', 'اسم التطبيق', scene.content.appName)}
        {field('caption', 'التعليق', scene.content.caption)}
        {scene.content.actions.map((action, index) => (
          <div className="actions" key={index}>
            <label className="field">
              <span>خطوة الواجهة {index + 1}</span>
              <input
                maxLength={100}
                value={action}
                onChange={(event) =>
                  onChange({
                    ...scene,
                    content: {
                      ...scene.content,
                      actions: scene.content.actions.map((value, i) =>
                        i === index ? event.target.value : value,
                      ),
                    },
                  })
                }
              />
            </label>
            <button
              disabled={scene.content.actions.length <= 1}
              onClick={() =>
                onChange({
                  ...scene,
                  content: {
                    ...scene.content,
                    actions: scene.content.actions.filter((_, i) => i !== index),
                  },
                })
              }
            >
              حذف
            </button>
          </div>
        ))}
        <button
          disabled={scene.content.actions.length >= 5}
          onClick={() =>
            onChange({
              ...scene,
              content: { ...scene.content, actions: [...scene.content.actions, 'خطوة جديدة'] },
            })
          }
        >
          ＋ خطوة واجهة
        </button>
      </>
    );
  if (scene.type === 'data-explainer')
    return (
      <>
        {field('headline', 'عنوان البيانات', scene.content.headline)}
        {field('unit', 'الوحدة', scene.content.unit)}
        {scene.content.points.map((point, index) => (
          <div className="form-grid" key={point.id}>
            <label className="field">
              <span>اسم القيمة {index + 1}</span>
              <input
                maxLength={80}
                value={point.label}
                onChange={(event) =>
                  onChange({
                    ...scene,
                    content: {
                      ...scene.content,
                      points: scene.content.points.map((value) =>
                        value.id === point.id ? { ...value, label: event.target.value } : value,
                      ),
                    },
                  })
                }
              />
            </label>
            <label className="field">
              <span>القيمة</span>
              <input
                type="number"
                min={0}
                value={point.value}
                onChange={(event) =>
                  onChange({
                    ...scene,
                    content: {
                      ...scene.content,
                      points: scene.content.points.map((value) =>
                        value.id === point.id
                          ? { ...value, value: Number(event.target.value) }
                          : value,
                      ),
                    },
                  })
                }
              />
            </label>
            <button
              disabled={scene.content.points.length <= 1}
              onClick={() =>
                onChange({
                  ...scene,
                  content: {
                    ...scene.content,
                    points: scene.content.points.filter((value) => value.id !== point.id),
                  },
                })
              }
            >
              حذف القيمة
            </button>
          </div>
        ))}
        <button
          disabled={scene.content.points.length >= 6}
          onClick={() =>
            onChange({
              ...scene,
              content: {
                ...scene.content,
                points: [
                  ...scene.content.points,
                  {
                    id: 'point-' + crypto.randomUUID().replaceAll('-', ''),
                    label: 'قيمة جديدة',
                    value: 50,
                  },
                ],
              },
            })
          }
        >
          ＋ قيمة
        </button>
      </>
    );
  return null;
}
