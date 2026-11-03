import { useState } from 'react';
import { Searchbar } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [query, setQuery] = useState('');
  return <Searchbar placeholder="Buscar música" value={query}
    onChangeText={setQuery} accessibilityLabel="Buscar música" />;
}
