import { Linking, View } from 'react-native';
import { Badge, BadgedBox, Icon, LocaleProvider, NavigationBar, NavigationRail, Text, useMobileTheme } from 'mobile-design/react-native';

const matrix = [
    { id: 'inactive-label', title: 'Inactive · label', active: false, labels: true, rail: false },
    { id: 'inactive-no-label', title: 'Inactive · no label', active: false, labels: false, rail: false },
    { id: 'active-label', title: 'Active · label', active: true, labels: true, rail: false },
    { id: 'active-bar-no-label', title: 'Active · navigation bar · no label', active: true, labels: false, rail: false },
    { id: 'active-rail-no-label', title: 'Active · navigation rail · no label', active: true, labels: false, rail: true },
] as const;

const contexts = [
    {
        id: 'small',
        title: 'Small · Home / My places / Explore',
        selected: 'places',
        items: [
            { key: 'home', label: 'Home', icon: 'home-outline', selectedIcon: 'home_fill1' },
            { key: 'places', label: 'My places', icon: 'map', selectedIcon: 'map_fill1', badge: true },
            { key: 'explore', label: 'Explore', icon: 'explore' },
        ],
    },
    {
        id: 'large',
        title: 'Large · Files / Recent / Favorite',
        selected: 'files',
        items: [
            { key: 'files', label: 'Files', icon: 'folder_open', selectedIcon: 'folder_fill1', badge: 1004 },
            { key: 'recent', label: 'Recent', icon: 'schedule' },
            { key: 'favorite', label: 'Favorite', icon: 'favorite_border' },
        ],
    },
    {
        id: 'color',
        title: 'Color · Photos / Albums / Recents',
        selected: 'photos',
        items: [
            { key: 'photos', label: 'Photos', icon: 'image', selectedIcon: 'image_fill1', badge: 1 },
            { key: 'albums', label: 'Albums', icon: 'photo_library', badge: true },
            { key: 'recents', label: 'Recents', icon: 'schedule', badge: 1 },
        ],
    },
    {
        id: 'a11y-numeric',
        title: 'Made for Lee · numerical notification',
        selected: 'home',
        items: [
            {
                key: 'home',
                label: 'Home',
                icon: 'home-outline',
                selectedIcon: 'home_fill1',
                badge: 1,
                accessibilityLabel: 'Home, one new notification',
            },
            { key: 'music', label: 'Music', icon: 'library_music' },
            { key: 'podcasts', label: 'Podcasts', icon: 'podcasts' },
        ],
    },
    {
        id: 'a11y-dot',
        title: 'Made for Lee · non-counting notification',
        selected: 'home',
        items: [
            {
                key: 'home',
                label: 'Home',
                icon: 'home-outline',
                selectedIcon: 'home_fill1',
                badge: true,
                accessibilityLabel: 'Home, new notification',
            },
            { key: 'music', label: 'Music', icon: 'library_music' },
            { key: 'podcasts', label: 'Podcasts', icon: 'podcasts' },
        ],
    },
];

