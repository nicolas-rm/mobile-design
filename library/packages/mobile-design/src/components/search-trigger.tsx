import type { StyleProp, ViewStyle } from 'react-native';
import { useMobileTheme } from '../core';
import { TouchableRipple, type TouchableRippleProps } from '../ripple';

export type SearchTriggerProps = Omit<TouchableRippleProps, 'borderless' | 'style'> & { style?: StyleProp<ViewStyle> };

/** Shared capsule indication. Independent actions belong beside this target. */
export function SearchTrigger({
    style,
    theme: override,
    rippleColor,
    underlayColor,
    accessibilityRole = 'button',
    ...props
}: SearchTriggerProps) {
    const theme = useMobileTheme(override);
    return (
        <TouchableRipple
            {...props}
            theme={theme}
            accessibilityRole={accessibilityRole}
            borderless={false}
            rippleColor={rippleColor ?? theme.colors.stateLayerPressed}
            underlayColor={underlayColor}
            style={[{ minHeight: 56 }, style, { borderRadius: 28, overflow: 'hidden' }]}
        />
    );
}
