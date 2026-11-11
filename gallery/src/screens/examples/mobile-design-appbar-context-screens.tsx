import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image, Keyboard, Platform, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
    Avatar,
    Button,
    Carousel,
    Chip,
    DatePicker,
    Dialog,
    Divider,
    Icon,
    IconButton,
    List,
    LocaleProvider,
    Menu,
    SearchView,
    Snackbar,
    Text,
    TextField,
    TopAppBar,
    TouchableRipple,
    useAppBarScrollBehavior,
    useMobileTheme,
    type TopAppBarAction,
} from 'mobile-design/react-native';
import type { AppBarUsageScenario } from './mobile-design-appbar-usage-data';
import { appBarRecapPhotos, appBarReferenceImages } from './mobile-design-appbar-reference-images';

type BackProps = { onBack: () => void };

type Scroll = React.ComponentRef<typeof ScrollView>;

type NewsRoutes = { NewsFeed: undefined; NewsArticle: { key: string } };
const NewsStack = createNativeStackNavigator<NewsRoutes>();

/** Only the photo is raster content; controls and page content remain live. */

function SceneArt({ index = 0, height = 180 }: { index?: number; height?: number }) {
    return (
        <Image
            source={appBarRecapPhotos[index % appBarRecapPhotos.length]}
            resizeMode="cover"
            accessible={false}
            style={{ width: '100%', height }}
        />
    );
}

function Wordmark() {
    const theme = useMobileTheme();
    return (
        <Image
            source={require('./assets/app-bars/fortnightly_title.png')}
            resizeMode="contain"
            accessibilityLabel="The Fortnightly"
            style={{ width: 165, height: 27, tintColor: theme.colors.onSurface, maxWidth: '100%' }}
        />
    );
}

function Notice({ children }: { children: ReactNode }) {
    const theme = useMobileTheme();
    return (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, paddingHorizontal: 24, paddingVertical: 12 }}>
            {children}
        </Text>
    );
}

function useSearchOverlay(items: readonly { key: string; title: string; description?: string }[], onChoose: (key: string) => void) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const pending = useRef<string | null>(null);
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            pending.current = null;
        };
    }, []);
    const start = () => {
        pending.current = null;
        setOpen(true);
    };
    const needle = query.trim().toLocaleLowerCase();
    const overlay = (
        <SearchView
            open={open}
            onOpenChange={(value) => {
                if (value) pending.current = null;
                setOpen(value);
            }}
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            onSearch={setQuery}
            results={items
                .filter((item) => `${item.title} ${item.description ?? ''}`.toLocaleLowerCase().includes(needle))
                .map((item) => ({ ...item, icon: 'search' }))}
            onResultPress={(item) => {
                pending.current = item.key;
                setQuery(item.title);
                setOpen(false);
            }}
            onClosed={() => {
                const key = pending.current;
                pending.current = null;
                if (alive.current && key !== null) onChoose(key);
            }}
            renderTrigger={() => null}
            testID="md-appbar-context-search"
        />
    );
    return { start, overlay };
}
const news = [
    {
        key: 'mushrooms',
        title: 'Nuclear-Waste Eating Mushrooms That Will Clean Up the World',
        description: 'Top News · 1 hour ago',
    },
    {
        key: 'future',
        title: 'The future of cities is closer than we think',
        description: 'Design · 2 hours ago',
    },
    { key: 'ocean', title: 'A new perspective on the ocean', description: 'Science · 3 hours ago' },
    {
        key: 'garden',
        title: 'The quiet power of a community garden',
        description: 'Culture · 4 hours ago',
    },
    { key: 'journey', title: 'A journey through the mountains', description: 'Travel · 5 hours ago' },
    {
        key: 'studio',
        title: 'Inside the studios shaping our everyday lives',
        description: 'Design · 6 hours ago',
    },
];

