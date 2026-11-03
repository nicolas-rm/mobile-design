import { Alert } from 'react-native';
import { FAB, MaterialSymbol, Tooltip } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  return <Tooltip title="Crear lista">
    <FAB size="medium" variant="tonalPrimary"
      icon={(props: { size: number; color: string }) => <MaterialSymbol {...props} name="add" filled />}
      accessibilityLabel="Crear lista"
      onPress={() => Alert.alert('Nueva lista')} />
  </Tooltip>;
}
