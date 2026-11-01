import React, { useMemo, useId } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  compileTimeline,
  scenesAtFrame,
  parseFlexibleProject,
  renderReadinessErrors,
} from '@elmekawy/shared/flexible';
import type { FlexibleRuntimeProps } from '@elmekawy/shared/flexible';
import { RenderScene } from './Scenes.tsx';
import { FlexibleFonts, SafeTextGuard } from './RenderGuards.tsx';

export const FlexibleReel: React.FC<FlexibleRuntimeProps> = ({
  project: input,
  media,
  preview = false,
}) => {
  const project = useMemo(() => parseFlexibleProject(input), [input]);
  const timeline = useMemo(() => compileTimeline(project.scenes), [project]);
  const frame = useCurrentFrame(),
    config = useVideoConfig();
  const rootId = useId();
  const missing = renderReadinessErrors(project);
  if (missing.length && !preview) throw new Error(missing.join('; '));
  const required = new Set([
    project.brand.fonts.arabicAssetId,
    project.brand.fonts.latinAssetId,
    ...project.scenes.flatMap((scene) => scene.mediaBindings.map((binding) => binding.assetId)),
  ]);
  for (const id of required) if (!media[id]) throw new Error('MISSING_MEDIA_URL:' + id);
  if (
    config.fps !== project.outputProfile.fps ||
    config.width !== project.outputProfile.width ||
    config.height !== project.outputProfile.height ||
    config.durationInFrames !== timeline.durationFrames
  )
    throw new Error('FLEXIBLE_METADATA_MISMATCH');
  const { safeArea, colors } = project.brand;
  const active = scenesAtFrame(timeline, frame);
  return (
    <FlexibleFonts
      arabic={media[project.brand.fonts.arabicAssetId]}
      latin={media[project.brand.fonts.latinAssetId]}
    >
      <AbsoluteFill
        id={rootId}
        style={{
          width: config.width,
          height: config.height,
          backgroundColor: colors.background,
          color: colors.foreground,
          fontFamily: 'Cairo, Inter, sans-serif',
          fontWeight: 400,
          direction: project.locale.direction,
          overflow: 'hidden',
        }}
      >
        {active.map((entry) => {
          const scene = project.scenes[entry.index];
          const exitStart = entry.durationFrames - scene.motion.exitFrames;
          const exitOpacity = scene.motion.exitFrames
            ? Math.min(
                1,
                (entry.durationFrames - 1 - entry.localFrame) /
                  Math.max(1, scene.motion.exitFrames - 1),
              )
            : 1;
          return (
            <AbsoluteFill
              key={entry.id}
              data-scene-id={entry.id}
              style={{ opacity: entry.opacity, backgroundColor: colors.background }}
            >
              <main
                data-safe-region
                dir={scene.direction}
                style={{
                  position: 'absolute',
                  left: safeArea.left,
                  right: safeArea.right,
                  top: safeArea.top + 100,
                  bottom: safeArea.bottom,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 36,
                  transform: 'translateZ(0)',
                  opacity: entry.localFrame >= exitStart ? Math.max(0, exitOpacity) : 1,
                }}
              >
                <RenderScene
                  scene={scene}
                  project={project}
                  media={media}
                  localFrame={entry.localFrame}
                />
              </main>
            </AbsoluteFill>
          );
        })}
        <div
          style={{
            position: 'absolute',
            left: safeArea.left,
            right: safeArea.right,
            top: safeArea.top,
            height: 56,
            fontFamily: 'Inter, Cairo',
            fontSize: 30,
            lineHeight: '56px',
            color: colors.accent,
            zIndex: 1,
          }}
        >
          <span
            data-safe-text
            dir="auto"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: 'calc(100% - 140px)',
              textAlign: 'right',
              whiteSpace: 'nowrap',
            }}
          >
            {project.brand.displayName}
          </span>
          <span
            data-safe-text
            dir="ltr"
            style={{ position: 'absolute', left: 0, top: 0, width: 120, textAlign: 'left' }}
          >
            {String(active[active.length - 1].index + 1).padStart(2, '0')} /{' '}
            {String(project.scenes.length).padStart(2, '0')}
          </span>
        </div>
        <SafeTextGuard
          preview={preview}
          rootId={rootId}
          safe={safeArea}
          width={config.width}
          height={config.height}
          frame={frame}
        />
      </AbsoluteFill>
    </FlexibleFonts>
  );
};