/** Static specification figures. Actual destinations and their actions live in the usage screens. */
export function BadgeExamples() {
    const theme = useMobileTheme();
    return (
        <View style={{ gap: 32 }} testID="md-badge-examples">
            <View style={{ gap: 16 }}>
                <Text variant="titleLarge">Variants</Text>
                <Text>Small comunica una novedad sin cantidad. Large añade un número o texto breve.</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                    <View accessible accessibilityLabel="Small badge, 6 dp" style={{ alignItems: 'center', gap: 12 }}>
                        <Badge variant="dot" testID="md-badge-small" />
                        <Text variant="labelMedium">Small · 6 dp</Text>
                    </View>
                    <View accessible accessibilityLabel="Large badge, 16 dp" style={{ alignItems: 'center', gap: 12 }}>
                        <Badge variant="large" testID="md-badge-large">
                            1
                        </Badge>
                        <Text variant="labelMedium">Large · 16 dp</Text>
                    </View>
                </View>
                <Reference section="specs" />
            </View>
            <View style={{ gap: 16 }}>
                <Text variant="titleLarge">Labels</Text>
                <Text>Hasta cuatro caracteres. El máximo puede adaptarse al contexto; la referencia muestra 99+ y 999+.</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                    {[1, 22, 333, 1004].map((value) => (
                        <Badge key={value} variant="large" testID={`md-badge-count-${value}`}>
                            {value}
                        </Badge>
                    ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    {[
                        { title: 'Favorite', icon: 'star-outline', count: 3, maximum: 999 },
                        { title: 'Recent', icon: 'schedule', count: 10, maximum: 999 },
                        { title: 'Contacts', icon: 'person_outline', count: 120, maximum: 99 },
                        { title: 'Voicemail', icon: 'voicemail', count: 1004, maximum: 999 },
                    ].map((item) => (
                        <View
                            key={item.title}
                            accessible
                            accessibilityLabel={`${item.title}, ${item.count}`}
                            style={{ flex: 1, alignItems: 'center', gap: 12 }}
                        >
                            <BadgedBox badge={item.count} maximum={item.maximum}>
                                <Icon source={item.icon} size={24} />
                            </BadgedBox>
                            <Text variant="labelMedium" style={{ textAlign: 'center' }}>
                                {item.title}
                            </Text>
                        </View>
                    ))}
                </View>
                <Reference section="guidelines" />
            </View>
            <View style={{ gap: 16 }}>
                <Text variant="titleLarge">Placement</Text>
                <Text>Los quince casos de Specs: Small, Large con una cifra y Large con 999+, en estados activos e inactivos.</Text>
                {matrix.map((row) => (
                    <View key={row.id} style={{ gap: 8 }} testID={`md-badge-matrix-${row.id}`}>
                        <Text variant="labelLarge">{row.title}</Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                justifyContent: 'space-around',
                                backgroundColor: theme.colors.surface,
                            }}
                        >
                            {[true, row.rail ? 3 : 1, 1004].map((value, index) => {
                                const item = {
                                    key: 'sample',
                                    label: 'Label',
                                    icon: 'change_history',
                                    selectedIcon: 'circle_fill1',
                                    badge: value,
                                };
                                const props = {
                                    items: [item],
                                    value: row.active ? 'sample' : '',
                                    onValueChange: () => {},
                                    labelVisibility: row.labels ? ('all' as const) : ('none' as const),
                                    testID: `md-badge-spec-${row.id}-${index}`,
                                };
                                return (
                                    <View
                                        key={index}
                                        pointerEvents="none"
                                        accessible
                                        accessibilityLabel={`${row.title}, ${value === true ? 'Small' : value === 1004 ? '999+' : value}`}
                                        style={{ flex: 1, minWidth: row.rail ? 96 : 80, alignItems: 'center' }}
                                    >
                                        <View
                                            accessibilityElementsHidden
                                            importantForAccessibility="no-hide-descendants"
                                            style={{ alignSelf: row.rail ? 'center' : 'stretch' }}
                                        >
                                            {row.rail ? (
                                                <NavigationRail {...props} style={{ paddingTop: 0, paddingBottom: 0 }} />
                                            ) : (
                                                <NavigationBar
                                                    {...props}
                                                    variant="standard"
                                                    safeArea={false}
                                                    style={{ backgroundColor: theme.colors.surface }}
                                                />
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ))}
                <Reference section="specs" />
            </View>
            <View style={{ gap: 16 }}>
                <Text variant="titleLarge">Reference contexts</Text>
                {contexts.map((context) => (
                    <View key={context.id} style={{ gap: 8 }} testID={`md-badge-context-${context.id}`}>
                        <Text variant="labelLarge">{context.title}</Text>
                        <View pointerEvents="none" accessible accessibilityLabel={`Figura de referencia: ${context.title}`}>
                            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                                <NavigationBar
                                    items={context.items}
                                    value={context.selected}
                                    onValueChange={() => {}}
                                    variant="standard"
                                    safeArea={false}
                                    testID={`md-badge-context-${context.id}-bar`}
                                />
                            </View>
                        </View>
                    </View>
                ))}
                <Reference section="guidelines" />
                <View style={{ gap: 8 }} testID="md-badge-truncation">
                    <Text variant="labelLarge">Truncation · four characters</Text>
                    <View pointerEvents="none" accessible accessibilityLabel="All Files, 999 plus. Library, 123 plus.">
                        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                            <NavigationRail
                                items={[
                                    { key: 'files', label: 'All Files', icon: 'folder_open', badge: '999+' },
                                    { key: 'library', label: 'Library', icon: 'photo_library', badge: '123+' },
                                ]}
                                value="files"
                                onValueChange={() => {}}
                                expanded
                                labelVisibility="all"
                                style={{ paddingTop: 0, paddingBottom: 0 }}
                                testID="md-badge-truncation-rail"
                            />
                        </View>
                    </View>
                </View>
                <Text variant="bodyMedium">
                    Conserva los roles error/onError, el anclaje a la esquina del icono y un máximo de cuatro caracteres. Evita tapar el
                    texto vecino o recortar la insignia.
                </Text>
            </View>
            <View style={{ gap: 16 }}>
                <Text variant="titleLarge">Right-to-left</Text>
                <Text>La posición de la insignia se refleja hacia el final lógico del icono.</Text>
                <LocaleProvider direction="rtl">
                    <View
                        style={{
                            flexDirection: 'row-reverse',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 48,
                            paddingVertical: 16,
                        }}
                        testID="md-badge-rtl"
                    >
                        {[true, 1, 1004].map((badge, index) => (
                            <View key={index} accessible accessibilityLabel={`Ejemplo RTL, ${badge === true ? 'novedad' : badge}`}>
                                <BadgedBox badge={badge} testID={`md-badge-rtl-${index}`}>
                                    <Icon source="mail_outline" size={24} />
                                </BadgedBox>
                            </View>
                        ))}
                    </View>
                </LocaleProvider>
                <Reference section="guidelines" />
            </View>
            <View style={{ gap: 12 }}>
                <Text variant="titleLarge">Accessibility</Text>
                <Text>
                    El nombre del destino se anuncia antes de la novedad o cantidad. La insignia acompaña la acción; no es otro botón.
                </Text>
                <Text testID="md-badge-contrast-guidance">
                    Conserva los colores error/onError y al menos 3:1 de contraste. La referencia desaconseja colores personalizados que
                    confundan el indicador o su texto con el fondo.
                </Text>
                <View
                    accessible
                    accessibilityLabel="Home, one new notification"
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
                >
                    <BadgedBox badge={1}>
                        <Icon source="home-outline" size={24} />
                    </BadgedBox>
                    <Text>Home · One new notification</Text>
                </View>
                <View
                    accessible
                    accessibilityLabel="Home, new notification"
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
                >
                    <BadgedBox badge>
                        <Icon source="home-outline" size={24} />
                    </BadgedBox>
                    <Text>Home · New notification</Text>
                </View>
                <Reference section="accessibility" />
            </View>
        </View>
    );
}

function Reference({ section }: { section: 'specs' | 'guidelines' | 'accessibility' }) {
    const theme = useMobileTheme();
    return (
        <Text
            variant="labelLarge"
            accessibilityRole="link"
            onPress={() => {
                void Linking.openURL(`https://m3.material.io/components/badges/${section}`);
            }}
            style={{ color: theme.colors.primary }}
        >
            Material 3 · {section}
        </Text>
    );
}
