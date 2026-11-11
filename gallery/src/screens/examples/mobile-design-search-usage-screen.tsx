import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
    Avatar,
    Button,
    IconButton,
    List,
    NavigationDrawerModal,
    SearchIconButton,
    SearchTrigger,
    SearchView,
    SideSheet,
    Text,
    TopAppBar,
    useAppBarScrollBehavior,
    useLocale,
    useMobileTheme,
    type SearchResult,
} from 'mobile-design/react-native';
import { MobileDesignGalleryProvider as MobileDesignProvider } from './mobile-design-gallery-provider';
import type { RootStackParamList } from '@/navigations/types';

export const searchUsageExamples = [
    { id: 'messages', title: 'Debajo del título', icon: 'chat_bubble' },
    { id: 'global', title: 'Search app bar', icon: 'search' },
    { id: 'icon', title: 'Entrada desde un icono', icon: 'search' },
    { id: 'scroll', title: 'Ocultar y revelar al desplazar', icon: 'swipe_vertical' },
] as const;
export type SearchUsageScenario = (typeof searchUsageExamples)[number]['id'];

const messages = [
    { key: 'renee', title: 'Renée Claes', description: 'Museum field trip · The museum opens at ten.', initials: 'RC' },
    { key: 'peanut', title: 'Peanut', description: 'Recipes for Peanut · Here are some healthy weeknight recipes.', initials: 'P' },
    { key: 'school', title: 'End of school year', description: 'Celebration on Thursday · Bring your favorite dish.', initials: 'ES' },
    { key: 'ping', title: 'Ping, Haneul', description: 'Q3 performance summary · We will discuss the performance.', initials: 'PH' },
    { key: 'dagmar', title: 'Dagmar', description: 'Movie marathon · We have to watch these movies.', initials: 'D' },
    { key: 'eli', title: 'Eli', description: 'Adopt a pup? · The pet adoption organization has news.', initials: 'E' },
    { key: 'aki', title: 'Aki Aro', description: 'Museum field trip · Details for our next visit.', initials: 'AA' },
    { key: 'ethan', title: 'Ethan Kelly', description: 'Our cabin for this weekend · Your copy of the booking.', initials: 'EK' },
    { key: 'liam', title: 'Liam Cooper', description: 'Report project updates · The latest notes are ready.', initials: 'LC' },
    { key: 'mia', title: 'Mia Foster', description: 'Business trip report · For further assistance please reach out.', initials: 'MF' },
    { key: 'chloe', title: 'Chloe Reed', description: 'Deck for leadership · Take a look at these slides.', initials: 'CR' },
    { key: 'oliver', title: 'Oliver Benson', description: 'Team lunch · See you at the restaurant.', initials: 'OB' },
] as const;
type Message = (typeof messages)[number];
const normalize = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase()
        .trim();

export function MobileDesignSearchUsageScreen({
    navigation,
    route,
}: NativeStackScreenProps<RootStackParamList, 'MobileDesignSearchUsage'>) {
    const focused = useIsFocused();
    return (
        <MobileDesignProvider
            colorScheme={route.params.colorScheme}
            fontFamily="Roboto"
            motion="expressive"
            reduceMotion={route.params.reduceMotion ? 'on' : 'auto'}
        >
            {focused ? <StatusBar style={route.params.colorScheme === 'dark' ? 'light' : 'dark'} /> : null}
            <SearchUsageContent scenario={route.params.scenario} onBack={() => navigation.goBack()} />
        </MobileDesignProvider>
    );
}

