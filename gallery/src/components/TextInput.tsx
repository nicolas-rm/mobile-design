import React from 'react';
import { PixelRatio } from 'react-native';
import Animated from 'react-native-reanimated';
import {
    TextInput as PaperTextInput,
    type TextInputIconProps as PaperTextInputIconProps,
    type TextInputProps as PaperTextInputProps,
} from 'react-native-paper';

import { reactNativePaper } from '@/theme/global';
import { usePaperTheme } from '@/theme/paper';

export type TextInputProps = PaperTextInputProps & {
    required?: boolean;
    requiredIndicatorTestID?: string;
};
export type TextInputIconProps = PaperTextInputIconProps;

function TextInputRoot({
    accessibilityLabel,
    accessibilityState,
    disabled,
    editable,
    startAccessory,
    endAccessory,
    focusable,
    pointerEvents,
    label,
    required,
    requiredIndicatorTestID,
    renderLabel,
    variant = 'outlined',
    placeholder,
    style,
    testID = 'text-input',
    ...props
}: TextInputProps) {
    const paperTheme = usePaperTheme();
    const inputLabel = required && label ? `${label} *` : label;
    // Align outlined multiline accessories with the first text line, not the top padding.
    const multilineAccessoryStyle =
        props.multiline && variant === 'outlined' ? { marginTop: Math.ceil((props.dense ? 5 : 8) * PixelRatio.getFontScale()) } : undefined;
    const mergedStyle = React.useMemo(
        () => [reactNativePaper.textInput, disabled && { color: paperTheme.colors.onSurfaceVariant }, style],
        [disabled, paperTheme.colors.onSurfaceVariant, style]
    );

    return (
        <PaperTextInput
            {...props}
            accessibilityLabel={accessibilityLabel ?? (required && label ? `${label}, obligatorio` : label) ?? placeholder}
            accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
            // Keep the same Paper field legible without its stacked disabled opacity.
            // Native editing, focus, pointer interaction and accessibility still remain disabled.
            startAccessory={
                startAccessory
                    ? (accessoryProps) =>
                          startAccessory({
                              ...accessoryProps,
                              style: [accessoryProps.style, multilineAccessoryStyle],
                              disabled: Boolean(disabled) || accessoryProps.disabled,
                          })
                    : undefined
            }
            endAccessory={
                endAccessory
                    ? (accessoryProps) =>
                          endAccessory({
                              ...accessoryProps,
                              style: [accessoryProps.style, multilineAccessoryStyle],
                              disabled: Boolean(disabled) || accessoryProps.disabled,
                          })
                    : undefined
            }
            editable={disabled ? false : editable}
            focusable={disabled ? false : focusable}
            pointerEvents={disabled ? 'none' : pointerEvents}
            label={inputLabel}
            renderLabel={
                required && label
                    ? (_label, indicatorStyle) => (
                          <>
                              {label}
                              <Animated.Text
                                  style={[indicatorStyle, { color: paperTheme.colors.error, fontWeight: '700' }]}
                                  testID={requiredIndicatorTestID ?? `${testID}-required-indicator`}
                              >
                                  {' *'}
                              </Animated.Text>
                          </>
                      )
                    : renderLabel
            }
            floatingLabelOffset={required ? 0 : 1}
            variant={variant}
            placeholder={placeholder}
            style={mergedStyle}
            testID={testID}
        />
    );
}

export function TextInputIcon({ style, onPress, ...props }: TextInputIconProps) {
    return (
        <PaperTextInput.Icon
            {...props}
            onPress={onPress}
            // Interactive icons retain circular press feedback; decorative icons must not crop their glyph.
            style={[{ borderRadius: onPress ? 999 : 0, backgroundColor: 'transparent' }, style]}
        />
    );
}
export const TextInput = Object.assign(TextInputRoot, { Icon: TextInputIcon });
