import { useState } from 'react';
import { View } from 'react-native';
import { TopAppBar, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [feedback, setFeedback] = useState('');
  return <View style={{ gap: 16 }}><TopAppBar
    variant="medium-flexible"
    title="Tu biblioteca"
    navigationIcon="arrow_back"
    navigationLabel="Volver"
    onNavigationPress={() => setFeedback(['Navegación', 'Regresar a la pantalla anterior'].join(': '))}
    actions={[{ key: 'search', icon: 'search', label: 'Buscar', onPress: () => setFeedback(['Buscar'].join(': ')) }]}
  /><Text accessibilityLiveRegion="polite">{feedback}</Text></View>;
}