function SearchUsageContent({ scenario, onBack }: { scenario: SearchUsageScenario; onBack: () => void }) {
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    const [open, setOpen] = useState(false),
        [query, setQuery] = useState('');
    const [recent, setRecent] = useState(['Peanut', 'Renée', 'End of school year']);
    const [selected, setSelected] = useState<Message>();
    const pending = useRef<Message | undefined>(undefined);
    const [drawer, setDrawer] = useState(false),
        [profile, setProfile] = useState(false);
    const [saved, setSaved] = useState<string[]>([]),
        [savedOnly, setSavedOnly] = useState(false);
    const appBarEntry = scenario === 'global' || scenario === 'scroll';
    const bar = useAppBarScrollBehavior({ behavior: scenario === 'scroll' ? 'enter-always' : 'pinned', snap: true });
    const normalized = normalize(query);
    const records = messages.filter(
        (item) => (!savedOnly || saved.includes(item.key)) && normalize(`${item.title} ${item.description}`).includes(normalized)
    );
    const results: readonly SearchResult[] = normalized
        ? records
        : recent.map((title, index) => ({ key: `recent-${index}`, title, icon: 'history' }));
    const remember = (value: string) => {
        const next = value.trim();
        if (next) setRecent((items) => [next, ...items.filter((item) => normalize(item) !== normalize(next))].slice(0, 5));
    };
    const choose = (item: Message) => {
        pending.current = item;
        if (query) remember(query);
        setOpen(false);
    };
    const search = (
        <SearchView
            open={open}
            onOpenChange={setOpen}
            value={query}
            onChangeText={setQuery}
            onSearch={remember}
            onClosed={() => {
                if (pending.current) {
                    setSelected(pending.current);
                    pending.current = undefined;
                }
            }}
            closeOnSelect={false}
            placeholder="Search your messages"
            results={results}
            resultsAccessibilityLabel={`${results.length} ${normalized ? 'results' : 'recent searches'}`}
            supportingContent={
                <Text
                    variant="labelLarge"
                    accessibilityRole="header"
                    accessibilityLiveRegion="polite"
                    style={{ paddingHorizontal: 24, paddingVertical: 12 }}
                >
                    {normalized ? `Results · ${records.length}` : 'Recent searches'}
                </Text>
            }
            onResultPress={(result) => {
                if (result.key.startsWith('recent-')) setQuery(result.title);
                else {
                    const item = messages.find((item) => item.key === result.key);
                    if (item) choose(item);
                }
            }}
            trailingContent={
                <Avatar.Button accessibilityLabel="Abrir cuenta" onPress={() => setProfile(true)}>
                    <Avatar.Text size={30} label="N" />
                </Avatar.Button>
            }
            trailingActions={[
                {
                    key: 'history',
                    icon: 'history',
                    label: 'Ver búsquedas recientes',
                    onPress: () => {
                        setQuery('');
                        setOpen(true);
                    },
                },
            ]}
            renderResults={
                normalized
                    ? ({ containerColor }) => (
                          <ScrollView
                              keyboardShouldPersistTaps="handled"
                              keyboardDismissMode="on-drag"
                              showsVerticalScrollIndicator={false}
                              contentContainerStyle={{ paddingBottom: 24 }}
                          >
                              {records.length ? (
                                  records.map((item) => (
                                      <List.Item
                                          key={item.key}
                                          title={item.title}
                                          description={item.description}
                                          style={{ backgroundColor: containerColor }}
                                          leading={<Avatar.Text size={40} label={item.initials} />}
                                          onPress={() => choose(item)}
                                          testID={`md-search-usage-result-${item.key}`}
                                      />
                                  ))
                              ) : (
                                  <Text style={{ padding: 24 }}>No messages match “{query}”.</Text>
                              )}
                          </ScrollView>
                      )
                    : undefined
            }
            renderTrigger={
                scenario === 'icon'
                    ? ({ open: enter, disabled, expanded }) => (
                          <IconButton
                              icon="search"
                              accessibilityLabel="Buscar mensajes"
                              accessibilityState={{ expanded }}
                              disabled={disabled}
                              onPress={enter}
                              testID="md-search-usage-icon"
                          />
                      )
                    : appBarEntry
                      ? ({ open: enter, disabled, expanded }) => (
                            <View
                                style={{
                                    height: 56,
                                    borderRadius: 28,
                                    overflow: 'hidden',
                                    backgroundColor: theme.colors.surfaceContainerHigh,
                                }}
                            >
                                <SearchTrigger
                                    accessibilityRole="button"
                                    accessibilityLabel={query || 'Search your messages'}
                                    accessibilityState={{ disabled, expanded }}
                                    disabled={disabled}
                                    onPress={enter}
                                    style={{ justifyContent: 'center', paddingLeft: rtl ? 56 : 0, paddingRight: rtl ? 0 : 56 }}
                                    testID="md-search-usage-global-trigger"
                                >
                                    <Text
                                        variant="bodyLarge"
                                        numberOfLines={1}
                                        style={{ paddingHorizontal: 16, textAlign: 'center', color: theme.colors.onSurfaceVariant }}
                                    >
                                        {query || 'Search your messages'}
                                    </Text>
                                </SearchTrigger>
                                <View style={{ position: 'absolute', top: 4, [rtl ? 'left' : 'right']: 4, width: 48, height: 48 }}>
                                    <SearchIconButton
                                        icon="history"
                                        accessibilityLabel="Ver búsquedas recientes"
                                        disabled={disabled}
                                        onPress={() => {
                                            setQuery('');
                                            setOpen(true);
                                        }}
                                        testID="md-search-usage-global-history"
                                    />
                                </View>
                            </View>
                        )
                      : undefined
            }
            testID="md-search-usage"
        />
    );
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
            <TopAppBar
                title={selected?.title ?? 'Conversations'}
                navigationIcon={appBarEntry && !selected ? 'menu' : 'arrow_back'}
                navigationLabel={appBarEntry && !selected ? 'Abrir navegación' : 'Volver'}
                onNavigationPress={() => {
                    if (selected) setSelected(undefined);
                    else if (appBarEntry) setDrawer(true);
                    else onBack();
                }}
                search={appBarEntry && !selected ? search : undefined}
                trailing={scenario === 'icon' && !selected ? search : undefined}
                scrollBehavior={scenario === 'scroll' && !selected ? bar : undefined}
                actions={appBarEntry && !selected ? [{ key: 'back', icon: 'close', label: 'Cerrar ejemplo', onPress: onBack }] : []}
                testID="md-search-usage-appbar"
            />
            {selected ? (
                <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
                    <Text variant="headlineSmall">{selected.title}</Text>
                    <Text>{selected.description}</Text>
                    <Button
                        variant="tonal"
                        icon={saved.includes(selected.key) ? 'bookmark_fill1' : 'bookmark-outline'}
                        testID="md-search-usage-save"
                        onPress={() =>
                            setSaved((items) =>
                                items.includes(selected.key) ? items.filter((key) => key !== selected.key) : [...items, selected.key]
                            )
                        }
                    >
                        {saved.includes(selected.key) ? 'Quitar de guardados' : 'Guardar conversación'}
                    </Button>
                </ScrollView>
            ) : (
                <Animated.ScrollView
                    onScroll={scenario === 'scroll' ? bar.onScroll : undefined}
                    scrollEventThrottle={16}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {scenario === 'messages' ? (
                        <View style={{ marginHorizontal: 24, marginTop: 8, marginBottom: 12 }}>{search}</View>
                    ) : null}
                    <Text variant="labelLarge" style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
                        {savedOnly ? 'Saved conversations' : 'Inbox'}
                    </Text>
                    {messages
                        .filter((item) => !savedOnly || saved.includes(item.key))
                        .map((item) => (
                            <List.Item
                                key={item.key}
                                multiAction
                                title={item.title}
                                description={item.description}
                                leading={<Avatar.Text size={40} label={item.initials} />}
                                trailing={
                                    <IconButton
                                        icon={saved.includes(item.key) ? 'star_fill1' : 'star-outline'}
                                        accessibilityLabel={`${saved.includes(item.key) ? 'Quitar destacado' : 'Destacar'}: ${item.title}`}
                                        testID={`md-search-usage-star-${item.key}`}
                                        onPress={() =>
                                            setSaved((items) =>
                                                items.includes(item.key) ? items.filter((key) => key !== item.key) : [...items, item.key]
                                            )
                                        }
                                    />
                                }
                                onPress={() => setSelected(item)}
                                testID={`md-search-usage-message-${item.key}`}
                            />
                        ))}
                    {savedOnly && !saved.length ? <Text style={{ padding: 24 }}>Todavía no hay conversaciones guardadas.</Text> : null}
                </Animated.ScrollView>
            )}
            <NavigationDrawerModal
                open={drawer}
                onOpenChange={setDrawer}
                title="Messages"
                value={savedOnly ? 'saved' : 'inbox'}
                onValueChange={(key) => {
                    setSavedOnly(key === 'saved');
                    setDrawer(false);
                }}
                items={[
                    { key: 'inbox', label: 'Inbox', icon: 'inbox' },
                    { key: 'saved', label: 'Saved', icon: 'bookmark' },
                ]}
                testID="md-search-usage-drawer"
            />
            <SideSheet open={profile} onOpenChange={setProfile} title="Cuenta local" testID="md-search-usage-profile">
                <View style={{ padding: 24, gap: 16 }}>
                    <Avatar.Text size={48} label="N" />
                    <Text variant="titleLarge">Nicolás</Text>
                    <Text>{saved.length} conversaciones guardadas</Text>
                </View>
            </SideSheet>
        </View>
    );
}
