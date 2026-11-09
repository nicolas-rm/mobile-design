import { SelectField } from './select-field';
import { useState } from 'react';
import { GalleryProvider as MobileDesignProvider } from './gallery-provider';
import { Prose, RuntimeTextRoot } from './prose';
import { RuntimeBridge, useRuntimeEnvironment } from './environment';
import { ComponentWindow } from './component-window';
import { appBarScenes, appBarVariants, initialAppBar, type AppBarConfiguration, type AppBarSceneId } from './app-bars-data';

export function AppBarsRuntime() {
    const environment = useRuntimeEnvironment(),
        [bar, setBar] = useState(initialAppBar),
        [width, setWidth] = useState(0),
        [scenario, setScenario] = useState<AppBarSceneId>('podcasts');
    const [behavior, setBehavior] = useState<'pinned' | 'exit-until-collapsed' | 'enter-always'>('exit-until-collapsed'),
        [snap, setSnap] = useState(true);
    const change = <K extends keyof AppBarConfiguration>(key: K, value: AppBarConfiguration[K]) =>
        setBar((current) => ({
            ...current,
            [key]: value,
            ...(key === 'actionStyle' && value !== 'standard' ? { actions: 1 } : {}),
            ...(key === 'variant' && value === 'search'
                ? {
                      navigation: 'menu' as const,
                      title: current.title === 'Headline' ? 'Search product' : current.title,
                      ...(current.inside ? { actions: Math.min(1, current.actions) } : {}),
                  }
                : {}),
            ...(key === 'inside' && value === true && current.variant === 'search' ? { actions: Math.min(1, current.actions) } : {}),
            ...(key === 'image' && value === true ? { title: 'The Fortnightly' } : {}),
        }));
    const selected = appBarScenes.find((scene) => scene.id === scenario)!;
    const code = `<MobileDesignProvider motion="${bar.motion}" direction="${bar.direction}">\n  <TopAppBar\n    variant="${bar.variant === 'search' ? 'small' : bar.variant}"\n    title=${JSON.stringify(bar.title)}${bar.subtitle ? '\n    subtitle="Subtitle"' : ''}\n    textAlign="${bar.align}"${bar.variant === 'search' ? '\n    search={<SearchView {...searchState} /> }' : ''}${bar.image ? '\n    image={<Image source={wordmark} style={{ width: 165, height: 27 }} /> }' : ''}${bar.navigation === 'none' ? '' : bar.navigation === 'logo' ? '\n    leading={<ProductLogo />}' : `\n    navigationIcon="${bar.navigation === 'menu' ? 'menu' : 'arrow_back'}"\n    navigationLabel="${bar.navigation === 'menu' ? 'Abrir navegación' : 'Volver'}"\n    onNavigationPress={${bar.navigation === 'menu' ? 'openNavigation' : 'goBack'}}`}\n    scrolled={${bar.scrolled}}\n    actions={[${Array.from({ length: bar.actions }, (_, i) => `\n      { key: '${i === 0 ? 'search' : 'calendar'}', icon: '${bar.actionStyle === 'standard' ? (i === 0 ? 'search' : 'today_fill1') : 'send_fill1'}',\n        label: '${bar.actionStyle === 'standard' ? (i === 0 ? 'Buscar' : 'Elegir fecha') : 'Enviar'}', onPress: ${bar.actionStyle === 'standard' ? (i === 0 ? 'openSearch' : 'openCalendar') : 'send'},${bar.actionStyle !== 'standard' ? ` mode: '${bar.actionStyle}',` : ''}${bar.wide ? " widthVariant: 'wide'," : ''}${bar.disabled ? ' disabled: true,' : ''} },`).join('')}\n    ]}\n  />\n</MobileDesignProvider>`;
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            direction={bar.direction}
            motion={bar.motion}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <RuntimeTextRoot>
                <main aria-label="Ejemplo interactivo de App bars">
                    <Prose as="div" className="playground-controls">
                        <SelectField
                            label="Variante"
                            id="appbar-variant"
                            value={bar.variant}
                            onValueChange={(nextValue) => change('variant', nextValue as AppBarConfiguration['variant'])}
                            options={appBarVariants.map((v) => ({ value: v, label: v === 'search' ? 'Search app bar' : v }))}
                        />
                        <Prose as="label">
                            {bar.variant === 'search' ? 'Placeholder' : 'Título'}
                            <input id="appbar-title" value={bar.title} onChange={(e) => change('title', e.target.value)} maxLength={100} />
                        </Prose>
                        <SelectField
                            label="Alineación"
                            id="appbar-align"
                            value={bar.align}
                            onValueChange={(nextValue) => change('align', nextValue as AppBarConfiguration['align'])}
                            options={[
                                { value: 'start', label: 'Inicio' },
                                { value: 'center', label: 'Centro' },
                            ]}
                        />
                        <SelectField
                            label="Navegación"
                            id="appbar-navigation"
                            value={bar.navigation}
                            onValueChange={(nextValue) => change('navigation', nextValue as AppBarConfiguration['navigation'])}
                            options={[
                                { value: 'back', label: 'Atrás' },
                                { value: 'menu', label: 'Menú de navegación' },
                                { value: 'logo', label: 'Marca del producto' },
                                { value: 'none', label: 'Sin elemento inicial' },
                            ]}
                        />
                        <SelectField
                            label="Acciones"
                            id="appbar-actions"
                            value={bar.actions}
                            onValueChange={(nextValue) => change('actions', Number(nextValue))}
                            options={[0, 1, 2]
                                .filter((n) => (bar.actionStyle === 'standard' && !(bar.variant === 'search' && bar.inside)) || n <= 1)
                                .map((n) => ({ value: n, label: n }))}
                        />
                        <SelectField
                            label="Acción destacada"
                            id="appbar-action-style"
                            value={bar.actionStyle}
                            onValueChange={(nextValue) => change('actionStyle', nextValue as AppBarConfiguration['actionStyle'])}
                            options={[
                                { value: 'standard', label: 'Standard' },
                                { value: 'contained', label: 'Filled' },
                                { value: 'contained-tonal', label: 'Tonal' },
                            ]}
                        />
                        <SelectField
                            label="Ancho de ventana"
                            id="appbar-width"
                            value={width}
                            onValueChange={(nextValue) => setWidth(Number(nextValue))}
                            options={[
                                { value: '0', label: 'Disponible' },
                                ...[320, 390, 600, 960].map((n) => ({ value: n, label: String(n) + String(' dp') })),
                            ]}
                        />
                        <SelectField
                            label="Área superior"
                            id="appbar-inset"
                            value={bar.inset}
                            onValueChange={(nextValue) => change('inset', Number(nextValue))}
                            options={[
                                { value: '0', label: 'Sin inset' },
                                { value: '24', label: '24 dp' },
                            ]}
                        />
                        <SelectField
                            label="Dirección"
                            id="appbar-direction"
                            value={bar.direction}
                            onValueChange={(nextValue) => change('direction', nextValue as AppBarConfiguration['direction'])}
                            options={[
                                { value: 'ltr', label: 'Izquierda a derecha' },
                                { value: 'rtl', label: 'Derecha a izquierda' },
                            ]}
                        />
                        <SelectField
                            label="Movimiento"
                            id="appbar-motion"
                            value={bar.motion}
                            onValueChange={(nextValue) => change('motion', nextValue as AppBarConfiguration['motion'])}
                            options={[
                                { value: 'expressive', label: 'Expressive' },
                                { value: 'standard', label: 'Standard' },
                            ]}
                        />
                        <Prose as="div" className="state-options">
                            {(['subtitle', 'image', 'scrolled', 'wide', 'inside', 'disabled'] as const).map((key, i) => (
                                <Prose as="label" key={key}>
                                    <input
                                        type="checkbox"
                                        id={'appbar-' + key}
                                        checked={bar[key]}
                                        disabled={bar.variant === 'search' && (key === 'image' || key === 'subtitle')}
                                        onChange={(e) => change(key, e.target.checked)}
                                    />
                                    {
                                        [
                                            'Subtítulo',
                                            'Imagen de marca',
                                            'On scroll',
                                            'Acción Wide',
                                            'Micrófono dentro de Search',
                                            'Acciones deshabilitadas',
                                        ][i]
                                    }
                                </Prose>
                            ))}
                        </Prose>
                    </Prose>
                    <ComponentWindow
                        component="app-bars-window"
                        title="Ventana interactiva de App bar"
                        testID="appbar-preview"
                        onBack={() => {
                            document.getElementById('appbar-variant')?.focus({ preventScroll: true });
                            document.getElementById('appbar-variant')?.scrollIntoView({ block: 'center' });
                        }}
                        height={360}
                        width={width}
                        configuration={{ scene: 'playground', bar }}
                    />
                    <Prose as="p" className="preview-guidance">
                        Las acciones abren navegación, búsqueda, fecha o la tarea correspondiente dentro de esta ventana. Small conserva una
                        línea; las flexibles admiten dos.
                    </Prose>
                    <section className="example-code">
                        <Prose as="h2">Código de la configuración</Prose>
                        <pre tabIndex={0}>
                            <code>{code}</code>
                        </pre>
                    </section>
                    <section className="sizes-section">
                        <Prose as="h2">Las cuatro variantes actuales</Prose>
                        <Prose as="div" className="appbar-variant-grid">
                            {appBarVariants.map((variant, i) => (
                                <article key={variant} className="component-use">
                                    <Prose as="h3">
                                        {
                                            [
                                                'Search app bar · 64 dp',
                                                'Small · 64 dp',
                                                'Medium flexible · 112 dp',
                                                'Large flexible · 120 dp',
                                            ][i]
                                        }
                                    </Prose>
                                    <ComponentWindow
                                        component="app-bars-window"
                                        title={'Muestra ' + variant}
                                        testID={'appbar-specimen-' + variant}
                                        height={220}
                                        configuration={{
                                            scene: 'playground',
                                            bar: {
                                                ...initialAppBar,
                                                variant,
                                                title: ['Search product', 'Title Large', 'Headline Medium', 'Display Small'][i],
                                                navigation: variant === 'search' ? 'menu' : 'back',
                                                actions: variant === 'search' ? 0 : 2,
                                            },
                                        }}
                                    />
                                </article>
                            ))}
                        </Prose>
                    </section>
                    <section className="usage-section">
                        <Prose as="h2">Ejemplos en acción</Prose>
                        <Prose as="p">
                            La composición reproduce los elementos del ejemplo; la consulta, el guardado, los detalles y las descargas
                            ofrecen una continuación local funcional.
                        </Prose>
                        <Prose as="div" className="playground-controls">
                            <SelectField
                                label="Pantalla"
                                id="appbar-scenario"
                                value={scenario}
                                onValueChange={(nextValue) => {
                                    const next = nextValue as AppBarSceneId;
                                    setScenario(next);
                                    setBehavior(appBarScenes.find((scene) => scene.id === next)?.scroll ?? 'exit-until-collapsed');
                                }}
                                options={appBarScenes.map((scene) => ({ value: scene.id, label: scene.title }))}
                            />
                            <SelectField
                                label="Comportamiento de scroll"
                                id="appbar-behavior"
                                value={behavior}
                                onValueChange={(nextValue) => setBehavior(nextValue as typeof behavior)}
                                options={[
                                    { value: 'exit-until-collapsed', label: 'Exit until collapsed' },
                                    { value: 'pinned', label: 'Pinned' },
                                    { value: 'enter-always', label: 'Enter always' },
                                ]}
                            />
                            <Prose as="label">
                                <input id="appbar-snap" type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} />
                                Ajustar al terminar el gesto
                            </Prose>
                        </Prose>
                        <Prose as="p" id="appbar-scenario-description">
                            {selected.description}
                        </Prose>
                        <ComponentWindow
                            component="app-bars-window"
                            title={'Ejemplo ' + selected.title}
                            testID="appbar-usage"
                            onBack={() => {
                                document.getElementById('appbar-scenario')?.focus({ preventScroll: true });
                                document.getElementById('appbar-scenario')?.scrollIntoView({ block: 'center' });
                            }}
                            height={600}
                            width={width}
                            configuration={{ scene: scenario, bar, behavior, snap }}
                        />
                        <ul className="example-index">
                            {appBarScenes.map((scene) => (
                                <Prose as="li" key={scene.id}>
                                    <Prose as="strong">{scene.title}</Prose> · {scene.description}
                                </Prose>
                            ))}
                        </ul>
                    </section>
                </main>
                <RuntimeBridge />
            </RuntimeTextRoot>
        </MobileDesignProvider>
    );
}
