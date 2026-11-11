import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, Linking, Platform, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEvent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Image as SvgImage, Path } from 'react-native-svg';
import {
    Avatar,
    Button,
    Card,
    Chip,
    Dialog,
    Icon,
    IconButton,
    List,
    Menu,
    NavigationBar,
    NavigationRail,
    ProgressIndicator,
    SearchView,
    Snackbar,
    Switch,
    Text,
    TextField,
    Toolbar,
    TopAppBar,
    useMobileTheme,
} from 'mobile-design/react-native';
import { MobileDesignGalleryProvider as MobileDesignProvider } from './mobile-design-gallery-provider';
import type { RootStackParamList } from '@/navigations/types';
import { ListReorderExample } from './mobile-design-list-reorder-example';
import { useDemoTask } from './mobile-design-demo-task';
import { ShrineProductExample } from './mobile-design-io26-shrine';
import { filterIo26Recipes, io26Article, io26Examples, io26Media, io26Recipes, type Io26Scenario } from './mobile-design-io26-data';

type EventProps = { onEvent: (message: string) => void };
type Recipe = (typeof io26Recipes)[number];
const row = { flexDirection: 'row' as const, alignItems: 'center' as const, flexWrap: 'wrap' as const, gap: 8 };
const photos = [
    require('./assets/lists/festival.png'),
    require('./assets/lists/arts.png'),
    require('./assets/lists/family-friends.png'),
    require('./assets/lists/pets.png'),
];

/** Render only photographs from the source figure; never rasterize its interactive controls. */
function RecipeArt({ recipe }: { recipe: Recipe }) {
    const crops: Record<string, readonly number[]> = {
        salad: [1410, 90, 152, 152],
        dumplings: [1410, 278, 152, 152],
        bread: [1410, 470, 152, 152],
        complex: [1410, 653, 152, 152],
    };
    return crops[recipe.id] ? (
        <Svg width="100%" height="100%" viewBox={crops[recipe.id].join(' ')} preserveAspectRatio="xMidYMid slice" accessible={false}>
            <SvgImage href={require('./assets/io26/lists-menus-reference.png')} x={0} y={0} width={2704} height={1200} />
        </Svg>
    ) : (
        <Image source={recipe.image} style={{ width: '100%', height: '100%' }} />
    );
}

function Page({ children }: { children: ReactNode }) {
    const insets = useSafeAreaInsets();
    const theme = useMobileTheme();
    return (
        <ScrollView
            style={{ backgroundColor: theme.colors.surface }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 24 }}
        >
            {children}
        </ScrollView>
    );
}

