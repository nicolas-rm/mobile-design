import { tabsTokens } from '@mobile-design/tokens';
import { TouchableRipple } from '../ripple';
import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import {
    Platform,
    StyleSheet,
    Text as NativeText,
    View,
    useWindowDimensions,
    type ScrollViewInstance,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { Icon, useLocale, useTheme, type Theme } from 'react-native-paper';
import Animated, {
    cancelAnimation,
    interpolateColor,
    ReduceMotion,
    scrollTo,
    useAnimatedReaction,
    useAnimatedRef,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import { withAlpha } from '../color';
import { getScrollIndicatorProps, type ScrollIndicatorOptions } from '../scroll-indicators';
import { Badge, BadgedBox } from './content';
import { usePressScope } from './press-scope';
import { webAccessibility } from '../web-accessibility';

type IconSource = ComponentProps<typeof Icon>['source'];
// Paper Text exposes an imperative handle instead of the native Text host ref.
const AnimatedText = Animated.createAnimatedComponent(NativeText);

export type TabItem = {
    key: string;
    /** Use an empty label only for a consistently icon-only set, with accessibilityLabel. */
    label: string;
    icon?: IconSource;
    badge?: string | number | boolean;
    disabled?: boolean;
    accessibilityLabel?: string;
    /** ID of the associated content panel; paired with nativeID for its tab label. */
    panelID?: string;
    nativeID?: string;
    testID?: string;
};

export type TabsProps = {
    /** Scrollbars are opt-in for this component only; both axes are hidden by default. */
    scrollIndicators?: ScrollIndicatorOptions;
    items: readonly TabItem[];
    value: string;
    onValueChange: (key: string) => void;
    /** Every enabled tap/keyboard activation, including reselecting a page during a swipe. */
    onTabPress?: (key: string) => void;
    variant?: 'primary' | 'secondary';
    scrollable?: boolean;
    /** AndroidX uses52dp at both edges of primary and secondary scrollable sets. */
    edgePadding?: number;
    iconPosition?: 'top' | 'start';
    /** Logical fractional page index from a swipeable content pager; read on the UI thread. */
    position?: SharedValue<number>;
    accessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

type TabFrame = { x: number; width: number; contentWidth?: number; labelWidth?: number };
type PagerReveal = { page: number; offset: number; viewport: number; contentWidth: number; keys: string; rtl: boolean };
type TabFocus = { key: string; forValue: string };

function indicatorFrame(frame: TabFrame, secondary: boolean, inline: boolean) {
    'worklet';
    const measured = inline ? (frame.contentWidth ?? frame.labelWidth ?? 28) : (frame.labelWidth ?? frame.contentWidth ?? 28);
    const width = secondary
        ? frame.width
        : Math.min(frame.width, Math.max(tabsTokens.primaryIndicatorMinimumWidth, measured - tabsTokens.primaryIndicatorInset * 2));
    return { left: frame.x + (frame.width - width) / 2, width };
}

function frameAtPosition(frames: readonly (TabFrame | undefined)[], position: number, secondary: boolean, inline: boolean) {
    'worklet';
    if (!frames.length || !Number.isFinite(position)) return undefined;
    const bounded = Math.max(0, Math.min(frames.length - 1, position));
    const lower = Math.floor(bounded);
    const upper = Math.ceil(bounded);
    const first = frames[lower];
    const last = frames[upper];
    if (!first || !last) return undefined;
    const start = indicatorFrame(first, secondary, inline);
    const end = indicatorFrame(last, secondary, inline);
    const fraction = bounded - lower;
    return {
        left: start.left + (end.left - start.left) * fraction,
        width: start.width + (end.width - start.width) * fraction,
        center: first.x + first.width / 2 + (last.x + last.width / 2 - first.x - first.width / 2) * fraction,
    };
}

function tabColorProgress(index: number, position: SharedValue<number> | undefined, selection: SharedValue<number>) {
    'worklet';
    const page = position?.get();
    if (page === undefined || !Number.isFinite(page)) return Math.max(0, Math.min(1, selection.get()));
    return Math.max(0, 1 - Math.abs(index - page));
}

/** Panels remain caller-owned. The shared position drives the indicator and tab colors. */
export function Tabs({
    scrollIndicators,
    items,
    value,
    onValueChange,
    onTabPress,
    variant = 'primary',
    scrollable = false,
    edgePadding = tabsTokens.scrollableEdgePadding,
    iconPosition = 'top',
    position,
    accessibilityLabel = 'Pestañas',
    style,
    testID = 'mobile-tabs',
}: TabsProps) {
    const theme = useTheme<Theme>();
    const rtl = useLocale().direction === 'rtl';
    const reduced = theme.animation.scale === 0;
    const scroll = useAnimatedRef<ScrollViewInstance>();
    const scrollPosition = useSharedValue(0);
    const scrollCommand = useSharedValue(false);
    const scrollGeneration = useSharedValue(0);
    const pagerReveal = useSharedValue<PagerReveal | undefined>(undefined);
    const draggingRow = useSharedValue(false);
    const [viewport, setViewport] = useState(0);
    const [frames, setFrames] = useState<Record<string, TabFrame>>({});
    const [contentWidth, setContentWidth] = useState(0);
    const [focus, setFocus] = useState<TabFocus | null>(null);
    const focused = focus?.key ?? null;
    const tabRefs = useRef<Record<string, { focus: () => void } | null>>({});
    const left = useSharedValue(0);
    const width = useSharedValue(0);
    const ready = useRef(false);
    const keys = useMemo(() => JSON.stringify(items.map((item) => item.key)), [items]);
    const availability = JSON.stringify(items.map((item) => [item.key, Boolean(item.disabled)]));
    const stacked = variant === 'primary' && iconPosition === 'top';
    const orderedFrames = useMemo(() => items.map((item) => frames[item.key]), [items, frames]);
    const selected = items.find((item) => item.key === value);
    const measured = selected ? frames[value] : undefined;
    const active = measured && Number.isFinite(measured.x) && Number.isFinite(measured.width) ? measured : undefined;
    // Keyboard focus is independent of selection. A new external selection must
    // reveal its own destination instead of a tab focused before that change.
    const focusedFrame =
        focus?.forValue === value && focused && items.some((item) => item.key === focused && !item.disabled) ? frames[focused] : undefined;
    const revealFrame = focusedFrame ?? active;
    const hasFocusedFrame = Boolean(focusedFrame);
    const revealX = revealFrame?.x;
    const revealWidth = revealFrame?.width;
    const firstEnabled = items.find((item) => !item.disabled)?.key;
    const focusableKey =
        focused && items.some((item) => item.key === focused && !item.disabled)
            ? focused
            : selected && !selected.disabled
              ? selected.key
              : firstEnabled;

    useEffect(() => {
        const currentKeys = new Set(items.map((item) => item.key));
        for (const key of Object.keys(tabRefs.current)) if (!currentKeys.has(key)) delete tabRefs.current[key];
        setFocus((previous) => (previous && !items.some((item) => item.key === previous.key && !item.disabled) ? null : previous));
        setFrames((previous) => {
            const retained = Object.entries(previous).filter(([key]) => currentKeys.has(key));
            return retained.length === Object.keys(previous).length ? previous : Object.fromEntries(retained);
        });
    }, [keys, availability]);

    useEffect(() => {
        draggingRow.set(false);
    }, [draggingRow, keys, reduced, rtl, value, viewport]);

    useAnimatedReaction(
        () => ({ active: scrollCommand.get(), offset: scrollPosition.get() }),
        (command) => {
            if (command.active) scrollTo(scroll, command.offset, 0, false);
        }
    );
    const scrollHandler = useAnimatedScrollHandler({
        onBeginDrag: () => {
            draggingRow.set(true);
            scrollGeneration.set(scrollGeneration.get() + 1);
            scrollCommand.set(false);
            cancelAnimation(scrollPosition);
        },
        onScroll: (event) => {
            if (!scrollCommand.get()) scrollPosition.set(event.contentOffset.x);
        },
        onEndDrag: (event) => {
            if (Math.abs(event.velocity?.x ?? 0) < 0.001) draggingRow.set(false);
        },
        onMomentumEnd: () => draggingRow.set(false),
    });

    // A pager writes fractional logical indices, not physical RTL scroll offsets.
    // This reaction and the indicator style remain wholly on the UI thread.
    useAnimatedReaction(
        () => {
            if (!position || !scrollable || viewport <= 0) return undefined;
            const page = position.get();
            const frame = frameAtPosition(orderedFrames, page, variant === 'secondary', !stacked);
            return frame
                ? {
                      page,
                      offset: Math.max(0, Math.min(Math.max(0, contentWidth - viewport), frame.center - viewport / 2)),
                      viewport,
                      contentWidth,
                      keys,
                      rtl,
                  }
                : undefined;
        },
        (request) => {
            if (!request) return;
            const previous = pagerReveal.get();
            if (
                previous &&
                request.page === previous.page &&
                request.offset === previous.offset &&
                request.viewport === previous.viewport &&
                request.contentWidth === previous.contentWidth &&
                request.keys === previous.keys &&
                request.rtl === previous.rtl
            )
                return;
            pagerReveal.set(request);
            if (draggingRow.get()) return;
            scrollGeneration.set(scrollGeneration.get() + 1);
            scrollCommand.set(false);
            cancelAnimation(scrollPosition);
            scrollPosition.set(request.offset);
            scrollTo(scroll, request.offset, 0, false);
        }
    );

    useEffect(() => {
        if (!active) {
            ready.current = false;
            return;
        }
        const target = indicatorFrame(active, variant === 'secondary', !stacked);
        const spring = theme.motion.spring.default.spatial;
        const config = {
            stiffness: spring.stiffness,
            damping: 2 * Math.sqrt(spring.stiffness) * spring.damping,
            mass: 1,
            reduceMotion: ReduceMotion.Never,
        };
        left.set(reduced || !ready.current ? target.left : withSpring(target.left, config));
        width.set(reduced || !ready.current ? target.width : withSpring(target.width, config));
        ready.current = true;
    }, [active, keys, left, reduced, stacked, theme.motion, value, variant, width]);
    useEffect(
        () => () => {
            cancelAnimation(left);
            cancelAnimation(width);
        },
        [left, width]
    );

    useEffect(() => {
        if (revealX !== undefined && revealWidth !== undefined && (!position || hasFocusedFrame) && scrollable && viewport > 0) {
            const targetOffset = Math.max(0, Math.min(Math.max(0, contentWidth - viewport), revealX + revealWidth / 2 - viewport / 2));
            const generation = scrollGeneration.get() + 1;
            scrollGeneration.set(generation);
            const spring = theme.motion.spring.default.spatial;
            const config = {
                stiffness: spring.stiffness,
                damping: 2 * Math.sqrt(spring.stiffness) * spring.damping,
                mass: 1,
                reduceMotion: ReduceMotion.Never,
            };
            if (reduced) {
                cancelAnimation(scrollPosition);
                scrollCommand.set(false);
                scrollPosition.set(targetOffset);
                scroll.current?.scrollTo({ x: targetOffset, animated: false });
            } else {
                scrollCommand.set(true);
                scrollPosition.set(
                    withSpring(targetOffset, config, (finished) => {
                        'worklet';
                        if (finished && scrollGeneration.get() === generation && scrollCommand.get()) {
                            scrollTo(scroll, targetOffset, 0, false);
                            scrollCommand.set(false);
                        }
                    })
                );
            }
        }
        return () => {
            scrollGeneration.set(scrollGeneration.get() + 1);
            scrollCommand.set(false);
            cancelAnimation(scrollPosition);
        };
    }, [
        contentWidth,
        focused,
        hasFocusedFrame,
        keys,
        position,
        reduced,
        revealX,
        revealWidth,
        scroll,
        scrollCommand,
        scrollGeneration,
        scrollPosition,
        scrollable,
        theme.motion,
        value,
        viewport,
    ]);

    const indicatorStyle = useAnimatedStyle(() => {
        const frame = position ? frameAtPosition(orderedFrames, position.get(), variant === 'secondary', !stacked) : undefined;
        return { left: frame?.left ?? left.get(), width: Math.max(0, frame?.width ?? width.get()) };
    });
    const record = (key: string, frame: Partial<TabFrame>) =>
        setFrames((previous) => {
            const next = { ...previous[key], ...frame } as TabFrame;
            return previous[key]?.x === next.x &&
                previous[key]?.width === next.width &&
                previous[key]?.contentWidth === next.contentWidth &&
                previous[key]?.labelWidth === next.labelWidth
                ? previous
                : { ...previous, [key]: next };
        });
    const select = (item: TabItem) => {
        if (item.disabled) return;
        onTabPress?.(item.key);
        if (item.key !== value) onValueChange(item.key);
    };
    const keyDown = (item: TabItem, event: Parameters<NonNullable<ComponentProps<typeof TouchableRipple>['onKeyDown']>>[0]) => {
        if (event.nativeEvent.altKey || event.nativeEvent.ctrlKey || event.nativeEvent.metaKey || event.nativeEvent.isComposing) return;
        const key = event.nativeEvent.key;
        const enabled = items.filter((tab) => !tab.disabled);
        if (item.disabled || !enabled.length) return;
        const index = enabled.findIndex((tab) => tab.key === item.key);
        let next: TabItem | undefined;
        if (key === 'Home') next = enabled[0];
        else if (key === 'End') next = enabled[enabled.length - 1];
        else if (key === 'ArrowLeft' || key === 'ArrowRight') {
            const step = (key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
            next = enabled[(index + step + enabled.length) % enabled.length];
        } else if (key === 'Enter' || key === ' ' || key === 'Spacebar') next = item;
        if (!next) return;
        event.preventDefault?.();
        setFocus({ key: next.key, forValue: value });
        tabRefs.current[next.key]?.focus();
        if (key === 'Enter' || key === ' ' || key === 'Spacebar') select(next);
    };
    const height =
        stacked && items.some((item) => item.icon && item.label) ? tabsTokens.stackedContainerHeight : tabsTokens.containerHeight;
    const inset = scrollable && Number.isFinite(edgePadding) ? Math.max(0, edgePadding) : 0;
    const row = (
        <View
            style={{
                direction: 'ltr',
                flexDirection: rtl ? 'row-reverse' : 'row',
                alignItems: 'stretch',
                minWidth: viewport,
                ...(scrollable ? {} : { width: viewport }),
                paddingHorizontal: inset,
            }}
            onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}
            testID={`${testID}-row`}
        >
            {items.map((item, index) => (
                <TabButton
                    key={item.key}
                    item={item}
                    index={index}
                    position={position}
                    selected={item.key === value}
                    variant={variant}
                    stacked={stacked}
                    minHeight={height}
                    tabWidth={frames[item.key]?.width}
                    scrollable={scrollable}
                    tabIndex={focusableKey === item.key ? 0 : -1}
                    ref={(host) => {
                        const node: unknown = host;
                        tabRefs.current[item.key] =
                            node && typeof node === 'object' && 'focus' in node && typeof node.focus === 'function'
                                ? (node as { focus: () => void })
                                : null;
                    }}
                    onPress={() => select(item)}
                    onFocus={() => setFocus({ key: item.key, forValue: value })}
                    onBlur={() => setFocus((current) => (current?.key === item.key ? null : current))}
                    onKeyDown={(event) => keyDown(item, event)}
                    onLayout={(event) => record(item.key, event.nativeEvent.layout)}
                    onContentLayout={(event) => record(item.key, { contentWidth: event.nativeEvent.layout.width })}
                    onLabelLayout={(event) => record(item.key, { labelWidth: event.nativeEvent.layout.width })}
                    testID={item.testID ?? `${testID}-${item.key}`}
                />
            ))}
            {active ? (
                <Animated.View
                    pointerEvents="none"
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={[
                        {
                            position: 'absolute',
                            bottom: 0,
                            height: variant === 'primary' ? tabsTokens.primaryIndicatorHeight : tabsTokens.secondaryIndicatorHeight,
                            borderTopLeftRadius: variant === 'primary' ? 3 : 0,
                            borderTopRightRadius: variant === 'primary' ? 3 : 0,
                            backgroundColor: theme.colors.primary,
                        },
                        indicatorStyle,
                    ]}
                    testID={`${testID}-indicator`}
                />
            ) : null}
        </View>
    );
    return (
        <View
            accessibilityRole="tablist"
            accessibilityLabel={accessibilityLabel}
            onLayout={(event) => setViewport(event.nativeEvent.layout.width)}
            style={[{ backgroundColor: theme.colors.surface, overflow: 'hidden', direction: 'ltr' }, style]}
            testID={testID}
        >
            <View
                pointerEvents="none"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: tabsTokens.dividerHeight,
                    backgroundColor: theme.colors.outlineVariant,
                }}
                testID={`${testID}-divider`}
            />
            {scrollable ? (
                <Animated.ScrollView
                    ref={scroll}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    horizontal
                    bounces={false}
                    {...getScrollIndicatorProps(scrollIndicators)}
                    style={{ direction: 'ltr' }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    testID={`${testID}-scroll`}
                >
                    {row}
                </Animated.ScrollView>
            ) : (
                row
            )}
        </View>
    );
}

type TabButtonProps = Pick<ComponentProps<typeof TouchableRipple>, 'ref' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'onLayout' | 'tabIndex'> & {
    item: TabItem;
    index: number;
    position?: SharedValue<number>;
    selected: boolean;
    variant: NonNullable<TabsProps['variant']>;
    stacked: boolean;
    minHeight: number;
    tabWidth?: number;
    scrollable: boolean;
    onPress: () => void;
    onContentLayout: NonNullable<ComponentProps<typeof View>['onLayout']>;
    onLabelLayout: NonNullable<ComponentProps<typeof View>['onLayout']>;
    testID: string;
};

function TabButton({
    item,
    index,
    position,
    selected,
    variant,
    stacked,
    minHeight,
    tabWidth,
    scrollable,
    onContentLayout,
    onLabelLayout,
    testID,
    onFocus,
    onBlur,
    ...props
}: TabButtonProps) {
    const theme = useTheme<Theme>();
    const rtl = useLocale().direction === 'rtl';
    const { fontScale } = useWindowDimensions();
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [pressed, setPressed] = useState(false);
    const [badgeWidth, setBadgeWidth] = useState(0);
    const progress = useSharedValue(Number(selected));
    const canPress = usePressScope(Boolean(item.disabled), item.key);
    const activeColor = variant === 'primary' ? theme.colors.primary : theme.colors.onSurface;
    const inactiveColor = hovered || focused || pressed ? theme.colors.onSurface : theme.colors.onSurfaceVariant;
    useEffect(() => {
        if (item.disabled) {
            setHovered(false);
            setFocused(false);
            setPressed(false);
        }
    }, [item.disabled]);
    useEffect(() => {
        const spring = theme.motion.spring[selected ? 'default' : 'fast'].effects;
        progress.set(
            position || theme.animation.scale === 0
                ? Number(selected)
                : withSpring(Number(selected), {
                      stiffness: spring.stiffness,
                      damping: 2 * Math.sqrt(spring.stiffness) * spring.damping,
                      overshootClamping: true,
                      reduceMotion: ReduceMotion.Never,
                  })
        );
    }, [position, progress, selected, theme.animation.scale, theme.motion]);
    useEffect(() => () => cancelAnimation(progress), [progress]);
    const labelColor = useAnimatedStyle(() => {
        if (item.disabled) return { color: theme.colors.onSurface };
        const fraction = tabColorProgress(index, position, progress);
        if (typeof inactiveColor === 'string' && typeof activeColor === 'string') {
            return { color: interpolateColor(fraction, [0, 1], [inactiveColor, activeColor]) };
        }
        const highlighted = position ? fraction >= 0.5 : selected;
        return { color: highlighted ? activeColor : inactiveColor };
    });
    const activeIcon = useAnimatedStyle(() => ({ opacity: item.disabled ? 0 : tabColorProgress(index, position, progress) }));
    const inactiveIcon = useAnimatedStyle(() => ({ opacity: item.disabled ? 1 : 1 - tabColorProgress(index, position, progress) }));
    const hasLabel = item.label.length > 0;
    const withStackedIcon = stacked && Boolean(item.icon && hasLabel);
    const verticalPadding = withStackedIcon ? 8 : 12;
    const contentMinHeight = withStackedIcon
        ? tabsTokens.iconSize + tabsTokens.stackedIconGap + (theme.fonts.titleSmall.lineHeight ?? 20) * fontScale + verticalPadding * 2
        : Math.max(item.icon ? tabsTokens.iconSize : 0, hasLabel ? (theme.fonts.titleSmall.lineHeight ?? 20) * fontScale : 0) +
          verticalPadding * 2;
    const color = selected ? activeColor : inactiveColor;
    const stateLayerColor = selected ? activeColor : theme.colors.onSurface;
    const preferredBadgeStart = tabsTokens.iconSize - tabsTokens.iconBadgeOverlap;
    // Keep the measured badge inside the tab when its preferred placement would clip.
    const badgeBoundary = tabWidth !== undefined && tabWidth > 0 && Number.isFinite(tabWidth) ? (tabWidth + tabsTokens.iconSize) / 2 : undefined;
    const badgeStart =
        badgeBoundary === undefined
            ? preferredBadgeStart
            : Math.max(tabsTokens.iconSize - badgeBoundary, Math.min(preferredBadgeStart, badgeBoundary - badgeWidth));
    const icon = item.icon ? (
        <BadgedBox
            badge={stacked || !hasLabel ? item.badge : undefined}
            style={{ width: tabsTokens.iconSize, height: tabsTokens.iconSize, flexShrink: 0 }}
            badgeContainerStyle={{
                top: 0,
                bottom: undefined,
                [rtl ? 'right' : 'left']: badgeStart,
            }}
            onBadgeLayout={({ nativeEvent }) => setBadgeWidth(nativeEvent.layout.width)}
            testID={`${testID}-icon`}
        >
            <View style={{ width: tabsTokens.iconSize, height: tabsTokens.iconSize }}>
                <Animated.View style={[StyleSheet.absoluteFill, inactiveIcon]}>
                    <Icon source={item.icon} size={tabsTokens.iconSize} color={item.disabled ? theme.colors.onSurface : inactiveColor} />
                </Animated.View>
                <Animated.View style={[StyleSheet.absoluteFill, activeIcon]}>
                    <Icon source={item.icon} size={tabsTokens.iconSize} color={activeColor} />
                </Animated.View>
            </View>
        </BadgedBox>
    ) : null;
    return (
        <TouchableRipple
            key={item.disabled ? 'inactive' : 'interactive'}
            {...props}
            onPress={() => {
                if (canPress()) props.onPress?.();
            }}
            nativeID={item.nativeID}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled: Boolean(item.disabled) }}
            {...(Platform.OS === 'web'
                ? { 'aria-selected': selected, 'aria-disabled': Boolean(item.disabled), 'aria-controls': item.panelID }
                : {})}
            accessibilityLabel={
                item.accessibilityLabel ??
                `${item.label}${item.badge === true ? ', novedades' : typeof item.badge === 'number' || typeof item.badge === 'string' ? `, ${item.badge}` : ''}`
            }
            disabled={item.disabled}
            focusable={!item.disabled}
            rippleColor={typeof stateLayerColor === 'string' ? withAlpha(stateLayerColor, 0.1) : stateLayerColor}
            underlayColor={typeof stateLayerColor === 'string' ? withAlpha(stateLayerColor, 0.1) : undefined}
            onHoverIn={() => {
                if (canPress()) setHovered(true);
            }}
            onHoverOut={() => {
                if (canPress()) setHovered(false);
            }}
            onPressIn={(event) => {
                if (!canPress()) return;
                setPressed(true);
                if (Platform.OS === 'web') setFocused(Boolean((event?.nativeEvent as { key?: string } | undefined)?.key));
            }}
            onPressOut={() => {
                if (canPress()) setPressed(false);
            }}
            onTouchCancel={() => {
                if (canPress()) setPressed(false);
            }}
            onFocus={(event) => {
                if (!canPress()) return;
                const target = event.currentTarget as unknown as { matches?: (selector: string) => boolean } | undefined;
                setFocused(Platform.OS !== 'web' || (target?.matches?.(':focus-visible') ?? true));
                onFocus?.(event);
            }}
            onBlur={(event) => {
                if (!canPress()) return;
                setFocused(false);
                setPressed(false);
                onBlur?.(event);
            }}
            onKeyDown={(event) => {
                if (!canPress()) return;
                const native = event.nativeEvent;
                if (
                    !native.altKey &&
                    !native.ctrlKey &&
                    !native.metaKey &&
                    !native.isComposing &&
                    ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' ', 'Spacebar'].includes(native.key)
                )
                    setFocused(true);
                props.onKeyDown?.(event);
            }}
            style={{
                minHeight: Math.max(minHeight, contentMinHeight),
                minWidth: scrollable ? tabsTokens.scrollableMinimumTabWidth : tabsTokens.containerHeight,
                paddingHorizontal: tabsTokens.horizontalPadding,
                paddingVertical: verticalPadding,
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                ...(scrollable ? { flexShrink: 0 } : { flex: 1 }),
                opacity: item.disabled ? 0.38 : 1,
                ...(Platform.OS === 'web' ? { outlineStyle: 'solid', outlineColor: 'transparent', outlineWidth: 0 } : {}),
            }}
            testID={testID}
        >
            <View
                pointerEvents="none"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                {...webAccessibility({ hidden: true })}
                testID={`${testID}-decoration`}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' }}
            >
                {!item.disabled && focused ? (
                    <View
                        pointerEvents="none"
                        accessible={false}
                        style={{
                            position: 'absolute',
                            top: -verticalPadding,
                            left: -tabsTokens.horizontalPadding,
                            right: -tabsTokens.horizontalPadding,
                            bottom:
                                -verticalPadding +
                                (selected
                                    ? (variant === 'primary' ? tabsTokens.primaryIndicatorHeight : tabsTokens.secondaryIndicatorHeight) + 1
                                    : 0),
                            borderRadius: 8,
                            borderWidth: 3,
                            borderColor: theme.colors.secondary,
                            zIndex: 1,
                        }}
                        testID={`${testID}-focus-ring`}
                    />
                ) : null}
                {!item.disabled && (hovered || focused) ? (
                    <View
                        style={{
                            position: 'absolute',
                            top: -verticalPadding,
                            bottom: -verticalPadding,
                            left: -tabsTokens.horizontalPadding,
                            right: -tabsTokens.horizontalPadding,
                            backgroundColor: color,
                            opacity: focused ? 0.1 : 0.08,
                        }}
                        testID={`${testID}-state-layer`}
                    />
                ) : null}
                <View
                    onLayout={onContentLayout}
                    style={{
                        maxWidth: '100%',
                        flexDirection: stacked ? 'column' : rtl ? 'row-reverse' : 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: stacked ? tabsTokens.stackedIconGap : tabsTokens.inlineIconGap,
                    }}
                    testID={`${testID}-content`}
                >
                    {icon}
                    {hasLabel ? (
                        <View
                            onLayout={onLabelLayout}
                            style={{
                                maxWidth: '100%',
                                flexShrink: 1,
                                minWidth: 0,
                                flexDirection: rtl ? 'row-reverse' : 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: tabsTokens.badgeGap,
                            }}
                            testID={`${testID}-label-group`}
                        >
                            <AnimatedText
                                numberOfLines={2}
                                ellipsizeMode="tail"
                                style={[
                                    theme.fonts.titleSmall,
                                    { textAlign: 'center', writingDirection: rtl ? 'rtl' : 'ltr', flexShrink: 1 },
                                    labelColor,
                                ]}
                                testID={`${testID}-label`}
                            >
                                {item.label}
                            </AnimatedText>
                            {item.badge !== undefined && item.badge !== false && (!stacked || !item.icon) ? (
                                <Badge variant={item.badge === true ? 'dot' : 'large'} testID={`${testID}-badge`}>
                                    {typeof item.badge === 'boolean' ? undefined : item.badge}
                                </Badge>
                            ) : null}
                        </View>
                    ) : null}
                </View>
            </View>
        </TouchableRipple>
    );
}
