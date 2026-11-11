import { M3eLoader } from 'material-loader-react-native';
import { View, type ViewProps } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { usePaperTheme } from '@/theme/paper';
import { Icon } from './Icon';

export type LoadingProps = Pick<ViewProps, 'accessibilityLabel' | 'style' | 'testID'> & {
    size?: number;
    padding?: number;
    color?: string;
    backgroundColor?: string;
    duration?: number;
    shapeInterval?: number;
};

export function Loading({
    accessibilityLabel = 'Cargando',
    size = 48,
    padding = 5,
    color,
    backgroundColor = 'transparent',
    duration = 4666,
    shapeInterval = 650,
    style,
    testID,
}: LoadingProps) {
    const paperTheme = usePaperTheme();
    const systemReduceMotion = useReducedMotion();
    const reduceMotion = systemReduceMotion || paperTheme.animation.scale === 0;
    const shapeSize = Math.max(1, size - Math.max(0, padding) * 2);
    const shapeColor = color ?? paperTheme.colors.primary;

    return (
        <View
            accessible
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="progressbar"
            accessibilityState={{ busy: true }}
            style={[
                {
                    alignItems: 'center',
                    backgroundColor: backgroundColor ?? paperTheme.colors.primaryContainer,
                    borderRadius: size / 2,
                    height: size,
                    justifyContent: 'center',
                    width: size,
                },
                style,
            ]}
            testID={testID}
        >
            {reduceMotion ? (
                <Icon color={shapeColor} name="dots-horizontal" size={shapeSize} />
            ) : (
                <M3eLoader color={shapeColor} size={shapeSize} duration={duration} shapeInterval={shapeInterval} variant="uncontained" />
            )}
        </View>
    );
}
