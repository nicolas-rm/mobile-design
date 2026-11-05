import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ScrollView, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import {
    BottomSheet,
    BottomSheetScrollView,
    BottomSheetTextField,
    Avatar,
    Button,
    Chip,
    Divider,
    ExtendedFAB,
    NavigationDrawer,
    NavigationBar,
    NavigationDrawerModal,
    NavigationRailModal,
    NavigationRail,
    Icon,
    IconButton,
    List,
    SearchView,
    Switch,
    SideSheet,
    Toolbar,
    TopAppBar,
    TextField,
    type NavigationDestination,
    type SearchResult,
    type ToolbarAction,
} from 'mobile-design';
import { Surface, useTheme, type Theme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'mobile-design';
import { initialDocument, sameDocument } from './mobile-design-navigation-state';
import { TabExamples } from './mobile-design-tabs-examples';

type ExampleProps = { onEvent: (message: string) => void };

/** Content only: the catalogue owns its header, outer scroll container and theme. */
export function NavigationExamples({
    id,
    onEvent,
    onOpenPlayground,
}: {
    id: string;
    onEvent: (message: string) => void;
    onOpenPlayground?: () => void;
}) {
    const content = (() => {
        switch (id) {
            case 'bottom-sheets':
                return <BottomSheetExamples onEvent={onEvent} />;
            case 'side-sheets':
                return <SideSheetExamples onEvent={onEvent} />;
            case 'navigation-rail':
                return <RailExamples onEvent={onEvent} />;
            case 'navigation-drawer':
                return <DrawerExamples onEvent={onEvent} />;
            case 'navigation-bar':
                return <NavigationBarExamples onEvent={onEvent} />;
            case 'tabs':
                return <TabExamples onEvent={onEvent} />;
            case 'search':
                return <SearchExamples onEvent={onEvent} />;
            case 'toolbars':
                return <ToolbarExamples onEvent={onEvent} />;
            default:
                return null;
        }
    })();
    return content ? (
        <View style={{ gap: 24 }}>
            {onOpenPlayground && ['navigation-bar', 'navigation-drawer', 'navigation-rail'].includes(id) ? (
                <View style={{ gap: 8 }}>
                    <Text variant="labelLarge">Escenario completo</Text>
                    <Button
                        style={{ alignSelf: 'flex-start' }}
                        icon="open-in-new"
                        onPress={onOpenPlayground}
                        testID="catalog-navigation-playground-open"
                    >
                        Abrir bandeja de correo
                    </Button>
                </View>
            ) : null}
            {content}
        </View>
    ) : null;
}

function Example({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium">{title}</Text>
            {description ? <Text variant="bodyMedium">{description}</Text> : null}
            {children}
        </View>
    );
}

function Toggle({
    label,
    value,
    onValueChange,
    testID,
}: {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    testID: string;
}) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ flex: 1 }}>{label}</Text>
            <Switch value={value} onValueChange={onValueChange} accessibilityLabel={label} testID={testID} />
        </View>
    );
}

const destinations: readonly NavigationDestination[] = [
    { key: 'inbox', label: 'Recibidos', icon: 'inbox-outline', selectedIcon: 'inbox', badge: 12 },
    { key: 'starred', label: 'Destacados', icon: 'star-outline', selectedIcon: 'star' },
    { key: 'sent', label: 'Enviados', icon: 'send-outline', selectedIcon: 'send' },
    { key: 'drafts', label: 'Borradores', icon: 'file-outline', selectedIcon: 'file', badge: true, section: 'Biblioteca' },
    { key: 'archive', label: 'Archivados', icon: 'archive-outline', selectedIcon: 'archive', section: 'Biblioteca' },
    { key: 'disabled', label: 'No disponible', icon: 'lock-outline', disabled: true, section: 'Biblioteca' },
];

function destinationName(key: string) {
    return destinations.find((item) => item.key === key)?.label ?? key;
}

