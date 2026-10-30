import {brand} from "../brand/theme";
import {Asset, Eyebrow, Heading, Reveal, Safe, SceneShell} from "../components/Motion";
import {reel, type ReelProps} from "../scene-data";

const icons = [
  "M12 22 32 10 52 22 32 34Z M12 22v22l20 12 20-12V22 M32 34v22",
  "M10 16h26v26H10Z M28 30h26v26H28Z M18 8v16 M46 48v16",
  "M14 8h36v50H14Z M22 20h20 M22 30h20 M22 40h12",
  "m24 14-16 18 16 18 m16-36 16 18-16 18 M36 8 28 56",
];
export const ServicesScene: React.FC<ReelProps> = ({assets}) => <SceneShell>
  <Safe>
    <Reveal><Eyebrow>FROM MODEL TO DELIVERY / 03</Eyebrow></Reveal>
    <Reveal delay={5}><Heading>Precision.<br/><span style={{color: brand.light}}>At every stage.</span></Heading></Reveal>
    <div style={{display: "flex", gap: 18, height: 330, marginTop: 55, marginBottom: 26}}>
      {(["structural", "technology"] as const).map((asset, i) => <Reveal key={asset} delay={14+i*7} style={{flex: 1, position: "relative", overflow: "hidden", borderRadius: 5, border: "1px solid #68BBE345"}}>
        <Asset asset={asset} available={assets[asset]}/>
        <div style={{position: "absolute", inset: 0, background: "linear-gradient(transparent,#030D1B80)"}}/>
      </Reveal>)}
    </div>
    {reel.services.map((service, i) => <Reveal key={service} delay={28+i*12} style={{display: "flex", alignItems: "center", gap: 25, height: 137, padding: "0 28px", marginBottom: 13, background: "linear-gradient(100deg,#003060a0,#055C9D24)", border: "1px solid #68BBE335", borderLeft: "3px solid #0E86D4", borderRadius: 4}}>
      <svg width="57" height="57" viewBox="0 0 64 64" fill="none" stroke={brand.light} strokeWidth="1.5"><path d={icons[i]}/></svg>
      <div style={{fontSize: 39, fontWeight: 550, letterSpacing: -1}}>{service}</div>
      <div style={{marginLeft: "auto", color: brand.muted, fontSize: 19}}>0{i+1}</div>
    </Reveal>)}
  </Safe>
</SceneShell>;
