import { useMemo, useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
    Avatar,
    Button,
    Dialog,
    Icon,
    IconButton,
    List,
    NavigationRailModal,
    SearchIconButton,
    SearchTrigger,
    SearchView,
    Text,
    TextField,
    TopAppBar,
    TouchableRipple,
    useAppBarScrollBehavior,
    useLocale,
    useMobileTheme,
    type SearchResult,
} from 'mobile-design/react-native';

export type AppBarSearchMode = 'product' | 'messages' | 'inbox' | 'photos';
type Props = { onBack: () => void; mode?: AppBarSearchMode };
type SearchRoutes = { SearchLibrary: undefined; SearchDetail: { key: string } };
const SearchStack = createNativeStackNavigator<SearchRoutes>();
type Entry = {
    key: string;
    title: string;
    subtitle: string;
    body: string;
    icon: string;
    category: string;
    initials?: string;
};

// The messages clip names these three recent queries. The remaining content is
// local demonstration data, so results and navigation work without a service.
const messageEntries: readonly Entry[] = [
    {
        key: 'dagmar',
        title: 'Dagmar',
        subtitle: 'Movie marathon',
        body: 'We have to watch these movies together. Which one should we start with this weekend?',
        icon: 'chat_bubble',
        category: 'Conversation',
        initials: 'D',
    },
    {
        key: 'peanut',
        title: 'Peanut',
        subtitle: 'Can you send me the photos?',
        body: 'Can you send me the photos from our hike? I saved a few favorites. Let’s plan another day outside soon.',
        icon: 'chat_bubble',
        category: 'Conversation',
        initials: 'P',
    },
    {
        key: 'school',
        title: 'End of school year',
        subtitle: 'Maya: See you all on Friday!',
        body: 'Maya: See you all on Friday!\n\nAlex: I’ll bring the snacks.\n\nJordan: I added the last photos to our album.',
        icon: 'group',
        category: 'Group conversation',
        initials: 'E',
    },
    {
        key: 'weekend',
        title: 'Weekend plans',
        subtitle: 'Sam: The trail looks great',
        body: 'Sam: The trail looks great. Meet at the park at nine?\n\nAlex: That works. I’ll bring water and the route.',
        icon: 'group',
        category: 'Group conversation',
        initials: 'W',
    },
    {
        key: 'jordan',
        title: 'Jordan',
        subtitle: 'Thanks for the recommendation',
        body: 'Thanks for the recommendation. I listened to the podcast on the way home. The episode about the city was my favorite.',
        icon: 'chat_bubble',
        category: 'Conversation',
        initials: 'J',
    },
    {
        key: 'maya',
        title: 'Maya',
        subtitle: 'The new exhibition opens tomorrow',
        body: 'The new exhibition opens tomorrow. Would you like to go after lunch? I saved the address and opening times.',
        icon: 'chat_bubble',
        category: 'Conversation',
        initials: 'M',
    },
    {
        key: 'garden',
        title: 'Community garden',
        subtitle: 'Lee: The first tomatoes are ready',
        body: 'Lee: The first tomatoes are ready. We are meeting on Saturday morning to share the harvest. Everyone is welcome.',
        icon: 'group',
        category: 'Group conversation',
        initials: 'C',
    },
    {
        key: 'rene',
        title: 'René',
        subtitle: 'A new place for lunch',
        body: 'I found a new place for lunch near the park. Shall we try it this week?',
        icon: 'chat_bubble',
        category: 'Conversation',
        initials: 'R',
    },
    {
        key: 'sam',
        title: 'Sam',
        subtitle: 'Here is the book we talked about',
        body: 'Here is the book we talked about. I can bring my copy next week. The chapter on architecture is a good place to start.',
        icon: 'chat_bubble',
        category: 'Conversation',
        initials: 'S',
    },
    {
        key: 'family',
        title: 'Family',
        subtitle: 'Dinner at seven?',
        body: 'Dinner at seven?\n\nAlex: I’ll be there. I’ll bring dessert and the photos from the weekend.',
        icon: 'group',
        category: 'Group conversation',
        initials: 'F',
    },
];
const inboxEntries: readonly Entry[] = [
    {
        key: 'trip',
        title: 'Your next adventure',
        subtitle: 'Trail Journal · Your weekend reading is here',
        body: 'Your weekend reading is here. Discover quiet paths, thoughtful conversations, and places worth visiting. Save an idea for your next day outside.',
        icon: 'mail',
        category: 'Primary',
        initials: 'T',
    },
    {
        key: 'table',
        title: 'A table for four',
        subtitle: 'Morgan · Saturday at 7:00 PM',
        body: 'Our table is booked for Saturday at seven. The restaurant is a short walk from the station. Looking forward to seeing everyone.',
        icon: 'mail',
        category: 'Primary',
        initials: 'M',
    },
    {
        key: 'photos',
        title: 'Photos from the weekend',
        subtitle: 'Peanut · A few favorites from the hike',
        body: 'Here are a few favorites from our hike. The light at the lake was beautiful. I added the photos to the shared album.',
        icon: 'mail',
        category: 'Primary',
        initials: 'P',
    },
    {
        key: 'museum',
        title: 'A new exhibition',
        subtitle: 'City Museum · Architecture and everyday life',
        body: 'Architecture and everyday life opens this week. Explore how small design choices shape the spaces we share.',
        icon: 'mail',
        category: 'Updates',
        initials: 'C',
    },
    {
        key: 'school',
        title: 'End of school year',
        subtitle: 'Maya · Friday’s celebration',
        body: 'Join us on Friday for a celebration of the school year. We’ll meet in the garden and share a few stories from the last months.',
        icon: 'mail',
        category: 'Primary',
        initials: 'M',
    },
    {
        key: 'library',
        title: 'Ready to collect',
        subtitle: 'Library · Your book is ready',
        body: 'The book you reserved is ready to collect. Please bring your library card when you visit.',
        icon: 'mail',
        category: 'Updates',
        initials: 'L',
    },
    {
        key: 'garden',
        title: 'This month in the garden',
        subtitle: 'Lee · Our first harvest',
        body: 'Our first harvest is ready. Come by on Saturday morning to share tomatoes, herbs, and ideas for the next season.',
        icon: 'mail',
        category: 'Updates',
        initials: 'L',
    },
    {
        key: 'notes',
        title: 'Notes from our meeting',
        subtitle: 'Jordan · A few ideas to explore',
        body: 'I wrote down the ideas from our meeting. Let’s start with the small improvements and check in again next week.',
        icon: 'mail',
        category: 'Primary',
        initials: 'J',
    },
];
const photoEntries: readonly Entry[] = [
    {
        key: 'mountains',
        title: 'Mountains',
        subtitle: 'October 26 · Morning walk',
        body: 'A quiet morning on the mountain trail.',
        icon: 'landscape',
        category: 'Places',
    },
    {
        key: 'lake',
        title: 'Lake',
        subtitle: 'October 25 · Weekend away',
        body: 'The last light reflected on the lake.',
        icon: 'water',
        category: 'Places',
    },
    {
        key: 'garden',
        title: 'Garden',
        subtitle: 'October 23 · Close to home',
        body: 'New shapes and colors in the community garden.',
        icon: 'local_florist',
        category: 'Nature',
    },
    {
        key: 'coast',
        title: 'Coast',
        subtitle: 'October 21 · By the sea',
        body: 'A long walk beside the water.',
        icon: 'beach_access',
        category: 'Places',
    },
    {
        key: 'city',
        title: 'City',
        subtitle: 'October 18 · An afternoon outside',
        body: 'An afternoon looking at familiar buildings in a different way.',
        icon: 'location_city',
        category: 'Places',
    },
    {
        key: 'forest',
        title: 'Forest',
        subtitle: 'October 17 · On the trail',
        body: 'The path through the forest after a little rain.',
        icon: 'forest',
        category: 'Nature',
    },
    {
        key: 'sunrise',
        title: 'Sunrise',
        subtitle: 'October 15 · Early start',
        body: 'The first warm light of the day.',
        icon: 'wb_sunny',
        category: 'Nature',
    },
    {
        key: 'architecture',
        title: 'Architecture',
        subtitle: 'October 12 · Museum visit',
        body: 'A favorite detail from a visit to the museum.',
        icon: 'museum',
        category: 'Places',
    },
    {
        key: 'river',
        title: 'River',
        subtitle: 'October 10 · Afternoon walk',
        body: 'Following the river through the park.',
        icon: 'water',
        category: 'Nature',
    },
    {
        key: 'desert',
        title: 'Desert',
        subtitle: 'October 8 · Open spaces',
        body: 'Open skies and the line of the distant hills.',
        icon: 'landscape',
        category: 'Places',
    },
    {
        key: 'park',
        title: 'Park',
        subtitle: 'October 6 · A little break',
        body: 'Taking a little break among the trees.',
        icon: 'park',
        category: 'Nature',
    },
    {
        key: 'flowers',
        title: 'Flowers',
        subtitle: 'October 4 · Small details',
        body: 'Stopping to notice the small details.',
        icon: 'local_florist',
        category: 'Nature',
    },
];
const productEntries: readonly Entry[] = [
    {
        key: 'notebook',
        title: 'Notebook',
        subtitle: 'Ideas, sketches, and everyday notes',
        body: 'A place for ideas, sketches, and everyday notes. Save a thought before it slips away, or take a little time to draw something new.',
        icon: 'book',
        category: 'Everyday',
    },
    {
        key: 'headphones',
        title: 'Headphones',
        subtitle: 'A little time for your favorite sounds',
        body: 'A little time for your favorite sounds. Save this item to your collection or return to the catalog to compare other ideas.',
        icon: 'headphones',
        category: 'Audio',
    },
    {
        key: 'camera',
        title: 'Camera',
        subtitle: 'See familiar places in a new way',
        body: 'See familiar places in a new way. Look for small details and save a favorite moment from the day.',
        icon: 'photo_camera',
        category: 'Photography',
    },
    {
        key: 'bag',
        title: 'Day bag',
        subtitle: 'Ready for a short adventure',
        body: 'Ready for a short adventure. Keep the things you need close by and save a few new places to explore.',
        icon: 'backpack',
        category: 'Everyday',
    },
    {
        key: 'speaker',
        title: 'Speaker',
        subtitle: 'Make room for a favorite playlist',
        body: 'Make room for a favorite playlist. Bring a few favorite sounds into a quiet afternoon.',
        icon: 'speaker',
        category: 'Audio',
    },
    {
        key: 'bottle',
        title: 'Water bottle',
        subtitle: 'Take a break along the way',
        body: 'Take a break along the way. A simple everyday companion for a walk around the city or a day on the trail.',
        icon: 'water_bottle',
        category: 'Everyday',
    },
];

