import { useState } from 'react';
import { View } from 'react-native';
import { Chip, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [people, setPeople] = useState([{ id: 'ana', label: 'Ana' }, { id: 'luis', label: 'Luis' }]);
  const [selected, setSelected] = useState<string | null>(null);
  return <View style={{ gap: 16 }}>
    <Chip.Group accessibilityLabel="Destinatarios">
      {people.map(person => <Chip key={person.id} variant="input"
        onPress={() => setSelected(person.id)} closeIconAccessibilityLabel={'Quitar ' + person.label}
        onClose={() => { setPeople(value => value.filter(item => item.id !== person.id));
          setSelected(value => value === person.id ? null : value); }}>
        {person.label}
      </Chip>)}
    </Chip.Group>
    <Text>{selected ? 'Entrada elegida: ' + selected : 'Sin entrada elegida'}</Text>
  </View>;
}
