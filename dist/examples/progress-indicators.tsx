import { useState } from 'react';
import { View } from 'react-native';
import { ProgressIndicator, Text, Button } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [progress, setProgress] = useState(0.4);
  return <View style={{ gap: 24 }}>
    <Text>Descarga: {Math.round(progress * 100)} %</Text>
    <ProgressIndicator variant="linear" appearance="wavy" progress={progress}
      accessibilityLabel="Descarga de la colección" />
    <Button variant="tonal" onPress={() => setProgress(value => Math.min(1, value + 0.2))}>Avanzar demostración</Button>
  </View>;
}
