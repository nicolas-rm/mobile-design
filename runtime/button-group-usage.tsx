import { SelectField } from './select-field';
import { useState } from 'react';
import { View, useWindowDimensions, type ColorValue } from 'react-native';
import {
    Avatar,
    Button,
    ButtonGroup,
    IconButton,
    List,
    MaterialSymbol,
    NavigationBar,
    NavigationRail,
    Text,
    useMobileTheme,
    type ButtonGroupItem,
} from 'mobile-design';
import { Prose } from './prose';
import { initialCalculator, updateCalculator } from './button-group-calculator';

const scenes = [
    ['welcome', 'Welcome · Get started'],
    ['call', 'Video call'],
    ['files', 'Files'],
    ['shopping', 'Shopping'],
    ['filters', 'Filters'],
    ['calculator', 'Calculator'],
    ['music', 'The Lawerence tree'],
    ['photo', 'Photo actions'],
    ['email', 'Dinner Club'],
] as const;
type Scene = (typeof scenes)[number][0];
const asset = (file: string) => new URL('../../assets/examples/button-groups/' + file, location.href).href;
function Art({ name }: { name: 'photo' | 'photo-avatar' | 'music' | 'call' | 'email-avatar' }) {
    const art = {
        photo: { file: 'photo.png', box: '0 340 534 260', width: 656, height: 600 },
        'photo-avatar': { file: 'photo.png', box: '470 220 64 64', width: 656, height: 600 },
        music: { file: 'music-frame.png', box: '480 104 414 390', width: 1352, height: 960 },
        call: { file: 'call-frame.png', box: '65 0 1222 300', width: 1352, height: 600 },
        'email-avatar': { file: 'dinner-club.png', box: '143 299 74 74', width: 1352, height: 600 },
    }[name];
    return (
        <svg width="100%" height="100%" viewBox={art.box} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <image href={asset(art.file)} width={art.width} height={art.height} />
        </svg>
    );
}
const symbol =
    (name: string, filled = false) =>
    ({ size, color }: { size: number; color?: ColorValue | null }) => (
        <MaterialSymbol name={name} size={size} color={color} filled={filled} />
    );
function Status({ children, id }: { children: React.ReactNode; id: string }) {
    return (
        <Prose as="p" role="status" className="group-status" id={id}>
            {children}
        </Prose>
    );
}

