import {interpolate, useCurrentFrame} from "remotion";
import {brand} from "../brand/theme";
import {clamp, Eyebrow, Heading, Reveal, Safe, SceneShell} from "../components/Motion";

export const TrainingScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <SceneShell><Safe>
    <Reveal><Eyebrow>KNOWLEDGE INTO PRACTICE / 04</Eyebrow></Reveal>
    <Reveal delay={5}><Heading>REVIT &amp;<br/><span style={{color: brand.light}}>BIM TRAINING</span></Heading></Reveal>
    <Reveal delay={20} style={{marginTop: 38, fontSize: 38, lineHeight: 1.5}}>Autodesk Certified<br/>Instructor</Reveal>
    <Reveal delay={27} style={{position: "relative", height: 490, marginTop: 85, border: "1px solid #68BBE350", borderRadius: 8, background: "#00306035", padding: 38}}>
      <div style={{fontSize: 19, letterSpacing: 4, color: brand.muted}}>THE LEARNING FRAMEWORK</div>
      <svg viewBox="0 0 650 300" style={{width: "100%", marginTop: 25}} fill="none">
        <path d="M80 190 230 80 400 170 560 60" stroke={brand.light} strokeWidth="3" pathLength={1} strokeDasharray={1} strokeDashoffset={1-interpolate(frame,[35,105],[0,1],clamp)}/>
        {[{x:80,y:190},{x:230,y:80},{x:400,y:170},{x:560,y:60}].map((point,i) => <g key={i} opacity={interpolate(frame,[35+i*16,47+i*16],[0,1],clamp)}><circle cx={point.x} cy={point.y} r="19" fill={brand.navy} stroke={brand.light} strokeWidth="2"/><circle cx={point.x} cy={point.y} r="5" fill={brand.light}/><path d={`M${point.x} ${point.y+28}V270`} stroke="#68BBE335" strokeDasharray="4 8"/></g>)}
      </svg>
      <div style={{display: "flex", justifyContent: "space-between", fontSize: 21, color: brand.light}}><span>UNDERSTAND</span><span>APPLY</span><span>DELIVER</span></div>
    </Reveal>
    <Reveal delay={75} style={{marginTop: 50, fontSize: 39, lineHeight: 1.35}}>Build skills.<br/><span style={{color: brand.light}}>Work with confidence.</span></Reveal>
  </Safe></SceneShell>;
};
