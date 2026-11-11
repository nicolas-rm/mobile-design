import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, FAB, NavigationBar, Portal, Snackbar, Text } from 'mobile-design/react-native';

type Example = 'single' | 'two' | 'action' | 'two-action' | 'long' | 'dismiss' | 'action-close' | 'save' | 'email' | 'update';
const row = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, alignItems: 'center' as const, gap: 8 };

/** One owner and one message surface, including the usage scenes. Never stacks notifications. */
export function SnackbarExamples() {
    const insets = useSafeAreaInsets();
    const [message, setMessage] = useState<Example | null>(null);
    const [messageKey, setMessageKey] = useState(0);
    const [duration, setDuration] = useState(4000);
    const [feedback, setFeedback] = useState('Todavía no hay operaciones.');
    const [archived, setArchived] = useState(false);
    const [saved, setSaved] = useState(false);
    const [update, setUpdate] = useState(0);
    const [placement, setPlacement] = useState<'default' | 'fab' | 'navigation' | 'start'>('default');
    const [destination, setDestination] = useState('photos');
    const show = (next: Example) => {
        setMessageKey((key) => key + 1);
        setMessage(next);
        if (['action', 'two-action', 'long', 'action-close', 'email'].includes(next)) {
            setArchived(true);
            setFeedback(
                next === 'email' ? 'Correo archivado. Puedes deshacer esta acción.' : 'Elemento archivado. Puedes deshacer esta acción.'
            );
        } else if (next === 'save') {
            setSaved(true);
            setFeedback('Todos los cambios están guardados.');
        } else if (next === 'update') {
            setUpdate((value) => value + 1);
            setFeedback('La información más reciente reemplaza el mensaje anterior.');
        } else setFeedback('Guardado en el álbum Vacaciones.');
    };
    const text =
        message === 'two'
            ? 'Se guardó una copia del documento.\nEstá disponible en tu biblioteca.'
            : message === 'long'
              ? 'Se archivó el documento.\nPuedes restaurarlo a la colección.'
              : message === 'two-action'
                ? 'Documento archivado.\nPuedes deshacerlo.'
                : message === 'email'
                  ? 'Correo archivado'
                  : message === 'action' || message === 'action-close'
                    ? 'Se archivó el elemento'
                    : message === 'save'
                      ? 'Todos los cambios están guardados'
                      : message === 'update'
                        ? `Información actualizada · ${update}`
                        : 'Guardado en el álbum Vacaciones';
    const actionable = message != null && ['action', 'two-action', 'long', 'action-close', 'email'].includes(message);
    const close = message === 'dismiss' || message === 'action-close';
    return (
        <View style={{ gap: 16, paddingBottom: 80 }}>
            <Text>Un mensaje a la vez. Una acción opcional, sin iconos decorativos ni botones de confirmación adicionales.</Text>
            <Text accessibilityLiveRegion="polite" testID="md-snackbar-feedback">
                {feedback}
            </Text>
            <Text testID="md-snackbar-item">Elemento: {archived ? 'Archivado' : 'Disponible'}</Text>
            <Text variant="titleMedium">Cinco configuraciones</Text>
            <Button style={{ alignSelf: 'flex-start' }} onPress={() => show('single')} testID="md-snackbar-open">
                Una línea
            </Button>
            <Button style={{ alignSelf: 'flex-start' }} variant="outlined" onPress={() => show('two')} testID="md-snackbar-two">
                Dos líneas
            </Button>
            <Button style={{ alignSelf: 'flex-start' }} variant="outlined" onPress={() => show('action')} testID="md-snackbar-action-open">
                Con Deshacer
            </Button>
            <Button
                style={{ alignSelf: 'flex-start' }}
                variant="outlined"
                onPress={() => show('two-action')}
                testID="md-snackbar-two-action"
            >
                Dos líneas con acción
            </Button>
            <Button style={{ alignSelf: 'flex-start' }} variant="outlined" onPress={() => show('long')} testID="md-snackbar-long">
                Acción en tercera línea
            </Button>
            <Text variant="titleMedium">Cierre opcional</Text>
            <View style={row}>
                <Button variant="outlined" onPress={() => show('dismiss')} testID="md-snackbar-dismiss-open">
                    Sólo cierre
                </Button>
                <Button variant="outlined" onPress={() => show('action-close')} testID="md-snackbar-action-close-open">
                    Deshacer y cierre
                </Button>
            </View>
            <Text variant="titleMedium">Tiempo de lectura</Text>
            <Text>
                Los mensajes con acción permanecen hasta actuar o cerrar. Los demás usan 4–10 segundos y respetan el plazo accesible del
                sistema.
            </Text>
            <View style={row}>
                {[4000, 7000, 10000].map((value) => (
                    <Button
                        key={value}
                        variant={duration === value ? 'tonal' : 'outlined'}
                        onPress={() => setDuration(value)}
                        testID={`md-snackbar-duration-${value}`}
                    >
                        {value / 1000} s
                    </Button>
                ))}
            </View>
            <Text variant="titleMedium">Guardar con resultado junto a la acción</Text>
            <Text>El resultado permanece aquí aunque desaparezca el mensaje.</Text>
            <Button style={{ alignSelf: 'flex-start' }} onPress={() => show('save')} testID="md-snackbar-save">
                {saved ? 'Guardado' : 'Guardar cambios'}
            </Button>
            <Text variant="titleMedium">Archivar correo y deshacer</Text>
            <Text>Estado del correo: {archived ? 'Archivado' : 'En Recibidos'}</Text>
            <Button style={{ alignSelf: 'flex-start' }} variant="tonal" onPress={() => show('email')} testID="md-snackbar-email">
                Archivar correo
            </Button>
            <Text variant="titleMedium">Mensajes consecutivos</Text>
            <Text>
                Actualizar sustituye la información anterior. Cada aviso reinicia su propio tiempo, incluso si repite el mismo texto.
            </Text>
            <Button style={{ alignSelf: 'flex-start' }} variant="outlined" onPress={() => show('update')} testID="md-snackbar-update">
                Actualizar información
            </Button>
            <Text variant="titleMedium">Colocación</Text>
            <Text>
                El mensaje se coloca sobre el contenido sin cubrir el FAB ni la navegación. Esos controles conservan su posición al aparecer
                o desaparecer el mensaje.
            </Text>
            <View style={row}>
                {(
                    [
                        ['default', 'Inferior centrado'],
                        ['start', 'Al inicio'],
                        ['fab', 'Sobre FAB'],
                        ['navigation', 'Sobre navegación'],
                    ] as const
                ).map(([value, label]) => (
                    <Button
                        key={value}
                        variant={placement === value ? 'tonal' : 'outlined'}
                        onPress={() => {
                            setPlacement(value);
                            show('single');
                        }}
                        testID={`md-snackbar-placement-${value}`}
                    >
                        {label}
                    </Button>
                ))}
            </View>
            <Text>
                Teclado: Alt+G enfoca la acción; Tab recorre los controles sin encerrar el foco. Escape cierra el mensaje y devuelve el foco
                al control anterior si sigue disponible.
            </Text>
            <Portal>
                {placement === 'fab' ? (
                    <FAB
                        icon="add"
                        accessibilityLabel="Añadir foto al álbum"
                        onPress={() => show('single')}
                        style={{ position: 'absolute', right: insets.right + 16, bottom: insets.bottom + 16 }}
                        testID="md-snackbar-context-fab"
                    />
                ) : null}
                {placement === 'navigation' ? (
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                        <NavigationBar
                            variant="standard"
                            items={[
                                { key: 'photos', label: 'Fotos', icon: 'photo', testID: 'md-snackbar-nav-photos' },
                                { key: 'albums', label: 'Álbumes', icon: 'photo_library', testID: 'md-snackbar-nav-albums' },
                                { key: 'share', label: 'Compartido', icon: 'group', testID: 'md-snackbar-nav-share' },
                            ]}
                            value={destination}
                            onValueChange={(value) => {
                                setDestination(value);
                                setFeedback(`Sección: ${value === 'photos' ? 'Fotos' : value === 'albums' ? 'Álbumes' : 'Compartido'}.`);
                            }}
                            accessibilityLabel="Álbumes de fotos"
                            testID="md-snackbar-context-navigation"
                        />
                    </View>
                ) : null}
                <Snackbar
                    visible={message != null}
                    messageKey={messageKey}
                    onDismiss={() => setMessage(null)}
                    duration={close ? Number.POSITIVE_INFINITY : duration}
                    inlineFeedback
                    bottomOffset={placement === 'fab' ? 72 : placement === 'navigation' ? 80 : 0}
                    wrapperStyle={placement === 'start' ? { alignItems: 'flex-start' } : undefined}
                    actionOnNewLine={message === 'long'}
                    onIconPress={close ? () => setFeedback('Mensaje cerrado. La operación se conserva.') : undefined}
                    action={
                        actionable
                            ? {
                                  label: message === 'long' ? 'Restaurar a la colección' : 'Deshacer',
                                  onPress: () => {
                                      setArchived(false);
                                      setFeedback('Elemento restaurado a la colección.');
                                  },
                              }
                            : undefined
                    }
                    testID="md-snackbar"
                >
                    {text}
                </Snackbar>
            </Portal>
        </View>
    );
}
