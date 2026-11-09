import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal, flushSync } from 'react-dom';
import {
    Badge,
    Button,
    ButtonGroup,
    Card,
    IconButton,
    ListItem,
    LoadingIndicator,
    NavigationDrawer,
    NavigationDrawerItem,
    NavigationRail,
    ProgressIndicator,
    Snackbar,
    SplitButton,
    Tooltip,
    TopAppBar,
    Text,
    TextField,
    useMobileTheme,
    type IconButtonProps,
} from 'mobile-design/react-native-web';
import { MaterialSymbol } from '@mobile-design/icons/react-native-web';
import { GalleryProvider as MobileDesignProvider } from './gallery-provider';
import { type ButtonVariant, type ButtonSize } from '@mobile-design/tokens';
import { Autocomplete, Select, type ChoiceOption } from 'mobile-design/react-native-web';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { createDocsTypography } from './docs-typography';
import { CatalogCardPreview, hasCatalogCardPreview } from './catalog-card-previews';

type Configuration = {
    theme: 'light' | 'dark';
    reduced: boolean;
    onAction: (host: HTMLElement, action?: string) => void | Promise<void>;
    searchOptions: (query: string) => ChoiceOption[];
};
export type DocsControls = {
    configure: (config: Configuration) => void;
    mount: () => void;
    clear: (container: Element) => void;
    notify: (message: string) => void;
};
declare global {
    interface Window {
        mobileDesignDocsControls?: DocsControls;
    }
}

type Notice = { id: number; message: string };
const browserInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const noop = () => {};

function DocsRail({ host }: { host: HTMLElement }) {
    const { items, value, logo, floating, expandedDestination } = host.dataset;
    const entries = JSON.parse(items ?? '[]') as [string, string, string][];
    useLayoutEffect(() => {
        for (const link of host.querySelectorAll<HTMLElement>('a[data-testid^="docs-rail-"]')) {
            const key = link.dataset.testid!.slice('docs-rail-'.length);
            link.dataset.rail = key;
            if (floating === 'true' && key !== 'home') {
                link.setAttribute('aria-controls', 'sidebar');
                link.setAttribute('aria-expanded', String(key === expandedDestination));
            } else {
                link.removeAttribute('aria-controls');
                link.removeAttribute('aria-expanded');
            }
        }
    });
    return (
        <SafeAreaInsetsContext.Provider value={browserInsets}>
            <NavigationRail
                value={value ?? 'home'}
                onValueChange={noop}
                collapsedWidth={88}
                style={{ flex: 1, paddingTop: 0, backgroundColor: 'transparent' }}
                testID="docs-navigation-rail"
                items={entries.map<React.ComponentProps<typeof NavigationRail>['items'][number]>(([key, icon, label]) => {
                    const logoIcon = () => <img className="brand-logo" src={logo} alt="" />;
                    return {
                        key,
                        label,
                        href: '#/' + key,
                        testID: 'docs-rail-' + key,
                        icon: key === 'home' ? logoIcon : icon,
                        selectedIcon:
                            key === 'home'
                                ? logoIcon
                                : (props: Omit<React.ComponentProps<typeof MaterialSymbol>, 'name'>) => (
                                      <MaterialSymbol {...props} name={icon} filled />
                                  ),
                    };
                })}
            />
        </SafeAreaInsetsContext.Provider>
    );
}

function DocsDrawer({ host }: { host: HTMLElement }) {
    const slot = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        // Keep the existing route-owned tree and its portal hosts mounted while the drawer provides its surface.
        const content = host.querySelector('[data-drawer-content]');
        if (!content || !slot.current) return;
        slot.current.append(content);
        return () => {
            host.append(content);
        };
    }, [host]);
    return (
        <NavigationDrawer
            items={[]}
            value=""
            onValueChange={noop}
            style={{ width: '100%', flex: 1, minHeight: 0, backgroundColor: 'var(--doc-pane)' }}
            testID="docs-navigation-drawer"
        >
            <div className="docs-drawer-slot" ref={slot} />
        </NavigationDrawer>
    );
}

