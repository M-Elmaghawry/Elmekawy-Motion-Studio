import {useEffect, useState} from "react";
import {cancelRender, continueRender, delayRender, staticFile} from "remotion";

// Load local variable fonts before any frame is captured.
export const Fonts: React.FC = () => {
  const [handle] = useState(() => delayRender("Loading local Cairo and Inter"));
  useEffect(() => {
    let active = true;
    Promise.all(["Inter", "Cairo"].map(async (family) => {
      const face = new FontFace(family, 'url("' + staticFile("fonts/" + family + ".ttf") + '")', {weight: "100 900"});
      document.fonts.add(await face.load());
    })).then(() => {if (active) continueRender(handle);})
      .catch((error: unknown) => cancelRender(error));
    return () => {active = false;};
  }, [handle]);
  return null;
};
