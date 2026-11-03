import { useState } from 'react';
import { TextField } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(true);
  return <TextField label="Contraseña" value={password} onChangeText={setPassword}
    secureTextEntry={hidden} autoCapitalize="none"
    trailingIcon={hidden ? 'eye-outline' : 'eye-off-outline'}
    trailingIconAccessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
    onTrailingIconPress={() => setHidden(value => !value)} />;
}
