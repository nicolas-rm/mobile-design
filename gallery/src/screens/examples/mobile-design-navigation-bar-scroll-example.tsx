import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, ScrollView, View, type ScrollViewInstance } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { List, NavigationBar, Switch, Text, useMobileTheme, type NavigationDestination } from 'mobile-design/react-native';

const items: readonly NavigationDestination[] = [
    { key: 'home', label: 'Home', icon: 'home-outline', selectedIcon: 'home_fill1' },
    { key: 'browse', label: 'Browse', icon: 'browse_gallery', selectedIcon: 'browse_gallery_fill1' },
    { key: 'library', label: 'Library', icon: 'library_music', selectedIcon: 'library_music_fill1' },
];

/** Scroll visibility is owned by the screen; the navigation destinations stay fixed. */
export function NavigationBarScrollExample() {
    const theme = useMobileTheme();
    const [value, setValue] = useState('home');
    const [visible, setVisible] = useState(true);
    const [screenReader, setScreenReader] = useState(true);
    const [keepVisible, setKeepVisible] = useState(Platform.OS === 'web');
    const [barHeight, setBarHeight] = useState(64);
    const scroll = useRef<ScrollViewInstance>(null);
    const travel = useRef({ y: 0, distance: 0, direction: 0, visible: true });
    const offset = useSharedValue(0);
    useEffect(() => () => cancelAnimation(offset), [offset]);
    useEffect(() => {
        let alive = true;
        const update = (enabled: boolean) => {
            if (alive) setScreenReader(enabled);
        };
        AccessibilityInfo.isScreenReaderEnabled().then(update);
        const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', update);
        return () => {
            alive = false;
            subscription.remove();
        };
    }, []);
    // RN Web reports a constant true rather than detecting assistive technology.
    // Keep the demo fixed by default there and let the reader explicitly opt in.
    const fixed = keepVisible || (Platform.OS !== 'web' && screenReader) || theme.animation.scale === 0;
    useEffect(() => {
        if (fixed) {
            travel.current.visible = true;
            setVisible(true);
        }
    }, [fixed]);
    useEffect(() => {
        const spring = theme.motion.spring.default.spatial;
        offset.set(
            fixed
                ? 0
                : withSpring(visible ? 0 : barHeight, {
                      stiffness: spring.stiffness,
                      damping: 2 * spring.damping * Math.sqrt(spring.stiffness),
                      overshootClamping: true,
                      reduceMotion: ReduceMotion.Never,
                  })
        );
    }, [barHeight, fixed, offset, theme.motion, visible]);
    const position = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));
    return (
        <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ flex: 1 }}>Mantener navegación visible</Text>
                <Switch
                    value={keepVisible || (Platform.OS !== 'web' && screenReader)}
                    onValueChange={setKeepVisible}
                    disabled={Platform.OS !== 'web' && screenReader}
                    accessibilityLabel="Mantener navegación visible"
                    testID="catalog-navbar-scroll-fixed"
                />
            </View>
            <View style={{ height: 336, overflow: 'hidden', backgroundColor: theme.colors.surfaceContainerLow }}>
                <ScrollView
                    ref={scroll}
                    nestedScrollEnabled
                    scrollEventThrottle={32}
                    testID="catalog-navbar-scroll-content"
                    contentContainerStyle={{ padding: 16, paddingBottom: 16 + barHeight, gap: 12 }}
                    onScroll={(event) => {
                        const y = Math.max(0, event.nativeEvent.contentOffset.y);
                        const state = travel.current;
                        const delta = y - state.y;
                        const direction = Math.sign(delta);
                        state.y = y;
                        if (fixed || !direction) return;
                        state.distance = direction === state.direction ? state.distance + Math.abs(delta) : Math.abs(delta);
                        state.direction = direction;
                        const next = y <= 0 || direction < 0;
                        // React changes only when the visibility threshold is crossed;
                        // Reanimated performs the transition on the UI thread.
                        if ((y <= 0 || state.distance >= 24) && state.visible !== next) {
                            state.visible = next;
                            setVisible(next);
                        }
                    }}
                >
                    <Text variant="headlineSmall" testID="catalog-navbar-scroll-title">
                        {items.find((item) => item.key === value)?.label}
                    </Text>
                    <List.Group>
                        {Array.from({ length: 12 }, (_, index) => (
                            <List.Item key={`${value}-${index}`} title={`${value === 'library' ? 'Saved album' : 'Daily mix'} ${index + 1}`} />
                        ))}
                    </List.Group>
                </ScrollView>
                <Animated.View
                    {...(Platform.OS === 'web' ? { inert: !visible && !fixed, 'aria-hidden': !visible && !fixed } : {})}
                    accessibilityElementsHidden={!visible && !fixed}
                    importantForAccessibility={!visible && !fixed ? 'no-hide-descendants' : 'auto'}
                    pointerEvents={visible || fixed ? 'auto' : 'none'}
                    onLayout={(event) => setBarHeight(event.nativeEvent.layout.height)}
                    style={[{ position: 'absolute', left: 0, right: 0, bottom: 0 }, position]}
                    testID="catalog-navbar-scroll-container"
                >
                    <NavigationBar
                        items={items}
                        value={value}
                        safeArea={false}
                        accessibilityLabel="Music navigation"
                        onValueChange={(next) => {
                            scroll.current?.scrollTo({ y: 0, animated: next === value && theme.animation.scale !== 0 });
                            setValue(next);
                        }}
                        style={{ minHeight: 64 }}
                        testID="catalog-navbar-scroll"
                    />
                </Animated.View>
            </View>
        </View>
    );
}
