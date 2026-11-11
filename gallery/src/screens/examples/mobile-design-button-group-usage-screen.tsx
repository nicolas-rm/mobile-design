import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider } from 'react-native-paper';
import {
    Avatar,
    Button,
    ButtonGroup,
    Dialog,
    Icon,
    IconButton,
    List,
    NavigationBar,
    NavigationRail,
    SearchView,
    Switch,
    Text,
    TextField,
    TopAppBar,
    useMobileTheme,
    type ButtonGroupItem,
} from 'mobile-design/react-native';
import {
    buttonGroupFiles,
    buttonGroupPlaces,
    initialCalculator,
    updateCalculator,
    type ButtonGroupUsageScenario,
} from './mobile-design-button-group-usage-data';
import { ReferenceArt } from './mobile-design-reference-art';

type GroupRoutes = { GroupMain: undefined; GroupDetail: { id: string }; GroupSetup: undefined; GroupCompose: undefined };
type GroupNavigation = NativeStackNavigationProp<GroupRoutes>;
const Stack = createNativeStackNavigator<GroupRoutes>();

// Keep the same title and controls mounted throughout the closing animation.
function useDialogContent<T extends string>() {
    const [content, setContent] = useState<T | null>(null);
    const [visible, setVisible] = useState(false);
    const change = (next: T | null) => {
        if (next !== null) setContent(next);
        setVisible(next !== null);
    };
    return [content, visible, change] as const;
}
const musicTracks = [
    { title: 'The Lawerence tree', duration: '1:20' },
    { title: 'Parenthesis', duration: '2:11' },
    { title: 'Hold My Head', duration: '1:46' },
    { title: 'So They Say', duration: '1:25' },
] as const;
const musicDestinations = [
    { key: 'home', label: 'Home', icon: 'music_note' },
    { key: 'browse', label: 'Browse', icon: 'apps' },
    { key: 'radio', label: 'Radio', icon: 'radio' },
    { key: 'library', label: 'Library', icon: 'library_music' },
] as const;

