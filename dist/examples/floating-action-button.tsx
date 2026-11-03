import { Alert } from 'react-native';
import { FAB } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  return <FAB icon="plus" accessibilityLabel="Crear lista"
    onPress={() => Alert.alert('Nueva lista')} />;
}
