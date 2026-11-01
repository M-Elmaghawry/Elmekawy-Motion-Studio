import {staticFile, type CalculateMetadataFunction} from "remotion";

export const v2Scenes = [
  {id: "hook", from: 0, duration: 60},
  {id: "network", from: 60, duration: 75},
  {id: "comparison", from: 135, duration: 90},
  {id: "workflow", from: 225, duration: 75},
  {id: "cta", from: 300, duration: 60},
] as const;
export const v2Assets = {
  structural: {path: "assets/generated/structural-bim.png", status: "Existing user-supplied concept image"},
  logo: {path: "assets/logos/ME-Logo.png", status: "Existing user-supplied logo"},
  before: {path: "assets/v2/coordination-before.png", status: "Missing; labeled schematic placeholder"},
  after: {path: "assets/v2/coordination-after.png", status: "Missing; labeled schematic placeholder"},
} as const;
export type V2AssetKey = keyof typeof v2Assets;
export type V2Props = {assets: Record<V2AssetKey, boolean>};
export const workflow = [
  {label: "MODEL", arabic: "نمذجة"}, {label: "COORDINATE", arabic: "تنسيق"},
  {label: "CHECK", arabic: "مراجعة"}, {label: "DELIVER", arabic: "تسليم"},
] as const;

export const calculateV2Metadata: CalculateMetadataFunction<V2Props> = async () => {
  const entries = await Promise.all(Object.entries(v2Assets).map(async ([key, asset]) => {
    try {
      const response = await fetch(staticFile(asset.path), {method: "HEAD"});
      return [key, response.ok && (response.headers.get("content-type") ?? "").startsWith("image/")];
    } catch {return [key, false];}
  }));
  return {props: {assets: Object.fromEntries(entries) as V2Props["assets"]}};
};
