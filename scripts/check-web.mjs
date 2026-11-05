import { chooseOption } from './choose-option.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = process.env.WEB_TEST_ARTIFACTS ?? path.join(root, '.artifacts/buttons-web');
fs.mkdirSync(artifacts, { recursive: true });
const executablePath =
    process.env.CHROME_PATH ??
    ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome'].find((file) =>
        fs.existsSync(file)
    );
assert.ok(executablePath, 'Install Chrome/Chromium or set CHROME_PATH.');
const server = process.env.WEB_TEST_BASE_URL
    ? undefined
    : spawn(process.execPath, ['scripts/serve.mjs'], {
          cwd: root,
          env: { ...process.env, PORT: process.env.WEB_TEST_PORT ?? '0' },
          stdio: ['ignore', 'pipe', 'pipe'],
      });
let base = process.env.WEB_TEST_BASE_URL;
if (server)
    base = await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.once('exit', (code) => reject(new Error('Preview server exited: ' + code)));
        server.stdout.on('data', (chunk) => {
            const url = String(chunk).match(/http:\/\/[^\s]+/);
            if (url) resolve(url[0].replace(/\/$/, '') + '/');
        });
    });
const browser = await chromium.launch({ executablePath, headless: true, args: ['--disable-background-networking'] });
const failures = [],
    cases = [];
let page;
const poll = async (read, accept, label, timeout = 2500) => {
    const start = Date.now();
    let value;
    do {
        value = await read();
        if (await accept(value)) return value;
        await new Promise((resolve) => setTimeout(resolve, 20));
    } while (Date.now() - start < timeout);
    assert.fail(label + ': ' + JSON.stringify(value));
};
const sizes = {
    'extra-small': { height: 32, square: 12, pressed: 8 },
    small: { height: 40, square: 12, pressed: 8 },
    medium: { height: 56, square: 16, pressed: 12 },
    large: { height: 96, square: 28, pressed: 16 },
    'extra-large': { height: 136, square: 28, pressed: 16 },
};
const variants = ['filled', 'tonal', 'elevated', 'outlined', 'text'];
const radius = (button) => button.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
const sampleMask = (button) =>
    button.evaluate(
        (el) =>
            new Promise((resolve) => {
                const samples = [],
                    start = performance.now();
                function sample() {
                    const corners = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'];
                    const host = getComputedStyle(el),
                        masks = [...el.querySelectorAll(':scope > [data-paper-ripple]')].map((mask) => getComputedStyle(mask));
                    samples.push({
                        radius: parseFloat(host.borderTopLeftRadius),
                        masks: masks.length,
                        matches: masks.every((mask) =>
                            corners.every((corner) => Math.abs(parseFloat(mask[corner]) - parseFloat(host[corner])) < 0.1)
                        ),
                    });
                    if (performance.now() - start < 180) requestAnimationFrame(sample);
                    else resolve(samples);
                }
                sample();
            })
    );
const assertMask = (samples) =>
    assert.ok(
        samples.every((sample) => sample.masks > 0 && sample.matches),
        'Every ripple mask must follow the animated host corners: ' + JSON.stringify(samples)
    );
