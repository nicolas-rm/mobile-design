import React from 'react';
import { Surface as PaperSurface, type SurfaceProps as PaperSurfaceProps } from 'react-native-paper';

import { reactNativePaper } from '@/theme/global';

export type SurfaceProps = PaperSurfaceProps;

export function Surface({ elevation = 0, mode = 'flat', style, testID = 'surface', ...props }: SurfaceProps) {
    const mergedStyle = React.useMemo(() => [reactNativePaper.surface, style], [style]);

    return <PaperSurface elevation={elevation} mode={mode} style={mergedStyle} testID={testID} {...props} />;
}
