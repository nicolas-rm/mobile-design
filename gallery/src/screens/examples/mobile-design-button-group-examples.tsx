import { useState, type ReactNode } from 'react';
import { Linking, ScrollView, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { ButtonGroup, Icon, LocaleProvider, Text, useMobileTheme, type ButtonGroupItem, type ButtonGroupProps } from 'mobile-design/react-native';
import { buttonGroupSizeTokens } from '@mobile-design/tokens';

const sizes = ['extra-small', 'small', 'medium', 'large', 'extra-large'] as const;
const treatments = [
    { name: 'Filled', buttonVariant: 'filled' },
    { name: 'Tonal', buttonVariant: 'tonal' },
    { name: 'Outlined', buttonVariant: 'outlined' },
    { name: 'Elevated', buttonVariant: 'elevated' },
] as const;
const labels = [
    { value: 'one', label: 'Label' },
    { value: 'two', label: 'Label' },
    { value: 'three', label: 'Label' },
];
const symbols = [
    { value: 'one', label: 'Alarm', icon: 'alarm', iconOnly: true },
    { value: 'two', label: 'Link off', icon: 'link_off', iconOnly: true },
    { value: 'three', label: 'Wi-Fi', icon: 'wifi', iconOnly: true },
];
const stateReferences = [
    { id: 'S08', title: 'Standard · default states', source: require('./assets/button-groups-reference/S08.png'), aspectRatio: 1352 / 700 },
    { id: 'S09', title: 'Standard · toggle states', source: require('./assets/button-groups-reference/S09.png'), aspectRatio: 1352 / 700 },
    {
        id: 'S10',
        title: 'Connected · unselected states',
        source: require('./assets/button-groups-reference/S10.png'),
        aspectRatio: 2048 / 962,
    },
    {
        id: 'S11',
        title: 'Connected · selected states',
        source: require('./assets/button-groups-reference/S11.png'),
        aspectRatio: 2048 / 800,
    },
] as const;

function Part({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={{ gap: 16 }}>
            <Text variant="titleLarge">{title}</Text>
            {children}
        </View>
    );
}
function Reference({ section }: { section: 'overview' | 'specs' | 'guidelines' | 'accessibility' }) {
    const theme = useMobileTheme();
    return (
        <Text
            accessibilityRole="link"
            style={{ color: theme.colors.primary }}
            onPress={() => void Linking.openURL(`https://m3.material.io/components/button-groups/${section}`)}
        >
            MD3 · {section}
        </Text>
    );
}

/** Reference specimens are independent; their state is never coupled to another figure. */
export function ButtonGroupExamples({ onEvent }: { onEvent: (message: string) => void }) {
    const theme = useMobileTheme(),
        { width } = useWindowDimensions();
    const [values, setValues] = useState<Record<string, string | string[]>>({});
    const [clipboard, setClipboard] = useState('');
    const sample = (id: string, props: ButtonGroupProps, initial: string | string[] = '') => (
        <ButtonGroup
            {...props}
            value={values[id] ?? initial}
            onValueChange={(next) => {
                setValues((previous) => ({ ...previous, [id]: next }));
                onEvent(`${id}: ${Array.isArray(next) ? next.join(', ') || 'No selection' : next || 'No selection'}`);
            }}
            testID={`md-button-group-${id}`}
        />
    );
    const action = (value: string) => () => onEvent(value);
    const scrollSpecimen = (id: string, size: (typeof sizes)[number], props: ButtonGroupProps, initial = '') => (
        <ScrollView
            key={id}
            horizontal
            contentContainerStyle={{ paddingVertical: 4 }}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
        >
            <View
                style={{
                    width: Math.max(width - 48, { 'extra-small': 300, small: 360, medium: 460, large: 920, 'extra-large': 1280 }[size]),
                }}
            >
                {sample(id, { size, fullWidth: true, ...props }, initial)}
            </View>
        </ScrollView>
    );
    return (
        <View style={{ gap: 32 }} testID="md-button-group-examples">
            <Part title="Variants">
                <Text>
                    Standard redistribuye espacio entre vecinos al presionar. Connected conserva sus posiciones y expresa la selección con
                    forma, color e indicador.
                </Text>
                <Text variant="labelLarge">Standard</Text>
                {sample('variant-standard', { items: labels.map((item) => ({ ...item, onPress: action(item.value) })), fullWidth: true })}
                <Text variant="labelLarge">Connected</Text>
                {sample('variant-connected', { items: labels, variant: 'connected' }, 'one')}
                <Reference section="overview" />
            </Part>
            <Part title="Common layouts">
                <Text variant="labelLarge">Start · Directions · Share</Text>
                {sample('layout-directions', {
                    fullWidth: true,
                    items: [
                        { value: 'start', label: 'Start', icon: 'directions_car', onPress: action('Start') },
                        { value: 'directions', label: 'Directions', icon: 'directions_car', onPress: action('Directions') },
                        { value: 'share', label: 'Share', icon: 'share', onPress: action('Share') },
                    ],
                })}
                <Text variant="labelLarge">Rewind · Play · Forward</Text>
                {sample('layout-player', {
                    fullWidth: true,
                    buttonVariant: 'filled',
                    items: [
                        { value: 'rewind', label: 'Rewind', icon: 'fast_rewind', iconOnly: true, onPress: action('Rewind') },
                        { value: 'play', label: 'Play', icon: 'play_arrow', onPress: action('Play') },
                        { value: 'forward', label: 'Forward', icon: 'fast_forward', iconOnly: true, onPress: action('Forward') },
                    ],
                })}
                <Text variant="labelLarge">Extra small · Filled · Square</Text>
                {sample('layout-shortcuts', {
                    size: 'extra-small',
                    shape: 'square',
                    buttonVariant: 'filled',
                    items: [{ value: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth', iconOnly: true }, ...symbols].map((item) => ({
                        ...item,
                        onPress: action(item.label),
                    })),
                })}
                <Text variant="labelLarge">Large · Tonal · Square · Default / Narrow / Wide</Text>
                {scrollSpecimen('layout-widths', 'large', {
                    shape: 'square',
                    items: symbols.map((item, index) => ({
                        ...item,
                        widthVariant: index === 1 ? 'narrow' : index === 2 ? 'wide' : 'default',
                        onPress: action(item.label),
                    })),
                })}
                <Reference section="specs" />
            </Part>
            <Part title="Sizes">
                <Text>Los cinco tamaños se muestran a escala real. Desliza horizontalmente los ejemplos grandes.</Text>
                {sizes.map((size) => (
                    <View key={size} style={{ gap: 12 }}>
                        <Text variant="titleMedium">
                            {size} · {buttonGroupSizeTokens[size].height} dp
                        </Text>
                        <Text variant="labelMedium">Standard · labels</Text>
                        {scrollSpecimen(`size-${size}-standard-labels`, size, {
                            items: labels.map((item) => ({ ...item, onPress: action(`${size} ${item.value}`) })),
                        })}
                        <Text variant="labelMedium">Standard · icons</Text>
                        {scrollSpecimen(`size-${size}-standard-icons`, size, {
                            items: symbols.map((item) => ({ ...item, onPress: action(item.label) })),
                        })}
                        <Text variant="labelMedium">Connected · labels</Text>
                        {scrollSpecimen(`size-${size}-connected-labels`, size, { variant: 'connected', items: labels }, 'one')}
                        <Text variant="labelMedium">Connected · icons</Text>
                        {scrollSpecimen(
                            `size-${size}-connected-icons`,
                            size,
                            { variant: 'connected', items: symbols, showSelectedIcon: false },
                            'one'
                        )}
                    </View>
                ))}
                <Reference section="specs" />
            </Part>
            <Part title="Color">
                <Text testID="md-button-group-connected-color-guidance">
                    Connected conserva un tratamiento de color uniforme. La figura de Files con colores mezclados es un ejemplo Don't, no
                    otra configuración recomendada.
                </Text>
                <View style={{ gap: 8 }} testID="md-button-group-reference-G08">
                    <Text variant="labelLarge">Don’t · mezclar colores en Connected</Text>
                    <Text variant="bodySmall">Referencia oficial · no interactiva</Text>
                    <Image
                        source={require('./assets/button-groups-reference/G08.png')}
                        contentFit="contain"
                        accessible
                        accessibilityLabel="MD3 G08: Files con colores mezclados incorrectamente, referencia no interactiva"
                        style={{ width: '100%', aspectRatio: 1352 / 600 }}
                    />
                </View>
                {treatments.map(({ name, buttonVariant }) => (
                    <View key={buttonVariant} style={{ gap: 12 }}>
                        <Text variant="titleMedium">{name}</Text>
                        {buttonVariant !== 'elevated' ? (
                            <>
                                <Text variant="labelMedium">Standard · action</Text>
                                {sample(`color-${buttonVariant}-action`, {
                                    buttonVariant,
                                    fullWidth: true,
                                    items: labels.map((item) => ({ ...item, onPress: action(item.value) })),
                                })}
                                <Text variant="labelMedium">Standard · toggle</Text>
                                {sample(
                                    `color-${buttonVariant}-toggle`,
                                    { buttonVariant, fullWidth: true, selectionMode: 'multiple', showSelectedIcon: false, items: labels },
                                    ['one']
                                )}
                            </>
                        ) : (
                            <Text>Elevated style not recommended para Standard. La figura muestra este tratamiento en Connected.</Text>
                        )}
                        <Text variant="labelMedium">Connected</Text>
                        {sample(`color-${buttonVariant}-connected`, { buttonVariant, variant: 'connected', items: labels }, 'one')}
                    </View>
                ))}
                <Reference section="specs" />
            </Part>
            <Part title="Shape">
                {(['round', 'square'] as const).map((shape) => (
                    <View key={shape} style={{ gap: 12 }}>
                        <Text variant="titleMedium">{shape}</Text>
                        {sample(`shape-${shape}-standard`, {
                            shape,
                            fullWidth: true,
                            items: symbols.map((item) => ({ ...item, onPress: action(item.label) })),
                        })}
                        {sample(`shape-${shape}-connected`, { shape, variant: 'connected', items: labels }, 'one')}
                    </View>
                ))}
                <Text>
                    Connected mantiene 2 dp entre botones. La forma seleccionada es redonda; las esquinas interiores cambian según el
                    tamaño.
                </Text>
                <Reference section="specs" />
            </Part>
            <Part title="Density">
                <Text>
                    La figura presenta 0, −1, −2 y −3. Aplicamos la regla general de densidad MD3: 4 dp menos por nivel, manteniendo texto y
                    objetivo táctil.
                </Text>
                {([0, -1, -2, -3] as const).map((density) => (
                    <View key={density} style={{ gap: 8 }}>
                        <Text variant="labelLarge">Density {density}</Text>
                        {sample(
                            `density-${density}`,
                            {
                                density,
                                variant: 'connected',
                                showSelectedIcon: false,
                                items: labels.map((item) => ({
                                    ...item,
                                    icon: (values[`density-${density}`] ?? 'one') === item.value ? 'stars_fill1' : 'stars',
                                })),
                            },
                            'one'
                        )}
                    </View>
                ))}
                <Reference section="specs" />
            </Part>
            <Part title="Selection">
                <Text variant="titleMedium">Single selection · required</Text>
                {sample(
                    'selection-required',
                    {
                        variant: 'connected',
                        items: [
                            { value: 'relevance', label: 'Relevance' },
                            { value: 'distance', label: 'Distance' },
                        ],
                    },
                    'relevance'
                )}
                <Text variant="titleMedium">Single selection · optional</Text>
                {sample('selection-optional', { variant: 'connected', allowEmptySelection: true, items: labels }, 'one')}
                <Text variant="titleMedium">Multiple selection</Text>
                {sample(
                    'selection-multiple',
                    {
                        variant: 'connected',
                        selectionMode: 'multiple',
                        items: ['$', '$$', '$$$', '$$$$'].map((label) => ({ value: label, label })),
                    },
                    ['$', '$$']
                )}
                <Reference section="guidelines" />
            </Part>
            <Part title="Interaction">
                <Text>
                    Presiona, mantén y suelta; cambia de botón antes de que termine el movimiento. En Standard la expansión predeterminada
                    es 15%; las etiquetas conservan su tamaño.
                </Text>
                {sample('press-standard', {
                    fullWidth: true,
                    items: [
                        { value: 'four', label: '4' },
                        { value: 'five', label: '5' },
                        { value: 'six', label: '6' },
                    ].map((item) => ({ ...item, onPress: action(item.label) })),
                })}
                {sample('press-connected', { variant: 'connected', items: labels }, 'one')}
                <Text>
                    Esta ficha usa el esquema de movimiento Standard de la tabla MD3. Reducir movimiento elimina la redistribución y los
                    cambios de forma animados.
                </Text>
                <Reference section="guidelines" />
            </Part>
            <Part title="Hierarchy and width">
                <Text variant="labelLarge">Music player · Play wide</Text>
                {sample('hierarchy-music', {
                    fullWidth: true,
                    items: [
                        {
                            value: 'play',
                            label: 'Play',
                            icon: 'play_arrow',
                            iconOnly: true,
                            buttonColor: theme.colors.tertiaryContainer,
                            textColor: theme.colors.onTertiaryContainer,
                            widthVariant: 'wide',
                        },
                        { value: 'favorite', label: 'Favorite', icon: 'favorite_border', iconOnly: true },
                        { value: 'shuffle', label: 'Shuffle', icon: 'shuffle', iconOnly: true },
                        { value: 'more', label: 'More options', icon: 'more_vert', iconOnly: true, widthVariant: 'narrow' },
                    ].map((item) => ({ ...item, onPress: action(item.label) })) as ButtonGroupItem[],
                })}
                <Text variant="labelLarge">Photo actions · Narrow / Default / Wide</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    {sample('hierarchy-photo', {
                        style: { flex: 1 },
                        fullWidth: true,
                        shape: 'square',
                        items: [
                            { value: 'more', label: 'More options', icon: 'more_vert', iconOnly: true, widthVariant: 'narrow' },
                            { value: 'favorite', label: 'Favorite', icon: 'favorite_border', iconOnly: true },
                            {
                                value: 'reaction',
                                label: 'Add reaction',
                                icon: 'add_reaction',
                                iconOnly: true,
                                widthVariant: 'wide',
                                buttonColor: theme.colors.tertiaryContainer,
                                textColor: theme.colors.onTertiaryContainer,
                            },
                        ].map((item) => ({ ...item, onPress: action(item.label) })) as ButtonGroupItem[],
                    })}
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: theme.colors.surfaceContainerHigh,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon source="person" size={24} />
                    </View>
                </View>
                <Text>
                    El avatar queda fuera del grupo. Mantén una jerarquía clara y usa tamaños distintos sólo en un momento destacado.
                </Text>
                {scrollSpecimen('hierarchy-hero', 'large', {
                    size: 'medium',
                    items: [
                        { value: 'rewind', label: 'Rewind', icon: 'fast_rewind', iconOnly: true, size: 'medium' },
                        {
                            value: 'play',
                            label: 'Play',
                            icon: 'play_arrow',
                            iconOnly: true,
                            size: 'large',
                            variant: 'filled',
                            widthVariant: 'wide',
                        },
                        { value: 'forward', label: 'Forward', icon: 'fast_forward', iconOnly: true, size: 'medium' },
                    ].map((item) => ({ ...item, onPress: action(item.label) })) as ButtonGroupItem[],
                })}
                <Reference section="guidelines" />
            </Part>
            <Part title="Caution · Siren sound">
                <Text>
                    No recomendado: mezclar formas que compiten entre sí debilita la relación del grupo. Conservamos la figura comparativa
                    con esta advertencia.
                </Text>
                <View pointerEvents="none" accessibilityLabel="Caution: competing round, pill and square shapes">
                    <Text variant="titleMedium">Siren sound</Text>
                    {sample('caution-music', {
                        items: [
                            {
                                value: 'playlist',
                                label: 'Playlist',
                                icon: 'playlist_play',
                                iconOnly: true,
                                variant: 'filled',
                                shape: 'round',
                            },
                            { value: 'music', label: 'Music', icon: 'music_note', iconOnly: true, widthVariant: 'wide', shape: 'round' },
                            { value: 'add', label: 'Add', icon: 'add', iconOnly: true, shape: 'square' },
                        ],
                    })}
                    <Text>Dream House · Floral Explosion</Text>
                </View>
                <Reference section="guidelines" />
            </Part>
            <Part title="Responsive layout and overflow">
                <Text>
                    Cuando no caben todos, el grupo reserva una acción More options al final. Sus opciones mantienen la misma acción y
                    selección.
                </Text>
                {sample('overflow-actions', {
                    fullWidth: true,
                    maxVisibleItems: 2,
                    items: [
                        {
                            value: 'copy',
                            label: 'Copy',
                            icon: 'content_copy',
                            onPress: () => {
                                setClipboard('Material Design 3');
                                onEvent('Copied');
                            },
                        },
                        {
                            value: 'paste',
                            label: 'Paste',
                            icon: 'content_paste',
                            onPress: () => onEvent(clipboard || 'Clipboard is empty'),
                        },
                        { value: 'share', label: 'Share', icon: 'share', onPress: action('Share') },
                        { value: 'save', label: 'Save', icon: 'bookmark', onPress: action('Saved') },
                    ],
                })}
                {sample(
                    'overflow-selection',
                    {
                        variant: 'connected',
                        maxVisibleItems: 2,
                        items: [
                            { value: 'my-files', label: 'My files' },
                            { value: 'shared', label: 'Shared' },
                            { value: 'computers', label: 'Computers' },
                        ],
                    },
                    'my-files'
                )}
                <Reference section="guidelines" />
            </Part>
            <Part title="States and accessibility">
                <Text>
                    Referencias oficiales no interactivas: enabled, disabled, hovered, focused y pressed. En las muestras del componente, el
                    foco y la presión se obtienen al interactuar; no son selecciones permanentes.
                </Text>
                {stateReferences.map((reference) => (
                    <View key={reference.id} style={{ gap: 8 }}>
                        <Text variant="labelLarge">{reference.title}</Text>
                        <Image
                            source={reference.source}
                            contentFit="contain"
                            accessible
                            accessibilityLabel={`MD3 ${reference.id}: ${reference.title}, referencia no interactiva`}
                            style={{ width: '100%', aspectRatio: reference.aspectRatio }}
                        />
                    </View>
                ))}
                <Text variant="titleMedium">Dinner Club · 3 Messages</Text>
                {sample('accessibility-email', {
                    fullWidth: true,
                    items: [
                        { value: 'archive', label: 'Archive', icon: 'archive', iconOnly: true },
                        { value: 'delete', label: 'Delete', icon: 'delete_outline', iconOnly: true },
                        { value: 'email', label: 'Email', icon: 'mail_outline', iconOnly: true },
                        { value: 'more', label: 'More options', icon: 'more_vert', iconOnly: true, widthVariant: 'narrow' as const },
                    ].map((item) => ({ ...item, onPress: action(item.label) })),
                })}
                <Text variant="labelLarge">Disabled</Text>
                {sample('disabled-standard', { disabled: true, fullWidth: true, items: labels })}
                {sample('disabled-connected', { disabled: true, variant: 'connected', items: labels }, 'one')}
                <Text variant="labelLarge">One unavailable option</Text>
                {sample(
                    'disabled-item',
                    { variant: 'connected', items: labels.map((item, index) => ({ ...item, disabled: index === 1 })) },
                    'one'
                )}
                <Text>
                    Los objetivos táctiles conservan al menos 48 dp. Iconos sin etiqueta visual siguen teniendo nombre accesible; los grupos
                    de selección exponen su estado.
                </Text>
                <Text variant="labelLarge">RTL</Text>
                <LocaleProvider direction="rtl">
                    {sample(
                        'rtl',
                        {
                            variant: 'connected',
                            items: [
                                { value: 'one', label: 'واحد' },
                                { value: 'two', label: 'اثنان' },
                                { value: 'three', label: 'ثلاثة' },
                            ],
                        },
                        'one'
                    )}
                </LocaleProvider>
                <Reference section="accessibility" />
            </Part>
        </View>
    );
}
