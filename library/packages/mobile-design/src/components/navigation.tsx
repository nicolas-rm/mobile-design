import { TouchableRipple } from '../ripple';
import { getScrollIndicatorProps, type ScrollIndicatorOptions } from '../scroll-indicators';
import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Platform, ScrollView, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, Text, useLocale, useTheme, type Theme } from 'react-native-paper';
import Animated, {
    cancelAnimation,
    ReduceMotion,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SideSheet } from './sheets';
import { NavigationDrawer, type NavigationDrawerDestination } from './drawer';
import { navigationSelectionFrame, useNavigationSelection } from './navigation-bar';
import { Badge, BadgedBox } from './content';
import { IconButton } from './icon-button';
import { withAlpha } from '../color';
import { navigationRailDestinationLayout } from './navigation-rail-layout';
import { useNavigationFocus, type NavigationFocusEvent } from './navigation-focus';
import { usePressScope } from './press-scope';

const AnimatedRailTouchableRipple = Animated.createAnimatedComponent(TouchableRipple);

type IconSource = ComponentProps<typeof Icon>['source'];
export type NavigationDestination = {
    key: string;
    label: string;
    icon: IconSource;
    selectedIcon?: IconSource;
    disabled?: boolean;
    badge?: string | number | boolean;
    accessibilityLabel?: string;
    section?: string;
    testID?: string;
    hiddenWhenCollapsed?: boolean;
};

