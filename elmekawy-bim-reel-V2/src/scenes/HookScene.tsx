import {brand} from "../brand/theme";
import {Blueprint, Eyebrow, Heading, Reveal, Safe, SceneShell} from "../components/Motion";

export const HookScene: React.FC = () => <SceneShell fadeIn={false}>
  <div style={{position: "absolute", top: 930, left: 65, opacity: 0.75}}><Blueprint large/></div>
  <Safe>
    <Reveal><Eyebrow>BEYOND THE MODEL / 01</Eyebrow></Reveal>
    <div dir="rtl" lang="ar" style={{fontFamily: brand.arabic, fontWeight: 750, fontSize: 94, lineHeight: 1.5, marginTop: 110, textAlign: "right"}}>
      <Reveal delay={4}><span>الـ <bdi dir="ltr" style={{fontFamily: brand.english, color: brand.light}}>BIM</bdi></span></Reveal>
      <Reveal delay={14}>مش مجرد</Reveal>
      <Reveal delay={25}><span>موديل <bdi dir="ltr" style={{fontFamily: brand.english, color: brand.light}}>3D</bdi></span></Reveal>
    </div>
    <Reveal delay={44} style={{marginTop: 65}}><Heading style={{fontSize: 25, letterSpacing: 5, fontWeight: 450}}>THINK SYSTEMS. BUILD BETTER.</Heading></Reveal>
  </Safe>
</SceneShell>;
