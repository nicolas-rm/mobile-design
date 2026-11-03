import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const port=Number(process.env.PORT??4317);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ttf':'font/ttf','.tsx':'text/plain; charset=utf-8'};
const server=http.createServer((request,response)=>{
  if(!['GET','HEAD'].includes(request.method)){response.writeHead(405,{'Allow':'GET, HEAD'});response.end();return;}
  let relative;
  try{relative=decodeURIComponent(new URL(request.url,'http://localhost').pathname);}catch{response.writeHead(400);response.end('Solicitud inválida');return;}
  const file=path.resolve(root,'.'+(relative==='/'?'/index.html':relative));
  if(!file.startsWith(root+path.sep)){response.writeHead(403);response.end('Ruta no permitida');return;}
  fs.stat(file,(error,stat)=>{
    if(error||!stat.isFile()){response.writeHead(404);response.end('Archivo no encontrado');return;}
    response.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});
    if(request.method==='HEAD')response.end();else fs.createReadStream(file).pipe(response);
  });
});
server.listen(port,'127.0.0.1',()=>console.log(`Mobile Design docs: http://127.0.0.1:${port}/`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