export type NavigationRailProps = {
    /** Scrollbars are opt-in for this component only; both axes are hidden by default. */
    scrollIndicators?: ScrollIndicatorOptions;
    items: readonly (NavigationDestination & { href?: string })[];
    value: string;
    onValueChange: (key: string) => void;
    expanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
    /** Override the menu action's label when expansion dismisses a modal rail. */
    toggleAccessibilityLabel?: string;
    expandedWidth?: number;
    collapsedWidth?: number;
    indicatorWidth?: 'content' | 'full';
    /** Keep accessible names while rendering labels for all, selected, or no destinations. */
    labelVisibility?: 'all' | 'selected' | 'none';
    alignment?: 'top' | 'center';
    showDivider?: boolean;
    header?: ReactNode;
    fab?: ReactNode;
    footer?: ReactNode;
    accessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

/** Controlled collapsed/expanded rail; place beside content in a horizontal flex container. */
export function NavigationRail({
    scrollIndicators,
    items,
    value,
    onValueChange,
    expanded = false,
    onExpandedChange,
    toggleAccessibilityLabel,
    expandedWidth = 256,
    collapsedWidth = 96,
    indicatorWidth = 'content',
    labelVisibility = 'all',
    alignment = 'top',
    showDivider = false,
    header,
    fab,
    footer,
    accessibilityLabel = 'Navegación',
    style,
    testID = 'mobile-navigation-rail',
}: NavigationRailProps) {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const rtl = useLocale().direction === 'rtl';
    const reduced = theme.animation.scale === 0;
    const hasHeader = Boolean(onExpandedChange || header || fab);
    const hasLinks = items.some((item) => item.href);
    const { fontScale } = useWindowDimensions();
    const focus = useNavigationFocus(items.filter((item) => expanded || !item.hiddenWhenCollapsed || item.key === value));
    const compactWidth = Math.max(80, Math.min(96, collapsedWidth));
    const targetWidth = expanded ? Math.max(220, Math.min(360, expandedWidth)) : compactWidth;
    const width = useSharedValue(targetWidth);
    const expansion = useSharedValue(Number(expanded));
    useEffect(() => {
        const spring = theme.motion.spring.default.spatial;
        const config = {
            stiffness: spring.stiffness,
            damping: 2 * Math.sqrt(spring.stiffness) * spring.damping,
            overshootClamping: true,
            reduceMotion: ReduceMotion.Never,
        };
        width.set(reduced ? targetWidth : withSpring(targetWidth, config));
        expansion.set(reduced ? Number(expanded) : withSpring(Number(expanded), config));
    }, [expanded, targetWidth, expansion, reduced, theme.motion, width]);
    useEffect(() => () => {
        cancelAnimation(width);
        cancelAnimation(expansion);
    }, [width, expansion]);
    const railStyle = useAnimatedStyle(() => ({ width: width.get() }));
    const menuPosition = useAnimatedStyle(() => ({
        transform: [{ translateX: ((compactWidth - 96) / 2) * (1 - Math.max(0, Math.min(1, expansion.get()))) * (rtl ? -1 : 1) }],
    }));
    const itemsStyle = useAnimatedStyle(() => ({ gap: 4 * (1 - Math.max(0, Math.min(1, expansion.get()))) }));
    const sectionStyle = useAnimatedStyle(() => ({
        height: ((theme.fonts.titleSmall.lineHeight ?? 20) * fontScale + 20) * Math.max(0, Math.min(1, expansion.get())),
        opacity: Math.max(0, Math.min(1, expansion.get())),
    }));
    return (
        <Animated.View
            style={[
                {
                    backgroundColor: theme.colors.surface,
                    direction: 'ltr',
                    paddingTop: insets.top + 44,
                    paddingBottom: insets.bottom,
                    overflow: 'hidden',
                    borderLeftWidth: showDivider && rtl ? 1 : 0,
                    borderRightWidth: showDivider && !rtl ? 1 : 0,
                    borderColor: theme.colors.outlineVariant,
                },
                railStyle,
                style,
            ]}
            testID={testID}
        >
            {hasHeader ? (
                <View
                    testID={`${testID}-header`}
                    style={{
                        alignItems: expanded ? (rtl ? 'flex-end' : 'flex-start') : 'center',
                        paddingHorizontal: 20,
                        gap: 16,
                        marginBottom: 40,
                    }}
                >
                    {onExpandedChange ? (
                        <Animated.View style={[{ width: 56, alignItems: 'center', alignSelf: rtl ? 'flex-end' : 'flex-start' }, menuPosition]}>
                            <IconButton
                                icon={expanded ? 'menu-open' : 'menu'}
                                accessibilityLabel={toggleAccessibilityLabel ?? (expanded ? 'Contraer navegación' : 'Expandir navegación')}
                                onPress={() => onExpandedChange(!expanded)}
                                testID={`${testID}-toggle`}
                            />
                        </Animated.View>
                    ) : null}
                    {header}
                    {fab}
                </View>
            ) : null}
            <ScrollView
                {...(Platform.OS === 'web' ? {
                    role: hasLinks ? 'navigation' as const : 'tablist' as const, 'aria-orientation': hasLinks ? undefined : 'vertical' as const, tabIndex: -1,
                    onFocus: (event: {target: unknown; currentTarget: unknown}) => {
                        if (event.target === event.currentTarget) focus.focusFirst();
                    },
                } : {})}
                accessibilityLabel={accessibilityLabel}
                testID={`${testID}-scroll`}
                style={{ flex: 1, minHeight: 0 }}
                {...getScrollIndicatorProps(scrollIndicators)}
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: alignment === 'center' ? 'center' : 'flex-start',
                }}
            >
                <Animated.View style={itemsStyle}>
                {items
                    .filter((item) => expanded || !item.hiddenWhenCollapsed || item.key === value)
                    .map((item, index, visibleItems) => (
                        <View key={item.key}>
                            {item.section && item.section !== visibleItems[index - 1]?.section ? (
                                <Animated.View
                                    pointerEvents="none"
                                    accessibilityElementsHidden={!expanded}
                                    importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
                                    {...(Platform.OS === 'web' ? { 'aria-hidden': !expanded } : {})}
                                    style={[{ overflow: 'hidden' }, sectionStyle]}
                                >
                                    <Text variant="titleSmall" accessibilityRole="header" numberOfLines={1}
                                        style={{ paddingTop: 12, paddingBottom: 8, paddingHorizontal: 36, color: theme.colors.onSurfaceVariant, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }}>
                                        {item.section}
                                    </Text>
                                </Animated.View>
                            ) : null}
                        <RailDestination
                            item={item}
                            selected={value === item.key}
                            onPress={() => onValueChange(item.key)}
                            focusRef={focus.refFor(item.key)}
                            onKeyDown={(event) => focus.onKeyDown(item.key, event)}
                            expanded={expanded}
                            targetRailWidth={targetWidth}
                            expandedRailWidth={Math.max(220, Math.min(360, expandedWidth))}
                            expansion={expansion}
                            railWidth={width}
                            fullWidth={indicatorWidth === 'full'}
                            labelVisible={labelVisibility === 'all' || (labelVisibility === 'selected' && value === item.key)}
                            testID={item.testID ?? `${testID}-${item.key}`}
                        />
                        </View>
                    ))}
                </Animated.View>
            </ScrollView>
            {footer}
        </Animated.View>
    );
}

