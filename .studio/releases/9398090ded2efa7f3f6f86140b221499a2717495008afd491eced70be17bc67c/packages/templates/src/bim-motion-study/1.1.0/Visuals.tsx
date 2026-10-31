import {useMedia,TextField} from "@elmekawy/motion-components/common/Runtime.tsx";
import {useState, type CSSProperties, type ReactNode} from "react";
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from "remotion";
import {brand} from "@elmekawy/shared/theme";
import {clamp} from "@elmekawy/motion-components/motion-study-v1.1/tokens.ts";
import {fade, morph} from "@elmekawy/motion-components/motion-study-v1.1/presets.ts";
import {v2Assets, type V2AssetKey} from "./data";

export const V2Asset: React.FC<{asset: V2AssetKey; available: boolean; fallback: ReactNode; style?: CSSProperties}> = ({asset, available, fallback, style}) => {
  const media = useMedia();
  const [failed, setFailed] = useState(false);
  return available && !failed ? <Img src={media(v2Assets[asset].path)}
    onError={() => setFailed(true)} style={{width: "100%", height: "100%", objectFit: "cover", ...style}}/> : <>{fallback}</>;
};

export const Schematic: React.FC<{fieldId:string;resolved?: boolean; label?: string}> = ({fieldId,resolved = false, label = "SCHEMATIC PLACEHOLDER"}) => <AbsoluteFill style={{background: `linear-gradient(140deg, ${brand.navy}, ${brand.ink})`}}>
  <svg viewBox="0 0 800 650" width="100%" height="100%" fill="none">
    <g stroke={brand.light} opacity=".14">{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <g key={i}><path d={`M0 ${100 + i * 70}H800`}/><path d={`M${i * 115} 0V650`}/></g>)}</g>
    <g stroke={brand.light} strokeWidth="3" opacity=".5"><path d="M70 210 400 90 730 210 400 345Z M70 210V435L400 560 730 435V210 M400 345V560"/>
      <path d="M70 320 400 450 730 320 M235 150V495 M565 150V495"/></g>
    <path d="M100 365 400 245 700 365" stroke={brand.light} strokeWidth="18" strokeLinecap="round"/>
    <path d={resolved ? "M180 180 335 240V315L465 370 635 305" : "M180 180 635 365"} stroke={resolved ? brand.cyan : "#F3B382"} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
    {resolved ? <g stroke={brand.light} strokeWidth="4"><circle cx="435" cy="286" r="43" fill={brand.ink}/><path d="m415 286 14 14 27-31"/></g> : <g stroke="#F3B382"><circle cx="400" cy="275" r="48" strokeWidth="3"/><path d="m385 260 30 30 m0-30-30 30" strokeWidth="5"/></g>}
  </svg>
  <div style={{position: "absolute", bottom: 25, left: 24, fontSize: 20, letterSpacing: 1.5, color: brand.light}}><TextField id={fieldId} text={label}/></div>
</AbsoluteFill>;

export const Network: React.FC = () => {
  const frame = useCurrentFrame();
  const points = [{x: 135, y: 170}, {x: 600, y: 155}, {x: 700, y: 460}, {x: 220, y: 530}];
  return <svg viewBox="0 0 800 700" width="100%" height="100%" fill="none">
    {points.map((point, index) => <g key={index} opacity={fade(frame, 16 + index * 5)}>
      <path d={`M400 350L${point.x} ${point.y}`} stroke={brand.light} strokeWidth="2" pathLength={1}
        strokeDasharray={1} strokeDashoffset={1 - interpolate(frame, [18 + index * 5, 40 + index * 5], [0, 1], clamp)}/>
      <circle cx={point.x} cy={point.y} r="34" fill={brand.ink} stroke={brand.light}/>
      <text x={point.x} y={point.y + 7} textAnchor="middle" fill={brand.light} fontSize="20" fontFamily={brand.english}><TextField id={`nodes.${index+1}`} text={`0${index+1}`}/></text>
    </g>)}
    <circle cx="400" cy="350" r={60 + morph(frame, 10, 45) * 25} stroke={brand.light} strokeWidth="2"/>
    <circle cx="400" cy="350" r="60" fill={brand.navy} stroke={brand.light}/>
    <text x="400" y="358" textAnchor="middle" fill={brand.white} fontSize="26" fontFamily={brand.english}><TextField id="center" text="BIM"/></text>
  </svg>;
};
