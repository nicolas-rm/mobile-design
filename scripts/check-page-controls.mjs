import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    out = path.join(root, '.artifacts/page-controls');
fs.mkdirSync(out, { recursive: true });
const componentCount = JSON.parse(fs.readFileSync(path.join(root, 'dist/data.json'), 'utf8')).components.length;
const server = process.env.WEB_TEST_BASE_URL
    ? undefined
    : spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
const base =
    process.env.WEB_TEST_BASE_URL ??
    (await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.once('exit', (code) => reject(Error('Server exited: ' + code)));
        server.stdout.on('data', (chunk) => {
            const url = String(chunk).match(/http:\/\/[^\s]+/);
            if (url) resolve(url[0]);
        });
    }));
const executablePath =
    process.env.CHROME_PATH ?? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].find(fs.existsSync);
const browser = await chromium.launch({ executablePath, headless: true });
const errors = [];
try {
    const context = await browser.newContext({
            viewport: { width: 1440, height: 1000 },
            permissions: ['clipboard-read', 'clipboard-write'],
        }),
        page = await context.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('response', (r) => {
        if (r.status() >= 400) errors.push(r.status() + ' ' + r.url());
    });
    await page.goto(base + '#/components/buttons/api');
    const copy = page.getByTestId('docs-copy').first();
    await copy.waitFor();
    assert.equal(await copy.getAttribute('aria-label'), 'Copiar código');
    assert.equal(await copy.locator('[style*="font-family: MobileDesign"]').count(), 1, 'Package icon renders in the page.');
    const expected = await copy.locator('xpath=ancestor::*[contains(@class,"code-card")]').locator('code').innerText();
    await copy.click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected);
    await page.waitForFunction(() => document.querySelector('[data-testid=docs-copy]')?.getAttribute('aria-busy') === 'false');
    const confirmation = page.getByTestId('docs-snackbar');
    await confirmation.getByText('Copiado al portapapeles').waitFor();
    await copy.press('Enter');
    assert.ok(await copy.evaluate((el) => el === document.activeElement), 'Copy retains keyboard focus.');
    for (let i = 0; i < 4; i++)
        for (const route of [
            'develop/installation',
            'components/fab-menu/api',
            'styles/color',
            'styles/motion',
            'components/buttons/overview',
        ]) {
            await page.goto(base + '#/' + route);
            await page.waitForFunction((route) => document.body.dataset.route === route, route);
            await page.locator('[data-mobile-design-mounted]').first().waitFor();
            const counts = await page
                .locator('[data-mobile-design-host]')
                .evaluateAll((hosts) =>
                    hosts.map((host) => ({
                        kind: host.dataset.kind,
                        count: [...host.querySelectorAll('button,a[data-testid],input')].filter(
                            (control) => control.closest('[data-mobile-design-host]') === host
                        ).length,
                    }))
                );
            assert.ok(
                counts.every((host) => host.count === ({ split: 2, appbar: 2, search: 2, badge: 0, drawer: 0, rail: 7 }[host.kind] ?? 1)),
                'Each mount has exactly its own original controls.'
            );
            assert.equal(await page.locator('#mobile-design-controls-root').count(), 1, 'One provider root.');
        }
    await page.goto(base + '#/home');
    const primary = page.locator('.hero-cta[data-variant=filled]').getByRole('link', { name: 'Comenzar', exact: true });
    await primary.waitFor();
    assert.equal(await primary.getAttribute('href'), '#/start');
    const editorial = page.locator('.editorial-card').getByTestId('docs-card-editorial').first();
    assert.equal(await editorial.evaluate((el) => el.tagName), 'A', 'Editorial Card exposes a real link.');
    assert.ok((await editorial.getAttribute('href')).startsWith('#/'));
    await page.goto(base + '#/develop/installation');
    const firstPieces = page.locator('.reference-grid [data-variant=outlined]').getByTestId('docs-navigation-button');
    await firstPieces.first().waitFor();
    assert.deepEqual(
        await firstPieces.evaluateAll((links) => links.map((link) => [link.tagName, link.getAttribute('href')])),
        ['buttons', 'text-fields', 'tabs', 'lists'].map((id) => ['A', '#/components/' + id + '/overview'])
    );
    const tabsLink = page.locator('.reference-grid').getByRole('link', { name: 'Tabs', exact: true });
    const opened = context.waitForEvent('page');
    await tabsLink.click({ button: 'middle' });
    const tabPage = await opened;
    await tabPage.waitForURL('**/#/components/tabs/overview');
    await tabPage.close();
    await tabsLink.press('Enter');
    await page.waitForFunction(() => document.body.dataset.route === 'components/tabs/overview');
    await page.goto(base + '#/resources/licenses');
    const notices = page.getByTestId('docs-navigation-button').and(page.getByRole('link', { name: 'Descargar atribuciones incluidas' }));
    assert.equal(await notices.getAttribute('download'), '');
    await page.goto(base + '#/styles/color');
    const toggle = page.getByTestId('docs-theme');
    await toggle.waitFor();
    const theme = await page.locator('html').getAttribute('data-theme');
    await toggle.click();
    await page.waitForFunction((old) => document.documentElement.dataset.theme !== old, theme);
    assert.ok(await page.getByTestId('docs-theme').isVisible());
    const swatch = page.getByTestId('docs-copy-color').first();
    const swatchColor = await swatch.evaluate((el) => el.closest('[data-color]').dataset.color);
    await swatch.press('Enter');
    await page.waitForFunction(async (color) => (await navigator.clipboard.readText()) === color, swatchColor);
    await page.goto(base + '#/styles/motion');
    const motion = page.getByTestId('docs-motion');
    await motion.waitFor();
    const reduced = await motion.getAttribute('aria-pressed');
    await motion.click();
    assert.notEqual(await motion.getAttribute('aria-pressed'), reduced);
    await page.goto(base + '#/components');
    await page.locator('#catalog-filter').fill('xyz-no-such-component');
    const clear = page.getByTestId('docs-reset-filter');
    await clear.waitFor();
    await clear.click();
    assert.equal(await page.locator('#catalog-filter').inputValue(), '');
    assert.equal(await page.locator('.component-card').count(), componentCount);
    // Dispose a pending copy before replacing the article tree.
    await page.goto(base + '#/components/buttons/api');
    await page.getByTestId('docs-copy').first().waitFor();
    await page.evaluate(() => {
        const original = navigator.clipboard.writeText.bind(navigator.clipboard);
        navigator.clipboard.writeText = (text) =>
            new Promise((resolve) =>
                setTimeout(() => {
                    original(text).then(resolve);
                }, 200)
            );
    });
    await page.getByTestId('docs-copy').first().click();
    await page.goto(base + '#/components/fab-menu/overview');
    await page.waitForTimeout(250);
    await page.goto(base + '#/components/cards/overview');
    const codeActions = page.getByTestId('docs-code-actions').first(),
        codePrimary = page.getByTestId('docs-code-actions-primary').first();
    await codePrimary.waitFor();
    const codeText = await codeActions.locator('xpath=ancestor::*[contains(@class,"code-card")]').locator('code').innerText();
    await codePrimary.click();
    await page.waitForFunction(async (text) => (await navigator.clipboard.readText()) === text, codeText);
    await page.getByTestId('docs-code-actions-toggle').first().click();
    await page.getByRole('menuitem', { name: 'Descargar ejemplo', exact: true }).waitFor();
    const downloadReady = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: 'Descargar ejemplo', exact: true }).click();
    const download = await downloadReady;
    assert.equal(download.suggestedFilename(), 'cards.tsx');
    await page.goto(base + '#/components');
    const cards = page.locator('[data-mobile-design-host][data-kind=card]');
    await page.getByTestId('docs-card-buttons').waitFor();
    assert.equal(await cards.count(), componentCount);
    assert.equal(
        await page.getByTestId('docs-card-buttons').evaluate((el) => el.tagName),
        'A',
        'Original Card exposes a real browser link.'
    );
    assert.equal(await page.getByTestId('docs-card-buttons').getAttribute('href'), '#/components/buttons/overview');
    await page.getByTestId('docs-card-buttons').click();
    await page.waitForFunction(() => document.body.dataset.route === 'components/buttons/overview');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '#/develop/installation');
    await page.getByTestId('docs-copy').first().waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const nav = page.getByTestId('docs-icon-sidebar');
    await nav.click();
    assert.equal(await nav.getAttribute('aria-expanded'), 'true');
    assert.ok(await page.locator('#sidebar .sidebar-close button').evaluate((el) => el === document.activeElement));
    assert.equal(await page.locator('.workspace').getAttribute('inert'), '');
    await page.keyboard.press('Escape');
    assert.equal(await nav.getAttribute('aria-expanded'), 'false');
    assert.ok(await nav.evaluate((el) => el === document.activeElement), 'Mobile close returns focus to original IconButton.');
    await nav.click();
    await page.getByTestId('docs-icon-close-sidebar').click();
    assert.equal(await nav.getAttribute('aria-expanded'), 'false', 'The mobile close button can be clicked without overlapping search.');
    await page.getByTestId('docs-icon-search').filter({ visible: true }).first().click();
    await page.locator('#global-search').fill('Icon buttons');
    await page.getByTestId('docs-icon-close-search').click();
    assert.equal(await page.locator('#search-dialog').evaluate((el) => el.open), false);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + '#/components/icon-buttons/api');
    await page.getByTestId('docs-icon-copy-link').first().waitFor();
    assert.equal(await page.locator('.sidebar-close button').isVisible(), false, 'No extra close control on desktop.');
    await page.getByTestId('docs-icon-copy-link').first().click();
    await page.waitForFunction(async () => (await navigator.clipboard.readText()).includes('section=import'));
    assert.equal(await page.locator('details').count(), 0);
    const navigationGroup = page.getByRole('button', { name: 'Navigation', exact: true });
    const groupId = await navigationGroup.getAttribute('aria-controls');
    const panel = page.locator('#' + groupId);
    assert.equal(await navigationGroup.getAttribute('aria-expanded'), 'false');
    assert.equal(await panel.getAttribute('inert'), '');
    await navigationGroup.press('Space');
    assert.equal(await navigationGroup.getAttribute('aria-expanded'), 'true');
    assert.equal(await panel.getAttribute('inert'), null);
    await panel.getByRole('link', { name: 'Navigation rail', exact: true }).click();
    await page.waitForFunction(() => document.body.dataset.route === 'components/navigation-rail/overview');
    await panel.locator('a[aria-current=page][data-testid=docs-drawer-item]').waitFor({ state: 'attached' });
    assert.equal(await navigationGroup.getAttribute('aria-expanded'), 'true');

    const motionToggle = page.getByTestId('docs-icon-motion').filter({ visible: true }).first();
    if ((await motionToggle.getAttribute('aria-pressed')) === 'true') await motionToggle.click();
    const tabs = page.locator('.component-tabs');
    const expandedTabs = await tabs.boundingBox();
    assert.equal(await tabs.evaluate((el) => getComputedStyle(el).boxShadow), 'none');
    await tabs.evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + 80, behavior: 'instant' }));
    await page.waitForFunction((full) => {
        const tabs = document.querySelector('.component-tabs');
        return tabs.hasAttribute('data-pinned') && tabs.offsetWidth < full - 120 && tabs.offsetHeight === 64;
    }, expandedTabs.width);
    assert.notEqual(await tabs.evaluate((el) => getComputedStyle(el).boxShadow), 'none');
    assert.ok(
        await tabs.evaluate(
            (el) =>
                Math.abs(el.getBoundingClientRect().left - document.querySelector('.component-section').getBoundingClientRect().left) < 2
        )
    );
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction((full) => {
        const tabs = document.querySelector('.component-tabs');
        return !tabs.hasAttribute('data-pinned') && Math.abs(tabs.offsetWidth - full) < 2 && getComputedStyle(tabs).boxShadow === 'none';
    }, expandedTabs.width);
    const tabsElement = await tabs.elementHandle();
    const specs = tabs.getByRole('link', { name: 'Especificaciones', exact: true });
    await page.evaluate(() => {
        const outgoing = document.querySelector('.component-tabs [aria-current]');
        const incoming = document.querySelector('[data-section-tab=specs]');
        const read = (link) => {
            const style = getComputedStyle(link, '::before');
            const matrix = new DOMMatrixReadOnly(style.transform);
            return {
                opacity: Number(style.opacity),
                scale: matrix.a,
                x: matrix.e,
                origin: parseFloat(style.transformOrigin) / link.offsetWidth,
            };
        };
        window.sectionMotion = new Promise((resolve) =>
            window.addEventListener(
                'hashchange',
                () => {
                    const started = performance.now();
                    const sample = () => {
                        const from = read(outgoing),
                            to = read(incoming);
                        if ((from.opacity > 0 && from.opacity < 1 && to.opacity > 0 && to.opacity < 1) || performance.now() - started > 400)
                            resolve({ from, to });
                        else requestAnimationFrame(sample);
                    };
                    requestAnimationFrame(sample);
                },
                { once: true }
            )
        );
    });
    await specs.press('Enter');
    await page.waitForFunction(() => document.body.dataset.route === 'components/navigation-rail/specs');
    const { from, to } = await page.evaluate(() => window.sectionMotion);
    for (const capsule of [from, to]) {
        assert.ok(
            capsule.opacity > 0 && capsule.opacity < 1 && capsule.scale > 0.32 && capsule.scale < 1,
            'Both capsules scale and fade during the same frame.'
        );
        assert.equal(capsule.x, 0, 'A capsule never travels to another tab.');
        assert.ok(Math.abs(capsule.origin - 0.5) < 0.005, 'Each capsule scales around its own center.');
    }
    assert.ok(await page.evaluate((el) => el === document.querySelector('.component-tabs'), tabsElement), 'Section links stay mounted.');
    assert.equal(await specs.getAttribute('aria-current'), 'page');
    assert.equal(await page.locator('.next-prev a[rel=next]').getAttribute('href'), '#/components/navigation-rail/api');
    assert.equal(await page.locator('.next-prev a[rel=prev]').getAttribute('href'), '#/components/navigation-rail/overview');
    assert.equal(await page.locator('.next-prev a[rel=next]').getAttribute('data-testid'), 'docs-card-pager');
    assert.ok(await specs.evaluate((el) => el === document.activeElement), 'The section link retains keyboard focus.');
    await specs.locator('[data-docs-text-run=labelLargeEmphasized]').waitFor();
    await page.waitForFunction(() => {
        const active = document.querySelector('.component-tabs [aria-current]');
        const previous = document.querySelector('[data-section-tab=overview]');
        return getComputedStyle(active, '::before').opacity === '1' && getComputedStyle(previous, '::before').opacity === '0';
    });
    await page.locator('.toc [data-scroll-to=dimensions]').click();
    await page.waitForFunction(
        () => document.querySelector('.toc [data-scroll-to=dimensions]')?.getAttribute('aria-current') === 'location'
    );
    await page.locator('.toc [data-scroll-to=defaults]').click();
    await page.waitForFunction(() => document.querySelector('.toc [data-scroll-to=defaults]')?.getAttribute('aria-current') === 'location');
    const api = tabs.getByRole('link', { name: 'API', exact: true });
    await api.click();
    await page.waitForFunction(() => document.body.dataset.route === 'components/navigation-rail/api');
    assert.ok(
        await tabs.evaluate((el) => Math.abs(el.getBoundingClientRect().top - parseFloat(getComputedStyle(el).top)) < 2),
        'Sticky tabs remain visible during section navigation.'
    );
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.route === 'components/navigation-rail/specs');
    assert.equal(await specs.getAttribute('aria-current'), 'page');
    await page.setViewportSize({ width: 1280, height: 800 });
    const drawer = page.locator('#sidebar');
    const components = page.locator('[data-rail=components]');
    assert.equal(await components.getAttribute('href'), '#/components');
    assert.equal(await components.getAttribute('aria-current'), 'page');
    assert.ok(await components.locator('xpath=ancestor::*[@data-testid="docs-navigation-rail"]').count());
    assert.equal(await drawer.getByTestId('docs-navigation-drawer').count(), 1);
    await page.waitForFunction(() => document.querySelector('#sidebar').inert);
    assert.equal(await page.locator('.toc').evaluate((el) => getComputedStyle(el).position), 'static');
    await components.press('Enter');
    assert.equal(await components.getAttribute('aria-expanded'), 'true');
    assert.equal(await drawer.getAttribute('inert'), null);
    assert.equal(await drawer.getAttribute('aria-modal'), null);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#sidebar')).boxShadow !== 'none');
    await page.waitForFunction(() => document.activeElement.matches('#sidebar a[aria-current=page]'));
    await page.keyboard.press('Escape');
    assert.equal(await components.getAttribute('aria-expanded'), 'false');
    assert.ok(await components.evaluate((el) => el === document.activeElement), 'Closing the floating drawer returns focus to the rail.');
    const railStyles = page.locator('[data-rail=styles]');
    await railStyles.click();
    await page.waitForFunction(() => document.body.dataset.route === 'styles' && document.body.classList.contains('sidebar-open'));
    assert.equal(await railStyles.getAttribute('aria-expanded'), 'true');
    await page.goto(base + '#/components');
    const appearance = page.getByTestId('docs-icon-theme').filter({ visible: true });
    const startingTheme = await page.locator('html').getAttribute('data-theme');
    await appearance.click();
    await page.waitForFunction((theme) => document.documentElement.dataset.theme !== theme, startingTheme);
    assert.equal(await appearance.getAttribute('aria-pressed'), String(startingTheme === 'light'));
    assert.equal(await appearance.getAttribute('aria-label'), startingTheme === 'light' ? 'Activar tema claro' : 'Activar tema oscuro');
    assert.equal(await appearance.locator('[style*="MobileDesignMaterialSymbolsRounded"]').count(), 1);
    const catalogCard = page.getByTestId('docs-card-cards');
    await catalogCard.scrollIntoViewIfNeeded();
    const resting = await catalogCard.boundingBox();
    await catalogCard.hover();
    await page.waitForFunction(
        () => getComputedStyle(document.querySelector('[data-testid=docs-card-cards]')).borderTopLeftRadius === '32px'
    );
    const hovered = await catalogCard.boundingBox();
    assert.equal(hovered.y, resting.y, 'Catalogue cards change shape without shifting their position.');
    await page.goto(base + '#/foundations/layout');
    const foundationRail = page.locator('[data-rail=foundations]');
    await foundationRail.press('Enter');
    const guideGroup = page.getByRole('button', { name: 'Diseño de interfaz', exact: true });
    assert.equal(await guideGroup.getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('#tree-foundation-interface a[aria-current=page]').innerText(), 'Diseño adaptable');
    assert.equal(await page.locator('.toc-title').innerText(), 'Diseño adaptable');
    assert.equal(await page.locator('.next-prev a[rel=next]').getAttribute('href'), '#/foundations/tokens');
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.goto(base + '#/components/menus/overview');
    const nextComponentSection = page.locator('.next-prev a[rel=next]');
    await nextComponentSection.waitFor();
    assert.ok(
        await nextComponentSection.evaluate((next) => {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
            const index = document.querySelector('.toc').getBoundingClientRect();
            return next.getBoundingClientRect().top - index.bottom >= 24;
        }),
        'The sticky contents index stays clear of the pager at the desktop breakpoint.'
    );
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto(base + '#/components/cards/accessibility');
    const semanticLink = page.locator('.toc').getByRole('link', { name: 'Semántica', exact: true });
    await semanticLink.waitFor();
    assert.ok(
        await semanticLink.evaluate((link) => link.offsetWidth < link.closest('.toc').clientWidth / 2),
        'The compact index highlight follows its label.'
    );
    await semanticLink.click();
    await page.waitForFunction(
        () => document.querySelector('.toc [data-scroll-to=semantics]')?.getAttribute('aria-current') === 'location'
    );
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.goto(base + '#/components/navigation-rail/specs');
    await page.setViewportSize({ width: 320, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const accessibility = tabs.getByRole('link', { name: 'Accesibilidad', exact: true });
    await accessibility.press('Enter');
    await page.waitForFunction(() => document.body.dataset.route === 'components/navigation-rail/accessibility');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(
        await page.locator('#sidebar').evaluate((el) => getComputedStyle(el).visibility),
        'hidden',
        'The closed drawer stays out of view at the mobile breakpoint.'
    );
    assert.ok(
        await accessibility.evaluate((el) => {
            const bar = el.closest('.component-tabs').getBoundingClientRect(),
                link = el.getBoundingClientRect();
            return (
                link.left >= bar.left - 1 &&
                link.right <= bar.right + 1 &&
                getComputedStyle(el.querySelector('.section-tab-label')).whiteSpace === 'nowrap'
            );
        }),
        'The selected section is fully visible at 320 px.'
    );
    assert.ok(
        await accessibility.evaluate((el) => parseFloat(getComputedStyle(el, '::before').transitionDuration) < 0.002),
        'Reduced motion suppresses capsule animation.'
    );
    await page.screenshot({ path: path.join(out, 'page-controls-mobile.png') });
    assert.deepEqual(errors, []);
    fs.writeFileSync(
        path.join(out, 'results.json'),
        JSON.stringify(
            {
                checks: [
                    'original-package-icon',
                    'copy',
                    'keyboard',
                    '20-route-replacements',
                    'single-root',
                    'theme-rerender',
                    'motion-toggle',
                    'clear-filters',
                    'pending-copy-unmount',
                    'original-card-links',
                    'split-copy-download',
                    'responsive',
                    'group-disclosure',
                    'active-link-weight',
                    'section-capsule-scale-and-fade',
                    'sticky-section-navigation',
                    'contents-location',
                    'history',
                    '320px-reduced-motion',
                ],
                sectionMotion: { from, to },
                errors,
            },
            null,
            2
        )
    );
    console.log(
        'PASS: Original controls, navigation disclosure, section focus and indicator, browser history, reduced motion and responsive layout.'
    );
} finally {
    await browser.close();
    server?.kill('SIGTERM');
}
