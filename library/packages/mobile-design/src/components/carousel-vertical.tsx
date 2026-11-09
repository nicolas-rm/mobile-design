import { Image } from 'expo-image';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions, type ViewInstance } from 'react-native';
import { useLocale } from 'react-native-paper';
import Animated, { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useMobileTheme } from '../core';
import { Icon, IconButton, Text, TouchableRipple } from '../primitives';
import { getScrollIndicatorProps } from '../scroll-indicators';
import type { CarouselItem, CarouselProps } from './carousel';
import { useCarouselScrollController } from './carousel-scroll-controller';
import { createVerticalCarouselLayout, getVerticalCarouselIndex } from './carousel-vertical-layout';
import { focusOutsideCollection } from './focus-order';
import { usePressScope } from './press-scope';

function VerticalItem({
    item,
    index,
    count,
    width,
    mediaHeight,
    height,
    showText,
    textPlacement,
    disabled,
    active,
    renderItemContent,
    onItemPress,
    onNavigate,
    onKeyboardNavigate,
    onKeyboardExit,
    onCaptionLayout,
    registerFocus,
    testID,
}: {
    item: CarouselItem;
    index: number;
    count: number;
    width: number;
    mediaHeight: number;
    height: number;
    showText: boolean;
    textPlacement: 'overlay' | 'below';
    disabled: boolean;
    active: boolean;
    renderItemContent: CarouselProps['renderItemContent'];
    onItemPress: CarouselProps['onItemPress'];
    onNavigate: (index: number) => void;
    onKeyboardNavigate: (index: number, step: number, boundary?: 'first' | 'last') => void;
    onKeyboardExit: (backwards: boolean) => boolean;
    onCaptionLayout: (id: string, height: number) => void;
    registerFocus: (index: number, node: ViewInstance | null) => void;
    testID: string;
}) {
    const theme = useMobileTheme();
    const [failed, setFailed] = useState(false);
    const [focused, setFocused] = useState(false);
    const blocked = disabled || Boolean(item.disabled);
    const canPress = usePressScope(blocked, item.id);
    const custom = renderItemContent?.({ item, index, width, height: mediaHeight });
    const hasMedia = custom != null || (Boolean(item.image) && !failed);
    const below = showText && textPlacement === 'below';
    const radius = theme.shapes.corner.extraLarge;
    const Container = onItemPress ? TouchableRipple : View;
    useEffect(() => setFailed(false), [item.image]);
    useEffect(() => {
        if (blocked) setFocused(false);
    }, [blocked]);
    const text = (overlay: boolean) => (
        <>
            <Text variant="titleLarge" numberOfLines={2} style={{ color: overlay && hasMedia ? '#FFFFFF' : theme.colors.onSurface }}>
                {item.title}
            </Text>
            {item.description ? (
                <Text
                    variant="bodyMedium"
                    numberOfLines={2}
                    style={{ color: overlay && hasMedia ? '#FFFFFF' : theme.colors.onSurfaceVariant }}
                >
                    {item.description}
                </Text>
            ) : null}
        </>
    );
    return (
        <View style={{ height, width }} testID={`${testID}-item-${item.id}`}>
            <Container
                ref={(node: ViewInstance | null) => registerFocus(index, node)}
                accessible
                accessibilityRole={onItemPress ? 'button' : 'image'}
                accessibilityLabel={`${item.accessibilityLabel ?? `${item.title}${item.description ? `. ${item.description}` : ''}`}. ${index + 1} de ${count}`}
                accessibilityState={{ disabled: blocked }}
                accessibilityActions={
                    blocked
                        ? []
                        : [
                              ...(index > 0 ? [{ name: 'previous', label: 'Elemento anterior' }] : []),
                              ...(index < count - 1 ? [{ name: 'next', label: 'Elemento siguiente' }] : []),
                          ]
                }
                onAccessibilityAction={(event) => {
                    if (!canPress()) return;
                    if (event.nativeEvent.actionName === 'previous') onNavigate(index - 1);
                    if (event.nativeEvent.actionName === 'next') onNavigate(index + 1);
                }}
                disabled={blocked}
                focusable={!blocked && (Platform.OS === 'web' || Boolean(onItemPress))}
                {...(Platform.OS === 'web'
                    ? {
                          tabIndex: !blocked && active ? 0 : -1,
                          onKeyDown: (event: {
                              nativeEvent: { key?: string };
                              preventDefault: () => void;
                              stopPropagation: () => void;
                          }) => {
                              if (blocked) return;
                              const key = event.nativeEvent.key;
                              if (key === 'ArrowLeft' || key === 'ArrowRight') {
                                  if (onKeyboardExit(key === 'ArrowLeft')) {
                                      event.preventDefault();
                                      event.stopPropagation();
                                  }
                                  return;
                              }
                              if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key ?? '')) return;
                              event.preventDefault();
                              event.stopPropagation();
                              onKeyboardNavigate(
                                  index,
                                  key === 'ArrowUp' ? -1 : 1,
                                  key === 'Home' ? 'first' : key === 'End' ? 'last' : undefined
                              );
                          },
                      }
                    : {})}
                onFocus={(event) => {
                    if (!canPress()) return;
                    const target = event.currentTarget as unknown as { matches?: (selector: string) => boolean };
                    if (Platform.OS === 'web' && !target.matches?.(':focus-visible')) return;
                    setFocused(true);
                    onNavigate(index);
                }}
                onBlur={() => setFocused(false)}
                onPress={
                    onItemPress
                        ? () => {
                              if (canPress()) onItemPress(item, index);
                          }
                        : undefined
                }
                style={{
                    height,
                    width,
                    borderRadius: below ? 0 : radius,
                    borderCurve: 'continuous',
                    overflow: 'hidden',
                    opacity: blocked ? 0.38 : 1,
                    outlineColor: theme.colors.secondary,
                    outlineWidth: focused && !blocked ? 3 : 0,
                    outlineStyle: 'solid',
                    outlineOffset: -4,
                }}
                testID={`${testID}-press-${item.id}`}
            >
                <View pointerEvents="none" style={{ height, justifyContent: below ? 'flex-start' : 'center' }}>
                    <View
                        style={{
                            height: mediaHeight,
                            width,
                            overflow: 'hidden',
                            borderRadius: radius,
                            borderCurve: 'continuous',
                            backgroundColor: theme.colors.secondaryContainer,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        testID={`${testID}-media-${item.id}`}
                    >
                        {custom != null ? (
                            <View
                                pointerEvents="none"
                                accessibilityElementsHidden
                                importantForAccessibility="no-hide-descendants"
                                {...(Platform.OS === 'web' ? { 'aria-hidden': true, inert: true } : {})}
                                style={StyleSheet.absoluteFill}
                            >
                                {custom}
                            </View>
                        ) : hasMedia ? (
                            <Image
                                accessible={false}
                                source={item.image}
                                contentFit="cover"
                                recyclingKey={item.id}
                                onError={() => setFailed(true)}
                                style={StyleSheet.absoluteFill}
                            />
                        ) : (
                            <Icon name={item.icon ?? 'image-outline'} size={48} color={theme.colors.onSecondaryContainer} />
                        )}
                        {showText && !below ? (
                            <View
                                style={[
                                    StyleSheet.absoluteFill,
                                    {
                                        justifyContent: 'flex-end',
                                        padding: 16,
                                        gap: 4,
                                        ...(hasMedia
                                            ? { backgroundImage: 'linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.8) 100%)' }
                                            : {}),
                                    },
                                ]}
                            >
                                {text(true)}
                            </View>
                        ) : null}
                        {focused && !blocked ? (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.onSurface, opacity: 0.1 }]} />
                        ) : null}
                    </View>
                    {below ? (
                        <View
                            onLayout={({ nativeEvent }) => onCaptionLayout(item.id, nativeEvent.layout.height)}
                            style={{ paddingTop: 12, paddingBottom: 4, gap: 4 }}
                        >
                            {text(false)}
                        </View>
                    ) : null}
                </View>
            </Container>
        </View>
    );
}

