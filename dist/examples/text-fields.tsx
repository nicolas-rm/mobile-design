import { useState } from 'react';
import { TextField } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [name, setName] = useState('');
  return <TextField variant="outlined" label="Nombre de la colección"
    value={name} onChangeText={setName} counter={40} maxLength={40}
    supportingText="Elige un nombre fácil de reconocer" />;
}
