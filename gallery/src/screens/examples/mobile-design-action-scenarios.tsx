import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, View, type ColorValue } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import {
    Button,
    Dialog,
    FullScreenDialog,
    Icon,
    List,
    LoadingIndicator,
    ProgressIndicator,
    PullToRefresh,
    RadioButton,
    SegmentedButtons,
    Switch,
    Tabs,
    Text,
    TextField,
    useMobileTheme,
    type ContainerTransformOrigin,
} from 'mobile-design/react-native';
import { useDemoTask, type DemoTaskStatus } from './mobile-design-demo-task';

type Events = { onEvent: (message: string) => void };
function Row({ children }: { children: ReactNode }) {
    return <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>{children}</View>;
}
function Status({ status, error }: { status: DemoTaskStatus; error?: string }) {
    const theme = useMobileTheme();
    const message =
        status === 'cancelled' ? 'Operación cancelada.' : status === 'error' ? error : status === 'success' ? 'Contenido actualizado.' : '';
    return message ? (
        <Text accessibilityLiveRegion="polite" style={{ color: status === 'error' ? theme.colors.error : theme.colors.onSurfaceVariant }}>
            {message}
        </Text>
    ) : null;
}
function Result({ children, testID }: { children: ReactNode; testID: string }) {
    const theme = useMobileTheme();
    const opacity = useSharedValue(theme.animation.scale === 0 ? 1 : 0);
    useEffect(() => {
        cancelAnimation(opacity);
        const effects = theme.motion.spring.fast.effects;
        opacity.set(
            theme.animation.scale === 0
                ? 1
                : withSpring(1, {
                      stiffness: effects.stiffness,
                      damping: 2 * effects.damping * Math.sqrt(effects.stiffness),
                      overshootClamping: true,
                      reduceMotion: ReduceMotion.Never,
                  })
        );
        return () => cancelAnimation(opacity);
    }, [opacity, theme]);
    const fade = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, opacity.get())) }));
    return (
        <Animated.View style={[{ gap: 12 }, fade]} testID={testID}>
            <Row>
                <Icon source="check-circle" size={32} color={theme.colors.primary} />
                <Text variant="titleMedium" accessibilityLiveRegion="polite">
                    Carga completada
                </Text>
            </Row>
            {children}
        </Animated.View>
    );
}

/** M3 short-wait example: loading ends when replacement content is ready. */
export function LoadingSuccessExample({ onEvent }: Events) {
    const [fail, setFail] = useState(false);
    const [contained, setContained] = useState(false);
    const task = useDemoTask<string[]>();
    const start = () => {
        void task.run(async ({ wait }) => {
            await wait(2400);
            if (fail) throw new Error('No se pudo preparar el contenido. Cambia el resultado y vuelve a intentar.');
            return ['Preferencias listas', 'Biblioteca preparada', 'Dispositivo listo para continuar'];
        });
    };
    return (
        <View style={{ gap: 16 }}>
            <Text variant="titleMedium">Preparando tu dispositivo → listo</Text>
            <View style={{ minHeight: 184, justifyContent: 'center', gap: 12 }} testID="md-loading-replacement">
                {task.busy ? (
                    <View style={{ alignItems: 'center', gap: 16 }}>
                        <LoadingIndicator
                            variant={contained ? 'contained' : 'uncontained'}
                            accessibilityLabel="Preparando tu dispositivo"
                            testID="md-loading-working"
                        />
                        <Text>Preparando tu dispositivo…</Text>
                    </View>
                ) : task.status === 'success' ? (
                    <Result testID="md-loading-success">
                        {task.result?.map((item) => (
                            <List.Item key={item} title={item} leading={<Icon source="check" size={24} />} onPress={() => onEvent(item)} />
                        ))}
                    </Result>
                ) : (
                    <Text>El contenido aparecerá en este espacio cuando esté listo.</Text>
                )}
            </View>
            <Status status={task.status} error={task.error} />
            <Button style={{ alignSelf: 'flex-start' }} disabled={task.busy} onPress={start} testID="md-loading-start">
                {task.status === 'error' || task.status === 'cancelled'
                    ? 'Reintentar'
                    : task.status === 'success'
                      ? 'Cargar de nuevo'
                      : 'Preparar dispositivo'}
            </Button>
            <List.Accordion title="Configuración de la demostración">
                <View style={{ gap: 12, padding: 16 }}>
                    <SegmentedButtons
                        value={fail ? 'error' : 'success'}
                        onValueChange={(value) => setFail(value === 'error')}
                        buttons={[
                            { value: 'success', label: 'Éxito', disabled: task.busy },
                            { value: 'error', label: 'Error', disabled: task.busy },
                        ]}
                    />
                    <Row>
                        <Text>Sobre otro contenido</Text>
                        <Switch value={contained} onValueChange={setContained} accessibilityLabel="Usar indicador contenido" />
                    </Row>
                    <Button style={{ alignSelf: 'flex-start' }} variant="text" onPress={task.reset} testID="md-loading-reset">
                        Restablecer muestra
                    </Button>
                </View>
            </List.Accordion>
        </View>
    );
}

