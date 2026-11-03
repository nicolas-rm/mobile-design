// Content fingerprints keep a cached page from mixing different releases.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
export const assetHash=file=>createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex').slice(0,12);
const write=(file,transform)=>{
 const target=path.join(root,file),original=fs.readFileSync(target,'utf8'),updated=transform(original);
 if(original!==updated)fs.writeFileSync(target,updated);
};
write('styles.css',source=>source.replace(/\.\/assets\/material-symbols\.ttf(?:\?v=[a-f0-9]+)?/g,'./assets/material-symbols.ttf?v='+assetHash('assets/material-symbols.ttf')));
write('app.js',source=>source.replace(/from '\.\/(illustrations|component-docs|site-sections)\.js(?:\?v=[a-f0-9]+)?'/g,(_,name)=>`from './${name}.js?v=${assetHash(name+'.js')}'`));
write('index.html',source=>source.replace(/(?:href|src)="\.\/(styles\.css|structure\.css|app\.js|assets\/material-symbols\.ttf)(?:\?v=[a-f0-9]+)?"/g,(_,file)=>`${file==='app.js'?'src':'href'}="./${file}?v=${assetHash(file)}"`));
console.log('Asset fingerprints updated.');
