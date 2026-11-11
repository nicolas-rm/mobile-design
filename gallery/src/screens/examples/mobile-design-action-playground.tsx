import { useCallback, useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions, type ViewInstance } from 'react-native';
import { useLocale } from 'react-native-paper';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Button,
    ButtonGroup,
    FAB,
    Icon,
    List,
    Menu,
    Switch,
    Text,
    Tooltip,
    useMobileTheme,
    type FABMenuProps,
    type FABSize,
    type FABVariant,
    type ContainerTransformOrigin,
} from 'mobile-design/react-native';
import { fabSizeTokens } from '@mobile-design/tokens';
import { useActionWorkspace } from './mobile-design-action-scenarios';

const sizes: { value: FABSize; label: string }[] = [
    { value: 'default', label: '56 dp' },
    { value: 'medium', label: '80 dp' },
    { value: 'large', label: '96 dp' },
];
const colors: { value: FABVariant; label: string }[] = [
    { value: 'primary', label: 'Primary' },
    { value: 'tonalPrimary', label: 'Primary container' },
    { value: 'secondary', label: 'Secondary' },
    { value: 'tonalSecondary', label: 'Secondary container' },
    { value: 'tertiary', label: 'Tertiary' },
    { value: 'tonalTertiary', label: 'Tertiary container' },
];

