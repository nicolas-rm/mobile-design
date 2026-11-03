import { Alert } from 'react-native';
import { TopAppBar } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  return <TopAppBar
    variant="medium-flexible"
    title="Tu biblioteca"
    navigationIcon="arrow-left"
    navigationLabel="Volver"
    onNavigationPress={() => Alert.alert('Navegación', 'Regresar a la pantalla anterior')}
    actions={[{ key: 'search', icon: 'magnify', label: 'Buscar', onPress: () => Alert.alert('Buscar') }]}
  />;
}
