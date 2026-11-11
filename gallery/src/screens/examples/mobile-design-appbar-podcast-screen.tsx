import { useEffect, useRef, useState } from 'react';
import { BackHandler, Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import {
    Button,
    Checkbox,
    DatePicker,
    Dialog,
    Icon,
    IconButton,
    List,
    Menu,
    Slider,
    Snackbar,
    Text,
    TextField,
    TopAppBar,
    TouchableRipple,
    useAppBarScrollBehavior,
    useLocale,
    useMobileTheme,
} from 'mobile-design/react-native';
import { appBarReferenceImages } from './mobile-design-appbar-reference-images';

type Props = { onBack: () => void };

type PodcastRoutes = { PodcastLibrary: undefined; PodcastDetail: { key: string } };
const PodcastStack = createNativeStackNavigator<PodcastRoutes>();

type Podcast = {
    key: string;
    title: string;
    subtitle: string;
    description: string;
    cover: number;
    published: Date;
    audioUri?: string;
};

function daysAgo(days: number) {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - days);
}

function sameDay(left: Date, right: Date) {
    return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function initialPodcasts(): Podcast[] {
    return [
        {
            key: 'wizards',
            title: 'Wizards & Wynona',
            subtitle: 'A little magic in every day',
            description:
                'Conversations about the stories we tell and the small things that make an ordinary day feel a little more magical.',
            cover: 0,
            published: daysAgo(0),
        },
        {
            key: 'peace',
            title: 'At Peace',
            subtitle: 'A quiet place to begin',
            description: 'A little space to slow down, notice your surroundings, and make room for a quieter moment.',
            cover: 1,
            published: daysAgo(0),
        },
        {
            key: 'stories',
            title: 'Everyday Stories',
            subtitle: 'People, places, and possibilities',
            description: 'Stories from people who see familiar places in unexpected ways. A new conversation to keep you company.',
            cover: 2,
            published: daysAgo(1),
        },
        {
            key: 'horizon',
            title: 'Beyond the Horizon',
            subtitle: 'There is more to explore',
            description: 'Thoughtful journeys through open spaces, new ideas, and the places we have yet to discover.',
            cover: 3,
            published: daysAgo(2),
        },
        {
            key: 'nature',
            title: 'Good Nature',
            subtitle: 'Close to the world outside',
            description:
                'From the garden at the end of the street to the forest beyond the city, discover a new way to notice the world outside.',
            cover: 4,
            published: daysAgo(3),
        },
        {
            key: 'creative',
            title: 'Creative Matters',
            subtitle: 'An idea worth sharing',
            description: 'Conversations with people who make things, ask questions, and turn a small idea into something worth sharing.',
            cover: 5,
            published: daysAgo(4),
        },
    ];
}

/** Original cover art from the two visible Saved podcasts hero tiles. */

function PodcastCover({ index }: { index: number }) {
    return (
        <Image
            source={index % 2 ? appBarReferenceImages.podcastRoom : appBarReferenceImages.podcastRecording}
            resizeMode="cover"
            accessible={false}
            style={{ width: '100%', height: '100%' }}
        />
    );
}

function timeLabel(value: number) {
    const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Imported files use the installed native player. The hook releases on exit. */

function AttachedAudio({ uri }: { uri: string }) {
    const theme = useMobileTheme();
    const player = useAudioPlayer({ uri }, { updateInterval: 250 });
    const status = useAudioPlayerStatus(player);
    const [draft, setDraft] = useState<number | null>(null);
    const [error, setError] = useState('');
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    const seek = (position: number) =>
        player.seekTo(position).catch(() => {
            if (alive.current) setError('This audio file could not be played.');
        });
    const toggle = async () => {
        if (!status.isLoaded) return;
        try {
            if (status.playing) player.pause();
            else {
                if (status.duration > 0 && status.currentTime >= status.duration - 0.05) await player.seekTo(0);
                if (alive.current) player.play();
            }
        } catch {
            if (alive.current) setError('This audio file could not be played.');
        }
    };
    return (
        <View style={{ gap: 16 }} testID="md-appbar-podcast-player">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <IconButton
                    icon={status.playing ? 'pause_fill1' : 'play_arrow_fill1'}
                    mode="contained"
                    sizeClass="medium"
                    accessibilityLabel={status.playing ? 'Pause audio' : 'Play audio'}
                    disabled={!status.isLoaded}
                    onPress={toggle}
                    testID="md-appbar-podcast-play"
                />
                <Text variant="labelLarge">
                    {timeLabel(draft ?? status.currentTime)} / {timeLabel(status.duration)}
                </Text>
            </View>
            <Slider
                minimumValue={0}
                maximumValue={Math.max(1, status.duration)}
                value={draft ?? status.currentTime}
                disabled={!status.isLoaded || status.duration <= 0}
                onSlidingStart={(position) => setDraft(position)}
                onValueChange={setDraft}
                onSlidingComplete={(position) => {
                    void seek(position).finally(() => {
                        if (alive.current) setDraft(null);
                    });
                }}
                accessibilityLabel="Audio playback position"
                testID="md-appbar-podcast-position"
            />
            {error ? (
                <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.error }}>
                    {error}
                </Text>
            ) : null}
        </View>
    );
}

