import type {ReactNode} from "react";
import {TextField} from "@elmekawy/motion-components/common/Runtime.tsx";
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {brand} from "@elmekawy/shared/theme";
import {ArabicWordReveal} from "@elmekawy/motion-components/motion-study-v1.1/ArabicWordReveal.tsx";
import {ComparisonReveal} from "@elmekawy/motion-components/motion-study-v1.1/ComparisonReveal.tsx";
import {LayeredScene} from "@elmekawy/motion-components/motion-study-v1.1/LayeredScene.tsx";
import {ProgressNavigator} from "@elmekawy/motion-components/motion-study-v1.1/ProgressNavigator.tsx";
import {fade, morph, overshoot} from "@elmekawy/motion-components/motion-study-v1.1/presets.ts";
import {clamp} from "@elmekawy/motion-components/motion-study-v1.1/tokens.ts";
import {workflow, type V2Props} from "./data";
import {Network, Schematic, V2Asset} from "./Visuals";

const Section: React.FC<{number: string; title: string; children: ReactNode}> = ({number, title, children}) => <>
  <div style={{position: "absolute", top: 345, left: 100, right: 180, display: "flex", alignItems: "center", gap: 25,
    fontSize: 21, letterSpacing: 3, color: brand.light}}><span><TextField id="sectionNumber" text={number}/></span><div style={{height: 1, width: 65, background: brand.light}}/><TextField id="eyebrow" text={title}/></div>
  {children}
</>;
const Note: React.FC<{children: string}> = ({children}) => <div dir="rtl" lang="ar" style={{position: "absolute", top: 1450,
  left: 100, right: 180, fontFamily: brand.arabic, fontSize: 29, color: brand.muted, textAlign: "right"}}><TextField id="note" text={children}/></div>;

export const V2Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Section number="01" title="BEYOND THE MODEL">
    <div style={{position: "absolute", left: 100, right: 180, top: 500}}>
      <ArabicWordReveal fieldId="title1" text="الموديل" delay={2} style={{fontSize: 112}}/>
      <ArabicWordReveal fieldId="title2" text="مش هو الـ" delay={2} wordOffset={1} style={{fontSize: 90}}/>
      <ArabicWordReveal fieldId="title3" text="BIM" delay={2} wordOffset={4} style={{fontSize: 200, lineHeight: 1.4,
        color: brand.light, scale: 1 + (1 - overshoot(frame, fps, 22)) * 0.06, transformOrigin: "right center"}}/>
      <div style={{height: 3, background: brand.cyan, marginTop: 24,
        width: `${interpolate(frame, [25, 48], [0, 100], clamp)}%`}}/>
      <div style={{marginTop: 35, fontSize: 24, letterSpacing: 3, opacity: fade(frame, 32)}}><TextField id="tagline" text="THINK IN CONNECTIONS."/></div>
    </div>
    <Note>القيمة في الترابط، مش في الشكل بس.</Note>
  </Section>;
};

export const V2Network: React.FC<V2Props> = ({assets}) => {
  const frame = useCurrentFrame();
  const transform = morph(frame, 14, 55);
  return <Section number="02" title="A CONNECTED SYSTEM">
    <div style={{position: "absolute", left: 100, right: 180, top: 450}}>
      <ArabicWordReveal fieldId="title1" text="من موديل" style={{fontSize: 72}}/>
      <ArabicWordReveal fieldId="title2" text="لشبكة تنسيق" delay={5} style={{fontSize: 72, color: brand.light}}/>
    </div>
    <div style={{position: "absolute", left: 80, right: 140, top: 750, height: 670,
      border: `1px solid ${brand.light}40`, borderRadius: 8 + transform * 32, overflow: "hidden"}}>
      <LayeredScene duration={75}
        background={<AbsoluteFill style={{opacity: 1 - transform * 0.7}}><V2Asset asset="structural" available={assets.structural}
          fallback={<Schematic fieldId="fallback.caption" label="STRUCTURAL / PLACEHOLDER"/>} style={{objectPosition: "50% 60%"}}/></AbsoluteFill>}
        midground={<AbsoluteFill style={{background: `linear-gradient(180deg, ${brand.ink}10, ${brand.ink}80)`, opacity: transform}}/>}
        foreground={<AbsoluteFill style={{opacity: transform}}><Network/></AbsoluteFill>}/>
      <div style={{position: "absolute", left: 25, top: 25, fontSize: 20, letterSpacing: 2, color: brand.white}}><TextField id="overlay" text="MODEL → COORDINATION"/></div>
    </div>
    <Note>تصوّر توضيحي · ربط التخصصات والمعلومات</Note>
  </Section>;
};

