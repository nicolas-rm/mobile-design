import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';
import { Button, Icon, ProgressIndicator, Surface, Text } from '@/components';
import { usePaperTheme } from '@/theme/paper';

type Stage = 'idle' | 'discovering' | 'processing' | 'complete';

/** Local simulations only; each example owns and cleans up its own process. */
export function ProgressPlacementExamples({ focused }: { focused: boolean }) {
    const theme = usePaperTheme();
    const collectionRevision = useRef(0);
    const [stage, setStage] = useState<Stage>('idle');
    const [progress, setProgress] = useState(0);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [itemsLoaded, setItemsLoaded] = useState(false);
    const [article, setArticle] = useState<'idle' | 'loading' | 'ready'>('idle');
    const expansion = LinearTransition.duration(theme.motion.duration.medium4 * theme.animation.scale).easing(
        Easing.bezier(...theme.motion.easing.standard)
    );
    const card = { backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.shapes.corner.large, gap: 16, padding: 20 };
    useEffect(() => {
        if (!focused) {
            collectionRevision.current += 1;
            setProgress(0);
            setStage('idle');
            setSaving(false);
            setLoadingItems(false);
            if (article === 'loading') setArticle('idle');
        }
    }, [focused]);
    useEffect(() => {
        if (!focused || stage !== 'discovering') return;
        const version = collectionRevision.current;
        const timer = setTimeout(() => {
            if (version === collectionRevision.current) setStage('processing');
        }, 2000);
        return () => clearTimeout(timer);
    }, [focused, stage]);
    useEffect(() => {
        if (!focused || stage !== 'processing') return;
        const version = collectionRevision.current;
        const startedAt = Date.now();
        const timer = setInterval(() => {
            if (version === collectionRevision.current) setProgress(Math.min(1, (Date.now() - startedAt) / 6000));
        }, 100);
        return () => clearInterval(timer);
    }, [focused, stage]);
    useEffect(() => {
        if (stage === 'processing' && progress === 1) setStage('complete');
    }, [progress, stage]);
    useEffect(() => {
        if (!focused || !saving) return;
        const timer = setTimeout(() => {
            setSaving(false);
            setSaved(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, [focused, saving]);
    useEffect(() => {
        if (!focused || !loadingItems) return;
        const timer = setTimeout(() => {
            setLoadingItems(false);
            setItemsLoaded(true);
        }, 2500);
        return () => clearTimeout(timer);
    }, [focused, loadingItems]);
    useEffect(() => {
        if (!focused || article !== 'loading') return;
        const timer = setTimeout(() => setArticle('ready'), 1800);
        return () => clearTimeout(timer);
    }, [focused, article]);
    const active = stage === 'discovering' || stage === 'processing';
    return (
        <View style={{ gap: 24 }}>
            <Text accessibilityRole="header" variant="headlineSmall">
                Ejemplos de uso y ubicación
            </Text>
            <Surface style={card}>
                <Text variant="titleLarge">De indeterminado a determinado</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    Primero se calcula el trabajo. Cuando se conoce el total, aparece un porcentaje real de la simulación.
                </Text>
                <View style={{ minHeight: 4 }}>
                    {stage !== 'idle' ? (
                        <ProgressIndicator
                            accessibilityLabel="Preparación de la colección"
                            animated={focused}
                            progress={stage === 'discovering' ? undefined : progress}
                            testID="progress-transition-indicator"
                        />
                    ) : null}
                </View>
                <Text accessibilityLiveRegion="polite" testID="progress-transition-status">
                    {stage === 'idle'
                        ? 'Listo para iniciar'
                        : stage === 'discovering'
                          ? 'Calculando el total…'
                          : stage === 'complete'
                            ? 'Colección lista · 100 %'
                            : `Preparando colección · ${Math.round(progress * 100)} %`}
                </Text>
                <Button
                    onPress={() => {
                        collectionRevision.current += 1;
                        if (active) {
                            setStage('idle');
                            setProgress(0);
                        } else {
                            setProgress(0);
                            setStage('discovering');
                        }
                    }}
                    testID="progress-transition-run"
                >
                    {active ? 'Cancelar simulación' : 'Iniciar transición'}
                </Button>
            </Surface>
            <Surface style={[card, { padding: 0, overflow: 'hidden' }]}>
                <ProgressIndicator accessibilityLabel="Carga del contenido de la tarjeta" progress={0.6} animated={false} />
                <View style={{ padding: 20, gap: 12 }}>
                    <Text variant="titleLarge">En el borde de una tarjeta</Text>
                    <Text>Un indicador representa la carga de todo el contenido de este contenedor.</Text>
                </View>
            </Surface>
            <Animated.View layout={expansion} style={{ overflow: 'hidden', borderRadius: theme.shapes.corner.large }}>
                <Surface style={[card, { padding: 0, gap: 0, overflow: 'hidden' }]}>
                    <View style={{ padding: 20, gap: 16 }}>
                        <Text variant="titleLarge">En un borde que se expande</Text>
                        <Button
                            mode="text"
                            disabled={article === 'loading'}
                            onPress={() => setArticle((value) => (value === 'ready' ? 'idle' : 'loading'))}
                            testID="progress-expand-card"
                        >
                            {article === 'loading' ? 'Abriendo…' : article === 'ready' ? 'Contraer artículo' : 'Abrir artículo'}
                        </Button>
                    </View>
                    {article === 'loading' ? <ProgressIndicator accessibilityLabel="Preparando artículo" animated={focused} /> : null}
                    {article === 'ready' ? (
                        <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
                            <Text variant="titleMedium">Contenido del artículo</Text>
                            <Text>
                                El indicador se coloca sobre el borde inferior del contenedor mientras se prepara el contenido. La tarjeta
                                se expande para mostrar el artículo cuando termina la carga.
                            </Text>
                        </View>
                    ) : null}
                </Surface>
            </Animated.View>
            <Surface style={card}>
                <Text variant="titleLarge">Centrado en el espacio del contenido</Text>
                <View style={{ minHeight: 140, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
                    {itemsLoaded ? (
                        <>
                            <Text variant="titleMedium">Contenido disponible</Text>
                            <Text>Primer elemento · Segundo elemento · Tercer elemento</Text>
                        </>
                    ) : loadingItems ? (
                        <>
                            <ProgressIndicator
                                variant="circular"
                                size={48}
                                animated={focused}
                                accessibilityLabel="Carga de los próximos elementos"
                            />
                            <Text>Cargando nuevos elementos…</Text>
                        </>
                    ) : (
                        <Text>Espacio reservado para nuevos elementos</Text>
                    )}
                </View>
                <Button
                    disabled={loadingItems}
                    mode="outlined"
                    onPress={() => {
                        setItemsLoaded(false);
                        setLoadingItems(true);
                    }}
                    testID="progress-load-items"
                >
                    {loadingItems ? 'Cargando…' : itemsLoaded ? 'Volver a cargar' : 'Cargar elementos'}
                </Button>
            </Surface>
            <Surface style={card}>
                <Text variant="titleLarge">Dentro de un botón</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    Indicador circular pequeño, sin pista y del mismo color que la etiqueta.
                </Text>
                <Button
                    accessibilityLabel={
                        saving ? 'Guardando cambios, en curso' : saved ? 'Cambios guardados, volver a guardar' : 'Guardar cambios'
                    }
                    disabled={saving}
                    icon={({ color }) => (
                        <View style={{ height: 24, width: 24, alignItems: 'center', justifyContent: 'center' }}>
                            {saving ? (
                                <ProgressIndicator
                                    variant="circular"
                                    size={24}
                                    thickness={3}
                                    color={typeof color === 'string' ? color : theme.colors.onPrimary}
                                    showTrack={false}
                                    animated={focused}
                                    accessibilityLabel="Guardando cambios"
                                />
                            ) : (
                                <Icon name={saved ? 'check' : 'content-save-outline'} color={color} size={24} />
                            )}
                        </View>
                    )}
                    onPress={() => {
                        setSaved(false);
                        setSaving(true);
                    }}
                    testID="progress-save-button"
                >
                    {saved ? 'Volver a guardar' : 'Guardar cambios'}
                </Button>
                <Text accessibilityLiveRegion="polite" variant="bodySmall">
                    {saving ? 'Guardando…' : saved ? 'Cambios guardados' : 'Listo para guardar'}
                </Text>
            </Surface>
        </View>
    );
}
