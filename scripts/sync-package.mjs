import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { editorial, propertyDescriptions, dimensions } from '../content/editorial.mjs';
import { examples, exampleModule } from '../content/examples.mjs';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.resolve(site, '../..');
const require = createRequire(path.join(workspace, 'package.json'));
const ts = require('typescript');
const pkgRoot = path.join(workspace, 'packages/mobile-design');
const read = (file) => fs.readFileSync(path.join(pkgRoot, file), 'utf8');
const compiled = ts.transpileModule(read('src/catalog.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { mobileDesignCatalog: catalog, mobileDesignCatalogGroups: groups } = context.exports;
const config = ts.readConfigFile(path.join(workspace, 'tsconfig.json'), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, workspace);
const program = ts.createProgram([path.join(pkgRoot, 'src/index.ts')], parsed.options);
const checker = program.getTypeChecker();
const index = program.getSourceFile(path.join(pkgRoot, 'src/index.ts'));
const exports = checker.getExportsOfModule(checker.getSymbolAtLocation(index));
const publicSymbols = new Map(exports.map((symbol) => [symbol.name, symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol]));
const aliases = { 'extended-fab': 'ExtendedFAB', 'fab-menu': 'FABMenu', lists: 'ListItem', dialogs: 'Dialog', checkbox: 'Checkbox', 'radio-button': 'RadioButton', tooltips: 'RichTooltip' };
const coreProperties = new Set(['children','value','onValueChange','onChange','onChangeText','onPress','onDismiss','onClose','onClosed','visible','disabled','accessibilityLabel','accessibilityHint','accessibilityState','testID','theme','style','loading','selected','label','icon','color','status','title','description','left','right','mode','anchor']);
function apiFor(name) {
  const symbol = publicSymbols.get(name);
  if (!symbol) return [];
  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
  if (!declaration) return [];
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const signature = type.getCallSignatures()[0];
  if (!signature?.parameters[0]) return [];
  const propsType = checker.getTypeOfSymbolAtLocation(signature.parameters[0], declaration);
  return propsType.getProperties().flatMap((prop) => {
    const decl = prop.valueDeclaration ?? prop.declarations?.[0];
    if (!decl) return [];
    const local = decl.getSourceFile().fileName.startsWith(path.join(pkgRoot, 'src'));
    if (!local && !coreProperties.has(prop.name)) return [];
    const description = ts.displayPartsToString(prop.getDocumentationComment(checker));
    if (/^Internal\b/i.test(description) || ['iconOnly','iconSize','containerWidth','selectedRadius','disabledContentColor','disabledContainerOpacity','disabledOutlineOpacity'].includes(prop.name)) return [];
    const typeText = checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, decl), decl, ts.TypeFormatFlags.NoTruncation).replace(/import\("[^"]+"\)\./g, '');
    return [{name: prop.name, type: typeText, required: !(prop.flags & ts.SymbolFlags.Optional), description: propertyDescriptions[prop.name] ?? description, inherited: !local}];
  }).sort((a,b) => Number(b.required)-Number(a.required) || Number(a.inherited)-Number(b.inherited) || a.name.localeCompare(b.name));
}
const colorsContext = { module: { exports: {} }, exports: {} };
vm.runInNewContext(read('src/generated/material-colors.js'), colorsContext);
const colorModule = colorsContext.module.exports;
const tokens = colorModule.appColorTokens ?? colorModule.mobileDesignColorTokens;
const output = path.join(site, 'dist');
fs.mkdirSync(path.join(output, 'assets'), {recursive: true});
const packageJson = JSON.parse(read('package.json'));
const verified = JSON.parse(read('docs/ios-extended-results-2026-11-02.json'));
const data = {
  version: packageJson.version, generated: new Date().toISOString().slice(0,10), groups,
  components: catalog.map((entry) => ({...entry,
    primaryExport: aliases[entry.id] ?? entry.exports[0].split('.')[0],
    icon: editorial[entry.id][0], tagline: editorial[entry.id][1], description: editorial[entry.id][2], guidance: editorial[entry.id][3], accessibility: editorial[entry.id][4],
    dimensions: dimensions[entry.id] ?? [],
    example: exampleModule(examples[entry.id]),
    api: apiFor(aliases[entry.id] ?? entry.exports[0].split('.')[0]),
  })),
  peers: packageJson.peerDependencies,
  colors: tokens,
  verification: { date: verified.date, automatic: verified.automatic.blocksPassed, families: verified.matrix.familiesPassed, nativeCases: verified.finalNativeCases.total, voiceOver: verified.voiceOver.passed, largeText: verified.largeSystemText.passed, limits: verified.limits },
};
fs.writeFileSync(path.join(output, 'data.json'), JSON.stringify(data, null, 2)+'\n');
fs.mkdirSync(path.join(output,'examples'),{recursive:true});
for(const entry of data.components) fs.writeFileSync(path.join(output,'examples',entry.id+'.tsx'),entry.example);
const evidence = '/Users/nicolas-rm/.codex/visualizations/2026/10/25/01a17166-a4bb-7730-8869-2bbaa46baf3d/mobile-design-ios-extended-2026-11-02';
if(fs.existsSync(evidence)) {
  fs.mkdirSync(path.join(output,'native'),{recursive:true});
  for(const entry of catalog) {
    const source=path.join(evidence,entry.id+'-light.png');
    if(fs.existsSync(source)) fs.copyFileSync(source,path.join(output,'native',entry.id+'.png'));
  }
}
for (const [source,target] of [['Roboto_400Regular.ttf','roboto-regular.ttf'],['Roboto_500Medium.ttf','roboto-medium.ttf'],['Roboto_700Bold.ttf','roboto-bold.ttf'],['OFL.txt','Roboto-OFL.txt']]) {
  fs.copyFileSync(path.join(pkgRoot,'assets/fonts/roboto',source),path.join(output,'assets',target));
}
for (const license of ['LICENSE','NOTICE','LICENSE-Apache-2.0.txt']) {
  if (fs.existsSync(path.join(pkgRoot,license))) fs.copyFileSync(path.join(pkgRoot,license),path.join(output,'assets',license));
}
console.log(`Synced ${catalog.length} families, ${data.components.reduce((sum,c)=>sum+c.api.length,0)} API properties and the shared color palette.`);
