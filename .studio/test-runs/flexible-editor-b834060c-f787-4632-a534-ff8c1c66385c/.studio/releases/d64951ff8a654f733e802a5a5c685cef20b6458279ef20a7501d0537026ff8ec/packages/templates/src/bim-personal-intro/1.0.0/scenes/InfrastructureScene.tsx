import {CopyText} from "@elmekawy/motion-components/common/Runtime.tsx";
﻿import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {brand} from "@elmekawy/shared/theme";
import {clamp, Eyebrow, Heading, ImagePush, Reveal, Safe, SceneShell} from "@elmekawy/motion-components/legacy-v1/Motion.tsx";
import {type ReelProps} from "../scene-data";

export const InfrastructureScene: React.FC<ReelProps> = ({assets}) => {
  const frame = useCurrentFrame();
  return <SceneShell>
    <ImagePush asset="infrastructure" available={assets.infrastructure} duration={150}/>
    <AbsoluteFill style={{background: "linear-gradient(180deg,#030D1Be8 0%,#030D1B55 38%,transparent 58%,#030D1Bdd 86%)"}}/>
    <Safe>
      <Reveal><Eyebrow>CONNECTED BY DESIGN / 02</Eyebrow></Reveal>
      <Reveal delay={8}><Heading style={{fontSize: 72}}>STRUCTURAL &amp;<br/><span style={{color: brand.light}}>INFRASTRUCTURE</span><br/>BIM</Heading></Reveal>
      <div style={{position: "absolute", top: 640, left: 55, width: 650, height: 370, transform: `translateY(${interpolate(frame, [0,150], [25,-30], clamp)}px)`, borderLeft: "1px solid #68BBE370", borderBottom: "1px solid #68BBE370"}}>
        <div style={{position: "absolute", bottom: -7, right: -7, width: 14, height: 14, borderRadius: "50%", background: brand.light, boxShadow: "0 0 28px #68BBE3"}}/>
      </div>
      <Reveal delay={27} style={{position: "absolute", bottom: 85, fontSize: 31, lineHeight: 1.5}}>Structure. Infrastructure.<br/><span style={{color: brand.light}}><CopyText text="One coordinated vision."/></span></Reveal>
    </Safe>
  </SceneShell>;
};

