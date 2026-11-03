import { useState } from 'react';
import { Button } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [saved, setSaved] = useState(false);
  return <Button variant="filled" size="medium" shape="round"
    selected={saved} icon={saved ? 'check' : 'bookmark-outline'}
    onPress={() => setSaved(value => !value)}>
    {saved ? 'Guardado' : 'Guardar'}
  </Button>;
}
