import { chooseOption } from './choose-option.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reference = JSON.parse(fs.readFileSync(path.join(root, 'content/typography-reference.json')));
const output = path.join(root, '.artifacts/typography-web');
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
    cases = [];
try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('response', (r) => {
        if (r.status() >= 400) errors.push(r.status() + ' ' + r.url());
    });
    await page.goto(base + '#/styles/typography');
    await page.waitForFunction(() => document.querySelector('[data-component-runtime=text]')?.getAttribute('aria-busy') === 'false');
    const frame = page.frameLocator('[data-component-runtime=text]');
    await frame.getByTestId('example-text').waitFor();
    for (const scheme of ['light', 'dark']) {
        if ((await page.locator('html').getAttribute('data-theme')) !== scheme) await page.getByTestId('docs-icon-theme').first().click();
        await page.waitForFunction(
            (scheme) => document.querySelector('iframe').contentDocument.documentElement.dataset.theme === scheme,
            scheme
        );
        for (const [height, official] of [
            ['small', 'Small'],
            ['medium', 'Medium'],
            ['large', 'Large'],
            ['extraLarge', 'Extra large'],
        ]) {
            await chooseOption(frame, '#type-language-height', height);
            for (const [variant, expected] of Object.entries(reference.styles)) {
                const element = frame.getByTestId('type-' + variant);
                const actual = await element.evaluate((el) => {
                    const s = getComputedStyle(el);
                    return {
                        size: parseFloat(s.fontSize),
                        line: parseFloat(s.lineHeight),
                        weight: Number(s.fontWeight),
                        spacing: parseFloat(s.letterSpacing) || 0,
                        family: s.fontFamily,
                    };
                });
                assert.equal(actual.size, expected.fontSize, variant + ' size');
                assert.equal(actual.line, expected.lineHeights[official], variant + ' ' + height + ' line-height');
                assert.equal(actual.weight, expected.fontWeight, variant + ' weight');
                assert.equal(actual.spacing, expected.letterSpacing, variant + ' tracking');
                assert.ok(actual.family.includes('Roboto'), variant + ' original font');
                cases.push({ scheme, height, variant });
            }
        }
    }
    await chooseOption(frame, '#type-language-height', 'small');
    for (const variant of Object.keys(reference.styles)) {
        const [, role, size, emphasis] = variant.match(/^(display|headline|title|body|label)(Large|Medium|Small)(Emphasized)?$/);
        await chooseOption(frame, '#type-role', role);
        await chooseOption(frame, '#type-size', size);
        await chooseOption(frame, '#type-emphasis', emphasis ? 'emphasized' : 'baseline');
        const metric = await frame.locator('#type-metrics').innerText();
        assert.ok(metric.includes(String(reference.styles[variant].fontSize) + ' / ' + reference.styles[variant].lineHeights.Small));
    }
    await frame.locator('#type-copy').fill('Canción, pingüino y corazón.');
    await chooseOption(frame, '#type-alignment', 'center');
    await chooseOption(frame, '#type-direction', 'rtl');
    const specimen = frame.getByTestId('example-text');
    assert.equal(await specimen.innerText(), 'Canción, pingüino y corazón.');
    assert.equal(await specimen.evaluate((el) => getComputedStyle(el).textAlign), 'center');
    assert.equal(await specimen.evaluate((el) => getComputedStyle(el).direction), 'rtl');
    await frame.locator('#type-selectable').uncheck();
    assert.equal(await specimen.evaluate((el) => getComputedStyle(el).userSelect), 'none');
    await frame.locator('#type-selectable').check();
    assert.equal(await specimen.evaluate((el) => getComputedStyle(el).userSelect), 'text');
    assert.equal(await frame.getByRole('heading', { name: 'Historias para el camino' }).getAttribute('aria-level'), '3');
    assert.equal(await frame.locator('details').count(), 0);
    assert.equal(await frame.locator('.type-specimen').count(), 30);
    for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await chooseOption(frame, '#type-language-height', 'extraLarge');
        await chooseOption(frame, '#type-role', 'display');
        await chooseOption(frame, '#type-size', 'Large');
        await frame.locator('#type-copy').fill('Una canción muy larga para escuchar y volver a descubrir.');
        assert.ok(await page.locator('body').evaluate((el) => el.scrollWidth <= innerWidth), 'Page fits ' + width);
        assert.ok(await frame.locator('body').evaluate((el) => el.scrollWidth <= innerWidth), 'Text wraps inside ' + width);
        await page.waitForFunction(() => {
            const f = document.querySelector('iframe');
            return Math.abs(parseFloat(f.style.height) - f.contentDocument.querySelector('main').getBoundingClientRect().height) < 2;
        });
    }
    await chooseOption(frame, '#type-language-height', 'small');
    await chooseOption(frame, '#type-direction', 'ltr');
    await chooseOption(frame, '#type-role', 'body');
    await chooseOption(frame, '#type-size', 'Large');
    await chooseOption(frame, '#type-emphasis', 'baseline');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: path.join(output, 'typography-page.png') });
    await page.goto(base + '#/styles/typography');
    const heading = page.locator('.page-text-examples [data-docs-text-run=headlineMedium]');
    await heading.waitFor();
    assert.equal(await page.locator('.page-text-examples [data-docs-text-mounted]').count(), 3, 'The styles page consumes real Text, too');
    assert.equal(await heading.evaluate((el) => getComputedStyle(el).lineHeight), '36px');
    assert.deepEqual(errors, []);
    fs.writeFileSync(
        path.join(output, 'results.json'),
        JSON.stringify(
            {
                source: reference.source,
                configurations: cases.length,
                cases,
                checks: [
                    '30-original-styles',
                    '4-language-heights',
                    '2-schemes',
                    'role-size-emphasis-controls',
                    'selection',
                    'RTL',
                    'headings',
                    '320-390-wrap-height',
                    'shared-page-text',
                ],
                errors,
            },
            null,
            2
        )
    );
    console.log('PASS: 240 text styles/profiles/schemes against official tokens, controls, semantics, narrow wrapping and real page Text.');
} finally {
    await browser.close();
    server.kill('SIGTERM');
}