function RailDestination({
    item,
    selected,
    onPress,
    focusRef,
    onKeyDown,
    expanded,
    targetRailWidth,
    expandedRailWidth,
    expansion,
    railWidth,
    fullWidth,
    labelVisible,
    testID,
}: {
    item: NavigationRailProps['items'][number];
    selected: boolean;
    onPress: () => void;
    focusRef: (target: unknown) => void;
    onKeyDown: (event: NavigationFocusEvent) => void;
    expanded: boolean;
    targetRailWidth: number;
    expandedRailWidth: number;
    expansion: SharedValue<number>;
    railWidth: SharedValue<number>;
    fullWidth: boolean;
    labelVisible: boolean;
    testID: string;
}) {
    const theme = useTheme<Theme>();
    const rtl = useLocale().direction === 'rtl';
    const { fontScale } = useWindowDimensions();
    const [labelLines, setLabelLines] = useState(1);
    const [hovered, setHovered] = useState(false),
        [focused, setFocused] = useState(false);
    const selection = useNavigationSelection(selected);
    const canPress = usePressScope(Boolean(item.disabled), item.key);
    const href = Platform.OS === 'web' && !item.disabled ? item.href : undefined;
    const [labelWidth, setLabelWidth] = useState(0);
    const [expandedLabelHeight, setExpandedLabelHeight] = useState(0);
    const [measuredBadgeWidth, setBadgeWidth] = useState(item.badge === true ? 6 : 16);
    const badgeWidth = item.badge !== undefined && item.badge !== false ? measuredBadgeWidth + 4 : 0;
    const topLabelInset = targetRailWidth < 96 ? 2 : 12;
    const collapsedHeight = Math.max(64, 48 + labelLines * (theme.fonts.labelMedium.lineHeight ?? 16) * fontScale);
    const stableLayout = useMemo(
        () =>
            navigationRailDestinationLayout({
                railWidth: targetRailWidth,
                expansion: Number(expanded),
                collapsedHeight,
                expandedHeight: expandedLabelHeight + 32,
                labelWidth,
                badgeWidth,
                labelVisible,
                fullWidth,
                rtl,
            }),
        [targetRailWidth, expanded, collapsedHeight, expandedLabelHeight, labelWidth, badgeWidth, labelVisible, fullWidth, rtl]
    );
    const [pressHitSlop, setPressHitSlop] = useState<typeof stableLayout.hitSlop>();
    useEffect(() => {
        if (item.disabled) {
            setHovered(false);
            setFocused(false);
            setPressHitSlop(undefined);
        }
    }, [item.disabled]);
    const currentLayout = (currentWidth?: number, currentExpansion?: number) => {
        'worklet';
        return navigationRailDestinationLayout({
            // Worklet capture analysis only visits the function body. Defaults
            // that reference shared values must be resolved here, not in parameters.
            railWidth: currentWidth ?? railWidth.get(),
            expansion: currentExpansion ?? expansion.get(),
            collapsedHeight,
            expandedHeight: expandedLabelHeight + 32,
            labelWidth,
            badgeWidth,
            labelVisible,
            fullWidth,
            rtl,
        });
    };
    const row = useAnimatedStyle(() => ({ height: currentLayout(railWidth.get(), expansion.get()).rowHeight }));
    const indicator = useAnimatedStyle(() => {
        const frame = currentLayout(railWidth.get(), expansion.get()).frame;
        return { ...frame, ...navigationSelectionFrame(frame.left, frame.width, rtl ? frame.width - 28 : 28, selection.get()) };
    });
    const stateIndicator = useAnimatedStyle(() => currentLayout(railWidth.get(), expansion.get()).frame);
    const webTarget = useAnimatedStyle(() => {
        const layout = currentLayout(railWidth.get(), expansion.get()),
            frame = layout.frame;
        return Platform.OS === 'web'
            ? {
                  backgroundColor: 'transparent',
                  borderRadius: 0,
                  overflow: 'visible' as const,
                  left: 0,
                  top: 0,
                  width: railWidth.get(),
                  height: layout.rowHeight,
                  paddingLeft: frame.left,
                  paddingTop: frame.top,
                  paddingRight: Math.max(0, railWidth.get() - frame.left - frame.width),
                  paddingBottom: Math.max(0, layout.rowHeight - frame.top - frame.height),
              }
            : {};
    });
    const touchProps = useAnimatedProps(() => ({ hitSlop: currentLayout(railWidth.get(), expansion.get()).hitSlop }));
    const icon = useAnimatedStyle(() => {
        const amount = Math.max(0, Math.min(1, expansion.get()));
        const frame = currentLayout().frame;
        return {
            [rtl ? 'right' : 'left']: ((railWidth.get() - 24) / 2) * (1 - amount) + 36 * amount,
            top: frame.top + (frame.height - 24) / 2,
        };
    });
    const topLabel = useAnimatedStyle(() => ({ opacity: expansion.get() < 0.5 ? 4 * Math.pow(expansion.get() - 0.5, 2) : 0 }));
    const startLabel = useAnimatedStyle(() => ({ opacity: expansion.get() > 0.5 ? 4 * Math.pow(expansion.get() - 0.5, 2) : 0 }));
    return (
        <Animated.View style={[{ opacity: item.disabled ? 0.38 : 1 }, row]}>
            {/* MD3 selects the whole row, while only the indicator receives ink.
            The clipped host owns its hitSlop; no smaller ancestor clips it. */}
            <Animated.View
                pointerEvents="none"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                style={[{ position: 'absolute', borderRadius: 28, backgroundColor: theme.colors.secondaryContainer }, indicator]}
                testID={`${testID}-indicator`}
            />
            {!item.disabled && (hovered || focused) ? (
                <Animated.View
                    pointerEvents="none"
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                    style={[
                        {
                            position: 'absolute',
                            borderRadius: 28,
                            backgroundColor: selected ? theme.colors.onSecondaryContainer : theme.colors.onSurface,
                            opacity: focused ? 0.1 : 0.08,
                        },
                        stateIndicator,
                    ]}
                />
            ) : null}
            {Platform.OS === 'web' && focused && !item.disabled ? (
                <Animated.View
                    pointerEvents="none"
                    aria-hidden
                    style={[
                        { position: 'absolute', borderRadius: 28, borderWidth: 2, borderColor: theme.colors.primary },
                        stateIndicator,
                    ]}
                    testID={`${testID}-focus-ring`}
                />
            ) : null}
            <AnimatedRailTouchableRipple
                key={item.disabled ? 'inactive' : 'interactive'}
                ref={focusRef}
                onKeyDown={onKeyDown}
                disabled={item.disabled}
                onPress={() => {
                    if (canPress()) onPress();
                }}
                onPressIn={(event) => {
                    setPressHitSlop(currentLayout().hitSlop);
                    if (Platform.OS === 'web' && !(event.nativeEvent as { key?: string }).key) setFocused(false);
                }}
                onPressOut={() => setPressHitSlop(undefined)}
                onHoverIn={() => setHovered(true)}
                onHoverOut={() => setHovered(false)}
                onFocus={(event) => {
                    if (item.disabled && Platform.OS === 'web') {
                        (event.currentTarget as unknown as HTMLElement).blur();
                        return;
                    }
                    setFocused(
                        Platform.OS !== 'web' || Boolean((event.currentTarget as unknown as HTMLElement)?.matches?.(':focus-visible'))
                    );
                }}
                onBlur={() => setFocused(false)}
                hitSlop={pressHitSlop ?? stableLayout.hitSlop}
                animatedProps={Platform.OS === 'web' ? undefined : touchProps}
                rippleColor={
                    typeof (selected ? theme.colors.onSecondaryContainer : theme.colors.onSurface) === 'string'
                        ? withAlpha((selected ? theme.colors.onSecondaryContainer : theme.colors.onSurface) as string, 0.1)
                        : theme.colors.stateLayerPressed
                }
                accessibilityRole={href ? 'link' : 'tab'}
                accessibilityState={{ selected: href ? undefined : selected, disabled: item.disabled }}
                {...(Platform.OS === 'web'
                    ? href
                        ? { href, 'aria-current': selected ? 'page' : undefined }
                        : { 'aria-selected': selected, 'aria-disabled': Boolean(item.disabled) }
                    : {})}
                accessibilityLabel={
                    item.accessibilityLabel ??
                    `${item.label}${item.badge === true ? ', novedades' : typeof item.badge === 'number' || typeof item.badge === 'string' ? `, ${item.badge}` : ''}`
                }
                {...(Platform.OS === 'web' ? { dataSet: { mobileDesignHitTarget: 'true', mobileDesignRippleRadius: '28' } } : {})}
                style={[
                    { position: 'absolute', borderRadius: 28, overflow: 'hidden', zIndex: 1 },
                    Platform.OS === 'web' ? webTarget : stateIndicator,
                ]}
                testID={testID}
            >
                <View />
            </AnimatedRailTouchableRipple>
            <View
                pointerEvents="none"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                style={{ flex: 1 }}
            >
                <Animated.View style={[{ position: 'absolute', width: 24, height: 24 }, icon]} testID={`${testID}-icon`}>
                    <BadgedBox
                        badge={item.badge}
                        badgeContainerStyle={labelVisible ? topLabel : undefined}
                        style={{ width: 24, height: 24 }}
                    >
                        <Icon
                            source={selected ? (item.selectedIcon ?? item.icon) : item.icon}
                            size={24}
                            color={selected ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant}
                        />
                    </BadgedBox>
                </Animated.View>
                {labelVisible ? (
                    <>
                        <Animated.View
                            style={[
                                { position: 'absolute', top: 42, left: topLabelInset, right: topLabelInset, alignItems: 'center' },
                                topLabel,
                            ]}
                            testID={`${testID}-label-top`}
                        >
                            <Text
                                onTextLayout={(event) => setLabelLines(Math.max(1, Math.min(2, event.nativeEvent.lines.length)))}
                                numberOfLines={2}
                                variant="labelMedium"
                                style={{
                                    textAlign: 'center',
                                    writingDirection: rtl ? 'rtl' : 'ltr',
                                    color: selected ? theme.colors.secondary : theme.colors.onSurfaceVariant,
                                }}
                            >
                                {item.label}
                            </Text>
                        </Animated.View>
                        <Animated.View
                            style={[
                                {
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    [rtl ? 'right' : 'left']: 68,
                                    width: Math.max(0, expandedRailWidth - 104),
                                    flexDirection: rtl ? 'row-reverse' : 'row',
                                    direction: 'ltr',
                                    alignItems: 'center',
                                    gap: 4,
                                },
                                startLabel,
                            ]}
                            testID={`${testID}-label-start`}
                        >
                            <Text
                                onLayout={(event) => {
                                    setLabelWidth(event.nativeEvent.layout.width);
                                    setExpandedLabelHeight(event.nativeEvent.layout.height);
                                }}
                                numberOfLines={2}
                                variant="labelLarge"
                                style={{
                                    flexShrink: 1,
                                    writingDirection: rtl ? 'rtl' : 'ltr',
                                    color: selected ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant,
                                }}
                            >
                                {item.label}
                            </Text>
                            {item.badge !== undefined && item.badge !== false ? (
                                <View onLayout={(event) => setBadgeWidth(event.nativeEvent.layout.width)}>
                                    <Badge variant={item.badge === true ? 'dot' : 'large'} style={typeof item.badge === 'number' ? { writingDirection: 'ltr' } : undefined}>
                                        {typeof item.badge === 'boolean' ? undefined : item.badge}
                                    </Badge>
                                </View>
                            ) : null}
                        </Animated.View>
                    </>
                ) : null}
            </View>
        </Animated.View>
    );
}

