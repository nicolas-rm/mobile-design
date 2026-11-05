import { useState } from 'react';
import { View } from 'react-native';
import { FAB, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [feedback, setFeedback] = useState('');
  const [expanded, setExpanded] = useState(false);
  return <View style={{ gap: 16 }}><View style={{ minHeight: 280, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
    <FAB.Menu presentation="expressive" expanded={expanded} onDismiss={() => setExpanded(false)}
      trigger={{ icon: 'plus', size: 'medium', accessibilityLabel: 'Crear', onPress: () => setExpanded(true) }}
      items={[
        { key: 'note', label: 'Nota', icon: 'pencil-outline', onPress: () => setFeedback(['Nueva nota'].join(': ')) },
        { key: 'folder', label: 'Carpeta', icon: 'folder-outline', onPress: () => setFeedback(['Nueva carpeta'].join(': ')) },
      ]} />
  </View><Text accessibilityLiveRegion="polite">{feedback}</Text></View>;
}
