import { Alert } from 'react-native';
import { Toolbar } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  return <Toolbar variant="floating" accessibilityLabel="Editar colección"
    actions={[{ key: 'edit', icon: 'pencil-outline', label: 'Editar', onPress: () => Alert.alert('Editar') },
      { key: 'share', icon: 'share-variant-outline', label: 'Compartir', onPress: () => Alert.alert('Compartir') },
      { key: 'delete', icon: 'delete-outline', label: 'Eliminar', onPress: () => Alert.alert('Eliminar') }]} />;
}
