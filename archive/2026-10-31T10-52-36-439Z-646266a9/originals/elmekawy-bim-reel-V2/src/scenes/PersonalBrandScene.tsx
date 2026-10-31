import {brand} from "../brand/theme";
import {Asset, Eyebrow, Heading, Reveal, Safe, SceneShell} from "../components/Motion";
import {reel, type ReelProps} from "../scene-data";

export const PersonalBrandScene: React.FC<ReelProps> = ({assets}) => <SceneShell><Safe>
  <Reveal><Eyebrow>ENGINEER. EDUCATOR. / 05</Eyebrow></Reveal>
  <Reveal delay={6} style={{position: "relative", width: 650, height: 670, margin: "40px auto 55px", border: "1px solid #68BBE370", borderRadius: "220px 220px 12px 12px", overflow: "hidden"}}>
    <Asset asset="portrait" available={assets.portrait} portrait/>
    <div style={{position: "absolute", inset: 0, background: "linear-gradient(transparent 65%,#030D1Baa)"}}/>
  </Reveal>
  <Reveal delay={18}><Heading style={{fontSize: 84}}>Mahmoud<br/><span style={{color: brand.light}}>Elmekawy.</span></Heading></Reveal>
  <Reveal delay={30} style={{fontSize: 37, marginTop: 28}}>{reel.subtitle}</Reveal>
 
</Safe></SceneShell>;