export function AppBarNewsScreen({ onBack, branded = false }: BackProps & { branded?: boolean }) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets();
    const bar = useAppBarScrollBehavior({ behavior: branded ? 'exit-until-collapsed' : 'pinned' });
    const scroll = useRef<Scroll>(null);
    const navigation = useRef<NativeStackNavigationProp<NewsRoutes, 'NewsFeed'> | null>(null);
    const [saved, setSaved] = useState<string[]>([]);
    const [section, setSection] = useState('Top News');
    const [nav, setNav] = useState(false);
    const [more, setMore] = useState(false);
    const choose = (key: string | null) => {
        if (key !== null) navigation.current?.navigate('NewsArticle', { key });
        else {
            bar.reset();
            scroll.current?.scrollTo({ y: 0, animated: false });
        }
    };
    const search = useSearchOverlay(news, (key) => choose(key));
    const visible = section === 'Saved' ? news.filter((item) => saved.includes(item.key)) : news;
    return (
        <NewsStack.Navigator
            screenOptions={{
                headerShown: false,
                animation: theme.animation.scale === 0 ? 'none' : 'default',
                gestureEnabled: true,
                contentStyle: { backgroundColor: theme.colors.surface },
            }}
        >
            <NewsStack.Screen
                name="NewsFeed"
                listeners={({ navigation: value }) => ({
                    focus: () => {
                        navigation.current = value;
                    },
                })}
            >
                {() => (
                    <View
                        style={{ flex: 1, backgroundColor: theme.colors.surface }}
                        testID={`md-appbar-use-${branded ? 'brand' : 'scroll-color'}`}
                    >
                        <TopAppBar
                            title={branded ? section : section === 'Saved' ? 'Saved stories' : 'Top Stories'}
                            variant={branded ? 'medium-flexible' : 'small'}
                            textAlign={branded ? 'center' : 'start'}
                            image={branded ? <Wordmark /> : undefined}
                            scrollBehavior={bar}
                            navigationIcon={branded ? 'menu' : 'arrow_back'}
                            navigationLabel={branded ? 'Abrir secciones' : 'Volver'}
                            onNavigationPress={branded ? () => setNav(true) : onBack}
                            actions={branded ? [{ key: 'search', icon: 'search', label: 'Buscar noticias', onPress: search.start }] : []}
                            trailing={
                                branded ? undefined : (
                                    <Menu
                                        visible={more}
                                        onDismiss={() => setMore(false)}
                                        anchor={
                                            <IconButton
                                                icon="more_vert"
                                                accessibilityLabel="Más opciones"
                                                onPress={() => setMore(true)}
                                                testID="md-appbar-news-more"
                                            />
                                        }
                                        testID="md-appbar-news-overflow"
                                    >
                                        <Menu.Item
                                            title="Search news"
                                            leadingIcon="search"
                                            onPress={() => {
                                                setMore(false);
                                                search.start();
                                            }}
                                            testID="md-appbar-news-search"
                                        />
                                        <Menu.Item
                                            title={section === 'Saved' ? 'Top Stories' : 'Saved stories'}
                                            leadingIcon="bookmark"
                                            onPress={() => {
                                                setMore(false);
                                                setSection(section === 'Saved' ? 'Top News' : 'Saved');
                                                choose(null);
                                            }}
                                            testID="md-appbar-news-saved"
                                        />
                                    </Menu>
                                )
                            }
                            testID="md-appbar-news-bar"
                        />
                        <Animated.ScrollView
                            ref={scroll}
                            onScroll={bar.onScroll}
                            scrollEventThrottle={16}
                            contentInsetAdjustmentBehavior="never"
                            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                            testID="md-appbar-news-scroll"
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                        >
                            {branded || section === 'Saved' ? (
                                <Text variant="titleLarge" style={{ padding: 24 }}>
                                    {section}
                                </Text>
                            ) : (
                                <View
                                    style={{
                                        paddingHorizontal: 24,
                                        paddingVertical: 8,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 16,
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text variant="bodyLarge">Good morning, Sam</Text>
                                        <Text variant="bodyLarge">Wed, October 27</Text>
                                    </View>
                                    <Text variant="headlineSmall">70° F</Text>
                                    <Icon source="partly_cloudy_day" size={32} color="#E8B933" />
                                </View>
                            )}
                            {!visible.length ? (
                                <Notice>Saved articles appear here. Open a story and use its bookmark action.</Notice>
                            ) : null}
                            {[...visible, ...visible].map((item, index) => (
                                <TouchableRipple
                                    key={`${item.key}-${index}`}
                                    onPress={() => choose(item.key)}
                                    accessibilityRole="button"
                                    accessibilityLabel={item.title}
                                    testID={`md-appbar-news-${index}`}
                                >
                                    <View pointerEvents="none" style={{ padding: 24, gap: 12 }}>
                                        <Image
                                            source={
                                                index === 0
                                                    ? appBarReferenceImages.mushrooms
                                                    : appBarRecapPhotos[index % appBarRecapPhotos.length]
                                            }
                                            resizeMode="cover"
                                            accessible={false}
                                            style={{ width: '100%', height: 180, borderRadius: index === 0 ? 90 : 24 }}
                                        />
                                        <Text variant="headlineSmall">{item.title}</Text>
                                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                            {item.description}
                                        </Text>
                                        <Divider />
                                    </View>
                                </TouchableRipple>
                            ))}
                        </Animated.ScrollView>
                        {search.overlay}
                        <Dialog visible={nav} onDismiss={() => setNav(false)} testID="md-appbar-news-sections">
                            <Dialog.Title>The Fortnightly</Dialog.Title>
                            <Dialog.Content>
                                {['Top News', 'Saved'].map((value) => (
                                    <List.Item
                                        key={value}
                                        title={value}
                                        leading={<Icon source={value === 'Saved' ? 'bookmark' : 'newspaper'} size={24} />}
                                        onPress={() => {
                                            setSection(value);
                                            choose(null);
                                            setNav(false);
                                        }}
                                    />
                                ))}
                                <List.Item title="App bars" leading={<Icon source="arrow_back" size={24} />} onPress={onBack} />
                            </Dialog.Content>
                        </Dialog>
                    </View>
                )}
            </NewsStack.Screen>
            <NewsStack.Screen name="NewsArticle">
                {({ navigation: detailNavigation, route }) => {
                    const current = news.find((item) => item.key === route.params.key);
                    return current ? (
                        <NewsArticle
                            current={current}
                            saved={saved.includes(current.key)}
                            onBack={() => detailNavigation.goBack()}
                            onSave={() =>
                                setSaved((items) =>
                                    items.includes(current.key) ? items.filter((key) => key !== current.key) : [...items, current.key]
                                )
                            }
                        />
                    ) : (
                        <View />
                    );
                }}
            </NewsStack.Screen>
        </NewsStack.Navigator>
    );
}

function NewsArticle({
    current,
    saved,
    onBack,
    onSave,
}: {
    current: (typeof news)[number];
    saved: boolean;
    onBack: () => void;
    onSave: () => void;
}) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets();
    const bar = useAppBarScrollBehavior({ behavior: 'exit-until-collapsed' });
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID="md-appbar-news-article">
            <TopAppBar
                title={current.title}
                variant="medium-flexible"
                navigationIcon="arrow_back"
                onNavigationPress={onBack}
                scrollBehavior={bar}
                actions={[
                    {
                        key: 'save',
                        icon: saved ? 'bookmark_fill1' : 'bookmark-outline',
                        label: saved ? 'Quitar noticia de guardados' : 'Guardar noticia',
                        onPress: onSave,
                    },
                ]}
                testID="md-appbar-news-article-bar"
            />
            <Animated.ScrollView
                onScroll={bar.onScroll}
                scrollEventThrottle={16}
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <SceneArt index={news.indexOf(current)} height={240} />
                <View style={{ padding: 24, gap: 20 }}>
                    <Text variant="labelMedium">{current.description}</Text>
                    <Text variant="headlineSmall">{current.title}</Text>
                    {Array.from({ length: 14 }, (_, index) => (
                        <Text variant="bodyLarge" key={index}>
                            {index === 0 ? 'A new way to see the world.' : 'From the field'} · Small discoveries invite us to look more
                            closely at the places we share. Researchers and local communities are working together to understand what comes
                            next.
                        </Text>
                    ))}
                </View>
            </Animated.ScrollView>
        </View>
    );
}
const openingMessages = [
    'Hey! Want to meet up for lunch today?',
    "Yes! I'd love to. Where should we go?",
    "I've been wanting to try that new place downtown.",
    'Sounds good! What time works for you?',
    'How about 12:30?',
    'Perfect. See you there!',
    'I saved a table by the window.',
    "Great, I'll be there in ten minutes.",
];

