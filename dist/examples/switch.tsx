import { useState } from 'react';
import { Switch } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [enabled, setEnabled] = useState(true);
  return <Switch value={enabled} onValueChange={setEnabled}
    accessibilityLabel="Descargar sólo con Wi-Fi" />;
}