function PodcastDetail({
    podcast,
    saved,
    onToggleSaved,
    onBack,
}: {
    podcast: Podcast;
    saved: boolean;
    onToggleSaved: () => void;
    onBack: () => void;
}) {
    const theme = useMobileTheme();
    const insets = useSafeAreaInsets();
    const rtl = useLocale().direction === 'rtl';
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID="md-appbar-podcast-detail">
            <TopAppBar
                title="Podcast"
                navigationIcon={rtl ? 'arrow_forward' : 'arrow_back'}
                navigationLabel="Back to saved podcasts"
                onNavigationPress={onBack}
                actions={[
                    {
                        key: 'bookmark',
                        icon: saved ? 'bookmark_fill1' : 'bookmark-outline',
                        label: saved ? 'Remove from saved podcasts' : 'Save podcast',
                        onPress: onToggleSaved,
                    },
                ]}
                testID="md-appbar-podcast-detail-bar"
            />
            <ScrollView
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={{
                    paddingTop: 24,
                    paddingLeft: insets.left + 24,
                    paddingRight: insets.right + 24,
                    paddingBottom: insets.bottom + 24,
                    gap: 24,
                }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <View
                    style={{
                        width: '100%',
                        maxWidth: 400,
                        aspectRatio: 1,
                        alignSelf: 'center',
                        borderRadius: 12,
                        overflow: 'hidden',
                    }}
                >
                    <PodcastCover index={podcast.cover} />
                </View>
                <View style={{ gap: 8 }}>
                    <Text variant="headlineMedium" accessibilityRole="header">
                        {podcast.title}
                    </Text>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {podcast.subtitle}
                    </Text>
                </View>
                <Text variant="bodyLarge">{podcast.description}</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(podcast.published)}
                </Text>
                {podcast.audioUri ? <AttachedAudio key={podcast.audioUri} uri={podcast.audioUri} /> : null}
            </ScrollView>
        </View>
    );
}

/**
 * App bars Overview hero: Saved podcasts, Back, Attach, Today, overflow,
 * large baseline headline, and a two-column collection. The hero is static;
 * file attachment, dates, search, selection, sorting, and details are working
 * continuations added for this demonstration, rather than claimed video steps.
 * https://m3.material.io/components/app-bars/overview
 */

