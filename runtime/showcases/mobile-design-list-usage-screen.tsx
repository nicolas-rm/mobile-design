import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { ClipPath, Defs, Image as SvgImage, Path } from 'react-native-svg';
import {
    Card,
    Carousel,
    Checkbox,
    Divider,
    Icon,
    IconButton,
    List,
    Menu,
    NavigationDrawerModal,
    SearchView,
    Snackbar,
    SwipeListGroup,
    SwipeListItem,
    Text,
    TopAppBar,
    useMobileTheme,
    type SwipeListGroupHandle,
} from 'mobile-design/react-native-web';
import { MaterialSymbol } from '@mobile-design/icons/react-native-web';
import { ListPlayground } from './mobile-design-list-examples';
import {
    listAlbums,
    listMessages,
    listPodcasts,
    listProducts,
    listTasks,
    listTopics,
    listTracks,
    type ListUsageScenario,
} from './mobile-design-list-usage-data';
import { ListReorderExample } from './mobile-design-list-reorder-example';
import { sourceAvatarShapes } from './assets/lists/source-avatar-shapes';

type Routes = { ListMain: undefined; ListDetail: { kind: string; id: string } };
type Navigation = NativeStackNavigationProp<Routes>;
const Stack = createNativeStackNavigator<Routes>();
const art = {
    festival: require('./assets/lists/festival.png'),
    arts: require('./assets/lists/arts.png'),
    'family-friends': require('./assets/lists/family-friends.png'),
    pets: require('./assets/lists/pets.png'),
    strangers: require('./assets/lists/strangers.png'),
    '21st-century-strangers': require('./assets/lists/21st-century-strangers.png'),
    decorations: require('./assets/lists/decorations.png'),
    alejandro: require('./assets/lists/alejandro.png'),
    'alejandro-inbox': require('./assets/lists/alejandro-inbox.png'),
    sofia: require('./assets/lists/sofia.png'),
    ana: require('./assets/lists/ana.png'),
    pia: require('./assets/lists/pia.png'),
    cactus: require('./assets/lists/cactus.png'),
    succulent: require('./assets/lists/succulent.png'),
    breakdown: require('./assets/lists/breakdown.png'),
    ecuador: require('./assets/lists/ecuador.png'),
    'song-histories': require('./assets/lists/song-histories.png'),
} as const;
type Art = keyof typeof art;
const contacts = [
    { id: 'alejandro', name: 'Alejandro Ortega' },
    { id: 'sofia', name: 'Sofia Sacchi' },
    { id: 'ana', name: 'Ana Russo' },
] as const;
const recipes = [
    { id: 'bread', title: 'Fresh baked breads', image: require('./assets/buttons/sourdough.png') },
    { id: 'tacos', title: 'Tacos', image: require('./assets/lists/tacos.png') },
] as const;
const tasksChildren: Record<string, readonly { title: string; description: string }[]> = {
    supplies: [
        { title: 'Dry-erase board', description: '$35.99' },
        { title: 'Markers', description: '$8.99' },
    ],
};

/** Selection belongs to the row; this is its visual indicator, without a second target or focus stop. */
function ListSelectionMark({ selected }: { selected: boolean }) {
    return (
        <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
        >
            <Checkbox status={selected ? 'checked' : 'unchecked'} accessible={false} />
        </View>
    );
}

