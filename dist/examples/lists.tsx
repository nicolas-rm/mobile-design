import { Alert } from 'react-native';
import { List, IconButton } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  return <List.Item title="Long Walk" description="L. R. Coleman" lines={2}
    onPress={() => Alert.alert('Detalle de la canción')}
    trailing={<IconButton icon="play-outline" accessibilityLabel="Reproducir Long Walk"
      onPress={() => Alert.alert('Reproduciendo Long Walk')} />} />;
}
