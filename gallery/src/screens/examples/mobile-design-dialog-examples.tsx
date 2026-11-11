import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Avatar, Button, Dialog, FullScreenDialog, List, Menu, RadioButton, Text, TextField } from 'mobile-design/react-native';

const sounds = [
    'Ninguno',
    'Aurora',
    'Bambú',
    'Brisa',
    'Campanas',
    'Cristal',
    'Destello',
    'Eco',
    'Horizonte',
    'Lluvia',
    'Marimba',
    'Olas',
    'Piano',
    'Viento',
];
/** Confirmations commit a draft; simple-choice dialogs commit the chosen row. */
export function DialogExamples({ onEvent }: { onEvent: (message: string) => void }) {
    const [dialog, setDialog] = useState<'delete' | 'account' | 'sound' | 'full' | 'ack' | 'body' | 'error' | 'positioned' | null>(null);
    const [removed, setRemoved] = useState(false),
        [account, setAccount] = useState('Ana López');
    const [sound, setSound] = useState('Aurora'),
        [draftSound, setDraftSound] = useState(sound);
    const [name, setName] = useState(''),
        [saved, setSaved] = useState(''),
        [collection, setCollection] = useState('Personal'),
        [savedCollection, setSavedCollection] = useState('Personal');
    const [nameError, setNameError] = useState(false);
    const [discard, setDiscard] = useState(false),
        [menu, setMenu] = useState(false);
    const [offline, setOffline] = useState(false),
        [copySaved, setCopySaved] = useState(false);
    const saveCopy = () => {
        if (offline) setDialog('error');
        else {
            setCopySaved(true);
            setDialog(null);
            onEvent('Copia local guardada.');
        }
    };
    const closeEditor = () => (name !== saved || collection !== savedCollection ? setDiscard(true) : setDialog(null));
    return (
        <View style={{ gap: 16 }}>
            <Text variant="titleMedium">Posición adaptable</Text>
            <Button
                variant="outlined"
                style={{ alignSelf: 'flex-start' }}
                onPress={() => setDialog('positioned')}
                testID="md-dialog-position-open"
            >
                Ver posición lateral
            </Button>
            <Dialog
                visible={dialog === 'positioned'}
                onDismiss={() => setDialog(null)}
                position={{ horizontal: 'end' }}
                testID="md-dialog-positioned"
            >
                <Dialog.Title>Referencia de la colección</Dialog.Title>
                <Dialog.Content>
                    En ventanas amplias, el diálogo puede situarse hacia el final y conserva56dp de margen exterior. En ventanas compactas
                    ocupa el ancho disponible.
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setDialog(null)}>
                        Entendido
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <Text variant="titleMedium">Confirmación con icono</Text>
            <Text>Proyecto: {removed ? 'Eliminado' : 'Referencias de diseño'}</Text>
            <Button
                style={{ alignSelf: 'flex-start' }}
                icon="delete-outline"
                disabled={removed}
                onPress={() => setDialog('delete')}
                testID="md-dialog-open"
            >
                Eliminar proyecto
            </Button>
            <Dialog visible={dialog === 'delete'} onDismiss={() => setDialog(null)} testID="md-dialog">
                <Dialog.Icon icon="delete-outline" />
                <Dialog.Title>¿Eliminar el proyecto?</Dialog.Title>
                <Dialog.Content>
                    <Text>Se eliminará “Referencias de diseño” de esta colección.</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setDialog(null)} testID="md-dialog-cancel">
                        Cancelar
                    </Button>
                    <Button
                        variant="text"
                        onPress={() => {
                            setRemoved(true);
                            setDialog(null);
                            onEvent('Proyecto eliminado de la colección.');
                        }}
                        testID="md-dialog-confirm"
                    >
                        Eliminar
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <Text variant="titleMedium">Selección simple</Text>
            <Button
                style={{ alignSelf: 'flex-start' }}
                variant="outlined"
                onPress={() => setDialog('account')}
                testID="md-dialog-account-open"
            >
                Cuenta: {account}
            </Button>
            <Dialog visible={dialog === 'account'} onDismiss={() => setDialog(null)} testID="md-dialog-account">
                <Dialog.Title>Elegir cuenta</Dialog.Title>
                <Dialog.Content>
                    <List.Group>
                        {['Ana López', 'Luis Mendoza', 'Equipo de diseño'].map((label) => (
                            <List.Item
                                key={label}
                                title={label}
                                leading={
                                    <Avatar.Text
                                        size={40}
                                        label={label
                                            .split(' ')
                                            .map((word) => word[0])
                                            .slice(0, 2)
                                            .join('')}
                                    />
                                }
                                onPress={() => {
                                    setAccount(label);
                                    setDialog(null);
                                }}
                                testID={`md-dialog-account-${label.split(' ')[0]}`}
                            />
                        ))}
                    </List.Group>
                </Dialog.Content>
            </Dialog>
            <Text variant="titleMedium">Confirmación desplazable</Text>
            <Button
                style={{ alignSelf: 'flex-start' }}
                variant="outlined"
                onPress={() => {
                    setDraftSound(sound);
                    setDialog('sound');
                }}
                testID="md-dialog-sound-open"
            >
                Tono: {sound}
            </Button>
            <Dialog visible={dialog === 'sound'} onDismiss={() => setDialog(null)} testID="md-dialog-sound">
                <Dialog.Title>Tono de notificación</Dialog.Title>
                <Dialog.ScrollArea>
                    <ScrollView
                        style={{ maxHeight: 280 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        <RadioButton.Group value={draftSound} onValueChange={setDraftSound}>
                            {sounds.map((label) => (
                                <RadioButton.Item key={label} label={label} value={label} testID={`md-dialog-sound-${label}`} />
                            ))}
                        </RadioButton.Group>
                    </ScrollView>
                </Dialog.ScrollArea>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setDialog(null)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="text"
                        onPress={() => {
                            setSound(draftSound);
                            setDialog(null);
                        }}
                    >
                        Guardar
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <Text variant="titleMedium">Pantalla completa · tarea y menú</Text>
            <Text testID="md-dialog-saved">
                Guardado: {saved || 'Sin cambios'} · {savedCollection}
            </Text>
            <Button
                style={{ alignSelf: 'flex-start' }}
                variant="outlined"
                onPress={() => {
                    setName(saved);
                    setNameError(false);
                    setCollection(savedCollection);
                    setDialog('full');
                }}
                testID="md-dialog-full-open"
            >
                Editar documento
            </Button>
            <FullScreenDialog
                visible={dialog === 'full'}
                title="Editar documento"
                onDismiss={closeEditor}
                onConfirm={() => {
                    if (!name.trim()) {
                        setNameError(true);
                        return;
                    }
                    setSaved(name.trim());
                    setSavedCollection(collection);
                    setDialog(null);
                }}
                testID="md-full-dialog"
            >
                <View style={{ gap: 16 }}>
                    <TextField
                        label="Nombre"
                        value={name}
                        onChangeText={(next) => {
                            setName(next);
                            setNameError(false);
                        }}
                        error={nameError}
                        errorText="Escribe un nombre para el documento."
                        supportingText={nameError ? 'Escribe un nombre para el documento.' : undefined}
                        testID="md-full-dialog-name"
                    />
                    <Menu
                        visible={menu}
                        onDismiss={() => setMenu(false)}
                        anchor={
                            <Button
                                variant="outlined"
                                icon="folder-outline"
                                onPress={() => setMenu(true)}
                                testID="md-full-dialog-folder-open"
                            >
                                {collection}
                            </Button>
                        }
                        testID="md-full-dialog-folder-menu"
                    >
                        {['Personal', 'Compartidos', 'Trabajo'].map((label) => (
                            <Menu.Item
                                key={label}
                                title={label}
                                selected={collection === label}
                                onPress={() => {
                                    setCollection(label);
                                    setMenu(false);
                                }}
                                testID={`md-full-dialog-folder-${label}`}
                            />
                        ))}
                    </Menu>
                </View>
                <Dialog visible={discard} onDismiss={() => setDiscard(false)} testID="md-discard-dialog">
                    <Dialog.Title>¿Descartar los cambios?</Dialog.Title>
                    <Dialog.Content>
                        <Text>El documento tiene cambios sin guardar.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button variant="text" onPress={() => setDiscard(false)}>
                            Continuar editando
                        </Button>
                        <Button
                            variant="text"
                            onPress={() => {
                                setDiscard(false);
                                setMenu(false);
                                setDialog(null);
                            }}
                        >
                            Descartar
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </FullScreenDialog>
            <Text variant="titleMedium">Reconocimiento · una sola acción</Text>
            <Button style={{ alignSelf: 'flex-start' }} variant="text" onPress={() => setDialog('ack')}>
                Ver aviso de almacenamiento
            </Button>
            <Dialog visible={dialog === 'ack'} onDismiss={() => setDialog(null)}>
                <Dialog.Title>Almacenamiento disponible</Dialog.Title>
                <Dialog.Content>
                    <Text>La limpieza terminó. Ahora tienes 2 GB disponibles.</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setDialog(null)}>
                        Entendido
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <Button style={{ alignSelf: 'flex-start' }} variant="text" onPress={() => setDialog('body')}>
                Aviso sin encabezado
            </Button>
            <Dialog accessibilityLabel="Copia del proyecto guardada" visible={dialog === 'body'} onDismiss={() => setDialog(null)}>
                <Dialog.Content>
                    <Text>La copia del proyecto se guardó correctamente.</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setDialog(null)}>
                        Entendido
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <Text variant="titleMedium">Error general al guardar</Text>
            <Text testID="md-dialog-copy-state">
                {copySaved ? 'Copia guardada en la colección local.' : 'La copia aún no se ha guardado.'}
            </Text>
            <List.Accordion title="Configuración de conexión de la muestra">
                <Button
                    style={{ alignSelf: 'flex-start' }}
                    variant="text"
                    onPress={() => setOffline((value) => !value)}
                    testID="md-dialog-toggle-connection"
                >
                    {offline ? 'Restablecer conexión local' : 'Simular conexión no disponible'}
                </Button>
                <Text>{offline ? 'Conexión no disponible' : 'Conexión disponible'} · simulación local</Text>
            </List.Accordion>
            <Button
                style={{ alignSelf: 'flex-start' }}
                variant="outlined"
                icon="content-save-outline"
                onPress={saveCopy}
                testID="md-dialog-copy-save"
            >
                Guardar copia
            </Button>
            <Dialog visible={dialog === 'error'} onDismiss={() => setDialog(null)} testID="md-dialog-error">
                <Dialog.Title>No se pudo guardar</Dialog.Title>
                <Dialog.Content>
                    <Text>
                        No hay conexión disponible. Tus cambios se conservan en esta pantalla. Restablece la conexión y vuelve a intentarlo.
                    </Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setDialog(null)} testID="md-dialog-error-cancel">
                        Cancelar
                    </Button>
                    <Button variant="text" onPress={saveCopy} testID="md-dialog-error-retry">
                        Reintentar
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
}
