import { useState, useRef } from 'react';
import { Menu, Button, Dialog, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const openEditorAfterClose = useRef(false);
  return <>
    <Menu visible={menuOpen}
      onDismiss={() => { openEditorAfterClose.current = false; setMenuOpen(false); }}
      onClosed={() => { if (openEditorAfterClose.current) {
        openEditorAfterClose.current = false; setDialogOpen(true);
      } }}
      anchor={<Button onPress={() => setMenuOpen(true)}>Opciones</Button>}>
      <Menu.Item title="Editar colección" closeOnPress={false}
        onPress={() => { openEditorAfterClose.current = true; setMenuOpen(false); }} />
    </Menu>
    <Dialog visible={dialogOpen} onDismiss={() => setDialogOpen(false)}>
      <Dialog.Title>Editar colección</Dialog.Title>
      <Dialog.Content><Text>Contenido del editor de la pantalla.</Text></Dialog.Content>
      <Dialog.Actions><Button variant="text" onPress={() => setDialogOpen(false)}>Cerrar</Button></Dialog.Actions>
    </Dialog>
  </>;
}
