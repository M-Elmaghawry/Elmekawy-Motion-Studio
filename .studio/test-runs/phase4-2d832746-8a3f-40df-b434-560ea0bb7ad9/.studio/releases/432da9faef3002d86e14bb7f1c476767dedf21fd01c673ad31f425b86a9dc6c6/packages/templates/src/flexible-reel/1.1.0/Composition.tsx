import React, { useId, useMemo } from 'react';
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { parseFlexibleProject, compileTimeline, scenesAtFrame, renderReadinessErrors } from '@elmekawy/shared/flexible';
import type { FlexibleRuntimeProps, AudioTrack } from '@elmekawy/shared/flexible';
import { FlexibleFonts, SafeTextGuard } from '../1.0.0/RenderGuards';
import { RenderScene } from './Scenes';

function SoundTrack({track,src}:{track:AudioTrack;src:string}){
  const frame=useCurrentFrame();
  const fadeIn=track.fadeInFrames?Math.min(1,frame/track.fadeInFrames):1;
  const fadeOut=track.fadeOutFrames?Math.min(1,(track.durationFrames-1-frame)/track.fadeOutFrames):1;
  return <Audio src={src} trimBefore={track.trimStartFrame} durationInFrames={track.durationFrames} volume={Math.max(0,track.volume*fadeIn*fadeOut)}/>;
}
export function FlexibleReel({project:input,media,preview=false}:FlexibleRuntimeProps){
  const project=useMemo(()=>parseFlexibleProject(input),[input]);
  const timeline=useMemo(()=>compileTimeline(project.scenes),[project]);
  const frame=useCurrentFrame(),config=useVideoConfig(),rootId=useId(),{safeArea:safe,colors}=project.brand;
  if(project.schemaVersion!=='2.1.0')throw Error('FLEXIBLE_RELEASE_MISMATCH');
  if(!preview&&renderReadinessErrors(project).length)throw Error(renderReadinessErrors(project).join(';'));
  const ids=[project.brand.fonts.arabicAssetId,project.brand.fonts.latinAssetId,...project.scenes.flatMap(scene=>scene.mediaBindings.map(binding=>binding.assetId)),...(project.audio.mode==='timeline'?project.audio.tracks.map(track=>track.assetId):[])];
  for(const id of ids)if(!media[id])throw Error('MISSING_MEDIA_URL:'+id);
  if(config.fps!==project.outputProfile.fps||config.width!==project.outputProfile.width||config.height!==project.outputProfile.height||config.durationInFrames!==timeline.durationFrames)throw Error('FLEXIBLE_METADATA_MISMATCH');
  const active=scenesAtFrame(timeline,frame),short=config.height<1500;
  return <FlexibleFonts arabic={media[project.brand.fonts.arabicAssetId]} latin={media[project.brand.fonts.latinAssetId]}><AbsoluteFill id={rootId} style={{background:colors.background,color:colors.foreground,fontFamily:'Cairo,Inter,sans-serif',direction:project.locale.direction,overflow:'hidden'}}>
    {active.map(entry=>{
      const scene=project.scenes[entry.index],exit=scene.motion.exitFrames?Math.min(1,(entry.durationFrames-1-entry.localFrame)/Math.max(1,scene.motion.exitFrames-1)):1;
      return <Sequence key={entry.id} from={entry.startFrame} durationInFrames={entry.durationFrames} layout="none"><AbsoluteFill data-scene-id={entry.id} style={{opacity:entry.opacity,background:colors.background}}><main dir={scene.direction} style={{position:'absolute',left:safe.left,right:safe.right,top:safe.top+(short?65:100),bottom:safe.bottom,display:'flex',flexDirection:'column',justifyContent:'center',gap:short?18:32,opacity:Math.max(0,exit)}}><RenderScene scene={scene} project={project} media={media} localFrame={entry.localFrame}/></main></AbsoluteFill></Sequence>;
    })}
    <div style={{position:'absolute',left:safe.left,right:safe.right,top:safe.top,height:short?40:56,display:'flex',justifyContent:'space-between',gap:30,fontSize:short?24:30,color:colors.accent,zIndex:2}}><span data-safe-text dir="auto" style={{whiteSpace:'nowrap',overflow:'hidden'}}>{project.brand.displayName}</span><span data-safe-text dir="ltr">{active[active.length-1].index+1} / {project.scenes.length}</span></div>
    {project.audio.mode==='timeline'&&project.audio.tracks.filter(track=>track.volume>0).map(track=><Sequence key={track.id} from={track.startFrame} durationInFrames={track.durationFrames} layout="none"><SoundTrack track={track} src={media[track.assetId]}/></Sequence>)}
    <SafeTextGuard preview={preview} rootId={rootId} safe={safe} width={config.width} height={config.height} frame={frame}/>
  </AbsoluteFill></FlexibleFonts>;
}
