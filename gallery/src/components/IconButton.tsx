import React from 'react';
import { IconButton as PaperIconButton, type IconButtonProps as PaperIconButtonProps } from 'react-native-paper';

import { reactNativePaper } from '@/theme/global';

export type IconButtonProps = PaperIconButtonProps;

export function IconButton({ size = 24, style, testID = 'icon-button', ...props }: IconButtonProps) {
    const mergedStyle = React.useMemo(() => [reactNativePaper.iconButton, style], [style]);

    return <PaperIconButton size={size} style={mergedStyle} testID={testID} {...props} />;
}
