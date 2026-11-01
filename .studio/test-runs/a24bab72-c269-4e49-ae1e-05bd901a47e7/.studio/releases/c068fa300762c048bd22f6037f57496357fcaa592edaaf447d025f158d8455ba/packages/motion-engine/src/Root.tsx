import {Composition} from 'remotion';
import {StudioV1,StudioV2} from './client';
import type {RuntimeProps} from '@elmekawy/shared';
const defaultProps:RuntimeProps={assets:{infrastructure:true,structural:true,technology:true,portrait:true,logo:true,before:false,after:false},media:{},edits:{}};
export const RemotionRoot=()=> <><Composition id="ElmekawyBIMIntro" component={StudioV1} width={1080} height={1920} fps={30} durationInFrames={900} defaultProps={defaultProps}/><Composition id="ElmekawyBIMIntroV2" component={StudioV2} width={1080} height={1920} fps={30} durationInFrames={360} defaultProps={defaultProps}/></>;
