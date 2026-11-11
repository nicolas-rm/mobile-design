import { useCallback, useState } from 'react';
import { View, type ColorValue } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
    Button,
    FullScreenDialog,
    Text,
    TextField,
    Icon,
    IconButton,
    Menu,
    Toolbar,
    useMobileTheme,
    type ToolbarAction,
} from 'mobile-design/react-native';
type Scenario = 'mail' | 'editor' | 'collapse';
const titles = { mail: 'Meetup photos', editor: 'Project plan', collapse: 'Notas del proyecto' };
export function ToolbarUsageExamples({ onEvent }: { onEvent: (message: string) => void }) {
    const [scenario, setScenario] = useState<Scenario | null>(null);
    const [retained, setRetained] = useState<Scenario>('mail');
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium">Ejemplos en acción</Text>
            <Text>
                Correo con acciones globales, edición contextual y colapso al desplazar. Cada ejemplo conserva una sola barra inferior.
            </Text>
            {(['mail', 'editor', 'collapse'] as const).map((key) => (
                <Button
                    key={key}
                    variant="outlined"
                    icon="open_in_new"
                    onPress={() => {
                        setRetained(key);
                        setScenario(key);
                    }}
                    testID={'catalog-toolbar-open-' + key}
                >
                    {key === 'mail' ? 'Correo · Docked' : key === 'editor' ? 'Documento · Floating' : 'Scroll · Toolbar y FAB'}
                </Button>
            ))}
            <FullScreenDialog
                visible={scenario !== null}
                title={titles[retained]}
                scrollable={false}
                onDismiss={() => setScenario(null)}
                testID="catalog-toolbar-usage"
            >
                <ToolbarTask key={retained} scenario={retained} onEvent={onEvent} />
            </FullScreenDialog>
        </View>
    );
}
function ToolbarTask({ scenario, onEvent }: { scenario: Scenario; onEvent: (message: string) => void }) {
    const theme = useMobileTheme();
    const [selected, setSelected] = useState<string[]>([]);
    const [status, setStatus] = useState('Sin cambios');
    const [expanded, setExpanded] = useState(true);
    const [revision, setRevision] = useState(0);
    const [removed, setRemoved] = useState(false);
    const [palette, setPalette] = useState<'text' | 'fill' | null>(null);
    const [ink, setInk] = useState(theme.colors.onSurface);
    const [fill, setFill] = useState<ColorValue>('transparent');
    const [attached, setAttached] = useState(false);
    const [notes, setNotes] = useState<string[]>([]);
    const lastY = useSharedValue(0),
        distance = useSharedValue(0),
        desired = useSharedValue(true);
    const report = useCallback((next: boolean) => setExpanded(next), []);
    const scroll = useAnimatedScrollHandler((event) => {
        const y = Math.max(0, event.contentOffset.y),
            delta = y - lastY.get();
        lastY.set(y);
        if (Math.abs(delta) < 0.5) return;
        if (Math.sign(delta) !== Math.sign(distance.get())) distance.set(0);
        distance.set(distance.get() + delta);
        if (y <= 0 || Math.abs(distance.get()) >= 40) {
            const next = y <= 0 || delta < 0;
            if (next !== desired.get()) {
                desired.set(next);
                scheduleOnRN(report, next);
            }
            distance.set(0);
        }
    });
    const action = (key: string, icon: string, label: string, toggle = true): ToolbarAction => ({
        key,
        icon,
        label,
        selected: toggle ? selected.includes(key) : undefined,
        disabled: scenario === 'mail' && removed,
        onPress: () => {
            if (toggle) setSelected((current) => (current.includes(key) ? current.filter((value) => value !== key) : [...current, key]));
            if (scenario === 'mail' && ['archive', 'delete'].includes(key)) setRemoved(true);
            if (key === 'photo') setAttached(true);
            setStatus(label);
            onEvent(label);
        },
    });
    const mail: ToolbarAction[] = [
        action('archive', 'archive', 'Correo archivado', false),
        action('delete', 'delete', 'Correo eliminado', false),
        action('unread', 'mark_email_unread', 'Marcado sin leer', false),
        action('snooze', 'snooze', 'Correo pospuesto', false),
        action('star', 'star', 'Destacar correo'),
    ];
    const tools =
        scenario === 'mail'
            ? mail
            : scenario === 'editor'
              ? [
                    action('bold', 'format_bold', 'Negrita'),
                    action('italic', 'format_italic', 'Cursiva'),
                    action('underline', 'format_underlined', 'Subrayado'),
                ]
              : [
                    action('check', 'check_box', 'Lista de tareas'),
                    action('brush', 'brush', 'Dibujar'),
                    action('mic', 'mic', 'Nota de voz'),
                    action('photo', 'image', 'Adjuntar imagen'),
                ];
    const floating = scenario !== 'mail';
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID={'catalog-toolbar-task-' + scenario}>
            <Animated.ScrollView
                style={{ flex: 1, minHeight: 0 }}
                onScroll={scroll}
                scrollEventThrottle={16}
                testID={'catalog-toolbar-scroll-' + scenario}
                contentContainerStyle={{ padding: 24, paddingBottom: 160, gap: 20 }}
            >
                <Text variant="headlineMedium">{titles[scenario]}</Text>
                {scenario === 'mail' && <Text variant="labelLarge">De: Alex · Para: Equipo</Text>}
                <Text testID="catalog-toolbar-task-result" accessibilityLiveRegion="polite">
                    {status} · revisión {revision}
                </Text>
                <Text testID="catalog-toolbar-scroll-state">{expanded ? 'Controles expandidos' : 'Controles contraídos'}</Text>
                {removed && <Text testID="catalog-toolbar-mail-removed">Este mensaje ya no está en Recibidos.</Text>}
                {attached && (
                    <View style={{ padding: 24, backgroundColor: theme.colors.surfaceContainer }}>
                        <Icon source="image" size={48} />
                        <Text>Imagen adjunta al ejemplo.</Text>
                    </View>
                )}
                {notes.map((note, index) => (
                    <TextField
                        key={index}
                        label={'Nota ' + (index + 1)}
                        value={note}
                        onChangeText={(text) => setNotes((current) => current.map((value, i) => (i === index ? text : value)))}
                        testID={'catalog-toolbar-added-note-' + index}
                    />
                ))}
                {!removed &&
                    Array.from({ length: 24 }, (_, index) => (
                        <Text
                            key={index}
                            variant="bodyLarge"
                            style={{
                                color: ink,
                                backgroundColor: fill,
                                fontWeight: selected.includes('bold') ? '700' : '400',
                                fontStyle: selected.includes('italic') ? 'italic' : 'normal',
                                textDecorationLine: selected.includes('underline') ? 'underline' : 'none',
                            }}
                        >
                            {scenario === 'mail'
                                ? 'Compartimos las fotos y los acuerdos de la reunión. Las acciones se aplican al mensaje abierto.'
                                : 'Organizamos las tareas del proyecto y revisamos el contenido del documento. Desplaza para comprobar el comportamiento de las herramientas.'}{' '}
                            {index + 1}.
                        </Text>
                    ))}
            </Animated.ScrollView>
            <Toolbar
                actions={tools}
                variant={floating ? 'floating' : 'docked'}
                color={scenario === 'editor' ? 'vibrant' : 'standard'}
                safeArea={false}
                visible={scenario === 'editor' ? expanded : true}
                expanded={expanded}
                trailing={
                    scenario === 'editor' ? (
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                            {(['text', 'fill'] as const).map((kind) => (
                                <Menu
                                    key={kind}
                                    visible={palette === kind}
                                    onDismiss={() => setPalette(null)}
                                    anchor={
                                        <IconButton
                                            icon={kind === 'text' ? 'format_color_text' : 'format_color_fill'}
                                            accessibilityLabel={kind === 'text' ? 'Color de texto' : 'Color de fondo'}
                                            iconColor={theme.colors.onPrimaryContainer}
                                            onPress={() => setPalette(kind)}
                                            testID={'catalog-toolbar-palette-' + kind}
                                        />
                                    }
                                >
                                    {[
                                        { label: 'Predeterminado', color: kind === 'text' ? theme.colors.onSurface : 'transparent' },
                                        { label: 'Principal', color: theme.colors.primary },
                                        { label: 'Contenedor', color: theme.colors.secondaryContainer },
                                    ].map(({ label, color }) => (
                                        <Menu.Item
                                            key={label}
                                            title={label}
                                            onPress={() => {
                                                if (kind === 'text') setInk(color);
                                                else setFill(color);
                                                setPalette(null);
                                                setStatus(label);
                                            }}
                                            testID={'catalog-toolbar-color-' + kind + '-' + label}
                                        />
                                    ))}
                                </Menu>
                            ))}
                        </View>
                    ) : undefined
                }
                fab={
                    scenario === 'collapse'
                        ? {
                              key: 'save',
                              icon: 'add',
                              label: 'Agregar nota',
                              onPress: () => {
                                  setRevision((value) => value + 1);
                                  setNotes((current) => [...current, '']);
                                  setStatus('Nota añadida');
                                  onEvent('Nota añadida');
                              },
                          }
                        : undefined
                }
                style={floating ? { position: 'absolute', left: 0, right: 0, bottom: 0 } : undefined}
                accessibilityLabel={scenario === 'mail' ? 'Acciones del mensaje' : 'Herramientas del documento'}
                testID={'catalog-toolbar-task-bar-' + scenario}
            />
        </View>
    );
}
