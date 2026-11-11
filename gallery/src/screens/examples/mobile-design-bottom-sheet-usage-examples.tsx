import { useState } from 'react';
import { Image, View } from 'react-native';
import {
    BottomSheet,
    BottomSheetScrollView,
    Button,
    Checkbox,
    Icon,
    IconButton,
    List,
    Text,
    TouchableRipple,
    useMobileTheme,
} from 'mobile-design/react-native';

const tracks = [
    { title: 'Cassette Futurism', artist: 'Various artists', art: require('./assets/bottom-sheets/cassette-futurism.png') },
    { title: 'Long Walk', artist: 'L.R. Coleman', art: require('./assets/buttons/long-walk.png') },
    { title: 'In the Dark', artist: 'Sole R. Rey', art: require('./assets/buttons/sole-rey.png') },
];
const filterLabels = ['Work files', 'Priority', 'Personal', 'Reminders', 'Projects', 'Events'];
const documents = [
    { title: 'Onboarding documents', owner: 'Lee Villanueva', tags: ['Work files'] },
    { title: 'Clinic codes', owner: 'Lee Villanueva', tags: ['Work files', 'Priority'] },
    { title: 'Travel plans', owner: 'Personal', tags: ['Personal', 'Events'] },
    { title: 'Project brief', owner: 'Lee Villanueva', tags: ['Projects', 'Priority'] },
    { title: 'Appointment', owner: 'Personal', tags: ['Reminders', 'Events'] },
];

/** A standard surface stays usable alongside the browsable primary content. */
function StandardPlayerSheet() {
    const theme = useMobileTheme();
    const [track, setTrack] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [browsed, setBrowsed] = useState('Saved albums');
    const current = tracks[track];
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleLarge">Music · standard bottom sheet</Text>
            <Text>
                Explora los álbumes mientras la hoja estándar mantiene sus controles disponibles. Los controles ilustran el estado de
                reproducción.
            </Text>
            <View style={{ height: 424, overflow: 'hidden', backgroundColor: theme.colors.surface }}>
                <View style={{ padding: 16, gap: 12 }}>
                    <Text variant="titleMedium" testID="md-sheet-music-browsed">
                        {browsed}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {tracks.map((item, i) => (
                            <TouchableRipple
                                key={item.title}
                                onPress={() => {
                                    setBrowsed(item.title);
                                    setTrack(i);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={`Browse ${item.title}`}
                                style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
                                testID={`md-sheet-album-${i}`}
                            >
                                <View pointerEvents="none" style={{ gap: 8 }}>
                                    <Image source={item.art} style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }} />
                                    <Text variant="labelMedium" numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                </View>
                            </TouchableRipple>
                        ))}
                    </View>
                </View>
                <BottomSheet
                    variant="standard"
                    minimized
                    open
                    onOpenChange={() => {}}
                    dismissible={false}
                    draggable={false}
                    showDragHandle={false}
                    snapPoints={[112]}
                    scrollable
                    accessibilityLabel="Music player"
                    testID="md-sheet-music"
                >
                    <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Image source={current.art} accessibilityLabel={current.title} style={{ width: 64, height: 64 }} />
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text variant="bodyLarge" numberOfLines={1} testID="md-sheet-music-title">
                                    {current.title}
                                </Text>
                                <Text variant="bodyMedium" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                                    {current.artist}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <IconButton
                                    icon={playing ? 'pause' : 'play_arrow'}
                                    accessibilityLabel={playing ? 'Pause' : 'Play'}
                                    onPress={() => setPlaying((value) => !value)}
                                    testID="md-sheet-music-play"
                                />
                                <IconButton
                                    icon="skip_next"
                                    accessibilityLabel="Next track"
                                    onPress={() => setTrack((value) => (value + 1) % tracks.length)}
                                    testID="md-sheet-music-next"
                                />
                            </View>
                        </View>
                    </BottomSheetScrollView>
                </BottomSheet>
            </View>
            <Text accessibilityLiveRegion="polite" testID="md-sheet-music-status">
                {playing ? 'Playing' : 'Paused'} · {current.title}
            </Text>
        </View>
    );
}

/** The published Filters layout applies each checkbox immediately, without extra confirmation controls. */
function FilesFilterSheet() {
    const [open, setOpen] = useState(false);
    const [filters, setFilters] = useState<string[]>(['Work files']);
    const visible = documents.filter((item) => !filters.length || item.tags.some((tag) => filters.includes(tag)));
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleLarge">Files · modal bottom sheet</Text>
            <Text>Las casillas aplican el filtro inmediatamente. Cierra con el handle, el scrim o Atrás; la selección se conserva.</Text>
            <Button icon="filter_list" style={{ alignSelf: 'flex-start' }} onPress={() => setOpen(true)} testID="md-sheet-files-open">
                Filters
            </Button>
            <Text accessibilityLiveRegion="polite" testID="md-sheet-files-count">
                {visible.length} files · {filters.join(', ') || 'All files'}
            </Text>
            <List.Collection>
                {visible.map((item) => (
                    <List.Item
                        key={item.title}
                        title={item.title}
                        description={item.owner}
                        leading={<Icon source="folder" size={24} />}
                        testID={`md-sheet-file-${item.title}`}
                    />
                ))}
            </List.Collection>
            <BottomSheet open={open} onOpenChange={setOpen} accessibilityLabel="Filters" testID="md-sheet-files">
                <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 16 }}>
                    <Text variant="titleLarge" accessibilityRole="header">
                        Filters
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 }}>
                        {filterLabels.map((label, i) => (
                            <View key={label} style={{ flexBasis: '45%', flexGrow: 1, minWidth: 156 }}>
                                <Checkbox.Item
                                    label={label}
                                    status={filters.includes(label) ? 'checked' : 'unchecked'}
                                    position="leading"
                                    onPress={() =>
                                        setFilters((values) =>
                                            values.includes(label) ? values.filter((value) => value !== label) : [...values, label]
                                        )
                                    }
                                    style={{ paddingHorizontal: 0 }}
                                    testID={`md-sheet-filter-${i}`}
                                />
                            </View>
                        ))}
                    </View>
                </View>
            </BottomSheet>
        </View>
    );
}

export function BottomSheetUsageExamples() {
    return (
        <View style={{ gap: 32 }}>
            <StandardPlayerSheet />
            <FilesFilterSheet />
        </View>
    );
}
