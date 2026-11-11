import { useEffect, useRef, useState } from 'react';
import { Modal, View } from 'react-native';
import { Appbar, Button, Loading, ProgressIndicator, Surface, Text } from '@/components';
import { usePaperTheme } from '@/theme/paper';

type Wait = 'instant' | 'short' | 'long';

/** Compare the three wait-time examples from the usage guide without making requests. */
export function ProgressWaitExamples({ focused, onOpenChange }: { focused: boolean; onOpenChange?: (open: boolean) => void }) {
    const theme = usePaperTheme();
    const [example, setExample] = useState<Wait>();
    const [progress, setProgress] = useState(0);
    const [ready, setReady] = useState(false);
    const revision = useRef(0);
    useEffect(() => {
        onOpenChange?.(Boolean(example));
        return () => onOpenChange?.(false);
    }, [example, onOpenChange]);
    const close = () => {
        revision.current += 1;
        setExample(undefined);
    };
    useEffect(() => {
        if (!focused) {
            revision.current += 1;
            setExample(undefined);
        }
    }, [focused]);
    useEffect(() => {
        if (!example || !focused || ready || example === 'instant') return;
        const version = revision.current;
        if (example === 'short') {
            const timer = setTimeout(() => {
                if (revision.current === version) setReady(true);
            }, 1600);
            return () => clearTimeout(timer);
        }
        const startedAt = Date.now();
        const timer = setInterval(() => {
            if (revision.current === version) setProgress(Math.min(1, (Date.now() - startedAt) / 8000));
        }, 100);
        return () => clearInterval(timer);
    }, [example, focused, ready]);
    useEffect(() => {
        if (example === 'long' && progress === 1) setReady(true);
    }, [example, progress]);
    const start = (wait: Wait) => {
        revision.current += 1;
        setProgress(0);
        setReady(wait === 'instant');
        setExample(wait);
    };
    return (
        <>
            <Surface
                style={{ padding: 20, gap: 16, borderRadius: theme.shapes.corner.large, backgroundColor: theme.colors.surfaceContainer }}
            >
                <Text variant="titleLarge">Elegir según el tiempo de espera</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    Menos de 200 ms: sin indicador. De 200 ms a 5 s: indicador de carga. Más de 5 s: progreso de la operación.
                </Text>
                <Button mode="outlined" onPress={() => start('instant')} testID="progress-wait-instant">
                    Instantánea · sin indicador
                </Button>
                <Button mode="outlined" onPress={() => start('short')} testID="progress-wait-short">
                    Breve · 1,6 segundos
                </Button>
                <Button mode="outlined" onPress={() => start('long')} testID="progress-wait-long">
                    Prolongada · 8 segundos
                </Button>
            </Surface>
            <Modal visible={Boolean(example)} onRequestClose={close}>
                <View style={{ flex: 1, backgroundColor: theme.colors.background }} testID="progress-page-preview">
                    <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
                        <Appbar.BackAction onPress={close} />
                        <Appbar.Content title={ready ? 'Colección' : 'Cargando colección'} />
                    </Appbar.Header>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 24 }}>
                        {ready ? (
                            <>
                                <Text accessibilityRole="header" variant="headlineMedium">
                                    Tu colección está lista
                                </Text>
                                <Text>El contenido aparece una vez que termina la carga.</Text>
                            </>
                        ) : example === 'short' ? (
                            <>
                                <Loading accessibilityLabel="Cargando colección" />
                                <Text>Una espera breve</Text>
                            </>
                        ) : (
                            <>
                                <ProgressIndicator
                                    accessibilityLabel="Carga de la página de colección"
                                    variant="circular"
                                    size={96}
                                    progress={progress}
                                    animated={focused}
                                    testID="progress-page-indicator"
                                />
                                <Text accessibilityLiveRegion="polite">Cargando colección · {Math.round(progress * 100)} %</Text>
                            </>
                        )}
                        <Button mode="text" onPress={close} testID="progress-wait-close">
                            {ready ? 'Volver a los ejemplos' : 'Cancelar carga'}
                        </Button>
                    </View>
                </View>
            </Modal>
        </>
    );
}
