import { useState } from 'react';
import { Switch } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [enabled, setEnabled] = useState(true);
  return <Switch value={enabled} onValueChange={setEnabled}
    accessibilityLabel="Descargar sólo con Wi-Fi" />;
}