/** Mobile Design extension: a vertical collection with natural, independent image heights. */
export function VerticalCarousel({
    items,
    height = 480,
    contentPadding = 16,
    initialIndex = 0,
    onIndexChange,
    onItemPress,
    renderItemContent,
    showControls = false,
    showText = true,
    textPlacement = 'overlay',
    snapping = false,
    disabled = false,
    scrollIndicators,
    accessibilityLabel = 'Carrusel vertical',
    style,
    testID = 'carousel',
}: CarouselProps) {
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    const { fontScale } = useWindowDimensions();
    const [width, setWidth] = useState(0);
    const requestedInitial = Math.max(0, Number.isFinite(initialIndex) ? Math.trunc(initialIndex) : 0);
    const first = useRef(items.length ? Math.min(items.length - 1, requestedInitial) : requestedInitial);
    const [index, setIndex] = useState(first.current);
    const current = useRef(index);
    const currentId = useRef(items[index]?.id);
    const mounted = useRef(true);
    const collection = useRef<ViewInstance>(null);
    const focusTargets = useRef(new Map<number, ViewInstance>());
    const requested = useRef<{ index: number; revision: number } | undefined>(undefined);
    const pendingRebase = useRef(true);
    const [captions, setCaptions] = useState<{ width: number; fontScale: number; heights: Record<string, number> }>({
        width: 0,
        fontScale,
        heights: {},
    });
    const ids = JSON.stringify(items.map((item) => item.id));
    const ratios = JSON.stringify(items.map((item) => item.aspectRatio ?? 1));
    const mediaLayout = useMemo(
        () => createVerticalCarouselLayout(width, height, JSON.parse(ratios), contentPadding),
        [width, height, ratios, contentPadding]
    );
    const captionEstimate =
        (theme.fonts.titleLarge.lineHeight + (items.some((item) => item.description) ? theme.fonts.bodyMedium.lineHeight : 0)) *
            2 *
            fontScale +
        20;
    const extras = items.map((item, position) => {
        const caption =
            showText && textPlacement === 'below'
                ? captions.width === width && captions.fontScale === fontScale
                    ? (captions.heights[item.id] ?? captionEstimate)
                    : captionEstimate
                : 0;
        // Even a very shallow panorama keeps a non-overlapping 48dp target;
        // the photographic area itself retains the supplied aspect ratio.
        return Math.max(caption, 48 - mediaLayout.mediaHeights[position]);
    });
    const extraKey = JSON.stringify(extras);
    const layout = useMemo(
        () => createVerticalCarouselLayout(width, height, JSON.parse(ratios), contentPadding, 8, JSON.parse(extraKey)),
        [width, height, ratios, contentPadding, extraKey]
    );
    const liveLayout = useRef(layout);
    const snapOffsets = useMemo(() => (snapping ? [...new Set([...layout.offsets, layout.maxOffset])] : undefined), [snapping, layout]);
    const finish = useCallback(() => {
        requested.current = undefined;
        pendingRebase.current = false;
    }, []);
    const interrupt = useCallback(() => {
        requested.current = undefined;
        pendingRebase.current = false;
    }, []);
    const { ref, offset, onScroll, goTo, isCurrentRequest } = useCarouselScrollController<CarouselItem>({
        maxOffset: layout.maxOffset,
        vertical: true,
        interactive: !disabled && layout.maxOffset > 0,
        snapOffsets,
        animationScale: theme.animation.scale,
        onInterrupted: interrupt,
        onSettled: finish,
    });
    const report = useCallback(
        (next: number) => {
            if (
                !mounted.current ||
                liveLayout.current !== layout ||
                pendingRebase.current ||
                layout.maxOffset === 0 ||
                (requested.current && isCurrentRequest(requested.current.revision)) ||
                getVerticalCarouselIndex(offset.get(), layout) !== next ||
                current.current === next
            )
                return;
            current.current = next;
            currentId.current = items[next]?.id;
            setIndex(next);
            onIndexChange?.(next);
        },
        [layout, ids, onIndexChange, isCurrentRequest, offset]
    );
    useAnimatedReaction(
        () => getVerticalCarouselIndex(offset.get(), layout),
        (next, previous) => {
            if (next !== previous) scheduleOnRN(report, next);
        }
    );
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    useLayoutEffect(() => {
        liveLayout.current = layout;
        if (!items.length) {
            requested.current = undefined;
            pendingRebase.current = false;
            return;
        }
        const retained = items.findIndex((item) => item.id === currentId.current);
        const next = retained >= 0 ? retained : Math.max(0, Math.min(items.length - 1, current.current));
        currentId.current = items[next]?.id;
        if (next !== current.current) {
            current.current = next;
            setIndex(next);
            onIndexChange?.(next);
        }
        requested.current = undefined;
        pendingRebase.current = true;
        goTo(layout.offsets[next] ?? 0, false);
    }, [layout, ids]);
    const go = useCallback(
        (next: number) => {
            if (disabled || !items.length) return;
            const bounded = Math.max(0, Math.min(items.length - 1, next));
            const pending = requested.current;
            if (pending?.index === bounded && isCurrentRequest(pending.revision)) return;
            pendingRebase.current = false;
            requested.current = { index: bounded, revision: goTo(layout.offsets[bounded] ?? 0) };
            if (current.current !== bounded) {
                current.current = bounded;
                currentId.current = items[bounded]?.id;
                setIndex(bounded);
                onIndexChange?.(bounded);
            }
        },
        [disabled, items, layout, goTo, isCurrentRequest, onIndexChange]
    );
    const buttonIndex = () =>
        requested.current && isCurrentRequest(requested.current.revision) ? requested.current.index : current.current;
    const registerFocus = useCallback((position: number, node: ViewInstance | null) => {
        if (node) focusTargets.current.set(position, node);
        else focusTargets.current.delete(position);
    }, []);
    const keyboardNavigate = (position: number, step: number, boundary?: 'first' | 'last') => {
        let next = boundary === 'first' ? 0 : boundary === 'last' ? items.length - 1 : position + step;
        const direction = boundary === 'last' ? -1 : boundary === 'first' ? 1 : step;
        while (next >= 0 && next < items.length && items[next].disabled) next += direction;
        if (next < 0 || next >= items.length) return;
        go(next);
        (focusTargets.current.get(next) as unknown as { focus?: (options?: { preventScroll: boolean }) => void })?.focus?.({
            preventScroll: true,
        });
    };
    const captionLayout = (id: string, measuredHeight: number) => {
        if (!Number.isFinite(measuredHeight) || measuredHeight < 0) return;
        setCaptions((previous) => {
            const same = previous.width === width && previous.fontScale === fontScale;
            if (same && Math.abs((previous.heights[id] ?? -1) - measuredHeight) < 0.5) return previous;
            return { width, fontScale, heights: { ...(same ? previous.heights : {}), [id]: measuredHeight } };
        });
    };
    if (!items.length) return null;
    const tabIndex = items[index]?.disabled ? items.findIndex((item) => !item.disabled) : index;
    return (
        <View
            ref={collection}
            onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
            style={[{ backgroundColor: theme.colors.surface }, style]}
            testID={testID}
        >
            <Animated.ScrollView
                ref={ref}
                accessibilityLabel={accessibilityLabel}
                accessible={false}
                focusable={false}
                nestedScrollEnabled
                bounces={false}
                directionalLockEnabled
                decelerationRate={snapping ? 'fast' : 'normal'}
                disableIntervalMomentum={snapping}
                snapToOffsets={snapOffsets}
                scrollEnabled={!disabled && layout.maxOffset > 0}
                removeClippedSubviews={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                onContentSizeChange={() => {
                    if (pendingRebase.current) goTo(layout.offsets[current.current] ?? 0, false);
                }}
                {...getScrollIndicatorProps(scrollIndicators)}
                style={{ height: layout.viewportHeight, flexGrow: 0 }}
                contentContainerStyle={{ padding: layout.padding, gap: layout.gap }}
                testID={`${testID}-scroll`}
            >
                {width > 0
                    ? items.map((item, position) => (
                          <VerticalItem
                              key={item.id}
                              item={item}
                              index={position}
                              count={items.length}
                              width={layout.mediaWidth}
                              mediaHeight={layout.mediaHeights[position]}
                              height={layout.itemHeights[position]}
                              showText={showText}
                              textPlacement={textPlacement}
                              disabled={disabled}
                              active={tabIndex === position}
                              renderItemContent={renderItemContent}
                              onItemPress={onItemPress}
                              onNavigate={go}
                              onKeyboardNavigate={keyboardNavigate}
                              onKeyboardExit={(backwards) => focusOutsideCollection(collection.current, rtl ? !backwards : backwards)}
                              onCaptionLayout={captionLayout}
                              registerFocus={registerFocus}
                              testID={testID}
                          />
                      ))
                    : null}
            </Animated.ScrollView>
            {showControls && items.length > 1 ? (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: layout.padding,
                        paddingTop: 12,
                    }}
                >
                    <Text variant="labelLarge" accessibilityLiveRegion="polite" testID={`${testID}-position`}>
                        {index + 1} / {items.length}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <IconButton
                            icon="arrow-up"
                            accessibilityLabel="Elemento anterior"
                            mode="outlined"
                            disabled={disabled || layout.maxOffset === 0 || index === 0}
                            onPress={() => go(buttonIndex() - 1)}
                            testID={`${testID}-previous`}
                        />
                        <IconButton
                            icon="arrow-down"
                            accessibilityLabel="Elemento siguiente"
                            mode="contained"
                            disabled={disabled || layout.maxOffset === 0 || index === items.length - 1}
                            onPress={() => go(buttonIndex() + 1)}
                            testID={`${testID}-next`}
                        />
                    </View>
                </View>
            ) : null}
        </View>
    );
}
