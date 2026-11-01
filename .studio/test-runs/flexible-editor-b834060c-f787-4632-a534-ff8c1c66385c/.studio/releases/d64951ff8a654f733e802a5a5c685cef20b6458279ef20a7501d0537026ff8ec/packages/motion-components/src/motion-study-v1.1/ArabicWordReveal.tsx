import {useTextField} from "../common/Runtime.tsx";
import type {CSSProperties} from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {brand} from "@elmekawy/shared/theme";
import {fade, maskReveal, overshoot, stagger} from "./presets";

export const ArabicWordReveal: React.FC<{
  fieldId:string; text: string; delay?: number; wordOffset?: number; style?: CSSProperties;
}> = ({fieldId,text: sourceText, delay = 0, wordOffset = 0, style}) => {
  const text = useTextField(fieldId,sourceText);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div dir="rtl" lang="ar" aria-label={text} style={{fontFamily: brand.arabic,
    fontSize: 86, fontWeight: 750, lineHeight: 1.65, textAlign: "right", ...style}}>
    {text.split(/\s+/).map((word, index) => {
      const start = stagger(index + wordOffset, delay);
      const latin = /^[A-Za-z0-9→./-]+$/.test(word);
      return <span key={`${index}-${word}`} style={{display: "inline-block", overflow: "hidden",
        verticalAlign: "bottom", paddingInline: 5, marginInline: 3,
        clipPath: `inset(0 0 ${maskReveal(frame, start)}% 0)`}}>
        <bdi dir={latin ? "ltr" : "rtl"} style={{display: "inline-block",
          fontFamily: latin ? brand.english : brand.arabic,
          opacity: fade(frame, start), translate: `0 ${(1 - overshoot(frame, fps, start)) * 55}px`}}>{word}</bdi>
      </span>;
    })}
  </div>;
};
