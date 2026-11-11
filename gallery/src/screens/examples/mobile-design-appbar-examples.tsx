import { useEffect, useLayoutEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import {
    Avatar,
    Button,
    Chip,
    DatePicker,
    Dialog,
    Icon,
    List,
    LocaleProvider,
    NavigationRailModal,
    SearchIconButton,
    SearchTrigger,
    SearchView,
    Switch,
    Text,
    TextField,
    TopAppBar,
    TouchableRipple,
    useAppBarScrollBehavior,
    useLocale,
    useMobileTheme,
    type TopAppBarAction,
    type TopAppBarVariant,
} from 'mobile-design/react-native';
const currentVariants = ['small', 'medium-flexible', 'large-flexible'] as const;
const appBarPlaces = [
    'Bosque de la ciudad',
    'Camino a la costa',
    'Museo y arquitectura',
    'Mirador de la montaña',
    'Jardín botánico',
    'Ruta del desierto',
];
const destinations = [
    { key: 'all', label: 'Colección', icon: 'collections_bookmark' },
    { key: 'saved', label: 'Guardados', icon: 'bookmark' },
    { key: 'recent', label: 'Recientes', icon: 'history' },
];
const headings = { small: 'Title Large', 'medium-flexible': 'Headline Medium', 'large-flexible': 'Display Small' };

type Props = { onOpenPlayground?: () => void };

type SearchLayout = 'outside' | 'inside-and-outside' | 'two-outside' | 'measurement';

function placeResults(query: string) {
    const normalized = query.toLocaleLowerCase('es-MX');
    return appBarPlaces
        .map((title, index) => ({ key: String(index), title, icon: 'place' }))
        .filter((place) => place.title.toLocaleLowerCase('es-MX').includes(normalized));
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    const theme = useMobileTheme();
    return (
        <View style={{ gap: 16 }}>
            <View style={{ paddingHorizontal: 24, gap: 8 }}>
                <Text variant="titleLarge" accessibilityRole="header">
                    {title}
                </Text>
                {description ? (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {description}
                    </Text>
                ) : null}
            </View>
            {children}
        </View>
    );
}

function Caption({ children, testID }: { children: ReactNode; testID?: string }) {
    const theme = useMobileTheme();
    return (
        <Text
            variant="labelMedium"
            accessibilityLiveRegion="polite"
            style={{ paddingHorizontal: 24, color: theme.colors.onSurfaceVariant }}
            testID={testID}
        >
            {children}
        </Text>
    );
}

function AccountAvatar({ onPress, testID }: { onPress: () => void; testID: string }) {
    const theme = useMobileTheme();
    return (
        <Avatar.Button accessibilityLabel="Abrir cuenta de Alex" onPress={onPress} testID={testID}>
            <Avatar.Text
                label="A"
                size={32}
                style={{ backgroundColor: theme.colors.primaryContainer }}
                color={typeof theme.colors.onPrimaryContainer === 'string' ? theme.colors.onPrimaryContainer : undefined}
            />
        </Avatar.Button>
    );
}

function AccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [account, setAccount] = useState('personal');
    return (
        <Dialog visible={open} onDismiss={onClose} testID="md-appbar-account-dialog">
            <Dialog.Title>Cuenta de Alex</Dialog.Title>
            <Dialog.Content>
                <List.Item
                    title="Personal"
                    description="alex@ejemplo.com"
                    leading={<Avatar.Text label="A" size={32} />}
                    trailing={account === 'personal' ? <Icon source="check" size={24} /> : undefined}
                    onPress={() => {
                        setAccount('personal');
                        onClose();
                    }}
                    testID="md-appbar-account-personal"
                />
                <List.Item
                    title="Trabajo"
                    description="alex@trabajo.ejemplo"
                    leading={<Avatar.Text label="A" size={32} />}
                    trailing={account === 'work' ? <Icon source="check" size={24} /> : undefined}
                    onPress={() => {
                        setAccount('work');
                        onClose();
                    }}
                    testID="md-appbar-account-work"
                />
            </Dialog.Content>
            <Dialog.Actions>
                <Button variant="text" onPress={onClose}>
                    Cerrar
                </Button>
            </Dialog.Actions>
        </Dialog>
    );
}

/** Search app bars have no leading magnifier inside the field in the reference layouts. */