function BottomSheetExamples({ onEvent }: ExampleProps) {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const [standardOpen, setStandardOpen] = useState(true);
    const [standardIndex, setStandardIndex] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalIndex, setModalIndex] = useState(1);
    const [dynamic, setDynamic] = useState(false);
    const [draggable, setDraggable] = useState(true);
    const [handle, setHandle] = useState(true);
    const [dismissible, setDismissible] = useState(true);
    const [savedNote, setSavedNote] = useState('Entregar por la entrada principal.');
    const [draft, setDraft] = useState(savedNote);
    const [selectedRow, setSelectedRow] = useState(0);
    const [confirmedRow, setConfirmedRow] = useState<number>();
    const openModal = (nextIndex: number, isDynamic = false) => {
        setDraft(savedNote);
        setDynamic(isDynamic);
        setModalIndex(nextIndex);
        setModalOpen(true);
    };
    return (
        <View style={{ gap: 32 }}>
            <Example
                title="Estándar: parcial y expandida"
                description="La hoja pertenece a esta área y permite usar el contenido situado detrás. El handle y la flecha del app bar cambian su altura."
            >
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <Button
                        variant="outlined"
                        onPress={() => {
                            setStandardIndex(0);
                            setStandardOpen(true);
                        }}
                        testID="catalog-bottom-standard-partial"
                    >
                        Ver ubicaciones
                    </Button>
                </View>
                <Surface
                    mode="flat"
                    elevation={0}
                    style={{ height: 400, position: 'relative', overflow: 'hidden', backgroundColor: theme.colors.surfaceContainer }}
                >
                    <View style={{ padding: 24, gap: 12 }}>
                        <Text variant="titleMedium">Puntos de entrega</Text>
                        <Text>Selección: ubicación {selectedRow + 1}</Text>
                        <Button
                            style={{ alignSelf: 'flex-start' }}
                            onPress={() => {
                                setConfirmedRow(selectedRow);
                                onEvent(`Entrega confirmada en ubicación ${selectedRow + 1}.`);
                            }}
                            testID="catalog-bottom-underlying-action"
                        >
                            Confirmar entrega
                        </Button>
                        <Text>{confirmedRow == null ? 'Entrega sin confirmar' : `Entrega: ubicación ${confirmedRow + 1}`}</Text>
                    </View>
                    <BottomSheet
                        variant="standard"
                        open={standardOpen}
                        onOpenChange={setStandardOpen}
                        snapPoints={[156, 324]}
                        index={standardIndex}
                        onIndexChange={setStandardIndex}
                        draggable={draggable}
                        showDragHandle={handle}
                        scrollable
                        testID="catalog-bottom-standard"
                    >
                        <BottomSheetScrollView
                            stickyHeaderIndices={[0]}
                            contentContainerStyle={{ paddingBottom: 24 }}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                        >
                            <TopAppBar
                                title="Ubicaciones"
                                statusBarHeight={0}
                                navigationIcon={standardIndex ? 'chevron-down' : 'chevron-up'}
                                navigationLabel={standardIndex ? 'Contraer hoja' : 'Expandir hoja'}
                                onNavigationPress={() => setStandardIndex((value) => (value ? 0 : 1))}
                                actions={[
                                    {
                                        key: 'close',
                                        icon: 'close',
                                        label: 'Cerrar ubicaciones',
                                        onPress: () => setStandardOpen(false),
                                        testID: 'catalog-bottom-standard-close',
                                    },
                                ]}
                                testID="catalog-bottom-standard-appbar"
                            />
                            {Array.from({ length: 12 }, (_, index) => (
                                <List.Item
                                    key={index}
                                    title={`Ubicación ${index + 1}`}
                                    description={index === selectedRow ? 'Seleccionada' : 'Toca para seleccionar'}
                                    leading={(props) => (
                                        <List.Icon {...props} icon={index === selectedRow ? 'map-marker-check' : 'map-marker-outline'} />
                                    )}
                                    onPress={() => {
                                        setSelectedRow(index);
                                        onEvent(`Ubicación ${index + 1} seleccionada.`);
                                    }}
                                    testID={`catalog-bottom-location-${index}`}
                                />
                            ))}
                        </BottomSheetScrollView>
                    </BottomSheet>
                </Surface>
            </Example>
            <Example
                title="Modal: alturas, desplazamiento y teclado"
                description="La modal bloquea el contenido inferior. El gesto se coordina con la lista y el campo de texto; Guardar confirma la nota, Cerrar descarta el borrador."
            >
                <Text variant="labelLarge">Configuración de la muestra</Text>
                <Toggle label="Permitir arrastrar" value={draggable} onValueChange={setDraggable} testID="catalog-bottom-draggable" />
                <Toggle label="Mostrar handle" value={handle} onValueChange={setHandle} testID="catalog-bottom-handle" />
                <Toggle
                    label="Cerrar por gesto, scrim o Atrás"
                    value={dismissible}
                    onValueChange={setDismissible}
                    testID="catalog-bottom-dismissible"
                />
                <Text>Nota guardada: {savedNote || 'Sin nota'}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <Button variant="filled" onPress={() => openModal(1)} testID="catalog-bottom-modal-half">
                        Editar indicaciones
                    </Button>
                    <Button onPress={() => openModal(0, true)} testID="catalog-bottom-modal-dynamic">
                        Altura del contenido
                    </Button>
                </View>
                <BottomSheet
                    key={dynamic ? 'dynamic' : 'snap'}
                    open={modalOpen}
                    onOpenChange={(next) => {
                        setModalOpen(next);
                        if (!next) onEvent('Hoja cerrada; el borrador no se guardó.');
                    }}
                    snapPoints={dynamic ? undefined : ['30%', '50%', '95%']}
                    index={modalIndex}
                    onIndexChange={setModalIndex}
                    draggable={draggable}
                    showDragHandle={handle}
                    dismissible={dismissible}
                    scrollable
                    testID="catalog-bottom-modal"
                >
                    <BottomSheetScrollView
                        stickyHeaderIndices={[0]}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        <TopAppBar
                            title="Indicaciones"
                            statusBarHeight={0}
                            navigationIcon={dynamic ? 'close' : modalIndex === 2 ? 'chevron-down' : 'chevron-up'}
                            navigationLabel={dynamic ? 'Descartar indicaciones' : modalIndex === 2 ? 'Contraer hoja' : 'Expandir hoja'}
                            onNavigationPress={() => {
                                if (!dynamic) setModalIndex((value) => (value === 2 ? 1 : 2));
                                else {
                                    setModalOpen(false);
                                    onEvent('Hoja cerrada; el borrador no se guardó.');
                                }
                            }}
                            actions={[
                                {
                                    key: 'save',
                                    icon: 'check',
                                    label: 'Guardar indicaciones',
                                    onPress: () => {
                                        setSavedNote(draft);
                                        setModalOpen(false);
                                        onEvent('Nota de entrega guardada.');
                                    },
                                    testID: 'catalog-bottom-modal-save',
                                },
                                ...(!dynamic
                                    ? [
                                          {
                                              key: 'close',
                                              icon: 'close',
                                              label: 'Descartar indicaciones',
                                              onPress: () => {
                                                  setModalOpen(false);
                                                  onEvent('Hoja cerrada; el borrador no se guardó.');
                                              },
                                              testID: 'catalog-bottom-modal-close',
                                          },
                                      ]
                                    : []),
                            ]}
                            testID="catalog-bottom-modal-appbar"
                        />
                        <View style={{ paddingHorizontal: 24, gap: 16 }}>
                            <Text variant="headlineSmall">Indicaciones de entrega</Text>
                            <Text>La nota se conserva únicamente al pulsar Guardar.</Text>
                            <BottomSheetTextField
                                value={draft}
                                onChangeText={setDraft}
                                accessibilityLabel="Nota de entrega"
                                label="Nota de entrega"
                                placeholder="Escribe las indicaciones"
                                multiline
                                inputStyle={{ minHeight: 72 }}
                                testID="catalog-bottom-note"
                            />
                            {!dynamic ? (
                                <>
                                    <Divider />
                                    {Array.from({ length: 20 }, (_, index) => (
                                        <List.Item
                                            key={index}
                                            title={`Referencia ${index + 1}`}
                                            description="Contenido desplazable de la hoja"
                                            leading={(props) => <List.Icon {...props} icon="information-outline" />}
                                        />
                                    ))}
                                </>
                            ) : null}
                        </View>
                    </BottomSheetScrollView>
                </BottomSheet>
            </Example>
        </View>
    );
}

