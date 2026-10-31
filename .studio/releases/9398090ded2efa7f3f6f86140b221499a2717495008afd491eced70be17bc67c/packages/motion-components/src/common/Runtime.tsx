import React, {createContext, useCallback, useContext, useMemo} from 'react';
import {staticFile} from 'remotion';
const RuntimeContext = createContext<{media:Record<string,string>;edits:Record<string,string>}>({media:{},edits:{}});
export const RuntimeProvider:React.FC<{media:Record<string,string>;edits:Record<string,string>;children:React.ReactNode}> = ({media,edits,children}) => {
  const value=useMemo(()=>({media,edits}),[media,edits]);
  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
};
export const useMedia=()=>{const {media}=useContext(RuntimeContext);return useCallback((key:string)=>media[key]??staticFile(key),[media]);};
export const useCopy=(source:string)=>useContext(RuntimeContext).edits[source]??source;
export const CopyText:React.FC<{text:string}>=({text})=>useCopy(text);
const TextScopeContext=createContext('');
export const TextScope:React.FC<{id:string;children:React.ReactNode}>=({id,children})=><TextScopeContext.Provider value={id}>{children}</TextScopeContext.Provider>;
export function resolveTextField(edits:Record<string,string>,scope:string,id:string,fallback:string){const key=id.startsWith('global.')||!scope?id:scope+'.'+id;return edits[key]??fallback;}
export const useTextResolver=()=>{const {edits}=useContext(RuntimeContext);const scope=useContext(TextScopeContext);return useCallback((id:string,fallback:string)=>resolveTextField(edits,scope,id,fallback),[edits,scope]);};
export const useTextField=(id:string,fallback:string)=>useTextResolver()(id,fallback);
export const TextField:React.FC<{id:string;text:string}>=({id,text})=>useTextField(id,text);
