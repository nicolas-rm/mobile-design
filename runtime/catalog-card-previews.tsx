import {
    BottomSheet,
    Divider,
    IconButton,
    List,
    MaterialSymbol,
    Menu,
    MobileDesignProvider,
    NavigationBar,
    NavigationDrawer,
    NavigationRail,
    RadioButton,
    RichTooltip,
    SearchView,
    SideSheet,
    Slider,
    Snackbar,
    Switch,
    Tabs,
    Text,
    TextField,
    Toolbar,
    useMobileTheme,
} from 'mobile-design';
import { View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useRuntimeEnvironment } from './environment';
import {
    CatalogFeaturePopup,
    CatalogFeatureSample,
    featurePopupTitles,
    featurePreviewIds,
    isFeaturePreview,
} from './catalog-feature-samples';

export const popupPreviewTitles = { menus: 'Menus', tooltips: 'Tooltips', ...featurePopupTitles };
type PopupPreviewId = keyof typeof popupPreviewTitles;
export const isCatalogPopupPreview = (id: string): id is PopupPreviewId => Object.hasOwn(popupPreviewTitles, id);
const previewIds = [
    'lists',
    'navigation-bar',
    'navigation-drawer',
    'navigation-rail',
    'radio-button',
    'search',
    'bottom-sheets',
    'side-sheets',
    'sliders',
    'snackbar',
    'switch',
    'tabs',
    'text-fields',
    'toolbars',
    ...featurePreviewIds,
] as const;
type InlinePreviewId = (typeof previewIds)[number];
type PreviewId = InlinePreviewId | PopupPreviewId;
const previewIdSet = new Set<string>(previewIds);
const zeroInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const bottomSheetSnapPoints = [104];
const noop = () => {};
const tracks = [
    { title: 'Long Walk', artist: 'L. R. Coleman' },
    { title: 'In the Dark', artist: 'Sole R. Rey' },
];
const barDestinations = [
    { key: 'home', label: 'Inicio', icon: 'home' },
    { key: 'explore', label: 'Explorar', icon: 'search' },
    { key: 'library', label: 'Biblioteca', icon: 'library_music' },
];
const sideDestinations = [barDestinations[0], { key: 'saved', label: 'Listas', icon: 'bookmark' }];
const menuActions = [
    { label: 'Editar', icon: 'edit' },
    { label: 'Compartir', icon: 'share' },
    { label: 'Descargar', icon: 'download' },
];
const musicTabs = [
    { key: 'music', label: 'Música', icon: 'music_note' },
    { key: 'radio', label: 'Radio', icon: 'headphones' },
    { key: 'saved', label: 'Listas', icon: 'bookmark' },
];
const toolbarActions = [
    { key: 'edit', label: 'Editar', icon: 'edit', selected: true, onPress: noop },
    { key: 'favorite', label: 'Favorito', icon: 'favorite', onPress: noop },
    { key: 'share', label: 'Compartir', icon: 'share', onPress: noop },
    { key: 'more', label: 'Más opciones', icon: 'more_horiz', onPress: noop },
];

export function hasCatalogCardPreview(id: string): id is PreviewId {
    return previewIdSet.has(id) || isCatalogPopupPreview(id);
}

