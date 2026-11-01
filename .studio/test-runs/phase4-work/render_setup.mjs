import fs from 'node:fs';
const file='packages/templates/package.json',json=JSON.parse(fs.readFileSync(file,'utf8'));json.exports['./flexible-reel/1.1.0']='./src/flexible-reel/1.1.0/Composition.tsx';fs.writeFileSync(file,JSON.stringify(json,null,2)+'\n');
let t=fs.readFileSync('packages/motion-engine/src/flexible.tsx','utf8');t=t.replace("export { FlexibleReel } from '@elmekawy/templates/flexible-reel/1.0.0';",`import React from 'react';
import {FlexibleReel as OriginalFlexible} from '@elmekawy/templates/flexible-reel/1.0.0';
import {FlexibleReel as MediaFlexible} from '@elmekawy/templates/flexible-reel/1.1.0';
export const FlexibleReel: React.FC<FlexibleRuntimeProps> = props => props.project.schemaVersion==='2.1.0'?<MediaFlexible {...props}/>:<OriginalFlexible {...props}/>;`);fs.writeFileSync('packages/motion-engine/src/flexible.tsx',t);
t=fs.readFileSync('apps/server/src/render-worker.ts','utf8').replace('audio:flexible.audio','audio:{mode:flexible.audio.mode===\'timeline\'&&flexible.audio.tracks.some(track=>track.volume>0)?\'track\':\'none\'}');fs.writeFileSync('apps/server/src/render-worker.ts',t);
