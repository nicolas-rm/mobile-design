import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { AccessibilityInfo, FlatList, Image, ScrollView, View, useWindowDimensions, type ViewInstance } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { useLocale } from 'react-native-paper';
import {
    Avatar,
    Button,
    Card,
    Checkbox,
    Chip,
    Dialog,
    Divider,
    FullScreenDialog,
    Icon,
    IconButton,
    Menu,
    Portal,
    Slider,
    Snackbar,
    Switch,
    Text,
    TextField,
    SwipeListGroup,
    SwipeListItem,
    useMobileTheme,
} from 'mobile-design/react-native';

type Props = { onEvent: (message: string) => void; onOpenPlayground?: () => void };
type Journey = { id: string; title: string; category: string; description: string; saved: boolean; date: number };
const artwork = require('../../assets/images/welcome-wallpaper.png');
const initialJourneys: readonly Journey[] = [
    {
        id: 'mountain',
        title: 'Senderos de montaña',
        category: 'Naturaleza',
        description: 'Una ruta al aire libre con miradores y caminos de piedra.',
        saved: false,
        date: 3,
    },
    {
        id: 'museum',
        title: 'Museos del centro',
        category: 'Cultura',
        description: 'Arquitectura, exposiciones y una pausa en el centro histórico.',
        saved: false,
        date: 1,
    },
    {
        id: 'coast',
        title: 'Recorrido por la costa',
        category: 'Naturaleza',
        description: 'Playas tranquilas y senderos junto al mar.',
        saved: true,
        date: 2,
    },
    {
        id: 'food',
        title: 'Sabores de la ciudad',
        category: 'Gastronomía',
        description: 'Un paseo por mercados y cocinas de la región.',
        saved: false,
        date: 4,
    },
];
const titleForMode = { elevated: 'Elevated', contained: 'Filled', outlined: 'Outlined' } as const;
const line = { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' } as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={{ gap: 16 }}>
            <Text variant="titleMedium" accessibilityRole="header">
                {title}
            </Text>
            {children}
        </View>
    );
}

function VariantCardContent({ mode, item }: { mode: keyof typeof titleForMode; item: Journey }) {
    return (
        <>
            <Card.Cover source={artwork} accessibilityLabel="Ilustración del catálogo" />
            <Card.Title
                title={titleForMode[mode]}
                subtitle={item.title}
                left={(props) => <Avatar.Icon {...props} icon="image-outline" />}
            />
            <Card.Content>
                <Text style={{ marginBottom: 16 }}>{item.description}</Text>
            </Card.Content>
        </>
    );
}

function JourneyDetails({
    journey,
    onClose,
    onSave,
    transitionOrigin,
    onClosed,
}: {
    journey?: Journey;
    onClose: () => void;
    onSave: () => void;
    transitionOrigin?: ComponentProps<typeof FullScreenDialog>['transitionOrigin'];
    onClosed?: () => void;
}) {
    const retained = useRef<Journey | undefined>(journey);
    if (journey) retained.current = journey;
    const displayed = journey ?? retained.current;
    return (
        <FullScreenDialog
            title={displayed?.title ?? 'Detalle'}
            visible={!!journey}
            onDismiss={onClose}
            onClosed={() => {
                retained.current = undefined;
                onClosed?.();
            }}
            transitionOrigin={transitionOrigin}
            testID="md-card-details"
        >
            {displayed ? (
                <View style={{ gap: 16 }}>
                    <Image
                        source={artwork}
                        accessibilityLabel="Ilustración de la colección"
                        style={{ width: '100%', height: 200, borderRadius: 12 }}
                    />
                    <Text variant="headlineMedium">{displayed.title}</Text>
                    <Text variant="labelLarge">{displayed.category}</Text>
                    <Text variant="bodyLarge">{displayed.description}</Text>
                    <Text>
                        El recorrido reúne paradas cercanas. Guarda esta colección para volver a consultarla; la selección se conserva al
                        regresar a la lista de esta pantalla.
                    </Text>
                    <Button
                        style={{ alignSelf: 'flex-start' }}
                        icon={displayed.saved ? 'bookmark' : 'bookmark-outline'}
                        onPress={onSave}
                        testID="md-card-details-save"
                    >
                        {displayed.saved ? 'Quitar guardado' : 'Guardar colección'}
                    </Button>
                </View>
            ) : null}
        </FullScreenDialog>
    );
}

