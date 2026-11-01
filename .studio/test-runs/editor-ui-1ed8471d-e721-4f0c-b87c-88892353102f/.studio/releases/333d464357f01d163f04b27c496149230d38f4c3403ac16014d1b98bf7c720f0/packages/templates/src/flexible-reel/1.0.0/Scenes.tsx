import React from 'react';
import { Img } from 'remotion';
import { motionProgress } from '@elmekawy/shared/flexible';
import type {
  FlexibleProject,
  FlexibleScene,
  ImplementedType,
  SceneData,
  MediaBinding,
} from '@elmekawy/shared/flexible';

type SceneProps<K extends ImplementedType> = {
  scene: SceneData<K>;
  project: FlexibleProject;
  media: Record<string, string>;
  localFrame: number;
};
const heading: React.CSSProperties = {
  margin: 0,
  fontSize: 104,
  fontWeight: 800,
  lineHeight: 1.55,
  overflowWrap: 'anywhere',
};
const paragraph: React.CSSProperties = {
  margin: 0,
  fontSize: 36,
  lineHeight: 1.8,
  overflowWrap: 'anywhere',
};
const text = (value: string) => <bdi dir="auto">{value}</bdi>;
function progress(scene: FlexibleScene, frame: number, index = 0) {
  return motionProgress(
    frame - index * scene.motion.staggerFrames,
    scene.motion.enterFrames,
    scene.motion.easing,
  );
}
function enter(scene: FlexibleScene, frame: number, index = 0): React.CSSProperties {
  const value = progress(scene, frame, index);
  return {
    opacity: value,
    transform: scene.motion.reducedMotion ? 'none' : `translateY(${(1 - value) * 36}px)`,
  };
}

export function imageLayout(binding: MediaBinding): {
  frame: React.CSSProperties;
  image: React.CSSProperties;
} {
  return {
    frame: {
      position: 'absolute',
      left: `${binding.frame.x * 100}%`,
      top: `${binding.frame.y * 100}%`,
      width: `${binding.frame.width * 100}%`,
      height: `${binding.frame.height * 100}%`,
      transform: 'translate(-50%, -50%)',
      overflow: 'hidden',
      borderRadius: 32,
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: binding.fit,
      objectPosition: `${binding.focalPoint.x * 100}% ${binding.focalPoint.y * 100}%`,
      transform: `translate(${binding.transform.offsetX * 100}%, ${binding.transform.offsetY * 100}%) scale(${binding.transform.scale})`,
      transformOrigin: `${binding.focalPoint.x * 100}% ${binding.focalPoint.y * 100}%`,
    },
  };
}

