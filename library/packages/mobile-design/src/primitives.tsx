import type { ComponentProps } from 'react';
import { Icon as PaperIcon, useTheme, type Theme } from 'react-native-paper';

export { Text } from 'react-native-paper';
export { TouchableRipple } from './ripple';
export { Button } from './components/button';
export { IconButton } from './components/icon-button';
export type IconName = string;
export type IconProps = Omit<ComponentProps<typeof PaperIcon>, 'source'> & { name: string };
export function Icon({ name, color, ...props }: IconProps) {
    const theme = useTheme<Theme>();
    return <PaperIcon {...props} color={color ?? theme.colors.onSurfaceVariant} source={name} />;
}
