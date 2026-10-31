import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {projectSchema,editableSchema,templateVersions} from '@elmekawy/shared';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const folder=path.join(root,'packages/shared/schemas/v1');await fs.mkdir(folder,{recursive:true});
await fs.writeFile(path.join(folder,'project.schema.json'),JSON.stringify(projectSchema,null,2)+'\n');
await fs.writeFile(path.join(folder,'editable-project.schema.json'),JSON.stringify({$schema:'http://json-schema.org/draft-07/schema#',$id:'urn:elmekawy:editable-project:1.0.0',...editableSchema},null,2)+'\n');
for(const template of templateVersions){const destination=path.join(root,'packages/templates/src',template.id,template.version);if(template.version==='1.0.0'){try{await fs.access(path.join(destination,'template.json'));continue;}catch{}}await fs.writeFile(path.join(destination,'template.json'),JSON.stringify({schemaVersion:'1.0.0',...template,capabilities:{fixedTiming:true,aspectRatios:['9:16'],fps:[30],resolutions:[{width:1080,height:1920}],audio:template.id==='bim-personal-intro'?'original-track':'none'}},null,2)+'\n');}
console.log('Wrote the exact runtime JSON schemas and pinned template manifests.');