try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    page = await context.newPage();
    page.on('pageerror', (error) => failures.push(String(error)));
    page.on('response', (response) => {
        if (response.status() >= 400) failures.push(response.status() + ' ' + response.url());
    });
    const open = async () => {
        await page.goto(base + '#/components/buttons/overview');
        await page.waitForFunction(() => document.querySelector('[data-component-runtime]')?.getAttribute('aria-busy') === 'false');
        const frame = page.frameLocator('[data-component-runtime]');
        await frame.getByTestId('example-button').waitFor();
        return frame;
    };
    let frame = await open();
    let button = frame.getByTestId('example-button');
    for (const theme of process.env.WEB_TEST_MATRIX === 'skip' ? [] : ['light', 'dark']) {
        if ((await page.locator('html').getAttribute('data-theme')) !== theme) await page.locator('.rail [data-action=theme]').click();
        await poll(
            () => frame.locator('html').getAttribute('data-theme'),
            (v) => v === theme,
            'theme propagation'
        );
        for (const toggle of [false, true]) {
            await chooseOption(frame, '#button-type', toggle ? 'toggle' : 'default');
            for (const variant of variants.filter((v) => !toggle || v !== 'text')) {
                await chooseOption(frame, '#button-variant', variant);
                for (const [size, tokens] of Object.entries(sizes))
                    for (const shape of ['round', 'square']) {
                        await chooseOption(frame, '#button-size', size);
                        await chooseOption(frame, '#button-shape', shape);
                        if (toggle) await frame.locator('#button-selected').uncheck();
                        await poll(
                            () => radius(button),
                            (v) => Math.abs(v - (shape === 'round' ? tokens.height / 2 : tokens.square)) < 0.7,
                            'resting radius'
                        );
                        const box = await button.boundingBox();
                        assert.ok(
                            Math.abs(box.height - Math.max(48, tokens.height)) < 1,
                            `${theme}/${variant}/${size}/${shape} hit target height: ${box.height}`
                        );
                        assert.ok(
                            Math.abs((await button.locator(':scope > div').first().boundingBox()).height - tokens.height) < 1,
                            'Visual height retains the size token.'
                        );
                        assert.equal(await button.getAttribute('aria-label'), 'Guardar');
                        const before = Number(await frame.locator('#activation-count').innerText());
                        await button.click();
                        await poll(
                            () => frame.locator('#activation-count').innerText(),
                            (v) => Number(v) === before + 1,
                            'single activation'
                        );
                        if (toggle) {
                            assert.equal(await button.getAttribute('aria-pressed'), 'true');
                            assert.equal(await button.getAttribute('aria-selected'), null);
                            await poll(
                                () => radius(button),
                                (v) => Math.abs(v - (shape === 'round' ? tokens.square : tokens.height / 2)) < 0.7,
                                'selected radius'
                            );
                        } else assert.equal(await button.getAttribute('aria-pressed'), null);
                        cases.push({ theme, toggle, variant, size, shape });
                    }
            }
        }
        console.log(`PASS: ${theme} matrix (${cases.length} configurations so far).`);
    }
    await chooseOption(frame, '#button-type', 'default');
    await chooseOption(frame, '#button-variant', 'filled');
    await chooseOption(frame, '#button-size', 'medium');
    await chooseOption(frame, '#button-shape', 'round');
    await poll(
        () => radius(button),
        (v) => Math.abs(v - 28) < 0.3,
        'reset shape'
    );
    await button.click();
    const focusRings = () =>
        frame.locator('.button-stage div').evaluateAll((els) => els.filter((el) => getComputedStyle(el).borderTopWidth === '3px').length);
    assert.equal(await focusRings(), 0, 'Mouse activation must not leave a keyboard focus ring.');
    await frame.locator('#button-loading').focus();
    await page.keyboard.press('Tab');
    assert.ok(await button.evaluate((el) => el === document.activeElement));
    await poll(focusRings, (v) => v === 1, 'keyboard focus ring');
    const beforeKeyboard = Number(await frame.locator('#activation-count').innerText());
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await poll(
        () => frame.locator('#activation-count').innerText(),
        (v) => Number(v) === beforeKeyboard + 2,
        'Enter and Space each activate once'
    );
    await frame.locator('#button-size').focus();
    await poll(focusRings, (v) => v === 0, 'blur removes focus ring');

    await poll(
        () => button.locator('[data-paper-ripple]').count(),
        (v) => v === 0,
        'prior keyboard indication clears',
        2000
    );
    await button.scrollIntoViewIfNeeded();
    let box = await button.boundingBox();
    await page.mouse.move(box.x + 12, box.y + 8);
    await page.mouse.down();
    const indication = button.locator('[data-paper-ripple] > span').last();
    await indication.waitFor({ state: 'attached' });
    const origin = await indication.evaluate((el) => ({ x: parseFloat(el.style.left), y: parseFloat(el.style.top) }));
    assert.ok(Math.abs(origin.x - 12) < 1.5 && Math.abs(origin.y - 8) < 1.5, 'Ripple originates at the pointer: ' + JSON.stringify(origin));
    const samples = await sampleMask(button);
    assertMask(samples);
    assert.ok(new Set(samples.map((v) => v.radius.toFixed(1))).size > 2, 'The shape has intermediate animation frames.');
    await page.mouse.up();
    assertMask(await sampleMask(button));
    await poll(
        () => radius(button),
        (v) => Math.abs(v - 28) < 0.3,
        'release completes'
    );
    for (const toggle of [false, true])
        for (const shape of ['round', 'square']) {
            await chooseOption(frame, '#button-type', toggle ? 'toggle' : 'default');
            await chooseOption(frame, '#button-shape', shape);
            for (const selected of toggle ? [false, true] : [false]) {
                if (toggle) await frame.locator('#button-selected').setChecked(selected);
                await poll(
                    () => button.locator('[data-paper-ripple]').count(),
                    (v) => v === 0,
                    'previous shape indication clears',
                    2000
                );
                box = await button.boundingBox();
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.mouse.down();
                await button.locator('[data-paper-ripple]').last().waitFor({ state: 'attached' });
                assertMask(await sampleMask(button));
                await page.mouse.up();
                assertMask(await sampleMask(button));
            }
        }
    await chooseOption(frame, '#button-type', 'default');
    await chooseOption(frame, '#button-shape', 'round');
    await chooseOption(frame, '#button-motion', 'standard');
    box = await button.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await poll(
        () => radius(button),
        (v) => Math.abs(v - 12) < 0.3,
        'standard motion press'
    );
    await page.mouse.up();
    await poll(
        () => radius(button),
        (v) => Math.abs(v - 28) < 0.3,
        'standard motion release'
    );
    await chooseOption(frame, '#button-motion', 'expressive');
    for (let i = 0; i < 8; i++) {
        await button.click({ delay: 12 });
    }
    await poll(
        () => radius(button),
        (v) => Math.abs(v - 28) < 0.3,
        'interrupted morph settles'
    );
    await poll(
        () => button.locator('[data-paper-ripple]').count(),
        (v) => v === 0,
        'ripple cleanup',
        2000
    );
    const beforeCancel = Number(await frame.locator('#activation-count').innerText());
    box = await button.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x - 90, box.y + box.height / 2);
    await page.mouse.up();
    assert.equal(Number(await frame.locator('#activation-count').innerText()), beforeCancel, 'Releasing outside cancels the action.');
    await poll(
        () => radius(button),
        (v) => Math.abs(v - 28) < 0.3,
        'cancelled morph clears'
    );
    await frame.locator('#button-disabled').check();
    assert.ok(await button.isDisabled());
    await button.dispatchEvent('click');
    assert.equal(Number(await frame.locator('#activation-count').innerText()), beforeCancel);
    await frame.locator('#button-disabled').uncheck();
    await frame.locator('#button-loading').check();
    assert.ok(await button.isDisabled());
    assert.equal(await button.getAttribute('aria-busy'), 'true');
    await button.dispatchEvent('click');
    assert.equal(Number(await frame.locator('#activation-count').innerText()), beforeCancel);
    await frame.locator('#button-loading').uncheck();
    box = await button.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await frame.locator('#button-disabled').evaluate((el) => el.click());
    await page.mouse.up();
    assert.equal(
        Number(await frame.locator('#activation-count').innerText()),
        beforeCancel,
        'Blocking a held button cancels its pending activation.'
    );
    await frame.locator('#button-disabled').uncheck();
    await poll(
        () => radius(button),
        (v) => Math.abs(v - 28) < 0.3,
        're-enable starts at rest'
    );

    await page.locator('.rail [data-action=motion]').click();
    await poll(
        () => frame.locator('html').getAttribute('data-reduced'),
        (v) => v === 'true',
        'reduced motion propagation'
    );
    await button.scrollIntoViewIfNeeded();
    box = await button.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await poll(
        () => radius(button),
        (v) => Math.abs(v - 12) < 0.01,
        'reduced-motion target'
    );
    assert.equal(await button.locator('[data-paper-ripple]').count(), 0, 'Reduced motion suppresses radial expansion.');
    await page.mouse.up();
    await page.locator('.rail [data-action=motion]').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await new Promise((resolve) => setTimeout(resolve, 100));
    box = await button.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await poll(
        () => radius(button),
        (v) => Math.abs(v - 12) < 0.01,
        'system reduced motion'
    );
    assert.equal(await button.locator('[data-paper-ripple]').count(), 0);
    await page.mouse.up();
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    const save = frame.getByTestId('async-button');
    await save.click();
    assert.ok(await save.isDisabled());
    for (let i = 0; i < 10; i++) await save.dispatchEvent('click');
    await poll(
        () => frame.locator('#save-status').getAttribute('data-completed'),
        (v) => v === '1',
        'async operation resolves once'
    );
    assert.equal(await frame.locator('#save-status').innerText(), 'Cambios guardados.');
    await save.click();
    await page.locator('main .component-tabs').getByRole('link', { name: 'API', exact: true }).click();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    assert.equal(await page.locator('[data-component-runtime]').count(), 0, 'Leaving disposes the example.');
    frame = await open();
    button = frame.getByTestId('example-button');
    await button.click();
    const retained = await frame.locator('#activation-count').innerText();
    await page.locator('.rail [data-action=theme]').click();
    await poll(
        () => frame.locator('html').getAttribute('data-theme'),
        (v) =>
            page
                .locator('html')
                .getAttribute('data-theme')
                .then((t) => v === t),
        'theme update'
    );
    assert.equal(await frame.locator('#activation-count').innerText(), retained, 'Theme changes preserve example state.');
    for (const direction of ['ltr', 'rtl']) {
        await chooseOption(frame, '#button-direction', direction);
        await poll(
            () =>
                button.evaluate((el) => {
                    const icon = el.querySelector('[style*="font-family: MobileDesign"]')?.getBoundingClientRect();
                    const label = [...el.querySelectorAll('div,span')]
                        .find(
                            (node) =>
                                node.childNodes.length === 1 &&
                                node.firstChild?.nodeType === Node.TEXT_NODE &&
                                node.textContent === 'Guardar'
                        )
                        ?.getBoundingClientRect();
                    if (!icon || !label) return null;
                    return { offsetX: icon.x - label.x, centerDifference: icon.y + icon.height / 2 - label.y - label.height / 2 };
                }),
            (geometry) =>
                geometry && (direction === 'ltr' ? geometry.offsetX < 0 : geometry.offsetX > 0) && Math.abs(geometry.centerDifference) < 1,
            'Logical icon position and vertical centering: ' + direction
        );
    }
    await chooseOption(frame, '#button-direction', 'ltr');
    assert.ok(await frame.locator('.example-code code').isVisible());
    assert.ok((await frame.locator('.example-code code').innerText()).includes('variant="filled"'));
    assert.equal(await frame.locator('details').count(), 0);
    const customLabel = 'Guardar <"A"> {B}';
    const labelInput = frame.locator('#button-label');
    await labelInput.fill(customLabel);
    assert.equal(await button.getAttribute('aria-label'), customLabel);
    assert.ok(
        (await frame.locator('.example-code code').textContent()).includes(`{${JSON.stringify(customLabel)}}`),
        'Custom labels remain valid JSX string expressions'
    );
    await labelInput.fill('');
    assert.equal(await button.getAttribute('aria-label'), 'Guardar');
    assert.ok(
        (await frame.locator('.example-code code').textContent()).includes('{"Guardar"}'),
        'Empty labels use the same fallback in the preview and source'
    );
    await page.screenshot({ path: path.join(artifacts, 'buttons-desktop.png'), fullPage: true, animations: 'disabled' });
    for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        await chooseOption(frame, '#button-size', 'extra-large');
        await frame.locator('#button-label').fill('Guardar todos los cambios de mi colección de música');
        await poll(
            () => frame.locator('main').evaluate((el) => el.scrollWidth <= innerWidth),
            (v) => v,
            'narrow example overflow'
        );
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.screenshot({ path: path.join(artifacts, 'buttons-mobile.png'), fullPage: true, animations: 'disabled' });
    const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const touchPage = await touchContext.newPage();
    touchPage.on('pageerror', (error) => failures.push(String(error)));
    await touchPage.goto(base + 'runtime/components/index.html?component=buttons');
    const touchButton = touchPage.getByTestId('example-button');
    await touchButton.waitFor();
    await touchButton.scrollIntoViewIfNeeded();
    const touchBox = await touchButton.boundingBox(),
        touchSession = await touchContext.newCDPSession(touchPage);
    await touchSession.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: touchBox.x + touchBox.width / 2, y: touchBox.y + touchBox.height / 2 }],
    });
    await touchButton.locator('[data-paper-ripple]').last().waitFor({ state: 'attached' });
    assertMask(await sampleMask(touchButton));
    await touchPage.screenshot({ path: path.join(artifacts, 'buttons-touch-held.png') });
    await touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assertMask(await sampleMask(touchButton));
    assert.equal(await touchPage.locator('#activation-count').innerText(), '1');
    await touchContext.close();
    assert.deepEqual(failures, []);
    fs.writeFileSync(
        path.join(artifacts, 'results.json'),
        JSON.stringify(
            {
                matrix: cases.length,
                cases,
                checks: [
                    'keyboard',
                    'pointer-origin',
                    'morph-frames',
                    'morph-mask-press-release',
                    'rapid-interruption',
                    'cancellation',
                    'disabled',
                    'loading',
                    'held-blocking',
                    'reduced-motion',
                    'async-lock',
                    'unmount',
                    'theme-state',
                    'responsive',
                    'touch',
                ],
                errors: failures,
            },
            null,
            2
        )
    );
    console.log(
        `PASS: ${cases.length} configurations, keyboard, pointer/touch, animation, cancellation, loading, themes, reduced motion and responsive embedding.`
    );
} catch (error) {
    console.error('Browser errors:', failures);
    if (page) await page.screenshot({ path: path.join(artifacts, 'failure.png'), fullPage: true }).catch(() => {});
    throw error;
} finally {
    await browser.close();
    server?.kill('SIGTERM');
}
