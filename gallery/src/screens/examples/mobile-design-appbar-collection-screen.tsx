import { useEffect, useRef, useState } from 'react';
import { BackHandler, Linking, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
    Button,
    Dialog,
    Divider,
    Icon,
    List,
    SegmentedButtons,
    Switch,
    Text,
    TopAppBar,
    useAppBarScrollBehavior,
    useMobileTheme,
} from 'mobile-design/react-native';

type Bookstore = {
    key: string;
    name: string;
    area: string;
    address: string;
    website: string;
    source: string;
};

// Content for this local use case, verified against the stores' official sites.
// The MD3 figure supplies the App bar composition, not these store records.
const bookstores: readonly Bookstore[] = [
    {
        key: 'last-bookstore',
        name: 'The Last Bookstore',
        area: 'Downtown Los Angeles',
        address: '453 S Spring St, Los Angeles, CA 90013',
        website: 'https://www.lastbookstorela.com/',
        source: 'https://www.lastbookstorela.com/downtown-la',
    },
    {
        key: 'skylight',
        name: 'Skylight Books',
        area: 'Los Angeles',
        address: '1818 N Vermont Ave, Los Angeles, CA 90027',
        website: 'https://skylightbooks.com/',
        source: 'https://skylightbooks.com/contact-us',
    },
    {
        key: 'book-soup',
        name: 'Book Soup',
        area: 'West Hollywood',
        address: '8818 Sunset Blvd, West Hollywood, CA 90069',
        website: 'https://booksoup.com/',
        source: 'https://booksoup.com/',
    },
    {
        key: 'vromans',
        name: 'Vroman’s Bookstore',
        area: 'Pasadena',
        address: '695 E Colorado Blvd, Pasadena, CA 91101',
        website: 'https://vromansbookstore.com/',
        source: 'https://vromansbookstore.com/store_locations',
    },
];
const collectionId = 'md-appbar-bookstores-la';
const savedFileName = 'mobile-design-appbar-bookstores-la-saved.json';

type SavedRecord = { version: 1; id: typeof collectionId; title: string; savedAt: string; stores: readonly Bookstore[] };
type ExportRecord = { file: File; name: string; contents: string };
type Status = { kind: 'info' | 'success' | 'error'; text: string } | null;

function readSavedRecord(value: unknown): SavedRecord {
    if (!value || typeof value !== 'object') throw new Error('Invalid saved collection');
    const record = value as Partial<SavedRecord>;
    if (
        record.version !== 1 ||
        record.id !== collectionId ||
        typeof record.savedAt !== 'string' ||
        !Number.isFinite(Date.parse(record.savedAt)) ||
        !Array.isArray(record.stores) ||
        record.stores.length !== bookstores.length ||
        !bookstores.every((store) => record.stores!.some((item) => item && item.key === store.key))
    ) {
        throw new Error('Invalid saved collection');
    }
    return record as SavedRecord;
}

function deleteTemporaryFile(file: File | null) {
    if (!file) return;
    try {
        if (file.exists) file.delete();
    } catch {
        /* Cache cleanup must not replace the user's result with an unrelated error. */
    }
}

function isCancelled(error: unknown) {
    if (!error || typeof error !== 'object') return false;
    const value = error as { code?: unknown; name?: unknown };
    return (
        value.name === 'AbortError' ||
        value.code === 'ERR_CANCELED' ||
        value.code === 'ERR_CANCELLED' ||
        value.code === 'ERR_SHARING_CANCELLED'
    );
}

/**
 * Working adaptation of the Bookstores in LA Save / Download figure.
 * The two App bar actions remain folder + cloud_download; glyph configuration,
 * Saved navigation and export controls are outside the App bar.
 * https://m3.material.io/components/app-bars/guidelines#15a358a9-3305-486f-9ce9-d0c939e02d2a
 */
