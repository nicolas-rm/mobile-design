import { useState } from 'react';
import { View } from 'react-native';
import { Menu, Button, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [feedback, setFeedback] = useState('');
  const [visible, setVisible] = useState(false);
  return <View style={{ gap: 16 }}><Menu visible={visible} onDismiss={() => setVisible(false)}
    anchor={<Button variant="tonal" onPress={() => setVisible(true)}>Opciones</Button>}>
    <Menu.Item title="Guardar" leadingIcon="bookmark-outline"
      onPress={() => setFeedback(['Guardado'].join(': '))} />
    <Menu.Item title="Compartir" leadingIcon="share-variant-outline"
      onPress={() => setFeedback(['Compartir'].join(': '))} />
  </Menu><Text accessibilityLiveRegion="polite">{feedback}</Text></View>;
}
