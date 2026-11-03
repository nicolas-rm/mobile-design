import { useState } from 'react';
import { View } from 'react-native';
import { Card, Menu, IconButton, Button, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [items, setItems] = useState([{ id: 'bread', title: 'Pan de masa madre', saved: false },
    { id: 'bao', title: 'Bao al vapor', saved: true }]);
  const [menu, setMenu] = useState<string | null>(null);
  const [removed, setRemoved] = useState<(typeof items)[number] | null>(null);
  return <View style={{ padding: 24, gap: 8 }}>
    {items.map(item => <Card key={item.id} variant="filled">
      <Card.Title title={item.title} subtitle={item.saved ? 'Guardada' : 'Receta'} right={() =>
        <Menu visible={menu === item.id} onDismiss={() => setMenu(null)}
          anchor={<IconButton icon="more_vert" accessibilityLabel={'Opciones de ' + item.title}
            onPress={() => setMenu(item.id)} />}>
          <Menu.Item title="Archivar" leadingIcon="archive" onPress={() => {
            setRemoved(item); setItems(value => value.filter(row => row.id !== item.id));
          }} />
        </Menu>} />
      <Card.Content><Text variant="bodyMedium">Una idea para volver a disfrutar.</Text></Card.Content>
      <Card.Actions><Button variant="text" onPress={() => setItems(value => value.map(row =>
        row.id === item.id ? { ...row, saved: !row.saved } : row))}>
        {item.saved ? 'Quitar de guardadas' : 'Guardar'}
      </Button></Card.Actions>
    </Card>)}
    {removed ? <Button variant="text" onPress={() => {
      setItems(value => value.some(item => item.id === removed.id) ? value : [...value, removed]); setRemoved(null);
    }}>Deshacer archivo</Button> : null}
  </View>;
}
