import { useState } from 'react';
import { View } from 'react-native';
import { Carousel, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [feedback, setFeedback] = useState('');
  return <View style={{ gap: 16 }}><Carousel variant="multi-browse" height={240}
    accessibilityLabel="Destinos para explorar"
    items={[{ id: 'mountain', title: 'Montaña', icon: 'image-outline' },
      { id: 'coast', title: 'Costa', icon: 'image-outline' },
      { id: 'forest', title: 'Bosque', icon: 'image-outline' }]}
    onItemPress={item => setFeedback([item.title].join(': '))} /><Text accessibilityLiveRegion="polite">{feedback}</Text></View>;
}
