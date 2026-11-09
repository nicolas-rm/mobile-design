/** Exercise the installed worklet compiler and an isolated serialized rail calculation.
 * This catches native closure capture failures that the web renderer/JSX harness cannot expose.
 * It does not reproduce Reanimated's native scheduler or measure rendered animation frames.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const compilerRequire = createRequire(require.resolve('react-native-worklets/plugin'));
const babel = compilerRequire('@babel/core');
const ts = require('typescript');
const file = path.resolve(__dirname, '../packages/mobile-design/src/components/navigation.tsx');
const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let calculation;
function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'currentLayout') calculation = node.initializer.getText(ast);
    ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(calculation, 'The actual rail geometry worklet is present');
const helper = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../packages/mobile-design/src/components/navigation-rail-layout.ts'), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, {exports:helper});
const compiled = babel.transformSync(`
const {railWidth, expansion, collapsedHeight, expandedLabelHeight, labelWidth, badgeWidth, labelVisible, fullWidth, rtl, navigationRailDestinationLayout} = fixtures;
exports.subject = ${calculation};`, {
    filename: file, configFile: false, babelrc: false,
    presets: [compilerRequire.resolve('@babel/preset-typescript')],
    plugins: [require.resolve('react-native-worklets/plugin')],
}).code;
let count = 0;
for (const [width, progress, rtl] of [[96,0,false],[256,1,false],[176,0.5,true]]) {
    const exports = {};
    vm.runInNewContext(compiled, {exports, global: {Error}, fixtures:{
        railWidth:{get:()=>width}, expansion:{get:()=>progress}, collapsedHeight:64,
        expandedLabelHeight:20, labelWidth:88, badgeWidth:20, labelVisible:true, fullWidth:false, rtl,
        navigationRailDestinationLayout:helper.navigationRailDestinationLayout,
    }});
    assert.ok(exports.subject.__initData?.code, 'The installed native worklet transform ran');
    const isolated = vm.runInNewContext('(' + exports.subject.__initData.code + ')');
    // No railWidth/expansion globals are supplied: they must travel through the serialized closure.
    const actual = isolated.call(exports.subject);
    const expected = helper.navigationRailDestinationLayout({railWidth:width, expansion:progress,collapsedHeight:64,expandedHeight:52,labelWidth:88,badgeWidth:20,labelVisible:true,fullWidth:false,rtl});
    assert.equal(JSON.stringify(actual), JSON.stringify(expected));
    count++;
}
console.log(`PASS: ${count} native-compiled rail geometry closures execute without component globals.`);

const barFile = path.join(path.dirname(file), 'navigation-bar.tsx');
const bar = ts.createSourceFile(barFile, fs.readFileSync(barFile, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const selectionFrame = bar.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === 'navigationSelectionFrame');
assert.ok(selectionFrame, 'the bar and rail use a shared selection worklet');
const selectionCode = babel.transformSync(
    `${selectionFrame.getText(bar).replace(/^export /, '')}\nexports.subject = navigationSelectionFrame;`,
    {
        filename: barFile,
        configFile: false,
        babelrc: false,
        presets: [compilerRequire.resolve('@babel/preset-typescript')],
        plugins: [require.resolve('react-native-worklets/plugin')],
    }
).code;
const selectionExports = {};
vm.runInNewContext(selectionCode, { exports: selectionExports, global: { Error } });
const reveal = vm.runInNewContext('(' + selectionExports.subject.__initData.code + ')');
for (const [left, width, icon] of [[0, 56, 28], [0, 64, 32], [0, 120, 28], [0, 120, 92], [20, 172, 28], [64, 172, 144]]) {
    assert.equal(reveal(left, width, icon, 0).left, left + icon, 'the reveal starts at the physical icon center');
    const half = reveal(left, width, icon, 0.5);
    assert.equal(half.left + icon * 0.5, left + icon, 'the icon remains the anchor as the capsule grows');
    assert.equal(half.width, width / 2);
    assert.equal(JSON.stringify(reveal(left, width, icon, 1.05)), JSON.stringify({ left, width, opacity: 1 }));
}
console.log('PASS: selection reveals anchor to the icon for vertical, horizontal, LTR and RTL destinations.');
