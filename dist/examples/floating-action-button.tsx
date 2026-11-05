import { useState } from 'react';
import { View } from 'react-native';
import { FAB, MaterialSymbol, Tooltip, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [feedback, setFeedback] = useState('');
  return <View style={{ gap: 16 }}><Tooltip title="Crear lista">
    <FAB size="medium" variant="tonalPrimary"
      icon={(props: { size: number; color: string }) => <MaterialSymbol {...props} name="add" filled />}
      accessibilityLabel="Crear lista"
      onPress={() => setFeedback(['Nueva lista'].join(': '))} />
  </Tooltip><Text accessibilityLiveRegion="polite">{feedback}</Text></View>;
}
