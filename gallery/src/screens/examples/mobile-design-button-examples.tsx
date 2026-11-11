import { useState, type ReactNode } from 'react';
import { Image } from 'expo-image';
import { Linking, ScrollView, View } from 'react-native';
import { Button, LocaleProvider, Text, useMobileTheme, type ButtonProps } from 'mobile-design/react-native';
import { MaterialSymbol } from '@mobile-design/icons/react-native';
import { buttonSizeTokens, type ButtonSize, type ButtonVariant } from '@mobile-design/tokens';

const sizes: readonly ButtonSize[] = ['extra-small', 'small', 'medium', 'large', 'extra-large'];
const styles: readonly ButtonVariant[] = ['elevated', 'filled', 'tonal', 'outlined', 'text'];
const toggles = styles.filter((style) => style !== 'text');

const referenceComparisons = [
    {
        id: 'G04',
        title: 'Don’t · exceso de botones',
        source: require('./assets/buttons-reference/diagrams/G04.png'),
        aspectRatio: 1352 / 840,
    },
    {
        id: 'G07',
        title: 'Don’t · contenedor más estrecho que la etiqueta',
        source: require('./assets/buttons-reference/diagrams/G07.png'),
        aspectRatio: 656 / 600,
    },
    {
        id: 'G12',
        title: 'Don’t · longitud del rótulo cambia demasiado',
        source: require('./assets/buttons-reference/diagrams/G12.png'),
        aspectRatio: 656 / 600,
    },
    {
        id: 'G15',
        title: 'Don’t · etiqueta partida a tamaño habitual',
        source: require('./assets/buttons-reference/diagrams/G15.png'),
        aspectRatio: 656 / 600,
    },
    {
        id: 'G16',
        title: 'Caution · outlined y chips visualmente similares',
        source: require('./assets/buttons-reference/diagrams/G16.png'),
        aspectRatio: 1352 / 600,
    },
    {
        id: 'G24',
        title: 'Don’t · icono encima de la etiqueta',
        source: require('./assets/buttons-reference/diagrams/G24.png'),
        aspectRatio: 656 / 656,
    },
    {
        id: 'G25',
        title: 'Don’t · dos iconos en un botón',
        source: require('./assets/buttons-reference/diagrams/G25.png'),
        aspectRatio: 656 / 656,
    },
    {
        id: 'G43',
        title: 'Don’t · icono y texto separados',
        source: require('./assets/buttons-reference/diagrams/G43.png'),
        aspectRatio: 656 / 600,
    },
    {
        id: 'G44',
        title: 'Don’t · botón demasiado ancho en ventana amplia',
        source: require('./assets/buttons-reference/diagrams/G44.png'),
        aspectRatio: 2704 / 1600,
    },
] as const;

const names = { 'extra-small': 'Extra small', small: 'Small', medium: 'Medium', large: 'Large', 'extra-large': 'Extra large' };

function Part({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <View style={{ gap: 16 }} testID={`md-buttons-section-${id}`}>
            <Text variant="titleLarge" accessibilityRole="header">
                {title}
            </Text>
            {children}
        </View>
    );
}
function Row({ children }: { children: ReactNode }) {
    return <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>{children}</View>;
}
function Reference({ section }: { section: 'overview' | 'specs' | 'guidelines' | 'accessibility' }) {
    const theme = useMobileTheme();
    return (
        <Text
            accessibilityRole="link"
            style={{ color: theme.colors.primary }}
            onPress={() => void Linking.openURL(`https://m3.material.io/components/buttons/${section}`)}
        >
            MD3 · {section}
        </Text>
    );
}

