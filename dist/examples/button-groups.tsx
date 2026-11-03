import { useState } from 'react';
import { ButtonGroup } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [value, setValue] = useState<string | string[]>('week');
  return <ButtonGroup variant="connected" selectionMode="single"
    accessibilityLabel="Intervalo del calendario" value={value} onValueChange={setValue}
    items={[{ value: 'day', label: 'Día' }, { value: 'week', label: 'Semana' }, { value: 'month', label: 'Mes' }]} />;
}
