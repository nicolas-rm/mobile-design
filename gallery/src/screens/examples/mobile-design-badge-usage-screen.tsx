import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { FlatList, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgedBox, Card, Icon, List, NavigationBar, NavigationRail, Tabs, Text, TopAppBar, useMobileTheme } from 'mobile-design/react-native';
import { ReferenceArt } from './mobile-design-reference-art';
import {
    getBadgeUsageRecords,
    type BadgeUsageDestination,
    type BadgeUsageRecord,
    type BadgeUsageScenario,
} from './mobile-design-badge-usage-data';

type BadgeRoutes = {
    BadgeMain: undefined;
    BadgeDestination: { key: string };
    BadgeRecord: { destination: string; id: string };
};
type BadgeNavigation = NativeStackNavigationProp<BadgeRoutes>;
const Stack = createNativeStackNavigator<BadgeRoutes>();

/** The outer route owns theme/status-bar chrome. These are independent, usable reference contexts. */
export function BadgeUsageContent({ scenario, onBack }: { scenario: BadgeUsageScenario; onBack: () => void }) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const destinations = getBadgeUsageRecords(scenario);
    const [selected, setSelected] = useState(destinations[0].key);
    const [acknowledged, setAcknowledged] = useState<string[]>([]);
    const [read, setRead] = useState<string[]>([]);
    const destination = destinations.find((item) => item.key === selected) ?? destinations[0];
    const acknowledge = (key: string) => setAcknowledged((previous) => (previous.includes(key) ? previous : [...previous, key]));
    const select = (key: string) => {
        setSelected(key);
        if (destinations.find((item) => item.key === key)?.badgeMeaning !== 'count') acknowledge(key);
    };
    const marker = (item: BadgeUsageDestination) =>
        item.badgeMeaning === 'count' ? item.records.length : acknowledged.includes(item.key) ? false : item.badge;
    const accessibleName = (item: BadgeUsageDestination) => {
        const badge = marker(item);
        if (item.badgeMeaning === 'count') return `${item.label}, ${item.records.length} ${item.badgeUnit ?? 'items'}`;
        return `${item.label}${badge === true ? ', new notification' : typeof badge === 'number' ? `, ${badge} new notifications` : ''}`;
    };
    const navigationItems = destinations.map((item) => ({ ...item, badge: marker(item), accessibilityLabel: accessibleName(item) }));
    const openRecord = (navigation: BadgeNavigation, current: BadgeUsageDestination, record: BadgeUsageRecord) => {
        setRead((previous) => (previous.includes(record.id) ? previous : [...previous, record.id]));
        if (current.badgeMeaning !== 'count') acknowledge(current.key);
        navigation.navigate('BadgeRecord', { destination: current.key, id: record.id });
    };
    const openDestination = (navigation: BadgeNavigation, key: string) => {
        select(key);
        navigation.navigate('BadgeDestination', { key });
    };
    const recordList = (current: BadgeUsageDestination, navigation: BadgeNavigation) => (
        <List.Collection>
            <FlatList
                key={current.key}
                data={current.records}
                keyExtractor={(record) => record.id}
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 24 }}
                initialNumToRender={12}
                ListHeaderComponent={
                    <Text
                        variant="labelMedium"
                        style={{ color: theme.colors.onSurfaceVariant, paddingHorizontal: 16, paddingVertical: 12 }}
                    >
                        {current.records.length}{' '}
                        {scenario === 'navigation-bar' && current.key === 'mail'
                            ? current.records.length === 1
                                ? 'message'
                                : 'messages'
                            : current.records.length === 1
                              ? 'item'
                              : 'items'}
                    </Text>
                }
                ListEmptyComponent={
                    <View style={{ padding: 24, gap: 8 }}>
                        <Text variant="titleMedium">No items</Text>
                        <Text variant="bodyMedium">This folder is empty.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <List.Item
                        title={<Text variant={read.includes(item.id) ? 'bodyLarge' : 'bodyLargeEmphasized'}>{item.title}</Text>}
                        description={item.summary}
                        leading={<Icon source={item.icon} size={24} />}
                        accessibilityLabel={`${item.title}, ${read.includes(item.id) ? 'read' : 'unread'}. ${item.summary}`}
                        onPress={() => openRecord(navigation, current, item)}
                        testID={`md-badge-record-${item.id}`}
                    />
                )}
                testID={`md-badge-records-${current.key}`}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            />
        </List.Collection>
    );
    const main = (navigation: BadgeNavigation) => {
        if (scenario === 'navigation-rail')
            return (
                <View
                    style={{ flex: 1, backgroundColor: theme.colors.surface }}
                    onAccessibilityEscape={onBack}
                    testID="md-badge-use-navigation-rail"
                >
                    <TopAppBar title="Files" navigationIcon="arrow_back" onNavigationPress={onBack} testID="md-badge-files-bar" />
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: width < 420 ? 'center' : 'flex-start' }}>
                        <NavigationRail
                            items={navigationItems}
                            value={selected}
                            expanded
                            expandedWidth={width < 420 ? Math.min(360, width) : 256}
                            labelVisibility="all"
                            onValueChange={(key) => openDestination(navigation, key)}
                            style={{ paddingTop: 16, paddingBottom: insets.bottom }}
                            testID="md-badge-files-rail"
                        />
                        {width >= 420 ? <View style={{ flex: 1 }}>{recordList(destination, navigation)}</View> : null}
                    </View>
                </View>
            );
        if (scenario === 'app-bar')
            return (
                <View
                    style={{ flex: 1, backgroundColor: theme.colors.surface }}
                    onAccessibilityEscape={onBack}
                    testID="md-badge-use-app-bar"
                >
                    <TopAppBar
                        title="My collection"
                        variant="large-flexible"
                        navigationIcon="arrow_back"
                        onNavigationPress={onBack}
                        actions={destinations
                            .filter((item) => item.key !== 'all')
                            .map((item) => ({
                                key: item.key,
                                icon: ({ color, size }: { color: string; size: number }) => (
                                    <BadgedBox badge={marker(item)}>
                                        <Icon source={item.icon} color={color} size={size} />
                                    </BadgedBox>
                                ),
                                label: accessibleName(item),
                                onPress: () => openDestination(navigation, item.key),
                                testID: `md-badge-collection-${item.key}`,
                            }))}
                        testID="md-badge-collection-bar"
                    />
                    <FlatList
                        data={destinations[0].records.slice(0, 2)}
                        numColumns={2}
                        keyExtractor={(record) => record.id}
                        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
                        columnWrapperStyle={{ gap: 12 }}
                        renderItem={({ item, index }) => (
                            <Card
                                variant="filled"
                                style={{ flex: 1 }}
                                onPress={() => openRecord(navigation, destinations[0], item)}
                                accessibilityLabel={item.title}
                                testID={`md-badge-collection-card-${index}`}
                            >
                                <View style={{ aspectRatio: 366 / 159, overflow: 'hidden', borderRadius: 12 }}>
                                    <ReferenceArt name={index % 2 ? 'collection-photo' : 'collection-podcast'} />
                                </View>
                            </Card>
                        )}
                        testID="md-badge-collection-grid"
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>
            );
        return (
            <View
                style={{ flex: 1, backgroundColor: theme.colors.surface }}
                onAccessibilityEscape={onBack}
                testID={`md-badge-use-${scenario}`}
            >
                <TopAppBar
                    title={scenario === 'tabs' ? 'My collection' : scenario === 'travel' ? 'Your trips' : destination.label}
                    navigationIcon="arrow_back"
                    onNavigationPress={onBack}
                    testID="md-badge-use-bar"
                />
                {scenario === 'tabs' ? (
                    <Tabs
                        items={navigationItems}
                        value={selected}
                        onValueChange={select}
                        variant="primary"
                        iconPosition="start"
                        testID="md-badge-favorites-tabs"
                    />
                ) : null}
                {scenario === 'travel' && selected === 'flights' ? (
                    <ScrollView
                        contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: 24 }}
                        testID="md-badge-travel-summary"
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        <Text variant="displaySmall">19 Oct{'\n'}–23 Oct</Text>
                        <Text>2 flights Tomorrow · 24h 30m</Text>
                        <Card
                            variant="filled"
                            onPress={() => openRecord(navigation, destination, destination.records[0])}
                            accessibilityLabel="Johannesburg JNB to Calgary YYC, 19 Oct to 23 Oct"
                            testID="md-badge-flight-card"
                        >
                            <View style={{ padding: 24, gap: 12 }}>
                                <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                                    Johannesburg
                                </Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <Text variant="displaySmall">JNB</Text>
                                    <Text>4:30 PM</Text>
                                </View>
                                <Icon source="trending_flat" size={40} />
                                <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                                    Calgary
                                </Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <Text variant="displaySmall">YYC</Text>
                                    <Text>6:00 PM</Text>
                                </View>
                            </View>
                        </Card>
                    </ScrollView>
                ) : (
                    recordList(destination, navigation)
                )}
                {scenario !== 'tabs' ? (
                    <NavigationBar
                        items={navigationItems}
                        value={selected}
                        onValueChange={select}
                        variant="standard"
                        testID={`md-badge-${scenario}-bar`}
                    />
                ) : null}
            </View>
        );
    };
    return (
        <Stack.Navigator
            initialRouteName="BadgeMain"
            screenOptions={{
                headerShown: false,
                animation: theme.animation.scale === 0 ? 'none' : 'default',
                gestureEnabled: true,
                contentStyle: { backgroundColor: theme.colors.surface },
            }}
        >
            <Stack.Screen name="BadgeMain">{({ navigation }) => main(navigation)}</Stack.Screen>
            <Stack.Screen name="BadgeDestination">
                {({ navigation, route }) => {
                    const current = destinations.find((item) => item.key === route.params.key) ?? destinations[0];
                    return (
                        <View
                            style={{ flex: 1, backgroundColor: theme.colors.surface }}
                            onAccessibilityEscape={() => navigation.goBack()}
                            testID="md-badge-destination"
                        >
                            <TopAppBar
                                title={current.label}
                                navigationIcon="arrow_back"
                                onNavigationPress={() => navigation.goBack()}
                                testID="md-badge-destination-bar"
                            />
                            {recordList(current, navigation)}
                        </View>
                    );
                }}
            </Stack.Screen>
            <Stack.Screen name="BadgeRecord">
                {({ navigation, route }) => {
                    const current = destinations.find((item) => item.key === route.params.destination) ?? destinations[0];
                    const record = current.records.find((item) => item.id === route.params.id);
                    return (
                        <View
                            style={{ flex: 1, backgroundColor: theme.colors.surface }}
                            onAccessibilityEscape={() => navigation.goBack()}
                            testID="md-badge-record-detail"
                        >
                            <TopAppBar
                                title={current.label}
                                navigationIcon="arrow_back"
                                onNavigationPress={() => navigation.goBack()}
                                testID="md-badge-record-bar"
                            />
                            <ScrollView
                                contentInsetAdjustmentBehavior="never"
                                contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24, gap: 20 }}
                                showsVerticalScrollIndicator={false}
                                showsHorizontalScrollIndicator={false}
                            >
                                {record ? (
                                    <>
                                        <Icon source={record.icon} size={48} color={theme.colors.primary} />
                                        <Text variant="headlineMedium">{record.title}</Text>
                                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                            {record.summary}
                                        </Text>
                                        <Text variant="bodyLarge">{record.body}</Text>
                                    </>
                                ) : (
                                    <Text>Item unavailable.</Text>
                                )}
                            </ScrollView>
                        </View>
                    );
                }}
            </Stack.Screen>
        </Stack.Navigator>
    );
}
