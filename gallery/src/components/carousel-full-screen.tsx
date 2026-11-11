import type { ScrollIndicatorOptions } from 'mobile-design/react-native';
import { Image } from 'expo-image';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedReaction, useReducedMotion } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { Text } from './Text';
import { TouchableRipple } from './TouchableRipple';
import type { CarouselItem, CarouselProps } from './carousel';
import { useCarouselScrollController } from './carousel-scroll-controller';
import { usePaperTheme } from '@/theme/paper';

function FullScreenItem({
    item,
    index,
    count,
    height,
    onPress,
    onFocus,
    showText,
    disabled,
    textInsetBottom,
}: {
    item: CarouselItem;
    index: number;
    count: number;
    height: number;
    onPress?: () => void;
    onFocus: () => void;
    showText: boolean;
    disabled: boolean;
    textInsetBottom: number;
}) {
    const theme = usePaperTheme();
    const { width } = useWindowDimensions();
    const [failed, setFailed] = useState(false);
    const [focused, setFocused] = useState(false);
    const hasImage = Boolean(item.image) && !failed;
    const Container = onPress ? TouchableRipple : View;
    const inactive = Boolean(disabled || item.disabled);
    const label = item.accessibilityLabel ?? `${item.title}${item.description ? `. ${item.description}` : ''}`;
    useEffect(() => setFailed(false), [item.image]);
    return (
        <Container
            accessible
            accessibilityLabel={`${label}. ${index + 1} de ${count}`}
            accessibilityRole={onPress ? 'button' : 'image'}
            accessibilityState={{ disabled: inactive }}
            disabled={inactive}
            focusable={Boolean(onPress && !inactive)}
            onBlur={() => setFocused(false)}
            onFocus={() => {
                setFocused(true);
                onFocus();
            }}
            onPress={onPress}
            style={{
                height,
                backgroundColor: theme.colors.secondaryContainer,
                opacity: inactive ? 0.38 : 1,
                outlineColor: theme.colors.secondary,
                outlineStyle: 'solid',
                outlineWidth: focused ? 3 : 0,
                outlineOffset: 2,
            }}
        >
            <View pointerEvents="none" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                {hasImage ? (
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
    showControls = true,
    showText = true,
    disabled = false,
    snapping = true,
    textInsetBottom = 0,
    accessibilityLabel = 'Carrusel vertical',
    style,
    testID = 'carousel',
}: CarouselProps) {
    const theme = usePaperTheme();
    const systemReduceMotion = useReducedMotion();
    const firstIndex = useRef(Math.max(0, Math.min(items.length - 1, Number.isFinite(initialIndex) ? Math.trunc(initialIndex) : 0)));
    const [index, setIndex] = useState(firstIndex.current);
    const current = useRef(index);
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
    const { ref, offset, onScroll, goTo, revision } = useCarouselScrollController<CarouselItem>({
        maxOffset,
        vertical: true,
        animationScale: systemReduceMotion ? 0 : theme.animation.scale,
        onInterrupted: clearRequest,
        onSettled: clearRequest,
    });
    const reportIndex = useCallback(
        (next: number) => {
            if (!mounted.current || currentGeometry.current !== geometry) return;
            if (current.current === next) return;
            current.current = next;
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
        if (items.length === 0) return;
        const next = Math.max(0, Math.min(items.length - 1, current.current));
        if (next !== current.current) reportIndex(next);
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
        requested.current?.revision === revision.get()
            ? requested.current.index
            : Math.max(0, Math.min(items.length - 1, Math.round(offset.get() / step)));
    if (!items.length) return null;
    return (
        <View style={style} testID={testID}>
            <Animated.FlatList
                accessibilityLabel={accessibilityLabel}
                accessible={false}
                focusable={false}
                bounces={false}
                data={items}
                decelerationRate={snapping ? 'fast' : 'normal'}
                disableIntervalMomentum={snapping}
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
                        disabled={disabled}
                        textInsetBottom={textInsetBottom}
                        onFocus={() => go(i)}
                        onPress={onItemPress ? () => onItemPress(item, i) : undefined}
                    />
                )}
                scrollEnabled={!disabled && items.length > 1}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={scrollIndicators?.vertical ?? false}
                showsHorizontalScrollIndicator={scrollIndicators?.horizontal ?? false}
                snapToInterval={snapping ? step : undefined}
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
