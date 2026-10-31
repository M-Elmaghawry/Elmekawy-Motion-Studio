import {Composition} from 'remotion';
import {StudioV1,StudioV2} from './client';
import type {RuntimeProps} from '@elmekawy/shared';
import {FlexibleReel,flexibleMetadata} from './flexible';
import flexibleFixture from '../../templates/src/flexible-reel/1.0.0/sample.json';
import type {FlexibleProject} from '@elmekawy/shared/flexible';
const defaultProps:RuntimeProps={assets:{infrastructure:true,structural:true,technology:true,portrait:true,logo:true,before:false,after:false},media:{},edits:{}};
export const RemotionRoot=()=> <><Composition id="ElmekawyBIMIntro" component={StudioV1} width={1080} height={1920} fps={30} durationInFrames={900} defaultProps={defaultProps}/><Composition id="ElmekawyBIMIntroV2" component={StudioV2} width={1080} height={1920} fps={30} durationInFrames={360} defaultProps={defaultProps}/><Composition id="FlexibleReel" component={FlexibleReel} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{project:flexibleFixture as FlexibleProject,media:{}}} calculateMetadata={flexibleMetadata}/></>;
