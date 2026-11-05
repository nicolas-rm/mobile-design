import { chooseOption } from './choose-option.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.artifacts/segmented-motion-web');
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
try {
    const context = await browser.newContext({ viewport: { width: 980, height: 900 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(String(error)));
    for (const reduced of [false, true])
        for (const motion of ['standard', 'expressive'])
            for (const direction of ['ltr', 'rtl'])
                for (const content of ['labels', 'both']) {
                    await page.goto(base + 'runtime/components/index.html?component=segmented-buttons&reduced=' + reduced);
                    await chooseOption(page, '#segment-motion', motion);
                    await chooseOption(page, '#segment-content', content);
                    await chooseOption(page, '#segment-direction', direction);
                    const target = page.getByTestId('example-segmented-transit');
                    await target.scrollIntoViewIfNeeded();
                    // Finish the configuration change before measuring the following selection.
                    // Adding an icon itself legitimately shifts a previously label-only option.
                    await page.waitForFunction(
                        ({ content, direction }) => {
                            const el = document.querySelector('[data-testid="example-segmented-transit"]');
                            const label = [...el.querySelectorAll('*')].find(
                                (n) => n.childElementCount === 0 && n.textContent === 'Transporte'
                            );
                            const transform = getComputedStyle(label.parentElement).transform;
                            const offset = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41;
                            return Math.abs(offset - (content === 'both' ? 0 : direction === 'rtl' ? 13 : -13)) < 0.02;
                        },
                        { content, direction }
                    );
                    await target.evaluate(
                        (el) =>
                            new Promise((resolve) => {
                                let previous = '',
                                    stable = 0;
                                const sample = () => {
                                    const box = el.getBoundingClientRect(),
                                        value = box.width.toFixed(2);
                                    stable = value === previous ? stable + 1 : 0;
                                    previous = value;
                                    if (stable >= 3) resolve();
                                    else requestAnimationFrame(sample);
                                };
                                sample();
                            })
                    );
                    // This is a temporary browser recorder, not an animation hook in the component.
                    await target.evaluate((el) => {
                        window.__segmentFrames = [];
                        window.__segmentRecordingDone = false;
                        const label = [...el.querySelectorAll('*')].find(
                            (n) => n.childElementCount === 0 && n.textContent === 'Transporte'
                        );
                        const icons = [...el.querySelectorAll('*')].filter(
                            (n) => getComputedStyle(n).fontFamily.includes('MobileDesign') && n.childElementCount === 0
                        );
                        const alpha = (n) => {
                            let value = 1;
                            for (let p = n; p && p !== el; p = p.parentElement) value *= Number(getComputedStyle(p).opacity);
                            return value;
                        };
                        const scale = (n) => {
                            let value = 1;
                            for (let p = n; p && p !== el; p = p.parentElement) {
                                const transform = getComputedStyle(p).transform;
                                if (transform !== 'none') value *= new DOMMatrixReadOnly(transform).a;
                            }
                            return value;
                        };
                        el.addEventListener(
                            'pointerdown',
                            () => {
                                const start = performance.now();
                                const sample = () => {
                                    const t = performance.now() - start,
                                        box = el.getBoundingClientRect(),
                                        labelBox = label.getBoundingClientRect();
                                    window.__segmentFrames.push({
                                        t,
                                        selected: el.getAttribute('aria-checked'),
                                        labelX: labelBox.x - box.x,
                                        icons: icons.map((n) => alpha(n)),
                                        checkScale: scale(icons.at(-1)),
                                        ripples: [...el.querySelectorAll('[data-paper-ripple] > *')].map(
                                            (n) => getComputedStyle(n).transform
                                        ),
                                    });
                                    if (t < 900) requestAnimationFrame(sample);
                                    else window.__segmentRecordingDone = true;
                                };
                                sample();
                            },
                            { once: true }
                        );
                    });
                    const box = await target.boundingBox();
                    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                    await page.mouse.down();
                    await page.waitForTimeout(120);
                    await page.mouse.up();
                    await page.waitForFunction(() => window.__segmentRecordingDone);
                    const frames = await page.evaluate(() => window.__segmentFrames);
                    assert.equal(await target.getAttribute('aria-checked'), 'true');
                    const positions = frames.map((frame) => frame.labelX),
                        first = positions[0],
                        last = positions.at(-1);
                    const intermediatePositions = positions.filter((x) => Math.abs(x - first) > 0.2 && Math.abs(x - last) > 0.2).length;
                    const intermediateAlpha = frames.some((frame) => frame.icons.some((a) => a > 0.01 && a < 0.99));
                    const intermediateScale = frames.some((frame) => frame.checkScale > 0.01 && frame.checkScale < 0.99);
                    const rippleTransforms = new Set(frames.flatMap((frame) => frame.ripples));
                    if (reduced) {
                        assert.equal(intermediateAlpha, false, 'Reduced motion has no opacity interpolation');
                        assert.equal(intermediatePositions, 0, 'Reduced motion positions the label immediately');
                        assert.equal(intermediateScale, false, 'Reduced motion has no check scaling');
                        assert.equal(rippleTransforms.size, 0, 'Reduced motion suppresses the expanding ripple');
                    } else {
                        assert.ok(intermediateAlpha, 'The check must crossfade over actual rendered frames');
                        assert.ok(rippleTransforms.size > 2, 'The press ripple must expand over actual rendered frames');
                        if (content === 'labels') {
                            assert.ok(Math.abs(last - first) > 12, 'Selecting a label makes room for the 18dp check and 8dp gap');
                            assert.ok(intermediatePositions >= 3, 'The label must travel, rather than jump to its endpoint');
                            assert.ok(intermediateScale, 'The new check must grow over actual rendered frames');
                        } else assert.ok(Math.abs(last - first) < 0.3, 'An existing icon slot preserves label placement');
                    }
                    cases.push({ reduced, motion, direction, content, frames });
                }
    await page.goto(base + 'runtime/components/index.html?component=segmented-buttons&reduced=false');
    assert.equal(
        await page.locator('#segment-content').getAttribute('data-choice-value'),
        'labels',
        'Start with the same content type as the first native example'
    );
    for (const id of ['motion-labels-week', 'motion-icons-labels-transit', 'motion-icons-center']) {
        const option = page.getByTestId(id);
        await option.click();
        assert.equal(await option.getAttribute('aria-checked'), 'true');
    }
    await page.waitForFunction(() => document.querySelectorAll('[data-paper-ripple]').length === 0);
    await page.locator('.sizes-section').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, 'segmented-content-motion.png') });
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ cases, errors }, null, 2));
    console.log(
        'PASS: 16 frame-by-frame selection/press cases, both motion profiles, RTL, reduced motion and three visible content variants.'
    );
} finally {
    await browser.close();
    server.kill('SIGTERM');
}
