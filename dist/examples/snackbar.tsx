import { useState } from 'react';
import { Alert } from 'react-native';
import { Snackbar, Button } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [visible, setVisible] = useState(false);
  return <>
    <Button onPress={() => setVisible(true)}>Guardar colección</Button>
    <Snackbar visible={visible} onDismiss={() => setVisible(false)}
      action={{ label: 'Deshacer', onPress: () => { setVisible(false); Alert.alert('Acción deshecha'); } }}>
      Colección guardada
    </Snackbar>
  </>;
}
