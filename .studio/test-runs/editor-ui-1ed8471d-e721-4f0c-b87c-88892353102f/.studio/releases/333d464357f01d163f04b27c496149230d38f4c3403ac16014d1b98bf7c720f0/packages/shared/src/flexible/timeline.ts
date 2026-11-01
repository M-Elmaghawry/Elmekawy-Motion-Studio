import type { TransitionSpec } from './types.ts';
export type TimelineInput = { id: string; durationFrames: number; transitionOut: TransitionSpec };
export type TimelineEntry = {
  id: string;
  index: number;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  incomingFrames: number;
};
export type Timeline = { durationFrames: number; scenes: TimelineEntry[] };

export function compileTimeline(scenes: readonly TimelineInput[]): Timeline {
  if (!scenes.length) throw new Error('EMPTY_TIMELINE');
  const ids = new Set<string>();
  let startFrame = 0;
  const entries = scenes.map((scene, index) => {
    if (!scene.id || ids.has(scene.id)) throw new Error('DUPLICATE_SCENE_ID');
    ids.add(scene.id);
    const duration = scene.durationFrames,
      outgoing = scene.transitionOut.durationFrames;
    const incoming = index ? scenes[index - 1].transitionOut.durationFrames : 0;
    if (!Number.isSafeInteger(duration) || duration < 1) throw new Error('INVALID_SCENE_DURATION');
    if (
      !Number.isSafeInteger(outgoing) ||
      outgoing < 0 ||
      (scene.transitionOut.type === 'cut'
        ? outgoing !== 0
        : scene.transitionOut.type !== 'crossfade' || outgoing < 2)
    )
      throw new Error('INVALID_TRANSITION');
    if (index === scenes.length - 1 && outgoing !== 0) throw new Error('LAST_SCENE_MUST_CUT');
    if (incoming + outgoing >= duration) throw new Error('OVERLAP_CONSUMES_SCENE');
    const entry = {
      id: scene.id,
      index,
      startFrame,
      endFrame: startFrame + duration,
      durationFrames: duration,
      incomingFrames: incoming,
    };
    if (!Number.isSafeInteger(entry.endFrame)) throw new Error('TIMELINE_TOO_LONG');
    startFrame = entry.endFrame - outgoing;
    return entry;
  });
  return { durationFrames: entries[entries.length - 1].endFrame, scenes: entries };
}

export function scenesAtFrame(timeline: Timeline, frame: number) {
  if (!Number.isInteger(frame) || frame < 0 || frame >= timeline.durationFrames)
    throw new Error('FRAME_OUT_OF_RANGE');
  return timeline.scenes
    .filter((scene) => frame >= scene.startFrame && frame < scene.endFrame)
    .map((scene) => {
      const localFrame = frame - scene.startFrame;
      const opacity =
        scene.incomingFrames && localFrame < scene.incomingFrames
          ? localFrame / (scene.incomingFrames - 1)
          : 1;
      return { ...scene, localFrame, opacity };
    });
}

export function motionProgress(frame: number, enterFrames: number, easing: 'linear' | 'ease-out') {
  const value = Math.min(1, Math.max(0, frame / Math.max(1, enterFrames - 1)));
  return easing === 'ease-out' ? 1 - (1 - value) ** 3 : value;
}
