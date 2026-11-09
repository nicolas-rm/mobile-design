import {
    BadgedBox,
    Button,
    ButtonGroup,
    Card,
    Carousel,
    Checkbox,
    Chip,
    DatePicker,
    Dialog,
    Divider,
    ExtendedFAB,
    FAB,
    FABMenu,
    IconButton,
    List,
    SegmentedButtons,
    SplitButton,
    Text,
    TimePicker,
    TopAppBar,
    useMobileTheme,
} from 'mobile-design/react-native-web';
import { MaterialSymbol } from '@mobile-design/icons/react-native-web';
import { View } from 'react-native';

export const featurePreviewIds = [
    'app-bars',
    'badges',
    'button-groups',
    'buttons',
    'extended-fab',
    'floating-action-button',
    'icon-buttons',
    'segmented-buttons',
    'split-button',
    'cards',
    'carousel',
    'checkbox',
    'chips',
    'divider',
] as const;
type FeaturePreviewId = (typeof featurePreviewIds)[number];
const featurePreviews = new Set<string>(featurePreviewIds);
export const isFeaturePreview = (id: string): id is FeaturePreviewId => featurePreviews.has(id);

export const featurePopupTitles = {
    'fab-menu': 'FAB menu',
    'date-pickers': 'Date pickers',
    'time-pickers': 'Time pickers',
    dialogs: 'Dialogs',
} as const;
type FeaturePopupId = keyof typeof featurePopupTitles;
const noop = () => {};
const carouselItems = [
    { id: 'mountain', title: 'Montaña', icon: 'location_on' as const },
    { id: 'coast', title: 'Costa', icon: 'music_note' as const },
    { id: 'forest', title: 'Bosque', icon: 'park' as const },
];
const cardVariants = ['elevated', 'filled', 'outlined'] as const;
const selectedDate = new Date(2026, 10, 3);
const selectedTime = { hours: 15, minutes: 45 };

