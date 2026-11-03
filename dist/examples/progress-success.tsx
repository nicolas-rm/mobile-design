import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { CircularProgressStatus, Button, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (progress >= 1) { setActive(false); return; }
    const timer = setTimeout(() => setProgress(value => Math.min(1, value + 0.2)), 400);
    return () => clearTimeout(timer);
  }, [active, progress]);
  return <View style={{ gap: 24, alignItems: 'center' }}>
    <CircularProgressStatus status={progress >= 1 ? 'success' : 'progress'} progress={progress}
      progressLabel="Preparando descarga" successLabel="Descarga completa" />
    <Text>{Math.round(progress * 100)} %</Text>
    <Button disabled={active} onPress={() => { setProgress(0); setActive(true); }}>
      {progress >= 1 ? 'Repetir ejemplo' : 'Iniciar ejemplo'}
    </Button>
  </View>;
}
