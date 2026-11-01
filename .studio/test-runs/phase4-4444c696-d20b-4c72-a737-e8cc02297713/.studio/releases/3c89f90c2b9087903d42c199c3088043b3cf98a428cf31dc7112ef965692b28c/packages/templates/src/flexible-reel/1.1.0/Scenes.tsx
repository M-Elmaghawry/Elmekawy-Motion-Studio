import React from 'react';
import { Img, OffthreadVideo, useVideoConfig } from 'remotion';
import { motionProgress } from '@elmekawy/shared/flexible';
import type { FlexibleProject, FlexibleScene, MediaBinding } from '@elmekawy/shared/flexible';
import { imageLayout } from '../1.0.0/Scenes';

export function SceneMedia({
  binding,
  project,
  media,
}: {
  binding: MediaBinding;
  project: FlexibleProject;
  media: Record<string, string>;
}) {
  const asset = project.assets.find((asset) => asset.id === binding.assetId)!,
    layout = imageLayout(binding);
  return (
    <div data-media-frame style={layout.frame}>
      {asset.kind === 'video' ? (
        <OffthreadVideo
          data-media-image
          src={media[asset.id]}
          trimBefore={binding.trimStartFrame ?? 0}
          muted
          style={layout.image}
        />
      ) : (
        <Img data-media-image src={media[asset.id]} style={layout.image} />
      )}
    </div>
  );
}
export function RenderScene({
  scene,
  project,
  media,
  localFrame,
}: {
  scene: FlexibleScene;
  project: FlexibleProject;
  media: Record<string, string>;
  localFrame: number;
}) {
  const { height } = useVideoConfig(),
    short = height < 1500,
    { colors } = project.brand;
  const font = short ? 50 : 92,
    small = short ? 26 : 36;
  const heading: React.CSSProperties = {
    margin: 0,
    fontSize: font,
    fontWeight: 800,
    lineHeight: 1.4,
    overflowWrap: 'anywhere',
  };
  const paragraph: React.CSSProperties = {
    margin: 0,
    fontSize: small,
    lineHeight: 1.55,
    overflowWrap: 'anywhere',
  };
  const p = (index = 0) =>
    motionProgress(
      localFrame - index * scene.motion.staggerFrames,
      scene.motion.enterFrames,
      scene.motion.easing,
    );
  const enter = (index = 0): React.CSSProperties => ({
    opacity: p(index),
    transform: scene.motion.reducedMotion ? 'none' : `translateY(${(1 - p(index)) * 24}px)`,
  });
  const title = (value: string) => (
    <h1 data-safe-text style={{ ...heading, ...enter() }}>
      <bdi dir="auto">{value}</bdi>
    </h1>
  );
  const caption = (value: string) => (
    <p data-safe-text style={{ ...paragraph, color: colors.muted }}>
      <bdi dir="auto">{value}</bdi>
    </p>
  );
  const viewport = (binding: MediaBinding, extra: React.CSSProperties = {}) => (
    <div
      data-media-viewport
      style={{
        position: 'relative',
        width: '100%',
        height: short ? 290 : 650,
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius: 24,
        background: colors.surface,
        ...extra,
      }}
    >
      <SceneMedia binding={binding} project={project} media={media} />
    </div>
  );
  switch (scene.type) {
    case 'kinetic-title':
      return (
        <>
          <h1 data-safe-text style={heading}>
            {scene.content.headline
              .trim()
              .split(/\s+/u)
              .map((word, index) => (
                <span
                  key={index}
                  style={{ display: 'inline-block', marginInlineEnd: '0.24em', ...enter(index) }}
                >
                  <bdi dir="auto">{word}</bdi>
                </span>
              ))}
          </h1>
          {scene.content.subtitle && caption(scene.content.subtitle)}
        </>
      );
    case 'stat-proof':
      return (
        <>
          {caption(scene.content.label)}
          <strong
            data-safe-text
            dir="ltr"
            style={{
              fontFamily: 'Inter,Cairo',
              fontSize: short ? 110 : 190,
              lineHeight: 1.3,
              color: colors.accent,
            }}
          >
            <bdi>
              {scene.content.prefix +
                new Intl.NumberFormat(project.locale.language, { maximumFractionDigits: 2 }).format(
                  scene.content.value * p(),
                ) +
                scene.content.suffix}
            </bdi>
          </strong>
          {caption(scene.content.sourceNote)}
        </>
      );
    case 'media-showcase':
      return (
        <>
          {title(scene.content.headline)}
          {viewport(scene.mediaBindings[0])}
          {caption(scene.content.caption)}
        </>
      );
    case 'product-hero':
      return (
        <>
          {caption(scene.content.badge)}
          {title(scene.content.headline)}
          {viewport(scene.mediaBindings[0], {
            transform: scene.motion.reducedMotion ? 'none' : `scale(${0.95 + 0.05 * p()})`,
          })}
          {caption(scene.content.tagline)}
        </>
      );
    case 'before-after':
      return (
        <>
          {title(scene.content.headline)}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {scene.mediaBindings.map((binding, index) => (
              <div key={binding.slot} style={{ ...enter(index) }}>
                {viewport(binding, { height: short ? 280 : 650 })}
                {caption(index ? scene.content.afterLabel : scene.content.beforeLabel)}
              </div>
            ))}
          </div>
        </>
      );
    case 'ui-demo':
      return (
        <>
          {title(scene.content.headline)}
          <div
            style={{
              display: 'flex',
              gap: 28,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
            }}
          >
            <div
              style={{
                border: `8px solid ${colors.muted}`,
                borderRadius: 32,
                padding: 12,
                width: short ? 220 : 460,
                background: colors.surface,
                flexShrink: 0,
              }}
            >
              <p
                data-safe-text
                style={{ ...paragraph, textAlign: 'center', fontSize: short ? 22 : 30 }}
              >
                {scene.content.appName}
              </p>
              {viewport(scene.mediaBindings[0], { height: short ? 260 : 560, borderRadius: 18 })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {scene.content.actions.map((action, index) => (
                <div
                  key={index}
                  style={{
                    ...enter(index),
                    border: `1px solid ${colors.accent}`,
                    padding: short ? 12 : 20,
                    borderRadius: 12,
                  }}
                >
                  {caption(`${index + 1}. ${action}`)}
                </div>
              ))}
            </div>
          </div>
          {caption(scene.content.caption)}
        </>
      );
    case 'data-explainer': {
      const max = Math.max(1, ...scene.content.points.map((point) => point.value));
      return (
        <>
          {title(scene.content.headline)}
          <div style={{ display: 'flex', flexDirection: 'column', gap: short ? 12 : 24 }}>
            {scene.content.points.map((point, index) => (
              <div key={point.id}>
                {caption(point.label)}
                <div
                  style={{
                    height: short ? 34 : 58,
                    background: colors.surface,
                    borderRadius: 12,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(point.value / max) * p(index) * 100}%`,
                      background: colors.accent,
                    }}
                  />
                  <span
                    data-safe-text
                    style={{
                      position: 'absolute',
                      inset: 0,
                      textAlign: 'center',
                      fontSize: short ? 23 : 34,
                      color: colors.foreground,
                      fontFamily: 'Inter,Cairo',
                    }}
                  >
                    {Math.round(point.value * p(index))}
                    {scene.content.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }
    case 'process-flow':
      return (
        <>
          {title(scene.content.headline)}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: short && scene.content.steps.length > 3 ? '1fr 1fr' : '1fr',
              gap: short ? 12 : 18,
            }}
          >
            {scene.content.steps.map((step, index) => (
              <div
                key={step.id}
                style={{
                  ...enter(index),
                  border: `1px solid ${colors.accent}`,
                  borderRadius: 18,
                  padding: short ? '10px 16px' : '20px 28px',
                  background: colors.surface,
                }}
              >
                <p data-safe-text style={{ ...paragraph, fontSize: short ? 25 : 38 }}>
                  <bdi>{index + 1}. </bdi>
                  <bdi dir="auto">{step.label}</bdi>
                </p>
              </div>
            ))}
          </div>
        </>
      );
    case 'offer-cta':
      return (
        <>
          {title(scene.content.headline)}
          {scene.content.offer && caption(scene.content.offer)}
          <p
            data-safe-text
            style={{
              ...paragraph,
              ...enter(),
              fontSize: short ? 42 : 62,
              color: colors.accent,
              fontWeight: 800,
            }}
          >
            <bdi dir="auto">{scene.content.action}</bdi>
          </p>
          {caption(scene.content.contact)}
        </>
      );
  }
}
