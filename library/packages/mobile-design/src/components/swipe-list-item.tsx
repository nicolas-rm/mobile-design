import { TouchableRipple } from '../ripple';
import {
    createContext,
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState,
    type ComponentProps,
    type ReactNode,
} from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, useLocale, type Theme } from 'react-native-paper';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
    cancelAnimation,
    ReduceMotion,
    useAnimatedProps,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { useMobileTheme } from '../core';
import { withAlpha } from '../color';

export type SwipeListSide = 'leading' | 'trailing';
export type SwipeListAction = {
    key: string;
    label: string;
    icon: ComponentProps<typeof Icon>['source'];
    onPress: () => void;
    variant?: 'filled' | 'tonal' | 'outlined' | 'standard';
    destructive?: boolean;
    disabled?: boolean;
};
export type SwipeListItemHandle = { open: (side: SwipeListSide) => void; close: () => void; reset: () => void };
export type SwipeListGroupHandle = { closeAll: () => void };
export type SwipeListItemProps = {
    id: string;
    children: ReactNode;
    /** Actions retain 64dp targets plus 2dp margins and must fit the measured row. Put additional actions in a consumer Menu. */
    leadingActions?: readonly SwipeListAction[];
    /** Actions retain 64dp targets plus 2dp margins and must fit the measured row. Put additional actions in a consumer Menu. */
    trailingActions?: readonly SwipeListAction[];
    leadingSwipeMode?: 'disabled' | 'direct' | 'indirect';
    trailingSwipeMode?: 'disabled' | 'direct' | 'indirect';
    disabled?: boolean;
    onOpenChange?: (side: SwipeListSide | null) => void;
    closeAccessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};
type SwipeCoordinator = { active: SharedValue<string>; closeRows: Map<string, () => void> };
const GroupContext = createContext<SwipeCoordinator | null>(null);
/** One shared UI-thread coordinator; opening a row closes its peers without JS-frame callbacks. */
export const SwipeListGroup = forwardRef<SwipeListGroupHandle, { children: ReactNode }>(function SwipeListGroup({ children }, ref) {
    const active = useSharedValue('');
    const coordinator = useRef<SwipeCoordinator>({ active, closeRows: new Map() }).current;
    useImperativeHandle(
        ref,
        () => ({
            closeAll() {
                // Invalidate RN callbacks now, before the coordinator's native
                // shared-value write reaches UI. Peers still settle on UI.
                coordinator.closeRows.forEach((close) => close());
                active.set('');
            },
        }),
        [active, coordinator]
    );
    return <GroupContext.Provider value={coordinator}>{children}</GroupContext.Provider>;
});
const EMPTY: readonly SwipeListAction[] = [];
const ACTION_WIDTH = 64,
    ACTION_MARGIN = 2,
    CELL_WIDTH = ACTION_WIDTH + ACTION_MARGIN * 2;
