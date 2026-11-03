import { useState } from 'react';
import { View } from 'react-native';
import { SplitButton, TextField, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [message, setMessage] = useState('Nos vemos mañana.');
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState('');
  return <View style={{ padding: 24, gap: 20 }}>
    <TextField label="Mensaje" value={message} onChangeText={setMessage} />
    <SplitButton label="Enviar" icon="send" disabled={!message.trim()}
      onPress={() => { setResult('Mensaje enviado: ' + message); setMessage(''); }}
      menuAccessibilityLabel="Más opciones de envío" actions={[
        { key: 'draft', label: 'Guardar borrador', icon: 'draft',
          onPress: () => { setDraft(message); setResult('Borrador guardado.'); } },
        { key: 'discard', label: 'Descartar mensaje', icon: 'delete',
          onPress: () => { setMessage(''); setResult('Mensaje descartado.'); } },
      ]} />
    <Text accessibilityLiveRegion="polite">{result}</Text>
    {draft ? <Text>Borrador: {draft}</Text> : null}
  </View>;
}