function ComponentSample({ component }: { component: InlinePreviewId }) {
    const { colors } = useMobileTheme();
    const testID = 'catalog-' + component + '-preview';
    const surface = { backgroundColor: colors.surface, borderRadius: 20, padding: 16 };
    if (isFeaturePreview(component)) return <CatalogFeatureSample component={component} />;
    switch (component) {
        case 'lists':
            return (
                <View testID={testID}>
                    <List.Group>
                        {tracks.map(({ title, artist }) => (
                            <List.Item
                                key={title}
                                title={title}
                                description={artist}
                                lines={2}
                                leading={
                                    <View
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 12,
                                            backgroundColor: colors.primaryContainer,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <MaterialSymbol name="music_note" size={24} color={colors.onPrimaryContainer} />
                                    </View>
                                }
                                trailing={<IconButton icon="play_arrow" accessibilityLabel={`Reproducir ${title}`} onPress={noop} />}
                            />
                        ))}
                    </List.Group>
                </View>
            );
        case 'navigation-bar':
            return (
                <NavigationBar
                    variant="short"
                    items={barDestinations}
                    value="home"
                    onValueChange={noop}
                    safeArea={false}
                    style={{ borderRadius: 18, overflow: 'hidden' }}
                    testID={testID}
                />
            );
        case 'navigation-drawer':
        case 'navigation-rail':
            return (
                <View style={{ height: 152, flexDirection: 'row', borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface }}>
                    {component === 'navigation-drawer' ? (
                        <NavigationDrawer
                            items={sideDestinations}
                            value="home"
                            onValueChange={noop}
                            width={152}
                            style={{ backgroundColor: colors.surfaceContainerLow }}
                            testID={testID}
                        />
                    ) : (
                        <NavigationRail
                            items={sideDestinations}
                            value="home"
                            onValueChange={noop}
                            labelVisibility="none"
                            alignment="center"
                            style={{ paddingTop: 0, backgroundColor: colors.surfaceContainerLow }}
                            testID={testID}
                        />
                    )}
                    <View style={{ flex: 1, minWidth: 0, gap: 8, padding: 12, justifyContent: 'center' }}>
                        <Text variant="titleSmall">Inicio</Text>
                        <Divider />
                        <Text variant="bodySmall">Tu música.</Text>
                    </View>
                </View>
            );
        case 'radio-button':
            return (
                <View style={surface}>
                    <RadioButton.Group value="standard" onValueChange={noop} accessibilityLabel="Calidad de audio" testID={testID}>
                        <RadioButton.Item position="leading" value="standard" label="Estándar" />
                        <RadioButton.Item position="leading" value="high" label="Alta calidad" />
                    </RadioButton.Group>
                </View>
            );
        case 'search':
            return (
                <SearchView
                    open={false}
                    onOpenChange={noop}
                    value=""
                    onChangeText={noop}
                    onSearch={noop}
                    leadingIcon="search"
                    placeholder="Buscar música"
                    testID={testID}
                />
            );
        case 'bottom-sheets':
            return (
                <View style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}>
                    <View style={{ flex: 1, backgroundColor: colors.surface, padding: 16 }}>
                        <Text variant="labelLarge">Biblioteca</Text>
                    </View>
                    <BottomSheet
                        variant="standard"
                        open
                        onOpenChange={noop}
                        dismissible={false}
                        draggable={false}
                        snapPoints={bottomSheetSnapPoints}
                        testID={testID}
                    >
                        <View style={{ paddingHorizontal: 20, gap: 4 }}>
                            <Text variant="titleMedium">Tu colección</Text>
                            <Text variant="bodySmall">Música para acompañar el día.</Text>
                        </View>
                    </BottomSheet>
                </View>
            );
        case 'side-sheets':
            return (
                <View
                    style={{
                        height: 152,
                        flexDirection: 'row',
                        overflow: 'hidden',
                        borderRadius: 20,
                        backgroundColor: colors.surfaceContainerLow,
                    }}
                >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minWidth: 0 }}>
                        <IconButton icon="library_music" accessibilityLabel="Biblioteca" />
                    </View>
                    <SideSheet
                        variant="standard"
                        open
                        onOpenChange={noop}
                        dismissible={false}
                        draggable={false}
                        showCloseButton={false}
                        width={144}
                        edge="end"
                        style={{ backgroundColor: colors.surfaceContainerHighest }}
                        header={
                            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                                <Text variant="titleMedium">Tu colección</Text>
                            </View>
                        }
                        testID={testID}
                    >
                        <Text variant="bodySmall" style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                            Información y detalles
                        </Text>
                    </SideSheet>
                </View>
            );
        case 'sliders':
            return (
                <View style={surface}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text variant="labelMedium">Volumen</Text>
                        <Text variant="labelMedium">40 %</Text>
                    </View>
                    <Slider
                        value={40}
                        minimumValue={0}
                        maximumValue={100}
                        length={176}
                        size="sm"
                        valueIndicator="never"
                        onValueChange={noop}
                        accessibilityLabel="Volumen"
                        style={{ alignSelf: 'center' }}
                        testID={testID}
                    />
                </View>
            );
        case 'snackbar':
            return (
                <Snackbar
                    visible
                    onDismiss={noop}
                    focusShortcut={false}
                    action={{ label: 'Deshacer', onPress: noop }}
                    wrapperStyle={{ position: 'relative', left: 0, right: 0, bottom: 0 }}
                    testID={testID}
                >
                    Colección guardada
                </Snackbar>
            );
        case 'switch':
            return (
                <View style={{ ...surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <Text variant="bodyMedium" style={{ flex: 1 }}>
                        Descargar con Wi-Fi
                    </Text>
                    <Switch value onValueChange={noop} accessibilityLabel="Descargar con Wi-Fi" testID={testID} />
                </View>
            );
        case 'tabs':
            return (
                <View style={{ backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden' }}>
                    <Tabs items={musicTabs} value="music" onValueChange={noop} variant="primary" testID={testID} />
                    <View style={{ padding: 16 }}>
                        <Text variant="bodyMedium">Tu música, a tu ritmo.</Text>
                    </View>
                </View>
            );
        case 'text-fields':
            return (
                <TextField
                    label="Tu colección"
                    variant="outlined"
                    value="Favoritos"
                    onChangeText={noop}
                    readOnly
                    style={{ backgroundColor: colors.surface }}
                    testID={testID}
                />
            );
        case 'toolbars':
            return (
                <Toolbar
                    actions={toolbarActions}
                    variant="floating"
                    color="standard"
                    elevation={0}
                    safeArea={false}
                    style={{ alignSelf: 'center' }}
                    testID={testID}
                />
            );
    }
}

export function CatalogCardPreview({ component, previewUrl }: { component: PreviewId; previewUrl?: string }) {
    return (
        <div className="catalog-component-preview" aria-hidden="true" inert>
            {isCatalogPopupPreview(component) ? (
                <iframe
                    data-catalog-popup-preview={component}
                    src={previewUrl}
                    title={'Vista previa de ' + popupPreviewTitles[component]}
                    tabIndex={-1}
                    loading="lazy"
                />
            ) : (
                <div className="catalog-component-sample">
                    <SafeAreaInsetsContext.Provider value={zeroInsets}>
                        <GestureHandlerRootView style={{ height: '100%', justifyContent: 'center' }}>
                            <ComponentSample component={component} />
                        </GestureHandlerRootView>
                    </SafeAreaInsetsContext.Provider>
                </div>
            )}
        </div>
    );
}

// A dedicated viewport contains the package's portal and its focus management.
export function CatalogPopupPreviewRuntime({ component }: { component: PopupPreviewId }) {
    const { width, height } = useWindowDimensions();
    const { colorScheme, reduced } = useRuntimeEnvironment();
    const menuWidth = Math.min(184, width - 16);
    const feature = component !== 'menus' && component !== 'tooltips';
    return (
        <MobileDesignProvider
            colorScheme={colorScheme}
            reduceMotion={reduced ? 'on' : 'auto'}
            theme={feature ? { colors: { scrim: 'transparent' } } : undefined}
        >
            <SafeAreaInsetsContext.Provider value={zeroInsets}>
                {feature ? (
                    <CatalogFeaturePopup component={component} height={height} />
                ) : component === 'menus' ? (
                    <Menu
                        visible
                        onDismiss={noop}
                        placement="overlap"
                        width={menuWidth}
                        anchor={{ x: (width - menuWidth) / 2, y: 16 }}
                        testID="catalog-menus-preview"
                    >
                        {menuActions.map(({ label, icon }) => (
                            <Menu.Item key={icon} title={label} leadingIcon={icon} onPress={noop} />
                        ))}
                    </Menu>
                ) : (
                    <View style={{ height, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 }}>
                        <View>
                            <RichTooltip
                                visible
                                persistent={false}
                                anchorPosition="top"
                                title="Escucha sin conexión"
                                maxWidth={228}
                                anchor={<IconButton icon="info" accessibilityLabel="Ayuda" onPress={noop} />}
                                actions={[{ key: 'done', label: 'Entendido', onPress: noop }]}
                                testID="catalog-tooltips-preview"
                            >
                                Guarda tus colecciones para escucharlas después.
                            </RichTooltip>
                        </View>
                    </View>
                )}
            </SafeAreaInsetsContext.Provider>
        </MobileDesignProvider>
    );
}
