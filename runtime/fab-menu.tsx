import { SelectField } from './select-field';
import { Prose, RuntimeTextRoot } from './prose';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import {
    FAB,
    Icon,
    MobileDesignProvider,
    Text,
    type FABMenuItemProps,
    type FABMenuProps,
    type FABSize,
    type FABVariant,
} from 'mobile-design';
import { RuntimeBridge, useRuntimeEnvironment } from './environment';
const previewInsets = { top: 0, right: 0, bottom: 0, left: 0 };

const createActions = [
    ['note_add', 'Nota'],
    ['checklist', 'Lista'],
    ['draw', 'Dibujo'],
    ['create_new_folder', 'Carpeta'],
    ['description', 'Documento'],
    ['notification_add', 'Recordatorio'],
];
const shareActions = [
    ['link', 'Copiar enlace'],
    ['title', 'Copiar título'],
    ['description', 'Copiar descripción'],
    ['person_add', 'Copiar invitación'],
    ['person', 'Copiar autor'],
    ['format_quote', 'Copiar referencia'],
];
const variants: FABVariant[] = ['tonalPrimary', 'tonalSecondary', 'tonalTertiary', 'primary', 'secondary', 'tertiary'];
const variantsLabels = ['Tonal primary', 'Tonal secondary', 'Tonal tertiary', 'Primary', 'Secondary', 'Tertiary'];
const extensionActions = [
    ...createActions,
    ['photo_camera', 'Foto'],
    ['mic', 'Grabación'],
    ['event', 'Evento'],
    ['bookmark_add', 'Marcador'],
    ['image', 'Imagen'],
    ['music_note', 'Canción'],
];

