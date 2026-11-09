import { webAccessibility } from '../web-accessibility';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { useMobileTheme } from '../core';

export type ListReorderItemInfo<T> = {
    item: T;
    index: number;
    dragged: boolean;
    /** Places the drag recognizer and accessible move actions on this handle only. */
    renderHandle: (children: ReactNode, accessibilityLabel: string) => ReactNode;
};
export type ListReorderGroupProps<T> = {
    items: readonly T[];
    keyExtractor: (item: T) => string;
    renderItem: (info: ListReorderItemInfo<T>) => ReactNode;
    onReorder: (items: T[]) => void;
    /** Every rendered row must have this explicit, fixed height. */
    itemHeight: number;
    gap?: number;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};
type SharedOrder = {
    positions: SharedValue<Record<string, number>>;
    keys: SharedValue<string[]>;
    active: SharedValue<string>;
    from: SharedValue<number>;
    target: SharedValue<number>;
    translation: SharedValue<number>;
    alive: SharedValue<boolean>;
    generation: SharedValue<number>;
};
function reordered(keys: readonly string[], from: number, to: number) {
    'worklet';
    const result = [...keys];
    result.splice(to, 0, ...result.splice(from, 1));
    return result;
}
function positionMap(keys: readonly string[]) {
    'worklet';
    return Object.fromEntries(keys.map((key, index) => [key, index]));
}

/** Controlled, fixed-height list reordering. Drag coordinates and insertion
 * positions stay on UI; only drag-state boundaries and a completed order cross
 * to React. The surrounding screen remains responsible for scrolling. */
