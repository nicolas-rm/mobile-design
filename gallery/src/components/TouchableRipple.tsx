import React from 'react';
import { TouchableRipple as PaperTouchableRipple, type TouchableRippleProps as PaperTouchableRippleProps } from 'react-native-paper';

import { reactNativePaper } from '@/theme/global';

export type TouchableRippleProps = PaperTouchableRippleProps;

export function TouchableRipple({ style, testID = 'touchable-ripple', ...props }: TouchableRippleProps & { testID?: string }) {
    const mergedStyle = React.useMemo(() => [reactNativePaper.touchableRipple, style], [style]);

    return <PaperTouchableRipple style={mergedStyle} testID={testID} {...props} />;
}