export function AppBarPodcastScreen({ onBack }: Props) {
    const theme = useMobileTheme();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const rtl = useLocale().direction === 'rtl';
    const [podcasts, setPodcasts] = useState<Podcast[]>(initialPodcasts);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [date, setDate] = useState<Date>();
    const [sort, setSort] = useState<'newest' | 'title'>('newest');
    const [selectionMode, setSelectionMode] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [removed, setRemoved] = useState<string[]>([]);
    const [lastRemoved, setLastRemoved] = useState<string[]>([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [picking, setPicking] = useState(false);
    const [error, setError] = useState('');
    const [gridWidth, setGridWidth] = useState(0);
    const alive = useRef(true);
    const revision = useRef(0);
    const stackNavigation = useRef<NativeStackNavigationProp<PodcastRoutes, 'PodcastLibrary'> | null>(null);
    const scroll = useAppBarScrollBehavior({ behavior: 'exit-until-collapsed' });
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            revision.current += 1;
        };
    }, []);
    useEffect(() => {
        if (!selectionMode) return;
        const listener = BackHandler.addEventListener('hardwareBackPress', () => {
            setSelectionMode(false);
            setSelected([]);
            return true;
        });
        return () => listener.remove();
    }, [selectionMode]);
    const saved = podcasts.filter((podcast) => !removed.includes(podcast.key));
    const visible = saved
        .filter((podcast) => !date || sameDay(podcast.published, date))
        .sort((left, right) =>
            sort === 'title' ? left.title.localeCompare(right.title) : right.published.getTime() - left.published.getTime()
        );
    const searchNeedle = query
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase()
        .trim();
    const matches = saved.filter((podcast) =>
        `${podcast.title} ${podcast.subtitle}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase()
            .includes(searchNeedle)
    );
    const choose = (key: string) =>
        setSelected((previous) => (previous.includes(key) ? previous.filter((value) => value !== key) : [...previous, key]));
    const remove = (keys: string[]) => {
        if (!keys.length) return;
        setRemoved((previous) => [...new Set([...previous, ...keys])]);
        setLastRemoved(keys);
        setSnackbarOpen(true);
        setSelected([]);
        setSelectionMode(false);
    };
    const toggleSaved = (key: string) => {
        if (removed.includes(key)) setRemoved((previous) => previous.filter((value) => value !== key));
        else remove([key]);
    };
    const attach = async () => {
        if (picking) return;
        const token = ++revision.current;
        setPicking(true);
        setError('');
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true, multiple: false });
            if (!alive.current || revision.current !== token || result.canceled) return;
            const asset = result.assets[0];
            if (!asset) return;
            const entry: Podcast = {
                key: `attached-${token}-${Date.now()}`,
                title: asset.name.replace(/\.[^.]+$/, ''),
                subtitle: 'From your audio files',
                description: asset.name,
                cover: 2,
                published: daysAgo(0),
                audioUri: asset.uri,
            };
            setPodcasts((previous) => [entry, ...previous]);
            setDate(undefined);
            setSort('newest');
            stackNavigation.current?.navigate('PodcastDetail', { key: entry.key });
        } catch {
            if (alive.current && revision.current === token) setError('The audio file could not be attached. Try another file.');
        } finally {
            if (alive.current && revision.current === token) setPicking(false);
        }
    };
    // The measured grid already excludes the safe area and 16dp page margins;
    // window width is only a first-layout fallback, not a pane-width assumption.
    const usableGridWidth = gridWidth || Math.max(1, window.width - insets.left - insets.right - 32);
    const columns = usableGridWidth + 32 >= 840 ? 4 : usableGridWidth + 32 >= 600 ? 3 : 2;
    const itemWidth = Math.max(1, (usableGridWidth - (columns - 1) * 16) / columns);
    const dateLabel = date ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date) : '';
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
            <PodcastStack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: theme.animation.scale === 0 ? 'none' : 'default',
                    gestureEnabled: true,
                    contentStyle: { backgroundColor: theme.colors.surface },
                }}
            >
                <PodcastStack.Screen
                    name="PodcastLibrary"
                    listeners={({ navigation }) => ({
                        focus: () => {
                            stackNavigation.current = navigation;
                        },
                    })}
                >
                    {() => (
                        <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID="md-appbar-podcast-screen">
                            <TopAppBar
                                title={selectionMode ? `${selected.length} selected` : 'Saved podcasts'}
                                variant={selectionMode ? 'small' : 'large-flexible'}
                                navigationIcon={selectionMode ? 'close' : rtl ? 'arrow_forward' : 'arrow_back'}
                                navigationLabel={selectionMode ? 'Cancel selection' : 'Back to App bars'}
                                onNavigationPress={
                                    selectionMode
                                        ? () => {
                                              setSelectionMode(false);
                                              setSelected([]);
                                          }
                                        : onBack
                                }
                                scrollBehavior={selectionMode ? undefined : scroll}
                                containerColor={selectionMode ? theme.colors.secondaryContainer : undefined}
                                scrolledContainerColor={selectionMode ? theme.colors.secondaryContainer : undefined}
                                actions={
                                    selectionMode
                                        ? [
                                              {
                                                  key: 'remove',
                                                  icon: 'bookmark_remove',
                                                  label: 'Remove selected podcasts',
                                                  disabled: !selected.length,
                                                  onPress: () => remove(selected),
                                              },
                                          ]
                                        : [
                                              {
                                                  key: 'attach',
                                                  icon: 'attach_file',
                                                  label: picking ? 'Attaching audio' : 'Attach audio file',
                                                  disabled: picking,
                                                  onPress: attach,
                                              },
                                              {
                                                  key: 'today',
                                                  icon: 'today_fill1',
                                                  label: 'Filter podcasts by date',
                                                  onPress: () => setCalendarOpen(true),
                                              },
                                          ]
                                }
                                trailing={
                                    selectionMode ? undefined : (
                                        <Menu
                                            visible={menuOpen}
                                            onDismiss={() => setMenuOpen(false)}
                                            placement="below"
                                            anchor={
                                                <IconButton
                                                    icon="more_vert"
                                                    accessibilityLabel="More podcast actions"
                                                    onPress={() => setMenuOpen(true)}
                                                    testID="md-appbar-podcast-more"
                                                />
                                            }
                                            testID="md-appbar-podcast-menu"
                                        >
                                            <Menu.Item
                                                title="Search podcasts"
                                                leadingIcon="search"
                                                onPress={() => setSearchOpen(true)}
                                                testID="md-appbar-podcast-search-open"
                                            />
                                            <Menu.Item
                                                title="Newest first"
                                                leadingIcon="schedule"
                                                selected={sort === 'newest'}
                                                onPress={() => setSort('newest')}
                                                testID="md-appbar-podcast-sort-newest"
                                            />
                                            <Menu.Item
                                                title="Title A–Z"
                                                leadingIcon="sort_by_alpha"
                                                selected={sort === 'title'}
                                                onPress={() => setSort('title')}
                                                testID="md-appbar-podcast-sort-title"
                                            />
                                            <Menu.Item
                                                title="Select podcasts"
                                                leadingIcon="check_box"
                                                disabled={!visible.length}
                                                onPress={() => {
                                                    setSelectionMode(true);
                                                    setSelected([]);
                                                }}
                                                testID="md-appbar-podcast-select"
                                            />
                                            {date ? (
                                                <Menu.Item
                                                    title="Show all dates"
                                                    leadingIcon="event_busy"
                                                    onPress={() => setDate(undefined)}
                                                    testID="md-appbar-podcast-clear-date"
                                                />
                                            ) : null}
                                        </Menu>
                                    )
                                }
                                testID="md-appbar-podcast-bar"
                            />
                            <Animated.ScrollView
                                onScroll={scroll.onScroll}
                                scrollEventThrottle={16}
                                contentInsetAdjustmentBehavior="never"
                                contentContainerStyle={{
                                    paddingLeft: insets.left + 16,
                                    paddingRight: insets.right + 16,
                                    paddingTop: 8,
                                    paddingBottom: insets.bottom + 24,
                                    gap: 16,
                                }}
                                testID="md-appbar-podcast-content"
                                showsVerticalScrollIndicator={false}
                                showsHorizontalScrollIndicator={false}
                            >
                                {dateLabel ? (
                                    <Text
                                        variant="labelLarge"
                                        accessibilityLiveRegion="polite"
                                        style={{ color: theme.colors.onSurfaceVariant }}
                                    >
                                        {dateLabel} · {visible.length} podcasts
                                    </Text>
                                ) : null}
                                <View
                                    onLayout={(event) => {
                                        const width = event.nativeEvent.layout.width;
                                        setGridWidth((previous) => (previous === width ? previous : width));
                                    }}
                                    style={{ flexDirection: rtl ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 16 }}
                                    testID="md-appbar-podcast-grid"
                                >
                                    {visible.map((podcast) => (
                                        <TouchableRipple
                                            key={podcast.key}
                                            accessibilityRole={selectionMode ? 'checkbox' : 'button'}
                                            accessibilityLabel={podcast.title}
                                            accessibilityHint={
                                                selectionMode ? 'Select this podcast' : 'Open podcast details. Touch and hold to select.'
                                            }
                                            accessibilityState={selectionMode ? { checked: selected.includes(podcast.key) } : undefined}
                                            onPress={() =>
                                                selectionMode
                                                    ? choose(podcast.key)
                                                    : stackNavigation.current?.navigate('PodcastDetail', { key: podcast.key })
                                            }
                                            onLongPress={() => {
                                                setSelectionMode(true);
                                                setSelected((previous) =>
                                                    previous.includes(podcast.key) ? previous : [...previous, podcast.key]
                                                );
                                            }}
                                            borderless={false}
                                            style={{ width: itemWidth, borderRadius: 4, overflow: 'hidden' }}
                                            testID={`md-appbar-podcast-item-${podcast.key}`}
                                        >
                                            <View
                                                style={{
                                                    gap: 8,
                                                    paddingBottom: 16,
                                                    backgroundColor: selected.includes(podcast.key)
                                                        ? theme.colors.secondaryContainer
                                                        : theme.colors.surface,
                                                }}
                                            >
                                                <View style={{ aspectRatio: 1, borderRadius: 4, overflow: 'hidden' }}>
                                                    <PodcastCover index={podcast.cover} />
                                                    {selectionMode ? (
                                                        <View
                                                            pointerEvents="none"
                                                            accessible={false}
                                                            accessibilityElementsHidden
                                                            importantForAccessibility="no-hide-descendants"
                                                            style={{
                                                                position: 'absolute',
                                                                top: 4,
                                                                right: 4,
                                                                backgroundColor: theme.colors.surface,
                                                                borderRadius: 24,
                                                            }}
                                                        >
                                                            <Checkbox
                                                                accessible={false}
                                                                status={selected.includes(podcast.key) ? 'checked' : 'unchecked'}
                                                            />
                                                        </View>
                                                    ) : null}
                                                </View>
                                                <View
                                                    pointerEvents="none"
                                                    style={{ paddingHorizontal: selected.includes(podcast.key) ? 8 : 0, gap: 4 }}
                                                >
                                                    <Text variant="titleMedium" numberOfLines={2}>
                                                        {podcast.title}
                                                    </Text>
                                                    <Text
                                                        variant="bodyMedium"
                                                        numberOfLines={2}
                                                        style={{ color: theme.colors.onSurfaceVariant }}
                                                    >
                                                        {podcast.subtitle}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableRipple>
                                    ))}
                                </View>
                                {!visible.length ? (
                                    <View style={{ padding: 8, gap: 8 }}>
                                        <Text variant="titleLarge">{date ? 'No podcasts on this date' : 'No saved podcasts'}</Text>
                                        <Text style={{ color: theme.colors.onSurfaceVariant }}>
                                            {date
                                                ? 'Choose another date or show all dates from the menu.'
                                                : 'Attach an audio file to start your collection.'}
                                        </Text>
                                    </View>
                                ) : null}
                                {error ? (
                                    <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.error }}>
                                        {error}
                                    </Text>
                                ) : null}
                            </Animated.ScrollView>
                            <DatePicker
                                visible={calendarOpen}
                                value={date}
                                onDismiss={() => setCalendarOpen(false)}
                                onChange={(value) => {
                                    setDate(value);
                                    setCalendarOpen(false);
                                }}
                                title="Select a date"
                                locale="en-US"
                                confirmLabel="OK"
                                cancelLabel="Cancel"
                                testID="md-appbar-podcast-date"
                            />
                            <Dialog visible={searchOpen} onDismiss={() => setSearchOpen(false)} testID="md-appbar-podcast-search-dialog">
                                <Dialog.Title>Search podcasts</Dialog.Title>
                                <Dialog.Content>
                                    <TextField
                                        label="Search saved podcasts"
                                        value={query}
                                        onChangeText={setQuery}
                                        leadingIcon="search"
                                        autoFocus
                                        testID="md-appbar-podcast-search-query"
                                    />
                                    <ScrollView
                                        keyboardShouldPersistTaps="handled"
                                        style={{ maxHeight: 320 }}
                                        showsVerticalScrollIndicator={false}
                                        showsHorizontalScrollIndicator={false}
                                    >
                                        {matches.map((podcast) => (
                                            <List.Item
                                                key={podcast.key}
                                                title={podcast.title}
                                                description={podcast.subtitle}
                                                leading={<Icon source="podcasts" size={24} />}
                                                onPress={() => {
                                                    stackNavigation.current?.navigate('PodcastDetail', { key: podcast.key });
                                                    setSearchOpen(false);
                                                }}
                                                testID={`md-appbar-podcast-search-result-${podcast.key}`}
                                            />
                                        ))}
                                        {!matches.length ? (
                                            <Text style={{ paddingVertical: 16, color: theme.colors.onSurfaceVariant }}>
                                                No matching podcasts
                                            </Text>
                                        ) : null}
                                    </ScrollView>
                                </Dialog.Content>
                                <Dialog.Actions>
                                    <Button variant="text" onPress={() => setSearchOpen(false)}>
                                        Cancel
                                    </Button>
                                </Dialog.Actions>
                            </Dialog>
                        </View>
                    )}
                </PodcastStack.Screen>
                <PodcastStack.Screen name="PodcastDetail">
                    {({ navigation, route }) => {
                        const podcast = podcasts.find((item) => item.key === route.params.key);
                        return podcast ? (
                            <PodcastDetail
                                podcast={podcast}
                                saved={!removed.includes(podcast.key)}
                                onToggleSaved={() => toggleSaved(podcast.key)}
                                onBack={() => navigation.goBack()}
                            />
                        ) : (
                            <View />
                        );
                    }}
                </PodcastStack.Screen>
            </PodcastStack.Navigator>
            <Snackbar
                visible={snackbarOpen}
                onDismiss={() => setSnackbarOpen(false)}
                action={{
                    label: 'Undo',
                    onPress: () => setRemoved((previous) => previous.filter((key) => !lastRemoved.includes(key))),
                }}
                testID="md-appbar-podcast-snackbar"
            >
                {lastRemoved.length === 1 ? 'Podcast removed from saved' : `${lastRemoved.length} podcasts removed from saved`}
            </Snackbar>
        </View>
    );
}
