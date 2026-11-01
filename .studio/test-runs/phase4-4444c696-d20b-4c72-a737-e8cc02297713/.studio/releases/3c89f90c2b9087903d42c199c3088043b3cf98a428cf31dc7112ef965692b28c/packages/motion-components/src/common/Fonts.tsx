import {useEffect,useState} from 'react';
import {cancelRender,continueRender,delayRender} from 'remotion';
import {useMedia} from './Runtime.tsx';
const loaded=new Map<string,Promise<void>>();
function load(family:string,url:string){
  const key=family+'|'+url;
  if(!loaded.has(key))loaded.set(key,(async()=>{const face=new FontFace(family,`url("${url}")`,{weight:'100 900'});document.fonts.add(await face.load());})().catch(error=>{loaded.delete(key);throw error;}));
  return loaded.get(key)!;
}
export const Fonts:React.FC=()=>{
  const media=useMedia();const inter=media('fonts/Inter.ttf'),cairo=media('fonts/Cairo.ttf');
  const [handle]=useState(()=>delayRender('Loading exact local Cairo and Inter'));
  useEffect(()=>{let active=true;Promise.all([load('Inter',inter),load('Cairo',cairo)]).then(()=>{if(active)continueRender(handle);}).catch(cancelRender);return()=>{active=false;};},[handle,inter,cairo]);
  return null;
};
