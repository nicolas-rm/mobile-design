/**
 * Verify the rail's visible pill and full-row target across expansion and RTL.
 * Native ripple pixels, native hitSlop propagation, and JS Pressability updates
 * still require device validation; this harness checks the geometry contract.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'packages/mobile-design/src/components/navigation-rail-layout.ts'), 'utf8');
const exportsObject = {};
vm.runInNewContext(
    ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports: exportsObject }
);
const { navigationRailDestinationLayout: layout } = exportsObject;

let cases = 0;
const fixture = {
    railWidth: 96,
    expansion: 0,
    collapsedHeight: 64,
    labelWidth: 88,
    badgeWidth: 20,
    fullWidth: false,
    rtl: false,
};
const close = (actual, expected, message) => {
    assert.ok(Math.abs(actual - expected) < 1e-8, `${message}: ${actual} versus ${expected}`);
};
const check = (name, run) => {
    try {
        run();
        cases += 1;
    } catch (error) {
        error.message = `${name}: ${error.message}`;
        throw error;
    }
};
function fullRow(result, width, height) {
    const { frame, hitSlop } = result;
    close(frame.left - hitSlop.left, 0, 'target starts at left edge');
    close(frame.top - hitSlop.top, 0, 'target starts at top edge');
    close(frame.left + frame.width + hitSlop.right, width, 'target ends at right edge');
    close(frame.top + frame.height + hitSlop.bottom, height, 'target ends at bottom edge');
    assert.ok(frame.left >= 0 && frame.top >= 0, 'pill starts inside the row');
    assert.ok(frame.left + frame.width <= width + 1e-8, 'pill fits horizontally');
    assert.ok(frame.top + frame.height <= height + 1e-8, 'pill fits vertically');
    for (const value of Object.values(hitSlop)) assert.ok(Number.isFinite(value) && value >= 0);
}

check('collapsed wide rail keeps its 56×32 pill and 96×64 row', () => {
    const result = layout(fixture);
    close(result.frame.left, 20, 'pill left');
    close(result.frame.top, 6, 'pill top');
    close(result.frame.width, 56, 'pill width');
    close(result.frame.height, 32, 'pill height');
    fullRow(result, 96, 64);
});

check('compact rails keep the pill centered on the icon and within their actual width', () => {
    for (const railWidth of [80, 88, 96]) {
        for (const rtl of [false, true]) {
            const result = layout({ ...fixture, railWidth, rtl });
            close(result.frame.left + result.frame.width / 2, railWidth / 2, 'indicator and icon share the rail center');
            fullRow(result, railWidth, 64);
        }
    }
});

check('expanded content pill hugs label and badge', () => {
    const result = layout({ ...fixture, railWidth: 256, expansion: 1 });
    close(result.frame.left, 20, 'pill left');
    close(result.frame.width, 172, '64dp content padding plus label and badge');
    close(result.frame.height, 56, 'expanded height');
    fullRow(result, 256, 56);
});

check('full-width indicator keeps both 20dp outer spaces', () => {
    const result = layout({ ...fixture, railWidth: 256, expansion: 1, fullWidth: true });
    close(result.frame.left, 20, 'pill left');
    close(result.frame.width, 216, 'full-width pill');
    close(result.hitSlop.right, 20, 'trailing target extension');
    fullRow(result, 256, 56);
});

check('halfway geometry mirrors the visible pill and physical hitSlop', () => {
    const ltr = layout({ ...fixture, railWidth: 256, expansion: 0.5 });
    const rtl = layout({ ...fixture, railWidth: 256, expansion: 0.5, rtl: true });
    close(ltr.rowHeight, 60, 'row height');
    close(ltr.frame.left, 60, 'LTR pill left');
    close(rtl.frame.left, 82, 'RTL pill left');
    close(ltr.frame.width, 114, 'intermediate width');
    close(ltr.frame.height, 44, 'intermediate height');
    close(ltr.hitSlop.left, rtl.hitSlop.right, 'mirrored leading hit region');
    close(ltr.hitSlop.right, rtl.hitSlop.left, 'mirrored trailing hit region');
    fullRow(ltr, 256, 60);
    fullRow(rtl, 256, 60);
});

check('scaled two-line labels keep their entire taller row interactive', () => {
    const result = layout({ ...fixture, railWidth: 256, expansion: 0.5, collapsedHeight: 112 });
    close(result.rowHeight, 84, 'scaled intermediate row');
    close(result.hitSlop.bottom, 37, 'target includes the lower label area');
    fullRow(result, 256, 84);
});

check('expanded scaled labels enlarge both indicator and full-row target', () => {
    const result = layout({ ...fixture, railWidth: 256, expansion: 1, expandedHeight: 112 });
    close(result.frame.height, 112, '80dp label plus32dp vertical padding');
    fullRow(result, 256, 112);
});

check('expansion is clamped and invalid measurements stay finite', () => {
    const collapsed = layout({ ...fixture, expansion: -1 });
    const expanded = layout({ ...fixture, expansion: 2 });
    close(collapsed.frame.height, 32, 'negative progress');
    close(expanded.frame.height, 56, 'overflow progress');
    const fallback = layout({
        ...fixture,
        railWidth: NaN,
        expansion: Infinity,
        collapsedHeight: NaN,
        labelWidth: -10,
        badgeWidth: NaN,
    });
    fullRow(fallback, 96, 64);
});

let combinations = 0;
check('all size, label, badge, alignment and progress combinations cover exactly one row', () => {
    for (const railWidth of [80, 88, 96, 256, 360])
        for (const expansion of [0, 0.01, 0.25, 0.5, 0.75, 0.99, 1])
            for (const collapsedHeight of [64, 80, 112, 144])
                for (const labelWidth of [0, 20, 88, 400])
                    for (const badgeWidth of [0, 20])
                        for (const fullWidth of [false, true])
                            for (const rtl of [false, true]) {
                                const result = layout({ railWidth, expansion, collapsedHeight, labelWidth, badgeWidth, fullWidth, rtl });
                                fullRow(result, railWidth, result.rowHeight);
                                combinations += 1;
                            }
});

console.log(`PASS: ${cases} rail press geometry cases (${combinations} animated/RTL target combinations).`);
