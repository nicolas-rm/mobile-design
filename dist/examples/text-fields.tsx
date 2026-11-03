import { useState } from 'react';
import { TextField } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [name, setName] = useState('');
  return <TextField variant="outlined" label="Nombre de la colección"
    value={name} onChangeText={setName} counter={40} maxLength={40}
    supportingText="Elige un nombre fácil de reconocer" />;
}
