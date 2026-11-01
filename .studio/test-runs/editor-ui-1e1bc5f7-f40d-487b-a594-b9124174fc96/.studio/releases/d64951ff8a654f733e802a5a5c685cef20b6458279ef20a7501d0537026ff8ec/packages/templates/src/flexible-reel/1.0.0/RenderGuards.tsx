import React, { useEffect, useLayoutEffect, useState } from 'react';
import { cancelRender, continueRender, delayRender } from 'remotion';
import type { FlexibleProject } from '@elmekawy/shared/flexible';

const loads = new Map<string, Promise<void>>();
function loadFont(family: string, url: string) {
  const key = family + '|' + url;
  if (!loads.has(key))
    loads.set(
      key,
      (async () => {
        const face = new FontFace(family, `url("${url}")`, { weight: '100 900' });
        document.fonts.add(await face.load());
      })().catch((error) => {
        loads.delete(key);
        throw error;
      }),
    );
  return loads.get(key)!;
}

// Mount text only after both exact fonts load; release capture after the layout commits.
export const FlexibleFonts: React.FC<{
  arabic: string;
  latin: string;
  children: React.ReactNode;
}> = ({ arabic, latin, children }) => {
  const [handle] = useState(() => delayRender('Flexible local fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    Promise.all([loadFont('Cairo', arabic), loadFont('Inter', latin)])
      .then(async () => {
        await Promise.all([
          document.fonts.load('800 104px Cairo'),
          document.fonts.load('400 36px Inter'),
        ]);
        await document.fonts.ready;
        if (mounted) setReady(true);
      })
      .catch(cancelRender);
    return () => {
      mounted = false;
    };
  }, [arabic, latin]);
  useLayoutEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  return ready ? <>{children}</> : null;
};

export const SafeTextGuard: React.FC<{
  preview?: boolean;
  rootId: string;
  safe: FlexibleProject['brand']['safeArea'];
  width: number;
  height: number;
  frame: number;
}> = ({ rootId, safe, width, height, frame, preview = false }) => {
  useLayoutEffect(() => {
    // DOM is committed before layout effects; a parent's forwarded ref may attach later.
    const root = document.getElementById(rootId);
    if (!root) {
      cancelRender(new Error('MISSING_SAFE_TEXT_ROOT'));
      return;
    }
    const origin = root.getBoundingClientRect();
    const scaleX = origin.width / width,
      scaleY = origin.height / height;
    if (!scaleX || !scaleY) return;
    const issues: string[] = [];
    for (const element of root.querySelectorAll<HTMLElement>('[data-safe-text]')) {
      let opacity = 1;
      for (let node: HTMLElement | null = element; node && node !== root; node = node.parentElement)
        opacity *= Number(getComputedStyle(node).opacity);
      if (opacity < 0.001 || !element.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(element);
      const boxes = [element.getBoundingClientRect(), ...range.getClientRects()];
      const overflow = boxes.some(
        (rect) =>
          rect.width > 0 &&
          ((rect.left - origin.left) / scaleX < safe.left - 1 ||
            (rect.right - origin.left) / scaleX > width - safe.right + 1 ||
            (rect.top - origin.top) / scaleY < safe.top - 1 ||
            (rect.bottom - origin.top) / scaleY > height - safe.bottom + 1),
      );
      if (overflow) {
        if (preview) {
          issues.push(element.closest('[data-scene-id]')?.getAttribute('data-scene-id') ?? 'brand');
          continue;
        }
        cancelRender(
          new Error(
            'UNSAFE_TEXT_OR_OVERFLOW: ' +
              element.closest('[data-scene-id]')?.getAttribute('data-scene-id') +
              ' / ' +
              element.textContent.slice(0, 80),
          ),
        );
        return;
      }
    }
    if (preview)
      root.dispatchEvent(
        new CustomEvent('elmekawy:layout-warning', {
          bubbles: true,
          detail: { issues: [...new Set(issues)] },
        }),
      );
  }, [rootId, safe, width, height, frame, preview]);
  return null;
};