function DocsDrawerItem({ host }: { host: HTMLElement }) {
    const { href, label, icon, logo } = host.dataset;
    const nested = Boolean(host.closest('.tree-children'));
    return (
        <NavigationDrawerItem
            href={href}
            selected={host.hasAttribute('aria-current')}
            onPress={noop}
            item={{ key: href ?? '', label: label ?? '', icon: logo ? () => <img className="brand-logo" src={logo} alt="" /> : icon }}
            style={{ minHeight: nested ? 44 : 48 }}
            contentStyle={{ minHeight: nested ? 44 : 48, paddingVertical: 0, paddingLeft: nested ? 28 : 16 }}
            testID="docs-drawer-item"
        />
    );
}

function CopyFeedback({ notice, visible, onDismiss }: { notice: Notice; visible: boolean; onDismiss: () => void }) {
    const content = useMemo(() => <>{notice.message}</>, [notice]);
    return (
        <>
            <div className="skip-status" role="status" aria-live="polite" aria-atomic="true">
                <span key={notice.id}>{notice.message}</span>
            </div>
            <div className="docs-snackbar" aria-hidden="true">
                <SafeAreaInsetsContext.Provider value={browserInsets}>
                    <Snackbar visible={visible} onDismiss={onDismiss} inlineFeedback testID="docs-snackbar">
                        {content}
                    </Snackbar>
                </SafeAreaInsetsContext.Provider>
            </div>
        </>
    );
}

function SearchControl({ host, onAction, searchOptions }: { host: HTMLElement } & Pick<Configuration, 'onAction' | 'searchOptions'>) {
    const [query, setQuery] = useState('');
    useLayoutEffect(() => {
        const reset = () => setQuery('');
        host.addEventListener('mobile-design:search-open', reset);
        return () => host.removeEventListener('mobile-design:search-open', reset);
    }, [host]);
    const options = searchOptions(query);
    const close = () => {
        void onAction(host, 'close-search');
    };
    return (
        <div className="docs-search-control">
            <Autocomplete
                id="global-search"
                listId="search-results"
                label="Buscar documentación"
                placeholder="Guías, componentes y propiedades"
                leadingIcon="search"
                value={query}
                onValueChange={setQuery}
                options={options}
                filter={false}
                presentation="inline"
                onEscape={close}
                onSelect={(option) => {
                    host.dataset.href = option.href;
                    void onAction(host, 'search-result');
                }}
            />
            <div className="docs-search-close">
                <IconButton icon="close" accessibilityLabel="Cerrar búsqueda" onPress={close} testID="docs-icon-close-search" />
            </div>
            <div className="search-summary" role="status">
                <Badge variant="large" testID="docs-search-count">
                    {options.length}
                </Badge>
                <Text variant="labelMedium">{options.length === 1 ? 'resultado' : 'resultados'}</Text>
            </div>
        </div>
    );
}

function FilterControl({ host, onAction }: { host: HTMLElement; onAction: Configuration['onAction'] }) {
    const [value, setValue] = useState(host.dataset.value ?? '');
    const label = host.dataset.label ?? '';
    return (
        <TextField
            nativeID={host.dataset.inputId}
            label={label}
            accessibilityLabel={label}
            variant="outlined"
            leadingIcon="search"
            value={value}
            inputMode="search"
            onChangeText={(next) => {
                setValue(next);
                host.dataset.value = next;
                void onAction(host);
            }}
        />
    );
}

function NavigationButton({ host, onAction }: { host: HTMLElement; onAction: Configuration['onAction'] }) {
    const fullWidth = host.dataset.fullWidth === 'true';
    const trailing = host.dataset.iconPosition === 'trailing';
    return (
        <Button
            href={host.dataset.href}
            hrefAttrs={{ target: host.dataset.target, rel: host.dataset.rel, download: host.dataset.download }}
            variant={host.dataset.variant as ButtonVariant}
            size={host.dataset.size as ButtonSize}
            icon={host.dataset.icon || undefined}
            style={{ width: fullWidth ? '100%' : undefined, maxWidth: '100%', flexShrink: 1 }}
            contentStyle={fullWidth ? { justifyContent: 'flex-start' } : trailing ? { flexDirection: 'row-reverse' } : undefined}
            onPress={
                host.dataset.scrollTo
                    ? (event) => {
                          const mouse = event.nativeEvent as unknown as MouseEvent;
                          if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey) return;
                          event.preventDefault();
                          void onAction(host, 'scroll-to');
                      }
                    : undefined
            }
            testID="docs-navigation-button"
        >
            {host.dataset.label}
        </Button>
    );
}

