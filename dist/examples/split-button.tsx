import { useState } from 'react';
import { View } from 'react-native';
import { SplitButton, MaterialSymbol, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [feedback, setFeedback] = useState('');
  return <View style={{ gap: 16 }}><SplitButton label="Enviar"
    icon={(props: { size: number; color: string }) => <MaterialSymbol {...props} name="send" filled />}
    onPress={() => setFeedback(['Mensaje enviado'].join(': '))}
    menuAccessibilityLabel="Más opciones de envío"
    actions={[
      { key: 'later', label: 'Programar envío', icon: 'clock-outline', onPress: () => setFeedback(['Programar envío'].join(': ')) },
      { key: 'draft', label: 'Guardar borrador', icon: 'content-save-outline', onPress: () => setFeedback(['Borrador guardado'].join(': ')) },
    ]} /><Text accessibilityLiveRegion="polite">{feedback}</Text></View>;
}
