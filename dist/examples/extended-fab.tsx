import { Alert } from 'react-native';
import { FAB } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  return <FAB.Extended icon="pencil-outline" label="Crear nota"
    accessibilityLabel="Crear nota"
    onPress={() => Alert.alert('Nueva nota', 'Aquí comienza la tarea principal')} />;
}
