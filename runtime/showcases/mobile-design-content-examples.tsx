import { useRef, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, View } from 'react-native';
import { InputChipFields } from './mobile-design-chip-input-examples';
import {
    Avatar,
    Button,
    Card,
    Checkbox,
    Chip,
    DatePicker,
    Dialog,
    Divider,
    FullScreenDialog,
    Icon,
    IconButton,
    List,
    Menu,
    RadioButton,
    SearchView,
    Switch,
    Text,
    TextField,
    TimePicker,
    useMobileTheme,
    type TextFieldHandle,
    type TimeValue,
} from 'mobile-design/react-native-web';

type Props = { onEvent: (message: string) => void };
const row = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, alignItems: 'center' as const, gap: 8 };
const places = ['Parque Fundidora', 'Museo de Arte', 'Biblioteca Central'];

export function ChipExamples({ onEvent }: Props) {
    const [editor, setEditor] = useState(false),
        [discard, setDiscard] = useState(false);
    const [title, setTitle] = useState(''),
        [location, setLocation] = useState(places[0]);
    const [date, setDate] = useState(new Date(2026, 9, 25, 12));
    const [time, setTime] = useState<TimeValue>({ hours: 16, minutes: 30 });
    const [picker, setPicker] = useState<'date' | 'time' | null>(null);
    const [search, setSearch] = useState(false),
        [query, setQuery] = useState('');
    const [guests, setGuests] = useState(['Ana', 'Luis']),
        [guestMenu, setGuestMenu] = useState(false);
    const [guestInput, setGuestInput] = useState(''),
        [selectedGuest, setSelectedGuest] = useState<string | null>(null);
    const [team, setTeam] = useState(true);
    const guestRef = useRef<TextFieldHandle>(null);
    const [locationMenu, setLocationMenu] = useState(false),
        [locationFilter, setLocationFilter] = useState<string | null>(null);
    const [favorites, setFavorites] = useState(false);
    const [allSuggestions, setAllSuggestions] = useState(false);
    const [suggestionMenu, setSuggestionMenu] = useState(false);
    const pendingSuggestion = useRef<string | null>(null);
    const [events, setEvents] = useState<
        { id: number; title: string; location: string; when: string; favorite: boolean; guests: string[] }[]
    >([]);
    const [nextId, setNextId] = useState(1);
    const [titleError, setTitleError] = useState(false);
    const start = (suggestion = '') => {
        setTitle(suggestion);
        setTitleError(false);
        setEditor(true);
    };
    const save = () => {
        if (!title.trim()) {
            setTitleError(true);
            return;
        }
        setEvents((previous) => [
            ...previous,
            {
                id: nextId,
                title: title.trim(),
                location,
                when: `${date.toLocaleDateString('es-MX')} · ${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`,
                favorite: false,
                guests: [...guests],
            },
        ]);
        setNextId(nextId + 1);
        setEditor(false);
        onEvent('Evento guardado en la agenda.');
    };
    const results = places.filter((place) => place.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    const visibleEvents = events.filter(
        (event) => (!favorites || event.favorite) && (!locationFilter || event.location === locationFilter)
    );
    const addGuest = () => {
        const name = guestInput.trim();
        if (!name) return;
        setGuests((current) => (current.includes(name) ? current : [...current, name]));
        setGuestInput('');
        setSelectedGuest(null);
    };
    return (
        <View style={{ gap: 24 }}>
            <Text variant="titleMedium">Assist · crear y elegir ubicación</Text>
            <Chip.Group accessibilityLabel="Acciones de la agenda">
                <Chip icon="calendar-outline" variant="assist" onPress={() => start()} testID="md-chip-event">
                    Añadir evento
                </Chip>
                <SearchView
                    variant="contained"
                    presentation="full-screen"
                    open={search}
                    onOpenChange={setSearch}
                    value={query}
                    onChangeText={setQuery}
                    onSearch={setQuery}
                    placeholder="Buscar ubicación"
                    results={results.map((place) => ({ key: place, title: place, icon: 'map-marker-outline' }))}
                    onResultPress={(result) => {
                        setLocation(result.title);
                        setSearch(false);
                    }}
                    renderTrigger={({ open }) => (
                        <Chip variant="assist" icon="map-marker-outline" onPress={open}>
                            {location}
                        </Chip>
                    )}
                    testID="md-chip-location"
                />
            </Chip.Group>
            <Text variant="titleMedium">Filter · filtrar contenido</Text>
            <Chip.Group accessibilityLabel="Filtrar eventos">
                <Chip
                    variant="filter"
                    selected={!favorites && !locationFilter}
                    onPress={() => {
                        setFavorites(false);
                        setLocationFilter(null);
                    }}
                >
                    Todos ({events.length})
                </Chip>
                <Chip
                    variant="filter"
                    selected={favorites}
                    icon="star-outline"
                    onPress={() => setFavorites(!favorites)}
                    testID="md-chip-filter"
                >
                    Favoritos
                </Chip>
                <Menu
                    visible={locationMenu}
                    onDismiss={() => setLocationMenu(false)}
                    anchor={
                        <Chip
                            variant="filter"
                            selected={Boolean(locationFilter)}
                            trailingIcon="menu-down"
                            onPress={() => setLocationMenu(true)}
                            onTrailingIconPress={() => setLocationMenu(true)}
                            trailingIconAccessibilityLabel="Filtrar ubicación"
                            testID="md-chip-location-filter"
                        >
                            {locationFilter ?? 'Ubicación'}
                        </Chip>
                    }
                    testID="md-chip-location-filter-menu"
                >
                    <Menu.Item title="Todas ubicaciones" selected={!locationFilter} onPress={() => setLocationFilter(null)} />
                    {places.map((place) => (
                        <Menu.Item key={place} title={place} selected={locationFilter === place} onPress={() => setLocationFilter(place)} />
                    ))}
                </Menu>
                <Chip variant="filter" disabled>
                    Inhabilitado
                </Chip>
                <Chip variant="filter" selected disabled>
                    Activo inhabilitado
                </Chip>
            </Chip.Group>
            <Text variant="titleMedium">Input · participantes</Text>
            <Chip.Group accessibilityLabel="Participantes del evento">
                {guests.map((guest) => (
                    <Chip
                        key={guest}
                        variant="input"
                        selected={selectedGuest === guest}
                        onPress={() => {
                            if (selectedGuest === guest) {
                                setGuestInput(guest);
                                setGuests((current) => current.filter((item) => item !== guest));
                                setSelectedGuest(null);
                                guestRef.current?.focus();
                            } else setSelectedGuest(guest);
                        }}
                        avatar={<Avatar.Text size={24} label={guest.slice(0, 1)} />}
                        onClose={() => {
                            setGuests((current) => current.filter((item) => item !== guest));
                            setSelectedGuest(null);
                        }}
                        closeIconAccessibilityLabel={`Quitar a ${guest}`}
                        testID={`md-chip-guest-${guest}`}
                    >
                        {guest}
                    </Chip>
                ))}
                <Menu
                    visible={guestMenu}
                    onDismiss={() => setGuestMenu(false)}
                    anchor={
                        <Button variant="text" icon="account-plus-outline" onPress={() => setGuestMenu(true)}>
                            Añadir
                        </Button>
                    }
                >
                    {['Ana', 'Luis', 'Mar', 'Diego'].map((person) => (
                        <Menu.Item
                            key={person}
                            title={person}
                            selected={guests.includes(person)}
                            selectionMode="multiple"
                            onPress={() =>
                                setGuests((current) =>
                                    current.includes(person) ? current.filter((item) => item !== person) : [...current, person]
                                )
                            }
                        />
                    ))}
                    <Menu.Item title="Listo" closeOnPress />
                </Menu>
            </Chip.Group>
            <TextField
                ref={guestRef}
                variant="outlined"
                label="Nuevo participante"
                value={guestInput}
                onChangeText={(next) => {
                    setGuestInput(next);
                    setSelectedGuest(null);
                }}
                onSubmitEditing={addGuest}
                onBlur={addGuest}
                returnKeyType="done"
                supportingText="Escribe y pulsa Listo. Toca un participante dos veces para editarlo."
                onKeyPress={(event) => {
                    if (event.nativeEvent.key !== 'Backspace' || guestInput || !guests.length) return;
                    const last = guests[guests.length - 1];
                    if (selectedGuest === last) {
                        setGuests((current) => current.filter((item) => item !== last));
                        setSelectedGuest(null);
                    } else setSelectedGuest(last);
                }}
                testID="md-chip-guest-input"
            />
            <View style={row}>
                {team ? (
                    <Chip
                        variant="input"
                        selected
                        icon="account-outline"
                        onPress={() => start('Reunión de equipo')}
                        onClose={() => setTeam(false)}
                    >
                        Equipo
                    </Chip>
                ) : null}
                <Chip variant="input" disabled onClose={() => {}}>
                    Cierre deshabilitado
                </Chip>
            </View>
            <InputChipFields />
            <Text variant="titleMedium">Suggestion · completar una tarea</Text>
            <View style={row}>
                {['Paseo por el parque', 'Visitar un museo', 'Reunión de lectura'].map((suggestion) => (
                    <Chip key={suggestion} variant="suggestion" onPress={() => start(suggestion)}>
                        {suggestion}
                    </Chip>
                ))}
            </View>
            <Text variant="titleMedium">Elevados sobre imagen</Text>
            <ImageBackground
                source={require('./assets/welcome-wallpaper.png')}
                imageStyle={{ borderRadius: 16 }}
                style={{ padding: 16, borderRadius: 16 }}
            >
                <View style={row}>
                    <Chip elevated variant="assist" icon="calendar-outline" onPress={() => start()}>
                        Añadir evento
                    </Chip>
                    <Chip elevated variant="filter" selected={favorites} icon="star-outline" onPress={() => setFavorites(!favorites)}>
                        Favoritos
                    </Chip>
                    <Chip elevated variant="suggestion" onPress={() => start('Paseo por el parque')}>
                        Planear paseo
                    </Chip>
                </View>
            </ImageBackground>
            <Text variant="titleMedium">Sugerencias con desplazamiento</Text>
            <Chip.Group accessibilityLabel="Sugerencias de actividades">
                <Chip
                    variant="filter"
                    icon={allSuggestions ? 'unfold-less-horizontal' : 'unfold-more-horizontal'}
                    selected={allSuggestions}
                    onPress={() => setAllSuggestions((current) => !current)}
                    testID="md-chip-reflow"
                >
                    {allSuggestions ? 'Mostrar menos' : 'Mostrar todos'}
                </Chip>
                {allSuggestions ? (
                    ['Reunión de lectura', 'Visitar un museo', 'Paseo por el parque'].map((suggestion) => (
                        <Chip key={suggestion} variant="suggestion" onPress={() => start(suggestion)}>
                            {suggestion}
                        </Chip>
                    ))
                ) : (
                    <ScrollView
                        horizontal
                        style={{ flex: 1, minWidth: 120 }}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                    >
                        {['Reunión de lectura', 'Visitar un museo', 'Paseo por el parque'].map((suggestion) => (
                            <Chip key={suggestion} variant="suggestion" onPress={() => start(suggestion)}>
                                {suggestion}
                            </Chip>
                        ))}
                    </ScrollView>
                )}
            </Chip.Group>
            <Text variant="titleMedium">Opciones de sugerencias sin desplazar</Text>
            <Menu
                visible={suggestionMenu}
                onDismiss={() => setSuggestionMenu(false)}
                onClosed={() => {
                    const suggestion = pendingSuggestion.current;
                    pendingSuggestion.current = null;
                    if (suggestion) start(suggestion);
                }}
                anchor={
                    <Button
                        variant="outlined"
                        icon="filter-variant"
                        onPress={() => {
                            pendingSuggestion.current = null;
                            setSuggestionMenu(true);
                        }}
                        testID="md-chip-overflow-open"
                    >
                        Todas las opciones
                    </Button>
                }
                testID="md-chip-overflow-menu"
            >
                {['Reunión de lectura', 'Visitar un museo', 'Paseo por el parque'].map((suggestion) => (
                    <Menu.Item
                        key={suggestion}
                        title={suggestion}
                        onPress={() => {
                            pendingSuggestion.current = suggestion;
                            setSuggestionMenu(false);
                        }}
                    />
                ))}
            </Menu>
            <Text variant="titleMedium">Estados deshabilitados</Text>
            <View style={row}>
                <Chip variant="assist" icon="calendar-outline" disabled>
                    Añadir evento
                </Chip>
                <Chip variant="input" selected avatar={<Avatar.Text size={24} label="A" />} disabled onClose={() => {}}>
                    Ana
                </Chip>
                <Chip variant="suggestion" disabled>
                    Planear paseo
                </Chip>
            </View>
            <Divider />
            <Text variant="titleMedium">Agenda</Text>
            {visibleEvents.length ? (
                visibleEvents.map((event) => (
                    <Card key={event.id} mode="outlined">
                        <Card.Title
                            title={event.title}
                            subtitle={`${event.when} · ${event.location}`}
                            right={() => (
                                <IconButton
                                    icon={event.favorite ? 'star' : 'star-outline'}
                                    selected={event.favorite}
                                    accessibilityLabel={`${event.favorite ? 'Quitar de' : 'Añadir a'} favoritos: ${event.title}`}
                                    onPress={() =>
                                        setEvents((current) =>
                                            current.map((item) => (item.id === event.id ? { ...item, favorite: !item.favorite } : item))
                                        )
                                    }
                                />
                            )}
                        />
                        <Card.Content>
                            <Text>{event.guests.length ? event.guests.join(', ') : 'Sin participantes'}</Text>
                        </Card.Content>
                    </Card>
                ))
            ) : (
                <Text>
                    {favorites
                        ? 'No hay eventos favoritos.'
                        : locationFilter
                          ? 'No hay eventos en esta ubicación.'
                          : 'Añade un evento para verlo aquí.'}
                </Text>
            )}
            <FullScreenDialog
                title="Nuevo evento"
                visible={editor}
                onDismiss={() => (title.trim() ? setDiscard(true) : setEditor(false))}
                onConfirm={save}
                testID="md-chip-event-editor"
            >
                <View style={{ gap: 16 }}>
                    <TextField
                        label="Nombre del evento"
                        value={title}
                        onChangeText={(next) => {
                            setTitle(next);
                            setTitleError(false);
                        }}
                        error={titleError}
                        errorText="Escribe un nombre para el evento."
                        supportingText={titleError ? 'Escribe un nombre para el evento.' : undefined}
                        autoFocus
                        testID="md-chip-event-name"
                    />
                    <View style={row}>
                        <Chip variant="assist" icon="calendar-outline" onPress={() => setPicker('date')} testID="md-chip-event-date-open">
                            {date.toLocaleDateString('es-MX')}
                        </Chip>
                        <Chip variant="assist" icon="clock-outline" onPress={() => setPicker('time')} testID="md-chip-event-time-open">
                            {String(time.hours).padStart(2, '0')}:{String(time.minutes).padStart(2, '0')}
                        </Chip>
                    </View>
                    <Text>Ubicación: {location}</Text>
                    <Text>Participantes: {guests.join(', ') || 'Sin participantes'}</Text>
                </View>
                <DatePicker
                    visible={picker === 'date'}
                    mode="single"
                    value={date}
                    onDismiss={() => setPicker(null)}
                    onChange={(next) => {
                        setDate(next);
                        setPicker(null);
                    }}
                    testID="md-event-date"
                />
                <TimePicker
                    visible={picker === 'time'}
                    value={time}
                    onDismiss={() => setPicker(null)}
                    onConfirm={(next) => {
                        setTime(next);
                        setPicker(null);
                    }}
                    testID="md-event-time"
                />
                <Dialog visible={discard} onDismiss={() => setDiscard(false)}>
                    <Dialog.Title>¿Descartar este evento?</Dialog.Title>
                    <Dialog.Content>Los cambios todavía no están guardados.</Dialog.Content>
                    <Dialog.Actions>
                        <Button variant="text" onPress={() => setDiscard(false)}>
                            Continuar
                        </Button>
                        <Button
                            variant="text"
                            onPress={() => {
                                setDiscard(false);
                                setEditor(false);
                            }}
                        >
                            Descartar
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </FullScreenDialog>
        </View>
    );
}

type Document = { id: number; title: string; body: string; folder: string; favorite: boolean; tag?: string };
const initialDocuments: Document[] = [
    { id: 1, title: 'Plan del viaje', body: 'Reservar transporte y preparar el itinerario.', folder: 'Personal', favorite: false },
    { id: 2, title: 'Notas del proyecto', body: 'Revisar los componentes y compartir observaciones.', folder: 'Equipo', favorite: true },
];

export function MenuExamples({ onEvent }: Props) {
    const theme = useMobileTheme();
    const [documents, setDocuments] = useState(initialDocuments),
        [nextId, setNextId] = useState(3);
    const [selected, setSelected] = useState(1),
        [menu, setMenu] = useState<string | null>(null);
    const [sort, setSort] = useState('recent'),
        [favorites, setFavorites] = useState(false);
    const [dialog, setDialog] = useState<'edit' | 'delete' | 'export' | null>(null);
    const pendingDialog = useRef<{ owner: string; show: () => void } | null>(null);
    const dialogDocument = useRef<Document | null>(null);
    const [editError, setEditError] = useState(false);
    const [title, setTitle] = useState(''),
        [body, setBody] = useState(''),
        [exported, setExported] = useState('');
    const [deleted, setDeleted] = useState<Document | null>(null);
    const [contextPoint, setContextPoint] = useState<{ x: number; y: number } | null>(null);
    const current = documents.find((item) => item.id === selected && (!favorites || item.favorite));
    const update = (patch: Partial<Document>, target = selected) =>
        setDocuments((items) => items.map((item) => (item.id === target ? { ...item, ...patch } : item)));
    const openMenu = (key: string) => {
        pendingDialog.current = null;
        setMenu(key);
    };
    const afterMenuClosed = (owner: string) => {
        const pending = pendingDialog.current;
        if (pending?.owner !== owner) return;
        pendingDialog.current = null;
        pending.show();
    };
    const presentDialog = (show: () => void) => {
        dialogDocument.current = current ?? null;
        if (menu) {
            pendingDialog.current = { owner: menu, show };
            setMenu(null);
        } else show();
    };
    const edit = () => {
        if (current) {
            const document = current;
            presentDialog(() => {
                setTitle(document.title);
                setBody(document.body);
                setEditError(false);
                setDialog('edit');
            });
        }
    };
    const duplicate = () => {
        if (current) {
            setDocuments((items) => [...items, { ...current, id: nextId, title: `${current.title} (copia)` }]);
            setSelected(nextId);
            setNextId(nextId + 1);
        }
    };
    const exportAs = (format: 'text' | 'json') => {
        if (!current) return;
        setExported(format === 'text' ? `${current.title}\n\n${current.body}` : JSON.stringify(current, null, 2));
        presentDialog(() => setDialog('export'));
    };
    const actions = (variant: 'standard' | 'vibrant' | 'baseline') => (
        <>
            <Menu.Item title="Editar" leadingIcon="pencil-outline" disabled={!current} onPress={edit} testID={`md-menu-${variant}-edit`} />
            <Menu.Item title="Duplicar" leadingIcon="content-copy" disabled={!current} onPress={duplicate} />
            <Menu.Submenu title="Mover a" leadingIcon="folder-move-outline" disabled={!current}>
                {['Personal', 'Equipo', 'Archivo'].map((folder) => (
                    <Menu.Item key={folder} title={folder} selected={current?.folder === folder} onPress={() => update({ folder })} />
                ))}
            </Menu.Submenu>
            <Menu.Submenu title="Exportar" leadingIcon="export-variant" disabled={!current}>
                <Menu.Item title="Vista de texto" onPress={() => exportAs('text')} />
                <Menu.Item title="Vista JSON" onPress={() => exportAs('json')} />
            </Menu.Submenu>
            <Menu.Submenu title="Etiquetar" leadingIcon="tag-outline" disabled={!current}>
                {[
                    { name: 'Ideas', color: theme.colors.primary },
                    { name: 'Pendiente', color: theme.colors.secondary },
                    { name: 'Importante', color: theme.colors.tertiary },
                ].map((tag) => (
                    <Menu.Item
                        key={tag.name}
                        title={tag.name}
                        accessibilityLabel={`Etiqueta ${tag.name}`}
                        leading={<View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: tag.color }} />}
                        selected={current?.tag === tag.name}
                        onPress={() => update({ tag: tag.name })}
                    />
                ))}
            </Menu.Submenu>
            <Divider />
            <Menu.Item title="Acción no disponible" disabled />
            <Menu.Item
                title="Eliminar"
                leadingIcon="delete-outline"
                disabled={!current}
                onPress={() => presentDialog(() => setDialog('delete'))}
            />
        </>
    );
    const ordered = [...documents]
        .filter((item) => !favorites || item.favorite)
        .sort((a, b) => (sort === 'name' ? a.title.localeCompare(b.title) : b.id - a.id));
    return (
        <View style={{ gap: 24 }}>
            <Text variant="titleMedium">Documentos</Text>
            <Text>Selecciona un documento y usa sus acciones.</Text>
            <List.Group>
                {ordered.map((item) => (
                    <List.Item
                        key={item.id}
                        title={item.title}
                        description={`${item.folder}${item.tag ? ' · ' + item.tag : ''}`}
                        selected={item.id === selected}
                        selectionMode="single"
                        onPress={() => setSelected(item.id)}
                        trailing={<Icon source={item.favorite ? 'star' : 'file-document-outline'} size={24} />}
                    />
                ))}
            </List.Group>
            {!ordered.length ? <Text>No hay documentos en esta vista.</Text> : null}
            <View style={row}>
                {(['standard', 'vibrant', 'baseline'] as const).map((variant) => (
                    <Menu
                        key={variant}
                        variant={variant}
                        visible={menu === variant}
                        onDismiss={() => setMenu(null)}
                        onClosed={() => afterMenuClosed(variant)}
                        anchor={
                            <Button variant="outlined" onPress={() => openMenu(variant)} testID={`md-menu-${variant}-open`}>
                                {variant}
                            </Button>
                        }
                        testID={`md-menu-${variant}`}
                    >
                        {actions(variant)}
                    </Menu>
                ))}
            </View>
            <Menu
                visible={menu === 'groups'}
                onClosed={() => afterMenuClosed('groups')}
                layout="grouped"
                onDismiss={() => setMenu(null)}
                anchor={
                    <Button variant="outlined" onPress={() => openMenu('groups')} testID="md-menu-grouped-open">
                        Grupos y selección
                    </Button>
                }
            >
                <Menu.Group label="Ordenar">
                    {[
                        { value: 'recent', label: 'Más recientes' },
                        { value: 'name', label: 'Nombre' },
                    ].map((item) => (
                        <Menu.Item
                            key={item.value}
                            title={item.label}
                            selected={sort === item.value}
                            selectionMode="single"
                            closeOnPress={false}
                            onPress={() => setSort(item.value)}
                        />
                    ))}
                </Menu.Group>
                <Menu.Group>
                    <Menu.Item
                        title="Sólo favoritos"
                        selected={favorites}
                        selectionMode="multiple"
                        onPress={() => setFavorites(!favorites)}
                    />
                    <Menu.Item
                        title={current?.favorite ? 'Quitar favorito' : 'Marcar favorito'}
                        leadingIcon="star-outline"
                        disabled={!current}
                        onPress={() => update({ favorite: !current?.favorite })}
                    />
                    <Menu.Item title="Listo" closeOnPress />
                </Menu.Group>
            </Menu>
            <Menu
                filterable
                filterPlaceholder="Buscar documento"
                visible={menu === 'filter'}
                onClosed={() => afterMenuClosed('filter')}
                onDismiss={() => setMenu(null)}
                anchor={
                    <Button variant="text" icon="magnify" onPress={() => openMenu('filter')}>
                        Filtrar y seleccionar
                    </Button>
                }
            >
                {documents.map((item) => (
                    <Menu.Item
                        key={item.id}
                        title={item.title}
                        supportingText={item.folder}
                        leadingIcon="file-document-outline"
                        badge={item.favorite ? <Icon source="star" size={16} /> : undefined}
                        selected={selected === item.id}
                        selectionMode="single"
                        onPress={() => setSelected(item.id)}
                    />
                ))}
            </Menu>
            <Menu
                filterable
                filterPlaceholder="Filtrar destinos"
                visible={menu === 'destinations'}
                onClosed={() => afterMenuClosed('destinations')}
                onDismiss={() => setMenu(null)}
                anchor={
                    <Button variant="outlined" onPress={() => openMenu('destinations')} disabled={!current}>
                        Menú largo con scroll
                    </Button>
                }
            >
                {Array.from({ length: 24 }, (_, index) => (
                    <Menu.Item
                        key={index}
                        title={`Colección ${index + 1}`}
                        selected={current?.folder === `Colección ${index + 1}`}
                        selectionMode="single"
                        onPress={() => update({ folder: `Colección ${index + 1}` })}
                    />
                ))}
            </Menu>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Opciones contextuales del documento"
                accessibilityHint="Mantén pulsado para abrir las opciones en este punto"
                onLongPress={(event) => {
                    setContextPoint({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
                    openMenu('context');
                }}
                style={{ minHeight: 64, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.outline }}
                testID="md-context-menu-trigger"
            >
                <Text>Mantén pulsado para abrir un menú contextual</Text>
            </Pressable>
            <Menu
                visible={menu === 'context'}
                onClosed={() => afterMenuClosed('context')}
                anchor={contextPoint ?? { x: 0, y: 0 }}
                anchorPosition="top"
                onDismiss={() => setMenu(null)}
                testID="md-context-menu"
            >
                {actions('standard')}
            </Menu>
            {deleted ? (
                <View style={{ gap: 8 }}>
                    <Text>Se eliminó «{deleted.title}».</Text>
                    <Button
                        style={{ alignSelf: 'flex-start' }}
                        variant="text"
                        icon="undo"
                        onPress={() => {
                            setDocuments((items) => [...items, deleted]);
                            setSelected(deleted.id);
                            setDeleted(null);
                        }}
                    >
                        Deshacer eliminación
                    </Button>
                </View>
            ) : null}
            <FullScreenDialog
                title="Editar documento"
                visible={dialog === 'edit'}
                onDismiss={() => setDialog(null)}
                onConfirm={() => {
                    if (!title.trim()) {
                        setEditError(true);
                        return;
                    }
                    update({ title: title.trim(), body }, dialogDocument.current?.id);
                    setDialog(null);
                    onEvent('Documento guardado.');
                }}
                testID="md-menu-editor"
            >
                <View style={{ gap: 24 }}>
                    <TextField
                        label="Título"
                        value={title}
                        onChangeText={(next) => {
                            setTitle(next);
                            setEditError(false);
                        }}
                        error={editError}
                        errorText="Escribe un título para el documento."
                        supportingText={editError ? 'Escribe un título para el documento.' : undefined}
                        testID="md-menu-edit-title"
                    />
                    <TextField label="Contenido" multiline value={body} onChangeText={setBody} testID="md-menu-edit-body" />
                </View>
            </FullScreenDialog>
            <Dialog visible={dialog === 'delete'} onDismiss={() => setDialog(null)}>
                <Dialog.Icon icon="delete-outline" />
                <Dialog.Title>¿Eliminar este documento?</Dialog.Title>
                <Dialog.Content>{dialogDocument.current?.title ?? ''}</Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setDialog(null)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="text"
                        onPress={() => {
                            const target = dialogDocument.current;
                            if (target) {
                                setDeleted(target);
                                setDocuments((items) => items.filter((item) => item.id !== target.id));
                                setSelected(documents.find((item) => item.id !== target.id)?.id ?? 0);
                            }
                            setDialog(null);
                        }}
                    >
                        Eliminar
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <FullScreenDialog title="Vista de exportación" visible={dialog === 'export'} onDismiss={() => setDialog(null)}>
                <Text selectable testID="md-menu-exported-content">
                    {exported}
                </Text>
            </FullScreenDialog>
        </View>
    );
}

export function CheckboxExamples() {
    const [choices, setChoices] = useState(['photos']),
        [saved, setSaved] = useState<string[]>([]);
    const [errorStatus, setErrorStatus] = useState<'unchecked' | 'checked' | 'indeterminate'>('indeterminate');
    const options = [
        { value: 'photos', label: 'Fotos' },
        { value: 'videos', label: 'Vídeos' },
        { value: 'documents', label: 'Documentos' },
    ];
    const status = choices.length === 0 ? 'unchecked' : choices.length === options.length ? 'checked' : 'indeterminate';
    return (
        <View style={{ gap: 16 }}>
            <Checkbox.Item
                label="Seleccionar todo"
                description="Marca o desmarca todas las opciones."
                position="leading"
                status={status}
                onPress={() => setChoices((current) => (current.length === options.length ? [] : options.map((option) => option.value)))}
                testID="md-checkbox-mixed"
            />
            {options.map((option) => (
                <Checkbox.Item
                    key={option.value}
                    position="leading"
                    label={option.label}
                    status={choices.includes(option.value) ? 'checked' : 'unchecked'}
                    onPress={() =>
                        setChoices((current) =>
                            current.includes(option.value) ? current.filter((item) => item !== option.value) : [...current, option.value]
                        )
                    }
                    testID={`md-checkbox-${option.value}`}
                />
            ))}
            <Button style={{ alignSelf: 'flex-start' }} onPress={() => setSaved([...choices])}>
                Aplicar selección
            </Button>
            <Text testID="md-checkbox-result">
                Guardado: {saved.map((value) => options.find((option) => option.value === value)?.label).join(', ') || 'Ninguno'}
            </Text>
            <Text variant="titleMedium">Deshabilitados · control al final</Text>
            <Checkbox.Item label="Sin seleccionar" status="unchecked" disabled />
            <Checkbox.Item label="Seleccionado" status="checked" disabled />
            <Checkbox.Item label="Parcialmente seleccionado" status="indeterminate" disabled />
            <View style={row}>
                <Checkbox
                    error
                    status={errorStatus}
                    onPress={() =>
                        setErrorStatus((current) =>
                            current === 'indeterminate' ? 'checked' : current === 'checked' ? 'unchecked' : 'indeterminate'
                        )
                    }
                    accessibilityLabel="Casilla con error"
                    testID="md-checkbox-error"
                />
                <Text>
                    {errorStatus === 'indeterminate'
                        ? 'Error: selección parcial'
                        : errorStatus === 'checked'
                          ? 'Error: seleccionado'
                          : 'Error: sin seleccionar'}
                </Text>
            </View>
        </View>
    );
}

export function RadioExamples() {
    const [value, setValue] = useState('standard'),
        [saved, setSaved] = useState('standard');
    const options = [
        { value: 'standard', label: 'Entrega estándar', detail: 'Sin costo · 3 días' },
        { value: 'express', label: 'Entrega exprés', detail: '$99 · siguiente día' },
    ];
    return (
        <View style={{ gap: 16 }}>
            <RadioButton.Group value={value} onValueChange={setValue} accessibilityLabel="Método de entrega">
                {options.map((option) => (
                    <View key={option.value}>
                        <RadioButton.Item
                            position="leading"
                            label={option.label}
                            description={option.detail}
                            value={option.value}
                            testID={`md-radio-${option.value}`}
                        />
                    </View>
                ))}
                <RadioButton.Item position="leading" label="Recoger en tienda · no disponible" value="store" disabled />
            </RadioButton.Group>
            <Button style={{ alignSelf: 'flex-start' }} onPress={() => setSaved(value)}>
                Confirmar entrega
            </Button>
            <Text testID="md-radio-result">Confirmado: {options.find((option) => option.value === saved)?.label}</Text>
            <Text variant="titleMedium">Deshabilitados · control al final</Text>
            <RadioButton.Item label="Seleccionado deshabilitado" value="selected" status="checked" disabled />
            <RadioButton.Item label="Sin seleccionar deshabilitado" value="unselected" status="unchecked" disabled />
        </View>
    );
}

export function SwitchExamples() {
    const theme = useMobileTheme();
    const [enabled, setEnabled] = useState(true),
        [sound, setSound] = useState(false),
        [preview, setPreview] = useState(true);
    return (
        <View style={{ gap: 24 }}>
            <View style={{ gap: 8 }}>
                <Text variant="titleMedium">Notificaciones</Text>
                <View style={row}>
                    <Switch value={enabled} onValueChange={setEnabled} accessibilityLabel="Activar notificaciones" testID="md-switch" />
                    <Text>{enabled ? 'Activadas' : 'Desactivadas'}</Text>
                </View>
            </View>
            <View style={row}>
                <Switch
                    checkedIcon="check"
                    value={sound}
                    onValueChange={setSound}
                    disabled={!enabled}
                    accessibilityLabel="Sonido de notificaciones"
                />
                <Text style={{ color: theme.colors.onSurface }}>Sonido</Text>
            </View>
            <View style={row}>
                <Switch
                    checkedIcon="check"
                    uncheckedIcon="close"
                    value={preview}
                    onValueChange={setPreview}
                    disabled={!enabled}
                    accessibilityLabel="Mostrar vista previa"
                />
                <Text>Vista previa</Text>
            </View>
            <Card mode="outlined">
                <Card.Content>
                    <Text variant="titleMedium">Vista previa</Text>
                    <Text>
                        {enabled
                            ? `${sound ? 'Con sonido' : 'Sin sonido'} · ${preview ? 'Ana: Nos vemos a las 4.' : 'Tienes un mensaje nuevo.'}`
                            : 'Las notificaciones están desactivadas.'}
                    </Text>
                </Card.Content>
            </Card>
            <Text>Estados deshabilitados</Text>
            <View style={row}>
                <Switch value={false} disabled accessibilityLabel="Inactivo deshabilitado" />
                <Text>Inactivo</Text>
            </View>
            <View style={row}>
                <Switch value disabled accessibilityLabel="Activo deshabilitado" />
                <Text>Activo</Text>
            </View>
            <View style={row}>
                <Switch value checkedIcon="check" disabled accessibilityLabel="Activo con icono deshabilitado" />
                <Text>Activo con icono</Text>
            </View>
            <View style={row}>
                <Switch value={false} uncheckedIcon="close" disabled accessibilityLabel="Inactivo con icono deshabilitado" />
                <Text>Inactivo con icono</Text>
            </View>
        </View>
    );
}
