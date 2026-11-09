/**
 * Pure Node SFNT checks against the bundled originals, without fontTools/fontkit.
 * Reads the real TS asset manifest/map with the project's TypeScript transpiler.
 * Verifies binary metadata and Unicode cmap coverage, not native font layout,
 * axis animation, font fallback, rasterization or accessibility of the renderer.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const base = 'packages/mobile-design';
const optional = 'packages/mobile-design-icons';
function load(packageDir, name) {
    const filename = path.join(root, packageDir, 'src', name),
        exports = {};
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    vm.runInNewContext(
        code,
        {
            exports,
            require: (request) => {
                assert.match(request, /^\.\.\/assets\/fonts\/(?:roboto\/)?[^/]+\.(?:ttf|woff2)$/, 'package-local font');
                const asset = path.resolve(path.dirname(filename), request);
                assert.ok(fs.existsSync(asset), asset);
                return asset;
            },
        },
        { filename }
    );
    return exports;
}
function font(filename) {
    const data = fs.readFileSync(filename),
        tables = new Map();
    assert.equal(data.readUInt32BE(0), 0x00010000, `${filename}: original TrueType SFNT signature`);
    for (let index = 0; index < data.readUInt16BE(4); index++) {
        const record = 12 + index * 16,
            tag = data.toString('ascii', record, record + 4);
        const offset = data.readUInt32BE(record + 8),
            length = data.readUInt32BE(record + 12);
        assert.ok(offset + length <= data.length && !tables.has(tag), `${filename}: valid unique ${tag} table`);
        tables.set(tag, data.subarray(offset, offset + length));
    }
    for (const required of ['head', 'maxp', 'name', 'OS/2', 'cmap', 'glyf']) assert.ok(tables.has(required), `${filename}: ${required}`);
    return { data, tables };
}
function names(table) {
    const result = new Map(),
        start = table.readUInt16BE(4);
    for (let index = 0; index < table.readUInt16BE(2); index++) {
        const record = 6 + index * 12,
            platform = table.readUInt16BE(record);
        if (platform !== 0 && platform !== 3) continue;
        const id = table.readUInt16BE(record + 6),
            length = table.readUInt16BE(record + 8),
            offset = table.readUInt16BE(record + 10);
        let value = '';
        for (let at = start + offset; at < start + offset + length; at += 2) value += String.fromCharCode(table.readUInt16BE(at));
        result.set(id, value);
    }
    return result;
}
function unicodeGlyph(cmap, codepoint) {
    const subtables = [];
    for (let index = 0; index < cmap.readUInt16BE(2); index++) {
        const record = 4 + index * 8,
            platform = cmap.readUInt16BE(record),
            encoding = cmap.readUInt16BE(record + 2);
        if (platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10))) subtables.push(cmap.readUInt32BE(record + 4));
    }
    for (const start of subtables) {
        const format = cmap.readUInt16BE(start);
        if (format === 12) {
            for (let index = 0; index < cmap.readUInt32BE(start + 12); index++) {
                const group = start + 16 + index * 12,
                    first = cmap.readUInt32BE(group),
                    last = cmap.readUInt32BE(group + 4);
                if (codepoint >= first && codepoint <= last) return cmap.readUInt32BE(group + 8) + codepoint - first;
            }
        }
        if (format === 4 && codepoint <= 0xffff) {
            const count = cmap.readUInt16BE(start + 6) / 2,
                ends = start + 14,
                starts = ends + count * 2 + 2;
            const deltas = starts + count * 2,
                ranges = deltas + count * 2;
            for (let index = 0; index < count; index++) {
                const first = cmap.readUInt16BE(starts + index * 2),
                    last = cmap.readUInt16BE(ends + index * 2);
                if (codepoint < first || codepoint > last) continue;
                const delta = cmap.readInt16BE(deltas + index * 2),
                    offset = cmap.readUInt16BE(ranges + index * 2);
                if (offset === 0) return (codepoint + delta) & 0xffff;
                const glyph = cmap.readUInt16BE(ranges + index * 2 + offset + (codepoint - first) * 2);
                return glyph ? (glyph + delta) & 0xffff : 0;
            }
        }
    }
    return 0;
}
const baseManifest = require(`../${base}/package.json`);
const optionalManifest = require(`../${optional}/package.json`);
for (const key of ['dependencies', 'peerDependencies', 'optionalDependencies'])
    assert.equal(baseManifest[key]?.['@mobile-design/icons'], undefined, `base ${key} excludes the full collection`);
for (const entry of ['./react-native', './react-native-web']) {
    assert.ok(baseManifest.exports[entry]);
    assert.ok(optionalManifest.exports[entry]);
}
for (const file of fs.readdirSync(path.join(root, base, 'src'), { recursive: true })) {
    if (!/\.tsx?$/.test(file)) continue;
    const code = fs.readFileSync(path.join(root, base, 'src', file), 'utf8');
    for (const { fileName } of ts.preProcessFile(code, true, true).importedFiles)
        assert.doesNotMatch(fileName, /^@mobile-design\/icons(?:\/|$)/, `${file}: no import of the full collection`);
}

const assets = load(base, 'font-assets.ts');
const webAssets = load(base, 'font-assets.web.ts');
const subsetMap = load(base, 'material-symbol-codepoints.ts').materialSymbolCodepoints;
const fullAssets = load(optional, 'font-assets.ts');
const webFullAssets = load(optional, 'font-assets.web.ts');
const fullMap = load(optional, 'material-symbol-codepoints.ts').materialSymbolCodepoints;
assert.equal(assets.mobileDesignRobotoFont.fontFamily, 'Roboto');
assert.equal(assets.mobileDesignRobotoFont.fontDefinitions.length, 10);
const faces = new Set();
assert.equal(webAssets.mobileDesignRobotoFont.fontDefinitions.length, 10);
for (const face of assets.mobileDesignRobotoFont.fontDefinitions) {
    const { tables } = font(face.path),
        os2 = tables.get('OS/2'),
        metadata = names(tables.get('name'));
    assert.equal(metadata.get(16) ?? metadata.get(1), 'Roboto', `${face.path}: original family`);
    assert.equal(os2.readUInt16BE(4), face.weight, `${face.path}: declared weight matches OS/2`);
    assert.equal(Boolean(os2.readUInt16BE(62) & 1), face.style === 'italic', `${face.path}: italic matches OS/2`);
    assert.equal(tables.has('fvar'), false, `${face.path}: static face`);
    const webFace = webAssets.mobileDesignRobotoFont.fontDefinitions.find(({ weight, style }) => weight === face.weight && style === face.style);
    assert.equal(webFace?.path, face.path.replace(/\.ttf$/, '.woff2'));
    assertWoff2(webFace.path);
    faces.add(`${face.weight}/${face.style}`);
}
assert.deepEqual([...faces].sort(), [400, 500, 600, 700, 800].flatMap((weight) => [`${weight}/italic`, `${weight}/normal`]).sort());
function assertWoff2(file) {
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.toString('ascii', 0, 4), 'wOF2', `${file}: WOFF2 signature`);
    assert.equal(bytes.readUInt32BE(8), bytes.length, `${file}: declared WOFF2 file length`);
    return bytes.length;
}

function verifySymbols(native, web, map) {
    assert.equal(native.fontDefinitions.length, 1);
    assert.equal(web.fontDefinitions.length, 1);
    assert.equal(web.fontFamily, native.fontFamily);
    const [face] = native.fontDefinitions;
    assert.equal(face.weight, undefined, 'runtime must preserve weight variations');
    assert.equal(face.style, undefined);
    assert.equal(web.fontDefinitions[0].path, face.path.replace(/\.ttf$/, '.woff2'));
    const webSize = assertWoff2(web.fontDefinitions[0].path);
    const { data, tables } = font(face.path);
    const fvar = tables.get('fvar');
    assert.ok(fvar, 'Symbols retains its variable axes');
    const axes = {},
        firstAxis = fvar.readUInt16BE(4),
        axisSize = fvar.readUInt16BE(10);
    for (let index = 0; index < fvar.readUInt16BE(8); index++) {
        const record = firstAxis + index * axisSize,
            tag = fvar.toString('ascii', record, record + 4);
        axes[tag] = [4, 8, 12].map((offset) => fvar.readInt32BE(record + offset) / 65536);
    }
    assert.deepEqual(axes, { FILL: [0, 0, 1], GRAD: [-50, 0, 200], opsz: [20, 24, 48], wght: [100, 400, 700] });
    for (const [name, codepoint] of Object.entries(map)) {
        assert.ok(
            Number.isInteger(codepoint) && codepoint > 0 && codepoint <= 0x10ffff && (codepoint < 0xd800 || codepoint > 0xdfff),
            `${name}: Unicode scalar`
        );
        const glyph = unicodeGlyph(tables.get('cmap'), codepoint);
        assert.ok(glyph > 0 && glyph < tables.get('maxp').readUInt16BE(4), `${name}: a real glyph exists in the cmap`);
    }
    return { data, tables, webSize };
}

assert.equal(assets.mobileDesignSymbolsFont.fontFamily, 'MobileDesignMaterialSymbolsRounded');
assert.equal(fullAssets.mobileDesignSymbolsFont.fontFamily, 'MobileDesignMaterialSymbolsRoundedFull');
const subset = verifySymbols(assets.mobileDesignSymbolsFont, webAssets.mobileDesignSymbolsFont, subsetMap);
const full = verifySymbols(fullAssets.mobileDesignSymbolsFont, webFullAssets.mobileDesignSymbolsFont, fullMap);
assert.equal(
    crypto.createHash('sha1').update(`blob ${full.data.length}\0`).update(full.data).digest('hex'),
    'ff99804f914a1db645bcf066dafa9449d9196f8d',
    'pinned original Google Symbols binary'
);
assert.equal(Object.keys(fullMap).length, 4304, 'complete pinned name/alias map');
assert.equal(new Set(Object.values(fullMap)).size, 4004, 'aliases intentionally share codepoints');
assert.ok(subset.data.length < full.data.length / 4, 'base must use a real subset of the native font');
assert.ok(subset.webSize < full.webSize / 4, 'base must use a real subset of the web font');
for (const [name, codepoint] of Object.entries(subsetMap)) {
    assert.equal(codepoint, fullMap[name], `${name}: same Unicode point as the original Symbols`);
}
const subsetCodepoints = new Set(Object.values(subsetMap));
for (const codepoint of new Set(Object.values(fullMap))) {
    assert.equal(Boolean(unicodeGlyph(subset.tables.get('cmap'), codepoint)), subsetCodepoints.has(codepoint), 'base cmap matches the subset map');
}
assert.ok(
    fs.readFileSync(path.join(root, base, 'assets/fonts/roboto/OFL.txt'), 'utf8').includes('SIL OPEN FONT LICENSE')
);
console.log(`PASS: 10 original Roboto faces; ${Object.keys(subsetMap).length} default and 4,304 optional Symbols names; four axes in both native fonts and separate web assets.`);
