import { useState } from 'react';
import { View, Alert } from 'react-native';
import { FAB } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [expanded, setExpanded] = useState(false);
  return <View style={{ minHeight: 280, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
    <FAB.Menu expanded={expanded} onDismiss={() => setExpanded(false)}
      trigger={{ icon: 'plus', accessibilityLabel: 'Crear', onPress: () => setExpanded(true) }}
      items={[
        { key: 'note', label: 'Nota', icon: 'pencil-outline', onPress: () => Alert.alert('Nueva nota') },
        { key: 'folder', label: 'Carpeta', icon: 'folder-outline', onPress: () => Alert.alert('Nueva carpeta') },
      ]} />
  </View>;
}