export type NavigationDrawerModalProps = {
    /** Scrollbars are opt-in for this component only; both axes are hidden by default. */
    scrollIndicators?: ScrollIndicatorOptions;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClosed?: () => void;
    items: readonly NavigationDrawerDestination[];
    value: string;
    onValueChange: (key: string) => void;
    title?: string;
    header?: ReactNode;
    footer?: ReactNode;
    closeOnSelect?: boolean;
    dismissible?: boolean;
    width?: number;
    testID?: string;
};

export function NavigationDrawerModal({
    scrollIndicators,
    open,
    onOpenChange,
    onClosed,
    items,
    value,
    onValueChange,
    title = 'Navegación',
    header,
    footer,
    closeOnSelect = true,
    dismissible = true,
    width = 360,
    testID = 'mobile-navigation-drawer',
}: NavigationDrawerModalProps) {
    const theme = useTheme<Theme>();
    const rtl = useLocale().direction === 'rtl';
    // A drawer uses the sheet container, without inheriting the supplementary
    // SideSheet's close button. MD3 drawer dismissal is selection/scrim/swipe.
    return (
        <SideSheet
            open={open}
            onOpenChange={onOpenChange}
            onClosed={onClosed}
            edge="start"
            width={Math.min(360, width)}
            title={title}
            accessibilityLabel={title}
            header={header ?? (
                <View style={{ paddingHorizontal: 28, paddingVertical: 16 }}>
                    <Text variant="titleSmall" accessibilityRole="header" style={{ color: theme.colors.onSurfaceVariant, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }}>
                        {title}
                    </Text>
                </View>
            )}
            footer={footer}
            showCloseButton={false}
            dismissible={dismissible}
            motion="drawer"
            testID={testID}
            style={{ backgroundColor: theme.colors.surfaceContainerLow, borderTopEndRadius: 16, borderBottomEndRadius: 16 }}
        >
            <NavigationDrawer
                scrollIndicators={scrollIndicators}
                modal
                items={items.map((item) => ({ ...item, testID: item.testID ?? `${testID}-${item.key}` }))}
                value={value}
                accessibilityLabel={title}
                onValueChange={(key) => {
                    onValueChange(key);
                    if (closeOnSelect) onOpenChange(false);
                }}
                style={{ width: '100%', flex: 1 }}
                testID={`${testID}-content`}
            />
        </SideSheet>
    );
}

