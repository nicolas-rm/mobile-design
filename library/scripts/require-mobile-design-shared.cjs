const { createRequire } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Resolve real shared data from the same dependency boundary as the components.
module.exports = createRequire(require.resolve('mobile-design/package.json'));

// Execute the real icon entry against explicit React Native/Expo boundaries.
module.exports.loadMaterialIcons = function loadMaterialIcons(mocks, collection = 'base') {
    const root = path.resolve(__dirname, '..');
    const base = path.join(root, 'packages/mobile-design/src/material-symbols.tsx');
    const full = path.join(root, 'packages/mobile-design-icons/src/index.tsx');
    const cache = new Map();
    function load(filename) {
        if (cache.has(filename)) return cache.get(filename);
        const exports = {};
        cache.set(filename, exports);
        const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
            compilerOptions: {
                target: ts.ScriptTarget.ES2022,
                module: ts.ModuleKind.CommonJS,
                jsx: ts.JsxEmit.ReactJSX,
                esModuleInterop: true,
            },
        }).outputText;
        vm.runInNewContext(code, {
            exports,
            require(request) {
                if (request === 'mobile-design/react-native') return load(base);
                if (Object.hasOwn(mocks, request)) return mocks[request];
                const relative = path.resolve(path.dirname(filename), request);
                if (request.startsWith('.')) {
                    if (request.endsWith('.ttf')) return relative;
                    for (const extension of ['.ts', '.tsx'])
                        if (fs.existsSync(relative + extension)) return load(relative + extension);
                }
                throw Error(`${filename}: missing test boundary for ${request}`);
            },
        }, { filename });
        return exports;
    }
    const entry = load(collection === 'full' ? full : base);
    return {
        ...entry,
        renderIcon(props) {
            let element = entry.renderMaterialIcon(props);
            while (typeof element?.type === 'function') element = element.type(element.props);
            return element;
        },
    };
};
