import { useState } from 'react';
import { View } from 'react-native';
import { Snackbar, Portal, Button, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [visible, setVisible] = useState(false);
  const [archived, setArchived] = useState(false);
  return <View style={{ gap: 16 }}>
    <Text accessibilityLiveRegion="polite">{archived ? 'Colección archivada' : 'Colección disponible'}</Text>
    <Button onPress={() => { setArchived(true); setVisible(true); }}>Archivar colección</Button>
    <Portal><Snackbar visible={visible} onDismiss={() => setVisible(false)} inlineFeedback
      action={{ label: 'Deshacer', onPress: () => { setArchived(false); setVisible(false); } }}>
      Colección archivada
    </Snackbar></Portal>
  </View>;
}
