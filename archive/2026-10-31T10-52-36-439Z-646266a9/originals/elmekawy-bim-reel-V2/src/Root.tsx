import {Composition, staticFile, type CalculateMetadataFunction} from "remotion";
import {ElmekawyBIMIntro} from "./Composition";
import {assetPaths, type ReelProps} from "./scene-data";
import {ElmekawyBIMIntroV2} from "./v2/Composition";
import {calculateV2Metadata} from "./v2/data";

const calculateMetadata: CalculateMetadataFunction<ReelProps> = async () => {
  const entries = await Promise.all(Object.entries(assetPaths).map(async ([key, path]) => {
    try {
      const response = await fetch(staticFile(path), {method: "HEAD"});
      return [key, response.ok && (response.headers.get("content-type") ?? "").startsWith("image/")];
    } catch {return [key, false];}
  }));
  return {props: {assets: Object.fromEntries(entries) as ReelProps["assets"]}};
};

export const RemotionRoot: React.FC = () => <><Composition
  id="ElmekawyBIMIntro"
  component={ElmekawyBIMIntro}
  durationInFrames={900}
  fps={30}
  width={1080}
  height={1920}
  defaultProps={{
    assets: {
      infrastructure: true,
      structural: true,
      technology: true,
      portrait: false,
    },
  }}
  calculateMetadata={calculateMetadata}
/>
<Composition
  id="ElmekawyBIMIntroV2"
  component={ElmekawyBIMIntroV2}
  durationInFrames={360}
  fps={30}
  width={1080}
  height={1920}
  defaultProps={{assets: {structural: true, logo: true, before: false, after: false}}}
  calculateMetadata={calculateV2Metadata}
/></>;