export function FABMenuRuntime() {
    const environment = useRuntimeEnvironment();
    const [mode, setMode] = useState<'expressive' | 'anchored' | 'scroll'>('expressive'),
        [size, setSize] = useState<FABSize>('medium'),
        [variant, setVariant] = useState<FABVariant>('tonalPrimary');
    const [count, setCount] = useState(4),
        [scenario, setScenario] = useState<'create' | 'share'>('create'),
        [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
    const [motion, setMotion] = useState<'standard' | 'expressive'>('expressive'),
        [short, setShort] = useState(false),
        [disabled, setDisabled] = useState(false),
        [expanded, setExpanded] = useState(false);
    const [result, setResult] = useState('Abre el menú y elige una acción.'),
        [actions, setActions] = useState(0),
        [dismissals, setDismissals] = useState(0),
        [records, setRecords] = useState<string[]>([]);
    const sequence = useRef(0),
        mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    // Copy commands preserve user activation; the menu closes while the command resolves.
    const activate = (label: string) => {
        setActions((v) => v + 1);
        if (scenario === 'share') {
            const data: Record<string, string> = {
                'Copiar enlace': 'https://example.com/coleccion',
                'Copiar título': 'Mi colección',
                'Copiar descripción': 'Una colección para compartir ideas.',
                'Copiar invitación': 'Te invito a Mi colección: https://example.com/coleccion',
                'Copiar autor': 'Equipo Mobile Design',
                'Copiar referencia': 'Mi colección · Equipo Mobile Design · https://example.com/coleccion',
            };
            navigator.clipboard.writeText(data[label]).then(
                () => {
                    if (mounted.current) setResult(label === 'Copiar enlace' ? 'Enlace copiado.' : 'Contenido copiado.');
                },
                () => {
                    if (mounted.current) setResult('No se pudo copiar. Intenta de nuevo desde el menú.');
                }
            );
        } else {
            const title = label + ' ' + ++sequence.current;
            setRecords((rows) => [title, ...rows]);
            setResult('Se creó: ' + title + '.');
        }
    };
    const source =
        mode === 'scroll'
            ? scenario === 'create'
                ? extensionActions
                : shareActions
            : (scenario === 'create' ? createActions : shareActions).slice(0, count);
    const items: FABMenuItemProps[] = source.map(([icon, label], index) => ({
        key: label,
        icon,
        label,
        disabled: disabled && index === 1,
        testID: 'fab-menu-action-' + index,
        onPress: () => activate(label),
    }));
    const common = {
        presentation: mode === 'anchored' ? ('adaptive' as const) : ('expressive' as const),
        expanded,
        onDismiss: () => {
            setExpanded(false);
            setDismissals((v) => v + 1);
        },
        trigger: {
            icon: scenario === 'create' ? 'plus' : 'share',
            variant,
            size,
            accessibilityLabel: scenario === 'create' ? 'Abrir menú de creación' : 'Abrir menú para compartir',
            onPress: () => setExpanded((v) => !v),
            testID: 'fab-menu-trigger',
        },
        testID: 'example-fab-menu',
    };
    const anchoredItems: Extract<FABMenuProps, { overflow?: undefined }>['items'] =
        count === 2
            ? [items[0], items[1]]
            : count === 3
              ? [items[0], items[1], items[2]]
              : count === 4
                ? [items[0], items[1], items[2], items[3]]
                : count === 5
                  ? [items[0], items[1], items[2], items[3], items[4]]
                  : [items[0], items[1], items[2], items[3], items[4], items[5]];
    const menu: FABMenuProps =
        mode === 'scroll' ? { ...common, overflow: 'scroll', maxHeight: short ? 140 : 264, items } : { ...common, items: anchoredItems };
    const configure = <T,>(update: (value: T) => void, value: T) => {
        setExpanded(false);
        update(value);
    };
    const code = `<FAB.Menu${mode !== 'anchored' ? '\n  presentation="expressive"' : ''}\n  expanded={expanded}\n  onDismiss={() => setExpanded(false)}\n  trigger={{ icon: "${scenario === 'create' ? 'plus' : 'share'}", size: "${size}",\n    variant: "${variant}", accessibilityLabel: "${scenario === 'create' ? 'Abrir menú de creación' : 'Abrir menú para compartir'}",\n    onPress: () => setExpanded(value => !value) }}${mode === 'scroll' ? `\n  overflow="scroll"\n  maxHeight={${short ? 140 : 264}}` : ''}\n  items={[\n${source.map(([icon, label], i) => `    { key: "action-${i}", icon: "${icon}", label: "${label}",${disabled && i === 1 ? ' disabled: true,' : ''} onPress: handle${i + 1} },`).join('\n')}\n  ]}\n/>`;
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            direction={direction}
            motion={motion}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <RuntimeTextRoot>
                <main aria-label="Ejemplo interactivo de FAB menu">
                    <Prose as="div" className="playground-controls" aria-label="Configurar FAB menu">
                        <SelectField
                            label="Presentación"
                            id="fab-menu-mode"
                            value={mode}
                            onValueChange={(nextValue) => configure(setMode, nextValue as typeof mode)}
                            options={[
                                { value: 'expressive', label: 'M3 Expressive' },
                                { value: 'anchored', label: 'Adaptación web · menú' },
                                { value: 'scroll', label: 'Pila desplazable · extensión' },
                            ]}
                        />
                        <SelectField
                            label="Ejemplo"
                            id="fab-menu-scenario"
                            value={scenario}
                            onValueChange={(nextValue) => configure(setScenario, nextValue as typeof scenario)}
                            options={[
                                { value: 'create', label: 'Crear' },
                                { value: 'share', label: 'Compartir' },
                            ]}
                        />
                        <SelectField
                            label="Tamaño del FAB"
                            id="fab-menu-size"
                            value={size}
                            onValueChange={(nextValue) => configure(setSize, nextValue as FABSize)}
                            options={[
                                { value: 'default', label: 'Small · 56' },
                                { value: 'medium', label: 'Medium · 80' },
                                { value: 'large', label: 'Large · 96' },
                            ]}
                        />
                        <SelectField
                            label="Color del FAB"
                            id="fab-menu-variant"
                            value={variant}
                            onValueChange={(nextValue) => configure(setVariant, nextValue as FABVariant)}
                            options={variants.map((v, i) => ({ value: v, label: variantsLabels[i] }))}
                        />
                        <SelectField
                            label="Número de acciones"
                            id="fab-menu-count"
                            disabled={mode === 'scroll'}
                            value={count}
                            onValueChange={(nextValue) => configure(setCount, Number(nextValue))}
                            options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: n }))}
                        />
                        <SelectField
                            label="Dirección"
                            id="fab-menu-direction"
                            value={direction}
                            onValueChange={(nextValue) => configure(setDirection, nextValue as typeof direction)}
                            options={[
                                { value: 'ltr', label: 'Izquierda a derecha' },
                                { value: 'rtl', label: 'Derecha a izquierda' },
                            ]}
                        />
                        <SelectField
                            label="Movimiento"
                            id="fab-menu-motion"
                            value={motion}
                            onValueChange={(nextValue) => setMotion(nextValue as typeof motion)}
                            options={[
                                { value: 'expressive', label: 'Expressive' },
                                { value: 'standard', label: 'Standard' },
                            ]}
                        />
                        <Prose as="div" className="state-options">
                            <Prose as="label">
                                <input
                                    id="fab-menu-short"
                                    type="checkbox"
                                    checked={short}
                                    onChange={(e) => configure(setShort, e.target.checked)}
                                />
                                Altura limitada
                            </Prose>
                            <Prose as="label">
                                <input
                                    id="fab-menu-disabled"
                                    type="checkbox"
                                    checked={disabled}
                                    onChange={(e) => configure(setDisabled, e.target.checked)}
                                />
                                Segunda acción no disponible
                            </Prose>
                        </Prose>
                    </Prose>
                    <section className="example-code" aria-label="Código de la configuración">
                        <Prose as="h2">Código de la configuración</Prose>
                        <pre tabIndex={0}>
                            <code>{code}</code>
                        </pre>
                    </section>
                    <Prose as="p" className="preview-guidance">
                        {mode === 'anchored'
                            ? 'Adaptación web: el FAB abre un menú baseline. Usa flechas, Inicio/Fin, Escape y Enter o Espacio.'
                            : mode === 'expressive'
                              ? 'M3 Expressive: de 2 a 6 acciones con iconos y etiquetas. El FAB se transforma en el cierre; Tab recorre los controles.'
                              : 'Extensión del paquete: la pila se desplaza con el gesto o la rueda. El cierre permanece accesible.'}
                    </Prose>
                    <Prose as="div" className="fab-menu-scene" dir={direction}>
                        <SafeAreaInsetsContext.Provider value={previewInsets}>
                            <View style={{ width: '100%', height: short ? 280 : 460, position: 'relative', overflow: 'hidden' }}>
                                <View style={{ padding: 24, gap: 16 }}>
                                    <Text variant="headlineSmall" {...{ dataSet: { runtimeText: 'native' } }}>
                                        {scenario === 'create' ? 'Tu espacio' : 'Mi colección'}
                                    </Text>
                                    <Text variant="bodyMedium" {...{ dataSet: { runtimeText: 'native' } }}>
                                        {scenario === 'create'
                                            ? 'Crea contenido desde una sola acción principal.'
                                            : 'Elige cómo compartir esta colección.'}
                                    </Text>
                                    {records.slice(0, 3).map((record) => (
                                        <View key={record} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <Icon source="description" size={24} />
                                            <Text variant="bodyLarge" {...{ dataSet: { runtimeText: 'native' } }}>
                                                {record}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                                <FAB.Menu {...menu} />
                            </View>
                        </SafeAreaInsetsContext.Provider>
                    </Prose>
                    <Prose as="div" className="example-result" role="status" aria-live="polite">
                        <Prose as="span" id="fab-menu-result">
                            {result}
                        </Prose>
                        <Prose as="span">
                            <Prose as="span" id="fab-menu-actions">
                                {actions}
                            </Prose>{' '}
                            acciones ·{' '}
                            <Prose as="span" id="fab-menu-dismissals">
                                {dismissals}
                            </Prose>{' '}
                            cierres
                        </Prose>
                    </Prose>
                </main>
                <RuntimeBridge />
            </RuntimeTextRoot>
        </MobileDesignProvider>
    );
}
