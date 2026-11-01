import {LegacyImageScope} from '@elmekawy/motion-components/common/LegacyImageLayout.tsx';
import {useMedia,TextScope} from "@elmekawy/motion-components/common/Runtime.tsx";
import {brand} from "@elmekawy/shared/theme";
import {Fonts} from "@elmekawy/motion-components/common/Fonts.tsx";
import {clamp} from "@elmekawy/motion-components/legacy-v1.1/Motion.tsx";
import {scenes, TRANSITION, type ReelProps} from "../1.1.0/scene-data";
import {HookScene} from "../1.1.0/scenes/HookScene";
import {InfrastructureScene} from "../1.1.0/scenes/InfrastructureScene";
import {ServicesScene} from "../1.1.0/scenes/ServicesScene";
import {TrainingScene} from "../1.1.0/scenes/TrainingScene";
import {PersonalBrandScene} from "../1.1.0/scenes/PersonalBrandScene";
import {CtaScene} from "../1.1.0/scenes/CtaScene";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";


const Footer: React.FC = () => {
  const frame = useCurrentFrame();
  return <div style={{position: "absolute", left: 100, right: 180, bottom: 365}}>

    <div style={{height: 1, background: "#68BBE330"}}><div style={{height: 2, background: brand.light, width: `${interpolate(frame,[0,899],[0,100],clamp)}%`}}/></div>
  </div>;
};

export const ElmekawyBIMIntro: React.FC<ReelProps> = ({assets}) => {
  const media = useMedia();
  const components = [HookScene, InfrastructureScene, ServicesScene, TrainingScene, PersonalBrandScene, CtaScene];
  return <>
    <AbsoluteFill
      style={{background: brand.ink, color: brand.white, fontFamily: brand.english}}
    >
      <Fonts/>
      <Audio src={media("assets/audio/bim-reel.mp3")} volume={0.3}/>
      {scenes.map((scene,i) => {
        const Scene = components[i];
        return <Sequence
          key={scene.id}
          name={scene.label}
          from={scene.from}
          durationInFrames={scene.duration + (i < 5 ? TRANSITION : 0)}
        >
          <TextScope id={scene.id}><LegacyImageScope sceneId={scene.id}><Scene assets={assets}/></LegacyImageScope></TextScope>
        </Sequence>;
      })}
      <Footer/>
    </AbsoluteFill>
  </>;
};
