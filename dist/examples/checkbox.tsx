import { useState } from 'react';
import { Checkbox } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [checked, setChecked] = useState(false);
  return <Checkbox.Item label="Descargar con Wi-Fi"
    status={checked ? 'checked' : 'unchecked'}
    onPress={() => setChecked(value => !value)} />;
}
