import { useState } from 'react';
import { View } from 'react-native';
import { NavigationBar, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [value, setValue] = useState('home');
  const [unread, setUnread] = useState(10);
  const items = [
    { key: 'home', label: 'Home', icon: 'home', selectedIcon: 'home_fill1' },
    { key: 'mail', label: 'Mail', icon: 'mail', selectedIcon: 'mail_fill1', badge: unread || false,
      accessibilityLabel: unread ? 'Mail, ' + unread + ' mensajes nuevos' : 'Mail' },
    { key: 'photos', label: 'Photos', icon: 'image', selectedIcon: 'image_fill1', badge: 1004,
      accessibilityLabel: 'Photos, 1004 fotos' },
  ];
  return <View style={{ flex: 1 }}>
    <View style={{ flex: 1, padding: 24 }}><Text variant="headlineSmall">{items.find(item => item.key === value)?.label}</Text></View>
    <NavigationBar items={items} value={value} onValueChange={key => { setValue(key); if (key === 'mail') setUnread(0); }} />
  </View>;
}
