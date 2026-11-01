import fs from 'node:fs';
const file='scripts/verify-render-smoke.mjs';let t=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
t=t.replace("for (const version of ['1.0.0', '1.1.0'])", "for (const version of ['1.0.0', '1.1.0', '1.2.0'])");
t=t.replace("        templateVersion: version,", "        templateVersion: version,\n        ...(version==='1.2.0'?{imageLayouts:{},imageKeys:Object.fromEntries(project.assets.map(asset=>[asset.id,asset.mediaKey]))}:{}),");
t=t.replace("      if (version !== '1.1.0') continue;",`      if(version==='1.2.0'){
        const asset=project.assets.find(asset=>asset.role===(item.template==='bim-personal-intro'?'infrastructure':'structural'));
        assert.ok(asset);const scene=item.template==='bim-personal-intro'?'infrastructure':'network';
        const variant={...inputProps,imageLayouts:{[scene]:{[asset.id]:{fit:'contain',focalPoint:{x:0.5,y:0.5},frame:{x:0.4,y:0.55,width:0.75,height:0.75},transform:{scale:1.2,offsetX:0.1,offsetY:0}}}}};
        const changedFrame=item.template==='bim-personal-intro'?132:134;
        const changed=await renderStill({...common,serveUrl,composition,inputProps:variant,frame:changedFrame,imageFormat:'png',output:null});
        assert.notEqual(createHash('sha256').update(changed.buffer).digest('hex'),expected.get(changedFrame),'Image transform must change its scene pixels');
        const unrelated=await renderStill({...common,serveUrl,composition,inputProps:variant,frame:45,imageFormat:'png',output:null});
        assert.equal(createHash('sha256').update(unrelated.buffer).digest('hex'),expected.get(45),'Image transform must not change another scene');
        checks.push({kind:'scene-local-image-transform',composition:item.id,version,passed:true});
      }
      if (version !== '1.1.0') continue;`);
t=t.replace('boundary pixels (both versions)', 'boundary pixels (all three versions) and scene-local image transforms');
fs.writeFileSync(file,t);
