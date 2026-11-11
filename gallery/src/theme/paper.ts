import { useTheme } from 'react-native-paper';
import { darkTheme } from '@/theme/dark-theme';
import { lightTheme } from '@/theme/light-theme';

export type AppTheme = typeof lightTheme;

export function createPaperTheme(colorScheme: 'light' | 'dark', reduceMotionEnabled: boolean): AppTheme {
    const baseTheme = colorScheme === 'dark' ? darkTheme : lightTheme;

    return {
        ...baseTheme,
        animation: {
            ...baseTheme.animation,
            scale: reduceMotionEnabled ? 0 : 1,
        },
    };
}

export { darkTheme, lightTheme };

export function usePaperTheme() {
    return useTheme<AppTheme>();
}
