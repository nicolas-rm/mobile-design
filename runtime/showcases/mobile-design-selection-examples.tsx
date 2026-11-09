import { useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import {
    DatePicker,
    DockedDatePicker,
    RangeSlider,
    SegmentedButtons,
    Slider,
    TextField,
    TimePicker,
    type DateRange,
    type TextFieldHandle,
    type TimeValue,
} from 'mobile-design/react-native-web';
import { Text } from 'mobile-design/react-native-web';

type ExampleProps = { onEvent: (message: string) => void };

/** Content only: the catalogue owns the screen header, scrolling and Paper theme. */
export function SelectionExamples({ id, onEvent }: ExampleProps & { id: string }) {
    if (id === 'sliders') return <SliderExamples onEvent={onEvent} />;
    if (id === 'time-pickers') return <TimePickerExamples onEvent={onEvent} />;
    if (id === 'text-fields') return <TextFieldExamples onEvent={onEvent} />;
    if (id === 'date-pickers') return <DatePickerExamples onEvent={onEvent} />;
    if (id === 'segmented-buttons') return <SegmentedExamples onEvent={onEvent} />;
    return null;
}

function Example({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium">{title}</Text>
            {description && <Text variant="bodyMedium">{description}</Text>}
            {children}
        </View>
    );
}

function SegmentedExamples({ onEvent }: ExampleProps) {
    const [view, setView] = useState('day');
    const [transport, setTransport] = useState('walk');
    const [days, setDays] = useState<string[]>(['mon', 'wed']);
    const [alignment, setAlignment] = useState('left');
    return (
        <View style={{ gap: 24 }}>
            <Text variant="bodyMedium">
                Variante M3 baseline. Material 3 Expressive recomienda el grupo de botones conectado, disponible en su propia sección.
            </Text>
            <Example
                title="Selección única"
                description="Una opción permanece seleccionada. El indicador y la etiqueta cambian con el movimiento del tema."
            >
                <SegmentedButtons
                    value={view}
                    onValueChange={(next) => {
                        setView(next);
                        onEvent(`Vista: ${next}`);
                    }}
                    buttons={[
                        { value: 'day', label: 'Día' },
                        { value: 'week', label: 'Semana' },
                        { value: 'month', label: 'Mes' },
                    ]}
                    testID="catalog-segments-single"
                />
                <Text accessibilityLiveRegion="polite">
                    {view === 'day'
                        ? 'Hoy: Revisión de diseño, 10:00.'
                        : view === 'week'
                          ? 'Esta semana: Revisión de diseño · Entrega del prototipo · Prueba de accesibilidad.'
                          : 'Este mes: 12 sesiones de trabajo y 3 entregas.'}
                </Text>
            </Example>
            <Example title="Iconos y etiquetas">
                <SegmentedButtons
                    value={transport}
                    onValueChange={setTransport}
                    buttons={[
                        { value: 'walk', label: 'Caminar', icon: 'walk' },
                        { value: 'train', label: 'Tren', icon: 'train' },
                        { value: 'car', label: 'Auto', icon: 'car-outline' },
                    ]}
                    testID="catalog-segments-icons"
                />
            </Example>
            <Example title="Selección múltiple" description="Cada opción puede activarse o desactivarse; se permite dejar el grupo vacío.">
                <SegmentedButtons
                    multiSelect
                    value={days}
                    onValueChange={(next) => {
                        setDays(next);
                        onEvent(`Días: ${next.join(', ') || 'ninguno'}`);
                    }}
                    buttons={[
                        { value: 'mon', label: 'Lun' },
                        { value: 'tue', label: 'Mar' },
                        { value: 'wed', label: 'Mié' },
                        { value: 'thu', label: 'Jue' },
                        { value: 'fri', label: 'Vie' },
                    ]}
                    testID="catalog-segments-multiple"
                />
            </Example>
            <Example title="Solo iconos">
                <SegmentedButtons
                    value={alignment}
                    onValueChange={setAlignment}
                    buttons={[
                        { value: 'left', icon: 'format-align-left', accessibilityLabel: 'Alinear a la izquierda' },
                        { value: 'center', icon: 'format-align-center', accessibilityLabel: 'Centrar' },
                        { value: 'right', icon: 'format-align-right', accessibilityLabel: 'Alinear a la derecha' },
                    ]}
                    testID="catalog-segments-icon-only"
                />
                <Text style={{ textAlign: alignment as 'left' | 'center' | 'right' }}>La alineación cambia en este párrafo.</Text>
            </Example>
            <Example title="Densidades" description="Alturas visuales de 40, 36, 32 y 28 dp; todos conservan un objetivo mínimo de 48 dp.">
                {(['regular', 'small', 'medium', 'high'] as const).map((density) => (
                    <SegmentedButtons
                        key={density}
                        density={density}
                        value={view}
                        onValueChange={setView}
                        buttons={[
                            { value: 'day', label: 'Día' },
                            { value: 'week', label: 'Semana' },
                            { value: 'month', label: 'Mes' },
                        ]}
                        testID={`catalog-segments-${density}`}
                    />
                ))}
            </Example>
            <Example title="Deshabilitados">
                <SegmentedButtons
                    value="first"
                    onValueChange={() => {}}
                    buttons={[
                        { value: 'first', label: 'Día', disabled: true },
                        { value: 'second', label: 'Semana', disabled: true },
                    ]}
                    testID="catalog-segments-disabled"
                />
            </Example>
        </View>
    );
}

function SliderExamples({ onEvent }: ExampleProps) {
    const [continuous, setContinuous] = useState(35);
    const [discrete, setDiscrete] = useState(40);
    const [range, setRange] = useState<[number, number]>([20, 75]);
    const [discreteRange, setDiscreteRange] = useState<[number, number]>([25, 80]);
    const [centered, setCentered] = useState(-25);
    const [centeredSteps, setCenteredSteps] = useState(30);
    const [vertical, setVertical] = useState(55);
    const [verticalCenter, setVerticalCenter] = useState(-30);
    return (
        <View style={{ gap: 32 }}>
            <Example
                title="Standard · continuo"
                description="Toca la pista o arrastra el control. El valor sigue el gesto; el indicador aparece al arrastrar."
            >
                <Text variant="bodyLarge">Volumen: {Math.round(continuous)} %</Text>
                <Slider
                    accessibilityLabel="Volumen"
                    value={continuous}
                    onValueChange={setContinuous}
                    minimumValue={0}
                    maximumValue={100}
                    valueIndicator="on-drag"
                    valueSuffix="%"
                    onSlidingComplete={(value) => onEvent(`Volumen: ${Math.round(value)} %`)}
                    testID="catalog-slider-continuous"
                />
            </Example>
            <Example
                title="Standard · stops"
                description="Detenciones cada 10 unidades, marcas y extremos. El control puede alcanzar 0 y 100."
            >
                <Text variant="bodyLarge">Intensidad: {discrete}</Text>
                <Slider
                    accessibilityLabel="Intensidad"
                    value={discrete}
                    onValueChange={setDiscrete}
                    minimumValue={0}
                    maximumValue={100}
                    step={10}
                    onSlidingComplete={(value) => onEvent(`Intensidad: ${value}`)}
                    testID="catalog-slider-discrete"
                />
            </Example>
            <SliderNumericExample />
            <Example title="Range · continuo" description="Cada extremo tiene su propio ajuste accesible. Los controles no se cruzan.">
                <Text variant="bodyLarge">
                    Intervalo: {Math.round(range[0])} – {Math.round(range[1])}
                </Text>
                <RangeSlider
                    accessibilityLabel="Intervalo"
                    startAccessibilityLabel="Inicio del intervalo"
                    endAccessibilityLabel="Fin del intervalo"
                    value={range}
                    onValueChange={setRange}
                    minimumValue={0}
                    maximumValue={100}
                    onSlidingComplete={(value) => onEvent(`Intervalo: ${value.map(Math.round).join(' – ')}`)}
                    testID="catalog-slider-range-continuous"
                />
            </Example>
            <Example
                title="Range · stops"
                description="Pasos de 5 y separación mínima 10. El indicador corresponde al extremo que estás ajustando."
            >
                <RangeSlider
                    accessibilityLabel="Intervalo discreto"
                    startAccessibilityLabel="Mínimo"
                    endAccessibilityLabel="Máximo"
                    value={discreteRange}
                    onValueChange={setDiscreteRange}
                    minimumValue={0}
                    maximumValue={100}
                    step={5}
                    minimumRange={10}
                    valueIndicator="on-drag"
                    onSlidingComplete={(value) => onEvent(`Rango discreto: ${value.join(' – ')}`)}
                    testID="catalog-slider-range-discrete"
                />
            </Example>
            <Example
                title="Centered"
                description="La pista activa parte del punto medio: los valores negativos y positivos se distinguen alrededor de cero."
            >
                <Text variant="bodyLarge">Balance: {Math.round(centered)}</Text>
                <Slider
                    centered
                    accessibilityLabel="Balance"
                    value={centered}
                    onValueChange={setCentered}
                    minimumValue={-100}
                    maximumValue={100}
                    onSlidingComplete={(value) => onEvent(`Balance: ${Math.round(value)}`)}
                    testID="catalog-slider-centered"
                />
                <Text variant="bodyLarge">Balance con pasos: {centeredSteps}</Text>
                <Slider
                    centered
                    accessibilityLabel="Balance con pasos"
                    value={centeredSteps}
                    onValueChange={setCenteredSteps}
                    minimumValue={-100}
                    maximumValue={100}
                    step={10}
                    testID="catalog-slider-centered-steps"
                />
            </Example>
            <Example
                title="Tamaños XS, S, M, L y XL"
                description="Cada tamaño usa el grosor, la altura del control y las esquinas de los tokens oficiales. M, L y XL admiten iconos dentro de la pista."
            >
                {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
                    <SliderSizeExample key={size} size={size} />
                ))}
            </Example>
            <Example
                title="Orientación vertical"
                description="Mínimo abajo y máximo arriba. Se muestran estándar y centrado; M3 recomienda conservar el rango horizontal."
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: 16 }}>
                    <View style={{ alignItems: 'center', gap: 8 }}>
                        <Slider
                            orientation="vertical"
                            length={240}
                            accessibilityLabel="Volumen vertical"
                            value={vertical}
                            onValueChange={setVertical}
                            minimumValue={0}
                            maximumValue={100}
                            testID="catalog-slider-vertical"
                        />
                        <Text variant="bodySmall">{Math.round(vertical)}</Text>
                    </View>
                    <View style={{ alignItems: 'center', gap: 8 }}>
                        <Slider
                            orientation="vertical"
                            length={240}
                            centered
                            accessibilityLabel="Balance vertical"
                            value={verticalCenter}
                            onValueChange={setVerticalCenter}
                            minimumValue={-100}
                            maximumValue={100}
                            step={10}
                            testID="catalog-slider-vertical-centered"
                        />
                        <Text variant="bodySmall">{Math.round(verticalCenter)}</Text>
                    </View>
                </View>
            </Example>
            <Example title="Deshabilitados">
                <Slider
                    accessibilityLabel="Volumen deshabilitado"
                    value={35}
                    onValueChange={() => {}}
                    minimumValue={0}
                    maximumValue={100}
                    disabled
                    testID="catalog-slider-disabled"
                />
                <Slider
                    accessibilityLabel="Pasos deshabilitados"
                    value={60}
                    onValueChange={() => {}}
                    minimumValue={0}
                    maximumValue={100}
                    step={10}
                    disabled
                    testID="catalog-slider-discrete-disabled"
                />
                <RangeSlider
                    accessibilityLabel="Rango deshabilitado"
                    value={[20, 80]}
                    onValueChange={() => {}}
                    minimumValue={0}
                    maximumValue={100}
                    step={10}
                    disabled
                    testID="catalog-slider-range-disabled"
                />
            </Example>
        </View>
    );
}