/** Network media is opt-in; useVideoPlayer owns native disposal and event subscriptions. */
function VideoCard() {
    const player = useVideoPlayer(null);
    const { status, error } = useEvent(player, 'statusChange', { status: player.status, error: undefined });
    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
    const [requested, setRequested] = useState(false);
    const [requestError, setRequestError] = useState('');
    const alive = useRef(true),
        pending = useRef(false);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    const play = async () => {
        if (pending.current) return;
        if (requested && status === 'readyToPlay') {
            if (isPlaying) player.pause();
            else player.play();
            return;
        }
        pending.current = true;
        setRequestError('');
        setRequested(true);
        try {
            // The same public sample used by Expo's versioned Video documentation.
            await player.replaceAsync('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
            if (alive.current) player.play();
        } catch {
            if (alive.current) setRequestError('No se pudo cargar el video. Revisa la conexión e inténtalo nuevamente.');
        } finally {
            pending.current = false;
        }
    };
    return (
        <Card variant="outlined" testID="md-card-video">
            <Card.Title title="Media: video" subtitle="Big Buck Bunny · muestra pública de Expo" />
            {requested ? (
                <VideoView
                    player={player}
                    nativeControls
                    contentFit="contain"
                    surfaceType="textureView"
                    fullscreenOptions={{ enable: true }}
                    style={{ width: '100%', aspectRatio: 16 / 9 }}
                    testID="md-card-video-player"
                />
            ) : (
                <Image source={artwork} accessibilityLabel="Ilustración previa al video" style={{ width: '100%', height: 160 }} />
            )}
            <Card.Content>
                <Text variant="bodySmall">El video se carga por internet cuando pulsas reproducir. No inicia automáticamente.</Text>
                {requestError || error ? (
                    <Text accessibilityLiveRegion="polite">
                        {requestError || 'No se pudo reproducir el video. Puedes volver a intentarlo.'}
                    </Text>
                ) : null}
            </Card.Content>
            <Card.Actions>
                <Button
                    variant="text"
                    icon={isPlaying ? 'pause' : 'play'}
                    disabled={status === 'loading'}
                    loading={status === 'loading'}
                    onPress={play}
                    testID="md-card-video-play"
                >
                    {isPlaying ? 'Pausar' : status === 'error' || requestError ? 'Reintentar video' : 'Reproducir'}
                </Button>
            </Card.Actions>
        </Card>
    );
}

/** Guidelines examples: optional anatomy, real independent controls and coplanar collections. */
export function CardExamples({ onEvent, onOpenPlayground }: Props) {
    const theme = useMobileTheme();
    const { width } = useWindowDimensions();
    const rtl = useLocale().direction === 'rtl';
    const [disabled, setDisabled] = useState(false),
        [selected, setSelected] = useState(false);
    const [records, setRecords] = useState<Journey[]>(() => initialJourneys.map((item) => ({ ...item })));
    const [variantRecords, setVariantRecords] = useState<Journey[]>(() =>
        initialJourneys.slice(0, 3).map((item) => ({ ...item, id: `variant-${item.id}` }))
    );
    const [detail, setDetail] = useState<string>();
    const [detailOrigin, setDetailOrigin] = useState<ComponentProps<typeof FullScreenDialog>['transitionOrigin']>();
    const [detailSource, setDetailSource] = useState<string>();
    const detailAnchors = useRef(new Map<string, ViewInstance>()),
        detailRequest = useRef(0);
    const detailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(
        () => () => {
            detailRequest.current++;
            if (detailTimer.current) clearTimeout(detailTimer.current);
        },
        []
    );
    const openDetail = (id: string, backgroundColor = theme.colors.surface, content?: ReactNode) => {
        const request = ++detailRequest.current;
        if (detailTimer.current) clearTimeout(detailTimer.current);
        const anchor = detailAnchors.current.get(id);
        let resolved = false;
        const deliver = (origin?: ComponentProps<typeof FullScreenDialog>['transitionOrigin']) => {
            if (resolved || request !== detailRequest.current) return;
            resolved = true;
            if (detailTimer.current) clearTimeout(detailTimer.current);
            detailTimer.current = null;
            setDetailOrigin(origin);
            setDetailSource(id);
            setDetail(id);
        };
        if (!anchor?.measureInWindow) {
            deliver();
            return;
        }
        // A missing native measurement must not consume the action indefinitely.
        detailTimer.current = setTimeout(() => deliver(), 250);
        try {
            anchor.measureInWindow((x, y, width, height) =>
                deliver(width > 0 && height > 0 ? { x, y, width, height, borderRadius: 12, backgroundColor, content } : undefined)
            );
        } catch {
            deliver();
        }
    };
    const [menu, setMenu] = useState<string>();
    const pendingRename = useRef<{ id: string; title: string } | undefined>(undefined);
    const [editing, setEditing] = useState<string>(),
        [draftTitle, setDraftTitle] = useState('');
    const [layout, setLayout] = useState<'grid' | 'vertical' | 'horizontal' | 'mosaic' | 'staggered'>('vertical');
    const [filter, setFilter] = useState('Todas'),
        [sort, setSort] = useState<'date' | 'name'>('date');
    const [rating, setRating] = useState(3),
        [duration, setDuration] = useState(45),
        [category, setCategory] = useState('Naturaleza');
    const [applied, setApplied] = useState({ rating: 3, duration: 45, category: 'Naturaleza' });
    const [expanded, setExpanded] = useState(false);
    const [removed, setRemoved] = useState<{ item: Journey; index: number }>();
    const nextId = useRef(1);
    const save = (id: string) => setRecords((items) => items.map((item) => (item.id === id ? { ...item, saved: !item.saved } : item)));
    const duplicate = (id: string) => {
        const item = records.find((candidate) => candidate.id === id);
        if (!item) return;
        const copy = {
            ...item,
            id: `copy-${nextId.current++}`,
            title: `${item.title} · copia`,
            date: Math.max(...records.map((record) => record.date)) + 1,
        };
        setRecords((items) => [...items, copy]);
        setMenu(undefined);
        onEvent('La copia se añadió a la colección de tarjetas.');
    };
    const archive = (id: string) => {
        const index = records.findIndex((item) => item.id === id);
        if (index < 0) return;
        setRemoved({ item: records[index], index });
        setRecords((items) => items.filter((item) => item.id !== id));
        setMenu(undefined);
        onEvent('Colección archivada. Deshacer la devuelve a su posición.');
    };
    const visible = records
        .filter((item) => filter === 'Todas' || item.category === filter)
        .sort((a, b) => (sort === 'date' ? b.date - a.date : a.title.localeCompare(b.title)));
    const dirty = applied.rating !== rating || applied.duration !== duration || applied.category !== category;
    const card = (item: Journey, index: number, collectionLayout = layout) => (
        <Card
            variant="outlined"
            key={item.id}
            ref={(node) => {
                if (node) detailAnchors.current.set(item.id, node as unknown as ViewInstance);
                else detailAnchors.current.delete(item.id);
            }}
            pointerEvents={detailSource === item.id ? 'none' : 'auto'}
            accessibilityElementsHidden={detailSource === item.id}
            importantForAccessibility={detailSource === item.id ? 'no-hide-descendants' : 'auto'}
            style={{ flex: 1, opacity: detailSource === item.id ? 0 : 1 }}
            testID={`md-card-collection-${item.id}`}
        >
            {collectionLayout === 'horizontal' ||
            (collectionLayout === 'mosaic' && index === 0) ||
            (collectionLayout === 'staggered' && index % 2 === 0) ? (
                <Image
                    source={artwork}
                    accessibilityLabel={`Ilustración de ${item.title}`}
                    style={{ width: '100%', height: collectionLayout === 'mosaic' ? 160 : 112 }}
                />
            ) : null}
            <Card.Title
                title={item.title}
                titleNumberOfLines={2}
                subtitle={item.category}
                right={() => (
                    <Menu
                        visible={menu === item.id}
                        onDismiss={() => setMenu(undefined)}
                        onClosed={() => {
                            const pending = pendingRename.current;
                            if (pending?.id !== item.id) return;
                            pendingRename.current = undefined;
                            setEditing(pending.id);
                            setDraftTitle(pending.title);
                        }}
                        anchor={
                            <IconButton
                                icon="dots-vertical"
                                accessibilityLabel={`Opciones de ${item.title}`}
                                onPress={() => {
                                    pendingRename.current = undefined;
                                    setMenu(item.id);
                                }}
                                testID={`md-card-menu-${item.id}`}
                            />
                        }
                        testID={`md-card-menu-popup-${item.id}`}
                    >
                        <Menu.Item
                            title={item.saved ? 'Quitar guardado' : 'Guardar'}
                            leadingIcon={item.saved ? 'bookmark' : 'bookmark-outline'}
                            onPress={() => {
                                save(item.id);
                                setMenu(undefined);
                            }}
                            testID={`md-card-menu-save-${item.id}`}
                        />
                        <Menu.Item
                            title="Cambiar nombre"
                            leadingIcon="pencil"
                            onPress={() => {
                                setMenu(undefined);
                                pendingRename.current = { id: item.id, title: item.title };
                            }}
                            testID={`md-card-menu-rename-${item.id}`}
                        />
                        <Menu.Item
                            title="Duplicar"
                            leadingIcon="content-copy"
                            onPress={() => duplicate(item.id)}
                            testID={`md-card-menu-duplicate-${item.id}`}
                        />
                        <Menu.Item
                            title="Archivar"
                            leadingIcon="archive-outline"
                            onPress={() => archive(item.id)}
                            testID={`md-card-menu-archive-${item.id}`}
                        />
                    </Menu>
                )}
            />
            <Card.Content>
                <Text numberOfLines={collectionLayout === 'staggered' ? (index % 2 ? 4 : 2) : 3}>{item.description}</Text>
            </Card.Content>
            <Card.Actions>
                <Button
                    variant="text"
                    onPress={() =>
                        openDetail(
                            item.id,
                            theme.colors.surface,
                            <Card variant="outlined" style={{ width: '100%' }}>
                                {collectionLayout === 'horizontal' ||
                                (collectionLayout === 'mosaic' && index === 0) ||
                                (collectionLayout === 'staggered' && index % 2 === 0) ? (
                                    <Image source={artwork} style={{ width: '100%', height: collectionLayout === 'mosaic' ? 160 : 112 }} />
                                ) : null}
                                <Card.Title
                                    title={item.title}
                                    titleNumberOfLines={2}
                                    subtitle={item.category}
                                    right={() => (
                                        <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon source="dots-vertical" size={24} />
                                        </View>
                                    )}
                                />
                                <Card.Content>
                                    <Text numberOfLines={collectionLayout === 'staggered' ? (index % 2 ? 4 : 2) : 3}>
                                        {item.description}
                                    </Text>
                                </Card.Content>
                                <Card.Actions>
                                    <View style={{ minHeight: 48, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }}>
                                        <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                                            Ver recorrido
                                        </Text>
                                    </View>
                                </Card.Actions>
                            </Card>
                        )
                    }
                    testID={`md-card-open-${item.id}`}
                >
                    Ver recorrido
                </Button>
            </Card.Actions>
        </Card>
    );
    return (
        <View style={{ gap: 32 }}>
            <Text>
                La superficie puede abrir un detalle; las tarjetas con varias acciones mantienen cada control independiente. Los filtros y
                el orden están fuera de la colección.
            </Text>
            {onOpenPlayground ? (
                <Button
                    style={{ alignSelf: 'flex-start' }}
                    variant="outlined"
                    icon="gesture-swipe"
                    onPress={onOpenPlayground}
                    testID="md-card-open-playground"
                >
                    Probar swipe y reordenar
                </Button>
            ) : null}
            <Section title="Variantes y acción primaria">
                <Text variant="labelMedium">Configuración de la muestra</Text>
                <View style={line}>
                    <Switch
                        value={disabled}
                        onValueChange={setDisabled}
                        accessibilityLabel="Deshabilitar acción primaria de tarjetas"
                        testID="md-card-disabled"
                    />
                    <Text>Deshabilitadas</Text>
                </View>
                {(['elevated', 'contained', 'outlined'] as const).map((mode, index) => (
                    <Card
                        key={mode}
                        variant={mode === 'contained' ? 'filled' : mode}
                        disabled={disabled}
                        ref={(node) => {
                            if (node) detailAnchors.current.set(variantRecords[index].id, node as unknown as ViewInstance);
                            else detailAnchors.current.delete(variantRecords[index].id);
                        }}
                        pointerEvents={detailSource === variantRecords[index].id ? 'none' : 'auto'}
                        accessibilityElementsHidden={detailSource === variantRecords[index].id}
                        importantForAccessibility={detailSource === variantRecords[index].id ? 'no-hide-descendants' : 'auto'}
                        style={{ opacity: detailSource === variantRecords[index].id ? 0 : 1 }}
                        onPress={() =>
                            openDetail(
                                variantRecords[index].id,
                                mode === 'elevated'
                                    ? theme.colors.surfaceContainerLow
                                    : mode === 'contained'
                                      ? theme.colors.surfaceContainerHighest
                                      : theme.colors.surface,
                                <Card variant={mode === 'contained' ? 'filled' : mode} style={{ width: '100%' }}>
                                    <VariantCardContent mode={mode} item={variantRecords[index]} />
                                </Card>
                            )
                        }
                        accessibilityLabel={`Abrir ${variantRecords[index].title}, tarjeta ${titleForMode[mode]}`}
                        testID={`md-card-${mode}`}
                    >
                        <VariantCardContent mode={mode} item={variantRecords[index]} />
                    </Card>
                ))}
                <Card
                    variant="outlined"
                    disabled={disabled}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel="Seleccionar colección"
                    onPress={() => setSelected((value) => !value)}
                    testID="md-card-selectable"
                >
                    <Card.Title
                        title={selected ? 'Colección seleccionada' : 'Seleccionar colección'}
                        right={() => (
                            <View
                                pointerEvents="none"
                                accessible={false}
                                accessibilityElementsHidden
                                importantForAccessibility="no-hide-descendants"
                            >
                                <Checkbox disabled={disabled} status={selected ? 'checked' : 'unchecked'} />
                            </View>
                        )}
                    />
                </Card>
            </Section>
            <Section title="Botones, valoración y controles de selección">
                <Card variant="filled" testID="md-card-controls">
                    <Card.Title title="Planifica tu recorrido" subtitle="Chips, slider e icon buttons en una misma tarjeta" />
                    <Card.Content>
                        <View style={{ gap: 12 }}>
                            <View style={line}>
                                {['Naturaleza', 'Cultura', 'Gastronomía'].map((label) => (
                                    <Chip
                                        key={label}
                                        variant="filter"
                                        selected={category === label}
                                        onPress={() => setCategory(label)}
                                        testID={`md-card-category-${label}`}
                                    >
                                        {label}
                                    </Chip>
                                ))}
                            </View>
                            <Text variant="labelLarge">Duración: {duration} minutos</Text>
                            <Slider
                                value={duration}
                                onValueChange={setDuration}
                                minimumValue={15}
                                maximumValue={120}
                                step={15}
                                valueIndicator="on-drag"
                                valueSuffix=" min"
                                accessibilityLabel="Duración del recorrido"
                                testID="md-card-duration"
                            />
                            <Text variant="labelLarge">Tu valoración: {rating} de 5</Text>
                            <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignSelf: 'flex-start' }}>
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <IconButton
                                        key={value}
                                        icon={value <= rating ? 'star' : 'star-outline'}
                                        iconColor={theme.colors.primary}
                                        accessibilityLabel={`Valorar con ${value} estrellas`}
                                        accessibilityState={{ selected: value === rating }}
                                        onPress={() => setRating(value)}
                                        style={{ margin: 0 }}
                                        testID={`md-card-rating-${value}`}
                                    />
                                ))}
                            </View>
                            <Divider horizontalInset />
                            <Text variant="bodySmall" testID="md-card-preferences-applied">
                                Guardado: {applied.category} · {applied.duration} min · {applied.rating} estrellas
                            </Text>
                            {expanded ? (
                                <Text>
                                    La duración y el tipo de recorrido se aplican a tu próxima visita. Este contenido amplía la altura de la
                                    tarjeta; no tiene un ScrollView interno.
                                </Text>
                            ) : null}
                        </View>
                    </Card.Content>
                    <Divider />
                    <Card.Actions>
                        <Button
                            variant="text"
                            icon={expanded ? 'chevron-up' : 'chevron-down'}
                            accessibilityState={{ expanded }}
                            onPress={() => setExpanded((value) => !value)}
                            testID="md-card-expand"
                        >
                            {expanded ? 'Menos' : 'Más información'}
                        </Button>
                        <Button
                            disabled={!dirty}
                            onPress={() => {
                                setApplied({ category, duration, rating });
                                onEvent('Preferencias del recorrido guardadas.');
                            }}
                            testID="md-card-preferences-save"
                        >
                            Guardar
                        </Button>
                    </Card.Actions>
                    {dirty ? (
                        <Card.Actions>
                            <Button
                                variant="text"
                                onPress={() => {
                                    setCategory(applied.category);
                                    setDuration(applied.duration);
                                    setRating(applied.rating);
                                }}
                                testID="md-card-preferences-cancel"
                            >
                                Descartar cambios
                            </Button>
                        </Card.Actions>
                    ) : null}
                </Card>
            </Section>
            <Section title="Media">
                <VideoCard />
            </Section>
            <Section title="Colección, overflow y filtros">
                <View style={line}>
                    {(['vertical', 'grid', 'horizontal', 'mosaic', 'staggered'] as const).map((value) => (
                        <Chip
                            key={value}
                            variant="filter"
                            selected={layout === value}
                            onPress={() => setLayout(value)}
                            testID={`md-card-layout-${value}`}
                        >
                            {{ vertical: 'Lista', grid: 'Grid', horizontal: 'Carrusel', mosaic: 'Mosaico', staggered: 'Escalonado' }[value]}
                        </Chip>
                    ))}
                </View>
                <View style={line}>
                    {['Todas', 'Naturaleza', 'Cultura', 'Gastronomía'].map((value) => (
                        <Chip
                            key={value}
                            variant="filter"
                            selected={filter === value}
                            onPress={() => setFilter(value)}
                            testID={`md-card-filter-${value}`}
                        >
                            {value}
                        </Chip>
                    ))}
                </View>
                <View style={line}>
                    <Text variant="labelLarge">Ordenar</Text>
                    <Chip selected={sort === 'date'} variant="filter" onPress={() => setSort('date')} testID="md-card-sort-date">
                        Más recientes
                    </Chip>
                    <Chip selected={sort === 'name'} variant="filter" onPress={() => setSort('name')} testID="md-card-sort-name">
                        Nombre
                    </Chip>
                </View>
                {!visible.length ? (
                    <Text>No hay recorridos con este filtro. Elige otra categoría o deshaz el archivo.</Text>
                ) : layout === 'horizontal' ? (
                    <ScrollView
                        horizontal
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                    >
                        {visible.map((item, index) => (
                            <View key={item.id} style={{ width: Math.min(300, width - 64) }}>
                                {card(item, index)}
                            </View>
                        ))}
                    </ScrollView>
                ) : layout === 'staggered' ? (
                    <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', gap: 8 }}>
                        {[0, 1].map((column) => (
                            <View key={column} style={{ flex: 1, gap: 8 }}>
                                {visible.filter((_, index) => index % 2 === column).map((item, index) => card(item, index * 2 + column))}
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {visible.map((item, index) => (
                            <View
                                key={item.id}
                                style={{
                                    width:
                                        (layout === 'vertical' && width < 840) || (layout === 'mosaic' && index === 0) ? '100%' : '48.5%',
                                    flexGrow: 1,
                                }}
                            >
                                {card(item, index)}
                            </View>
                        ))}
                    </View>
                )}
            </Section>
            <Dialog visible={!!editing} onDismiss={() => setEditing(undefined)} testID="md-card-rename">
                <Dialog.Title>Cambiar nombre</Dialog.Title>
                <Dialog.Content>
                    <TextField
                        label="Nombre de la colección"
                        value={draftTitle}
                        onChangeText={setDraftTitle}
                        testID="md-card-rename-input"
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setEditing(undefined)} testID="md-card-rename-cancel">
                        Cancelar
                    </Button>
                    <Button
                        variant="text"
                        disabled={!draftTitle.trim()}
                        onPress={() => {
                            setRecords((items) =>
                                items.map((item) => (item.id === editing ? { ...item, title: draftTitle.trim() } : item))
                            );
                            setEditing(undefined);
                        }}
                        testID="md-card-rename-save"
                    >
                        Guardar
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <JourneyDetails
                journey={records.find((item) => item.id === detail) ?? variantRecords.find((item) => item.id === detail)}
                transitionOrigin={detailOrigin}
                onClosed={() => {
                    setDetailSource(undefined);
                    setDetailOrigin(undefined);
                }}
                onClose={() => {
                    detailRequest.current++;
                    if (detailTimer.current) clearTimeout(detailTimer.current);
                    detailTimer.current = null;
                    setDetail(undefined);
                }}
                onSave={() => {
                    if (detail?.startsWith('variant-'))
                        setVariantRecords((items) => items.map((item) => (item.id === detail ? { ...item, saved: !item.saved } : item)));
                    else if (detail) save(detail);
                }}
            />
            <Portal>
                <Snackbar
                    visible={!!removed}
                    onDismiss={() => setRemoved(undefined)}
                    action={{
                        label: 'Deshacer',
                        onPress: () => {
                            if (removed)
                                setRecords((items) => {
                                    const restored = [...items];
                                    restored.splice(Math.min(removed.index, restored.length), 0, removed.item);
                                    return restored;
                                });
                            setRemoved(undefined);
                        },
                    }}
                    testID="md-card-archive-undo"
                >
                    Colección archivada
                </Snackbar>
            </Portal>
        </View>
    );
}

