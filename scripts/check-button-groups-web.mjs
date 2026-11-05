import { chooseOption } from './choose-option.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    out = path.join(root, '.artifacts/button-groups-web');
fs.mkdirSync(out, { recursive: true });
const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
});
const base = await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('exit', (c) => reject(Error('Server exited ' + c)));
    server.stdout.on('data', (c) => {
        const url = String(c).match(/http:\/\/[^\s]+/);
        if (url) resolve(url[0]);
    });
});
const browser = await chromium.launch({
    executablePath:
        process.env.CHROME_PATH ??
        ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].find(fs.existsSync),
    headless: true,
});
const cases = [],
    iconWidths = [],
    motion = [],
    errors = [];
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'dist/data.json'), 'utf8'));
const colors = catalog.colors;
const rgb = (v) => v.replace(/^rgba\((.*), 1\)$/, 'rgb($1)');
const heights = { 'extra-small': 32, small: 40, medium: 56, large: 96, 'extra-large': 136 },
    gaps = { 'extra-small': 18, small: 12, medium: 8, large: 8, 'extra-large': 8 };
const poll = async (read, accept, label, timeout = 5000) => {
    const start = Date.now();
    let value;
    do {
        value = await read();
        if (accept(value)) return value;
        await new Promise((r) => setTimeout(r, 20));
    } while (Date.now() - start < timeout);
    assert.fail(label + ': ' + JSON.stringify(value));
};
let page;
try {
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        permissions: ['clipboard-read', 'clipboard-write'],
    });
    page = await context.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('response', (r) => {
        if (r.status() >= 400) errors.push(r.status() + ' ' + r.url());
    });
    await page.goto(base + '#/components/button-groups/overview');
    await page.waitForFunction(
        () => document.querySelector('[data-component-runtime=button-groups]')?.getAttribute('aria-busy') === 'false'
    );
    const frame = page.frameLocator('[data-component-runtime=button-groups]');
    await frame.getByTestId('example-group-one').waitFor();
    await frame.locator('#group-large-text').focus();
    await page.keyboard.press('Tab');
    assert.equal(
        await frame.getByTestId('example-group-one').evaluate((el) => el === document.activeElement),
        true,
        'Initial Tab reaches the first button'
    );
    const select = async (id, value) => chooseOption(frame, '#group-' + id, String(value));
    await frame.locator('#group-width').focus();
    await page.keyboard.press('End');
    const two = frame.getByTestId('example-group-two');
    const metrics = (target) =>
        target.evaluate((el) => {
            const s = getComputedStyle(el),
                visual = el.parentElement,
                r = visual.getBoundingClientRect(),
                host = el.getBoundingClientRect(),
                surface = visual.parentElement;
            return {
                x: r.x,
                y: r.y,
                w: r.width,
                h: r.height,
                targetW: host.width,
                targetH: host.height,
                paddingTop: parseFloat(s.paddingTop),
                radius: parseFloat(s.borderTopLeftRadius),
                outline: parseFloat(getComputedStyle(surface).outlineWidth),
                fill: getComputedStyle(surface).backgroundColor,
            };
        });
    const currentWidths = () =>
        frame
            .getByTestId('example-group')
            .evaluate((el) =>
                ['one', 'two', 'three', 'four', 'five'].map(
                    (key) => el.querySelector('[data-testid="example-group-' + key + '"]')?.parentElement.getBoundingClientRect().width ?? 0
                )
            );
    for (const theme of ['light', 'dark']) {
        if ((await page.locator('html').getAttribute('data-theme')) !== theme)
            await page.getByTestId('docs-icon-theme').filter({ visible: true }).first().click();
        await poll(
            () => frame.locator('html').getAttribute('data-theme'),
            (v) => v === theme,
            'Theme propagation'
        );
        for (const variant of ['standard', 'connected']) {
            await select('variant', variant);
            await select('selection', variant === 'standard' ? 'none' : 'single');
            for (const size of Object.keys(heights))
                for (const shape of ['round', 'square'])
                    for (const content of ['labels', 'both', 'icons'])
                        for (const treatment of variant === 'standard'
                            ? ['filled', 'tonal', 'outlined']
                            : ['filled', 'tonal', 'outlined', 'elevated']) {
                            if (process.env.GROUP_MATRIX === 'skip') continue;
                            await select('size', size);
                            await select('shape', shape);
                            await select('content', content);
                            await select('treatment', treatment);
                            const m = await poll(
                                () => metrics(two),
                                (m) => Math.abs(m.h - heights[size]) < 1 && m.w > 0,
                                'Visual height ' + [variant, size, shape, content, treatment]
                            );
                            assert.ok(m.targetW >= 47.9 && m.targetH >= 47.9, '48 dp real DOM target');
                            // Both rectangles belong to one frame; a release spring can still move
                            // neighbours between two separate browser round trips.
                            const pair = await two.evaluate((el) => {
                                const r = el.parentElement.getBoundingClientRect(),
                                    first = el
                                        .closest('[data-testid=example-group]')
                                        .querySelector('[data-testid=example-group-one]')
                                        .parentElement.getBoundingClientRect();
                                return { gap: r.x - first.right, centers: r.y + r.height / 2 - first.y - first.height / 2 };
                            });
                            assert.ok(Math.abs(pair.centers) < 1, 'Common vertical center');
                            assert.ok(
                                Math.abs(pair.gap - (variant === 'connected' ? 2 : gaps[size])) < 1,
                                'Published visual separation ' +
                                    [theme, variant, size, shape, content, treatment] +
                                    ' ' +
                                    JSON.stringify(pair)
                            );
                            const before = Number(await frame.locator('#group-action-count').innerText());
                            await two.click();
                            await poll(
                                () => frame.locator('#group-action-count').innerText(),
                                (v) => Number(v) === before + 1,
                                'Exactly one activation'
                            );
                            if (variant === 'connected') assert.equal(await two.getAttribute('aria-checked'), 'true');
                            const fill = (await metrics(two)).fill,
                                role =
                                    variant === 'connected'
                                        ? treatment === 'tonal'
                                            ? 'secondary'
                                            : treatment === 'outlined'
                                              ? 'inverseSurface'
                                              : 'primary'
                                        : treatment === 'tonal'
                                          ? 'secondaryContainer'
                                          : treatment === 'filled'
                                            ? 'primary'
                                            : null;
                            assert.equal(
                                fill,
                                role ? rgb(colors[theme][role]) : 'rgba(0, 0, 0, 0)',
                                'Semantic fill ' + [variant, treatment]
                            );
                            assert.equal(await two.getAttribute('role'), variant === 'connected' ? 'radio' : 'button');
                            cases.push({ theme, variant, size, shape, content, treatment });
                        }
        }
    }
    console.log('PASS: ' + cases.length + ' ButtonGroup geometry/style configurations.');
    // Presets retain their visual width while all real touch hosts remain 48 dp.
    await select('content', 'icons');
    await select('treatment', 'tonal');
    await frame.locator('#group-full').uncheck();
    const presets = {
        'extra-small': [28, 32, 40],
        small: [32, 40, 52],
        medium: [48, 56, 72],
        large: [64, 96, 128],
        'extra-large': [104, 136, 184],
    };
    for (const variant of ['standard', 'connected'])
        for (const size of Object.keys(presets))
            for (const [i, preset] of ['narrow', 'default', 'wide'].entries()) {
                await select('variant', variant);
                await frame.locator('#group-full').uncheck();
                await select('size', size);
                await select('icon-width', preset);
                const expected = variant === 'connected' ? Math.max(48, presets[size][i]) : presets[size][i];
                const m = await poll(
                    () => metrics(two),
                    (m) => Math.abs(m.w - expected) < 1,
                    'Icon width ' + [variant, size, preset]
                );
                assert.ok(m.targetW >= 47.9 && m.targetH >= 47.9);
                iconWidths.push({ variant, size, preset, visual: m.w });
            }
    await select('icon-width', 'default');
    await select('variant', 'standard');
    await select('size', 'extra-small');
    await two.scrollIntoViewIfNeeded();
    const target = await two.boundingBox();
    const beforeTarget = Number(await frame.locator('#group-action-count').innerText());
    await page.mouse.click(target.x + target.width / 2, target.y + 2);
    await poll(
        () => frame.locator('#group-action-count').innerText(),
        (v) => Number(v) === beforeTarget + 1,
        'Transparent target outside XS visual activates'
    );
    await select('variant', 'standard');
    await select('size', 'small');
    await select('shape', 'square');
    await select('content', 'labels');
    await select('treatment', 'tonal');
    await select('count', 5);
    await frame.locator('#group-full').check();
    for (const profile of ['standard', 'expressive'])
        for (const direction of ['ltr', 'rtl'])
            for (const variant of ['standard', 'connected']) {
                await select('motion', profile);
                await select('direction', direction);
                await select('variant', variant);
                await frame.locator('#group-full').check();
                await poll(
                    () => currentWidths(),
                    (v) => v.every((n) => n > 0),
                    'Five visible items'
                );
                await new Promise((r) => setTimeout(r, 350));
                const before = await currentWidths(),
                    active = frame.getByTestId('example-group-three');
                await active.scrollIntoViewIfNeeded();
                const box = await active.boundingBox();
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.mouse.down();
                const samples = await frame.getByTestId('example-group').evaluate(
                    (el) =>
                        new Promise((resolve) => {
                            const samples = [],
                                start = performance.now();
                            function sample() {
                                samples.push(
                                    ['one', 'two', 'three', 'four', 'five'].map(
                                        (key) =>
                                            el
                                                .querySelector('[data-testid="example-group-' + key + '"]')
                                                ?.parentElement.getBoundingClientRect().width ?? 0
                                    )
                                );
                                if (performance.now() - start < 240) requestAnimationFrame(sample);
                                else resolve(samples);
                            }
                            sample();
                        })
                );
                await page.mouse.up();
                if (variant === 'standard') {
                    assert.ok(
                        samples.some((s) => s[2] > before[2] + 1),
                        'Pressed item grows through real frames'
                    );
                    assert.ok(
                        samples.some((s) => s[1] < before[1] - 0.5 && s[3] < before[3] - 0.5),
                        'Immediate neighbours compress'
                    );
                    assert.ok(
                        samples.every((s) => Math.abs(s[0] - before[0]) < 1 && Math.abs(s[4] - before[4]) < 1),
                        'Distant buttons remain unchanged'
                    );
                    assert.ok(
                        samples.every((s) => Math.abs(s.reduce((a, b) => a + b, 0) - before.reduce((a, b) => a + b, 0)) < 1),
                        'Total row width is conserved'
                    );
                } else
                    assert.ok(
                        samples.every((s) => s.every((n, i) => Math.abs(n - before[i]) < 1)),
                        'Connected does not move neighbours'
                    );
                await poll(
                    () => currentWidths(),
                    (s) => s.every((n, i) => Math.abs(n - before[i]) < 1),
                    'Pressure settles'
                );
                motion.push({ profile, direction, variant, samples });
            }
    await select('variant', 'standard');
    await select('selection', 'multiple');
    await select('count', 3);
    await select('direction', 'ltr');
    await select('size', 'small');
    await select('shape', 'square');
    await frame.locator('#group-disable-middle').check();
    await frame.locator('#group-large-text').focus();
    await page.keyboard.press('Tab');
    const one = frame.getByTestId('example-group-one'),
        three = frame.getByTestId('example-group-three');
    assert.equal(
        await frame.locator('[data-testid^="example-group-"][tabindex="0"]').evaluate((el) => el === document.activeElement),
        true,
        'Tab returns to the current roving entry'
    );
    await page.keyboard.press('Home');
    assert.equal(await one.evaluate((el) => el === document.activeElement), true);
    await page.keyboard.press('ArrowRight');
    assert.equal(await three.evaluate((el) => el === document.activeElement), true, 'Arrows skip disabled');
    let changes = Number(await frame.locator('#group-change-count').innerText()),
        actions = Number(await frame.locator('#group-action-count').innerText());
    await page.keyboard.down('Space');
    assert.equal(Number(await frame.locator('#group-change-count').innerText()), changes, 'Space commits on release');
    await page.keyboard.down('Space');
    await page.keyboard.up('Space');
    await poll(
        () => frame.locator('#group-change-count').innerText(),
        (v) => Number(v) === changes + 1,
        'Space activates once, including repeat'
    );
    assert.equal(Number(await frame.locator('#group-action-count').innerText()), actions + 1);
    changes = Number(await frame.locator('#group-change-count').innerText());
    await page.keyboard.press('Enter');
    assert.equal(Number(await frame.locator('#group-change-count').innerText()), changes + 1, 'Enter is not duplicated');
    await page.keyboard.press('Home');
    assert.equal(await one.evaluate((el) => el === document.activeElement), true);
    await page.keyboard.press('End');
    assert.equal(await three.evaluate((el) => el === document.activeElement), true);
    await frame.locator('#group-disable-middle').uncheck();
    await two.click();
    assert.equal((await metrics(two)).outline, 0, 'Pointer leaves no keyboard ring');
    await two.scrollIntoViewIfNeeded();
    let box = await two.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const masks = await two.evaluate(
        (el) =>
            new Promise((resolve) => {
                const samples = [],
                    start = performance.now();
                function sample() {
                    const host = getComputedStyle(el),
                        mask = el.querySelector(':scope > [data-paper-ripple]:last-child');
                    if (mask) {
                        const cs = getComputedStyle(mask);
                        samples.push({
                            matches: [
                                'borderTopLeftRadius',
                                'borderTopRightRadius',
                                'borderBottomLeftRadius',
                                'borderBottomRightRadius',
                            ].every((key) => Math.abs(parseFloat(host[key]) - parseFloat(cs[key])) < 0.1),
                            top: parseFloat(cs.top),
                            inset: parseFloat(host.paddingTop),
                            radius: parseFloat(host.borderTopLeftRadius),
                        });
                    }
                    if (performance.now() - start < 180) requestAnimationFrame(sample);
                    else resolve(samples);
                }
                sample();
            })
    );
    await page.mouse.up();
    assert.ok(
        masks.length > 2 && masks.every((s) => s.matches && Math.abs(s.top - s.inset) < 0.1),
        'Ripple follows every corner and the visual inset'
    );
    actions = Number(await frame.locator('#group-action-count').innerText());
    await two.scrollIntoViewIfNeeded();
    box = await two.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x - 100, box.y + box.height / 2);
    await page.mouse.up();
    assert.equal(Number(await frame.locator('#group-action-count').innerText()), actions, 'Release outside cancels');
    actions = Number(await frame.locator('#group-action-count').innerText());
    await two.focus();
    await page.keyboard.down('Space');
    await frame.locator('#group-disabled').evaluate((el) => el.click());
    await page.keyboard.up('Space');
    assert.equal(Number(await frame.locator('#group-action-count').innerText()), actions, 'Blocking a held keyboard press cancels');
    await frame.locator('#group-disabled').uncheck();
    await select('variant', 'connected');
    await select('selection', 'single');
    await frame.locator('#group-empty').check();
    await one.click();
    await one.click();
    assert.equal(await one.getAttribute('aria-checked'), 'false', 'Optional selection clears');
    await frame.locator('#group-empty').uncheck();
    await one.click();
    await one.click();
    assert.equal(await one.getAttribute('aria-checked'), 'true', 'Required selection stays');
    for (const density of [0, -1, -2, -3])
        for (const size of Object.keys(heights)) {
            await select('size', size);
            await select('density', density);
            await poll(
                () => metrics(two),
                (m) => Math.abs(m.h - (heights[size] + density * 4)) < 1 && m.targetH >= 47.9,
                'Density height and target'
            );
            assert.ok((await metrics(two)).targetH >= 47.9, 'Density retains target');
        }
    await select('density', 0);
    await select('size', 'small');
    await select('count', 6);
    await select('visible', 2);
    let overflow = frame.getByTestId('example-group-overflow');
    await overflow.click();
    await frame.getByTestId('example-group-overflow-six').click();
    await poll(
        () => frame.locator('#group-result').innerText(),
        (v) => v.includes('six'),
        'Deferred overflow action'
    );
    assert.equal(await frame.getByRole('menu').count(), 0, 'Overflow closes before continuation');
    await select('visible', 0);
    await overflow.click();
    await page.keyboard.press('Escape');
    await poll(
        () => overflow.getAttribute('aria-expanded'),
        (v) => v === 'false',
        'Overflow Escape'
    );
    await poll(
        () => overflow.evaluate((el) => el === document.activeElement),
        (v) => v,
        'Overflow focus restored'
    );
    await select('visible', 'auto');
    await select('count', 3);
    await frame.locator('#group-label').fill('Una etiqueta que necesita más espacio');
    await frame.locator('#group-large-text').check();
    await poll(
        () => frame.getByTestId('example-group-overflow').count(),
        (v) => v === 1,
        'Long/scaled labels move to overflow'
    );
    await frame.locator('#group-large-text').uncheck();
    await frame.locator('#group-label').fill('');
    await page.getByTestId('docs-icon-motion').filter({ visible: true }).first().click();
    await poll(
        () => frame.locator('html').getAttribute('data-reduced'),
        (v) => v === 'true',
        'Reduced motion propagation'
    );
    await two.click();
    assert.equal(await two.getAttribute('aria-checked'), 'true');
    await page.getByTestId('docs-icon-motion').filter({ visible: true }).first().click();
    const scene = async (name) => {
        await chooseOption(frame, '#group-scenario', name);
        await frame.locator('[data-scene="' + name + '"]').waitFor();
    };
    await scene('welcome');
    await frame.getByTestId('welcome-group-start').click();
    await frame.locator('#welcome-name').fill('Alex');
    await frame.getByTestId('welcome-continue').click();
    assert.ok((await frame.locator('#welcome-result').innerText()).includes('Alex'));
    await frame.getByTestId('welcome-group-language').click();
    await frame.getByTestId('welcome-languages-Español').click();
    assert.equal(await frame.getByTestId('welcome-group-start').getAttribute('aria-label'), 'Comenzar');
    await scene('call');
    await frame.getByTestId('call-group-mic').click();
    assert.ok((await frame.locator('#call-result').innerText()).includes('Microphone on'));
    await frame.getByTestId('call-group-chat').click();
    await frame.locator('#call-message').fill('Next slide');
    await frame.getByTestId('call-send').click();
    assert.ok((await frame.locator('.group-task').innerText()).includes('Next slide'));
    await frame.getByTestId('call-end').click();
    await frame.getByTestId('call-rejoin').click();
    await scene('files');
    await frame.getByTestId('files-group-shared').click();
    assert.ok((await frame.locator('#files-results').innerText()).includes('Team collection'));
    await frame.getByTestId('files-open-search').click();
    await frame.locator('#files-search').fill('Photos');
    await frame.getByTestId('file-photos').click();
    assert.ok((await frame.locator('#files-result').innerText()).includes('Photos'));
    await scene('shopping');
    await frame.getByTestId('shopping-group-16oz').click();
    await frame.getByTestId('shopping-add').click();
    assert.equal(await frame.locator('#shopping-result').innerText(), 'Cart: 16oz');
    await scene('filters');
    await frame.getByTestId('sort-group-distance').click();
    await frame.getByTestId('price-group-$').click();
    await frame.getByTestId('filters-done').click();
    assert.ok((await frame.locator('#filter-results').innerText()).includes('The corner kitchen'));
    await frame.getByTestId('filters-reset').click();
    await scene('calculator');
    for (const [row, key] of [
        [1, '7'],
        [3, '+'],
        [2, '5'],
        [4, '='],
    ])
        await frame.getByTestId('calculator-row-' + row + '-' + key).click();
    assert.equal(await frame.getByTestId('calculator-value').innerText(), '12');
    await frame.getByTestId('calculator-row-0-AC').click();
    assert.equal(await frame.getByTestId('calculator-value').innerText(), '0');
    await scene('music');
    await frame.getByTestId('music-group-play').click();
    await frame.getByTestId('music-group-favorite').click();
    await frame.getByTestId('music-track-Parenthesis').click();
    assert.ok((await frame.locator('#music-result').innerText()).includes('Playing · Parenthesis · Favorite'));
    await frame.getByTestId('music-group-more').click();
    await frame.getByTestId('music-save').click();
    await scene('photo');
    await frame.getByTestId('photo-group-favorite').click();
    assert.ok((await frame.locator('#photo-result').innerText()).includes('Favorite'));
    await frame.getByTestId('photo-group-more').click();
    await frame.getByTestId('photo-copy').click();
    await poll(
        () => frame.locator('#photo-result').innerText(),
        (v) => v === 'Photo link copied.',
        'Clipboard action'
    );
    await scene('email');
    await frame.getByTestId('email-group-archive').click();
    await frame.getByTestId('email-undo').click();
    await frame.getByTestId('email-reply').click();
    await frame.locator('#email-draft').fill('Friday works.');
    await frame.getByTestId('email-save-draft').click();
    assert.equal(await frame.locator('#email-result').innerText(), 'Draft saved.');
    await frame.getByTestId('email-group-delete').click();
    await frame.getByTestId('email-confirm-delete').click();
    assert.equal(await frame.locator('#email-result').innerText(), 'Conversation deleted.');
    for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        for (const id of ['welcome', 'call', 'files', 'shopping', 'filters', 'calculator', 'music', 'photo', 'email']) {
            await scene(id);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Documentation fits ' + width);
            await poll(
                () => frame.locator('main').evaluate((el) => ({ width: innerWidth, scroll: el.scrollWidth })),
                (v) => v.scroll <= v.width,
                'Scene ' + id + ' settles at ' + width
            );
        }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await scene('shopping');
    await frame.getByTestId('shopping-add').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(out, 'button-groups-shopping.png') });
    await page.goto(base + '#/components');
    const categories = page.getByTestId('docs-catalog-categories');
    await categories.waitFor();
    await page.getByTestId('docs-catalog-categories-actions').click();
    await poll(
        () => page.locator('#component-count').innerText(),
        (v) => v.startsWith(catalog.components.filter((c) => c.category === 'actions').length + ' componentes'),
        'Real ButtonGroup filters the catalog'
    );
    assert.equal(await page.getByTestId('docs-catalog-categories-actions').getAttribute('aria-checked'), 'true');
    await page.getByTestId('docs-catalog-categories-all').click();
    await poll(
        () => page.locator('.component-card').count(),
        (v) => v === catalog.components.length,
        'All category restores catalog'
    );
    assert.deepEqual(errors, []);
    fs.writeFileSync(
        path.join(out, 'results.json'),
        JSON.stringify(
            {
                configurations: cases.length,
                iconWidths,
                cases,
                motion,
                masks,
                checks: [
                    'real-package',
                    'five-sizes',
                    'two-variants',
                    'two-shapes',
                    'three-contents',
                    'four-treatments',
                    'semantic-colors',
                    '48dp-targets',
                    'density',
                    'adjacent-only-width-transfer',
                    'constant-row-width',
                    'frame-by-frame-masks',
                    'keyboard-release-once',
                    'disabled-skipping',
                    'pointer-focus',
                    'cancel',
                    'required-optional-multiple',
                    'overflow-close-and-focus',
                    'label-measurement',
                    'scaled-text',
                    'reduced-motion',
                    'nine-usage-scenes',
                    '320-390-responsive',
                    'catalog-consumption',
                ],
                errors,
            },
            null,
            2
        )
    );
    console.log(
        'PASS: ' +
            cases.length +
            ' ButtonGroup configurations, ' +
            motion.length +
            ' motion cases, nine usage scenes and original catalog filtering.'
    );
} catch (error) {
    if (page) await page.screenshot({ path: path.join(out, 'failure.png') }).catch(() => {});
    console.error(errors);
    throw error;
} finally {
    await browser.close();
    server.kill('SIGTERM');
}
