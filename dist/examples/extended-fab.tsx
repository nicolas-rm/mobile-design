import { Alert } from 'react-native';
import { FAB } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  return <FAB.Extended icon="pencil-outline" label="Crear nota"
    accessibilityLabel="Crear nota"
    onPress={() => Alert.alert('Nueva nota', 'Aquí comienza la tarea principal')} />;
}
