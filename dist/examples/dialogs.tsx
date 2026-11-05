import { useState } from 'react';
import { View } from 'react-native';
import { Button, Dialog, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [feedback, setFeedback] = useState('');
  const [visible, setVisible] = useState(false);
  return <View style={{ gap: 16 }}><>
    <Button onPress={() => setVisible(true)}>Eliminar descarga</Button>
    <Dialog visible={visible} onDismiss={() => setVisible(false)}>
      <Dialog.Title>¿Eliminar descarga?</Dialog.Title>
      <Dialog.Content><Text>Podrás descargarla de nuevo cuando quieras.</Text></Dialog.Content>
      <Dialog.Actions>
        <Button variant="text" onPress={() => setVisible(false)}>Cancelar</Button>
        <Button variant="text" onPress={() => { setVisible(false); setFeedback(['Descarga eliminada'].join(': ')); }}>Eliminar</Button>
      </Dialog.Actions>
    </Dialog>
  </><Text accessibilityLiveRegion="polite">{feedback}</Text></View>;
}