function normalized(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase()
        .trim();
}

/** Original native illustrations: no remote thumbnails or network dependency. */
function LocalArtwork({ index, icon, large = false }: { index: number; icon: string; large?: boolean }) {
    const theme = useMobileTheme();
    const fills = [theme.colors.primaryContainer, theme.colors.secondaryContainer, theme.colors.tertiaryContainer];
    const inks = [theme.colors.onPrimaryContainer, theme.colors.onSecondaryContainer, theme.colors.onTertiaryContainer];
    const tone = index % fills.length;
    return (
        <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
                flex: 1,
                minHeight: large ? 240 : 120,
                overflow: 'hidden',
                backgroundColor: fills[tone],
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Svg
                width="100%"
                height="100%"
                viewBox="0 0 320 240"
                preserveAspectRatio="xMidYMid slice"
                style={{ position: 'absolute', inset: 0 }}
            >
                <Circle cx={240 - ((index * 5) % 80)} cy={60 + ((index * 3) % 40)} r={48} fill={inks[tone]} opacity={0.12} />
                <Path d="M-20 240 L100 72 L210 240 Z" fill={inks[tone]} opacity={0.12} />
                <Path d="M110 240 L235 105 L350 240 Z" fill={inks[tone]} opacity={0.18} />
                <Rect x="0" y="210" width="320" height="30" fill={inks[tone]} opacity={0.08} />
            </Svg>
            <Icon source={icon} size={large ? 64 : 40} color={inks[tone]} />
        </View>
    );
}

