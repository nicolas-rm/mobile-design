import { useState } from 'react';
import { NavigationRail } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [value, setValue] = useState('home');
  return <NavigationRail expanded value={value} onValueChange={setValue}
    items={[{ key: 'home', label: 'Inicio', icon: 'home-outline' },
      { key: 'search', label: 'Explorar', icon: 'compass-outline' },
      { key: 'saved', label: 'Guardado', icon: 'bookmark-outline' }]} />;
}
