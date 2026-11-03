import { Alert } from 'react-native';
import { SplitButton } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  return <SplitButton label="Enviar" icon="send-outline"
    onPress={() => Alert.alert('Mensaje enviado')}
    menuAccessibilityLabel="Más opciones de envío"
    actions={[
      { key: 'later', label: 'Programar envío', icon: 'clock-outline', onPress: () => Alert.alert('Programar envío') },
      { key: 'draft', label: 'Guardar borrador', icon: 'content-save-outline', onPress: () => Alert.alert('Borrador guardado') },
    ]} />;
}