export const V2Comparison: React.FC<V2Props> = ({assets}) => {
  const hasPair = assets.before && assets.after;
  return <Section number="03" title="MAKE THE CONFLICT VISIBLE">
    <div style={{position: "absolute", top: 450, left: 100, right: 180}}>
      <ArabicWordReveal fieldId="title1" text="نشوف التعارض" style={{fontSize: 70}}/>
      <ArabicWordReveal fieldId="title2" text="ونراجع المسار" delay={6} style={{fontSize: 70, color: brand.light}}/>
    </div>
    <div style={{position: "absolute", left: 100, right: 180, top: 760}}>
      <ComparisonReveal
        before={<V2Asset asset="before" available={hasPair} fallback={<Schematic fieldId="fallback.before"/>}/>}
        after={<V2Asset asset="after" available={hasPair} fallback={<Schematic fieldId="fallback.after" resolved/>}/>}/>
    </div>
    <Note>مثال توضيحي فقط · ليس نتيجة مشروع أو تحقق هندسي</Note>
  </Section>;
};

export const V2Workflow: React.FC = () => <Section number="04" title="ONE CONTINUOUS WORKFLOW">
  <div style={{position: "absolute", top: 455, left: 100, right: 180}}>
    <ArabicWordReveal fieldId="title1" text="كل خطوة متصلة" style={{fontSize: 73}}/>
  </div>
  <div style={{position: "absolute", top: 695, left: 100, right: 180}}><ProgressNavigator steps={workflow}/></div>
  <Note>من الفكرة إلى التسليم.</Note>
</Section>;

export const V2Cta: React.FC<V2Props> = ({assets}) => {
  const frame = useCurrentFrame();
  return <Section number="05" title="LET’S CONNECT">
    <div style={{position: "absolute", left: 100, right: 180, top: 585, textAlign: "center"}}>
      <div style={{position: "relative", margin: "0 auto 50px", width: 170, height: 170,
        border: `1px solid ${brand.light}55`, borderRadius: 24 + morph(frame, 0, 25) * 61,
        background: `${brand.navy}65`, opacity: fade(frame, 0)}}>
        <V2Asset asset="logo" available={assets.logo} style={{objectFit: "contain", padding: 20, boxSizing: "border-box"}}
          fallback={<div style={{fontSize: 60, lineHeight: "170px", fontWeight: 700, color: brand.light}}><TextField id="fallback.mark" text="ME"/></div>}/>
      </div>
      <div style={{opacity: fade(frame, 6), fontSize: 74, fontWeight: 750, letterSpacing: -3}}><TextField id="brandName" text="ELMEKAWY"/><span style={{color: brand.light}}>{" "}<TextField id="brandSuffix" text="BIM"/></span></div>
      <ArabicWordReveal fieldId="title1" text="نربط التفاصيل" delay={9} style={{fontSize: 68, textAlign: "center", marginTop: 35}}/>
      <ArabicWordReveal fieldId="title2" text="ونبني الصورة الكاملة" delay={13} style={{fontSize: 55, textAlign: "center", color: brand.light}}/>
      <div style={{marginTop: 64, opacity: fade(frame, 22), borderTop: `1px solid ${brand.light}40`, paddingTop: 35}}>
        <div dir="rtl" lang="ar" style={{fontFamily: brand.arabic, fontSize: 35}}><TextField id="contact" text="خلّينا نتواصل"/></div>
        <div style={{marginTop: 16, fontSize: 25, color: brand.light}}><TextField id="website" text="linkedin.com/in/mahmoud-elmekawy ↗"/></div>
      </div>
    </div>
  </Section>;
};