export function EmbeddedLoadingExample() {
    const task = useDemoTask<string>();
    return (
        <View style={{ gap: 16 }}>
            <Text variant="titleMedium">Indicador de carga dentro del botón</Text>
            <Row>
                <Button
                    iconSize={24}
                    loading={
                        task.busy
                            ? ({ size, color }) => (
                                  <LoadingIndicator size={size} color={color} accessibilityLabel="Comprobando actualizaciones" />
                              )
                            : false
                    }
                    icon={task.status === 'success' ? 'check' : 'update'}
                    onPress={() => {
                        void task.run(async ({ wait }) => {
                            await wait(1800);
                            return 'La aplicación está actualizada.';
                        });
                    }}
                    testID="md-loading-button"
                >
                    {task.busy ? 'Comprobando' : 'Buscar actualizaciones'}
                </Button>
            </Row>
            {task.status === 'success' ? (
                <Result testID="md-loading-button-success">
                    <Text>{task.result}</Text>
                </Result>
            ) : (
                <Status status={task.status} />
            )}
        </View>
    );
}

const initialItems = ['Colección del bosque', 'Arquitectura de la costa', 'Luz en el desierto'];
export function AppendLoadingExample() {
    const task = useDemoTask<string[]>();
    const items = [...initialItems, ...(task.result ?? [])];
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium">Más contenido al final de la lista</Text>
            {items.map((item, index) => (
                <List.Item
                    key={item}
                    title={item}
                    description={`Colección ${index + 1}`}
                    leading={<Icon source="folder-outline" size={24} />}
                />
            ))}
            {task.busy ? (
                <View style={{ height: 88, justifyContent: 'center', alignItems: 'center' }}>
                    <LoadingIndicator accessibilityLabel="Cargando las siguientes colecciones" testID="md-loading-append-working" />
                </View>
            ) : null}
            <Status status={task.status} />
            <Row>
                <Button
                    variant="outlined"
                    disabled={task.busy || task.status === 'success'}
                    onPress={() => {
                        void task.run(async ({ wait }) => {
                            await wait(2100);
                            return ['Escenas de la montaña', 'Recorridos por la ciudad', 'Ideas para el próximo viaje'];
                        });
                    }}
                    testID="md-loading-append"
                >
                    Cargar más
                </Button>
                {task.busy ? (
                    <Button variant="text" onPress={task.cancel}>
                        Cancelar carga
                    </Button>
                ) : (
                    <Button variant="text" onPress={task.reset}>
                        Restablecer lista
                    </Button>
                )}
            </Row>
        </View>
    );
}

export function TabLoadingExample() {
    const [tab, setTab] = useState('saved');
    const [pendingTab, setPendingTab] = useState('');
    const task = useDemoTask<{ key: string; items: string[] }>();
    const select = (next: string) => {
        setTab(next);
        setPendingTab(next);
        void task.run(async ({ wait }) => {
            await wait(2200);
            return {
                key: next,
                items:
                    next === 'saved'
                        ? ['Paseo por el bosque', 'Mirador de la costa']
                        : ['Archivo compartido', 'Nueva colección del equipo'],
            };
        });
    };
    const rows = task.result?.key === tab ? task.result.items : tab === 'saved' && task.status === 'idle' ? initialItems.slice(0, 2) : [];
    return (
        <View style={{ gap: 16 }}>
            <Text variant="titleMedium">Carga en el icono de una pestaña</Text>
            <Tabs
                value={tab}
                onValueChange={select}
                items={[
                    {
                        key: 'saved',
                        label: 'Guardado',
                        accessibilityLabel: task.busy && pendingTab === 'saved' ? 'Guardado, cargando contenido' : 'Guardado',
                        icon:
                            task.busy && pendingTab === 'saved'
                                ? ({ color }: { color: ColorValue }) => (
                                      <LoadingIndicator size={24} color={color} accessibilityLabel="Cargando guardados" />
                                  )
                                : 'bookmark-outline',
                    },
                    {
                        key: 'shared',
                        label: 'Compartido',
                        accessibilityLabel: task.busy && pendingTab === 'shared' ? 'Compartido, cargando contenido' : 'Compartido',
                        icon:
                            task.busy && pendingTab === 'shared'
                                ? ({ color }: { color: ColorValue }) => (
                                      <LoadingIndicator size={24} color={color} accessibilityLabel="Cargando compartidos" />
                                  )
                                : 'account-multiple-outline',
                    },
                ]}
                testID="md-loading-tabs"
            />
            <View style={{ minHeight: 160 }} accessibilityLiveRegion="polite" testID="md-loading-tab-content">
                {rows.map((item) => (
                    <List.Item key={item} title={item} leading={<Icon source="file-outline" size={24} />} />
                ))}
                {task.busy ? <Text>Cargando {tab === 'saved' ? 'guardados' : 'compartidos'}…</Text> : null}
            </View>
            <Row>
                <Button variant="outlined" disabled={task.busy} onPress={() => select(tab)}>
                    Actualizar pestaña
                </Button>
                {task.busy ? (
                    <Button variant="text" onPress={task.cancel}>
                        Cancelar
                    </Button>
                ) : null}
            </Row>
            <Status status={task.status} />
        </View>
    );
}