/** Figures use independent state; press/focus/hover come from actual interaction. */
export function ButtonExamples({ onEvent }: { onEvent: (message: string) => void }) {
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [states, setStates] = useState<Record<string, { pressed?: boolean; focused?: boolean; hovered?: boolean }>>({});
    const interaction = (id: string, update: { pressed?: boolean; focused?: boolean; hovered?: boolean }) =>
        setStates((previous) => ({ ...previous, [id]: { ...previous[id], ...update } }));
    const stateName = (id: string) => {
        const state = states[id];
        return state?.pressed ? 'Pressed' : state?.focused ? 'Focused' : state?.hovered ? 'Hovered' : 'Enabled';
    };
    const sample = (id: string, props: Omit<ButtonProps, 'children'> & { children?: ReactNode } = {}, initial?: boolean) => {
        const value = selected[id] ?? initial;
        return (
            <Button
                key={id}
                {...props}
                {...(initial === undefined ? {} : { selected: value })}
                onPress={() => {
                    if (initial !== undefined) setSelected((previous) => ({ ...previous, [id]: !(previous[id] ?? initial) }));
                    onEvent(initial === undefined ? `${id}: activated` : `${id}: selection changed`);
                }}
                onPressIn={() => interaction(id, { pressed: true })}
                onPressOut={() => interaction(id, { pressed: false })}
                onFocus={() => interaction(id, { focused: true })}
                onBlur={() => interaction(id, { focused: false, pressed: false })}
                onHoverIn={() => interaction(id, { hovered: true })}
                onHoverOut={() => interaction(id, { hovered: false })}
                testID={`md-buttons-${id}`}
            >
                {props.children ?? 'Label'}
            </Button>
        );
    };
    const edit =
        (filled = true): ButtonProps['icon'] =>
        ({ size, color }) => <MaterialSymbol name="edit" size={size} color={color} filled={filled} />;
    const playback =
        (playing: boolean): ButtonProps['icon'] =>
        ({ size, color }) => <MaterialSymbol name={playing ? 'pause' : 'play_arrow'} size={size} color={color} filled={playing} />;
    return (
        <View style={{ gap: 32 }} testID="md-buttons-examples">
            <Part id="variants" title="Variants">
                <Text>
                    Default ejecuta una acción. Toggle representa una selección binaria. Los cinco estilos de color son configuraciones.
                </Text>
                <Text variant="labelLarge">Default</Text>
                {sample('default', { icon: edit(), children: 'Label', style: { alignSelf: 'flex-start' } })}
                <Text variant="labelLarge">Toggle · unselected / selected</Text>
                <Row>
                    {sample(
                        'toggle-off',
                        { icon: edit(selected['toggle-off'] ?? false), children: selected['toggle-off'] ? 'Selected' : 'Unselected' },
                        false
                    )}
                    {sample(
                        'toggle-on',
                        {
                            icon: edit(selected['toggle-on'] ?? true),
                            children: (selected['toggle-on'] ?? true) ? 'Selected' : 'Unselected',
                        },
                        true
                    )}
                </Row>
                <Reference section="overview" />
            </Part>
            <Part id="anatomy" title="Anatomy">
                <Text>Label text, container e icono opcional al inicio; cada muestra es un único botón.</Text>
                <Row>
                    {sample('anatomy-filled', { icon: 'add', children: 'Add to folder' })}
                    {sample('anatomy-text', { variant: 'text', icon: 'add', children: 'Add to folder' })}
                </Row>
                <Reference section="specs" />
            </Part>
            <Part id="colors" title="Color styles">
                <Text>Elevated · Filled · Tonal · Outlined · Text. Text no tiene variante toggle.</Text>
                {styles.map((variant) => (
                    <View key={variant} style={{ gap: 8 }}>
                        <Text variant="labelLarge">{variant}</Text>
                        <Row>
                            {sample(`color-${variant}-default`, {
                                variant,
                                icon: edit(),
                                children: `${variant[0].toUpperCase()}${variant.slice(1)} button`,
                            })}
                            {variant !== 'text'
                                ? sample(
                                      `color-${variant}-off`,
                                      {
                                          variant,
                                          icon: edit(selected[`color-${variant}-off`] ?? false),
                                          children: `${variant[0].toUpperCase()}${variant.slice(1)} ${selected[`color-${variant}-off`] ? 'selected' : 'unselected'}`,
                                      },
                                      false
                                  )
                                : null}
                            {variant !== 'text'
                                ? sample(
                                      `color-${variant}-on`,
                                      {
                                          variant,
                                          icon: edit(selected[`color-${variant}-on`] ?? true),
                                          children: `${variant[0].toUpperCase()}${variant.slice(1)} ${(selected[`color-${variant}-on`] ?? true) ? 'selected' : 'unselected'}`,
                                      },
                                      true
                                  )
                                : null}
                        </Row>
                    </View>
                ))}
                <Reference section="specs" />
            </Part>
            <Part id="sizes" title="Sizes and measurements">
                <Text>Medidas a escala real. Desliza horizontalmente los tamaños grandes.</Text>
                {sizes.map((size) => (
                    <View key={size} style={{ gap: 8 }}>
                        <Text variant="labelLarge">
                            {names[size]} · {buttonSizeTokens[size].height} dp · padding {buttonSizeTokens[size].padding} dp · icon{' '}
                            {buttonSizeTokens[size].icon} dp
                        </Text>
                        <ScrollView
                            horizontal
                            contentContainerStyle={{ gap: 16, alignItems: 'center', padding: 4 }}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                        >
                            {sample(`size-${size}-round-text`, { size, variant: 'tonal', children: 'Common button' })}
                            {sample(`size-${size}-round`, { size, variant: 'tonal', icon: edit(), children: 'Common button' })}
                            {sample(`size-${size}-square-text`, { size, variant: 'tonal', shape: 'square', children: 'Common button' })}
                            {sample(`size-${size}-square`, {
                                size,
                                variant: 'tonal',
                                shape: 'square',
                                icon: edit(),
                                children: 'Common button',
                            })}
                        </ScrollView>
                        <Text variant="bodySmall">
                            Square {buttonSizeTokens[size].square} dp · pressed {buttonSizeTokens[size].pressed} dp · outline{' '}
                            {buttonSizeTokens[size].outline} dp
                        </Text>
                    </View>
                ))}
                <Reference section="specs" />
            </Part>
            <Part id="shape" title="Shape morph">
                <Text>
                    Round y Square llegan al mismo radio al presionar. En toggle, la forma seleccionada invierte la forma de reposo. Mantén,
                    suelta, cancela y repite para observar la transición.
                </Text>
                {sizes.map((size) => (
                    <View key={size} style={{ gap: 8 }}>
                        <Text variant="labelLarge">{names[size]} · default / toggle</Text>
                        <ScrollView
                            horizontal
                            contentContainerStyle={{ gap: 16, alignItems: 'center', padding: 4 }}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                        >
                            {sample(`shape-${size}-round`, { size, variant: 'tonal', shape: 'round', children: 'Learn more' })}
                            {sample(`shape-${size}-square`, { size, variant: 'tonal', shape: 'square', children: 'Learn more' })}
                            {sample(
                                `shape-${size}-toggle-round`,
                                {
                                    size,
                                    shape: 'round',
                                    icon: playback(selected[`shape-${size}-toggle-round`] ?? false),
                                    children: selected[`shape-${size}-toggle-round`] ? 'Pause' : 'Play',
                                },
                                false
                            )}
                            {sample(
                                `shape-${size}-toggle-square`,
                                {
                                    size,
                                    shape: 'square',
                                    icon: playback(selected[`shape-${size}-toggle-square`] ?? false),
                                    children: selected[`shape-${size}-toggle-square`] ? 'Pause' : 'Play',
                                },
                                false
                            )}
                        </ScrollView>
                    </View>
                ))}
                <Reference section="specs" />
            </Part>
            <Part id="states" title="States">
                <Text>
                    Enabled y Disabled se muestran juntos. Hovered, Focused y Pressed se obtienen al interactuar con cada muestra; el foco y
                    hover requieren un dispositivo de entrada compatible.
                </Text>
                {styles.map((variant) => (
                    <View key={variant} style={{ gap: 12 }}>
                        <Text variant="titleMedium">{variant} · default</Text>
                        <Row>
                            {sample(`state-${variant}-enabled`, { variant, children: stateName(`state-${variant}-enabled`) })}
                            {sample(`state-${variant}-disabled`, { variant, disabled: true, children: 'Disabled' })}
                        </Row>
                        <Text variant="bodySmall">{stateName(`state-${variant}-enabled`)}</Text>
                        {variant !== 'text' ? (
                            <>
                                <Text variant="labelLarge">Toggle · unselected / selected · enabled / disabled</Text>
                                <Row>
                                    {[false, true].map((initial) => (
                                        <View key={String(initial)} style={{ gap: 12, alignItems: 'flex-start' }}>
                                            {sample(
                                                `state-${variant}-${initial}-enabled`,
                                                { variant, children: stateName(`state-${variant}-${initial}-enabled`) },
                                                initial
                                            )}
                                            {sample(
                                                `state-${variant}-${initial}-disabled`,
                                                { variant, disabled: true, children: 'Disabled' },
                                                initial
                                            )}
                                            <Text variant="bodySmall">{stateName(`state-${variant}-${initial}-enabled`)}</Text>
                                        </View>
                                    ))}
                                </Row>
                            </>
                        ) : null}
                    </View>
                ))}
                <Reference section="specs" />
            </Part>
            <Part id="labels" title="Label text and leading icons">
                <Text>
                    Etiquetas breves, sentence case e icono antes del texto. El icono y la etiqueta permanecen centrados como un grupo
                    cuando cambia el ancho.
                </Text>
                <Row>
                    {sample('label-text', { children: 'Send' })}
                    {sample('label-leading', { icon: 'send_fill1', children: 'Send' })}
                </Row>
                {sample('width-content', { icon: 'send_fill1', children: 'Send', style: { alignSelf: 'flex-start' } })}
                {sample('width-responsive', { icon: 'send_fill1', children: 'Send', style: { alignSelf: 'stretch' } })}
                <LocaleProvider direction="rtl">
                    <View style={{ alignItems: 'flex-start' }}>{sample('label-rtl', { icon: 'send_fill1', children: 'שלח' })}</View>
                </LocaleProvider>
                <Text variant="labelLarge">Similar label lengths · Start / Reset</Text>
                <View style={{ alignItems: 'flex-start', gap: 16 }}>
                    {sample('label-start', { variant: 'tonal', children: 'Start' })}
                    {sample('label-reset', { shape: 'square', children: 'Reset' })}
                </View>
                <Text variant="bodySmall">
                    No recomendado: etiquetas recortadas, iconos en ambos extremos, apilados o separados del texto; subrayar un text button;
                    usar outlined sobre una foto sin contraste suficiente.
                </Text>
                <Reference section="guidelines" />
            </Part>
            <Part id="selection" title="Binary selection">
                <Text>
                    El icono de contorno se rellena al seleccionar. Cada botón mantiene su propio estado; las etiquetas conservan una
                    longitud similar.
                </Text>
                <Row>
                    {toggles.map((variant) => {
                        const value = selected[`save-${variant}`] ?? false;
                        return sample(
                            `save-${variant}`,
                            {
                                variant,
                                icon: ({ size, color }) => <MaterialSymbol name="bookmark" size={size} color={color} filled={value} />,
                                children: value ? 'Saved' : 'Save',
                            },
                            false
                        );
                    })}
                </Row>
                <Reference section="guidelines" />
            </Part>
            <Part id="accessibility" title="Target areas and enlarged text">
                <Text>
                    XS y S mantienen un área táctil mínima de 48 × 48 dp aunque su contenedor visible mida 32 o 40 dp. La prueba ampliada
                    siguiente usa tipografía local al 200%; no modifica el tamaño de texto del sistema.
                </Text>
                <Row>
                    {sample('target-xs', { size: 'extra-small', children: 'Button' })}
                    {sample('target-s', { size: 'small', icon: edit(), children: 'Button' })}
                </Row>
                {sample('text-200', {
                    children: 'Download playlist',
                    labelStyle: { fontSize: 28, lineHeight: 40 },
                    style: { alignSelf: 'stretch' },
                })}
                <Text variant="bodySmall">
                    Usa Tab para navegar y Enter o Space para activar con teclado. El nombre accesible coincide con la etiqueta visible.
                </Text>
                <Reference section="accessibility" />
            </Part>
            <Part id="comparisons" title="Documented comparisons · Don’t / Caution">
                <Text>
                    Referencias originales no interactivas. Muestran patrones que MD3 desaconseja o pide revisar; los ejemplos de botones
                    interactivos anteriores muestran las configuraciones correctas. Estas imágenes no amplían la API del componente.
                </Text>
                {referenceComparisons.map((figure) => (
                    <View key={figure.id} style={{ gap: 8 }} testID={`md-buttons-reference-${figure.id}`}>
                        <Text variant="labelLarge">{figure.title}</Text>
                        <Text variant="bodySmall">Referencia · no interactiva</Text>
                        <Image
                            source={figure.source}
                            style={{ width: '100%', aspectRatio: figure.aspectRatio }}
                            contentFit="contain"
                            accessible
                            accessibilityLabel={`${figure.title}. Referencia original MD3, no interactiva.`}
                        />
                    </View>
                ))}
                <Reference section="guidelines" />
            </Part>
            <Part id="baseline" title="Small padding · reference comparison">
                <Row>
                    {sample('padding-current', { children: 'Label', contentStyle: { paddingHorizontal: 16 } })}
                    {sample('padding-baseline', { children: 'Label', contentStyle: { paddingHorizontal: 24 } })}
                </Row>
                <Text variant="bodySmall">
                    16 dp es la recomendación actual. 24 dp aparece aquí sólo como comparación con baseline; M2 de 36 dp es una referencia
                    histórica, no una variante del componente actual.
                </Text>
                <Reference section="overview" />
            </Part>
        </View>
    );
}
