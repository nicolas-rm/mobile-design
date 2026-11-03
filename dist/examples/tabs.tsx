import { useState } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Tabs, TabsPager, Text } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [value, setValue] = useState('music');
  const [request, setRequest] = useState(0);
  const position = useSharedValue(0);
  const items = [{ key: 'music', label: 'Música', icon: 'music-note-outline' },
    { key: 'podcasts', label: 'Podcasts', icon: 'podcast' }];
  return <View style={{ flex: 1 }}>
    <Tabs items={items} value={value} onValueChange={setValue} position={position}
      onTabPress={() => setRequest(value => value + 1)} />
    <TabsPager items={items} value={value} onValueChange={setValue}
      position={position} selectionRequest={request}
      renderPage={item => <View style={{ padding: 24 }}><Text>{item.label}</Text></View>} />
  </View>;
}
