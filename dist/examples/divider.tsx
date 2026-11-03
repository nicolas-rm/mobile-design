import { View } from 'react-native';
import { Divider, Text } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  return <View style={{ gap: 16 }}>
    <Text variant="titleMedium">Tu biblioteca</Text>
    <Divider />
    <Text variant="bodyMedium">Colecciones guardadas</Text>
  </View>;
}
