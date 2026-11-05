import { useState } from 'react';
import { View } from 'react-native';
import { SearchView, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [feedback, setFeedback] = useState('');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const songs = [{ key: 'long-walk', title: 'Long Walk', description: 'L. R. Coleman' },
    { key: 'in-the-dark', title: 'In the Dark', description: 'Sole R. Rey' }];
  const results = songs.filter(song => song.title.toLowerCase().includes(query.toLowerCase()));
  return <View style={{ gap: 16 }}><SearchView open={open} onOpenChange={setOpen}
    value={query} onChangeText={setQuery} onSearch={setQuery}
    placeholder="Buscar música" results={results}
    onResultPress={song => setFeedback(['Canción seleccionada', song.title].join(': '))} /><Text accessibilityLiveRegion="polite">{feedback}</Text></View>;
}