export function AppBarCollectionScreen({ onBack }: { onBack: () => void }) {
    const theme = useMobileTheme();
    const insets = useSafeAreaInsets();
    const bar = useAppBarScrollBehavior({ behavior: 'pinned' });
    const [filled, setFilled] = useState(true);
    const [section, setSection] = useState('collection');
    const [detail, setDetail] = useState<Bookstore | null>(null);
    const [saved, setSaved] = useState<SavedRecord | null>(null);
    const [restoring, setRestoring] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [exported, setExported] = useState<ExportRecord | null>(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [status, setStatus] = useState<Status>(null);
    const mounted = useRef(true);
    const saveBusy = useRef(false);
    const exportBusy = useRef(false);
    const sharingFile = useRef(false);
    const temporaryFile = useRef<File | null>(null);
    const exportSequence = useRef(0);

    useEffect(() => {
        mounted.current = true;
        let current = true;
        void (async () => {
            try {
                const file = new File(Paths.document, savedFileName);
                const restored = file.exists ? readSavedRecord(JSON.parse(await file.text())) : null;
                if (current && mounted.current) setSaved(restored);
            } catch {
                if (current && mounted.current)
                    setStatus({ kind: 'error', text: 'The saved collection could not be read. Use Save to create a new local copy.' });
            } finally {
                if (current && mounted.current) setRestoring(false);
            }
        })();
        return () => {
            current = false;
            mounted.current = false;
            // A native share sheet can still be reading the file after this screen
            // unmounts. Its finally block owns cleanup until that sheet closes.
            if (!sharingFile.current) deleteTemporaryFile(temporaryFile.current);
        };
    }, []);

    const back = () => {
        if (exportOpen && !sharing) {
            setExportOpen(false);
            return;
        }
        if (detail) {
            setDetail(null);
            bar.reset();
            return;
        }
        onBack();
    };
    useEffect(() => {
        if (!detail && !exportOpen) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            if (exportOpen) {
                if (!sharing) setExportOpen(false);
                return true;
            }
            setDetail(null);
            bar.reset();
            return true;
        });
        return () => subscription.remove();
    }, [bar, detail, exportOpen, sharing]);

    const saveCollection = async () => {
        if (saveBusy.current || restoring || !mounted.current) return;
        saveBusy.current = true;
        setSaving(true);
        setStatus(null);
        try {
            const file = new File(Paths.document, savedFileName);
            if (saved) {
                if (file.exists) file.delete();
                if (mounted.current) {
                    setSaved(null);
                    setStatus({ kind: 'info', text: 'Collection removed from Saved.' });
                }
            } else {
                const record: SavedRecord = {
                    version: 1,
                    id: collectionId,
                    title: 'Bookstores in LA',
                    savedAt: new Date().toISOString(),
                    stores: bookstores,
                };
                if (!file.exists) file.create();
                await file.write(JSON.stringify(record, null, 2));
                const verified = readSavedRecord(JSON.parse(await file.text()));
                if (mounted.current) {
                    setSaved(verified);
                    setStatus({ kind: 'success', text: 'Collection saved on this device. Open Saved to see it.' });
                }
            }
        } catch {
            if (mounted.current)
                setStatus({
                    kind: 'error',
                    text: saved ? 'The collection could not be removed. Try again.' : 'The collection could not be saved. Try again.',
                });
        } finally {
            saveBusy.current = false;
            if (mounted.current) setSaving(false);
        }
    };

    const exportCollection = async () => {
        if (exportBusy.current || sharingFile.current || !mounted.current) return;
        exportBusy.current = true;
        setExporting(true);
        setStatus(null);
        let file: File | null = null;
        try {
            const name = `bookstores-in-la-${Date.now()}-${++exportSequence.current}.json`;
            file = new File(Paths.cache, name);
            file.create();
            const contents = JSON.stringify(
                {
                    version: 1,
                    title: 'Bookstores in LA',
                    exportedAt: new Date().toISOString(),
                    contentVerifiedOn: '2026-10-26',
                    stores: bookstores,
                },
                null,
                2
            );
            await file.write(contents);
            const verifiedContents = await file.text();
            if (verifiedContents !== contents) throw new Error('Export verification failed');
            if (!mounted.current) {
                deleteTemporaryFile(file);
                return;
            }
            deleteTemporaryFile(temporaryFile.current);
            temporaryFile.current = file;
            setExported({ file, name, contents: verifiedContents });
            setExportOpen(true);
            setStatus({ kind: 'success', text: 'The JSON file is ready on this device.' });
        } catch {
            deleteTemporaryFile(file);
            if (mounted.current) setStatus({ kind: 'error', text: 'The JSON file could not be created. Try Download again.' });
        } finally {
            exportBusy.current = false;
            if (mounted.current) setExporting(false);
        }
    };

    const shareExport = async () => {
        if (!exported || sharingFile.current || !mounted.current) return;
        sharingFile.current = true;
        setSharing(true);
        setStatus(null);
        try {
            const available = await Sharing.isAvailableAsync();
            if (!mounted.current) return;
            if (!available) {
                setStatus({ kind: 'info', text: 'File sharing is unavailable on this device. The JSON file remains ready locally.' });
                return;
            }
            if (!exported.file.exists) throw new Error('Export file no longer exists');
            // Only an explicit user press reaches the OS sheet; no recipient,
            // upload or external transmission is selected by this example.
            await Sharing.shareAsync(exported.file.uri, {
                mimeType: 'application/json',
                UTI: 'public.json',
                dialogTitle: 'Save or share Bookstores in LA',
            });
            if (mounted.current) {
                // expo-sharing resolves void both after completion and normal
                // dismissal, so never announce that the file was sent or saved.
                setStatus({ kind: 'info', text: 'Share sheet closed. The local JSON file is still ready.' });
            }
        } catch (error) {
            if (mounted.current)
                setStatus(
                    isCancelled(error)
                        ? { kind: 'info', text: 'Sharing cancelled. The local JSON file is still ready.' }
                        : { kind: 'error', text: 'The share sheet could not be opened. The JSON file is still ready; try again.' }
                );
        } finally {
            sharingFile.current = false;
            if (mounted.current) setSharing(false);
            else deleteTemporaryFile(temporaryFile.current);
        }
    };

    const showStore = (store: Bookstore) => {
        setDetail(store);
        bar.reset();
    };
    const openWebsite = async (store: Bookstore) => {
        try {
            await Linking.openURL(store.website);
        } catch {
            if (mounted.current) setStatus({ kind: 'error', text: 'The bookstore website could not be opened.' });
        }
    };
    const statusView = status ? (
        <Text
            variant="bodyMedium"
            accessibilityLiveRegion="polite"
            style={{ color: status.kind === 'error' ? theme.colors.error : theme.colors.onSurfaceVariant }}
            testID="md-appbar-collection-status"
        >
            {status.text}
        </Text>
    ) : null;

    return (
        <View onAccessibilityEscape={back} style={{ flex: 1, backgroundColor: theme.colors.surface }} testID="md-appbar-use-collection">
            <TopAppBar
                title={detail?.name ?? 'Bookstores in LA'}
                variant="small"
                navigationIcon="arrow_back"
                navigationLabel={detail ? 'Back to bookstores' : 'Back to App bars'}
                onNavigationPress={back}
                scrollBehavior={bar}
                actions={
                    detail
                        ? []
                        : [
                              {
                                  key: 'save',
                                  icon: filled ? 'folder_fill1' : 'folder',
                                  label: saved ? 'Remove collection from Saved' : 'Save collection',
                                  disabled: restoring || saving,
                                  onPress: () => {
                                      void saveCollection();
                                  },
                                  testID: 'md-appbar-collection-save',
                              },
                              {
                                  key: 'download',
                                  icon: filled ? 'cloud_download_fill1' : 'cloud_download',
                                  label: 'Download collection as JSON',
                                  disabled: exporting || sharing,
                                  onPress: () => {
                                      void exportCollection();
                                  },
                                  testID: 'md-appbar-collection-download',
                              },
                          ]
                }
                testID="md-appbar-collection-bar"
            />
            <Animated.ScrollView
                onScroll={bar.onScroll}
                scrollEventThrottle={16}
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                testID="md-appbar-collection-scroll"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                {detail ? (
                    <View style={{ padding: 24, gap: 24 }}>
                        <View
                            accessible={false}
                            accessibilityElementsHidden
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: 160,
                                backgroundColor: theme.colors.secondaryContainer,
                                borderRadius: 16,
                            }}
                        >
                            <Icon source="storefront" size={64} color={theme.colors.onSecondaryContainer} />
                        </View>
                        <Text variant="titleMedium">{detail.area}</Text>
                        <View style={{ gap: 8 }}>
                            <Text variant="labelLarge">Address</Text>
                            <Text selectable variant="bodyLarge">
                                {detail.address}
                            </Text>
                        </View>
                        <Text variant="bodyLarge">
                            Part of your Bookstores in LA collection. This local example includes Los Angeles and nearby West Hollywood and
                            Pasadena.
                        </Text>
                        <Button
                            variant="outlined"
                            icon="open_in_new"
                            style={{ alignSelf: 'flex-start' }}
                            onPress={() => {
                                void openWebsite(detail);
                            }}
                            testID={`md-appbar-collection-website-${detail.key}`}
                        >
                            Official website
                        </Button>
                        {statusView}
                    </View>
                ) : (
                    <>
                        <View style={{ padding: 24, gap: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                                <View style={{ flex: 1, gap: 4 }}>
                                    <Text variant="titleSmall">Filled action icons</Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                        Example setting · icon glyphs, not button containers
                                    </Text>
                                </View>
                                <Switch
                                    value={filled}
                                    onValueChange={setFilled}
                                    accessibilityLabel="Use filled App bar action icons"
                                    testID="md-appbar-collection-filled-icons"
                                />
                            </View>
                            <SegmentedButtons
                                value={section}
                                onValueChange={setSection}
                                buttons={[
                                    { value: 'collection', label: 'Collection' },
                                    { value: 'saved', label: 'Saved', icon: 'folder' },
                                ]}
                                testID="md-appbar-collection-sections"
                            />
                            {restoring || saving || exporting ? (
                                <Text variant="bodyMedium" accessibilityLiveRegion="polite">
                                    {restoring
                                        ? 'Reading saved collection…'
                                        : saving
                                          ? 'Updating saved collection…'
                                          : 'Creating JSON file…'}
                                </Text>
                            ) : (
                                statusView
                            )}
                            <Text variant="titleMedium" accessibilityRole="header">
                                {section === 'saved' ? 'Saved collections' : `${bookstores.length} bookstores`}
                            </Text>
                        </View>
                        {section === 'saved' ? (
                            saved ? (
                                <List.Item
                                    title="Bookstores in LA"
                                    description={`${saved.stores.length} bookstores · saved ${new Date(saved.savedAt).toLocaleDateString()}`}
                                    leading={<Icon source="folder_fill1" size={24} />}
                                    trailing={<Icon source="chevron_right" size={24} />}
                                    variant="baseline"
                                    onPress={() => {
                                        setSection('collection');
                                        bar.reset();
                                    }}
                                    testID="md-appbar-collection-saved-item"
                                />
                            ) : (
                                <View style={{ paddingHorizontal: 24, gap: 8 }}>
                                    <Text variant="bodyLarge">No saved collections yet</Text>
                                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                        Use the folder action in the App bar to keep this collection on your device.
                                    </Text>
                                </View>
                            )
                        ) : (
                            bookstores.map((store) => (
                                <View key={store.key}>
                                    <List.Item
                                        title={store.name}
                                        description={store.address}
                                        lines={3}
                                        variant="baseline"
                                        leading={<Icon source="storefront" size={24} color={theme.colors.onSurfaceVariant} />}
                                        trailing={<Icon source="chevron_right" size={24} color={theme.colors.onSurfaceVariant} />}
                                        onPress={() => showStore(store)}
                                        testID={`md-appbar-collection-store-${store.key}`}
                                    />
                                    <Divider />
                                </View>
                            ))
                        )}
                        {exported ? (
                            <View style={{ padding: 24, gap: 12 }}>
                                <Text variant="titleSmall">Downloaded file</Text>
                                <Text variant="bodyMedium" selectable>
                                    {exported.name}
                                </Text>
                                <Button
                                    variant="outlined"
                                    icon="description"
                                    style={{ alignSelf: 'flex-start' }}
                                    onPress={() => setExportOpen(true)}
                                    testID="md-appbar-collection-open-export"
                                >
                                    View JSON file
                                </Button>
                            </View>
                        ) : null}
                    </>
                )}
            </Animated.ScrollView>
            <Dialog
                visible={exportOpen}
                onDismiss={() => {
                    if (!sharing) setExportOpen(false);
                }}
                dismissable={!sharing}
                testID="md-appbar-collection-export-dialog"
            >
                <Dialog.Title>JSON file ready</Dialog.Title>
                <Dialog.Content>
                    <View style={{ gap: 16 }}>
                        <Text variant="bodyMedium">{exported?.name}</Text>
                        <ScrollView
                            style={{ maxHeight: 220 }}
                            contentContainerStyle={{ padding: 12, backgroundColor: theme.colors.surfaceContainerHigh }}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                        >
                            <Text variant="bodySmall" selectable testID="md-appbar-collection-export-contents">
                                {exported?.contents}
                            </Text>
                        </ScrollView>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            Choose a destination in the system sheet to save or share the file.
                        </Text>
                        {statusView}
                    </View>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button
                        variant="text"
                        disabled={sharing}
                        onPress={() => {
                            setExportOpen(false);
                            setStatus({ kind: 'info', text: 'Export closed. The JSON file remains ready on this device.' });
                        }}
                        testID="md-appbar-collection-export-close"
                    >
                        Close
                    </Button>
                    <Button
                        variant="text"
                        disabled={sharing}
                        loading={sharing}
                        onPress={() => {
                            void shareExport();
                        }}
                        testID="md-appbar-collection-export-share"
                    >
                        Save or share
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
}
