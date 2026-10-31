import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../dist',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.xml':'application/xml','.txt':'text/plain'};
http.createServer(async(req,res)=>{
  try {
    let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(path!==root && !path.startsWith(root+sep)) { res.writeHead(403).end();return; }
    if((await stat(path)).isDirectory()) path=resolve(path,'index.html');
    const content=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(content);
  } catch {res.writeHead(404,{'Content-Type':'text/html'});res.end(await readFile(resolve(root,'404.html')));}
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
