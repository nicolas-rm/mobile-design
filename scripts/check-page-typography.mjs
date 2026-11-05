import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { guides, styleTopics } from '../dist/site-sections.js';
import { webExamples, webRuntime } from '../dist/web-examples.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.artifacts/page-typography');
fs.mkdirSync(output, { recursive: true });
const data = JSON.parse(fs.readFileSync(path.join(root, 'dist/data.json')));
const routes = [
    ...new Set([
        'home',
        'components',
        'develop/installation',
        'verification',
        'support',
        ...Object.keys(guides),
        ...Object.keys(styleTopics).map((id) => 'styles/' + id),
        ...data.components.flatMap((c) => ['overview', 'specs', 'api', 'accessibility'].map((s) => 'components/' + c.id + '/' + s)),
    ]),
];
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
    results = [];
const poll = async (read, accept, label) => {
    let value;
    const start = Date.now();
    do {
        value = await read();
        if (accept(value)) return value;
        await new Promise((r) => setTimeout(r, 20));
    } while (Date.now() - start < 5000);
    assert.fail(label + ': ' + JSON.stringify(value));
};
try {
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (entry) => {
        if (entry.type() === 'error') errors.push(entry.text());
    });
    const open = async (route) => {
        await page.goto(base + '#/' + route);
        await page.waitForFunction((route) => document.body.dataset.route === route, route);
        await page.locator('h1 [data-docs-text-run]').first().waitFor();
    };
    for (const route of routes) {
        await open(route);
        await poll(
            () => page.locator('[data-docs-text-host]:not([data-docs-text-mounted])').count(),
            (count) => count === 0,
            route + ' all Text commits'
        );
        const headings = await page.locator('main h1').allTextContents();
        assert.equal(headings.length, 1, route + ' one semantic h1');
        const missing = await page.evaluate(() => {
            const result = [];
            for (const el of document.querySelectorAll(
                'main h1,main h2,main h3,main p,main li,main td,main th,#component-navigation a,.site-footer p'
            )) {
                if (el.closest('[aria-hidden=true],.card-preview,[data-testid]')) continue;
                const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                while (walker.nextNode()) {
                    const n = walker.currentNode,
                        p = n.parentElement;
                    if (
                        !n.textContent.trim() ||
                        p.closest('code,pre,kbd,samp,svg,.symbol,[aria-hidden=true],[data-testid],[data-docs-text-run]')
                    )
                        continue;
                    result.push(n.textContent.slice(0, 60));
                }
            }
            return result;
        });
        assert.deepEqual(missing, [], route + ' editorial text uses the real component');
        assert.equal(await page.locator('p div,h1 div,h2 div,h3 div,a a').count(), 0, route + ' valid inline composition');
        const first = page.locator('main h1 [data-docs-text-run]').first();
        assert.equal(
            await first.getAttribute('data-docs-text-run'),
            route.startsWith('components/') ? 'displayLargeEmphasized' : 'displayLarge'
        );
        const [textSize, headingSize] = await first.evaluate((el) => [
            parseFloat(getComputedStyle(el).fontSize),
            parseFloat(getComputedStyle(el.closest('h1')).fontSize),
        ]);
        assert.equal(textSize, headingSize, route + ' the semantic heading and Text share the editorial size');
        if (route === 'components') assert.ok(textSize >= 36 && textSize <= 88, 'The catalogue heading adapts to its panel');
        else assert.equal(textSize, route === 'home' || route.startsWith('components/') ? 88 : 57, route + ' editorial heading size');
        results.push({ route, headings, runs: await page.locator('[data-docs-text-run]').count() });
    }
    // Dynamic content and inline semantics must survive rendering and replacement.
    await open('develop/installation');
    const expected = 'Un texto con énfasis, un enlace y value = 3.';
    await page.locator('main').evaluate((main) => {
        const p = document.createElement('p');
        p.id = 'typography-contract';
        p.innerHTML = 'Un texto con <strong>énfasis</strong>, <a href="#/styles/typography">un enlace</a> y <code>value = 3</code>.';
        main.append(p);
    });
    const paragraph = page.locator('#typography-contract');
    await paragraph.locator('[data-docs-text-run]').first().waitFor();
    assert.equal(await paragraph.innerText(), expected);
    assert.ok((await paragraph.locator('code').evaluate((el) => getComputedStyle(el).fontFamily)).includes('mono'));
    assert.equal(await paragraph.locator('code [data-docs-text-run]').count(), 0, 'Code remains code');
    assert.equal(await paragraph.locator('strong [data-docs-text-run]').getAttribute('data-docs-text-run'), 'bodyLargeEmphasized');
    await paragraph.locator('a').focus();
    assert.equal(await paragraph.locator('a').evaluate((el) => el === document.activeElement), true);
    await paragraph.locator('a').press('Enter');
    await page.waitForFunction(() => document.body.dataset.route === 'styles/typography');
    await open('components');
    await page.locator('#catalog-filter').fill('badge');
    await poll(
        () => page.locator('#component-count [data-docs-text-run]').innerText(),
        (v) => v.startsWith('1 componente'),
        'Dynamic count uses Text'
    );
    await page.locator('#catalog-filter').fill('no-such-component');
    await page.getByRole('heading', { name: 'No encontramos esa pieza' }).waitFor();
    await page.getByTestId('docs-reset-filter').click();
    await poll(
        () => page.locator('.component-card').count(),
        (v) => v === data.components.length,
        'Reset keeps original Card links'
    );
    await page.getByTestId('docs-card-buttons').click();
    await page.waitForFunction(() => document.body.dataset.route === 'components/buttons/overview');
    await page.keyboard.press('Control+k');
    await page.locator('#global-search').fill('tipografía');
    await page.locator('#search-results').getByText('Tipografía', { exact: true }).waitFor();
    assert.match(
        await page
            .locator('#search-results')
            .getByText('Tipografía', { exact: true })
            .evaluate((el) => getComputedStyle(el).fontFamily),
        /Roboto/
    );
    await page.locator('#search-results a[href="#/styles/typography"]').click();
    await page.waitForFunction(() => document.body.dataset.route === 'styles/typography');
    await page.getByTestId('docs-copy').first().click();
    await page.locator('.skip-status').getByText('Copiado al portapapeles').waitFor({ state: 'attached' });
    const codeBefore = await page.locator('.code-card pre code').first().textContent();
    for (const width of [390, 320, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await poll(
            () => page.locator('h1 [data-docs-text-run]').first().getAttribute('data-docs-text-run'),
            (v) => v === (width < 621 ? 'displayMedium' : 'displayLarge'),
            'Responsive type role'
        );
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No page overflow at ' + width);
        assert.equal(await page.locator('.code-card pre code').first().textContent(), codeBefore, 'Code is not changed by resize');
    }
    const title = await page.locator('main h1').innerText(),
        theme = await page.locator('html').getAttribute('data-theme');
    await page.getByTestId('docs-icon-theme').filter({ visible: true }).first().click();
    await poll(
        () => page.locator('html').getAttribute('data-theme'),
        (v) => v !== theme,
        'Theme switch'
    );
    assert.equal(await page.locator('main h1').innerText(), title, 'Theme keeps content');
    const nextTheme = await page.locator('html').getAttribute('data-theme');
    await page.waitForFunction(
        (theme) => document.querySelector('iframe')?.contentDocument.documentElement.dataset.theme === theme,
        nextTheme
    );
    await page.getByTestId('docs-snackbar-presence').waitFor({ state: 'detached', timeout: 6000 });
    assert.equal(
        await page.locator('.skip-status').textContent(),
        'Copiado al portapapeles',
        'The live status retains the result after visual dismissal.'
    );
    await page.locator('#text-usage').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, 'typography-consumption.png') });
    await open('components/buttons/api');
    await page.locator('#api-filter').fill('variant');
    await poll(
        () => page.locator('#api-count [data-docs-text-run]').innerText(),
        (v) => v === '1 propiedades',
        'Filtered API count'
    );
    // Runtime prose is React-owned: it consumes Text directly, without DOM migration.
    const runtimeResults = [];
    for (const [id, url] of [...Object.entries(webExamples).map(([id, entry]) => [id, entry.url]), ['text', webRuntime.typography]]) {
        await page.goto(new URL(url, base).href);
        await page.locator('[data-runtime-text-root] main').waitFor();
        const missing = await page.evaluate(() => {
            const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT),
                missing = [];
            while (walker.nextNode()) {
                const n = walker.currentNode,
                    p = n.parentElement;
                if (
                    !n.textContent.trim() ||
                    p.closest('script,style,pre,code,option,textarea,svg,[data-testid],[data-runtime-text],[aria-hidden=true]')
                )
                    continue;
                if (/MaterialSymbolsRounded|MaterialDesignIcons|MaterialCommunityIcons/i.test(getComputedStyle(p).fontFamily)) continue;
                // Text rendered internally by original components (e.g. Card.Title) already
                // belongs to RN Web, rather than the semantic HTML prose migrated here.
                if (p.matches('span[class^="css-"],div[dir="auto"][class^="css-"]') && getComputedStyle(p).fontFamily.includes('Roboto'))
                    continue;
                missing.push(n.textContent.slice(0, 80));
            }
            return missing;
        });
        assert.deepEqual(missing, [], id + ' runtime prose uses Text');
        assert.equal(await page.locator('p div,h1 div,h2 div,h3 div,label>div,a a').count(), 0, id + ' valid inline HTML');
        // Original Select fields own their accessible label. Editorial runs are
        // present even in galleries without a native HTML label element.
        assert.ok((await page.locator('[data-runtime-text]').count()) > 0, id + ' real editorial Text');
        assert.equal(await page.locator('pre [data-runtime-text]').count(), 0, id + ' code is unchanged');
        runtimeResults.push({ id, runs: await page.locator('[data-runtime-text]').count() });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(
        path.join(output, 'results.json'),
        JSON.stringify(
            {
                routes: results,
                runtimes: runtimeResults,
                checks: [
                    'original-Text-throughout-documentation',
                    'semantic-headings',
                    'valid-inline-HTML',
                    'rich-inline-content',
                    'code-integrity',
                    'search',
                    'catalog-filter-reset',
                    'real-links',
                    'dynamic-status',
                    'theme',
                    'responsive-type',
                    '320-390-layout',
                    'React-owned-runtime-prose',
                ],
                errors,
            },
            null,
            2
        )
    );
    console.log(
        'PASS: Text consumption on ' +
            results.length +
            ' routes and ' +
            runtimeResults.length +
            ' runtimes, semantic HTML, code integrity, links, search, filters, status, themes and responsive layouts.'
    );
} finally {
    await browser.close();
    server.kill('SIGTERM');
}
