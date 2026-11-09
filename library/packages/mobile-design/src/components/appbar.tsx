import { topAppBarTokens } from '@mobile-design/tokens';
// SPDX-License-Identifier: Apache-2.0
// Measurement and motion adapted from AndroidX AppBar.kt, Copyright 2021 The Android Open Source Project.
// https://github.com/androidx/androidx/blob/d153d87ed76372ece0c99dac837ff07ab845d495/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/AppBar.kt
// See ../../LICENSE-Apache-2.0.txt and ../../NOTICE.
import { useEffect, useLayoutEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Platform, View, useWindowDimensions, type ColorValue, type StyleProp, type TextLayoutEvent, type ViewStyle } from 'react-native';
import { Icon, Text, TouchableRipple, useLocale, useTheme, type Theme } from 'react-native-paper';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    cancelAnimation,
    interpolateColor,
    ReduceMotion,
    useAnimatedProps,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnUI } from 'react-native-worklets';
import { IconButton } from './icon-button';
import {
    appBarCompactTitleAlpha,
    appBarContainerFraction,
    appBarExpandedRow,
    appBarFinite,
    appBarFraction,
    appBarSearchWidth,
    appBarTitleFrame,
} from './appbar-layout';
import type { AppBarScrollBehavior } from './appbar-scroll-behavior';

export { useAppBarScrollBehavior, type AppBarScrollBehavior, type AppBarScrollMode } from './appbar-scroll-behavior';

