import { useState } from 'react';
import { BottomSheet, BottomSheetScrollView, Text, Button } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [open, setOpen] = useState(false);
  return <>
    <Button onPress={() => setOpen(true)}>Ver detalles</Button>
    <BottomSheet open={open} onOpenChange={setOpen} variant="modal"
      snapPoints={['50%', '85%']} accessibilityLabel="Detalles de la colección">
      <BottomSheetScrollView contentContainerStyle={{ padding: 24 }}>
        <Text variant="headlineSmall">Tu colección</Text>
        <Text>Información adicional de la colección guardada.</Text>
        <Button variant="text" onPress={() => setOpen(false)}>Cerrar</Button>
      </BottomSheetScrollView>
    </BottomSheet>
  </>;
}
