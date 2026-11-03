import { useState } from 'react';
import { Alert } from 'react-native';
import { SearchView } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const songs = [{ key: 'long-walk', title: 'Long Walk', description: 'L. R. Coleman' },
    { key: 'in-the-dark', title: 'In the Dark', description: 'Sole R. Rey' }];
  const results = songs.filter(song => song.title.toLowerCase().includes(query.toLowerCase()));
  return <SearchView open={open} onOpenChange={setOpen}
    value={query} onChangeText={setQuery} onSearch={setQuery}
    placeholder="Buscar música" results={results}
    onResultPress={song => Alert.alert('Canción seleccionada', song.title)} />;
}
