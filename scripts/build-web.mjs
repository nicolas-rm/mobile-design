import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {packageContext} from './package-context.mjs';

const {site,packageRoot,workspace}=packageContext();
const workspaceRequire=createRequire(path.join(workspace,'package.json'));
const expo=workspaceRequire.resolve('expo/bin/cli');
const runtime=path.join(site,'runtime');
// Resolve Expo from the consumer workspace even when this checkout lives elsewhere.
const runtimeModules=path.join(runtime,'node_modules');
if(!fs.existsSync(runtimeModules))fs.symlinkSync(path.join(workspace,'node_modules'),runtimeModules,'dir');
const destination=path.join(site,'dist/runtime/components');
const {ts,options}=packageContext();
const typecheck=ts.createProgram([path.join(runtime,'index.tsx'),path.join(runtime,'types.d.ts'),path.join(packageRoot,'src/paper-internals.d.ts')],{...options,noEmit:true});
const diagnostics=ts.getPreEmitDiagnostics(typecheck);
if(diagnostics.length){console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:file=>file,getCurrentDirectory:()=>workspace,getNewLine:()=> '\n'}));process.exit(1);}
const result=spawnSync(process.execPath,[expo,'export','--platform','web','--output-dir',destination,'--max-workers','2'],{
  cwd:runtime,stdio:'inherit',env:{...process.env,MOBILE_DESIGN_PACKAGE_DIR:packageRoot,EXPO_NO_DOTENV:'1'}
});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status??1);
const htmlPath=path.join(destination,'index.html');
let html=fs.readFileSync(htmlPath,'utf8').replace('<html lang="en">','<html lang="es">');
html=html.replace('<title>Mobile Design</title>','<title>Mobile Design · Ejemplos</title><link rel="icon" href="../../assets/favicon.svg">');
fs.writeFileSync(htmlPath,html);
// Retain the licenses of the package and its dependency tree with the export.
const licensed=new Set();
const notices=[];
function collectLicenses(directory){
 const manifest=path.join(directory,'package.json');if(licensed.has(manifest))return;licensed.add(manifest);
 const meta=JSON.parse(fs.readFileSync(manifest,'utf8'));
 const licenseFiles=fs.readdirSync(directory).filter(file=>/^(licen[sc]e|copying|notice)([._-]|$)/i.test(file)&&fs.statSync(path.join(directory,file)).isFile());
 notices.push(`${meta.name}@${meta.version}\nLicense: ${typeof meta.license==='string'?meta.license:meta.license?.type??'See bundled notice'}\n${licenseFiles.map(file=>fs.readFileSync(path.join(directory,file),'utf8')).join('\n')}`);
 const localRequire=createRequire(manifest);
 for(const name of Object.keys({...meta.dependencies,...meta.peerDependencies})){try{
  let dependency;
  try{dependency=path.dirname(localRequire.resolve(name+'/package.json'));}catch{let current=path.dirname(localRequire.resolve(name));while(current!==path.dirname(current)){if(fs.existsSync(path.join(current,'package.json'))){const candidate=JSON.parse(fs.readFileSync(path.join(current,'package.json'),'utf8'));if(candidate.name===name){dependency=current;break;}}current=path.dirname(current);}}
  if(dependency)collectLicenses(dependency);
 }catch{/* Optional packages absent from this consumer are not bundled. */}}
}
collectLicenses(packageRoot);
fs.writeFileSync(path.join(destination,'THIRD_PARTY_NOTICES.txt'),notices.join('\n\n'+'='.repeat(72)+'\n\n')+'\n');
const hash=createHash('sha256').update(html).digest('hex').slice(0,12);
const sourceHash=createHash('sha256');
const hashSource=directory=>{for(const entry of fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(directory,entry.name);if(entry.isDirectory())hashSource(file);else{sourceHash.update(path.relative(packageRoot,file));sourceHash.update(fs.readFileSync(file));}}};
hashSource(path.join(packageRoot,'src'));
const fingerprint=sourceHash.digest('hex');
const examples=Object.fromEntries(Object.entries({buttons:'Button','extended-fab':'ExtendedFAB','fab-menu':'FABMenu','floating-action-button':'FAB','icon-buttons':'IconButton'}).map(([id,component])=>[id,{url:`./runtime/components/index.html?v=${hash}&component=${id}`,sourceHash:fingerprint,runtime:'react-native-web',component}]));
const script=html.match(/<script[^>]+src="([^"]+\.js)"/)[1];
fs.writeFileSync(path.join(site,'dist/web-examples.js'),'// Generated from the real package by npm run build:web.\nexport const webExamples='+JSON.stringify(examples,null,2)+';\nexport const webRuntime='+JSON.stringify({script})+';\n');
console.log('Web component runtime exported. Source fingerprint:',fingerprint);