export function CatalogFeatureSample({ component }: { component: FeaturePreviewId }) {
    const { colors } = useMobileTheme();
    const testID = 'catalog-' + component + '-preview';
    const surface = { backgroundColor: colors.surface, borderRadius: 20 };
    const row = { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8 };
    switch (component) {
        case 'app-bars':
            return (
                <View style={{ ...surface, overflow: 'hidden' }} testID={testID}>
                    <TopAppBar
                        title="Tu biblioteca"
                        statusBarHeight={0}
                        navigationIcon="arrow_back"
                        navigationLabel="Volver"
                        onNavigationPress={noop}
                        actions={[{ key: 'search', icon: 'search', label: 'Buscar', onPress: noop }]}
                    />
                    <Text variant="headlineSmall" style={{ padding: 16 }}>
                        Tu música
                    </Text>
                </View>
            );
        case 'badges':
            return (
                <View style={{ ...row, gap: 20 }} testID={testID}>
                    {(
                        [
                            { icon: 'mail', badge: 8 },
                            { icon: 'notifications', badge: 99 },
                            { icon: 'bookmark', badge: true },
                        ] as const
                    ).map(({ icon, badge }) => (
                        <BadgedBox key={icon} badge={badge}>
                            <MaterialSymbol name={icon} size={24} color={colors.onSurface} />
                        </BadgedBox>
                    ))}
                </View>
            );
        case 'button-groups':
            return (
                <ButtonGroup
                    variant="connected"
                    size="extra-small"
                    value="week"
                    onValueChange={noop}
                    showSelectedIcon
                    items={[
                        { value: 'day', label: 'Día' },
                        { value: 'week', label: 'Semana' },
                        { value: 'month', label: 'Mes' },
                    ]}
                    testID={testID}
                />
            );
        case 'buttons':
            return (
                <View style={{ gap: 4 }} testID={testID}>
                    <View style={{ ...row, flexWrap: 'wrap', rowGap: 0 }}>
                        <Button size="extra-small" variant="filled" icon="bookmark" onPress={noop}>
                            Guardar
                        </Button>
                        <Button size="extra-small" variant="tonal" onPress={noop}>
                            Explorar
                        </Button>
                        <Button size="extra-small" variant="outlined" onPress={noop}>
                            Compartir
                        </Button>
                    </View>
                    <View style={row}>
                        <Button size="small" variant="filled" icon="play_arrow" onPress={noop}>
                            Reproducir
                        </Button>
                        <Button size="extra-small" variant="text" onPress={noop}>
                            Más tarde
                        </Button>
                    </View>
                </View>
            );
        case 'extended-fab':
            return <ExtendedFAB icon="add" label="Nueva tarea" style={{ alignSelf: 'center' }} onPress={noop} testID={testID} />;
        case 'floating-action-button':
            return (
                <View style={{ ...row, gap: 4 }} testID={testID}>
                    <FAB icon="edit" accessibilityLabel="Editar" variant="tonalSecondary" onPress={noop} />
                    <FAB icon="edit" accessibilityLabel="Editar" size="medium" onPress={noop} />
                    <FAB icon="edit" accessibilityLabel="Editar" size="large" variant="tonalTertiary" onPress={noop} />
                </View>
            );
        case 'icon-buttons':
            return (
                <View style={row} testID={testID}>
                    <IconButton icon="favorite" accessibilityLabel="Favorito" mode="contained-tonal" onPress={noop} />
                    <IconButton icon="bookmark" accessibilityLabel="Guardar" onPress={noop} />
                    <IconButton icon="share" accessibilityLabel="Compartir" mode="outlined" onPress={noop} />
                </View>
            );
        case 'segmented-buttons':
            return (
                <SegmentedButtons
                    value="walk"
                    onValueChange={noop}
                    testID={testID}
                    buttons={[
                        { value: 'walk', label: 'A pie' },
                        { value: 'bike', label: 'Bici' },
                        { value: 'car', label: 'Auto' },
                    ]}
                />
            );
        case 'split-button':
            return (
                <View style={row}>
                    <SplitButton
                        label="Enviar"
                        variant="filled"
                        size="small"
                        icon="send"
                        onPress={noop}
                        menuAccessibilityLabel="Opciones de envío"
                        actions={[{ key: 'later', label: 'Programar envío', onPress: noop }]}
                        testID={testID}
                    />
                </View>
            );
        case 'cards':
            return (
                <View style={row} testID={testID}>
                    {cardVariants.map((variant) => (
                        <Card key={variant} variant={variant} style={{ flex: 1, minWidth: 0 }}>
                            <View style={{ minHeight: 88, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <MaterialSymbol name="music_note" size={24} color={colors.onSurface} />
                                <Text variant="labelSmall" style={{ textTransform: 'capitalize' }}>
                                    {variant}
                                </Text>
                            </View>
                        </Card>
                    ))}
                </View>
            );
        case 'carousel':
            return (
                <Carousel
                    items={carouselItems}
                    variant="multi-browse"
                    height={148}
                    preferredItemWidth={148}
                    contentPadding={0}
                    showControls={false}
                    showText
                    style={{ backgroundColor: 'transparent' }}
                    testID={testID}
                />
            );
        case 'checkbox':
            return (
                <View style={{ ...surface, padding: 8 }} testID={testID}>
                    <Checkbox.Item label="Descargar con Wi-Fi" position="leading" status="checked" onPress={noop} />
                    <Checkbox.Item label="Incluir podcasts" position="leading" status="unchecked" onPress={noop} />
                </View>
            );
        case 'chips':
            return (
                <View style={{ ...row, flexWrap: 'wrap' }} testID={testID}>
                    <Chip variant="filter" selected onPress={noop}>
                        Para ti
                    </Chip>
                    <Chip variant="filter" onPress={noop}>
                        Descargadas
                    </Chip>
                    <Chip variant="filter" onPress={noop}>
                        Favoritas
                    </Chip>
                </View>
            );
        case 'divider':
            return (
                <View style={{ ...surface, overflow: 'hidden' }}>
                    <List.Item
                        variant="baseline"
                        title="Tu biblioteca"
                        leading={<MaterialSymbol name="folder" size={24} color={colors.onSurfaceVariant} />}
                    />
                    <Divider style={{ marginHorizontal: 16 }} testID={testID} />
                    <List.Item
                        variant="baseline"
                        title="Colecciones guardadas"
                        leading={<MaterialSymbol name="bookmark" size={24} color={colors.onSurfaceVariant} />}
                    />
                </View>
            );
    }
}

export function CatalogFeaturePopup({ component, height }: { component: FeaturePopupId; height: number }) {
    const testID = 'catalog-' + component + '-preview';
    switch (component) {
        case 'fab-menu':
            return (
                <View style={{ height, width: '100%' }}>
                    <FABMenu
                        expanded
                        presentation="expressive"
                        onDismiss={noop}
                        trigger={{ icon: 'add', accessibilityLabel: 'Crear', onPress: noop }}
                        items={[
                            { key: 'note', label: 'Crear nota', icon: 'edit', onPress: noop },
                            { key: 'folder', label: 'Crear carpeta', icon: 'folder', onPress: noop },
                            { key: 'import', label: 'Importar', icon: 'download', onPress: noop },
                        ]}
                        testID={testID}
                    />
                </View>
            );
        case 'date-pickers':
            return (
                <DatePicker
                    mode="single"
                    visible
                    value={selectedDate}
                    locale="es-MX"
                    firstDayOfWeek={1}
                    onChange={noop}
                    onDismiss={noop}
                    testID={testID}
                />
            );
        case 'time-pickers':
            return (
                <TimePicker
                    visible
                    value={selectedTime}
                    initialDisplayMode="input"
                    is24Hour={false}
                    title="Selecciona la hora"
                    hourLabel="Hora"
                    minuteLabel="Minuto"
                    cancelLabel="Cancelar"
                    confirmLabel="Aceptar"
                    onConfirm={noop}
                    onDismiss={noop}
                    testID={testID}
                />
            );
        case 'dialogs':
            return (
                <Dialog visible onDismiss={noop} testID={testID}>
                    <Dialog.Icon icon="delete" />
                    <Dialog.Title>¿Eliminar descarga?</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">Podrás descargarla de nuevo cuando quieras.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button variant="text" onPress={noop}>
                            Cancelar
                        </Button>
                        <Button variant="text" onPress={noop}>
                            Eliminar
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            );
    }
}
