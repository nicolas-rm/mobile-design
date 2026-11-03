import { useState, useRef } from 'react';
import { View, ScrollView } from 'react-native';
import { FAB, Button, Text, TextField } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState(Array.from({ length: 12 }, (_, i) => 'Nota ' + (i + 1)));
  const lastY = useRef(0);
  if (editing) return <View style={{ padding: 24, gap: 24 }}>
    <Text variant="headlineSmall">Nueva nota</Text>
    <TextField label="Título" value={title} onChangeText={setTitle} />
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
      <Button variant="text" onPress={() => setEditing(false)}>Cancelar</Button>
      <Button disabled={!title.trim()} onPress={() => {
        setNotes(items => [title.trim(), ...items]); setTitle(''); setEditing(false);
        lastY.current = 0; setExpanded(true);
      }}>Crear</Button>
    </View>
  </View>;
  return <View style={{ flex: 1, minHeight: 400 }}>
    <ScrollView scrollEventThrottle={16} contentContainerStyle={{ padding: 24, paddingBottom: 112 }}
      onScroll={event => {
        const y = Math.max(0, event.nativeEvent.contentOffset.y);
        if (Math.abs(y - lastY.current) > 3 || y === 0) {
          setExpanded(y === 0 || y < lastY.current); lastY.current = y;
        }
      }}>
      {notes.map((note, index) => <Text key={index} variant="bodyLarge" style={{ paddingVertical: 24 }}>{note}</Text>)}
    </ScrollView>
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, bottom: 16 }}>
      <FAB.Extended icon="pencil-outline" label="Crear nota" expanded={expanded}
        onPress={() => { setTitle(''); setEditing(true); }} />
    </View>
  </View>;
}
