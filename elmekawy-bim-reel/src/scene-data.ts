export const reel = {
  name: "Mahmoud Elmekawy",
  subtitle: "Senior BIM Engineer | BIM Coordinator | Autodesk Certified Instructor",
  website: "https://www.linkedin.com/in/mahmoud-elmekawy/",
  services: ["BIM Modeling", "Coordination", "Quantity Takeoff", "Automation"],
};
export const assetPaths = {
  infrastructure: "assets/generated/bim-infrastructure.png",
  structural: "assets/generated/structural-bim.png",
  technology: "assets/generated/bim-technology.png",
  portrait: "assets/logos/ME-Logo.png",
} as const;
export type AssetKey = keyof typeof assetPaths;
export type ReelProps = {assets: Record<AssetKey, boolean>};
export const scenes = [
  {id: "hook", label: "A NEW PERSPECTIVE", from: 0, duration: 120},
  {id: "infrastructure", label: "ENGINEER THE CONNECTION", from: 120, duration: 150},
  {id: "services", label: "FROM MODEL TO DELIVERY", from: 270, duration: 180},
  {id: "training", label: "KNOWLEDGE INTO PRACTICE", from: 450, duration: 180},
  {id: "brand", label: "MEET YOUR INSTRUCTOR", from: 630, duration: 150},
  {id: "cta", label: "YOUR NEXT CHAPTER", from: 780, duration: 120},
] as const;
export const TRANSITION = 12;