function CatalogIndicatorPreview({ component }: { component: 'loading-indicator' | 'progress-indicators' }) {
    const preview = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const node = preview.current;
        if (!node) return;
        const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
        observer.observe(node);
        return () => observer.disconnect();
    }, []);
    return (
        <div className="card-preview" aria-hidden="true" inert ref={preview}>
            {component === 'loading-indicator' ? (
                <LoadingIndicator variant="contained" size={64} animating={inView} testID="catalog-loading-indicator" />
            ) : (
                <div className="catalog-progress-preview">
                    <ProgressIndicator
                        variant="circular"
                        appearance="wavy"
                        size={56}
                        progress={0.45}
                        paused={!inView}
                        testID="catalog-progress-circular"
                    />
                    <ProgressIndicator
                        variant="linear"
                        appearance="wavy"
                        progress={0.45}
                        paused={!inView}
                        testID="catalog-progress-linear"
                    />
                </div>
            )}
        </div>
    );
}

function CatalogPreview({ component, markup }: { component: string; markup?: string }) {
    if (component === 'loading-indicator' || component === 'progress-indicators') return <CatalogIndicatorPreview component={component} />;
    return <div className="card-preview" aria-hidden="true" inert dangerouslySetInnerHTML={{ __html: markup ?? '' }} />;
}

const previewQualities: readonly ChoiceOption[] = [
    { value: 'standard', label: 'Estándar' },
    { value: 'high', label: 'Alta calidad' },
];
const previewCities: readonly ChoiceOption[] = [{ value: 'merida', label: 'Mérida', description: 'Yucatán', icon: 'location_on' }];