/** A real single/list-detail layout: selected content survives breakpoint changes. */
function AdaptiveLayout() {
    const theme = useMobileTheme();
    const { width } = useWindowDimensions();
    const [destination, setDestination] = useState('albums');
    const [selected, setSelected] = useState<number>();
    const [expanded, setExpanded] = useState(false);
    const items = [
        { key: 'albums', label: 'Álbumes', icon: 'photo_library', selectedIcon: 'photo_library_fill1' },
        { key: 'favorites', label: 'Favoritos', icon: 'favorite', selectedIcon: 'favorite_fill1' },
        { key: 'shared', label: 'Compartido', icon: 'group', selectedIcon: 'group_fill1' },
    ];
    const names = ['Festivals', 'Arts', 'Family & friends', 'Pets'];
    const twoPanes = width >= 840;
    const rail = width >= 600;
    const choose = (key: string) => {
        setDestination(key);
        setSelected(undefined);
    };
    const detail =
        selected === undefined ? null : (
            <View
                style={{ flex: 1, minWidth: 0, backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 24 }}
                testID="md-io26-layout-detail"
            >
                <View style={[row, { padding: 8 }]}>
                    <IconButton
                        icon="arrow_back"
                        accessibilityLabel="Volver a los álbumes"
                        onPress={() => setSelected(undefined)}
                        testID="md-io26-layout-detail-back"
                    />
                    <Text variant="titleLarge" style={{ flex: 1 }}>
                        {names[selected]}
                    </Text>
                </View>
                <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
                    <Image source={photos[selected]} style={{ width: '100%', aspectRatio: 1, borderRadius: 24 }} />
                    <Text variant="headlineSmall">{names[selected]}</Text>
                    <Text>El detalle se conserva al cambiar el tamaño de la ventana o girar la pantalla.</Text>
                </ScrollView>
            </View>
        );
    return (
        <View style={{ flex: 1 }} testID="md-io26-layout">
            <View style={{ flex: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 8 }}>
                {rail ? (
                    <NavigationRail
                        items={items}
                        value={destination}
                        onValueChange={choose}
                        expanded={expanded}
                        onExpandedChange={setExpanded}
                        style={{ paddingTop: 8, paddingBottom: 0 }}
                        testID="md-io26-layout-rail"
                    />
                ) : null}
                {twoPanes || selected === undefined ? (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 8, gap: 16 }}>
                        <Text variant="headlineMedium">{items.find((item) => item.key === destination)?.label}</Text>
                        <Text variant="bodySmall">
                            {twoPanes ? 'Dos paneles' : 'Un panel'} · {Math.round(width)} dp
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {photos.map((photo, index) => (
                                <Card
                                    key={index}
                                    variant="filled"
                                    onPress={() => setSelected(index)}
                                    accessibilityLabel={`Abrir ${names[index]}`}
                                    style={{ width: width < 360 ? '100%' : '48%' }}
                                    testID={`md-io26-layout-album-${index}`}
                                >
                                    <Image
                                        source={photo}
                                        style={{
                                            width: '100%',
                                            aspectRatio: index === 0 ? 1.6 : 1,
                                            borderTopLeftRadius: 12,
                                            borderTopRightRadius: 12,
                                        }}
                                    />
                                    <Card.Content style={{ paddingVertical: 16 }}>
                                        <Text variant="titleMedium">{names[index]}</Text>
                                    </Card.Content>
                                </Card>
                            ))}
                        </View>
                    </ScrollView>
                ) : null}
                {detail ??
                    (twoPanes ? (
                        <View
                            style={{
                                flex: 1,
                                borderRadius: 24,
                                padding: 24,
                                justifyContent: 'center',
                                backgroundColor: theme.colors.surfaceContainerLow,
                            }}
                        >
                            <Text variant="headlineSmall">Selecciona un álbum</Text>
                            <Text>La lista y el detalle comparten el espacio disponible.</Text>
                        </View>
                    ) : null)}
            </View>
            {!rail ? (
                <NavigationBar
                    items={items}
                    value={destination}
                    onValueChange={choose}
                    accessibilityLabel="Secciones de álbumes"
                    testID="md-io26-layout-bar"
                />
            ) : null}
        </View>
    );
}

function SpacingExample({ onEvent }: EventProps) {
    const theme = useMobileTheme();
    const [comfortable, setComfortable] = useState(true);
    const [guides, setGuides] = useState(true);
    const download = useDemoTask<void>();
    const unit = comfortable ? 16 : 8;
    return (
        <Page>
            <Text variant="headlineSmall">Márgenes, padding y gaps</Text>
            <Text>
                La escala parte de 8 dp. Cambia la densidad para comparar la composición; los botones conservan las medidas de su variante.
            </Text>
            <View style={row}>
                <Text style={{ flex: 1 }}>Espaciado cómodo</Text>
                <Switch
                    value={comfortable}
                    onValueChange={setComfortable}
                    accessibilityLabel="Espaciado cómodo"
                    testID="md-io26-spacing-density"
                />
            </View>
            <View style={row}>
                <Text style={{ flex: 1 }}>Mostrar guías</Text>
                <Switch value={guides} onValueChange={setGuides} accessibilityLabel="Mostrar guías de espaciado" />
            </View>
            <View
                style={{
                    padding: unit,
                    gap: unit,
                    borderRadius: 24,
                    backgroundColor: guides ? theme.colors.tertiaryContainer : theme.colors.surfaceContainerLow,
                }}
                testID="md-io26-spacing-canvas"
            >
                <Card variant="filled">
                    <Card.Content style={{ padding: unit * 2, gap: unit }}>
                        <Text variant="titleLarge">Un espacio para crear</Text>
                        <Text>Mismos elementos, distinta densidad.</Text>
                        <Button
                            icon={download.status === 'success' ? 'check' : 'download'}
                            variant="tonal"
                            loading={download.busy}
                            onPress={() =>
                                void download.run(async ({ wait }) => {
                                    await wait(1200);
                                })
                            }
                        >
                            {download.status === 'success' ? 'Downloaded' : 'Download'}
                        </Button>
                    </Card.Content>
                </Card>
                <View style={{ padding: unit, borderRadius: 16, backgroundColor: theme.colors.surface }}>
                    <Text variant="labelLarge">
                        Margen: {unit} dp · padding: {unit * 2} dp · gap: {unit} dp
                    </Text>
                </View>
            </View>
            <Text variant="titleMedium">Escalado del componente</Text>
            <View style={{ alignItems: 'flex-start', gap: 24 }}>
                <Button size="small" variant="tonal" icon="download" onPress={() => onEvent('Download · small')}>
                    Download
                </Button>
                <Button size="large" variant="tonal" icon="download" onPress={() => onEvent('Download · large')}>
                    Download
                </Button>
            </View>
        </Page>
    );
}

