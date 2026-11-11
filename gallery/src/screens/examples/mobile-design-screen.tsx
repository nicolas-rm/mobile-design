import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Chip,
    Divider,
    Icon,
    IconButton,
    List,
    Searchbar,
    Snackbar,
    Switch,
    Text,
    TopAppBar,
    getMobileDesignComponent,
    mobileDesignCatalog,
    mobileDesignCatalogGroups,
    useMobileTheme,
    type MobileDesignCatalogGroupId,
    type MobileDesignTheme,
} from 'mobile-design/react-native';
import { MobileDesignGalleryProvider as MobileDesignProvider } from './mobile-design-gallery-provider';
import { useTheme } from 'react-native-paper';

import type { RootStackParamList } from '@/navigations/types';
import { ActionExamples, ActionPlayground } from './mobile-design-action-examples';
import { ChoiceExamples } from './mobile-design-choice-examples';
import { CoreExamples } from './mobile-design-core-examples';
import { NavigationExamples } from './mobile-design-navigation-examples';
import { SelectionExamples } from './mobile-design-selection-examples';
import { LoadingPlayground } from './mobile-design-action-scenarios';
import { NavigationPlayground } from './mobile-design-navigation-playground';
import { ListPlayground } from './mobile-design-list-examples';
import { AppBarPlayground } from './mobile-design-appbar-examples';
import { CardPlayground } from './mobile-design-card-examples';
import { ProgressPlayground } from './mobile-design-progress-examples';
import { AppBarUsageLauncher } from './mobile-design-appbar-usage-launcher';
import { BadgeUsageLauncher } from './mobile-design-badge-usage-launcher';
import { ButtonGroupUsageLauncher } from './mobile-design-button-group-usage-launcher';
import { ButtonUsageLauncher } from './mobile-design-button-usage-launcher';
import { ListUsageLauncher } from './mobile-design-list-usage-launcher';
import { TabsUsageLauncher } from './mobile-design-tabs-usage-launcher';
import { searchUsageExamples } from './mobile-design-search-usage-screen';
import { MaterialReferenceLinks } from './material-reference-links';
import { Io26ExamplesLauncher } from './mobile-design-io26-launcher';

type Preview = { colorScheme: 'light' | 'dark'; reduceMotion: boolean };
type FrameProps = {
    title: string;
    onBack?: () => void;
    initialPreview?: Preview;
    compactControls?: boolean;
    motion?: 'standard' | 'expressive';
    snackbarBottomOffset?: number;
    children: (preview: Preview, onEvent: (message: string) => void) => ReactNode;
};

function GalleryFrame({ initialPreview, motion, ...props }: FrameProps) {
    const outer = useTheme<MobileDesignTheme>();
    const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(initialPreview?.colorScheme ?? (outer.dark ? 'dark' : 'light'));
    const [reduceMotion, setReduceMotion] = useState(initialPreview?.reduceMotion ?? false);
    return (
        <MobileDesignProvider colorScheme={colorScheme} fontFamily="Roboto" motion={motion} reduceMotion={reduceMotion ? 'on' : 'auto'}>
            <GalleryFrameContent
                {...props}
                preview={{ colorScheme, reduceMotion }}
                onToggleTheme={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
                onReduceMotion={setReduceMotion}
                ready
            />
        </MobileDesignProvider>
    );
}

function GalleryFrameContent({
    title,
    onBack,
    children,
    preview,
    onToggleTheme,
    onReduceMotion,
    ready,
    compactControls = false,
    snackbarBottomOffset = 0,
}: Omit<FrameProps, 'initialPreview'> & {
    preview: Preview;
    onToggleTheme: () => void;
    onReduceMotion: (value: boolean) => void;
    ready: boolean;
}) {
    const theme = useMobileTheme();
    const focused = useIsFocused();
    const [message, setMessage] = useState('');
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {focused ? <StatusBar style={theme.dark ? 'light' : 'dark'} /> : null}
            <TopAppBar
                title={title}
                variant="small"
                leading={onBack ? <IconButton icon="arrow_back" accessibilityLabel="Back" onPress={onBack} testID="md-gallery-back" /> : undefined}
                actions={[
                    ...(compactControls
                        ? [
                              {
                                  key: 'reduce-motion',
                                  icon: preview.reduceMotion ? 'motion_photos_off' : 'motion_play',
                                  label: preview.reduceMotion ? 'Activar movimiento' : 'Reducir movimiento',
                                  onPress: () => onReduceMotion(!preview.reduceMotion),
                                  testID: 'md-gallery-reduce-motion-action',
                              },
                          ]
                        : []),
                    {
                        key: 'theme',
                        icon: theme.dark ? 'light_mode' : 'dark_mode',
                        label: theme.dark ? 'Usar tema claro' : 'Usar tema oscuro',
                        onPress: onToggleTheme,
                        testID: 'md-gallery-theme',
                    },
                ]}
                testID="md-gallery-appbar"
            />
            {!compactControls ? (
                <View style={{ paddingHorizontal: 24, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ flex: 1 }}>
                        <Text variant="labelLarge">Reducir movimiento</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {theme.animation.scale === 0 ? 'Movimiento reducido activo' : 'Movimiento MD3 activo'}
                        </Text>
                    </View>
                    <Switch
                        value={preview.reduceMotion}
                        onValueChange={onReduceMotion}
                        accessibilityLabel="Reducir movimiento del catálogo"
                        testID="md-gallery-reduce-motion"
                    />
                </View>
            ) : null}
            <Divider />
            {ready ? (
                children(preview, setMessage)
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator />
                </View>
            )}
            <Snackbar
                visible={Boolean(message)}
                onDismiss={() => setMessage('')}
                onIconPress={() => setMessage('')}
                bottomOffset={snackbarBottomOffset}
                testID="md-gallery-feedback"
            >
                {message}
            </Snackbar>
        </View>
    );
}

