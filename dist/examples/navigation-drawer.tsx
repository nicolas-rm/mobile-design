import { useState } from 'react';
import { NavigationDrawer } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [value, setValue] = useState('inbox');
  return <NavigationDrawer value={value} onValueChange={setValue}
    items={[{ key: 'inbox', label: 'Recibidos', icon: 'inbox-outline', badge: 8 },
      { key: 'sent', label: 'Enviados', icon: 'send-outline' },
      { key: 'saved', label: 'Guardados', icon: 'bookmark-outline' }]} />;
}