const DraggedCardContext = createContext<string | undefined>(undefined);
type CellProps = ComponentProps<typeof View> & { item: Journey; index: number; children?: ReactNode };
function CollectionCell({ item, index: _index, style, children, ...props }: CellProps) {
    const active = useContext(DraggedCardContext);
    return (
        <View {...props} style={[style, { zIndex: active === item.id ? 10 : 0 }]}>
            {children}
        </View>
    );
}

function JourneyRow({
    item,
    height,
    onPress,
    dragged = false,
    reorder,
}: {
    item: Journey;
    height: number;
    onPress: () => void;
    dragged?: boolean;
    reorder?: boolean;
}) {
    const rtl = useLocale().direction === 'rtl';
    return (
        <Card
            variant="elevated"
            dragged={dragged}
            onPress={onPress}
            accessible={!reorder}
            accessibilityLabel={item.title}
            accessibilityHint={reorder ? undefined : 'Desliza hacia el final para archivar esta colección.'}
            testID={`md-card-gesture-${item.id}`}
        >
            <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', height, overflow: 'hidden', borderRadius: 12 }}>
                <Image source={artwork} accessibilityIgnoresInvertColors style={{ width: 88, height: '100%' }} />
                <View style={{ flex: 1, minWidth: 0, padding: 16, justifyContent: 'center', gap: 4 }}>
                    <Text variant="titleMedium" numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text variant="bodyMedium" numberOfLines={2}>
                        {item.description}
                    </Text>
                    <Text variant="labelSmall">{item.category}</Text>
                </View>
                {reorder ? (
                    <View pointerEvents="none" style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon source="drag" size={24} />
                    </View>
                ) : null}
            </View>
        </Card>
    );
}

