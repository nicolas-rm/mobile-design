import { Alert } from 'react-native';
import { FAB } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  return <FAB icon="plus" accessibilityLabel="Crear lista"
    onPress={() => Alert.alert('Nueva lista')} />;
}