function SideSheetExamples({ onEvent }: ExampleProps) {
    const theme = useTheme<Theme>();
    const [standardOpen, setStandardOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [detached, setDetached] = useState(false);
    const [edge, setEdge] = useState<'start' | 'end'>('end');
    const [option, setOption] = useState('Resumen');
    const [draftOption, setDraftOption] = useState(option);
    const [person, setPerson] = useState<string>();
    const options = ['Resumen', 'Participantes', 'Archivos', 'Actividad'];
    const detailText: Record<string, string> = {
        Resumen: 'Proyecto de diseño · revisión en curso.',
        Participantes: 'Ana, Luis y el equipo de diseño.',
        Archivos: 'Guía de estilo, componentes y notas de revisión.',
        Actividad: 'Último cambio: revisión de navegación completada.',
    };
    const details = (value: string, onChange: (value: string) => void, prefix: string) => (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
        >
            {person ? (
                <View style={{ padding: 24, gap: 16 }}>
                    <Avatar.Text size={48} label={person.slice(0, 1)} />
                    <Text variant="titleMedium">{person}</Text>
                    <Text>
                        {person === 'Ana'
                            ? 'Responsable de diseño y revisión de interfaces.'
                            : 'Responsable de implementación y accesibilidad.'}
                    </Text>
                </View>
            ) : (
                <>
                    {options.map((item) => (
                        <List.Item
                            key={item}
                            title={item}
                            leading={(props) => <List.Icon {...props} icon={value === item ? 'check-circle' : 'circle-outline'} />}
                            onPress={() => onChange(item)}
                            testID={`${prefix}-${item}`}
                        />
                    ))}
                    <Text style={{ padding: 24 }}>{detailText[value]}</Text>
                    {value === 'Participantes'
                        ? ['Ana', 'Luis'].map((name) => (
                              <List.Item
                                  key={name}
                                  title={name}
                                  leading={(props) => <List.Icon {...props} icon="account-outline" />}
                                  onPress={() => setPerson(name)}
                                  testID={`${prefix}-person-${name}`}
                              />
                          ))
                        : null}
                </>
            )}
        </ScrollView>
    );
    return (
        <View style={{ gap: 32 }}>
            <Example
                title="Estándar: contenido al lado"
                description="La selección actualiza el proyecto. Esta muestra encajada representa una región de trabajo; la modalidad estándar es apropiada para ventanas medianas o amplias."
            >
                <Button
                    style={{ alignSelf: 'flex-start' }}
                    variant="outlined"
                    onPress={() => setStandardOpen((value) => !value)}
                    testID="catalog-side-standard-toggle"
                >
                    {standardOpen ? 'Cerrar detalles' : 'Mostrar detalles'}
                </Button>
                <Surface
                    mode="flat"
                    elevation={0}
                    style={{ height: 400, flexDirection: 'row', overflow: 'hidden', backgroundColor: theme.colors.surfaceContainer }}
                >
                    <View style={{ flex: 1, minWidth: 0, padding: 16, gap: 12 }}>
                        <Text variant="titleMedium">Proyecto</Text>
                        <Text>{option}</Text>
                        <Text>{detailText[option]}</Text>
                    </View>
                    <SideSheet
                        variant="standard"
                        open={standardOpen}
                        onOpenChange={setStandardOpen}
                        width={220}
                        title={person ?? 'Detalles'}
                        onBackPress={person ? () => setPerson(undefined) : undefined}
                        style={{ paddingTop: 0, paddingBottom: 0 }}
                        testID="catalog-side-standard"
                    >
                        {details(option, setOption, 'catalog-side-standard-option')}
                    </SideSheet>
                </Surface>
            </Example>
            <Example
                title="Modal: aplicar o cancelar"
                description="La selección es un borrador hasta pulsar Aplicar. Cerrar, Atrás, scrim y arrastre conservan la última sección aplicada."
            >
                <Toggle label="Separada 16 dp del borde" value={detached} onValueChange={setDetached} testID="catalog-side-detached" />
                <Toggle
                    label="Abrir desde el inicio"
                    value={edge === 'start'}
                    onValueChange={(value) => setEdge(value ? 'start' : 'end')}
                    testID="catalog-side-edge"
                />
                <Button
                    style={{ alignSelf: 'flex-start' }}
                    variant="filled"
                    onPress={() => {
                        setPerson(undefined);
                        setDraftOption(option);
                        setModalOpen(true);
                    }}
                    testID="catalog-side-modal-open"
                >
                    Editar sección lateral
                </Button>
                <Text testID="catalog-side-applied">
                    Sección aplicada: {option} · {detailText[option]}
                </Text>
                <SideSheet
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    edge={edge}
                    detached={detached}
                    showDivider
                    title={person ?? 'Detalles del proyecto'}
                    onBackPress={person ? () => setPerson(undefined) : undefined}
                    footer={
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            <Button variant="text" onPress={() => setModalOpen(false)} testID="catalog-side-cancel">
                                Cancelar
                            </Button>
                            <Button
                                variant="filled"
                                onPress={() => {
                                    setOption(draftOption);
                                    setModalOpen(false);
                                    onEvent(`Sección aplicada: ${draftOption}.`);
                                }}
                                testID="catalog-side-apply"
                            >
                                Aplicar
                            </Button>
                        </View>
                    }
                    testID="catalog-side-modal"
                >
                    {details(draftOption, setDraftOption, 'catalog-side-option')}
                </SideSheet>
            </Example>
        </View>
    );
}

function RailExamples({ onEvent }: ExampleProps) {
    const theme = useTheme<Theme>();
    const [value, setValue] = useState('inbox');
    const [expanded, setExpanded] = useState(false);
    const [modal, setModal] = useState(false);
    const [centered, setCentered] = useState(false);
    const [fullIndicator, setFullIndicator] = useState(false);
    const [drafts, setDrafts] = useState(0);
    return (
        <View style={{ gap: 24 }}>
            <Text>El menú alterna entre rail contraído y expandido. Los destinos cambian el panel; el FAB crea un borrador local.</Text>
            <Toggle label="Destinos centrados" value={centered} onValueChange={setCentered} testID="catalog-rail-centered" />
            <Toggle
                label="Indicador de ancho completo"
                value={fullIndicator}
                onValueChange={setFullIndicator}
                testID="catalog-rail-indicator"
            />
            <Surface
                mode="flat"
                elevation={0}
                style={{ height: 580, flexDirection: 'row', overflow: 'hidden', backgroundColor: theme.colors.surfaceContainer }}
            >
                <NavigationRail
                    items={destinations.map((item) => ({
                        ...item,
                        hiddenWhenCollapsed: item.key === 'archive' || item.key === 'disabled',
                    }))}
                    value={value}
                    onValueChange={(next) => {
                        setValue(next);
                        onEvent(`Destino: ${destinationName(next)}.`);
                    }}
                    indicatorWidth={fullIndicator ? 'full' : 'content'}
                    alignment={centered ? 'center' : 'top'}
                    expanded={expanded}
                    onExpandedChange={setExpanded}
                    expandedWidth={240}
                    fab={
                        <ExtendedFAB
                            expanded={expanded}
                            elevation={0}
                            label="Redactar"
                            icon="pencil"
                            accessibilityLabel="Crear borrador"
                            onPress={() => {
                                setDrafts((count) => count + 1);
                                setValue('drafts');
                                onEvent('Borrador creado.');
                            }}
                            testID="catalog-rail-create"
                        />
                    }
                    style={{ paddingTop: 44, paddingBottom: 0 }}
                    testID="catalog-rail"
                />
                <View style={{ flex: 1, minWidth: 0, padding: 16, gap: 12 }}>
                    <Text variant="titleMedium">{destinationName(value)}</Text>
                    <Text>Borradores creados: {drafts}</Text>
                    <Text>{expanded ? 'Rail expandido' : 'Rail contraído de 96 dp'}</Text>
                </View>
            </Surface>
            <Button style={{ alignSelf: 'flex-start' }} variant="filled" onPress={() => setModal(true)} testID="catalog-rail-modal-open">
                Abrir rail modal expandido
            </Button>
            <NavigationRailModal
                open={modal}
                onOpenChange={setModal}
                items={destinations}
                value={value}
                onValueChange={(next) => {
                    setValue(next);
                    onEvent(`Destino modal: ${destinationName(next)}.`);
                }}
                title="Correo"
                testID="catalog-rail-modal"
            />
        </View>
    );
}

function DrawerExamples({ onEvent }: ExampleProps) {
    const [value, setValue] = useState('inbox');
    const [open, setOpen] = useState(false);
    const [closeOnSelect, setCloseOnSelect] = useState(true);
    const [labelsOnly, setLabelsOnly] = useState(false);
    const drawerItems = destinations.map((item) => ({ ...item, icon: labelsOnly ? undefined : item.icon }));
    const select = (next: string) => {
        setValue(next);
        onEvent(`Destino del cajón: ${destinationName(next)}.`);
    };
    return (
        <View style={{ gap: 32 }}>
            <Toggle label="Destinos sólo con texto" value={labelsOnly} onValueChange={setLabelsOnly} testID="catalog-drawer-labels-only" />
            <Example
                title="Estándar: secciones y destino activo"
                description="Variante baseline; en Expressive se recomienda el rail expandido. Comparte selección con la modal; los contadores son texto y los divisores separan secciones."
            >
                <NavigationDrawer items={drawerItems} value={value} onValueChange={select} testID="catalog-drawer-standard" />
                <Text>Panel activo: {destinationName(value)}</Text>
            </Example>
            <Example
                title="Modal"
                description="El cajón aparece desde el inicio lógico. Seleccionar un destino, el gesto, el scrim o Atrás cierran la superficie."
            >
                <Toggle
                    label="Cerrar al elegir un destino"
                    value={closeOnSelect}
                    onValueChange={setCloseOnSelect}
                    testID="catalog-drawer-close-on-select"
                />
                <Button
                    style={{ alignSelf: 'flex-start' }}
                    variant="filled"
                    onPress={() => setOpen(true)}
                    testID="catalog-drawer-modal-open"
                >
                    Abrir cajón
                </Button>
                <NavigationDrawerModal
                    open={open}
                    onOpenChange={setOpen}
                    items={drawerItems}
                    value={value}
                    onValueChange={select}
                    closeOnSelect={closeOnSelect}
                    title="Correo"
                    testID="catalog-drawer-modal"
                />
            </Example>
        </View>
    );
}

const searchEntries: readonly SearchResult[] = [
    { key: 'monterrey', title: 'Monterrey', description: 'Nuevo León, México', icon: 'map-marker-outline' },
    { key: 'mexico', title: 'Ciudad de México', description: 'México', icon: 'map-marker-outline' },
    { key: 'guadalajara', title: 'Guadalajara', description: 'Jalisco, México', icon: 'map-marker-outline' },
    { key: 'merida', title: 'Mérida', description: 'Yucatán, México', icon: 'map-marker-outline' },
    { key: 'oaxaca', title: 'Oaxaca', description: 'Oaxaca, México', icon: 'map-marker-outline' },
    { key: 'reserved', title: 'Destino no disponible', description: 'Resultado deshabilitado', icon: 'lock-outline', disabled: true },
];

function normalizeQuery(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es-MX')
        .trim();
}

function SearchExamples({ onEvent }: ExampleProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [docked, setDocked] = useState(false);
    const [submitted, setSubmitted] = useState('');
    const [selected, setSelected] = useState('');
    const [savedDestinations, setSavedDestinations] = useState<string[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [closeOnSubmit, setCloseOnSubmit] = useState(false);
    const [avatar, setAvatar] = useState(false),
        [profileOpen, setProfileOpen] = useState(false);
    const results = useMemo(() => {
        const normalized = normalizeQuery(query);
        return searchEntries.filter((item) => normalizeQuery(`${item.title} ${item.description ?? ''}`).includes(normalized));
    }, [query]);
    return (
        <View style={{ gap: 24 }}>
            <Text>
                La barra abre una vista con teclado. La búsqueda filtra este catálogo local por nombre o estado; escribir «xyz» muestra el
                estado vacío.
            </Text>
            <Text variant="labelLarge">Configuración de la muestra</Text>
            <Toggle label="Resultados docked" value={docked} onValueChange={setDocked} testID="catalog-search-docked" />
            <Toggle label="Avatar y acción independiente" value={avatar} onValueChange={setAvatar} testID="catalog-search-avatar" />
            <SearchView
                variant="contained"
                presentation={docked ? 'docked' : 'full-screen'}
                trailingContent={
                    avatar ? (
                        <Avatar.Button
                            accessibilityLabel="Abrir perfil"
                            onPress={() => setProfileOpen(true)}
                            style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
                            testID="catalog-search-profile"
                        >
                            <Avatar.Text size={30} label="N" />
                        </Avatar.Button>
                    ) : undefined
                }
                trailingActions={[
                    {
                        key: 'location',
                        icon: 'map-marker-outline',
                        label: 'Buscar Monterrey',
                        onPress: () => {
                            setQuery('Monterrey');
                            setOpen(true);
                            onEvent('Filtro de Monterrey aplicado.');
                        },
                    },
                ]}
                open={open}
                onOpenChange={setOpen}
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar destinos"
                results={previewLoading ? [] : results}
                onSearch={(value) => {
                    setSubmitted(value);
                    onEvent(`Búsqueda enviada: ${value || 'Todos los destinos'}.`);
                }}
                onResultPress={(result) => {
                    setSelected(result.title);
                    setQuery(result.title);
                    onEvent(`Destino seleccionado: ${result.title}.`);
                }}
                loading={previewLoading}
                closeOnSubmit={closeOnSubmit}
                supportingContent={
                    <Text variant="bodySmall" style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
                        {previewLoading
                            ? 'Vista previa manual de carga; no se realiza una petición.'
                            : `${results.length} resultados en el catálogo local`}
                    </Text>
                }
                emptyContent={<Text>No hay destinos que coincidan con «{query}».</Text>}
                testID="catalog-search"
            />
            <Toggle
                label="Vista previa del estado de carga"
                value={previewLoading}
                onValueChange={setPreviewLoading}
                testID="catalog-search-loading"
            />
            <Toggle
                label="Cerrar al enviar con el teclado"
                value={closeOnSubmit}
                onValueChange={setCloseOnSubmit}
                testID="catalog-search-close-submit"
            />
            <Text>Última búsqueda enviada: {submitted || 'Sin enviar'}</Text>
            {selected ? (
                <View style={{ gap: 12 }}>
                    <Text variant="titleMedium">{selected}</Text>
                    <Text>{searchEntries.find((entry) => entry.title === selected)?.description}</Text>
                    <Button
                        style={{ alignSelf: 'flex-start' }}
                        variant={savedDestinations.includes(selected) ? 'tonal' : 'outlined'}
                        onPress={() =>
                            setSavedDestinations((values) =>
                                values.includes(selected) ? values.filter((value) => value !== selected) : [...values, selected]
                            )
                        }
                        testID="catalog-search-save-destination"
                    >
                        {savedDestinations.includes(selected) ? 'Quitar destino guardado' : 'Guardar destino'}
                    </Button>
                    <Button
                        style={{ alignSelf: 'flex-start' }}
                        variant="text"
                        onPress={() => setSelected('')}
                        testID="catalog-search-cancel-selection"
                    >
                        Volver a los resultados
                    </Button>
                </View>
            ) : (
                <Text>Ningún destino seleccionado</Text>
            )}
            <Text testID="catalog-search-saved">Destinos guardados: {savedDestinations.join(', ') || 'Ninguno'}</Text>
            <Button
                style={{ alignSelf: 'flex-start' }}
                onPress={() => {
                    setQuery('');
                    setSubmitted('');
                    setSelected('');
                    onEvent('Búsqueda restablecida.');
                }}
                testID="catalog-search-reset"
            >
                Restablecer
            </Button>
            <SideSheet open={profileOpen} onOpenChange={setProfileOpen} title="Perfil local" testID="catalog-search-profile-view">
                <View style={{ padding: 24, gap: 16 }}>
                    <Avatar.Text size={48} label="N" />
                    <Text variant="titleMedium">Nicolás</Text>
                    <Text>Destinos guardados: {savedDestinations.length}</Text>
                    <Text>La cuenta de esta muestra conserva sus destinos mientras permanezcas aquí.</Text>
                </View>
            </SideSheet>
            <Example
                title="Trailing elements"
                description="Avatar, una acción, dos acciones, o una acción con avatar. Cada control conserva su propio target de 48 dp."
            >
                {(['avatar', 'one-icon', 'two-icons', 'icon-avatar'] as const).map((configuration) => (
                    <SearchTrailingExample key={configuration} configuration={configuration} onEvent={onEvent} />
                ))}
            </Example>
            <GroupedSearchExample onEvent={onEvent} />
            <IconSearchExample onEvent={onEvent} />
            <SearchDestinationExample onEvent={onEvent} />
        </View>
    );
}

function SearchTrailingExample({
    configuration,
    onEvent,
}: ExampleProps & { configuration: 'avatar' | 'one-icon' | 'two-icons' | 'icon-avatar' }) {
    const [open, setOpen] = useState(false);
    const [profile, setProfile] = useState(false);
    const [query, setQuery] = useState('');
    const avatar = configuration === 'avatar' || configuration === 'icon-avatar';
    const location = {
        key: 'location',
        icon: 'my_location',
        label: 'Buscar Monterrey',
        onPress: () => {
            setQuery('Monterrey');
            setOpen(true);
        },
    };
    const recent = {
        key: 'recent',
        icon: 'history',
        label: 'Ver sugerencias',
        onPress: () => {
            setQuery('');
            setOpen(true);
        },
    };
    const results = searchEntries.filter((entry) => normalizeQuery(`${entry.title} ${entry.description}`).includes(normalizeQuery(query)));
    return (
        <View style={{ gap: 8 }}>
            <Text variant="labelLarge">
                {configuration === 'avatar'
                    ? 'Avatar'
                    : configuration === 'one-icon'
                      ? 'One trailing icon'
                      : configuration === 'two-icons'
                        ? 'Two trailing icons'
                        : 'Trailing icon and avatar'}
            </Text>
            <SearchView
                open={open}
                onOpenChange={setOpen}
                presentation="auto"
                value={query}
                onChangeText={setQuery}
                onSearch={(value) => onEvent(`Búsqueda: ${value || 'Sugerencias'}.`)}
                results={results}
                onResultPress={(result) => {
                    setQuery(result.title);
                    onEvent(`Destino: ${result.title}.`);
                }}
                placeholder="Search destinations"
                trailingActions={configuration === 'avatar' ? [] : configuration === 'two-icons' ? [location, recent] : [location]}
                trailingContent={
                    avatar ? (
                        <Avatar.Button accessibilityLabel="Abrir perfil" onPress={() => setProfile(true)}>
                            <Avatar.Text size={30} label="N" />
                        </Avatar.Button>
                    ) : undefined
                }
                testID={`catalog-search-trailing-${configuration}`}
            />
            <SideSheet
                open={profile}
                onOpenChange={setProfile}
                title="Perfil local"
                testID={`catalog-search-trailing-${configuration}-profile`}
            >
                <View style={{ padding: 24, gap: 12 }}>
                    <Avatar.Text size={48} label="N" />
                    <Text variant="titleMedium">Nicolás</Text>
                    <Text>Cuenta local de la muestra.</Text>
                </View>
            </SideSheet>
        </View>
    );
}

type GroupedSearchResult = SearchResult & { kind: 'people' | 'places'; initials?: string };
const groupedSearchEntries: readonly GroupedSearchResult[] = [
    { key: 'ana', title: 'Ana López', description: 'Equipo de diseño', initials: 'AL', kind: 'people' },
    { key: 'luis', title: 'Luis Mendoza', description: 'Equipo de desarrollo', initials: 'LM', kind: 'people' },
    { key: 'mar', title: 'Mar García', description: 'Investigación de usuarios', initials: 'MG', kind: 'people' },
    { key: 'fundidora', title: 'Parque Fundidora', description: 'Monterrey, Nuevo León', kind: 'places' },
    { key: 'museum', title: 'Museo de Arte', description: 'Centro de Monterrey', kind: 'places' },
    { key: 'library', title: 'Biblioteca Central', description: 'San Nicolás, Nuevo León', kind: 'places' },
];

/** Categories, gaps, avatars and filters are a search composition, not a third variant. */
function GroupedSearchExample({ onEvent }: ExampleProps) {
    const theme = useTheme<Theme>();
    const [open, setOpen] = useState(false),
        [query, setQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'people' | 'places'>('all');
    const [selected, setSelected] = useState<GroupedSearchResult>();
    const normalized = normalizeQuery(query);
    const matches = groupedSearchEntries.filter(
        (item) => (filter === 'all' || item.kind === filter) && normalizeQuery(`${item.title} ${item.description}`).includes(normalized)
    );
    const choose = (item: GroupedSearchResult) => {
        setSelected(item);
        setQuery(item.title);
        setOpen(false);
        onEvent(`Selección de búsqueda: ${item.title}.`);
    };
    return (
        <Example
            title="Categorías, avatares y filtros"
            description="Los filtros cambian el conjunto de resultados. Seleccionar una persona o un lugar cierra la búsqueda y conserva su detalle."
        >
            <SearchView
                open={open}
                onOpenChange={setOpen}
                value={query}
                onChangeText={setQuery}
                onSearch={setQuery}
                placeholder="Buscar personas y lugares"
                supportingContent={
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 }}>
                        {(
                            [
                                { key: 'all', label: 'Todos' },
                                { key: 'people', label: 'Personas' },
                                { key: 'places', label: 'Lugares' },
                            ] as const
                        ).map((item) => (
                            <Chip
                                key={item.key}
                                variant="filter"
                                selected={filter === item.key}
                                onPress={() => setFilter(item.key)}
                                testID={`catalog-search-group-filter-${item.key}`}
                            >
                                {item.label}
                            </Chip>
                        ))}
                    </View>
                }
                renderResults={() => (
                    <ScrollView
                        style={{ flex: 1 }}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 16 }}
                        testID="catalog-search-group-results"
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        {(
                            [
                                { kind: 'people', label: 'Personas' },
                                { kind: 'places', label: 'Lugares' },
                            ] as const
                        ).map((group) => {
                            const entries = matches.filter((item) => item.kind === group.kind);
                            return entries.length ? (
                                <View key={group.kind} style={{ gap: 8 }} testID={`catalog-search-group-${group.kind}`}>
                                    <Text
                                        variant="labelLarge"
                                        accessibilityRole="header"
                                        style={{ paddingHorizontal: 16, color: theme.colors.onSurfaceVariant }}
                                    >
                                        {group.label}
                                    </Text>
                                    <List.Group variant="standard">
                                        {entries.map((item) => (
                                            <List.Item
                                                key={item.key}
                                                title={item.title}
                                                description={item.description}
                                                leading={
                                                    item.initials ? (
                                                        <Avatar.Text size={40} label={item.initials} />
                                                    ) : (
                                                        <Icon source="map-marker-outline" size={20} />
                                                    )
                                                }
                                                onPress={() => choose(item)}
                                                testID={`catalog-search-group-result-${item.key}`}
                                            />
                                        ))}
                                    </List.Group>
                                </View>
                            ) : null;
                        })}
                        {!matches.length ? (
                            <Text accessibilityLiveRegion="polite" style={{ padding: 16 }}>
                                No hay {filter === 'people' ? 'personas' : filter === 'places' ? 'lugares' : 'resultados'} que coincidan con
                                «{query}».
                            </Text>
                        ) : null}
                    </ScrollView>
                )}
                testID="catalog-search-grouped"
            />
            <View style={{ gap: 8 }} accessibilityLiveRegion="polite" testID="catalog-search-group-selection">
                <Text variant="titleMedium">{selected?.title ?? 'Sin selección'}</Text>
                {selected ? <Text>{selected.description}</Text> : <Text>Busca una persona o un lugar para consultar su detalle.</Text>}
            </View>
        </Example>
    );
}