export type TopAppBarVariant = 'small' | 'medium-flexible' | 'large-flexible';
export type TopAppBarAction = {
    key: string;
    icon: ComponentProps<typeof Icon>['source'];
    label: string;
    onPress: NonNullable<ComponentProps<typeof TouchableRipple>['onPress']>;
    disabled?: boolean;
    mode?: 'contained' | 'contained-tonal' | 'outlined';
    widthVariant?: 'narrow' | 'default' | 'wide';
    testID?: string;
};
export type TopAppBarProps = {
    title: ReactNode;
    /** Tall bars' compact row. Explicit null hides its title and subtitle. */
    collapsedTitle?: ReactNode;
    subtitle?: string;
    textAlign?: 'start' | 'center';
    /** Flexible bars place a logo/image above the headline. */
    image?: ReactNode;
    /** Pass the controlled SearchView entry point for a search app bar. */
    search?: ReactNode;
    variant?: TopAppBarVariant;
    navigationIcon?: ComponentProps<typeof Icon>['source'];
    navigationLabel?: string;
    navigationMode?: TopAppBarAction['mode'];
    navigationWidthVariant?: 'narrow' | 'default' | 'wide';
    onNavigationPress?: () => void;
    /** Optional product logo/avatar; replaces the navigation icon slot. */
    leading?: ReactNode;
    /** Optional trailing element, for example a 32dp avatar in a 48dp target. */
    trailing?: ReactNode;
    actions?: readonly TopAppBarAction[];
    scrollBehavior?: AppBarScrollBehavior;
    /** 0 expanded, 1 collapsed; connect to the actual scroll offset on the UI thread. */
    collapseProgress?: SharedValue<number>;
    scrolled?: boolean;
    statusBarHeight?: number;
    containerColor?: ColorValue;
    /** Continuous UI-thread color, for example a scroll-linked artwork gradient. */
    containerColorSource?: Readonly<Pick<SharedValue<ColorValue>, 'get'>>;
    scrolledContainerColor?: ColorValue;
    /** Search field roles; the child trigger should use a transparent container. */
    searchContainerColor?: ColorValue;
    scrolledSearchContainerColor?: ColorValue;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

type Measurement = { width: number; height: number };
type TextMetrics = { height: number; baseline: number };

/** Current MD3 layouts; centered text is a configuration of each variant. */
export function TopAppBar({
    title,
    collapsedTitle = title,
    subtitle,
    textAlign = 'start',
    image,
    search,
    variant = 'small',
    navigationIcon,
    navigationLabel = 'Volver',
    navigationMode,
    navigationWidthVariant,
    onNavigationPress,
    leading,
    trailing,
    actions = [],
    scrollBehavior,
    collapseProgress,
    scrolled = false,
    statusBarHeight,
    containerColor,
    containerColorSource,
    scrolledContainerColor,
    searchContainerColor,
    scrolledSearchContainerColor,
    style,
    testID = 'mobile-top-appbar',
}: TopAppBarProps) {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const rtl = useLocale().direction === 'rtl';
    const { fontScale } = useWindowDimensions();
    const top = Math.max(0, appBarFinite(statusBarHeight ?? insets.top));
    const actualVariant = search ? 'small' : variant;
    const tokens = topAppBarTokens[actualVariant];
    const tall = actualVariant !== 'small';
    const centered = textAlign === 'center';
    const hasLeading = leading != null || Boolean(navigationIcon);
    const [headerWidth, setHeaderWidth] = useState(0);
    const [leadingWidth, setLeadingWidth] = useState(0);
    const [trailingWidth, setTrailingWidth] = useState(0);
    const [compactSize, setCompactSize] = useState<Measurement>({ width: 0, height: 0 });
    const [expandedSize, setExpandedSize] = useState<Measurement>({ width: 0, height: 0 });
    const [titleMetrics, setTitleMetrics] = useState<TextMetrics>({ height: 0, baseline: 0 });
    const [subtitleMetrics, setSubtitleMetrics] = useState<TextMetrics>({ height: 0, baseline: 0 });
    const [searchHeight, setSearchHeight] = useState(56);
    const compactHasContent = !(tall && collapsedTitle === null);
    const compactFallback =
        !tall && image
            ? 48
            : (theme.fonts.titleLarge.lineHeight ?? 28) * fontScale +
              (subtitle ? (theme.fonts.labelMedium.lineHeight ?? 16) * fontScale : 0);
    const compactHeight = Math.max(64, search ? searchHeight + 8 : compactHasContent ? compactSize.height || compactFallback : 0);
    const baseHeight = 'subtitleHeight' in tokens && subtitle ? tokens.subtitleHeight : tokens.height;
    const expandedContentHeight =
        expandedSize.height ||
        (theme.fonts[tokens.title].lineHeight ?? 36) * fontScale +
            (subtitle ? (theme.fonts[tokens.subtitle].lineHeight ?? 20) * fontScale : 0);
    const lastText = subtitle ? subtitleMetrics : titleMetrics;
    const lastBaseline = lastText.height > 0 ? expandedContentHeight - lastText.height + lastText.baseline : expandedContentHeight - 12;
    const expandedRow = appBarExpandedRow(
        baseHeight - 64,
        expandedContentHeight,
        lastBaseline,
        actualVariant === 'large-flexible' ? 28 : 24
    );
    const expandedHeight = tall ? compactHeight + expandedRow.height : compactHeight;
    const measuredLeadingWidth = hasLeading ? leadingWidth || (navigationWidthVariant === 'wide' ? 52 : 48) : 0;
    const actionWidth =
        actions.reduce((sum, action) => sum + (action.widthVariant === 'wide' ? 52 : 48), 0) + (trailing != null ? trailingWidth || 48 : 0);
    const searchWidth = appBarSearchWidth(headerWidth - insets.left - insets.right - measuredLeadingWidth - actionWidth - 24);
    const titleFrame = appBarTitleFrame(
        headerWidth,
        insets.left,
        insets.right,
        measuredLeadingWidth,
        actionWidth,
        hasLeading,
        rtl,
        centered,
        compactSize.width
    );
    const progress = scrollBehavior?.collapseProgress ?? collapseProgress;
    const behaviorHeightOffset = scrollBehavior?.heightOffset;
    const behaviorContentOffset = scrollBehavior?._contentOffset;
    const behaviorMode = scrollBehavior?._mode;
    const colorProgress = useSharedValue(Number(scrolled));
    const flatColor = containerColor ?? theme.colors.surface;
    const onScrollColor = scrolledContainerColor ?? theme.colors.surfaceContainer;
    const fieldColor = searchContainerColor ?? theme.colors.surfaceContainer;
    const onScrollFieldColor = scrolledSearchContainerColor ?? theme.colors.surfaceContainerHighest;
    const reduced = theme.animation.scale === 0;
    const spring = theme.motion.spring.default.effects;
    const colorConfig = {
        stiffness: spring.stiffness,
        damping: 2 * spring.damping * Math.sqrt(spring.stiffness),
        mass: 1,
        reduceMotion: ReduceMotion.Never,
    };
    const scrollActive = () => {
        'worklet';
        return (
            scrolled ||
            (behaviorContentOffset
                ? appBarFinite(behaviorContentOffset.get()) > 0.01
                : progress
                  ? appBarFraction(progress.get()) > 0.01
                  : false)
        );
    };
    useLayoutEffect(() => {
        scrollBehavior?._setLayout(expandedHeight, compactHeight, top);
    }, [compactHeight, expandedHeight, scrollBehavior, top]);
    useEffect(() => {
        scheduleOnUI(() => {
            'worklet';
            cancelAnimation(colorProgress);
            const target = Number(scrollActive());
            colorProgress.set(reduced ? target : withSpring(target, colorConfig));
        });
        return () => {
            scheduleOnUI(() => {
                'worklet';
                cancelAnimation(colorProgress);
            });
        };
    }, [colorProgress, progress, reduced, scrolled, scrollBehavior, spring.damping, spring.stiffness]);
    useAnimatedReaction(
        scrollActive,
        (active, previous) => {
            if (active === previous) return;
            colorProgress.set(reduced ? Number(active) : withSpring(Number(active), colorConfig));
        },
        [behaviorContentOffset, progress, scrolled, reduced, spring.damping, spring.stiffness, colorProgress]
    );
    const bounds = useAnimatedStyle(() => {
        // Read both shared values directly: web mappers cannot discover a
        // subscription hidden inside another captured worklet function.
        const containerFraction =
            tall && progress && !scrolled && (!behaviorMode || behaviorMode.get() !== 'pinned')
                ? appBarContainerFraction(progress.get())
                : appBarFraction(colorProgress.get());
        const fraction = appBarFraction(progress?.get() ?? 0);
        const height = Math.max(
            0,
            behaviorHeightOffset
                ? top + expandedHeight + appBarFinite(behaviorHeightOffset.get())
                : top + expandedHeight + (compactHeight - expandedHeight) * fraction
        );
        return {
            height,
            // Overflow clips the pixels but leaves the hidden actions in the browser's tab order.
            ...(Platform.OS === 'web' && behaviorHeightOffset
                ? { visibility: height === 0 ? ('hidden' as const) : ('visible' as const) }
                : {}),
            backgroundColor: containerColorSource
                ? containerColorSource.get()
                : typeof flatColor === 'string' && typeof onScrollColor === 'string'
                  ? interpolateColor(containerFraction, [0, 1], [flatColor, onScrollColor], 'LAB')
                  : containerFraction > 0.01
                    ? onScrollColor
                    : flatColor,
        };
    });
    const body = useAnimatedStyle(() => {
        const fraction = appBarFraction(progress?.get() ?? 0);
        const hidden = behaviorHeightOffset ? Math.max(0, -appBarFinite(behaviorHeightOffset.get()) - (expandedHeight - compactHeight)) : 0;
        return {
            height: top + expandedHeight + (compactHeight - expandedHeight) * fraction,
            transform: [{ translateY: -hidden }],
        };
    });
    const compact = useAnimatedStyle(() => ({ opacity: tall ? appBarCompactTitleAlpha(progress?.get() ?? 0) : 1 }));
    const expanded = useAnimatedStyle(() => ({ opacity: 1 - appBarFraction(progress?.get() ?? 0) }));
    const compactAccessibility = useAnimatedProps(() => ({
        accessibilityElementsHidden: tall && appBarFraction(progress?.get() ?? 0) < 0.5,
        ...(Platform.OS === 'web' ? { 'aria-hidden': tall && appBarFraction(progress?.get() ?? 0) < 0.5 } : {}),
        importantForAccessibility:
            tall && appBarFraction(progress?.get() ?? 0) < 0.5 ? ('no-hide-descendants' as const) : ('auto' as const),
        pointerEvents: tall && appBarFraction(progress?.get() ?? 0) < 0.5 ? ('none' as const) : ('auto' as const),
    }));
    const expandedAccessibility = useAnimatedProps(() => ({
        accessibilityElementsHidden: appBarFraction(progress?.get() ?? 0) >= 0.5,
        ...(Platform.OS === 'web' ? { 'aria-hidden': appBarFraction(progress?.get() ?? 0) >= 0.5 } : {}),
        importantForAccessibility: appBarFraction(progress?.get() ?? 0) >= 0.5 ? ('no-hide-descendants' as const) : ('auto' as const),
        pointerEvents: appBarFraction(progress?.get() ?? 0) >= 0.5 ? ('none' as const) : ('auto' as const),
    }));
    const searchBackground = useAnimatedStyle(() => {
        const fraction = appBarFraction(colorProgress.get());
        return {
            backgroundColor:
                typeof fieldColor === 'string' && typeof onScrollFieldColor === 'string'
                    ? interpolateColor(fraction, [0, 1], [fieldColor, onScrollFieldColor], 'LAB')
                    : fraction > 0.01
                      ? onScrollFieldColor
                      : fieldColor,
        };
    });
    const measureContent = (expanded: boolean, size: Measurement) => {
        const setter = expanded ? setExpandedSize : setCompactSize;
        setter((previous) => (previous.width === size.width && previous.height === size.height ? previous : size));
    };
    const measureText = (event: TextLayoutEvent, subtitle: boolean) => {
        const lines = event.nativeEvent.lines.slice(0, subtitle ? 1 : 2);
        const last = lines[lines.length - 1];
        if (!last) return;
        const next = { height: last.y + last.height, baseline: last.y + last.ascender };
        (subtitle ? setSubtitleMetrics : setTitleMetrics)((previous) =>
            previous.height === next.height && previous.baseline === next.baseline ? previous : next
        );
    };
    const titleContent = (font: keyof Theme['fonts'], isExpanded = false) => {
        const text = isExpanded || !tall ? title : collapsedTitle;
        return (
            <View
                onLayout={(event) => measureContent(isExpanded, event.nativeEvent.layout)}
                style={{
                    minWidth: 0,
                    maxWidth: '100%',
                    alignItems: centered ? 'center' : rtl ? 'flex-end' : 'flex-start',
                    alignSelf: centered ? 'center' : rtl ? 'flex-end' : 'flex-start',
                    ...(!isExpanded && centered ? { transform: [{ translateX: titleFrame.translateX }] } : {}),
                }}
                testID={`${testID}-${isExpanded ? 'expanded' : 'compact'}-content`}
            >
                {isExpanded && image ? <View style={{ marginBottom: 8 }}>{image}</View> : null}
                {!isExpanded && !tall && image ? (
                    <View style={{ maxHeight: 48 }}>{image}</View>
                ) : typeof text === 'string' || typeof text === 'number' ? (
                    <Text
                        accessibilityRole="header"
                        numberOfLines={isExpanded ? 2 : 1}
                        ellipsizeMode={isExpanded ? 'clip' : 'tail'}
                        onTextLayout={isExpanded ? (event) => measureText(event, false) : undefined}
                        style={[
                            theme.fonts[font],
                            { color: theme.colors.onSurface, textAlign: centered ? 'center' : rtl ? 'right' : 'left' },
                        ]}
                    >
                        {text}
                    </Text>
                ) : (
                    text
                )}
                {subtitle && (isExpanded || compactHasContent) && (tall || !image) ? (
                    <Text
                        numberOfLines={1}
                        onTextLayout={isExpanded ? (event) => measureText(event, true) : undefined}
                        style={[
                            theme.fonts[isExpanded ? tokens.subtitle : 'labelMedium'],
                            { color: theme.colors.onSurfaceVariant, textAlign: centered ? 'center' : rtl ? 'right' : 'left' },
                        ]}
                    >
                        {subtitle}
                    </Text>
                ) : null}
            </View>
        );
    };
    const surface = (
        <Animated.View
            collapsable={false}
            style={[
                { width: '100%', overflow: 'hidden', borderRadius: 0, ...(Platform.OS === 'web' ? { direction: 'ltr' as const } : {}) },
                bounds,
                style,
            ]}
            testID={testID}
        >
            <Animated.View style={[{ paddingTop: top }, body]}>
                <View
                    onLayout={(event) => setHeaderWidth(event.nativeEvent.layout.width)}
                    style={{
                        height: compactHeight,
                        flexDirection: rtl ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        paddingLeft: 4 + insets.left,
                        paddingRight: 4 + insets.right,
                    }}
                    testID={`${testID}-row`}
                >
                    {hasLeading ? (
                        <View
                            onLayout={(event) => setLeadingWidth(event.nativeEvent.layout.width)}
                            style={{ minWidth: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
                            testID={`${testID}-leading-slot`}
                        >
                            {leading ?? (
                                <IconButton
                                    icon={navigationIcon!}
                                    mode={navigationMode}
                                    widthVariant={navigationWidthVariant}
                                    iconColor={navigationMode ? undefined : theme.colors.onSurface}
                                    accessibilityLabel={navigationLabel}
                                    disabled={!onNavigationPress}
                                    onPress={onNavigationPress}
                                    testID={`${testID}-navigation`}
                                />
                            )}
                        </View>
                    ) : null}
                    {search ? (
                        <View style={{ flex: 1, paddingHorizontal: 8, alignItems: 'center' }}>
                            <Animated.View
                                onLayout={(event) => setSearchHeight(event.nativeEvent.layout.height)}
                                style={[
                                    { width: headerWidth > 0 ? searchWidth : '100%', minHeight: 56, borderRadius: 28 },
                                    searchBackground,
                                ]}
                                testID={`${testID}-search-container`}
                            >
                                {search}
                            </Animated.View>
                        </View>
                    ) : (
                        <>
                            <Animated.View
                                animatedProps={compactAccessibility}
                                style={[
                                    {
                                        position: 'absolute',
                                        left: titleFrame.left,
                                        width: titleFrame.width,
                                        top: 0,
                                        bottom: 0,
                                        justifyContent: 'center',
                                        minWidth: 0,
                                    },
                                    compact,
                                ]}
                                testID={`${testID}-compact`}
                            >
                                {titleContent('titleLarge')}
                            </Animated.View>
                            <View style={{ flex: 1 }} />
                        </>
                    )}
                    {actions.map((action) => (
                        <View key={action.key} style={{ minWidth: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                            <IconButton
                                icon={action.icon}
                                mode={action.mode}
                                widthVariant={action.widthVariant}
                                iconColor={action.mode ? undefined : theme.colors.onSurfaceVariant}
                                accessibilityLabel={action.label}
                                disabled={action.disabled}
                                onPress={action.onPress}
                                testID={action.testID ?? `${testID}-${action.key}`}
                            />
                        </View>
                    ))}
                    {trailing != null ? (
                        <View
                            onLayout={(event) => setTrailingWidth(event.nativeEvent.layout.width)}
                            style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
                            testID={`${testID}-trailing-slot`}
                        >
                            {trailing}
                        </View>
                    ) : null}
                </View>
                {tall ? (
                    <Animated.View
                        animatedProps={expandedAccessibility}
                        style={[
                            {
                                position: 'absolute',
                                top: top + compactHeight,
                                bottom: 0,
                                left: 16 + insets.left,
                                right: 16 + insets.right,
                                justifyContent: 'flex-end',
                                paddingBottom: expandedRow.bottomPadding,
                            },
                            expanded,
                        ]}
                        testID={`${testID}-expanded`}
                    >
                        {titleContent(tokens.title, true)}
                    </Animated.View>
                ) : null}
            </Animated.View>
        </Animated.View>
    );
    return scrollBehavior?._dragGesture ? <GestureDetector gesture={scrollBehavior._dragGesture}>{surface}</GestureDetector> : surface;
}
