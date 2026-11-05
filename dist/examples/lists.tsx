import { useState } from 'react';
import { View } from 'react-native';
import { List, IconButton, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [feedback, setFeedback] = useState('');
  return <View style={{ gap: 16 }}><List.Item title="Long Walk" description="L. R. Coleman" lines={2}
    onPress={() => setFeedback(['Detalle de la canción'].join(': '))}
    trailing={<IconButton icon="play-outline" accessibilityLabel="Reproducir Long Walk"
      onPress={() => setFeedback(['Reproduciendo Long Walk'].join(': '))} />} /><Text accessibilityLiveRegion="polite">{feedback}</Text></View>;
}
