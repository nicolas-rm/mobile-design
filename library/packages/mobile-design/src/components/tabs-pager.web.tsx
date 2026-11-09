import { useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocale } from 'react-native-paper';
import Animated, { useAnimatedReaction } from 'react-native-reanimated';
import { useMobileTheme } from '../core';
import { useCarouselScrollController } from './carousel-scroll-controller';
import type { TabsPagerProps } from './tabs-pager';
export type { TabsPagerProps } from './tabs-pager';

/** Browser scrolling settles through the same logical page transaction as tab activation. */
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
    const theme = useMobileTheme(),
        rtl = useLocale().direction === 'rtl';
    const [width, setWidth] = useState(0);
    const [settlement, setSettlement] = useState(0);
    const selected = Math.max(
        0,
        items.findIndex((item) => item.key === value)
    );
    const maxOffset = Math.max(0, (items.length - 1) * width);
    const interacting = useRef(false);
    const previous = useRef({ width: 0, rtl, keys: '' });
    const keys = JSON.stringify(items.map((item) => [item.key, Boolean(item.disabled)]));
    const controller: ReturnType<typeof useCarouselScrollController> = useCarouselScrollController({
        maxOffset,
        rtl,
        animationScale: theme.animation.scale,
        interactive: enabled && swipeEnabled,
        snapOffsets: items.map((_, index) => index * width),
        onInterrupted: () => {
            interacting.current = true;
        },
        onSettled: () => {
            if (!interacting.current || !enabled || !swipeEnabled || width <= 0) return;
            interacting.current = false;
            const index = Math.max(0, Math.min(items.length - 1, Math.round(controller.offset.get() / width)));
            if (items[index]?.disabled) {
                controller.goTo(selected * width);
                return;
            }
            position.set(index);
            if (items[index] && items[index].key !== value) {
                onValueChange(items[index].key);
                setSettlement((current) => current + 1);
            }
        },
    });
    // Scroll stays on the animation thread; React only receives settled destinations.
    const { offset } = controller;
    useAnimatedReaction(
        () => (width > 0 ? offset.get() / width : selected),
        (next) => position.set(Math.max(0, Math.min(items.length - 1, next))),
        [width, selected, items.length, offset, position]
    );
    useLayoutEffect(() => {
        interacting.current = false;
        const resized = previous.current.width !== width || previous.current.rtl !== rtl || previous.current.keys !== keys;
        previous.current = { width, rtl, keys };
        if (width > 0) controller.goTo(selected * width, enabled && !resized);
    }, [width, rtl, keys, value, selected, selectionRequest, settlement, enabled, swipeEnabled, theme.animation.scale, controller.goTo]);
    const pages = rtl ? [...items].reverse() : items;
    return (
        <View
            style={[{ flex: StyleSheet.flatten(style)?.height === undefined ? 1 : undefined, minHeight: 0 }, style]}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
            testID={testID}
        >
            <Animated.ScrollView
                ref={controller.ref}
                horizontal
                scrollEnabled={enabled && swipeEnabled}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={controller.onScroll}
                style={{ flex: 1, direction: 'ltr' }}
                testID={`${testID}-scroll`}
            >
                {width > 0
                    ? pages.map((item) => (
                          <View
                              key={item.key}
                              nativeID={item.panelID}
                              role="tabpanel"
                              aria-labelledby={item.nativeID}
                              aria-label={item.nativeID ? undefined : (item.accessibilityLabel ?? (item.label || item.key))}
                              aria-hidden={item.key !== value}
                              {...{ inert: item.key !== value }}
                              style={{ width, height: '100%', flexGrow: 0, flexShrink: 0, direction: rtl ? 'rtl' : 'ltr' }}
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