function AccountTarget({ label, onPress, testID }: { label: string; onPress: () => void; testID: string }) {
    const theme = useMobileTheme();
    return (
        <Avatar.Button accessibilityLabel="Open account" onPress={onPress} testID={testID}>
            <Avatar.Text
                label={label}
                size={32}
                color={typeof theme.colors.onPrimaryContainer === 'string' ? theme.colors.onPrimaryContainer : undefined}
                style={{ backgroundColor: theme.colors.primaryContainer }}
            />
        </Avatar.Button>
    );
}

function SearchEntry({
    open,
    expanded,
    disabled,
    value,
    placeholder,
    leadingSearch = false,
    onVoice,
    onEscape,
    testID,
}: {
    open: () => void;
    expanded: boolean;
    disabled: boolean;
    value: string;
    placeholder: string;
    leadingSearch?: boolean;
    onVoice?: () => void;
    onEscape?: () => void;
    testID: string;
}) {
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    return (
        <View style={{ height: 56, borderRadius: 28, overflow: 'hidden' }}>
            <SearchTrigger
                accessibilityRole="button"
                accessibilityLabel={value ? `${placeholder}: ${value}` : placeholder}
                accessibilityHint="Open search view"
                accessibilityState={{ expanded, disabled }}
                onAccessibilityEscape={onEscape}
                disabled={disabled}
                onPress={open}
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
                    {leadingSearch ? (
                        <View style={{ width: 48, alignItems: 'center' }}>
                            <Icon source="search" size={24} color={theme.colors.onSurfaceVariant} />
                        </View>
                    ) : null}
                    <Text
                        variant="bodyLarge"
                        numberOfLines={1}
                        style={{
                            flex: 1,
                            minWidth: 0,
                            paddingHorizontal: 16,
                            color: theme.colors.onSurfaceVariant,
                            textAlign: rtl ? 'right' : 'left',
                        }}
                    >
                        {value || placeholder}
                    </Text>
                    {onVoice ? <View style={{ width: 52 }} /> : null}
                </View>
            </SearchTrigger>
            {onVoice ? (
                <View
                    style={{
                        position: 'absolute',
                        top: 4,
                        [rtl ? 'left' : 'right']: 4,
                        width: 48,
                        height: 48,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <SearchIconButton icon="mic" accessibilityLabel="Search by voice" onPress={onVoice} testID={`${testID}-voice`} />
                </View>
            ) : null}
        </View>
    );
}

function DetailScreen({
    entry,
    mode,
    saved,
    onToggleSaved,
    onBack,
    onArchive,
}: {
    entry: Entry;
    mode: AppBarSearchMode;
    saved: boolean;
    onToggleSaved: () => void;
    onBack: () => void;
    onArchive: () => void;
}) {
    const theme = useMobileTheme();
    const insets = useSafeAreaInsets();
    const [reply, setReply] = useState('');
    const [sent, setSent] = useState<string[]>([]);
    const messages = mode === 'messages';
    const inbox = mode === 'inbox';
    const rtl = useLocale().direction === 'rtl';
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID={`md-appbar-${mode}-detail`}>
            <TopAppBar
                title={messages ? entry.title : mode === 'photos' ? entry.title : ''}
                navigationIcon={rtl ? 'arrow_forward' : 'arrow_back'}
                navigationLabel="Back to results"
                onNavigationPress={onBack}
                actions={[
                    {
                        key: 'saved',
                        icon: saved
                            ? mode === 'photos'
                                ? 'favorite_fill1'
                                : 'bookmark_fill1'
                            : mode === 'photos'
                              ? 'favorite'
                              : 'bookmark-outline',
                        label: saved ? 'Remove from saved' : 'Save',
                        onPress: onToggleSaved,
                    },
                    ...(inbox ? [{ key: 'archive', icon: 'archive', label: 'Archive message', onPress: onArchive }] : []),
                ]}
                testID={`md-appbar-${mode}-detail-bar`}
            />
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={{ paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: insets.bottom + 24, gap: 24 }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                {!messages ? (
                    <View style={{ minHeight: mode === 'photos' ? 360 : 240 }}>
                        <LocalArtwork index={entry.key.length} icon={entry.icon} large />
                    </View>
                ) : null}
                <View style={{ paddingHorizontal: 24, gap: 16 }}>
                    {!messages ? (
                        <>
                            <Text variant="headlineMedium" accessibilityRole="header">
                                {entry.title}
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                {entry.subtitle}
                            </Text>
                        </>
                    ) : null}
                    <View
                        style={
                            messages
                                ? {
                                      maxWidth: '90%',
                                      alignSelf: 'flex-start',
                                      borderRadius: 20,
                                      borderBottomStartRadius: 4,
                                      padding: 16,
                                      backgroundColor: theme.colors.surfaceContainerHigh,
                                  }
                                : undefined
                        }
                    >
                        <Text variant="bodyLarge">{entry.body}</Text>
                    </View>
                    {sent.map((text, index) => (
                        <View
                            key={index}
                            style={{
                                maxWidth: '90%',
                                alignSelf: 'flex-end',
                                borderRadius: 20,
                                borderBottomEndRadius: 4,
                                padding: 16,
                                backgroundColor: theme.colors.primaryContainer,
                            }}
                        >
                            <Text variant="bodyLarge" style={{ color: theme.colors.onPrimaryContainer }}>
                                {text}
                            </Text>
                        </View>
                    ))}
                    {messages || inbox ? (
                        <View style={{ gap: 12, paddingTop: 8 }}>
                            <TextField
                                value={reply}
                                onChangeText={setReply}
                                variant="outlined"
                                label={inbox ? 'Reply' : 'Message'}
                                multiline
                                testID={`md-appbar-${mode}-reply`}
                            />
                            <Button
                                variant="filled"
                                icon="send"
                                style={{ alignSelf: 'flex-start' }}
                                disabled={!reply.trim()}
                                onPress={() => {
                                    const text = reply.trim();
                                    if (!text) return;
                                    setSent((previous) => [...previous, text]);
                                    setReply('');
                                }}
                                testID={`md-appbar-${mode}-send`}
                            >
                                Send
                            </Button>
                        </View>
                    ) : null}
                </View>
            </ScrollView>
        </View>
    );
}

/**
 * App bars Guidelines: selecting the bar opens SearchView from that exact
 * measured 56dp entry point. Messages reproduces the recent-query clip;
 * product/inbox/photos turn the documented compositions into working screens.
 * https://m3.material.io/components/app-bars/guidelines
 */
export function AppBarSearchScreen({ onBack, mode = 'product' }: Props) {
    const theme = useMobileTheme();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const rtl = useLocale().direction === 'rtl';
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [pendingDetail, setPendingDetail] = useState<Entry | null>(null);
    const [railOpen, setRailOpen] = useState(false);
    const [destination, setDestination] = useState('all');
    const [accountOpen, setAccountOpen] = useState(false);
    const [account, setAccount] = useState('Personal');
    const [voiceOpen, setVoiceOpen] = useState(false);
    const [assistantOpen, setAssistantOpen] = useState(false);
    const [savedKeys, setSavedKeys] = useState<string[]>(mode === 'messages' ? ['dagmar'] : []);
    const [archivedKeys, setArchivedKeys] = useState<string[]>([]);
    const [readKeys, setReadKeys] = useState<string[]>([]);
    const [gridWidth, setGridWidth] = useState(0);
    const stackNavigation = useRef<NativeStackNavigationProp<SearchRoutes, 'SearchLibrary'> | null>(null);
    const scroll = useAppBarScrollBehavior({ behavior: 'pinned' });
    const entries =
        mode === 'messages' ? messageEntries : mode === 'inbox' ? inboxEntries : mode === 'photos' ? photoEntries : productEntries;
    const placeholder =
        mode === 'messages'
            ? 'Search messages'
            : mode === 'inbox'
              ? 'Search inbox'
              : mode === 'photos'
                ? 'Search Photos'
                : 'Search product';
    const title = mode === 'messages' ? 'Messages' : mode === 'inbox' ? 'Inbox' : mode === 'photos' ? 'Photos' : 'Discover';
    const toggleSaved = (key: string) =>
        setSavedKeys((previous) => (previous.includes(key) ? previous.filter((value) => value !== key) : [...previous, key]));
    const available = entries
        .filter((entry) => (destination === 'archive' ? archivedKeys.includes(entry.key) : !archivedKeys.includes(entry.key)))
        .filter((entry) =>
            destination === 'saved'
                ? savedKeys.includes(entry.key)
                : destination === 'nature' || destination === 'places'
                  ? entry.category.toLowerCase() === destination
                  : true
        );
    const needle = normalized(query);
    const matching = useMemo(
        () =>
            entries.filter(
                (entry) =>
                    !archivedKeys.includes(entry.key) &&
                    (!needle || normalized(`${entry.title} ${entry.subtitle} ${entry.body} ${entry.category}`).includes(needle))
            ),
        [archivedKeys, entries, needle]
    );
    const recent =
        mode === 'messages'
            ? ['Peanut', 'End of school year', 'René']
            : mode === 'inbox'
              ? ['Photos', 'End of school year', 'Garden']
              : mode === 'photos'
                ? ['Mountains', 'Garden', 'Coast']
                : ['Headphones', 'Notebook', 'Camera'];
    const results: SearchResult[] = matching.map((entry) => ({
        key: entry.key,
        title: entry.title,
        description: entry.subtitle,
        icon: entry.icon,
    }));
    const openEntry = (entry: Entry) => {
        setReadKeys((previous) => (previous.includes(entry.key) ? previous : [...previous, entry.key]));
        stackNavigation.current?.navigate('SearchDetail', { key: entry.key });
    };
    const finishSearch = () => {
        if (pendingDetail) {
            openEntry(pendingDetail);
            setPendingDetail(null);
        }
    };
    const voice = () => {
        setPendingDetail(null);
        setVoiceOpen(true);
        setSearchOpen(true);
    };
    const field = (
        <SearchView
            open={searchOpen}
            onOpenChange={(open) => {
                if (open) setPendingDetail(null);
                else setVoiceOpen(false);
                setSearchOpen(open);
            }}
            onClosed={finishSearch}
            value={query}
            onChangeText={(value) => {
                setQuery(value);
                setSubmittedQuery('');
            }}
            onSearch={(value) => {
                setSubmittedQuery(value.trim());
                setVoiceOpen(false);
            }}
            placeholder={placeholder}
            results={results}
            onResultPress={(result) => {
                const entry = entries.find((item) => item.key === result.key);
                if (entry) setPendingDetail(entry);
            }}
            renderTrigger={({ open, disabled, expanded }) => (
                <SearchEntry
                    open={open}
                    disabled={disabled}
                    expanded={expanded}
                    value={query}
                    leadingSearch={mode === 'messages'}
                    placeholder={mode === 'messages' ? 'Search in messages' : placeholder}
                    onVoice={mode === 'photos' || mode === 'messages' ? voice : undefined}
                    onEscape={mode === 'messages' ? onBack : undefined}
                    testID={`md-appbar-${mode}-search`}
                />
            )}
            supportingContent={
                mode === 'messages' && !needle && !voiceOpen ? (
                    <View />
                ) : (
                    <Text
                        variant="labelLarge"
                        accessibilityRole="header"
                        accessibilityLiveRegion="polite"
                        style={{ paddingHorizontal: 24, paddingVertical: 12, color: theme.colors.onSurfaceVariant }}
                    >
                        {voiceOpen && !needle
                            ? 'Use keyboard dictation to enter a search'
                            : needle
                              ? `${matching.length} results${submittedQuery ? ` for “${submittedQuery}”` : ''}`
                              : 'Recent searches'}
                    </Text>
                )
            }
            renderResults={
                !needle
                    ? () => (
                          <View>
                              {recent.map((term) => (
                                  <List.Item
                                      key={term}
                                      title={term}
                                      variant="baseline"
                                      leading={<Icon source="history" size={24} color={theme.colors.onSurfaceVariant} />}
                                      trailing={
                                          mode === 'messages' ? undefined : (
                                              <Icon source="north_west" size={24} color={theme.colors.onSurfaceVariant} />
                                          )
                                      }
                                      onPress={() => setQuery(term)}
                                      testID={`md-appbar-${mode}-recent-${normalized(term).replace(/\s/g, '-')}`}
                                  />
                              ))}
                          </View>
                      )
                    : undefined
            }
            emptyContent={
                <View style={{ gap: 8 }}>
                    <Text variant="titleMedium">No results for “{query}”</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Try another name or keyword.
                    </Text>
                </View>
            }
            presentation="full-screen"
            variant={mode === 'messages' ? 'divided' : 'contained'}
            testID={`md-appbar-${mode}-search`}
        />
    );
    // Measure the canvas inside its safe-area and 16dp grid margins. This also
    // handles a nested pane that is narrower than the application window.
    const usableGridWidth = gridWidth || Math.max(1, window.width - insets.left - insets.right - 32);
    const columns = usableGridWidth + 32 >= 840 ? 4 : usableGridWidth + 32 >= 600 ? 3 : 2;
    const itemWidth = Math.max(1, (usableGridWidth - (columns - 1) * 8) / columns);
    const header =
        destination === 'saved'
            ? 'Saved'
            : destination === 'archive'
              ? 'Archive'
              : destination === 'nature'
                ? 'Nature'
                : destination === 'places'
                  ? 'Places'
                  : title;
    const leading = mode === 'photos' ? undefined : 'menu';
    return (
        <SearchStack.Navigator
            screenOptions={{
                headerShown: false,
                animation: theme.animation.scale === 0 ? 'none' : 'default',
                gestureEnabled: true,
                contentStyle: { backgroundColor: theme.colors.surface },
            }}
        >
            <SearchStack.Screen
                name="SearchLibrary"
                listeners={({ navigation }) => ({
                    focus: () => {
                        stackNavigation.current = navigation;
                    },
                })}
            >
                {() => (
                    <View
                        onAccessibilityEscape={onBack}
                        style={{ flex: 1, backgroundColor: theme.colors.surface }}
                        testID={`md-appbar-${mode}-screen`}
                    >
                        {mode === 'messages' ? (
                            <View
                                style={{
                                    paddingTop: insets.top + 32,
                                    paddingLeft: insets.left + 24,
                                    paddingRight: insets.right + 24,
                                    paddingBottom: 24,
                                }}
                            >
                                <View style={{ backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: 28 }}>{field}</View>
                            </View>
                        ) : (
                            <TopAppBar
                                title={title}
                                search={field}
                                navigationIcon={leading ?? (rtl ? 'arrow_forward' : 'arrow_back')}
                                navigationLabel={leading ? 'Open navigation' : 'Back to App bars'}
                                onNavigationPress={leading ? () => setRailOpen(true) : onBack}
                                scrollBehavior={scroll}
                                trailing={
                                    <AccountTarget
                                        label={account === 'Personal' ? 'A' : 'M'}
                                        onPress={() => setAccountOpen(true)}
                                        testID={`md-appbar-${mode}-account`}
                                    />
                                }
                                actions={
                                    mode === 'photos'
                                        ? [
                                              {
                                                  key: 'assistant',
                                                  icon: 'auto_awesome',
                                                  label: 'Search photo collections',
                                                  onPress: () => setAssistantOpen(true),
                                              },
                                          ]
                                        : undefined
                                }
                                testID={`md-appbar-${mode}-bar`}
                            />
                        )}
                        <Animated.ScrollView
                            onScroll={scroll.onScroll}
                            scrollEventThrottle={16}
                            keyboardShouldPersistTaps="handled"
                            contentInsetAdjustmentBehavior="never"
                            contentContainerStyle={{
                                paddingLeft: insets.left,
                                paddingRight: insets.right,
                                paddingBottom: insets.bottom + 24,
                            }}
                            testID={`md-appbar-${mode}-content`}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                        >
                            {mode !== 'messages' ? (
                                <Text
                                    variant="headlineSmall"
                                    accessibilityRole="header"
                                    style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}
                                >
                                    {header}
                                </Text>
                            ) : null}
                            {mode === 'photos' || mode === 'product' ? (
                                <View style={{ paddingHorizontal: 16 }}>
                                    <View
                                        onLayout={(event) => {
                                            const width = event.nativeEvent.layout.width;
                                            setGridWidth((previous) => (previous === width ? previous : width));
                                        }}
                                        style={{ flexDirection: rtl ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}
                                        testID={`md-appbar-${mode}-grid`}
                                    >
                                        {available.map((entry, index) => (
                                            <TouchableRipple
                                                key={entry.key}
                                                accessibilityRole="button"
                                                accessibilityLabel={`${entry.title}. ${entry.subtitle}`}
                                                onPress={() => openEntry(entry)}
                                                borderless={false}
                                                style={{
                                                    width: itemWidth,
                                                    flexGrow: 0,
                                                    borderRadius: mode === 'photos' ? 4 : 16,
                                                    overflow: 'hidden',
                                                }}
                                                testID={`md-appbar-${mode}-item-${entry.key}`}
                                            >
                                                <View pointerEvents="none" style={{ gap: 8, paddingBottom: 12 }}>
                                                    <View style={{ height: mode === 'photos' ? 164 : 148 }}>
                                                        <LocalArtwork index={index} icon={entry.icon} />
                                                    </View>
                                                    <View style={{ paddingHorizontal: 8, gap: 4 }}>
                                                        <Text variant="titleSmall" numberOfLines={1}>
                                                            {entry.title}
                                                        </Text>
                                                        <Text
                                                            variant="bodySmall"
                                                            numberOfLines={2}
                                                            style={{ color: theme.colors.onSurfaceVariant }}
                                                        >
                                                            {entry.subtitle}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </TouchableRipple>
                                        ))}
                                    </View>
                                </View>
                            ) : (
                                <View>
                                    {available.map((entry) => (
                                        <List.Item
                                            key={entry.key}
                                            title={entry.title}
                                            description={entry.subtitle}
                                            lines={mode === 'messages' ? 3 : 2}
                                            variant="baseline"
                                            multiAction={mode === 'messages'}
                                            accessibilityLabel={`${entry.title}. ${entry.subtitle}`}
                                            leading={
                                                <Avatar.Text
                                                    label={entry.initials ?? entry.title.charAt(0)}
                                                    size={mode === 'messages' ? 48 : 40}
                                                />
                                            }
                                            content={
                                                mode === 'messages' ? (
                                                    <View style={{ gap: 2 }}>
                                                        <Text variant="titleMedium" numberOfLines={1}>
                                                            {entry.title}
                                                            {entry.key === 'dagmar' ? '  5' : ''}
                                                        </Text>
                                                        <Text variant="titleSmall" numberOfLines={1}>
                                                            {entry.subtitle}
                                                        </Text>
                                                        <Text
                                                            variant="bodyMedium"
                                                            numberOfLines={1}
                                                            style={{ color: theme.colors.onSurfaceVariant }}
                                                        >
                                                            {entry.body}
                                                        </Text>
                                                    </View>
                                                ) : undefined
                                            }
                                            trailing={
                                                <View style={{ alignItems: 'flex-end', gap: mode === 'messages' ? 0 : 8 }}>
                                                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                        {entry.key === 'dagmar' ? 'Now' : '10:30'}
                                                    </Text>
                                                    {mode === 'messages' ? (
                                                        <IconButton
                                                            icon={savedKeys.includes(entry.key) ? 'star_fill1' : 'star-outline'}
                                                            selected={savedKeys.includes(entry.key)}
                                                            accessibilityLabel={
                                                                savedKeys.includes(entry.key)
                                                                    ? `Unstar ${entry.title}`
                                                                    : `Star ${entry.title}`
                                                            }
                                                            onPress={() => toggleSaved(entry.key)}
                                                            testID={`md-appbar-messages-star-${entry.key}`}
                                                        />
                                                    ) : !readKeys.includes(entry.key) ? (
                                                        <View
                                                            style={{
                                                                width: 8,
                                                                height: 8,
                                                                borderRadius: 4,
                                                                backgroundColor: theme.colors.primary,
                                                            }}
                                                        />
                                                    ) : null}
                                                </View>
                                            }
                                            onPress={() => openEntry(entry)}
                                            testID={`md-appbar-${mode}-item-${entry.key}`}
                                        />
                                    ))}
                                </View>
                            )}
                            {!available.length ? (
                                <View style={{ padding: 24, gap: 8 }}>
                                    <Text variant="titleMedium">{destination === 'saved' ? 'No saved items yet' : 'Nothing here yet'}</Text>
                                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                                        Open an item and use its App bar action to add it here.
                                    </Text>
                                </View>
                            ) : null}
                        </Animated.ScrollView>
                        <NavigationRailModal
                            open={railOpen}
                            onOpenChange={setRailOpen}
                            value={destination}
                            onValueChange={setDestination}
                            items={[
                                {
                                    key: 'all',
                                    label: title,
                                    icon: mode === 'inbox' ? 'inbox' : mode === 'messages' ? 'chat_bubble' : 'apps',
                                },
                                { key: 'saved', label: 'Saved', icon: 'bookmark' },
                                ...(mode === 'inbox' ? [{ key: 'archive', label: 'Archive', icon: 'archive' }] : []),
                            ]}
                            footer={
                                <Button
                                    variant="text"
                                    icon="arrow_back"
                                    style={{ alignSelf: 'flex-start' }}
                                    onPress={() => {
                                        setRailOpen(false);
                                        onBack();
                                    }}
                                    testID={`md-appbar-${mode}-back`}
                                >
                                    App bars
                                </Button>
                            }
                            testID={`md-appbar-${mode}-navigation`}
                        />
                        <Dialog visible={accountOpen} onDismiss={() => setAccountOpen(false)} testID={`md-appbar-${mode}-account-dialog`}>
                            <Dialog.Title>Choose an account</Dialog.Title>
                            <Dialog.Content>
                                {['Personal', 'Work'].map((name) => (
                                    <List.Item
                                        key={name}
                                        title={name}
                                        description={name === 'Personal' ? 'alex@example.com' : 'morgan@example.com'}
                                        leading={<Avatar.Text label={name === 'Personal' ? 'A' : 'M'} size={32} />}
                                        trailing={account === name ? <Icon source="check" size={24} /> : undefined}
                                        onPress={() => {
                                            setAccount(name);
                                            setAccountOpen(false);
                                        }}
                                        testID={`md-appbar-${mode}-account-${name.toLowerCase()}`}
                                    />
                                ))}
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button variant="text" onPress={() => setAccountOpen(false)}>
                                    Cancel
                                </Button>
                            </Dialog.Actions>
                        </Dialog>
                        <Dialog
                            visible={assistantOpen}
                            onDismiss={() => setAssistantOpen(false)}
                            testID={`md-appbar-${mode}-collections-dialog`}
                        >
                            <Dialog.Icon icon="auto_awesome" />
                            <Dialog.Title>Explore your photos</Dialog.Title>
                            <Dialog.Content>
                                <Text>Choose a collection to explore.</Text>
                                {['All photos', 'Nature', 'Places'].map((category) => (
                                    <List.Item
                                        key={category}
                                        title={category}
                                        leading={
                                            <Icon
                                                source={
                                                    category === 'Nature' ? 'forest' : category === 'Places' ? 'place' : 'photo_library'
                                                }
                                                size={24}
                                            />
                                        }
                                        onPress={() => {
                                            setDestination(category === 'All photos' ? 'all' : category.toLowerCase());
                                            setAssistantOpen(false);
                                        }}
                                        testID={`md-appbar-${mode}-collection-${category.toLowerCase().replace(/\s/g, '-')}`}
                                    />
                                ))}
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button variant="text" onPress={() => setAssistantOpen(false)}>
                                    Cancel
                                </Button>
                            </Dialog.Actions>
                        </Dialog>
                    </View>
                )}
            </SearchStack.Screen>
            <SearchStack.Screen name="SearchDetail">
                {({ navigation, route }) => {
                    const entry = entries.find((item) => item.key === route.params.key);
                    return entry ? (
                        <DetailScreen
                            entry={entry}
                            mode={mode}
                            saved={savedKeys.includes(entry.key)}
                            onToggleSaved={() => toggleSaved(entry.key)}
                            onBack={() => navigation.goBack()}
                            onArchive={() => {
                                setArchivedKeys((previous) => [...new Set([...previous, entry.key])]);
                                navigation.goBack();
                            }}
                        />
                    ) : (
                        <View />
                    );
                }}
            </SearchStack.Screen>
        </SearchStack.Navigator>
    );
}
