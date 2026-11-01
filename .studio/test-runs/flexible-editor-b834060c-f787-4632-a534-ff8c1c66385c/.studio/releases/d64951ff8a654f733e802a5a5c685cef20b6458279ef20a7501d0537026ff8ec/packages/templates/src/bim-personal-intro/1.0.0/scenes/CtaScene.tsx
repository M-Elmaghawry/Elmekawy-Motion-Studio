import {CopyText} from "@elmekawy/motion-components/common/Runtime.tsx";
﻿import {brand} from "@elmekawy/shared/theme";
import {Blueprint, Eyebrow, Heading, Reveal, Safe, SceneShell} from "@elmekawy/motion-components/legacy-v1/Motion.tsx";
import {reel} from "../scene-data";

export const CtaScene: React.FC = () => <SceneShell>
  <div style={{position: "absolute", left: 330, top: 890, opacity: 0.26}}><Blueprint large/></div>
  <Safe>
    <Reveal><Eyebrow>YOUR NEXT CHAPTER / 06</Eyebrow></Reveal>
    <div aria-label="Learn • Build • Coordinate" style={{marginTop: 120}}>
      {["Learn", "Build", "Coordinate"].map((word,i) => <Reveal key={word} delay={5+i*9} style={{display: "flex", alignItems: "center", gap: 26, marginBottom: 25}}>
        <span style={{width: 11, height: 11, background: brand.light, borderRadius: "50%"}}/>
        <Heading style={{fontSize: 98, color: i === 2 ? brand.light : brand.white}}><CopyText text={word}/></Heading>
      </Reveal>)}
    </div>
    <Reveal delay={35} style={{marginTop: 85, width: 95, height: 3, background: brand.cyan}}><span/></Reveal>
    <Reveal delay={42} style={{marginTop: 45, fontSize: 28, fontWeight: 650}}>{reel.name}</Reveal>
    <Reveal delay={48} style={{marginTop: 35}}>
      <div style={{fontSize: 18, letterSpacing: 4, color: brand.muted, marginBottom: 20}}>EXPLORE THE PORTFOLIO ↗</div>
      <div style={{fontSize: 31, letterSpacing: -0.9, lineHeight: 1.6, color: brand.light, whiteSpace: "nowrap"}}>{reel.website}</div>
    </Reveal>
  </Safe>
</SceneShell>;
