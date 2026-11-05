import { chooseOption } from './choose-option.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.artifacts/visible-states-web');
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
    executablePath:
        process.env.CHROME_PATH ??
        ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].find(fs.existsSync),
    headless: true,
});
const errors = [],
    checks = [];
const poll = async (read, accept, label) => {
    let value;
    const started = Date.now();
    do {
        value = await read();
        if (accept(value)) return value;
        await new Promise((resolve) => setTimeout(resolve, 20));
    } while (Date.now() - started < 4000);
    assert.fail(label + ': ' + JSON.stringify(value));
};
// Include rings drawn outside the button, rather than inspecting its CSS outline alone.
const rings = (stage) =>
    stage.evaluate(
        (root) =>
            [root, ...root.querySelectorAll('*')].filter((el) => {
                const style = getComputedStyle(el),
                    box = el.getBoundingClientRect();
                return (
                    box.width > 0 &&
                    box.height > 0 &&
                    style.visibility !== 'hidden' &&
                    style.opacity !== '0' &&
                    ((style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 3) ||
                        (style.position === 'absolute' && parseFloat(style.borderTopWidth) === 3))
                );
            }).length
    );
try {
    const context = await browser.newContext({ viewport: { width: 980, height: 900 } });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(String(error)));
    const open = async (id, test) => {
        await page.goto(base + 'runtime/components/index.html?component=' + id + '&theme=light&reduced=false');
        const button = page.getByTestId(test);
        await button.waitFor();
        return button;
    };
    for (const [id, test] of [
        ['buttons', 'example-button'],
        ['extended-fab', 'example-fab'],
        ['floating-action-button', 'example-fab'],
        ['icon-buttons', 'example-icon-button'],
        ['split-button', 'example-split-primary'],
        ['segmented-buttons', 'example-segmented-transit'],
        ['cards', 'example-card'],
    ]) {
        const button = await open(id, test);
        if (id === 'cards') await chooseOption(page, '#card-interaction', 'direct');
        const stage = page.locator('.button-stage');
        await button.click();
        await page.mouse.move(1, 1);
        await poll(
            () => rings(stage),
            (n) => n === 0,
            id + ' pointer does not leave a keyboard ring'
        );
        await button.press('Enter');
        await poll(
            () => rings(stage),
            (n) => n > 0,
            id + ' keyboard activation shows focus even after a pointer click'
        );
        await button.click();
        await page.mouse.move(1, 1);
        await poll(
            () => rings(stage),
            (n) => n === 0,
            id + ' switching back to pointer clears keyboard ring'
        );
        checks.push(id + ' input modality');
    }

    const group = await open('segmented-buttons', 'example-segmented');
    assert.equal(await page.locator('#segment-motion').inputValue(), 'expressive', 'Use the same default motion as the package provider');
    await chooseOption(page, '#segment-content', 'labels');
    for (const motion of ['expressive', 'standard'])
        for (const direction of ['ltr', 'rtl']) {
            await chooseOption(page, '#segment-motion', motion);
            await chooseOption(page, '#segment-direction', direction);
            for (let i = 0; i < 9; i++)
                await group
                    .getByRole('radio')
                    .nth(i % 3)
                    .click({ delay: 5 });
            await page.mouse.move(1, 1);
            // Check the rendered ink, including transformed labels and the selected check.
            await poll(
                () =>
                    group.getByRole('radio').evaluateAll((nodes) =>
                        nodes.map((el) => {
                            const target = el.getBoundingClientRect();
                            const ink = [...el.querySelectorAll('*')]
                                .filter((n) => {
                                    if (n.childElementCount !== 0 || !n.textContent.trim()) return false;
                                    let opacity = 1;
                                    for (let p = n; p && p !== el; p = p.parentElement) opacity *= Number(getComputedStyle(p).opacity);
                                    return opacity > 0.99;
                                })
                                .map((n) => n.getBoundingClientRect())
                                .filter((r) => r.width > 0 && r.height > 0);
                            const left = Math.min(...ink.map((r) => r.left)),
                                right = Math.max(...ink.map((r) => r.right));
                            return {
                                offset: Math.abs((left + right) / 2 - target.x - target.width / 2),
                                checked: el.getAttribute('aria-checked'),
                            };
                        })
                    ),
                (rows) => rows.every((row) => row.offset < 1),
                direction + ' interrupted check/label transitions settle centered'
            );
        }
    const hiddenMeasurement = group.locator(':scope > [aria-hidden="true"]');
    assert.equal(await hiddenMeasurement.count(), 1, 'Measurement labels do not duplicate accessible content');
    await chooseOption(page, '#segment-direction', 'ltr');
    await chooseOption(page, '#segment-mode', 'multi');
    const middle = group.getByRole('checkbox').nth(1);
    const before = await middle.getAttribute('aria-checked');
    await middle.press('Space');
    assert.notEqual(await middle.getAttribute('aria-checked'), before, 'Space toggles exactly once');
    await middle.press('Enter');
    assert.equal(await middle.getAttribute('aria-checked'), before, 'Enter toggles exactly once');
    await chooseOption(page, '#segment-count', '5');
    await page.locator('#segment-label').fill('Caminata por el parque');
    await page.setViewportSize({ width: 390, height: 900 });
    const canvas = page.locator('.segmented-stage');
    await poll(
        () => canvas.evaluate((el) => ({ client: el.clientWidth, scroll: el.scrollWidth })),
        (box) => box.scroll > box.client + 100,
        'Long configurations scroll rather than crushing every label'
    );
    assert.ok(await page.locator('body').evaluate((el) => el.scrollWidth <= innerWidth), 'The page itself stays inside the viewport');
    await canvas.screenshot({ path: path.join(output, 'segmented-narrow.png') });
    await canvas.hover();
    await page.mouse.wheel(650, 0);
    await poll(
        () => canvas.evaluate((el) => el.scrollLeft),
        (left) => left > 100,
        'The wheel reaches the remaining options'
    );
    const end = group.getByRole('checkbox').last();
    await end.click();
    assert.equal(await end.getAttribute('aria-checked'), 'true', 'The last offscreen option remains usable');
    await page.setViewportSize({ width: 980, height: 900 });
    await page.locator('#segment-label').fill('');
    await chooseOption(page, '#segment-count', '3');
    await chooseOption(page, '#segment-content', 'both');
    await group.screenshot({ path: path.join(output, 'segmented-selected.png') });
    await page.locator('#segment-mode').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, 'segmented-local.png') });
    checks.push('segmented motion, RTL, keyboard, hidden measurement, narrow layout');

    await open('split-button', 'example-split');
    assert.equal(await page.locator('#split-motion').inputValue(), 'expressive');
    const split = page.getByTestId('example-split'),
        splitStage = page.locator('.split-stage');
    for (const size of ['extra-small', 'small', 'medium', 'large', 'extra-large']) {
        await chooseOption(page, '#split-size', size);
        const a = await split.boundingBox(),
            b = await splitStage.boundingBox();
        assert.ok(Math.abs(a.y + a.height / 2 - b.y - b.height / 2) < 1, size + ' specimen is centered in the canvas');
    }
    checks.push('split canvas center for five sizes');

    await open('fab-menu', 'example-fab-menu');
    await page.getByTestId('fab-menu-trigger').click();
    const item = page.getByTestId('fab-menu-action-0');
    await item.waitFor();
    await item.scrollIntoViewIfNeeded();
    const scene = page.locator('.fab-menu-scene');
    await item.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await poll(
        () => rings(scene),
        (n) => n > 0,
        'FAB menu item keyboard focus'
    );
    const box = await item.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await poll(
        () => rings(scene),
        (n) => n === 0,
        'FAB menu pointer press clears keyboard ring'
    );
    await page.mouse.up();
    checks.push('FAB menu input modality');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ checks, errors }, null, 2));
    console.log('PASS: rendered focus, centering, interrupted selection motion, keyboard and narrow layouts across eight families.');
} finally {
    await browser.close();
    server.kill('SIGTERM');
}
