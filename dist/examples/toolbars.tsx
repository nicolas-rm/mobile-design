import { useState } from 'react';
import { View } from 'react-native';
import { Toolbar, TextField, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [title, setTitle] = useState('Mi colección');
  const [saved, setSaved] = useState('Mi colección');
  const [deleted, setDeleted] = useState(false);
  return <View style={{ gap: 24 }}>
    <TextField label="Nombre" value={title} onChangeText={setTitle} disabled={deleted} />
    <Text accessibilityLiveRegion="polite">{deleted ? 'Colección eliminada' : 'Guardado: ' + saved}</Text>
    <Toolbar variant="floating" accessibilityLabel="Editar colección"
      actions={[{ key: 'save', icon: 'save', label: 'Guardar', disabled: deleted || title === saved, onPress: () => setSaved(title) },
        { key: 'undo', icon: 'undo', label: 'Restaurar', onPress: () => { setDeleted(false); setTitle(saved); } },
        { key: 'delete', icon: 'delete', label: 'Eliminar', disabled: deleted, onPress: () => setDeleted(true) }]} />
  </View>;
}
