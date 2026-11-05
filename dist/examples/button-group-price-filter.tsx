import { useState } from 'react';
import { View } from 'react-native';
import { ButtonGroup, Text } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  const [prices, setPrices] = useState<string | string[]>(['$', '$$']);
  const selected = typeof prices === 'string' ? [prices] : prices;
  const places = [{ name: 'Garden café', price: '$' }, { name: 'Market table', price: '$$' },
    { name: 'The terrace', price: '$$$' }, { name: 'Tasting room', price: '$$$$' }];
  return <View style={{ padding: 24, gap: 20 }}>
    <ButtonGroup variant="connected" size="extra-small" selectionMode="multiple"
      value={prices} onValueChange={setPrices}
      items={['$', '$$', '$$$', '$$$$'].map(price => ({ value: price, label: price,
        accessibilityLabel: 'Precio ' + price }))} />
    {places.filter(place => selected.includes(place.price)).map(place => <Text key={place.name}>{place.name}</Text>)}
    {!selected.length ? <Text>Selecciona un precio para mostrar resultados.</Text> : null}
  </View>;
}
