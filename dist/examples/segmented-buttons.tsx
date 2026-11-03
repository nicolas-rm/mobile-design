import { useState } from 'react';
import { SegmentedButtons } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [value, setValue] = useState('walk');
  return <SegmentedButtons value={value} onValueChange={setValue}
    buttons={[{ value: 'walk', label: 'A pie', icon: 'walk' },
      { value: 'bike', label: 'Bici', icon: 'bike' },
      { value: 'car', label: 'Auto', icon: 'car-outline' }]} />;
}
