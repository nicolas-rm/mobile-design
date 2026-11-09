declare module 'react-native-paper/lib/module/theme/accessibility/ReduceMotionContext' {
    import type { Context } from 'react';
    export const ReduceMotionContext: Context<boolean>;
}
declare module 'react-native-paper/lib/module/components/MaterialCommunityIcon' {
    import type { ComponentType } from 'react';
    import type { ColorValue } from 'react-native';
    const Icon: ComponentType<{ name: string; size: number; color?: ColorValue; direction: 'ltr' | 'rtl'; testID?: string }>;
    export default Icon;
}
declare module 'react-native-paper/lib/module/core/settings' {
    import type { Context } from 'react';
    import type { ProviderProps } from 'react-native-paper';
    export const SettingsContext: Context<NonNullable<ProviderProps['settings']>>;
}