export function ProgressTaskExample(_props: Partial<Events> = {}) {
    const task = useDemoTask<string[]>();
    const start = () => {
        void task.run(async ({ wait, report }) => {
            await wait(900); // Discover the total first; this phase has unknown progress.
            const result: string[] = [];
            report(0, 6);
            for (let index = 0; index < 6; index++) {
                await wait(1000);
                result.push(`Archivo ${index + 1}.pdf`);
                report(result.length, 6);
            }
            return result;
        });
    };
    return (
        <View style={{ gap: 16 }}>
            <Text variant="titleMedium">Preparar e importar seis archivos</Text>
            {task.busy ? (
                <>
                    <ProgressIndicator
                        variant="linear"
                        appearance="wavy"
                        progress={task.progress}
                        accessibilityLabel="Progreso de importación"
                        testID="md-progress-task-indicator"
                    />
                    <Text accessibilityLiveRegion="polite">
                        {task.progress == null ? 'Preparando la importación…' : `${Math.round(task.progress * 6)} de 6 archivos importados`}
                    </Text>
                </>
            ) : null}
            {task.status === 'success' ? (
                <Result testID="md-progress-task-success">
                    {task.result?.map((file) => (
                        <List.Item key={file} title={file} leading={<Icon source="file-check-outline" size={24} />} />
                    ))}
                </Result>
            ) : null}
            <Status status={task.status} error={task.error} />
            <Row>
                <Button disabled={task.busy} onPress={start} testID="md-progress-task-start">
                    {task.status === 'idle' ? 'Importar archivos' : 'Importar de nuevo'}
                </Button>
                {task.busy ? (
                    <Button variant="text" onPress={task.cancel}>
                        Cancelar importación
                    </Button>
                ) : null}
            </Row>
        </View>
    );
}

