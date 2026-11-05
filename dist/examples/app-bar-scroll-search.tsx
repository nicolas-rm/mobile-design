import { useState, useRef } from 'react';
import { View, ScrollView } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { TopAppBar, SearchView, Text, useAppBarScrollBehavior } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const pending = useRef('');
  const behavior = useAppBarScrollBehavior({ behavior: 'exit-until-collapsed', snap: true });
  const titles = ['Wizards & Wynona', 'At Peace', 'Everyday Stories'];
  return <View style={{ flex: 1 }}>
    <TopAppBar title="Saved podcasts" variant="large-flexible" scrollBehavior={behavior}
      actions={[{ key: 'search', icon: 'search', label: 'Buscar podcasts', onPress: () => setSearch(true) }]} />
    <Animated.ScrollView onScroll={behavior.onScroll} scrollEventThrottle={16}
      contentContainerStyle={{ padding: 24, gap: 24 }}>
      {Array.from({ length: 24 }, (_, index) => <Text key={index} variant="bodyLarge">{titles[index % titles.length]}</Text>)}
      <Text accessibilityLiveRegion="polite">{selected}</Text>
    </Animated.ScrollView>
    <SearchView open={search} onOpenChange={setSearch} value={query} onChangeText={setQuery}
      placeholder="Search podcasts" onSearch={setQuery}
      results={titles.filter(title => title.toLowerCase().includes(query.toLowerCase())).map(title => ({ key: title, title }))}
      onResultPress={result => { pending.current = result.title; }}
      onClosed={() => { if (pending.current) { setSelected(pending.current); pending.current = ''; } }} />
  </View>;
}
