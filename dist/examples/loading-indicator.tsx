import { LoadingIndicator } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  return <LoadingIndicator variant="contained" size={48}
    accessibilityLabel="Cargando tu biblioteca" />;
}
