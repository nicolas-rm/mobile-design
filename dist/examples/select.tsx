import { useState } from 'react';
import { Select } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [quality, setQuality] = useState('standard');
  return <Select label="Calidad de audio" value={quality} onValueChange={setQuality}
    options={[
      { value: 'standard', label: 'Estándar' },
      { value: 'high', label: 'Alta calidad' },
      { value: 'lossless', label: 'Sin pérdida', disabled: true },
    ]} />;
}