/** Secondary search can start from an icon instead of reserving a bar. */
function IconSearchExample({ onEvent }: ExampleProps) {
    const [open, setOpen] = useState(false),
        [query, setQuery] = useState('');
    const [selected, setSelected] = useState<SearchResult>();
    const matches = searchEntries.filter((item) => normalizeQuery(`${item.title} ${item.description}`).includes(normalizeQuery(query)));
    return (
        <Example
            title="Entrada desde un icono"
            description="Buscar es una acción secundaria. El icono abre las sugerencias; elegir un destino vuelve a su detalle."
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <Text variant="titleLarge" style={{ flex: 1 }}>
                    Mis destinos
                </Text>
                <SearchView
                    open={open}
                    onOpenChange={setOpen}
                    value={query}
                    onChangeText={setQuery}
                    onSearch={setQuery}
                    placeholder="Buscar destinos"
                    results={matches}
                    onResultPress={(result) => {
                        setSelected(result);
                        setQuery(result.title);
                        setOpen(false);
                        onEvent(`Destino encontrado: ${result.title}.`);
                    }}
                    renderTrigger={({ open: enter, disabled, expanded }) => (
                        <IconButton
                            icon="magnify"
                            accessibilityLabel="Buscar un destino"
                            accessibilityState={{ expanded }}
                            disabled={disabled}
                            onPress={enter}
                            testID="catalog-search-icon-trigger"
                        />
                    )}
                    testID="catalog-search-icon"
                />
            </View>
            <View accessibilityLiveRegion="polite" style={{ gap: 8 }} testID="catalog-search-icon-selection">
                <Text variant="titleMedium">{selected?.title ?? 'Sin destino elegido'}</Text>
                {selected ? (
                    <Text>{selected.description}</Text>
                ) : (
                    <Text>Tus resultados aparecerán aquí al seleccionar una sugerencia.</Text>
                )}
            </View>
        </Example>
    );
}

