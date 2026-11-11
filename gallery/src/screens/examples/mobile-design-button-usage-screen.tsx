import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { ThemeProvider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
    Button,
    Card,
    Dialog,
    Icon,
    IconButton,
    List,
    NavigationBar,
    NavigationRail,
    ProgressIndicator,
    Snackbar,
    SplitButton,
    Text,
    TextField,
    TopAppBar,
    useMobileTheme,
} from 'mobile-design/react-native';
import {
    buttonAudioTracks,
    buttonClock,
    buttonFlights,
    buttonShoppingOffers,
    type ButtonUsageScenario,
} from './mobile-design-button-usage-data';

type ButtonRoutes = { ButtonMain: undefined; ButtonDetail: { kind: string; id?: string } };
type ButtonNavigation = NativeStackNavigationProp<ButtonRoutes>;
const Stack = createNativeStackNavigator<ButtonRoutes>();
const arts = {
    waiting: require('./assets/buttons/call-waiting.png'),
    meeting: require('./assets/buttons/call-meeting.png'),
    bao: require('./assets/buttons/bao.png'),
    recipes: require('./assets/buttons/recipes.png'),
    bread: require('./assets/buttons/bread-hero.png'),
    sourdough: require('./assets/buttons/sourdough.png'),
    mycelium: require('./assets/buttons/mycelium.png'),
    flowers: require('./assets/buttons/flowers.png'),
    cactus: require('./assets/buttons/cactus.png'),
    walk: require('./assets/buttons/long-walk.png'),
    sole: require('./assets/buttons/sole-rey.png'),
    jameer: require('./assets/buttons/jameer.png'),
    friends: require('./assets/buttons/friends.png'),
} as const;
const sizes = ['X-Small', 'Small', 'Medium', 'Large', 'X-Large'] as const;
const shopNavigation = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'saved', label: 'Saved', icon: 'bookmarks' },
    { key: 'account', label: 'Account', icon: 'account_circle' },
    { key: 'cart', label: 'Cart', icon: 'shopping_cart' },
] as const;
const flightNavigation = [
    { key: 'flights', label: 'Flights', icon: 'airplane_ticket' },
    { key: 'hotels', label: 'Hotels', icon: 'bed' },
    { key: 'restaurants', label: 'Restaurants', icon: 'restaurant' },
] as const;