export function AppBarChatScreen({ onBack, adaptive = false, viewportWidth }: BackProps & { adaptive?: boolean; viewportWidth?: number }) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets(),
        window = useWindowDimensions();
    const wide = (viewportWidth ?? window.width) >= 600;
    const bar = useAppBarScrollBehavior({ behavior: adaptive ? 'pinned' : 'enter-always' });
    const scroll = useRef<Scroll>(null),
        rowY = useRef<Record<string, number>>({});
    const [messages, setMessages] = useState(() =>
        [...openingMessages, ...openingMessages, ...openingMessages].map((text, index) => ({ key: String(index), title: text }))
    );
    const [draft, setDraft] = useState(''),
        [menu, setMenu] = useState(false),
        [calendar, setCalendar] = useState(false);
    useEffect(() => {
        if (adaptive && wide) setMenu(false);
    }, [adaptive, wide]);
    const [date, setDate] = useState<Date>(),
        [people, setPeople] = useState(false),
        [member, setMember] = useState(false);
    const [archived, setArchived] = useState(false),
        [archiveNotice, setArchiveNotice] = useState(false);
    const [call, setCall] = useState(false),
        [muted, setMuted] = useState(false),
        [selected, setSelected] = useState('');
    const scrollAfterSend = useRef(false);
    const append = (title: string) => {
        setMessages((items) => [...items, { key: `message-${items.length}`, title }]);
    };
    const search = useSearchOverlay(messages, (key) => {
        setSelected(key);
        scroll.current?.scrollTo({ y: Math.max(0, rowY.current[key] ?? 0), animated: theme.animation.scale !== 0 });
    });
    const secondary: TopAppBarAction[] = [
        { key: 'today', icon: 'today_fill1', label: 'Planear encuentro', onPress: () => setCalendar(true) },
        { key: 'person', icon: 'person_add', label: 'Añadir participante', onPress: () => setPeople(true) },
        {
            key: 'archive',
            icon: archived ? 'unarchive' : 'archive',
            label: archived ? 'Desarchivar conversación' : 'Archivar conversación',
            onPress: () => {
                setArchived((value) => !value);
                setArchiveNotice(!archived);
            },
        },
    ];
    const direct: TopAppBarAction[] = [
        ...(!adaptive ? [{ key: 'call', icon: 'call', label: 'Abrir llamada de demostración', onPress: () => setCall(true) }] : []),
        { key: 'search', icon: 'search', label: 'Buscar en la conversación', onPress: search.start },
        ...(adaptive && wide ? secondary : []),
    ];
    return (
        <View
            style={{ flex: 1, backgroundColor: theme.colors.surface }}
            testID={`md-appbar-use-${adaptive ? 'adaptive-actions' : 'scroll-hide'}`}
        >
            <TopAppBar
                title={member ? 'Aki Aro, Sam' : 'Aki Aro'}
                variant="small"
                navigationIcon="arrow_back"
                onNavigationPress={onBack}
                scrollBehavior={bar}
                actions={direct}
                trailing={
                    adaptive && wide ? undefined : (
                        <Menu
                            visible={menu}
                            onDismiss={() => setMenu(false)}
                            anchor={
                                <IconButton
                                    icon="more_vert"
                                    accessibilityLabel="Más opciones de la conversación"
                                    onPress={() => setMenu(true)}
                                    testID="md-appbar-chat-overflow"
                                />
                            }
                        >
                            {secondary.map((action) => (
                                <Menu.Item
                                    key={action.key}
                                    title={action.label}
                                    leadingIcon={action.icon}
                                    onPress={() => {
                                        setMenu(false);
                                        action.onPress({} as never);
                                    }}
                                    testID={`md-appbar-chat-menu-${action.key}`}
                                />
                            ))}
                        </Menu>
                    )
                }
                testID="md-appbar-chat-bar"
            />
            <Animated.ScrollView
                ref={scroll}
                onScroll={bar.onScroll}
                scrollEventThrottle={16}
                contentInsetAdjustmentBehavior="never"
                onContentSizeChange={() => {
                    if (scrollAfterSend.current) {
                        scrollAfterSend.current = false;
                        scroll.current?.scrollToEnd({ animated: theme.animation.scale !== 0 });
                    }
                }}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 16, gap: 12 }}
                testID="md-appbar-chat-scroll"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <Text variant="labelMedium" style={{ textAlign: 'center', padding: 16 }}>
                    Today · 8:43 AM
                </Text>
                {archived ? (
                    <Notice>This conversation is archived. Undo below to restore it.</Notice>
                ) : (
                    messages.map((message, index) => (
                        <View
                            key={message.key}
                            onLayout={(event) => {
                                rowY.current[message.key] = event.nativeEvent.layout.y;
                            }}
                            style={{
                                alignSelf: index % 2 ? 'flex-end' : 'flex-start',
                                maxWidth: '82%',
                                borderRadius: 20,
                                padding: 16,
                                backgroundColor:
                                    selected === message.key
                                        ? theme.colors.tertiaryContainer
                                        : index % 2
                                          ? theme.colors.primaryContainer
                                          : theme.colors.surfaceContainerHigh,
                            }}
                        >
                            <Text style={{ color: index % 2 ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}>
                                {message.title}
                            </Text>
                        </View>
                    ))
                )}
            </Animated.ScrollView>
            <View
                style={{
                    padding: 12,
                    paddingBottom: insets.bottom + 12,
                    flexDirection: 'row',
                    gap: 8,
                    alignItems: 'center',
                }}
            >
                <TextField
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Message Aki Aro"
                    accessibilityLabel="Mensaje para Aki Aro"
                    multiline
                    variant="outlined"
                    style={{ flex: 1 }}
                    testID="md-appbar-chat-draft"
                />
                <IconButton
                    icon="send_fill1"
                    mode="contained"
                    accessibilityLabel="Enviar mensaje"
                    disabled={!draft.trim() || archived}
                    onPress={() => {
                        scrollAfterSend.current = true;
                        append(draft.trim());
                        setDraft('');
                        Keyboard.dismiss();
                    }}
                    testID="md-appbar-chat-send"
                />
            </View>
            {search.overlay}
            <DatePicker
                visible={calendar}
                value={date}
                onDismiss={() => setCalendar(false)}
                onChange={(value) => {
                    if (value instanceof Date) {
                        setDate(value);
                        append(`Meetup: ${value.toLocaleDateString()}`);
                    }
                    setCalendar(false);
                }}
            />
            <Dialog visible={people} onDismiss={() => setPeople(false)}>
                <Dialog.Title>Add participant</Dialog.Title>
                <Dialog.Content>
                    <List.Item
                        title="Sam"
                        description={member ? 'Already in the conversation' : 'Add to this conversation'}
                        leading={<Icon source="person" size={24} />}
                        onPress={() => {
                            setMember(true);
                            setPeople(false);
                        }}
                        testID="md-appbar-chat-add-sam"
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setPeople(false)}>
                        Cancel
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <Dialog visible={call} onDismiss={() => setCall(false)}>
                <Dialog.Title>Aki Aro</Dialog.Title>
                <Dialog.Content>
                    <Text>Local call preview · no call is placed.</Text>
                    <Button
                        variant="tonal"
                        icon={muted ? 'mic_off' : 'mic'}
                        style={{ alignSelf: 'flex-start' }}
                        onPress={() => setMuted(!muted)}
                    >
                        {muted ? 'Unmute' : 'Mute'}
                    </Button>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setCall(false)}>
                        End preview
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <Snackbar
                visible={archiveNotice}
                onDismiss={() => setArchiveNotice(false)}
                duration={10000}
                action={{
                    label: 'Undo',
                    onPress: () => {
                        setArchived(false);
                        setArchiveNotice(false);
                    },
                }}
            >
                Conversation archived
            </Snackbar>
        </View>
    );
}

