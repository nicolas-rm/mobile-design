import { useState } from 'react';
import { Button, DatePicker } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [visible, setVisible] = useState(false);
  const [date, setDate] = useState(new Date(2026, 10, 3));
  return <>
    <Button onPress={() => setVisible(true)}>Elegir fecha</Button>
    <DatePicker mode="single" visible={visible} value={date} locale="es-MX"
      onDismiss={() => setVisible(false)}
      onChange={next => { setDate(next); setVisible(false); }} />
  </>;
}
