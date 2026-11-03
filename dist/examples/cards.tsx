import { Alert } from 'react-native';
import { Card, Text, Button } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  return <Card variant="filled">
    <Card.Title title="En buena compañía" subtitle="Una colección para descubrir" />
    <Card.Content><Text variant="bodyMedium">Contenido y acciones de una misma idea.</Text></Card.Content>
    <Card.Actions><Button variant="text" onPress={() => Alert.alert('Colección abierta')}>Explorar</Button></Card.Actions>
  </Card>;
}
