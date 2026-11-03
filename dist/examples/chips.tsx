import { useState } from 'react';
import { Chip } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [selected, setSelected] = useState(false);
  return <Chip variant="filter" selected={selected}
    onPress={() => setSelected(value => !value)}>Descargadas</Chip>;
}
