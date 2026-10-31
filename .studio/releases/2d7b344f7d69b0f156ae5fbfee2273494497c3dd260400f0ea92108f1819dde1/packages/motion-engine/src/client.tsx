import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ElmekawyBIMIntro,ElmekawyBIMIntroV2} from '@elmekawy/templates';
import {RuntimeProvider} from '@elmekawy/motion-components/common/Runtime.tsx';
import type {RuntimeProps} from '@elmekawy/shared';
export const StudioV1:React.FC<RuntimeProps>=props=><RuntimeProvider media={props.media} edits={props.edits}><AbsoluteFill style={{fontSize:16,lineHeight:'normal',fontWeight:400,direction:'ltr'}}><ElmekawyBIMIntro assets={props.assets as React.ComponentProps<typeof ElmekawyBIMIntro>['assets']}/></AbsoluteFill></RuntimeProvider>;
export const StudioV2:React.FC<RuntimeProps>=props=><RuntimeProvider media={props.media} edits={props.edits}><AbsoluteFill style={{fontSize:16,lineHeight:'normal',fontWeight:400,direction:'ltr'}}><ElmekawyBIMIntroV2 assets={props.assets as React.ComponentProps<typeof ElmekawyBIMIntroV2>['assets']}/></AbsoluteFill></RuntimeProvider>;
