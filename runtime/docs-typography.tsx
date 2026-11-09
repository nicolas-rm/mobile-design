import { useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { TextStyle } from 'react-native';
import { Text, useMobileTheme, type TextVariant } from 'mobile-design/react-native-web';

type Run = {
    key: number;
    host: HTMLSpanElement;
    source: globalThis.Text;
    content: string;
    owner: HTMLElement;
    variant: TextVariant;
    italic: boolean;
    align: TextStyle['textAlign'];
    direction: 'ltr' | 'rtl';
};
const protectedContent =
    'script,style,noscript,code,pre,kbd,samp,svg,math,input,textarea,select,option,.symbol,.editorial-art,.card-preview,[aria-hidden="true"],[data-docs-text-host],[data-docs-text-ancestor]';
const variants = new Set(
    ['display', 'headline', 'title', 'body', 'label'].flatMap((role) =>
        ['Large', 'Medium', 'Small'].flatMap((size) => [role + size, role + size + 'Emphasized'])
    )
);

function isProtected(element: Element) {
    if (element.closest(protectedContent)) return true;
    const control = element.closest('[data-mobile-design-host]');
    // Card owns the surface; its editorial markup remains content of the page.
    if (
        element.closest('[data-testid]') &&
        !(control?.getAttribute('data-kind') === 'card' && element.closest('.card-content,.docs-card-content'))
    )
        return true;
    return Boolean(control && control.getAttribute('data-kind') !== 'card');
}
function variantFor(element: HTMLElement, compact: boolean): TextVariant {
    const explicit = element.closest<HTMLElement>('[data-text-variant]')?.dataset.textVariant;
    if (explicit && variants.has(explicit)) return explicit as TextVariant;
    let variant: TextVariant;
    if (element.closest('.rail-links [aria-current]')) variant = 'labelSmallEmphasized';
    else if (element.closest('.rail-links,.footer-note,.footer-bottom,.eyebrow,.section-label,.version')) variant = 'labelSmall';
    else if (
        element.closest(
            '.tree-link[aria-current],.tree-group[aria-expanded="true"],.component-tabs [aria-current],.toc [aria-current],.toc>p'
        )
    )
        variant = element.closest('.component-tabs') && compact ? 'labelMediumEmphasized' : 'labelLargeEmphasized';
    else if (element.closest('.component-tabs')) variant = compact ? 'labelMedium' : 'labelLarge';
    else if (element.closest('.tree-link,.tree-group,.toc')) variant = 'bodyMedium';
    else if (
        element.closest(
            '.sidebar-reference,.breadcrumbs,.variant-tag,.pill,.required,.default-value,.native-proof-header,.native-picture figcaption,.search-footer,.code-header'
        )
    )
        variant = 'labelLarge';
    else if (element.closest('.sidebar-brand,.mobile-header>a,.footer-brand')) variant = 'titleLarge';
    else if (element.closest('.intro,.home-hero>p,.section-intro>p')) variant = compact ? 'bodyLarge' : 'titleLarge';
    else if (element.closest('.detail-heading h1')) variant = compact ? 'displayMediumEmphasized' : 'displayLargeEmphasized';
    else if (element.closest('h1')) variant = compact ? 'displayMedium' : 'displayLarge';
    else if (element.closest('.component-section .doc-section h2'))
        variant = compact ? 'headlineSmallEmphasized' : 'displaySmallEmphasized';
    else if (element.closest('.component-section .doc-section h3')) variant = 'titleLargeEmphasized';
    else if (element.closest('h2')) variant = 'headlineMedium';
    else if (element.closest('h3')) variant = 'titleLarge';
    else if (element.closest('h4')) variant = 'titleMedium';
    else if (element.closest('h5,h6')) variant = 'titleSmall';
    else if (element.closest('.verification-stat b,.mosaic-word')) variant = 'displayLarge';
    else if (element.closest('small,.responsive-note,.demo-caption,.native-label,.sidebar-caption')) variant = 'bodySmall';
    else if (element.closest('td,th,.search-result,.site-footer')) variant = 'bodyMedium';
    else if (element.closest('button,label,.text-link,.hero-cta,.large-text-link')) variant = 'labelLarge';
    else variant = 'bodyLarge';
    if (element.closest('strong,b,th') && !variant.endsWith('Emphasized')) variant = (variant + 'Emphasized') as TextVariant;
    return variant;
}

function PageTextRun({ run }: { run: Run }) {
    const theme = useMobileTheme();
    const font = theme.fonts[run.variant as keyof typeof theme.fonts] as { fontSize: number; lineHeight: number; letterSpacing: number };
    useLayoutEffect(() => {
        // The semantic container supplies the line box, Text supplies the actual ink.
        // Matching both prevents the old CSS size from leaving an oversized strut.
        run.owner.dataset.docsTypeRoot = '';
        run.owner.style.setProperty('--docs-type-size', font.fontSize + 'px');
        run.owner.style.setProperty('--docs-type-line', font.lineHeight + 'px');
        run.owner.style.setProperty('--docs-type-tracking', font.letterSpacing + 'px');
        run.source.remove();
        run.host.dataset.docsTextMounted = 'true';
        return () => {
            delete run.host.dataset.docsTextMounted;
        };
    }, [run, font.fontSize, font.lineHeight, font.letterSpacing]);
    return (
        <Text
            variant={run.variant}
            selectable
            style={{ color: 'inherit', textAlign: run.align, writingDirection: run.direction, fontStyle: run.italic ? 'italic' : 'normal' }}
            {...{ dataSet: { docsTextRun: run.variant } }}
        >
            {run.content}
        </Text>
    );
}

/** Keep semantic HTML and link/form behavior while all readable runs use Text.
 * Source nodes are retained until the provider has loaded its fonts and commits
 * the real Text. Code, icon glyphs and native field values keep their own renderers.
 */
export function createDocsTypography(onChange: () => void) {
    const runs = new Map<HTMLSpanElement, Run>();
    let sequence = 0,
        frame = 0;
    const compact = matchMedia('(max-width:620px)');
    const scan = () => {
        let changed = false;
        for (const [host, run] of runs) {
            if (!host.isConnected) {
                runs.delete(host);
                changed = true;
                continue;
            }
            const variant = variantFor(run.owner, compact.matches);
            if (variant !== run.variant) {
                run.variant = variant;
                host.dataset.textVariant = variant;
                changed = true;
            }
        }
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                return node.textContent?.trim() && node.parentElement && !isProtected(node.parentElement)
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
            },
        });
        const sources: globalThis.Text[] = [];
        while (walker.nextNode()) sources.push(walker.currentNode as globalThis.Text);
        for (const source of sources) {
            const owner = source.parentElement!;
            const host = document.createElement('span');
            host.dataset.docsTextHost = '';
            const variant = variantFor(owner, compact.matches);
            host.dataset.textVariant = variant;
            source.before(host);
            host.append(source);
            const computed = getComputedStyle(owner);
            runs.set(host, {
                key: ++sequence,
                host,
                source,
                content: source.data,
                owner,
                variant,
                italic: Boolean(owner.closest('em,i')),
                align: computed.textAlign as TextStyle['textAlign'],
                direction: computed.direction === 'rtl' ? 'rtl' : 'ltr',
            });
            changed = true;
        }
        return changed;
    };
    const schedule = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            if (scan()) onChange();
        });
    };
    const observer = new MutationObserver((records) => {
        if (
            records.some((record) => {
                const element = record.target instanceof Element ? record.target : record.target.parentElement;
                return element && !isProtected(element);
            })
        )
            schedule();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributeFilter: ['aria-current', 'aria-expanded'],
    });
    compact.addEventListener('change', () => {
        for (const run of runs.values()) {
            run.variant = variantFor(run.owner, compact.matches);
            run.host.dataset.textVariant = run.variant;
            run.align = getComputedStyle(run.owner).textAlign as TextStyle['textAlign'];
        }
        onChange();
    });
    return {
        scan,
        clear(container: Element) {
            for (const [host] of runs) if (container === host || container.contains(host)) runs.delete(host);
        },
        render() {
            return (
                <Text style={{ display: 'contents' }} {...{ dataSet: { docsTextAncestor: 'true' } }}>
                    {[...runs.values()].map((run) => createPortal(<PageTextRun run={run} />, run.host, run.key))}
                </Text>
            );
        },
    };
}
