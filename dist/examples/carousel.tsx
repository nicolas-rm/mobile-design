import { Alert } from 'react-native';
import { Carousel } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  return <Carousel variant="multi-browse" height={240}
    accessibilityLabel="Destinos para explorar"
    items={[{ id: 'mountain', title: 'Montaña', icon: 'image-outline' },
      { id: 'coast', title: 'Costa', icon: 'image-outline' },
      { id: 'forest', title: 'Bosque', icon: 'image-outline' }]}
    onItemPress={item => Alert.alert(item.title)} />;
}
