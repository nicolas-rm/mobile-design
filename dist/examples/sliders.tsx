import { useState } from 'react';
import { Slider } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [value, setValue] = useState(40);
  return <Slider value={value} onValueChange={setValue}
    minimumValue={0} maximumValue={100} step={5}
    accessibilityLabel="Volumen" valueSuffix="%" />;
}
