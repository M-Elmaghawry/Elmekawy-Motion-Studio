import type {ReactNode} from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {cameraPush, parallax} from "./presets";

export const LayeredScene: React.FC<{
  background: ReactNode; midground: ReactNode; foreground: ReactNode; duration: number;
}> = ({background, midground, foreground, duration}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{overflow: "hidden", scale: cameraPush(frame, duration)}}>
    <AbsoluteFill style={{translate: `0 ${parallax(frame, duration, 6)}px`}}>{background}</AbsoluteFill>
    <AbsoluteFill style={{translate: `${parallax(frame, duration, -12)}px 0`}}>{midground}</AbsoluteFill>
    <AbsoluteFill style={{translate: `${parallax(frame, duration, 24)}px ${parallax(frame, duration, 12)}px`}}>{foreground}</AbsoluteFill>
  </AbsoluteFill>;
};
