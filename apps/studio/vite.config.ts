import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({root:fileURLToPath(new URL('.',import.meta.url)),publicDir:false,esbuild:{jsx:'automatic'},resolve:{dedupe:['react','react-dom','remotion']},server:{host:'127.0.0.1',port:5173,strictPort:true,proxy:{'/api':'http://127.0.0.1:4310','/media':'http://127.0.0.1:4310','/ui-fonts':'http://127.0.0.1:4310'}},build:{outDir:'dist',emptyOutDir:true}});