export function ListReorderGroup<T>({
    items,
    keyExtractor,
    renderItem,
    onReorder,
    itemHeight,
    gap = 2,
    disabled = false,
    style,
    testID = 'mobile-list-reorder',
}: ListReorderGroupProps<T>) {
    if (!Number.isFinite(itemHeight) || itemHeight < 48) throw new RangeError('ListReorderGroup itemHeight must be at least 48dp.');
    if (!Number.isFinite(gap) || gap < 0) throw new RangeError('ListReorderGroup gap must be a non-negative number.');
    const keys = items.map(keyExtractor);
    if (keys.some((key) => typeof key !== 'string' || !key) || new Set(keys).size !== keys.length)
        throw new Error('ListReorderGroup requires unique, non-empty item keys.');
    const positions = useSharedValue(positionMap(keys));
    const sharedKeys = useSharedValue(keys);
    const active = useSharedValue('');
    const from = useSharedValue(-1);
    const target = useSharedValue(-1);
    const translation = useSharedValue(0);
    const alive = useSharedValue(true);
    const generation = useSharedValue(0);
    const [draggedKey, setDraggedKey] = useState('');
    const [commitVersion, setCommitVersion] = useState(0);
    const latest = useRef({ items, keys, onReorder, disabled, alive: true, generation: 0, config: '' });
    const accessibleOrder = useRef<{ generation: number; keys: readonly string[] }>({ generation: 0, keys });
    const config = JSON.stringify([keys, itemHeight, gap, disabled]);
    if (latest.current.config !== config) latest.current.generation++;
    latest.current = { ...latest.current, items, keys, onReorder, disabled, config };
    const currentGeneration = latest.current.generation;
    if (accessibleOrder.current.generation !== currentGeneration) accessibleOrder.current = { generation: currentGeneration, keys };
    useLayoutEffect(() => {
        setDraggedKey('');
        accessibleOrder.current = { generation: currentGeneration, keys };
        scheduleOnUI(
            (nextKeys: string[], nextGeneration: number) => {
                'worklet';
                generation.set(nextGeneration);
                positions.set(positionMap(nextKeys));
                sharedKeys.set(nextKeys);
                active.set('');
                from.set(-1);
                target.set(-1);
                translation.set(0);
            },
            keys,
            currentGeneration
        );
    }, [config, commitVersion, currentGeneration, generation, positions, sharedKeys, active, from, target, translation]);
    useLayoutEffect(() => {
        latest.current.alive = true;
        alive.set(true);
        return () => {
            latest.current.alive = false;
            scheduleOnUI(() => {
                'worklet';
                alive.set(false);
                active.set('');
            });
        };
    }, [alive, active]);
    const publishDrag = (key: string, version: number) => {
        if (latest.current.alive && !latest.current.disabled && latest.current.generation === version) setDraggedKey(key);
    };
    const commit = (nextKeys: string[], version: number, force = false) => {
        const current = latest.current;
        if (!current.alive || current.disabled || current.generation !== version) return;
        if (nextKeys.length !== current.keys.length || nextKeys.some((key) => !current.keys.includes(key))) return;
        setDraggedKey('');
        if (force || !nextKeys.every((key, index) => key === current.keys[index])) {
            const byKey = new Map(current.items.map((item, index) => [current.keys[index], item]));
            current.onReorder(nextKeys.map((key) => byKey.get(key)!));
            setCommitVersion((previous) => previous + 1);
        }
    };
    const moveAccessible = (id: string, step: number) => {
        const current = latest.current;
        if (!current.alive || current.disabled || !step) return;
        const order = accessibleOrder.current.keys;
        const from = order.indexOf(id);
        if (from < 0 || from + step < 0 || from + step >= order.length) return;
        const next = reordered(order, from, from + step);
        // RN events may arrive before either a React render or a shared-value
        // write. Keep this cursor synchronous so every accessible move counts.
        accessibleOrder.current = { generation: current.generation, keys: next };
        commit(next, current.generation, true);
    };
    const order = { positions, keys: sharedKeys, active, from, target, translation, alive, generation };
    const stride = itemHeight + gap;
    return (
        <View style={[{ height: Math.max(0, items.length * stride - gap), position: 'relative' }, style]} testID={testID}>
            <InsertionMarker order={order} stride={stride} itemHeight={itemHeight} testID={`${testID}-insertion`} />
            {items.map((item, index) => (
                <ReorderRow
                    key={keys[index]}
                    id={keys[index]}
                    index={index}
                    item={item}
                    renderItem={renderItem}
                    dragged={draggedKey === keys[index]}
                    order={order}
                    itemHeight={itemHeight}
                    stride={stride}
                    disabled={disabled}
                    count={items.length}
                    configuration={currentGeneration}
                    publishDrag={publishDrag}
                    commit={commit}
                    moveAccessible={moveAccessible}
                    testID={`${testID}-${keys[index]}`}
                />
            ))}
        </View>
    );
}

