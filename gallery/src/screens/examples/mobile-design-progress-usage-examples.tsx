import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { Button, Card, Icon, List, ProgressIndicator, Text, useMobileTheme } from 'mobile-design/react-native';
import { useDemoTask } from './mobile-design-demo-task';

function Example({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium">{title}</Text>
            {children}
        </View>
    );
}

function ButtonProgressExample() {
    const task = useDemoTask<string>();
    return (
        <Example title="Circular dentro de un botón">
            <Button
                style={{ alignSelf: 'flex-start' }}
                loading={task.busy}
                icon={task.status === 'success' ? 'check' : 'content-save'}
                onPress={() => {
                    void task.run(async ({ wait }) => {
                        await wait(1800);
                        return 'Los cambios se guardaron.';
                    });
                }}
                accessibilityLabel={task.busy ? 'Guardando cambios' : 'Guardar cambios'}
                testID="md-progress-button"
            >
                {task.busy ? 'Guardando' : 'Guardar cambios'}
            </Button>
            {task.status === 'success' ? (
                <Text accessibilityLiveRegion="polite">{task.result}</Text>
            ) : task.status === 'cancelled' ? (
                <Text>El guardado se canceló al salir. Puedes reintentarlo.</Text>
            ) : (
                <Text variant="bodySmall">La acción usa un circular pequeño sin pista y del mismo color que la etiqueta.</Text>
            )}
        </Example>
    );
}

const article = [
    'El bosque cambia a lo largo del recorrido: la luz, el relieve y la vegetación permiten reconocer cada zona.',
    'La primera sección reúne los puntos de observación y las rutas disponibles para una visita breve.',
    'La segunda sección describe los recorridos largos y las áreas donde conviene detenerse.',
];

function ExpandingCardProgressExample() {
    const task = useDemoTask<string[]>();
    const theme = useMobileTheme();
    const spring = theme.motion.spring.default.spatial;
    const expansion = useMemo(
        () =>
            theme.animation.scale === 0
                ? undefined
                : LinearTransition.springify()
                      .mass(1)
                      .stiffness(spring.stiffness)
                      .damping(2 * spring.damping * Math.sqrt(spring.stiffness))
                      .reduceMotion(ReduceMotion.Never),
        [spring.stiffness, spring.damping, theme.animation.scale]
    );
    const start = () => {
        void task.run(async ({ wait, report }) => {
            const paragraphs: string[] = [];
            report(0, article.length);
            for (const paragraph of article) {
                await wait(2200);
                paragraphs.push(paragraph);
                report(paragraphs.length, article.length);
            }
            return paragraphs;
        });
    };
    return (
        <Example title="En el borde que se expande">
            <Animated.View layout={expansion} style={{ overflow: 'hidden', borderRadius: 12 }} testID="md-progress-expanding-region">
                <Card
                    variant="filled"
                    onPress={task.busy || task.status === 'success' ? undefined : start}
                    accessibilityLabel={task.status === 'success' ? 'Informe del bosque' : 'Abrir informe del bosque'}
                    accessibilityState={{ busy: task.busy }}
                    testID="md-progress-expanding-card"
                >
                    <Card.Content style={{ paddingVertical: 16, gap: 12 }}>
                        <Text variant="titleLarge">Informe del bosque</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            {task.busy
                                ? `Preparando ${Math.round((task.progress ?? 0) * article.length)} de ${article.length} secciones…`
                                : task.status === 'success'
                                  ? 'Informe preparado'
                                  : task.status === 'cancelled'
                                    ? 'La preparación se canceló al salir. Toca para reintentar.'
                                    : 'Toca la tarjeta para preparar y abrir el informe.'}
                        </Text>
                        {task.status === 'success' ? (
                            <View style={{ gap: 12 }} testID="md-progress-expanded-content">
                                {task.result?.map((paragraph) => (
                                    <Text key={paragraph} variant="bodyMedium">
                                        {paragraph}
                                    </Text>
                                ))}
                            </View>
                        ) : null}
                    </Card.Content>
                    {task.busy ? (
                        <ProgressIndicator
                            variant="linear"
                            appearance="flat"
                            progress={task.progress ?? 0}
                            accessibilityLabel="Preparación del informe"
                            testID="md-progress-card-edge"
                        />
                    ) : null}
                </Card>
            </Animated.View>
        </Example>
    );
}

