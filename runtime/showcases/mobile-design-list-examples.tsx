import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Image, Linking, View } from 'react-native';
import Animated, { LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Avatar,
    Badge,
    Button,
    Checkbox,
    Dialog,
    Divider,
    FullScreenDialog,
    Icon,
    IconButton,
    List,
    LocaleProvider,
    Menu,
    RadioButton,
    SegmentedButtons,
    Snackbar,
    SwipeListGroup,
    SwipeListItem,
    Switch,
    Text,
    ThemeProvider,
    useMobileTheme,
    type SwipeListGroupHandle,
    type SwipeListItemHandle,
} from 'mobile-design/react-native-web';
import { MaterialSymbol } from '@mobile-design/icons/react-native-web';

type ExamplesProps = { onEvent: (message: string) => void };
function Example({ title, children, reference }: { title: string; children: ReactNode; reference?: string }) {
    const theme = useMobileTheme();
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium" accessibilityRole="header">
                {title}
            </Text>
            {children}
            {reference ? <></> : null}
        </View>
    );
}
function Decorative({ children }: { children: ReactNode }) {
    return (
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {children}
        </View>
    );
}
function Glyph({ name, size = 20 }: { name: string; size?: number }) {
    const theme = useMobileTheme();
    return <Icon source={name} size={size} color={theme.colors.onSurfaceVariant} />;
}
function SelectionMark({
    kind = 'checkbox',
    selected,
    disabled = false,
}: {
    kind?: 'checkbox' | 'radio' | 'switch';
    selected: boolean;
    disabled?: boolean;
}) {
    // The entire row owns the 48dp+ touch target and selection semantics. Its
    // decorative control keeps only its visual bounds in the slot layout.
    return (
        <Decorative>
            <View
                style={{
                    width: kind === 'switch' ? 52 : 24,
                    height: kind === 'switch' ? 32 : 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {kind === 'switch' ? (
                    <Switch value={selected} disabled={disabled} />
                ) : kind === 'radio' ? (
                    <RadioButton value="item" status={selected ? 'checked' : 'unchecked'} disabled={disabled} />
                ) : (
                    <Checkbox status={selected ? 'checked' : 'unchecked'} disabled={disabled} accessible={false} />
                )}
            </View>
        </Decorative>
    );
}
function SpecMedia({ video = false }: { video?: boolean }) {
    const theme = useMobileTheme();
    return (
        <Decorative>
            <View
                style={{
                    width: video ? 114 : 56,
                    height: video ? 64 : 56,
                    backgroundColor: theme.colors.surfaceContainerHighest,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <MaterialSymbol name="category" size={32} color={theme.colors.onSurfaceVariant} filled />
            </View>
        </Decorative>
    );
}
const listArtwork = {
    strangers: require('./assets/lists/strangers.png'),
    century: require('./assets/lists/21st-century-strangers.png'),
    decorations: require('./assets/lists/decorations.png'),
    likesAuto: require('./assets/lists/likes-auto.png'),
    likesMusic: require('./assets/lists/likes-music.png'),
    partyMix: require('./assets/lists/party-mix.png'),
    arts: require('./assets/lists/arts.png'),
} as const;
function Artwork({ source, size = 56 }: { source: number; size?: number }) {
    return (
        <Decorative>
            <Image source={source} accessibilityIgnoresInvertColors style={{ width: size, height: size, borderRadius: 4 }} />
        </Decorative>
    );
}

/** The catalogue owns only examples; complete navigation/gesture scenarios live in its FAB. */
export function ListExamples({ onEvent }: ExamplesProps) {
    const [detail, setDetail] = useState<string | null>(null);
    return (
        <View style={{ gap: 28 }} testID="catalog-list-gallery">
            <ListStyleExamples onEvent={onEvent} />
            <Example title="Single-action" reference="specs">
                <List.Group variant="standard">
                    {[0, 1, 2, 3].map((index) => (
                        <List.Item
                            key={index}
                            title="List item"
                            leading={({ color }) => <MaterialSymbol name="stars" color={color} size={20} />}
                            onPress={() => setDetail(`List item ${index + 1}`)}
                            testID={`catalog-list-single-action-${index}`}
                        />
                    ))}
                </List.Group>
            </Example>
            <InteractionSpecExamples onOpen={setDetail} />
            <MultiActionExamples onOpen={setDetail} onEvent={onEvent} />
            <SingleSelectExamples onEvent={onEvent} />
            <MultiSelectExamples onEvent={onEvent} />
            <SwitchListExamples onEvent={onEvent} />
            <ExpandableSpecExample onEvent={onEvent} />
            <SwipeSpecExample onOpen={setDetail} onEvent={onEvent} />
            <AnatomyExamples onOpen={setDetail} />
            <SlotExamples onOpen={setDetail} />
            <SupportingTextExamples onOpen={setDetail} />
            <SelectionStateExamples onEvent={onEvent} />
            <BaselineExamples onOpen={setDetail} />
            <ListAccessibilityExamples onEvent={onEvent} />
            <Dialog
                visible={detail !== null}
                accessibilityLabel={detail ?? undefined}
                onDismiss={() => setDetail(null)}
                testID="catalog-list-detail"
            >
                <Dialog.Title>{detail}</Dialog.Title>
                <Dialog.Content>
                    Cierra esta vista para regresar a la lista y conservar las selecciones. Los ejemplos completos de navegación y contenido
                    están en el selector de ejemplos.
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setDetail(null)}>
                        Cerrar
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
}
function ListStyleExamples({ onEvent }: { onEvent: ExamplesProps['onEvent'] }) {
    const [selected, setSelected] = useState({ standard: 2, segmented: 2 });
    return (
        <Example title="Styles · Standard / Segmented" reference="specs">
            {(['standard', 'segmented'] as const).map((variant) => (
                <View key={variant} style={{ gap: 8 }}>
                    <Text variant="labelLarge">{variant === 'standard' ? 'Standard' : 'Segmented'}</Text>
                    <List.Group variant={variant}>
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                            <List.Item
                                key={index}
                                title="List item"
                                selectionMode="single"
                                selected={selected[variant] === index}
                                leading={({ color }) => (
                                    <MaterialSymbol name="stars" color={color} size={20} filled={selected[variant] === index} />
                                )}
                                trailing="⌘C"
                                onPress={() => {
                                    setSelected((previous) => ({ ...previous, [variant]: index }));
                                    onEvent(`${variant}: List item ${index + 1}.`);
                                }}
                                testID={`catalog-list-style-${variant}-${index}`}
                            />
                        ))}
                    </List.Group>
                </View>
            ))}
        </Example>
    );
}
function SingleSelectExamples({ onEvent }: { onEvent: ExamplesProps['onEvent'] }) {
    const [choice, setChoice] = useState('balanced');
    return (
        <Example title="Single-select · radio buttons" reference="guidelines">
            <View accessibilityRole="radiogroup" accessibilityLabel="Select one list item">
                <List.Group>
                    {['quality', 'balanced', 'small'].map((id, index) => (
                        <List.Item
                            key={id}
                            title={index ? `List item ${index + 1}` : 'List item'}
                            selectionMode="single"
                            selected={choice === id}
                            leading={<SelectionMark kind="radio" selected={choice === id} />}
                            onPress={() => {
                                setChoice(id);
                                onEvent(`Selected List item ${index + 1}.`);
                            }}
                            testID={`catalog-list-radio-${id}`}
                        />
                    ))}
                </List.Group>
            </View>
        </Example>
    );
}
function MultiSelectExamples({ onEvent }: { onEvent: ExamplesProps['onEvent'] }) {
    const [selected, setSelected] = useState(['texture', 'draft']);
    return (
        <Example title="Multi-select · checkboxes" reference="guidelines">
            <List.Group>
                {['landscape', 'texture', 'draft'].map((id, index) => (
                    <List.Item
                        key={id}
                        title={index ? `List item ${index + 1}` : 'List item'}
                        selectionMode="multiple"
                        selected={selected.includes(id)}
                        leading={<SelectionMark selected={selected.includes(id)} />}
                        onPress={() => {
                            setSelected((previous) => (previous.includes(id) ? previous.filter((key) => key !== id) : [...previous, id]));
                            onEvent(`Selection changed: List item ${index + 1}.`);
                        }}
                        testID={`catalog-list-checkbox-${id}`}
                    />
                ))}
            </List.Group>
        </Example>
    );
}
function SwitchListExamples({ onEvent }: { onEvent: ExamplesProps['onEvent'] }) {
    const [values, setValues] = useState({ notifications: true, offline: false, third: true });
    return (
        <Example title="Multi-select · switches" reference="specs">
            <List.Group>
                {(['notifications', 'offline', 'third'] as const).map((id, index) => (
                    <List.Item
                        key={id}
                        title="Label text"
                        description={index ? 'Supporting text' : undefined}
                        leading={({ color }) => <MaterialSymbol name="person" color={color} size={20} />}
                        accessibilityRole="switch"
                        selected={values[id]}
                        trailing={<SelectionMark kind="switch" selected={values[id]} />}
                        onPress={() => {
                            setValues((previous) => ({ ...previous, [id]: !previous[id] }));
                            onEvent(`Switch ${index + 1} changed.`);
                        }}
                        testID={`catalog-list-switch-${id}`}
                    />
                ))}
            </List.Group>
        </Example>
    );
}
function InteractionSpecExamples({ onOpen }: { onOpen: (title: string) => void }) {
    const [single, setSingle] = useState(2),
        [multiple, setMultiple] = useState([2, 3]);
    return (
        <>
            <Example title="Multi-action · Specs" reference="specs">
                <List.Group>
                    {[0, 1, 2, 3].map((index) => (
                        <SpecMultiActionRow key={index} index={index} onOpen={onOpen} />
                    ))}
                </List.Group>
            </Example>
            {(['single', 'multiple'] as const).map((mode) => (
                <Example key={mode} title={mode === 'single' ? 'Single-select · Specs' : 'Multi-select · Specs'} reference="specs">
                    <List.Group variant={mode === 'single' ? 'standard' : 'segmented'}>
                        {[0, 1, 2, 3].map((index) => {
                            const selected = mode === 'single' ? single === index : multiple.includes(index);
                            return (
                                <List.Item
                                    key={index}
                                    title="List item"
                                    selectionMode={mode}
                                    selected={selected}
                                    leading={({ color }) => <MaterialSymbol name="stars" color={color} size={20} filled={selected} />}
                                    onPress={() =>
                                        mode === 'single'
                                            ? setSingle(index)
                                            : setMultiple((previous) =>
                                                  previous.includes(index)
                                                      ? previous.filter((value) => value !== index)
                                                      : [...previous, index]
                                              )
                                    }
                                    testID={`catalog-list-spec-${mode}-${index}`}
                                />
                            );
                        })}
                    </List.Group>
                </Example>
            ))}
        </>
    );
}
function SpecMultiActionRow({ index, onOpen }: { index: number; onOpen: (title: string) => void }) {
    const [saved, setSaved] = useState(false),
        [menu, setMenu] = useState(false);
    return (
        <List.Item
            title="List item"
            multiAction
            leading={({ color }) => <MaterialSymbol name="stars" color={color} size={20} />}
            trailing={({ color, height, style }) => (
                <View style={[style, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                    <IconButton
                        icon={({ size, color: ink }) => <MaterialSymbol name="bookmark" size={size} color={ink} filled={saved} />}
                        selected={saved}
                        iconColor={color}
                        style={{ height }}
                        contentStyle={{ height }}
                        accessibilityLabel={`${saved ? 'Unsave' : 'Save'} List item ${index + 1}`}
                        onPress={() => setSaved((previous) => !previous)}
                        testID={`catalog-list-spec-bookmark-${index}`}
                    />
                    <Menu
                        visible={menu}
                        onDismiss={() => setMenu(false)}
                        anchor={
                            <IconButton
                                icon="more_horiz"
                                iconColor={color}
                                style={{ height }}
                                contentStyle={{ height }}
                                accessibilityLabel={`More actions for List item ${index + 1}`}
                                onPress={() => setMenu(true)}
                                testID={`catalog-list-spec-more-${index}`}
                            />
                        }
                    >
                        <Menu.Item
                            title={saved ? 'Remove bookmark' : 'Save'}
                            leadingIcon="bookmark"
                            onPress={() => {
                                setSaved((previous) => !previous);
                                setMenu(false);
                            }}
                            testID={`catalog-list-spec-menu-save-${index}`}
                        />
                        <Menu.Item
                            title="View details"
                            leadingIcon="info"
                            onPress={() => {
                                setMenu(false);
                                onOpen(`List item ${index + 1}`);
                            }}
                            testID={`catalog-list-spec-menu-detail-${index}`}
                        />
                    </Menu>
                </View>
            )}
            onPress={() => onOpen(`List item ${index + 1}`)}
            testID={`catalog-list-spec-multi-${index}`}
        />
    );
}
function MultiActionExamples({ onOpen, onEvent }: { onOpen: (title: string) => void; onEvent: ExamplesProps['onEvent'] }) {
    const [saved, setSaved] = useState<string[]>([]);
    const [menu, setMenu] = useState<string | null>(null);
    const songs = [
        { title: 'Strangers', artist: 'Trapezoid', source: listArtwork.strangers },
        { title: '21st Century Strangers', artist: 'For Now', source: listArtwork.century },
        { title: 'Decorations', artist: 'Personal Voice', source: listArtwork.decorations },
    ];
    return (
        <Example title="Multi-action · primary / secondary areas" reference="guidelines">
            <List.Group>
                {songs.map((song, index) => (
                    <List.Item
                        key={song.title}
                        title={song.title}
                        description={song.artist}
                        multiAction
                        leading={<Artwork source={song.source} />}
                        trailing={({ height, style, color }) => (
                            <View style={[style, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                                <IconButton
                                    icon={({ size, color: ink }) => (
                                        <MaterialSymbol name="bookmark" size={size} color={ink} filled={saved.includes(song.title)} />
                                    )}
                                    mode="outlined"
                                    iconColor={color}
                                    selected={saved.includes(song.title)}
                                    style={{ height, minWidth: 48 }}
                                    contentStyle={{ height }}
                                    accessibilityLabel={`${saved.includes(song.title) ? 'Unsave' : 'Save'} ${song.title}`}
                                    onPress={() => {
                                        setSaved((previous) =>
                                            previous.includes(song.title)
                                                ? previous.filter((value) => value !== song.title)
                                                : [...previous, song.title]
                                        );
                                        onEvent(`${song.title}: bookmark changed.`);
                                    }}
                                    testID={`catalog-list-secondary-${index}`}
                                />
                                <Menu
                                    visible={menu === song.title}
                                    onDismiss={() => setMenu(null)}
                                    anchor={
                                        <IconButton
                                            icon="more_horiz"
                                            iconColor={color}
                                            style={{ height, minWidth: 48 }}
                                            contentStyle={{ height }}
                                            accessibilityLabel={`More actions for ${song.title}`}
                                            onPress={() => setMenu(song.title)}
                                            testID={`catalog-list-more-${index}`}
                                        />
                                    }
                                >
                                    <Menu.Item
                                        title={saved.includes(song.title) ? 'Remove bookmark' : 'Save'}
                                        leadingIcon="bookmark"
                                        onPress={() => {
                                            setSaved((previous) =>
                                                previous.includes(song.title)
                                                    ? previous.filter((value) => value !== song.title)
                                                    : [...previous, song.title]
                                            );
                                            setMenu(null);
                                        }}
                                        testID={`catalog-list-menu-save-${index}`}
                                    />
                                    <Menu.Item
                                        title="View details"
                                        leadingIcon="info"
                                        onPress={() => {
                                            setMenu(null);
                                            onOpen(song.title);
                                        }}
                                        testID={`catalog-list-menu-detail-${index}`}
                                    />
                                </Menu>
                            </View>
                        )}
                        onPress={() => onOpen(song.title)}
                        testID={`catalog-list-multi-action-${index}`}
                    />
                ))}
            </List.Group>
        </Example>
    );
}
function ExpandableSpecExample({ onEvent }: { onEvent: ExamplesProps['onEvent'] }) {
    const [selected, setSelected] = useState(2);
    return (
        <Example title="Expandable list · one to six items" reference="specs">
            <List.Accordion
                title="List item"
                leading={({ color }) => <MaterialSymbol name="stars" color={color} size={20} />}
                testID="catalog-list-expand"
            >
                <List.Group>
                    {[1, 2, 3, 4, 5].map((index) => (
                        <List.Item
                            key={index}
                            title="List item"
                            selectionMode="single"
                            selected={selected === index}
                            leading={({ color }) => <MaterialSymbol name="stars" color={color} size={20} filled={selected === index} />}
                            onPress={() => {
                                setSelected(index);
                                onEvent(`Expanded List item ${index + 1} selected.`);
                            }}
                            testID={`catalog-list-expand-child-${index}`}
                        />
                    ))}
                </List.Group>
            </List.Accordion>
        </Example>
    );
}
function SwipeSpecExample({ onOpen, onEvent }: { onOpen: (title: string) => void; onEvent: ExamplesProps['onEvent'] }) {
    const [removed, setRemoved] = useState<number[]>([]);
    return (
        <Example title="Swipe to reveal · three actions" reference="specs">
            <Text variant="bodySmall">
                Desliza una fila para revelar Favorite, Move out y Edit. El menú ofrece las mismas acciones sin el gesto.
            </Text>
            <SwipeListGroup>
                <List.Group variant="standard">
                    {[0, 1, 2, 3, 4, 5]
                        .filter((index) => !removed.includes(index))
                        .map((index) => (
                            <SwipeSpecRow
                                key={index}
                                index={index}
                                onRemove={() => {
                                    setRemoved((previous) => [...previous, index]);
                                    onEvent(`List item ${index + 1} moved out.`);
                                }}
                                onEdit={() => onOpen(`Edit · Label text ${index + 1}`)}
                            />
                        ))}
                </List.Group>
            </SwipeListGroup>
        </Example>
    );
}
function SwipeSpecRow({ index, onRemove, onEdit }: { index: number; onRemove: () => void; onEdit: () => void }) {
    const [favorite, setFavorite] = useState(false),
        [menu, setMenu] = useState(false);
    const actions = [
        {
            key: 'favorite',
            label: favorite ? 'Remove favorite' : 'Favorite',
            icon: favorite ? 'star' : 'star-outline',
            onPress: () => setFavorite((previous) => !previous),
        },
        { key: 'move', label: 'Move out', icon: 'logout', onPress: onRemove },
        { key: 'edit', label: 'Edit', icon: 'edit', variant: 'filled' as const, onPress: onEdit },
    ];
    return (
        <SwipeListItem id={`spec-${index}`} trailingActions={actions} trailingSwipeMode="indirect" testID={`catalog-list-swipe-${index}`}>
            <List.Item
                title="Label text"
                metadata="⌘C"
                multiAction
                leading={({ color }) => <MaterialSymbol name="stars" color={color} size={20} filled={favorite} />}
                trailing={({ color, height, style }) => (
                    <View style={[style, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                        <Menu
                            visible={menu}
                            onDismiss={() => setMenu(false)}
                            anchor={
                                <IconButton
                                    icon="more_vert"
                                    iconColor={color}
                                    style={{ height }}
                                    contentStyle={{ height }}
                                    accessibilityLabel={`Actions for List item ${index + 1}`}
                                    onPress={() => setMenu(true)}
                                    testID={`catalog-list-swipe-menu-${index}`}
                                />
                            }
                        >
                            {actions.map((action) => (
                                <Menu.Item
                                    key={action.key}
                                    title={action.label}
                                    leadingIcon={action.icon}
                                    onPress={() => {
                                        setMenu(false);
                                        action.onPress();
                                    }}
                                    testID={`catalog-list-swipe-menu-${index}-${action.key}`}
                                />
                            ))}
                        </Menu>
                    </View>
                )}
                onPress={onEdit}
                testID={`catalog-list-swipe-item-${index}`}
            />
        </SwipeListItem>
    );
}
function AnatomyExamples({ onOpen }: { onOpen: (title: string) => void }) {
    return (
        <Example title="Anatomy · leading / content / trailing" reference="specs">
            <List.Group>
                <List.Item
                    title="Label text"
                    overline="Overline"
                    leading={<SpecMedia video />}
                    trailing="100+"
                    onPress={() => onOpen('Label text')}
                    testID="catalog-list-anatomy-media"
                />
                <List.Item
                    title="Label text"
                    description="Supporting text"
                    leading={({ color }) => <MaterialSymbol name="person" color={color} size={20} />}
                    onPress={() => onOpen('Supporting text')}
                    testID="catalog-list-anatomy-icon"
                />
                <List.Item
                    title="Label text"
                    description="Supporting text"
                    leading={
                        <Decorative>
                            <Avatar.Text label="A" size={40} />
                        </Decorative>
                    }
                    trailing={({ color }) => <MaterialSymbol name="arrow_right" color={color} size={20} />}
                    onPress={() => onOpen('Avatar and trailing icon')}
                    testID="catalog-list-anatomy-avatar"
                />
            </List.Group>
            <Divider />
            <Text variant="bodySmall">
                Contenedor y etiqueta son obligatorios. Overline, apoyo, metadatos, iconos, avatar, imagen, vídeo y divisores son
                opcionales.
            </Text>
        </Example>
    );
}
function SlotExamples({ onOpen }: { onOpen: (title: string) => void }) {
    const theme = useMobileTheme();
    const [selected, setSelected] = useState('music');
    return (
        <Example title="Slots · content is the largest area" reference="specs">
            <List.Group>
                {[
                    { id: 'auto', title: 'Your Likes', source: listArtwork.likesAuto, description: 'Auto playlist', icon: 'push_pin' },
                    { id: 'music', title: 'Your Likes', source: listArtwork.likesMusic, description: 'Music · 8 songs' },
                    {
                        id: 'party',
                        title: 'Party Mix',
                        source: listArtwork.partyMix,
                        description: 'Daisy Chain · 16 songs',
                        icon: 'check_circle',
                    },
                ].map((item) => (
                    <List.Item
                        key={item.id}
                        title={item.title}
                        description={item.description}
                        selectionMode="single"
                        selected={selected === item.id}
                        leading={
                            <Decorative>
                                <View style={{ width: 56, height: 56, justifyContent: 'center', alignItems: 'center' }}>
                                    <Image source={item.source} style={{ width: 56, height: 56, borderRadius: 4 }} />
                                    {selected === item.id ? (
                                        <View
                                            style={{
                                                position: 'absolute',
                                                width: 22,
                                                height: 22,
                                                borderRadius: 11,
                                                backgroundColor: theme.colors.secondaryContainer,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <MaterialSymbol name="check" size={16} color={theme.colors.onSecondaryContainer} />
                                        </View>
                                    ) : null}
                                </View>
                            </Decorative>
                        }
                        content={
                            <View style={{ minWidth: 0, gap: 2 }}>
                                <Text variant="bodyLarge" numberOfLines={1}>
                                    {item.title}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    {item.icon ? (
                                        <MaterialSymbol name={item.icon} size={14} color={theme.colors.onSurfaceVariant} filled />
                                    ) : null}
                                    <Text variant="bodyMedium" numberOfLines={1} style={{ flexShrink: 1 }}>
                                        {item.description}
                                    </Text>
                                </View>
                            </View>
                        }
                        onPress={() => setSelected(item.id)}
                        testID={`catalog-list-slot-${item.id}`}
                    />
                ))}
            </List.Group>
            <List.Item
                title="Photos"
                description="updated yesterday"
                multiAction
                position="only"
                leading={
                    <Decorative>
                        <Avatar.Icon icon="folder" size={40} />
                    </Decorative>
                }
                trailing={({ height, style, color }) => (
                    <IconButton
                        icon="info"
                        iconColor={color}
                        style={style}
                        contentStyle={{ height }}
                        accessibilityLabel="Information about Photos"
                        onPress={() => onOpen('Photos · updated yesterday')}
                        testID="catalog-list-photos-info"
                    />
                )}
                onPress={() => onOpen('Photos')}
                testID="catalog-list-custom-slots"
            />
        </Example>
    );
}
function SupportingTextExamples({ onOpen }: { onOpen: (title: string) => void }) {
    return (
        <Example title="Label text and supporting text · 1–3 lines" reference="guidelines">
            {([0, 1, 2] as const).map((support) => (
                <View key={support} style={{ gap: 8 }}>
                    <Text variant="labelLarge">
                        {support === 0 ? 'Label text only' : `${support} ${support === 1 ? 'line' : 'lines'} of supporting text`}
                    </Text>
                    <List.Group>
                        {['A', 'B', 'C'].map((label, index) => (
                            <List.Item
                                key={label}
                                title={index ? `Label text ${index + 1}` : 'Label text'}
                                description={
                                    support === 0
                                        ? undefined
                                        : support === 1
                                          ? 'Supporting text'
                                          : 'Supporting text that’s long enough to fill up multiple lines'
                                }
                                descriptionNumberOfLines={support === 2 ? 2 : 1}
                                leading={
                                    <Decorative>
                                        <Avatar.Text label={label} size={40} />
                                    </Decorative>
                                }
                                onPress={() => onOpen(`Label text ${index + 1}`)}
                                testID={`catalog-list-support-${support}-${index}`}
                            />
                        ))}
                    </List.Group>
                </View>
            ))}
            {([1, 2, 3] as const).map((lines) => (
                <List.Item
                    key={lines}
                    title="Art events"
                    description="Literature, games, music, physical and visual forms – explore the art that’s happening around you."
                    descriptionNumberOfLines={lines}
                    leading={<Artwork source={listArtwork.arts} />}
                    onPress={() => onOpen('Art events')}
                    testID={`catalog-list-support-limit-${lines}`}
                />
            ))}
        </Example>
    );
}
function SelectionStateExamples({ onEvent }: { onEvent: ExamplesProps['onEvent'] }) {
    const [selected, setSelected] = useState(['vancouver']);
    const [states, setStates] = useState(['selected']);
    return (
        <>
            <Example title="Selection · color + checkmark" reference="accessibility">
                <List.Group variant="standard">
                    {[
                        { id: 'montreal', title: 'Montreal', description: 'Second most populous city' },
                        { id: 'vancouver', title: 'Vancouver', description: 'Major city in British Columbia' },
                        { id: 'calgary', title: 'Calgary', description: 'A city in Alberta' },
                        { id: 'winnipeg', title: 'Winnipeg', description: 'Capital of Manitoba' },
                        { id: 'quebec', title: 'Quebec City', description: 'French speaking city' },
                    ].map((city) => (
                        <List.Item
                            key={city.id}
                            title={city.title}
                            description={city.description}
                            selectionMode="multiple"
                            selected={selected.includes(city.id)}
                            leading={({ color }) => (
                                <View style={{ width: 20, height: 20 }}>
                                    {selected.includes(city.id) ? <MaterialSymbol name="check" color={color} size={20} /> : null}
                                </View>
                            )}
                            onPress={() => {
                                setSelected((previous) =>
                                    previous.includes(city.id) ? previous.filter((id) => id !== city.id) : [...previous, city.id]
                                );
                                onEvent(`${city.title}: selection changed.`);
                            }}
                            testID={`catalog-list-city-${city.id}`}
                        />
                    ))}
                </List.Group>
            </Example>
            <Example title="States · enabled / disabled / selected" reference="specs">
                <Text variant="bodySmall">
                    Presiona y suelta para ver la forma y el ripple. Con puntero o teclado se muestran hover y foco reales. El estado
                    dragged se prueba arrastrando en My top favorites desde el FAB.
                </Text>
                <List.Group>
                    {[
                        { id: 'enabled', label: 'Label text', disabled: false },
                        { id: 'selected', label: 'Label text 2', disabled: false },
                        { id: 'disabled', label: 'Label text 3', disabled: true },
                        { id: 'selected-disabled', label: 'Label text 4', disabled: true },
                    ].map((item) => {
                        const checked = states.includes(item.id) || item.id === 'selected-disabled';
                        return (
                            <List.Item
                                key={item.id}
                                title={item.label}
                                description="Supporting text"
                                selectionMode="multiple"
                                selected={checked}
                                disabled={item.disabled}
                                trailing={<SelectionMark selected={checked} disabled={item.disabled} />}
                                onPress={() =>
                                    setStates((previous) =>
                                        previous.includes(item.id) ? previous.filter((id) => id !== item.id) : [...previous, item.id]
                                    )
                                }
                                testID={`catalog-list-state-${item.id}`}
                            />
                        );
                    })}
                </List.Group>
            </Example>
        </>
    );
}
const baselineConfigurations = [
    { kind: 'avatar', title: 'Leading avatar', reference: 'S29' },
    { kind: 'image', title: 'Leading image', reference: 'S30' },
    { kind: 'video', title: 'Leading video', reference: 'S31' },
    { kind: 'icon', title: 'Leading icon', reference: 'S32' },
    { kind: 'text', title: 'Text only', reference: 'S33' },
    { kind: 'checkbox', title: 'Leading checkbox / trailing text', reference: 'S34' },
    { kind: 'radio', title: 'Leading radio button / trailing text', reference: 'S35' },
    { kind: 'switch', title: 'Trailing switch / leading icon', reference: 'S36' },
] as const;
function BaselineExamples({ onOpen }: { onOpen: (title: string) => void }) {
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [radio, setRadio] = useState({ plain: 2, paired: 2 });
    const value = (id: string) => checked[id] ?? true;
    return (
        <Example title="Baseline · one / two / three lines" reference="specs">
            <Text variant="bodyMedium">
                Baseline conserva esquinas rectas y alturas mínimas de 56, 72 y 88 dp. Los controles decorativos no añaden otro objetivo
                táctil a la fila.
            </Text>
            {baselineConfigurations.map(({ kind, title, reference }) => (
                <View key={kind} style={{ gap: 12 }} testID={`catalog-list-baseline-config-${kind}`}>
                    <Text variant="labelLarge">
                        {title} · {reference}
                    </Text>
                    {(['plain', 'paired'] as const).map((configuration) => (
                        <View key={configuration} style={{ gap: 8 }}>
                            <Text variant="bodySmall">
                                {configuration === 'plain'
                                    ? kind === 'switch'
                                        ? 'Text and switch'
                                        : 'Leading / content'
                                    : kind === 'checkbox' || kind === 'radio'
                                      ? 'With trailing text'
                                      : kind === 'switch'
                                        ? 'With leading icon'
                                        : 'With trailing checkbox'}
                            </Text>
                            <View>
                                {([1, 2, 3] as const).map((lines) => {
                                    const id = `${kind}-${configuration}-${lines}`;
                                    const selectable =
                                        kind === 'checkbox' || kind === 'radio' || kind === 'switch' || configuration === 'paired';
                                    const selected = kind === 'radio' ? radio[configuration] === lines : value(id);
                                    const leading =
                                        kind === 'avatar' ? (
                                            <Decorative>
                                                <Avatar.Text label="A" size={40} />
                                            </Decorative>
                                        ) : kind === 'image' || kind === 'video' ? (
                                            <SpecMedia video={kind === 'video'} />
                                        ) : kind === 'checkbox' || kind === 'radio' ? (
                                            <SelectionMark kind={kind} selected={selected} />
                                        ) : undefined;
                                    return (
                                        <List.Item
                                            key={lines}
                                            variant="baseline"
                                            lines={lines}
                                            title="Label text"
                                            description={
                                                lines === 1
                                                    ? undefined
                                                    : lines === 2
                                                      ? 'Supporting text'
                                                      : 'Supporting text that is long enough to fill up multiple lines'
                                            }
                                            descriptionNumberOfLines={lines === 3 ? 2 : 1}
                                            leading={
                                                leading ??
                                                (kind === 'icon' || (kind === 'switch' && configuration === 'paired')
                                                    ? ({ color }) => <MaterialSymbol name="person" color={color} size={24} />
                                                    : undefined)
                                            }
                                            trailing={
                                                kind === 'switch' ? (
                                                    <SelectionMark kind="switch" selected={selected} />
                                                ) : kind === 'checkbox' || kind === 'radio' ? (
                                                    configuration === 'paired' ? (
                                                        '100+'
                                                    ) : undefined
                                                ) : configuration === 'paired' ? (
                                                    <SelectionMark selected={selected} />
                                                ) : undefined
                                            }
                                            selectionMode={
                                                selectable && kind !== 'switch' ? (kind === 'radio' ? 'single' : 'multiple') : undefined
                                            }
                                            accessibilityRole={kind === 'switch' ? 'switch' : undefined}
                                            selected={selected}
                                            onPress={() => {
                                                if (kind === 'radio') setRadio((previous) => ({ ...previous, [configuration]: lines }));
                                                else if (selectable)
                                                    setChecked((previous) => ({ ...previous, [id]: !(previous[id] ?? true) }));
                                                else onOpen(`Label text · ${title} · ${lines} line`);
                                            }}
                                            testID={`catalog-list-baseline-${id}`}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    ))}
                </View>
            ))}
        </Example>
    );
}
function ListAccessibilityExamples({ onEvent }: { onEvent: ExamplesProps['onEvent'] }) {
    const theme = useMobileTheme();
    const enlargedTheme = useMemo(
        () => ({
            ...theme,
            fonts: {
                ...theme.fonts,
                bodyLarge: { ...theme.fonts.bodyLarge, fontSize: 32, lineHeight: 48 },
                bodyMedium: { ...theme.fonts.bodyMedium, fontSize: 28, lineHeight: 40 },
                labelSmall: { ...theme.fonts.labelSmall, fontSize: 22, lineHeight: 32 },
            },
        }),
        [theme]
    );
    const [bread, setBread] = useState(true);
    return (
        <>
            <Example title="Accessibility · targets and text at 200%" reference="accessibility">
                <Text variant="bodyMedium">
                    La fila completa es el objetivo táctil; las acciones secundarias conservan su propio objetivo de al menos 48 dp. Esta
                    muestra duplica únicamente la tipografía local.
                </Text>
                <ThemeProvider theme={enlargedTheme}>
                    <List.Item
                        position="only"
                        title="Bread"
                        description="sourdough, or wheat"
                        titleNumberOfLines={2}
                        descriptionNumberOfLines={3}
                        selectionMode="multiple"
                        selected={bread}
                        trailing={<SelectionMark selected={bread} />}
                        onPress={() => {
                            setBread((previous) => !previous);
                            onEvent('Bread: selection changed.');
                        }}
                        testID="catalog-list-text-200"
                    />
                </ThemeProvider>
            </Example>
            <Example title="Right-to-left" reference="accessibility">
                <LocaleProvider direction="rtl">
                    <View style={{ direction: 'rtl' }}>
                        <List.Item
                            position="only"
                            title="الصور"
                            description="تم التحديث بالأمس"
                            leading={
                                <Decorative>
                                    <Avatar.Icon size={40} icon="folder" />
                                </Decorative>
                            }
                            trailing="100+"
                            onPress={() => onEvent('Photos selected in RTL.')}
                            testID="catalog-list-rtl"
                        />
                    </View>
                </LocaleProvider>
            </Example>
        </>
    );
}

type Message = {
    id: string;
    sender: string;
    subject: string;
    preview: string;
    time: string;
    read: boolean;
    saved: boolean;
    archived: boolean;
};
type Mailbox = 'inbox' | 'saved' | 'archived';
const INITIAL_MESSAGES: readonly Message[] = [
    {
        id: 'workshop',
        sender: 'Ana López',
        subject: 'Materiales para el taller',
        preview: 'Te comparto las referencias y el programa de mañana.',
        time: '10:42',
        read: false,
        saved: false,
        archived: false,
    },
    {
        id: 'trip',
        sender: 'Luis Mendoza',
        subject: 'La ruta del fin de semana',
        preview: 'Agregué dos lugares a nuestro recorrido.',
        time: '09:30',
        read: false,
        saved: true,
        archived: false,
    },
    {
        id: 'receipt',
        sender: 'Tienda del barrio',
        subject: 'Tu recibo de compra',
        preview: 'Gracias por tu visita. Aquí está tu comprobante.',
        time: '08:15',
        read: true,
        saved: false,
        archived: false,
    },
    {
        id: 'review',
        sender: 'Equipo de diseño',
        subject: 'Revisión del proyecto',
        preview: 'La siguiente revisión será el jueves a las once.',
        time: 'Ayer',
        read: true,
        saved: false,
        archived: false,
    },
    {
        id: 'photos',
        sender: 'Carla Ruiz',
        subject: 'Fotos de la reunión',
        preview: 'Quedaron listas las fotografías de la semana pasada.',
        time: 'Ayer',
        read: false,
        saved: false,
        archived: false,
    },
    {
        id: 'library',
        sender: 'Biblioteca',
        subject: 'Tu reserva está disponible',
        preview: 'Puedes recoger el libro durante esta semana.',
        time: 'Lun',
        read: true,
        saved: true,
        archived: false,
    },
    {
        id: 'notes',
        sender: 'Marta García',
        subject: 'Notas de la sesión anterior',
        preview: 'Guardé los acuerdos y las tareas pendientes.',
        time: 'Dom',
        read: true,
        saved: false,
        archived: true,
    },
    {
        id: 'invite',
        sender: 'Comunidad',
        subject: 'Invitación de octubre',
        preview: 'Nos vemos en el próximo encuentro mensual.',
        time: 'Sáb',
        read: true,
        saved: false,
        archived: false,
    },
];

/** A real virtualized mailbox. All destructive operations affect only these local example records. */
export function ListPlayground({ onEvent }: { onEvent: ExamplesProps['onEvent'] }) {
    const theme = useMobileTheme();
    const insets = useSafeAreaInsets();
    const [items, setItems] = useState<Message[]>(() => INITIAL_MESSAGES.map((item) => ({ ...item })));
    const [mailbox, setMailbox] = useState<Mailbox>('inbox');
    const [detailID, setDetailID] = useState<string | null>(null);
    const [undo, setUndo] = useState<{ item: Message; index: number } | null>(null);
    const group = useRef<SwipeListGroupHandle>(null);
    const visible = useMemo(
        () =>
            items.filter((item) =>
                mailbox === 'archived' ? item.archived : mailbox === 'saved' ? item.saved && !item.archived : !item.archived
            ),
        [items, mailbox]
    );
    const detail = items.find((item) => item.id === detailID);
    const change = (id: string, key: 'saved' | 'read' | 'archived') => {
        setItems((previous) => previous.map((item) => (item.id === id ? { ...item, [key]: !item[key] } : item)));
        onEvent(key === 'saved' ? 'Estado guardado cambiado.' : key === 'read' ? 'Estado leído cambiado.' : 'Mensaje movido de bandeja.');
    };
    const remove = (item: Message) => {
        const index = items.findIndex((candidate) => candidate.id === item.id);
        if (index < 0) return;
        setUndo({ item, index });
        setItems((previous) => previous.filter((candidate) => candidate.id !== item.id));
        setDetailID((previous) => (previous === item.id ? null : previous));
        onEvent(`Eliminado: ${item.subject}. Puedes deshacer.`);
    };
    const restore = () => {
        if (!undo) return;
        setItems((previous) => {
            if (previous.some((item) => item.id === undo.item.id)) return previous;
            const next = [...previous];
            next.splice(Math.min(undo.index, next.length), 0, undo.item);
            return next;
        });
        setUndo(null);
        onEvent('Mensaje restaurado.');
    };
    const s = theme.motion.spring.default.spatial;
    const reflow = theme.animation.scale
        ? LinearTransition.springify()
              .stiffness(s.stiffness)
              .damping(2 * s.damping * Math.sqrt(s.stiffness))
              .mass(1)
              .reduceMotion(ReduceMotion.Never)
        : undefined;
    return (
        <View style={{ flex: 1, minHeight: 0, backgroundColor: theme.colors.surfaceContainerLow }} testID="list-playground">
            <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 8 }}>
                <SegmentedButtons
                    value={mailbox}
                    onValueChange={(next) => {
                        group.current?.closeAll();
                        setMailbox(next);
                    }}
                    buttons={[
                        { value: 'inbox', label: 'Entrada', icon: 'inbox-outline', testID: 'list-mailbox-inbox' },
                        { value: 'saved', label: 'Guardado', icon: 'bookmark-outline', testID: 'list-mailbox-saved' },
                        { value: 'archived', label: 'Archivo', icon: 'archive-outline', testID: 'list-mailbox-archived' },
                    ]}
                    testID="list-mailboxes"
                />
                <Text variant="bodySmall">Desliza una fila o abre sus opciones. Eliminar tiene deshacer.</Text>
                <Text variant="labelMedium" accessibilityLiveRegion="polite" testID="list-message-count">
                    {visible.length} mensajes · {visible.filter((item) => !item.read).length} sin leer
                </Text>
            </View>
            <SwipeListGroup ref={group}>
                <Animated.FlatList
                    data={visible}
                    keyExtractor={(item) => item.id}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: insets.bottom + (undo ? 108 : 16) }}
                    itemLayoutAnimation={reflow}
                    onScrollBeginDrag={() => group.current?.closeAll()}
                    keyboardShouldPersistTaps="handled"
                    ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
                    renderItem={({ item, index }) => (
                        <MessageRow
                            item={item}
                            position={
                                visible.length === 1 ? 'only' : index === 0 ? 'first' : index === visible.length - 1 ? 'last' : 'middle'
                            }
                            onChange={(key) => change(item.id, key)}
                            onDelete={() => remove(item)}
                            onOpen={() => {
                                group.current?.closeAll();
                                setItems((previous) =>
                                    previous.map((candidate) => (candidate.id === item.id ? { ...candidate, read: true } : candidate))
                                );
                                setDetailID(item.id);
                            }}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', padding: 32, gap: 12 }}>
                            <Icon
                                source={
                                    mailbox === 'archived' ? 'archive-outline' : mailbox === 'saved' ? 'bookmark-outline' : 'inbox-outline'
                                }
                                size={48}
                                color={theme.colors.onSurfaceVariant}
                            />
                            <Text variant="titleMedium">Esta bandeja está vacía</Text>
                            <Text variant="bodyMedium">Los cambios se conservan al cambiar de bandeja.</Text>
                        </View>
                    }
                    testID="list-messages"
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                />
            </SwipeListGroup>
            <FullScreenDialog
                visible={Boolean(detail)}
                title={detail?.subject ?? ''}
                onDismiss={() => setDetailID(null)}
                testID="list-message-detail"
            >
                {detail ? (
                    <View style={{ gap: 16 }}>
                        <Text variant="titleMedium">{detail.sender}</Text>
                        <Text variant="bodySmall">
                            {detail.time} · {detail.saved ? 'Guardado' : 'Sin guardar'}
                        </Text>
                        <Text variant="bodyLarge">{detail.preview}</Text>
                        <Text variant="bodyMedium">Este mensaje forma parte de los datos locales de la demostración.</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            <Button
                                icon={detail.saved ? 'bookmark' : 'bookmark-outline'}
                                variant="tonal"
                                onPress={() => change(detail.id, 'saved')}
                                testID="list-detail-save"
                            >
                                {detail.saved ? 'Quitar guardado' : 'Guardar'}
                            </Button>
                            <Button
                                icon="archive-outline"
                                variant="outlined"
                                onPress={() => {
                                    change(detail.id, 'archived');
                                    setDetailID(null);
                                }}
                                testID="list-detail-archive"
                            >
                                {detail.archived ? 'Volver a entrada' : 'Archivar'}
                            </Button>
                        </View>
                    </View>
                ) : null}
            </FullScreenDialog>
            <Snackbar
                visible={Boolean(undo)}
                onDismiss={() => setUndo(null)}
                action={{ label: 'Deshacer', onPress: restore, testID: 'list-delete-undo' }}
                onIconPress={() => setUndo(null)}
                iconAccessibilityLabel="Cerrar deshacer"
                testID="list-delete-snackbar"
            >
                Mensaje eliminado
            </Snackbar>
        </View>
    );
}
function MessageRow({
    item,
    position,
    onChange,
    onDelete,
    onOpen,
}: {
    item: Message;
    position: 'first' | 'middle' | 'last' | 'only';
    onChange: (key: 'saved' | 'read' | 'archived') => void;
    onDelete: () => void;
    onOpen: () => void;
}) {
    const [menu, setMenu] = useState(false);
    const swipe = useRef<SwipeListItemHandle>(null);
    const archiveLabel = item.archived ? 'Volver a entrada' : 'Archivar';
    const saveLabel = item.saved ? 'Quitar guardado' : 'Guardar';
    const readLabel = item.read ? 'Marcar no leído' : 'Marcar leído';
    return (
        <SwipeListItem
            ref={swipe}
            id={item.id}
            leadingSwipeMode="direct"
            trailingSwipeMode="indirect"
            leadingActions={[
                {
                    key: 'archive',
                    label: archiveLabel,
                    icon: item.archived ? 'inbox-arrow-down-outline' : 'archive-outline',
                    variant: 'filled',
                    onPress: () => onChange('archived'),
                },
            ]}
            trailingActions={[
                { key: 'save', label: saveLabel, icon: item.saved ? 'bookmark' : 'bookmark-outline', onPress: () => onChange('saved') },
                {
                    key: 'read',
                    label: readLabel,
                    icon: item.read ? 'email-outline' : 'email-open-outline',
                    onPress: () => onChange('read'),
                },
                { key: 'delete', label: 'Eliminar', icon: 'delete-outline', destructive: true, variant: 'filled', onPress: onDelete },
            ]}
            closeAccessibilityLabel={`Cerrar acciones de ${item.subject}`}
            testID={`list-message-${item.id}`}
        >
            <List.Item
                title={item.subject}
                overline={`${item.sender} · ${item.time}`}
                description={item.preview}
                lines={3}
                position={position}
                multiAction
                leading={
                    <Decorative>
                        <View>
                            <Avatar.Text
                                label={item.sender
                                    .split(' ')
                                    .map((word) => word[0])
                                    .slice(0, 2)
                                    .join('')}
                                size={40}
                            />
                            {!item.read ? <Badge variant="dot" style={{ position: 'absolute', end: 0, top: 0 }} /> : null}
                        </View>
                    </Decorative>
                }
                trailing={
                    <Menu
                        visible={menu}
                        onDismiss={() => setMenu(false)}
                        anchor={
                            <IconButton
                                icon="dots-vertical"
                                accessibilityLabel={`Opciones de ${item.subject}`}
                                onPress={() => setMenu(true)}
                                testID={`list-message-${item.id}-more`}
                            />
                        }
                        testID={`list-message-${item.id}-menu`}
                    >
                        <Menu.Item
                            title={archiveLabel}
                            leadingIcon={item.archived ? 'inbox-outline' : 'archive-outline'}
                            onPress={() => onChange('archived')}
                            testID={`list-menu-${item.id}-archive`}
                        />
                        <Menu.Item
                            title={saveLabel}
                            leadingIcon={item.saved ? 'bookmark' : 'bookmark-outline'}
                            onPress={() => onChange('saved')}
                            testID={`list-menu-${item.id}-save`}
                        />
                        <Menu.Item
                            title={readLabel}
                            leadingIcon={item.read ? 'email-outline' : 'email-open-outline'}
                            onPress={() => onChange('read')}
                            testID={`list-menu-${item.id}-read`}
                        />
                        <Menu.Item
                            title="Eliminar"
                            leadingIcon="delete-outline"
                            onPress={onDelete}
                            testID={`list-menu-${item.id}-delete`}
                        />
                        <Menu.Item
                            title="Mostrar archivar"
                            leadingIcon="gesture-swipe-right"
                            onPress={() => swipe.current?.open('leading')}
                            testID={`list-menu-${item.id}-reveal-leading`}
                        />
                        <Menu.Item
                            title="Mostrar más acciones"
                            leadingIcon="gesture-swipe-left"
                            onPress={() => swipe.current?.open('trailing')}
                            testID={`list-menu-${item.id}-reveal-trailing`}
                        />
                    </Menu>
                }
                onPress={onOpen}
                accessibilityLabel={`${item.subject}, ${item.sender}, ${item.read ? 'leído' : 'sin leer'}${item.saved ? ', guardado' : ''}`}
                testID={`list-message-${item.id}-item`}
            />
        </SwipeListItem>
    );
}