type CatalogFilter = MobileDesignCatalogGroupId | 'all' | 'other';
type CatalogComponent = (typeof mobileDesignCatalog)[number];
function configurationsOf(entry: CatalogComponent): readonly string[] {
    return 'configurations' in entry ? entry.configurations : [];
}
type CatalogRow = { kind: 'group'; id: string; title: string } | { kind: 'component'; id: string; entry: CatalogComponent };
const catalogFilters: { value: CatalogFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    ...mobileDesignCatalogGroups.map((group) => ({ value: group.id, label: group.title })),
    { value: 'other', label: 'All other components' },
];

export function MobileDesignCatalogScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'MobileDesignCatalog'>) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<CatalogFilter>('all');
    const normalize = (value: string) =>
        value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase();
    const entries = mobileDesignCatalog.filter(
        (entry) =>
            (filter === 'all' || (filter === 'other' ? entry.group === null : entry.group === filter)) &&
            normalize(
                `${entry.title} ${entry.searchAliases.join(' ')} ${entry.id} ${entry.variants.join(' ')} ${configurationsOf(entry).join(' ')}`
            ).includes(normalize(query))
    );
    const rows: CatalogRow[] = [];
    const visibleGroups = new Set<MobileDesignCatalogGroupId>();
    for (const entry of entries) {
        if (entry.group && !visibleGroups.has(entry.group)) {
            const group = mobileDesignCatalogGroups.find((group) => group.id === entry.group);
            if (group) rows.push({ kind: 'group', id: `group-${group.id}`, title: group.title });
            visibleGroups.add(entry.group);
        }
        rows.push({ kind: 'component', id: entry.id, entry });
    }
    return (
        <GalleryFrame title="Mobile Design" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}>
            {(preview) => (
                <>
                    <FlatList
                        data={rows}
                        keyExtractor={(row) => row.id}
                        contentContainerStyle={{ paddingBottom: 112 }}
                        keyboardShouldPersistTaps="handled"
                        ListHeaderComponent={
                            <View style={{ gap: 16, padding: 24 }}>
                                <Text variant="headlineSmall">Catálogo de componentes</Text>
                                <Text>{mobileDesignCatalog.length} componentes · Material 3 y extensiones de Mobile Design.</Text>
                                <Searchbar
                                    placeholder="Buscar componente"
                                    accessibilityLabel="Buscar componente del catálogo"
                                    value={query}
                                    onChangeText={setQuery}
                                    testID="md-catalog-query"
                                />
                                <ScrollView
                                    horizontal
                                    showsVerticalScrollIndicator={false}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ gap: 8 }}
                                >
                                    {catalogFilters.map((item) => (
                                        <Chip
                                            key={item.value}
                                            variant="filter"
                                            selected={filter === item.value}
                                            onPress={() => setFilter(item.value)}
                                            testID={`md-catalog-filter-${item.value}`}
                                        >
                                            {item.label}
                                        </Chip>
                                    ))}
                                </ScrollView>
                                <Text variant="labelMedium" testID="md-catalog-count">
                                    {entries.length} {entries.length === 1 ? 'componente' : 'componentes'}
                                </Text>
                            </View>
                        }
                        renderItem={({ item }) =>
                            item.kind === 'group' ? (
                                <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 }}>
                                    <Text variant="titleMedium" accessibilityRole="header" testID={`md-catalog-${item.id}`}>
                                        {item.title}
                                    </Text>
                                </View>
                            ) : (
                                <List.Item
                                    title={item.entry.title}
                                    description={[...item.entry.variants, ...configurationsOf(item.entry)].slice(0, 3).join(' · ')}
                                    leading={<Icon source={item.entry.id === 'search' ? 'search' : 'view-grid-outline'} size={24} />}
                                    trailing={<Icon source="chevron-right" size={24} />}
                                    style={item.entry.group ? { marginStart: 16 } : undefined}
                                    onPress={() => navigation.navigate('MobileDesignComponent', { id: item.entry.id, ...preview })}
                                    testID={`md-catalog-${item.entry.id}`}
                                />
                            )
                        }
                        ItemSeparatorComponent={({ leadingItem }) => (leadingItem.kind === 'component' ? <Divider leftInset /> : null)}
                        ListEmptyComponent={<Text style={{ padding: 24 }}>No hay componentes con ese nombre.</Text>}
                        testID="md-catalog-list"
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    />
                    <Io26ExamplesLauncher onOpen={(scenario) => navigation.navigate('MobileDesignIo26', { scenario, ...preview })} />
                </>
            )}
        </GalleryFrame>
    );
}

