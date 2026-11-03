import { useState } from 'react';
import { Chip } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [selected, setSelected] = useState(false);
  return <Chip variant="filter" selected={selected}
    onPress={() => setSelected(value => !value)}>Descargadas</Chip>;
}
