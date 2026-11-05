import { useState } from 'react';
import { View } from 'react-native';
import { Autocomplete, Select, Text, type ChoiceOption } from 'mobile-design';

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

function CityExample({ presentation }: { presentation: 'popup' | 'inline' }) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<ChoiceOption>();
    const anchored = presentation === 'popup';
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium">{anchored ? 'Sugerencias ancladas' : 'Sugerencias en línea'}</Text>
            <Autocomplete
                id={`md-choice-city-${presentation}`}
                label={anchored ? 'Ciudad' : 'Ciudad para el evento'}
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
            <Text variant="bodySmall" accessibilityLiveRegion="polite">
                {selected ? `Ciudad elegida: ${selected.label}` : 'Prueba «merida» o escribe una ciudad que no esté en la lista.'}
            </Text>
        </View>
    );
}

export function ChoiceExamples({ id }: { id: 'select' | 'autocomplete' }) {
    const [quality, setQuality] = useState('standard');
    if (id === 'autocomplete') {
        return (
            <View style={{ gap: 28 }}>
                <CityExample presentation="popup" />
                <CityExample presentation="inline" />
            </View>
        );
    }

    return (
        <View style={{ gap: 16 }}>
            <Text variant="titleMedium">Preferencias de reproducción</Text>
            <Select id="md-choice-quality" label="Calidad de audio" value={quality} onValueChange={setQuality} options={qualityOptions} />
            <Text variant="bodyMedium" accessibilityLiveRegion="polite">
                {`Calidad elegida: ${qualityOptions.find((option) => option.value === quality)?.label}`}
            </Text>
            <Select
                id="md-choice-disabled"
                label="Calidad del dispositivo"
                value="standard"
                onValueChange={setQuality}
                options={qualityOptions}
                disabled
            />
        </View>
    );
}