/** Native controls over inspectable source-art fragments. Service continuations stay local to this session. */
export function ButtonUsageContent({ scenario, onBack }: { scenario: ButtonUsageScenario; onBack: () => void }) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets();
    const focused = useIsFocused(),
        { width } = useWindowDimensions();
    const [inCall, setInCall] = useState(false),
        [camera, setCamera] = useState(true),
        [microphone, setMicrophone] = useState(false);
    const [playing, setPlaying] = useState(scenario === 'music-filled'),
        [track, setTrack] = useState(0),
        [position, setPosition] = useState(0);
    const [timerRunning, setTimerRunning] = useState(true),
        [timerRemaining, setTimerRemaining] = useState(135);
    const [size, setSize] = useState(scenario === 'shopping-elevated' ? 'Medium' : '');
    const [sizeDraft, setSizeDraft] = useState(size);
    const pendingCart = useRef<{ navigation: ButtonNavigation; size: string } | null>(null);
    const [sizeDialog, setSizeDialog] = useState(false),
        [cart, setCart] = useState<{ title: string; details: string }[]>([]);
    const [payment, setPayment] = useState<'ready' | 'pending' | 'complete'>('ready');
    const [playlistName, setPlaylistName] = useState('Long Walk'),
        [playlistDraft, setPlaylistDraft] = useState('Long Walk');
    const [favorite, setFavorite] = useState(false),
        [download, setDownload] = useState<'ready' | 'pending' | 'complete'>('ready');
    const [movie, setMovie] = useState(0),
        [calendarAdded, setCalendarAdded] = useState(false);
    const [rsvp, setRsvp] = useState('Yes'),
        [newsletter, setNewsletter] = useState<'open' | 'cancelled' | 'subscribed'>('open');
    const [retryRemaining, setRetryRemaining] = useState(5),
        [retryVisible, setRetryVisible] = useState(true),
        [sent, setSent] = useState(false);
    const [navDestination, setNavDestination] = useState('home'),
        [flightDestination, setFlightDestination] = useState('flights');
    const [flightMenu, setFlightMenu] = useState(false),
        [checkedIn, setCheckedIn] = useState(false);
    const [foodCount, setFoodCount] = useState(0),
        [foodOrdered, setFoodOrdered] = useState(false);
    const currentNavigation = useRef<ButtonNavigation | null>(null);
    useEffect(() => {
        pendingCart.current = null;
        return () => {
            pendingCart.current = null;
        };
    }, [focused, scenario]);
    const playbackTrack = useRef(track);
    playbackTrack.current = track;
    const surface = { flex: 1, backgroundColor: theme.colors.surface } as const;
    const safe = { ...surface, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right };
    const wide = width - insets.left - insets.right >= 720;
    const compactActions = width - insets.left - insets.right < 400;
    const selectedTrack = buttonAudioTracks[track % buttonAudioTracks.length];
    const currentMovie = movie % 3;
    const textScaleTheme = {
        ...theme,
        fonts: Object.fromEntries(
            Object.entries(theme.fonts).map(([key, font]) => [
                key,
                'fontSize' in font ? { ...font, fontSize: font.fontSize * 2, lineHeight: font.lineHeight * 2 } : font,
            ])
        ) as typeof theme.fonts,
    };
    const detail = (navigation: ButtonNavigation, kind: string, id?: string) => navigation.navigate('ButtonDetail', { kind, id });
    const changeTrack = (delta: number) => {
        playbackTrack.current = (playbackTrack.current + delta + buttonAudioTracks.length) % buttonAudioTracks.length;
        setTrack((previous) => (previous + delta + buttonAudioTracks.length) % buttonAudioTracks.length);
        setPosition(0);
    };
    const toggleTrack = (index: number) => {
        // Pausing the current track retains its place; choosing another starts it at zero.
        // The event cursor also tracks taps batched before the next React render.
        const changedTrack = playbackTrack.current !== index;
        playbackTrack.current = index;
        if (changedTrack || position >= buttonAudioTracks[index].duration) setPosition(0);
        setTrack(index);
        setPlaying((previous) => changedTrack || !previous);
    };
    const toggleTimer = () => {
        // Both Start controls restart a completed timer instead of resuming at 0:00.
        if (!timerRunning && timerRemaining === 0) setTimerRemaining(135);
        setTimerRunning((previous) => !previous);
    };
    const finishRetry = () => {
        setSent(true);
        setRetryVisible(false);
    };
    useEffect(() => {
        if (!focused) return;
        if (scenario === 'timer' && timerRunning && timerRemaining > 0) {
            const id = setInterval(() => setTimerRemaining((previous) => Math.max(0, previous - 1)), 1000);
            return () => clearInterval(id);
        }
        if ((scenario === 'audio-player' || scenario === 'music-filled' || scenario === 'rapid-player') && playing) {
            const id = setInterval(() => setPosition((previous) => Math.min(selectedTrack.duration, previous + 1)), 1000);
            return () => clearInterval(id);
        }
    }, [focused, scenario, timerRunning, timerRemaining > 0, playing, selectedTrack.duration]);
    useEffect(() => {
        if (timerRemaining === 0) setTimerRunning(false);
    }, [timerRemaining]);
    useEffect(() => {
        if (position >= selectedTrack.duration) setPlaying(false);
    }, [position, selectedTrack.duration]);
    useEffect(() => {
        if (!focused || payment !== 'pending') return;
        const id = setTimeout(() => {
            setPayment('complete');
            currentNavigation.current?.navigate('ButtonDetail', { kind: 'payment' });
        }, 900);
        return () => clearTimeout(id);
    }, [focused, payment]);
    useEffect(() => {
        if (!focused || download !== 'pending') return;
        const id = setTimeout(() => setDownload('complete'), 1200);
        return () => clearTimeout(id);
    }, [focused, download]);
    useEffect(() => {
        if (!focused || scenario !== 'retry' || !retryVisible) return;
        const id = setInterval(() => setRetryRemaining((previous) => Math.max(0, previous - 1)), 1000);
        return () => clearInterval(id);
    }, [focused, scenario, retryVisible]);
    useEffect(() => {
        if (scenario === 'retry' && retryRemaining === 0 && retryVisible) finishRetry();
    }, [scenario, retryRemaining, retryVisible]);
    const image = (name: keyof typeof arts, aspectRatio: number) => (
        // Explicit auto survives style interop and overrides the asset's intrinsic height.
        <Image
            source={arts[name]}
            resizeMode="contain"
            accessible={false}
            style={{ width: '100%', maxWidth: '100%', height: 'auto', aspectRatio }}
        />
    );
    const body = (children: React.ReactNode, testID: string, bottom = false) => (
        <View style={safe} onAccessibilityEscape={onBack} testID={testID}>
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: bottom ? 'flex-end' : 'center',
                    padding: 24,
                    paddingBottom: insets.bottom + 24,
                }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <View style={{ width: '100%', maxWidth: 840, alignSelf: 'center', gap: 24 }}>{children}</View>
            </ScrollView>
        </View>
    );
    const sizeChoices = (testPrefix: string, currentSize = size, onChange = setSize) => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {sizes.map((choice) => (
                <Button
                    key={choice}
                    variant="outlined"
                    shape="square"
                    size="extra-small"
                    selected={currentSize === choice}
                    onPress={() => onChange(choice)}
                    testID={`${testPrefix}-size-${choice}`}
                >
                    {choice}
                </Button>
            ))}
        </View>
    );
    const cartDetail = (navigation: ButtonNavigation, chosenSize = size) => {
        if (!chosenSize) {
            setSizeDraft(size);
            setSizeDialog(true);
            return;
        }
        setSize(chosenSize);
        setCart((previous) => [...previous, { title: 'Logo Hooded Sweatshirt', details: `Size ${chosenSize} · $120` }]);
        detail(navigation, 'cart');
    };
    const flightCard = (flight: (typeof buttonFlights)[number]) => (
        <View
            style={{
                borderRadius: 28,
                padding: 24,
                gap: 24,
                backgroundColor: theme.colors.surfaceContainerHigh,
                flex: wide ? 1 : undefined,
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                    <Text>{flight.departure}</Text>
                    <Text variant="headlineLarge">{flight.from}</Text>
                </View>
                <Icon source="flight" size={24} />
                <View>
                    <Text>{flight.arrival}</Text>
                    <Text variant="headlineLarge">{flight.to}</Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                {[
                    ['Flight', flight.flight],
                    ['Booking', flight.booking],
                    ['Terminal', flight.terminal],
                    ['Gate', flight.gate],
                ]
                    .filter(([, value]) => Boolean(value))
                    .map(([label, value]) => (
                        <View key={label}>
                            <Text>{label}</Text>
                            <Text>{value}</Text>
                        </View>
                    ))}
            </View>
            {flight.id === 'next' ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <View>
                        <Text>Now</Text>
                        <Text>{checkedIn && flight.id === 'next' ? 'Checked in' : 'Checkin'}</Text>
                    </View>
                    <View>
                        <Text>Ends in</Text>
                        <Text>8h 15m</Text>
                    </View>
                    <View
                        style={{
                            borderRadius: 8,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            backgroundColor: theme.colors.tertiaryContainer,
                        }}
                    >
                        <Text style={{ color: theme.colors.onTertiaryContainer }}>On time</Text>
                    </View>
                </View>
            ) : null}
        </View>
    );
    const main = (navigation: ButtonNavigation) => {
        currentNavigation.current = navigation;
        if (scenario === 'call')
            return body(
                <>
                    <View style={{ borderRadius: 20, overflow: 'hidden' }}>{image(inCall ? 'meeting' : 'waiting', 792 / 160)}</View>
                    <Text variant="headlineLarge" style={{ textAlign: 'center' }}>
                        Appointment - Thea
                    </Text>
                    <Text
                        variant="bodyLarge"
                        style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}
                        testID="md-button-call-status"
                    >
                        {inCall ? 'In the meeting' : 'Your host has not yet joined'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                        <IconButton
                            icon={camera ? 'videocam' : 'videocam_off'}
                            mode="outlined"
                            sizeClass={compactActions ? 'small' : 'medium'}
                            widthVariant="narrow"
                            selected={!camera}
                            accessibilityLabel={camera ? 'Turn camera off' : 'Turn camera on'}
                            onPress={() => setCamera((previous) => !previous)}
                            testID="md-button-call-camera"
                        />
                        <Button
                            variant="filled"
                            size={compactActions ? 'medium' : 'large'}
                            selected={inCall}
                            style={{ flexShrink: 1 }}
                            onPress={() => setInCall((previous) => !previous)}
                            testID={inCall ? 'md-button-call-end' : 'md-button-call-join'}
                        >
                            {inCall ? 'End call' : 'Ask to join'}
                        </Button>
                        <IconButton
                            icon={microphone ? 'mic' : 'mic_off'}
                            mode="outlined"
                            sizeClass={compactActions ? 'small' : 'medium'}
                            widthVariant="narrow"
                            selected={microphone}
                            accessibilityLabel={microphone ? 'Mute microphone' : 'Unmute microphone'}
                            onPress={() => setMicrophone((previous) => !previous)}
                            testID="md-button-call-microphone"
                        />
                    </View>
                </>,
                'md-button-use-call',
                true
            );
        if (scenario === 'playlist')
            return body(
                <>
                    <View style={{ gap: 2, borderRadius: 28, overflow: 'hidden' }} testID="md-button-playlist-tracks">
                        {[
                            { index: 1, title: 'Shadow twin', artist: 'Sole R. Rey', duration: 202, art: 'sole' as const },
                            { index: 0, title: 'Long Walk', artist: 'L.R. Coleman', duration: 278, art: 'walk' as const },
                        ].map((item) => (
                            <List.Item
                                key={item.title}
                                multiAction
                                title={item.title}
                                description={item.artist}
                                leading={
                                    <View style={{ width: 72, height: 72, borderRadius: 4, overflow: 'hidden' }}>
                                        <Image
                                            source={arts[item.art]}
                                            resizeMode="cover"
                                            accessible={false}
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </View>
                                }
                                trailing={
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text variant="labelLarge">{buttonClock(item.duration)}</Text>
                                        <IconButton
                                            icon={playing && track === item.index ? 'pause_circle' : 'play_circle'}
                                            onPress={() => toggleTrack(item.index)}
                                            accessibilityLabel={`${playing && track === item.index ? 'Pause' : 'Play'} ${item.title}`}
                                            testID={`md-button-playlist-track-${item.index}`}
                                        />
                                    </View>
                                }
                                style={{ padding: 16, backgroundColor: theme.colors.surfaceContainerHigh }}
                            />
                        ))}
                    </View>
                    <Button
                        style={{ alignSelf: 'flex-end' }}
                        onPress={() => {
                            setPlaylistDraft(playlistName);
                            detail(navigation, 'playlist');
                        }}
                        testID="md-button-playlist-edit"
                    >
                        Edit playlist
                    </Button>
                </>,
                'md-button-use-playlist',
                true
            );
        if (scenario === 'timer')
            return body(
                <>
                    <View
                        style={{
                            width: Math.min(width - 64, 320),
                            aspectRatio: 1,
                            alignSelf: 'center',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <ProgressIndicator
                            variant="circular"
                            appearance="wavy"
                            progress={timerRemaining / 135}
                            size={Math.min(width - 64, 320)}
                            thickness={12}
                            paused={!timerRunning}
                            accessibilityLabel="Time remaining"
                        />
                        <Text
                            variant="displayLarge"
                            style={{ position: 'absolute', color: theme.colors.primary }}
                            testID="md-button-timer-value"
                        >
                            {buttonClock(timerRemaining)}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
                        <IconButton
                            mode="contained-tonal"
                            icon={timerRunning ? 'pause_fill1' : 'play_arrow_fill1'}
                            sizeClass="medium"
                            widthVariant="narrow"
                            containerColor={theme.colors.tertiaryContainer}
                            iconColor={theme.colors.onTertiaryContainer}
                            onPress={toggleTimer}
                            accessibilityLabel={timerRunning ? 'Pause timer' : 'Resume timer'}
                            testID="md-button-timer-pause"
                        />
                        <Button
                            variant="filled"
                            size="large"
                            selected={!timerRunning}
                            style={{ flexShrink: 1 }}
                            onPress={toggleTimer}
                            testID="md-button-timer-toggle"
                        >
                            {timerRunning ? 'Stop' : 'Start'}
                        </Button>
                        <IconButton
                            mode="outlined"
                            icon="restart_alt"
                            sizeClass="medium"
                            widthVariant="narrow"
                            onPress={() => {
                                setTimerRemaining(135);
                                setTimerRunning(false);
                            }}
                            accessibilityLabel="Reset timer"
                            testID="md-button-timer-reset"
                        />
                    </View>
                </>,
                'md-button-use-timer',
                true
            );
        if (scenario === 'audio-player' || scenario === 'music-filled' || scenario === 'rapid-player')
            return body(
                <>
                    <View style={{ gap: 8 }}>
                        {[1, 0].map((index) => {
                            const item = buttonAudioTracks[index];
                            return (
                                <List.Item
                                    key={item.id}
                                    multiAction
                                    title={item.title}
                                    description={item.artist}
                                    leading={
                                        <View style={{ width: 72, height: 72, borderRadius: 4, overflow: 'hidden' }}>
                                            {image(item.id === 'coleman' ? 'walk' : 'sole', item.id === 'coleman' ? 144 / 142 : 430 / 198)}
                                        </View>
                                    }
                                    trailing={
                                        <View style={{ alignItems: 'center' }}>
                                            <IconButton
                                                icon={playing && track === index ? 'pause' : 'play_arrow'}
                                                mode="contained-tonal"
                                                onPress={() => toggleTrack(index)}
                                                accessibilityLabel={`${playing && track === index ? 'Pause' : 'Play'} ${item.title}`}
                                                testID={`md-button-${scenario}-track-${index}`}
                                            />
                                            <Text variant="labelLarge">{buttonClock(item.duration)}</Text>
                                        </View>
                                    }
                                />
                            );
                        })}
                    </View>
                    <ProgressIndicator
                        variant="linear"
                        appearance={scenario === 'music-filled' ? 'wavy' : 'flat'}
                        progress={position / selectedTrack.duration}
                        paused={!playing}
                        accessibilityLabel={`${selectedTrack.title}, ${buttonClock(position)} elapsed`}
                        testID={`md-button-${scenario}-progress`}
                    />
                    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
                        <IconButton
                            icon="skip_previous_fill1"
                            mode={scenario === 'rapid-player' ? 'contained-tonal' : 'outlined'}
                            sizeClass={
                                scenario === 'rapid-player' ? (compactActions ? 'medium' : 'large') : compactActions ? 'small' : 'medium'
                            }
                            widthVariant={scenario === 'rapid-player' ? 'narrow' : 'wide'}
                            onPress={() => changeTrack(-1)}
                            accessibilityLabel="Previous track"
                            testID={`md-button-${scenario}-previous`}
                        />
                        {scenario === 'rapid-player' ? (
                            <IconButton
                                icon={playing ? 'pause_fill1' : 'play_arrow_fill1'}
                                mode="contained"
                                shape="square"
                                sizeClass={compactActions ? 'medium' : 'large'}
                                onPress={() => {
                                    if (position >= selectedTrack.duration) setPosition(0);
                                    setPlaying((previous) => !previous);
                                }}
                                accessibilityLabel={playing ? 'Pause' : 'Play'}
                                testID={`md-button-${scenario}-play`}
                            />
                        ) : (
                            <Button
                                size={compactActions ? 'medium' : 'large'}
                                variant={scenario === 'music-filled' ? 'filled' : 'tonal'}
                                icon={scenario === 'music-filled' ? (playing ? 'pause_fill1' : 'play_arrow') : undefined}
                                selected={playing}
                                style={{ flexShrink: 1 }}
                                onPress={() => {
                                    if (position >= selectedTrack.duration) setPosition(0);
                                    setPlaying((previous) => !previous);
                                }}
                                testID={`md-button-${scenario}-play`}
                            >
                                {playing ? 'Pause' : 'Play'}
                            </Button>
                        )}
                        <IconButton
                            icon="skip_next_fill1"
                            mode={scenario === 'rapid-player' ? 'contained-tonal' : 'outlined'}
                            sizeClass={
                                scenario === 'rapid-player' ? (compactActions ? 'medium' : 'large') : compactActions ? 'small' : 'medium'
                            }
                            widthVariant={scenario === 'rapid-player' ? 'narrow' : 'wide'}
                            onPress={() => changeTrack(1)}
                            accessibilityLabel="Next track"
                            testID={`md-button-${scenario}-next`}
                        />
                    </View>
                </>,
                `md-button-use-${scenario}`,
                true
            );
        if (scenario === 'payment')
            return body(
                <>
                    <Text variant="headlineLarge" style={{ textAlign: 'center' }}>
                        So Duri
                    </Text>
                    <Text variant="titleLarge" style={{ textAlign: 'center' }}>
                        @so-duri
                    </Text>
                    <Text variant="bodyLarge" style={{ textAlign: 'center' }}>
                        Thanks for doing the grocery shopping! I’ll do it next week. 🛒🛒🛒
                    </Text>
                    <Text variant="displayLarge" style={{ textAlign: 'center' }}>
                        $159.32
                    </Text>
                    <Button
                        size="medium"
                        loading={payment === 'pending'}
                        disabled={payment === 'complete'}
                        style={{ alignSelf: 'center', minWidth: 240, maxWidth: '100%' }}
                        onPress={() => setPayment('pending')}
                        testID="md-button-payment-pay"
                    >
                        {payment === 'complete' ? 'Payment complete' : 'Make payment'}
                    </Button>
                </>,
                'md-button-use-payment',
                true
            );
        if (scenario === 'shopping-elevated' || scenario === 'shopping-outlined')
            return body(
                <>
                    {(scenario === 'shopping-elevated'
                        ? [
                              ['Trucker Hat', '$20'],
                              ['Basic T-Shirt', '$30'],
                              ['Logo Hooded Sweatshirt', '$120'],
                          ]
                        : [['Logo Hooded Sweatshirt', '$120']]
                    ).map(([name, price]) => (
                        <View
                            key={name}
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                gap: 16,
                                paddingVertical: 16,
                                borderBottomWidth: 1,
                                borderColor: theme.colors.outlineVariant,
                            }}
                        >
                            <Text variant="titleLarge" style={{ flexShrink: 1 }}>
                                {name}
                            </Text>
                            <Text>{price}</Text>
                        </View>
                    ))}
                    <Text variant="titleMedium">Select size</Text>
                    {sizeChoices(`md-button-${scenario}`)}
                    <Button
                        variant={scenario === 'shopping-elevated' ? 'elevated' : 'outlined'}
                        icon="shopping_cart_fill1"
                        size="medium"
                        style={{ alignSelf: 'center' }}
                        onPress={() => cartDetail(navigation)}
                        testID={`md-button-${scenario}-${scenario === 'shopping-elevated' ? 'place-order' : 'add'}`}
                    >
                        {scenario === 'shopping-elevated' ? 'Place order' : 'Add to cart'}
                    </Button>
                    <Dialog
                        visible={sizeDialog}
                        onDismiss={() => {
                            pendingCart.current = null;
                            setSizeDialog(false);
                        }}
                        onClosed={() => {
                            const pending = pendingCart.current;
                            pendingCart.current = null;
                            if (focused && pending?.navigation.isFocused()) cartDetail(pending.navigation, pending.size);
                        }}
                    >
                        <Dialog.Title>Select size</Dialog.Title>
                        <Dialog.Content>{sizeChoices('md-button-size-dialog', sizeDraft, setSizeDraft)}</Dialog.Content>
                        <Dialog.Actions>
                            <Button
                                variant="text"
                                onPress={() => {
                                    pendingCart.current = null;
                                    setSizeDialog(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="text"
                                disabled={!sizeDraft}
                                onPress={() => {
                                    pendingCart.current = { navigation, size: sizeDraft };
                                    setSizeDialog(false);
                                }}
                                testID="md-button-size-dialog-add"
                            >
                                Add to cart
                            </Button>
                        </Dialog.Actions>
                    </Dialog>
                </>,
                `md-button-use-${scenario}`,
                true
            );
        if (scenario === 'shopping-tonal')
            return (
                <View style={safe} onAccessibilityEscape={onBack} testID="md-button-use-shopping-tonal">
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', padding: 24 }}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        {navDestination === 'home' ? (
                            buttonShoppingOffers.map((offer) => (
                                <View
                                    key={offer.id}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 16,
                                        paddingVertical: 24,
                                        borderBottomWidth: 1,
                                        borderColor: theme.colors.outlineVariant,
                                    }}
                                >
                                    <View style={{ flex: 1, gap: 8 }}>
                                        <Text variant="titleLarge">{offer.price}</Text>
                                        <Text>{offer.tax}</Text>
                                        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                                            <Icon source="shopping_bag" size={20} />
                                            <Text>{offer.seller}</Text>
                                        </View>
                                    </View>
                                    <Button
                                        variant="tonal"
                                        size="medium"
                                        onPress={() => detail(navigation, 'seller', offer.id)}
                                        testID={`md-button-shopping-tonal-visit-${offer.id}`}
                                    >
                                        Visit site
                                    </Button>
                                </View>
                            ))
                        ) : (
                            <View style={{ paddingVertical: 24, gap: 16 }}>
                                <Text variant="headlineMedium">{shopNavigation.find((item) => item.key === navDestination)?.label}</Text>
                                <Text>
                                    {navDestination === 'cart'
                                        ? `${cart.length} items in your cart`
                                        : navDestination === 'saved'
                                          ? 'Your saved offers will appear here.'
                                          : 'Guest account'}
                                </Text>
                                {navDestination === 'cart'
                                    ? cart.map((entry, index) => (
                                          <List.Item
                                              key={index}
                                              title={entry.title}
                                              description={entry.details}
                                              trailing={<Icon source="chevron_right" size={24} />}
                                              onPress={() => detail(navigation, 'cart')}
                                              testID={`md-button-shopping-tonal-cart-${index}`}
                                          />
                                      ))
                                    : null}
                            </View>
                        )}
                    </ScrollView>
                    <NavigationBar
                        items={shopNavigation}
                        value={navDestination}
                        onValueChange={setNavDestination}
                        style={{ paddingBottom: insets.bottom }}
                        testID="md-button-shopping-tonal-navigation"
                    />
                </View>
            );
        if (scenario === 'films')
            return body(
                <>
                    <View style={{ borderRadius: 24, overflow: 'hidden' }}>
                        <Image
                            source={arts[currentMovie === 0 ? 'mycelium' : currentMovie === 1 ? 'flowers' : 'cactus']}
                            resizeMode="cover"
                            accessible={false}
                            style={{ width: '100%', maxWidth: '100%', height: 'auto', aspectRatio: 550 / 280 }}
                        />
                    </View>
                    <Text variant="headlineLarge" style={{ textAlign: 'center' }} testID="md-button-films-title">
                        {['Magical Mycelium', 'Sunlit gardens', 'Cactus country'][currentMovie]}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                        {[0, 1, 2, 3].map((star) => (
                            <Icon key={star} source="star_fill1" size={24} />
                        ))}
                        <Icon source="star_half_fill1" size={24} />
                        <Text>(4.6)</Text>
                    </View>
                    <Text variant="bodyLarge" style={{ textAlign: 'center' }}>
                        {currentMovie === 0
                            ? 'From truffle hunting in the forests of France to digging deep underground to find vast mycelium networks, this delightful documentary shows you a side of the fungi family you never knew existed.'
                            : currentMovie === 1
                              ? 'Explore the life of plants and the people who grow them.'
                              : 'A journey through the landscapes that cacti call home.'}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
                        <IconButton
                            mode="outlined"
                            icon="arrow_back"
                            sizeClass="medium"
                            widthVariant="narrow"
                            accessibilityLabel="Back"
                            onPress={() => (movie ? setMovie(movie - 1) : onBack())}
                            testID="md-button-films-back"
                        />
                        <Button
                            variant="outlined"
                            size="medium"
                            onPress={() => setMovie((previous) => previous + 1)}
                            testID="md-button-films-next"
                        >
                            Next movie
                        </Button>
                    </View>
                </>,
                'md-button-use-films',
                true
            );
        if (scenario === 'calendar-gradient')
            return body(
                <View style={{ borderRadius: 24, overflow: 'hidden', padding: 32, gap: 28, alignItems: 'center' }}>
                    <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
                        <Defs>
                            <LinearGradient id="party-gradient" x1="0" y1="1" x2="1" y2="0">
                                <Stop offset="0" stopColor={theme.colors.tertiaryContainer} />
                                <Stop offset="1" stopColor={theme.colors.primaryContainer} />
                            </LinearGradient>
                        </Defs>
                        <Rect width="100%" height="100%" fill="url(#party-gradient)" />
                    </Svg>
                    <Text variant="titleLarge">32nd birthday party</Text>
                    <Text>WHEN</Text>
                    <Text variant="headlineLarge" style={{ textAlign: 'center' }}>
                        November 2nd{`\n`}at 7pm
                    </Text>
                    <Text>WHERE</Text>
                    <Text variant="headlineLarge">Café Amelie</Text>
                    <Button
                        variant="outlined"
                        size="medium"
                        onPress={() => {
                            setCalendarAdded(true);
                            detail(navigation, 'calendar');
                        }}
                        testID="md-button-calendar-gradient-add"
                    >
                        Add to calendar
                    </Button>
                </View>,
                'md-button-use-calendar-gradient'
            );
        if (scenario === 'calendar-text')
            return body(
                <>
                    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
                        <Icon source="notifications" size={24} />
                        <Text variant="titleLarge">10 minutes before</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
                        <Icon source="settings" size={24} />
                        <View>
                            <Text variant="titleLarge">6 guests</Text>
                            <Text>3 yes, 1 no, 2 maybe</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                        <Text variant="titleLarge">Going?</Text>
                        <Button
                            variant="text"
                            accessibilityState={{ selected: rsvp === 'No' }}
                            labelStyle={{ fontWeight: rsvp === 'No' ? '700' : '500' }}
                            onPress={() => setRsvp('No')}
                            testID="md-button-calendar-text-no"
                        >
                            No
                        </Button>
                        <Button
                            variant="text"
                            accessibilityState={{ selected: rsvp === 'Maybe' }}
                            labelStyle={{ fontWeight: rsvp === 'Maybe' ? '700' : '500' }}
                            onPress={() => setRsvp('Maybe')}
                            testID="md-button-calendar-text-maybe"
                        >
                            Maybe
                        </Button>
                        <SplitButton
                            label="Yes"
                            variant={rsvp === 'Yes' ? 'filled' : 'outlined'}
                            icon="videocam"
                            onPress={() => {
                                setRsvp('Yes');
                                detail(navigation, 'meeting');
                            }}
                            actions={[
                                { key: 'yes', label: 'Yes', onPress: () => setRsvp('Yes') },
                                { key: 'no', label: 'No', onPress: () => setRsvp('No') },
                                { key: 'maybe', label: 'Maybe', onPress: () => setRsvp('Maybe') },
                            ]}
                            testID="md-button-calendar-text-yes"
                        />
                    </View>
                </>,
                'md-button-use-calendar-text',
                true
            );
        if (scenario === 'newsletter')
            return (
                <View style={safe} onAccessibilityEscape={onBack} testID="md-button-use-newsletter">
                    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
                        <Text variant="headlineLarge">Good Food</Text>
                        <Text testID="md-button-newsletter-status">
                            {newsletter === 'subscribed'
                                ? 'You’re subscribed to Good Food’s weekly newsletter.'
                                : newsletter === 'cancelled'
                                  ? 'You haven’t subscribed.'
                                  : 'Recipes, restaurant reviews and interviews.'}
                        </Text>
                    </View>
                    <Dialog visible={newsletter === 'open'} onDismiss={() => setNewsletter('cancelled')}>
                        <Dialog.Title>Subscribe to our newsletter?</Dialog.Title>
                        <Dialog.Content>
                            <Text>
                                Do you want to subscribe to Good Food’s weekly newsletter? You’ll receive new recipes, restaurant reviews
                                and interviews with innovative chefs and restauranteurs.
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button variant="text" onPress={() => setNewsletter('cancelled')} testID="md-button-newsletter-cancel">
                                Cancel
                            </Button>
                            <Button variant="text" onPress={() => setNewsletter('subscribed')} testID="md-button-newsletter-subscribe">
                                Subscribe
                            </Button>
                        </Dialog.Actions>
                    </Dialog>
                </View>
            );
        if (scenario === 'photo-elevated')
            return body(
                <View style={{ minHeight: 320, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end' }}>
                    <Image
                        source={arts.bread}
                        resizeMode="cover"
                        accessible={false}
                        style={{ position: 'absolute', width: '100%', height: '100%' }}
                    />
                    <View
                        pointerEvents="none"
                        style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: theme.colors.scrim, opacity: 0.24 }}
                    />
                    <View style={{ padding: 24, gap: 16, alignItems: 'center' }}>
                        <Text variant="headlineLarge" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                            Top Bread Recipes
                        </Text>
                        <Text variant="titleMedium" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                            Bake your way around the world
                        </Text>
                        <Button
                            variant="elevated"
                            size="medium"
                            style={{ alignSelf: 'center', marginTop: 24 }}
                            onPress={() => detail(navigation, 'recipes')}
                            testID="md-button-photo-elevated-explore"
                        >
                            Explore recipes
                        </Button>
                    </View>
                </View>,
                'md-button-use-photo-elevated'
            );
        if (scenario === 'sourdough')
            return body(
                <Card variant="outlined" style={{ overflow: 'hidden' }}>
                    {image('sourdough', 694 / 104)}
                    <View style={{ padding: 16, gap: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <Text variant="headlineSmall" style={{ flex: 1 }}>
                                Sourdough bread
                            </Text>
                            <IconButton
                                icon={favorite ? 'favorite' : 'favorite_border'}
                                mode="outlined"
                                selected={favorite}
                                onPress={() => setFavorite((previous) => !previous)}
                                accessibilityLabel={favorite ? 'Remove favorite' : 'Favorite'}
                                testID="md-button-sourdough-favorite"
                            />
                        </View>
                        <Text variant="bodyLarge">
                            Sourdough bread is known for its distinct tangy taste, developed during its leavening process that uses
                            Lactobacillus bacteria and wild yeasts.
                        </Text>
                        <Button
                            variant="text"
                            style={{ alignSelf: 'flex-start' }}
                            onPress={() => detail(navigation, 'sourdough')}
                            testID="md-button-sourdough-learn"
                        >
                            Learn more
                        </Button>
                    </View>
                </Card>,
                `md-button-use-${scenario}`
            );
        if (scenario === 'album' || scenario === 'photo-outlined')
            return body(
                <>
                    {scenario === 'album' ? <Text variant="titleMedium">Your top albums</Text> : null}
                    <ScrollView
                        horizontal
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 16 }}
                    >
                        {(scenario === 'album' ? (['sole'] as const) : (['jameer', 'sole'] as const)).map((name) => (
                            <View
                                key={name}
                                style={{
                                    width: 240,
                                    minHeight: 240,
                                    justifyContent: 'flex-end',
                                    borderRadius: 24,
                                    overflow: 'hidden',
                                    backgroundColor: theme.colors.surfaceContainerHigh,
                                }}
                            >
                                <Image
                                    source={arts[name]}
                                    resizeMode="cover"
                                    accessible={false}
                                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                                />
                                <View
                                    pointerEvents="none"
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: theme.colors.scrim,
                                        opacity: 0.32,
                                    }}
                                />
                                <View style={{ padding: 16, gap: 8 }}>
                                    <Text variant="titleLarge" style={{ color: '#FFFFFF' }}>
                                        {name === 'sole' ? 'In the Dark' : '405 / LA Divide'}
                                    </Text>
                                    <Text variant="titleMedium" style={{ color: '#FFFFFF' }}>
                                        {name === 'sole' ? 'Sole R. Rey' : 'Jameer'}
                                    </Text>
                                    <Button
                                        variant={scenario === 'album' ? 'text' : 'outlined'}
                                        shape={scenario === 'photo-outlined' ? 'square' : 'round'}
                                        buttonColor={scenario === 'photo-outlined' ? theme.colors.surface : undefined}
                                        textColor={scenario === 'album' ? theme.colors.inversePrimary : undefined}
                                        style={{ alignSelf: 'flex-start' }}
                                        onPress={() => detail(navigation, 'album', name)}
                                        testID={scenario === 'album' ? 'md-button-album-view' : `md-button-photo-outlined-listen-${name}`}
                                    >
                                        {scenario === 'album' ? 'View album' : 'Listen'}
                                    </Button>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </>,
                `md-button-use-${scenario}`
            );
        if (scenario === 'retry')
            return (
                <View style={safe} onAccessibilityEscape={onBack} testID="md-button-use-retry">
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', padding: 24, gap: 16 }}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        <View style={{ borderRadius: 64, overflow: 'hidden' }}>{image('friends', 602 / 294)}</View>
                        <Text testID="md-button-retry-status">{sent ? 'Message sent.' : 'Message not sent.'}</Text>
                    </ScrollView>
                    <NavigationBar
                        value={navDestination === 'home' ? 'explore' : navDestination}
                        onValueChange={setNavDestination}
                        items={[
                            { key: 'explore', label: 'Explore', icon: 'explore' },
                            { key: 'map', label: 'Map', icon: 'map' },
                            { key: 'profile', label: 'Profile', icon: 'person' },
                        ]}
                        style={{ paddingBottom: insets.bottom }}
                    />
                    <Snackbar
                        visible={retryVisible}
                        onDismiss={() => setRetryVisible(false)}
                        bottomOffset={88}
                        action={{ label: 'Retry', onPress: finishRetry }}
                        testID="md-button-retry-snackbar"
                    >
                        Couldn’t send. Retry in {retryRemaining} seconds.
                    </Snackbar>
                </View>
            );
        if (scenario === 'download')
            return (
                <ThemeProvider theme={textScaleTheme}>
                    {body(
                        <>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    gap: 16,
                                    alignItems: 'center',
                                    backgroundColor: theme.colors.surfaceContainerHigh,
                                    padding: 16,
                                    borderRadius: 8,
                                }}
                            >
                                <View style={{ width: 76 }}>{image('walk', 144 / 142)}</View>
                                <View style={{ flex: 1 }}>
                                    <Text variant="titleLarge">Long Walk</Text>
                                    <Text variant="bodyLarge">L.R. Coleman</Text>
                                </View>
                            </View>
                            <Button
                                variant="tonal"
                                style={{ alignSelf: 'center', maxWidth: '100%' }}
                                loading={download === 'pending'}
                                disabled={download === 'complete'}
                                onPress={() => setDownload('pending')}
                                testID="md-button-download-start"
                            >
                                {download === 'complete' ? 'Playlist available offline' : 'Download playlist for offline access'}
                            </Button>
                        </>,
                        'md-button-use-download',
                        true
                    )}
                </ThemeProvider>
            );
        if (scenario === 'food-order' || scenario === 'recipes')
            return body(
                <Card variant="outlined" style={{ overflow: 'hidden' }}>
                    <View style={{ flexDirection: scenario === 'recipes' && wide ? 'row' : 'column' }}>
                        <View style={scenario === 'recipes' && wide ? { flex: 1, minHeight: 240 } : undefined}>
                            {scenario === 'recipes' && wide ? (
                                <Image
                                    source={arts.recipes}
                                    resizeMode="cover"
                                    accessible={false}
                                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                                />
                            ) : (
                                image(scenario === 'recipes' ? 'recipes' : 'bao', scenario === 'recipes' ? 1020 / 438 : 540 / 186)
                            )}
                        </View>
                        <View style={{ padding: 16, gap: 20, flex: scenario === 'recipes' && wide ? 1 : undefined }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                                <Text variant="headlineMedium" style={{ flexShrink: 1 }}>
                                    {scenario === 'recipes' ? 'Easy recipes kids will love' : 'Pork bao buns'}
                                </Text>
                                {scenario === 'food-order' ? <Text variant="titleLarge">$7.95</Text> : null}
                            </View>
                            <Text variant="bodyLarge">
                                {scenario === 'recipes'
                                    ? 'Forget chicken nuggets and tater tots - these recipes use lots of fresh vegetables and whole grains to craft a meal even your pickiest kid will love!'
                                    : 'Made with barbeque-flavored sha siu pork and steamed to perfection, these pork buns are our most popular menu item.'}
                            </Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: scenario === 'recipes' && !wide ? 'flex-end' : 'space-between',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <Button
                                    style={{ flex: scenario === 'food-order' && wide ? 1 : undefined }}
                                    onPress={() => {
                                        if (scenario === 'food-order') setFoodCount((previous) => previous + 1);
                                        detail(navigation, scenario === 'recipes' ? 'recipes' : 'food-order');
                                    }}
                                    testID={`md-button-${scenario}-${scenario === 'recipes' ? 'see' : 'add'}`}
                                >
                                    {scenario === 'recipes' ? 'See all recipes' : 'Add to order'}
                                </Button>
                                {scenario === 'food-order' ? (
                                    <IconButton
                                        mode="contained-tonal"
                                        icon="delete"
                                        onPress={() => setFoodCount((previous) => Math.max(0, previous - 1))}
                                        accessibilityLabel="Remove Pork bao buns from order"
                                        testID="md-button-food-order-remove"
                                    />
                                ) : null}
                            </View>
                        </View>
                    </View>
                </Card>,
                `md-button-use-${scenario}`
            );
        if (scenario === 'food-checkout')
            return body(
                <>
                    <View style={{ gap: 2, borderRadius: 24, overflow: 'hidden' }}>
                        {[
                            ['1', 'Spicy arugula salad', '$6.00'],
                            ['4', 'Pork buns', '$12.95'],
                            ['1', 'Waffle', '$8.95'],
                        ].map(([quantity, label, price]) => (
                            <View
                                key={label}
                                style={{ flexDirection: 'row', gap: 24, padding: 24, backgroundColor: theme.colors.surfaceContainerHigh }}
                            >
                                <Text style={{ color: theme.colors.primary }}>{quantity}</Text>
                                <Text variant="titleLarge" style={{ flex: 1 }}>
                                    {label}
                                </Text>
                                <Text>{price}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text variant="titleLarge">Delivery fee</Text>
                        <Text variant="titleLarge">Free</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text variant="headlineLarge" style={{ color: theme.colors.primary }}>
                            Total
                        </Text>
                        <Text variant="headlineLarge" style={{ color: theme.colors.primary }}>
                            $27.90
                        </Text>
                    </View>
                    <Button
                        size="medium"
                        style={{ alignSelf: 'flex-end' }}
                        onPress={() => {
                            setFoodOrdered(true);
                            detail(navigation, 'food-checkout');
                        }}
                        testID="md-button-food-checkout-place"
                    >
                        Place order
                    </Button>
                </>,
                'md-button-use-food-checkout',
                true
            );
        return (
            <View style={surface} onAccessibilityEscape={onBack} testID="md-button-use-flights">
                <TopAppBar title="Flights" textAlign="center" navigationIcon="menu" onNavigationPress={() => setFlightMenu(true)} />
                <View style={{ flex: 1, flexDirection: 'row' }}>
                    {wide ? (
                        <NavigationRail
                            items={flightNavigation}
                            value={flightDestination}
                            onValueChange={setFlightDestination}
                            style={{ paddingTop: 24 }}
                        />
                    ) : null}
                    <ScrollView
                        contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: insets.bottom + 24 }}
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        {flightDestination === 'flights' ? (
                            buttonFlights.map((flight, index) => (
                                <View key={flight.id} style={{ gap: 24 }}>
                                    {index < 2 ? <Text variant="titleLarge">{index === 0 ? 'Next' : 'Upcoming'}</Text> : null}
                                    <View
                                        style={{ flexDirection: wide ? 'row' : 'column', gap: 24, alignItems: wide ? 'center' : 'stretch' }}
                                    >
                                        <View style={{ width: wide ? 180 : undefined, gap: 12 }}>
                                            <Text variant="headlineMedium">{flight.date}</Text>
                                            <Text>
                                                {flight.relative} · {flight.duration}
                                            </Text>
                                            {wide ? (
                                                <Button
                                                    onPress={() =>
                                                        detail(navigation, flight.id === 'next' ? 'check-in' : 'flight', flight.id)
                                                    }
                                                    style={{ alignSelf: 'flex-start' }}
                                                    testID={
                                                        index === 0
                                                            ? 'md-button-flights-check-in'
                                                            : `md-button-flights-details-${flight.id}`
                                                    }
                                                >
                                                    {index === 0 ? (checkedIn ? 'Boarding pass' : 'Check in') : 'Flight details'}
                                                </Button>
                                            ) : null}
                                        </View>
                                        {flight.from ? flightCard(flight) : null}
                                        {!wide ? (
                                            <Button
                                                onPress={() => detail(navigation, flight.id === 'next' ? 'check-in' : 'flight', flight.id)}
                                                style={{ alignSelf: 'flex-end' }}
                                                testID={
                                                    index === 0 ? 'md-button-flights-check-in' : `md-button-flights-details-${flight.id}`
                                                }
                                            >
                                                {index === 0 ? (checkedIn ? 'Boarding pass' : 'Check in') : 'Flight details'}
                                            </Button>
                                        ) : null}
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={{ gap: 16 }}>
                                <Text variant="headlineLarge">{flightDestination === 'hotels' ? 'Hotels' : 'Restaurants'}</Text>
                                <Text>{flightDestination === 'hotels' ? 'Your stays near Los Angeles.' : 'Places to eat near LAX.'}</Text>
                                <List.Item
                                    title={flightDestination === 'hotels' ? 'Airport hotel' : 'Café'}
                                    description="Available for your trip"
                                    onPress={() => detail(navigation, flightDestination)}
                                />
                            </View>
                        )}
                    </ScrollView>
                </View>
                {!wide ? (
                    <NavigationBar
                        items={flightNavigation}
                        value={flightDestination}
                        onValueChange={setFlightDestination}
                        style={{ paddingBottom: insets.bottom }}
                        testID="md-button-flights-navigation"
                    />
                ) : null}
                <Dialog visible={flightMenu} onDismiss={() => setFlightMenu(false)}>
                    <Dialog.Title>Travel</Dialog.Title>
                    <Dialog.Content>
                        {flightNavigation.map((item) => (
                            <List.Item
                                key={item.key}
                                title={item.label}
                                leading={<Icon source={item.icon} size={24} />}
                                onPress={() => {
                                    setFlightDestination(item.key);
                                    setFlightMenu(false);
                                }}
                            />
                        ))}
                    </Dialog.Content>
                </Dialog>
            </View>
        );
    };
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: theme.animation.scale === 0 ? 'none' : 'default',
                contentStyle: { backgroundColor: theme.colors.surface },
            }}
        >
            <Stack.Screen name="ButtonMain">{({ navigation }) => main(navigation)}</Stack.Screen>
            <Stack.Screen name="ButtonDetail">
                {({ navigation, route }) => {
                    const { kind, id } = route.params;
                    const flight = buttonFlights.find((item) => item.id === id) ?? buttonFlights[0];
                    const offer = buttonShoppingOffers.find((item) => item.id === id) ?? buttonShoppingOffers[0];
                    const title =
                        (
                            {
                                payment: 'Payment complete',
                                playlist: 'Edit playlist',
                                cart: 'Cart',
                                seller: offer.seller,
                                calendar: '32nd birthday party',
                                sourdough: 'Sourdough bread',
                                album: id === 'jameer' ? '405 / LA Divide' : 'In the Dark',
                                recipes: 'Recipes',
                                recipe: id ?? 'Recipe',
                                'food-order': 'Your order',
                                'food-checkout': 'Order confirmed',
                                'check-in': checkedIn ? 'Boarding pass' : 'Check in',
                                meeting: 'Appointment',
                                flight: 'Flight details',
                            } as Record<string, string>
                        )[kind] ?? kind;
                    return (
                        <View style={surface} onAccessibilityEscape={() => navigation.goBack()} testID="md-button-detail">
                            <TopAppBar
                                title={title}
                                navigationIcon="arrow_back"
                                navigationLabel="Back"
                                onNavigationPress={() => navigation.goBack()}
                            />
                            <ScrollView
                                contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: insets.bottom + 24 }}
                                showsVerticalScrollIndicator={false}
                                showsHorizontalScrollIndicator={false}
                            >
                                {kind === 'payment' ? (
                                    <>
                                        <Icon source="check_circle" size={64} color={theme.colors.primary} />
                                        <Text variant="headlineLarge">$159.32</Text>
                                        <Text>Paid to So Duri · @so-duri</Text>
                                        <Text>Payment complete.</Text>
                                    </>
                                ) : null}
                                {kind === 'playlist' ? (
                                    <>
                                        <TextField
                                            label="Playlist name"
                                            value={playlistDraft}
                                            onChangeText={setPlaylistDraft}
                                            testID="md-button-playlist-name"
                                        />
                                        <Button
                                            disabled={!playlistDraft.trim()}
                                            style={{ alignSelf: 'flex-start' }}
                                            onPress={() => {
                                                setPlaylistName(playlistDraft.trim());
                                                navigation.goBack();
                                            }}
                                            testID="md-button-playlist-save"
                                        >
                                            Save
                                        </Button>
                                        <Text testID="md-button-playlist-saved-name">{playlistName}</Text>
                                    </>
                                ) : null}
                                {kind === 'cart' ? (
                                    <>
                                        {cart.map((entry, index) => (
                                            <List.Item
                                                key={index}
                                                multiAction
                                                title={entry.title}
                                                description={entry.details}
                                                trailing={
                                                    <IconButton
                                                        icon="delete"
                                                        accessibilityLabel={`Remove item ${index + 1}`}
                                                        onPress={() => setCart((previous) => previous.filter((_, at) => at !== index))}
                                                        testID={`md-button-cart-remove-${index}`}
                                                    />
                                                }
                                            />
                                        ))}
                                        <Text testID="md-button-cart-count">{cart.length} items in your cart</Text>
                                        <Button
                                            disabled={!cart.length}
                                            style={{ alignSelf: 'flex-start' }}
                                            onPress={() => {
                                                setFoodOrdered(true);
                                                detail(navigation, 'food-checkout');
                                            }}
                                            testID="md-button-cart-checkout"
                                        >
                                            Checkout
                                        </Button>
                                    </>
                                ) : null}
                                {kind === 'seller' ? (
                                    <>
                                        <Text variant="headlineLarge">{offer.price}</Text>
                                        <Text>{offer.tax}</Text>
                                        <Text>Total {offer.total}</Text>
                                        <Button
                                            style={{ alignSelf: 'flex-start' }}
                                            onPress={() => {
                                                setCart((previous) => [
                                                    ...previous,
                                                    {
                                                        title: `${offer.seller} offer`,
                                                        details: `${offer.price} · ${offer.tax} · Total ${offer.total}`,
                                                    },
                                                ]);
                                                detail(navigation, 'cart');
                                            }}
                                            testID="md-button-seller-add"
                                        >
                                            Add to cart
                                        </Button>
                                    </>
                                ) : null}
                                {kind === 'calendar' ? (
                                    <>
                                        <Icon source={calendarAdded ? 'event_available' : 'event'} size={48} />
                                        <Text variant="headlineMedium">November 2nd at 7pm</Text>
                                        <Text>Café Amelie</Text>
                                        <Text testID="md-button-calendar-saved">
                                            {calendarAdded ? 'Added to your calendar.' : 'Not added.'}
                                        </Text>
                                        <Button
                                            variant="text"
                                            style={{ alignSelf: 'flex-start' }}
                                            onPress={() => setCalendarAdded((previous) => !previous)}
                                            testID="md-button-calendar-remove"
                                        >
                                            {calendarAdded ? 'Remove from calendar' : 'Add to calendar'}
                                        </Button>
                                    </>
                                ) : null}
                                {kind === 'sourdough' ? (
                                    <>
                                        {image('sourdough', 694 / 104)}
                                        <Text variant="headlineMedium">A naturally leavened loaf</Text>
                                        <Text>
                                            Sourdough uses an active starter made from flour and water. Wild yeast helps the dough rise,
                                            while lactic acid bacteria produce its characteristic tang.
                                        </Text>
                                        <Text>
                                            Feed the starter, mix flour and water, allow the dough to ferment, then shape and bake it in a
                                            hot oven.
                                        </Text>
                                    </>
                                ) : null}
                                {kind === 'recipes' ? (
                                    <>
                                        {image('recipes', 1020 / 438)}
                                        <Text variant="headlineMedium">Easy recipes kids will love</Text>
                                        {['Vegetable tacos', 'Fresh salsa', 'Sourdough bread'].map((recipe) => (
                                            <List.Item
                                                key={recipe}
                                                title={recipe}
                                                leading={<Icon source="menu_book" size={24} />}
                                                onPress={() =>
                                                    detail(navigation, recipe === 'Sourdough bread' ? 'sourdough' : 'recipe', recipe)
                                                }
                                            />
                                        ))}
                                    </>
                                ) : null}
                                {kind === 'recipe' ? (
                                    <>
                                        {image('recipes', 1020 / 438)}
                                        <Text variant="headlineMedium">{id}</Text>
                                        <Text>
                                            {id === 'Fresh salsa'
                                                ? 'Chop tomatoes, onion and cilantro. Combine with lime juice and season to taste.'
                                                : 'Warm the tortillas, fill them with roasted vegetables and top with fresh salsa.'}
                                        </Text>
                                    </>
                                ) : null}
                                {kind === 'album' ? (
                                    <>
                                        {image(id === 'jameer' ? 'jameer' : 'sole', id === 'jameer' ? 480 / 220 : 430 / 198)}
                                        <Text variant="headlineMedium">{id === 'jameer' ? '405 / LA Divide' : 'In the Dark'}</Text>
                                        {buttonAudioTracks.map((item, index) => (
                                            <List.Item
                                                key={item.id}
                                                multiAction
                                                title={item.title}
                                                description={item.artist}
                                                trailing={
                                                    <IconButton
                                                        icon={playing && track === index ? 'pause' : 'play_arrow'}
                                                        accessibilityLabel={`${playing && track === index ? 'Pause' : 'Play'} ${item.title}`}
                                                        onPress={() => toggleTrack(index)}
                                                    />
                                                }
                                            />
                                        ))}
                                    </>
                                ) : null}
                                {kind === 'food-order' ? (
                                    <>
                                        {image('bao', 540 / 186)}
                                        <Text variant="headlineMedium">Pork bao buns</Text>
                                        <Text testID="md-button-food-order-count">{foodCount} × $7.95</Text>
                                        <Button
                                            disabled={!foodCount}
                                            style={{ alignSelf: 'flex-start' }}
                                            onPress={() => {
                                                setFoodOrdered(true);
                                                detail(navigation, 'food-checkout');
                                            }}
                                            testID="md-button-food-order-checkout"
                                        >
                                            Place order
                                        </Button>
                                    </>
                                ) : null}
                                {kind === 'food-checkout' ? (
                                    <>
                                        <Icon source="check_circle" size={64} />
                                        <Text variant="headlineMedium">{foodOrdered ? 'Your order is confirmed.' : 'Your order'}</Text>
                                        <Text>
                                            {cart.length
                                                ? cart.map((entry) => `${entry.title} · ${entry.details}`).join(', ')
                                                : foodCount
                                                  ? `${foodCount} × Pork bao buns`
                                                  : 'Spicy arugula salad, Pork buns and Waffle'}
                                        </Text>
                                    </>
                                ) : null}
                                {kind === 'check-in' || kind === 'flight' ? (
                                    <>
                                        {flight.from ? (
                                            <Text variant="headlineLarge">
                                                {flight.from} → {flight.to}
                                            </Text>
                                        ) : null}
                                        <Text>
                                            {flight.date} · {flight.departure ? `${flight.departure} – ${flight.arrival}` : flight.duration}
                                        </Text>
                                        {flight.flight ? (
                                            <Text>
                                                Flight {flight.flight} · Booking {flight.booking}
                                            </Text>
                                        ) : null}
                                        {flight.terminal ? (
                                            <Text>
                                                Terminal {flight.terminal} · Gate {flight.gate}
                                            </Text>
                                        ) : null}
                                        {kind === 'check-in' ? (
                                            checkedIn ? (
                                                <Text testID="md-button-boarding-pass">
                                                    You’re checked in. Boarding pass · {flight.booking}
                                                </Text>
                                            ) : (
                                                <Button
                                                    style={{ alignSelf: 'flex-start' }}
                                                    onPress={() => setCheckedIn(true)}
                                                    testID="md-button-flights-confirm"
                                                >
                                                    Confirm check in
                                                </Button>
                                            )
                                        ) : null}
                                    </>
                                ) : null}
                                {kind === 'meeting' ? (
                                    <>
                                        <Text variant="headlineLarge">Appointment</Text>
                                        <Text>Your response: {rsvp}</Text>
                                        <Button
                                            selected={inCall}
                                            style={{ alignSelf: 'flex-start' }}
                                            onPress={() => setInCall((previous) => !previous)}
                                            testID="md-button-meeting-join"
                                        >
                                            {inCall ? 'Leave meeting' : 'Join meeting'}
                                        </Button>
                                    </>
                                ) : null}
                                {kind === 'hotels' || kind === 'restaurants' ? (
                                    <>
                                        <Text variant="headlineMedium">{kind === 'hotels' ? 'Airport hotel' : 'Café'}</Text>
                                        <Text>Saved with your Los Angeles trip.</Text>
                                    </>
                                ) : null}
                            </ScrollView>
                        </View>
                    );
                }}
            </Stack.Screen>
        </Stack.Navigator>
    );
}