function MovableCard({
    item,
    index,
    count,
    height,
    activeId,
    onDragChange,
    onCommit,
    onPress,
}: {
    item: Journey;
    index: number;
    count: number;
    height: number;
    activeId?: string;
    onDragChange: (id: string | undefined) => void;
    onCommit: (id: string, index: number) => void;
    onPress: () => void;
}) {
    const theme = useMobileTheme();
    const extent = height + 8;
    const translate = useSharedValue(0),
        start = useSharedValue(0),
        velocity = useSharedValue(0),
        home = useSharedValue(index),
        held = useSharedValue(false),
        aliveUI = useSharedValue(true),
        revision = useSharedValue(0);
    const alive = useRef(true),
        latest = useRef({ index, onDragChange, onCommit });
    useLayoutEffect(() => {
        latest.current = { index, onDragChange, onCommit };
    }, [index, onCommit, onDragChange]);
    const begin = (token: number) => {
        if (alive.current && revision.get() === token) {
            latest.current.onDragChange(item.id);
            AccessibilityInfo.announceForAccessibility(`${item.title}, tarjeta levantada. Mueve y suelta para reordenar.`);
        }
    };
    const complete = (token: number, destination: number) => {
        if (!alive.current || revision.get() !== token) return;
        latest.current.onCommit(item.id, destination);
        latest.current.onDragChange(undefined);
    };
    useEffect(() => {
        if (activeId !== item.id)
            scheduleOnUI(() => {
                'worklet';
                cancelAnimation(translate);
                held.set(false);
                translate.set(0);
            });
    }, [activeId, held, item.id, translate]);
    useEffect(() => {
        alive.current = true;
        scheduleOnUI(() => {
            'worklet';
            aliveUI.set(true);
        });
        return () => {
            alive.current = false;
            scheduleOnUI(() => {
                'worklet';
                aliveUI.set(false);
                revision.set(revision.get() + 1);
                cancelAnimation(translate);
            });
        };
    }, [aliveUI, revision, translate]);
    const pan = usePanGesture({
        enabled: !activeId || activeId === item.id,
        activateAfterLongPress: 350,
        minDistance: 1,
        maxPointers: 1,
        onActivate: () => {
            'worklet';
            if (!aliveUI.get()) return;
            const current = held.get() ? translate.get() - (index - home.get()) * extent : 0;
            revision.set(revision.get() + 1);
            cancelAnimation(translate);
            home.set(index);
            start.set(current);
            translate.set(current);
            held.set(true);
            velocity.set(0);
            scheduleOnRN(begin, revision.get());
        },
        onUpdate: (event) => {
            'worklet';
            if (!aliveUI.get() || !held.get()) return;
            const next = start.get() + event.translationY,
                minimum = -home.get() * extent,
                maximum = (count - 1 - home.get()) * extent;
            const bounded = Math.max(minimum, Math.min(maximum, next));
            translate.set(bounded + (next - bounded) * 0.12);
            velocity.set(event.velocityY);
        },
        onDeactivate: (event) => {
            'worklet';
            if (!aliveUI.get() || !held.get()) return;
            const token = revision.get();
            const destination = event.canceled
                ? home.get()
                : Math.max(0, Math.min(count - 1, Math.round(home.get() + translate.get() / extent)));
            const target = (destination - home.get()) * extent;
            const finished = (success?: boolean) => {
                'worklet';
                if (success && aliveUI.get() && revision.get() === token) scheduleOnRN(complete, token, destination);
            };
            const spatial = theme.motion.spring.default.spatial;
            translate.set(
                withSpring(
                    target,
                    {
                        stiffness: spatial.stiffness,
                        damping: 2 * spatial.damping * Math.sqrt(spatial.stiffness),
                        mass: 1,
                        velocity: velocity.get(),
                        overshootClamping: true,
                        reduceMotion: theme.animation.scale === 0 ? ReduceMotion.Always : ReduceMotion.Never,
                    },
                    finished
                )
            );
        },
    });
    const motion = useAnimatedStyle(() => ({
        transform: [{ translateY: held.get() ? translate.get() - (index - home.get()) * extent : 0 }],
    }));
    return (
        <GestureDetector gesture={pan}>
            <Animated.View
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel={item.title}
                accessibilityHint="Mantén pulsado y mueve verticalmente para cambiar la posición. También puedes usar las acciones mover arriba y mover abajo."
                accessibilityValue={{ min: 1, max: count, now: index + 1 }}
                accessibilityActions={[
                    { name: 'increment', label: 'Mover abajo' },
                    { name: 'decrement', label: 'Mover arriba' },
                    { name: 'activate', label: 'Abrir recorrido' },
                ]}
                onAccessibilityAction={(event) => {
                    if (event.nativeEvent.actionName === 'activate') onPress();
                    else if (event.nativeEvent.actionName === 'increment') onCommit(item.id, index + 1);
                    else if (event.nativeEvent.actionName === 'decrement') onCommit(item.id, index - 1);
                }}
                style={motion}
                testID={`md-card-move-${item.id}`}
            >
                <JourneyRow item={item} height={height} dragged={activeId === item.id} reorder onPress={onPress} />
            </Animated.View>
        </GestureDetector>
    );
}

