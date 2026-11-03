import { useState } from 'react';
import { NavigationBar } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [value, setValue] = useState('home');
  return <NavigationBar value={value} onValueChange={setValue}
    items={[{ key: 'home', label: 'Inicio', icon: 'home-outline', selectedIcon: 'home' },
      { key: 'library', label: 'Biblioteca', icon: 'music-box-outline', badge: 3 },
      { key: 'saved', label: 'Guardado', icon: 'bookmark-outline' }]} />;
}
