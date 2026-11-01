import {useMedia} from "../common/Runtime.tsx";
﻿import {AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {useState, type CSSProperties, type ReactNode} from "react";
import {brand} from "@elmekawy/shared/theme";
import {legacyAssetPaths as assetPaths, type LegacyAssetKey as AssetKey} from "@elmekawy/shared";

export const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
export const Reveal: React.FC<{children: ReactNode; delay?: number; style?: CSSProperties}> = ({children, delay = 0, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = spring({frame: frame - delay, fps, config: {damping: 22, stiffness: 105, mass: 0.9}});
  return <div style={{opacity: interpolate(frame - delay, [0, 16], [0, 1], clamp), transform: `translateY(${(1 - progress) * 46}px)`, ...style}}>{children}</div>;
};

export const Eyebrow: React.FC<{children: ReactNode}> = ({children}) => <div style={{fontSize: 23, letterSpacing: 4, color: brand.light, fontWeight: 600, marginBottom: 32}}>{children}</div>;
export const Heading: React.FC<{children: ReactNode; style?: CSSProperties}> = ({children, style}) => <div style={{fontSize: 90, fontWeight: 750, letterSpacing: -4, lineHeight: 1.06, ...style}}>{children}</div>;

export const Blueprint: React.FC<{large?: boolean}> = ({large = false}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 65], [0, 1], clamp);
  return <svg viewBox="0 0 800 700" style={{width: large ? 1000 : 780, height: large ? 875 : 683, overflow: "visible"}} fill="none">
    <g transform={`translate(400 320) rotate(${Math.sin(frame / 110) * 3}) translate(-400 -320)`}>
      {[0, 1, 2, 3, 4].map((i) => <g key={i} opacity={1 - i * 0.12} transform={`translate(0 ${i * 64})`}>
        <path d="M100 210 L400 50 L700 210 L400 380 Z" stroke={i === 0 ? brand.light : brand.cyan} strokeWidth={i === 0 ? 3 : 1.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress}/>
        {[100, 250, 400, 550, 700].map((x, j) => <path key={x} d={`M${x} ${210 + (j < 2 ? -j * 80 : (j - 4) * 80)} v64`} stroke={brand.light} opacity={0.4}/>)}
      </g>)}
      <path d="M100 210V466L400 636L700 466V210 M400 380V636" stroke={brand.light} strokeWidth="2" opacity=".7" pathLength={1} strokeDasharray={1} strokeDashoffset={1-progress}/>
      {[100, 400, 700].map((x, i) => <circle key={x} cx={x} cy={i === 1 ? 380 : 210} r={5} fill={brand.light}/>)}
    </g>
  </svg>;
};

export const Ambient: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{overflow: "hidden", background: `radial-gradient(ellipse at 85% 38%, ${brand.navy}99, transparent 66%), ${brand.ink}`}}>
    <AbsoluteFill style={{opacity: 0.16, backgroundImage: "linear-gradient(#68BBE330 1px, transparent 1px),linear-gradient(90deg,#68BBE330 1px,transparent 1px)", backgroundSize: "90px 90px", transform: `translateY(${frame * 0.12}px)`}}/>
    <svg width="1080" height="1920" style={{position: "absolute"}} fill="none">
      {[0, 1, 2].map((i) => <path key={i} d={`M-200 ${1600+i*70} L700 ${650+i*70} L1260 ${890+i*70}`} stroke={brand.light} strokeWidth={i === 0 ? 3 : 1} opacity={0.16} pathLength={1} strokeDasharray=".14 .86" strokeDashoffset={-frame / 340 - i * 0.2}/>)}
    </svg>
  </AbsoluteFill>;
};

export const Safe: React.FC<{children: ReactNode; style?: CSSProperties}> = ({children, style}) => <div dir="ltr" style={{position: "absolute", left: brand.safe.left, right: brand.safe.right, top: brand.safe.top, bottom: brand.safe.bottom, ...style}}>{children}</div>;

export const Asset: React.FC<{asset: AssetKey; available: boolean; style?: CSSProperties; portrait?: boolean}> = ({asset, available, style, portrait}) => {
  const media = useMedia();
  const [failed, setFailed] = useState(false);
  return <div style={{position: "absolute", inset: 0, overflow: "hidden", ...style}}>
    {available && !failed ? <Img src={media(assetPaths[asset])} onError={() => setFailed(true)} style={{width: "100%", height: "100%", objectFit: "cover"}}/> :
      <AbsoluteFill
        style={{alignItems: "center", justifyContent: "center", background: `linear-gradient(145deg, ${brand.navy}, ${brand.ink})`}}
      >
        {portrait ? <><div style={{fontSize: 190, fontWeight: 650, letterSpacing: -14, color: brand.light}}>ME</div><div style={{fontSize: 18, letterSpacing: 4, color: brand.muted, marginTop: 30}}>ELMEKAWY / BIM</div></> : <><Blueprint/><div style={{position: "absolute", bottom: 40, color: brand.muted, fontSize: 18, letterSpacing: 3}}>BIM / CONCEPT VISUAL</div></>}
      </AbsoluteFill>}
  </div>;
};

export const ImagePush: React.FC<{asset: AssetKey; available: boolean; duration: number}> = ({asset, available, duration}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{transform: `scale(${interpolate(frame, [0, duration], [1.01, 1.12], clamp)}) translateY(${-frame * 0.08}px)`}}>
    <Asset asset={asset} available={available}/>
  </AbsoluteFill>;
};

export const SceneShell: React.FC<{children: ReactNode; fadeIn?: boolean}> = ({children, fadeIn = true}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill
    style={{opacity: fadeIn ? interpolate(frame, [0, 12], [0, 1], clamp) : 1, overflow: "hidden"}}
  ><Ambient/>{children}</AbsoluteFill>;
};
