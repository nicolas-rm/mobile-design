/**
 * node scripts/verify-mobile-design-popup.cjs
 *
 * Loads only the actual pure popupPosition declaration from popup.tsx using the
 * TypeScript AST. No copied placement algorithm and no React/native/UI mocks.
 * Checks coordinates, collision choices and keyboard-reduced usable viewports.
 * This cannot verify native anchor measurement, keyboard event ordering, visual
 * transitions, clipping by platform surfaces or accessibility traversal.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'packages/mobile-design/src/components/popup.tsx');
const source = fs.readFileSync(file, 'utf8');
const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declaration = ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === 'popupPosition');
assert.ok(declaration, 'popupPosition remains an exported pure function');
const code = ts.transpileModule(declaration.getText(ast), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const exportsObject = {};
vm.runInNewContext(code, { exports: exportsObject }, { filename: file });
const { popupPosition } = exportsObject;
const zero = { top: 0, right: 0, bottom: 0, left: 0 };
let cases = 0;
let placements = 0;
const failures = [];
function test(name, run) {
    try {
        run();
        cases++;
        console.log(`PASS ${name}`);
    } catch (error) {
        failures.push(`${name}: ${error.message}`);
        console.error(`FAIL ${name}: ${error.message}`);
    }
}
function within(position, window, inset = zero) {
    assert.ok(Object.values(position).every(Number.isFinite), 'all coordinates and transform origins must remain finite');
    assert.ok(position.width >= 1 && position.height >= 1, `positive dimensions ${JSON.stringify(position)}`);
    assert.ok(
        position.x >= 0 &&
            position.y >= 0 &&
            position.x + position.width <= window.width + 1e-8 &&
            position.y + position.height <= window.height + 1e-8,
        `physical viewport bounds ${JSON.stringify({ position, window, inset })}`
    );
    if (window.width >= inset.left + inset.right + 17) {
        assert.ok(
            position.x >= inset.left + 8 && position.x + position.width <= window.width - inset.right - 8 + 1e-8,
            'horizontal safe inset and margin'
        );
    }
    if (window.height >= inset.top + inset.bottom + 17) {
        assert.ok(
            position.y >= inset.top + 8 && position.y + position.height <= window.height - inset.bottom - 8 + 1e-8,
            'vertical safe inset and margin'
        );
    }
    assert.ok(
        position.originX >= 0 && position.originX <= position.width && position.originY >= 0 && position.originY <= position.height,
        'transform origin stays inside the measured popup'
    );
    placements++;
}
test('below uses available space and aligns the logical start', () => {
    const anchor = { x: 100, y: 100, width: 80, height: 48 };
    const position = popupPosition(anchor, { width: 200, height: 160 }, { width: 400, height: 800 }, 'below', 8, zero);
    assert.equal(position.x, 100);
    assert.equal(position.y, 156);
    assert.equal(position.height, 160);
    assert.equal(position.originY, 0);
    within(position, { width: 400, height: 800 });
});
test('edge triggers preserve the opposite anchor edge before clamping to the window', () => {
    const screen = { width: 400, height: 800 }, size = { width: 280, height: 160 };
    for (const placement of ['below', 'overlap']) {
        const right = { x: 320, y: 100, width: 48, height: 48 };
        const ltr = popupPosition(right, size, screen, placement, 0, zero);
        assert.equal(ltr.x + ltr.width, right.x + right.width, 'LTR right trigger keeps its end edge');
        assert.equal(ltr.x, 88, 'does not jump to the window edge at x=112');
        assert.equal(ltr.originX, 256, 'motion origin remains at the trigger center');
        const left = { ...right, x: 32 };
        const rtl = popupPosition(left, size, screen, placement, 0, zero, true);
        assert.equal(rtl.x, left.x, 'RTL left trigger keeps its end edge');
        assert.equal(rtl.originX, 24);
        within(ltr, screen); within(rtl, screen);
    }
});
test('start-aligned buttons stay anchored and safe insets constrain alternate alignment', () => {
    const screen = { width: 440, height: 800 }, size = { width: 280, height: 160 };
    const inset = { top: 24, right: 20, bottom: 34, left: 12 };
    const leftButton = popupPosition({ x: 24, y: 100, width: 180, height: 48 }, size, screen, 'below', 0, inset);
    assert.equal(leftButton.x, 24, 'a fitting start alignment is preserved');
    const right = popupPosition({ x: 344, y: 100, width: 48, height: 48 }, size, screen, 'below', 0, inset);
    assert.equal(right.x, 112, 'uses the anchor end instead of the safe window edge');
    const neither = popupPosition({ x: 180, y: 100, width: 40, height: 48 }, size, screen, 'below', 0, inset);
    assert.equal(neither.x, 132, 'clamps only when neither anchor edge fits');
    [leftButton, right, neither].forEach((position) => within(position, screen, inset));
});
test('above centers on its anchor and opens from the bottom edge', () => {
    const position = popupPosition(
        { x: 100, y: 400, width: 80, height: 48 },
        { width: 200, height: 100 },
        { width: 400, height: 800 },
        'above',
        8,
        zero
    );
    assert.equal(position.x, 40);
    assert.equal(position.y, 292);
    assert.equal(position.originX, 100);
    assert.equal(position.originY, 100);
    within(position, { width: 400, height: 800 });
});
test('below flips above before clamping and reduces only the available body', () => {
    const inset = { top: 24, right: 0, bottom: 34, left: 0 };
    const position = popupPosition(
        { x: 100, y: 230, width: 80, height: 56 },
        { width: 200, height: 240 },
        { width: 400, height: 430 },
        'below',
        8,
        inset
    );
    assert.equal(position.height, 190);
    assert.equal(position.y, 32);
    assert.equal(position.originY, 190);
    assert.ok(position.y + position.height <= 230 - 8, 'collision fallback does not cover an in-bounds anchor');
    within(position, { width: 400, height: 430 }, inset);
});
test('below-end aligns the logical end in LTR and RTL', () => {
    const anchor = { x: 200, y: 100, width: 48, height: 48 };
    const size = { width: 160, height: 100 },
        window = { width: 400, height: 800 };
    const ltr = popupPosition(anchor, size, window, 'below-end', 8, zero, false);
    const rtl = popupPosition(anchor, size, window, 'below-end', 8, zero, true);
    assert.equal(ltr.x, 88);
    assert.equal(rtl.x, 200);
    within(ltr, window);
    within(rtl, window);
});
test('an explicit end alignment can fall back to the fitting start edge in both directions', () => {
    const screen = { width: 400, height: 800 }, size = { width: 200, height: 100 };
    const ltr = popupPosition({ x: 24, y: 100, width: 48, height: 48 }, size, screen, 'below-end', 0, zero);
    const rtl = popupPosition({ x: 328, y: 100, width: 48, height: 48 }, size, screen, 'below-end', 0, zero, true);
    assert.equal(ltr.x, 24);
    assert.equal(rtl.x, 176);
    within(ltr, screen); within(rtl, screen);
});
test('plain below centers and rich flips corners on an eight-dp horizontal grid', () => {
    const screen={width:400,height:800}, size={width:160,height:120};
    const anchor={x:80,y:200,width:48,height:48};
    const plain=popupPosition(anchor,size,screen,'below-center',4,zero);
    assert.equal(plain.x,24); assert.equal(plain.y,252);
    const near=popupPosition(anchor,size,screen,'tooltip-below',4,zero);
    assert.equal(near.x,104); assert.equal(near.x%8,0);
    const far=popupPosition({...anchor,x:330,y:700},size,screen,'tooltip-below',4,zero);
    assert.ok(far.x+far.width<=392); assert.equal(far.y,576);
    assert.equal(far.x%8,0); within(near,screen); within(far,screen);
});
test('side prefers the logical end, then start, then a vertical fallback', () => {
    const window = { width: 400, height: 800 },
        size = { width: 100, height: 100 };
    const anchor = { x: 200, y: 100, width: 48, height: 48 };
    const ltr = popupPosition(anchor, size, window, 'side', 8, zero, false);
    const rtl = popupPosition(anchor, size, window, 'side', 8, zero, true);
    assert.equal(ltr.x, 256);
    assert.equal(rtl.x, 92);
    const flip = popupPosition({ ...anchor, x: 320 }, size, window, 'side', 8, zero, false);
    assert.equal(flip.x, 212);
    const below = popupPosition(anchor, { width: 280, height: 100 }, window, 'side', 8, zero);
    assert.equal(below.y, 156, 'neither side fits: preserve the anchor with a below/above fallback');
    [ltr, rtl, flip, below].forEach((position) => within(position, window));
});
test('keyboard-reduced viewports retain safe bounds even when the anchor is below the keyboard', () => {
    const inset = { top: 24, right: 0, bottom: 0, left: 0 };
    const window = { width: 390, height: 300 };
    const position = popupPosition({ x: 100, y: 600, width: 80, height: 48 }, { width: 320, height: 700 }, window, 'below', 8, inset);
    within(position, window, inset);
    assert.ok(position.height <= 260, 'offscreen anchor cannot manufacture space behind the keyboard');
});
test('very small usable viewports never produce zero or negative dimensions', () => {
    const inset = { top: 24, right: 0, bottom: 34, left: 0 };
    for (const placement of ['below', 'above', 'side', 'overlap']) {
        const window = { width: 40, height: 10 };
        within(
            popupPosition({ x: 10, y: 0, width: 20, height: 48 }, { width: 280, height: 500 }, window, placement, 8, inset),
            window,
            inset
        );
    }
});
test('placement remains bounded across insets, directions, oversized content and offscreen anchors', () => {
    for (const window of [
        { width: 390, height: 844 },
        { width: 320, height: 270 },
        { width: 48, height: 72 },
        { width: 1, height: 1 },
    ]) {
        for (const inset of [zero, { top: 24, right: 8, bottom: 34, left: 8 }]) {
            for (const x of [-80, 0, 120, window.width + 30])
                for (const y of [-60, 0, 160, window.height + 200]) {
                    const anchor = { x, y, width: 48, height: 48 };
                    for (const content of [
                        { width: 1, height: 1 },
                        { width: 160, height: 200 },
                        { width: 900, height: 1200 },
                    ]) {
                        for (const placement of ['overlap', 'above', 'below', 'below-end', 'side'])
                            for (const rtl of [false, true]) {
                                within(popupPosition(anchor, content, window, placement, 8, inset, rtl), window, inset);
                            }
                    }
                }
        }
    }
});
if (failures.length) {
    console.error(`FAILED: ${failures.length} cases; ${placements} bounded placements checked before failures.`);
    process.exitCode = 1;
} else console.log(`OK: ${cases} popup cases; ${placements} bounded placements, pure geometry only.`);
