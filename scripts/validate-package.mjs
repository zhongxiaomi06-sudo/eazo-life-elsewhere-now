import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),manifest=JSON.parse(await readFile(path.join(root,'HANDOFF-MANIFEST.json'),'utf8'));
const hash=(body)=>createHash('sha256').update(body).digest('hex');
for(const item of manifest.files){const body=await readFile(path.join(root,item.path));if(body.length!==item.bytes||hash(body)!==item.sha256)throw new Error('Integrity mismatch: '+item.path);}
const appDirs=(await readdir(path.join(root,'apps'),{withFileTypes:true})).filter((x)=>x.isDirectory()).map((x)=>x.name);
const skillDirs=(await readdir(path.join(root,'skills'),{withFileTypes:true})).filter((x)=>x.isDirectory()).map((x)=>x.name);
if(appDirs.length!==1||appDirs[0]!=="life-elsewhere-now")throw new Error('Unexpected app package');
if(skillDirs.length!==1||skillDirs[0]!=="compare-life-contexts")throw new Error('Unexpected skill package');
for(const file of ["README.md","PRODUCT.md","DESIGN.md","CONTENT.md","ARCHITECTURE.md","TESTING.md","RELEASE.md"])await stat(path.join(root,'apps',"life-elsewhere-now",file));
console.log('PASS life-elsewhere-now: '+manifest.files.length+' files, skill compare-life-contexts');
