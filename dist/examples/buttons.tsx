import { useState } from 'react';
import { Button } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [saved, setSaved] = useState(false);
  return <Button variant="filled" size="medium" shape="round"
    selected={saved} icon={saved ? 'check' : 'bookmark-outline'}
    onPress={() => setSaved(value => !value)}>
    {saved ? 'Guardado' : 'Guardar'}
  </Button>;
}