function AppBarSearchTrigger({
    open,
    disabled = false,
    expanded = false,
    value,
    placeholder = 'Search',
    centered = false,
    onVoice,
    testID,
}: {
    open: () => void;
    disabled?: boolean;
    expanded?: boolean;
    value: string;
    placeholder?: string;
    centered?: boolean;
    onVoice?: () => void;
    testID: string;
}) {
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    return (
        <View style={{ height: 56, borderRadius: 28, overflow: 'hidden' }}>
            <SearchTrigger
                onPress={open}
                accessibilityRole="button"
                accessibilityLabel={value ? `${placeholder}: ${value}` : placeholder}
                accessibilityHint="Abre la vista de búsqueda"
                accessibilityState={{ disabled, expanded }}
                disabled={disabled}
                style={{ height: 56, borderRadius: 28, overflow: 'hidden' }}
                testID={`${testID}-bar`}
            >
                <View
                    pointerEvents="none"
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{ flex: 1, flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center' }}
                >
                    <View style={{ flex: 1, minWidth: 0, paddingHorizontal: 16 }}>
                        <Text
                            variant="bodyLarge"
                            numberOfLines={1}
                            style={{ color: theme.colors.onSurfaceVariant, textAlign: centered ? 'center' : rtl ? 'right' : 'left' }}
                        >
                            {value || placeholder}
                        </Text>
                    </View>
                    {onVoice ? <View style={{ width: 52 }} /> : null}
                </View>
            </SearchTrigger>
            {/* The field's state layer spans the capsule; the microphone owns its sibling target. */}
            {onVoice ? (
                <View
                    style={{
                        position: 'absolute',
                        top: 4,
                        [rtl ? 'left' : 'right']: 4,
                        zIndex: 1,
                        width: 48,
                        height: 48,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <SearchIconButton
                        icon="mic"
                        accessibilityLabel="Buscar por voz"
                        disabled={disabled}
                        onPress={onVoice}
                        testID={`${testID}-voice`}
                    />
                </View>
            ) : null}
        </View>
    );
}

/** The actions change this specimen's page, date, search results, or saved state. */

function BarExample({
    id,
    variant = 'small',
    title,
    subtitle,
    textAlign = 'start',
    image,
    avatar = false,
    primary,
    scrolled = false,
    searchOnly = false,
    trip = false,
    collectionActions,
    label,
}: {
    id: string;
    variant?: TopAppBarVariant;
    title: string;
    subtitle?: string;
    textAlign?: 'start' | 'center';
    image?: ReactNode;
    avatar?: boolean;
    primary?: { mode: 'contained' | 'contained-tonal'; widthVariant: 'default' | 'wide' };
    scrolled?: boolean;
    searchOnly?: boolean;
    trip?: boolean;
    collectionActions?: 'filled' | 'outlined';
    label?: string;
}) {
    const [search, setSearch] = useState(false);
    const [query, setQuery] = useState('');
    const [calendar, setCalendar] = useState(false);
    const [date, setDate] = useState<Date>();
    const [rail, setRail] = useState(false);
    const [section, setSection] = useState('all');
    const [collection, setCollection] = useState(false);
    const [selected, setSelected] = useState('');
    const [sent, setSent] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [account, setAccount] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [routeStarted, setRouteStarted] = useState(false);
    const [downloaded, setDownloaded] = useState('');
    const [downloadOpen, setDownloadOpen] = useState(false);
    const [downloadError, setDownloadError] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const downloadPending = useRef(false);
    const focused = useIsFocused();
    const focusRevision = useRef(0);
    useLayoutEffect(() => {
        focusRevision.current += 1;
    }, [focused]);
    const alive = useRef(true);
    const pendingSelection = useRef<string | null>(null);
    const setSearchOpen = (open: boolean) => {
        if (open) pendingSelection.current = null;
        setSearch(open);
    };
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            pendingSelection.current = null;
        };
    }, []);
    const pageTitle = collection ? destinations.find((item) => item.key === section)!.label : sent ? 'Enviado' : selected || title;
    const downloadListing = async () => {
        if (!alive.current || !focused || downloadPending.current) return;
        const revision = focusRevision.current;
        const ownsDownload = () => alive.current && revision === focusRevision.current;
        downloadPending.current = true;
        setDownloading(true);
        setDownloadError(false);
        try {
            const { File, Paths } = await import('expo-file-system');
            if (!ownsDownload()) return;
            const file = new File(Paths.cache, `app-bar-bookstores-${encodeURIComponent(id)}.txt`);
            if (!file.exists) file.create();
            await file.write('Bookstores in LA\n\nColección de ejemplo\nLibrería del centro\nLibrería del barrio\nLibrería del paseo\n');
            const contents = await file.text();
            if (!ownsDownload()) return;
            setDownloaded(contents);
            setDownloadOpen(true);
        } catch {
            if (ownsDownload()) setDownloadError(true);
        } finally {
            downloadPending.current = false;
            if (alive.current) setDownloading(false);
        }
    };
    const actionsFor = (openSearch: () => void): TopAppBarAction[] => {
        if (avatar) return [];
        if (primary)
            return [
                {
                    key: 'send',
                    icon: sent ? 'check' : 'send_fill1',
                    label: sent ? 'Página enviada' : 'Enviar página',
                    disabled: sent,
                    mode: primary.mode,
                    widthVariant: primary.widthVariant,
                    onPress: () => setSent(true),
                },
            ];
        if (trip)
            return [
                {
                    key: 'map',
                    icon: 'map_fill1',
                    label: 'Ver ubicaciones del recorrido',
                    onPress: () => setMapOpen(true),
                },
                {
                    key: 'hiking',
                    icon: 'hiking',
                    label: routeStarted ? 'Pausar recorrido' : 'Iniciar recorrido',
                    onPress: () => setRouteStarted(!routeStarted),
                },
            ];
        if (collectionActions)
            return [
                {
                    key: 'folder',
                    icon: collectionActions === 'filled' ? 'folder_fill1' : 'folder',
                    label: bookmarked ? 'Quitar colección de guardados' : 'Guardar colección',
                    onPress: () => setBookmarked(!bookmarked),
                },
                {
                    key: 'download',
                    icon: downloading ? 'hourglass_empty' : collectionActions === 'filled' ? 'cloud_download_fill1' : 'cloud_download',
                    label: downloading ? 'Guardando listado' : 'Descargar listado',
                    disabled: downloading,
                    onPress: () => {
                        void downloadListing();
                    },
                },
            ];
        if (image)
            return [
                {
                    key: 'bookmark',
                    icon: bookmarked ? 'bookmark_fill1' : 'bookmark-outline',
                    label: bookmarked ? 'Quitar página de guardados' : 'Guardar página',
                    onPress: () => setBookmarked(!bookmarked),
                },
            ];
        return [
            { key: 'search', icon: 'search', label: 'Buscar en la colección', onPress: openSearch },
            ...(searchOnly
                ? []
                : [
                      {
                          key: 'calendar',
                          icon: 'today_fill1',
                          label: 'Elegir fecha de visita',
                          onPress: () => setCalendar(true),
                      },
                  ]),
        ];
    };
    return (
        <View style={{ gap: 8 }}>
            {label ? <Caption>{label}</Caption> : null}
            <SearchView
                open={search}
                onOpenChange={setSearchOpen}
                value={query}
                onChangeText={setQuery}
                onSearch={setQuery}
                placeholder="Buscar en la colección"
                results={placeResults(query)}
                onResultPress={(result) => {
                    pendingSelection.current = result.title;
                    setQuery(result.title);
                    setSearch(false);
                }}
                onClosed={() => {
                    const title = pendingSelection.current;
                    pendingSelection.current = null;
                    if (!alive.current || title === null) return;
                    setSelected(title);
                    setCollection(false);
                }}
                renderTrigger={({ open }) => (
                    <TopAppBar
                        title={pageTitle}
                        subtitle={sent && subtitle ? 'Compartido con tu equipo' : subtitle}
                        variant={variant}
                        textAlign={textAlign}
                        image={image}
                        statusBarHeight={0}
                        scrolled={scrolled}
                        navigationIcon={avatar || collection ? 'menu' : 'arrow_back'}
                        navigationLabel={avatar || collection ? 'Abrir navegación' : 'Volver a la colección'}
                        onNavigationPress={() => (avatar || collection ? setRail(true) : setCollection(true))}
                        trailing={avatar ? <AccountAvatar onPress={() => setAccount(true)} testID={`${id}-account`} /> : undefined}
                        actions={actionsFor(open)}
                        testID={id}
                    />
                )}
                testID={`${id}-search`}
            />
            {collection ? (
                <List.Item
                    title={selected || title}
                    description="Abrir página de la colección"
                    trailing={<Icon source="chevron_right" size={24} />}
                    onPress={() => setCollection(false)}
                    testID={`${id}-open-page`}
                />
            ) : null}
            {sent ? <Caption testID={`${id}-sent`}>Página enviada a tu equipo.</Caption> : null}
            {bookmarked ? <Caption testID={`${id}-saved`}>Página guardada en tu colección.</Caption> : null}
            {date ? <Caption testID={`${id}-date`}>Visita: {date.toLocaleDateString('es-MX', { dateStyle: 'long' })}</Caption> : null}
            {selected ? <Caption testID={`${id}-selection`}>Página abierta: {selected}</Caption> : null}
            {routeStarted ? <Caption testID={`${id}-route-started`}>Recorrido iniciado · primera parada: Santa Monica.</Caption> : null}
            {downloaded ? <Caption testID={`${id}-downloaded`}>Listado guardado para consultarlo sin conexión.</Caption> : null}
            {downloadError ? (
                <Caption testID={`${id}-download-error`}>No se pudo guardar el listado. Vuelve a intentar la descarga.</Caption>
            ) : null}
            <NavigationRailModal
                open={rail}
                onOpenChange={setRail}
                items={destinations}
                value={section}
                onValueChange={(value) => {
                    setSection(value);
                    setCollection(true);
                }}
                title="Colección"
                testID={`${id}-navigation`}
            />
            <DatePicker
                visible={calendar}
                onDismiss={() => setCalendar(false)}
                value={date}
                onChange={(value) => {
                    setDate(value);
                    setCalendar(false);
                }}
                title="Fecha de visita"
                testID={`${id}-calendar-picker`}
            />
            <AccountDialog open={account} onClose={() => setAccount(false)} />
            <Dialog visible={mapOpen} onDismiss={() => setMapOpen(false)} testID={`${id}-map-dialog`}>
                <Dialog.Title>Ubicaciones del recorrido</Dialog.Title>
                <Dialog.Content>
                    <TripMap />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setMapOpen(false)}>
                        Cerrar
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <Dialog visible={downloadOpen} onDismiss={() => setDownloadOpen(false)} testID={`${id}-download-dialog`}>
                <Dialog.Title>Listado sin conexión</Dialog.Title>
                <Dialog.Content>
                    <Text>{downloaded}</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setDownloadOpen(false)}>
                        Cerrar
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
}

