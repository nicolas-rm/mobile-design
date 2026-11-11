import { useId, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Defs, FeColorMatrix, FeComposite, FeGaussianBlur, Filter, Image as SvgImage } from 'react-native-svg';
import { Icon, IconButton, Slider, Text, useMobileTheme } from 'mobile-design/react-native';

const photo = require('./assets/sliders/photo-edit.png');
function Usage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <View style={{ gap: 16 }}>
            <Text variant="titleLarge">{title}</Text>
            <Text>{description}</Text>
            {children}
        </View>
    );
}

/** The sliders update the rendered image; there is no confirmation button or delayed preview. */
function PhotoEditor() {
    const theme = useMobileTheme();
    const id = `slider-photo-${useId().replace(/:/g, '')}`;
    const [width, setWidth] = useState(0);
    const [pop, setPop] = useState(56),
        [sharpen, setSharpen] = useState(32),
        [denoise, setDenoise] = useState(18);
    return (
        <Usage
            title="Edit · Pop, Sharpen, Denoise"
            description="Los tres ajustes modifican la misma foto durante el gesto: saturación, detalle y suavizado. La composición se adapta al ancho disponible."
        >
            <View
                onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
                style={{
                    padding: 16,
                    gap: 24,
                    borderRadius: 28,
                    backgroundColor: theme.colors.surfaceContainerLow,
                    flexDirection: width >= 600 ? 'row' : 'column',
                }}
                testID="md-slider-photo-editor"
            >
                <View
                    style={{ flex: width >= 600 ? 1 : undefined, height: width >= 600 ? 280 : 200, borderRadius: 24, overflow: 'hidden' }}
                    testID="md-slider-photo-preview"
                >
                    <Svg width="100%" height="100%" viewBox="0 0 994 518" accessibilityLabel="Photo preview" accessibilityRole="image">
                        <Defs>
                            <Filter id={id} x="0%" y="0%" width="100%" height="100%">
                                <FeColorMatrix type="saturate" values={0.5 + pop / 100} result="color" />
                                <FeGaussianBlur in="color" stdDeviation={1.4} result="soft" />
                                <FeComposite
                                    in="color"
                                    in2="soft"
                                    operator="arithmetic"
                                    k2={1 + sharpen / 50}
                                    k3={-sharpen / 50}
                                    result="detail"
                                />
                                <FeGaussianBlur in="detail" stdDeviation={denoise / 50} />
                            </Filter>
                        </Defs>
                        <SvgImage href={photo} width={994} height={518} preserveAspectRatio="xMidYMid slice" filter={`url(#${id})`} />
                    </Svg>
                </View>
                <View style={{ flex: width >= 600 ? 1 : undefined, minWidth: 0, gap: 12 }}>
                    <Text variant="titleLarge">Edit</Text>
                    {(
                        [
                            { name: 'Pop', value: pop, set: setPop },
                            { name: 'Sharpen', value: sharpen, set: setSharpen },
                            { name: 'Denoise', value: denoise, set: setDenoise },
                        ] as const
                    ).map((control) => (
                        <View key={control.name} style={{ gap: 8 }}>
                            <Text variant="bodyLarge">{control.name}</Text>
                            <Slider
                                value={control.value}
                                onValueChange={control.set}
                                maximumValue={100}
                                step={1}
                                showTicks={false}
                                valueIndicator="on-drag"
                                accessibilityLabel={control.name}
                                testID={`md-slider-photo-${control.name.toLowerCase()}`}
                            />
                        </View>
                    ))}
                </View>
            </View>
        </Usage>
    );
}
function SoundSettings() {
    const [call, setCall] = useState(60),
        [alarm, setAlarm] = useState(40);
    return (
        <Usage
            title="Sound settings"
            description="Call volume y Alarm volume son ajustes independientes. El icono incluido se coloca en la pista activa o inactiva según el espacio disponible."
        >
            {(
                [
                    { title: 'Call volume', value: call, set: setCall, icon: 'phone', id: 'call' },
                    { title: 'Alarm volume', value: alarm, set: setAlarm, icon: 'alarm', id: 'alarm' },
                ] as const
            ).map((control) => (
                <View key={control.id} style={{ gap: 8 }}>
                    <Text variant="bodyLarge">{control.title}</Text>
                    <Slider
                        size="md"
                        maximumValue={100}
                        value={control.value}
                        onValueChange={control.set}
                        leadingIcon={control.icon}
                        accessibilityLabel={control.title}
                        valuePrecision={0}
                        valueSuffix=" %"
                        testID={`md-slider-sound-${control.id}`}
                    />
                </View>
            ))}
        </Usage>
    );
}
function DisplaySettings() {
    const theme = useMobileTheme();
    const [font, setFont] = useState(1),
        [display, setDisplay] = useState(1),
        [brightness, setBrightness] = useState(70);
    return (
        <Usage
            title="Display · Brightness, Font size, Display size"
            description="El brillo cambia la vista previa al arrastrar. Las detenciones de tamaño cambian el texto y la escala del contenido; las etiquetas externas permanecen alineadas con el control."
        >
            <View style={{ padding: 24, borderRadius: 24, minHeight: 180, backgroundColor: theme.colors.surfaceContainerHigh }}>
                <View style={{ gap: 12, opacity: 0.15 + (brightness / 100) * 0.85 }} testID="md-slider-display-preview">
                    <Icon source="sunny" size={32 + display * 8} />
                    <Text variant="titleLarge" style={{ fontSize: theme.fonts.titleLarge.fontSize + font * 2 }}>
                        Display settings
                    </Text>
                    <Text
                        variant="bodyLarge"
                        style={{
                            fontSize: theme.fonts.bodyLarge.fontSize + font * 2,
                            lineHeight: theme.fonts.bodyLarge.lineHeight + font * 3,
                        }}
                    >
                        Find the size and brightness that feel comfortable to read.
                    </Text>
                </View>
            </View>
            <Text variant="bodyLarge">Brightness</Text>
            <Slider
                value={brightness}
                maximumValue={100}
                onValueChange={setBrightness}
                valueIndicator="on-drag"
                valuePrecision={0}
                valueSuffix=" %"
                accessibilityLabel="Brightness"
                testID="md-slider-display-brightness"
            />
            <Text variant="bodyLarge">Font size</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text accessibilityElementsHidden style={{ fontSize: 14 }}>
                    A
                </Text>
                <Slider
                    style={{ flex: 1 }}
                    value={font}
                    maximumValue={4}
                    step={1}
                    onValueChange={setFont}
                    accessibilityLabel="Font size"
                    testID="md-slider-font-size"
                />
                <Text accessibilityElementsHidden style={{ fontSize: 28 }}>
                    A
                </Text>
            </View>
            <Text variant="bodyLarge">Display size</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon source="remove" size={24} />
                <Slider
                    style={{ flex: 1 }}
                    value={display}
                    maximumValue={2}
                    step={1}
                    onValueChange={setDisplay}
                    accessibilityLabel="Display size"
                    testID="md-slider-display-size"
                />
                <Icon source="add" size={24} />
            </View>
        </Usage>
    );
}
function ExternalControls() {
    const [value, setValue] = useState(50);
    return (
        <Usage
            title="External controls · decrement / increment"
            description="Los botones cambian el mismo valor en pasos de 5. Cada uno tiene su propia área de interacción y se deshabilita al alcanzar su límite."
        >
            <Text variant="bodyLarge" testID="md-slider-stepper-value">
                {value} %
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <IconButton
                    icon="remove"
                    accessibilityLabel="Decrease brightness"
                    disabled={value <= 0}
                    onPress={() => setValue((v) => Math.max(0, v - 5))}
                    testID="md-slider-decrement"
                />
                <Slider
                    style={{ flex: 1 }}
                    maximumValue={100}
                    value={value}
                    onValueChange={setValue}
                    step={5}
                    showTicks={false}
                    showStopIndicator={false}
                    accessibilityLabel="Brightness with external controls"
                    valueSuffix="%"
                    testID="md-slider-stepper"
                />
                <IconButton
                    icon="add"
                    accessibilityLabel="Increase brightness"
                    disabled={value >= 100}
                    onPress={() => setValue((v) => Math.min(100, v + 5))}
                    testID="md-slider-increment"
                />
            </View>
        </Usage>
    );
}
function RoomControls() {
    const theme = useMobileTheme();
    const [temperature, setTemperature] = useState(22),
        [brightness, setBrightness] = useState(60);
    return (
        <Usage
            title="Living room · Bedroom"
            description="Un control XL destaca la temperatura. El control vertical ajusta la luz del dormitorio: mínimo abajo, máximo arriba, con la vista previa actualizada durante el gesto."
        >
            <View style={{ backgroundColor: theme.colors.surfaceContainerLow, padding: 16, borderRadius: 28, gap: 16 }}>
                <Text variant="titleLarge">Living room</Text>
                <Text variant="displaySmall" testID="md-slider-temperature-value">
                    {temperature}°
                </Text>
                <Slider
                    size="xl"
                    minimumValue={16}
                    maximumValue={30}
                    step={1}
                    showTicks={false}
                    value={temperature}
                    onValueChange={setTemperature}
                    leadingIcon="device_thermostat"
                    accessibilityLabel="Living room temperature"
                    valueSuffix="°"
                    testID="md-slider-temperature"
                />
            </View>
            <View
                style={{
                    backgroundColor: theme.colors.surfaceContainerLow,
                    padding: 24,
                    borderRadius: 28,
                    flexDirection: 'row',
                    gap: 24,
                    alignItems: 'center',
                }}
            >
                <View style={{ flex: 1, gap: 16 }}>
                    <Text variant="titleLarge">Bedroom</Text>
                    <View style={{ opacity: 0.15 + (brightness / 100) * 0.85 }} testID="md-slider-bedroom-preview">
                        <Icon source="bed" size={80} color={theme.colors.primary} />
                    </View>
                    <Text variant="bodyLarge" testID="md-slider-bedroom-value">
                        {Math.round(brightness)} %
                    </Text>
                </View>
                <Slider
                    orientation="vertical"
                    size="md"
                    length={240}
                    maximumValue={100}
                    value={brightness}
                    onValueChange={setBrightness}
                    leadingIcon="lightbulb"
                    accessibilityLabel="Bedroom brightness"
                    valuePrecision={0}
                    valueSuffix=" %"
                    testID="md-slider-bedroom"
                />
            </View>
        </Usage>
    );
}
export function SliderUsageExamples() {
    return (
        <View style={{ gap: 32 }}>
            <PhotoEditor />
            <SoundSettings />
            <DisplaySettings />
            <ExternalControls />
            <RoomControls />
        </View>
    );
}
