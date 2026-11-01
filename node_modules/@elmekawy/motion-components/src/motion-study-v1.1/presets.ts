import {interpolate, spring} from "remotion";
import {clamp, motion} from "./tokens";

export const fade = (frame: number, delay = 0, duration = motion.reveal) =>
  interpolate(frame - delay, [0, duration], [0, 1], clamp);
export const maskReveal = (frame: number, delay = 0) =>
  interpolate(frame - delay, [0, motion.reveal], [100, 0], {...clamp, easing: motion.ease});
export const overshoot = (frame: number, fps: number, delay = 0) =>
  spring({frame: frame - delay, fps, config: motion.spring});
export const cameraPush = (frame: number, duration: number) =>
  interpolate(frame, [0, duration - 1], [1, 1.075], clamp);
export const parallax = (frame: number, duration: number, depth: number) =>
  interpolate(frame, [0, duration - 1], [depth, -depth], clamp);
export const stagger = (index: number, delay = 0) => delay + index * motion.stagger;
// A shared shape changes bounds and corner radius; no non-deterministic DOM morph.
export const morph = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {...clamp, easing: motion.ease});
