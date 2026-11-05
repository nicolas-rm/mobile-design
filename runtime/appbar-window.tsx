import { useCallback, useEffect, useRef, useState, type ReactNode, type ComponentRef } from 'react';
import { Image, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, ReduceMotion, cancelAnimation, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import {
    Avatar,
    Button,
    Card,
    ContainerTransformSurface,
    DatePicker,
    Dialog,
    Icon,
    IconButton,
    List,
    MaterialSymbol,
    Menu,
    MobileDesignProvider,
    NavigationRailModal,
    SearchView,
    Text,
    TextField,
    TopAppBar,
    TouchableRipple,
    useAppBarScrollBehavior,
    useLocale,
    useMobileTheme,
    type ContainerTransformOrigin,
    type TopAppBarAction,
} from 'mobile-design';
import { useRuntimeEnvironment } from './environment';
import { useWindowConfiguration } from './component-window';
import { appBarScenes, initialAppBar, type AppBarConfiguration } from './app-bars-data';
const image = (name: string) => ({ uri: location.origin + '/assets/examples/app-bars/' + name + '.png' });
const sceneRows = ['Wizards & Wynona', 'At Peace', 'Everyday Stories', 'Beyond the Horizon', 'Good Nature', 'Creative Matters'];
const navItems = [
    { key: 'home', label: 'Home', icon: 'home_fill1' },
    { key: 'saved', label: 'Saved', icon: 'bookmark_fill1' },
    { key: 'recent', label: 'Recent', icon: 'history' },
];
type WindowConfig = {
    scene: string;
    bar: AppBarConfiguration;
    behavior?: 'pinned' | 'exit-until-collapsed' | 'enter-always';
    snap?: boolean;
};
const initial: WindowConfig = { scene: new URLSearchParams(location.search).get('scene') ?? 'playground', bar: initialAppBar };
function Wordmark() {
    const theme = useMobileTheme();
    return (
        <Image
            source={image('fortnightly_title@4x')}
            resizeMode="contain"
            accessibilityLabel="The Fortnightly"
            style={{ width: 165, height: 27, maxWidth: '100%', tintColor: theme.colors.onSurface }}
        />
    );
}
function Account({ open }: { open: () => void }) {
    const theme = useMobileTheme();
    return (
        <Avatar.Button accessibilityLabel="Abrir cuenta de Alex" onPress={open} testID="appbar-account">
            <Avatar.Text
                label="A"
                size={32}
                color={typeof theme.colors.onPrimaryContainer === 'string' ? theme.colors.onPrimaryContainer : undefined}
                style={{ backgroundColor: theme.colors.primaryContainer }}
            />
        </Avatar.Button>
    );
}
function SearchEntry({
    open,
    disabled,
    expanded,
    value,
    placeholder,
    center,
    voice,
}: {
    open: () => void;
    disabled: boolean;
    expanded: boolean;
    value: string;
    placeholder: string;
    center: boolean;
    voice?: () => void;
}) {
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    const trailingEdge = rtl ? 'left' : 'right';
    return (
        <View style={{ height: 56, borderRadius: 28, overflow: 'hidden' }}>
            <TouchableRipple
                disabled={disabled}
                onPress={open}
                accessibilityRole="button"
                accessibilityLabel={value ? placeholder + ': ' + value : placeholder}
                accessibilityState={{ disabled, expanded }}
                style={{ height: 56, borderRadius: 28, overflow: 'hidden' }}
                testID="appbar-search-entry"
            >
                <View
                    pointerEvents="none"
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        paddingLeft: rtl && voice ? 56 : 16,
                        paddingRight: !rtl && voice ? 56 : 16,
                    }}
                >
                    <Text
                        variant="bodyLarge"
                        numberOfLines={1}
                        style={{ textAlign: center ? 'center' : rtl ? 'right' : 'left', color: theme.colors.onSurfaceVariant }}
                    >
                        {value || placeholder}
                    </Text>
                </View>
            </TouchableRipple>
            {voice ? (
                <View style={{ position: 'absolute', [trailingEdge]: 4, top: 4 }}>
                    <IconButton icon="mic" accessibilityLabel="Buscar por voz" disabled={disabled} onPress={voice} testID="appbar-voice" />
                </View>
            ) : null}
        </View>
    );
}
function WindowBody({ config }: { config: WindowConfig }) {
    const theme = useMobileTheme(),
        { width } = useWindowDimensions();
    const example = appBarScenes.find((entry) => entry.id === config.scene),
        playground = !example,
        kind = example?.kind ?? 'playground';
    const bar = config.bar,
        searchBar = playground ? bar.variant === 'search' : kind === 'search';
    const behavior = config.behavior ?? example?.scroll ?? 'exit-until-collapsed';
    const scroll = useAppBarScrollBehavior({ behavior, snap: config.snap ?? true });
    const contentScroll = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
    const returnToTop = () => {
        contentScroll.current?.scrollTo({ y: 0, animated: false });
        scroll.reset();
    };
    const [section, setSection] = useState(kind === 'news' ? 'Top News' : 'home'),
        [rail, setRail] = useState(false),
        [account, setAccount] = useState(false),
        [calendar, setCalendar] = useState(false),
        [date, setDate] = useState(new Date(2026, 9, 19)),
        [menu, setMenu] = useState(false),
        [share, setShare] = useState(false),
        [voice, setVoice] = useState(false),
        [voiceText, setVoiceText] = useState('');
    const [search, setSearch] = useState(false),
        [query, setQuery] = useState(''),
        [saved, setSaved] = useState(false),
        [status, setStatus] = useState(''),
        [recipient, setRecipient] = useState('Alex'),
        [message, setMessage] = useState('Nos vemos mañana.'),
        [sent, setSent] = useState(false),
        [playing, setPlaying] = useState(''),
        [audioAsset, setAudioAsset] = useState<{ url: string; name: string } | null>(null),
        [filterToday, setFilterToday] = useState(false),
        [title, setTitle] = useState(example?.title ?? bar.title),
        [editing, setEditing] = useState(false),
        [savedRows, setSavedRows] = useState<string[]>([]);
    const [detail, setDetail] = useState<{ title: string; photo?: string; body: string } | null>(null),
        [closing, setClosing] = useState(false),
        [ready, setReady] = useState(false),
        [origin, setOrigin] = useState<ContainerTransformOrigin>();
    const progress = useSharedValue(0),
        closingRef = useRef(false),
        source = useRef<HTMLElement | null>(null),
        pendingSearch = useRef<(() => void) | null>(null),
        pendingVoice = useRef(false),
        alive = useRef(true),
        file = useRef<HTMLInputElement>(null),
        audio = useRef<HTMLAudioElement>(null);
    const finishClose = useCallback(() => {
        if (!alive.current) return;
        setDetail(null);
        requestAnimationFrame(() => source.current?.isConnected && source.current.focus({ preventScroll: true }));
    }, []);
    const travel = useCallback(
        (value: number) => {
            progress.set(
                withTiming(
                    value,
                    {
                        duration: (value ? theme.motion.duration.long2 : theme.motion.duration.medium4) * theme.animation.scale,
                        easing: Easing.bezier(...theme.motion.easing.emphasized),
                        reduceMotion: ReduceMotion.Never,
                    },
                    (finished) => {
                        if (finished && !value) scheduleOnRN(finishClose);
                    }
                )
            );
        },
        [progress, theme, finishClose]
    );
    useEffect(() => {
        if (detail && ready && !closing) {
            travel(1);
            requestAnimationFrame(() =>
                document.querySelector<HTMLElement>('[data-testid="appbar-detail-navigation"]')?.focus({ preventScroll: true })
            );
        }
    }, [detail, ready, closing, travel]);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            pendingSearch.current = null;
            pendingVoice.current = false;
            cancelAnimation(progress);
        };
    }, [progress]);
    useEffect(() => {
        if (theme.animation.scale === 0 && detail) {
            progress.set(closing ? 0 : 1);
            if (closing) finishClose();
        }
    }, [theme.animation.scale, detail, closing, progress, finishClose]);
    useEffect(
        () => () => {
            if (audioAsset) URL.revokeObjectURL(audioAsset.url);
        },
        [audioAsset]
    );
    const toggleAudio = () => {
        const player = audio.current;
        if (!player || !audioAsset) return;
        if (player.paused) {
            void player.play().catch(() => {
                if (alive.current) setStatus('No se pudo reproducir este archivo de audio.');
            });
        } else player.pause();
    };
    const openDetail = (value: { title: string; photo?: string; body?: string }, event?: GestureResponderEvent) => {
        if (detail) return;
        source.current = (event?.currentTarget as unknown as HTMLElement) ?? (document.activeElement as HTMLElement);
        const rect = source.current?.getBoundingClientRect?.();
        setOrigin(
            rect && rect.width
                ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, borderRadius: 12, backgroundColor: theme.colors.surface }
                : { x: 16, y: 64, width: Math.max(100, width - 32), height: 72, borderRadius: 12, backgroundColor: theme.colors.surface }
        );
        closingRef.current = false;
        setClosing(false);
        setReady(false);
        progress.set(0);
        setDetail({
            ...value,
            body: value.body ?? 'Una historia para descubrir. Guarda este contenido o vuelve a la colección para seguir explorando.',
        });
    };
    const closeDetail = () => {
        if (closingRef.current) return;
        closingRef.current = true;
        setClosing(true);
        travel(0);
    };
    const openSearch = () => {
        pendingSearch.current = null;
        setSearch(true);
    };
    const back = () => parent.postMessage({ type: 'mobile-design:window-back' }, location.origin);
    const currentSaved = kind === 'news' && detail ? savedRows.includes(detail.title) : saved;
    const toggleSave = () => {
        if (kind === 'news' && detail) {
            setSavedRows((values) =>
                values.includes(detail.title) ? values.filter((value) => value !== detail.title) : [...values, detail.title]
            );
            setStatus(currentSaved ? 'Se quitó de guardados.' : 'Historia guardada.');
        } else {
            setSaved((value) => !value);
            setStatus(saved ? 'Se quitó de guardados.' : 'Contenido guardado.');
        }
    };
    const send = () => {
        if (sent || (kind === 'compose' && (!message.trim() || !recipient.trim()))) return;
        setSent(true);
        setStatus(kind === 'compose' ? 'Mensaje enviado: ' + message : 'Imagen enviada.');
    };
    const download = () => {
        const data = new Blob([['Bookstores in LA', 'Skylight Books', 'The Last Bookstore', 'Stories Books & Café'].join('\n')], {
                type: 'text/plain;charset=utf-8',
            }),
            url = URL.createObjectURL(data),
            link = document.createElement('a');
        link.href = url;
        link.download = 'bookstores-in-la.txt';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        setStatus('Colección descargada.');
    };
    const selectedRows =
        kind === 'podcasts'
            ? sceneRows
            : kind === 'films'
              ? ['The Baker', 'A little light', 'A quiet place', 'The long way home']
              : kind === 'collection'
                ? ['Skylight Books', 'The Last Bookstore', 'Stories Books & Café']
                : kind === 'search'
                  ? config.scene === 'search-inbox' || config.scene === 'search-messages'
                      ? ['Design review', 'Meeting notes', 'Weekend plans', 'Lee', 'Taylor', 'Alex']
                      : config.scene === 'search-photos'
                        ? ['Mountain path', 'City light', 'At the beach', 'A walk in the garden']
                        : ['Bosque de la ciudad', 'Camino a la costa', 'Museo y arquitectura', 'Mirador de la montaña']
                  : kind === 'stores'
                    ? ['Second life', 'The corner shop', 'Vintage market']
                    : ['A new perspective', 'A place to begin', 'A story worth sharing', 'The world outside'];
    const searchView = (
        <SearchView
            open={search}
            onOpenChange={setSearch}
            onClosed={() => {
                const next = pendingSearch.current;
                pendingSearch.current = null;
                next?.();
            }}
            value={query}
            onChangeText={setQuery}
            onSearch={setQuery}
            placeholder={searchBar ? (playground ? bar.title : (example?.title ?? 'Search product')) : 'Search'}
            results={selectedRows
                .filter((row) => row.toLowerCase().includes(query.toLowerCase()))
                .map((row, index) => ({
                    key: String(index),
                    title: row,
                    description: kind === 'podcasts' ? 'Saved podcast' : 'Contenido de tu colección',
                    icon: kind === 'search' && config.scene === 'search-photos' ? 'image' : 'search',
                }))}
            onResultPress={(result) => {
                pendingSearch.current = () => openDetail({ title: result.title });
            }}
            renderTrigger={(state) =>
                searchBar ? (
                    <SearchEntry
                        {...state}
                        value={query}
                        placeholder={playground ? bar.title : (example?.title ?? 'Search product')}
                        center={playground ? bar.align === 'center' : true}
                        voice={
                            (playground ? bar.inside : config.scene === 'search-inbox' || config.scene === 'search-photos')
                                ? () => setVoice(true)
                                : undefined
                        }
                    />
                ) : (
                    <View style={{ width: 0, height: 0 }} />
                )
            }
            testID="appbar-search"
        />
    );
    const calendarAction = () => setCalendar(true);
    let actions: TopAppBarAction[] = playground
        ? Array.from({ length: Math.min(bar.actions, bar.variant === 'search' && bar.inside ? 1 : 2) }, (_, index) => ({
              key: index ? 'calendar' : 'search',
              icon: bar.actionStyle === 'standard' ? (index ? 'today_fill1' : 'search') : 'send_fill1',
              label: bar.actionStyle === 'standard' ? (index ? 'Elegir fecha' : 'Buscar') : 'Enviar',
              onPress: bar.actionStyle === 'standard' ? (index ? calendarAction : openSearch) : send,
              disabled: bar.disabled,
              mode: bar.actionStyle === 'standard' ? undefined : bar.actionStyle,
              widthVariant: bar.wide ? 'wide' : 'default',
              testID: 'appbar-action-' + index,
          }))
        : kind === 'podcasts'
          ? [
                {
                    key: 'attach',
                    icon: 'attach_file',
                    label: 'Adjuntar archivo de audio',
                    onPress: () => file.current?.click(),
                    testID: 'appbar-attach',
                },
                { key: 'date', icon: 'today_fill1', label: 'Filtrar por fecha', onPress: calendarAction, testID: 'appbar-date' },
            ]
          : kind === 'send' || kind === 'compose'
            ? []
            : kind === 'collection'
              ? [
                    {
                        key: 'save',
                        icon: saved ? 'bookmark_fill1' : 'bookmark',
                        label: saved ? 'Quitar colección guardada' : 'Guardar colección',
                        onPress: toggleSave,
                        testID: 'appbar-save',
                    },
                    { key: 'download', icon: 'download_fill1', label: 'Descargar colección', onPress: download, testID: 'appbar-download' },
                ]
              : kind === 'sushi'
                ? [
                      {
                          key: 'share',
                          icon: 'share',
                          label: 'Compartir artículo',
                          mode: 'contained-tonal',
                          onPress: () => setShare(true),
                          testID: 'appbar-share',
                      },
                  ]
                : kind === 'letter'
                  ? [
                        {
                            key: 'favorite',
                            icon: saved ? 'favorite_fill1' : 'favorite',
                            label: saved ? 'Quitar de favoritos' : 'Añadir a favoritos',
                            mode: 'contained',
                            onPress: toggleSave,
                            testID: 'appbar-save',
                        },
                    ]
                  : searchBar
                    ? config.scene === 'search-photos'
                        ? [
                              {
                                  key: 'spark',
                                  icon: 'auto_awesome',
                                  label: 'Explorar fotos',
                                  onPress: () => {
                                      setQuery('');
                                      openSearch();
                                  },
                                  testID: 'appbar-explore',
                              },
                          ]
                        : []
                    : [
                          {
                              key: 'search',
                              icon: 'search',
                              label: 'Buscar en la colección',
                              onPress: openSearch,
                              testID: 'appbar-open-search',
                          },
                          {
                              key: 'save',
                              icon: saved ? 'bookmark_fill1' : 'bookmark',
                              label: saved ? 'Quitar de guardados' : 'Guardar',
                              onPress: toggleSave,
                              testID: 'appbar-save',
                          },
                      ];
    if (config.scene === 'adaptive-actions')
        actions =
            width < 600
                ? [{ key: 'search', icon: 'search', label: 'Buscar', onPress: openSearch }]
                : [
                      { key: 'search', icon: 'search', label: 'Buscar', onPress: openSearch },
                      { key: 'share', icon: 'share', label: 'Compartir', onPress: () => setShare(true) },
                  ];
    if (kind === 'news')
        actions =
            config.scene === 'brand'
                ? [{ key: 'search', icon: 'search', label: 'Buscar noticias', onPress: openSearch, testID: 'appbar-open-search' }]
                : [];
    const overflow =
        kind === 'podcasts' || (kind === 'news' && config.scene !== 'brand') || (config.scene === 'adaptive-actions' && width < 600);
    const menuControl = (
        <Menu
            visible={menu}
            onDismiss={() => setMenu(false)}
            anchor={<IconButton icon="more_vert" accessibilityLabel="Más acciones" onPress={() => setMenu(true)} testID="appbar-more" />}
        >
            <Menu.Item
                title={kind === 'podcasts' ? 'Search podcasts' : kind === 'news' ? 'Search news' : 'Search'}
                leadingIcon="search"
                onPress={openSearch}
                testID="appbar-menu-search"
            />
            {kind === 'news' ? (
                <Menu.Item
                    title={section === 'Saved' ? 'Top Stories' : 'Saved stories'}
                    leadingIcon="bookmark"
                    onPress={() => {
                        setSection((value) => (value === 'Saved' ? 'Top News' : 'Saved'));
                        returnToTop();
                    }}
                    testID="appbar-menu-saved"
                />
            ) : kind === 'podcasts' ? (
                <Menu.Item
                    title={filterToday ? 'Show all podcasts' : 'Show today'}
                    leadingIcon="today"
                    onPress={() => {
                        setFilterToday((value) => !value);
                        setStatus(filterToday ? 'Todos los podcasts.' : 'Podcasts de hoy.');
                    }}
                    testID="appbar-menu-filter"
                />
            ) : (
                <Menu.Item
                    title={saved ? 'Remove saved article' : 'Save article'}
                    leadingIcon="bookmark"
                    onPress={toggleSave}
                    testID="appbar-menu-save"
                />
            )}
            {kind !== 'news' ? (
                <Menu.Item title="Share" leadingIcon="share" onPress={() => setShare(true)} testID="appbar-menu-share" />
            ) : null}
        </Menu>
    );
    const actualTitle = playground
        ? bar.title
        : kind === 'news'
          ? config.scene === 'brand'
              ? section
              : section === 'Saved'
                ? 'Saved stories'
                : 'Top Stories'
          : kind === 'hiking' && config.scene === 'text-wrap'
            ? 'Hiking trips with Elie in Santa Monica and Joshua Tree!'
            : kind === 'gallery'
              ? 'Recap from June 12–19'
              : kind === 'article'
                ? 'Aki Aro'
                : title;
    const bodyStyle = { flex: 1, minHeight: 0, backgroundColor: theme.colors.surface } as const;
    const subtitle = playground
        ? bar.subtitle
            ? 'Subtitle'
            : undefined
        : kind === 'send'
          ? '7.2 MB · PNG'
          : kind === 'trails'
            ? 'Discover popular trails'
            : undefined;
    const container = kind === 'letter' ? 'transparent' : undefined;
    const variant = playground ? (bar.variant === 'search' ? 'small' : bar.variant) : example!.variant;
    return (
        <View style={bodyStyle}>
            <div className="native-scene-source" inert={Boolean(detail)}>
                <TopAppBar
                    title={
                        editing ? (
                            <TextField label="Título de la colección" value={title} onChangeText={setTitle} testID="appbar-edit-title" />
                        ) : (
                            actualTitle
                        )
                    }
                    collapsedTitle={config.scene === 'brand' ? null : undefined}
                    variant={variant}
                    subtitle={subtitle}
                    textAlign={playground ? bar.align : kind === 'films' || config.scene === 'brand' ? 'center' : 'start'}
                    image={(playground ? bar.image : config.scene === 'brand') ? <Wordmark /> : undefined}
                    search={searchBar ? searchView : undefined}
                    navigationIcon={
                        config.scene === 'brand'
                            ? 'menu'
                            : playground
                              ? bar.navigation === 'none' || bar.navigation === 'logo'
                                  ? undefined
                                  : bar.navigation === 'menu'
                                    ? 'menu'
                                    : 'arrow_back'
                              : searchBar
                                ? 'menu'
                                : 'arrow_back'
                    }
                    leading={
                        playground && bar.navigation === 'logo' ? (
                            <TouchableRipple
                                onPress={() => {
                                    returnToTop();
                                    setStatus('Inicio del producto.');
                                }}
                                accessibilityRole="button"
                                accessibilityLabel="Ir al inicio del producto"
                                style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <MaterialSymbol name="music_note" size={24} color={theme.colors.primary} />
                            </TouchableRipple>
                        ) : undefined
                    }
                    navigationLabel={
                        config.scene === 'brand'
                            ? 'Abrir secciones'
                            : searchBar || bar.navigation === 'menu'
                              ? 'Abrir navegación'
                              : 'Volver al catálogo de App bars'
                    }
                    onNavigationPress={
                        config.scene === 'brand' || searchBar || (playground && bar.navigation === 'menu') ? () => setRail(true) : back
                    }
                    navigationMode={kind === 'letter' ? 'contained' : undefined}
                    navigationWidthVariant={kind === 'letter' ? 'narrow' : undefined}
                    trailing={
                        searchBar ? (
                            <Account open={() => setAccount(true)} />
                        ) : overflow ? (
                            menuControl
                        ) : kind === 'send' || kind === 'compose' ? (
                            <Button
                                variant="filled"
                                icon="send"
                                disabled={sent || (kind === 'compose' && (!message.trim() || !recipient.trim()))}
                                onPress={send}
                                testID="appbar-send"
                            >
                                {sent ? 'Sent' : 'Send'}
                            </Button>
                        ) : kind === 'films' ? (
                            <IconButton
                                icon={editing ? 'check' : 'edit'}
                                accessibilityLabel={editing ? 'Confirmar título' : 'Editar título'}
                                onPress={() => setEditing((value) => !value)}
                                testID="appbar-edit"
                            />
                        ) : undefined
                    }
                    actions={actions}
                    scrollBehavior={playground ? undefined : scroll}
                    scrolled={playground ? bar.scrolled : false}
                    statusBarHeight={playground ? bar.inset : 0}
                    containerColor={container}
                    scrolledContainerColor={container}
                    testID="example-appbar"
                />
                {!searchBar ? searchView : null}
                <Animated.ScrollView
                    ref={contentScroll}
                    onScroll={scroll.onScroll}
                    scrollEventThrottle={16}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    testID="appbar-scroll"
                    keyboardShouldPersistTaps="handled"
                >
                    {playground ? (
                        <View style={{ padding: 24, gap: 12 }}>
                            <Text variant="titleMedium">Tu pantalla</Text>
                            <Text variant="bodyMedium">Navegación, búsqueda y acciones conservan sus controles originales.</Text>
                        </View>
                    ) : null}
                    {kind === 'news' && section === 'Saved' && !savedRows.length ? (
                        <Text variant="bodyLarge" style={{ padding: 24 }} testID="appbar-news-empty">
                            No hay historias guardadas. Abre una noticia y guárdala para verla aquí.
                        </Text>
                    ) : null}
                    {kind === 'compose' ? (
                        <View style={{ padding: 24, gap: 16 }}>
                            <TextField label="Para" value={recipient} onChangeText={setRecipient} testID="appbar-recipient" />
                            <TextField
                                label="Mensaje"
                                multiline
                                value={message}
                                onChangeText={setMessage}
                                style={{ minHeight: 180 }}
                                testID="appbar-message"
                            />
                        </View>
                    ) : kind === 'send' ? (
                        <View style={{ padding: 24, gap: 20 }}>
                            <Image
                                source={image('send-illustration')}
                                resizeMode="contain"
                                accessibilityLabel="Ilustración para enviar"
                                style={{ width: '100%', height: 250 }}
                            />
                            <Text variant="titleMedium">Image</Text>
                            <Text variant="bodyMedium">7.2 MB · PNG</Text>
                        </View>
                    ) : kind === 'gallery' ? (
                        <View style={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {[
                                'recap-dog',
                                'recap-train',
                                'recap-mushrooms',
                                'recap-beekeeper',
                                'hiking-tree',
                                'hiking-tent',
                                'recap-valley',
                            ].map((photo, i) => (
                                <TouchableRipple
                                    key={photo}
                                    accessibilityRole="button"
                                    accessibilityLabel={'Abrir foto ' + (i + 1)}
                                    onPress={(event) => openDetail({ title: 'Recap · ' + (i + 1), photo }, event)}
                                    style={{ width: i === 0 ? '100%' : '48%', borderRadius: 16, overflow: 'hidden' }}
                                >
                                    <Image source={image(photo)} style={{ width: '100%', height: i === 0 ? 220 : 150 }} />
                                </TouchableRipple>
                            ))}
                        </View>
                    ) : kind === 'letter' ? (
                        <View style={{ padding: 24, gap: 24 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                <Avatar.Image size={48} source={image('letter-avatar')} />
                                <View>
                                    <Text variant="titleMedium">So Duri</Text>
                                    <Text variant="bodyMedium">To you · 8:43 AM</Text>
                                </View>
                            </View>
                            {Array.from({ length: 9 }, (_, i) => (
                                <Text key={i} variant="bodyLarge">
                                    Dear friend, I hope you have found a quiet moment today. A small change in perspective can make room for
                                    something new. There is always another story waiting to be shared.
                                </Text>
                            ))}
                        </View>
                    ) : kind === 'hiking' || kind === 'trails' || kind === 'stores' ? (
                        <View style={{ padding: 16, gap: 16 }}>
                            <Image
                                source={image(kind === 'trails' ? 'trails-sky' : 'trails-map')}
                                resizeMode="cover"
                                accessibilityLabel="Mapa de recorridos"
                                style={{ width: '100%', height: 220, borderRadius: 16 }}
                            />
                            <Button
                                variant="tonal"
                                icon="hiking"
                                onPress={() => {
                                    setStatus('Ruta a pie preparada · 24 min.');
                                }}
                                testID="appbar-route"
                            >
                                Hiking
                            </Button>
                            {['Santa Monica', 'Joshua Tree', 'Marin Headlands'].map((name, i) => (
                                <List.Item
                                    key={name}
                                    title={name}
                                    description={i + 2 + ' km · 24 min'}
                                    leading={<Icon source="hiking" size={24} />}
                                    onPress={() => openDetail({ title: name, photo: 'hiking-tree' })}
                                    testID={'appbar-row-' + i}
                                />
                            ))}
                        </View>
                    ) : kind === 'sushi' ? (
                        <View style={{ padding: 24, gap: 20 }}>
                            <Image
                                source={image('sushi-food')}
                                accessibilityLabel="Sushi"
                                style={{ width: '100%', height: 260, borderRadius: 16 }}
                            />
                            <Text variant="headlineSmall">The best sushi spots</Text>
                            <Text variant="bodyLarge">
                                Discover a new favorite, from familiar neighborhood tables to a quiet place around the corner.
                            </Text>
                        </View>
                    ) : (
                        <View style={{ padding: kind === 'podcasts' ? 16 : 0, gap: kind === 'podcasts' ? 12 : 0 }}>
                            {kind === 'podcasts' ? (
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    {selectedRows.slice(0, 2).map((row, i) => (
                                        <Card
                                            key={row}
                                            variant="filled"
                                            style={{ flex: 1 }}
                                            onPress={(event) =>
                                                openDetail({ title: row, photo: i ? 'podcast-room' : 'podcast-recording' }, event)
                                            }
                                            accessibilityLabel={'Abrir ' + row}
                                            testID={'appbar-podcast-' + i}
                                        >
                                            <Card.Cover
                                                source={image(i ? 'podcast-room' : 'podcast-recording')}
                                                style={{ height: 150, borderRadius: 0 }}
                                            />
                                            <Card.Title title={row} titleVariant="titleMedium" />
                                        </Card>
                                    ))}
                                </View>
                            ) : null}
                            {(kind === 'news' && section === 'Saved'
                                ? selectedRows.filter((row) => savedRows.includes(row))
                                : filterToday
                                  ? selectedRows.slice(0, 2)
                                  : [...selectedRows, ...selectedRows, ...selectedRows]
                            ).map((row, i) => (
                                <List.Item
                                    key={row + i}
                                    title={row}
                                    description={
                                        kind === 'podcasts' ? 'Saved podcast' : kind === 'news' ? 'The Fortnightly · Today' : 'Tu colección'
                                    }
                                    leading={
                                        kind === 'podcasts' ? (
                                            <Avatar.Image size={48} source={image(i % 2 ? 'podcast-room' : 'podcast-recording')} />
                                        ) : (
                                            <Icon
                                                source={kind === 'collection' ? 'storefront' : kind === 'films' ? 'movie' : 'article'}
                                                size={24}
                                            />
                                        )
                                    }
                                    trailing={
                                        kind === 'podcasts' ? (
                                            <IconButton
                                                icon={playing === row ? 'pause_fill1' : 'play_arrow_fill1'}
                                                accessibilityLabel={(playing === row ? 'Pausar ' : 'Reproducir ') + row}
                                                disabled={!audioAsset || row !== sceneRows[0]}
                                                onPress={toggleAudio}
                                                testID={'appbar-audio-' + i}
                                            />
                                        ) : undefined
                                    }
                                    onPress={() =>
                                        openDetail({
                                            title: row,
                                            photo: kind === 'films' ? 'films-baker' : kind === 'news' ? 'news-mushrooms' : undefined,
                                        })
                                    }
                                    testID={'appbar-row-' + i}
                                />
                            ))}
                        </View>
                    )}
                    <Text
                        variant="bodySmall"
                        accessibilityLiveRegion="polite"
                        style={{ padding: 16, color: theme.colors.onSurfaceVariant }}
                        testID="appbar-status"
                    >
                        {status ||
                            (!playground
                                ? 'Desplaza el contenido para explorar el comportamiento de la barra.'
                                : 'Prueba las acciones del encabezado.')}
                    </Text>
                </Animated.ScrollView>
            </div>
            {detail ? (
                <View style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
                    <ContainerTransformSurface
                        fill
                        origin={origin}
                        progress={progress}
                        entering={!closing}
                        transforming={theme.animation.scale !== 0}
                        onMeasured={() => setReady(true)}
                        backgroundColor={theme.colors.surface}
                        borderRadius={0}
                        testID="appbar-detail-transform"
                    >
                        <div
                            className="native-scene-detail"
                            inert={closing}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                    event.preventDefault();
                                    closeDetail();
                                }
                            }}
                        >
                            <TopAppBar
                                title={detail.title}
                                navigationIcon="arrow_back"
                                navigationLabel="Volver a la colección"
                                onNavigationPress={closeDetail}
                                statusBarHeight={0}
                                actions={[
                                    {
                                        key: 'save',
                                        icon: currentSaved ? 'bookmark_fill1' : 'bookmark',
                                        label: currentSaved ? 'Quitar de guardados' : 'Guardar detalle',
                                        onPress: toggleSave,
                                    },
                                ]}
                                testID="appbar-detail"
                            />
                            <Animated.ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
                                {detail.photo ? (
                                    <Image source={image(detail.photo)} style={{ width: '100%', height: 240, borderRadius: 16 }} />
                                ) : null}
                                <Text variant="headlineSmall">{detail.title}</Text>
                                <Text variant="bodyLarge">{detail.body}</Text>
                                <Text variant="bodyMedium" testID="appbar-detail-state">
                                    {currentSaved ? 'Guardado en tu colección.' : 'Puedes guardar este contenido.'}
                                </Text>
                            </Animated.ScrollView>
                        </div>
                    </ContainerTransformSurface>
                </View>
            ) : null}
            {config.scene === 'brand' ? (
                <Dialog visible={rail} onDismiss={() => setRail(false)} testID="appbar-news-sections">
                    <Dialog.Title>The Fortnightly</Dialog.Title>
                    <Dialog.Content>
                        {['Top News', 'Saved'].map((value) => (
                            <List.Item
                                key={value}
                                title={value}
                                leading={<Icon source={value === 'Saved' ? 'bookmark' : 'newspaper'} size={24} />}
                                onPress={() => {
                                    setSection(value);
                                    returnToTop();
                                    setRail(false);
                                }}
                                testID={'appbar-news-' + value.replace(' ', '-')}
                            />
                        ))}
                        <List.Item title="App bars" leading={<Icon source="arrow_back" size={24} />} onPress={back} />
                    </Dialog.Content>
                </Dialog>
            ) : (
                <NavigationRailModal
                    open={rail}
                    onOpenChange={setRail}
                    items={navItems}
                    value={section}
                    onValueChange={(value) => {
                        setSection(value);
                        setStatus('Destino seleccionado: ' + value);
                    }}
                    testID="appbar-navigation"
                />
            )}
            <Dialog visible={account} onDismiss={() => setAccount(false)} testID="appbar-account-dialog">
                <Dialog.Title>Cuenta de Alex</Dialog.Title>
                <Dialog.Content>
                    <List.Item
                        title="Personal"
                        description="alex@ejemplo.com"
                        leading={<Avatar.Text label="A" size={32} />}
                        onPress={() => {
                            setAccount(false);
                            setStatus('Cuenta personal seleccionada.');
                        }}
                        testID="appbar-account-personal"
                    />
                    <List.Item
                        title="Trabajo"
                        description="alex@trabajo.ejemplo"
                        leading={<Avatar.Text label="A" size={32} />}
                        onPress={() => {
                            setAccount(false);
                            setStatus('Cuenta de trabajo seleccionada.');
                        }}
                        testID="appbar-account-work"
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setAccount(false)}>
                        Cerrar
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <Dialog visible={share} onDismiss={() => setShare(false)} testID="appbar-share-dialog">
                <Dialog.Title>Share</Dialog.Title>
                <Dialog.Content>
                    <Text>{actualTitle}</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setShare(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onPress={() => {
                            void navigator.clipboard
                                .writeText(location.origin + '/#/components/app-bars/overview')
                                .then(() => {
                                    if (alive.current) {
                                        setShare(false);
                                        setStatus('Enlace copiado.');
                                    }
                                })
                                .catch(() => {
                                    if (alive.current)
                                        setStatus('No se pudo copiar el enlace. Permite el acceso al portapapeles e inténtalo de nuevo.');
                                });
                        }}
                        testID="appbar-copy-link"
                    >
                        Copy link
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <Dialog
                visible={voice}
                onDismiss={() => {
                    pendingVoice.current = false;
                    setVoice(false);
                }}
                onClosed={() => {
                    if (pendingVoice.current) {
                        pendingVoice.current = false;
                        setQuery(voiceText);
                        openSearch();
                    }
                }}
                testID="appbar-voice-dialog"
            >
                <Dialog.Icon icon="mic" />
                <Dialog.Title>Buscar por voz</Dialog.Title>
                <Dialog.Content>
                    <TextField
                        label="Consulta"
                        supportingText="Escribe o dicta la consulta desde el teclado."
                        value={voiceText}
                        onChangeText={setVoiceText}
                        testID="appbar-voice-input"
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button
                        variant="text"
                        onPress={() => {
                            pendingVoice.current = false;
                            setVoice(false);
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={!voiceText.trim()}
                        onPress={() => {
                            pendingVoice.current = true;
                            setVoice(false);
                        }}
                        testID="appbar-voice-submit"
                    >
                        Buscar
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <DatePicker
                visible={calendar}
                value={date}
                mode="single"
                locale="es-MX"
                onDismiss={() => setCalendar(false)}
                onChange={(next) => {
                    setDate(next);
                    setCalendar(false);
                    setFilterToday(true);
                    setStatus('Fecha elegida: ' + next.toLocaleDateString('es-MX'));
                }}
                testID="appbar-calendar"
            />
            {audioAsset ? (
                <audio
                    ref={audio}
                    src={audioAsset.url}
                    preload="metadata"
                    onPlay={() => {
                        setPlaying(sceneRows[0]);
                        setStatus('Reproduciendo ' + audioAsset.name);
                    }}
                    onPause={() => {
                        setPlaying('');
                        setStatus('Reproducción pausada.');
                    }}
                    onEnded={() => {
                        setPlaying('');
                        setStatus('Reproducción finalizada.');
                    }}
                    onError={() => {
                        setPlaying('');
                        setStatus('Formato de audio no compatible.');
                    }}
                />
            ) : null}
            <input
                ref={file}
                type="file"
                accept="audio/*"
                style={{ display: 'none' }}
                hidden
                aria-hidden="true"
                onChange={(event) => {
                    const selected = event.target.files?.[0];
                    if (selected) {
                        audio.current?.pause();
                        setPlaying('');
                        setAudioAsset({ url: URL.createObjectURL(selected), name: selected.name });
                        setStatus('Audio adjunto a Wizards & Wynona: ' + selected.name);
                    }
                    event.target.value = '';
                }}
            />
        </View>
    );
}
export function AppBarWindow() {
    const environment = useRuntimeEnvironment(),
        configuration = useWindowConfiguration(initial);
    const scene = appBarScenes.find((example) => example.id === configuration.scene),
        direction = configuration.scene === 'rtl' ? 'rtl' : configuration.bar.direction;
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            direction={direction}
            motion={configuration.bar.motion}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <main className="native-window" aria-label={'Ventana de ' + (scene?.title ?? 'App bar')}>
                <GestureHandlerRootView style={{ flex: 1, minHeight: 0 }}>
                    <SafeAreaInsetsContext.Provider value={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                        <WindowBody key={configuration.scene} config={configuration} />
                    </SafeAreaInsetsContext.Provider>
                </GestureHandlerRootView>
            </main>
        </MobileDesignProvider>
    );
}
