import {Composition, staticFile, type CalculateMetadataFunction} from "remotion";
import {ElmekawyBIMIntro} from "./Composition";
import {assetPaths, type ReelProps} from "./scene-data";

const calculateMetadata: CalculateMetadataFunction<ReelProps> = async () => {
  const entries = await Promise.all(Object.entries(assetPaths).map(async ([key, path]) => {
    try {
      const response = await fetch(staticFile(path), {method: "HEAD"});
      return [key, response.ok && (response.headers.get("content-type") ?? "").startsWith("image/")];
    } catch {return [key, false];}
  }));
  return {props: {assets: Object.fromEntries(entries) as ReelProps["assets"]}};
};

export const RemotionRoot: React.FC = () => <Composition
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
/>;
