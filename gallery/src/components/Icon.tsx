import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { toIconColor } from '@/theme/color-utils';
import { usePaperTheme } from '@/theme/paper';

type MaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type IconProps = Omit<ComponentProps<typeof MaterialCommunityIcons>, 'color'> & {
    color?: ColorValue;
};

export function Icon({ color, size = 24, ...props }: IconProps) {
    const paperTheme = usePaperTheme();

    return <MaterialCommunityIcons color={toIconColor(color ?? paperTheme.colors.onSurfaceVariant)} size={size} {...props} />;
}

export type IconName = MaterialCommunityIconName;
