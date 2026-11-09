import { getScrollIndicatorProps, type ScrollIndicatorOptions } from '../scroll-indicators';
import { Image } from 'expo-image';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions, type ViewInstance } from 'react-native';
import Animated, { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from '../primitives';
import { IconButton } from '../primitives';
import { Text } from '../primitives';
import { TouchableRipple } from '../primitives';
import type { CarouselItem, CarouselProps } from './carousel';
import { useCarouselScrollController } from './carousel-scroll-controller';
import { useMobileTheme } from '../core';
import { usePressScope } from './press-scope';

function FullScreenItem({
    item,
    index,
    count,
    height,
    onPress,
    renderItemContent,
    onFocus,
    onNavigate,
    showText,
    disabled,
    tabStop,
    textInsetBottom,
    registerFocus,
    keyboardNavigate,
}: {
    item: CarouselItem;
    index: number;
    count: number;
    height: number;
    onPress?: () => void;
    renderItemContent?: CarouselProps['renderItemContent'];
    onFocus: () => void;
    onNavigate: (index: number) => void;
    showText: boolean;
    disabled: boolean;
    tabStop: boolean;
    textInsetBottom: number;
    registerFocus: (index: number, node: ViewInstance | null) => void;
    keyboardNavigate: (index: number, step: number) => void;
}) {
    const theme = useMobileTheme();
    const { width } = useWindowDimensions();
    const [failed, setFailed] = useState(false);
    const [focused, setFocused] = useState(false);
    const customContent = renderItemContent?.({ item, index, width, height });
    const customMedia = customContent != null;
    const hasImage = customMedia || (Boolean(item.image) && !failed);
    const Container = onPress ? TouchableRipple : View;
    const inactive = Boolean(disabled || item.disabled);
    const canPress = usePressScope(inactive, item.id);
    const label = item.accessibilityLabel ?? `${item.title}${item.description ? `. ${item.description}` : ''}`;
    useEffect(() => setFailed(false), [item.image]);
    useEffect(() => {
        if (inactive) setFocused(false);
    }, [inactive]);
    return (
        <Container
            ref={(node: ViewInstance | null) => registerFocus(index, node)}
            {...(Platform.OS === 'web'
                ? {
                      tabIndex: !inactive && (onPress || tabStop) ? (0 as const) : (-1 as const),
                      onKeyDown: (event: { nativeEvent: { key?: string }; preventDefault: () => void; stopPropagation: () => void }) => {
                          const key = event.nativeEvent.key;
                          if (!canPress() || (key !== 'ArrowUp' && key !== 'ArrowDown')) return;
                          event.preventDefault();
                          event.stopPropagation();
                          keyboardNavigate(index, key === 'ArrowDown' ? 1 : -1);
                      },
                  }
                : {})}
            accessible
            accessibilityLabel={`${label}. ${index + 1} de ${count}`}
            accessibilityRole={onPress ? 'button' : 'image'}
            accessibilityState={{ disabled: inactive }}
            accessibilityActions={
                inactive
                    ? []
                    : [
                          ...(index > 0 ? [{ name: 'previous', label: 'Elemento anterior' }] : []),
                          ...(index < count - 1 ? [{ name: 'next', label: 'Elemento siguiente' }] : []),
                      ]
            }
            onAccessibilityAction={(event) => {
                if (!canPress()) return;
                if (event.nativeEvent.actionName === 'next') onNavigate(Math.min(count - 1, index + 1));
                if (event.nativeEvent.actionName === 'previous') onNavigate(Math.max(0, index - 1));
            }}
            disabled={inactive}
            focusable={Boolean(onPress && !inactive)}
            onBlur={() => setFocused(false)}
            onFocus={(event) => {
                const target = event.currentTarget as unknown as HTMLElement;
                if (!canPress() || (Platform.OS === 'web' && !target.matches(':focus-visible'))) return;
                setFocused(true);
                onFocus();
            }}
            onPress={
                onPress
                    ? () => {
                          if (canPress()) onPress();
                      }
                    : undefined
            }
            style={{
                height,
                backgroundColor: theme.colors.secondaryContainer,
                opacity: inactive ? 0.38 : 1,
                outlineColor: theme.colors.secondary,
                outlineStyle: 'solid',
                outlineWidth: focused && !inactive ? 3 : 0,
                outlineOffset: -4,
            }}
        >
            <View pointerEvents="none" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                {customMedia ? (
                    <View
                        pointerEvents="none"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        {...(Platform.OS === 'web' ? { 'aria-hidden': true, inert: true } : {})}
                        style={StyleSheet.absoluteFill}
                    >
                        {customContent}
                    </View>
                ) : hasImage ? (
                    <Image
                        accessible={false}
                        contentFit="cover"
                        onError={() => setFailed(true)}
                        recyclingKey={item.id}
                        source={item.image}
                        style={StyleSheet.absoluteFill}
                    />
                ) : (
                    <Icon color={theme.colors.onSecondaryContainer} name={item.icon ?? 'image-outline'} size={72} />
                )}
                {showText && hasImage ? (
                    <View
                        style={[
                            StyleSheet.absoluteFill,
                            { backgroundImage: 'linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.8) 100%)' },
                        ]}
                    />
                ) : null}
                {focused && !inactive ? (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.onSurface, opacity: 0.1 }]} />
                ) : null}
                {showText ? (
                    <View style={{ position: 'absolute', bottom: 32 + Math.max(0, textInsetBottom), left: 24, right: 24, gap: 8 }}>
                        <Text
                            numberOfLines={width < 600 ? 1 : 2}
                            variant="headlineLarge"
                            style={{ color: hasImage ? '#FFFFFF' : theme.colors.onSecondaryContainer }}
                        >
                            {item.title}
                        </Text>
                        {item.description ? (
                            <Text
                                numberOfLines={width < 600 ? 1 : 2}
                                variant="bodyLarge"
                                style={{ color: hasImage ? '#FFFFFF' : theme.colors.onSecondaryContainer }}
                            >
                                {item.description}
                            </Text>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </Container>
    );
}

/** A vertical, paged feed. Use an available portrait compact/medium viewport and zero outer padding. */
export function FullScreenCarousel({
    scrollIndicators,
    items,
    height = 640,
    initialIndex = 0,
    onIndexChange,
    onItemPress,
    renderItemContent,
    showControls = false,
    showText = true,
    disabled = false,
    textInsetBottom = 0,
    accessibilityLabel = 'Carrusel vertical',
    style,
    testID = 'carousel',
}: CarouselProps) {
    const theme = useMobileTheme();
    const firstIndex = useRef(Math.max(0, Math.min(items.length - 1, Number.isFinite(initialIndex) ? Math.trunc(initialIndex) : 0)));
    const [index, setIndex] = useState(firstIndex.current);
    const current = useRef(index);
    const currentId = useRef(items[index]?.id);
    const focusTargets = useRef(new Map<number, ViewInstance>()),
        pendingFocus = useRef<number | undefined>(undefined);
    const registerFocus = useCallback((index: number, node: ViewInstance | null) => {
        if (node) {
            focusTargets.current.set(index, node);
            if (pendingFocus.current === index) {
                pendingFocus.current = undefined;
                (node as unknown as HTMLElement).focus({ preventScroll: true });
            }
        } else focusTargets.current.delete(index);
    }, []);
    const requested = useRef<{ index: number; revision: number } | undefined>(undefined);
    const pendingRebase = useRef(true);
    const itemHeight = Math.max(1, Number.isFinite(height) ? height : 640);
    const step = itemHeight + 16;
    const maxOffset = Math.max(0, (items.length - 1) * step);
    const ids = JSON.stringify(items.map((item) => item.id));
    const geometry = useMemo(() => ({}), [ids, itemHeight]);
    const currentGeometry = useRef(geometry);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    const clearRequest = useCallback(() => {
        requested.current = undefined;
    }, []);
    const { ref, offset, onScroll, goTo, isCurrentRequest } = useCarouselScrollController<CarouselItem>({
        maxOffset,
        snapOffsets: items.map((_, index) => index * step),
        vertical: true,
        interactive: !disabled && items.length > 1,
        animationScale: theme.animation.scale,
        onInterrupted: clearRequest,
        onSettled: clearRequest,
    });
    const reportIndex = useCallback(
        (next: number) => {
            if (!mounted.current || currentGeometry.current !== geometry) return;
            if (current.current === next) return;
            current.current = next;
            currentId.current = items[next]?.id;
            setIndex(next);
            onIndexChange?.(next);
        },
        [geometry, onIndexChange]
    );
    useAnimatedReaction(
        () => Math.max(0, Math.min(items.length - 1, Math.round(offset.get() / step))),
        (next, previous) => {
            if (next !== previous) scheduleOnRN(reportIndex, next);
        }
    );
    useLayoutEffect(() => {
        currentGeometry.current = geometry;
        pendingFocus.current = undefined;
        if (items.length === 0) return;
        const retained = items.findIndex((item) => item.id === currentId.current);
        const next = retained >= 0 ? retained : Math.max(0, Math.min(items.length - 1, current.current));
        if (next !== current.current) reportIndex(next);
        currentId.current = items[next]?.id;
        clearRequest();
        pendingRebase.current = true;
        offset.set(next * step);
        goTo(next * step, false);
    }, [ids, itemHeight]);
    const go = useCallback(
        (next: number) => {
            const bounded = Math.max(0, Math.min(items.length - 1, next));
            requested.current = { index: bounded, revision: goTo(bounded * step) };
        },
        [goTo, items.length, step]
    );
    const buttonIndex = () =>
        requested.current && isCurrentRequest(requested.current.revision)
            ? requested.current.index
            : Math.max(0, Math.min(items.length - 1, Math.round(offset.get() / step)));
    const keyboardNavigate = (index: number, step: number) => {
        if (disabled) return;
        let next = index + step;
        while (next >= 0 && next < items.length && items[next].disabled) next += step;
        if (next < 0 || next >= items.length) return;
        go(next);
        const target = focusTargets.current.get(next);
        if (target) (target as unknown as HTMLElement).focus({ preventScroll: true });
        else pendingFocus.current = next;
    };
    if (!items.length) return null;
    const tabIndex = items[index]?.disabled ? items.findIndex((item) => !item.disabled) : index;
    return (
        <View style={style} testID={testID}>
            <Animated.FlatList
                accessibilityLabel={accessibilityLabel}
                accessible={false}
                focusable={false}
                bounces={false}
                data={items}
                decelerationRate="fast"
                disableIntervalMomentum
                getItemLayout={(_, i) => ({ length: itemHeight, offset: i * step, index: i })}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                keyExtractor={(item) => item.id}
                initialScrollIndex={firstIndex.current}
                onScroll={onScroll}
                onContentSizeChange={() => {
                    if (pendingRebase.current) {
                        pendingRebase.current = false;
                        goTo(current.current * step, false);
                    }
                }}
                ref={ref}
                renderItem={({ item, index: i }) => (
                    <FullScreenItem
                        item={item}
                        index={i}
                        count={items.length}
                        height={itemHeight}
                        showText={showText}
                        renderItemContent={renderItemContent}
                        disabled={disabled}
                        tabStop={i === tabIndex}
                        textInsetBottom={textInsetBottom}
                        onFocus={() => {
                            if (buttonIndex() !== i) go(i);
                        }}
                        onNavigate={go}
                        registerFocus={registerFocus}
                        keyboardNavigate={keyboardNavigate}
                        onPress={onItemPress ? () => onItemPress(item, i) : undefined}
                    />
                )}
                scrollEnabled={!disabled && items.length > 1}
                scrollEventThrottle={16}
                {...getScrollIndicatorProps(scrollIndicators)}
                snapToInterval={step}
                overScrollMode="never"
                windowSize={3}
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                removeClippedSubviews={false}
                style={{ height: itemHeight, flexGrow: 0 }}
                testID={`${testID}-scroll`}
            />
            {showControls && items.length > 1 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8 }}>
                    <Text accessibilityLiveRegion="polite" testID={`${testID}-position`}>
                        {index + 1} / {items.length}
                    </Text>
                    <View style={{ flexDirection: 'row' }}>
                        <IconButton
                            accessibilityLabel="Elemento anterior"
                            icon="arrow-up"
                            disabled={disabled || index === 0}
                            onPress={() => go(buttonIndex() - 1)}
                            style={{ height: 48, width: 48, margin: 0 }}
                            testID={`${testID}-previous`}
                        />
                        <IconButton
                            accessibilityLabel="Elemento siguiente"
                            icon="arrow-down"
                            disabled={disabled || index === items.length - 1}
                            onPress={() => go(buttonIndex() + 1)}
                            style={{ height: 48, width: 48, margin: 0 }}
                            testID={`${testID}-next`}
                        />
                    </View>
                </View>
            ) : null}
        </View>
    );
}
