/*
 * Shadow layers adapted from React Native Paper6.0.0-alpha.0 Surface/elevation
 * (MIT, Copyright 2017 Callstack). MD3 elevation tokens, not a new shadow scale.
 * Unlike Paper's iOS Surface, both native layers receive Reanimated geometry.
 */
import type { ComponentProps, ReactNode } from 'react';
import { Platform, StyleSheet, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme, type Theme } from 'react-native-paper';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { withAlpha } from '../color';

type Elevation = 0 | 1 | 2 | 3 | 4 | 5;
type Props = Omit<ViewProps, 'style'> & {
    children?: ReactNode;
    elevation?: Elevation;
    mode?: 'flat' | 'elevated';
    style?: ComponentProps<typeof Animated.View>['style'];
    geometry?: AnimatedStyle<ViewStyle>;
};
const androidLevels = [0, 1, 3, 6, 8, 12];
const layers = [
    { alpha: 0.15, y: [0, 1, 2, 4, 6, 8], blur: [0, 3, 6, 8, 10, 12] },
    { alpha: 0.3, y: [0, 1, 1, 1, 2, 4], blur: [0, 2, 2, 3, 3, 4] },
];

/** A Paper-context surface whose shadow and fill share the same UI-thread shape. */
export function AnimatedActionSurface({ elevation = 0, mode = 'elevated', style, geometry, children, ...props }: Props) {
    const theme = useTheme<Theme>();
    const flat = StyleSheet.flatten(style as StyleProp<ViewStyle>) ?? {};
    const level = mode === 'flat' ? 0 : elevation;
    const backgroundColor = flat.backgroundColor ?? theme.colors.elevation[`level${level}`];
    if (Platform.OS === 'android')
        return (
            <Animated.View {...props} style={[{ backgroundColor, elevation: androidLevels[level] }, style, geometry]}>
                {children}
            </Animated.View>
        );
    if (Platform.OS === 'web')
        return (
            <Animated.View
                {...props}
                style={[
                    {
                        backgroundColor,
                        boxShadow:
                            level && typeof theme.colors.shadow === 'string'
                                ? layers.map((layer) => ({
                                      offsetX: 0,
                                      offsetY: layer.y[level],
                                      blurRadius: layer.blur[level],
                                      color: withAlpha(theme.colors.shadow as string, layer.alpha),
                                  }))
                                : undefined,
                    },
                    style,
                    geometry,
                ]}
            >
                {children}
            </Animated.View>
        );

    const corners = Object.fromEntries(Object.entries(flat).filter(([key]) => key.startsWith('border') && key.endsWith('Radius')));
    const shadow = (index: number): ViewStyle => ({
        shadowColor: theme.colors.shadow,
        shadowOpacity: level ? layers[index].alpha : 0,
        shadowOffset: { width: 0, height: layers[index].y[level] },
        // RN's iOS shadowRadius is Gaussian sigma, CSS blur-radius is2×sigma.
        shadowRadius: layers[index].blur[level] * 0.5,
    });
    return (
        <Animated.View {...props} style={[{ backgroundColor, ...shadow(0) }, style, geometry]}>
            <Animated.View
                style={[
                    { alignSelf: 'stretch', backgroundColor, ...corners, ...(flat.flex || flat.height ? { flex: 1 } : {}), ...shadow(1) },
                    geometry,
                ]}
            >
                {children}
            </Animated.View>
        </Animated.View>
    );
}