/** Native, interactive counterparts of the source media. The inventory records each adaptation. */
export function ListUsageContent({ scenario, onBack }: { scenario: ListUsageScenario; onBack: () => void }) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets(),
        { width } = useWindowDimensions();
    const [party, setParty] = useState(['invitations', 'karaoke']);
    const [colors, setColors] = useState(['periwinkle']);
    const [saved, setSaved] = useState<string[]>([]);
    const [read, setRead] = useState<string[]>([]);
    const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
    const [selecting, setSelecting] = useState(false);
    const [expanded, setExpanded] = useState<string[]>([]);
    const [albumId, setAlbumId] = useState<string>('festivals');
    const [archived, setArchived] = useState<string[]>([]);
    const [notice, setNotice] = useState('');
    const [menu, setMenu] = useState<string>();
    const [drawer, setDrawer] = useState(false);
    const [query, setQuery] = useState('');
    const [search, setSearch] = useState(false);
    const pendingSearch = useRef<(() => void) | null>(null);
    useEffect(
        () => () => {
            pendingSearch.current = null;
        },
        []
    );
    const swipes = useRef<SwipeListGroupHandle>(null);
    const wide = width - insets.left - insets.right >= 840;
    const surface = { flex: 1, backgroundColor: theme.colors.surface } as const;
    const safe = { ...surface, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right };
    const toggle = (setter: (updater: (previous: string[]) => string[]) => void, id: string) =>
        setter((previous) => (previous.includes(id) ? previous.filter((key) => key !== id) : [...previous, id]));
    const shareRecipe = (title: string) => {
        void Share.share({ title, message: title }).catch(() => setNotice('Unable to open sharing. Try again.'));
    };
    const picture = (name: string, size = 56, height = size, radius = 8) => (
        <Image source={art[name as Art]} accessible={false} style={{ width: size, height, borderRadius: radius }} resizeMode="cover" />
    );
    const avatar = (name: string) => picture(name, 40, 40, 20);
    const contactAvatar = (name: string, size = 40) => {
        if (name !== 'alejandro' && name !== 'sofia') return picture(name, size, size, size / 2);
        const clip = `md-list-avatar-${name}-${size}`;
        return (
            <Svg width={size} height={size} viewBox="0 0 80 80" accessible={false}>
                <Defs>
                    <ClipPath id={clip}>
                        <Path d={sourceAvatarShapes[name]} />
                    </ClipPath>
                </Defs>
                <SvgImage href={art[name]} width={80} height={80} clipPath={`url(#${clip})`} />
            </Svg>
        );
    };
    const open = (navigation: Navigation, kind: string, id: string) => {
        swipes.current?.closeAll();
        setMenu(undefined);
        if (kind === 'message') setRead((previous) => (previous.includes(id) ? previous : [...previous, id]));
        if (kind === 'album' && wide && scenario === 'photos-detail') setAlbumId(id);
        else navigation.navigate('ListDetail', { kind, id });
    };
    const albumDetail = (id: string) => {
        const album = listAlbums.find((item) => item.id === id)!;
        return (
            <View style={{ padding: 24, gap: 16, maxWidth: 760, alignSelf: 'center', width: '100%' }}>
                <Image source={art[album.art]} style={{ width: '100%', height: 'auto', aspectRatio: 1.67, borderRadius: 16 }} />
                <Text variant="headlineSmall">{album.title}</Text>
                <Text variant="bodyLarge">{album.description}</Text>
                <Text variant="labelMedium">
                    {album.count ? `${album.count} photos · ` : ''}
                    {album.date}
                </Text>
            </View>
        );
    };
    const detail = (navigation: Navigation, kind: string, id: string) => {
        const record =
            kind === 'album'
                ? listAlbums.find((item) => item.id === id)
                : kind === 'message'
                  ? listMessages.find((item) => item.id === id)
                  : kind === 'track'
                    ? listTracks.find((item) => item.id === id)
                    : kind === 'contact'
                      ? contacts.find((item) => item.id === id)
                      : kind === 'product'
                        ? listProducts.find((item) => item.id === id)
                        : kind === 'podcast'
                          ? listPodcasts.find((item) => item.id === id)
                          : kind === 'topic'
                            ? listTopics.find((item) => item.id === id)
                            : undefined;
        const title = kind === 'ticket' ? 'Pre-sale concert tickets' : record && ('title' in record ? record.title : record.name);
        const detailArtWidth = Math.min(280, Math.max(1, width - insets.left - insets.right - 48));
        return (
            <View style={surface} testID={`md-list-detail-${kind}-${id}`}>
                <TopAppBar title={title || id} navigationIcon="arrow_back" onNavigationPress={() => navigation.goBack()} />
                <ScrollView
                    contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    {kind === 'album' ? (
                        albumDetail(id)
                    ) : (
                        <View style={{ padding: 24, gap: 20 }}>
                            {kind === 'contact' ? (
                                <>
                                    {contactAvatar(id, 120)}
                                    <Text variant="headlineSmall">{title}</Text>
                                </>
                            ) : kind === 'message' ? (
                                <>
                                    <Text variant="headlineSmall">{title}</Text>
                                    <Text variant="bodyLarge">{listMessages.find((item) => item.id === id)?.description}</Text>
                                </>
                            ) : kind === 'track' ? (
                                <>
                                    {picture(id, 200)}
                                    <Text variant="headlineSmall">{title}</Text>
                                    <Text>{listTracks.find((item) => item.id === id)?.artist}</Text>
                                    <Text>{listTracks.find((item) => item.id === id)?.album}</Text>
                                </>
                            ) : kind === 'product' ? (
                                <>
                                    {picture(id, 200)}
                                    <Text variant="headlineSmall">{title}</Text>
                                    <Text variant="bodyLarge">{listProducts.find((item) => item.id === id)?.price}</Text>
                                </>
                            ) : kind === 'podcast' ? (
                                <>
                                    {picture(id, detailArtWidth, (detailArtWidth * 128) / 229)}
                                    <Text variant="headlineSmall">{title}</Text>
                                    <Text variant="bodyLarge">{listPodcasts.find((item) => item.id === id)?.description}</Text>
                                    <Text>{listPodcasts.find((item) => item.id === id)?.count}</Text>
                                </>
                            ) : kind === 'ticket' ? (
                                <>
                                    {picture('festival', detailArtWidth, (detailArtWidth * 362) / 604)}
                                    <Text variant="headlineSmall">Pre-sale concert tickets</Text>
                                    <Text variant="bodyLarge">Food, music, arts, community,…</Text>
                                    <Text variant="labelSmall">Nov 17</Text>
                                </>
                            ) : (
                                <Text variant="bodyLarge">{id}</Text>
                            )}
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    };
    const main = (navigation: Navigation) => {
        const photos = scenario.startsWith('photos-');
        const title = photos
            ? 'Photos'
            : (
                  {
                      party: 'Party planning',
                      colors: 'Color selection',
                      contacts: 'Contacts',
                      topics: 'Topics',
                      tickets: 'Concert tickets',
                      cart: 'Cart',
                      'music-actions': 'Favorites',
                      reorder: 'Favorites',
                      inbox: selecting ? `${selectedMessages.length} selected` : 'Inbox',
                      cities: 'Cities',
                      podcasts: 'Trending now',
                      timeline: 'Space',
                      tasks: 'My tasks',
                      recipes: 'Recipes',
                      mailbox: 'Inbox interactiva',
                  } as Record<string, string>
              )[scenario];
        const hasMenu = photos || ['contacts', 'topics', 'cart', 'music-actions', 'reorder', 'inbox', 'podcasts'].includes(scenario);
        const records = photos
            ? listAlbums
            : scenario === 'inbox'
              ? listMessages
              : scenario === 'contacts'
                ? contacts.map((item) => ({ ...item, title: item.name }))
                : scenario === 'cart'
                  ? listProducts
                  : scenario === 'podcasts'
                    ? listPodcasts
                    : scenario === 'topics'
                      ? listTopics
                      : listTracks;
        const searchKind = photos
            ? 'album'
            : scenario === 'inbox'
              ? 'message'
              : scenario === 'contacts'
                ? 'contact'
                : scenario === 'cart'
                  ? 'product'
                  : scenario === 'podcasts'
                    ? 'podcast'
                    : scenario === 'topics'
                      ? 'topic'
                      : 'track';
        const header = (
            <TopAppBar
                title={title}
                navigationIcon={hasMenu ? 'menu' : 'arrow_back'}
                onNavigationPress={hasMenu ? () => setDrawer(true) : onBack}
                navigationLabel={hasMenu ? 'Open navigation menu' : 'Back to Lists'}
                trailing={
                    hasMenu ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <SearchView
                                open={search}
                                onOpenChange={(next) => {
                                    if (next) pendingSearch.current = null;
                                    setSearch(next);
                                }}
                                value={query}
                                onChangeText={setQuery}
                                onSearch={setQuery}
                                placeholder={`Search ${title.toLowerCase()}`}
                                renderTrigger={({ open: reveal }) => (
                                    <IconButton icon="search" accessibilityLabel={`Search ${title}`} onPress={reveal} />
                                )}
                                results={records
                                    .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
                                    .map((item) => ({ key: item.id, title: item.title }))}
                                onResultPress={(result) => {
                                    pendingSearch.current = () => open(navigation, searchKind, result.key);
                                }}
                                onClosed={() => {
                                    const next = pendingSearch.current;
                                    pendingSearch.current = null;
                                    next?.();
                                }}
                                testID="md-list-context-search"
                            />
                            <Menu
                                visible={menu === 'header'}
                                onDismiss={() => setMenu(undefined)}
                                anchor={
                                    <IconButton
                                        icon="more_vert"
                                        accessibilityLabel="More options"
                                        onPress={() => setMenu('header')}
                                        testID="md-list-context-more"
                                    />
                                }
                            >
                                {scenario === 'inbox' ? (
                                    <Menu.Item
                                        title={selecting ? 'Cancel selection' : 'Select messages'}
                                        leadingIcon="checklist"
                                        onPress={() => {
                                            setSelecting(!selecting);
                                            setSelectedMessages([]);
                                            setMenu(undefined);
                                        }}
                                    />
                                ) : null}
                                <Menu.Item
                                    title="Back to Lists"
                                    leadingIcon="arrow_back"
                                    onPress={onBack}
                                    testID="md-list-context-return"
                                />
                            </Menu>
                        </View>
                    ) : undefined
                }
                testID="md-list-context-bar"
            />
        );
        const photoRow = (album: (typeof listAlbums)[number]) => (
            <List.Item
                key={album.id}
                title={album.title}
                description={scenario === 'photos-detail' || scenario === 'photos-carousel' ? undefined : album.description}
                descriptionNumberOfLines={wide && scenario === 'photos-images' ? 3 : 2}
                leading={picture(
                    album.art,
                    wide && scenario === 'photos-images' ? 112 : 56,
                    wide && scenario === 'photos-images' ? 84 : 56
                )}
                trailing={
                    <Text variant="labelSmall">
                        {scenario === 'photos-detail' || scenario === 'photos-carousel' ? album.count : album.date}
                    </Text>
                }
                onPress={() => open(navigation, 'album', album.id)}
                testID={`md-list-photo-${album.id}`}
            />
        );
        const photoRows = listAlbums.map(photoRow);
        let content;
        if (scenario === 'mailbox') content = <ListPlayground onEvent={(event) => setNotice(event)} />;
        else if (scenario === 'party')
            content = (
                <View style={{ padding: 16, gap: 16 }}>
                    <Text variant="labelLarge" style={{ paddingHorizontal: 16 }}>
                        My tasks
                    </Text>
                    <List.Group>
                        {[
                            ['invitations', 'Mail out invitations'],
                            ['dessert', 'Order a gluten free dessert for 12'],
                            ['karaoke', 'Karaoke venue reservation'],
                        ].map(([id, label]) => (
                            <List.Item
                                key={id}
                                title={label}
                                selected={party.includes(id)}
                                selectionMode="multiple"
                                titleNumberOfLines={2}
                                trailing={<ListSelectionMark selected={party.includes(id)} />}
                                onPress={() => toggle(setParty, id)}
                                testID={`md-list-party-${id}`}
                            />
                        ))}
                    </List.Group>
                </View>
            );
        else if (scenario === 'colors')
            content = (
                <List.Group>
                    {[
                        { id: 'periwinkle', label: 'Periwinkle', color: '#B69DF8' },
                        { id: 'mauve', label: 'Mauve', color: '#DFB7DA' },
                    ].map((item) => (
                        <List.Item
                            key={item.id}
                            title={item.label}
                            selectionMode="multiple"
                            selected={colors.includes(item.id)}
                            leading={<View style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: item.color }} />}
                            trailing={<ListSelectionMark selected={colors.includes(item.id)} />}
                            onPress={() => toggle(setColors, item.id)}
                            testID={`md-list-color-${item.id}`}
                        />
                    ))}
                </List.Group>
            );
        else if (scenario === 'contacts')
            content = (
                <List.Group variant="standard">
                    {contacts.map((item) => (
                        <List.Item
                            key={item.id}
                            title={item.name}
                            leading={contactAvatar(item.id)}
                            onPress={() => open(navigation, 'contact', item.id)}
                            testID={`md-list-contact-${item.id}`}
                        />
                    ))}
                </List.Group>
            );
        else if (scenario === 'topics')
            content = (
                <List.Group variant="standard">
                    {listTopics.map((topic) => (
                        <List.Item
                            key={topic.id}
                            title={topic.title}
                            leading={<Icon source={topic.icon} size={20} />}
                            trailing={<Icon source="arrow_right" size={20} />}
                            onPress={() => open(navigation, 'topic', topic.id)}
                            testID={`md-list-topic-${topic.id}`}
                        />
                    ))}
                </List.Group>
            );
        else if (scenario === 'tickets')
            content = (
                <List.Item
                    title="Pre-sale concert tickets…"
                    description="Food, music, arts, community,…"
                    leading={picture('festival')}
                    trailing={<Text variant="labelSmall">Nov 17</Text>}
                    onPress={() => open(navigation, 'ticket', 'concert')}
                    testID="md-list-concert-ticket"
                />
            );
        else if (scenario === 'cart')
            content = (
                <View style={{ gap: 8 }}>
                    <Text variant="bodyMedium" style={{ padding: 16 }}>
                        2 items in your cart
                    </Text>
                    <List.Item
                        title="Cactus"
                        description="In stock"
                        leading={picture('cactus')}
                        trailing={<Text variant="labelSmall">$9.50</Text>}
                        onPress={() => open(navigation, 'product', 'cactus')}
                        testID="md-list-cart-cactus"
                    />
                    <List.Item
                        title="Succulent"
                        leading={picture('succulent')}
                        trailing={<Text variant="labelSmall">$7.50</Text>}
                        onPress={() => open(navigation, 'product', 'succulent')}
                        testID="md-list-cart-succulent"
                    />
                </View>
            );
        else if (scenario === 'music-actions')
            content = (
                <List.Group>
                    {listTracks.map((track) => (
                        <List.Item
                            key={track.id}
                            title={track.title}
                            description={`${track.artist}\n${track.album}`}
                            lines={3}
                            leading={picture(track.art)}
                            multiAction
                            onPress={() => open(navigation, 'track', track.id)}
                            trailing={({ height, style, color }) => (
                                <View style={[style, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                                    <IconButton
                                        icon={({ size, color: ink }) => (
                                            <MaterialSymbol name="bookmark" size={size} color={ink} filled={saved.includes(track.id)} />
                                        )}
                                        mode="outlined"
                                        iconColor={color}
                                        selected={saved.includes(track.id)}
                                        style={{ height, minWidth: 48 }}
                                        contentStyle={{ height }}
                                        accessibilityLabel={`${saved.includes(track.id) ? 'Unsave' : 'Save'} ${track.title}`}
                                        onPress={() => toggle(setSaved, track.id)}
                                        testID={`md-list-track-save-${track.id}`}
                                    />
                                    <Menu
                                        visible={menu === track.id}
                                        onDismiss={() => setMenu(undefined)}
                                        anchor={
                                            <IconButton
                                                icon="more_horiz"
                                                iconColor={color}
                                                style={{ height, minWidth: 48 }}
                                                contentStyle={{ height }}
                                                accessibilityLabel={`More options for ${track.title}`}
                                                onPress={() => setMenu(track.id)}
                                                testID={`md-list-track-more-${track.id}`}
                                            />
                                        }
                                    >
                                        <Menu.Item
                                            title="View album"
                                            leadingIcon="album"
                                            onPress={() => open(navigation, 'track', track.id)}
                                        />
                                        <Menu.Item
                                            title={saved.includes(track.id) ? 'Remove from saved' : 'Save'}
                                            leadingIcon="bookmark"
                                            onPress={() => {
                                                toggle(setSaved, track.id);
                                                setMenu(undefined);
                                            }}
                                        />
                                    </Menu>
                                </View>
                            )}
                            testID={`md-list-track-${track.id}`}
                        />
                    ))}
                </List.Group>
            );
        else if (scenario === 'reorder') content = <ListReorderExample onEvent={setNotice} />;
        else if (scenario === 'inbox') {
            const rows = listMessages.map((message) => (
                <List.Item
                    key={message.id}
                    title={message.title}
                    description={message.description}
                    leading={avatar(message.art)}
                    content={
                        wide ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                                <Text variant="bodyLarge" style={{ width: 180 }} numberOfLines={1}>
                                    {message.id === 'tickets'
                                        ? 'Alejandro Ortega'
                                        : message.id === 'lunch'
                                          ? 'Pia, Marty (3)'
                                          : 'Ana Russo'}
                                </Text>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text variant="bodyLarge" numberOfLines={1}>
                                        {message.title}
                                    </Text>
                                    <Text variant="bodyMedium" numberOfLines={1}>
                                        {message.description}
                                    </Text>
                                </View>
                            </View>
                        ) : undefined
                    }
                    selected={selecting && selectedMessages.includes(message.id)}
                    selectionMode={selecting ? 'multiple' : undefined}
                    trailing={
                        selecting ? (
                            <ListSelectionMark selected={selectedMessages.includes(message.id)} />
                        ) : message.date ? (
                            <Text variant="labelSmall">{message.date}</Text>
                        ) : undefined
                    }
                    onPress={() => (selecting ? toggle(setSelectedMessages, message.id) : open(navigation, 'message', message.id))}
                    onLongPress={() => {
                        setSelecting(true);
                        setSelectedMessages((previous) => (previous.includes(message.id) ? previous : [...previous, message.id]));
                    }}
                    accessibilityLabel={`${message.title}. ${message.description}. ${read.includes(message.id) ? 'Read' : 'Unread'}`}
                    testID={`md-list-message-${message.id}`}
                />
            ));
            content = (
                <View style={{ padding: 16, gap: 12 }}>
                    <Text variant="titleMedium" style={{ padding: 8 }}>
                        Today
                    </Text>
                    <List.Group>{rows}</List.Group>
                </View>
            );
        } else if (scenario === 'cities')
            content = (
                <View style={{ paddingHorizontal: 16 }}>
                    {['Atlanta', 'Johannesburg', 'Mexico City', 'Milan', 'Winnipeg'].map((city, index) => (
                        <View key={city}>
                            {index ? <Divider /> : null}
                            <List.Item
                                variant="baseline"
                                title={city}
                                onPress={() => open(navigation, 'city', city)}
                                testID={`md-list-city-${index}`}
                            />
                        </View>
                    ))}
                </View>
            );
        else if (photos) {
            if (wide && scenario === 'photos-detail')
                content = (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{ width: 320 }}>
                            <List.Group variant="standard">{photoRows}</List.Group>
                        </View>
                        <View style={{ flex: 1 }}>{albumDetail(albumId)}</View>
                    </View>
                );
            else if (wide && scenario === 'photos-columns')
                content = (
                    <View style={{ flexDirection: 'row', padding: 16, gap: 16 }}>
                        <View style={{ flex: 1 }}>
                            <List.Group variant="standard">{photoRows.slice(0, 2)}</List.Group>
                        </View>
                        <View style={{ flex: 1 }}>
                            <List.Group variant="standard">{photoRows.slice(2)}</List.Group>
                        </View>
                    </View>
                );
            else if (wide && scenario === 'photos-cards')
                content = (
                    <ScrollView
                        horizontal
                        contentContainerStyle={{ padding: 16, gap: 8 }}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        {listAlbums.map((album) => (
                            <Card
                                key={album.id}
                                mode="contained"
                                style={{ width: (width - insets.left - insets.right - 48) / 3.25, borderRadius: 24 }}
                                onPress={() => open(navigation, 'album', album.id)}
                                testID={`md-list-photo-card-${album.id}`}
                            >
                                <Image
                                    source={art[album.art]}
                                    style={{ width: '100%', height: 'auto', aspectRatio: 0.75, borderRadius: 24 }}
                                />
                                <View
                                    pointerEvents="none"
                                    style={{
                                        position: 'absolute',
                                        start: 0,
                                        end: 0,
                                        bottom: 0,
                                        backgroundColor: '#00000066',
                                        padding: 16,
                                        borderBottomLeftRadius: 24,
                                        borderBottomRightRadius: 24,
                                    }}
                                >
                                    <Text variant="titleMedium" style={{ color: '#FFFFFF' }}>
                                        {album.id === 'family' ? 'La Familia' : album.title}
                                    </Text>
                                </View>
                            </Card>
                        ))}
                    </ScrollView>
                );
            else if (wide && scenario === 'photos-carousel')
                content = (
                    <Carousel
                        items={listAlbums.map((album) => ({
                            id: album.id,
                            title: album.title,
                            image: art[album.art],
                            description: album.description,
                        }))}
                        height={320}
                        variant="multi-browse"
                        onItemPress={(album) => open(navigation, 'album', album.id)}
                        showControls={false}
                        textPlacement="below"
                        testID="md-list-photo-carousel"
                    />
                );
            else content = <List.Group variant="standard">{photoRows}</List.Group>;
        } else if (scenario === 'podcasts')
            content = (
                <List.Group variant="standard">
                    {listPodcasts.map((podcast) => (
                        <List.Item
                            key={podcast.id}
                            title={podcast.title}
                            description={wide ? podcast.description : undefined}
                            leading={picture(podcast.id, 100, 56)}
                            trailing={<Text variant="labelSmall">{podcast.count}</Text>}
                            onPress={() => open(navigation, 'podcast', podcast.id)}
                            testID={`md-list-podcast-${podcast.id}`}
                        />
                    ))}
                </List.Group>
            );
        else if (scenario === 'timeline')
            content = (
                <List.Group>
                    {[
                        ['The first computer (ENIAC)', 'Feb 14, 1946', 'developer_board'],
                        ['Sputnik launched into space', 'Oct 4, 1957', 'satellite_alt'],
                        ['The Apollo 11 moon landing', 'Jul 20, 1969', 'rocket_launch'],
                    ].map(([label, date, icon]) => (
                        <List.Item
                            key={label}
                            title={label}
                            titleNumberOfLines={2}
                            leading={<Icon source={icon} size={20} />}
                            trailing={<Text variant="labelSmall">{date}</Text>}
                        />
                    ))}
                </List.Group>
            );
        else if (scenario === 'tasks')
            content = (
                <View style={{ padding: 16, gap: 2 }}>
                    {listTasks.map((task) =>
                        task.id === 'supplies' ? (
                            <List.Accordion
                                key={task.id}
                                title={task.title}
                                description={task.description}
                                leading={task.icon ? <Icon source={task.icon} size={20} /> : <View style={{ width: 20 }} />}
                                expanded={expanded.includes(task.id)}
                                onPress={() => toggle(setExpanded, task.id)}
                                testID={`md-list-task-${task.id}`}
                            >
                                <List.Group>
                                    {tasksChildren[task.id].map((child) => (
                                        <List.Item
                                            key={child.title}
                                            title={child.title}
                                            description={child.description}
                                            leading={<View style={{ width: 20 }} />}
                                            onPress={() => open(navigation, 'task', `${child.title} · ${child.description}`)}
                                        />
                                    ))}
                                </List.Group>
                            </List.Accordion>
                        ) : (
                            <List.Item
                                key={task.id}
                                title={task.title}
                                description={task.description}
                                leading={task.icon ? <Icon source={task.icon} size={20} /> : <View style={{ width: 20 }} />}
                                testID={`md-list-task-${task.id}`}
                            />
                        )
                    )}
                </View>
            );
        else
            content = (
                <SwipeListGroup ref={swipes}>
                    <View style={{ padding: 16, gap: 2 }}>
                        {recipes
                            .filter((recipe) => !archived.includes(recipe.id))
                            .map((recipe) => (
                                <SwipeListItem
                                    key={recipe.id}
                                    id={recipe.id}
                                    trailingSwipeMode="indirect"
                                    trailingActions={[
                                        {
                                            key: 'share',
                                            icon: 'share',
                                            label: `Share ${recipe.title}`,
                                            onPress: () => shareRecipe(recipe.title),
                                        },
                                        {
                                            key: 'archive',
                                            icon: 'archive',
                                            label: `Archive ${recipe.title}`,
                                            onPress: () => {
                                                setArchived((previous) => [...previous, recipe.id]);
                                                setNotice(`${recipe.title} archived`);
                                            },
                                        },
                                    ]}
                                    testID={`md-list-recipe-swipe-${recipe.id}`}
                                >
                                    <List.Item
                                        title={recipe.title}
                                        leading={<Image source={recipe.image} style={{ width: 56, height: 56, borderRadius: 8 }} />}
                                        multiAction
                                        onPress={() => open(navigation, 'recipe', recipe.title)}
                                        trailing={({ height, style, color }) => (
                                            <View style={style}>
                                                <Menu
                                                    visible={menu === recipe.id}
                                                    onDismiss={() => setMenu(undefined)}
                                                    anchor={
                                                        <IconButton
                                                            icon="more_vert"
                                                            iconColor={color}
                                                            style={{ height, minWidth: 48 }}
                                                            contentStyle={{ height }}
                                                            accessibilityLabel={`More options for ${recipe.title}`}
                                                            onPress={() => {
                                                                swipes.current?.closeAll();
                                                                setMenu(recipe.id);
                                                            }}
                                                            testID={`md-list-recipe-more-${recipe.id}`}
                                                        />
                                                    }
                                                >
                                                    <Menu.Item
                                                        title="Share"
                                                        leadingIcon="share"
                                                        onPress={() => {
                                                            setMenu(undefined);
                                                            shareRecipe(recipe.title);
                                                        }}
                                                    />
                                                    <Menu.Item
                                                        title="Archive"
                                                        leadingIcon="archive"
                                                        onPress={() => {
                                                            setArchived((previous) => [...previous, recipe.id]);
                                                            setMenu(undefined);
                                                            setNotice(`${recipe.title} archived`);
                                                        }}
                                                        testID={`md-list-recipe-archive-${recipe.id}`}
                                                    />
                                                </Menu>
                                            </View>
                                        )}
                                    />
                                </SwipeListItem>
                            ))}
                        {archived.length === recipes.length ? <Text style={{ padding: 24 }}>No recipes</Text> : null}
                    </View>
                </SwipeListGroup>
            );
        return (
            <View style={surface} onAccessibilityEscape={onBack} testID={`md-list-use-${scenario}`}>
                {header}
                {scenario === 'mailbox' ? (
                    content
                ) : (
                    <ScrollView
                        onScrollBeginDrag={() => swipes.current?.closeAll()}
                        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        {content}
                    </ScrollView>
                )}
                <NavigationDrawerModal
                    open={drawer}
                    onOpenChange={setDrawer}
                    title={title}
                    items={[
                        { key: 'current', label: title, icon: photos ? 'photo_library' : 'view_list' },
                        { key: 'lists', label: 'Lists', icon: 'arrow_back' },
                    ]}
                    value="current"
                    onValueChange={(key) => {
                        setDrawer(false);
                        if (key === 'lists') onBack();
                    }}
                    testID="md-list-context-drawer"
                />
            </View>
        );
    };
    return (
        <View style={safe}>
            <Stack.Navigator
                screenOptions={{ headerShown: false, contentStyle: surface, animation: theme.animation.scale === 0 ? 'none' : 'default' }}
            >
                <Stack.Screen name="ListMain">{({ navigation }) => main(navigation)}</Stack.Screen>
                <Stack.Screen name="ListDetail">
                    {({ navigation, route }) => detail(navigation, route.params.kind, route.params.id)}
                </Stack.Screen>
            </Stack.Navigator>
            <Snackbar
                visible={Boolean(notice)}
                onDismiss={() => setNotice('')}
                action={
                    scenario === 'recipes' && archived.length
                        ? {
                              label: 'Undo',
                              onPress: () => {
                                  setArchived((previous) => previous.slice(0, -1));
                                  setNotice('');
                              },
                          }
                        : undefined
                }
                testID="md-list-context-notice"
            >
                {notice}
            </Snackbar>
        </View>
    );
}
