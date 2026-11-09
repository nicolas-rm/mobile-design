import { useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import Animated, {
    cancelAnimation,
    ReduceMotion,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Button,
    Card,
    DatePicker,
    Dialog,
    FullScreenDialog,
    Icon,
    IconButton,
    List,
    Menu,
    NavigationDrawerModal,
    SearchView,
    Tabs,
    TabsPager,
    Text,
    TopAppBar,
    useMobileTheme,
    type TabItem,
} from 'mobile-design/react-native-web';
import { tabsReferenceArt, TabsSourceArt, type TabsReferenceArtName } from './mobile-design-tabs-art';
import { tabsDogItems, tabsMediaItems, tabsMovieItems, tabsMusicItems, type TabsUsageScenario } from './mobile-design-tabs-usage-data';

type RecordItem = { id: string; title: string; size?: string; art?: TabsReferenceArtName };
const musicRecords: Record<string, readonly RecordItem[]> = {
    ambient: [
        { id: 'floral', title: 'Floral Explos...', size: '30 MB', art: 'floral' },
        { id: 'astral', title: 'Astral Mead...', size: '27 MB', art: 'astral' },
        { id: 'traveler', title: 'Traveler', size: '21 MB', art: 'traveler' },
        { id: 'ladder', title: 'Ladder of th...', size: '32 MB', art: 'mountain' },
        { id: 'crane', title: 'Blue Crane', size: '16 MB', art: 'cranes' },
    ],
    soundscapes: [
        { id: 'water', title: 'Water House...', size: '28 MB', art: 'water' },
        { id: 'astral-sound', title: 'Astral Mead...', size: '27 MB', art: 'astral' },
        { id: 'traveler-sound', title: 'Traveler', size: '21 MB', art: 'traveler' },
    ],
    'white-noise': [
        { id: 'concrete', title: 'Concrete mo...', size: '27 MB', art: 'tent' },
        { id: 'real', title: 'Real sounds', size: '27 MB', art: 'station' },
        { id: 'magdalena', title: 'Magdalena', size: '21 MB', art: 'magdalena' },
    ],
};
const recipeItems: readonly TabItem[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'ingredients', label: 'Ingredients' },
    { key: 'instructions', label: 'Instructions' },
];

function Grid({
    records,
    onOpen,
    testID,
    columns = 3,
}: {
    records: readonly RecordItem[];
    onOpen: (item: RecordItem) => void;
    testID: string;
    columns?: 1 | 2 | 3;
}) {
    const insets = useSafeAreaInsets();
    return (
        <FlatList
            data={records}
            keyExtractor={(item) => item.id}
            numColumns={columns}
            contentInsetAdjustmentBehavior="never"
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}
            columnWrapperStyle={columns > 1 ? { gap: 16 } : undefined}
            renderItem={({ item }) => (
                <Card
                    mode="contained"
                    style={{
                        flex: 1,
                        maxWidth: columns === 3 ? '33.333%' : columns === 2 ? '50%' : '100%',
                        overflow: 'hidden',
                        borderRadius: 12,
                    }}
                    onPress={() => onOpen(item)}
                    accessibilityLabel={`${item.title}${item.size ? `, ${item.size}` : ''}`}
                    testID={`${testID}-${item.id}`}
                >
                    <View style={{ aspectRatio: columns === 1 ? 16 / 9 : 1, overflow: 'hidden' }}>
                        {item.art ? <TabsSourceArt name={item.art} /> : <Icon source="pets" size={48} />}
                    </View>
                    <View style={{ padding: columns === 3 ? 8 : 12, gap: 4 }}>
                        <Text variant="labelLarge" numberOfLines={1}>
                            {item.title}
                        </Text>
                        {item.size ? <Text variant="bodySmall">{item.size}</Text> : null}
                    </View>
                </Card>
            )}
            testID={testID}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
        />
    );
}

