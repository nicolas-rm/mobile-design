import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets as useNativeSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationMode } from '@/hooks/settings/use-navigation-mode';

const ANDROID_BUTTON_NAVIGATION_PADDING = 12;

export function useSafeAreaInsets() {
    const nativeInsets = useNativeSafeAreaInsets();
    const { isButtonNavigation, navigationMode } = useNavigationMode();

    return useMemo(() => {
        const shouldAddAndroidPadding = Platform.OS === 'android' && isButtonNavigation;
        const androidPadding = shouldAddAndroidPadding ? ANDROID_BUTTON_NAVIGATION_PADDING : 0;

        return {
            ...nativeInsets,
            navigationMode,
            useBottom: nativeInsets.bottom + androidPadding,
            useLeft: nativeInsets.left + androidPadding,
            useRight: nativeInsets.right + androidPadding,
            useTop: nativeInsets.top + androidPadding,
        };
    }, [isButtonNavigation, nativeInsets, navigationMode]);
}

export const CUSTOM_INSETS_ANDROID_BUTTON_NAVIGATION_PADDING = ANDROID_BUTTON_NAVIGATION_PADDING;
