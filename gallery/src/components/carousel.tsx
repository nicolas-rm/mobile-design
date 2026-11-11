import type { ScrollIndicatorOptions } from 'mobile-design/react-native';
import { Image, type ImageSource } from 'expo-image';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { I18nManager, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useReducedMotion,
    useSharedValue,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon, type IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { TouchableRipple } from '@/components/TouchableRipple';
import { usePaperTheme } from '@/theme/paper';

import { FullScreenCarousel } from './carousel-full-screen';
import {
    createCarouselLayout,
    getCarouselIndex,
    getCarouselItemFrame,
    getCarouselKeylineState,
    type CarouselKeylineState,
    type CarouselLayout,
    type CarouselVariant,
} from './carousel-layout';
import { useCarouselScrollController } from './carousel-scroll-controller';

const isRTL = I18nManager.isRTL;

export type { CarouselVariant } from './carousel-layout';

export type CarouselItem = {
    id: string;
    title: string;
    description?: string;
    image?: ImageSource | number;
    icon?: IconName;
    accessibilityLabel?: string;
    aspectRatio?: number;
    disabled?: boolean;
};

export type CarouselProps = {
    scrollIndicators?: ScrollIndicatorOptions;
    items: readonly CarouselItem[];
    variant?: CarouselVariant;
    height?: number;
    /** Ideal unmasked width. Material fits multi-browse items to an approved arrangement. */
    preferredItemWidth?: number;
    /** Contained horizontal margins, or the uncontained layout's leading margin. */
    contentPadding?: number;
    /** Alignment of the focal keylines. Reduced-motion and uncontained layouts remain uniform. */
    alignment?: 'start' | 'center';
    initialIndex?: number;
    accessibilityLabel?: string;
    onItemPress?: (item: CarouselItem, index: number) => void;
    onIndexChange?: (index: number) => void;
    showControls?: boolean;
    snapping?: boolean;
    showText?: boolean;
    textPlacement?: 'overlay' | 'below';
    /** Extra space for full-screen captions above a system gesture/navigation area. */
    textInsetBottom?: number;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

const CarouselTile = memo(function CarouselTile({
    height,
    index,
    item,
    layout,
    offset,
    keylines,
    onItemPress,
    onNavigate,
    testID,
    showText,
    textPlacement,
    disabled,
    moving,
    captionHeight,
}: {
    height: number;
    index: number;
    item: CarouselItem;
    layout: CarouselLayout;
    offset: SharedValue<number>;
    keylines: SharedValue<CarouselKeylineState>;
    onItemPress?: (item: CarouselItem, index: number) => void;
    onNavigate: (index: number) => void;
    testID: string;
    showText: boolean;
    textPlacement: 'overlay' | 'below';
    disabled: boolean;
    moving: boolean;
    captionHeight: number;
}) {
    const theme = usePaperTheme();
    const [imageFailed, setImageFailed] = useState(false);
    const [focused, setFocused] = useState(false);
    const pressed = useSharedValue(0);
    const hasImage = Boolean(item.image) && !imageFailed;
    const baseWidth = layout.uniform ? layout.itemWidths[index] : layout.itemWidth;
    const imageWidth = baseWidth;
    const imageHeight = textPlacement === 'below' && showText ? Math.max(40, height - captionHeight) : height;
    const label = `${item.accessibilityLabel ?? `${item.title}${item.description ? `. ${item.description}` : ''}`}. ${index + 1} de ${layout.itemCount}`;
    const TileContainer = onItemPress ? TouchableRipple : View;
    const onPress = useCallback(() => {
        if (!disabled && !item.disabled) onItemPress?.(item, index);
    }, [disabled, onItemPress, item, index]);
    const setPressed = (value: number) => {
        const spring = theme.motion.spring.fast.spatial;
        pressed.set(
            moving
                ? withSpring(value, {
                      stiffness: spring.stiffness,
                      damping: spring.damping * 2 * Math.sqrt(spring.stiffness),
                      mass: 1,
                      overshootClamping: true,
                  })
                : value
        );
    };
    const shapeStyle = useAnimatedStyle(() => ({
        // The guidance requests a slight shape response but defines no pressed-radius token.
        // Use the adjacent existing Paper shape, rather than inventing a new component token.
        borderRadius:
            theme.shapes.corner.extraLarge + (theme.shapes.corner.extraLargeIncreased - theme.shapes.corner.extraLarge) * pressed.get(),
    }));

    useEffect(() => setImageFailed(false), [item.image]);

    const frame = useDerivedValue(() => getCarouselItemFrame(index, offset.get(), layout, keylines.get()));
    const clipStyle = useAnimatedStyle(() => {
        const bounds = frame.get();

        return {
            // Only this absolute clip changes width; its content never reflows.
            width: bounds.width,
            transform: [{ translateX: (isRTL ? -1 : 1) * (bounds.x + offset.get()) }],
        };
    });
    const imageStyle = useAnimatedStyle(() => {
        return { transform: [{ translateX: (frame.get().width - imageWidth) / 2 }] };
    });
    const labelStyle = useAnimatedStyle(() => {
        // Material's mask listener pins the label to the mask edge and fades over 80dp of inset.
        return { opacity: Math.max(0, Math.min(1, 1 - (baseWidth - frame.get().width) / 160)) };
    });

    return (
        <Animated.View
            style={[
                styles.clip,
                {
                    backgroundColor: textPlacement === 'below' ? 'transparent' : theme.colors.secondaryContainer,
                    borderRadius: textPlacement === 'below' ? 0 : theme.shapes.corner.extraLarge,
                    opacity: disabled || item.disabled ? 0.38 : 1,
                    outlineColor: theme.colors.secondary,
                    outlineOffset: 2,
                    outlineStyle: 'solid',
                    outlineWidth: focused ? 3 : 0,
                    height,
                    [isRTL ? 'right' : 'left']: 0,
                },
                clipStyle,
                textPlacement !== 'below' && shapeStyle,
            ]}
            testID={`${testID}-item-${item.id}`}
        >
            <TileContainer
                accessible
                accessibilityLabel={label}
                accessibilityRole={onItemPress ? 'button' : 'image'}
                accessibilityState={{ disabled: disabled || item.disabled }}
                disabled={disabled || item.disabled}
                focusable={Boolean(onItemPress && !disabled && !item.disabled)}
                onBlur={() => {
                    setFocused(false);
                    setPressed(0);
                }}
                onFocus={() => {
                    setFocused(true);
                    onNavigate(index);
                }}
                onPress={onItemPress ? onPress : undefined}
                onPressIn={onItemPress ? () => setPressed(1) : undefined}
                onPressOut={onItemPress ? () => setPressed(0) : undefined}
                style={styles.touchable}
                testID={`${testID}-press-${item.id}`}
            >
                <View pointerEvents="none" style={styles.touchable}>
                    <Animated.View
                        style={[
                            styles.image,
                            {
                                height: imageHeight,
                                width: imageWidth,
                                backgroundColor: theme.colors.secondaryContainer,
                                ...(textPlacement === 'below'
                                    ? { borderRadius: theme.shapes.corner.extraLarge, overflow: 'hidden' as const }
                                    : {}),
                            },
                            imageStyle,
                            textPlacement === 'below' && shapeStyle,
                        ]}
                    >
                        {hasImage ? (
                            <Image
                                accessible={false}
                                contentFit="cover"
                                onError={() => setImageFailed(true)}
                                recyclingKey={item.id}
                                source={item.image}
                                style={StyleSheet.absoluteFill}
                            />
                        ) : (
                            <View style={[styles.fallback, { paddingBottom: showText && textPlacement === 'overlay' ? 48 : 0 }]}>
                                <Icon color={theme.colors.onSecondaryContainer} name={item.icon ?? 'image-outline'} size={56} />
                            </View>
                        )}
                    </Animated.View>
                    {showText && hasImage && textPlacement === 'overlay' ? <View style={[StyleSheet.absoluteFill, styles.scrim]} /> : null}
                    {showText ? (
                        <Animated.View
                            style={[
                                styles.label,
                                {
                                    width: Math.max(0, baseWidth - (textPlacement === 'below' ? 0 : 32)),
                                    ...(textPlacement === 'below' ? { top: imageHeight + 12, left: 0 } : {}),
                                },
                                labelStyle,
                            ]}
                        >
                            <Text
                                numberOfLines={item.image && layout.width < 600 ? 1 : 2}
                                style={{
                                    color:
                                        hasImage && textPlacement === 'overlay'
                                            ? '#FFFFFF'
                                            : textPlacement === 'below'
                                              ? theme.colors.onSurface
                                              : theme.colors.onSecondaryContainer,
                                }}
                                variant="titleLarge"
                            >
                                {item.title}
                            </Text>
                            {item.description ? (
                                <Text
                                    numberOfLines={item.image && layout.width < 600 ? 1 : 2}
                                    style={{
                                        color:
                                            hasImage && textPlacement === 'overlay'
                                                ? '#FFFFFF'
                                                : textPlacement === 'below'
                                                  ? theme.colors.onSurfaceVariant
                                                  : theme.colors.onSecondaryContainer,
                                    }}
                                    variant="bodyMedium"
                                >
                                    {item.description}
                                </Text>
                            ) : null}
                        </Animated.View>
                    ) : null}
                </View>
            </TileContainer>
        </Animated.View>
    );
});

/** Material 3 image carousel for short collections, styled by the current PaperProvider. */
function HorizontalCarousel({
    scrollIndicators,
    items,
    variant = 'multi-browse',
    height = 240,
    preferredItemWidth = height,
    contentPadding = 0,
    alignment = 'start',
    accessibilityLabel = 'Carrusel',
    onItemPress,
    onIndexChange,
    showControls = true,
    snapping,
    showText = true,
    textPlacement = 'overlay',
    disabled = false,
    initialIndex = 0,
    style,
    testID = 'carousel',
}: CarouselProps) {
    const theme = usePaperTheme();
    const { fontScale } = useWindowDimensions();
    const systemReduceMotion = useReducedMotion();
    const [width, setWidth] = useState(0);
    const [activeIndex, setActiveIndex] = useState(() =>
        Math.max(0, Math.min(items.length - 1, Number.isFinite(initialIndex) ? Math.trunc(initialIndex) : 0))
    );
    const activeIndexRef = useRef(activeIndex);
    const requestedIndex = useRef<{ index: number; revision: number } | undefined>(undefined);
    const pendingRebase = useRef(true);
    const [edges, setEdges] = useState({ start: true, end: false });
    const animated = !systemReduceMotion && theme.animation.scale !== 0;
    const ratios = JSON.stringify(items.map((item) => item.aspectRatio ?? 1));
    const isUncontained = variant.startsWith('uncontained');
    const margin = animated && !isUncontained ? Math.max(0, contentPadding) : 0;
    const viewportWidth = Math.max(1, width - margin * 2);
    const below = textPlacement === 'below' && showText;
    const captionHeight = below
        ? Math.max(
              96,
              ...items.map((item) => {
                  const lineHeight = theme.fonts.titleLarge.lineHeight + (item.description ? theme.fonts.bodyMedium.lineHeight : 0);
                  return Math.ceil(lineHeight * (item.image && viewportWidth < 600 ? 1 : 2) * fontScale) + 32;
              })
          )
        : 0;
    const renderHeight = below ? Math.max(height, captionHeight + 40) : height;
    const imageHeight = below ? renderHeight - captionHeight : height;
    const layout = useMemo(
        () =>
            createCarouselLayout(
                viewportWidth,
                items.length,
                variant,
                imageHeight,
                JSON.parse(ratios),
                !animated,
                preferredItemWidth,
                contentPadding,
                8,
                alignment
            ),
        [viewportWidth, items.length, variant, imageHeight, ratios, animated, preferredItemWidth, contentPadding, alignment]
    );
    const currentLayout = useRef(layout);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    const clearRequest = useCallback(() => {
        requestedIndex.current = undefined;
    }, []);
    const {
        ref: scrollRef,
        offset,
        onScroll,
        goTo,
        revision,
    } = useCarouselScrollController<CarouselItem>({
        maxOffset: layout.maxOffset,
        rtl: isRTL,
        animationScale: animated ? theme.animation.scale : 0,
        onInterrupted: clearRequest,
        onSettled: clearRequest,
    });
    // One state interpolation per frame for the entire carousel, shared by every item and style.
    const keylines = useDerivedValue(() => getCarouselKeylineState(offset.get(), layout));
    const snap = snapping ?? !variant.startsWith('uncontained');
    const itemIds = JSON.stringify(items.map((item) => item.id));

    useLayoutEffect(() => {
        currentLayout.current = layout;
        if (width <= 0 || items.length === 0) return;
        // Keep the same item when rotating or changing its mask, instead of jumping back to item 1.
        const index = Math.min(activeIndexRef.current, Math.max(0, items.length - 1));
        const position = layout.offsets[index] ?? 0;
        const changed = index !== activeIndexRef.current;
        activeIndexRef.current = index;
        setActiveIndex(index);
        clearRequest();
        pendingRebase.current = true;
        offset.set(position);
        goTo(position, false);
        if (changed) onIndexChange?.(index);
    }, [layout, itemIds]);

    const reportPosition = useCallback(
        (nextIndex: number, start: boolean, end: boolean) => {
            if (!mounted.current || currentLayout.current !== layout) return;
            setEdges((previous) => (previous.start === start && previous.end === end ? previous : { start, end }));
            if (nextIndex !== activeIndexRef.current) {
                activeIndexRef.current = nextIndex;
                setActiveIndex(nextIndex);
                onIndexChange?.(nextIndex);
            }
        },
        [layout, onIndexChange]
    );
    useAnimatedReaction(
        () =>
            width > 0
                ? { index: getCarouselIndex(offset.get(), layout), start: offset.get() <= 0.5, end: offset.get() >= layout.maxOffset - 0.5 }
                : null,
        (position, previous) => {
            if (
                position &&
                (!previous || position.index !== previous.index || position.start !== previous.start || position.end !== previous.end)
            ) {
                scheduleOnRN(reportPosition, position.index, position.start, position.end);
            }
        }
    );
    const scrollToIndex = useCallback(
        (index: number) => {
            const nextIndex = Math.max(0, Math.min(items.length - 1, index));
            const nextOffset = Math.min(layout.offsets[nextIndex] ?? 0, layout.maxOffset);

            requestedIndex.current = { index: nextIndex, revision: goTo(nextOffset) };
        },
        [goTo, items.length, layout]
    );
    const buttonIndex = () =>
        requestedIndex.current?.revision === revision.get() ? requestedIndex.current.index : getCarouselIndex(offset.get(), layout);

    if (items.length === 0) return null;

    return (
        <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={style} testID={testID}>
            {width > 0 ? (
                <Animated.ScrollView
                    accessibilityLabel={accessibilityLabel}
                    accessible={false}
                    focusable={false}
                    bounces={false}
                    contentContainerStyle={{ height: renderHeight, width: viewportWidth + layout.maxOffset }}
                    decelerationRate={snap ? 'fast' : 'normal'}
                    directionalLockEnabled
                    disableIntervalMomentum={snap}
                    horizontal
                    onScroll={onScroll}
                    onContentSizeChange={() => {
                        if (pendingRebase.current) {
                            pendingRebase.current = false;
                            goTo(layout.offsets[activeIndexRef.current] ?? 0, false);
                        }
                    }}
                    overScrollMode="never"
                    ref={scrollRef}
                    removeClippedSubviews={false}
                    scrollEnabled={!disabled && items.length > 1 && layout.maxOffset > 0}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={scrollIndicators?.vertical ?? false}
                    showsHorizontalScrollIndicator={scrollIndicators?.horizontal ?? false}
                    snapToOffsets={
                        snap
                            ? [
                                  ...new Set(
                                      layout.offsets.map((value) =>
                                          isRTL ? layout.maxOffset - Math.min(value, layout.maxOffset) : Math.min(value, layout.maxOffset)
                                      )
                                  ),
                              ].sort((a, b) => a - b)
                            : undefined
                    }
                    style={{ height: renderHeight, flexGrow: 0, marginHorizontal: margin, direction: 'ltr' }}
                    testID={`${testID}-scroll`}
                >
                    {items.map((item, index) => (
                        <CarouselTile
                            disabled={disabled}
                            showText={showText}
                            textPlacement={textPlacement}
                            height={renderHeight}
                            captionHeight={captionHeight}
                            index={index}
                            item={item}
                            key={item.id}
                            layout={layout}
                            offset={offset}
                            keylines={keylines}
                            onItemPress={onItemPress}
                            onNavigate={scrollToIndex}
                            moving={animated}
                            testID={testID}
                        />
                    ))}
                </Animated.ScrollView>
            ) : (
                <View style={{ height: renderHeight }} />
            )}
            {showControls && items.length > 1 ? (
                <View style={[styles.controls, { paddingHorizontal: contentPadding }]}>
                    <Text
                        accessibilityLiveRegion="polite"
                        style={{ color: theme.colors.onSurfaceVariant, fontVariant: ['tabular-nums'] }}
                        testID={`${testID}-position`}
                        variant="labelLarge"
                    >
                        {activeIndex + 1} / {items.length}
                    </Text>
                    <View style={styles.buttons}>
                        <IconButton
                            accessibilityLabel="Elemento anterior"
                            disabled={disabled || layout.maxOffset === 0 || edges.start}
                            icon={isRTL ? 'arrow-right' : 'arrow-left'}
                            mode="outlined"
                            onPress={() => scrollToIndex(buttonIndex() - 1)}
                            style={styles.controlButton}
                            testID={`${testID}-previous`}
                        />
                        <IconButton
                            accessibilityLabel="Elemento siguiente"
                            disabled={disabled || layout.maxOffset === 0 || edges.end}
                            icon={isRTL ? 'arrow-left' : 'arrow-right'}
                            mode="contained"
                            onPress={() => scrollToIndex(buttonIndex() + 1)}
                            style={styles.controlButton}
                            testID={`${testID}-next`}
                        />
                    </View>
                </View>
            ) : null}
        </View>
    );
}

export function Carousel(props: CarouselProps) {
    return props.variant === 'full-screen' ? <FullScreenCarousel {...props} /> : <HorizontalCarousel {...props} />;
}

const styles = StyleSheet.create({
    buttons: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    clip: { borderCurve: 'continuous', overflow: 'hidden', position: 'absolute', top: 0 },
    controlButton: { height: 48, margin: 0, width: 48 },
    controls: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
    fallback: { alignItems: 'center', flex: 1, justifyContent: 'center' },
    image: { left: 0, position: 'absolute', top: 0 },
    label: { bottom: 16, gap: 4, left: 16, position: 'absolute' },
    scrim: { backgroundImage: 'linear-gradient(180deg, transparent 25%, rgba(0, 0, 0, 0.8) 100%)' },
    touchable: { flex: 1 },
});
