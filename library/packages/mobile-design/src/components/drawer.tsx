import { TouchableRipple } from '../ripple';
import { getScrollIndicatorProps, type ScrollIndicatorOptions } from '../scroll-indicators';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Platform, ScrollView, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, Surface, Text, useLocale, useTheme, type Theme } from 'react-native-paper';
import type { NavigationDestination } from './navigation';
import { Badge, Divider } from './content';
import { withAlpha } from '../color';
import { useNavigationFocus, type NavigationFocusEvent } from './navigation-focus';
import { usePressScope } from './press-scope';

/** Unlike bars and rails, drawer destinations may consist of a label without an icon. */
export type NavigationDrawerDestination = Omit<NavigationDestination, 'icon'> & { icon?: ComponentProps<typeof Icon>['source'] };

export type NavigationDrawerProps = {
    /** Scrollbars are opt-in for this component only; both axes are hidden by default. */
    scrollIndicators?: ScrollIndicatorOptions;
    items: readonly NavigationDrawerDestination[];
    value: string;
    onValueChange: (key: string) => void;
    header?: ReactNode;
    footer?: ReactNode;
    /** Custom navigation content, including any scrolling and disclosure groups. */
    children?: ReactNode;
    width?: number;
    modal?: boolean;
    accessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

/** Current drawer layout; Paper's Drawer.Item reserves an extra32dp after every label. */
export function NavigationDrawer({
    scrollIndicators,
    items,
    value,
    onValueChange,
    header,
    footer,
    children,
    width = 360,
    modal = false,
    accessibilityLabel,
    style,
    testID = 'mobile-navigation-drawer-standard',
}: NavigationDrawerProps) {
    const theme = useTheme<Theme>();
    const rtl = useLocale().direction === 'rtl';
    const focus = useNavigationFocus(items);
    return (
        <Surface
            mode="flat"
            elevation={modal ? 1 : 0}
            style={[
                {
                    width: Math.min(360, width),
                    maxWidth: '100%',
                    borderTopEndRadius: 16,
                    borderBottomEndRadius: 16,
                    backgroundColor: modal ? theme.colors.surfaceContainerLow : theme.colors.surface,
                },
                style,
            ]}
            testID={testID}
        >
            {header}
            {children ?? (
                <ScrollView
                    {...(Platform.OS === 'web'
                        ? {
                              role: 'tablist' as const,
                              'aria-orientation': 'vertical' as const,
                              tabIndex: -1,
                              onFocus: (event: { target: unknown; currentTarget: unknown }) => {
                                  // A scrollable div can receive focus before its controls.
                                  // Forward that entry to the first available destination.
                                  if (event.target === event.currentTarget) focus.focusFirst();
                              },
                          }
                        : {})}
                    accessibilityLabel={accessibilityLabel}
                    testID={`${testID}-scroll`}
                    style={{ flexShrink: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12 }}
                    {...getScrollIndicatorProps(scrollIndicators)}
                >
                    {items.map((item, index) => (
                        <View key={item.key}>
                            {item.section && item.section !== items[index - 1]?.section ? (
                                <>
                                    {index > 0 ? <Divider style={{ marginVertical: 16, marginStart: 16, marginEnd: 16 }} /> : null}
                                    <Text
                                        variant="titleSmall"
                                        accessibilityRole="header"
                                        style={{ paddingHorizontal: 16, paddingVertical: 16, color: theme.colors.onSurfaceVariant, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }}
                                    >
                                        {item.section}
                                    </Text>
                                </>
                            ) : null}
                            <NavigationDrawerItem
                                item={item}
                                selected={value === item.key}
                                onPress={() => onValueChange(item.key)}
                                focusRef={focus.refFor(item.key)}
                                onKeyDown={(event) => focus.onKeyDown(item.key, event)}
                                testID={item.testID ?? `${testID}-${item.key}`}
                            />
                        </View>
                    ))}
                </ScrollView>
            )}
            {footer}
        </Surface>
    );
}

export function NavigationDrawerItem({
    item,
    selected,
    onPress,
    focusRef,
    onKeyDown,
    testID,
    href,
    style,
    contentStyle,
}: {
    item: NavigationDrawerDestination;
    selected: boolean;
    onPress?: () => void;
    focusRef?: (target: unknown) => void;
    onKeyDown?: (event: NavigationFocusEvent) => void;
    testID?: string;
    href?: string;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
}) {
    const theme = useTheme<Theme>();
    const rtl = useLocale().direction === 'rtl';
    const { fontScale } = useWindowDimensions();
    const canPress = usePressScope(Boolean(item.disabled), item.key);
    const link = Platform.OS === 'web' && !item.disabled ? href : undefined;
    const [hovered, setHovered] = useState(false),
        [focused, setFocused] = useState(false);
    useEffect(() => {
        if (item.disabled) {
            setHovered(false);
            setFocused(false);
        }
    }, [item.disabled]);
    const color = selected
        ? theme.colors.onSecondaryContainer
        : hovered || focused
          ? theme.colors.onSurface
          : theme.colors.onSurfaceVariant;
    const stateLayerColor = selected ? theme.colors.onSecondaryContainer : theme.colors.onSurface;
    return (
        <TouchableRipple
            key={item.disabled ? 'inactive' : 'interactive'}
            ref={focusRef}
            onKeyDown={onKeyDown}
            accessibilityRole={link ? 'link' : 'tab'}
            accessibilityState={{ selected: link ? undefined : selected, disabled: item.disabled }}
            {...(link ? { href: link, 'aria-current': selected ? 'page' : undefined } : {})}
            accessibilityLabel={
                item.accessibilityLabel ??
                `${item.label}${item.badge === true ? ', novedades' : typeof item.badge === 'number' || typeof item.badge === 'string' ? `, ${item.badge}` : ''}`
            }
            disabled={item.disabled}
            rippleColor={typeof stateLayerColor === 'string' ? withAlpha(stateLayerColor, 0.1) : theme.colors.stateLayerPressed}
            onPress={
                onPress
                    ? () => {
                          if (canPress()) onPress();
                      }
                    : undefined
            }
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            onPressIn={(event) => {
                if (Platform.OS === 'web' && !(event.nativeEvent as { key?: string }).key) setFocused(false);
            }}
            onFocus={(event) => {
                // RNW's modal trap also tries tabindex=-1 nodes at its boundary.
                // A disabled destination remains readable but cannot retain input focus.
                if (item.disabled && Platform.OS === 'web') {
                    (event.currentTarget as unknown as HTMLElement).blur();
                    return;
                }
                setFocused(Platform.OS !== 'web' || Boolean((event.currentTarget as unknown as HTMLElement)?.matches?.(':focus-visible')));
            }}
            onBlur={() => setFocused(false)}
            style={[
                {
                    minHeight: 56,
                    borderRadius: 28,
                    overflow: 'hidden',
                    backgroundColor: selected ? theme.colors.secondaryContainer : 'transparent',
                    opacity: item.disabled ? 0.38 : 1,
                },
                style,
            ]}
            testID={testID}
        >
            <View
                pointerEvents="none"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                style={[
                    {
                        direction: 'ltr',
                        flexDirection: rtl ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        minHeight: 56,
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        gap: 12,
                    },
                    contentStyle,
                ]}
            >
                {!item.disabled && (hovered || focused) ? (
                    <View style={{ position: 'absolute', inset: 0, backgroundColor: stateLayerColor, opacity: focused ? 0.1 : 0.08 }} />
                ) : null}
                {item.icon ? <Icon source={selected ? (item.selectedIcon ?? item.icon) : item.icon} size={24} color={color} /> : null}
                <Text
                    variant="labelLarge"
                    numberOfLines={fontScale > 1 ? 2 : 1}
                    style={{ flex: 1, minWidth: 0, color, writingDirection: rtl ? 'rtl' : 'ltr', textAlign: rtl ? 'right' : 'left' }}
                >
                    {item.label}
                </Text>
                {item.badge !== undefined && item.badge !== false ? (
                    item.badge === true ? (
                        <Badge variant="dot" />
                    ) : (
                        <Text variant="labelLarge" style={{ color, writingDirection: typeof item.badge === 'number' ? 'ltr' : rtl ? 'rtl' : 'ltr' }}>
                            {typeof item.badge === 'number' && item.badge > 999 ? '999+' : item.badge}
                        </Text>
                    )
                ) : null}
            </View>
        </TouchableRipple>
    );
}