function clamp(value: number, min: number, max: number) {
    'worklet';
    return Math.max(min, Math.min(max, value));
}
/** MDC ListItemLayout: velocity500, nearest stable offsets and direct/indirect primary states. */
export function swipeListTarget(
    distance: number,
    velocity: number,
    reveal: number,
    width: number,
    mode: 'disabled' | 'direct' | 'indirect',
    wasOpen: boolean
): 'closed' | 'open' | 'primary' {
    'worklet';
    if (reveal <= 0 || width <= 0) return 'closed';
    if (velocity > 500) return mode === 'disabled' || (!wasOpen && mode !== 'direct') ? 'open' : 'primary';
    if (velocity < -500) return 'closed';
    if (mode !== 'disabled' && Math.abs(distance - width) < Math.abs(distance - reveal)) return 'primary';
    const target = mode === 'direct' ? width : reveal;
    return Math.abs(distance - target) < distance ? (mode === 'direct' ? 'primary' : 'open') : 'closed';
}
/** Pure geometry for drawing backgrounds/icons; hit targets retain64dp at the stable open state. */
export function swipeActionGeometry(revealed: number, width: number, count: number, index: number, leading: boolean) {
    'worklet';
    const intrinsic = count * CELL_WIDTH;
    const normal = Math.min(1, revealed / Math.max(1, intrinsic));
    const primary = leading ? index === 0 : index === count - 1;
    const full = clamp((revealed - intrinsic) / Math.max(1, width - intrinsic), 0, 1);
    const small = Math.max(6, ACTION_WIDTH * normal);
    const secondaryWidth = small + (6 - small) * full;
    const primaryWidth =
        revealed <= intrinsic
            ? small
            : ACTION_WIDTH + (width - (count - 1) * (6 + ACTION_MARGIN * 2) - ACTION_MARGIN * 2 - ACTION_WIDTH) * full;
    let start = leading ? 0 : width - revealed;
    for (let before = 0; before < index; before++)
        start += ((leading ? before === 0 : before === count - 1) ? primaryWidth : secondaryWidth) + ACTION_MARGIN * 2 * normal;
    const actionWidth = primary ? primaryWidth : secondaryWidth;
    start += ACTION_MARGIN * normal;
    const fade = clamp((revealed / Math.max(1, intrinsic) - 0.25) / 0.25, 0, 1) * (primary ? 1 : 1 - full);
    return { start, width: actionWidth, center: start + actionWidth / 2, opacity: fade };
}

