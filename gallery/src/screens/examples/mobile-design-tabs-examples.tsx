import { useState, type ReactNode } from 'react';
import { Linking, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Checkbox, Tabs, TabsPager, Text, useMobileTheme, type TabItem, type TabsProps } from 'mobile-design/react-native';
import {
    tabsDogItems,
    tabsIconItems,
    tabsMediaItems,
    tabsMusicItems,
    tabsProductItems,
    tabsTravelItems,
} from './mobile-design-tabs-usage-data';

const tabLabels: readonly TabItem[] = [
    { key: 'tab-1', label: 'Tab 1' },
    { key: 'tab-2', label: 'Tab 2' },
    { key: 'tab-3', label: 'Tab 3' },
];
function Example({
    title,
    description,
    reference,
    children,
}: {
    title: string;
    description?: string;
    reference: 'overview' | 'specs' | 'guidelines' | 'accessibility';
    children: ReactNode;
}) {
    const theme = useMobileTheme();
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium" accessibilityRole="header">
                {title}
            </Text>
            {description ? <Text variant="bodyMedium">{description}</Text> : null}
            {children}
            <Text
                variant="bodySmall"
                accessibilityRole="link"
                style={{ color: theme.colors.primary, paddingVertical: 12 }}
                onPress={() => {
                    void Linking.openURL(`https://m3.material.io/components/tabs/${reference}`);
                }}
            >
                Material 3 · {reference}
            </Text>
        </View>
    );
}
function Specimen({
    items,
    initialValue,
    variant,
    scrollable,
    iconPosition,
    testID,
    onEvent,
}: {
    items: readonly TabItem[];
    initialValue?: string;
    variant?: TabsProps['variant'];
    scrollable?: boolean;
    iconPosition?: TabsProps['iconPosition'];
    testID: string;
    onEvent: (message: string) => void;
}) {
    const [value, setValue] = useState(initialValue ?? items[0].key);
    const linkedItems = items.map((item) => ({ ...item, nativeID: `${testID}-tab-${item.key}`, panelID: `${testID}-panel-${item.key}` }));
    const selected = linkedItems.find((item) => item.key === value) ?? linkedItems[0];
    return (
        <View style={{ gap: 12 }}>
            <Tabs
                items={linkedItems}
                value={value}
                onValueChange={(next) => {
                    setValue(next);
                    onEvent(
                        `${items.find((item) => item.key === next)?.label || items.find((item) => item.key === next)?.accessibilityLabel || next} selected.`
                    );
                }}
                variant={variant}
                scrollable={scrollable}
                iconPosition={iconPosition}
                testID={testID}
            />
            <View role="tabpanel" nativeID={selected.panelID} aria-labelledby={selected.nativeID}>
                <Text variant="bodySmall" testID={`${testID}-selection`}>
                    {selected.label || selected.accessibilityLabel}
                </Text>
            </View>
        </View>
    );
}
function HierarchyExample({ onEvent }: { onEvent: (message: string) => void }) {
    const [primary, setPrimary] = useState('tab-1');
    const [secondary, setSecondary] = useState<Record<string, string>>({});
    return (
        <View style={{ gap: 16 }}>
            <Tabs items={tabLabels} value={primary} onValueChange={setPrimary} testID="catalog-tabs-hierarchy-primary" />
            <View style={{ gap: 12, paddingHorizontal: 16 }}>
                <Tabs
                    variant="secondary"
                    items={tabLabels}
                    value={secondary[primary] ?? 'tab-1'}
                    onValueChange={(next) => {
                        setSecondary((previous) => ({ ...previous, [primary]: next }));
                        onEvent(`${primary} / ${next} selected.`);
                    }}
                    testID="catalog-tabs-hierarchy-secondary"
                />
                <Text testID="catalog-tabs-hierarchy-content">
                    {tabLabels.find((item) => item.key === primary)?.label} ·{' '}
                    {tabLabels.find((item) => item.key === (secondary[primary] ?? 'tab-1'))?.label}
                </Text>
            </View>
        </View>
    );
}

function ControlledExample() {
    const [value, setValue] = useState('flights');
    const [accept, setAccept] = useState(false);
    const [request, setRequest] = useState(0);
    const position = useSharedValue(0);
    const items = tabsTravelItems.map((item) => ({
        ...item,
        nativeID: `catalog-controlled-tab-${item.key}`,
        panelID: `catalog-controlled-panel-${item.key}`,
    }));
    const choose = (next: string) => {
        if (accept) setValue(next);
    };
    return (
        <View style={{ gap: 12 }}>
            <Checkbox.Item
                label="Permitir cambio de destino"
                status={accept ? 'checked' : 'unchecked'}
                onPress={() => setAccept((current) => !current)}
                testID="catalog-tabs-accept-change"
            />
            <Tabs
                items={items}
                value={value}
                onValueChange={choose}
                position={position}
                onTabPress={() => setRequest((current) => current + 1)}
                testID="catalog-tabs-controlled"
            />
            <TabsPager
                items={items}
                value={value}
                onValueChange={choose}
                position={position}
                selectionRequest={request}
                style={{ height: 120, flex: undefined }}
                testID="catalog-tabs-controlled-pages"
                renderPage={(item) => (
                    <View style={{ padding: 16 }}>
                        <Text>{item.label}</Text>
                    </View>
                )}
            />
            <Text variant="bodySmall">
                {accept
                    ? 'La selección se acepta al tocar o deslizar.'
                    : 'El consumidor conserva la página actual; el contenido vuelve al terminar el gesto.'}
            </Text>
        </View>
    );
}

