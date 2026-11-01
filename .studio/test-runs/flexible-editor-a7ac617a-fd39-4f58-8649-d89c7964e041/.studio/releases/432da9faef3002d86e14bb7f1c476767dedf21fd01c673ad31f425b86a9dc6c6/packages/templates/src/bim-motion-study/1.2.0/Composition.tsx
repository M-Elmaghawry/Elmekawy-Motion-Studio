import {LegacyImageScope} from '@elmekawy/motion-components/common/LegacyImageLayout.tsx';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {TextField,TextScope} from "@elmekawy/motion-components/common/Runtime.tsx";
import {brand} from "@elmekawy/shared/theme";
import {Fonts} from "@elmekawy/motion-components/common/Fonts.tsx";
import {FocusDot} from "@elmekawy/motion-components/motion-study-v1.1/FocusDot.tsx";
import {clamp} from "@elmekawy/motion-components/motion-study-v1.1/tokens.ts";
import type {V2Props} from "../1.1.0/data";
import {V2Comparison, V2Cta, V2Hook, V2Network, V2Workflow} from "../1.1.0/Scenes";

const Frame: React.FC = () => {
  const frame = useCurrentFrame();
  return <>
    <AbsoluteFill style={{backgroundImage: `linear-gradient(${brand.light}08 1px, transparent 1px), linear-gradient(90deg, ${brand.light}08 1px, transparent 1px)`,
      backgroundSize: "100px 100px", maskImage: "linear-gradient(transparent, black 55%, transparent)"}}/>
    <div style={{position: "absolute", top: 235, left: 100, right: 180, display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 2}}>
      <span><TextField id="global.brandName" text="ELMEKAWY"/>{" "}<span style={{color: brand.light}}><TextField id="global.brandSuffix" text="BIM"/></span></span><span style={{color: brand.muted}}><TextField id="global.studyLabel" text="MOTION STUDY / 02"/></span>
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
  <Sequence name="01 / Beyond the model" durationInFrames={60}><TextScope id="hook"><LegacyImageScope sceneId="hook"><V2Hook/></LegacyImageScope></TextScope></Sequence>
  <Sequence name="02 / Coordination network" from={60} durationInFrames={75}><TextScope id="network"><LegacyImageScope sceneId="network"><V2Network assets={assets}/></LegacyImageScope></TextScope></Sequence>
  <Sequence name="03 / Before and after concept" from={135} durationInFrames={90}><TextScope id="comparison"><LegacyImageScope sceneId="comparison"><V2Comparison assets={assets}/></LegacyImageScope></TextScope></Sequence>
  <Sequence name="04 / Connected workflow" from={225} durationInFrames={75}><TextScope id="workflow"><LegacyImageScope sceneId="workflow"><V2Workflow/></LegacyImageScope></TextScope></Sequence>
  <Sequence name="05 / Elmekawy BIM" from={300} durationInFrames={60}><TextScope id="cta"><LegacyImageScope sceneId="cta"><V2Cta assets={assets}/></LegacyImageScope></TextScope></Sequence>
  <FocusDot/>
</AbsoluteFill>;
