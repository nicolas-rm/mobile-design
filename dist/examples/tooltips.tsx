import { useState } from 'react';
import { RichTooltip, Button, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [visible, setVisible] = useState(false);
  return <RichTooltip visible={visible} onDismiss={() => setVisible(false)}
    title="Escucha sin conexión"
    anchor={<Button variant="tonal" onPress={() => setVisible(true)}>Más información</Button>}
    actions={[{ key: 'done', label: 'Entendido', onPress: () => setVisible(false) }]}>
    <Text>Guarda tus colecciones para escucharlas cuando no tengas conexión.</Text>
  </RichTooltip>;
}
