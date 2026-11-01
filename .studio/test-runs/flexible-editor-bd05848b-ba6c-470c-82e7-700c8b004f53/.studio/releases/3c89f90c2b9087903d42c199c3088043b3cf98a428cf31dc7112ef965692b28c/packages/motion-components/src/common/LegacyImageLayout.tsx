import React, { createContext, useContext, useId } from 'react';
import type { LegacyImageLayouts } from '@elmekawy/shared';
import { defaultImageLayout } from '@elmekawy/shared';

const LayoutContext = createContext<{
  layouts: LegacyImageLayouts;
  media: Record<string, string>;
  keys: Record<string, string>;
}>({ layouts: {}, media: {}, keys: {} });
export const LegacyImageLayoutProvider = LayoutContext.Provider;
// Only opt-in template 1.2.0 mounts this scope. Identity emits no CSS at all.
export function LegacyImageScope({
  sceneId,
  children,
}: {
  sceneId: string;
  children: React.ReactNode;
}) {
  const { layouts, media, keys } = useContext(LayoutContext),
    id = useId();
  const rules = Object.entries(layouts[sceneId] ?? {}).flatMap(([assetId, value]) => {
    if (
      JSON.stringify(value) ===
      JSON.stringify(defaultImageLayout(assetId === 'logo' ? 'contain' : 'cover'))
    )
      return [];
    const url = media[keys[assetId]];
    if (!url) return [];
    const { frame, transform, focalPoint } = value;
    return [
      `[data-image-scope=${JSON.stringify(id)}] img[src=${JSON.stringify(url)}]{position:absolute!important;left:${frame.x * 100}%!important;top:${frame.y * 100}%!important;width:${frame.width * 100}%!important;height:${frame.height * 100}%!important;object-fit:${value.fit}!important;object-position:${focalPoint.x * 100}% ${focalPoint.y * 100}%!important;transform:translate(-50%,-50%) translate(${transform.offsetX * 100}%,${transform.offsetY * 100}%) scale(${transform.scale})!important;transform-origin:${focalPoint.x * 100}% ${focalPoint.y * 100}%!important;}`,
    ];
  });
  return (
    <div data-image-scope={id} style={{ display: 'contents' }}>
      {rules.length > 0 && <style>{rules.join('\n')}</style>}
      {children}
    </div>
  );
}