export function AppBarAlbumScreen({ onBack, hiking = false }: BackProps & { hiking?: boolean }) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets(),
        window = useWindowDimensions();
    const bar = useAppBarScrollBehavior({ behavior: 'exit-until-collapsed' });
    const [favorite, setFavorite] = useState(false),
        [photo, setPhoto] = useState<number | null>(null),
        [route, setRoute] = useState(false);
    const [started, setStarted] = useState(false);
    const [photoOpen, setPhotoOpen] = useState(false);
    const [gridWidth, setGridWidth] = useState(0);
    // A percentage rounded independently from a fixed gap can push the second
    // tile onto another row at 320dp. The grid's measured pane owns its geometry.
    const paneWidth = Math.max(1, gridWidth || window.width - insets.left - insets.right - 24);
    const itemWidth = Math.max(1, (paneWidth - 4) / 2);
    const leftWidth = Math.max(1, ((paneWidth - 4) * 4) / 7);
    const rightWidth = Math.max(1, paneWidth - leftWidth - 4);
    const photos = Array.from({ length: 24 }, (_, index) => ({
        key: String(index),
        title: hiking ? `Stop ${index + 1}` : `June ${12 + (index % 8)} · Photo ${index + 1}`,
    }));
    const openPhoto = (index: number) => {
        setPhoto(index);
        setPhotoOpen(true);
    };
    const search = useSearchOverlay(photos, (key) => openPhoto(Number(key)));
    const tile = (index: number, width: number, height: number, round = false) => (
        <TouchableRipple
            key={index}
            style={{ width, height, borderRadius: round ? height / 2 : 12, overflow: 'hidden' }}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${photos[index].title}`}
            onPress={() => openPhoto(index)}
            testID={`md-appbar-album-photo-${index}`}
        >
            <Image
                source={appBarRecapPhotos[index % appBarRecapPhotos.length]}
                resizeMode="cover"
                accessible={false}
                style={{ width: '100%', height: '100%' }}
            />
        </TouchableRipple>
    );
    return (
        <View
            style={{ flex: 1, backgroundColor: theme.colors.surface }}
            testID={`md-appbar-use-${hiking ? 'text-wrap' : 'scroll-collapse'}`}
        >
            <TopAppBar
                title={hiking ? 'Hiking trips with Elie in Santa Monica and Joshua Tree!' : 'Recap from June 12–19'}
                variant={hiking ? 'medium-flexible' : 'large-flexible'}
                navigationIcon="arrow_back"
                onNavigationPress={onBack}
                scrollBehavior={bar}
                actions={[
                    {
                        key: 'search',
                        icon: hiking ? 'map_fill1' : 'search',
                        label: hiking ? 'Ver el recorrido' : 'Buscar en el álbum',
                        onPress: hiking ? () => setRoute(true) : search.start,
                    },
                    {
                        key: hiking ? 'hiking' : 'favorite',
                        icon: hiking ? 'hiking' : favorite ? 'favorite_fill1' : 'favorite',
                        label: hiking
                            ? started
                                ? 'Pausar recorrido'
                                : 'Iniciar recorrido'
                            : favorite
                              ? 'Quitar de favoritos'
                              : 'Añadir a favoritos',
                        onPress: hiking ? () => setStarted(!started) : () => setFavorite(!favorite),
                    },
                ]}
                testID="md-appbar-album-bar"
            />
            <Animated.ScrollView
                onScroll={bar.onScroll}
                scrollEventThrottle={16}
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                testID="md-appbar-album-scroll"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <View
                    onLayout={(event) => {
                        const width = event.nativeEvent.layout.width;
                        setGridWidth((previous) => (previous === width ? previous : width));
                    }}
                    style={{
                        marginLeft: insets.left + 12,
                        marginRight: insets.right + 12,
                        gap: 8,
                    }}
                    testID="md-appbar-album-grid"
                >
                    {hiking ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {[4, 0, 5].map((index) => tile(index, (paneWidth - 16) / 3, ((paneWidth - 16) / 3) * 1.8))}
                        </View>
                    ) : (
                        <View style={{ flexDirection: 'row', gap: 4 }} testID="md-appbar-recap-masonry">
                            <View style={{ width: leftWidth, gap: 4 }}>
                                {tile(0, leftWidth, leftWidth)}
                                <View style={{ flexDirection: 'row', gap: 4 }}>
                                    {[3, 4, 5].map((index) => tile(index, (leftWidth - 8) / 3, leftWidth * 0.3))}
                                </View>
                            </View>
                            <View style={{ width: rightWidth, gap: 4 }}>
                                {tile(1, rightWidth, rightWidth * 0.74)}
                                {tile(2, rightWidth, rightWidth, true)}
                            </View>
                        </View>
                    )}
                    {tile(6, paneWidth, paneWidth * 0.45)}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                        {photos.slice(7).map((_, offset) => tile(offset + 7, itemWidth, itemWidth))}
                    </View>
                    {hiking && started ? <Text accessibilityLiveRegion="polite">Route started · Next stop: Santa Monica</Text> : null}
                </View>
            </Animated.ScrollView>
            {search.overlay}
            <Dialog
                visible={photoOpen}
                onDismiss={() => setPhotoOpen(false)}
                onClosed={() => {
                    if (!photoOpen) setPhoto(null);
                }}
                testID="md-appbar-album-photo-dialog"
            >
                <Dialog.Title>{photo === null ? '' : photos[photo]?.title}</Dialog.Title>
                <Dialog.ScrollArea style={{ borderTopWidth: 0, borderBottomWidth: 0 }}>
                    <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                        <SceneArt index={photo ?? 0} height={240} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                            <IconButton
                                icon="arrow_back"
                                accessibilityLabel="Previous photo"
                                disabled={!photoOpen || photo === null || photo === 0}
                                onPress={() => setPhoto((value) => Math.max(0, (value ?? 0) - 1))}
                            />
                            <Text variant="labelLarge">
                                {(photo ?? 0) + 1} / {photos.length}
                            </Text>
                            <IconButton
                                icon="arrow_forward"
                                accessibilityLabel="Next photo"
                                disabled={!photoOpen || photo === null || photo === photos.length - 1}
                                onPress={() => setPhoto((value) => Math.min(photos.length - 1, (value ?? 0) + 1))}
                            />
                        </View>
                    </ScrollView>
                </Dialog.ScrollArea>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setPhotoOpen(false)}>
                        Close
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <Dialog visible={route} onDismiss={() => setRoute(false)}>
                <Dialog.Title>Weekend route</Dialog.Title>
                <Dialog.Content>
                    <RouteMap />
                    <Text>Santa Monica → Joshua Tree</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setRoute(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="text"
                        onPress={() => {
                            setStarted(true);
                            setRoute(false);
                        }}
                    >
                        Start route
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
}

function RouteMap() {
    const theme = useMobileTheme();
    const ink = theme.colors.primary;
    return (
        <View
            style={{
                height: 220,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: theme.colors.surfaceContainerHigh,
            }}
            accessible
            accessibilityLabel="Recorrido de demostración entre dos puntos"
        >
            <Svg width="100%" height="100%" viewBox="0 0 320 220">
                <Path d="M-20 80L350 170M45-20L190 240M-10 200L310 10" stroke={ink} strokeWidth={12} opacity={0.12} />
                <Path d="M55 170Q80 160 100 110T250 50" fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" />
                <Circle cx={55} cy={170} r={10} fill={ink} />
                <Circle cx={250} cy={50} r={10} fill={ink} />
            </Svg>
        </View>
    );
}

export function AppBarLetterScreen({ onBack }: BackProps) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets();
    const bar = useAppBarScrollBehavior({ behavior: 'exit-until-collapsed' });
    const [starred, setStarred] = useState(true);
    const [replyOpen, setReplyOpen] = useState(false),
        [reply, setReply] = useState(''),
        [sentReply, setSentReply] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const collapse = bar.collapseProgress;
    useAnimatedReaction(
        () => collapse.get() > 0.01,
        (active, previous) => {
            if (active !== previous) scheduleOnRN(setScrolled, active);
        },
        Platform.OS === 'web' ? [collapse] : undefined
    );
    const metrics = bar._metrics;
    const spacer = useAnimatedStyle(() => ({ height: metrics.get().top + metrics.get().expanded }));
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID="md-appbar-use-transparent">
            <Animated.ScrollView
                onScroll={bar.onScroll}
                scrollEventThrottle={16}
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                testID="md-appbar-letter-scroll"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <Animated.View style={spacer} pointerEvents="none" />
                <View style={{ paddingLeft: insets.left + 24, paddingRight: insets.right + 24, gap: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <Avatar.Image source={appBarReferenceImages.letterAvatar} size={40} />
                        <View style={{ flex: 1, gap: 4 }}>
                            <Text variant="titleMedium">So Duri</Text>
                            <Text variant="labelMedium">Feb 28</Text>
                        </View>
                        <IconButton
                            icon="reply"
                            accessibilityLabel="Responder a So Duri"
                            onPress={() => setReplyOpen(true)}
                            testID="md-appbar-letter-reply"
                        />
                    </View>
                    <Text variant="bodyLarge">
                        Hey!!! I've got pics and more info on our cabin for the weekend! Get ready to be impressed – it looks absolutely
                        incredible from what I can see.
                    </Text>
                    {Array.from({ length: 14 }, (_, index) => (
                        <Text variant="bodyLarge" key={index}>
                            {index % 2 ? 'Back at home' : 'Out on the trail'}, we have been taking time to enjoy the season. The puppy has
                            discovered a new favorite place to explore, and every walk seems to turn into a story of its own.
                        </Text>
                    ))}
                    <Text variant="bodyLarge">
                        With love,<Text> Alex</Text>
                    </Text>
                    <Text variant="labelMedium" accessibilityLiveRegion="polite">
                        {starred ? 'Letter saved to starred.' : 'Use the star to save this letter.'}
                    </Text>
                    {sentReply ? (
                        <View style={{ padding: 16, borderRadius: 16, backgroundColor: theme.colors.surfaceContainer }}>
                            <Text variant="labelLarge">Your reply</Text>
                            <Text accessibilityLiveRegion="polite">{sentReply}</Text>
                        </View>
                    ) : null}
                </View>
            </Animated.ScrollView>
            <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                <TopAppBar
                    title="Our cabin for the weekend"
                    collapsedTitle={null}
                    variant="medium-flexible"
                    containerColor="transparent"
                    scrolledContainerColor="transparent"
                    scrollBehavior={bar}
                    navigationIcon="arrow_back"
                    navigationMode={scrolled ? 'contained-tonal' : undefined}
                    navigationWidthVariant={scrolled ? 'narrow' : 'default'}
                    onNavigationPress={onBack}
                    actions={[
                        {
                            key: 'star',
                            icon: starred ? 'star_fill1' : 'star-outline',
                            mode: 'contained-tonal',
                            label: starred ? 'Quitar carta de destacados' : 'Destacar carta',
                            onPress: () => setStarred(!starred),
                        },
                    ]}
                    testID="md-appbar-letter-bar"
                />
            </View>
            <Dialog visible={replyOpen} onDismiss={() => setReplyOpen(false)} testID="md-appbar-letter-reply-dialog">
                <Dialog.Title>Reply to So Duri</Dialog.Title>
                <Dialog.Content>
                    <TextField
                        value={reply}
                        onChangeText={setReply}
                        multiline
                        label="Message"
                        variant="outlined"
                        testID="md-appbar-letter-reply-input"
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setReplyOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="text"
                        disabled={!reply.trim()}
                        onPress={() => {
                            setSentReply(reply.trim());
                            setReply('');
                            setReplyOpen(false);
                        }}
                        testID="md-appbar-letter-reply-send"
                    >
                        Send
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
}

export function AppBarImageScreen({ onBack }: BackProps) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets();
    const [dialog, setDialog] = useState(false),
        [recipient, setRecipient] = useState('Aki Aro'),
        [sent, setSent] = useState(false);
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID="md-appbar-use-primary-action">
            <TopAppBar
                title="Image"
                subtitle="7.2 MB · PNG"
                variant="large-flexible"
                navigationIcon="arrow_back"
                onNavigationPress={onBack}
                trailing={
                    <View style={{ paddingHorizontal: 4 }}>
                        <Button
                            variant="filled"
                            size="small"
                            style={{ alignSelf: 'flex-start' }}
                            icon={sent ? 'check' : 'send_fill1'}
                            disabled={sent}
                            onPress={() => setDialog(true)}
                            testID="md-appbar-image-send"
                        >
                            {sent ? 'Sent' : 'Send'}
                        </Button>
                    </View>
                }
                testID="md-appbar-image-bar"
            />
            <ScrollView
                contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24, gap: 24 }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <Image
                    source={appBarReferenceImages.send}
                    resizeMode="cover"
                    accessible={false}
                    style={{ width: '100%', height: 420, borderRadius: 24 }}
                />
                <Text variant="labelMedium" accessibilityLiveRegion="polite" testID="md-appbar-image-status">
                    {sent ? `Image sent to ${recipient}.` : 'Image preview'}
                </Text>
            </ScrollView>
            <Dialog visible={dialog} onDismiss={() => setDialog(false)} testID="md-appbar-image-recipients">
                <Dialog.Title>Send image</Dialog.Title>
                <Dialog.Content>
                    {['Aki Aro', 'Dagmar', 'So Duri'].map((name) => (
                        <List.Item
                            key={name}
                            title={name}
                            trailing={<Icon source={recipient === name ? 'radio_button_checked' : 'radio_button_unchecked'} size={24} />}
                            onPress={() => setRecipient(name)}
                            testID={`md-appbar-image-recipient-${name.replaceAll(' ', '-')}`}
                        />
                    ))}
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="text"
                        onPress={() => {
                            setSent(true);
                            setDialog(false);
                        }}
                        testID="md-appbar-image-confirm"
                    >
                        Send
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
}

export function AppBarTopTrailsScreen({ onBack }: BackProps) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets();
    const bar = useAppBarScrollBehavior({ behavior: 'exit-until-collapsed' });
    const [saved, setSaved] = useState(true),
        [selected, setSelected] = useState(''),
        [started, setStarted] = useState(false);
    const [trailOpen, setTrailOpen] = useState(false);
    const openTrail = (name: string) => {
        setSelected(name);
        setStarted(false);
        setTrailOpen(true);
    };
    const trails = [
        'Santa Monica',
        'Joshua Tree',
        'Coastal trail',
        'Canyon loop',
        'Sunset ridge',
        'Pine forest',
        'Valley path',
        'Desert garden',
        'Mountain lake',
        'Wildflower way',
    ];
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID="md-appbar-use-top-trails">
            <TopAppBar
                title="Top 10 hiking trails"
                subtitle="Discover popular trails"
                variant="large-flexible"
                navigationIcon="arrow_back"
                onNavigationPress={onBack}
                scrollBehavior={bar}
                actions={[
                    {
                        key: 'save',
                        icon: saved ? 'bookmark_fill1' : 'bookmark-outline',
                        mode: 'contained-tonal',
                        label: saved ? 'Quitar colección de guardados' : 'Guardar colección',
                        onPress: () => setSaved(!saved),
                    },
                ]}
                testID="md-appbar-trails-bar"
            />
            <Animated.ScrollView
                onScroll={bar.onScroll}
                scrollEventThrottle={16}
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 24 }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <Carousel
                    items={trails.map((title, index) => ({
                        id: String(index),
                        title,
                        description: `${(index + 2) * 1.2} km`,
                        image: [appBarReferenceImages.dog, appBarReferenceImages.trailSky, appBarReferenceImages.trailMap][index % 3],
                    }))}
                    variant="multi-browse"
                    alignment="center"
                    initialIndex={1}
                    height={280}
                    preferredItemWidth={240}
                    showControls={false}
                    textPlacement="below"
                    onItemPress={(item) => {
                        openTrail(item.title);
                    }}
                    testID="md-appbar-trails-carousel"
                />
                <Text accessibilityLiveRegion="polite" style={{ paddingHorizontal: 24 }}>
                    {saved ? 'Collection saved.' : 'Find your next favorite trail.'}
                </Text>
                {trails.map((name, index) => (
                    <List.Item
                        key={name}
                        title={name}
                        description={`${(index + 2) * 1.2} km · ${(index + 1) * 30} min`}
                        leading={<Text>{index + 1}</Text>}
                        trailing={<Icon source="chevron_right" size={24} />}
                        onPress={() => {
                            openTrail(name);
                        }}
                    />
                ))}
            </Animated.ScrollView>
            <Dialog
                visible={trailOpen}
                onDismiss={() => setTrailOpen(false)}
                onClosed={() => {
                    if (!trailOpen) setSelected('');
                }}
            >
                <Dialog.Title>{selected}</Dialog.Title>
                <Dialog.Content>
                    <RouteMap />
                    <Text accessibilityLiveRegion="polite">
                        {started ? `Route started: ${selected}` : 'Review the route before starting.'}
                    </Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setTrailOpen(false)}>
                        Close
                    </Button>
                    <Button variant="text" disabled={started} onPress={() => setStarted(true)}>
                        Start route
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
}

/** Guidelines Usage figure: the article and Share action belong to the page. */

export function AppBarSushiScreen({ onBack }: BackProps) {
    const theme = useMobileTheme();
    const insets = useSafeAreaInsets();
    const bar = useAppBarScrollBehavior({ behavior: 'exit-until-collapsed' });
    const [shareError, setShareError] = useState(false);
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    const title = 'The best sushi spots in Los Angeles and Orange County';
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID="md-appbar-use-sushi">
            <TopAppBar
                title={title}
                variant="medium-flexible"
                navigationIcon="arrow_back"
                onNavigationPress={onBack}
                scrollBehavior={bar}
                actions={[
                    {
                        key: 'share',
                        icon: 'share_fill1',
                        mode: 'contained-tonal',
                        widthVariant: 'wide',
                        label: 'Compartir artículo',
                        onPress: async () => {
                            setShareError(false);
                            try {
                                await Share.share({ title, message: title });
                            } catch {
                                if (alive.current) setShareError(true);
                            }
                        },
                    },
                ]}
                testID="md-appbar-sushi-bar"
            />
            <Animated.ScrollView
                onScroll={bar.onScroll}
                scrollEventThrottle={16}
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={{
                    paddingLeft: insets.left + 16,
                    paddingRight: insets.right + 16,
                    paddingBottom: insets.bottom + 24,
                    gap: 24,
                }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <Image
                    source={appBarReferenceImages.sushi}
                    resizeMode="cover"
                    accessible={false}
                    style={{ width: '100%', height: 240, borderRadius: 24 }}
                />
                <Text variant="titleLarge">Explore the collection</Text>
                <Text variant="bodyLarge">
                    A local collection of places to enjoy with friends. Share this article from the action in its app bar.
                </Text>
                {shareError ? <Text accessibilityLiveRegion="polite">The share sheet could not be opened. Try again.</Text> : null}
            </Animated.ScrollView>
        </View>
    );
}

export function AppBarEditorScreen({ onBack, films = false }: BackProps & { films?: boolean }) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets();
    const bar = useAppBarScrollBehavior({ behavior: 'pinned' });
    const [editing, setEditing] = useState(false),
        [sent, setSent] = useState(false),
        [attempted, setAttempted] = useState(false);
    const [draftTitle, setDraftTitle] = useState(films ? 'Must watch films' : 'Weekend plans');
    const [title, setTitle] = useState(draftTitle),
        [body, setBody] = useState('Hi Aki! I found a few places we could explore this weekend. What do you think?');
    const [selected, setSelected] = useState('');
    const [filmOpen, setFilmOpen] = useState(false);
    const filmTitles = ['The Baker', 'A summer in the city', 'Moonlight walk', 'The last train', 'Wild coast', 'A new beginning'];
    const save = () => {
        setAttempted(true);
        if (!draftTitle.trim() || (!films && !body.trim())) return;
        setTitle(draftTitle.trim());
        setEditing(false);
        setAttempted(false);
        Keyboard.dismiss();
        if (!films) setSent(true);
    };
    return (
        <View
            style={{ flex: 1, backgroundColor: theme.colors.surface }}
            testID={`md-appbar-use-${films ? 'adaptive-width' : 'primary-action'}`}
        >
            <TopAppBar
                title={sent ? 'Sent' : title}
                variant="small"
                textAlign={films ? 'center' : 'start'}
                navigationIcon="arrow_back"
                onNavigationPress={onBack}
                scrollBehavior={bar}
                actions={[
                    {
                        key: 'primary',
                        icon: films ? (editing ? 'check' : 'edit') : sent ? 'check' : 'send_fill1',
                        label: films ? (editing ? 'Guardar cambios' : 'Editar lista') : sent ? 'Mensaje enviado' : 'Enviar mensaje',
                        mode: films ? 'contained-tonal' : 'contained',
                        widthVariant: films ? 'default' : 'wide',
                        disabled: sent,
                        onPress: () => (films && !editing ? setEditing(true) : save()),
                    },
                ]}
                testID="md-appbar-editor-bar"
            />
            <Animated.ScrollView
                onScroll={bar.onScroll}
                scrollEventThrottle={16}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24, gap: 24 }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                {editing || !films ? (
                    <>
                        {!films ? <Text variant="labelLarge">To: Aki Aro</Text> : null}
                        <TextField
                            variant="outlined"
                            label={films ? 'List title' : 'Subject'}
                            value={draftTitle}
                            onChangeText={setDraftTitle}
                            readOnly={sent}
                            error={attempted && !draftTitle.trim()}
                            errorText="A title is required."
                            testID="md-appbar-editor-title"
                        />
                        {!films ? (
                            <TextField
                                variant="outlined"
                                label="Message"
                                value={body}
                                onChangeText={setBody}
                                multiline
                                readOnly={sent}
                                error={attempted && !body.trim()}
                                errorText="Write a message before sending."
                                testID="md-appbar-editor-body"
                            />
                        ) : null}
                        {editing && films ? (
                            <Button
                                variant="text"
                                style={{ alignSelf: 'flex-start' }}
                                onPress={() => {
                                    setEditing(false);
                                    setDraftTitle(title);
                                    setAttempted(false);
                                }}
                            >
                                Cancel editing
                            </Button>
                        ) : null}
                    </>
                ) : null}
                {sent ? (
                    <Text accessibilityLiveRegion="polite" testID="md-appbar-editor-sent">
                        Message sent to Aki Aro. The local draft has been completed.
                    </Text>
                ) : null}
                {films ? (
                    filmTitles.map((film, index) => (
                        <TouchableRipple
                            key={film}
                            onPress={() => {
                                setSelected(film);
                                setFilmOpen(true);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Abrir ${film}`}
                        >
                            <View pointerEvents="none" style={{ gap: 12 }}>
                                <Image
                                    source={appBarReferenceImages.baker}
                                    resizeMode="cover"
                                    accessible={false}
                                    style={{ width: '100%', height: 240, borderRadius: 24 }}
                                />
                                <Text variant="titleLarge">{film}</Text>
                                <Text>Movie night · {90 + index * 7} min</Text>
                            </View>
                        </TouchableRipple>
                    ))
                ) : (
                    <Notice>This example completes the send flow locally. No message is sent to a service.</Notice>
                )}
            </Animated.ScrollView>
            <Dialog
                visible={filmOpen}
                onDismiss={() => setFilmOpen(false)}
                onClosed={() => {
                    if (!filmOpen) setSelected('');
                }}
            >
                <Dialog.Title>{selected}</Dialog.Title>
                <Dialog.Content>
                    <SceneArt />
                    <Text>A film saved for your next movie night.</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setFilmOpen(false)}>
                        Close
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
}

