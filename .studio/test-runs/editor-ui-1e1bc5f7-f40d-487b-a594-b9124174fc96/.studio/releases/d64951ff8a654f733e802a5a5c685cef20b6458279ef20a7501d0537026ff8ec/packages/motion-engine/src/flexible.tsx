import { parseFlexibleProject, compileTimeline } from '@elmekawy/shared/flexible';
import type { FlexibleRuntimeProps } from '@elmekawy/shared/flexible';
export { FlexibleReel } from '@elmekawy/templates/flexible-reel/1.0.0';

export function flexibleMetadata({ props }: { props: FlexibleRuntimeProps }) {
  const project = parseFlexibleProject(props.project);
  return {
    width: project.outputProfile.width,
    height: project.outputProfile.height,
    fps: project.outputProfile.fps,
    durationInFrames: compileTimeline(project.scenes).durationFrames,
  };
}
