import { useState } from 'react';
import { IconButton } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [favorite, setFavorite] = useState(false);
  return <IconButton icon={favorite ? 'heart' : 'heart-outline'}
    accessibilityLabel={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    mode="contained-tonal" selected={favorite}
    onPress={() => setFavorite(value => !value)} />;
}