function RecipeExamples({ search, onEvent }: EventProps & { search: boolean }) {
    const theme = useMobileTheme();
    const { width } = useWindowDimensions();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [menu, setMenu] = useState<string>();
    const [preview, setPreview] = useState<string>();
    const [copyLink, setCopyLink] = useState<string>();
    const [favorites, setFavorites] = useState<string[]>([]);
    const pendingPreview = useRef<string | undefined>(undefined);
    const results = filterIo26Recipes(query, category);
    const recipe = io26Recipes.find((item) => item.id === preview);
    const choose = (key: string) => {
        pendingPreview.current = key;
        setSearchOpen(false);
    };
    const share = async (id: string) => {
        try {
            await Share.share({ message: `${io26Recipes.find((item) => item.id === id)?.title} · ejemplo de Material\n${io26Article}` });
        } catch {
            onEvent('No se pudo abrir el menú de compartir.');
        }
    };
    const copy = async () => {
        const link = io26Article;
        // The existing app does not bundle a native clipboard module. Native selection exposes
        // the system Copy action instead of pretending that a JS variable is the clipboard.
        if (Platform.OS === 'web' && globalThis.navigator?.clipboard?.writeText) {
            try {
                await globalThis.navigator.clipboard.writeText(link);
                onEvent('Enlace copiado.');
                return;
            } catch {
                /* Manual selection also works when the browser denies clipboard access. */
            }
        }
        setCopyLink(link);
    };
    const searchField = (
        <SearchView
            open={searchOpen}
            onOpenChange={(open) => {
                if (open) pendingPreview.current = undefined;
                setSearchOpen(open);
            }}
            value={query}
            onChangeText={setQuery}
            onSearch={setQuery}
            variant="contained"
            presentation="auto"
            placeholder="Search recipes"
            closeOnSelect
            results={results.map((item) => ({ key: item.id, title: item.title, description: item.category, icon: 'restaurant' }))}
            onResultPress={(item) => choose(item.key)}
            onClosed={() => {
                const key = pendingPreview.current;
                pendingPreview.current = undefined;
                if (key) setPreview(key);
            }}
            emptyContent={<Text style={{ padding: 24 }}>No se encontraron recetas. Prueba «Mexican dishes».</Text>}
            testID="md-io26-recipes-search"
        />
    );
    return (
        <View style={{ flex: 1 }}>
            {search ? <TopAppBar statusBarHeight={0} search={searchField} title="Recipes" testID="md-io26-search-appbar" /> : null}
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
                <Text variant="headlineMedium">{search ? 'Find your next favorite' : 'Recipes'}</Text>
                <ScrollView horizontal contentContainerStyle={{ gap: 8 }} showsHorizontalScrollIndicator={false}>
                    {['Weeknight', 'Vegetarian', 'Easy'].map((name) => (
                        <Chip
                            key={name}
                            variant="filter"
                            selected={category === name}
                            onPress={() => setCategory(category === name ? '' : name)}
                            testID={`md-io26-filter-${name}`}
                        >
                            {name}
                        </Chip>
                    ))}
                </ScrollView>
                {results.length ? (
                    results.map((item) => (
                        <List.Item
                            key={item.id}
                            title={item.title}
                            overline="Recipe"
                            lines={2}
                            selected={menu === item.id}
                            multiAction={!search}
                            leading={
                                <View style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden' }}>
                                    <RecipeArt recipe={item} />
                                </View>
                            }
                            onPress={() => setPreview(item.id)}
                            onLongPress={search ? undefined : () => setMenu(item.id)}
                            trailing={
                                search ? (
                                    favorites.includes(item.id) ? (
                                        <Icon source="favorite_fill1" color={theme.colors.primary} size={24} />
                                    ) : undefined
                                ) : (
                                    <Menu
                                        visible={menu === item.id}
                                        onDismiss={() => setMenu(undefined)}
                                        variant="vibrant"
                                        width={Math.min(280, width - 32)}
                                        anchor={
                                            <IconButton
                                                icon="more_vert"
                                                accessibilityLabel={`Opciones de ${item.title}`}
                                                pressed={menu === item.id}
                                                onPress={() => setMenu(item.id)}
                                                testID={`md-io26-recipe-menu-${item.id}`}
                                            />
                                        }
                                        testID={`md-io26-menu-${item.id}`}
                                    >
                                        <Menu.Item
                                            title="Preview"
                                            trailingIcon="visibility"
                                            onPress={() => {
                                                setMenu(undefined);
                                                setPreview(item.id);
                                            }}
                                            testID={`md-io26-preview-${item.id}`}
                                        />
                                        <Menu.Item
                                            title="Share"
                                            trailingIcon="share"
                                            onPress={() => {
                                                setMenu(undefined);
                                                void share(item.id);
                                            }}
                                        />
                                        <Menu.Item
                                            title={favorites.includes(item.id) ? 'Remove from favorites' : 'Add to favorites'}
                                            trailingIcon={favorites.includes(item.id) ? 'favorite_fill1' : 'favorite'}
                                            onPress={() => {
                                                setMenu(undefined);
                                                setFavorites((current) =>
                                                    current.includes(item.id)
                                                        ? current.filter((key) => key !== item.id)
                                                        : [...current, item.id]
                                                );
                                                onEvent(
                                                    favorites.includes(item.id)
                                                        ? 'Receta eliminada de favoritos.'
                                                        : 'Receta guardada en favoritos.'
                                                );
                                            }}
                                            testID={`md-io26-favorite-${item.id}`}
                                        />
                                        <Menu.Item
                                            title="Copy link"
                                            trailingIcon="link"
                                            onPress={() => {
                                                setMenu(undefined);
                                                void copy();
                                            }}
                                        />
                                    </Menu>
                                )
                            }
                            style={{ borderRadius: 20 }}
                            testID={`md-io26-recipe-${item.id}`}
                        />
                    ))
                ) : (
                    <Text>No hay recetas con estos filtros.</Text>
                )}
            </ScrollView>
            <Dialog
                visible={Boolean(recipe)}
                onDismiss={() => setPreview(undefined)}
                accessibilityLabel={recipe?.title}
                testID="md-io26-recipe-detail"
            >
                <Dialog.Title>{recipe?.title}</Dialog.Title>
                <Dialog.Content>
                    {recipe ? (
                        <View style={{ gap: 16 }}>
                            <View style={{ width: '100%', aspectRatio: 1.6, borderRadius: 16, overflow: 'hidden' }}>
                                <RecipeArt recipe={recipe} />
                            </View>
                            <Text>{recipe.description}</Text>
                        </View>
                    ) : null}
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setPreview(undefined)}>
                        Cerrar
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <Dialog visible={Boolean(copyLink)} onDismiss={() => setCopyLink(undefined)} accessibilityLabel="Copiar enlace">
                <Dialog.Title>Copy link</Dialog.Title>
                <Dialog.Content>
                    <Text>Mantén presionado el enlace para usar Copiar.</Text>
                    <Text selectable style={{ marginTop: 16 }}>
                        {copyLink}
                    </Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setCopyLink(undefined)}>
                        Listo
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
}