/** The search destination opens focused search; leaving it restores the chosen destination. */
function SearchDestinationExample({ onEvent }: ExampleProps) {
    const theme = useTheme<Theme>();
    const [destination, setDestination] = useState('home'),
        [open, setOpen] = useState(false);
    const [query, setQuery] = useState(''),
        [selected, setSelected] = useState<SearchResult>();
    const [visited, setVisited] = useState<SearchResult[]>([]);
    const changeOpen = (next: boolean) => {
        setOpen(next);
        if (!next) setDestination((current) => (current === 'search' ? 'home' : current));
    };
    const choose = (result: SearchResult) => {
        setSelected(result);
        setQuery(result.title);
        setVisited((items) => (items.some((item) => item.key === result.key) ? items : [...items, result]));
        setDestination('places');
        setOpen(false);
        onEvent(`Lugar abierto: ${result.title}.`);
    };
    const matches = searchEntries.filter((item) => normalizeQuery(`${item.title} ${item.description}`).includes(normalizeQuery(query)));
    return (
        <Example
            title="Búsqueda como destino de navegación"
            description="Buscar abre una vista enfocada. Cerrar vuelve a Inicio; elegir un resultado abre Lugares y conserva su registro."
        >
            <View style={{ backgroundColor: theme.colors.surfaceContainerLow }}>
                <View style={{ padding: 24, minHeight: 184, gap: 12 }} testID="catalog-search-destination-content">
                    <Text variant="titleLarge">{destination === 'places' ? 'Lugares consultados' : 'Explora tus próximos destinos'}</Text>
                    {destination === 'places' ? (
                        visited.length ? (
                            <>
                                <List.Group variant="standard">
                                    {visited.map((item) => (
                                        <List.Item
                                            key={item.key}
                                            title={item.title}
                                            description={item.description}
                                            selected={selected?.key === item.key}
                                            onPress={() => setSelected(item)}
                                            testID={`catalog-search-visited-${item.key}`}
                                        />
                                    ))}
                                </List.Group>
                                <Text accessibilityLiveRegion="polite" testID="catalog-search-destination-selection">
                                    {selected?.title} · {selected?.description}
                                </Text>
                            </>
                        ) : (
                            <Text>Aquí encontrarás los lugares que abras desde Buscar.</Text>
                        )
                    ) : (
                        <Text>Busca una ciudad para consultar sus datos y volver a ella desde Lugares.</Text>
                    )}
                </View>
                <SearchView
                    open={open}
                    onOpenChange={changeOpen}
                    value={query}
                    onChangeText={setQuery}
                    onSearch={setQuery}
                    placeholder="Buscar lugares"
                    results={matches}
                    onResultPress={choose}
                    renderTrigger={({ open: enter }) => (
                        <NavigationBar
                            value={destination}
                            onValueChange={(next) => {
                                setDestination(next);
                                if (next === 'search') enter();
                                else setOpen(false);
                            }}
                            items={[
                                { key: 'home', label: 'Inicio', icon: 'home-outline', selectedIcon: 'home' },
                                { key: 'search', label: 'Buscar', icon: 'magnify' },
                                { key: 'places', label: 'Lugares', icon: 'map-marker-outline', selectedIcon: 'map-marker' },
                            ]}
                            safeArea={false}
                            variant="short"
                            testID="catalog-search-destination-navigation"
                        />
                    )}
                    testID="catalog-search-destination"
                />
            </View>
        </Example>
    );
}

