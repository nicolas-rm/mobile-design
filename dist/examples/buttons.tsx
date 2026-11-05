import { useState } from 'react';
import { Button, MaterialSymbol } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [saved, setSaved] = useState(false);
  return <Button variant="filled" size="medium" shape="round"
    selected={saved} icon={props => <MaterialSymbol {...props} name="bookmark" filled={saved} />}
    onPress={() => setSaved(value => !value)}>
    {saved ? 'Guardado' : 'Guardar'}
  </Button>;
}
