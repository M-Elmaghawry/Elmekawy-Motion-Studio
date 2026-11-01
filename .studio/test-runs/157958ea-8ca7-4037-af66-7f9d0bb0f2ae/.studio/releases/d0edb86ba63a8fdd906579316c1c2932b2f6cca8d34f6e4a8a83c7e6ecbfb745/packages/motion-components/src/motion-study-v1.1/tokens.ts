import {Easing} from "remotion";

export const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
export const motion = {
  fps: 30,
  duration: 360,
  reveal: 18,
  stagger: 5,
  spring: {damping: 19, stiffness: 150, mass: 0.8},
  ease: Easing.bezier(0.16, 1, 0.3, 1),
  safe: {left: 100, right: 180, top: 220, bottom: 360},
} as const;
