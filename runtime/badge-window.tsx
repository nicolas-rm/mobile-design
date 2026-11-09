import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions, type ColorValue } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, ReduceMotion, cancelAnimation, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Image as SvgImage } from 'react-native-svg';
import {
    BadgedBox,
    Card,
    ContainerTransformSurface,
    Icon,
    List,
    NavigationBar,
    NavigationRail,
    Tabs,
    Text,
    TopAppBar,
    useMobileTheme,
    type ContainerTransformOrigin,
} from 'mobile-design/react-native-web';
import { GalleryProvider as MobileDesignProvider } from './gallery-provider';
import { useRuntimeEnvironment } from './environment';
import { useWindowConfiguration } from './component-window';
type Destination = {
    key: string;
    label: string;
    icon: string;
    selectedIcon?: string;
    badge?: number | boolean;
    total: number;
    count?: boolean;
};
const scenarios: Record<string, Destination[]> = {
    'navigation-bar': [
        { key: 'mail', label: 'Mail', icon: 'mail', selectedIcon: 'mail_fill1', badge: 1004, total: 1004 },
        { key: 'chat', label: 'Chat', icon: 'chat_bubble', selectedIcon: 'chat_bubble_fill1', badge: 10, total: 10 },
        { key: 'rooms', label: 'Rooms', icon: 'groups', selectedIcon: 'groups_fill1', badge: true, total: 3 },
        { key: 'meet', label: 'Meet', icon: 'videocam', selectedIcon: 'videocam_fill1', badge: 3, total: 3 },
    ],
    'navigation-rail': [
        { key: 'photos', label: 'Photos', icon: 'image', selectedIcon: 'image_fill1', badge: 1004, total: 1004, count: true },
        { key: 'fonts', label: 'Fonts', icon: 'font_download', total: 3 },
        { key: 'documents', label: 'Documents', icon: 'description', total: 3 },
        { key: 'delete', label: 'Delete', icon: 'delete', total: 2 },
    ],
    tabs: [
        { key: 'favorites', label: 'Favorites', icon: 'favorite_fill1', badge: 84, total: 84, count: true },
        { key: 'collections', label: 'Collections', icon: 'folder_open', total: 4 },
    ],
    'app-bar': [
        { key: 'all', label: 'My collection', icon: 'photo_library', total: 12 },
        { key: 'favorites', label: 'Favorites', icon: 'favorite', total: 3 },
        { key: 'folders', label: 'Folders', icon: 'folder', badge: true, total: 4 },
    ],
    travel: [
        { key: 'flights', label: 'Flights', icon: 'flight_takeoff', badge: true, total: 1 },
        { key: 'hotels', label: 'Hotels', icon: 'bed', total: 1 },
        { key: 'events', label: 'Events', icon: 'event_note', badge: 10, total: 10 },
    ],
};
function Art({ index }: { index: number }) {
    return (
        <Svg width="100%" height="100%" viewBox={index % 2 ? '515 441 366 159' : '123 441 366 159'} accessible={false}>
            <SvgImage href={location.origin + '/assets/examples/badges/collection.png'} x={0} y={0} width={1004} height={600} />
        </Svg>
    );
}
function Content({ scenario }: { scenario: string }) {
    const theme = useMobileTheme(),
        { width } = useWindowDimensions(),
        destinations = scenarios[scenario] ?? scenarios['navigation-bar'];
    const [selected, setSelected] = useState(destinations[0].key),
        [acknowledged, setAcknowledged] = useState<string[]>([]),
        [read, setRead] = useState<string[]>([]),
        [detail, setDetail] = useState<{ title: string; body: string } | null>(null),
        [folder, setFolder] = useState(false);
    const source = useRef<HTMLElement | null>(null),
        sceneSource = useRef<HTMLDivElement>(null),
        restoreFolderFocus = useRef(false),
        alive = useRef(true),
        closingRef = useRef(false);
    const [origin, setOrigin] = useState<ContainerTransformOrigin>(),
        [ready, setReady] = useState(false),
        [closing, setClosing] = useState(false),
        progress = useSharedValue(0);
    const finishClose = useCallback(() => {
        if (!alive.current) return;
        setDetail(null);
        requestAnimationFrame(() => source.current?.isConnected && source.current.focus({ preventScroll: true }));
    }, []);
    const travel = useCallback(
        (target: number) =>
            progress.set(
                withTiming(
                    target,
                    {
                        duration: (target ? theme.motion.duration.long2 : theme.motion.duration.medium4) * theme.animation.scale,
                        easing: Easing.bezier(...theme.motion.easing.emphasized),
                        reduceMotion: ReduceMotion.Never,
                    },
                    (finished) => {
                        if (finished && !target) scheduleOnRN(finishClose);
                    }
                )
            ),
        [progress, theme, finishClose]
    );
    const closeDetail = () => {
        if (closingRef.current) return;
        closingRef.current = true;
        setClosing(true);
        travel(0);
    };
    useEffect(() => {
        if (detail && ready && !closing) {
            travel(1);
            requestAnimationFrame(() =>
                document.querySelector<HTMLElement>('[data-testid="badge-detail-navigation"]')?.focus({ preventScroll: true })
            );
        }
    }, [detail, ready, closing, travel]);
    useEffect(() => {
        if (theme.animation.scale === 0 && detail) {
            progress.set(closing ? 0 : 1);
            if (closing) finishClose();
        }
    }, [theme.animation.scale, detail, closing, progress, finishClose]);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            cancelAnimation(progress);
        };
    }, [progress]);
    const destination = destinations.find((d) => d.key === selected) ?? destinations[0];
    const data = useMemo(
        () =>
            Array.from({ length: destination.total }, (_, index) => ({
                id: destination.key + '-' + index,
                title:
                    destination.key === 'flights'
                        ? 'Johannesburg JNB → Calgary YYC'
                        : destination.key === 'hotels'
                          ? 'Garden Hotel'
                          : destination.key === 'documents'
                            ? ['Project brief', 'Reading notes', 'Travel plans'][index % 3]
                            : destination.key === 'fonts'
                              ? ['Roboto', 'Roboto Serif', 'Material Symbols Rounded'][index % 3]
                              : ['A walk in the garden', 'City light', 'At the beach', 'Mountain path'][index % 4] +
                                (index > 3 ? ' ' + (index + 1) : ''),
                summary:
                    destination.key === 'flights'
                        ? '19 Oct–23 Oct'
                        : destination.key === 'hotels'
                          ? '19 Oct–23 Oct · 4 nights'
                          : destination.key === 'documents'
                            ? 'Document · My collection'
                            : scenario === 'navigation-bar'
                              ? 'Today · Your collection'
                              : 'My collection',
            })),
        [destination]
    );
    const marker = (d: Destination) => (d.count ? d.total : acknowledged.includes(d.key) ? false : d.badge);
    const name = (d: Destination) =>
        d.label +
        (d.count
            ? ', ' + d.total + (d.key === 'photos' ? ' photos' : ' favorites')
            : marker(d) === true
              ? ', nueva notificación'
              : typeof marker(d) === 'number'
                ? ', ' + d.badge + ' nuevas notificaciones'
                : '');
    const items = destinations.map((d) => ({ ...d, badge: marker(d), accessibilityLabel: name(d), testID: 'badge-destination-' + d.key }));
    const select = (key: string) => {
        setSelected(key);
        if (!destinations.find((d) => d.key === key)?.count)
            setAcknowledged((previous) => (previous.includes(key) ? previous : [...previous, key]));
    };
    const back = () => {
        if (detail) {
            closeDetail();
        } else if (folder) {
            restoreFolderFocus.current = true;
            setFolder(false);
        } else parent.postMessage({ type: 'mobile-design:window-back' }, location.origin);
    };
    useEffect(() => {
        if (folder) {
            sceneSource.current?.querySelector<HTMLElement>('[data-testid="badge-appbar-navigation"]')?.focus({ preventScroll: true });
            return;
        }
        if (!restoreFolderFocus.current) return;
        restoreFolderFocus.current = false;
        sceneSource.current?.querySelector<HTMLElement>(`[data-testid="badge-destination-${selected}"]`)?.focus({ preventScroll: true });
    }, [folder, selected]);
    const open = (item: (typeof data)[number], target?: unknown) => {
        if (detail) return;
        source.current = (target as HTMLElement) ?? (document.activeElement as HTMLElement);
        const box = source.current?.getBoundingClientRect?.();
        setOrigin(
            box?.width
                ? { x: box.x, y: box.y, width: box.width, height: box.height, borderRadius: 12, backgroundColor: theme.colors.surface }
                : undefined
        );
        closingRef.current = false;
        setClosing(false);
        setReady(false);
        progress.set(0);
        setRead((previous) => (previous.includes(item.id) ? previous : [...previous, item.id]));
        if (!destination.count)
            setAcknowledged((previous) => (previous.includes(destination.key) ? previous : [...previous, destination.key]));
        setDetail({
            title: item.title,
            body:
                destination.key === 'flights'
                    ? 'Johannesburg JNB → Calgary YYC\n19 Oct–23 Oct\nSeat 12A\nYour reservation is confirmed.'
                    : item.summary + '\n\nA place to slow down, discover something familiar and make room for a new perspective.',
        });
    };
    return (
        <View style={{ flex: 1, minHeight: 0, backgroundColor: theme.colors.surface }}>
            <div ref={sceneSource} className="native-scene-source" inert={Boolean(detail)}>
                <TopAppBar
                    title={
                        folder
                            ? destination.label
                            : scenario === 'app-bar' || scenario === 'tabs'
                              ? 'My collection'
                              : scenario === 'travel'
                                ? 'Your trips'
                                : destination.label
                    }
                    variant={scenario === 'app-bar' && !folder ? 'large-flexible' : 'small'}
                    navigationIcon="arrow_back"
                    navigationLabel={folder ? 'Volver a My collection' : 'Volver al catálogo de Badges'}
                    onNavigationPress={back}
                    statusBarHeight={0}
                    actions={
                        scenario === 'app-bar' && !folder
                            ? destinations.slice(1).map((d) => ({
                                  key: d.key,
                                  icon: ({ color, size }: { color: ColorValue | null; size: number }) => (
                                      <BadgedBox badge={marker(d)} testID={'badge-action-' + d.key}>
                                          <Icon source={d.icon} color={color ?? undefined} size={size} />
                                      </BadgedBox>
                                  ),
                                  label: name(d),
                                  onPress: () => {
                                      select(d.key);
                                      setFolder(true);
                                  },
                                  testID: 'badge-destination-' + d.key,
                              }))
                            : undefined
                    }
                    testID="badge-appbar"
                />
                {scenario === 'tabs' || scenario === 'travel' ? (
                    <Tabs
                        items={items}
                        value={selected}
                        onValueChange={select}
                        onTabPress={select}
                        iconPosition="start"
                        testID="badge-tabs"
                    />
                ) : null}
                <View style={{ flex: 1, minHeight: 0, flexDirection: 'row' }}>
                    {scenario === 'navigation-rail' ? (
                        <NavigationRail
                            expanded={width >= 600}
                            indicatorWidth="content"
                            items={items}
                            value={selected}
                            onValueChange={select}
                            style={{ paddingTop: 12, paddingBottom: 12 }}
                            testID="badge-rail"
                        />
                    ) : null}
                    <View style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                        {scenario === 'app-bar' && !folder ? (
                            <View style={{ padding: 16, flexDirection: 'row', gap: 12 }}>
                                {data.slice(0, 2).map((item, index) => (
                                    <Card
                                        key={item.id}
                                        variant="filled"
                                        onPress={() => open(item)}
                                        accessibilityLabel={item.title}
                                        style={{ flex: 1 }}
                                        testID={'badge-collection-card-' + index}
                                    >
                                        <View style={{ aspectRatio: 366 / 159, overflow: 'hidden', borderRadius: 12 }}>
                                            <Art index={index} />
                                        </View>
                                    </Card>
                                ))}
                            </View>
                        ) : scenario === 'travel' && selected === 'flights' ? (
                            <View style={{ padding: 16, gap: 16 }}>
                                <Text variant="labelLarge">19 Oct – 23 Oct</Text>
                                <Text variant="titleLarge">1 flight</Text>
                                <Card
                                    variant="filled"
                                    onPress={(event) => open(data[0], event.currentTarget)}
                                    accessibilityLabel="Johannesburg JNB to Calgary YYC, 19 Oct to 23 Oct"
                                    testID="badge-flight"
                                >
                                    <Card.Content>
                                        <View style={{ paddingVertical: 24, gap: 12 }}>
                                            <Text variant="headlineSmall">JNB → YYC</Text>
                                            <Text variant="bodyLarge">Johannesburg → Calgary</Text>
                                            <Text variant="bodyMedium">19 Oct – 23 Oct</Text>
                                        </View>
                                    </Card.Content>
                                </Card>
                            </View>
                        ) : (
                            <List.Collection>
                                <FlatList
                                    key={selected}
                                    data={data}
                                    keyExtractor={(item) => item.id}
                                    initialNumToRender={12}
                                    ListHeaderComponent={
                                        <Text
                                            variant="labelMedium"
                                            style={{ padding: 16, color: theme.colors.onSurfaceVariant }}
                                            testID="badge-record-count"
                                        >
                                            {data.length} {selected === 'mail' ? 'messages' : 'items'}
                                        </Text>
                                    }
                                    renderItem={({ item, index }) => (
                                        <List.Item
                                            title={
                                                <Text variant={read.includes(item.id) ? 'bodyLarge' : 'bodyLargeEmphasized'}>
                                                    {item.title}
                                                </Text>
                                            }
                                            description={item.summary}
                                            leading={<Icon source={destination.icon} size={24} />}
                                            onPress={() => open(item)}
                                            testID={'badge-record-' + index}
                                        />
                                    )}
                                    style={{ flex: 1 }}
                                    contentContainerStyle={{ paddingBottom: 24 }}
                                    testID="badge-records"
                                />
                            </List.Collection>
                        )}
                    </View>
                </View>
                {scenario === 'navigation-bar' ? (
                    <NavigationBar
                        variant="standard"
                        items={items}
                        value={selected}
                        onValueChange={select}
                        safeArea={false}
                        testID="badge-navigation"
                    />
                ) : null}
                <Text
                    variant="bodySmall"
                    accessibilityLiveRegion="polite"
                    style={{ padding: 12, color: theme.colors.onSurfaceVariant }}
                    testID="badge-usage-status"
                >
                    {name(destination)}
                </Text>
            </div>
            {detail ? (
                <View style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
                    <ContainerTransformSurface
                        fill
                        origin={origin}
                        progress={progress}
                        entering={!closing}
                        transforming={theme.animation.scale !== 0}
                        onMeasured={() => setReady(true)}
                        backgroundColor={theme.colors.surface}
                        borderRadius={0}
                        testID="badge-detail-transform"
                    >
                        <div
                            className="native-scene-detail"
                            inert={closing}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                    event.preventDefault();
                                    closeDetail();
                                }
                            }}
                        >
                            <TopAppBar
                                title={detail.title}
                                navigationIcon="arrow_back"
                                navigationLabel="Volver a la colección"
                                onNavigationPress={closeDetail}
                                statusBarHeight={0}
                                testID="badge-detail"
                            />
                            <View style={{ padding: 24, gap: 24 }}>
                                <Text variant="headlineSmall">{detail.title}</Text>
                                <Text variant="bodyLarge">{detail.body}</Text>
                                <Text variant="bodyMedium" testID="badge-record-state">
                                    Marcado como leído.
                                </Text>
                            </View>
                        </div>
                    </ContainerTransformSurface>
                </View>
            ) : null}
        </View>
    );
}
export function BadgeWindow() {
    const environment = useRuntimeEnvironment(),
        config = useWindowConfiguration({
            scenario: new URLSearchParams(location.search).get('scene') ?? 'navigation-bar',
            direction: 'ltr' as 'ltr' | 'rtl',
            motion: 'expressive' as 'expressive' | 'standard',
        });
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            direction={config.direction}
            motion={config.motion}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <main className="native-window" aria-label="Navegación con insignias">
                <GestureHandlerRootView style={{ flex: 1, minHeight: 0 }}>
                    <SafeAreaInsetsContext.Provider value={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                        <Content key={config.scenario} scenario={config.scenario} />
                    </SafeAreaInsetsContext.Provider>
                </GestureHandlerRootView>
            </main>
        </MobileDesignProvider>
    );
}