function CatalogChoicePreview({ component }: { component: 'select' | 'autocomplete' }) {
    const [city] = previewCities;
    return (
        <div className="catalog-component-preview" aria-hidden="true" inert>
            <div className="catalog-choice-sample">
                {component === 'select' ? (
                    <Select
                        id="catalog-select-example"
                        label="Calidad de audio"
                        value="standard"
                        options={previewQualities}
                        onValueChange={() => {}}
                    />
                ) : (
                    <>
                        <Autocomplete
                            id="catalog-autocomplete-example"
                            label="Ciudad"
                            value="Mér"
                            options={previewCities}
                            leadingIcon="search"
                            onValueChange={() => {}}
                        />
                        <div className="catalog-choice-suggestion">
                            <ListItem
                                variant="baseline"
                                title={city.label}
                                description={city.description}
                                leading={({ color }) => <MaterialSymbol name="location_on" size={20} color={color} />}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function Action({ host, onAction, searchOptions }: { host: HTMLElement } & Pick<Configuration, 'onAction' | 'searchOptions'>) {
    const theme = useMobileTheme();
    const [busy, setBusy] = useState(false),
        pending = useRef(false),
        alive = useRef(true);
    useLayoutEffect(() => {
        host.dataset.mobileDesignMounted = 'true';
        host.removeAttribute('aria-busy');
        return () => {
            delete host.dataset.mobileDesignMounted;
        };
    }, [host]);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    const activate = async () => {
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        try {
            await onAction(host);
        } finally {
            pending.current = false;
            if (alive.current) setBusy(false);
        }
    };
    const label = host.dataset.accessibilityLabel ?? host.dataset.label ?? '';
    if (host.dataset.kind === 'rail') return <DocsRail host={host} />;
    if (host.dataset.kind === 'drawer') return <DocsDrawer host={host} />;
    if (host.dataset.kind === 'drawer-item') return <DocsDrawerItem host={host} />;
    if (host.dataset.kind === 'navigation-button') return <NavigationButton host={host} onAction={onAction} />;
    if (host.dataset.kind === 'disclosure')
        return (
            <Button
                variant="text"
                size="small"
                accessibilityState={{ expanded: host.dataset.expanded === 'true' }}
                aria-controls={'tree-' + host.dataset.treeGroup}
                textColor={theme.colors.onSurfaceVariant}
                icon={() => <span className="tree-caret" aria-hidden="true" />}
                style={{ width: '100%' }}
                contentStyle={{ flexDirection: 'row-reverse', justifyContent: 'space-between', minHeight: 48 }}
                onPress={activate}
                testID="docs-tree-group"
            >
                {label}
            </Button>
        );
    if (host.dataset.kind === 'swatch')
        return (
            <Button
                variant="filled"
                size="medium"
                shape="square"
                buttonColor={host.dataset.buttonColor}
                textColor={host.dataset.textColor}
                accessibilityLabel={label}
                icon="content_copy"
                style={{ width: '100%' }}
                contentStyle={{ justifyContent: 'flex-start', minHeight: 96 }}
                labelStyle={{ textAlign: 'left' }}
                onPress={activate}
                testID="docs-copy-color"
            >
                {host.dataset.label + '\n' + host.dataset.color}
            </Button>
        );
    if (host.dataset.kind === 'search') return <SearchControl host={host} onAction={onAction} searchOptions={searchOptions} />;
    if (host.dataset.kind === 'filter-field') return <FilterControl host={host} onAction={onAction} />;
    if (host.dataset.kind === 'search-trigger')
        return (
            <>
                <Button
                    icon="search"
                    variant="tonal"
                    size="small"
                    accessibilityLabel="Buscar documentación"
                    onPress={activate}
                    style={{ width: '100%' }}
                    contentStyle={{ justifyContent: 'flex-start' }}
                    testID="docs-sidebar-search"
                >
                    Buscar
                </Button>
                <kbd aria-hidden="true">⌘ K</kbd>
            </>
        );
    if (host.dataset.kind === 'appbar')
        return (
            <TopAppBar
                title={<Text variant="titleLarge">Mobile Design</Text>}
                statusBarHeight={0}
                leading={
                    <IconButton
                        icon="menu"
                        accessibilityLabel="Abrir navegación"
                        accessibilityState={{ expanded: host.dataset.expanded === 'true' }}
                        onPress={() => {
                            void onAction(host, 'sidebar');
                        }}
                        testID="docs-icon-sidebar"
                    />
                }
                actions={[
                    {
                        key: 'search',
                        icon: 'search',
                        label: 'Buscar',
                        onPress: () => {
                            void onAction(host, 'search');
                        },
                        testID: 'docs-icon-search',
                    },
                ]}
                testID="docs-mobile-appbar"
            />
        );
    if (host.dataset.kind === 'badge')
        return (
            <Badge variant="large" testID="docs-search-count">
                {Number(host.dataset.count ?? 0)}
            </Badge>
        );

    if (host.dataset.kind === 'button-group')
        return (
            <ButtonGroup
                variant="connected"
                size="small"
                value={host.dataset.value ?? 'all'}
                accessibilityLabel={label}
                showSelectedIcon
                onValueChange={(value) => {
                    if (typeof value !== 'string') return;
                    host.dataset.value = value;
                    host.dataset.filter = value;
                    void onAction(host);
                }}
                items={JSON.parse(host.dataset.items ?? '[]')}
                testID="docs-catalog-categories"
            />
        );
    if (host.dataset.kind === 'card') {
        const { component, href, rel, markup, previewMarkup, previewUrl, accessibilityLabel } = host.dataset;
        const pager = rel === 'prev' || rel === 'next';
        const choice = component === 'select' || component === 'autocomplete';
        const featured = component !== undefined && hasCatalogCardPreview(component);
        return (
            <>
                <Card
                    variant="filled"
                    elevation={pager ? 0 : undefined}
                    href={href}
                    hrefAttrs={{ rel }}
                    accessibilityLabel={accessibilityLabel}
                    testID={'docs-card-' + (component ?? (pager ? 'pager' : 'editorial'))}
                    style={pager ? { width: '100%', backgroundColor: 'transparent' } : { width: '100%' }}
                >
                    {component && <CatalogPreview component={component} markup={choice || featured ? undefined : previewMarkup} />}
                    <div className={component ? undefined : 'docs-card-content'} dangerouslySetInnerHTML={{ __html: markup ?? '' }} />
                </Card>
                {choice && <CatalogChoicePreview component={component} />}
                {featured && <CatalogCardPreview component={component} previewUrl={previewUrl} />}
            </>
        );
    }
    if (host.dataset.kind === 'split')
        return (
            <SplitButton
                label="Copiar"
                icon="content_copy"
                variant="tonal"
                size="small"
                primaryAccessibilityLabel="Copiar código"
                menuAccessibilityLabel="Más acciones del ejemplo"
                onPress={() => {
                    void activate();
                }}
                actions={[
                    {
                        key: 'download',
                        label: 'Descargar ejemplo',
                        icon: 'download',
                        onPress: () => {
                            void onAction(host, 'download-example');
                        },
                    },
                    {
                        key: 'link',
                        label: 'Copiar enlace al ejemplo',
                        icon: 'link',
                        onPress: () => {
                            void onAction(host, 'copy-example-link');
                        },
                    },
                ]}
                testID="docs-code-actions"
            />
        );
    if (host.dataset.kind === 'icon') {
        const control = (
            <IconButton
                icon={(p) => <MaterialSymbol {...p} name={host.dataset.icon ?? 'more_vert'} filled />}
                sizeClass={(host.dataset.size ?? 'small') as ButtonSize}
                shape={host.dataset.shape === 'square' ? 'square' : 'round'}
                mode={host.dataset.mode as IconButtonProps['mode']}
                selected={
                    host.dataset.action === 'motion' || host.dataset.appearance === 'theme' ? host.dataset.selected === 'true' : undefined
                }
                accessibilityLabel={label}
                accessibilityState={{ busy, ...(host.dataset.expanded ? { expanded: host.dataset.expanded === 'true' } : {}) }}
                onPress={activate}
                testID={'docs-icon-' + host.dataset.action}
            />
        );
        // The page's native HTML dialog owns the top layer; its close action keeps
        // a browser hint until the Search family replaces that dialog composition.
        return host.closest('dialog') ? control : <Tooltip title={label}>{control}</Tooltip>;
    }
    return (
        <Button
            variant={(host.dataset.variant ?? 'text') as ButtonVariant}
            size="small"
            icon={host.dataset.icon || undefined}
            accessibilityLabel={host.dataset.accessibilityLabel ?? host.dataset.label}
            selected={host.dataset.action === 'motion' ? host.dataset.selected === 'true' : undefined}
            accessibilityState={{ busy }}
            onPress={activate}
            testID={'docs-' + host.dataset.action}
        >
            {host.dataset.label}
        </Button>
    );
}

/** One provider for page controls; portals keep each Button in the article layout. */
export function installDocsControls() {
    const rootNode = document.createElement('div');
    rootNode.id = 'mobile-design-controls-root';
    Object.assign(rootNode.style, {
        position: 'fixed',
        inset: '0',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none',
        zIndex: '600',
    });
    document.body.append(rootNode);
    const root = createRoot(rootNode),
        targets = new Map<HTMLElement, number>();
    let sequence = 0;
    const typography = createDocsTypography(() => draw());
    let configuration: Configuration = { theme: 'light', reduced: false, onAction: () => {}, searchOptions: () => [] };
    let notice: Notice = { id: 0, message: '' };
    let notificationVisible = false;
    const dismissNotification = () => {
        notificationVisible = false;
        draw();
    };
    const draw = () =>
        flushSync(() =>
            root.render(
                <MobileDesignProvider colorScheme={configuration.theme} reduceMotion={configuration.reduced ? 'on' : 'auto'}>
                    {[...targets].map(([host, key]) =>
                        createPortal(
                            <Action host={host} onAction={configuration.onAction} searchOptions={configuration.searchOptions} />,
                            host,
                            key
                        )
                    )}
                    <CopyFeedback notice={notice} visible={notificationVisible} onDismiss={dismissNotification} />
                    {typography.render()}
                </MobileDesignProvider>
            )
        );
    window.mobileDesignDocsControls = {
        configure(next) {
            configuration = next;
            draw();
        },
        mount() {
            for (const host of targets.keys()) if (!host.isConnected) targets.delete(host);
            for (const host of document.querySelectorAll<HTMLElement>('[data-mobile-design-host]'))
                if (!targets.has(host)) targets.set(host, ++sequence);
            typography.scan();
            draw();
        },
        clear(container) {
            typography.clear(container);
            for (const host of targets.keys()) if (container === host || container.contains(host)) targets.delete(host);
            draw();
        },
        notify(message) {
            notice = { id: notice.id + 1, message };
            notificationVisible = true;
            draw();
        },
    };
    document.dispatchEvent(new Event('mobile-design:controls-ready'));
}
