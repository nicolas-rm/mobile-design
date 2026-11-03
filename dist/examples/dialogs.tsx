import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Dialog, Text } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [visible, setVisible] = useState(false);
  return <>
    <Button onPress={() => setVisible(true)}>Eliminar descarga</Button>
    <Dialog visible={visible} onDismiss={() => setVisible(false)}>
      <Dialog.Title>¿Eliminar descarga?</Dialog.Title>
      <Dialog.Content><Text>Podrás descargarla de nuevo cuando quieras.</Text></Dialog.Content>
      <Dialog.Actions>
        <Button variant="text" onPress={() => setVisible(false)}>Cancelar</Button>
        <Button variant="text" onPress={() => { setVisible(false); Alert.alert('Descarga eliminada'); }}>Eliminar</Button>
      </Dialog.Actions>
    </Dialog>
  </>;
}
