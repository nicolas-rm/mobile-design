import { type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { ProgressIndicator, type ProgressIndicatorProps } from './progress-indicator';

export type ActivityIndicatorProps = Omit<ProgressIndicatorProps, 'variant' | 'progress' | 'progressSource' | 'size' | 'animated'> & {
    size?: number | 'small' | 'large';
    animating?: boolean;
    hidesWhenStopped?: boolean;
};
export function ActivityIndicator({ size = 'small', animating = true, hidesWhenStopped = true, ...props }: ActivityIndicatorProps) {
    if (!animating && hidesWhenStopped) return null;
    return (
        <ProgressIndicator
            {...props}
            variant="circular"
            progress={undefined}
            progressSource={undefined}
            size={size === 'small' ? 24 : size === 'large' ? 48 : size}
            paused={!animating || props.paused}
        />
    );
}
export type ProgressBarProps = Omit<ProgressIndicatorProps, 'variant' | 'size' | 'progress'> & {
    progress?: number;
    indeterminate?: boolean;
    visible?: boolean;
    style?: StyleProp<ViewStyle>;
    color?: ColorValue;
};
export function ProgressBar({ progress = 0, indeterminate = false, visible = true, ...props }: ProgressBarProps) {
    if (!visible) return null;
    return (
        <ProgressIndicator
            {...props}
            variant="linear"
            progress={indeterminate ? undefined : progress}
            progressSource={indeterminate ? undefined : props.progressSource}
        />
    );
}