/** Real controls surround the group; these session-local contexts adapt the MD3 figures and clips. */
export function ButtonGroupUsageContent({ scenario, onBack }: { scenario: ButtonGroupUsageScenario; onBack: () => void }) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const focused = useIsFocused();
    const [language, setLanguage] = useState('English');
    const [preferences, preferencesVisible, setPreferences] = useDialogContent<'language' | 'accessibility'>();
    const [largerText, setLargerText] = useState(false);
    const [reduced, setReduced] = useState(false);
    const motionForced = theme.animation.scale === 0;
    const motionReduced = motionForced || reduced;
    const [name, setName] = useState('');
    const [registered, setRegistered] = useState(false);
    const [callValues, setCallValues] = useState<string[]>(['mic']);
    const [callEnded, setCallEnded] = useState(false);
    const [callPanel, callPanelVisible, setCallPanel] = useDialogContent<'Reactions' | 'Chat'>();
    const [callReaction, setCallReaction] = useState<{ icon: string; label: string } | null>(null);
    const [chat, setChat] = useState('');
    const [messages, setMessages] = useState(['Lee: The presentation is ready.']);
    const [fileDestination, setFileDestination] = useState('my-files');
    const [fileSearch, setFileSearch] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const pendingFile = useRef<string | null>(null);
    const [size, setSize] = useState('8oz');
    const [cart, setCart] = useState<string[]>([]);
    const [sort, setSort] = useState('relevance');
    const [prices, setPrices] = useState<string[]>(['$', '$$']);
    const [filtersApplied, setFiltersApplied] = useState(false);
    const [calculator, setCalculator] = useState(initialCalculator);
    const [musicPlaying, setMusicPlaying] = useState(false);
    const [favorite, setFavorite] = useState(false);
    const [shuffle, setShuffle] = useState(false);
    const [track, setTrack] = useState('The Lawerence tree');
    const [musicMenu, setMusicMenu] = useState(false);
    const [playlistSaved, setPlaylistSaved] = useState(false);
    const [musicDestination, setMusicDestination] = useState('home');
    const wideMusic = width >= 600;
    // Keep the published portrait composition; constrain only its wide-window adaptation.
    const musicPanelWidth = Math.max(
        160,
        Math.min(320, height - insets.top - insets.bottom - 128, (width - insets.left - insets.right - 96 - 72) * 0.46)
    );
    const [socialFavorite, setSocialFavorite] = useState(false);
    const [socialReaction, setSocialReaction] = useState('');
    const [socialMenu, socialMenuVisible, setSocialMenu] = useDialogContent<'more' | 'reaction'>();
    const [mailState, setMailState] = useState<'inbox' | 'archived' | 'deleted'>('inbox');
    const [mailDialog, mailDialogVisible, setMailDialog] = useDialogContent<'delete' | 'more'>();
    const [shareError, setShareError] = useState('');
    const pendingShare = useRef<{ owner: 'social' | 'email'; message: string } | null>(null);
    const shareEpoch = useRef(0);
    useEffect(() => {
        shareEpoch.current++;
        pendingShare.current = null;
        return () => {
            shareEpoch.current++;
            pendingShare.current = null;
        };
    }, [focused, scenario]);
    const shareAfterClose = (owner: 'social' | 'email') => {
        const pending = pendingShare.current;
        if (!pending || pending.owner !== owner) return;
        pendingShare.current = null;
        if (!focused) return;
        setShareError('');
        const epoch = shareEpoch.current;
        void Share.share({ message: pending.message }).catch(() => {
            if (shareEpoch.current === epoch) setShareError('Could not open sharing. Please try again.');
        });
    };
    const [mailBody, setMailBody] = useState('');
    const [mailSent, setMailSent] = useState(false);
    const [mailStarred, setMailStarred] = useState(false);
    const surface = { flex: 1, backgroundColor: theme.colors.surface } as const;
    const referenceSurface = { ...surface, paddingTop: insets.top };
    const textTheme = {
        ...theme,
        animation: { ...theme.animation, scale: motionReduced ? 0 : theme.animation.scale },
        fonts: largerText
            ? (Object.fromEntries(
                  Object.entries(theme.fonts).map(([key, font]) => [
                      key,
                      { ...font, ...('fontSize' in font ? { fontSize: font.fontSize * 1.25, lineHeight: font.lineHeight * 1.25 } : {}) },
                  ])
              ) as typeof theme.fonts)
            : theme.fonts,
    };
    const visibleFiles = buttonGroupFiles.filter(
        (file) => file.destination === fileDestination && file.name.toLowerCase().includes(fileSearch.toLowerCase())
    );
    const filteredPlaces = buttonGroupPlaces
        .filter((place) => !prices.length || prices.includes(place.price))
        .sort((left, right) => (sort === 'distance' ? left.distance - right.distance : left.relevance - right.relevance));
    const bar = (title: string, navigation?: GroupNavigation) => (
        <TopAppBar
            title={title}
            navigationIcon="arrow_back"
            navigationLabel="Back"
            onNavigationPress={navigation ? () => navigation.goBack() : onBack}
            testID="md-button-group-use-bar"
        />
    );
    const main = (navigation: GroupNavigation) => {
        if (scenario === 'welcome')
            return (
                <ThemeProvider theme={textTheme}>
                    <View style={referenceSurface} onAccessibilityEscape={onBack} testID="md-button-group-use-welcome">
                        <View style={{ flex: 1, justifyContent: 'flex-end', padding: 24 }}>
                            <Text
                                variant="displayLarge"
                                style={{ color: theme.colors.primary, fontWeight: '700' }}
                                testID="md-button-group-welcome-title"
                            >
                                {language === 'Español' ? 'Bienvenido' : language === 'Français' ? 'Bienvenue' : 'Welcome'}
                            </Text>
                        </View>
                        <View style={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
                            <ButtonGroup
                                size="large"
                                fullWidth
                                items={[
                                    {
                                        value: 'accessibility',
                                        label: 'Accessibility',
                                        icon: 'accessibility_new',
                                        iconOnly: true,
                                        widthVariant: 'narrow',
                                        onPress: () => setPreferences('accessibility'),
                                    },
                                    {
                                        value: 'start',
                                        label: language === 'Español' ? 'Comenzar' : language === 'Français' ? 'Commencer' : 'Get started',
                                        variant: 'filled',
                                        buttonColor: theme.colors.tertiary,
                                        textColor: theme.colors.onTertiary,
                                        onPress: () => navigation.navigate('GroupSetup'),
                                    },
                                    {
                                        value: 'language',
                                        label: 'Language',
                                        icon: 'language',
                                        iconOnly: true,
                                        widthVariant: 'narrow',
                                        onPress: () => setPreferences('language'),
                                    },
                                ]}
                                testID="md-button-group-welcome-actions"
                            />
                        </View>
                        <Dialog visible={preferencesVisible} onDismiss={() => setPreferences(null)}>
                            <Dialog.Title>{preferences === 'language' ? 'Language' : 'Accessibility'}</Dialog.Title>
                            <Dialog.Content>
                                {preferences === 'language' ? (
                                    ['English', 'Español', 'Français'].map((item) => (
                                        <List.Item
                                            key={item}
                                            title={item}
                                            selectionMode="single"
                                            selected={language === item}
                                            leading={
                                                <Icon
                                                    source={language === item ? 'radio_button_checked' : 'radio_button_unchecked'}
                                                    size={24}
                                                />
                                            }
                                            onPress={() => {
                                                setLanguage(item);
                                                setPreferences(null);
                                            }}
                                            testID={`md-button-group-language-${item}`}
                                        />
                                    ))
                                ) : (
                                    <View style={{ gap: 16 }}>
                                        <List.Item
                                            title="Larger text"
                                            multiAction
                                            trailing={
                                                <Switch
                                                    value={largerText}
                                                    onValueChange={setLargerText}
                                                    accessibilityLabel="Larger text"
                                                    testID="md-button-group-larger-text"
                                                />
                                            }
                                        />
                                        <List.Item
                                            title="Reduce motion"
                                            multiAction
                                            trailing={
                                                <Switch
                                                    value={motionReduced}
                                                    disabled={motionForced}
                                                    onValueChange={(value) => {
                                                        if (!motionForced) setReduced(value);
                                                    }}
                                                    accessibilityLabel="Reduce motion"
                                                    testID="md-button-group-reduce-motion"
                                                />
                                            }
                                        />
                                    </View>
                                )}
                            </Dialog.Content>
                            {preferences === 'accessibility' ? (
                                <Dialog.Actions>
                                    <Button variant="text" onPress={() => setPreferences(null)} testID="md-button-group-preferences-done">
                                        Done
                                    </Button>
                                </Dialog.Actions>
                            ) : null}
                        </Dialog>
                    </View>
                </ThemeProvider>
            );
        if (scenario === 'call') {
            const micOff = callValues.includes('mic'),
                cameraOff = callValues.includes('camera');
            return (
                <View style={referenceSurface} onAccessibilityEscape={onBack} testID="md-button-group-use-call">
                    {!cameraOff && !callEnded ? (
                        <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
                            <ReferenceArt name="call" />
                        </View>
                    ) : null}
                    <View
                        style={{
                            flex: 1,
                            margin: 16,
                            borderRadius: 28,
                            backgroundColor: cameraOff || callEnded ? theme.colors.surfaceContainer : 'transparent',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 24,
                        }}
                    >
                        {cameraOff || callEnded ? (
                            <>
                                <Avatar.Text size={112} label="L" />
                                <Text variant="headlineMedium">{callEnded ? 'Call ended' : 'Lee'}</Text>
                            </>
                        ) : null}
                        {cameraOff && !callEnded ? <Icon source="videocam_off" size={32} /> : null}
                        {!callEnded && callValues.includes('captions') ? (
                            <Text style={{ paddingHorizontal: 24 }} testID="md-button-group-call-caption">
                                Lee: Let’s look at the next slide.
                            </Text>
                        ) : null}
                        {!callEnded && callValues.includes('hand') ? (
                            <Text testID="md-button-group-call-hand">Your hand is raised</Text>
                        ) : null}
                        {!callEnded && callReaction ? (
                            <View
                                accessible
                                accessibilityLiveRegion="polite"
                                accessibilityLabel={`Your reaction: ${callReaction.label}`}
                                style={{ alignItems: 'center', gap: 8 }}
                                testID="md-button-group-call-reaction"
                            >
                                <Icon source={callReaction.icon} size={40} />
                                <Text>{callReaction.label}</Text>
                            </View>
                        ) : null}
                        {callEnded ? (
                            <Button
                                onPress={() => {
                                    setCallEnded(false);
                                    setCallValues(['mic']);
                                }}
                                testID="md-button-group-call-rejoin"
                            >
                                Rejoin
                            </Button>
                        ) : null}
                    </View>
                    {!callEnded ? (
                        <View
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, paddingBottom: insets.bottom + 16 }}
                        >
                            <ButtonGroup
                                size={width >= 600 ? 'medium' : 'small'}
                                fullWidth
                                selectionMode="multiple"
                                showSelectedIcon={false}
                                value={callValues}
                                onValueChange={(next) =>
                                    setCallValues(
                                        (typeof next === 'string' ? [next] : next).filter((value) =>
                                            ['camera', 'mic', 'hand', 'captions'].includes(value)
                                        )
                                    )
                                }
                                style={{ flex: 1, minWidth: 0 }}
                                items={[
                                    {
                                        value: 'camera',
                                        label: cameraOff ? 'Turn camera on' : 'Turn camera off',
                                        icon: cameraOff ? 'videocam_off_fill1' : 'videocam',
                                        iconOnly: true,
                                    },
                                    {
                                        value: 'mic',
                                        label: micOff ? 'Unmute microphone' : 'Mute microphone',
                                        icon: micOff ? 'mic_off_fill1' : 'mic',
                                        iconOnly: true,
                                    },
                                    {
                                        value: 'reactions',
                                        label: 'Reactions',
                                        selectionMode: 'none',
                                        icon: 'sentiment_satisfied',
                                        iconOnly: true,
                                        onPress: () => setCallPanel('Reactions'),
                                    },
                                    {
                                        value: 'hand',
                                        label: callValues.includes('hand') ? 'Lower hand' : 'Raise hand',
                                        icon: callValues.includes('hand') ? 'front_hand_fill1' : 'front_hand',
                                        iconOnly: true,
                                    },
                                    {
                                        value: 'captions',
                                        label: callValues.includes('captions') ? 'Turn captions off' : 'Turn captions on',
                                        icon: callValues.includes('captions') ? 'closed_caption_fill1' : 'closed_caption',
                                        iconOnly: true,
                                    },
                                    {
                                        value: 'chat',
                                        label: 'Chat',
                                        selectionMode: 'none',
                                        icon: 'chat_bubble',
                                        iconOnly: true,
                                        onPress: () => setCallPanel('Chat'),
                                    },
                                ]}
                                testID="md-button-group-call-controls"
                            />
                            <IconButton
                                icon="call_end"
                                mode="contained-tonal"
                                sizeClass={width >= 600 ? 'medium' : 'small'}
                                widthVariant="wide"
                                containerColor={theme.colors.tertiaryContainer}
                                iconColor={theme.colors.onTertiaryContainer}
                                accessibilityLabel="Leave call"
                                onPress={() => {
                                    setCallEnded(true);
                                    setCallPanel(null);
                                    setCallReaction(null);
                                }}
                                testID="md-button-group-call-end"
                            />
                        </View>
                    ) : null}
                    <Dialog visible={callPanelVisible} onDismiss={() => setCallPanel(null)}>
                        <Dialog.Title>{callPanel}</Dialog.Title>
                        <Dialog.Content>
                            {callPanel === 'Chat' ? (
                                <View style={{ gap: 16 }}>
                                    {messages.map((message, index) => (
                                        <Text key={index}>{message}</Text>
                                    ))}
                                    <TextField
                                        value={chat}
                                        onChangeText={setChat}
                                        label="Message"
                                        multiline
                                        testID="md-button-group-chat-field"
                                    />
                                </View>
                            ) : (
                                <ButtonGroup
                                    items={[
                                        {
                                            value: 'applause',
                                            label: 'Applause',
                                            icon: 'waving_hand',
                                            iconOnly: true,
                                            onPress: () => {
                                                setCallReaction({ icon: 'waving_hand', label: 'Applause' });
                                                setCallPanel(null);
                                            },
                                        },
                                        {
                                            value: 'like',
                                            label: 'Like',
                                            icon: 'thumb_up',
                                            iconOnly: true,
                                            onPress: () => {
                                                setCallReaction({ icon: 'thumb_up', label: 'Like' });
                                                setCallPanel(null);
                                            },
                                        },
                                    ]}
                                    testID="md-button-group-reactions"
                                />
                            )}
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button variant="text" onPress={() => setCallPanel(null)}>
                                Close
                            </Button>
                            {callPanel === 'Chat' ? (
                                <Button
                                    variant="text"
                                    disabled={!chat.trim()}
                                    onPress={() => {
                                        setMessages((previous) => [...previous, `You: ${chat.trim()}`]);
                                        setChat('');
                                    }}
                                    testID="md-button-group-chat-send"
                                >
                                    Send
                                </Button>
                            ) : null}
                        </Dialog.Actions>
                    </Dialog>
                </View>
            );
        }
        if (scenario === 'files')
            return (
                <View style={referenceSurface} onAccessibilityEscape={onBack} testID="md-button-group-use-files">
                    <Text variant="headlineLarge" style={{ padding: 16, paddingStart: 80 }}>
                        Folders
                    </Text>
                    <View style={{ padding: 16, gap: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <Avatar.Button
                                accessibilityLabel="Account"
                                onPress={() => navigation.navigate('GroupDetail', { id: 'account' })}
                            >
                                <Avatar.Image size={32} source={require('./assets/button-groups-reference/files-avatar.png')} />
                            </Avatar.Button>
                            <ButtonGroup
                                variant="connected"
                                style={{ flex: 1, minWidth: 0 }}
                                showSelectedIcon={false}
                                value={fileDestination}
                                onValueChange={(next) => {
                                    setFileDestination(String(next));
                                    setFileSearch('');
                                }}
                                items={[
                                    { value: 'my-files', label: 'My files', weight: 1 },
                                    { value: 'shared', label: 'Shared', weight: 1 },
                                    { value: 'computers', label: 'Computers', weight: 1 },
                                ]}
                                testID="md-button-group-files-destinations"
                            />
                        </View>
                        <SearchView
                            open={searchOpen}
                            onOpenChange={setSearchOpen}
                            value={fileSearch}
                            onChangeText={setFileSearch}
                            onSearch={() => {}}
                            placeholder="Search files"
                            results={visibleFiles.map((file) => ({
                                key: file.id,
                                title: file.name,
                                icon: file.icon,
                                description: file.description,
                            }))}
                            onResultPress={(file) => {
                                pendingFile.current = file.key;
                                setSearchOpen(false);
                            }}
                            onClosed={() => {
                                const id = pendingFile.current;
                                pendingFile.current = null;
                                if (id) navigation.navigate('GroupDetail', { id });
                            }}
                            testID="md-button-group-files-search"
                        />
                    </View>
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        {visibleFiles.map((file) => (
                            <List.Item
                                key={file.id}
                                title={file.name}
                                leading={<Icon source={file.icon} size={24} />}
                                onPress={() => navigation.navigate('GroupDetail', { id: file.id })}
                                testID={`md-button-group-file-${file.id}`}
                            />
                        ))}
                        {!visibleFiles.length ? <Text style={{ padding: 24 }}>No files match your search.</Text> : null}
                    </ScrollView>
                </View>
            );
        if (scenario === 'shopping')
            return (
                <View style={referenceSurface} onAccessibilityEscape={onBack} testID="md-button-group-use-shopping">
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: 'flex-end',
                            padding: 24,
                            gap: 24,
                            paddingBottom: insets.bottom + 48,
                        }}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant }} />
                        <Text variant="titleMedium">Select size</Text>
                        <ButtonGroup
                            variant="connected"
                            value={size}
                            onValueChange={(next) => setSize(String(next))}
                            items={['8oz', '12oz', '16oz'].map((label) => ({ value: label, label, weight: 1 }))}
                            testID="md-button-group-shopping-sizes"
                        />
                        <Button
                            buttonColor={theme.colors.tertiary}
                            textColor={theme.colors.onTertiary}
                            style={{ alignSelf: 'stretch' }}
                            onPress={() => {
                                setCart((previous) => [...previous, size]);
                                navigation.navigate('GroupDetail', { id: 'cart' });
                            }}
                            testID="md-button-group-add-to-cart"
                        >
                            Add to cart
                        </Button>
                    </ScrollView>
                </View>
            );
        if (scenario === 'filters')
            return (
                <ThemeProvider theme={textTheme}>
                    <View style={surface} onAccessibilityEscape={onBack} testID="md-button-group-use-filters">
                        <TopAppBar
                            title={filtersApplied ? 'Places' : 'Filters'}
                            navigationIcon={filtersApplied ? 'arrow_back' : 'close'}
                            navigationLabel={filtersApplied ? 'Back' : 'Close'}
                            onNavigationPress={filtersApplied ? () => setFiltersApplied(false) : onBack}
                            trailing={
                                !filtersApplied ? (
                                    <Button variant="text" onPress={() => setFiltersApplied(true)} testID="md-button-group-filters-done">
                                        Done
                                    </Button>
                                ) : undefined
                            }
                            testID="md-button-group-use-bar"
                        />
                        {!filtersApplied ? (
                            <View style={{ padding: 24, gap: 24 }}>
                                <Text variant="titleMedium">Sort by</Text>
                                <ButtonGroup
                                    variant="connected"
                                    value={sort}
                                    onValueChange={(next) => setSort(String(next))}
                                    items={[
                                        { value: 'relevance', label: 'Relevance', weight: 1 },
                                        { value: 'distance', label: 'Distance', weight: 1 },
                                    ]}
                                    testID="md-button-group-filter-sort"
                                />
                                <Text variant="titleMedium">Price</Text>
                                <ButtonGroup
                                    variant="connected"
                                    selectionMode="multiple"
                                    value={prices}
                                    onValueChange={(next) => setPrices(typeof next === 'string' ? [next] : next)}
                                    items={['$', '$$', '$$$', '$$$$'].map((label) => ({ value: label, label, weight: 1 }))}
                                    testID="md-button-group-filter-prices"
                                />
                            </View>
                        ) : (
                            <ScrollView
                                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                                showsVerticalScrollIndicator={false}
                                showsHorizontalScrollIndicator={false}
                            >
                                <Text variant="labelLarge" style={{ padding: 16 }} testID="md-button-group-filter-results">
                                    {filteredPlaces.length} places · {sort === 'distance' ? 'Distance' : 'Relevance'}
                                </Text>
                                {filteredPlaces.map((place) => (
                                    <List.Item
                                        key={place.id}
                                        title={place.name}
                                        description={`${place.price} · ${place.distance} km`}
                                        leading={<Icon source="restaurant" size={24} />}
                                        onPress={() => navigation.navigate('GroupDetail', { id: place.id })}
                                        testID={`md-button-group-place-${place.id}`}
                                    />
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </ThemeProvider>
            );
        if (scenario === 'calculator')
            return (
                <View style={referenceSurface} onAccessibilityEscape={onBack} testID="md-button-group-use-calculator">
                    <View style={{ flex: 1, padding: 24, justifyContent: 'flex-end', alignItems: 'flex-end', gap: 16 }}>
                        <Text variant="titleMedium" accessibilityLiveRegion="polite">
                            {calculator.expression}
                        </Text>
                        <Text variant="displayLarge" adjustsFontSizeToFit numberOfLines={1} testID="md-button-group-calculator-result">
                            {calculator.entry}
                        </Text>
                    </View>
                    <View style={{ padding: 16, paddingBottom: insets.bottom + 16, gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} testID="md-button-group-calculator-functions">
                            {['√', 'π', 'e', '!'].map((key) => (
                                <IconButton
                                    key={key}
                                    icon={({ color }) => (
                                        <Text variant="titleMedium" style={{ color }}>
                                            {key}
                                        </Text>
                                    )}
                                    style={{ flex: 1, margin: 0 }}
                                    accessibilityLabel={
                                        key === '√' ? 'Square root' : key === 'π' ? 'Pi' : key === 'e' ? 'Euler’s number' : 'Factorial'
                                    }
                                    onPress={() => setCalculator((previous) => updateCalculator(previous, key))}
                                    testID={`md-button-group-calculator-function-${key}`}
                                />
                            ))}
                            <IconButton
                                icon="backspace_fill1"
                                style={{ flex: 1, margin: 0 }}
                                accessibilityLabel="Delete last character"
                                onPress={() => setCalculator((previous) => updateCalculator(previous, 'backspace'))}
                                testID="md-button-group-calculator-function-backspace"
                            />
                        </View>
                        {[
                            ['AC', '()', '%', '÷'],
                            ['7', '8', '9', '×'],
                            ['4', '5', '6', '−'],
                            ['1', '2', '3', '+'],
                            ['0', '.', '='],
                        ].map((row, index) => (
                            <ButtonGroup
                                key={index}
                                size="medium"
                                fullWidth
                                buttonVariant="tonal"
                                items={row.map((key) => ({
                                    value: key,
                                    label: key,
                                    iconOnly: true,
                                    icon: ({ color }: { color: string }) => (
                                        <Text variant="titleLarge" style={{ color }}>
                                            {key}
                                        </Text>
                                    ),
                                    weight: key === '=' ? 2 : ['+', '−', '×', '÷'].includes(key) ? 0.75 : 1,
                                    buttonColor:
                                        key === '='
                                            ? theme.colors.tertiaryContainer
                                            : ['+', '−', '×', '÷'].includes(key)
                                              ? theme.colors.secondaryContainer
                                              : theme.colors.surfaceContainerLow,
                                    textColor:
                                        key === '='
                                            ? theme.colors.onTertiaryContainer
                                            : ['+', '−', '×', '÷'].includes(key)
                                              ? theme.colors.onSecondaryContainer
                                              : theme.colors.onSurface,
                                    widthVariant: key === '=' ? 'wide' : ['+', '−', '×', '÷'].includes(key) ? 'narrow' : 'default',
                                    onPress: () => setCalculator((previous) => updateCalculator(previous, key)),
                                }))}
                                testID={`md-button-group-calculator-row-${index}`}
                            />
                        ))}
                    </View>
                </View>
            );
        if (scenario === 'social')
            return (
                <View style={referenceSurface} onAccessibilityEscape={onBack} testID="md-button-group-use-social">
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 24, gap: 16 }}>
                        <ButtonGroup
                            fullWidth
                            shape="square"
                            style={{ flex: 1, minWidth: 0 }}
                            items={[
                                {
                                    value: 'more',
                                    label: 'More options',
                                    icon: 'more_vert',
                                    iconOnly: true,
                                    widthVariant: 'narrow',
                                    onPress: () => setSocialMenu('more'),
                                },
                                {
                                    value: 'favorite',
                                    label: socialFavorite ? 'Remove favorite' : 'Favorite',
                                    icon: socialFavorite ? 'favorite_fill1' : 'favorite_border',
                                    iconOnly: true,
                                    onPress: () => setSocialFavorite(!socialFavorite),
                                },
                                {
                                    value: 'reaction',
                                    label: 'Add reaction',
                                    icon: socialReaction || 'add_reaction',
                                    iconOnly: true,
                                    widthVariant: 'wide',
                                    buttonColor: theme.colors.tertiaryContainer,
                                    textColor: theme.colors.onTertiaryContainer,
                                    onPress: () => setSocialMenu('reaction'),
                                },
                            ]}
                            testID="md-button-group-social-actions"
                        />
                        <Avatar.Button
                            accessibilityLabel="Photo author"
                            onPress={() => navigation.navigate('GroupDetail', { id: 'account' })}
                        >
                            <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden' }}>
                                <ReferenceArt name="photo-avatar" />
                            </View>
                        </Avatar.Button>
                    </View>
                    <View
                        style={{ aspectRatio: 534 / 260, margin: 24, marginTop: 0, borderRadius: 16, overflow: 'hidden' }}
                        testID="md-button-group-social-photo"
                    >
                        <ReferenceArt name="photo" />
                    </View>
                    {shareError ? (
                        <Text accessibilityLiveRegion="polite" style={{ paddingHorizontal: 24, color: theme.colors.error }}>
                            {shareError}
                        </Text>
                    ) : null}
                    <Dialog visible={socialMenuVisible} onDismiss={() => setSocialMenu(null)} onClosed={() => shareAfterClose('social')}>
                        <Dialog.Title>{socialMenu === 'reaction' ? 'Add reaction' : 'Photo options'}</Dialog.Title>
                        <Dialog.Content>
                            {socialMenu === 'reaction' ? (
                                <ButtonGroup
                                    items={['thumb_up', 'favorite', 'sentiment_satisfied'].map((icon) => ({
                                        value: icon,
                                        label: icon === 'thumb_up' ? 'Like' : icon === 'favorite' ? 'Love' : 'Smile',
                                        icon,
                                        iconOnly: true,
                                        onPress: () => {
                                            setSocialReaction(icon);
                                            setSocialMenu(null);
                                        },
                                    }))}
                                    testID="md-button-group-social-reactions"
                                />
                            ) : (
                                <List.Item
                                    title="Share photo"
                                    leading={<Icon source="share" size={24} />}
                                    onPress={() => {
                                        pendingShare.current = {
                                            owner: 'social',
                                            message:
                                                'A view from the collection. https://m3.material.io/components/button-groups/guidelines',
                                        };
                                        setSocialMenu(null);
                                    }}
                                    testID="md-button-group-social-share"
                                />
                            )}
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button variant="text" onPress={() => setSocialMenu(null)}>
                                Close
                            </Button>
                        </Dialog.Actions>
                    </Dialog>
                </View>
            );
        if (scenario === 'email')
            return (
                <View style={referenceSurface} onAccessibilityEscape={onBack} testID="md-button-group-use-email">
                    <ScrollView
                        contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: insets.bottom + 24 }}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        <View
                            style={{
                                flexDirection: width >= 420 ? 'row' : 'column',
                                alignItems: width >= 420 ? 'center' : 'stretch',
                                gap: 16,
                            }}
                        >
                            <View style={{ gap: 8 }}>
                                <Text variant="headlineSmall">Dinner Club</Text>
                                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                                    3 Messages
                                </Text>
                            </View>
                            {mailState === 'inbox' ? (
                                <ButtonGroup
                                    style={{ flex: width >= 420 ? 1 : undefined }}
                                    items={[
                                        {
                                            value: 'archive',
                                            label: 'Archive',
                                            icon: 'archive',
                                            iconOnly: true,
                                            onPress: () => setMailState('archived'),
                                        },
                                        {
                                            value: 'delete',
                                            label: 'Delete',
                                            icon: 'delete_outline',
                                            iconOnly: true,
                                            onPress: () => setMailDialog('delete'),
                                        },
                                        {
                                            value: 'email',
                                            label: 'Email',
                                            icon: 'mail_outline',
                                            iconOnly: true,
                                            onPress: () => navigation.navigate('GroupCompose'),
                                        },
                                        {
                                            value: 'more',
                                            label: 'More options',
                                            icon: 'more_vert',
                                            iconOnly: true,
                                            widthVariant: 'narrow',
                                            onPress: () => setMailDialog('more'),
                                        },
                                    ]}
                                    testID="md-button-group-email-actions"
                                />
                            ) : null}
                        </View>
                        {mailState === 'inbox' ? (
                            <>
                                <View style={{ backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 16, padding: 24, gap: 16 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden' }}>
                                            <ReferenceArt name="email-avatar" />
                                        </View>
                                        <View style={{ flex: 1, gap: 4 }}>
                                            <Text variant="titleMedium">So Duri</Text>
                                            <Text style={{ color: theme.colors.onSurfaceVariant }}>20 min ago</Text>
                                        </View>
                                        <IconButton
                                            icon={mailStarred ? 'star_fill1' : 'star_outline'}
                                            accessibilityLabel={mailStarred ? 'Unstar message' : 'Star message'}
                                            selected={mailStarred}
                                            mode="contained-tonal"
                                            containerColor={theme.colors.surface}
                                            onPress={() => setMailStarred(!mailStarred)}
                                            testID="md-button-group-email-star"
                                        />
                                    </View>
                                    <Text style={{ color: theme.colors.onSurfaceVariant }}>To me, Ziad, and Lily</Text>
                                    <Text>
                                        I think it’s time for us to finally try that new noodle shop downtown that doesn’t use menus.
                                    </Text>
                                </View>
                                {mailSent ? (
                                    <Text accessibilityLiveRegion="polite" testID="md-button-group-email-sent">
                                        Your reply is in the local outbox.
                                    </Text>
                                ) : null}
                            </>
                        ) : (
                            <Text accessibilityLiveRegion="polite" testID="md-button-group-email-state">
                                {mailState === 'archived' ? 'Conversation archived.' : 'Conversation deleted.'}
                            </Text>
                        )}
                    </ScrollView>
                    {shareError ? (
                        <Text accessibilityLiveRegion="polite" style={{ paddingHorizontal: 24, color: theme.colors.error }}>
                            {shareError}
                        </Text>
                    ) : null}
                    <Dialog visible={mailDialogVisible} onDismiss={() => setMailDialog(null)} onClosed={() => shareAfterClose('email')}>
                        <Dialog.Title>{mailDialog === 'delete' ? 'Delete conversation?' : 'More options'}</Dialog.Title>
                        <Dialog.Content>
                            {mailDialog === 'delete' ? (
                                <Text>Move the three messages to the local trash.</Text>
                            ) : (
                                <List.Item
                                    title="Share conversation"
                                    leading={<Icon source="share" size={24} />}
                                    onPress={() => {
                                        pendingShare.current = { owner: 'email', message: 'Dinner Club — Friday at 7:00.' };
                                        setMailDialog(null);
                                    }}
                                    testID="md-button-group-email-share"
                                />
                            )}
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button variant="text" onPress={() => setMailDialog(null)}>
                                Cancel
                            </Button>
                            {mailDialog === 'delete' ? (
                                <Button
                                    variant="text"
                                    onPress={() => {
                                        setMailState('deleted');
                                        setMailDialog(null);
                                    }}
                                    testID="md-button-group-email-confirm-delete"
                                >
                                    Delete
                                </Button>
                            ) : null}
                        </Dialog.Actions>
                    </Dialog>
                </View>
            );
        return (
            <View
                style={{ ...referenceSurface, paddingLeft: insets.left, paddingRight: insets.right }}
                onAccessibilityEscape={onBack}
                testID="md-button-group-use-music"
            >
                <View style={{ flex: 1, flexDirection: 'row' }}>
                    {wideMusic ? (
                        <NavigationRail
                            items={musicDestinations}
                            value={musicDestination}
                            onValueChange={setMusicDestination}
                            testID="md-button-group-music-navigation"
                        />
                    ) : null}
                    <ScrollView
                        style={{ flex: 1, minWidth: 0 }}
                        contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: insets.bottom + 24 }}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        <View
                            style={{
                                flexDirection: wideMusic && musicDestination === 'home' ? 'row' : 'column',
                                alignItems: wideMusic && musicDestination === 'home' ? 'flex-start' : 'stretch',
                                gap: 24,
                            }}
                            testID="md-button-group-music-layout"
                        >
                            {musicDestination === 'home' ? (
                                <View
                                    style={{ width: wideMusic ? musicPanelWidth : '100%', gap: 24 }}
                                    testID="md-button-group-music-player-panel"
                                >
                                    <View
                                        style={{
                                            aspectRatio: 1,
                                            borderRadius: 28,
                                            overflow: 'hidden',
                                        }}
                                        testID="md-button-group-music-art"
                                    >
                                        <ReferenceArt name="music" />
                                    </View>
                                    <ButtonGroup
                                        fullWidth
                                        size={wideMusic && musicPanelWidth < 288 ? 'small' : 'medium'}
                                        style={{ marginTop: -64, marginHorizontal: 12 }}
                                        items={[
                                            {
                                                value: 'play',
                                                label: musicPlaying ? 'Pause' : 'Play',
                                                icon: musicPlaying ? 'pause' : 'play_arrow',
                                                iconOnly: true,
                                                widthVariant: 'wide',
                                                weight: 2,
                                                buttonColor: theme.colors.tertiaryContainer,
                                                textColor: theme.colors.onTertiaryContainer,
                                                onPress: () => setMusicPlaying(!musicPlaying),
                                            },
                                            {
                                                value: 'favorite',
                                                label: favorite ? 'Remove favorite' : 'Favorite',
                                                icon: favorite ? 'favorite_fill1' : 'favorite_border',
                                                weight: 1,
                                                iconOnly: true,
                                                onPress: () => setFavorite(!favorite),
                                            },
                                            {
                                                value: 'shuffle',
                                                label: shuffle ? 'Turn shuffle off' : 'Shuffle',
                                                icon: 'shuffle',
                                                weight: 1,
                                                iconOnly: true,
                                                onPress: () => setShuffle(!shuffle),
                                            },
                                            {
                                                value: 'more',
                                                label: 'More options',
                                                icon: 'more_vert',
                                                iconOnly: true,
                                                widthVariant: 'narrow',
                                                weight: 0.8,
                                                onPress: () => setMusicMenu(true),
                                            },
                                        ]}
                                        testID="md-button-group-music-controls"
                                    />
                                    <Text accessibilityLiveRegion="polite" testID="md-button-group-music-state">
                                        {musicPlaying ? 'Playing' : 'Paused'} · {track}
                                        {favorite ? ' · Favorite' : ''}
                                        {shuffle ? ' · Shuffle on' : ''}
                                    </Text>
                                </View>
                            ) : (
                                <Text variant="headlineMedium">
                                    {musicDestinations.find((item) => item.key === musicDestination)?.label}
                                </Text>
                            )}
                            <View
                                style={{ flex: wideMusic && musicDestination === 'home' ? 1 : undefined, minWidth: 0, gap: 24 }}
                                testID="md-button-group-music-tracks"
                            >
                                {musicDestination === 'library' && !favorite && !playlistSaved ? (
                                    <Text>No saved music. Favorite a track or add it to your playlist from Home.</Text>
                                ) : (
                                    musicTracks
                                        .filter((_, index) => musicDestination !== 'radio' || index % 2 === 0)
                                        .map(({ title, duration }, index) => (
                                            <List.Item
                                                key={title}
                                                variant="baseline"
                                                multiAction
                                                title={
                                                    <Text variant="bodyLarge" style={{ fontWeight: track === title ? '500' : '400' }}>
                                                        {title}
                                                    </Text>
                                                }
                                                accessibilityLabel={`${title}, ${duration}${track === title ? ', current track' : ''}`}
                                                trailing={
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Text>{duration}</Text>
                                                        <IconButton
                                                            icon="more_vert"
                                                            accessibilityLabel={`More options for ${title}`}
                                                            onPress={() => {
                                                                setTrack(title);
                                                                setMusicMenu(true);
                                                            }}
                                                            testID={`md-button-group-music-track-more-${index}`}
                                                        />
                                                    </View>
                                                }
                                                leading={<Text variant="bodyMedium">{index + 1}</Text>}
                                                onPress={() => {
                                                    setTrack(title);
                                                    setMusicPlaying(true);
                                                    setMusicDestination('home');
                                                }}
                                                testID={`md-button-group-music-track-${index}`}
                                            />
                                        ))
                                )}
                            </View>
                        </View>
                    </ScrollView>
                </View>
                {!wideMusic ? (
                    <NavigationBar
                        items={musicDestinations}
                        value={musicDestination}
                        onValueChange={setMusicDestination}
                        testID="md-button-group-music-navigation"
                    />
                ) : null}
                <Dialog visible={musicMenu} onDismiss={() => setMusicMenu(false)}>
                    <Dialog.Title>More options</Dialog.Title>
                    <Dialog.Content>
                        <List.Item
                            title={playlistSaved ? 'Remove from playlist' : 'Add to playlist'}
                            leading={<Icon source="playlist_add" size={24} />}
                            onPress={() => {
                                setPlaylistSaved(!playlistSaved);
                                setMusicMenu(false);
                            }}
                            testID="md-button-group-music-playlist"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button variant="text" onPress={() => setMusicMenu(false)}>
                            Close
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </View>
        );
    };
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: motionReduced ? 'none' : 'default',
                contentStyle: { backgroundColor: theme.colors.surface },
            }}
        >
            <Stack.Screen name="GroupMain">{({ navigation }) => main(navigation)}</Stack.Screen>
            <Stack.Screen name="GroupSetup">
                {({ navigation }) => (
                    <ThemeProvider theme={textTheme}>
                        <View style={surface} onAccessibilityEscape={() => navigation.goBack()} testID="md-button-group-setup">
                            {bar(registered ? 'You’re ready' : 'Get started', navigation)}
                            <View style={{ padding: 24, gap: 24 }}>
                                {registered ? (
                                    <Text variant="headlineMedium">Welcome, {name.trim()}.</Text>
                                ) : (
                                    <>
                                        <TextField
                                            label="Your name"
                                            value={name}
                                            onChangeText={setName}
                                            autoComplete="name"
                                            testID="md-button-group-name"
                                        />
                                        <Button
                                            disabled={!name.trim()}
                                            style={{ alignSelf: 'flex-start' }}
                                            onPress={() => setRegistered(true)}
                                            testID="md-button-group-setup-continue"
                                        >
                                            Continue
                                        </Button>
                                    </>
                                )}
                            </View>
                        </View>
                    </ThemeProvider>
                )}
            </Stack.Screen>
            <Stack.Screen name="GroupCompose">
                {({ navigation }) => (
                    <View style={surface} onAccessibilityEscape={() => navigation.goBack()} testID="md-button-group-compose">
                        <TopAppBar
                            title="Dinner Club"
                            navigationIcon="close"
                            navigationLabel="Close draft"
                            onNavigationPress={() => navigation.goBack()}
                            actions={[
                                {
                                    key: 'send',
                                    icon: 'send',
                                    label: 'Send',
                                    disabled: !mailBody.trim(),
                                    onPress: () => {
                                        setMailSent(true);
                                        setMailBody('');
                                        navigation.goBack();
                                    },
                                    testID: 'md-button-group-email-send',
                                },
                            ]}
                        />
                        <ScrollView
                            contentContainerStyle={{ padding: 24, gap: 24 }}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                        >
                            <Text>To: So Duri</Text>
                            <TextField
                                label="Message"
                                value={mailBody}
                                onChangeText={setMailBody}
                                multiline
                                testID="md-button-group-email-body"
                            />
                        </ScrollView>
                    </View>
                )}
            </Stack.Screen>
            <Stack.Screen name="GroupDetail">
                {({ navigation, route }) => {
                    const file = buttonGroupFiles.find((item) => item.id === route.params.id),
                        place = buttonGroupPlaces.find((item) => item.id === route.params.id);
                    return (
                        <View style={surface} onAccessibilityEscape={() => navigation.goBack()} testID="md-button-group-detail">
                            {bar(
                                route.params.id === 'cart'
                                    ? 'Cart'
                                    : route.params.id === 'account'
                                      ? 'Account'
                                      : (file?.name ?? place?.name ?? 'Details'),
                                navigation
                            )}
                            <ScrollView
                                contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: insets.bottom + 24 }}
                                showsVerticalScrollIndicator={false}
                                showsHorizontalScrollIndicator={false}
                            >
                                {route.params.id === 'cart' ? (
                                    <>
                                        {cart.map((item, index) => (
                                            <List.Item
                                                key={index}
                                                title="Selected item"
                                                description={item}
                                                leading={<Icon source="shopping_bag" size={24} />}
                                            />
                                        ))}
                                        <Text testID="md-button-group-cart-count">
                                            {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
                                        </Text>
                                    </>
                                ) : route.params.id === 'account' ? (
                                    <>
                                        <Avatar.Text size={64} label="L" />
                                        <Text variant="headlineMedium">Lee</Text>
                                        <Text>lee@example.com</Text>
                                    </>
                                ) : (
                                    <>
                                        <Icon source={file?.icon ?? 'restaurant'} size={64} />
                                        <Text variant="headlineMedium">{file?.name ?? place?.name}</Text>
                                        <Text>{file?.description ?? `${place?.price} · ${place?.distance} km away`}</Text>
                                    </>
                                )}
                            </ScrollView>
                        </View>
                    );
                }}
            </Stack.Screen>
        </Stack.Navigator>
    );
}
