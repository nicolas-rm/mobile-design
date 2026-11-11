import { useState } from 'react';
import { Platform, View } from 'react-native';
import { Autocomplete, Button, FullScreenDialog, Select, Switch, Text, useMobileTheme, type ChoiceOption } from 'mobile-design/react-native';
import { Surface } from 'react-native-paper';

const qualityOptions: readonly ChoiceOption[] = [
    { value: 'standard', label: 'Estándar', description: 'Consume menos datos', icon: 'data_saver_on' },
    { value: 'high', label: 'Alta calidad', description: 'Mejor definición de audio', icon: 'headphones' },
    { value: 'lossless', label: 'Sin pérdida', description: 'Disponible en el plan Plus', icon: 'lock', disabled: true },
];

const cities: readonly ChoiceOption[] = [
    { value: 'mty', label: 'Monterrey', description: 'Nuevo León', icon: 'location_on' },
    { value: 'gdl', label: 'Guadalajara', description: 'Jalisco', icon: 'location_on' },
    { value: 'mid', label: 'Mérida', description: 'Yucatán', icon: 'location_on' },
    { value: 'qro', label: 'Querétaro', description: 'Querétaro', icon: 'location_on' },
    { value: 'pue', label: 'Puebla', description: 'Próximamente', icon: 'location_on', disabled: true },
];

function CityExample({ presentation, variant = 'outlined' }: { presentation: 'popup' | 'inline'; variant?: 'outlined' | 'filled' }) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<ChoiceOption>();
    const anchored = presentation === 'popup';
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium">
                {variant === 'filled' ? 'Campo Filled con sugerencias' : anchored ? 'Sugerencias ancladas' : 'Sugerencias en línea'}
            </Text>
            <Autocomplete
                id={variant === 'filled' ? 'md-choice-city-filled' : `md-choice-city-${presentation}`}
                label={variant === 'filled' ? 'Ciudad de origen' : anchored ? 'Ciudad' : 'Ciudad para el evento'}
                variant={variant}
                placeholder="Escribe una ciudad"
                leadingIcon="search"
                value={query}
                onValueChange={(next) => {
                    setQuery(next);
                    setSelected(undefined);
                }}
                options={cities}
                presentation={presentation}
                onSelect={setSelected}
            />
            <Text
                variant="bodySmall"
                accessibilityLiveRegion="polite"
                testID={`md-city-${variant === 'filled' ? 'filled' : presentation}-result`}
            >
                {selected ? `Ciudad elegida: ${selected.label}` : 'Prueba «merida» o escribe una ciudad que no esté en la lista.'}
            </Text>
        </View>
    );
}

function CollectionExample() {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<ChoiceOption>();
    const collections = [
        { tags: 'instrumental jazz', choice: { value: 'blue-train', label: 'Blue Train', description: 'John Coltrane', icon: 'album' } },
        {
            tags: 'instrumental ambient',
            choice: { value: 'ambient', label: 'Music for Airports', description: 'Brian Eno', icon: 'album' },
        },
        { tags: 'rock vocal', choice: { value: 'rock', label: 'A Night at the Opera', description: 'Queen', icon: 'album' } },
    ];
    const term = query.trim().toLocaleLowerCase();
    const options = collections
        .filter(({ tags, choice }) => !term || `${tags} ${choice.label}`.toLocaleLowerCase().includes(term))
        .map(({ choice }) => choice);
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium">Resultados organizados por la aplicación</Text>
            <Autocomplete
                id="md-autocomplete-ranked"
                label="Buscar colección"
                leadingIcon="search"
                value={query}
                onValueChange={(next) => {
                    setQuery(next);
                    setSelected(undefined);
                }}
                options={options}
                filter={false}
                openOnFocus={false}
                onSelect={setSelected}
            />
            <Text variant="bodySmall" testID="md-autocomplete-ranked-result" accessibilityLiveRegion="polite">
                {selected
                    ? `Colección elegida: ${selected.label}`
                    : 'Escribe «instrumental»: las etiquetas de la colección determinan las sugerencias. El foco por sí solo no abre la lista.'}
            </Text>
        </View>
    );
}

