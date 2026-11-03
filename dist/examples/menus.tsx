import { useState } from 'react';
import { Alert } from 'react-native';
import { Menu, Button } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [visible, setVisible] = useState(false);
  return <Menu visible={visible} onDismiss={() => setVisible(false)}
    anchor={<Button variant="tonal" onPress={() => setVisible(true)}>Opciones</Button>}>
    <Menu.Item title="Guardar" leadingIcon="bookmark-outline"
      onPress={() => Alert.alert('Guardado')} />
    <Menu.Item title="Compartir" leadingIcon="share-variant-outline"
      onPress={() => Alert.alert('Compartir')} />
  </Menu>;
}