function MoviePage({
    item,
    offset,
    headerHeight,
    onOpen,
    selected,
}: {
    item: TabItem;
    offset: SharedValue<number>;
    headerHeight: number;
    onOpen: (item: RecordItem) => void;
    selected: boolean;
}) {
    const theme = useMobileTheme();
    const insets = useSafeAreaInsets();
    const previousY = useSharedValue(0);
    const active = useSharedValue(selected);
    const ownOffset = useSharedValue(0);
    const spring = theme.motion.spring.default.spatial;
    useEffect(
        () => () => {
            if (active.get()) cancelAnimation(offset);
        },
        [active, offset]
    );
    useEffect(() => {
        active.set(selected);
        if (selected) {
            cancelAnimation(offset);
            offset.set(previousY.get() <= 0 ? 0 : Math.max(-headerHeight, Math.min(0, ownOffset.get())));
        }
    }, [active, headerHeight, offset, ownOffset, previousY, selected]);
    const settle = () => {
        'worklet';
        if (!active.get()) return;
        const current = offset.get();
        const target = current < -headerHeight / 2 ? -headerHeight : 0;
        ownOffset.set(target);
        offset.set(
            theme.animation.scale === 0
                ? target
                : withSpring(target, {
                      stiffness: spring.stiffness,
                      damping: 2 * Math.sqrt(spring.stiffness) * spring.damping,
                      mass: 1,
                      overshootClamping: true,
                      reduceMotion: ReduceMotion.Never,
                  })
        );
    };
    const handler = useAnimatedScrollHandler({
        onBeginDrag: (event) => {
            if (active.get()) cancelAnimation(offset);
            previousY.set(Math.max(0, event.contentOffset.y));
        },
        onScroll: (event) => {
            const current = Math.max(0, event.contentOffset.y);
            const delta = current - previousY.get();
            previousY.set(current);
            if (!active.get()) return;
            offset.set(current <= 0 ? 0 : Math.max(-headerHeight, Math.min(0, offset.get() - delta)));
            ownOffset.set(offset.get());
        },
        onMomentumEnd: settle,
        onEndDrag: (event) => {
            if (Math.abs(event.velocity?.y ?? 0) < 0.01) settle();
        },
    });
    return (
        <Animated.ScrollView
            onScroll={handler}
            scrollEventThrottle={16}
            contentInsetAdjustmentBehavior="never"
            contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: insets.bottom + 24, paddingHorizontal: 16, gap: 24 }}
            testID={`md-tabs-movies-page-${item.key}`}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
        >
            {item.key === 'movies' ? (
                <>
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
                        {(
                            [
                                { id: 'middle-summer', title: 'Middle Summer', art: 'middleSummer' },
                                { id: 'best-bess', title: 'Best Bess', art: 'bestBess' },
                            ] satisfies RecordItem[]
                        ).map((movie) => (
                            <Card
                                key={movie.id}
                                style={{ flex: 1, overflow: 'hidden', borderRadius: 12 }}
                                onPress={() => onOpen(movie)}
                                accessibilityLabel={movie.title}
                            >
                                <View style={{ aspectRatio: 232 / 318 }}>
                                    <TabsSourceArt name={movie.art!} />
                                </View>
                            </Card>
                        ))}
                    </View>
                    <Text variant="titleLarge">Discover</Text>
                    {Array.from({ length: 12 }, (_, index) => (
                        <List.Item
                            key={index}
                            title={index % 2 ? 'Best Bess' : 'Middle Summer'}
                            description="Movies near me"
                            leading={<Icon source="movie" size={24} />}
                            onPress={() => onOpen({ id: `movie-${index}`, title: index % 2 ? 'Best Bess' : 'Middle Summer' })}
                        />
                    ))}
                </>
            ) : (
                <View style={{ gap: 16, paddingTop: 16 }}>
                    <Text variant="titleLarge">Theatres</Text>
                    {Array.from({ length: 12 }, (_, index) => (
                        <List.Item
                            key={index}
                            title={`Theatre ${index + 1}`}
                            description="Local example listing"
                            leading={<Icon source="theaters" size={24} />}
                            onPress={() => onOpen({ id: `theatre-${index}`, title: `Theatre ${index + 1}` })}
                        />
                    ))}
                </View>
            )}
        </Animated.ScrollView>
    );
}