function ToolbarExamples({ onEvent }: ExampleProps) {
    const theme = useTheme<Theme>();
    const [document, setDocument] = useState({ ...initialDocument });
    const [savedDocument, setSavedDocument] = useState({ ...initialDocument });
    const [visible, setVisible] = useState(true);
    const [vibrant, setVibrant] = useState(false);
    const [toolbarExpanded, setToolbarExpanded] = useState(true);
    const [withFab, setWithFab] = useState(false);
    const [vertical, setVertical] = useState(false);
    const [revision, setRevision] = useState(0);
    const [moreActions, setMoreActions] = useState(false);
    const dirty = !sameDocument(document, savedDocument);
    const save = () => {
        if (!dirty) return;
        setSavedDocument({ ...document });
        setRevision((value) => value + 1);
        onEvent('Texto y formato guardados en la versión local.');
    };
    const actions: readonly ToolbarAction[] = [
        {
            key: 'bold',
            icon: 'format-bold',
            label: 'Negrita',
            selected: document.bold,
            onPress: () => setDocument((value) => ({ ...value, bold: !value.bold })),
        },
        {
            key: 'italic',
            icon: 'format-italic',
            label: 'Cursiva',
            selected: document.italic,
            onPress: () => setDocument((value) => ({ ...value, italic: !value.italic })),
        },
        {
            key: 'favorite',
            icon: document.favorite ? 'star' : 'star-outline',
            label: 'Destacar',
            selected: document.favorite,
            onPress: () => setDocument((value) => ({ ...value, favorite: !value.favorite })),
        },
        { key: 'save', icon: 'content-save-outline', label: 'Guardar documento', mode: 'contained', disabled: !dirty, onPress: save },
        ...(moreActions
            ? [
                  {
                      key: 'undo',
                      icon: 'undo',
                      label: 'Recuperar versión guardada',
                      disabled: !dirty,
                      onPress: () => setDocument({ ...savedDocument }),
                  },
                  {
                      key: 'uppercase',
                      icon: 'format-letter-case',
                      label: 'Convertir a mayúsculas',
                      disabled: !document.text,
                      onPress: () => setDocument((value) => ({ ...value, text: value.text.toLocaleUpperCase('es-MX') })),
                  },
                  {
                      key: 'clear',
                      icon: 'delete-outline',
                      label: 'Vaciar documento',
                      disabled: !document.text,
                      onPress: () => setDocument((value) => ({ ...value, text: '' })),
                  },
              ]
            : []),
    ];
    const preview = (
        <Text variant="bodyLarge" style={{ fontWeight: document.bold ? '700' : '400', fontStyle: document.italic ? 'italic' : 'normal' }}>
            {document.text}
            {document.favorite ? ' ★' : ''}
        </Text>
    );
    return (
        <View style={{ gap: 32 }}>
            <Example
                title="Editar, guardar y recuperar"
                description="El texto y formato son un borrador. Guardar crea una versión local; Cancelar cambios restaura esa versión. Guardar se deshabilita cuando no hay cambios."
            >
                <TextField
                    label="Documento"
                    value={document.text}
                    onChangeText={(text) => setDocument((value) => ({ ...value, text }))}
                    multiline
                    testID="catalog-toolbar-document"
                />
                {preview}
                <Text testID="catalog-toolbar-save-state">
                    {dirty ? 'Cambios sin guardar' : 'Versión guardada'} · revisión {revision}
                </Text>
                <Button
                    style={{ alignSelf: 'flex-start' }}
                    variant="outlined"
                    disabled={!dirty}
                    onPress={() => setDocument({ ...savedDocument })}
                    testID="catalog-toolbar-cancel"
                >
                    Cancelar cambios
                </Button>
                <Text variant="labelLarge">Última versión guardada</Text>
                <Text style={{ fontWeight: savedDocument.bold ? '700' : '400', fontStyle: savedDocument.italic ? 'italic' : 'normal' }}>
                    {savedDocument.text}
                    {savedDocument.favorite ? ' ★' : ''}
                </Text>
                <Toggle label="Color vibrante" value={vibrant} onValueChange={setVibrant} testID="catalog-toolbar-vibrant" />
                <Toggle label="Mostrar barras" value={visible} onValueChange={setVisible} testID="catalog-toolbar-visible" />
                <Toggle
                    label="Acciones adicionales con menú de desbordamiento"
                    value={moreActions}
                    onValueChange={setMoreActions}
                    testID="catalog-toolbar-more-actions"
                />
            </Example>
            <Example
                title="Docked"
                description="La barra ocupa todo el borde inferior de esta región de trabajo, con controles separados del contenido."
            >
                <Surface mode="flat" elevation={0} style={{ backgroundColor: theme.colors.surfaceContainerLow }}>
                    <View style={{ minHeight: 160, padding: 24 }}>{preview}</View>
                    <Toolbar
                        actions={actions}
                        variant="docked"
                        safeArea={false}
                        color={vibrant ? 'vibrant' : 'standard'}
                        visible={visible}
                        testID="catalog-toolbar-docked"
                    />
                </Surface>
            </Example>
            <Example
                title="Flotante horizontal y vertical"
                description="La barra conserva los márgenes de su región. Con FAB, contraer oculta las acciones y agranda Guardar; los cambios pendientes se conservan."
            >
                <Toggle label="Incluir FAB de Guardar" value={withFab} onValueChange={setWithFab} testID="catalog-toolbar-fab" />
                <Toggle label="Expandida" value={toolbarExpanded} onValueChange={setToolbarExpanded} testID="catalog-toolbar-expanded" />
                <Toggle label="Orientación vertical" value={vertical} onValueChange={setVertical} testID="catalog-toolbar-vertical" />
                <Surface
                    mode="flat"
                    elevation={0}
                    style={{ minHeight: vertical ? 392 : 280, backgroundColor: theme.colors.surfaceContainerLow, position: 'relative' }}
                >
                    <View style={{ padding: 24, paddingEnd: vertical ? 128 : 24, paddingBottom: vertical ? 24 : 112 }}>{preview}</View>
                    <Toolbar
                        actions={withFab ? actions.filter((action) => action.key !== 'save') : actions}
                        fab={withFab ? actions[3] : undefined}
                        maxVisibleActions={vertical ? 4 : undefined}
                        expanded={toolbarExpanded}
                        variant="floating"
                        orientation={vertical ? 'vertical' : 'horizontal'}
                        color={vibrant ? 'vibrant' : 'standard'}
                        visible={visible}
                        style={
                            vertical ? { position: 'absolute', right: 0, top: 0 } : { position: 'absolute', bottom: 0, maxWidth: '100%' }
                        }
                        testID="catalog-toolbar-floating"
                    />
                </Surface>
            </Example>
        </View>
    );
}

