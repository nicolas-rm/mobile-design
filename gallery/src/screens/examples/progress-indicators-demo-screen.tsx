import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Appbar, Button, IconButton, PaperProvider, ProgressIndicator, SegmentedButtons, Surface, Switch, Text } from '@/components';
import { useAppPreferences } from '@/hooks/preferences';
import { useSafeAreaInsets } from '@/hooks/settings';
import { useAppTheme } from '@/hooks/theme';
import type { RootStackParamList } from '@/navigations/types';
import { MaterialReferenceLinks } from './material-reference-links';
import { ProgressWaitExamples } from './progress-wait-examples';
import { ProgressPlacementExamples } from './progress-placement-examples';
import { createPaperTheme, usePaperTheme } from '@/theme/paper';

type Props = NativeStackScreenProps<RootStackParamList, 'ProgressIndicatorsDemo'>;
type Appearance = 'flat' | 'wavy';
type ProgressMode = 'determinate' | 'indeterminate';

function ProgressExamples({
    navigation,
    onToggleTheme,
    reduceMotion,
    onReduceMotionChange,
    systemReduceMotion,
}: Props & {
    onToggleTheme: () => void;
    reduceMotion: boolean;
    onReduceMotionChange: (value: boolean) => void;
    systemReduceMotion: boolean;
}) {
    const theme = usePaperTheme();
    const insets = useSafeAreaInsets();
    const focused = useIsFocused();
    const motionReduced = reduceMotion || systemReduceMotion;
    const [appearance, setAppearance] = useState<Appearance>('flat');
    const [mode, setMode] = useState<ProgressMode>('determinate');
    const [thickness, setThickness] = useState('4');
    const [rtl, setRtl] = useState(false);
    const [progress, setProgress] = useState(0.35);
    const [running, setRunning] = useState(false);
    const [galleryMotion, setGalleryMotion] = useState(true);
    const [duration, setDuration] = useState('8000');
    const [session, setSession] = useState(0);
    const [waitOpen, setWaitOpen] = useState(false);
    const canAnimate = focused && !waitOpen;
    const simulationVersion = useRef(0);
    const latestProgress = useRef(progress);
    useEffect(() => {
        latestProgress.current = progress;
    }, [progress]);
    const indeterminate = mode === 'indeterminate';
    const percent = Math.round(progress * 100);
    const complete = !indeterminate && percent === 100;
    const cardStyle = { backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.shapes.corner.large, gap: 20, padding: 24 };

    useEffect(() => {
        if (!running || !canAnimate || indeterminate) return;
        const version = ++simulationVersion.current;
        const startedAt = Date.now();
        const start = latestProgress.current;
        const timer = setInterval(() => {
            if (simulationVersion.current === version) setProgress(Math.min(1, start + (Date.now() - startedAt) / Number(duration)));
        }, 100);
        return () => {
            simulationVersion.current += 1;
            clearInterval(timer);
        };
    }, [canAnimate, duration, indeterminate, running, session]);

    useEffect(() => {
        if (!focused || complete) setRunning(false);
    }, [complete, focused]);

    const adjustProgress = (amount: number) => {
        simulationVersion.current += 1;
        setRunning(false);
        setProgress((value) => Math.max(0, Math.min(1, Math.round((value + amount) * 100) / 100)));
    };
    const reset = () => {
        simulationVersion.current += 1;
        setRunning(false);
        setProgress(0);
        setSession((value) => value + 1);
    };
    const toggleRun = () => {
        simulationVersion.current += 1;
        if (complete) {
            setProgress(0);
            setSession((value) => value + 1);
        }
        setRunning((value) => !value);
    };
    const status = complete ? 'Completado' : running ? 'Procesando' : 'En pausa';
    const value = indeterminate ? undefined : progress;

    return (
        <View style={{ backgroundColor: theme.colors.background, flex: 1 }} testID="progress-demo-screen">
            <StatusBar style={theme.dark ? 'light' : 'dark'} />
            <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="Progreso" />
                <IconButton
                    accessibilityLabel={theme.dark ? 'Ver demo en tema claro' : 'Ver demo en tema oscuro'}
                    icon={theme.dark ? 'weather-sunny' : 'weather-night'}
                    onPress={onToggleTheme}
                    testID="progress-demo-theme"
                />
            </Appbar.Header>
            <ScrollView
                contentContainerStyle={{ gap: 24, paddingBottom: insets.useBottom + 24, paddingHorizontal: 16, paddingTop: 16 }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <View style={{ gap: 8 }}>
                    <Text style={{ color: theme.colors.primary }} variant="labelLarge">
                        MATERIAL DESIGN 3
                    </Text>
                    <Text variant="headlineLarge">Indicadores de progreso</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodyLarge">
                        Revisa las variantes lineales y circulares de Material 3, sus extremos, pistas y movimiento.
                    </Text>
                </View>
                <Surface
                    style={{
                        padding: 16,
                        gap: 8,
                        borderRadius: theme.shapes.corner.medium,
                        backgroundColor: motionReduced ? theme.colors.secondaryContainer : theme.colors.surfaceContainer,
                    }}
                >
                    <Text variant="titleSmall">
                        {motionReduced
                            ? systemReduceMotion
                                ? 'Movimiento reducido por el sistema'
                                : 'Movimiento reducido en esta vista'
                            : 'Animaciones disponibles'}
                    </Text>
                    <Text variant="bodyMedium">
                        {motionReduced
                            ? 'Esta vista mantiene las ondas y los giros inmóviles. Puedes cambiar la vista previa aquí; la preferencia global de la aplicación se conserva.'
                            : 'La galería reproduce el movimiento automáticamente. El proceso de ejemplo se controla con Iniciar y Pausar.'}
                    </Text>
                </Surface>
                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                    <Text style={{ flex: 1 }}>Vista previa de movimiento reducido</Text>
                    <Switch
                        accessibilityLabel="Vista previa de movimiento reducido"
                        disabled={systemReduceMotion}
                        value={motionReduced}
                        onValueChange={onReduceMotionChange}
                        testID="progress-demo-reduce-motion"
                    />
                </View>
                <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodySmall">
                    La preferencia de movimiento reducido del sistema siempre se respeta.
                </Text>
                <View style={{ gap: 12 }}>
                    <Text variant="titleMedium">Tipo de progreso</Text>
                    <SegmentedButtons
                        buttons={[
                            { value: 'determinate', label: 'Con porcentaje', testID: 'progress-mode-determinate' },
                            { value: 'indeterminate', label: 'Sin porcentaje', testID: 'progress-mode-indeterminate' },
                        ]}
                        onValueChange={(next) => {
                            simulationVersion.current += 1;
                            setMode(next as ProgressMode);
                            setRunning(true);
                        }}
                        value={mode}
                    />
                    <Text variant="titleMedium">Apariencia</Text>
                    <SegmentedButtons
                        buttons={[
                            { value: 'flat', label: 'Estándar', testID: 'progress-appearance-flat' },
                            { value: 'wavy', label: 'Ondulada', testID: 'progress-appearance-wavy' },
                        ]}
                        onValueChange={(next) => setAppearance(next as Appearance)}
                        value={appearance}
                    />
                </View>
                <SegmentedButtons
                    value={thickness}
                    onValueChange={setThickness}
                    buttons={[
                        { value: '4', label: 'Grosor 4 dp' },
                        { value: '8', label: 'Grosor 8 dp' },
                    ]}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <Text style={{ flex: 1 }}>Vista de lectura de derecha a izquierda (RTL)</Text>
                    <Switch accessibilityLabel="Progreso lineal de derecha a izquierda" value={rtl} onValueChange={setRtl} />
                </View>
                <SegmentedButtons
                    value={duration}
                    onValueChange={(next) => {
                        simulationVersion.current += 1;
                        setDuration(next);
                    }}
                    buttons={[
                        { value: '4000', label: '4 segundos' },
                        { value: '8000', label: '8 segundos' },
                        { value: '16000', label: '16 segundos' },
                    ]}
                />
                <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodySmall">
                    Duración de la simulación de 0 a 100 %. Los giros y las ondas mantienen la velocidad de Material 3, independientemente
                    de este tiempo.
                </Text>
                <Surface style={cardStyle}>
                    <Text style={{ color: theme.colors.onSurfaceVariant }} variant="labelLarge">
                        PROCESO DE EJEMPLO
                    </Text>
                    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 24 }}>
                        <ProgressIndicator
                            accessibilityLabel="Progreso circular del ejemplo"
                            key={`main-circle-${session}`}
                            animated={canAnimate}
                            paused={!running && !complete}
                            appearance={appearance}
                            progress={value}
                            size={appearance === 'wavy' ? (Number(thickness) === 8 ? 52 : 48) : 40}
                            testID="progress-demo-circular"
                            thickness={Number(thickness)}
                            variant="circular"
                        />
                        <View style={{ flex: 1, gap: 4 }}>
                            <Text
                                style={{ color: theme.colors.primary, fontVariant: ['tabular-nums'] }}
                                testID="progress-demo-value"
                                variant="headlineLarge"
                            >
                                {indeterminate ? 'En curso' : `${percent} %`}
                            </Text>
                            <Text accessibilityLiveRegion="polite" testID="progress-demo-status" variant="bodyMedium">
                                {status}
                            </Text>
                        </View>
                    </View>
                    <ProgressIndicator
                        accessibilityLabel="Progreso lineal del ejemplo"
                        key={`main-line-${session}`}
                        animated={canAnimate}
                        paused={!running && !complete}
                        appearance={appearance}
                        progress={value}
                        direction={rtl ? 'rtl' : 'ltr'}
                        testID="progress-demo-linear"
                        thickness={Number(thickness)}
                    />
                    <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodyMedium">
                        {indeterminate
                            ? 'Cuando la duración es desconocida, el indicador muestra actividad sin inventar un porcentaje.'
                            : 'Ajusta el valor o inicia una simulación para ver cómo avanza.'}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        <Button icon={running ? 'pause' : 'play'} onPress={toggleRun} style={{ flexGrow: 1 }} testID="progress-demo-run">
                            {running ? 'Pausar' : complete ? 'Repetir' : 'Iniciar'}
                        </Button>
                        <Button
                            accessibilityHint="Restablece el proceso y sus animaciones, y lo deja detenido"
                            icon="restart"
                            mode="outlined"
                            onPress={reset}
                            style={{ flexGrow: 1 }}
                            testID="progress-demo-reset"
                        >
                            Reiniciar
                        </Button>
                    </View>
                    {!indeterminate ? (
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <Button
                                accessibilityLabel="Restar diez puntos de progreso"
                                disabled={percent === 0}
                                mode="text"
                                onPress={() => adjustProgress(-0.1)}
                                style={{ flex: 1 }}
                                testID="progress-demo-decrease"
                            >
                                −10 %
                            </Button>
                            <Button
                                accessibilityLabel="Sumar diez puntos de progreso"
                                disabled={percent === 100}
                                mode="text"
                                onPress={() => adjustProgress(0.1)}
                                style={{ flex: 1 }}
                                testID="progress-demo-increase"
                            >
                                +10 %
                            </Button>
                        </View>
                    ) : null}
                </Surface>
                <Surface style={cardStyle}>
                    <Text variant="titleMedium">De principio a fin</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-around' }}>
                        {[0, 0.5, 1].map((sample) => (
                            <View key={sample} style={{ alignItems: 'center', gap: 12 }}>
                                <ProgressIndicator
                                    accessibilityLabel={`Referencia al ${sample * 100} por ciento`}
                                    animated={false}
                                    appearance={appearance}
                                    progress={sample}
                                    size={52}
                                    testID={`progress-reference-${sample * 100}`}
                                    variant="circular"
                                />
                                <Text variant="labelLarge">{sample * 100} %</Text>
                            </View>
                        ))}
                    </View>
                </Surface>
                <Text accessibilityRole="header" variant="headlineSmall">
                    Variantes de Material 3
                </Text>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    Lineal y circular, estándar y ondulado, de grosor normal y grueso; cada uno con progreso determinado e indeterminado.
                </Text>
                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                    <Text style={{ flex: 1 }}>Reproducir animaciones de la galería</Text>
                    <Switch
                        accessibilityLabel="Reproducir animaciones de la galería"
                        value={galleryMotion}
                        onValueChange={setGalleryMotion}
                    />
                </View>
                {(['determinate', 'indeterminate'] as const).map((behavior) => (
                    <Surface key={behavior} style={cardStyle}>
                        <Text variant="titleLarge">
                            {behavior === 'determinate' ? 'Progreso determinado · 65 %' : 'Progreso indeterminado'}
                        </Text>
                        {(['flat', 'wavy'] as const).flatMap((shape) =>
                            [4, 8].map((stroke) => (
                                <View key={`${shape}-${stroke}`} style={{ gap: 12 }}>
                                    <Text variant="labelLarge">
                                        {shape === 'flat' ? 'Estándar' : 'Ondulado'} · {stroke} dp
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                                        <ProgressIndicator
                                            accessibilityLabel={`Circular ${shape}, ${stroke} dp, ${behavior}`}
                                            appearance={shape}
                                            thickness={stroke}
                                            size={shape === 'wavy' ? (stroke === 8 ? 52 : 48) : 40}
                                            progress={behavior === 'determinate' ? 0.65 : undefined}
                                            variant="circular"
                                            animated={canAnimate && galleryMotion}
                                            testID={`gallery-${behavior}-${shape}-${stroke}-circular`}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <ProgressIndicator
                                                accessibilityLabel={`Lineal ${shape}, ${stroke} dp, ${behavior}`}
                                                appearance={shape}
                                                thickness={stroke}
                                                progress={behavior === 'determinate' ? 0.65 : undefined}
                                                animated={canAnimate && galleryMotion}
                                                direction={rtl ? 'rtl' : 'ltr'}
                                                testID={`gallery-${behavior}-${shape}-${stroke}-linear`}
                                            />
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </Surface>
                ))}
                <Surface style={cardStyle}>
                    <Text variant="titleLarge">Inicio, punto de avance y final</Text>
                    {[0, 0.01, 0.5, 1].map((sample) => (
                        <View key={sample} style={{ gap: 8 }}>
                            <Text variant="labelLarge">{sample * 100} %</Text>
                            <ProgressIndicator
                                animated={false}
                                appearance={appearance}
                                progress={sample}
                                thickness={Number(thickness)}
                                direction={rtl ? 'rtl' : 'ltr'}
                                testID={`progress-linear-reference-${sample * 100}`}
                            />
                        </View>
                    ))}
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        El marcador final mide 4 dp y aparece en los indicadores lineales determinados. Al 1 %, el extremo redondeado
                        aparece como un punto; al 0 % aún no hay avance.
                    </Text>
                </Surface>
                <Surface style={cardStyle}>
                    <Text variant="titleLarge">Tamaños circulares</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
                        {[24, 40, 48, 52, 96, 240].map((size) => (
                            <View key={size} style={{ alignItems: 'center', gap: 12 }}>
                                <ProgressIndicator
                                    size={size}
                                    appearance={size === 24 || size === 40 ? 'flat' : 'wavy'}
                                    progress={0.65}
                                    thickness={size === 52 ? 8 : undefined}
                                    animated={canAnimate && galleryMotion}
                                    variant="circular"
                                    testID={`progress-size-${size}`}
                                />
                                <Text>{size} dp</Text>
                            </View>
                        ))}
                    </View>
                </Surface>
                <Surface style={cardStyle}>
                    <Text variant="titleLarge">Forma de la onda y color</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        Amplitud, longitud y velocidad configurables; colores del tema actual.
                    </Text>
                    <ProgressIndicator
                        appearance="wavy"
                        progress={0.7}
                        waveAmplitude={3}
                        wavelength={40}
                        animated={canAnimate && galleryMotion}
                        color={theme.colors.tertiary}
                        trackColor={theme.colors.tertiaryContainer}
                        accessibilityLabel="Onda suave"
                    />
                    <ProgressIndicator
                        appearance="wavy"
                        progress={0.7}
                        waveAmplitude={6}
                        wavelength={48}
                        waveSpeed={24}
                        thickness={8}
                        animated={canAnimate && galleryMotion}
                        accessibilityLabel="Onda amplia"
                    />
                </Surface>
                <ProgressWaitExamples focused={focused} onOpenChange={setWaitOpen} />
                <ProgressPlacementExamples focused={canAnimate} />
                <MaterialReferenceLinks component="progress-indicators" />
                {motionReduced ? (
                    <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodySmall">
                        El movimiento reducido está activo. Los valores siguen actualizándose sin animaciones.
                    </Text>
                ) : null}
            </ScrollView>
        </View>
    );
}

export function ProgressIndicatorsDemoScreen(props: Props) {
    const { themeMode } = useAppTheme();
    const { effectiveReduceMotionEnabled, rippleEnabled, systemReduceMotionEnabled } = useAppPreferences();
    const settings = useMemo(() => ({ rippleEffectEnabled: rippleEnabled }), [rippleEnabled]);
    const [mode, setMode] = useState(themeMode);
    const [reduceMotion, setReduceMotion] = useState(effectiveReduceMotionEnabled);
    const theme = useMemo(
        () => createPaperTheme(mode, reduceMotion || systemReduceMotionEnabled),
        [mode, reduceMotion, systemReduceMotionEnabled]
    );

    return (
        <PaperProvider reduceMotion={reduceMotion || systemReduceMotionEnabled ? 'on' : 'auto'} settings={settings} theme={theme}>
            <ProgressExamples
                {...props}
                systemReduceMotion={systemReduceMotionEnabled}
                reduceMotion={reduceMotion}
                onReduceMotionChange={setReduceMotion}
                onToggleTheme={() => setMode((current) => (current === 'dark' ? 'light' : 'dark'))}
            />
        </PaperProvider>
    );
}