/** Live counterparts of the published figures. Expanded records are local demo data. */
export function TabsUsageContent({ scenario, onBack }: { scenario: TabsUsageScenario; onBack: () => void }) {
    const theme = useMobileTheme();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const [selected, setSelected] = useState(
        scenario === 'media'
            ? 'photos'
            : scenario === 'dogs'
              ? 'alaskan'
              : scenario === 'recipe'
                ? 'overview'
                : scenario === 'movies'
                  ? 'movies'
                  : 'ambient'
    );
    const position = useSharedValue(scenario === 'media' || scenario === 'dogs' ? 1 : 0);
    const [selectionRequest, setSelectionRequest] = useState(0);
    const [record, setRecord] = useState<RecordItem | null>(null);
    const [more, setMore] = useState(false);
    const [drawer, setDrawer] = useState(false);
    const [search, setSearch] = useState(false);
    const searchOpen = useRef(false);
    const pendingSearchRecord = useRef<RecordItem | null>(null);
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            pendingSearchRecord.current = null;
        };
    }, []);
    const openSearch = () => {
        pendingSearchRecord.current = null;
        searchOpen.current = true;
        setSearch(true);
    };
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState(false);
    const [calendar, setCalendar] = useState(false);
    const [date, setDate] = useState(new Date(2026, 9, 19));
    const [attach, setAttach] = useState(false);
    const [attached, setAttached] = useState<string[]>([]);
    const [headerHeight, setHeaderHeight] = useState(112);
    const headerOffset = useSharedValue(0);
    const headerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: headerOffset.get() }] }));
    const items =
        scenario === 'media'
            ? tabsMediaItems
            : scenario === 'dogs'
              ? tabsDogItems
              : scenario === 'recipe'
                ? recipeItems
                : scenario === 'movies'
                  ? tabsMovieItems
                  : tabsMusicItems;
    const title =
        scenario === 'media'
            ? 'My saved media'
            : scenario === 'dogs'
              ? 'Dog breeds'
              : scenario === 'movies'
                ? 'Movies near me'
                : scenario === 'recipe'
                  ? 'Poke bowl'
                  : 'Music';
    const allRecords = Object.values(musicRecords).flat();
    const share = () => {
        void Share.share({ message: title });
    };
    const header = (
        <View
            style={{ backgroundColor: theme.colors.surface }}
            onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
            testID="md-tabs-header-unit"
        >
            <TopAppBar
                title={title}
                statusBarHeight={0}
                navigationIcon={scenario === 'music' ? 'menu' : 'arrow_back'}
                navigationLabel={scenario === 'music' ? 'Open navigation menu' : 'Back'}
                onNavigationPress={scenario === 'music' ? () => setDrawer(true) : onBack}
                actions={
                    scenario === 'recipe'
                        ? []
                        : scenario === 'media'
                          ? [
                                {
                                    key: 'attach',
                                    icon: 'attach_file',
                                    label: 'Attach media',
                                    onPress: () => setAttach(true),
                                    testID: 'md-tabs-media-attach',
                                },
                                {
                                    key: 'calendar',
                                    icon: 'event',
                                    label: 'Choose date',
                                    onPress: () => setCalendar(true),
                                    testID: 'md-tabs-media-calendar',
                                },
                            ]
                          : [
                                { key: 'share', icon: 'share', label: `Share ${title}`, onPress: share, testID: 'md-tabs-share' },
                                ...(scenario === 'music'
                                    ? [
                                          {
                                              key: 'search',
                                              icon: 'search',
                                              label: 'Search music',
                                              onPress: openSearch,
                                              testID: 'md-tabs-search',
                                          },
                                      ]
                                    : []),
                                ...(scenario === 'dogs'
                                    ? [
                                          {
                                              key: 'close',
                                              icon: 'close',
                                              label: 'Close Dog breeds',
                                              onPress: onBack,
                                              testID: 'md-tabs-dogs-close',
                                          },
                                      ]
                                    : []),
                            ]
                }
                trailing={
                    scenario === 'movies' || scenario === 'recipe' ? undefined : (
                        <Menu
                            visible={more}
                            onDismiss={() => setMore(false)}
                            anchor={
                                <IconButton
                                    icon="more_vert"
                                    accessibilityLabel="More options"
                                    onPress={() => setMore(true)}
                                    testID="md-tabs-more"
                                />
                            }
                        >
                            {scenario === 'music' || scenario === 'media' ? (
                                <Menu.Item
                                    title={sort ? 'Original order' : 'Sort A–Z'}
                                    leadingIcon="sort_by_alpha"
                                    onPress={() => {
                                        setSort((previous) => !previous);
                                        setMore(false);
                                    }}
                                    testID="md-tabs-sort"
                                />
                            ) : (
                                <Menu.Item
                                    title={`Share ${items.find((item) => item.key === selected)?.label ?? title}`}
                                    leadingIcon="share"
                                    onPress={() => {
                                        setMore(false);
                                        void Share.share({
                                            message: `${title} · ${items.find((item) => item.key === selected)?.label ?? ''}`,
                                        });
                                    }}
                                    testID="md-tabs-share-category"
                                />
                            )}
                        </Menu>
                    )
                }
                testID={`md-tabs-${scenario}-bar`}
            />
            {scenario === 'recipe' ? (
                <View style={{ padding: 16, gap: 12 }} testID="md-tabs-recipe-introduction">
                    <View style={{ aspectRatio: 760 / 206, borderRadius: 12, overflow: 'hidden' }}>
                        <TabsSourceArt name="poke" />
                    </View>
                    <View style={{ gap: 4 }}>
                        <Text variant="titleMedium">30 mins prep time</Text>
                        <Text variant="bodyLarge">Difficulty: Easy</Text>
                    </View>
                </View>
            ) : null}
            <Tabs
                items={items}
                value={selected}
                onValueChange={setSelected}
                onTabPress={() => setSelectionRequest((request) => request + 1)}
                position={position}
                variant={scenario === 'recipe' ? 'secondary' : 'primary'}
                scrollable={scenario === 'dogs'}
                testID={`md-tabs-${scenario}`}
            />
        </View>
    );
    const recordsFor = (key: string): readonly RecordItem[] => {
        const base =
            scenario === 'media'
                ? key === 'audio'
                    ? musicRecords.ambient
                    : key === 'video'
                      ? [{ id: 'video-1', title: 'Video', art: 'water' as const }]
                      : [
                            { id: 'photo-1', title: 'Photos', art: 'floral' as const },
                            { id: 'photo-2', title: 'Photos', art: 'mountain' as const },
                        ]
                : (musicRecords[key] ?? []);
        const expanded = Array.from({ length: 4 }, (_, copy) => base.map((item) => ({ ...item, id: `${item.id}-${copy}` }))).flat();
        const values = [
            ...expanded,
            ...attached
                .filter((item) => item === key)
                .map((_, index) => ({ id: `attachment-${index}`, title: 'Attached media', art: 'floral' as const })),
        ];
        return sort ? values.sort((a, b) => a.title.localeCompare(b.title)) : values;
    };
    const pager = (
        <TabsPager
            items={items}
            value={selected}
            onValueChange={setSelected}
            position={position}
            selectionRequest={selectionRequest}
            style={
                scenario === 'recipe'
                    ? { height: Math.max(280, window.height - insets.top - insets.bottom - 64), flex: undefined }
                    : undefined
            }
            testID={`md-tabs-${scenario}-pages`}
            renderPage={(item, isSelected) =>
                scenario === 'movies' ? (
                    <MoviePage item={item} selected={isSelected} offset={headerOffset} headerHeight={headerHeight} onOpen={setRecord} />
                ) : scenario === 'recipe' ? (
                    <ScrollView
                        nestedScrollEnabled
                        contentInsetAdjustmentBehavior="never"
                        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}
                        testID={`md-tabs-recipe-content-${item.key}`}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        {item.key === 'overview' ? (
                            <>
                                <Text variant="bodyLarge">Poke bowl combines diced fish, rice and fresh toppings.</Text>
                            </>
                        ) : item.key === 'ingredients' ? (
                            <>
                                <Text variant="titleLarge">Ingredients</Text>
                                {['Rice', 'Fish', 'Seaweed', 'Vegetables', 'Sesame dressing'].map((ingredient) => (
                                    <List.Item key={ingredient} title={ingredient} />
                                ))}
                            </>
                        ) : (
                            <>
                                <Text variant="titleLarge">Instructions</Text>
                                {[
                                    'Prepare the rice.',
                                    'Prepare the toppings.',
                                    'Arrange the ingredients in a bowl.',
                                    'Add the dressing and serve.',
                                ].map((step, index) => (
                                    <List.Item key={step} title={`${index + 1}. ${step}`} />
                                ))}
                            </>
                        )}
                    </ScrollView>
                ) : scenario === 'dogs' ? (
                    <ScrollView
                        nestedScrollEnabled
                        contentInsetAdjustmentBehavior="never"
                        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}
                        testID={`md-tabs-dogs-content-${item.key}`}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        {item.key === 'alaskan' ? (
                            <View style={{ aspectRatio: 365 / 158, borderRadius: 12, overflow: 'hidden' }}>
                                <TabsSourceArt name="alaskan" />
                            </View>
                        ) : null}
                        <Text variant="headlineSmall">{item.label}</Text>
                        {Array.from({ length: 12 }, (_, index) => (
                            <List.Item
                                key={index}
                                title={`${item.label} · ${index + 1}`}
                                description="Local example record"
                                leading={<Icon source="pets" size={24} />}
                                onPress={() => setRecord({ id: `${item.key}-${index}`, title: item.label })}
                            />
                        ))}
                    </ScrollView>
                ) : (
                    <Grid
                        records={recordsFor(item.key)}
                        onOpen={setRecord}
                        testID={`md-tabs-${scenario}-content-${item.key}`}
                        columns={scenario === 'media' && item.key === 'video' ? 1 : 3}
                    />
                )
            }
        />
    );
    return (
        <View
            style={{
                flex: 1,
                paddingTop: insets.top,
                paddingLeft: insets.left,
                paddingRight: insets.right,
                backgroundColor: theme.colors.surface,
            }}
            onAccessibilityEscape={onBack}
            testID={`md-tabs-use-${scenario}`}
        >
            {scenario === 'recipe' ? (
                <ScrollView
                    nestedScrollEnabled
                    contentInsetAdjustmentBehavior="never"
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    testID="md-tabs-recipe-scroll"
                >
                    {header}
                    {pager}
                </ScrollView>
            ) : (
                <>
                    {scenario === 'movies' ? null : header}
                    {pager}
                </>
            )}
            {scenario === 'movies' ? (
                <Animated.View
                    style={[{ position: 'absolute', top: insets.top, left: insets.left, right: insets.right, zIndex: 1 }, headerStyle]}
                    testID="md-tabs-movies-header"
                >
                    {header}
                </Animated.View>
            ) : null}
            <SearchView
                open={search}
                onOpenChange={(open) => {
                    searchOpen.current = open;
                    if (open) pendingSearchRecord.current = null;
                    setSearch(open);
                }}
                onClosed={() => {
                    const pending = pendingSearchRecord.current;
                    pendingSearchRecord.current = null;
                    if (pending && alive.current && !searchOpen.current) setRecord(pending);
                }}
                value={query}
                onChangeText={setQuery}
                onSearch={() => Keyboard.dismiss()}
                placeholder="Search music"
                results={allRecords
                    .filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()))
                    .map((item) => ({ key: item.id, title: item.title, description: item.size, icon: 'music_note' }))}
                onResultPress={(item) => {
                    if (!searchOpen.current) return;
                    pendingSearchRecord.current = allRecords.find((entry) => entry.id === item.key) ?? null;
                    searchOpen.current = false;
                    setSearch(false);
                }}
                renderTrigger={() => null}
                testID="md-tabs-music-search"
            />
            <NavigationDrawerModal
                open={drawer}
                onOpenChange={setDrawer}
                title="Music"
                items={tabsMusicItems.map((item) => ({ ...item, icon: 'music_note' }))}
                value={selected}
                onValueChange={setSelected}
                testID="md-tabs-music-drawer"
            />
            <DatePicker
                visible={calendar}
                value={date}
                onDismiss={() => setCalendar(false)}
                onChange={(value) => {
                    if (value instanceof Date) setDate(value);
                    setCalendar(false);
                }}
            />
            <Dialog visible={attach} onDismiss={() => setAttach(false)}>
                <Dialog.Title>Attach media</Dialog.Title>
                <Dialog.Content>
                    {tabsMediaItems.map((item) => (
                        <List.Item
                            key={item.key}
                            title={item.label}
                            leading={<Icon source={item.icon!} size={24} />}
                            onPress={() => {
                                setAttached((previous) => [...previous, item.key]);
                                setSelected(item.key);
                                setAttach(false);
                            }}
                            testID={`md-tabs-attach-${item.key}`}
                        />
                    ))}
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setAttach(false)}>
                        Cancel
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <FullScreenDialog
                visible={record !== null}
                title={record?.title ?? ''}
                onDismiss={() => setRecord(null)}
                testID="md-tabs-record-detail"
            >
                {record?.art ? (
                    <View
                        style={{
                            width: '100%',
                            aspectRatio: tabsReferenceArt[record.art].crop[2] / tabsReferenceArt[record.art].crop[3],
                            overflow: 'hidden',
                            borderRadius: 12,
                        }}
                    >
                        <TabsSourceArt name={record.art} />
                    </View>
                ) : null}
                <Text variant="titleLarge">{record?.title}</Text>
                {record?.size ? <Text variant="bodyLarge">{record.size}</Text> : null}
            </FullScreenDialog>
        </View>
    );
}
