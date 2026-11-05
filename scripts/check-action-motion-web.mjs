import { chooseOption } from './choose-option.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.artifacts/action-motion-web');
fs.mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
});
const base = await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('exit', (code) => reject(Error('Server exited ' + code)));
    server.stdout.on('data', (chunk) => {
        const url = String(chunk).match(/http:\/\/[^\s]+/);
        if (url) resolve(url[0]);
    });
});
const browser = await chromium.launch({
    headless: true,
    executablePath:
        process.env.CHROME_PATH ??
        ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].find(fs.existsSync),
});
const cases = [],
    errors = [];
let passed = false;
const poll = async (read, accept, label) => {
    let value;
    const start = Date.now();
    do {
        value = await read();
        if (accept(value)) return value;
        await new Promise((resolve) => setTimeout(resolve, 20));
    } while (Date.now() - start < 4000);
    assert.fail(label + ': ' + JSON.stringify(value));
};
const id = (value) => '[data-testid="' + value + '"]';
try {
    const context = await browser.newContext({ viewport: { width: 980, height: 1000 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(String(error)));
    const open = async (component, test, reduced, motion, control) => {
        await page.goto(base + 'runtime/components/index.html?component=' + component + '&reduced=' + reduced);
        const target = page.getByTestId(test);
        await target.waitFor();
        if (control) await chooseOption(page, control, motion);
        return target;
    };
    const record = async (name, selectors, action, metadata = {}) => {
        await page.evaluate((selectors) => {
            window.__actionFrames = [];
            window.__actionDone = false;
            window.__actionPhase = 'rest';
            const down = () => {
                    window.__actionPhase = 'down';
                },
                up = () => {
                    window.__actionPhase = 'up';
                };
            document.addEventListener('pointerdown', down, { capture: true, once: true });
            document.addEventListener('pointerup', up, { capture: true, once: true });
            const read = (selector) => {
                const el = document.querySelector(selector);
                if (!el) return null;
                const box = el.getBoundingClientRect(),
                    style = getComputedStyle(el);
                let opacity = 1;
                for (let p = el; p && p !== document.body; p = p.parentElement) opacity *= Number(getComputedStyle(p).opacity);
                const surface = el.parentElement,
                    parentStyle = getComputedStyle(surface);
                const glyphs = [...el.querySelectorAll('*')].filter(
                    (n) => n.childElementCount === 0 && getComputedStyle(n).fontFamily.includes('MobileDesign')
                );
                const rotation = glyphs.map((n) => {
                    for (let p = n; p && p !== el; p = p.parentElement) {
                        const t = getComputedStyle(p).transform;
                        if (t !== 'none') {
                            const m = new DOMMatrixReadOnly(t);
                            return (Math.atan2(m.b, m.a) * 180) / Math.PI;
                        }
                    }
                    return 0;
                });
                const ring = [...(el.closest('[data-testid$="-container"]')?.querySelectorAll('*') ?? [])].find(
                    (n) => parseFloat(getComputedStyle(n).borderTopWidth) === 3
                );
                const mask = el.firstElementChild,
                    maskBox = mask?.getBoundingClientRect(),
                    maskStyle = mask ? getComputedStyle(mask) : null;
                return {
                    x: box.x,
                    y: box.y,
                    w: box.width,
                    h: box.height,
                    radius: parseFloat(style.borderTopLeftRadius),
                    opacity,
                    surfaceRadius: parseFloat(parentStyle.borderTopLeftRadius),
                    ringRadius: ring ? parseFloat(getComputedStyle(ring).borderTopLeftRadius) : null,
                    clipWidth: el.parentElement?.parentElement?.parentElement?.getBoundingClientRect().width,
                    mask: maskBox ? { w: maskBox.width, h: maskBox.height, opacity: Number(maskStyle.opacity) } : null,
                    rotation,
                    glyphs: glyphs.map((n) => getComputedStyle(n).fontVariationSettings),
                    ripple: [...el.querySelectorAll('[data-paper-ripple]')].map((n) => ({
                        radius: parseFloat(getComputedStyle(n).borderTopLeftRadius),
                        w: n.getBoundingClientRect().width,
                    })),
                };
            };
            const start = performance.now();
            const sample = () => {
                const t = performance.now() - start;
                window.__actionFrames.push({ t, phase: window.__actionPhase, scrollY, nodes: selectors.map(read) });
                if (t < 850) requestAnimationFrame(sample);
                else {
                    document.removeEventListener('pointerdown', down, true);
                    document.removeEventListener('pointerup', up, true);
                    window.__actionDone = true;
                }
            };
            sample();
        }, selectors);
        await action();
        await page.waitForFunction(() => window.__actionDone);
        const frames = await page.evaluate(() => window.__actionFrames);
        cases.push({ name, ...metadata, frames });
        return frames;
    };
    const press = async (target) => {
        await target.scrollIntoViewIfNeeded();
        const box = await target.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(160);
        await page.mouse.up();
        await page.mouse.move(1, 1);
    };
    const nodes = (frames, index = 0) => frames.map((frame) => frame.nodes[index]).filter(Boolean);
    const moving = (values, from, to) => values.some((value) => Math.abs(value - from) > 0.3 && Math.abs(value - to) > 0.3);
    const fill = (target) =>
        target
            .locator('[style*="font-family: MobileDesign"]')
            .last()
            .evaluate((el) => getComputedStyle(el).fontVariationSettings);
    for (const reduced of [false, true])
        for (const motion of ['standard', 'expressive']) {
            const meta = { reduced, motion };
            let target = await open('buttons', 'example-button', reduced, motion, '#button-motion');
            await chooseOption(page, '#button-type', 'toggle');
            await poll(
                () => fill(target),
                (value) => /"FILL" 0/.test(value),
                'unselected button uses outlined icon'
            );
            const frames = await record('Button press and toggle', [id('example-button')], () => press(target), meta);
            const during = frames
                .filter((frame) => frame.phase === 'down')
                .map((frame) => frame.nodes[0]?.radius)
                .filter((value) => value != null);
            assert.equal(moving(during, 20, 8), !reduced, 'Button press must interpolate only with motion enabled');
            await poll(
                () => target.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius)),
                (r) => Math.abs(r - 12) < 0.15,
                'selected Button shape'
            );
            assert.equal(await target.getAttribute('aria-pressed'), 'true');
            assert.match(await fill(target), /"FILL" 1/);

            target = await open('icon-buttons', 'example-icon-button', reduced, motion, '#icon-motion');
            await chooseOption(page, '#icon-type', 'toggle');
            await target.scrollIntoViewIfNeeded();
            const iconFrames = await record('IconButton press and toggle', [id('example-icon-button')], () => press(target), meta);
            const iconDuring = iconFrames
                .filter((frame) => frame.phase === 'down')
                .map((frame) => frame.nodes[0]?.radius)
                .filter((value) => value != null);
            assert.equal(moving(iconDuring, 20, 8), !reduced, 'IconButton press has intermediate radii');
            assert.equal(await target.getAttribute('aria-pressed'), 'true');
            assert.match(await fill(target), /"FILL" 1/);

            target = await open('extended-fab', 'example-fab', reduced, motion, '#fab-motion');
            await chooseOption(page, '#fab-size', 'medium');
            await poll(
                () => target.boundingBox(),
                (box) => box.width > box.height + 20,
                'expanded label has been measured'
            );
            await target.evaluate(
                (el) =>
                    new Promise((resolve) => {
                        let previous = '',
                            stable = 0;
                        const sample = () => {
                            const value = el.getBoundingClientRect().width.toFixed(2);
                            stable = value === previous ? stable + 1 : 0;
                            previous = value;
                            if (stable >= 5) resolve();
                            else requestAnimationFrame(sample);
                        };
                        sample();
                    })
            );
            const expanded = (await target.boundingBox()).width;
            const collapse = await record(
                'Extended FAB collapse',
                [id('example-fab')],
                () => page.locator('#fab-expanded').uncheck(),
                meta
            );
            assert.equal(
                moving(
                    nodes(collapse).map((n) => n.w),
                    expanded,
                    80
                ),
                !reduced,
                'Extended collapse must travel, not jump'
            );
            await poll(
                () => target.boundingBox(),
                (box) => Math.abs(box.width - 80) < 0.2,
                'collapsed FAB'
            );
            const expand = await record('Extended FAB expansion', [id('example-fab')], () => page.locator('#fab-expanded').check(), meta);
            assert.equal(
                moving(
                    nodes(expand).map((n) => n.w),
                    80,
                    expanded
                ),
                !reduced,
                'Extended expansion has intermediate width'
            );
            await poll(
                () => target.boundingBox(),
                (box) => Math.abs(box.width - expanded) < 0.2,
                'expanded FAB'
            );

            for (const family of ['extended-fab', 'floating-action-button']) {
                target = await open(family, 'example-fab', reduced, motion, '#fab-motion');
                const hide = await record(family + ' exit', [id('example-fab')], () => page.locator('#fab-visible').uncheck(), meta);
                assert.equal(
                    nodes(hide).some((n) => n.opacity > 0.01 && n.opacity < 0.99),
                    !reduced,
                    'FAB exit has a fade'
                );
                const show = await record(family + ' entrance', [id('example-fab')], () => page.locator('#fab-visible').check(), meta);
                assert.equal(
                    nodes(show).some((n) => n.opacity > 0.01 && n.opacity < 0.99),
                    !reduced,
                    'FAB entrance has a fade'
                );
                assert.ok(nodes(show).at(-1).opacity > 0.99, 'FAB returns fully visible');
            }

            target = await open('fab-menu', 'fab-menu-trigger', reduced, motion, '#fab-menu-motion');
            await chooseOption(page, '#fab-menu-size', 'medium');
            await target.scrollIntoViewIfNeeded();
            await target.focus();
            const menu = await record(
                'FAB menu opening',
                [id('fab-menu-trigger'), id('fab-menu-action-0'), id('fab-menu-action-3')],
                () => target.press('Enter'),
                meta
            );
            assert.equal(
                moving(
                    nodes(menu).map((n) => n.w),
                    80,
                    56
                ),
                !reduced,
                'FAB transforms through intermediate sizes'
            );
            assert.ok(
                nodes(menu).every((n) => Math.abs(n.radius - n.surfaceRadius) < 0.2),
                'The press surface follows the animated outline in every frame'
            );
            assert.ok(
                nodes(menu)
                    .filter((n) => n.ringRadius != null)
                    .every((n) => Math.abs(n.ringRadius - n.radius - 5) < 0.2),
                'Keyboard ring follows the same morph'
            );
            if (!reduced) {
                assert.ok(
                    moving(
                        nodes(menu, 0).map((n) => n.radius),
                        20,
                        28
                    ),
                    'Corners morph instead of jumping'
                );
                const first = menu.find((frame) => frame.nodes[1]?.opacity > 0.05)?.t,
                    last = menu.find((frame) => frame.nodes[2]?.opacity > 0.05)?.t;
                assert.ok(last < first, 'Actions reveal from the FAB upward');
                assert.ok(
                    nodes(menu, 1).some((n) => n.clipWidth > 2 && n.clipWidth < 80),
                    'Pills grow from a clipped width'
                );
            }
            const menuClose = await record(
                'FAB menu closing',
                [id('fab-menu-trigger'), id('fab-menu-action-0')],
                () => page.keyboard.press('Escape'),
                meta
            );
            assert.equal(
                moving(
                    nodes(menuClose).map((n) => n.w),
                    56,
                    80
                ),
                !reduced,
                'FAB returns through intermediate sizes'
            );
            assert.ok(
                nodes(menuClose).every((n) => Math.abs(n.radius - n.surfaceRadius) < 0.2),
                'Returning press surface keeps its shape'
            );
            assert.equal(await target.getAttribute('aria-expanded'), 'false');

            target = await open('split-button', 'example-split-toggle', reduced, motion, '#split-motion');
            await target.scrollIntoViewIfNeeded();
            const splitOpen = await record('Split opening', [id('example-split-toggle')], () => target.click(), meta);
            const angles = nodes(splitOpen)
                .flatMap((n) => n.rotation)
                .map(Math.abs);
            assert.equal(moving(angles, 0, 180), !reduced, 'Split chevron rotates through intermediate angles');
            const splitClose = await record('Split closing', [id('example-split-toggle')], () => page.keyboard.press('Escape'), meta);
            assert.equal(
                moving(
                    nodes(splitClose)
                        .flatMap((n) => n.rotation)
                        .map(Math.abs),
                    180,
                    0
                ),
                !reduced,
                'Chevron completes its return'
            );
            console.log('PASS motion profile ' + motion + ', reduced=' + reduced);
        }

    // Cards use the shared timing-based container transform, independent of spring profile.
    for (const reduced of [false, true]) {
        await open('cards', 'example-card', reduced);
        const source = page.getByTestId('card-open-detail');
        await source.scrollIntoViewIfNeeded();
        const from = await source.boundingBox(),
            scene = await page.locator('.card-detail-scene').boundingBox();
        const enter = await record('Card detail entrance', [id('card-detail-transform')], () => source.click(), { reduced });
        const widths = nodes(enter)
            .filter((n) => n.mask?.opacity > 0.5)
            .map((n) => n.mask.w);
        assert.equal(moving(widths, from.width, scene.width - 2), !reduced, 'Card mask expands through intermediate bounds');
        assert.ok(
            enter.every((frame) => Math.abs(frame.scrollY - enter[0].scrollY) < 1),
            'Opening does not jump the page'
        );
        const exit = await record('Card detail exit', [id('card-detail-transform')], () => page.getByTestId('card-close-detail').click(), {
            reduced,
        });
        assert.equal(
            moving(
                nodes(exit)
                    .filter((n) => n.mask?.opacity > 0.5)
                    .map((n) => n.mask.w),
                scene.width - 2,
                from.width
            ),
            !reduced,
            'Card mask completes its return'
        );
        assert.equal(await page.locator('.card-detail-scene').getAttribute('data-open'), 'false');
        assert.ok(await source.evaluate((el) => el === document.activeElement), 'Card restores source focus');
    }
    await open('buttons', 'example-button', false);
    assert.equal(
        await page.locator('#button-motion').getAttribute('data-choice-value'),
        'standard',
        'Initial motion matches the native Buttons gallery'
    );
    for (const name of ['round', 'square']) {
        const toggle = page.getByTestId('button-toggle-' + name);
        await toggle.click();
        assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
        assert.match(await fill(toggle), /"FILL" 1/);
    }
    assert.deepEqual(errors, []);
    passed = true;
    console.log(
        'PASS: ' +
            cases.length +
            ' frame-by-frame cases for seven action/surface families; Segmented has its separate 16-case motion matrix.'
    );
} finally {
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ passed, cases, errors }, null, 2));
    await browser.close();
    server.kill('SIGTERM');
}
