import { TouchableRipple } from '../ripple';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, Surface, useLocale, useTheme, type Theme } from 'react-native-paper';
import Animated, {
    cancelAnimation,
    ReduceMotion,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from './icon-button';
import { Menu } from './menu';
import { usePressScope } from './press-scope';
import { AnimatedActionSurface } from './action-surface';

type ToolbarIcon = ComponentProps<typeof Icon>['source'];
export type ToolbarAction = {
    key: string;
    icon: ToolbarIcon;
    label: string;
    onPress: () => void;
    disabled?: boolean;
    selected?: boolean;
    mode?: 'contained' | 'contained-tonal' | 'outlined';
    widthVariant?: 'narrow' | 'default' | 'wide';
    testID?: string;
};
export type ToolbarProps = {
    actions: readonly ToolbarAction[];
    variant?: 'docked' | 'floating';
    color?: 'standard' | 'vibrant';
    orientation?: 'horizontal' | 'vertical';
    leading?: ReactNode;
    trailing?: ReactNode;
    children?: ReactNode;
    /** With a FAB all toolbar actions collapse; otherwise only the end slots collapse. */
    fab?: ToolbarAction;
    expanded?: boolean;
    visible?: boolean;
    safeArea?: boolean;
    /** M3 recommends elevation over busy content; zero is allowed over a distinct surface. */
    elevation?: 0 | 1 | 2 | 3;
    /** Additional actions move into an actual menu when the measured row cannot fit them. */
    maxVisibleActions?: number;
    alignment?: 'start' | 'center' | 'space-between';
    accessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

function CollapsingSlot({
    children,
    progress,
    horizontal,
    interactive,
    onMeasure,
    testID,
    anchorEnd = false,
    style,
    surface,
}: {
    children: ReactNode;
    progress: SharedValue<number>;
    horizontal: boolean;
    interactive: boolean;
    onMeasure?: (extent: number) => void;
    testID?: string;
    anchorEnd?: boolean;
    style?: StyleProp<ViewStyle>;
    surface?: { color: ViewStyle['backgroundColor']; elevation: 0 | 1 | 2 | 3 };
}) {
    const window = useWindowDimensions();
    const rtl = useLocale().direction === 'rtl';
    const [extent, setExtent] = useState(0);
    const alive = usePressScope(false);
    const bounds = useAnimatedStyle(() => ({
        [horizontal ? 'width' : 'height']: extent * Math.max(0, Math.min(1, progress.get())),
    }));
    const fade = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, progress.get())) }));
    const interaction = {
        pointerEvents: interactive ? ('auto' as const) : ('none' as const),
        accessibilityElementsHidden: !interactive,
        importantForAccessibility: interactive ? ('auto' as const) : ('no-hide-descendants' as const),
        ...(Platform.OS === 'web' ? { 'aria-hidden': !interactive, inert: !interactive } : {}),
        testID,
    };
    const content = (
        <View style={{ overflow: 'hidden', ...(surface ? { borderRadius: 999 } : {}), ...(!horizontal ? { height: '100%' } : {}) }}>
            {/* A stable measurement canvas decouples intrinsic content from the
            animated clip. Otherwise each frame can shrink its own measured
            target and dispatch onLayout back to React. Controls render once. */}
            <View
                style={
                    horizontal
                        ? {
                              width: Math.max(1, window.width - 32),
                              ...(anchorEnd
                                  ? { alignSelf: rtl ? 'flex-start' : 'flex-end', alignItems: rtl ? 'flex-start' : 'flex-end' }
                                  : {}),
                          }
                        : { width: 64, height: window.height, ...(anchorEnd ? { alignSelf: 'flex-end', justifyContent: 'flex-end' } : {}) }
                }
            >
                <View
                    onLayout={(event) => {
                        if (!alive()) return;
                        const next = horizontal ? event.nativeEvent.layout.width : event.nativeEvent.layout.height;
                        setExtent(next);
                        onMeasure?.(next);
                    }}
                    style={{
                        flexDirection: horizontal ? (rtl ? 'row-reverse' : 'row') : 'column',
                        direction: 'ltr',
                        alignItems: 'center',
                        alignSelf: horizontal ? (anchorEnd && !rtl ? 'flex-end' : 'flex-start') : 'center',
                        flexShrink: 0,
                        gap: 4,
                    }}
                >
                    {children}
                </View>
            </View>
        </View>
    );
    return surface ? (
        <AnimatedActionSurface
            {...interaction}
            elevation={surface.elevation}
            geometry={bounds}
            style={[{ backgroundColor: surface.color, borderRadius: 999, ...(!horizontal ? { width: 64 } : {}) }, fade, style]}
        >
            {content}
        </AnimatedActionSurface>
    ) : (
        <Animated.View {...interaction} style={[{ ...(!horizontal ? { width: 64 } : {}) }, bounds, fade, style]}>
            {content}
        </Animated.View>
    );
}

