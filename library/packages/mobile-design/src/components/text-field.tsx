import { TouchableRipple } from '../ripple';
import React, {
    forwardRef,
    useCallback,
    useEffect,
    useLayoutEffect,
    useImperativeHandle,
    useId,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import {
    Platform,
    Pressable,
    StyleSheet,
    TextInput as NativeTextInput,
    View,
    useWindowDimensions,
    type ColorValue,
    type StyleProp,
    type TextInputProps,
    type TextStyle,
    type ViewStyle,
} from 'react-native';
import { Icon, Text, useLocale, useTheme, type Theme } from 'react-native-paper';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { selectionSpring } from './selection-controls';
import { usePressScope } from './press-scope';

type IconSource = React.ComponentProps<typeof Icon>['source'];

export interface TextFieldHandle {
    focus(): void;
    blur(): void;
    clear(): void;
    isFocused(): boolean;
}

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'value' | 'defaultValue' | 'editable' | 'onChangeText'> {
    value: string;
    onChangeText: (value: string) => void;
    variant?: 'filled' | 'outlined';
    label?: string;
    disabled?: boolean;
    readOnly?: boolean;
    /** Focus appearance owned by a composite trigger; does not move input or keyboard focus. */
    focused?: boolean;
    error?: boolean;
    supportingText?: ReactNode;
    /** Replaces supportingText while error is true; also announced to assistive technology. */
    errorText?: string;
    /** A display counter. Set maxLength separately to enforce an input limit. */
    counter?: boolean | number;
    leading?: ReactNode;
    trailing?: ReactNode;
    leadingIcon?: IconSource;
    trailingIcon?: IconSource;
    onLeadingIconPress?: () => void;
    onTrailingIconPress?: () => void;
    leadingIconAccessibilityLabel?: string;
    trailingIconAccessibilityLabel?: string;
    prefix?: string;
    suffix?: string;
    /** Spoken names for affixes, for example “pesos mexicanos” instead of “$”. */
    prefixAccessibilityLabel?: string;
    suffixAccessibilityLabel?: string;
    /** Outlined fields use this color behind the floating label to cut the outline. */
    backgroundColor?: ColorValue;
    style?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    /** Native input adapter, for hosts such as BottomSheetTextInput that coordinate keyboard focus. */
    inputComponent?: React.ComponentType<TextInputProps & React.RefAttributes<React.ComponentRef<typeof NativeTextInput>>>;
    /** Multiline fields grow with content; turn off for an explicitly sized text area. */
    autoGrow?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    testID?: string;
}

/** MD3 text field with the 16sp resting / 12sp floating label, using the current Paper theme. */
export const TextField = forwardRef<TextFieldHandle, TextFieldProps>(function TextField(
    {
        value,
        onChangeText,
        variant = 'filled',
        label,
        disabled = false,
        readOnly = false,
        focused: focusAppearance,
        error = false,
        supportingText,
        errorText,
        counter,
        leading,
        trailing,
        leadingIcon,
        trailingIcon,
        onLeadingIconPress,
        onTrailingIconPress,
        leadingIconAccessibilityLabel,
        trailingIconAccessibilityLabel,
        prefix,
        suffix,
        prefixAccessibilityLabel,
        suffixAccessibilityLabel,
        backgroundColor,
        style,
        inputStyle,
        inputComponent,
        containerStyle,
        testID = 'text-field',
        onFocus,
        onBlur,
        placeholder,
        multiline,
        maxLength,
        accessibilityLabel,
        accessibilityHint,
        autoGrow = true,
        onContentSizeChange,
        onLayout,
        numberOfLines,
        submitBehavior,
        onKeyPress,
        onSubmitEditing,
        ...inputProps
    },
    forwardedRef
) {
    const theme = useTheme<Theme>();
    const { direction } = useLocale();
    const { fontScale } = useWindowDimensions();
    const nativeRef = useRef<React.ComponentRef<typeof NativeTextInput>>(null);
    const current = useRef({ disabled, readOnly, onChangeText });
    current.current = { disabled, readOnly, onChangeText };
    const canEdit = usePressScope(disabled || readOnly);
    const canInteract = usePressScope(disabled);
    const isMounted = usePressScope(false);
    const fieldId = useId();
    const prefixId = `${fieldId}-prefix`;
    const suffixId = `${fieldId}-suffix`;
    const supportingId = `${fieldId}-supporting`;
    const counterId = `${fieldId}-counter`;
    // Text/caret remain owned by TextInput's native event-count reconciliation.
    // Only the surrounding label and indicator need animated hosts.
    const Input = inputComponent ?? NativeTextInput;
    const [inputFocused, setFocused] = useState(false);
    const focused = !disabled && (focusAppearance ?? inputFocused);
    const [hovered, setHovered] = useState(false);
    const [contentHeight, setContentHeight] = useState(24 * fontScale);
    const floating = focused || value.length > 0;
    const showAffixes = !label || floating;
    const progress = useSharedValue(floating ? 1 : 0);
    const thickness = useSharedValue(1);
    const outlined = variant === 'outlined';
    const fieldColor = backgroundColor ?? (outlined ? theme.colors.surface : theme.colors.surfaceContainerHighest);
    const showError = error && !disabled;
    const textColor = theme.colors.onSurface;
    const errorColor = hovered && !focused ? theme.colors.onErrorContainer : theme.colors.error;
    const labelColor = disabled
        ? theme.colors.onSurface
        : showError
          ? errorColor
          : focused
            ? theme.colors.primary
            : hovered && outlined
              ? theme.colors.onSurface
              : theme.colors.onSurfaceVariant;
    const outlineColor = disabled
        ? theme.colors.onSurface
        : showError
          ? errorColor
          : focused
            ? theme.colors.primary
            : hovered
              ? theme.colors.onSurface
              : outlined
                ? theme.colors.outline
                : theme.colors.onSurfaceVariant;
    const message = showError && errorText ? errorText : supportingText;
    const limit = typeof counter === 'number' ? counter : maxLength;
    const countText = counter !== undefined && counter !== false ? `${value.length}${limit === undefined ? '' : `/${limit}`}` : undefined;
    const leadingContent =
        leading ??
        (leadingIcon ? (
            <FieldIcon
                source={leadingIcon}
                preserveInputFocus={() => nativeRef.current?.isFocused() ?? false}
                disabled={disabled}
                onPress={onLeadingIconPress}
                label={leadingIconAccessibilityLabel}
                testID={`${testID}-leading-icon`}
                color={disabled ? theme.colors.onSurface : theme.colors.onSurfaceVariant}
            />
        ) : null);
    const resolvedTrailingIcon = trailingIcon ?? (showError ? 'error_fill1' : undefined);
    const trailingContent =
        trailing ??
        (resolvedTrailingIcon ? (
            <FieldIcon
                source={resolvedTrailingIcon}
                preserveInputFocus={() => nativeRef.current?.isFocused() ?? false}
                disabled={disabled}
                onPress={trailingIcon ? onTrailingIconPress : undefined}
                label={trailingIconAccessibilityLabel ?? (showError && !trailingIcon ? 'Error' : undefined)}
                testID={`${testID}-trailing-icon`}
                color={disabled ? theme.colors.onSurface : showError ? errorColor : theme.colors.onSurfaceVariant}
            />
        ) : null);
    const labelStart = leadingContent ? 52 : 16;
    const lineHeight = 24 * fontScale;
    const minimumHeight = Math.max(56, label && !outlined ? 16 + 40 * fontScale : 32 + lineHeight);

    // RNW reports scrollHeight including the previous minimum height. Measure the
    // natural textarea synchronously, restoring its style before the next paint,
    // so deleting lines or widening the field can shrink it as well as grow it.
    const measureWebContent = useCallback(() => {
        if (Platform.OS !== 'web' || !multiline || !autoGrow || !isMounted()) return;
        const node = nativeRef.current as unknown as { style?: { height: string; minHeight: string }; scrollHeight?: number } | null;
        if (!node?.style || node.scrollHeight === undefined) return;
        const { height, minHeight } = node.style;
        let naturalHeight: number;
        try {
            node.style.height = '0px';
            node.style.minHeight = '0px';
            naturalHeight = Math.ceil(node.scrollHeight);
        } finally {
            node.style.height = height;
            node.style.minHeight = minHeight;
        }
        setContentHeight(naturalHeight);
    }, [multiline, autoGrow]);
    useLayoutEffect(measureWebContent, [value, fontScale, inputStyle, measureWebContent]);

    const webKeyPress: NonNullable<TextInputProps['onKeyPress']> = (event) => {
        if (!canEdit()) return;
        onKeyPress?.(event);
        const keyEvent = event as typeof event & { key?: string; shiftKey?: boolean };
        const native = event.nativeEvent as typeof event.nativeEvent & { isComposing?: boolean; keyCode?: number; text?: string };
        if (
            submitBehavior === undefined ||
            (keyEvent.key ?? native.key) !== 'Enter' ||
            keyEvent.shiftKey ||
            native.isComposing ||
            native.keyCode === 229 ||
            event.isDefaultPrevented() ||
            (multiline && submitBehavior === 'newline')
        )
            return;
        event.preventDefault(); // Prevent RNW's old blurOnSubmit path from dispatching twice.
        if (submitBehavior !== 'submit') nativeRef.current?.blur();
        native.text = value;
        onSubmitEditing?.(event as unknown as Parameters<NonNullable<TextInputProps['onSubmitEditing']>>[0]);
    };

    useEffect(() => {
        // Paper already resolves auto/on/off; do not apply the OS setting a second time.
        // AndroidX TextFieldImpl uses FastSpatial for label position and indicator thickness.
        progress.set(theme.animation.scale ? withSpring(Number(floating), selectionSpring(theme, 'fast', 'spatial')) : Number(floating));
        const target = focused && !disabled ? 2 : 1;
        thickness.set(disabled || !theme.animation.scale ? target : withSpring(target, selectionSpring(theme, 'fast', 'spatial')));
    }, [floating, focused, disabled, progress, thickness, theme]);
    useEffect(
        () => () => {
            cancelAnimation(progress);
            cancelAnimation(thickness);
        },
        [progress, thickness]
    );

    useEffect(() => {
        if (disabled) {
            nativeRef.current?.blur();
            setFocused(false);
            setHovered(false);
        }
    }, [disabled]);

    useImperativeHandle(
        forwardedRef,
        () => ({
            focus() {
                if (isMounted() && !current.current.disabled) nativeRef.current?.focus();
            },
            blur() {
                if (isMounted()) nativeRef.current?.blur();
            },
            clear() {
                if (isMounted() && !current.current.disabled && !current.current.readOnly) current.current.onChangeText('');
            },
            isFocused() {
                return isMounted() && (nativeRef.current?.isFocused() ?? false);
            },
        }),
        []
    );

    const labelStyle = useAnimatedStyle(() => ({
        fontSize: 16 - 4 * progress.get(),
        lineHeight: 24 - 8 * progress.get(),
        color:
            disabled || !theme.animation.scale || typeof labelColor !== 'string'
                ? labelColor
                : withSpring(labelColor, selectionSpring(theme, 'fast', 'effects')),
    }));
    const indicatorStyle = useAnimatedStyle(() => ({
        borderColor:
            disabled || !theme.animation.scale || typeof outlineColor !== 'string'
                ? outlineColor
                : withSpring(outlineColor, selectionSpring(theme, 'fast', 'effects')),
        borderWidth: outlined ? thickness.get() : 0,
        borderBottomWidth: thickness.get(),
    }));
    const labelContainerStyle = useAnimatedStyle(() => ({
        left: direction === 'rtl' ? undefined : labelStart + (outlined ? (16 - labelStart) * progress.get() - 4 : 0),
        right: direction === 'rtl' ? labelStart + (outlined ? (16 - labelStart) * progress.get() - 4 : 0) : undefined,
        backgroundColor: outlined && progress.get() > 0.001 ? fieldColor : 'transparent',
        transform: [{ translateY: outlined ? -(16 + 8 * fontScale) * progress.get() : -8 * fontScale * progress.get() }],
    }));
    const focusInput = () => {
        // Read-only fields remain focusable for selecting and copying text.
        if (canInteract()) nativeRef.current?.focus();
    };

    return (
        <View style={style} testID={testID}>
            <Pressable
                testID={`${testID}-container`}
                accessible={false}
                {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
                onPress={focusInput}
                onHoverIn={() => {
                    if (canInteract()) setHovered(true);
                }}
                onHoverOut={() => {
                    if (isMounted()) setHovered(false);
                }}
                style={[
                    styles.field,
                    {
                        direction: 'ltr',
                        minHeight: minimumHeight,
                        flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                        backgroundColor: disabled && !outlined ? 'transparent' : fieldColor,
                        borderRadius: outlined ? 4 : 0,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                    },
                    containerStyle,
                ]}
            >
                {disabled && !outlined && (
                    <View
                        pointerEvents="none"
                        style={[
                            StyleSheet.absoluteFill,
                            { borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: theme.colors.onSurface, opacity: 0.04 },
                        ]}
                    />
                )}
                {hovered && !disabled && !outlined && (
                    <View
                        pointerEvents="none"
                        style={[
                            StyleSheet.absoluteFill,
                            { borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: theme.colors.onSurface, opacity: 0.08 },
                        ]}
                    />
                )}
                <Animated.View
                    pointerEvents="none"
                    testID={`${testID}-indicator`}
                    style={[
                        outlined ? styles.outline : styles.underline,
                        {
                            opacity: disabled ? (outlined ? 0.12 : 0.38) : 1,
                        },
                        indicatorStyle,
                    ]}
                />
                {leadingContent && (
                    <View testID={`${testID}-leading`} style={[styles.accessory, { opacity: disabled ? 0.38 : 1 }]}>
                        {leadingContent}
                    </View>
                )}
                <View
                    testID={`${testID}-input-row`}
                    style={[
                        styles.inputRow,
                        {
                            flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                            paddingLeft: (direction === 'rtl' ? trailingContent : leadingContent) ? 4 : 16,
                            paddingRight: (direction === 'rtl' ? leadingContent : trailingContent) ? 4 : 16,
                            paddingTop: label && !outlined ? 8 + 16 * fontScale : 16,
                            paddingBottom: label && !outlined ? 8 : 16,
                        },
                    ]}
                >
                    {prefix && showAffixes && (
                        <Text
                            nativeID={prefixId}
                            testID={`${testID}-prefix`}
                            accessibilityLabel={prefixAccessibilityLabel}
                            style={[
                                theme.fonts.bodyLarge,
                                styles.inputText,
                                {
                                    color: disabled ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                                    opacity: disabled ? 0.38 : 1,
                                    marginLeft: direction === 'rtl' ? 4 : 0,
                                    marginRight: direction === 'rtl' ? 0 : 4,
                                },
                            ]}
                        >
                            {prefix}
                        </Text>
                    )}
                    <Input
                        {...inputProps}
                        ref={nativeRef}
                        {...(Platform.OS === 'web'
                            ? {
                                  'aria-invalid': showError || undefined,
                                  'aria-describedby':
                                      [
                                          (inputProps as TextInputProps & { 'aria-describedby'?: string })['aria-describedby'],
                                          message != null ? supportingId : undefined,
                                          countText ? counterId : undefined,
                                          prefix && showAffixes ? prefixId : undefined,
                                          suffix && showAffixes ? suffixId : undefined,
                                      ]
                                          .filter(Boolean)
                                          .join(' ') || undefined,
                                  'aria-errormessage': showError && message != null ? supportingId : undefined,
                                  'aria-disabled': disabled,
                                  tabIndex: disabled ? -1 : inputProps.tabIndex,
                              }
                            : {})}
                        value={value}
                        onChangeText={(text) => {
                            if (canEdit()) current.current.onChangeText(text);
                        }}
                        onContentSizeChange={(event) => {
                            if (!isMounted()) return;
                            if (Platform.OS === 'web') measureWebContent();
                            else if (multiline && autoGrow) setContentHeight(Math.ceil(event.nativeEvent.contentSize.height));
                            onContentSizeChange?.(event);
                        }}
                        onLayout={(event) => {
                            if (!isMounted()) return;
                            measureWebContent();
                            onLayout?.(event);
                        }}
                        numberOfLines={numberOfLines ?? (Platform.OS === 'web' && multiline && autoGrow ? 1 : undefined)}
                        submitBehavior={submitBehavior}
                        {...(Platform.OS === 'web' && submitBehavior !== undefined ? { blurOnSubmit: false } : {})}
                        onKeyPress={Platform.OS === 'web' ? webKeyPress : onKeyPress}
                        onSubmitEditing={(event) => {
                            if (canEdit()) onSubmitEditing?.(event);
                        }}
                        editable={!disabled && !readOnly}
                        readOnly={disabled || readOnly}
                        multiline={multiline}
                        maxLength={maxLength}
                        placeholder={!label || floating ? placeholder : undefined}
                        placeholderTextColor={disabled ? theme.colors.onSurface : theme.colors.onSurfaceVariant}
                        selectionColor={showError ? theme.colors.error : theme.colors.primary}
                        cursorColor={showError ? theme.colors.error : theme.colors.primary}
                        underlineColorAndroid="transparent"
                        accessibilityLabel={accessibilityLabel ?? label}
                        accessibilityHint={
                            [accessibilityHint, showError && errorText ? errorText : undefined].filter(Boolean).join('. ') || undefined
                        }
                        accessibilityState={{ ...inputProps.accessibilityState, disabled }}
                        onFocus={(event) => {
                            if (!canInteract()) {
                                nativeRef.current?.blur();
                                return;
                            }
                            setFocused(true);
                            onFocus?.(event);
                        }}
                        onBlur={(event) => {
                            if (!canInteract()) return;
                            setFocused(false);
                            onBlur?.(event);
                        }}
                        style={[
                            theme.fonts.bodyLarge,
                            styles.inputText,
                            {
                                flex: 1,
                                minHeight: multiline && autoGrow ? Math.max(lineHeight, contentHeight) : lineHeight,
                                color: textColor,
                                writingDirection: direction,
                                textAlign: direction === 'rtl' ? 'right' : 'left',
                                opacity: disabled ? 0.38 : 1,
                                textAlignVertical: multiline ? 'top' : 'center',
                                // UITextField centers its own text and caret. An explicit paragraph
                                // line height shifts the typed glyphs inside that single-line control.
                                ...(Platform.OS === 'ios' && !multiline ? { lineHeight: 0 } : {}),
                                ...(Platform.OS === 'web' ? { minWidth: 0, outlineStyle: 'solid', outlineWidth: 0 } : {}),
                            },
                            inputStyle,
                        ]}
                        testID={`${testID}-input`}
                    />
                    {suffix && showAffixes && (
                        <Text
                            nativeID={suffixId}
                            testID={`${testID}-suffix`}
                            accessibilityLabel={suffixAccessibilityLabel}
                            style={[
                                theme.fonts.bodyLarge,
                                styles.inputText,
                                {
                                    color: disabled ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                                    opacity: disabled ? 0.38 : 1,
                                    marginLeft: direction === 'rtl' ? 0 : 4,
                                    marginRight: direction === 'rtl' ? 4 : 0,
                                },
                            ]}
                        >
                            {suffix}
                        </Text>
                    )}
                </View>
                {trailingContent && (
                    <View testID={`${testID}-trailing`} style={[styles.accessory, { opacity: disabled ? 0.38 : 1 }]}>
                        {trailingContent}
                    </View>
                )}
                {label && (
                    <Animated.View
                        testID={`${testID}-label-container`}
                        pointerEvents="none"
                        style={[
                            styles.label,
                            {
                                top: outlined ? 16 : 8 + 8 * fontScale,
                                paddingHorizontal: outlined ? 4 : 0,
                                maxWidth: trailingContent ? '70%' : '85%',
                            },
                            labelContainerStyle,
                        ]}
                    >
                        <Animated.Text
                            testID={`${testID}-label`}
                            numberOfLines={1}
                            accessible={false}
                            style={[
                                theme.fonts.bodyLarge,
                                {
                                    writingDirection: direction,
                                    textAlign: direction === 'rtl' ? 'right' : 'left',
                                    color: labelColor,
                                    opacity: disabled ? 0.38 : 1,
                                },
                                labelStyle,
                            ]}
                        >
                            {label}
                        </Animated.Text>
                    </Animated.View>
                )}
            </Pressable>
            {(message != null || countText) && (
                <View style={[styles.supporting, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
                    <Text
                        accessibilityRole={showError ? 'alert' : undefined}
                        accessibilityLiveRegion={showError ? 'polite' : 'none'}
                        style={[
                            theme.fonts.bodySmall,
                            styles.supportingText,
                            {
                                writingDirection: direction,
                                textAlign: direction === 'rtl' ? 'right' : 'left',
                                color: disabled ? theme.colors.onSurface : showError ? theme.colors.error : theme.colors.onSurfaceVariant,
                                opacity: disabled ? 0.38 : 1,
                            },
                        ]}
                        nativeID={supportingId}
                        testID={`${testID}-supporting`}
                    >
                        {message}
                    </Text>
                    {countText && (
                        <Text
                            accessibilityLabel={`Conteo de caracteres: ${countText}`}
                            style={[
                                theme.fonts.bodySmall,
                                {
                                    color: disabled
                                        ? theme.colors.onSurface
                                        : showError
                                          ? theme.colors.error
                                          : theme.colors.onSurfaceVariant,
                                    opacity: disabled ? 0.38 : 1,
                                },
                            ]}
                            nativeID={counterId}
                            testID={`${testID}-counter`}
                        >
                            {countText}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
});

function FieldIcon({
    source,
    color,
    disabled,
    onPress,
    label,
    testID,
    preserveInputFocus,
}: {
    source: IconSource;
    color: ColorValue;
    disabled: boolean;
    onPress?: () => void;
    label?: string;
    testID: string;
    preserveInputFocus: () => boolean;
}) {
    const icon = <Icon source={source} size={24} color={color} />;
    const canPress = usePressScope(disabled);
    return onPress ? (
        <TouchableRipple
            key={disabled ? 'inactive' : 'interactive'}
            disabled={disabled}
            {...(Platform.OS === 'web'
                ? {
                      onMouseDown: (event: { preventDefault(): void }) => {
                          if (preserveInputFocus()) event.preventDefault();
                      },
                  }
                : {})}
            onPress={(event) => {
                event.stopPropagation();
                if (canPress()) onPress?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={styles.iconButton}
            borderless
            testID={testID}
        >
            {icon}
        </TouchableRipple>
    ) : (
        <View accessible={Boolean(label)} accessibilityLabel={label} style={styles.iconButton} testID={testID}>
            {icon}
        </View>
    );
}

const styles = StyleSheet.create({
    field: { direction: 'ltr', flexDirection: 'row', alignItems: 'center' },
    outline: { ...StyleSheet.absoluteFill, borderRadius: 4 },
    underline: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    inputRow: { direction: 'ltr', flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
    inputText: { fontSize: 16, lineHeight: 24, padding: 0, margin: 0, includeFontPadding: false },
    accessory: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
    iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
    label: { position: 'absolute' },
    supporting: { direction: 'ltr', flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingTop: 4 },
    supportingText: { flex: 1, fontSize: 12, lineHeight: 16 },
});
