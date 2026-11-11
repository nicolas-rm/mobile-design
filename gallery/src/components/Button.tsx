import React from 'react';
import { Button as PaperButton, type ButtonProps as PaperButtonProps } from 'react-native-paper';

import { reactNativePaper } from '@/theme/global';

export type ButtonProps = PaperButtonProps;

export function Button({
    accessibilityLabel,
    accessibilityRole = 'button',
    children,
    contentStyle,
    mode = 'contained',
    style,
    testID = 'button',
    uppercase = false,
    ...props
}: ButtonProps) {
    const mergedStyle = React.useMemo(() => [reactNativePaper.button, style], [style]);
    const mergedContentStyle = React.useMemo(() => [reactNativePaper.buttonContent, contentStyle], [contentStyle]);
    const fallbackAccessibilityLabel = typeof children === 'string' || typeof children === 'number' ? String(children) : undefined;

    return (
        <PaperButton
            accessibilityLabel={accessibilityLabel ?? fallbackAccessibilityLabel}
            accessibilityRole={accessibilityRole}
            contentStyle={mergedContentStyle}
            mode={mode}
            style={mergedStyle}
            testID={testID}
            uppercase={uppercase}
            {...props}
        >
            {children}
        </PaperButton>
    );
}
