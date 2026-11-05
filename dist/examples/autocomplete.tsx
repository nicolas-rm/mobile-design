import { useState } from 'react';
import { Autocomplete } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [query, setQuery] = useState('');
  return <Autocomplete label="Ciudad" value={query} onValueChange={setQuery}
    leadingIcon="search"
    options={[
      { value: 'mty', label: 'Monterrey', description: 'Nuevo León' },
      { value: 'mid', label: 'Mérida', description: 'Yucatán' },
      { value: 'qro', label: 'Querétaro', description: 'Querétaro' },
    ]} />;
}