export function MobileDesignComponentScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'MobileDesignComponent'>) {
    const entry = getMobileDesignComponent(route.params.id);
    if (!entry) return null;
    return (
        <GalleryFrame
            title={entry.title}
            onBack={() => navigation.goBack()}
            initialPreview={route.params}
            motion={['button-groups', 'buttons', 'lists'].includes(entry.id) ? 'standard' : undefined}
            snackbarBottomOffset={['app-bars', 'badges', 'button-groups', 'buttons', 'lists', 'tabs'].includes(entry.id) ? 88 : 0}
        >
            {(preview, onEvent) => (
                <View style={{ flex: 1 }}>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        automaticallyAdjustKeyboardInsets
                        contentContainerStyle={{
                            padding: 24,
                            paddingBottom: ['app-bars', 'badges', 'button-groups', 'buttons', 'lists', 'tabs'].includes(entry.id)
                                ? 112
                                : 48,
                            gap: 24,
                        }}
                        testID={`md-detail-${entry.id}`}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        <Text variant="headlineSmall">{entry.title}</Text>
                        {entry.id === 'search' ? (
                            <View style={{ gap: 12 }}>
                                <Text variant="titleMedium">Ejemplos en pantalla completa</Text>
                                {searchUsageExamples.map(example => (
                                    <Button key={example.id} variant="outlined" icon={example.icon} onPress={() => navigation.navigate('MobileDesignSearchUsage',{scenario:example.id,...preview})} testID={`md-search-usage-open-${example.id}`}>{example.title}</Button>
                                ))}
                            </View>
                        ) : null}
                        {entry.group === 'extensions' ? <ChoiceExamples id={entry.id} /> : null}
                        {entry.variants.length > 0 ? (
                            <View style={{ gap: 8 }}>
                                <Text variant="labelLarge">Variantes</Text>
                                <VariantTags variants={entry.variants} />
                            </View>
                        ) : null}
                        {configurationsOf(entry).length > 0 ? (
                            <View style={{ gap: 8 }}>
                                <Text variant="labelLarge">Configuraciones y estados</Text>
                                <VariantTags variants={configurationsOf(entry)} />
                            </View>
                        ) : null}
                        <ActionExamples
                            id={entry.id}
                            onEvent={onEvent}
                            onOpenPlayground={() =>
                                navigation.navigate('MobileDesignPlayground', {
                                    scenario: entry.id === 'loading-indicator' ? 'loading' : 'actions',
                                    family: entry.id,
                                    ...preview,
                                })
                            }
                        />
                        <SelectionExamples id={entry.id} onEvent={onEvent} />
                        <NavigationExamples
                            id={entry.id}
                            onEvent={onEvent}
                            onOpenPlayground={() => navigation.navigate('MobileDesignPlayground', { scenario: 'navigation', ...preview })}
                        />
                        <CoreExamples
                            onOpenCardPlayground={() => navigation.navigate('MobileDesignPlayground', { scenario: 'cards', ...preview })}
                            onOpenProgressPlayground={() =>
                                navigation.navigate('MobileDesignPlayground', { scenario: 'progress', ...preview })
                            }
                            onOpenAppBarPlayground={() =>
                                navigation.navigate('MobileDesignPlayground', { scenario: 'app-bars', ...preview })
                            }
                            id={entry.id}
                            onEvent={onEvent}
                        />
                        {'reference' in entry ? (
                            <>
                                <Divider />
                                <MaterialReferenceLinks component={entry.id} />
                            </>
                        ) : null}
                    </ScrollView>
                    {entry.id === 'app-bars' ? (
                        <AppBarUsageLauncher
                            onOpen={(scenario) => navigation.navigate('MobileDesignAppBarUsage', { scenario, ...preview })}
                        />
                    ) : entry.id === 'badges' ? (
                        <BadgeUsageLauncher
                            onOpen={(scenario) => navigation.navigate('MobileDesignBadgeUsage', { scenario, ...preview })}
                        />
                    ) : entry.id === 'button-groups' ? (
                        <ButtonGroupUsageLauncher
                            onOpen={(scenario) => navigation.navigate('MobileDesignButtonGroupUsage', { scenario, ...preview })}
                        />
                    ) : entry.id === 'buttons' ? (
                        <ButtonUsageLauncher
                            onOpen={(scenario) => navigation.navigate('MobileDesignButtonUsage', { scenario, ...preview })}
                        />
                    ) : entry.id === 'lists' ? (
                        <ListUsageLauncher onOpen={(scenario) => navigation.navigate('MobileDesignListUsage', { scenario, ...preview })} />
                    ) : entry.id === 'tabs' ? (
                        <TabsUsageLauncher onOpen={(scenario) => navigation.navigate('MobileDesignTabsUsage', { scenario, ...preview })} />
                    ) : null}
                </View>
            )}
        </GalleryFrame>
    );
}

export function MobileDesignPlaygroundScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'MobileDesignPlayground'>) {
    const focused = useIsFocused();
    if (route.params.scenario === 'app-bars')
        return (
            <MobileDesignProvider
                colorScheme={route.params.colorScheme}
                fontFamily="Roboto"
                reduceMotion={route.params.reduceMotion ? 'on' : 'auto'}
            >
                {focused ? <StatusBar style={route.params.colorScheme === 'dark' ? 'light' : 'dark'} /> : null}
                <AppBarPlayground onBack={() => navigation.goBack()} />
            </MobileDesignProvider>
        );
    const titles = {
        loading: 'Cargas y resultados',
        navigation: 'Mensajes',
        lists: 'Listas deslizables',
        'app-bars': 'Barras y contenido',
        progress: 'Pedido y pago',
        actions: 'Acciones flotantes',
        cards: 'Tarjetas',
    };
    return (
        <GalleryFrame
            title={titles[route.params.scenario]}
            compactControls
            onBack={() => navigation.goBack()}
            initialPreview={route.params}
        >
            {(_preview, onEvent) => (
                <View style={{ flex: 1 }} testID={`md-playground-${route.params.scenario}`}>
                    {route.params.scenario === 'loading' ? (
                        <LoadingPlayground onEvent={onEvent} />
                    ) : route.params.scenario === 'progress' ? (
                        <ProgressPlayground />
                    ) : route.params.scenario === 'cards' ? (
                        <CardPlayground onEvent={onEvent} />
                    ) : route.params.scenario === 'actions' ? (
                        <ActionPlayground id={route.params.family ?? 'floating-action-button'} onEvent={onEvent} />
                    ) : route.params.scenario === 'navigation' ? (
                        <NavigationPlayground onEvent={onEvent} />
                    ) : (
                        <ListPlayground onEvent={onEvent} />
                    )}
                </View>
            )}
        </GalleryFrame>
    );
}

function VariantTags({ variants }: { variants: readonly string[] }) {
    const theme = useMobileTheme();
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {variants.map((variant) => (
                <View
                    key={variant}
                    style={{
                        borderRadius: 8,
                        backgroundColor: theme.colors.surfaceContainerHighest,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                    }}
                >
                    <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {variant}
                    </Text>
                </View>
            ))}
        </View>
    );
}
