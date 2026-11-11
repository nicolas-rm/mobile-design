import React from 'react';
import { SegmentedButtons as PaperSegmentedButtons, type SegmentedButtonsProps as PaperSegmentedButtonsProps } from 'react-native-paper';

import { reactNativePaper } from '@/theme/global';

export type SegmentedButtonsProps = PaperSegmentedButtonsProps;

export function SegmentedButtons({ density = 'regular', style, ...props }: SegmentedButtonsProps) {
    const mergedStyle = React.useMemo(() => [reactNativePaper.segmentedButtons, style], [style]);

    return <PaperSegmentedButtons density={density} style={mergedStyle} {...props} />;
}