function CityDirectoryExample() {
    const { colors } = useMobileTheme();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [draft, setDraft] = useState<ChoiceOption>();
    const [city, setCity] = useState<ChoiceOption>();
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium">Elegir una ciudad para el evento</Text>
            <Button
                variant="outlined"
                testID="md-autocomplete-directory-open"
                onPress={() => {
                    setQuery('');
                    setDraft(undefined);
                    setOpen(true);
                }}
            >
                Buscar ciudad para el evento
            </Button>
            <Text testID="md-autocomplete-directory-result" accessibilityLiveRegion="polite">
                {city ? `Evento en ${city.label}, ${city.description}` : 'El evento todavía no tiene una ciudad confirmada.'}
            </Text>
            <FullScreenDialog visible={open} onDismiss={() => setOpen(false)} title="Ciudad del evento" testID="md-autocomplete-directory">
                <View style={{ gap: 24 }}>
                    <Text variant="bodyLarge" testID="md-autocomplete-directory-heading">
                        Busca una ciudad y confirma dónde se realizará el evento.
                    </Text>
                    <Autocomplete
                        id="md-autocomplete-directory-city"
                        backgroundColor={colors.surfaceContainerHigh}
                        label="Buscar ciudad"
                        leadingIcon="search"
                        presentation="inline"
                        value={query}
                        onValueChange={(next) => {
                            setQuery(next);
                            setDraft(undefined);
                        }}
                        options={cities}
                        onSelect={setDraft}
                        onEscape={() => setOpen(false)}
                    />
                    {draft ? (
                        <Surface
                            mode="flat"
                            elevation={0}
                            style={{ padding: 16, borderRadius: 12, gap: 8 }}
                            testID="md-autocomplete-directory-preview"
                        >
                            <Text variant="titleLarge">{draft.label}</Text>
                            <Text variant="bodyLarge">{draft.description}, México</Text>
                            <Text variant="bodyMedium">El evento se asociará con esta ciudad cuando confirmes.</Text>
                        </Surface>
                    ) : null}
                    <Button
                        testID="md-autocomplete-directory-confirm"
                        disabled={!draft}
                        onPress={() => {
                            if (draft) {
                                setCity(draft);
                                setOpen(false);
                            }
                        }}
                    >
                        Confirmar ciudad
                    </Button>
                </View>
            </FullScreenDialog>
        </View>
    );
}

const eventGuides: readonly ChoiceOption[] = [
    {
        value: 'venues',
        label: 'Lugares para el evento',
        description: 'Espacios y capacidad',
        icon: 'location_on',
        href: '#md-autocomplete-guide-venues',
    },
    {
        value: 'transport',
        label: 'Transporte local',
        description: 'Llegadas y desplazamientos',
        icon: 'directions_bus',
        href: '#md-autocomplete-guide-transport',
    },
];
const guideDetails = {
    venues: 'Consulta la capacidad, el acceso y la disponibilidad de los espacios antes de reservar.',
    transport: 'Organiza las llegadas y el recorrido entre el alojamiento y el lugar del evento.',
};
function GuideExample() {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState<ChoiceOption>();
    return (
        <View style={{ gap: 16 }}>
            <Text variant="titleMedium">Sugerencias que abren un destino</Text>
            <Autocomplete
                id="md-autocomplete-links"
                label="Buscar una guía"
                leadingIcon="search"
                value={query}
                onValueChange={setQuery}
                options={eventGuides}
                onSelect={Platform.OS === 'web' ? undefined : setPage}
            />
            {Platform.OS === 'web'
                ? eventGuides.map((guide) => (
                      <Surface
                          key={guide.value}
                          nativeID={`md-autocomplete-guide-${guide.value}`}
                          mode="flat"
                          elevation={0}
                          style={{ padding: 16, borderRadius: 12, gap: 8 }}
                      >
                          <Text variant="titleMedium">{guide.label}</Text>
                          <Text>{guideDetails[guide.value as keyof typeof guideDetails]}</Text>
                      </Surface>
                  ))
                : null}
            <FullScreenDialog
                visible={Boolean(page)}
                onDismiss={() => setPage(undefined)}
                title={page?.label ?? 'Guía del evento'}
                testID="md-autocomplete-guide-page"
            >
                <Text variant="bodyLarge">{page ? guideDetails[page.value as keyof typeof guideDetails] : ''}</Text>
            </FullScreenDialog>
        </View>
    );
}

const regionOptions: readonly ChoiceOption[] = Array.from({ length: 32 }, (_, index) => ({
    value: `region-${index + 1}`,
    label: `Región ${String(index + 1).padStart(2, '0')}`,
    description: index === 17 ? 'Región configurada para esta colección' : 'Biblioteca local',
    icon: 'location_on',
    disabled: index === 18,
}));