function SliderSizeExample({ size }: { size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
    const [value, setValue] = useState(55);
    const icons = size === 'md' || size === 'lg' || size === 'xl';
    return (
        <View style={{ gap: 4 }}>
            <Text variant="labelLarge">{size.toUpperCase()}</Text>
            <Slider
                size={size}
                accessibilityLabel={`Volumen, tamaño ${size}`}
                value={value}
                onValueChange={setValue}
                minimumValue={0}
                maximumValue={100}
                leadingIcon={icons ? (value === 0 ? 'volume-off' : 'volume-high') : undefined}
                testID={`catalog-slider-size-${size}`}
            />
        </View>
    );
}
function SliderNumericExample() {
    const [value, setValue] = useState(60),
        [text, setText] = useState('60');
    const updateSlider = (next: number) => {
        setValue(next);
        setText(String(Math.round(next)));
    };
    return (
        <Example
            title="Valor editable"
            description="El campo y el control mantienen el mismo valor. Puedes enfocar el campo inmediatamente después del slider."
        >
            <Slider
                accessibilityLabel="Brillo"
                minimumValue={0}
                maximumValue={100}
                value={value}
                onValueChange={updateSlider}
                testID="catalog-slider-editable"
            />
            <TextField
                variant="outlined"
                label="Brillo"
                suffix="%"
                value={text}
                inputMode="numeric"
                onChangeText={(next) => {
                    setText(next);
                    const parsed = Number(next);
                    if (next.trim() && Number.isFinite(parsed)) setValue(Math.min(100, Math.max(0, parsed)));
                }}
                onBlur={() => setText(String(Math.round(value)))}
                supportingText="De 0 a 100."
                testID="catalog-slider-editable-value"
            />
        </Example>
    );
}

function TimePickerExamples({ onEvent }: ExampleProps) {
    const [time, setTime] = useState<TimeValue>({ hours: 15, minutes: 45 });
    const [visible, setVisible] = useState(false);
    const [example, setExample] = useState<{ is24Hour: boolean; mode: 'dial' | 'input' }>({ is24Hour: false, mode: 'dial' });
    const open = (is24Hour: boolean, mode: 'dial' | 'input') => {
        setExample({ is24Hour, mode });
        setVisible(true);
    };
    const formatted = `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
    return (
        <View style={{ gap: 24 }}>
            <Text variant="bodyLarge">Hora confirmada: {formatted}</Text>
            <Example
                title="Reloj de 12 horas"
                description="Selecciona hora y minutos; cambia AM/PM. Puedes alternar al teclado y conservar el borrador."
            >
                <TextField
                    label="Hora · reloj 12 h"
                    value={`${String(time.hours % 12 || 12).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')} ${time.hours >= 12 ? 'PM' : 'AM'}`}
                    onChangeText={() => {}}
                    readOnly
                    trailingIcon="clock-outline"
                    trailingIconAccessibilityLabel="Seleccionar hora en reloj de 12 horas"
                    onTrailingIconPress={() => open(false, 'dial')}
                    testID="catalog-time-open-12h"
                />
            </Example>
            <Example
                title="Reloj de 24 horas"
                description="El anillo exterior contiene 00–11 y el interior 12–23, con selección de 24 horas. Arrastrar permite elegir cualquier minuto."
            >
                <TextField
                    label="Hora · reloj 24 h"
                    value={formatted}
                    onChangeText={() => {}}
                    readOnly
                    trailingIcon="clock-outline"
                    trailingIconAccessibilityLabel="Seleccionar hora en reloj de 24 horas"
                    onTrailingIconPress={() => open(true, 'dial')}
                    testID="catalog-time-open-24h"
                />
            </Example>
            <Example
                title="Entrada manual"
                description="La tecla Siguiente enfoca los minutos. Aceptar confirma; Cancelar descarta los cambios."
            >
                <TextField
                    label="Hora · entrada 12 h"
                    value={`${String(time.hours % 12 || 12).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')} ${time.hours >= 12 ? 'PM' : 'AM'}`}
                    onChangeText={() => {}}
                    readOnly
                    trailingIcon="keyboard-outline"
                    trailingIconAccessibilityLabel="Escribir hora en formato de 12 horas"
                    onTrailingIconPress={() => open(false, 'input')}
                    testID="catalog-time-open-input-12h"
                />
                <TextField
                    label="Hora · entrada 24 h"
                    value={formatted}
                    onChangeText={() => {}}
                    readOnly
                    trailingIcon="keyboard-outline"
                    trailingIconAccessibilityLabel="Escribir hora en formato de 24 horas"
                    onTrailingIconPress={() => open(true, 'input')}
                    testID="catalog-time-open-input-24h"
                />
            </Example>
            <TimePicker
                visible={visible}
                value={time}
                is24Hour={example.is24Hour}
                initialDisplayMode={example.mode}
                title="Selecciona la hora"
                inputTitle="Ingresa la hora"
                hourLabel="Hora"
                minuteLabel="Minuto"
                cancelLabel="Cancelar"
                confirmLabel="Aceptar"
                keyboardModeLabel="Cambiar a entrada manual"
                dialModeLabel="Cambiar al reloj"
                invalidTimeLabel="Ingresa una hora y minutos válidos."
                onDismiss={() => {
                    setVisible(false);
                    onEvent('Hora cancelada: se descartó el borrador.');
                }}
                onConfirm={(next) => {
                    setTime(next);
                    setVisible(false);
                    onEvent(`Hora confirmada: ${String(next.hours).padStart(2, '0')}:${String(next.minutes).padStart(2, '0')}`);
                }}
                testID="catalog-time-picker"
            />
        </View>
    );
}

function TextFieldExamples({ onEvent }: ExampleProps) {
    const [email, setEmail] = useState('correo-incompleto');
    const [password, setPassword] = useState('');
    const [secure, setSecure] = useState(true);
    const [amount, setAmount] = useState('120.00');
    const [note, setNote] = useState('');
    const passwordRef = useRef<TextFieldHandle>(null);
    const emailError = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return (
        <View style={{ gap: 24 }}>
            <FieldVariantConfigurations variant="filled" />
            <FieldVariantConfigurations variant="outlined" />
            <Example
                title="Error y texto de apoyo"
                description="Corrige el correo para quitar el error. El contador muestra la longitud y el campo limita a 40 caracteres."
            >
                <TextField
                    variant="outlined"
                    label="Correo electrónico"
                    value={email}
                    onChangeText={setEmail}
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={emailError}
                    errorText="Escribe un correo como nombre@ejemplo.com."
                    supportingText="Usaremos esta dirección para contactarte."
                    trailingIcon={emailError ? 'alert-circle' : 'check'}
                    counter
                    maxLength={40}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    testID="catalog-field-error"
                />
            </Example>
            <Example title="Icono de acción" description="El icono conserva el texto y alterna la visibilidad de la contraseña.">
                <TextField
                    ref={passwordRef}
                    variant="filled"
                    label="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={secure}
                    autoCapitalize="none"
                    autoCorrect={false}
                    trailingIcon={secure ? 'eye-outline' : 'eye-off-outline'}
                    onTrailingIconPress={() => setSecure((current) => !current)}
                    trailingIconAccessibilityLabel={secure ? 'Mostrar contraseña' : 'Ocultar contraseña'}
                    testID="catalog-field-password"
                />
            </Example>
            <Example title="Prefijo y sufijo">
                <TextField
                    variant="outlined"
                    label="Importe"
                    value={amount}
                    onChangeText={setAmount}
                    prefix="$"
                    suffix="MXN"
                    inputMode="decimal"
                    supportingText="Importe en pesos mexicanos."
                    testID="catalog-field-affixes"
                />
            </Example>
            <Example title="Multilínea y contador">
                <TextField
                    variant="filled"
                    label="Comentario"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={3}
                    inputStyle={{ minHeight: 72 }}
                    counter
                    maxLength={140}
                    supportingText="Agrega indicaciones para la entrega."
                    testID="catalog-field-multiline"
                />
            </Example>
            <Example title="Deshabilitado y solo lectura">
                <TextField
                    variant="filled"
                    label="Filled deshabilitado"
                    value="Sin edición"
                    onChangeText={() => {}}
                    leadingIcon="account-outline"
                    disabled
                    testID="catalog-field-disabled-filled"
                />
                <TextField
                    variant="outlined"
                    label="Outlined deshabilitado"
                    value="Sin edición"
                    onChangeText={() => {}}
                    trailingIcon="lock-outline"
                    disabled
                    testID="catalog-field-disabled-outlined"
                />
                <TextField
                    variant="outlined"
                    label="Folio de referencia"
                    value="MD-2026-0042"
                    onChangeText={() => {}}
                    readOnly
                    supportingText="Dato informativo."
                    testID="catalog-field-read-only"
                />
            </Example>
        </View>
    );
}

function FieldVariantConfigurations({ variant }: { variant: 'filled' | 'outlined' }) {
    const [values, setValues] = useState<Record<string, string>>({
        plain: '',
        supporting: 'Un ejemplo',
        trailing: 'Texto',
        leading: '',
        both: 'Ana',
        prefix: '120.00',
        suffix: '25',
        multiline: '',
        textarea: '',
    });
    const supportingRef = useRef<TextFieldHandle>(null);
    const update = (key: string) => (text: string) => setValues((previous) => ({ ...previous, [key]: text }));
    const input = (key: string) => ({
        variant,
        value: values[key],
        onChangeText: update(key),
        testID: key === 'plain' ? `catalog-field-${variant}` : `catalog-field-${variant}-${key}`,
    });
    return (
        <Example
            title={variant === 'filled' ? 'Filled: configuraciones' : 'Outlined: configuraciones'}
            description="Campos vacíos y poblados. Escribe o borra para recorrer ambos estados; la etiqueta siempre conserva su contexto."
        >
            <TextField
                {...input('plain')}
                label="Nombre *"
                supportingText="* Campo obligatorio."
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => supportingRef.current?.focus()}
            />
            <TextField
                {...input('supporting')}
                ref={supportingRef}
                label="Referencia"
                supportingText="Información adicional sobre la referencia."
            />
            <TextField
                {...input('trailing')}
                label="Texto con acción"
                trailingIcon={values.trailing ? 'close' : undefined}
                onTrailingIconPress={() => update('trailing')('')}
                trailingIconAccessibilityLabel="Borrar texto"
            />
            <TextField {...input('leading')} label="Buscar" leadingIcon="magnify" />
            <TextField
                {...input('both')}
                label="Persona"
                leadingIcon="account-outline"
                trailingIcon={values.both ? 'close' : undefined}
                onTrailingIconPress={() => update('both')('')}
                trailingIconAccessibilityLabel="Borrar persona"
            />
            <TextField {...input('prefix')} label="Importe" prefix="$" inputMode="decimal" />
            <TextField {...input('suffix')} label="Distancia" suffix="km" inputMode="decimal" />
            <TextField
                {...input('multiline')}
                label="Comentario"
                multiline
                counter
                maxLength={140}
                supportingText="El campo crece al escribir más líneas."
            />
            <TextField
                {...input('textarea')}
                label="Descripción extensa"
                multiline
                autoGrow={false}
                inputStyle={{ height: 96 }}
                counter
                maxLength={300}
                supportingText="Área fija con desplazamiento al superar cuatro líneas."
            />
        </Example>
    );
}

