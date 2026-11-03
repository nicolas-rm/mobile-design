import { useState } from 'react';
import { View } from 'react-native';
import { SegmentedButtons, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [prices, setPrices] = useState<string[]>(['2']);
  const places = [{ id: 'cafe', name: 'Café del centro', price: '1' },
    { id: 'casa', name: 'Casa verde', price: '2' }, { id: 'terraza', name: 'La terraza', price: '3' }];
  return <View style={{ padding: 24, gap: 16 }}>
    <SegmentedButtons multiSelect value={prices} onValueChange={setPrices}
      accessibilityLabel="Precio por persona"
      buttons={[1, 2, 3, 4].map(price => ({ value: String(price), label: '$'.repeat(price),
        accessibilityLabel: ['Económico', 'Moderado', 'Alto', 'Muy alto'][price - 1] }))} />
    {places.filter(place => prices.includes(place.price)).map(place => <Text key={place.id}>{place.name}</Text>)}
    {!places.some(place => prices.includes(place.price)) ? <Text>Sin coincidencias.</Text> : null}
  </View>;
}