/** Full-bleed playground: its refresh case owns the only vertical scroll view. */
export function LoadingPlayground({ onEvent }: Events) {
    const insets = useSafeAreaInsets();
    const [mode, setMode] = useState('success');
    const [adjacent, setAdjacent] = useState(false);
    const task = useDemoTask<string[]>();
    const refresh = () => {
        void task.run(async ({ wait }) => {
            await wait(2200);
            return ['Colección recién actualizada', 'Últimas notas del equipo'];
        });
    };
    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                horizontal
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ padding: 16, gap: 8 }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                {[
                    { key: 'success', label: 'Carga y éxito' },
                    { key: 'button', label: 'En botón' },
                    { key: 'append', label: 'Añadir' },
                    { key: 'tabs', label: 'Pestaña' },
                    { key: 'refresh', label: 'Deslizar' },
                ].map((item) => (
                    <Button
                        key={item.key}
                        selected={mode === item.key}
                        variant="tonal"
                        onPress={() => {
                            task.cancel();
                            setMode(item.key);
                        }}
                        testID={`md-loading-mode-${item.key}`}
                    >
                        {item.label}
                    </Button>
                ))}
            </ScrollView>
            {mode === 'refresh' ? (
                <>
                    <View style={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}>
                        <SegmentedButtons
                            value={adjacent ? 'adjacent' : 'overlay'}
                            onValueChange={(value) => setAdjacent(value === 'adjacent')}
                            buttons={[
                                { value: 'overlay', label: 'Sobre contenido' },
                                { value: 'adjacent', label: 'Junto al contenido' },
                            ]}
                        />
                        <Text variant="bodySmall">
                            Desliza hacia abajo desde el inicio. Superar el umbral y soltar actualiza; regresar antes de soltar cancela.
                        </Text>
                        <Row>
                            <Button variant="text" disabled={task.busy} onPress={refresh} testID="md-refresh-accessible">
                                Actualizar
                            </Button>
                            {task.busy ? (
                                <Button variant="text" onPress={task.cancel}>
                                    Cancelar actualización
                                </Button>
                            ) : null}
                        </Row>
                        <Status status={task.status} />
                    </View>
                    <PullToRefresh
                        refreshing={task.busy}
                        onRefresh={refresh}
                        indicatorMode={adjacent ? 'adjacent' : 'overlay'}
                        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
                        testID="md-loading-refresh"
                    >
                        {[...(task.result ?? []), ...Array.from({ length: 24 }, (_, index) => `Colección ${index + 1}`)].map(
                            (item, index) => (
                                <List.Item
                                    key={`${item}-${index}`}
                                    title={item}
                                    description="Contenido de la biblioteca"
                                    leading={<Icon source="folder-outline" size={24} />}
                                    onPress={() => onEvent(item)}
                                />
                            )
                        )}
                    </PullToRefresh>
                </>
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 24, paddingBottom: 24 + insets.bottom, gap: 24 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    {mode === 'success' ? (
                        <LoadingSuccessExample onEvent={onEvent} />
                    ) : mode === 'button' ? (
                        <EmbeddedLoadingExample />
                    ) : mode === 'append' ? (
                        <AppendLoadingExample />
                    ) : (
                        <TabLoadingExample />
                    )}
                </ScrollView>
            )}
        </View>
    );
}