/** MD3 swipe-to-reveal, with opt-in full swipe. The last trailing/first leading action is primary. */
export const SwipeListItem = forwardRef<SwipeListItemHandle, SwipeListItemProps>(function SwipeListItem(
    {
        id,
        children,
        leadingActions = EMPTY,
        trailingActions = EMPTY,
        leadingSwipeMode = 'disabled',
        trailingSwipeMode = 'disabled',
        disabled = false,
        onOpenChange,
        closeAccessibilityLabel = 'Close actions',
        style,
        testID = `swipe-list-${id}`,
    },
    ref
) {
    const theme = useMobileTheme(),
        { direction } = useLocale();
    const group = useContext(GroupContext),
        ownCoordinator = useSharedValue('');
    const active = group?.active ?? ownCoordinator;
    const rtl = direction === 'rtl',
        sign = rtl ? -1 : 1;
    const offset = useSharedValue(0),
        width = useSharedValue(0),
        height = useSharedValue(72);
    const start = useSharedValue(0),
        stable = useSharedValue(0),
        revision = useSharedValue(0),
        aliveUI = useSharedValue(true),
        dragging = useSharedValue(false),
        uiCommandRevision = useSharedValue(0),
        settling = useSharedValue(false),
        settlingTarget = useSharedValue(0),
        settlingPrimary = useSharedValue(false);
    const [open, setOpen] = useState<SwipeListSide | null>(null),
        [measuredWidth, setMeasuredWidth] = useState(0);
    for (const [side, actions, mode] of [
        ['leading', leadingActions, leadingSwipeMode],
        ['trailing', trailingActions, trailingSwipeMode],
    ] as const) {
        if (mode === 'direct' && actions.length > 1)
            throw new RangeError(`SwipeListItem ${side} direct swipe requires exactly one action.`);
        if (measuredWidth > 0 && actions.length * CELL_WIDTH > measuredWidth)
            throw new RangeError(
                `SwipeListItem ${side} actions need ${actions.length * CELL_WIDTH}dp but the row has ${measuredWidth}dp. Put additional actions in a Menu.`
            );
    }
    const openRef = useRef<SwipeListSide | null>(null),
        mounted = useRef(true),
        commandRevision = useRef(0),
        settledCommand = useRef<number | null>(null);
    const latest = useRef({ leadingActions, trailingActions, disabled, onOpenChange });
    useLayoutEffect(() => {
        latest.current = { leadingActions, trailingActions, disabled, onOpenChange };
    }, [leadingActions, trailingActions, disabled, onOpenChange]);
    const setSettled = (target: number, token: number, command: number) => {
        if (!mounted.current || commandRevision.current !== command || revision.get() !== token) return;
        const side = target === 0 ? null : target > 0 ? 'leading' : 'trailing';
        settledCommand.current = side ? command : null;
        setOpen(side);
        if (side !== openRef.current) {
            openRef.current = side;
            latest.current.onOpenChange?.(side);
        }
    };
    const resetUI = (command: number) => {
        'worklet';
        uiCommandRevision.set(command);
        revision.set(revision.get() + 1);
        cancelAnimation(offset);
        offset.set(0);
        stable.set(0);
        dragging.set(false);
        settling.set(false);
        if (active.get() === id) active.set('');
        scheduleOnRN(setSettled, 0, revision.get(), command);
    };
    const reset = () => {
        if (!mounted.current) return;
        const command = ++commandRevision.current;
        settledCommand.current = null;
        setOpen(null);
        if (openRef.current !== null) {
            openRef.current = null;
            latest.current.onOpenChange?.(null);
        }
        scheduleOnUI(resetUI, command);
    };
    const invoke = (side: SwipeListSide, key: string, token?: number, command?: number) => {
        if (
            !mounted.current ||
            (token !== undefined && (revision.get() !== token || commandRevision.current !== command)) ||
            active.get() !== id ||
            latest.current.disabled
        )
            return;
        if (
            token === undefined &&
            (settledCommand.current !== commandRevision.current || openRef.current !== side || active.get() !== id || dragging.get())
        )
            return;
        const action = latest.current[side === 'leading' ? 'leadingActions' : 'trailingActions'].find((item) => item.key === key);
        if (!action || action.disabled) {
            reset();
            return;
        }
        reset();
        action.onPress();
    };
    const leadingPrimary = leadingActions[0];
    const trailingPrimary = trailingActions[trailingActions.length - 1];
    const leadingPrimaryKey = leadingPrimary?.key,
        trailingPrimaryKey = trailingPrimary?.key;
    const leadingCount = leadingActions.length,
        trailingCount = trailingActions.length;
    const leadingMode = !leadingPrimary || leadingPrimary.disabled ? 'disabled' : leadingSwipeMode;
    const trailingMode = !trailingPrimary || trailingPrimary.disabled ? 'disabled' : trailingSwipeMode;
    const spring = theme.motion.spring.fast.spatial;
    const settle = (target: number, velocity = 0, primary = false) => {
        'worklet';
        revision.set(revision.get() + 1);
        const token = revision.get(),
            command = uiCommandRevision.get();
        dragging.set(false);
        settling.set(true);
        settlingTarget.set(target);
        settlingPrimary.set(primary);
        cancelAnimation(offset);
        const complete = (finished?: boolean) => {
            'worklet';
            if (!finished || !aliveUI.get() || revision.get() !== token) return;
            settling.set(false);
            if (primary) {
                const side = target > 0 ? 'leading' : 'trailing';
                const key = target > 0 ? leadingPrimaryKey : trailingPrimaryKey;
                if (key) scheduleOnRN(invoke, side, key, token, command);
            } else {
                stable.set(target);
                if (target === 0 && active.get() === id) active.set('');
                scheduleOnRN(setSettled, target, token, command);
            }
        };
        if (!theme.animation.scale) {
            offset.set(target);
            complete(true);
        } else
            offset.set(
                withSpring(
                    target,
                    {
                        stiffness: spring.stiffness,
                        damping: 2 * spring.damping * Math.sqrt(spring.stiffness),
                        mass: 1,
                        velocity,
                        overshootClamping: target === 0 || primary,
                        reduceMotion: ReduceMotion.Never,
                    },
                    complete
                )
            );
    };
    // Reanimated native writes from RN are asynchronous. Keep increment/read,
    // cancellation and spring creation in one UI transaction; otherwise an RN
    // increment followed by get() captures the old revision and rejects its own
    // completion. The RN epoch also rejects callbacks already queued before a
    // newer command has reached the UI runtime.
    const close = () => {
        if (!mounted.current) return;
        const command = ++commandRevision.current;
        scheduleOnUI((nextCommand: number) => {
            'worklet';
            if (!aliveUI.get()) return;
            uiCommandRevision.set(nextCommand);
            settle(0);
        }, command);
    };
    useLayoutEffect(() => {
        if (!group) return;
        group.closeRows.set(id, close);
        return () => {
            group.closeRows.delete(id);
        };
    }, [group, id, theme, leadingPrimaryKey, trailingPrimaryKey]);
    useImperativeHandle(
        ref,
        () => ({
            open(side) {
                if (!mounted.current || disabled) return;
                const count = side === 'leading' ? leadingCount : trailingCount;
                if (!count) return;
                group?.closeRows.forEach((closePeer, peerID) => {
                    if (peerID !== id) closePeer();
                });
                const command = ++commandRevision.current,
                    polarity = side === 'leading' ? 1 : -1;
                scheduleOnUI(
                    (nextCommand: number, nextSign: number, nextCount: number) => {
                        'worklet';
                        if (!aliveUI.get() || width.get() <= 0) return;
                        uiCommandRevision.set(nextCommand);
                        active.set(id);
                        settle(nextSign * Math.min(width.get(), nextCount * CELL_WIDTH));
                    },
                    command,
                    polarity,
                    count
                );
            },
            close,
            reset,
        }),
        [disabled, leadingActions, trailingActions, active, group, id, theme]
    );
    useAnimatedReaction(
        () => active.get(),
        (activeID) => {
            if (aliveUI.get() && activeID !== id && (offset.get() !== 0 || dragging.get())) {
                dragging.set(false);
                settle(0);
            }
        },
        Platform.OS === 'web' ? [id, theme, leadingPrimary?.key, trailingPrimary?.key] : undefined
    );
    const configuration = `${id}:${disabled}:${direction}:${leadingSwipeMode}:${trailingSwipeMode}:${leadingActions.map((item) => `${item.key}:${Boolean(item.disabled)}`).join(',')}:${trailingActions.map((item) => `${item.key}:${Boolean(item.disabled)}`).join(',')}`;
    useLayoutEffect(() => {
        reset();
    }, [configuration]);
    useEffect(() => {
        if (theme.animation.scale) return;
        scheduleOnUI(() => {
            'worklet';
            // Keep the user's selected destination; dropping motion while an
            // opening/full-swipe spring runs must neither reverse nor replay it.
            if (aliveUI.get() && settling.get() && !dragging.get()) settle(settlingTarget.get(), 0, settlingPrimary.get());
        });
    }, [theme.animation.scale]);
    useEffect(() => {
        mounted.current = true;
        scheduleOnUI(() => {
            'worklet';
            aliveUI.set(true);
        });
        return () => {
            mounted.current = false;
            const command = ++commandRevision.current;
            scheduleOnUI((nextCommand: number) => {
                'worklet';
                uiCommandRevision.set(nextCommand);
                aliveUI.set(false);
                settling.set(false);
                revision.set(revision.get() + 1);
                cancelAnimation(offset);
                if (active.get() === id) active.set('');
            }, command);
        };
    }, [id, active, aliveUI, offset, revision, uiCommandRevision]);
    const pan = usePanGesture({
        enabled: !disabled && (leadingActions.length > 0 || trailingActions.length > 0),
        activeOffsetX: [-10, 10],
        failOffsetY: [-12, 12],
        maxPointers: 1,
        onActivate: () => {
            'worklet';
            if (!aliveUI.get()) return;
            revision.set(revision.get() + 1);
            cancelAnimation(offset);
            settling.set(false);
            start.set(offset.get());
            dragging.set(true);
            active.set(id);
        },
        onUpdate: (event) => {
            'worklet';
            if (!aliveUI.get() || !dragging.get()) return;
            const next = start.get() + event.translationX * sign;
            const leadingMax = leadingCount
                ? leadingMode === 'disabled'
                    ? Math.min(width.get(), leadingCount * CELL_WIDTH)
                    : width.get()
                : 0;
            const trailingMax = trailingCount
                ? trailingMode === 'disabled'
                    ? Math.min(width.get(), trailingCount * CELL_WIDTH)
                    : width.get()
                : 0;
            // Resistance beyond stable reveal/full edges without jumping when a settling row is grabbed.
            const clamped = clamp(next, -trailingMax, leadingMax);
            offset.set(clamped + (next - clamped) * 0.12);
        },
        onDeactivate: (event) => {
            'worklet';
            if (!aliveUI.get() || !dragging.get()) return;
            dragging.set(false);
            if (event.canceled) {
                settle(stable.get());
                return;
            }
            const current = offset.get();
            if (Math.abs(current) < 0.01) {
                settle(0);
                return;
            }
            const leading = current > 0,
                count = leading ? leadingCount : trailingCount;
            const reveal = Math.min(width.get(), count * CELL_WIDTH);
            const mode = leading ? leadingMode : trailingMode;
            const target = swipeListTarget(
                Math.abs(current),
                event.velocityX * sign * (leading ? 1 : -1),
                reveal,
                width.get(),
                mode,
                Math.sign(stable.get()) === Math.sign(current) && stable.get() !== 0
            );
            settle(
                target === 'closed' ? 0 : (leading ? 1 : -1) * (target === 'primary' ? width.get() : reveal),
                event.velocityX * sign,
                target === 'primary'
            );
        },
        onFinalize: () => {
            'worklet';
            // GH3 finalization has base coordinates only. Release velocity is
            // available onDeactivate; an interrupted/failing handler returns
            // to its prior stable position if it never deactivated normally.
            if (aliveUI.get() && dragging.get()) {
                dragging.set(false);
                settle(stable.get());
            }
        },
    });
    const foreground = useAnimatedStyle(() => {
        const count = offset.get() >= 0 ? leadingCount : trailingCount;
        const reveal = Math.min(width.get(), count * CELL_WIDTH);
        const fadeAt = (reveal + width.get()) / 2;
        return {
            transform: [{ translateX: offset.get() * sign }],
            opacity: clamp(1 - (Math.abs(offset.get()) - fadeAt) / Math.max(1, width.get() - fadeAt), 0, 1),
        };
    });
    return (
        <View
            style={[{ overflow: 'hidden', minHeight: 48 }, style]}
            testID={testID}
            onAccessibilityEscape={open ? close : undefined}
            {...(Platform.OS === 'web'
                ? {
                      onKeyDown: (event: Parameters<NonNullable<React.ComponentProps<typeof View>['onKeyDown']>>[0]) => {
                          if (open && event.nativeEvent.key === 'Escape') {
                              event.preventDefault();
                              event.stopPropagation();
                              close();
                          }
                      },
                  }
                : {})}
            onLayout={(event) => {
                const size = event.nativeEvent.layout;
                if (size.width !== width.get()) {
                    reset();
                    width.set(size.width);
                    setMeasuredWidth(size.width);
                }
                height.set(size.height);
            }}
        >
            <ActionBar
                actions={leadingActions}
                leading
                offset={offset}
                width={width}
                height={height}
                dragging={dragging}
                rtl={rtl}
                open={open === 'leading'}
                disabled={disabled}
                theme={theme}
                invoke={invoke}
                testID={testID}
            />
            <ActionBar
                actions={trailingActions}
                leading={false}
                offset={offset}
                width={width}
                height={height}
                dragging={dragging}
                rtl={rtl}
                open={open === 'trailing'}
                disabled={disabled}
                theme={theme}
                invoke={invoke}
                testID={testID}
            />
            <GestureDetector gesture={pan} touchAction="pan-y">
                <Animated.View style={foreground} collapsable={false}>
                    <View
                        {...(Platform.OS === 'web' ? { 'aria-hidden': open != null, inert: open != null } : {})}
                        accessibilityElementsHidden={open != null}
                        importantForAccessibility={open ? 'no-hide-descendants' : 'auto'}
                    >
                        {children}
                    </View>
                    {open ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={closeAccessibilityLabel}
                            onPress={close}
                            style={StyleSheet.absoluteFill}
                            testID={`${testID}-close`}
                        />
                    ) : null}
                </Animated.View>
            </GestureDetector>
        </View>
    );
});
function ActionBar({
    actions,
    leading,
    offset,
    width,
    height,
    dragging,
    rtl,
    open,
    disabled,
    theme,
    invoke,
    testID,
}: {
    actions: readonly SwipeListAction[];
    leading: boolean;
    offset: SharedValue<number>;
    width: SharedValue<number>;
    height: SharedValue<number>;
    dragging: SharedValue<boolean>;
    rtl: boolean;
    open: boolean;
    disabled: boolean;
    theme: Theme;
    invoke: (side: SwipeListSide, key: string) => void;
    testID: string;
}) {
    const count = actions.length;
    const interaction = useAnimatedProps(() => ({
        pointerEvents:
            open && !disabled && !dragging.get() && Math.abs(offset.get()) >= Math.min(width.get(), count * CELL_WIDTH) - 0.1
                ? ('box-none' as const)
                : ('none' as const),
    }));
    return (
        <Animated.View
            style={StyleSheet.absoluteFill}
            animatedProps={interaction}
            {...(Platform.OS === 'web' ? { 'aria-hidden': !open || disabled, inert: !open || disabled } : {})}
            accessibilityElementsHidden={!open || disabled}
            importantForAccessibility={open && !disabled ? 'auto' : 'no-hide-descendants'}
        >
            {actions.map((action, index) => (
                <RevealAction
                    key={action.key}
                    action={action}
                    index={index}
                    count={count}
                    leading={leading}
                    offset={offset}
                    width={width}
                    height={height}
                    rtl={rtl}
                    disabled={disabled || Boolean(action.disabled)}
                    open={open}
                    theme={theme}
                    onPress={() => invoke(leading ? 'leading' : 'trailing', action.key)}
                    testID={`${testID}-${leading ? 'leading' : 'trailing'}-${action.key}`}
                />
            ))}
        </Animated.View>
    );
}
function actionColors(action: SwipeListAction, theme: Theme) {
    const variant = action.variant ?? 'tonal';
    const fill =
        variant === 'filled'
            ? action.destructive
                ? theme.colors.error
                : theme.colors.primary
            : variant === 'tonal'
              ? action.destructive
                  ? theme.colors.errorContainer
                  : theme.colors.secondaryContainer
              : 'transparent';
    const ink =
        variant === 'filled'
            ? action.destructive
                ? theme.colors.onError
                : theme.colors.onPrimary
            : variant === 'tonal'
              ? action.destructive
                  ? theme.colors.onErrorContainer
                  : theme.colors.onSecondaryContainer
              : action.destructive
                ? theme.colors.error
                : theme.colors.onSurfaceVariant;
    return { fill, ink };
}
function RevealAction({
    action,
    index,
    count,
    leading,
    offset,
    width,
    height,
    rtl,
    disabled,
    open,
    theme,
    onPress,
    testID,
}: {
    action: SwipeListAction;
    index: number;
    count: number;
    leading: boolean;
    offset: SharedValue<number>;
    width: SharedValue<number>;
    height: SharedValue<number>;
    rtl: boolean;
    disabled: boolean;
    open: boolean;
    theme: Theme;
    onPress: () => void;
    testID: string;
}) {
    const [pressed, setPressed] = useState(false),
        [focused, setFocused] = useState(false),
        [hovered, setHovered] = useState(false);
    const interactive = useRef(false);
    useLayoutEffect(() => {
        interactive.current = open && !disabled;
        return () => {
            interactive.current = false;
        };
    }, [open, disabled]);
    useEffect(() => {
        if (disabled || !open) {
            setPressed(false);
            setFocused(false);
            setHovered(false);
        }
    }, [disabled, open]);
    // Interpolate a press fraction against the live UI height, rather than
    // capturing the first measured height in an RN effect.
    const radius = useSharedValue(0);
    useEffect(() => {
        const s = theme.motion.spring.fast.spatial;
        radius.set(
            !theme.animation.scale
                ? pressed
                    ? 1
                    : 0
                : withSpring(pressed ? 1 : 0, {
                      stiffness: s.stiffness,
                      damping: 2 * s.damping * Math.sqrt(s.stiffness),
                      reduceMotion: ReduceMotion.Never,
                  })
        );
    }, [pressed, theme, radius, height, theme.animation.scale]);
    useEffect(() => () => cancelAnimation(radius), [radius]);
    const variant = action.variant ?? 'tonal';
    const { fill, ink: enabledInk } = actionColors(action, theme),
        ink = disabled ? theme.colors.onSurface : enabledInk;
    const background = useAnimatedStyle(() => {
        const revealed = Math.max(0, leading ? offset.get() : -offset.get());
        const geometry = swipeActionGeometry(revealed, width.get(), count, index, leading);
        return {
            width: geometry.width,
            left: rtl ? width.get() - geometry.start - geometry.width : geometry.start,
            borderRadius: Math.max(0, Math.min(height.get() / 2 + (8 - height.get() / 2) * radius.get(), geometry.width / 2)),
            opacity: revealed > 0 ? (disabled ? 0.12 : 1) : 0,
        };
    });
    const content = useAnimatedStyle(() => {
        const revealed = Math.max(0, leading ? offset.get() : -offset.get());
        const geometry = swipeActionGeometry(revealed, width.get(), count, index, leading);
        const center = rtl ? width.get() - geometry.center : geometry.center;
        return {
            transform: [{ translateX: center - ACTION_WIDTH / 2 }],
            opacity: geometry.opacity * (disabled ? 0.38 : 1),
        };
    });
    const targetShape = useAnimatedStyle(() => ({
        borderRadius: Math.max(0, Math.min(height.get() / 2 + (8 - height.get() / 2) * radius.get(), ACTION_WIDTH / 2)),
    }));
    return (
        <>
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.actionBackground,
                    {
                        backgroundColor: disabled ? theme.colors.onSurface : fill,
                        borderWidth: variant === 'outlined' ? 1 : 0,
                        borderColor: disabled ? theme.colors.onSurface : theme.colors.outline,
                    },
                    background,
                ]}
            />
            <Animated.View style={[styles.actionTarget, content, targetShape]}>
                <TouchableRipple
                    disabled={disabled}
                    onPress={onPress}
                    onPressIn={() => {
                        if (interactive.current) setPressed(true);
                    }}
                    onPressOut={() => {
                        if (interactive.current) setPressed(false);
                    }}
                    onFocus={() => {
                        if (interactive.current) setFocused(true);
                    }}
                    onBlur={() => {
                        if (interactive.current) {
                            setFocused(false);
                            setPressed(false);
                        }
                    }}
                    onHoverIn={() => {
                        if (interactive.current) setHovered(true);
                    }}
                    onHoverOut={() => {
                        if (interactive.current) setHovered(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                    accessibilityState={{ disabled }}
                    rippleColor={typeof ink === 'string' ? withAlpha(ink, 0.1) : theme.colors.stateLayerPressed}
                    style={styles.actionTouch}
                    testID={testID}
                >
                    <View pointerEvents="none" style={styles.actionContent}>
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                { backgroundColor: ink, opacity: !disabled && open && !pressed ? (focused ? 0.1 : hovered ? 0.08 : 0) : 0 },
                            ]}
                        />
                        <Icon source={action.icon} color={ink} size={24} />
                    </View>
                </TouchableRipple>
                {focused && open && !disabled ? (
                    <Animated.View
                        pointerEvents="none"
                        style={[StyleSheet.absoluteFill, { borderWidth: 3, borderColor: theme.colors.secondary }, targetShape]}
                    />
                ) : null}
            </Animated.View>
        </>
    );
}
const styles = StyleSheet.create({
    actionBackground: { position: 'absolute', top: 0, bottom: 0 },
    actionTarget: { position: 'absolute', top: 0, bottom: 0, width: ACTION_WIDTH, overflow: 'hidden' },
    actionTouch: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    actionContent: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
});