export type NavigationRailModalProps = Omit<NavigationDrawerModalProps, 'items'> & { items: readonly NavigationDestination[] } & Pick<
        NavigationRailProps,
        'fab' | 'indicatorWidth' | 'alignment'
    >;
/** Expanded rail overlays compact content; the triggering menu remains caller-owned. */
export function NavigationRailModal({
    scrollIndicators,
    open,
    onOpenChange,
    onClosed,
    items,
    value,
    onValueChange,
    title,
    header,
    footer,
    fab,
    indicatorWidth,
    alignment,
    closeOnSelect = true,
    dismissible = true,
    width = 256,
    testID = 'mobile-navigation-rail-modal',
}: NavigationRailModalProps) {
    const theme = useTheme<Theme>();
    const window = useWindowDimensions();
    const panelWidth = Math.max(1, Math.min(360, Math.max(220, width), window.width - 56));
    return (
        <SideSheet
            open={open}
            onOpenChange={onOpenChange}
            onClosed={onClosed}
            edge="start"
            width={panelWidth}
            motion="drawer"
            title={title}
            accessibilityLabel={title ?? 'Navegación'}
            showCloseButton={false}
            header={<View />}
            dismissible={dismissible}
            elevation={2}
            testID={testID}
            style={{
                backgroundColor: theme.colors.surfaceContainer,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
            }}
        >
            <NavigationRail
                scrollIndicators={scrollIndicators}
                accessibilityLabel={title ?? 'Navegación'}
                expanded
                items={items.map((item) => ({ ...item, testID: item.testID ?? `${testID}-${item.key}` }))}
                value={value}
                onValueChange={(key) => {
                    onValueChange(key);
                    if (closeOnSelect) onOpenChange(false);
                }}
                onExpandedChange={() => onOpenChange(false)}
                toggleAccessibilityLabel="Cerrar navegación"
                expandedWidth={panelWidth}
                fab={fab}
                header={header}
                footer={footer}
                indicatorWidth={indicatorWidth}
                alignment={alignment}
                style={{ flex: 1, width: '100%', paddingTop: 44, paddingBottom: 0, backgroundColor: theme.colors.surfaceContainer }}
                testID={`${testID}-content`}
            />
        </SideSheet>
    );
}

export { Tabs, type TabsProps, type TabItem } from './tabs';
