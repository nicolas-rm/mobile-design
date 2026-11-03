import { Alert } from 'react-native';
import { BadgedBox, IconButton } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  return <BadgedBox badge={8}>
    <IconButton icon="email-outline" accessibilityLabel="Correo, 8 mensajes nuevos"
      onPress={() => Alert.alert('Correo', 'Tienes 8 mensajes nuevos')} />
  </BadgedBox>;
}
