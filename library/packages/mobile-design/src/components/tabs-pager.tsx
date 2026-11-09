import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { View, type NativeScrollEvent, type ScrollViewInstance, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useLocale } from 'react-native-paper';
import { useMobileTheme } from '../core';
import type { TabItem } from './tabs';

export type TabsPagerProps = {
    items: readonly TabItem[];
    value: string;
    onValueChange: (key: string) => void;
    /** The same logical fractional index passed to Tabs.position. */
    position: SharedValue<number>;
    /** A repeated activation of the current tab can interrupt an unfinished swipe. */
    selectionRequest?: number;
    /** Disable the pager and cancel pending movement while its panel is busy or inactive. */
    enabled?: boolean;
    /** Disable user swipes while retaining animated tab activation, for example when a child owns horizontal gestures. */
    swipeEnabled?: boolean;
    renderPage: (item: TabItem, selected: boolean) => ReactNode;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

type SwipePhase = 'idle' | 'dragging' | 'released' | 'settling';
// Native iOS and Android scroll payloads include their event time.
type TimedScrollEvent = NativeScrollEvent & { timestamp?: number };
const PAGE_EPSILON = 0.001;

/** Native paged content for Tabs. Stable keys preserve each mounted panel and its vertical scroll. */
export function TabsPager({
    items,
    value,
    onValueChange,
    position,
    selectionRequest = 0,
    enabled = true,
    swipeEnabled = true,
    renderPage,
    style,
    testID = 'mobile-tabs-pager',
}: TabsPagerProps) {
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    const reduced = theme.animation.scale === 0;
    const scroll = useAnimatedRef<ScrollViewInstance>();
    const [width, setWidth] = useState(0);
    const [settlement, setSettlement] = useState(0);
    const layout = useRef({ width: 0, rtl, keys: '', pending: true });
    const alive = useRef(true);
    const revision = useRef(0);
    const revisionUI = useSharedValue(0);
    const gestureRevision = useSharedValue(-1);
    const gestureSequence = useSharedValue(0);
    const phase = useSharedValue<SwipePhase>('idle');
    const lastGestureEvent = useSharedValue(0);
    const requested = useRef<{ key: string; atPage: boolean } | null>(null);
    const keys = JSON.stringify(items.map((item) => item.key));
    const availability = JSON.stringify(items.map((item) => [item.key, Boolean(item.disabled)]));
    const pages = rtl ? [...items].reverse() : items;
    const lastIndex = Math.max(0, items.length - 1);
    const selectedIndex = Math.max(
        0,
        items.findIndex((item) => item.key === value)
    );
    const selectedOffset = Math.max(0, rtl ? items.length - 1 - selectedIndex : selectedIndex) * width;
    const configuration = JSON.stringify([availability, enabled, swipeEnabled, width, rtl, selectionRequest, reduced]);
    const configurationUI = useSharedValue(configuration);
    const lastConfiguration = useRef(configuration);
    const latest = useRef({ items, value, onValueChange, selectedIndex, selectedOffset });
    useLayoutEffect(() => {
        latest.current = { items, value, onValueChange, selectedIndex, selectedOffset };
    });
    const commit = (index: number, token: number, gesture: number, atPage: boolean) => {
        if (!alive.current || token !== revision.current || gesture !== gestureSequence.get()) return;
        const current = latest.current;
        const item = current.items[index];
        if (item?.disabled) {
            // A disabled destination cannot leave the visible page and the
            // controlled selection disagreeing after a native swipe.
            position.set(current.selectedIndex);
            scroll.current?.scrollTo({ x: current.selectedOffset, animated: false });
            return;
        }
        if (item && item.key !== current.value) {
            requested.current = { key: item.key, atPage };
            current.onValueChange(item.key);
            // Reconcile even when the controlled owner declines the request.
            // Accepted value updates are batched with this settlement revision.
            if (alive.current) setSettlement((current) => current + 1);
        }
    };
    const isCurrent = () => {
        'worklet';
        return enabled && width > 0 && configurationUI.get() === configuration;
    };
    const isCurrentSwipe = (expected: SwipePhase) => {
        'worklet';
        return isCurrent() && swipeEnabled && gestureRevision.get() === revisionUI.get() && phase.get() === expected;
    };
    const acceptGestureEvent = (event: TimedScrollEvent) => {
        'worklet';
        const time = event.timestamp;
        if (time === undefined) return true;
        if (time < lastGestureEvent.get()) return false;
        lastGestureEvent.set(time);
        return true;
    };
    const finishSwipe = (offset: number) => {
        'worklet';
        const physical = offset / width;
        const page = Math.max(0, Math.min(lastIndex, Math.round(physical)));
        const logical = rtl ? lastIndex - page : page;
        phase.set('idle');
        position.set(logical);
        scheduleOnRN(commit, logical, gestureRevision.get(), gestureSequence.get(), Math.abs(physical - page) < PAGE_EPSILON);
    };
    const handler = useAnimatedScrollHandler({
        onBeginDrag: (event) => {
            if (!isCurrent() || !swipeEnabled || !acceptGestureEvent(event)) return;
            gestureRevision.set(revisionUI.get());
            gestureSequence.set(gestureSequence.get() + 1);
            phase.set('dragging');
        },
        onScroll: (event: TimedScrollEvent) => {
            if (!isCurrent() || (event.timestamp !== undefined && event.timestamp < lastGestureEvent.get())) return;
            const physical = event.contentOffset.x / width;
            position.set(Math.max(0, Math.min(lastIndex, rtl ? lastIndex - physical : physical)));
        },
        onEndDrag: (event) => {
            if (!isCurrentSwipe('dragging') || !acceptGestureEvent(event)) return;
            const offset = event.contentOffset.x;
            const physical = offset / width;
            const target = (event.targetContentOffset?.x ?? offset) / width;
            // An exact page boundary may finish without a momentum event.
            if (
                Math.abs(physical - Math.round(physical)) < PAGE_EPSILON &&
                Math.abs(target - physical) < PAGE_EPSILON &&
                Math.abs(event.velocity?.x ?? 0) < PAGE_EPSILON
            ) {
                finishSwipe(offset);
            } else {
                phase.set('released');
            }
        },
        onMomentumBegin: (event) => {
            if (isCurrentSwipe('released') && acceptGestureEvent(event)) phase.set('settling');
        },
        onMomentumEnd: (event) => {
            // Native scrollTo also sends momentum-end on iOS, without a matching drag and momentum-begin.
            if (isCurrentSwipe('settling') && acceptGestureEvent(event)) finishSwipe(event.contentOffset.x);
        },
    });
    useLayoutEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    useLayoutEffect(() => {
        const acceptedSwipe = lastConfiguration.current === configuration && requested.current?.key === value && requested.current.atPage;
        lastConfiguration.current = configuration;
        requested.current = null;
        // The native view already reached this page. Another scrollTo could interrupt the next swipe.
        if (acceptedSwipe) return;

        // A native callback may already be queued with its previous handler.
        // Revoke that configuration before publishing the accepted page/snap.
        configurationUI.set(configuration);
        revision.current += 1;
        revisionUI.set(revision.current);
        phase.set('idle');
        if (width <= 0) return;
        const resized = layout.current.width !== width || layout.current.rtl !== rtl || layout.current.keys !== keys;
        layout.current = { width, rtl, keys, pending: resized || layout.current.pending };
        if (resized || reduced || !enabled) position.set(selectedIndex);
        scroll.current?.scrollTo({ x: selectedOffset, animated: enabled && !resized && !reduced });
    }, [
        availability,
        configuration,
        configurationUI,
        enabled,
        keys,
        phase,
        position,
        reduced,
        revisionUI,
        rtl,
        scroll,
        selectedIndex,
        selectedOffset,
        settlement,
        selectionRequest,
        swipeEnabled,
        value,
        width,
    ]);
    return (
        <View style={[{ flex: 1, minHeight: 0 }, style]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)} testID={testID}>
            <Animated.ScrollView
                ref={scroll}
                horizontal
                pagingEnabled
                scrollEnabled={enabled && swipeEnabled}
                directionalLockEnabled
                bounces={false}
                overScrollMode="never"
                contentInsetAdjustmentBehavior="never"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                onScroll={handler}
                scrollEventThrottle={16}
                style={{ flex: 1, direction: 'ltr' }}
                onContentSizeChange={(contentWidth) => {
                    if (width > 0 && layout.current.pending && contentWidth >= width * items.length - 1) {
                        layout.current.pending = false;
                        scroll.current?.scrollTo({ x: selectedOffset, animated: false });
                    }
                }}
                testID={`${testID}-scroll`}
            >
                {width > 0
                    ? pages.map((item) => (
                          <View
                              key={item.key}
                              nativeID={item.panelID}
                              style={{ width, height: '100%', flexGrow: 0, flexShrink: 0, direction: rtl ? 'rtl' : 'ltr' }}
                              accessibilityElementsHidden={item.key !== value}
                              importantForAccessibility={item.key === value ? 'auto' : 'no-hide-descendants'}
                              pointerEvents={item.key === value ? 'auto' : 'none'}
                              testID={`${testID}-page-${item.key}`}
                          >
                              {renderPage(item, item.key === value)}
                          </View>
                      ))
                    : null}
            </Animated.ScrollView>
        </View>
    );
}
