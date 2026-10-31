import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../dist',import.meta.url));
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(x=>x.isDirectory()?walk(resolve(dir,x.name)):resolve(dir,x.name)))).flat();}
const files=(await walk(root)).filter(f=>f.endsWith('.html'));
const errors=[];let references=0;
for(const file of files){
  const html=await readFile(file,'utf8'),label=relative(root,file);
  if((html.match(/<h1[ >]/g)||[]).length!==1)errors.push(`${label}: expected one primary heading`);
  if(!/<meta name="description" content="[^"]+"/.test(html))errors.push(`${label}: missing description`);
  if(!/<link rel="canonical" href="https:\/\//.test(html))errors.push(`${label}: missing canonical URL`);
  for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))try{JSON.parse(m[1]);}catch{errors.push(`${label}: invalid structured data`);}
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if(new Set(ids).size!==ids.length)errors.push(`${label}: duplicate HTML IDs`);
  for(const m of html.matchAll(/\b(?:href|src)="([^"<]+)"/g)){
    const raw=m[1].replace(/&amp;/g,'&');
    if(!raw.startsWith('/')||raw.startsWith('//'))continue;
    const url=new URL(raw,'https://example.org');let target=resolve(root,'.'+decodeURIComponent(url.pathname));
    if(target!==root&&!target.startsWith(root+sep)){errors.push(`${label}: path outside website`);continue;}
    if(url.pathname.endsWith('/'))target=resolve(target,'index.html');
    try{await access(target);references++;if(url.hash&&target.endsWith('.html')){const linked=await readFile(target,'utf8');if(!linked.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`))errors.push(`${label}: missing fragment ${raw}`);}}
    catch{errors.push(`${label}: broken reference ${raw}`);}
  }
  for(const tag of html.matchAll(/<img\b[^>]*>/g))if(!/\balt="[^"]*"/.test(tag[0]))errors.push(`${label}: image without alternative text`);
}
for(const name of ['sitemap.xml','robots.txt','search-index.json','404.html'])try{await access(resolve(root,name));}catch{errors.push(`Missing ${name}`);}
const index=JSON.parse(await readFile(resolve(root,'search-index.json'),'utf8'));
for(const item of index){const url=new URL(item.url,'https://example.org');let target=resolve(root,'.'+url.pathname);if(url.pathname.endsWith('/'))target=resolve(target,'index.html');try{await access(target);}catch{errors.push(`Search result points to a missing page: ${item.url}`);}}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Verified ${files.length} HTML files, ${references} internal references, and ${index.length} search entries. No broken local links or missing metadata.`);
