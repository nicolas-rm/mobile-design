import { LoadingIndicator } from 'mobile-design';

// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.
export default function Example() {
  return <LoadingIndicator variant="contained" size={48}
    accessibilityLabel="Cargando tu biblioteca" />;
}