const KineticTitle: React.FC<SceneProps<'kinetic-title'>> = ({ scene, project, localFrame }) => (
  <>
    <h1 data-safe-text style={heading} dir={scene.direction}>
      {scene.content.headline
        .trim()
        .split(/\s+/u)
        .map((word, index) => (
          <span
            key={index}
            style={{
              display: 'inline-block',
              marginInlineEnd: '0.24em',
              ...enter(scene, localFrame, index),
            }}
          >
            {text(word)}
          </span>
        ))}
    </h1>
    {scene.content.subtitle && (
      <p
        data-safe-text
        style={{ ...paragraph, color: project.brand.colors.accent, ...enter(scene, localFrame) }}
      >
        {text(scene.content.subtitle)}
      </p>
    )}
  </>
);
const StatProof: React.FC<SceneProps<'stat-proof'>> = ({ scene, project, localFrame }) => {
  const value = scene.content.value * progress(scene, localFrame);
  const formatted = new Intl.NumberFormat(project.locale.language, {
    maximumFractionDigits: Number.isInteger(scene.content.value) ? 0 : 2,
  }).format(value);
  return (
    <>
      <p data-safe-text style={{ ...paragraph, ...enter(scene, localFrame) }}>
        {text(scene.content.label)}
      </p>
      <strong
        data-safe-text
        dir="ltr"
        style={{
          fontSize: 200,
          lineHeight: 1.4,
          fontFamily: 'Inter, Cairo',
          color: project.brand.colors.accent,
          overflowWrap: 'anywhere',
        }}
      >
        {text(scene.content.prefix + formatted + scene.content.suffix)}
      </strong>
      <p data-safe-text style={{ ...paragraph, fontSize: 30, color: project.brand.colors.muted }}>
        {text(scene.content.sourceNote)}
      </p>
    </>
  );
};
const MediaShowcase: React.FC<SceneProps<'media-showcase'>> = ({
  scene,
  project,
  media,
  localFrame,
}) => {
  const binding = scene.mediaBindings[0],
    layout = imageLayout(binding);
  const pan = scene.motion.reducedMotion
    ? 1
    : 1 + 0.05 * Math.min(1, localFrame / Math.max(1, scene.durationFrames - 1));
  return (
    <>
      <h1 data-safe-text style={{ ...heading, fontSize: 84, ...enter(scene, localFrame) }}>
        {text(scene.content.headline)}
      </h1>
      <div
        data-media-viewport
        style={{
          position: 'relative',
          height: 700,
          flexShrink: 0,
          width: '100%',
          overflow: 'hidden',
          background: project.brand.colors.surface,
        }}
      >
        <div data-media-frame style={layout.frame}>
          <Img
            data-media-image
            src={media[binding.assetId]}
            style={{ ...layout.image, transform: `${layout.image.transform} scale(${pan})` }}
          />
        </div>
      </div>
      <p data-safe-text style={{ ...paragraph, fontSize: 30, color: project.brand.colors.muted }}>
        {text(scene.content.caption)}
      </p>
    </>
  );
};
const ProcessFlow: React.FC<SceneProps<'process-flow'>> = ({ scene, project, localFrame }) => (
  <>
    <h1 data-safe-text style={{ ...heading, fontSize: 84 }}>
      {text(scene.content.headline)}
    </h1>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {scene.content.steps.map((step, index) => (
        <div
          key={step.id}
          style={{
            border: `2px solid ${project.brand.colors.accent}`,
            borderRadius: 24,
            background: project.brand.colors.surface,
            padding: '12px 28px',
            display: 'flex',
            gap: 28,
            alignItems: 'center',
            ...enter(scene, localFrame, index),
          }}
        >
          <bdi
            data-safe-text
            dir="ltr"
            style={{ fontSize: 38, color: project.brand.colors.accent }}
          >
            {String(index + 1).padStart(2, '0')}
          </bdi>
          <p
            data-safe-text
            style={{ ...paragraph, fontSize: scene.content.steps.length > 5 ? 30 : 42 }}
          >
            {text(step.label)}
          </p>
        </div>
      ))}
    </div>
  </>
);
const OfferCTA: React.FC<SceneProps<'offer-cta'>> = ({ scene, project, localFrame }) => (
  <>
    <h1 data-safe-text style={{ ...heading, ...enter(scene, localFrame) }}>
      {text(scene.content.headline)}
    </h1>
    {scene.content.offer && (
      <p data-safe-text style={paragraph}>
        {text(scene.content.offer)}
      </p>
    )}
    <p
      data-safe-text
      style={{
        ...paragraph,
        fontSize: 60,
        fontWeight: 800,
        color: project.brand.colors.accent,
        ...enter(scene, localFrame),
      }}
    >
      {text(scene.content.action)}
    </p>
    <p data-safe-text style={{ ...paragraph, fontFamily: 'Inter, Cairo' }} dir="auto">
      {text(scene.content.contact)}
    </p>
  </>
);

export const sceneComponents = {
  'kinetic-title': KineticTitle,
  'stat-proof': StatProof,
  'media-showcase': MediaShowcase,
  'process-flow': ProcessFlow,
  'offer-cta': OfferCTA,
} satisfies { [K in ImplementedType]: React.FC<SceneProps<K>> };

export const RenderScene: React.FC<{
  scene: FlexibleScene;
  project: FlexibleProject;
  media: Record<string, string>;
  localFrame: number;
}> = ({ scene, ...props }) => {
  switch (scene.type) {
    case 'kinetic-title':
      return <KineticTitle scene={scene} {...props} />;
    case 'stat-proof':
      return <StatProof scene={scene} {...props} />;
    case 'media-showcase':
      return <MediaShowcase scene={scene} {...props} />;
    case 'process-flow':
      return <ProcessFlow scene={scene} {...props} />;
    case 'offer-cta':
      return <OfferCTA scene={scene} {...props} />;
  }
};