type WorkspaceKind = 'compose' | 'share' | 'files' | 'schedule' | 'preview' | 'event' | 'contact';
/** Concrete local destinations shared by action-token examples, not app navigation. */
export function useActionWorkspace(onEvent: Events['onEvent']) {
    const [target, setTarget] = useState<{ kind: WorkspaceKind; title: string; detail?: { title: string; body: string } } | null>(null);
    const [editorSnapshot, setEditorSnapshot] = useState<{ kind: WorkspaceKind; title: string } | null>(null);
    const [editorTransitionOrigin, setEditorTransitionOrigin] = useState<ContainerTransformOrigin>();
    const [title, setTitle] = useState('Notas de diseño');
    const [body, setBody] = useState('Explora los componentes de Material 3.');
    const [document, setDocument] = useState({ title, body });
    const [editorInitial, setEditorInitial] = useState({ title, body });
    const [choice, setChoice] = useState('Equipo de diseño');
    const [entries, setEntries] = useState<string[]>([]);
    const [details, setDetails] = useState<Record<string, { title: string; body: string }>>({});
    const [discard, setDiscard] = useState(false);
    const commit = (message: string, detail = document) => {
        setEntries((items) => [message, ...items].slice(0, 4));
        setDetails((previous) => ({ ...previous, [message]: detail }));
        setTarget(null);
        onEvent(message);
    };
    const open = (kind: WorkspaceKind, label: string, transitionOrigin?: ContainerTransformOrigin) => {
        const initial = {
            title: kind === 'contact' ? 'Nuevo contacto' : kind === 'event' ? 'Nuevo evento' : document.title,
            body: kind === 'contact' ? 'persona@ejemplo.com' : kind === 'event' ? 'Mañana a las 9:00 · Sala de diseño' : document.body,
        };
        if (kind === 'compose' || kind === 'event' || kind === 'contact') {
            setTitle(initial.title);
            setBody(initial.body);
            setEditorInitial(initial);
            setEditorSnapshot({ kind, title: label });
            setEditorTransitionOrigin(transitionOrigin);
        }
        setChoice(kind === 'schedule' ? 'Mañana a las 9:00' : 'Equipo de diseño');
        setTarget({ kind, title: label, detail: details[label] });
    };
    const dismissEditor = () => {
        if (title !== editorInitial.title || body !== editorInitial.body) setDiscard(true);
        else setTarget(null);
    };
    const isEditor = target?.kind === 'compose' || target?.kind === 'event' || target?.kind === 'contact';
    const panel = (
        <View style={{ gap: 12 }}>
            {entries.length ? (
                <>
                    <Text variant="titleMedium">Actividad de este ejemplo</Text>
                    {entries.map((entry, index) => (
                        <List.Item
                            key={`${entry}-${index}`}
                            title={entry}
                            leading={<Icon source="check-circle-outline" size={24} />}
                            onPress={() => open('preview', entry)}
                        />
                    ))}
                </>
            ) : null}
            <FullScreenDialog
                visible={isEditor}
                title={editorSnapshot?.title ?? 'Redactar'}
                transitionOrigin={editorTransitionOrigin}
                onClosed={() => {
                    setEditorSnapshot(null);
                    setEditorTransitionOrigin(undefined);
                }}
                onDismiss={dismissEditor}
                onConfirm={() => {
                    const detail = { title: title.trim() || 'Sin título', body };
                    if (editorSnapshot?.kind === 'compose') setDocument(detail);
                    commit(
                        `${editorSnapshot?.kind === 'contact' ? 'Contacto creado' : editorSnapshot?.kind === 'event' ? 'Evento creado' : 'Guardado'}: ${detail.title}`,
                        detail
                    );
                }}
                testID="md-action-editor"
            >
                <View style={{ gap: 24 }}>
                    <TextField
                        variant="outlined"
                        label={
                            editorSnapshot?.kind === 'contact'
                                ? 'Nombre'
                                : editorSnapshot?.kind === 'event'
                                  ? 'Nombre del evento'
                                  : 'Título'
                        }
                        value={title}
                        onChangeText={setTitle}
                        testID="md-action-title"
                    />
                    <TextField
                        variant="outlined"
                        label={
                            editorSnapshot?.kind === 'contact'
                                ? 'Correo electrónico'
                                : editorSnapshot?.kind === 'event'
                                  ? 'Fecha, hora y lugar'
                                  : 'Contenido'
                        }
                        multiline
                        value={body}
                        onChangeText={setBody}
                        testID="md-action-body"
                    />
                </View>
            </FullScreenDialog>
            <Dialog visible={discard} onDismiss={() => setDiscard(false)} testID="md-action-discard">
                <Dialog.Title>¿Descartar los cambios?</Dialog.Title>
                <Dialog.Content>El documento aún no está guardado.</Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setDiscard(false)}>
                        Seguir editando
                    </Button>
                    <Button
                        variant="text"
                        onPress={() => {
                            setDiscard(false);
                            setTarget(null);
                        }}
                    >
                        Descartar
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <Dialog visible={target != null && !isEditor} onDismiss={() => setTarget(null)} testID="md-action-destination">
                <Dialog.Title>{target?.title}</Dialog.Title>
                <Dialog.Content>
                    {target?.kind === 'share' || target?.kind === 'schedule' ? (
                        <RadioButton.Group value={choice} onValueChange={setChoice}>
                            {(target.kind === 'share'
                                ? ['Equipo de diseño', 'Equipo de desarrollo', 'Sólo yo']
                                : ['Mañana a las 9:00', 'Viernes a las 12:00', 'Próxima semana']
                            ).map((label) => (
                                <RadioButton.Item key={label} value={label} label={label} />
                            ))}
                        </RadioButton.Group>
                    ) : target?.kind === 'files' ? (
                        <View>
                            {(target.title.toLocaleLowerCase().match(/imagen|foto/)
                                ? ['Fotografía.jpg', 'Paisaje.jpg', 'Portada.jpg']
                                : ['Documento.pdf', 'Fotografía.jpg', 'Notas.txt']
                            ).map((file) => (
                                <List.Item
                                    key={file}
                                    title={file}
                                    leading={<Icon source={file.endsWith('.jpg') ? 'image-outline' : 'file-outline'} size={24} />}
                                    onPress={() =>
                                        commit(`Adjunto: ${file}`, {
                                            title: file,
                                            body: 'Archivo seleccionado de la biblioteca local de este ejemplo.',
                                        })
                                    }
                                    testID={`md-action-file-${file}`}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={{ gap: 16 }}>
                            <Text variant="titleMedium">{target?.detail?.title ?? document.title}</Text>
                            <Text>{target?.detail?.body ?? document.body}</Text>
                        </View>
                    )}
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setTarget(null)}>
                        {target?.kind === 'preview' ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {target?.kind === 'share' || target?.kind === 'schedule' ? (
                        <Button
                            variant="text"
                            onPress={() =>
                                commit(target.kind === 'share' ? `Copia compartida con ${choice}` : `Envío programado: ${choice}`)
                            }
                        >
                            {target.kind === 'share' ? 'Compartir copia' : 'Programar'}
                        </Button>
                    ) : null}
                </Dialog.Actions>
            </Dialog>
        </View>
    );
    return { open, save: () => commit(`Guardado: ${document.title}`), document, panel, editorTransitionOrigin };
}
