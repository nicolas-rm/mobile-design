import { useState } from 'react';
import { View } from 'react-native';
import { FAB, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [feedback, setFeedback] = useState('');
  return <View style={{ gap: 16 }}><FAB.Extended size="medium" icon="pencil-outline" label="Crear nota"
    accessibilityLabel="Crear nota"
    onPress={() => setFeedback(['Nueva nota', 'Aquí comienza la tarea principal'].join(': '))} /><Text accessibilityLiveRegion="polite">{feedback}</Text></View>;
}
