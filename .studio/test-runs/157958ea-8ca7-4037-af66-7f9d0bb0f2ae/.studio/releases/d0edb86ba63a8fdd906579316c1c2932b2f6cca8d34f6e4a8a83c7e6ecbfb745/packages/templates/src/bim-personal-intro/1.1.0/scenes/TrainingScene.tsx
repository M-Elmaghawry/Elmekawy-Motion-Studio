import {TextField} from "@elmekawy/motion-components/common/Runtime.tsx";
﻿import {interpolate, useCurrentFrame} from "remotion";
import {brand} from "@elmekawy/shared/theme";
import {clamp, Eyebrow, Heading, Reveal, Safe, SceneShell} from "@elmekawy/motion-components/legacy-v1.1/Motion.tsx";

export const TrainingScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <SceneShell><Safe>
    <Reveal><Eyebrow><TextField id="eyebrow" text="KNOWLEDGE INTO PRACTICE / 04"/></Eyebrow></Reveal>
    <Reveal delay={5}><Heading><TextField id="title1" text="REVIT &"/><br/><span style={{color: brand.light}}><TextField id="title2" text="BIM TRAINING"/></span></Heading></Reveal>
    <Reveal delay={20} style={{marginTop: 38, fontSize: 38, lineHeight: 1.5}}><TextField id="credential1" text="Autodesk Certified"/><br/><TextField id="credential2" text="Instructor"/></Reveal>
    <Reveal delay={27} style={{position: "relative", height: 490, marginTop: 85, border: "1px solid #68BBE350", borderRadius: 8, background: "#00306035", padding: 38}}>
      <div style={{fontSize: 19, letterSpacing: 4, color: brand.muted}}><TextField id="framework" text="THE LEARNING FRAMEWORK"/></div>
      <svg viewBox="0 0 650 300" style={{width: "100%", marginTop: 25}} fill="none">
        <path d="M80 190 230 80 400 170 560 60" stroke={brand.light} strokeWidth="3" pathLength={1} strokeDasharray={1} strokeDashoffset={1-interpolate(frame,[35,105],[0,1],clamp)}/>
        {[{x:80,y:190},{x:230,y:80},{x:400,y:170},{x:560,y:60}].map((point,i) => <g key={i} opacity={interpolate(frame,[35+i*16,47+i*16],[0,1],clamp)}><circle cx={point.x} cy={point.y} r="19" fill={brand.navy} stroke={brand.light} strokeWidth="2"/><circle cx={point.x} cy={point.y} r="5" fill={brand.light}/><path d={`M${point.x} ${point.y+28}V270`} stroke="#68BBE335" strokeDasharray="4 8"/></g>)}
      </svg>
      <div style={{display: "flex", justifyContent: "space-between", fontSize: 21, color: brand.light}}><span><TextField id="learning.1" text="UNDERSTAND"/></span><span><TextField id="learning.2" text="APPLY"/></span><span><TextField id="learning.3" text="DELIVER"/></span></div>
    </Reveal>
    <Reveal delay={75} style={{marginTop: 50, fontSize: 39, lineHeight: 1.35}}><TextField id="caption1" text="Build skills."/><br/><span style={{color: brand.light}}><TextField id="caption2" text="Work with confidence."/></span></Reveal>
  </Safe></SceneShell>;
};
