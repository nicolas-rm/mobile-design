import { useContext, useEffect, useMemo, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import { SafeAreaInsetsContext, type EdgeInsets } from 'react-native-safe-area-context';

export type NavigationMode = 'gesture' | 'buttons';

const BUTTONS_THRESHOLD_DIFF = 40;
const BUTTONS_THRESHOLD_INSET = 30;
const ZERO_INSETS: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 };

export function useNavigationMode() {
    const insets = useContext(SafeAreaInsetsContext) ?? ZERO_INSETS;
    const [dimensions, setDimensions] = useState(() => ({
        screen: Dimensions.get('screen'),
        window: Dimensions.get('window'),
    }));

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', () => {
            setDimensions({
                screen: Dimensions.get('screen'),
                window: Dimensions.get('window'),
            });
        });

        return () => subscription.remove();
    }, []);

    const navigationMode = useMemo<NavigationMode>(() => {
        if (Platform.OS !== 'android') {
            return 'gesture';
        }

        const { height: screenHeight, width: screenWidth } = dimensions.screen;
        const { height: windowHeight, width: windowWidth } = dimensions.window;
        const isPortrait = screenHeight >= screenWidth && windowHeight >= windowWidth;
        const navigationBarDiff = Math.max(0, Math.round(screenHeight - windowHeight));
        const bottomInset = Math.round(insets.bottom);
        const looksLikeButtonsByDiff = navigationBarDiff >= BUTTONS_THRESHOLD_DIFF && isPortrait;
        const looksLikeButtonsByInset = bottomInset >= BUTTONS_THRESHOLD_INSET;

        return looksLikeButtonsByDiff || looksLikeButtonsByInset ? 'buttons' : 'gesture';
    }, [dimensions, insets.bottom]);

    return {
        isButtonNavigation: navigationMode === 'buttons',
        isGestureNavigation: navigationMode === 'gesture',
        navigationMode,
    };
}