const navigationItems: readonly NavigationDestination[] = [
    { key: 'home', label: 'Home', icon: 'home-outline', selectedIcon: 'home_fill1' },
    { key: 'browse', label: 'Browse', icon: 'browse_gallery', selectedIcon: 'browse_gallery_fill1', badge: 3 },
    { key: 'radio', label: 'Radio', icon: 'radio', selectedIcon: 'radio_fill1' },
    { key: 'library', label: 'Library', icon: 'library_music', selectedIcon: 'library_music_fill1', badge: true },
    { key: 'downloads', label: 'Downloads', icon: 'download', selectedIcon: 'download_fill1' },
];
const navigationMusicPages: Record<string, readonly string[]> = {
    home: ['Recently played', 'Made for you', 'New releases', 'Daily mix', 'Discover weekly'],
    browse: ['Ambient', 'Jazz', 'Classical', 'Electronic', 'Soundtracks'],
    radio: ['Acoustic radio', 'Jazz radio', 'Ambient radio', 'Classical radio'],
    library: ['Playlists', 'Artists', 'Albums', 'Songs', 'Podcasts'],
    downloads: ['Saved playlists', 'Saved albums', 'Saved episodes'],
};

function NavigationBarExamples({ onEvent }: ExampleProps) {
    const window = useWindowDimensions();
    const theme = useTheme<Theme>();
    const scroll = useRef<ScrollViewInstance>(null);
    const [value, setValue] = useState('home');
    const [horizontal, setHorizontal] = useState(true);
    const [selection, setSelection] = useState<string>();
    return (
        <View style={{ gap: 24 }}>
            <Text>
                La barra flexible de 64 dp mantiene sus destinos fijos y etiquetas visibles. En ventanas medianas, el icono y la etiqueta se
                colocan en línea y el grupo queda centrado. Con texto ampliado crece para conservar las etiquetas.
            </Text>
            <Toggle
                label="Icono al inicio en ventanas medianas"
                value={horizontal}
                onValueChange={setHorizontal}
                testID="catalog-navbar-horizontal"
            />
            <View style={{ backgroundColor: theme.colors.surfaceContainerLow }}>
                <ScrollView ref={scroll} nestedScrollEnabled style={{ height: 240 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
                    <Text variant="headlineSmall">{navigationItems.find((item) => item.key === value)?.label}</Text>
                    <List.Group>
                        {navigationMusicPages[value].map((title) => (
                            <List.Item
                                key={title}
                                title={title}
                                selected={selection === title}
                                onPress={() => {
                                    setSelection(title);
                                    onEvent(`Abierto: ${title}.`);
                                }}
                            />
                        ))}
                    </List.Group>
                    {selection ? <Text accessibilityLiveRegion="polite">{selection}</Text> : null}
                </ScrollView>
                <NavigationBar
                    items={navigationItems.slice(0, 4)}
                    value={value}
                    variant="short"
                    iconPosition={horizontal && window.width >= 600 ? 'start' : 'top'}
                    arrangement={horizontal && window.width >= 600 ? 'centered' : 'equal'}
                    safeArea={false}
                    onValueChange={(next) => {
                        scroll.current?.scrollTo({ y: 0, animated: next === value && theme.animation.scale !== 0 });
                        if (next !== value) {
                            setValue(next);
                            setSelection(undefined);
                        }
                    }}
                    testID="catalog-navbar"
                />
            </View>
            <Text variant="bodySmall">Seleccionar de nuevo el destino activo vuelve al inicio del contenido.</Text>
            {[3, 5].map((count) => (
                <NavigationBarCountExample key={count} count={count} />
            ))}
        </View>
    );
}

function NavigationBarCountExample({ count }: { count: number }) {
    const [value, setValue] = useState('home');
    return (
        <Example title={`${count} destinos`}>
            <Text accessibilityLiveRegion="polite">{navigationItems.find((item) => item.key === value)?.label}</Text>
            <NavigationBar
                items={navigationItems.slice(0, count)}
                value={value}
                onValueChange={setValue}
                safeArea={false}
                testID={`catalog-navbar-${count}`}
            />
        </Example>
    );
}
