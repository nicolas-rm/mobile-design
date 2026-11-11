import { useMobileTheme } from 'mobile-design/react-native';

export function useAppTheme() {
    return { themeMode: useMobileTheme().dark ? 'dark' as const : 'light' as const };
}