function Welcome() {
    const { width } = useWindowDimensions(),
        theme = useMobileTheme(),
        [panel, setPanel] = useState(''),
        [language, setLanguage] = useState('English'),
        [name, setName] = useState(''),
        [registered, setRegistered] = useState(false),
        [large, setLarge] = useState(false);
    return (
        <>
            <View style={{ padding: 24, gap: 32 }}>
                <Text variant={large ? 'displayLarge' : 'displayMedium'}>{language === 'English' ? 'Welcome' : 'Bienvenido'}</Text>
                <ButtonGroup
                    fullWidth
                    size={width < 600 ? 'small' : 'large'}
                    items={[
                        {
                            value: 'accessibility',
                            label: 'Accessibility preferences',
                            icon: symbol('accessibility_new'),
                            iconOnly: true,
                            widthVariant: 'narrow',
                            buttonColor: theme.colors.tertiaryContainer,
                            textColor: theme.colors.onTertiaryContainer,
                            onPress: () => setPanel('accessibility'),
                        },
                        {
                            value: 'start',
                            label: language === 'English' ? 'Get started' : 'Comenzar',
                            weight: 3,
                            variant: 'filled',
                            onPress: () => setPanel('start'),
                        },
                        {
                            value: 'language',
                            label: 'Language',
                            icon: 'language',
                            iconOnly: true,
                            widthVariant: 'narrow',
                            buttonColor: theme.colors.tertiaryContainer,
                            textColor: theme.colors.onTertiaryContainer,
                            onPress: () => setPanel('language'),
                        },
                    ]}
                    testID="welcome-group"
                />
            </View>
            {panel === 'language' ? (
                <div className="group-task">
                    <Text variant="titleLarge">Language</Text>
                    <ButtonGroup
                        variant="connected"
                        value={language}
                        onValueChange={(v) => setLanguage(String(v))}
                        items={['English', 'Español'].map((value) => ({ value, label: value }))}
                        testID="welcome-languages"
                    />
                </div>
            ) : null}
            {panel === 'accessibility' ? (
                <div className="group-task">
                    <Text variant="titleLarge">Accessibility preferences</Text>
                    <ButtonGroup
                        variant="connected"
                        value={large ? 'large' : 'default'}
                        onValueChange={(v) => setLarge(v === 'large')}
                        items={[
                            { value: 'default', label: 'Default text' },
                            { value: 'large', label: 'Larger text' },
                        ]}
                        testID="welcome-text-size"
                    />
                </div>
            ) : null}
            {panel === 'start' ? (
                <form
                    className="group-task"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (name.trim()) setRegistered(true);
                    }}
                >
                    <Prose as="label">
                        Your name
                        <input id="welcome-name" required value={name} onChange={(e) => setName(e.target.value)} />
                    </Prose>
                    <Button
                        onPress={() => document.querySelector<HTMLFormElement>('#welcome-name')?.form?.requestSubmit()}
                        testID="welcome-continue"
                    >
                        Continue
                    </Button>
                    <Status id="welcome-result">{registered ? 'Welcome, ' + name.trim() + '.' : 'Create your local profile.'}</Status>
                </form>
            ) : null}
        </>
    );
}
function Call() {
    const { width } = useWindowDimensions(),
        [values, setValues] = useState<string[]>(['mic']),
        [ended, setEnded] = useState(false),
        [panel, setPanel] = useState(''),
        [message, setMessage] = useState(''),
        [messages, setMessages] = useState<string[]>([]),
        [reaction, setReaction] = useState('');
    const toggles = ['camera', 'mic', 'hand', 'captions'];
    const items: ButtonGroupItem[] = [
        {
            value: 'camera',
            label: values.includes('camera') ? 'Turn camera on' : 'Turn camera off',
            icon: symbol(values.includes('camera') ? 'videocam_off' : 'videocam', values.includes('camera')),
            iconOnly: true,
        },
        {
            value: 'mic',
            label: values.includes('mic') ? 'Unmute microphone' : 'Mute microphone',
            icon: symbol(values.includes('mic') ? 'mic_off' : 'mic', values.includes('mic')),
            iconOnly: true,
        },
        {
            value: 'reaction',
            label: 'Reactions',
            icon: 'add_reaction',
            iconOnly: true,
            selectionMode: 'none',
            onPress: () => setPanel(panel === 'reaction' ? '' : 'reaction'),
        },
        { value: 'hand', label: 'Raise hand', icon: symbol('back_hand', values.includes('hand')), iconOnly: true },
        { value: 'captions', label: 'Captions', icon: 'closed_caption', iconOnly: true },
        {
            value: 'chat',
            label: 'Chat',
            icon: 'chat',
            iconOnly: true,
            selectionMode: 'none',
            onPress: () => setPanel(panel === 'chat' ? '' : 'chat'),
        },
    ];
    return (
        <>
            <div className="group-call">
                <div className="group-call-image">
                    {!ended && !values.includes('camera') ? (
                        <Art name="call" />
                    ) : (
                        <Text variant="headlineMedium">{ended ? 'Call ended' : 'Lee'}</Text>
                    )}
                    {!ended && values.includes('captions') ? (
                        <span className="group-captions">
                            <Text>Lee: Let’s look at the next slide.</Text>
                        </span>
                    ) : null}
                    {reaction ? (
                        <span className="group-reaction">
                            <MaterialSymbol name={reaction} size={40} />
                        </span>
                    ) : null}
                </div>
                {ended ? (
                    <Button
                        onPress={() => {
                            setEnded(false);
                            setValues(['mic']);
                        }}
                        testID="call-rejoin"
                    >
                        Rejoin
                    </Button>
                ) : (
                    <div className="group-call-controls">
                        <ButtonGroup
                            fullWidth
                            size={width >= 600 ? 'medium' : 'small'}
                            selectionMode="multiple"
                            value={values}
                            onValueChange={(next) =>
                                setValues((typeof next === 'string' ? [next] : next).filter((v) => toggles.includes(v)))
                            }
                            showSelectedIcon={false}
                            style={{ flex: 1, minWidth: 0 }}
                            items={items}
                            testID="call-group"
                        />
                        <Button icon="call_end" size={width >= 600 ? 'medium' : 'small'} onPress={() => setEnded(true)} testID="call-end">
                            Leave
                        </Button>
                    </div>
                )}
            </div>
            {!ended && panel === 'reaction' ? (
                <div className="group-task">
                    <Text variant="titleLarge">Reactions</Text>
                    <ButtonGroup
                        items={[
                            ['thumb_up', 'Like'],
                            ['favorite', 'Love'],
                            ['sentiment_satisfied', 'Smile'],
                        ].map(([value, label]) => ({
                            value,
                            label,
                            icon: value,
                            iconOnly: true,
                            onPress: () => {
                                setReaction(value);
                                setPanel('');
                            },
                        }))}
                        testID="call-reactions"
                    />
                </div>
            ) : null}
            {!ended && panel === 'chat' ? (
                <form
                    className="group-task"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (message.trim()) {
                            setMessages((v) => [...v, message.trim()]);
                            setMessage('');
                        }
                    }}
                >
                    <Text variant="titleLarge">Chat</Text>
                    {messages.map((text, i) => (
                        <Text key={i}>{text}</Text>
                    ))}
                    <Prose as="label">
                        Message
                        <input id="call-message" value={message} onChange={(e) => setMessage(e.target.value)} />
                    </Prose>
                    <Button
                        onPress={() => document.querySelector<HTMLInputElement>('#call-message')?.form?.requestSubmit()}
                        testID="call-send"
                    >
                        Send
                    </Button>
                </form>
            ) : null}
            <Status id="call-result">
                {ended ? 'Call ended.' : values.includes('mic') ? 'Microphone muted.' : 'Microphone on.'}
                {values.includes('hand') ? ' Your hand is raised.' : ''}
            </Status>
        </>
    );
}
const fileRows = [
    ['projects', 'Projects', 'my-files'],
    ['photos', 'Photos', 'my-files'],
    ['documents', 'Documents', 'my-files'],
    ['team', 'Team collection', 'shared'],
    ['plans', 'Project plans', 'shared'],
    ['laptop', 'My laptop', 'computers'],
    ['desktop', 'Desktop', 'computers'],
];
function Files() {
    const [destination, setDestination] = useState('my-files'),
        [query, setQuery] = useState(''),
        [search, setSearch] = useState(false),
        [detail, setDetail] = useState('');
    const visible = fileRows.filter(([, label, group]) =>
        query ? label.toLowerCase().includes(query.toLowerCase()) : group === destination
    );
    return (
        <>
            <header className="group-heading">
                <Text variant="headlineMedium">Folders</Text>
                <Avatar.Image size={32} source={{ uri: asset('files-avatar.png') }} />
            </header>
            <ButtonGroup
                variant="connected"
                value={destination}
                onValueChange={(v) => {
                    setDestination(String(v));
                    setDetail('');
                }}
                showSelectedIcon={false}
                items={[
                    { value: 'my-files', label: 'My files' },
                    { value: 'shared', label: 'Shared' },
                    { value: 'computers', label: 'Computers' },
                ]}
                testID="files-group"
            />
            <div className="group-task">
                {search ? (
                    <Prose as="label">
                        Search files
                        <input id="files-search" value={query} onChange={(e) => setQuery(e.target.value)} />
                    </Prose>
                ) : (
                    <Button variant="text" icon="search" onPress={() => setSearch(true)} testID="files-open-search">
                        Search
                    </Button>
                )}
            </div>
            <div id="files-results">
                {visible.map(([key, label]) => (
                    <List.Item
                        key={key}
                        title={label}
                        leading={<MaterialSymbol name="folder" size={24} />}
                        onPress={() => setDetail(label)}
                        testID={'file-' + key}
                    />
                ))}
            </div>
            <Status id="files-result">{detail ? 'Opened: ' + detail : visible.length + ' folders'}</Status>
        </>
    );
}
function Shopping() {
    const [size, setSize] = useState('8oz'),
        [cart, setCart] = useState<string[]>([]);
    return (
        <div className="group-task">
            <Text variant="titleLarge">Select size</Text>
            <ButtonGroup
                variant="connected"
                value={size}
                onValueChange={(v) => setSize(String(v))}
                items={['8oz', '12oz', '16oz'].map((value) => ({ value, label: value }))}
                testID="shopping-group"
            />
            <Button onPress={() => setCart((v) => [...v, size])} testID="shopping-add">
                Add to cart
            </Button>
            <Status id="shopping-result">{cart.length ? 'Cart: ' + cart.join(', ') : 'Choose a size.'}</Status>
        </div>
    );
}
const places = [
    { name: 'Garden café', price: '$', distance: 1.8, rank: 1 },
    { name: 'The corner kitchen', price: '$$', distance: 0.4, rank: 2 },
    { name: 'Market table', price: '$$', distance: 0.9, rank: 3 },
    { name: 'The terrace', price: '$$$', distance: 0.2, rank: 4 },
    { name: 'Tasting room', price: '$$$$', distance: 2.1, rank: 5 },
];
function Filters() {
    const [sort, setSort] = useState('relevance'),
        [prices, setPrices] = useState<string[]>(['$', '$$']),
        [applied, setApplied] = useState(false);
    const visible = places
        .filter((p) => prices.includes(p.price))
        .sort((a, b) => (sort === 'distance' ? a.distance - b.distance : a.rank - b.rank));
    return (
        <>
            <header className="group-heading">
                <IconButton
                    icon="close"
                    accessibilityLabel="Reset filters"
                    onPress={() => {
                        setSort('relevance');
                        setPrices(['$', '$$']);
                        setApplied(false);
                    }}
                    testID="filters-reset"
                />
                <Text variant="titleLarge">Filters</Text>
                <Button variant="text" onPress={() => setApplied(true)} testID="filters-done">
                    Done
                </Button>
            </header>
            <div className="group-task">
                <Text variant="titleMedium">Sort by</Text>
                <ButtonGroup
                    variant="connected"
                    value={sort}
                    onValueChange={(v) => {
                        setSort(String(v));
                        setApplied(false);
                    }}
                    items={[
                        { value: 'relevance', label: 'Relevance' },
                        { value: 'distance', label: 'Distance' },
                    ]}
                    testID="sort-group"
                />
                <Text variant="titleMedium">Price</Text>
                <ButtonGroup
                    variant="connected"
                    selectionMode="multiple"
                    value={prices}
                    onValueChange={(v) => {
                        setPrices(typeof v === 'string' ? [v] : v);
                        setApplied(false);
                    }}
                    items={['$', '$$', '$$$', '$$$$'].map((value) => ({ value, label: value, accessibilityLabel: value + ' price' }))}
                    testID="price-group"
                />
            </div>
            {applied ? (
                <div id="filter-results">
                    {visible.map((p) => (
                        <List.Item key={p.name} title={p.name} description={p.price + ' · ' + p.distance + ' km'} />
                    ))}
                </div>
            ) : null}
            <Status id="filters-result">{applied ? visible.length + ' results.' : 'Choose your filters.'}</Status>
        </>
    );
}
function Calculator() {
    const [state, setState] = useState(initialCalculator),
        theme = useMobileTheme();
    return (
        <div className="group-calculator">
            <Text variant="bodyLarge">{state.expression || 'Calculator'}</Text>
            <Text variant="displayMedium" selectable testID="calculator-value" style={{ textAlign: 'right' }}>
                {state.entry}
            </Text>
            <div className="group-heading">
                {['√', 'π', 'e', '!'].map((key) => (
                    <IconButton
                        key={key}
                        icon={({ color }) => (
                            <Text variant="titleMedium" style={{ color }}>
                                {key}
                            </Text>
                        )}
                        accessibilityLabel={key === '√' ? 'Square root' : key === 'π' ? 'Pi' : key === 'e' ? 'Euler’s number' : 'Factorial'}
                        onPress={() => setState((s) => updateCalculator(s, key))}
                        testID={'calculator-function-' + key}
                    />
                ))}
                <IconButton
                    icon="backspace"
                    accessibilityLabel="Backspace"
                    onPress={() => setState((s) => updateCalculator(s, 'backspace'))}
                />
            </div>
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
                    items={row.map((key) => ({
                        value: key,
                        label: key,
                        iconOnly: true,
                        icon: ({ color }: { color: ColorValue }) => (
                            <Text variant="titleLarge" style={{ color }}>
                                {key}
                            </Text>
                        ),
                        weight: key === '=' ? 2 : 1,
                        buttonColor:
                            key === '='
                                ? theme.colors.tertiaryContainer
                                : ['+', '−', '×', '÷'].includes(key)
                                  ? theme.colors.secondaryContainer
                                  : theme.colors.surfaceContainerLow,
                        textColor: theme.colors.onSurface,
                        onPress: () => setState((s) => updateCalculator(s, key)),
                    }))}
                    testID={'calculator-row-' + index}
                />
            ))}
        </div>
    );
}
const musicTracks = [
    ['The Lawerence tree', '1:20'],
    ['Parenthesis', '2:11'],
    ['Hold My Head', '1:46'],
    ['So They Say', '1:25'],
];
const destinations = [
    { key: 'home', label: 'Home', icon: 'music_note' },
    { key: 'browse', label: 'Browse', icon: 'apps' },
    { key: 'radio', label: 'Radio', icon: 'radio' },
    { key: 'library', label: 'Library', icon: 'library_music' },
];
function Music() {
    const { width } = useWindowDimensions(),
        theme = useMobileTheme(),
        [playing, setPlaying] = useState(false),
        [selected, setSelected] = useState<string[]>([]),
        [track, setTrack] = useState('The Lawerence tree'),
        [destination, setDestination] = useState('home'),
        [saved, setSaved] = useState(false),
        [options, setOptions] = useState(false);
    const wide = width >= 600;
    return (
        <>
            <div className={'group-music-layout' + (wide ? ' wide' : '')}>
                {wide ? <NavigationRail items={destinations} value={destination} onValueChange={setDestination} /> : null}
                <div className="group-music-content">
                    <div className="group-music-player">
                        {destination === 'home' ? (
                            <>
                                <div className="group-music-art">
                                    <Art name="music" />
                                </div>
                                <ButtonGroup
                                    fullWidth
                                    size="medium"
                                    selectionMode="multiple"
                                    value={selected}
                                    showSelectedIcon={false}
                                    onValueChange={(v) => setSelected(typeof v === 'string' ? [v] : v)}
                                    items={[
                                        {
                                            value: 'play',
                                            label: playing ? 'Pause' : 'Play',
                                            icon: symbol(playing ? 'pause' : 'play_arrow', true),
                                            iconOnly: true,
                                            widthVariant: 'wide',
                                            weight: 2,
                                            selectionMode: 'none',
                                            buttonColor: theme.colors.tertiaryContainer,
                                            textColor: theme.colors.onTertiaryContainer,
                                            onPress: () => setPlaying((v) => !v),
                                        },
                                        {
                                            value: 'favorite',
                                            label: 'Favorite',
                                            icon: symbol('favorite', selected.includes('favorite')),
                                            iconOnly: true,
                                            weight: 1,
                                        },
                                        { value: 'shuffle', label: 'Shuffle', icon: 'shuffle', iconOnly: true, weight: 1 },
                                        {
                                            value: 'more',
                                            label: 'More music options',
                                            icon: 'more_vert',
                                            iconOnly: true,
                                            widthVariant: 'narrow',
                                            selectionMode: 'none',
                                            onPress: () => setOptions((v) => !v),
                                        },
                                    ]}
                                    testID="music-group"
                                />
                                <Text variant="headlineSmall">{track}</Text>
                            </>
                        ) : (
                            <Text variant="headlineMedium">{destinations.find((d) => d.key === destination)?.label}</Text>
                        )}
                    </div>
                    <div className="group-track-list">
                        {destination === 'library' && !selected.includes('favorite') && !saved ? (
                            <Text>No saved music.</Text>
                        ) : (
                            musicTracks
                                .filter((_, i) => destination !== 'radio' || i % 2 === 0)
                                .map(([title, duration]) => (
                                    <List.Item
                                        key={title}
                                        title={title}
                                        trailing={duration}
                                        onPress={() => {
                                            setTrack(title);
                                            setPlaying(true);
                                        }}
                                        testID={'music-track-' + title}
                                    />
                                ))
                        )}
                    </div>
                </div>
            </div>
            {!wide ? <NavigationBar items={destinations} value={destination} onValueChange={setDestination} /> : null}
            {options ? (
                <div className="group-task">
                    <Button
                        variant="text"
                        icon="playlist_add"
                        onPress={() => {
                            setSaved(true);
                            setOptions(false);
                        }}
                        testID="music-save"
                    >
                        Add to playlist
                    </Button>
                </div>
            ) : null}
            <Status id="music-result">
                {playing ? 'Playing' : 'Paused'} · {track}
                {selected.includes('favorite') ? ' · Favorite' : ''}
                {selected.includes('shuffle') ? ' · Shuffle on' : ''}
                {saved ? ' · Playlist saved' : ''}
            </Status>
        </>
    );
}
function Photo() {
    const [values, setValues] = useState<string[]>([]),
        [panel, setPanel] = useState(''),
        [reaction, setReaction] = useState(''),
        [result, setResult] = useState(''),
        theme = useMobileTheme();
    return (
        <>
            <header className="group-heading">
                <ButtonGroup
                    fullWidth
                    shape="square"
                    selectionMode="multiple"
                    value={values}
                    onValueChange={(v) => setValues(typeof v === 'string' ? [v] : v)}
                    showSelectedIcon={false}
                    style={{ flex: 1, minWidth: 0 }}
                    items={[
                        {
                            value: 'more',
                            label: 'Photo options',
                            icon: 'more_vert',
                            iconOnly: true,
                            widthVariant: 'narrow',
                            selectionMode: 'none',
                            onPress: () => setPanel(panel === 'more' ? '' : 'more'),
                        },
                        {
                            value: 'favorite',
                            label: 'Favorite photo',
                            icon: symbol('favorite', values.includes('favorite')),
                            iconOnly: true,
                        },
                        {
                            value: 'reaction',
                            label: 'Add reaction',
                            icon: reaction || 'add_reaction',
                            iconOnly: true,
                            widthVariant: 'wide',
                            selectionMode: 'none',
                            buttonColor: theme.colors.tertiaryContainer,
                            textColor: theme.colors.onTertiaryContainer,
                            onPress: () => setPanel(panel === 'reaction' ? '' : 'reaction'),
                        },
                    ]}
                    testID="photo-group"
                />
                <div className="group-avatar">
                    <Art name="photo-avatar" />
                </div>
            </header>
            <div className="group-photo">
                <Art name="photo" />
            </div>
            {panel === 'reaction' ? (
                <div className="group-task">
                    <ButtonGroup
                        items={[
                            ['thumb_up', 'Like'],
                            ['favorite', 'Love'],
                            ['sentiment_satisfied', 'Smile'],
                        ].map(([icon, label]) => ({
                            value: icon,
                            label,
                            icon,
                            iconOnly: true,
                            onPress: () => {
                                setReaction(icon);
                                setPanel('');
                            },
                        }))}
                        testID="photo-reactions"
                    />
                </div>
            ) : null}
            {panel === 'more' ? (
                <div className="group-task">
                    <Button
                        variant="text"
                        icon="link"
                        onPress={() => {
                            void navigator.clipboard.writeText('https://example.com/photo').then(
                                () => setResult('Photo link copied.'),
                                () => setResult('Could not copy the link.')
                            );
                        }}
                        testID="photo-copy"
                    >
                        Copy link
                    </Button>
                </div>
            ) : null}
            <Status id="photo-result">
                {result || (values.includes('favorite') ? 'Favorite photo.' : reaction ? 'Reaction: ' + reaction : 'Photo collection.')}
            </Status>
        </>
    );
}
function Email() {
    const [state, setState] = useState('inbox'),
        [confirm, setConfirm] = useState(false),
        [star, setStar] = useState(false),
        [compose, setCompose] = useState(false),
        [draft, setDraft] = useState(''),
        [saved, setSaved] = useState(false),
        [options, setOptions] = useState(false),
        [copyStatus, setCopyStatus] = useState('');
    return (
        <>
            <header className="group-heading group-email-heading">
                <div>
                    <Text variant="headlineSmall">Dinner Club</Text>
                    <Text variant="bodyLarge">3 Messages</Text>
                </div>
                {state === 'inbox' ? (
                    <ButtonGroup
                        items={[
                            { value: 'archive', label: 'Archive', icon: 'archive', iconOnly: true, onPress: () => setState('archived') },
                            { value: 'delete', label: 'Delete', icon: 'delete', iconOnly: true, onPress: () => setConfirm(true) },
                            {
                                value: 'more',
                                label: 'More conversation options',
                                icon: 'more_vert',
                                iconOnly: true,
                                widthVariant: 'narrow',
                                onPress: () => setOptions((v) => !v),
                            },
                        ]}
                        testID="email-group"
                    />
                ) : (
                    <Button variant="text" onPress={() => setState('inbox')} testID="email-undo">
                        Undo
                    </Button>
                )}
            </header>
            {state === 'inbox' ? (
                <>
                    <div className="group-heading">
                        <div className="group-avatar">
                            <Art name="email-avatar" />
                        </div>
                        <Text variant="titleMedium">Lee</Text>
                        <IconButton
                            icon={symbol('star', star)}
                            selected={star}
                            accessibilityLabel="Star conversation"
                            onPress={() => setStar((v) => !v)}
                            testID="email-star"
                        />
                    </div>
                    <Text variant="bodyLarge">Hi everyone! Where should we meet for dinner this week?</Text>
                    <div className="group-task">
                        <Button variant="outlined" icon="reply" onPress={() => setCompose(true)} testID="email-reply">
                            Reply
                        </Button>
                    </div>
                </>
            ) : null}
            {confirm ? (
                <div className="group-task">
                    <Text variant="titleLarge">Delete conversation?</Text>
                    <ButtonGroup
                        items={[
                            { value: 'cancel', label: 'Cancel', onPress: () => setConfirm(false) },
                            {
                                value: 'delete',
                                label: 'Delete',
                                onPress: () => {
                                    setState('deleted');
                                    setConfirm(false);
                                },
                            },
                        ]}
                        testID="email-confirm"
                    />
                </div>
            ) : null}
            {options ? (
                <div className="group-task">
                    <Button
                        variant="text"
                        icon="link"
                        onPress={() => {
                            void navigator.clipboard.writeText('https://example.com/dinner-club').then(
                                () => {
                                    setCopyStatus('Conversation link copied.');
                                    setOptions(false);
                                },
                                () => setCopyStatus('Could not copy the link.')
                            );
                        }}
                        testID="email-copy"
                    >
                        Copy conversation link
                    </Button>
                </div>
            ) : null}
            {compose ? (
                <form
                    className="group-task"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setSaved(true);
                    }}
                >
                    <Prose as="label">
                        Reply
                        <textarea
                            id="email-draft"
                            value={draft}
                            onChange={(e) => {
                                setDraft(e.target.value);
                                setSaved(false);
                            }}
                        />
                    </Prose>
                    <Button
                        onPress={() => document.querySelector<HTMLTextAreaElement>('#email-draft')?.form?.requestSubmit()}
                        testID="email-save-draft"
                    >
                        Save draft
                    </Button>
                </form>
            ) : null}
            <Status id="email-result">
                {state === 'inbox'
                    ? copyStatus || (saved ? 'Draft saved.' : star ? 'Starred conversation.' : 'Conversation open.')
                    : state === 'archived'
                      ? 'Conversation archived.'
                      : 'Conversation deleted.'}
            </Status>
        </>
    );
}
const components = {
    welcome: Welcome,
    call: Call,
    files: Files,
    shopping: Shopping,
    filters: Filters,
    calculator: Calculator,
    music: Music,
    photo: Photo,
    email: Email,
};
export function ButtonGroupUses() {
    const query = new URLSearchParams(location.search).get('example'),
        [scene, setScene] = useState<Scene>(scenes.some(([id]) => id === query) ? (query as Scene) : 'welcome');
    const Component = components[scene];
    return (
        <section className="usage-section" id="group-uses">
            <Prose as="h2">Ejemplos en acción</Prose>
            <Prose as="p">
                Nueve contextos con acciones locales: la selección, los comandos y el overflow pertenecen al componente original. Los
                controles que rodean al grupo conservan su propia interacción.
            </Prose>
            <SelectField
                label="Pantalla"
                id="group-scenario"
                value={scene}
                className="group-example-picker"
                onValueChange={(nextValue) => setScene(nextValue as Scene)}
                options={scenes.map(([id, label]) => ({ value: id, label: label }))}
            />
            <div className="group-scene" data-testid="group-scene" data-scene={scene}>
                <Component key={scene} />
            </div>
        </section>
    );
}
