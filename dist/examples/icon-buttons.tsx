import { useState } from 'react';
import { IconButton, MaterialSymbol, Tooltip } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [favorite, setFavorite] = useState(false);
  const label = favorite ? 'Quitar de favoritos' : 'Añadir a favoritos';
  return <Tooltip title={label}>
    <IconButton icon={props => <MaterialSymbol {...props} name="favorite" filled={favorite} />}
      accessibilityLabel={label} mode="contained-tonal" selected={favorite}
      sizeClass="small" shape="round" widthVariant="default"
      onPress={() => setFavorite(value => !value)} />
  </Tooltip>;
}
