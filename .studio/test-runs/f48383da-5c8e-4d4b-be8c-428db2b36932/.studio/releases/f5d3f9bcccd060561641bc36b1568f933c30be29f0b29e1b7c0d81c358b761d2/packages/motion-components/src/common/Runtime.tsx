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
