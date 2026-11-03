import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const workspace=path.resolve(site,'../..');
const ts=createRequire(path.join(workspace,'package.json'))('typescript');
const config=ts.readConfigFile(path.join(workspace,'tsconfig.json'),ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,workspace);
const files=fs.readdirSync(path.join(site,'dist/examples')).filter(f=>f.endsWith('.tsx')).map(f=>path.join(site,'dist/examples',f));
const program=ts.createProgram(files,{...parsed.options,noEmit:true});
const diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length) {
 console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>workspace,getNewLine:()=> '\n'}));
 process.exitCode=1;
} else console.log(`PASS: ${files.length} complete React Native examples type-check against Mobile Design.`);
