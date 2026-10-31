import {TextField} from "@elmekawy/motion-components/common/Runtime.tsx";
﻿import {brand} from "@elmekawy/shared/theme";
import {Blueprint, Eyebrow, Heading, Reveal, Safe, SceneShell} from "@elmekawy/motion-components/legacy-v1.1/Motion.tsx";

export const HookScene: React.FC = () => <SceneShell fadeIn={false}>
  <div style={{position: "absolute", top: 930, left: 65, opacity: 0.75}}><Blueprint large/></div>
  <Safe>
    <Reveal><Eyebrow><TextField id="eyebrow" text="BEYOND THE MODEL / 01"/></Eyebrow></Reveal>
    <div dir="rtl" lang="ar" style={{fontFamily: brand.arabic, fontWeight: 750, fontSize: 94, lineHeight: 1.5, marginTop: 110, textAlign: "right"}}>
      <Reveal delay={4}><span><TextField id="arabicPrefix" text="الـ"/>{" "}<bdi dir="ltr" style={{fontFamily: brand.english, color: brand.light}}><TextField id="bim" text="BIM"/></bdi></span></Reveal>
      <Reveal delay={14}><TextField id="middleLine" text="مش مجرد"/></Reveal>
      <Reveal delay={25}><span><TextField id="model" text="موديل"/>{" "}<bdi dir="ltr" style={{fontFamily: brand.english, color: brand.light}}><TextField id="threeD" text="3D"/></bdi></span></Reveal>
    </div>
    <Reveal delay={44} style={{marginTop: 65}}><Heading style={{fontSize: 25, letterSpacing: 5, fontWeight: 450}}><TextField id="tagline" text="THINK SYSTEMS. BUILD BETTER."/></Heading></Reveal>
  </Safe>
</SceneShell>;
