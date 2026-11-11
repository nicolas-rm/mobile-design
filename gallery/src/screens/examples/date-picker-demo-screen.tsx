import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import {
    Appbar,
    Button,
    DatePicker,
    DockedDatePicker,
    Icon,
    IconButton,
    PaperProvider,
    Surface,
    Switch,
    Text,
    type DateRange,
} from '@/components';
import { calendarDate, normalizeDate } from '@/components/date-picker-utils';
import { useSafeAreaInsets } from '@/hooks/settings';
import { useAppPreferences } from '@/hooks/preferences';
import { useAppTheme } from '@/hooks/theme';
import { createPaperTheme, usePaperTheme } from '@/theme/paper';
import { MaterialReferenceLinks } from './material-reference-links';
import type { RootStackParamList } from '@/navigations/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DatePickerDemo'>;
type Example =
    'single' | 'input' | 'range' | 'range-input' | 'full-single' | 'full-range' | 'full-input' | 'year' | 'availability' | 'clear';

function DatePickerExamples({
    navigation,
    onToggleTheme,
    reduceMotion,
    onToggleMotion,
    systemReduceMotion,
}: Props & { onToggleTheme: () => void; reduceMotion: boolean; onToggleMotion: () => void; systemReduceMotion: boolean }) {
    const theme = usePaperTheme();
    const insets = useSafeAreaInsets();
    const today = useMemo(() => normalizeDate(new Date()), []);
    const [date, setDate] = useState<Date>(today);
    const [range, setRange] = useState<DateRange>();
    const [dockedDate, setDockedDate] = useState<Date>(today);
    const [dockedOpen, setDockedOpen] = useState(false);
    const [appointment, setAppointment] = useState<Date>();
    const [example, setExample] = useState<Example>('single');
    const [pickerVisible, setPickerVisible] = useState(false);
    const formatDate = (value: Date) => new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(value);
    const cardStyle = {
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.shapes.corner.large,
        gap: 16,
        padding: 20,
    };
    const dismiss = () => setPickerVisible(false);
    const openExample = (next: Example) => {
        setExample(next);
        setPickerVisible(true);
    };

    return (
        <View style={{ backgroundColor: theme.colors.background, flex: 1 }} testID="date-picker-demo-screen">
            <StatusBar style={theme.dark ? 'light' : 'dark'} />
            <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="Fechas" />
                <IconButton
                    accessibilityLabel={theme.dark ? 'Ver demo en tema claro' : 'Ver demo en tema oscuro'}
                    icon={theme.dark ? 'weather-sunny' : 'weather-night'}
                    onPress={onToggleTheme}
                    testID="date-picker-demo-theme"
                />
            </Appbar.Header>
            <ScrollView
                onScrollBeginDrag={() => setDockedOpen(false)}
                contentContainerStyle={{ gap: 24, paddingBottom: insets.useBottom + 24, paddingHorizontal: 16, paddingTop: 16 }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <View style={{ gap: 8 }}>
                    <Text variant="headlineSmall">Selectores de fecha · Material 3</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        Desplegable, modal y pantalla completa; una fecha o un periodo, con calendario y entrada manual.
                    </Text>
                </View>
                <View style={{ gap: 16 }}>
                    <Text accessibilityRole="header" variant="titleLarge">
                        1. Selector desplegable
                    </Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        El calendario se ancla al campo. Mes y año tienen navegación independiente y listas para saltar a fechas lejanas.
                    </Text>
                    <DockedDatePicker
                        label="Fecha del evento"
                        onChange={setDockedDate}
                        open={dockedOpen}
                        onOpenChange={setDockedOpen}
                        value={dockedDate}
                        testID="demo-docked-date-picker"
                    />
                    <Text accessibilityLiveRegion="polite" testID="date-picker-demo-docked-value">
                        Confirmada: {formatDate(dockedDate)}
                    </Text>
                </View>
                <View style={{ gap: 8 }}>
                    <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text variant="bodyMedium">Movimiento reducido en esta demo</Text>
                        <Switch
                            accessibilityLabel="Movimiento reducido en la demo de fechas"
                            disabled={systemReduceMotion}
                            onValueChange={onToggleMotion}
                            value={reduceMotion || systemReduceMotion}
                            testID="date-picker-demo-motion"
                        />
                    </View>
                    {systemReduceMotion ? (
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            El movimiento reducido está activado en el sistema.
                        </Text>
                    ) : null}
                </View>
                <Surface style={[cardStyle, { backgroundColor: theme.colors.primaryContainer }]}>
                    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 16 }}>
                        <Icon color={theme.colors.onPrimaryContainer} name="calendar-outline" size={32} />
                        <View style={{ flex: 1, gap: 4 }}>
                            <Text style={{ color: theme.colors.onPrimaryContainer }} variant="labelLarge">
                                2. MODAL · UNA FECHA
                            </Text>
                            <Text
                                accessibilityLiveRegion="polite"
                                style={{ color: theme.colors.onPrimaryContainer }}
                                testID="date-picker-demo-single-value"
                                variant="headlineSmall"
                            >
                                {formatDate(date)}
                            </Text>
                        </View>
                    </View>
                    <Button icon="calendar-outline" onPress={() => openExample('single')} testID="date-picker-demo-open-single">
                        Elegir fecha
                    </Button>
                    <Button icon="pencil-outline" mode="text" onPress={() => openExample('input')} testID="date-picker-demo-open-input">
                        3. Entrada manual de fecha
                    </Button>
                </Surface>
                <Surface style={cardStyle}>
                    <Text variant="titleLarge">4. Modal de periodo</Text>
                    <Text
                        accessibilityLiveRegion="polite"
                        style={{ color: theme.colors.onSurfaceVariant }}
                        testID="date-picker-demo-range-value"
                        variant="bodyLarge"
                    >
                        {range ? `${formatDate(range.start)} – ${formatDate(range.end)}` : 'Selecciona la fecha inicial y la fecha final.'}
                    </Text>
                    <Button
                        icon="calendar-range-outline"
                        mode="outlined"
                        onPress={() => openExample('range')}
                        testID="date-picker-demo-open-range"
                    >
                        Elegir periodo
                    </Button>
                    <Button
                        icon="pencil-outline"
                        mode="text"
                        onPress={() => openExample('range-input')}
                        testID="date-picker-demo-open-range-input"
                    >
                        5. Entrada manual de periodo
                    </Button>
                </Surface>
                <Surface style={cardStyle}>
                    <Text variant="titleLarge">6. Pantalla completa</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        Cierre con ×, confirmación con Guardar y meses verticales al elegir periodos.
                    </Text>
                    <Button mode="outlined" onPress={() => openExample('full-single')} testID="date-picker-demo-open-full-single">
                        Una fecha a pantalla completa
                    </Button>
                    <Button mode="outlined" onPress={() => openExample('full-range')} testID="date-picker-demo-open-full-range">
                        Periodo a pantalla completa
                    </Button>
                    <Button mode="text" onPress={() => openExample('full-input')} testID="date-picker-demo-open-full-input">
                        Entrada manual a pantalla completa
                    </Button>
                </Surface>
                <Surface style={cardStyle}>
                    <Text variant="titleLarge">7. Selección de año</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        El menú sustituye los días por años. En el calendario de una fecha también puedes deslizar horizontalmente entre
                        meses.
                    </Text>
                    <Button mode="outlined" onPress={() => openExample('year')} testID="date-picker-demo-open-year">
                        Abrir selector de años
                    </Button>
                </Surface>
                <Surface style={cardStyle}>
                    <Text variant="titleLarge">8. Solo fechas disponibles</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodyMedium">
                        Agenda de lunes a viernes, dentro de los próximos 60 días.
                    </Text>
                    {appointment ? (
                        <Text accessibilityLiveRegion="polite" testID="date-picker-demo-appointment-value" variant="titleMedium">
                            {formatDate(appointment)}
                        </Text>
                    ) : null}
                    <Button
                        icon="calendar-check-outline"
                        mode="outlined"
                        onPress={() => openExample('availability')}
                        testID="date-picker-demo-open-availability"
                    >
                        Elegir día disponible
                    </Button>
                </Surface>
                <Surface style={cardStyle}>
                    <Text variant="titleLarge">9. Limpiar y corregir</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        La acción opcional Limpiar borra el borrador. Cancelar conserva la fecha confirmada. Se aceptan 24/10/2026,
                        24-10-2026, 24.10.2026 y 24102026; el formato se aplica al salir del campo. Prueba 31/02/2026 para ver el error.
                    </Text>
                    <Button mode="outlined" onPress={() => openExample('clear')} testID="date-picker-demo-open-clear">
                        Probar Limpiar y Cancelar
                    </Button>
                    <DockedDatePicker disabled label="Campo deshabilitado" value={date} onChange={setDate} testID="date-picker-disabled" />
                </Surface>
                <MaterialReferenceLinks component="date-pickers" />
            </ScrollView>
            {example === 'range' || example === 'range-input' || example === 'full-range' ? (
                <DatePicker
                    mode="range"
                    initialDisplayMode={example === 'range-input' ? 'input' : 'calendar'}
                    presentation={example === 'full-range' ? 'full-screen' : 'dialog'}
                    onChange={setRange}
                    onDismiss={dismiss}
                    testID="demo-date-picker"
                    value={range}
                    visible={pickerVisible}
                />
            ) : (
                <DatePicker
                    initialCalendarView={example === 'year' ? 'years' : 'days'}
                    initialDisplayMode={example === 'input' || example === 'full-input' ? 'input' : 'calendar'}
                    presentation={example === 'full-single' || example === 'full-input' ? 'full-screen' : 'dialog'}
                    showClearButton={example === 'clear'}
                    isDateDisabled={example === 'availability' ? (value) => value.getDay() === 0 || value.getDay() === 6 : undefined}
                    maximumDate={
                        example === 'availability' ? calendarDate(today.getFullYear(), today.getMonth(), today.getDate() + 60) : undefined
                    }
                    minimumDate={example === 'availability' ? today : undefined}
                    onChange={example === 'availability' ? setAppointment : setDate}
                    onDismiss={dismiss}
                    testID="demo-date-picker"
                    title={example === 'availability' ? 'Elige un día disponible' : undefined}
                    value={example === 'availability' ? appointment : date}
                    visible={pickerVisible}
                />
            )}
        </View>
    );
}

export function DatePickerDemoScreen(props: Props) {
    const { themeMode } = useAppTheme();
    const { effectiveReduceMotionEnabled, rippleEnabled, systemReduceMotionEnabled } = useAppPreferences();
    const [mode, setMode] = useState(themeMode);
    const [reduceMotion, setReduceMotion] = useState(effectiveReduceMotionEnabled);
    const effectiveReduceMotion = reduceMotion || systemReduceMotionEnabled;
    const theme = useMemo(() => createPaperTheme(mode, effectiveReduceMotion), [mode, effectiveReduceMotion]);

    return (
        <PaperProvider reduceMotion={effectiveReduceMotion ? 'on' : 'auto'} settings={{ rippleEffectEnabled: rippleEnabled }} theme={theme}>
            <DatePickerExamples
                {...props}
                reduceMotion={reduceMotion}
                systemReduceMotion={systemReduceMotionEnabled}
                onToggleMotion={() => setReduceMotion((value) => !value)}
                onToggleTheme={() => setMode((value) => (value === 'dark' ? 'light' : 'dark'))}
            />
        </PaperProvider>
    );
}
