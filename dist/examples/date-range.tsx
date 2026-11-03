import { useState } from 'react';
import { Button, DatePicker, type DateRange } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [visible, setVisible] = useState(false);
  const [range, setRange] = useState<DateRange>({ start: new Date(2026, 10, 3), end: new Date(2026, 10, 7) });
  return <>
    <Button onPress={() => setVisible(true)}>Elegir intervalo</Button>
    <DatePicker mode="range" visible={visible} value={range} locale="es-MX"
      onDismiss={() => setVisible(false)}
      onChange={next => { setRange(next); setVisible(false); }} />
  </>;
}