function SelectExamples() {
    const { colors } = useMobileTheme();
    const [quality, setQuality] = useState('standard');
    const [format, setFormat] = useState('aac');
    const [region, setRegion] = useState('region-18');
    const [settings, setSettings] = useState(false),
        [cellular, setCellular] = useState(true);
    const [stream, setStream] = useState('high');
    return (
        <View style={{ gap: 24 }}>
            <Text variant="titleMedium">Preferencias de reproducción · Outlined</Text>
            <Select id="md-choice-quality" label="Calidad de audio" value={quality} onValueChange={setQuality} options={qualityOptions} />
            <Text
                variant="bodyMedium"
                accessibilityLiveRegion="polite"
                testID="md-select-quality-result"
            >{`Calidad elegida: ${qualityOptions.find((option) => option.value === quality)?.label}`}</Text>
            <Select
                id="md-choice-disabled"
                label="Calidad del dispositivo"
                value="standard"
                onValueChange={setQuality}
                options={qualityOptions}
                disabled
            />
            <Text variant="titleMedium">Formato de archivo · Filled</Text>
            <Select
                id="md-select-filled"
                variant="filled"
                label="Formato"
                value={format}
                onValueChange={setFormat}
                options={[
                    { value: 'aac', label: 'AAC', description: 'Archivo ligero', icon: 'audio_file' },
                    { value: 'flac', label: 'FLAC', description: 'Archivo de mayor tamaño', icon: 'audio_file' },
                ]}
            />
            <Text accessibilityLiveRegion="polite" testID="md-select-format-result">
                Formato elegido: {format.toUpperCase()}
            </Text>
            <Text variant="titleMedium">Lista desplazable y selección existente</Text>
            <Select id="md-select-many" label="Región de la biblioteca" value={region} onValueChange={setRegion} options={regionOptions} />
            <Text accessibilityLiveRegion="polite" testID="md-select-region-result">
                Región elegida: {regionOptions.find((option) => option.value === region)?.label}
            </Text>
            <Text variant="titleMedium">Sin opciones disponibles</Text>
            <Select
                id="md-select-empty"
                label="Dispositivo de salida"
                placeholder="Sin dispositivos"
                value=""
                onValueChange={() => {}}
                options={[]}
                emptyLabel="No hay dispositivos conectados."
            />
            <Button variant="outlined" onPress={() => setSettings(true)} testID="md-select-settings-open">
                Abrir configuración de reproducción
            </Button>
            <FullScreenDialog
                visible={settings}
                onDismiss={() => setSettings(false)}
                title="Configuración de reproducción"
                testID="md-select-settings"
            >
                <View style={{ gap: 24 }}>
                    <Text variant="titleLarge">Audio y conexión</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <Text variant="bodyLarge" style={{ flex: 1 }}>
                            Usar datos móviles
                        </Text>
                        <Switch
                            value={cellular}
                            onValueChange={setCellular}
                            accessibilityLabel="Usar datos móviles"
                            testID="md-select-settings-enabled"
                        />
                    </View>
                    <Select
                        id="md-select-settings-quality"
                        backgroundColor={colors.surfaceContainerHigh}
                        label="Calidad con datos móviles"
                        disabled={!cellular}
                        value={stream}
                        onValueChange={setStream}
                        options={qualityOptions}
                    />
                    <Text accessibilityLiveRegion="polite" testID="md-select-settings-result">
                        {cellular
                            ? `Datos móviles: ${qualityOptions.find((option) => option.value === stream)?.label}`
                            : 'Reproducción sólo con Wi-Fi'}
                    </Text>
                    <Text variant="bodyMedium">
                        La selección actualiza esta configuración local y se conserva al cerrar y volver a abrir la pantalla.
                    </Text>
                </View>
            </FullScreenDialog>
        </View>
    );
}

export function ChoiceExamples({ id }: { id: 'select' | 'autocomplete' }) {
    return id === 'select' ? (
        <SelectExamples />
    ) : (
        <View style={{ gap: 28 }}>
            <CityExample presentation="popup" />
            <CityExample presentation="inline" />
            <CityExample presentation="popup" variant="filled" />
            <CollectionExample />
            <View style={{ gap: 12 }}>
                <Text variant="titleMedium">Campo no disponible</Text>
                <Autocomplete
                    id="md-autocomplete-disabled"
                    label="Ciudad del dispositivo"
                    value="Mérida"
                    onValueChange={() => {}}
                    options={cities}
                    disabled
                />
            </View>
            <CityDirectoryExample />
            <GuideExample />
        </View>
    );
}
