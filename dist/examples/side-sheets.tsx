import { useState } from 'react';
import { SideSheet, Button, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [open, setOpen] = useState(false);
  return <>
    <Button onPress={() => setOpen(true)}>Ver información</Button>
    <SideSheet open={open} onOpenChange={setOpen} variant="modal" title="Información">
      <Text>Contenido complementario de esta pantalla.</Text>
    </SideSheet>
  </>;
}