export function AppBarInteractionScreen({ onBack, rtl = false }: BackProps & { rtl?: boolean }) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets();
    const [view, setView] = useState<'list' | 'map' | 'walk'>('list'),
        [store, setStore] = useState('');
    const stores = ['Out of the Closet', 'Wasteland', 'Crossroads Trading', 'Goodwill', 'The Local Flea', 'Second Time Around'];
    return (
        <LocaleProvider direction={rtl ? 'rtl' : 'ltr'}>
            <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID={`md-appbar-use-${rtl ? 'rtl' : 'interaction'}`}>
                <TopAppBar
                    title={rtl ? 'חנויות יד שנייה בקרבתי' : 'Thrift stores near me'}
                    variant="small"
                    navigationIcon={rtl ? 'arrow_forward' : 'arrow_back'}
                    onNavigationPress={() => (view === 'list' ? onBack() : setView('list'))}
                    navigationLabel={view === 'list' ? 'Volver a App bars' : 'Volver a tiendas'}
                    actions={[
                        { key: 'map', icon: 'map_fill1', label: 'View on map', onPress: () => setView('map') },
                        {
                            key: 'walk',
                            icon: 'directions_walk',
                            label: 'Walking directions',
                            onPress: () => setView('walk'),
                        },
                    ]}
                    testID="md-appbar-interaction-bar"
                />
                <ScrollView
                    contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    {view !== 'list' ? (
                        <View style={{ padding: 24, gap: 16 }}>
                            <RouteMap />
                            <Text variant="headlineSmall">{view === 'map' ? 'Nearby stores' : `Walk to ${store || stores[0]}`}</Text>
                            {view === 'walk'
                                ? ['Head north on Main Street', 'Turn right at the next corner', `Arrive at ${store || stores[0]}`].map(
                                      (step, index) => <List.Item key={step} title={step} leading={<Text>{index + 1}</Text>} />
                                  )
                                : null}
                        </View>
                    ) : null}
                    {stores.map((name, index) => (
                        <List.Item
                            key={name}
                            title={name}
                            description={`${(0.3 + index * 0.4).toFixed(1)} km · Open until 7 PM`}
                            leading={<Icon source="storefront" size={24} />}
                            trailing={<Icon source={store === name ? 'check' : 'chevron_right'} size={24} />}
                            onPress={() => {
                                setStore(name);
                                setView('walk');
                            }}
                            testID={`md-appbar-store-${index}`}
                        />
                    ))}
                </ScrollView>
            </View>
        </LocaleProvider>
    );
}

