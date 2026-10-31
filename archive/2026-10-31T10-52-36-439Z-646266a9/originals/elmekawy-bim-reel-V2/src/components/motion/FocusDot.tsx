import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {brand} from "../../brand/theme";
import {clamp, motion} from "../../motion/tokens";

// Mounted outside scene Sequences: the same light crosses every scene boundary.
export const FocusDot: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const keys = [0, 20, 48, 75, 118, 150, 195, 225, 245, 262, 280, 299, 320, 359];
  return <div style={{position: "absolute", pointerEvents: "none", zIndex: 10,
    left: interpolate(frame, keys, [890, 850, 710, 350, 735, 735, 480, 154, 154, 154, 154, 154, 500, 500], {...clamp, easing: motion.ease}),
    top: interpolate(frame, keys, [465, 465, 1090, 1010, 1010, 1030, 1030, 744, 744, 924, 1104, 1284, 670, 670], {...clamp, easing: motion.ease}),
    width: 14, height: 14, margin: -7, borderRadius: "50%", background: brand.light,
    scale: 1 + Math.sin(frame / fps * Math.PI * 2) * 0.13,
    boxShadow: `0 0 18px ${brand.light}, 0 0 55px ${brand.cyan}90`}}>
    <div style={{position: "absolute", inset: -16, border: `1px solid ${brand.light}55`, borderRadius: "50%"}}/>
  </div>;
};