const collections = ['Bosque', 'Costa', 'Desierto'];

function CenteredProgressExample() {
    const task = useDemoTask<string[]>();
    const start = () => {
        void task.run(async ({ wait, report }) => {
            const ready: string[] = [];
            report(0, collections.length);
            for (const collection of collections) {
                await wait(2100);
                ready.push(collection);
                report(ready.length, collections.length);
            }
            return ready;
        });
    };
    return (
        <Example title="Centrado y reemplazo de contenido">
            <View style={{ minHeight: 184, justifyContent: 'center' }} testID="md-progress-replacement-region">
                {task.busy ? (
                    <View style={{ alignItems: 'center', gap: 16 }}>
                        <ProgressIndicator
                            variant="circular"
                            appearance="wavy"
                            size={48}
                            progress={task.progress ?? 0}
                            accessibilityLabel="Preparación de colecciones"
                            testID="md-progress-centered-indicator"
                        />
                        <Text>Preparando las colecciones…</Text>
                    </View>
                ) : task.status === 'success' ? (
                    <View testID="md-progress-replacement-content">
                        {task.result?.map((collection) => (
                            <List.Item key={collection} title={collection} leading={<Icon source="folder" size={24} />} />
                        ))}
                    </View>
                ) : (
                    <Text>
                        {task.status === 'cancelled'
                            ? 'La preparación se canceló al salir.'
                            : 'Las colecciones aparecerán aquí cuando estén listas.'}
                    </Text>
                )}
            </View>
            <Button
                style={{ alignSelf: 'flex-start' }}
                variant="outlined"
                disabled={task.busy}
                onPress={start}
                testID="md-progress-load-centered"
            >
                {task.status === 'success' ? 'Actualizar colecciones' : 'Preparar colecciones'}
            </Button>
        </Example>
    );
}

function AppendProgressExample() {
    const task = useDemoTask<string[]>();
    const initial = ['Cuaderno del bosque', 'Cuaderno de la costa', 'Cuaderno del desierto'];
    const start = () => {
        void task.run(async ({ wait, report }) => {
            const ready: string[] = [];
            const next = ['Cuaderno de la montaña', 'Cuaderno de la ciudad', 'Cuaderno del valle'];
            report(0, next.length);
            for (const item of next) {
                await wait(2100);
                ready.push(item);
                report(ready.length, next.length);
            }
            return ready;
        });
    };
    return (
        <Example title="En el espacio de los próximos elementos">
            <View testID="md-progress-append-existing">
                {initial.map((item) => (
                    <List.Item key={item} title={item} leading={<Icon source="book-outline" size={24} />} />
                ))}
            </View>
            {task.busy ? (
                <View style={{ minHeight: 88, alignItems: 'center', justifyContent: 'center' }} testID="md-progress-append-space">
                    <ProgressIndicator
                        variant="circular"
                        appearance="flat"
                        size={48}
                        progress={task.progress ?? 0}
                        accessibilityLabel="Preparación de los próximos cuadernos"
                        testID="md-progress-append-indicator"
                    />
                </View>
            ) : null}
            {task.status === 'success' ? (
                <View testID="md-progress-appended-content">
                    {task.result?.map((item) => (
                        <List.Item key={item} title={item} leading={<Icon source="book-outline" size={24} />} />
                    ))}
                </View>
            ) : null}
            <Button
                style={{ alignSelf: 'flex-start' }}
                variant="outlined"
                disabled={task.busy || task.status === 'success'}
                onPress={start}
                testID="md-progress-load-more"
            >
                {task.status === 'success' ? 'Todos los cuadernos cargados' : 'Cargar más cuadernos'}
            </Button>
        </Example>
    );
}

/**
 * https://m3.material.io/components/progress-indicators/guidelines
 * One indicator per independent task. Durations simulate local work, not motion tokens.
 */
export function ProgressUsageExamples() {
    return (
        <View style={{ gap: 32 }}>
            <ButtonProgressExample />
            <ExpandingCardProgressExample />
            <CenteredProgressExample />
            <AppendProgressExample />
        </View>
    );
}
