/** Shared platform boundaries for the native component contract harnesses. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const requireShared = require('./require-mobile-design-shared.cjs');
module.exports = function nativeBoundary(name, modules) {
    if (name === '@mobile-design/tokens') return requireShared(name);
    const native = modules['react-native'] ?? {};
    native.Platform ??= { OS: 'ios' };
    if (name === 'react-native') return native;
    if (name !== '../web-accessibility' && name !== '../ripple') return undefined;
    const file = path.join(__dirname, '../packages/mobile-design/src', name === '../ripple' ? 'ripple.tsx' : 'web-accessibility.ts');
    const exports = {};
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(source, { exports, require: (key) => (key === 'react-native' ? native : modules[key]) }, { filename: file });
    return exports;
};
