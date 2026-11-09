import { useImperativeHandle, useRef } from 'react';
import { Platform, TextInput, View, useWindowDimensions, type TextInputInstance, type TextInputProps, type TextStyle } from 'react-native';
import { ActivityIndicator, Icon, Surface, useLocale, type SearchbarProps } from 'react-native-paper';
import { useMobileTheme } from '../core';
import { SearchIconButton } from './search-icon-button';
import { Divider } from './content';
import { usePressScope } from './press-scope';

/** MD3 input composition: a 56dp surface, 48dp targets and 4dp inner gaps. */
export function Searchbar({
    ref,
    mode = 'bar',
    value,
    placeholder = 'Buscar',
    accessibilityLabel = placeholder,
    icon = 'search',
    iconColor,
    onIconPress,
    searchAccessibilityLabel = 'Buscar',
    clearIcon = 'close',
    clearAccessibilityLabel = 'Borrar búsqueda',
    onClearIconPress,
    traileringIcon,
    traileringIconColor,
    traileringIconAccessibilityLabel,
    onTraileringIconPress,
    right,
    loading = false,
    showDivider = true,
    elevation = 0,
    inputStyle,
    placeholderTextColor,
    theme: override,
    style,
    testID = 'search-bar',
    editable = true,
    autoCapitalize = 'none',
    autoCorrect = false,
    onChangeText,
    accessibilityState,
    ...props
}: SearchbarProps) {
    const theme = useMobileTheme(override);
    const rtl = useLocale().direction === 'rtl';
    const { fontScale } = useWindowDimensions();
    const root = useRef<TextInputInstance>(null);
    const inputEditable = editable && !props.readOnly;
    const canClear = usePressScope(!inputEditable || Boolean(loading) || value.length === 0, testID);
    const latest = useRef({ onChangeText, onClearIconPress });
    latest.current = { onChangeText, onClearIconPress };
    useImperativeHandle(
        ref,
        () => ({
            focus: () => root.current?.focus(),
            blur: () => root.current?.blur(),
            clear: () => root.current?.clear(),
            isFocused: () => root.current?.isFocused() ?? false,
            setNativeProps: (args: TextInputProps) => root.current?.setNativeProps(args),
            setSelection: (start: number, end: number) => root.current?.setSelection(start, end),
        }),
        []
    );
    const color = iconColor ?? theme.colors.onSurface;
    const trailingColor = iconColor ?? theme.colors.onSurfaceVariant;
    const platformInput = Platform.select<TextStyle>({
        ios: { lineHeight: 0 },
        android: { includeFontPadding: false, textAlignVertical: 'center' },
        // Browsers can still paint outline-style:auto with a zero width.
        web: { outlineStyle: 'solid', outlineWidth: 0 },
    });
    const barMode = mode === 'bar';
    const height = Math.max(
        barMode ? 56 : 72,
        (theme.fonts.bodyLarge.lineHeight ?? 24) * (props.allowFontScaling === false ? 1 : fontScale) + 8
    );
    return (
        <Surface
            elevation={elevation}
            container
            theme={theme}
            testID={`${testID}-container`}
            style={[
                {
                    backgroundColor: theme.colors.surfaceContainerHigh,
                    borderRadius: barMode ? 28 : 0,
                    minHeight: height,
                    paddingHorizontal: 4,
                    direction: 'ltr',
                    flexDirection: rtl ? 'row-reverse' : 'row',
                    alignItems: 'center',
                },
                style,
            ]}
        >
            {onIconPress ? (
                <SearchIconButton
                    icon={icon}
                    iconColor={color}
                    onPress={onIconPress}
                    accessibilityLabel={searchAccessibilityLabel}
                    style={{ margin: 0 }}
                    testID={`${testID}-icon`}
                />
            ) : (
                <View
                    pointerEvents="none"
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
                    testID={`${testID}-icon`}
                >
                    <Icon source={icon} color={color} size={24} />
                </View>
            )}
            <TextInput
                {...props}
                ref={root}
                value={value}
                onChangeText={onChangeText}
                editable={inputEditable}
                placeholder={placeholder}
                accessibilityLabel={accessibilityLabel}
                {...(Platform.OS === 'web' ? { role: 'searchbox' as const } : { accessibilityRole: 'search' as const })}
                accessibilityState={{ ...accessibilityState, busy: Boolean(loading) }}
                placeholderTextColor={placeholderTextColor ?? theme.colors.onSurfaceVariant}
                selectionColor={props.selectionColor ?? theme.colors.primary}
                underlineColorAndroid="transparent"
                returnKeyType={props.returnKeyType ?? 'search'}
                autoCapitalize={autoCapitalize}
                autoCorrect={autoCorrect}
                keyboardAppearance={props.keyboardAppearance ?? (theme.dark ? 'dark' : 'light')}
                style={[
                    {
                        flex: 1,
                        minWidth: 0,
                        alignSelf: 'stretch',
                        minHeight: height,
                        paddingHorizontal: 4,
                        paddingVertical: 0,
                        ...theme.fonts.bodyLarge,
                        color: theme.colors.onSurface,
                        textAlign: rtl ? 'right' : 'left',
                        ...platformInput,
                    },
                    inputStyle,
                ]}
                testID={testID}
            />
            {loading ? (
                <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator testID={`${testID}-loading`} />
                </View>
            ) : right == null && value.length > 0 ? (
                <SearchIconButton
                    icon={clearIcon}
                    iconColor={trailingColor}
                    accessibilityLabel={clearAccessibilityLabel}
                    disabled={!inputEditable}
                    onPress={(event) => {
                        if (!canClear()) return;
                        root.current?.clear();
                        latest.current.onChangeText?.('');
                        latest.current.onClearIconPress?.(event);
                        root.current?.focus();
                    }}
                    style={{ margin: 0 }}
                    testID={`${testID}-clear-icon`}
                />
            ) : null}
            {barMode && traileringIcon && !loading && (!value || right !== undefined) ? (
                <SearchIconButton
                    icon={traileringIcon}
                    iconColor={traileringIconColor ?? theme.colors.onSurfaceVariant}
                    onPress={onTraileringIconPress}
                    accessibilityLabel={traileringIconAccessibilityLabel}
                    style={{ margin: 0 }}
                    testID={`${testID}-trailering-icon`}
                />
            ) : null}
            {barMode ? right?.({ color: theme.colors.onSurface, style: { marginRight: 0 }, testID }) : null}
            {!barMode && showDivider ? (
                <Divider
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.outline }}
                    testID={`${testID}-divider`}
                />
            ) : null}
        </Surface>
    );
}