function InsertionMarker({
    order,
    stride,
    itemHeight,
    testID,
}: {
    order: SharedOrder;
    stride: number;
    itemHeight: number;
    testID: string;
}) {
    const theme = useMobileTheme();
    const style = useAnimatedStyle(() => ({
        opacity: order.active.get() ? 1 : 0,
        top: Math.max(0, order.target.get()) * stride,
    }));
    return (
        <Animated.View
            pointerEvents="none"
            style={[
                {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: itemHeight,
                    borderRadius: 16,
                    backgroundColor: theme.colors.surfaceContainerLow,
                },
                style,
            ]}
            testID={testID}
        />
    );
}
function ReorderRow<T>({
    id,
    index,
    item,
    renderItem,
    dragged,
    order,
    itemHeight,
    stride,
    disabled,
    count,
    configuration,
    publishDrag,
    commit,
    moveAccessible,
    testID,
}: {
    id: string;
    index: number;
    item: T;
    renderItem: ListReorderGroupProps<T>['renderItem'];
    dragged: boolean;
    order: SharedOrder;
    itemHeight: number;
    stride: number;
    disabled: boolean;
    count: number;
    configuration: number;
    publishDrag: (id: string, version: number) => void;
    commit: (keys: string[], version: number) => void;
    moveAccessible: (id: string, step: number) => void;
    testID: string;
}) {
    const theme = useMobileTheme();
    const spring = theme.motion.spring.fast.spatial;
    const reduced = theme.animation.scale === 0;
    const pan = usePanGesture({
        enabled: !disabled,
        activeOffsetY: [-10, 10],
        maxPointers: 1,
        onActivate: () => {
            'worklet';
            if (!order.alive.get() || order.generation.get() !== configuration || order.active.get()) return;
            const position = order.positions.get()[id];
            if (position == null) return;
            order.active.set(id);
            order.from.set(position);
            order.target.set(position);
            order.translation.set(0);
            scheduleOnRN(publishDrag, id, order.generation.get());
        },
        onUpdate: (event) => {
            'worklet';
            if (!order.alive.get() || order.generation.get() !== configuration || order.active.get() !== id) return;
            const position = Math.max(0, Math.min((order.keys.get().length - 1) * stride, order.from.get() * stride + event.translationY));
            order.translation.set(position - order.from.get() * stride);
            order.target.set(Math.round(position / stride));
        },
        onDeactivate: (event) => {
            'worklet';
            if (!order.alive.get() || order.generation.get() !== configuration || order.active.get() !== id) return;
            const version = order.generation.get();
            const next = event.canceled ? order.keys.get() : reordered(order.keys.get(), order.from.get(), order.target.get());
            order.positions.set(positionMap(next));
            order.keys.set(next);
            order.active.set('');
            order.translation.set(0);
            scheduleOnRN(publishDrag, '', version);
            if (!event.canceled) scheduleOnRN(commit, next, version);
        },
        onFinalize: () => {
            'worklet';
            if (!order.alive.get() || order.generation.get() !== configuration || order.active.get() !== id) return;
            order.active.set('');
            order.translation.set(0);
            scheduleOnRN(publishDrag, '', order.generation.get());
        },
    });
    const animated = useAnimatedStyle(() => {
        const position = order.positions.get()[id] ?? index;
        if (order.active.get() === id) return { top: position * stride + order.translation.get(), zIndex: 2 };
        let destination = position;
        if (order.active.get()) {
            if (position > order.from.get() && position <= order.target.get()) destination--;
            else if (position < order.from.get() && position >= order.target.get()) destination++;
        }
        const top = destination * stride;
        return {
            top: reduced
                ? top
                : withSpring(top, {
                      stiffness: spring.stiffness,
                      damping: 2 * spring.damping * Math.sqrt(spring.stiffness),
                      reduceMotion: ReduceMotion.Never,
                      mass: 1,
                  }),
            zIndex: 0,
        };
    });
    const renderHandle = (children: ReactNode, accessibilityLabel: string) => (
        <GestureDetector gesture={pan}>
            <View
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel={accessibilityLabel}
                accessibilityState={{ disabled }}
                accessibilityValue={{ min: 1, max: count, now: index + 1 }}
                {...(Platform.OS === 'web'
                    ? {
                          tabIndex: disabled ? -1 : 0,
                          onKeyDown: (event: Parameters<NonNullable<React.ComponentProps<typeof View>['onKeyDown']>>[0]) => {
                              if (disabled || !['ArrowUp', 'ArrowDown'].includes(event.nativeEvent.key)) return;
                              event.preventDefault();
                              event.stopPropagation();
                              moveAccessible(id, event.nativeEvent.key === 'ArrowDown' ? 1 : -1);
                          },
                      }
                    : {})}
                accessibilityActions={[
                    { name: 'increment', label: 'Move down' },
                    { name: 'decrement', label: 'Move up' },
                ]}
                onAccessibilityAction={(event) => {
                    if (disabled) return;
                    const step = event.nativeEvent.actionName === 'increment' ? 1 : event.nativeEvent.actionName === 'decrement' ? -1 : 0;
                    moveAccessible(id, step);
                }}
                style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
                testID={`${testID}-handle`}
                {...webAccessibility({
                    role: 'adjustable',
                    state: { disabled },
                    value: { min: 1, max: count, now: index + 1 },
                    hidden: undefined,
                })}
            >
                {children}
            </View>
        </GestureDetector>
    );
    return (
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, height: itemHeight }, animated]} testID={testID}>
            {renderItem({ item, index, dragged, renderHandle })}
        </Animated.View>
    );
}