type DateExample = 'single' | 'range' | 'input' | 'range-input' | 'full-screen' | 'full-screen-range' | 'years' | 'constraints';

function DatePickerExamples({ onEvent }: ExampleProps) {
    const [date, setDate] = useState<Date | undefined>(() => new Date(2026, 9, 25, 12));
    const [range, setRange] = useState<DateRange>({ start: new Date(2026, 9, 25, 12), end: new Date(2026, 9, 30, 12) });
    const [visible, setVisible] = useState(false);
    const [example, setExample] = useState<DateExample>('single');
    const open = (next: DateExample) => {
        setExample(next);
        setVisible(true);
    };
    const dismiss = () => setVisible(false);
    const options: { id: DateExample; label: string }[] = [
        { id: 'single', label: 'Modal: fecha' },
        { id: 'range', label: 'Modal: período' },
        { id: 'input', label: 'Entrada: fecha' },
        { id: 'range-input', label: 'Entrada: período' },
        { id: 'full-screen', label: 'Pantalla completa: fecha' },
        { id: 'full-screen-range', label: 'Pantalla completa: período' },
        { id: 'years', label: 'Selección de año' },
        { id: 'constraints', label: 'Fechas disponibles' },
    ];
    const isRange = example === 'range' || example === 'range-input' || example === 'full-screen-range';
    return (
        <View style={{ gap: 24 }}>
            <Example
                title="Docked"
                description="Escribe día/mes/año o abre el calendario con su icono. Los menús de mes y año reemplazan la cuadrícula."
            >
                <DockedDatePicker
                    label="Fecha del evento"
                    value={date}
                    onChange={(next) => {
                        setDate(next);
                        onEvent(`Fecha confirmada: ${next.toLocaleDateString('es-MX')}`);
                    }}
                    testID="catalog-date-docked"
                />
            </Example>
            <Example
                title="Modal, período y pantalla completa"
                description="Los cambios se guardan al aceptar. El icono de edición alterna calendario y entrada manual conservando la selección."
            >
                <Text variant="bodyLarge">Fecha confirmada: {date?.toLocaleDateString('es-MX') ?? 'Sin fecha'}</Text>
                <Text variant="bodyMedium">
                    Período: {range.start?.toLocaleDateString('es-MX') ?? 'Inicio'} – {range.end?.toLocaleDateString('es-MX') ?? 'Fin'}
                </Text>
                <View style={{ gap: 16 }}>
                    {options.map((option) => (
                        <TextField
                            key={option.id}
                            label={option.label}
                            variant="outlined"
                            value={
                                option.id === 'range' || option.id === 'range-input' || option.id === 'full-screen-range'
                                    ? `${range.start.toLocaleDateString('es-MX')} – ${range.end.toLocaleDateString('es-MX')}`
                                    : (date?.toLocaleDateString('es-MX') ?? '')
                            }
                            readOnly
                            onChangeText={() => {}}
                            trailingIcon={option.id.includes('input') ? 'pencil-outline' : 'calendar-outline'}
                            trailingIconAccessibilityLabel={`Abrir ${option.label.toLocaleLowerCase('es-MX')}`}
                            onTrailingIconPress={() => open(option.id)}
                            testID={`catalog-date-open-${option.id}`}
                        />
                    ))}
                </View>
                <Text variant="bodySmall">
                    Fechas disponibles: 2026–2027, de lunes a viernes. La selección de año y la entrada manual respetan los mismos límites.
                </Text>
            </Example>
            <Example title="Docked deshabilitado">
                <DockedDatePicker
                    label="Fecha no editable"
                    value={date}
                    onChange={() => {}}
                    disabled
                    testID="catalog-date-docked-disabled"
                />
            </Example>
            {isRange ? (
                <DatePicker
                    mode="range"
                    visible={visible}
                    value={range}
                    initialDisplayMode={example === 'range-input' ? 'input' : 'calendar'}
                    presentation={example === 'full-screen-range' ? 'full-screen' : 'dialog'}
                    onDismiss={dismiss}
                    onChange={(next) => {
                        setRange(next);
                        setVisible(false);
                        onEvent('Período confirmado.');
                    }}
                    testID="catalog-date-picker"
                />
            ) : (
                <DatePicker
                    mode="single"
                    visible={visible}
                    value={date}
                    onDismiss={dismiss}
                    onChange={(next) => {
                        setDate(next);
                        setVisible(false);
                        onEvent(`Fecha confirmada: ${next.toLocaleDateString('es-MX')}`);
                    }}
                    initialDisplayMode={example === 'input' ? 'input' : 'calendar'}
                    initialCalendarView={example === 'years' ? 'years' : 'days'}
                    presentation={example === 'full-screen' ? 'full-screen' : 'dialog'}
                    minimumDate={example === 'constraints' ? new Date(2026, 0, 1) : undefined}
                    maximumDate={example === 'constraints' ? new Date(2027, 11, 31) : undefined}
                    isDateDisabled={
                        example === 'constraints' ? (candidate) => candidate.getDay() === 0 || candidate.getDay() === 6 : undefined
                    }
                    testID="catalog-date-picker"
                />
            )}
        </View>
    );
}