/** A real scroll viewport with a single primary action; configuration stays outside it. */
export function ActionPlayground({ id, onEvent }: { id: string; onEvent: (message: string) => void }) {
    const theme = useMobileTheme();
    const { direction } = useLocale();
    const window = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const workspace = useActionWorkspace(onEvent);
    const [size, setSize] = useState<FABSize>('medium');
    const [variant, setVariant] = useState<FABVariant>('tonalPrimary');
    const [colorMenu, setColorMenu] = useState(false);
    const [withIcon, setWithIcon] = useState(true);
    const [visible, setVisible] = useState(true);
    const [expandedLabel, setExpandedLabel] = useState(true);
    const [expandedMenu, setExpandedMenu] = useState(false);
    const [sixActions, setSixActions] = useState(false);
    const [configurationOpen, setConfigurationOpen] = useState(false);
    const alive = useRef(true);
    const fabRef = useRef<ViewInstance>(null);
    const openingRequest = useRef(0);
    const openingDeadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            openingRequest.current += 1;
            if (openingDeadline.current !== undefined) clearTimeout(openingDeadline.current);
        };
    }, []);
    const reportExpanded = useCallback((next: boolean) => {
        if (alive.current) setExpandedLabel(next);
    }, []);
    const previousY = useSharedValue(0);
    const expanded = useSharedValue(true);
    const onScroll = useAnimatedScrollHandler((event) => {
        const y = Math.max(0, event.contentOffset.y);
        const bottom = y + event.layoutMeasurement.height >= event.contentSize.height - 1;
        const delta = y - previousY.get();
        const next = y <= 0 || bottom ? true : delta > 1 ? false : delta < -1 ? true : expanded.get();
        // Accumulate sub-dp deltas so a deliberately slow drag still changes direction.
        if (Math.abs(delta) > 1 || y <= 0 || bottom) previousY.set(y);
        if (expanded.get() !== next) {
            expanded.set(next);
            scheduleOnRN(reportExpanded, next);
        }
    });
    const isExtended = id === 'extended-fab';
    const isMenu = id === 'fab-menu';
    const margin = window.width >= 1200 ? 24 : 16;
    const leftAligned = direction === 'rtl' && window.width < 840;
    const label = isMenu ? 'Crear contenido' : 'Redactar';
    const create = () => {
        if (isMenu) {
            workspace.open('compose', 'Redactar documento');
            return;
        }
        const token = ++openingRequest.current;
        if (openingDeadline.current !== undefined) clearTimeout(openingDeadline.current);
        const open = (origin?: ContainerTransformOrigin) => {
            if (!alive.current || token !== openingRequest.current) return;
            openingRequest.current += 1;
            if (openingDeadline.current !== undefined) clearTimeout(openingDeadline.current);
            openingDeadline.current = undefined;
            workspace.open('compose', 'Redactar documento', origin);
        };
        const node = fabRef.current;
        if (!node?.measureInWindow) {
            open();
            return;
        }
        openingDeadline.current = setTimeout(() => open(), 200);
        try {
            node.measureInWindow((x, y, width, height) => {
                if (!alive.current || token !== openingRequest.current) return;
                const spec = fabSizeTokens[size];
                const [backgroundColor, contentColor] = {
                    primary: [theme.colors.primary, theme.colors.onPrimary],
                    secondary: [theme.colors.secondary, theme.colors.onSecondary],
                    tertiary: [theme.colors.tertiary, theme.colors.onTertiary],
                    tonalPrimary: [theme.colors.primaryContainer, theme.colors.onPrimaryContainer],
                    tonalSecondary: [theme.colors.secondaryContainer, theme.colors.onSecondaryContainer],
                    tonalTertiary: [theme.colors.tertiaryContainer, theme.colors.onTertiaryContainer],
                }[variant];
                const measured = [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0;
                open(
                    measured
                        ? {
                              x,
                              y,
                              width,
                              height,
                              borderRadius: theme.shapes.corner[spec.radius],
                              backgroundColor,
                              content: isExtended ? (
                                  <View
                                      style={{
                                          width,
                                          height,
                                          direction: 'ltr',
                                          flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                                          alignItems: 'center',
                                          paddingHorizontal: spec.leading,
                                          gap: spec.gap,
                                          overflow: 'hidden',
                                      }}
                                  >
                                      {withIcon ? <Icon source="pencil" size={spec.icon} color={contentColor} /> : null}
                                      {expandedLabel || !withIcon ? (
                                          <Text
                                              numberOfLines={1}
                                              variant={spec.text}
                                              style={{ color: contentColor, writingDirection: direction }}
                                          >
                                              {label}
                                          </Text>
                                      ) : null}
                                  </View>
                              ) : (
                                  <Icon source="edit_fill1" size={spec.icon} color={contentColor} />
                              ),
                          }
                        : undefined
                );
            });
        } catch {
            open();
        }
    };
    const allItems = [
        { icon: 'pencil', label: 'Redactar', onPress: create },
        { icon: 'camera', label: 'Elegir foto', onPress: () => workspace.open('files', 'Elegir fotografía') },
        { icon: 'image', label: 'Añadir imagen', onPress: () => workspace.open('files', 'Añadir imagen') },
        { icon: 'file-document', label: 'Adjuntar archivo', onPress: () => workspace.open('files', 'Adjuntar archivo') },
        { icon: 'calendar', label: 'Crear evento', onPress: () => workspace.open('event', 'Crear evento') },
        { icon: 'account-plus', label: 'Añadir contacto', onPress: () => workspace.open('contact', 'Añadir contacto') },
    ] as const satisfies FABMenuProps['items'];
    const items = sixActions ? allItems : ([allItems[0], allItems[1]] as const);
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID="md-action-playground">
            <View
                style={{
                    paddingHorizontal: 24,
                    paddingTop: 12,
                    paddingBottom: 16,
                    gap: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.outlineVariant,
                }}
                testID="md-action-configuration"
            >
                <Button
                    style={{ alignSelf: 'flex-start' }}
                    variant="text"
                    icon="tune"
                    accessibilityState={{ expanded: configurationOpen }}
                    onPress={() => {
                        setExpandedMenu(false);
                        setColorMenu(false);
                        setConfigurationOpen((value) => !value);
                    }}
                    testID="md-action-configuration-toggle"
                >
                    Configuración del ejemplo
                </Button>
                {configurationOpen ? (
                    <>
                        <ButtonGroup
                            variant="connected"
                            value={size}
                            onValueChange={(value) => {
                                setExpandedMenu(false);
                                setSize(value as FABSize);
                            }}
                            items={sizes}
                            showSelectedIcon={false}
                            testID="md-action-size"
                        />
                        <Menu
                            visible={colorMenu}
                            onDismiss={() => setColorMenu(false)}
                            anchor={
                                <Button
                                    variant="outlined"
                                    onPress={() => {
                                        setExpandedMenu(false);
                                        setColorMenu(true);
                                    }}
                                    testID="md-action-color"
                                >
                                    Color: {colors.find((color) => color.value === variant)?.label}
                                </Button>
                            }
                        >
                            {colors.map((color) => (
                                <Menu.Item
                                    key={color.value}
                                    title={color.label}
                                    trailingIcon={variant === color.value ? 'check' : undefined}
                                    onPress={() => {
                                        setVariant(color.value);
                                        setColorMenu(false);
                                    }}
                                />
                            ))}
                        </Menu>
                        {isExtended ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Text>Con icono</Text>
                                <Switch
                                    value={withIcon}
                                    onValueChange={setWithIcon}
                                    accessibilityLabel="Incluir icono en el FAB extendido"
                                />
                            </View>
                        ) : isMenu ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Text>Seis acciones relacionadas</Text>
                                <Switch
                                    value={sixActions}
                                    onValueChange={(next) => {
                                        setExpandedMenu(false);
                                        setSixActions(next);
                                    }}
                                    accessibilityLabel="Mostrar seis acciones del menú FAB"
                                />
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Text>Visible</Text>
                                <Switch value={visible} onValueChange={setVisible} accessibilityLabel="Mostrar el FAB" />
                            </View>
                        )}
                    </>
                ) : null}
            </View>
            <View style={{ flex: 1 }} testID="md-action-viewport">
                <Animated.ScrollView
                    onScroll={isExtended ? onScroll : undefined}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingTop: 24, paddingHorizontal: 24, paddingBottom: insets.bottom + 136 }}
                    testID="md-action-list"
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    <Text variant="headlineSmall">Mi biblioteca</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, marginBottom: 16 }}>
                        {isExtended
                            ? 'Desplaza hacia abajo para contraer la etiqueta y hacia arriba o hasta el final para expandirla.'
                            : isMenu
                              ? 'Crear reúne las acciones para añadir contenido a esta biblioteca. Si falta altura, sus opciones se desplazan detrás del cierre.'
                              : 'La acción principal permanece en su posición mientras desplazas la biblioteca.'}
                    </Text>
                    {Array.from({ length: 24 }, (_, index) => (
                        <List.Item
                            key={index}
                            title={index === 0 ? workspace.document.title : `Documento ${index + 1}`}
                            description={index === 0 ? workspace.document.body : 'Borrador de la biblioteca'}
                            leading={<Icon source="file-document-outline" size={24} />}
                            onPress={() => workspace.open('preview', index === 0 ? workspace.document.title : `Documento ${index + 1}`)}
                        />
                    ))}
                </Animated.ScrollView>
                {isMenu ? (
                    <FAB.Menu
                        expanded={expandedMenu}
                        onDismiss={() => setExpandedMenu(false)}
                        trigger={{
                            icon: 'plus',
                            size,
                            variant,
                            onPress: () => setExpandedMenu(true),
                            accessibilityLabel: label,
                            testID: 'md-fab-menu-trigger',
                        }}
                        items={items}
                        testID="md-fab-menu"
                    />
                ) : (
                    <View
                        pointerEvents={workspace.editorTransitionOrigin ? 'none' : 'box-none'}
                        accessibilityElementsHidden={!!workspace.editorTransitionOrigin}
                        importantForAccessibility={workspace.editorTransitionOrigin ? 'no-hide-descendants' : 'auto'}
                        style={{
                            position: 'absolute',
                            opacity: workspace.editorTransitionOrigin ? 0 : 1,
                            bottom: insets.bottom + margin,
                            ...(leftAligned ? { left: insets.left + margin } : { right: insets.right + margin }),
                        }}
                    >
                        {isExtended ? (
                            <FAB.Extended
                                ref={fabRef}
                                size={size}
                                variant={variant}
                                icon={withIcon ? 'pencil' : undefined}
                                label={label}
                                expanded={expandedLabel}
                                onPress={create}
                                testID="md-extended-fab"
                            />
                        ) : (
                            <Tooltip title={label}>
                                <FAB
                                    ref={fabRef}
                                    size={size}
                                    variant={variant}
                                    visible={visible}
                                    icon="edit_fill1"
                                    accessibilityLabel={label}
                                    onPress={create}
                                    testID="md-floating-fab"
                                />
                            </Tooltip>
                        )}
                    </View>
                )}
            </View>
            {workspace.panel}
        </View>
    );
}