/** A real, unscaled layout canvas lets a phone inspect the tablet clips without shrinking targets. */

export function AppBarAdaptiveWindow({ children }: { children: (width: number) => ReactNode }) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets(),
        window = useWindowDimensions();
    const [requestedWidth, setRequestedWidth] = useState<number | null>(null);
    const width = requestedWidth ?? window.width;
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID="md-appbar-adaptive-window">
            <ScrollView
                horizontal
                bounces={false}
                contentContainerStyle={{ width: Math.max(width, window.width), flexGrow: 1 }}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                testID="md-appbar-adaptive-pan"
            >
                <View style={{ width, flex: 1 }}>
                    <SafeAreaInsetsContext.Provider value={{ ...insets, bottom: 0 }}>{children(width)}</SafeAreaInsetsContext.Provider>
                </View>
            </ScrollView>
            <View
                style={{
                    paddingHorizontal: 16,
                    paddingTop: 8,
                    paddingBottom: insets.bottom + 8,
                    gap: 8,
                    backgroundColor: theme.colors.surfaceContainer,
                }}
            >
                <Text variant="labelMedium">
                    Ventana de ejemplo: {Math.round(width)} dp{width > window.width ? ' · desliza horizontalmente' : ''}
                </Text>
                <ScrollView
                    horizontal
                    contentContainerStyle={{ gap: 8 }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    {[null, 320, 600, 840].map((value) => (
                        <Chip
                            key={String(value)}
                            variant="filter"
                            selected={value === requestedWidth}
                            onPress={() => setRequestedWidth(value)}
                            testID={`md-appbar-window-${value ?? 'device'}`}
                        >
                            {value === null ? 'Dispositivo' : `${value} dp`}
                        </Chip>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}