function TripMap() {
    const theme = useMobileTheme();
    return (
        <View style={{ gap: 16 }}>
            <Svg
                height={152}
                width="100%"
                viewBox="0 0 300 152"
                accessible
                accessibilityLabel="Ruta esquemática entre Santa Monica y Joshua Tree"
            >
                <Path d="M32 112 C68 112 60 40 128 40 S214 92 268 36" stroke={theme.colors.primary} strokeWidth={4} fill="none" />
                <Circle cx={32} cy={112} r={8} fill={theme.colors.primary} />
                <Circle cx={268} cy={36} r={8} fill={theme.colors.primary} />
                <SvgText x={16} y={144} fontSize={theme.fonts.labelMedium.fontSize} fill={theme.colors.onSurface}>
                    Santa Monica
                </SvgText>
                <SvgText x={202} y={20} fontSize={theme.fonts.labelMedium.fontSize} fill={theme.colors.onSurface}>
                    Joshua Tree
                </SvgText>
            </Svg>
            <Text variant="bodyMedium">Esquema del recorrido: comienza en Santa Monica y continúa hasta Joshua Tree.</Text>
        </View>
    );
}

function SearchAppBarExample({
    id,
    layout = 'outside',
    placeholder = 'Search product',
    centered = false,
    scrolled = false,
}: {
    id: string;
    layout?: SearchLayout;
    placeholder?: string;
    centered?: boolean;
    scrolled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState('');
    const [rail, setRail] = useState(false);
    const [section, setSection] = useState('all');
    const [account, setAccount] = useState(false);
    const [voice, setVoice] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [suggested, setSuggested] = useState(false);
    const pendingSelection = useRef<string | null>(null);
    const pendingVoice = useRef<string | null>(null);
    const focused = useIsFocused();
    useLayoutEffect(() => {
        if (!focused) {
            pendingVoice.current = null;
            pendingSelection.current = null;
        }
    }, [focused]);
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            pendingSelection.current = null;
            pendingVoice.current = null;
        };
    }, []);
    useEffect(() => {
        if (voice) pendingVoice.current = null;
    }, [voice]);
    const setSearchOpen = (open: boolean) => {
        if (open) pendingSelection.current = null;
        setOpen(open);
    };
    const outsideActions: TopAppBarAction[] =
        layout === 'two-outside' || layout === 'measurement'
            ? [
                  {
                      key: 'suggestions',
                      icon: 'auto_awesome',
                      label: 'Buscar lugares recomendados',
                      onPress: () => {
                          setSuggested(true);
                          setQuery('');
                          setSearchOpen(true);
                      },
                  },
              ]
            : [];
    return (
        <View style={{ gap: 8 }} testID={`${id}-example`}>
            <TopAppBar
                title="Search"
                variant="small"
                statusBarHeight={0}
                scrolled={scrolled}
                navigationIcon="menu"
                navigationLabel="Abrir navegación"
                onNavigationPress={() => setRail(true)}
                search={
                    <SearchView
                        open={open}
                        onOpenChange={setSearchOpen}
                        onClosed={() => {
                            const title = pendingSelection.current;
                            pendingSelection.current = null;
                            if (alive.current && title !== null) setSelected(title);
                        }}
                        value={query}
                        onChangeText={(value) => {
                            setQuery(value);
                            setSuggested(false);
                        }}
                        onSearch={setQuery}
                        placeholder={placeholder}
                        barTextAlign={centered ? 'center' : 'start'}
                        barContainerColor="transparent"
                        renderTrigger={({ open: enter, disabled, expanded }) => (
                            <AppBarSearchTrigger
                                open={enter}
                                disabled={disabled}
                                expanded={expanded}
                                value={query}
                                placeholder={placeholder}
                                centered={centered}
                                onVoice={layout === 'inside-and-outside' || layout === 'measurement' ? () => setVoice(true) : undefined}
                                testID={`${id}-search`}
                            />
                        )}
                        results={placeResults(query)
                            .filter((_, index) => !suggested || index < 3)
                            .map((place) => ({
                                ...place,
                                description: suggested ? 'Recomendado para ti' : undefined,
                            }))}
                        onResultPress={(result) => {
                            pendingSelection.current = result.title;
                            setQuery(result.title);
                            setOpen(false);
                        }}
                        testID={`${id}-search`}
                    />
                }
                actions={outsideActions}
                trailing={<AccountAvatar onPress={() => setAccount(true)} testID={`${id}-account`} />}
                testID={id}
            />
            {selected ? (
                <List.Item
                    title={selected}
                    description="Lugar abierto desde los resultados de búsqueda"
                    leading={<Icon source="place" size={24} />}
                    testID={`${id}-selection`}
                />
            ) : null}
            <NavigationRailModal
                open={rail}
                onOpenChange={setRail}
                items={destinations}
                value={section}
                onValueChange={(value) => {
                    setSection(value);
                    setQuery('');
                    setSelected(destinations.find((item) => item.key === value)!.label);
                }}
                title="Colección"
                testID={`${id}-navigation`}
            />
            <AccountDialog open={account} onClose={() => setAccount(false)} />
            <Dialog
                visible={voice}
                onDismiss={() => {
                    pendingVoice.current = null;
                    setVoice(false);
                }}
                onClosed={() => {
                    const next = pendingVoice.current;
                    pendingVoice.current = null;
                    if (!alive.current || !focused || next === null) return;
                    setQuery(next);
                    setSuggested(false);
                    setSearchOpen(true);
                }}
                testID={`${id}-voice-dialog`}
            >
                <Dialog.Icon icon="mic" />
                <Dialog.Title>Buscar por voz</Dialog.Title>
                <Dialog.Content>
                    <TextField
                        label="Consulta"
                        value={transcript}
                        onChangeText={setTranscript}
                        supportingText="Escribe o dicta la consulta desde el teclado."
                        testID={`${id}-voice-transcript`}
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button
                        variant="text"
                        onPress={() => {
                            pendingVoice.current = null;
                            setVoice(false);
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="text"
                        disabled={!transcript.trim()}
                        onPress={() => {
                            pendingVoice.current = transcript.trim();
                            setVoice(false);
                        }}
                    >
                        Buscar
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
}

function AppBarWordmark({ compact = false }: { compact?: boolean }) {
    const theme = useMobileTheme();
    return (
        <Image
            source={require('./assets/app-bars/fortnightly_title.png')}
            accessible
            accessibilityLabel="The Fortnightly"
            resizeMode="contain"
            style={{
                width: compact ? 110 : 220,
                maxWidth: '100%',
                aspectRatio: 110 / 18,
                tintColor: theme.colors.onSurface,
            }}
        />
    );
}

export function AppBarExamples({ onOpenPlayground }: Props) {
    return (
        <View style={{ gap: 32, marginHorizontal: -24 }}>
            <Section
                title="Variantes"
                description="Search app bar, small, medium flexible y large flexible son las cuatro variantes actuales."
            >
                {onOpenPlayground ? (
                    <View style={{ paddingHorizontal: 24 }}>
                        <Button
                            icon="open_in_new"
                            style={{ alignSelf: 'flex-start' }}
                            onPress={onOpenPlayground}
                            testID="md-appbar-playground-open"
                        >
                            Probar desplazamiento
                        </Button>
                    </View>
                ) : null}
                <Caption>Search app bar · contenedor 64 dp, búsqueda 56 dp</Caption>
                <SearchAppBarExample id="md-appbar-search-bar" centered />
                {currentVariants.map((variant) => (
                    <BarExample
                        key={variant}
                        id={`md-appbar-${variant}`}
                        variant={variant}
                        title={headings[variant]}
                        label={
                            variant === 'small'
                                ? 'Small · 64 dp'
                                : variant === 'medium-flexible'
                                  ? 'Medium flexible · 112 dp'
                                  : 'Large flexible · 120 dp'
                        }
                    />
                ))}
            </Section>
            <Section
                title="Alineación"
                description="El título y el subtítulo pueden alinearse al inicio o al centro. En small, el título ocupa una sola línea."
            >
                {(['start', 'center'] as const).map((textAlign) => (
                    <SearchAppBarExample
                        key={textAlign}
                        id={`md-appbar-align-search-${textAlign}`}
                        layout="inside-and-outside"
                        centered={textAlign === 'center'}
                    />
                ))}
                {currentVariants.flatMap((variant) =>
                    (['start', 'center'] as const).map((textAlign) => (
                        <BarExample
                            key={`${variant}-${textAlign}`}
                            id={`md-appbar-align-${variant}-${textAlign}`}
                            variant={variant}
                            title="Headline"
                            textAlign={textAlign}
                            label={`${variant} · ${textAlign === 'center' ? 'centrado' : 'inicio'}`}
                        />
                    ))
                )}
            </Section>
            <Section
                title="Search app bar"
                description="La búsqueda abre una search view. Las acciones pueden estar dentro o fuera del campo; en móvil se muestran hasta dos iconos junto al avatar."
            >
                <Caption>Elemento inicial y avatar fuera de la búsqueda</Caption>
                <SearchAppBarExample id="md-appbar-search-outside" centered />
                <Caption>Micrófono dentro de la búsqueda y avatar fuera</Caption>
                <SearchAppBarExample id="md-appbar-search-inside-outside" layout="inside-and-outside" centered />
                <Caption>Acción y avatar fuera de la búsqueda</Caption>
                <SearchAppBarExample id="md-appbar-search-two-outside" layout="two-outside" centered />
                <Caption>Medición de Body Large · alineación inicial y micrófono dentro</Caption>
                <SearchAppBarExample id="md-appbar-search-measurement-start" layout="measurement" placeholder="Body Large" />
            </Section>
            <Section
                title="Títulos de dos líneas"
                description="Las variantes flexibles permiten que el título se ajuste hasta dos líneas. Small mantiene una sola línea; evita copiar un título largo en ella."
            >
                <BarExample
                    id="md-appbar-two-line-title"
                    variant="medium-flexible"
                    title="Hiking trips with Elie in Santa Monica and Joshua Tree!"
                    trip
                />
            </Section>
            <Section
                title="Iconos de acciones"
                description="Las acciones con glifos llenos mejoran la visibilidad. Los glifos outlined también pueden usarse. Estas dos páginas son adaptaciones del ejemplo de guardar y descargar una colección."
            >
                <BarExample
                    id="md-appbar-actions-filled-glyphs"
                    title="Bookstores in LA"
                    collectionActions="filled"
                    label="Adaptación · folder y cloud_download con glifos llenos"
                />
                <BarExample
                    id="md-appbar-actions-outlined-glyphs"
                    title="Bookstores in LA"
                    collectionActions="outlined"
                    label="Adaptación · folder y cloud_download outlined"
                />
            </Section>
            <Section
                title="Imagen o logotipo"
                description="La imagen sustituye el título en small y aparece encima del título en las variantes flexibles."
            >
                <BarExample
                    id="md-appbar-image-small"
                    title="The Fortnightly"
                    textAlign="center"
                    image={<AppBarWordmark />}
                    label="Small · logotipo centrado en lugar del título"
                />
                <BarExample
                    id="md-appbar-image-medium"
                    variant="medium-flexible"
                    title="Headline Medium"
                    image={<AppBarWordmark />}
                    label="Medium flexible · imagen sobre el título"
                />
                <BarExample
                    id="md-appbar-image-large"
                    variant="large-flexible"
                    title="Display Small"
                    textAlign="center"
                    image={<AppBarWordmark />}
                    label="Large flexible · imagen y título centrados"
                />
            </Section>
            <Section
                title="Acción principal"
                description="Una única acción filled o tonal puede destacar la operación principal de la página, en ancho predeterminado o wide."
            >
                {(['contained', 'contained-tonal'] as const).flatMap((mode) =>
                    (['default', 'wide'] as const).map((widthVariant) => (
                        <BarExample
                            key={`${mode}-${widthVariant}`}
                            id={`md-appbar-action-${mode}-${widthVariant}`}
                            variant={mode === 'contained' ? 'large-flexible' : 'small'}
                            title="Headline"
                            subtitle={mode === 'contained' ? 'Subtitle' : undefined}
                            textAlign={mode === 'contained' ? 'start' : 'center'}
                            primary={{ mode, widthVariant }}
                            label={`${mode === 'contained' ? 'Filled · large flexible' : 'Tonal · small centrada'} · ${widthVariant === 'wide' ? 'wide' : 'ancho predeterminado'}`}
                        />
                    ))
                )}
            </Section>
            <Section
                title="Subtítulo"
                description="Small conserva 64 dp. Las variantes flexibles ajustan su altura al texto: medium 112/136 dp y large 120/152 dp."
            >
                {currentVariants.flatMap((variant) =>
                    [false, true].map((withSubtitle) => (
                        <BarExample
                            key={`${variant}-${withSubtitle}`}
                            id={`md-appbar-subtitle-${variant}-${withSubtitle ? 'with' : 'without'}`}
                            variant={variant}
                            title="Headline"
                            subtitle={withSubtitle ? 'Subtitle' : undefined}
                            label={`${variant}${withSubtitle ? ' con subtítulo' : ''}`}
                        />
                    ))
                )}
            </Section>
            <Section
                title="Color al desplazar"
                description="El contenedor cambia de surface a surface container. El campo de búsqueda cambia de surface container a surface container highest. No se añade sombra."
            >
                {[false, true].map((scrolled) => (
                    <BarExample
                        key={`product-${scrolled}`}
                        id={`md-appbar-color-product-${scrolled ? 'scrolled' : 'flat'}`}
                        title="Product"
                        textAlign="center"
                        avatar
                        scrolled={scrolled}
                        label={`Small centrada · ${scrolled ? 'On scroll' : 'Flat'}`}
                    />
                ))}
                {[false, true].map((scrolled) => (
                    <View key={`search-${scrolled}`} style={{ gap: 8 }}>
                        <Caption>Search · {scrolled ? 'On scroll' : 'Flat'}</Caption>
                        <SearchAppBarExample
                            id={`md-appbar-search-${scrolled ? 'scrolled' : 'flat'}`}
                            layout="inside-and-outside"
                            centered
                            scrolled={scrolled}
                        />
                    </View>
                ))}
                {currentVariants.flatMap((variant) =>
                    [false, true].map((scrolled) => (
                        <BarExample
                            key={`${variant}-${scrolled}`}
                            id={`md-appbar-color-${variant}-${scrolled ? 'scrolled' : 'flat'}`}
                            variant={variant}
                            title={
                                variant === 'small' ? 'Title large' : variant === 'medium-flexible' ? 'Headline medium' : 'Display small'
                            }
                            searchOnly
                            scrolled={scrolled}
                            label={`${variant} · ${scrolled ? 'On scroll' : 'Flat'}`}
                        />
                    ))
                )}
            </Section>
        </View>
    );
}

/** Owns the viewport so the app bar, safe area, and scrolling content share one surface. */

export function AppBarPlayground({ onBack }: { onBack: () => void }) {
    const theme = useMobileTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const [variant, setVariant] = useState<(typeof currentVariants)[number] | 'search'>('medium-flexible');
    const [behavior, setBehavior] = useState<'pinned' | 'exit-until-collapsed' | 'enter-always'>('exit-until-collapsed');
    const [center, setCenter] = useState(false);
    const [subtitle, setSubtitle] = useState(true);
    const [logo, setLogo] = useState(false);
    const [transparent, setTransparent] = useState(false);
    const [selected, setSelected] = useState<number | null>(null);
    const [saved, setSaved] = useState<number[]>([]);
    const [query, setQuery] = useState('');
    const [search, setSearch] = useState(false);
    const [account, setAccount] = useState(false);
    const [rtl, setRtl] = useState(false);
    const [brandLeading, setBrandLeading] = useState(false);
    const [brightSearch, setBrightSearch] = useState(false);
    const [wideActions, setWideActions] = useState(false);
    const [searchLabel, setSearchLabel] = useState('Search');
    const [calendar, setCalendar] = useState(false);
    const [date, setDate] = useState<Date>();
    const [onlySaved, setOnlySaved] = useState(false);
    const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
    const pendingSelection = useRef<number | null>(null);
    const bar = useAppBarScrollBehavior({ behavior, snap: true });
    const layoutMetrics = bar._metrics;
    const overlayBar = transparent && variant !== 'search';
    const overlaySpacer = useAnimatedStyle(() => {
        const metrics = layoutMetrics.get();
        return { height: metrics.top + metrics.expanded };
    });
    const reset = () => {
        bar.reset();
        scroll.current?.scrollTo({ y: 0, animated: false });
    };
    const choose = (index: number) => {
        setSelected(index);
        reset();
    };
    const setSearchOpen = (open: boolean) => {
        if (open) pendingSelection.current = null;
        setSearch(open);
    };
    const selectSearchResult = (result: { key: string; title: string }) => {
        pendingSelection.current = Number(result.key);
        setQuery(result.title);
        setSearch(false);
    };
    const finishSearchClose = () => {
        const index = pendingSelection.current;
        pendingSelection.current = null;
        if (index != null) choose(index);
    };
    const back = () => {
        if (selected == null) onBack();
        else {
            setSelected(null);
            reset();
        }
    };
    const item = selected == null ? null : appBarPlaces[selected % appBarPlaces.length];
    const showSearch = variant === 'search' && selected == null;
    const isSaved = selected != null && saved.includes(selected);
    const save = () => {
        if (selected != null)
            setSaved((items) => (items.includes(selected) ? items.filter((index) => index !== selected) : [...items, selected]));
    };
    const searchField = (
        <SearchView
            open={search}
            onOpenChange={setSearchOpen}
            onClosed={finishSearchClose}
            value={query}
            onChangeText={setQuery}
            onSearch={setQuery}
            placeholder={searchLabel}
            barContainerColor="transparent"
            barTextAlign={center ? 'center' : 'start'}
            renderTrigger={({ open, disabled, expanded }) => (
                <AppBarSearchTrigger
                    open={open}
                    disabled={disabled}
                    expanded={expanded}
                    value={query}
                    placeholder={searchLabel}
                    centered={center}
                    testID="md-appbar-live-search"
                />
            )}
            results={placeResults(query)}
            onResultPress={selectSearchResult}
            testID="md-appbar-live-search"
        />
    );
    const largeScreenActions: TopAppBarAction[] = [
        { key: 'search', icon: 'search', label: 'Buscar lugares', onPress: () => setSearchOpen(true) },
        {
            key: 'calendar',
            icon: 'today_fill1',
            label: 'Elegir fecha de visita',
            onPress: () => setCalendar(true),
        },
        {
            key: 'saved',
            icon: onlySaved ? 'folder_fill1' : 'folder',
            label: onlySaved ? 'Mostrar todos los lugares' : 'Mostrar lugares guardados',
            onPress: () => setOnlySaved(!onlySaved),
        },
        {
            key: 'suggestions',
            icon: 'auto_awesome',
            label: 'Buscar lugares recomendados',
            onPress: () => {
                setQuery('Museo');
                setSearchOpen(true);
            },
        },
    ];
    return (
        <LocaleProvider direction={rtl ? 'rtl' : 'ltr'}>
            <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID="md-appbar-viewport">
                <View
                    pointerEvents="box-none"
                    style={overlayBar ? { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 } : undefined}
                >
                    <TopAppBar
                        title={item ?? 'Lugares para explorar'}
                        subtitle={
                            subtitle && variant !== 'search'
                                ? selected == null
                                    ? 'Tu próxima aventura'
                                    : isSaved
                                      ? 'Guardado en tu colección'
                                      : 'Planifica tu próxima visita'
                                : undefined
                        }
                        variant={variant === 'search' ? 'small' : variant}
                        search={showSearch ? searchField : undefined}
                        textAlign={center ? 'center' : 'start'}
                        image={logo && variant !== 'search' ? <AppBarWordmark /> : undefined}
                        scrollBehavior={bar}
                        scrolledContainerColor={transparent ? 'transparent' : undefined}
                        searchContainerColor={brightSearch ? theme.colors.surfaceBright : undefined}
                        scrolledSearchContainerColor={brightSearch ? theme.colors.surfaceBright : undefined}
                        navigationIcon="arrow_back"
                        navigationLabel={selected == null ? 'Cerrar prueba de barras' : 'Volver a la colección'}
                        onNavigationPress={back}
                        leading={
                            showSearch && brandLeading ? (
                                <TouchableRipple
                                    accessibilityRole="button"
                                    accessibilityLabel="The Fortnightly, volver al inicio"
                                    onPress={() => {
                                        setQuery('');
                                        setOnlySaved(false);
                                        reset();
                                    }}
                                    style={{ width: 126, height: 48, alignItems: 'center', justifyContent: 'center' }}
                                    testID="md-appbar-live-brand-home"
                                >
                                    <AppBarWordmark compact />
                                </TouchableRipple>
                            ) : undefined
                        }
                        navigationMode={transparent ? 'contained' : undefined}
                        navigationWidthVariant={transparent ? 'narrow' : 'default'}
                        actions={
                            selected != null
                                ? [
                                      {
                                          key: 'save',
                                          icon: isSaved ? 'bookmark_fill1' : 'bookmark-outline',
                                          label: isSaved ? 'Quitar lugar de guardados' : 'Guardar lugar',
                                          mode: transparent ? 'contained' : 'contained-tonal',
                                          onPress: save,
                                      },
                                  ]
                                : showSearch
                                  ? wideActions && width >= 600
                                      ? largeScreenActions
                                      : []
                                  : [
                                        {
                                            key: 'search',
                                            icon: 'search',
                                            label: 'Buscar lugares',
                                            mode: transparent ? 'contained' : undefined,
                                            onPress: () => setSearchOpen(true),
                                        },
                                    ]
                        }
                        trailing={
                            showSearch ? <AccountAvatar onPress={() => setAccount(true)} testID="md-appbar-live-account" /> : undefined
                        }
                        testID="md-appbar-live"
                    />
                </View>
                <Animated.ScrollView
                    ref={scroll}
                    onScroll={bar.onScroll}
                    scrollEventThrottle={16}
                    keyboardShouldPersistTaps="handled"
                    contentInsetAdjustmentBehavior="never"
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                    testID="md-appbar-live-scroll"
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    {overlayBar ? <Animated.View pointerEvents="none" style={overlaySpacer} testID="md-appbar-live-spacer" /> : null}
                    <View style={{ padding: 24, gap: 16 }}>
                        <Text variant="titleMedium" accessibilityRole="header">
                            Configuración de la barra
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {(['search', ...currentVariants] as const).map((value) => (
                                <Chip
                                    key={value}
                                    variant="filter"
                                    selected={variant === value}
                                    onPress={() => {
                                        setVariant(value);
                                        if (value === 'search') setTransparent(false);
                                        reset();
                                    }}
                                    testID={`md-appbar-config-${value}`}
                                >
                                    {value === 'search'
                                        ? 'Search'
                                        : value === 'small'
                                          ? 'Small'
                                          : value === 'medium-flexible'
                                            ? 'Medium flexible'
                                            : 'Large flexible'}
                                </Chip>
                            ))}
                        </View>
                        {variant === 'search' ? (
                            <View style={{ gap: 8 }}>
                                <Text variant="labelLarge">Texto de búsqueda</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                    {['Search', 'Search inbox', 'Search Photos'].map((label) => (
                                        <Chip
                                            key={label}
                                            variant="filter"
                                            selected={searchLabel === label}
                                            onPress={() => {
                                                setSearchLabel(label);
                                                setQuery('');
                                            }}
                                            testID={`md-appbar-search-copy-${label.replaceAll(' ', '-')}`}
                                        >
                                            {label}
                                        </Chip>
                                    ))}
                                </View>
                            </View>
                        ) : null}
                        <Text variant="labelLarge">Al desplazar</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {(
                                [
                                    { value: 'pinned', label: 'Fija' },
                                    { value: 'exit-until-collapsed', label: 'Contraer' },
                                    { value: 'enter-always', label: 'Ocultar y revelar' },
                                ] as const
                            ).map((option) => (
                                <Chip
                                    key={option.value}
                                    variant="filter"
                                    selected={behavior === option.value}
                                    onPress={() => {
                                        setBehavior(option.value);
                                        reset();
                                    }}
                                    testID={`md-appbar-scroll-${option.value}`}
                                >
                                    {option.label}
                                </Chip>
                            ))}
                        </View>
                        {[
                            { label: 'Texto centrado', value: center, change: setCenter, disabled: false, id: 'center' },
                            {
                                label: 'Subtítulo',
                                value: subtitle,
                                change: setSubtitle,
                                disabled: variant === 'search',
                                id: 'subtitle',
                            },
                            {
                                label: 'Imagen o logotipo',
                                value: logo,
                                change: setLogo,
                                disabled: variant === 'search',
                                id: 'logo',
                            },
                            {
                                label: 'Transparente al desplazar',
                                value: transparent,
                                change: setTransparent,
                                disabled: variant === 'search',
                                id: 'transparent',
                            },
                            {
                                label: 'Logotipo inicial · vuelve al inicio',
                                value: brandLeading,
                                change: setBrandLeading,
                                disabled: variant !== 'search',
                                id: 'brand',
                            },
                            {
                                label: 'Búsqueda con surface bright',
                                value: brightSearch,
                                change: setBrightSearch,
                                disabled: variant !== 'search',
                                id: 'bright',
                            },
                            {
                                label: 'Cuatro acciones en pantalla amplia',
                                value: wideActions,
                                change: setWideActions,
                                disabled: variant !== 'search' || width < 600,
                                id: 'wide-actions',
                            },
                            {
                                label: 'Diseño de derecha a izquierda (RTL)',
                                value: rtl,
                                change: setRtl,
                                disabled: false,
                                id: 'rtl',
                            },
                        ].map((option) => (
                            <View key={option.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                <Text style={{ flex: 1 }}>{option.label}</Text>
                                <Switch
                                    value={option.value}
                                    onValueChange={(value) => {
                                        option.change(value);
                                        reset();
                                    }}
                                    disabled={option.disabled}
                                    accessibilityLabel={option.label}
                                    testID={`md-appbar-config-${option.id}`}
                                />
                            </View>
                        ))}
                        <Text variant="bodyMedium">
                            {behavior === 'pinned'
                                ? 'La barra permanece visible mientras se desplaza el contenido.'
                                : behavior === 'enter-always'
                                  ? 'Desplaza hacia abajo para ocultar la barra; invierte el gesto para revelarla.'
                                  : 'La barra flexible se comprime hasta small y permanece así hasta volver al inicio.'}
                        </Text>
                        {variant === 'search' ? (
                            <Text variant="bodySmall">
                                La búsqueda llena el espacio hasta 312 dp. Conserva 312 dp mientras el espacio útil no supera 624 dp;
                                después ocupa la mitad de ese espacio. Las cuatro acciones son una adaptación para ventanas de al menos 600
                                dp; en móvil se reducen.
                            </Text>
                        ) : null}
                        {brandLeading && showSearch ? (
                            <Button variant="text" style={{ alignSelf: 'flex-start' }} onPress={onBack} testID="md-appbar-close-playground">
                                Volver al catálogo
                            </Button>
                        ) : null}
                        {date ? (
                            <Text accessibilityLiveRegion="polite">Visita: {date.toLocaleDateString('es-MX', { dateStyle: 'long' })}</Text>
                        ) : null}
                        {variant !== 'search' ? (
                            <SearchView
                                open={search}
                                onOpenChange={setSearchOpen}
                                onClosed={finishSearchClose}
                                value={query}
                                onChangeText={setQuery}
                                onSearch={setQuery}
                                placeholder="Buscar lugares"
                                results={placeResults(query)}
                                onResultPress={selectSearchResult}
                                renderTrigger={() => null}
                                testID="md-appbar-live-search"
                            />
                        ) : null}
                    </View>
                    {selected == null ? (
                        onlySaved && !saved.length ? (
                            <Text style={{ padding: 24 }}>Aún no hay lugares guardados. Cambia el filtro para explorar la colección.</Text>
                        ) : (
                            Array.from({ length: 30 }, (_, index) => index)
                                .filter((index) => !onlySaved || saved.includes(index))
                                .map((index) => (
                                    <List.Item
                                        key={index}
                                        title={appBarPlaces[index % appBarPlaces.length]}
                                        description={`Lugar ${index + 1}${saved.includes(index) ? ' · Guardado' : ''}`}
                                        leading={<Icon source="place" size={24} />}
                                        trailing={<Icon source={saved.includes(index) ? 'bookmark_fill1' : 'chevron_right'} size={24} />}
                                        onPress={() => choose(index)}
                                        testID={`md-appbar-place-${index}`}
                                    />
                                ))
                        )
                    ) : (
                        <View style={{ padding: 24, gap: 16 }}>
                            <Text variant="headlineSmall" accessibilityRole="header">
                                {item}
                            </Text>
                            <Text accessibilityLiveRegion="polite" testID="md-appbar-live-saved">
                                {isSaved ? 'Este lugar está guardado en tu colección.' : 'Guarda este lugar con la acción de la barra.'}
                            </Text>
                            {Array.from({ length: 12 }, (_, index) => (
                                <Text key={index} variant="bodyLarge">
                                    {index === 0 ? 'El recorrido' : `Parada ${index + 1}`} · Explora el paisaje, descubre sus senderos y
                                    reserva tiempo para disfrutar de cada vista.
                                </Text>
                            ))}
                        </View>
                    )}
                </Animated.ScrollView>
                <AccountDialog open={account} onClose={() => setAccount(false)} />
                <DatePicker
                    visible={calendar}
                    onDismiss={() => setCalendar(false)}
                    value={date}
                    onChange={(value) => {
                        setDate(value);
                        setCalendar(false);
                    }}
                    title="Fecha de visita"
                    testID="md-appbar-live-calendar"
                />
            </View>
        </LocaleProvider>
    );
}
