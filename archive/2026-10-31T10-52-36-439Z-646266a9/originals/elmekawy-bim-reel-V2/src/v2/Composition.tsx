import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {brand} from "../brand/theme";
import {Fonts} from "../components/Fonts";
import {FocusDot} from "../components/motion/FocusDot";
import {clamp} from "../motion/tokens";
import type {V2Props} from "./data";
import {V2Comparison, V2Cta, V2Hook, V2Network, V2Workflow} from "./Scenes";

const Frame: React.FC = () => {
  const frame = useCurrentFrame();
  return <>
    <AbsoluteFill style={{backgroundImage: `linear-gradient(${brand.light}08 1px, transparent 1px), linear-gradient(90deg, ${brand.light}08 1px, transparent 1px)`,
      backgroundSize: "100px 100px", maskImage: "linear-gradient(transparent, black 55%, transparent)"}}/>
    <div style={{position: "absolute", top: 235, left: 100, right: 180, display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 2}}>
      <span>ELMEKAWY <span style={{color: brand.light}}>BIM</span></span><span style={{color: brand.muted}}>MOTION STUDY / 02</span>
    </div>
    <div style={{position: "absolute", top: 1545, left: 100, right: 180, height: 2, background: `${brand.light}25`}}>
      <div style={{height: "100%", width: `${interpolate(frame, [0, 359], [0, 100], clamp)}%`, background: brand.light}}/>
    </div>
  </>;
};

export const ElmekawyBIMIntroV2: React.FC<V2Props> = ({assets}) => <AbsoluteFill style={{
  background: `radial-gradient(ellipse at 75% 48%, ${brand.navy}a0, transparent 65%), ${brand.ink}`,
  color: brand.white, fontFamily: brand.english, overflow: "hidden"}}>
  <Fonts/>
  <Frame/>
  <Sequence name="01 / Beyond the model" durationInFrames={60}><V2Hook/></Sequence>
  <Sequence name="02 / Coordination network" from={60} durationInFrames={75}><V2Network assets={assets}/></Sequence>
  <Sequence name="03 / Before and after concept" from={135} durationInFrames={90}><V2Comparison assets={assets}/></Sequence>
  <Sequence name="04 / Connected workflow" from={225} durationInFrames={75}><V2Workflow/></Sequence>
  <Sequence name="05 / Elmekawy BIM" from={300} durationInFrames={60}><V2Cta assets={assets}/></Sequence>
  <FocusDot/>
</AbsoluteFill>;
