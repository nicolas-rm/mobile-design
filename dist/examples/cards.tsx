import { useState } from 'react';
import { View } from 'react-native';
import { Card, Text, Button } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [feedback, setFeedback] = useState('');
  return <View style={{ gap: 16 }}><Card variant="filled">
    <Card.Title title="En buena compañía" subtitle="Una colección para descubrir" />
    <Card.Content><Text variant="bodyMedium">Contenido y acciones de una misma idea.</Text></Card.Content>
    <Card.Actions><Button variant="text" onPress={() => setFeedback(['Colección abierta'].join(': '))}>Explorar</Button></Card.Actions>
  </Card><Text accessibilityLiveRegion="polite">{feedback}</Text></View>;
}
