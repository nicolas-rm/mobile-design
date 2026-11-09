import { TouchableRipple } from '../ripple';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Avatar as PaperAvatar } from 'react-native-paper';
import { useMobileTheme } from '../core';
import { withAlpha } from '../color';

export type AvatarButtonProps = Omit<
    ComponentProps<typeof TouchableRipple>,
    'children' | 'onPress' | 'accessibilityLabel' | 'style' | 'borderless' | 'background'
> & {
    children: ReactNode;
    onPress: NonNullable<ComponentProps<typeof TouchableRipple>['onPress']>;
    accessibilityLabel: string;
    style?: StyleProp<ViewStyle>;
};

/** Interactive avatar target. Visual Avatar.Icon/Image/Text remain noninteractive. */
export function AvatarButton({
    children,
    onPress,
    accessibilityLabel,
    disabled = false,
    style,
    theme: override,
    rippleColor,
    accessibilityState,
    onPressIn,
    onPressOut,
    onHoverIn,
    onHoverOut,
    onFocus,
    onBlur,
    testID = 'mobile-avatar-button',
    ...props
}: AvatarButtonProps) {
    const theme = useMobileTheme(override);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [pressed, setPressed] = useState(false);
    useEffect(() => {
        if (disabled) {
            setHovered(false);
            setFocused(false);
            setPressed(false);
        }
    }, [disabled]);
    return (
        <TouchableRipple
            {...props}
            theme={theme}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ ...accessibilityState, disabled }}
            disabled={disabled}
            borderless={false}
            rippleColor={
                rippleColor ??
                (typeof theme.colors.onSurface === 'string' ? withAlpha(theme.colors.onSurface, 0.1) : theme.colors.stateLayerPressed)
            }
            onPress={(event) => {
                if (!disabled) onPress(event);
            }}
            onPressIn={(event) => {
                if (!disabled) {
                    setPressed(true);
                    onPressIn?.(event);
                }
            }}
            onPressOut={(event) => {
                setPressed(false);
                onPressOut?.(event);
            }}
            onHoverIn={(event) => {
                if (!disabled) {
                    setHovered(true);
                    onHoverIn?.(event);
                }
            }}
            onHoverOut={(event) => {
                setHovered(false);
                onHoverOut?.(event);
            }}
            onFocus={(event) => {
                if (!disabled) {
                    setFocused(true);
                    onFocus?.(event);
                }
            }}
            onBlur={(event) => {
                setFocused(false);
                setPressed(false);
                onBlur?.(event);
            }}
            // The same circular host clips native ripple and owns the complete target.
            // An explicit background also prevents Paper's web hover from stacking.
            style={[
                { backgroundColor: 'transparent' },
                style,
                {
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: disabled ? 0.38 : 1,
                },
            ]}
            testID={testID}
        >
            <View
                pointerEvents="none"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{ flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}
            >
                {children}
                {!disabled && !pressed && (hovered || focused) ? (
                    <View
                        pointerEvents="none"
                        style={[
                            StyleSheet.absoluteFill,
                            { borderRadius: 24, backgroundColor: theme.colors.onSurface, opacity: focused ? 0.1 : 0.08 },
                        ]}
                        testID={`${testID}-state-layer`}
                    />
                ) : null}
            </View>
        </TouchableRipple>
    );
}

export const Avatar = { ...PaperAvatar, Button: AvatarButton };
