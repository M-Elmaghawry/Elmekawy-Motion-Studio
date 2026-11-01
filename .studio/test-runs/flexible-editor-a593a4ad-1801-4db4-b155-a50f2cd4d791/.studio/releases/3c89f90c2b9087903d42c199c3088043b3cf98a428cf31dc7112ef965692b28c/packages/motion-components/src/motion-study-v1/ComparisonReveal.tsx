import type {ReactNode} from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {brand} from "@elmekawy/shared/theme";
import {clamp, motion} from "./tokens";

export const ComparisonReveal: React.FC<{before: ReactNode; after: ReactNode}> = ({before, after}) => {
  const frame = useCurrentFrame();
  // Hold both endpoints so BEFORE and AFTER are readable, then settle on a split.
  const wipe = interpolate(frame, [0, 12, 49, 65, 89], [0, 0, 100, 100, 54], {...clamp, easing: motion.ease});
  return <div style={{position: "relative", height: 650, overflow: "hidden", border: `1px solid ${brand.light}65`, borderRadius: 24}}>
    <AbsoluteFill>{before}</AbsoluteFill>
    <AbsoluteFill style={{clipPath: `inset(0 ${100 - wipe}% 0 0)`}}>{after}</AbsoluteFill>
    <div style={{position: "absolute", top: 0, bottom: 0, left: `${wipe}%`, width: 2,
      background: brand.light, boxShadow: `0 0 25px ${brand.cyan}`}}/>
    <div style={{position: "absolute", top: 24, left: 24, right: 24, display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 650}}>
      <span style={{background: brand.ink, padding: "8px 14px", color: brand.light}}>AFTER / بعد</span>
      <span style={{background: brand.ink, padding: "8px 14px"}}>BEFORE / قبل</span>
    </div>
  </div>;
};