/** Gallery chrome remains outside Tabs; the FAB opens the source contexts in action. */
export function TabExamples({ onEvent }: { onEvent: (message: string) => void }) {
    const [primary, setPrimary] = useState('flights');
    const [selectionRequest, setSelectionRequest] = useState(0);
    const position = useSharedValue(0);
    const travelItems = tabsTravelItems.map((item) => ({
        ...item,
        nativeID: `catalog-travel-tab-${item.key}`,
        panelID: `catalog-travel-panel-${item.key}`,
    }));
    const [badgePage, setBadgePage] = useState('video');
    const [badgeSeen, setBadgeSeen] = useState(false);
    return (
        <View style={{ gap: 32 }} testID="catalog-tabs-gallery">
            <Example
                title="Primary / Secondary"
                reference="guidelines"
                description="Dos variantes. Primary señala el grupo principal; Secondary organiza contenido relacionado en un nivel inferior."
            >
                <Specimen items={tabLabels} testID="catalog-tabs-primary-labels" onEvent={onEvent} />
                <Specimen variant="secondary" items={tabLabels} testID="catalog-tabs-secondary-labels" onEvent={onEvent} />
            </Example>
            <Example
                title="Primary · Flights / Trips / Explore"
                reference="overview"
                description="Selecciona una pestaña o desliza el contenido. El indicador sigue el recorrido del dedo; al cambiar de tamaño conserva la página elegida."
            >
                <Tabs
                    items={travelItems}
                    value={primary}
                    onValueChange={setPrimary}
                    onTabPress={() => setSelectionRequest((request) => request + 1)}
                    position={position}
                    testID="catalog-tabs-primary"
                />
                <TabsPager
                    items={travelItems}
                    value={primary}
                    onValueChange={setPrimary}
                    position={position}
                    selectionRequest={selectionRequest}
                    style={{ height: 168, flex: undefined }}
                    testID="catalog-tabs-pages"
                    renderPage={(item) => (
                        <View style={{ padding: 16, gap: 8 }}>
                            <Text variant="titleMedium">{item.label}</Text>
                            <Text variant="bodyMedium">
                                {item.key === 'flights'
                                    ? 'JNB Johannesburg → YYC Calgary'
                                    : item.key === 'trips'
                                      ? '19 Oct–23 Oct · Calgary'
                                      : 'Discover places for your next trip'}
                            </Text>
                        </View>
                    )}
                />
            </Example>
            <Example title="Secondary · Overview / Specifications" reference="specs">
                <Specimen variant="secondary" items={tabsProductItems} testID="catalog-tabs-secondary" onEvent={onEvent} />
            </Example>
            <Example
                title="Specs · measurements"
                reference="specs"
                description="Primary con icono y etiqueta: 64 dp. Las filas de texto y Secondary: 48 dp. Iconos de 24 dp, separación inline de 8 dp y badge 3."
            >
                <Specimen
                    items={[
                        ...tabsTravelItems.map((item) => (item.key === 'flights' ? { ...item, icon: 'flight_fill1', badge: 3 } : item)),
                        { key: 'buy', label: 'Buy', icon: 'shopping_cart' },
                    ]}
                    testID="catalog-tabs-spec-primary-stacked"
                    onEvent={onEvent}
                />
                <Specimen
                    items={[
                        ...tabsTravelItems.map((item) => ({
                            key: item.key,
                            label: item.label,
                            ...(item.key === 'flights' ? { badge: 3 } : {}),
                        })),
                        { key: 'buy', label: 'Buy' },
                    ]}
                    testID="catalog-tabs-spec-primary-labels"
                    onEvent={onEvent}
                />
                <Specimen
                    variant="secondary"
                    items={tabsProductItems.map((item) => (item.key === 'overview' ? { ...item, badge: 3 } : item))}
                    testID="catalog-tabs-spec-secondary-labels"
                    onEvent={onEvent}
                />
                <Specimen
                    variant="secondary"
                    iconPosition="start"
                    items={tabsProductItems.map((item) => (item.key === 'overview' ? { ...item, icon: 'overview', badge: 3 } : item))}
                    testID="catalog-tabs-spec-secondary-inline"
                    onEvent={onEvent}
                />
            </Example>
            <Example
                title="Specs · active indicator"
                reference="specs"
                description="El indicador Primary queda 2 dp dentro de su contenido, incluye el badge inline y mantiene un mínimo de 24 dp."
            >
                <Specimen
                    items={[
                        { key: 'search', label: 'Search' },
                        { key: 'flights', label: 'Flights', badge: 3 },
                        { key: 'all', label: 'All' },
                    ]}
                    testID="catalog-tabs-spec-indicator"
                    onEvent={onEvent}
                />
            </Example>
            <Example
                title="Specs · badge sizing and placement"
                reference="specs"
                description="Small, 3, 32 y 999+ se prueban en su anclaje al icono y después de la etiqueta. Estas filas usan scroll para conservar el contenido completo en pantallas estrechas."
            >
                <Specimen
                    items={[
                        { key: 'small', label: 'Flights', icon: 'flight_fill1', badge: true },
                        { key: 'single', label: 'Flights', icon: 'flight_fill1', badge: 3 },
                        { key: 'multiple', label: 'Flights', icon: 'flight_fill1', badge: 32 },
                        { key: 'maximum', label: 'Flights', icon: 'flight_fill1', badge: 1004 },
                    ]}
                    scrollable
                    testID="catalog-tabs-spec-badge-icons"
                    onEvent={onEvent}
                />
                <Specimen
                    items={[
                        { key: 'small', label: 'Label', badge: true },
                        { key: 'single', label: 'Label', badge: 3 },
                        { key: 'multiple', label: 'Label', badge: 32 },
                        { key: 'maximum', label: 'Label', badge: 1004 },
                    ]}
                    scrollable
                    testID="catalog-tabs-spec-badge-labels"
                    onEvent={onEvent}
                />
            </Example>
            <Example
                title="Icons + labels · My saved media"
                reference="guidelines"
                description="Los iconos de Video, Photos y Audio quedan encima de su etiqueta. La fila completa es el área de interacción de cada pestaña."
            >
                <Specimen items={tabsMediaItems} testID="catalog-tabs-media" onEvent={onEvent} />
            </Example>
            <Example
                title="Primary · inline icons"
                reference="specs"
                description="Iconos de 24 dp al inicio, separados 8 dp de la etiqueta. La altura de esta configuración es 48 dp."
            >
                <Specimen items={tabsMediaItems} iconPosition="start" testID="catalog-tabs-inline" onEvent={onEvent} />
            </Example>
            <Example
                title="Icons only · Wishlist / Location"
                reference="guidelines"
                description="Las etiquetas accesibles nombran el destino aunque no se dibuje texto."
            >
                <Specimen items={tabsIconItems} testID="catalog-tabs-icons" onEvent={onEvent} />
            </Example>
            <Example
                title="Fixed · Music"
                reference="guidelines"
                description="Ambient, Soundscapes y White Noise comparten el ancho de la fila."
            >
                <Specimen items={tabsMusicItems} initialValue="soundscapes" testID="catalog-tabs-fixed" onEvent={onEvent} />
            </Example>
            <Example
                title="Scrollable · Dog breeds"
                reference="guidelines"
                description="Se desplaza la fila horizontalmente; la pestaña elegida se revela dentro del viewport. El inicio tiene 52 dp de margen."
            >
                <Specimen items={tabsDogItems} initialValue="alaskan" scrollable testID="catalog-tabs-scrolling" onEvent={onEvent} />
            </Example>
            <Example
                title="Badge · Photos 999+"
                reference="guidelines"
                description="La insignia compartida se ancla al icono de Photos; no desplaza el centro de la pestaña."
            >
                <Tabs
                    items={tabsMediaItems.map((item) => (item.key === 'photos' && !badgeSeen ? { ...item, badge: 1004 } : item))}
                    value={badgePage}
                    onValueChange={(key) => {
                        setBadgePage(key);
                        if (key === 'photos') setBadgeSeen(true);
                    }}
                    testID="catalog-tabs-badge"
                />
            </Example>
            <Example
                title="Secondary · scrollable"
                reference="guidelines"
                description="La misma composición desplazable usa el indicador de ancho completo de Secondary."
            >
                <Specimen
                    variant="secondary"
                    items={tabsDogItems}
                    initialValue="alaskan"
                    scrollable
                    testID="catalog-tabs-secondary-scrolling"
                    onEvent={onEvent}
                />
            </Example>
            <Example
                title="Primary + Secondary · hierarchy"
                reference="guidelines"
                description="La selección secundaria pertenece a su grupo principal y se conserva al volver a él."
            >
                <HierarchyExample onEvent={onEvent} />
            </Example>
            <Example
                title="Keyboard, focus and text size"
                reference="accessibility"
                description="Cada pestaña expone su nombre y selección. Tab entra o sale del grupo; las flechas mueven el foco y Enter o Espacio activa el destino. El texto puede crecer sin recortar el icono ni el indicador."
            >
                <Specimen
                    items={[...tabsProductItems, { key: 'unavailable', label: 'Unavailable', disabled: true }]}
                    testID="catalog-tabs-accessibility"
                    onEvent={onEvent}
                />
            </Example>
            <Example
                title="Estado controlado"
                reference="guidelines"
                description="Demostración de integración: value conserva la selección aceptada por la pantalla. La casilla permite comparar un cambio aceptado con uno rechazado; no forma parte de Tabs."
            >
                <ControlledExample />
            </Example>
        </View>
    );
}
