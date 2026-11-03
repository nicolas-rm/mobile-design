import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {previewMarkup} from '../dist/previews.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const data=JSON.parse(fs.readFileSync(path.join(dist,'data.json'),'utf8'));
assert.equal(data.components.length,36);
assert.equal(new Set(data.components.map(c=>c.id)).size,36);
const assets=['index.html','styles.css','app.js','previews.js','assets/material-symbols.ttf','assets/roboto-regular.ttf','assets/roboto-medium.ttf','assets/roboto-bold.ttf','assets/favicon.svg'];
for(const file of assets)assert.ok(fs.statSync(path.join(dist,file)).size>0,file);
for(const c of data.components){
 assert.ok(c.description&&c.guidance&&c.accessibility,c.id+' editorial');
 assert.ok(c.api.length>0,c.id+' API');
 assert.ok(c.example.includes("from 'mobile-design'"),c.id+' import');
 assert.equal(fs.readFileSync(path.join(dist,'examples',c.id+'.tsx'),'utf8'),c.example);
 assert.ok(fs.existsSync(path.join(dist,'native',c.id+'.png')),c.id+' native capture');
 assert.ok(c.reference.startsWith('https://m3.material.io/components/'));
 const preview=previewMarkup(c.id,{staticView:true});
 assert.ok(!/<(?:button|input|a)\b/.test(preview),c.id+' static card must not nest interactive controls');
}
for(const file of ['app.js','previews.js'])assert.equal(spawnSync(process.execPath,['--check',path.join(dist,file)],{encoding:'utf8'}).status,0,file+' syntax');
assert.equal(data.colors.light.primary,'rgba(103, 80, 164, 1)');
assert.equal(data.verification.nativeCases,65);
console.log('PASS: 36 complete documentation entries, 36 native captures, 36 downloadable examples, API data, static-card semantics, palette and JavaScript syntax.');