function WatchPlayer({ onEvent }: EventProps) {
    const theme = useMobileTheme();
    const focused = useIsFocused();
    const { width } = useWindowDimensions();
    const [playing, setPlaying] = useState(false);
    const [track, setTrack] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [options, setOptions] = useState(false);
    const tracks = ['Summer Air', 'Long Walk', 'In the Dark'];
    const progress = useSharedValue(0);
    useEffect(() => {
        if (!focused) {
            setPlaying(false);
            setOptions(false);
        }
    }, [focused]);
    useEffect(() => {
        if (!playing || !focused) return;
        const timer = setInterval(() => setElapsed((value) => (value + 1) % 180), 1000);
        return () => clearInterval(timer);
    }, [playing, focused]);
    useEffect(() => {
        const spec = theme.motion.spring.fast.spatial;
        progress.set(
            theme.animation.scale === 0
                ? Number(playing)
                : withSpring(Number(playing), {
                      stiffness: spec.stiffness,
                      damping: 2 * spec.damping * Math.sqrt(spec.stiffness),
                      reduceMotion: ReduceMotion.Never,
                  })
        );
        return () => cancelAnimation(progress);
    }, [playing, progress, theme.motion, theme.animation.scale]);
    const shape = useAnimatedStyle(() => ({
        transform: [{ scale: 0.94 + progress.get() * 0.06 }, { rotate: `${progress.get() * 18}deg` }],
    }));
    const size = Math.min(360, Math.max(240, width - 48));
    const scallop =
        Array.from({ length: 121 }, (_, index) => {
            const angle = (index / 120) * Math.PI * 2;
            const radius = 45 + 3 * Math.cos(10 * angle);
            return `${index === 0 ? 'M' : 'L'}${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
        }).join(' ') + 'Z';
    const skip = (step: number) => {
        setTrack((value) => (value + step + tracks.length) % tracks.length);
        setElapsed(0);
    };
    return (
        <Page>
            <Text>
                Vista interactiva del ejemplo para reloj: reproducción simulada, cambio de canción y forma animada. No controla el audio de
                Music.
            </Text>
            <View
                style={{
                    alignSelf: 'center',
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: 8,
                    borderColor: theme.colors.outline,
                    backgroundColor: theme.colors.surfaceContainerLowest,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 16,
                    gap: 4,
                }}
                testID="md-io26-watch-face"
            >
                <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                    9:30
                </Text>
                <Text variant="titleLarge" numberOfLines={1}>
                    {tracks[track]}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {track === 0 ? 'water house' : track === 1 ? 'L.R. Coleman' : 'Sole R. Rey'}
                </Text>
                <View style={[row, { flexWrap: 'nowrap', gap: 0 }]}>
                    <IconButton
                        icon="skip_previous"
                        mode="contained-tonal"
                        accessibilityLabel="Canción anterior"
                        onPress={() => skip(-1)}
                        testID="md-io26-watch-previous"
                    />
                    <View style={{ width: 96, height: 96, justifyContent: 'center', alignItems: 'center' }}>
                        <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 96, height: 96 }, shape]}>
                            <Svg viewBox="0 0 100 100" width="100%" height="100%">
                                <Path d={scallop} fill={theme.colors.primaryContainer} stroke={theme.colors.primary} strokeWidth={3} />
                            </Svg>
                        </Animated.View>
                        <IconButton
                            icon={playing ? 'pause' : 'play_arrow'}
                            sizeClass="medium"
                            iconColor={theme.colors.onPrimaryContainer}
                            accessibilityLabel={playing ? 'Pausar muestra' : 'Reproducir muestra'}
                            onPress={() => setPlaying((value) => !value)}
                            testID="md-io26-watch-play"
                        />
                    </View>
                    <IconButton
                        icon="skip_next"
                        mode="contained-tonal"
                        accessibilityLabel="Siguiente canción"
                        onPress={() => skip(1)}
                        testID="md-io26-watch-next"
                    />
                </View>
                <View style={row}>
                    <IconButton
                        icon="headphones"
                        accessibilityLabel="Salida de audio de demostración"
                        onPress={() => onEvent('Salida de muestra: auriculares. No se modificó la salida de Music.')}
                    />
                    <Menu
                        visible={options}
                        onDismiss={() => setOptions(false)}
                        width={216}
                        anchor={
                            <IconButton icon="more_vert" accessibilityLabel="Opciones de la muestra" onPress={() => setOptions(true)} />
                        }
                    >
                        <Menu.Item
                            title="Volver al inicio"
                            leadingIcon="replay"
                            onPress={() => {
                                setElapsed(0);
                                setOptions(false);
                            }}
                        />
                        <Menu.Item
                            title="Detener"
                            leadingIcon="stop"
                            onPress={() => {
                                setPlaying(false);
                                setElapsed(0);
                                setOptions(false);
                            }}
                        />
                    </Menu>
                </View>
            </View>
            <Text variant="labelLarge" style={{ textAlign: 'center' }}>
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} / 3:00 · {playing ? 'Reproduciendo muestra' : 'En pausa'}
            </Text>
            <ProgressIndicator progress={elapsed / 180} appearance="wavy" accessibilityLabel="Progreso de la muestra" />
        </Page>
    );
}

function SpatialAlbum({ onEvent }: EventProps) {
    const theme = useMobileTheme();
    const { width } = useWindowDimensions();
    const [sharing, setSharing] = useState(true);
    const [people, setPeople] = useState(['Lily MacDonald', 'Ziad Aouad', 'Mohammad Karimi']);
    const [selected, setSelected] = useState(0);
    const [title, setTitle] = useState('Summer vibes');
    const [draftTitle, setDraftTitle] = useState(title);
    const [editing, setEditing] = useState(false);
    return (
        <Page>
            <Text>
                Vista 2D del ejemplo XR: dos paneles y una barra flotante. Los controles son interactivos; la app no inicia una sesión
                inmersiva.
            </Text>
            <View style={{ backgroundColor: theme.colors.secondaryContainer, borderRadius: 32, padding: 16, gap: 16 }}>
                <View style={{ flexDirection: width >= 840 ? 'row' : 'column', gap: 16 }}>
                    <View
                        style={{
                            flex: 2,
                            minWidth: 0,
                            borderRadius: 28,
                            padding: 16,
                            gap: 16,
                            backgroundColor: theme.colors.surfaceContainerLow,
                        }}
                        testID="md-io26-xr-album"
                    >
                        <View style={row}>
                            <Text variant="titleLarge" style={{ flex: 1 }}>
                                Albums
                            </Text>
                            <IconButton
                                icon="group"
                                accessibilityLabel={sharing ? 'Ocultar participantes' : 'Mostrar participantes'}
                                onPress={() => setSharing((value) => !value)}
                                testID="md-io26-xr-sharing"
                            />
                        </View>
                        <Image source={photos[selected]} style={{ width: '100%', aspectRatio: 1.6, borderRadius: 48 }} />
                        <Text variant="headlineMedium">{title}</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {photos.map((photo, index) => (
                                <Card
                                    key={index}
                                    onPress={() => setSelected(index)}
                                    accessibilityLabel={`Ver foto ${index + 1}`}
                                    style={{ flex: 1 }}
                                    testID={`md-io26-xr-photo-${index}`}
                                >
                                    <Image source={photo} style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }} />
                                </Card>
                            ))}
                        </View>
                    </View>
                    {sharing ? (
                        <View
                            style={{
                                flex: 1,
                                minWidth: 0,
                                backgroundColor: theme.colors.surfaceContainerLow,
                                borderRadius: 28,
                                padding: 16,
                                gap: 8,
                            }}
                            testID="md-io26-xr-people"
                        >
                            <View style={row}>
                                <Text variant="titleMedium" style={{ flex: 1 }}>
                                    Shared with
                                </Text>
                                <IconButton icon="close" accessibilityLabel="Cerrar participantes" onPress={() => setSharing(false)} />
                            </View>
                            {people.map((person) => (
                                <List.Item
                                    key={person}
                                    title={person}
                                    lines={1}
                                    leading={
                                        <Avatar.Text
                                            size={40}
                                            label={person
                                                .split(' ')
                                                .map((name) => name[0])
                                                .join('')}
                                        />
                                    }
                                    style={{ borderRadius: 16, backgroundColor: theme.colors.surface }}
                                />
                            ))}
                            <Button
                                variant="tonal"
                                icon="add"
                                disabled={people.length >= 5}
                                onPress={() => {
                                    setPeople((current) => [...current, current.length === 3 ? 'Fabian Reza' : 'Thea Schöder']);
                                    onEvent('Participante agregado al álbum de demostración.');
                                }}
                                testID="md-io26-xr-add"
                            >
                                Agregar participante
                            </Button>
                        </View>
                    ) : null}
                </View>
                <Toolbar
                    variant="floating"
                    color="vibrant"
                    safeArea={false}
                    accessibilityLabel="Acciones del álbum"
                    actions={[
                        { key: 'share', icon: 'share', label: 'Participantes', onPress: () => setSharing(true) },
                        {
                            key: 'photo',
                            icon: 'add_photo_alternate',
                            label: 'Siguiente foto',
                            onPress: () => setSelected((value) => (value + 1) % photos.length),
                        },
                        {
                            key: 'edit',
                            icon: 'edit',
                            label: 'Editar',
                            selected: editing,
                            onPress: () => {
                                setDraftTitle(title);
                                setEditing(true);
                            },
                        },
                    ]}
                />
            </View>
            <Dialog visible={editing} onDismiss={() => setEditing(false)} accessibilityLabel="Editar álbum">
                <Dialog.Title>Editar álbum</Dialog.Title>
                <Dialog.Content>
                    <TextField label="Nombre del álbum" value={draftTitle} onChangeText={setDraftTitle} />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setEditing(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="text"
                        disabled={!draftTitle.trim()}
                        onPress={() => {
                            setTitle(draftTitle.trim());
                            setEditing(false);
                        }}
                    >
                        Guardar
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Page>
    );
}

function ArticleMedia({ kind }: { kind: keyof typeof io26Media }) {
    const focused = useIsFocused();
    const media = io26Media[kind];
    const player = useVideoPlayer(null);
    const { status, error } = useEvent(player, 'statusChange', { status: player.status, error: undefined });
    const [requested, setRequested] = useState(false);
    const [busy, setBusy] = useState(false);
    const [failure, setFailure] = useState('');
    const alive = useRef(true),
        pending = useRef(false),
        active = useRef(focused);
    active.current = focused;
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    useEffect(() => {
        if (!focused) player.pause();
    }, [focused, player]);
    const play = async () => {
        if (pending.current || !active.current) return;
        pending.current = true;
        setBusy(true);
        setFailure('');
        setRequested(true);
        try {
            player.muted = true;
            await player.replaceAsync(media.uri);
            if (alive.current && active.current) player.play();
        } catch {
            if (alive.current) setFailure('No se pudo cargar el clip. Revisa la conexión y vuelve a intentarlo.');
        } finally {
            pending.current = false;
            if (alive.current) setBusy(false);
        }
    };
    return (
        <Page>
            <Text variant="headlineSmall">{media.title}</Text>
            <Text>{media.description}</Text>
            {requested ? (
                <View testID="md-io26-video" style={{ width: '100%', aspectRatio: 16 / 9 }}>
                    <VideoView
                        player={player}
                        nativeControls
                        contentFit="contain"
                        fullscreenOptions={{ enable: true }}
                        surfaceType="textureView"
                        style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 24 }}
                    />
                </View>
            ) : (
                <View style={{ aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon source={kind === 'gemini' ? 'auto_awesome' : 'visibility'} size={64} />
                </View>
            )}
            {failure || status === 'error' ? (
                <Text accessibilityRole="alert">{failure || error?.message || 'No se pudo reproducir el clip.'}</Text>
            ) : null}
            <Button
                icon="play_arrow"
                disabled={!focused}
                loading={busy || status === 'loading'}
                onPress={() => void play()}
                testID="md-io26-play-video"
            >
                {requested ? 'Reiniciar clip' : 'Reproducir clip original'}
            </Button>
            {requested && status === 'readyToPlay' ? (
                <Text variant="bodySmall" testID="md-io26-video-ready">
                    Clip listo para reproducir.
                </Text>
            ) : null}
            <Text variant="bodySmall">
                El clip se carga desde la fuente original al pulsar reproducir. Sus controles permiten pausar y avanzar.
            </Text>
        </Page>
    );
}

function ArticleReferences({ onEvent }: EventProps) {
    const open = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch {
            onEvent('No se pudo abrir la referencia.');
        }
    };
    return (
        <Page>
            <Text variant="headlineMedium">What’s new at Google I/O 2026</Text>
            <Text>
                Las muestras reúnen los temas del artículo con componentes de Mobile Design. Reloj y XR son composiciones de demostración;
                las historias conservan sus clips originales.
            </Text>
            <Button icon="open_in_new" onPress={() => void open(io26Article)}>
                Abrir artículo original
            </Button>
            {io26Examples
                .filter((item) => item.id !== 'article')
                .map((item) => (
                    <List.Item
                        key={item.id}
                        title={item.title}
                        leading={<Icon source={item.icon} size={24} />}
                        trailing={<Icon source="open_in_new" size={20} />}
                        onPress={() => void open(item.reference)}
                    />
                ))}
            <Text variant="titleMedium">Material Android is Compose-first</Text>
            <Text>
                Este apartado es un anuncio sobre la implementación de Material en Compose, no un componente visual nuevo para este paquete.
            </Text>
            <Button variant="text" icon="open_in_new" onPress={() => void open('https://m3.material.io/blog/material-is-compose-first')}>
                Leer anuncio
            </Button>
        </Page>
    );
}

export function Io26ExampleContent({ scenario, onEvent, onBack }: EventProps & { scenario: Io26Scenario; onBack?: () => void }) {
    const theme = useMobileTheme();
    switch (scenario) {
        case 'shrine':
            return <ShrineProductExample onBack={onBack} />;
        case 'layout':
            return <AdaptiveLayout />;
        case 'spacing':
            return <SpacingExample onEvent={onEvent} />;
        case 'lists':
            return (
                <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                    <ListReorderExample onEvent={onEvent} />
                </ScrollView>
            );
        case 'menus':
            return <RecipeExamples search={false} onEvent={onEvent} />;
        case 'search':
            return <RecipeExamples search onEvent={onEvent} />;
        case 'watch':
            return (
                <MobileDesignProvider
                    colorScheme="dark"
                    motion="expressive"
                    fontFamily="Roboto"
                    reduceMotion={theme.animation.scale === 0 ? 'on' : 'auto'}
                >
                    <WatchPlayer onEvent={onEvent} />
                </MobileDesignProvider>
            );
        case 'xr':
            return <SpatialAlbum onEvent={onEvent} />;
        case 'transparent':
        case 'gemini':
            return <ArticleMedia key={scenario} kind={scenario} />;
        case 'article':
            return <ArticleReferences onEvent={onEvent} />;
    }
}

function Io26ScreenFrame({
    scenario,
    onBack,
    reduceMotion,
    onReduceMotion,
    onToggleTheme,
}: {
    scenario: Io26Scenario;
    onBack: () => void;
    reduceMotion: boolean;
    onReduceMotion: () => void;
    onToggleTheme: () => void;
}) {
    const theme = useMobileTheme(),
        focused = useIsFocused();
    const [message, setMessage] = useState('');
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID={`md-io26-screen-${scenario}`}>
            {focused ? <StatusBar style={theme.dark ? 'light' : 'dark'} /> : null}
            {scenario !== 'shrine' ? (
                <TopAppBar
                    title={io26Examples.find((item) => item.id === scenario)?.title ?? 'I/O 2026'}
                    navigationIcon="arrow_back"
                    navigationLabel="Volver a Mobile Design"
                    onNavigationPress={onBack}
                    actions={[
                        {
                            key: 'motion',
                            icon: reduceMotion ? 'motion_photos_off' : 'motion_play',
                            label: reduceMotion ? 'Activar movimiento' : 'Reducir movimiento',
                            onPress: onReduceMotion,
                            testID: 'md-io26-motion',
                        },
                        {
                            key: 'theme',
                            icon: theme.dark ? 'light_mode' : 'dark_mode',
                            label: 'Cambiar tema de la muestra',
                            onPress: onToggleTheme,
                            testID: 'md-io26-theme',
                        },
                    ]}
                    testID="md-io26-appbar"
                />
            ) : null}
            <Io26ExampleContent scenario={scenario} onEvent={setMessage} onBack={onBack} />
            <Snackbar
                visible={Boolean(message)}
                onDismiss={() => setMessage('')}
                onIconPress={() => setMessage('')}
                testID="md-io26-feedback"
            >
                {message}
            </Snackbar>
        </View>
    );
}

export function MobileDesignIo26Screen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'MobileDesignIo26'>) {
    const [colorScheme, setColorScheme] = useState(route.params.colorScheme);
    const [reduceMotion, setReduceMotion] = useState(route.params.reduceMotion);
    return (
        <MobileDesignProvider colorScheme={colorScheme} motion="expressive" fontFamily="Roboto" reduceMotion={reduceMotion ? 'on' : 'auto'}>
            <Io26ScreenFrame
                scenario={route.params.scenario}
                onBack={() => navigation.goBack()}
                reduceMotion={reduceMotion}
                onReduceMotion={() => {
                    const next = !reduceMotion;
                    setReduceMotion(next);
                    navigation.setParams({ reduceMotion: next });
                }}
                onToggleTheme={() => setColorScheme((value) => (value === 'dark' ? 'light' : 'dark'))}
            />
        </MobileDesignProvider>
    );
}