/** Fixed controls remain visible; overflow retains every action and its controlled state. */
export function Toolbar({
    actions,
    variant = 'docked',
    color = 'standard',
    orientation = 'horizontal',
    leading,
    trailing,
    children,
    fab,
    expanded = true,
    visible = true,
    safeArea = true,
    elevation,
    maxVisibleActions,
    alignment,
    accessibilityLabel = 'Herramientas',
    style,
    testID = 'mobile-toolbar',
}: ToolbarProps) {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const rtl = useLocale().direction === 'rtl';
    const [containerWidth, setContainerWidth] = useState(0);
    const [slotSizes, setSlotSizes] = useState({ leading: 0, trailing: 0, middle: 0 });
    const [menuOpen, setMenuOpen] = useState(false);
    const [screenReader, setScreenReader] = useState(false);
    const [controlsExtent, setControlsExtent] = useState(0);
    const alive = usePressScope(false);
    const current = useRef({ actions, fab });
    current.current = { actions, fab };
    useEffect(() => {
        // RNW returns true unconditionally; web cannot detect assistive technology.
        if (Platform.OS === 'web') return;
        let alive = true;
        AccessibilityInfo.isScreenReaderEnabled().then((value) => {
            if (alive) setScreenReader(value);
        });
        const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', (value) => {
            if (alive) setScreenReader(value);
        });
        return () => {
            alive = false;
            subscription.remove();
        };
    }, []);
    const floating = variant === 'floating';
    const horizontal = !floating || orientation === 'horizontal';
    const shown = visible || screenReader;
    const isExpanded = !floating || expanded || screenReader;
    const measureSlot = (slot: keyof typeof slotSizes, extent: number) =>
        setSlotSizes((previous) => (previous[slot] === extent ? previous : { ...previous, [slot]: extent }));
    const viewStyle = StyleSheet.flatten(style);
    const verticalLimit = Math.max(
        64,
        Math.min(
            window.height - 48 - insets.top - insets.bottom,
            typeof viewStyle?.maxHeight === 'number' ? viewStyle.maxHeight : Infinity,
            typeof viewStyle?.height === 'number' ? viewStyle.height : Infinity
        )
    );
    const available = Math.max(
        48,
        (containerWidth || window.width) -
            (floating && horizontal ? 32 : !floating && safeArea ? insets.left + insets.right : 0) -
            (floating && horizontal && fab ? 64 : 0)
    );
    const customSlots = Number(Boolean(leading)) + Number(Boolean(trailing)) + Number(Boolean(children));
    const customExtent =
        (leading ? slotSizes.leading || 48 : 0) + (trailing ? slotSizes.trailing || 48 : 0) + (children ? slotSizes.middle || 48 : 0);
    const actionWidth = (action: ToolbarAction) => (action.widthVariant === 'wide' && horizontal ? 52 : 48);
    let visibleCount = Math.min(actions.length, Math.max(0, maxVisibleActions ?? actions.length));
    {
        const budget = (horizontal ? available - (floating ? 16 : 32) : verticalLimit - (fab ? 64 : 0) - 16) - customExtent;
        while (
            visibleCount > 0 &&
            actions.slice(0, visibleCount).reduce((sum, action) => sum + (horizontal ? actionWidth(action) : 48), 0) +
                (visibleCount < actions.length ? 48 : 0) +
                Math.max(0, visibleCount + Number(visibleCount < actions.length) + customSlots - 1) * 4 >
                budget
        )
            visibleCount--;
    }
    const displayed = actions.slice(0, visibleCount),
        overflow = actions.slice(visibleCount);
    const overflowInteractive = shown && (!fab || isExpanded);
    const canUseActions = usePressScope(
        !overflowInteractive,
        JSON.stringify([actions.map((action) => [action.key, action.disabled]), displayed.map((action) => action.key), horizontal])
    );
    const canUseFab = usePressScope(!shown || Boolean(fab?.disabled), fab?.key);
    const pendingAction = useRef<{ key: string; canRun: () => boolean } | null>(null);
    const overflowKeys = JSON.stringify(overflow.map((action) => action.key));
    useEffect(() => {
        pendingAction.current = null;
        setMenuOpen(false);
    }, [overflowKeys, overflowInteractive]);
    const count = displayed.length + Number(Boolean(overflow.length)) + customSlots;
    const used = displayed.reduce((sum, action) => sum + actionWidth(action), 0) + (overflow.length ? 48 : 0) + customExtent;
    const gap = floating ? 4 : Math.min(32, Math.max(4, (available - 32 - used) / Math.max(1, count - 1)));
    const reveal = useSharedValue(Number(shown));
    const expansion = useSharedValue(Number(isExpanded));
    useEffect(() => {
        const spatial = theme.motion.spring.fast.spatial;
        const config = {
            stiffness: spatial.stiffness,
            damping: 2 * spatial.damping * Math.sqrt(spatial.stiffness),
            mass: 1,
            reduceMotion: ReduceMotion.Never,
        };
        reveal.set(theme.animation.scale === 0 ? Number(shown) : withSpring(Number(shown), config));
        expansion.set(theme.animation.scale === 0 ? Number(isExpanded) : withSpring(Number(isExpanded), config));
    }, [expansion, isExpanded, reveal, shown, theme]);
    useEffect(
        () => () => {
            cancelAnimation(reveal);
            cancelAnimation(expansion);
        },
        [reveal, expansion]
    );
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: Math.max(0, Math.min(1, reveal.get())),
        transform: horizontal
            ? [{ translateY: (1 - reveal.get()) * (floating ? (fab ? 96 : 80) : 64 + (safeArea ? insets.bottom : 0)) }]
            : [{ translateX: (1 - reveal.get()) * (viewStyle?.left != null && viewStyle.right == null ? -88 : 88) }],
    }));
    const fabStyle = useAnimatedStyle(() => {
        const amount = Math.max(0, Math.min(1, expansion.get()));
        return { width: 80 - 24 * amount, height: 80 - 24 * amount, borderRadius: 20 - 4 * amount };
    });
    const fabPlacement = useAnimatedStyle(() => {
        const offset = 12 * Math.max(0, Math.min(1, expansion.get()));
        return horizontal ? { top: offset } : { [rtl ? 'right' : 'left']: offset };
    });
    const fabIconStyle = useAnimatedStyle(() => ({ transform: [{ scale: 4 / 3 - Math.max(0, Math.min(1, expansion.get())) / 3 }] }));
    const fabMask = useAnimatedStyle(() => ({ borderRadius: 20 - 4 * Math.max(0, Math.min(1, expansion.get())) }));
    const background = color === 'vibrant' ? theme.colors.primaryContainer : theme.colors.surfaceContainer;
    const selectedBackground = color === 'vibrant' ? theme.colors.surfaceContainer : theme.colors.secondaryContainer;
    const selectedInk = color === 'vibrant' ? theme.colors.onSurface : theme.colors.onSecondaryContainer;
    const actionNodes = (
        <>
            {displayed.map((action) => (
                <IconButton
                    key={action.key}
                    icon={action.icon}
                    accessibilityLabel={action.label}
                    accessibilityState={{ selected: action.selected }}
                    selected={action.selected}
                    disabled={action.disabled || !overflowInteractive}
                    onPress={() => {
                        const latest = current.current.actions.find((entry) => entry.key === action.key);
                        if (canUseActions() && latest && !latest.disabled) latest.onPress();
                    }}
                    iconColor={
                        action.selected
                            ? selectedInk
                            : action.mode
                              ? undefined
                              : color === 'vibrant'
                                ? theme.colors.onPrimaryContainer
                                : theme.colors.primary
                    }
                    containerColor={action.selected ? selectedBackground : undefined}
                    mode={action.selected ? 'contained-tonal' : action.mode}
                    widthVariant={!horizontal && action.widthVariant === 'wide' ? 'default' : action.widthVariant}
                    style={{ margin: 0 }}
                    testID={action.testID ?? `${testID}-${action.key}`}
                />
            ))}
            {children ? (
                <View
                    onLayout={(event) =>
                        measureSlot('middle', horizontal ? event.nativeEvent.layout.width : event.nativeEvent.layout.height)
                    }
                >
                    {children}
                </View>
            ) : null}
            {overflow.length ? (
                <Menu
                    visible={menuOpen && overflowInteractive}
                    onDismiss={() => {
                        if (!alive()) return;
                        pendingAction.current = null;
                        setMenuOpen(false);
                    }}
                    onClosed={() => {
                        const pending = pendingAction.current;
                        pendingAction.current = null;
                        const action = actions.find((entry) => entry.key === pending?.key);
                        if (pending?.canRun() && action && !action.disabled) action.onPress();
                    }}
                    anchor={
                        <IconButton
                            icon="more_vert"
                            accessibilityLabel="Más herramientas"
                            accessibilityState={{ expanded: menuOpen }}
                            disabled={!overflowInteractive}
                            onPress={() => {
                                if (canUseActions()) setMenuOpen(true);
                            }}
                            style={{ margin: 0 }}
                            testID={`${testID}-overflow`}
                        />
                    }
                >
                    {overflow.map((action) => (
                        <Menu.Item
                            key={action.key}
                            title={action.label}
                            leadingIcon={action.icon}
                            selected={action.selected}
                            selectionMode={action.selected == null ? undefined : 'multiple'}
                            closeOnPress={false}
                            disabled={action.disabled}
                            onPress={() => {
                                if (!canUseActions() || action.disabled) return;
                                pendingAction.current = { key: action.key, canRun: canUseActions };
                                setMenuOpen(false);
                            }}
                            testID={`${testID}-overflow-${action.key}`}
                        />
                    ))}
                </Menu>
            ) : null}
        </>
    );
    const rowContents = (
        <View
            role={Platform.OS === 'web' ? 'toolbar' : undefined}
            accessibilityLabel={accessibilityLabel}
            testID={`${testID}-row`}
            {...(Platform.OS === 'web'
                ? {
                      'aria-orientation': horizontal ? ('horizontal' as const) : ('vertical' as const),
                      onKeyDown: (event: Parameters<NonNullable<ComponentProps<typeof View>['onKeyDown']>>[0]) => {
                          const target = event.target as unknown as HTMLElement;
                          const host = event.currentTarget as unknown as HTMLElement;
                          if (target.closest('input,textarea,[contenteditable=true]')) return;
                          const key = event.nativeEvent.key;
                          const step = horizontal
                              ? key === 'ArrowRight'
                                  ? rtl
                                      ? -1
                                      : 1
                                  : key === 'ArrowLeft'
                                    ? rtl
                                        ? 1
                                        : -1
                                    : 0
                              : key === 'ArrowDown'
                                ? 1
                                : key === 'ArrowUp'
                                  ? -1
                                  : 0;
                          if (!step && key !== 'Home' && key !== 'End') return;
                          const nodes = Array.from(host.querySelectorAll<HTMLElement>('[role=button],[href],[tabindex]')).filter(
                              (node) =>
                                  node.tabIndex >= 0 &&
                                  node.getAttribute('aria-disabled') !== 'true' &&
                                  !node.closest('[inert]') &&
                                  node.getClientRects().length > 0
                          );
                          const index = nodes.findIndex((node) => node === target || node.contains(target));
                          if (index < 0 || !nodes.length) return;
                          event.preventDefault();
                          event.stopPropagation();
                          nodes[
                              key === 'Home' ? 0 : key === 'End' ? nodes.length - 1 : (index + step + nodes.length) % nodes.length
                          ]?.focus();
                      },
                  }
                : {})}
            style={{
                flexDirection: horizontal ? (rtl ? 'row-reverse' : 'row') : 'column',
                direction: 'ltr',
                alignItems: 'center',
                justifyContent: alignment === 'start' ? 'flex-start' : (alignment ?? 'center'),
                minHeight: 64,
                ...(horizontal
                    ? {
                          paddingLeft: (floating ? 8 : 16) + (!floating && safeArea ? insets.left : 0),
                          paddingRight: (floating ? 8 : 16) + (!floating && safeArea ? insets.right : 0),
                          paddingTop: 8,
                          paddingBottom: 8 + (!floating && safeArea ? insets.bottom : 0),
                      }
                    : { width: 64, paddingVertical: 8 }),
                gap,
            }}
        >
            {leading ? (
                fab ? (
                    <View
                        onLayout={(event) =>
                            measureSlot('leading', horizontal ? event.nativeEvent.layout.width : event.nativeEvent.layout.height)
                        }
                    >
                        {leading}
                    </View>
                ) : (
                    <CollapsingSlot
                        progress={expansion}
                        horizontal={horizontal}
                        interactive={isExpanded}
                        onMeasure={(extent) => measureSlot('leading', extent)}
                    >
                        {leading}
                    </CollapsingSlot>
                )
            ) : null}
            {actionNodes}
            {trailing ? (
                fab ? (
                    <View
                        onLayout={(event) =>
                            measureSlot('trailing', horizontal ? event.nativeEvent.layout.width : event.nativeEvent.layout.height)
                        }
                    >
                        {trailing}
                    </View>
                ) : (
                    <CollapsingSlot
                        progress={expansion}
                        horizontal={horizontal}
                        interactive={isExpanded}
                        onMeasure={(extent) => measureSlot('trailing', extent)}
                    >
                        {trailing}
                    </CollapsingSlot>
                )
            ) : null}
        </View>
    );
    const row = (
        <Surface
            elevation={elevation ?? (floating ? 1 : 0)}
            mode={floating ? 'elevated' : 'flat'}
            style={{ ...(!floating ? { width: '100%' } : {}), backgroundColor: background, borderRadius: floating ? 999 : 0 }}
        >
            {rowContents}
        </Surface>
    );
    return (
        <Animated.View
            onLayout={(event) => {
                if (alive()) setContainerWidth(event.nativeEvent.layout.width);
            }}
            accessibilityElementsHidden={!shown}
            importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
            {...(Platform.OS === 'web' ? { 'aria-hidden': !shown, inert: !shown } : {})}
            pointerEvents={shown ? 'auto' : 'none'}
            style={[
                {
                    alignSelf: floating && !horizontal ? 'center' : 'stretch',
                    flexShrink: 0,
                    ...(floating
                        ? horizontal
                            ? { width: '100%', paddingHorizontal: 16, marginVertical: 16 }
                            : { margin: 24, maxHeight: verticalLimit }
                        : {}),
                },
                animatedStyle,
                style,
            ]}
            testID={testID}
        >
            <Animated.View
                style={[
                    {
                        alignSelf: floating ? 'center' : 'stretch',
                        flexDirection: horizontal ? (rtl ? 'row-reverse' : 'row') : 'column',
                        direction: 'ltr',
                        alignItems: 'center',
                    },
                    ...(fab && floating
                        ? [
                              {
                                  position: 'relative' as const,
                                  ...(horizontal ? { width: controlsExtent + 64, height: 80 } : { width: 80, height: controlsExtent + 64 }),
                              },
                          ]
                        : []),
                ]}
            >
                {fab && floating ? (
                    <CollapsingSlot
                        progress={expansion}
                        horizontal={horizontal}
                        interactive={shown && isExpanded}
                        anchorEnd
                        onMeasure={setControlsExtent}
                        surface={{ color: background, elevation: elevation ?? 1 }}
                        style={
                            horizontal
                                ? { position: 'absolute', top: 8, ...(rtl ? { left: 64 } : { right: 64 }) }
                                : { position: 'absolute', bottom: 64, left: 8 }
                        }
                        testID={`${testID}-controls`}
                    >
                        {rowContents}
                    </CollapsingSlot>
                ) : (
                    row
                )}
                {fab && floating ? (
                    <AnimatedActionSurface
                        testID={`${testID}-fab-surface`}
                        elevation={2}
                        geometry={fabStyle}
                        style={[
                            {
                                position: 'absolute',
                                ...(horizontal ? (rtl ? { left: 0 } : { right: 0 }) : { bottom: 0 }),
                                borderRadius: 20,
                                backgroundColor: color === 'vibrant' ? theme.colors.tertiaryContainer : theme.colors.primaryContainer,
                            },
                            fabPlacement,
                        ]}
                    >
                        <Animated.View style={[{ flex: 1, overflow: 'hidden' }, fabMask]}>
                            <TouchableRipple
                                accessibilityRole="button"
                                accessibilityLabel={fab.label}
                                accessibilityState={{ disabled: fab.disabled }}
                                disabled={fab.disabled || !shown}
                                onPress={() => {
                                    if (canUseFab() && current.current.fab) current.current.fab.onPress();
                                }}
                                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: fab.disabled ? 0.38 : 1 }}
                                testID={fab.testID ?? `${testID}-fab`}
                            >
                                <Animated.View style={fabIconStyle}>
                                    <Icon
                                        source={fab.icon}
                                        size={24}
                                        color={color === 'vibrant' ? theme.colors.onTertiaryContainer : theme.colors.onPrimaryContainer}
                                    />
                                </Animated.View>
                            </TouchableRipple>
                        </Animated.View>
                    </AnimatedActionSurface>
                ) : null}
            </Animated.View>
        </Animated.View>
    );
}