/** This viewport owns its FlatList: no nested scrolling and no simulated drag-state switch. */
export function CardPlayground({ onEvent }: Pick<Props, 'onEvent'>) {
    const theme = useMobileTheme();
    const { fontScale } = useWindowDimensions();
    const [records, setRecords] = useState<Journey[]>(() => initialJourneys.map((item) => ({ ...item })));
    const [gesture, setGesture] = useState<'swipe' | 'reorder'>('swipe');
    const [active, setActive] = useState<string>(),
        [detail, setDetail] = useState<string>();
    const [removed, setRemoved] = useState<{ item: Journey; index: number }>();
    const [notice, setNotice] = useState(
        'Desliza una tarjeta hacia el final para archivarla. Cada tarjeta tiene una sola acción de swipe.'
    );
    const rowHeight = Math.max(132, Math.ceil(84 + fontScale * 48));
    const archive = (id: string) => {
        const index = records.findIndex((item) => item.id === id);
        if (index < 0) return;
        setRemoved({ item: records[index], index });
        setRecords((items) => items.filter((item) => item.id !== id));
        setNotice(`${records[index].title} archivada.`);
        onEvent('Tarjeta archivada mediante su acción de swipe.');
    };
    const move = (id: string, requestedIndex: number) => {
        const source = records.findIndex((item) => item.id === id);
        if (source < 0) return;
        const target = Math.max(0, Math.min(records.length - 1, requestedIndex));
        if (source !== target)
            setRecords((items) => {
                const next = [...items];
                const current = next.findIndex((item) => item.id === id);
                if (current < 0) return items;
                const [item] = next.splice(current, 1);
                next.splice(Math.max(0, Math.min(next.length, target)), 0, item);
                return next;
            });
        const message = `${records[source].title}, posición ${target + 1} de ${records.length}.`;
        setNotice(message);
        onEvent(message);
        AccessibilityInfo.announceForAccessibility(message);
    };
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID="md-card-playground">
            <View style={{ padding: 16, gap: 8 }}>
                <Text variant="labelMedium">Configuración del gesto</Text>
                <View style={line}>
                    <Chip
                        selected={gesture === 'swipe'}
                        disabled={!!active}
                        variant="filter"
                        onPress={() => {
                            setGesture('swipe');
                            setNotice('Desliza una tarjeta hacia el final para archivarla.');
                        }}
                        testID="md-card-gesture-swipe"
                    >
                        Archivar con swipe
                    </Chip>
                    <Chip
                        selected={gesture === 'reorder'}
                        disabled={!!active}
                        variant="filter"
                        onPress={() => {
                            setGesture('reorder');
                            setNotice(
                                'Mantén pulsada una tarjeta y muévela verticalmente. Las otras tarjetas permanecen quietas hasta que la sueltas.'
                            );
                        }}
                        testID="md-card-gesture-reorder"
                    >
                        Levantar y mover
                    </Chip>
                </View>
                <Text variant="bodySmall" accessibilityLiveRegion="polite" testID="md-card-gesture-notice">
                    {notice}
                </Text>
            </View>
            <DraggedCardContext.Provider value={active}>
                <SwipeListGroup>
                    <FlatList
                        data={records}
                        keyExtractor={(item) => item.id}
                        extraData={{ active, gesture }}
                        CellRendererComponent={CollectionCell}
                        scrollEnabled={!active}
                        removeClippedSubviews={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}
                        renderItem={({ item, index }) =>
                            gesture === 'reorder' ? (
                                <MovableCard
                                    item={item}
                                    index={index}
                                    count={records.length}
                                    height={rowHeight}
                                    activeId={active}
                                    onDragChange={setActive}
                                    onCommit={move}
                                    onPress={() => {
                                        if (!active) setDetail(item.id);
                                    }}
                                />
                            ) : (
                                <SwipeListItem
                                    id={item.id}
                                    trailingSwipeMode="direct"
                                    trailingActions={[
                                        { key: 'archive', label: 'Archivar', icon: 'archive-outline', onPress: () => archive(item.id) },
                                    ]}
                                    testID={`md-card-swipe-${item.id}`}
                                >
                                    <JourneyRow item={item} height={rowHeight} onPress={() => setDetail(item.id)} />
                                </SwipeListItem>
                            )
                        }
                        ListEmptyComponent={
                            <View style={{ padding: 24, gap: 16 }}>
                                <Text>No quedan tarjetas en esta colección.</Text>
                                <Button
                                    style={{ alignSelf: 'flex-start' }}
                                    onPress={() => {
                                        setRecords(initialJourneys.map((item) => ({ ...item })));
                                        setRemoved(undefined);
                                    }}
                                    testID="md-card-restore-collection"
                                >
                                    Restaurar colección
                                </Button>
                            </View>
                        }
                        testID="md-card-gesture-list"
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    />
                </SwipeListGroup>
            </DraggedCardContext.Provider>
            <JourneyDetails
                journey={records.find((item) => item.id === detail)}
                onClose={() => setDetail(undefined)}
                onSave={() => setRecords((items) => items.map((item) => (item.id === detail ? { ...item, saved: !item.saved } : item)))}
            />
            <Portal>
                <Snackbar
                    visible={!!removed}
                    onDismiss={() => setRemoved(undefined)}
                    action={{
                        label: 'Deshacer',
                        onPress: () => {
                            if (removed)
                                setRecords((items) => {
                                    const next = [...items];
                                    next.splice(Math.min(removed.index, next.length), 0, removed.item);
                                    return next;
                                });
                            setRemoved(undefined);
                        },
                    }}
                    testID="md-card-gesture-undo"
                >
                    Tarjeta archivada
                </Snackbar>
            </Portal>
        </View>
    );
}
