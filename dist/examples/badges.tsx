import { useState } from 'react';
import { View } from 'react-native';
import { BadgedBox, IconButton, MaterialSymbol, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [feedback, setFeedback] = useState('');
  return <View style={{ gap: 16 }}><IconButton
    icon={props => <BadgedBox badge={8}>
      <MaterialSymbol {...props} name="mail" />
    </BadgedBox>}
    accessibilityLabel="Correo, 8 mensajes nuevos"
    onPress={() => setFeedback(['Correo', 'Tienes 8 mensajes nuevos'].join(': '))} /><Text accessibilityLiveRegion="polite">{feedback}</Text></View>;
}
