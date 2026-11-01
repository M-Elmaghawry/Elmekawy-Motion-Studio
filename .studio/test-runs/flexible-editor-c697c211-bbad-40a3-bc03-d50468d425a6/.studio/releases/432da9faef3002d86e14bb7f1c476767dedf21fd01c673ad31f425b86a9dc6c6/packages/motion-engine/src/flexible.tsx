import { parseFlexibleProject, compileTimeline } from '@elmekawy/shared/flexible';
import type { FlexibleRuntimeProps } from '@elmekawy/shared/flexible';
import React from 'react';
import {FlexibleReel as OriginalFlexible} from '@elmekawy/templates/flexible-reel/1.0.0';
import {FlexibleReel as MediaFlexible} from '@elmekawy/templates/flexible-reel/1.1.0';
export const FlexibleReel: React.FC<FlexibleRuntimeProps> = props => props.project.schemaVersion==='2.1.0'?<MediaFlexible {...props}/>:<OriginalFlexible {...props}/>;

export function flexibleMetadata({ props }: { props: FlexibleRuntimeProps }) {
  const project = parseFlexibleProject(props.project);
  return {
    width: project.outputProfile.width,
    height: project.outputProfile.height,
    fps: project.outputProfile.fps,
    durationInFrames: compileTimeline(project.scenes).durationFrames,
  };
}
