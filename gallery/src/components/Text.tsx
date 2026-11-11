import React from 'react';
import { Text as PaperText } from 'react-native-paper';

import { reactNativePaper } from '@/theme/global';

export type TextProps = React.ComponentPropsWithoutRef<typeof PaperText>;

export function Text({ style, testID = 'text', variant = 'bodyMedium', ...props }: TextProps) {
    const mergedStyle = React.useMemo(() => [reactNativePaper.text, style], [style]);

    return <PaperText style={mergedStyle} testID={testID} variant={variant} {...props} />;
}
