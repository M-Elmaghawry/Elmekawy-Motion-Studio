import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {brand} from "@elmekawy/shared/theme";
import {fade, overshoot} from "./presets";
import {clamp} from "./tokens";

export type WorkflowStep = {label: string; arabic: string};
export const ProgressNavigator: React.FC<{steps: readonly WorkflowStep[]}> = ({steps}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const active = Math.min(steps.length - 1, Math.floor(frame / 18));
  return <div dir="ltr" style={{position: "relative"}}>
    <div style={{position: "absolute", left: 54, top: 50, width: 2, height: (steps.length - 1) * 180, background: `${brand.light}25`}}>
      <div style={{width: 2, height: `${interpolate(frame, [0, 54], [0, 100], clamp)}%`, background: brand.light}}/>
    </div>
    {steps.map((step, index) => <div key={step.label} style={{position: "relative", height: 180,
      display: "flex", alignItems: "flex-start", gap: 35, opacity: fade(frame, index * 3),
      translate: `${(1 - overshoot(frame, fps, index * 3)) * 25}px 0`}}>
      <div style={{marginTop: 16, width: 108, height: 68, display: "grid", placeItems: "center",
        background: brand.ink, color: index <= active ? brand.light : brand.muted,
        border: `1px solid ${index <= active ? brand.light : brand.blue}`, borderRadius: 34, fontSize: 26}}>0{index + 1}</div>
      <div style={{paddingTop: 12}}>
        <div style={{fontSize: step.label.length > 8 ? 46 : 54, fontWeight: 650,
          color: index === active ? brand.white : brand.muted, letterSpacing: -1}}>{step.label}<span style={{fontSize: 30, marginLeft: 18, color: brand.light}}>→</span></div>
        <div dir="rtl" lang="ar" style={{fontFamily: brand.arabic, fontSize: 29, textAlign: "left", color: brand.light}}>{step.arabic}</div>
      </div>
    </div>)}
  </div>;
};
