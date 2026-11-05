import { useState } from 'react';
import { View } from 'react-native';
import { ButtonGroup, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  return <View style={{ padding: 24, gap: 20 }}>
    <ButtonGroup fullWidth buttonVariant="filled" items={[
      { value: 'rewind', label: 'Retroceder', icon: 'fast_rewind', iconOnly: true,
        onPress: () => setPosition(value => Math.max(0, value - 10)) },
      { value: 'play', label: playing ? 'Pausar' : 'Reproducir', icon: playing ? 'pause' : 'play_arrow',
        weight: 3, onPress: () => setPlaying(value => !value) },
      { value: 'forward', label: 'Avanzar', icon: 'fast_forward', iconOnly: true,
        onPress: () => setPosition(value => value + 10) },
    ]} />
    <Text accessibilityLiveRegion="polite">{playing ? 'Reproduciendo' : 'En pausa'} · {position} s</Text>
  </View>;
}
