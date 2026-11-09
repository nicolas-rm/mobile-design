import type { ScrollIndicatorOptions } from '../scroll-indicators';
import {
    Children,
    Fragment,
    cloneElement,
    createContext,
    isValidElement,
    useContext,
    useCallback,
    useEffect,
    useLayoutEffect,
    useId,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
    type ComponentProps,
    type ReactNode,
    type Ref,
} from 'react';
import { Platform, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, Menu as PaperMenu, Text, useLocale } from 'react-native-paper';
import { TouchableRipple } from '../ripple';
import Animated, {
    LinearTransition,
    ReduceMotion,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useMobileTheme } from '../core';
import { withAlpha } from '../color';
import { AnchoredPopup, type PopupPlacement, type PopupRect } from './popup';
import { TextField, type TextFieldHandle } from './text-field';
import { Button } from './button';
import { IconButton } from './icon-button';
import { Chip, Divider } from './content';
import { orderFocusTargets } from './focus-order';

export type MenuVariant = 'standard' | 'vibrant' | 'baseline';
type Point = { x: number; y: number };
function pointerPoint(event: { nativeEvent: { pageX: number; pageY: number; clientX?: number; clientY?: number } }): Point {
    return { x: event.nativeEvent.clientX ?? event.nativeEvent.pageX, y: event.nativeEvent.clientY ?? event.nativeEvent.pageY };
}
function insidePointerCorridor(point: Point, origin: Point, bounds: PopupRect) {
    const edge = bounds.x >= origin.x ? bounds.x : bounds.x + bounds.width;
    const top = { x: edge, y: bounds.y - 8 },
        bottom = { x: edge, y: bounds.y + bounds.height + 8 };
    const cross = (p: Point, a: Point, b: Point) => (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
    const signs = [cross(point, origin, top), cross(point, top, bottom), cross(point, bottom, origin)];
    return !(signs.some((value) => value < 0) && signs.some((value) => value > 0));
}
type MenuContextValue = {
    scrollIndicators?: ScrollIndicatorOptions;
    variant: MenuVariant;
    dismiss: () => void;
    grouped: boolean;
    activeSubmenu: string | null;
    setActiveSubmenu: (key: string | null) => void;
    registerFocus: (
        id: string,
        focus: () => void,
        disabled: () => boolean,
        node: () => unknown,
        openSubmenu?: () => void,
        label?: () => string
    ) => () => void;
    focusedItem: (id: string) => void;
    requestSubmenu: (key: string | null, point?: Point) => void;
    submenuPosition: (key: string, bounds: PopupRect) => void;
    cancelHover: () => void;
    canInteract: () => boolean;
    submenuVersion: () => number;
    exitWithTab: (reverse: boolean) => void;
};
const MenuContext = createContext<MenuContextValue | null>(null);
type MenuTriggerProps = Pick<ComponentProps<typeof Button>, 'onPress' | 'disabled' | 'loading' | 'accessibilityState'>;
export type MenuProps = Omit<
    ComponentProps<typeof PaperMenu>,
    'contentStyle' | 'style' | 'statusBarHeight' | 'mode' | 'keyboardShouldPersistTaps'
> & {
    /** Overflow menus expose their scrollbar by default; explicit axis options override it. */
    scrollIndicators?: ScrollIndicatorOptions;
    variant?: MenuVariant;
    onClosed?: () => void;
    layout?: 'standard' | 'grouped';
    anchorGap?: number;
    anchorStyle?: StyleProp<ViewStyle>;
    placement?: PopupPlacement;
    width?: number;
    filterable?: boolean;
    filterValue?: string;
    onFilterChange?: (value: string) => void;
    filterPlaceholder?: string;
    filterAccessibilityLabel?: string;
    emptyLabel?: string;
    contentStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ViewStyle>;
    /** Internal submenu geometry and pointer hand-off. */
    onPositionChange?: (bounds: PopupRect) => void;
    onPointerInside?: () => void;
    onKeyboardDismiss?: () => void;
};
function searchKey(text: string) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase()
        .trim();
}
// React.Children does not traverse Fragments. Treat them as composition only,
// so filtering, row gaps and group positions work the same in every consumer.
function menuChildren(children: ReactNode, prefix = ''): ReactNode[] {
    return Children.toArray(children).flatMap((child, index) => {
        const key = `${prefix}${isValidElement(child) ? child.key ?? index : index}`;
        if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment)
            return menuChildren(child.props.children, `${key}/`);
        return [isValidElement(child) ? cloneElement(child, { key }) : child];
    });
}
function filterChildren(children: ReactNode, query: string): ReactNode[] {
    const needle = searchKey(query);
    return menuChildren(children).flatMap((child) => {
        if (!needle || !isValidElement<MenuItemProps & { children?: ReactNode }>(child)) return [child];
        if (child.type === MenuGroup) {
            const matching = filterChildren(child.props.children, query);
            return matching.length ? [cloneElement(child, { children: matching })] : [];
        }
        if (child.type !== MenuItem && child.type !== MenuSubmenu) return [];
        const title = typeof child.props.title === 'string' ? child.props.title : '';
        const haystack = child.props.searchText ?? `${title} ${child.props.supportingText ?? ''}`;
        return !haystack || searchKey(haystack).includes(needle) ? [child] : [];
    });
}
function MenuRoot({
    scrollIndicators,
    anchor,
    visible,
    onDismiss,
    onClosed,
    onPositionChange,
    onPointerInside,
    onKeyboardDismiss,
    children,
    variant = 'standard',
    layout = 'standard',
    anchorPosition = 'bottom',
    anchorGap = 0,
    anchorStyle,
    placement,
    width = 280,
    filterable = false,
    filterValue,
    onFilterChange,
    filterPlaceholder = 'Filter options',
    filterAccessibilityLabel = filterPlaceholder,
    emptyLabel = 'No results',
    contentStyle,
    style,
    testID = 'mobile-menu',
    elevation = 2,
    overlayAccessibilityLabel = 'Cerrar menú',
    theme: override,
}: MenuProps) {
    const theme = useMobileTheme(override);
    const parent = useContext(MenuContext);
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => { alive.current = false; };
    }, []);
    const [query, setQuery] = useState('');
    const [overflow, setOverflow] = useState(false);
    const [activeSubmenu, setActiveSubmenuState] = useState<string | null>(null);
    const activeSubmenuRef = useRef(activeSubmenu),
        submenuVersion = useRef(0);
    const setActiveSubmenu = (key: string | null) => {
        if (key !== activeSubmenuRef.current) {
            activeSubmenuRef.current = key;
            submenuVersion.current++;
        }
        setActiveSubmenuState(key);
    };
    const { direction } = useLocale();
    const visibleRef = useRef(visible);
    visibleRef.current = visible;
    const currentAnchor = useRef(anchor);
    currentAnchor.current = anchor;
    const interactionSession = useRef({ visible, version: 0 });
    if (interactionSession.current.visible !== visible)
        interactionSession.current = { visible, version: interactionSession.current.version + 1 };
    const interactionVersion = interactionSession.current.version;
    const canInteract = () =>
        alive.current && visibleRef.current && interactionSession.current.version === interactionVersion && parent?.canInteract() !== false;
    const focusTargets = useRef(
        new Map<
            string,
            { id: string; node: () => unknown; focus: () => void; disabled: boolean; label: string; openSubmenu?: () => void }
        >()
    );
    const focusedId = useRef<string | null>(null);
    const menuScope = useRef<React.ComponentRef<typeof View>>(null);
    const previousFocus = useRef<HTMLElement | null>(null);
    useLayoutEffect(() => {
        if (Platform.OS === 'web' && visible && !parent)
            previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }, [visible, Boolean(parent)]);
    const closed = () => {
        if (Platform.OS === 'web' && !parent) {
            const scope = menuScope.current as unknown as HTMLElement | null;
            if (previousFocus.current?.isConnected && (document.activeElement === document.body || scope?.contains(document.activeElement)))
                previousFocus.current.focus({ preventScroll: true });
        }
        onClosed?.();
    };
    const initialFocus = useRef<'first' | 'last'>('first');
    const typeahead = useRef({ value: '', time: 0 });
    const filterRef = useRef<TextFieldHandle>(null);
    const registerFocus = useCallback(
        (id: string, focus: () => void, disabled: () => boolean, node: () => unknown, openSubmenu?: () => void, label?: () => string) => {
            focusTargets.current.set(id, {
                id,
                node,
                focus,
                get disabled() {
                    return disabled();
                },
                get label() {
                    return label?.() ?? '';
                },
                openSubmenu,
            });
            return () => {
                focusTargets.current.delete(id);
            };
        },
        []
    );
    const focusedItem = useCallback((id: string) => {
        focusedId.current = id;
    }, []);
    const pointer = useRef<Point | null>(null);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const submenuRects = useRef(new Map<string, PopupRect>());
    const cancelHover = useCallback(() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
    }, []);
    const submenuPosition = useCallback((key: string, bounds: PopupRect) => {
        submenuRects.current.set(key, bounds);
    }, []);
    useEffect(() => cancelHover, [cancelHover]);
    useEffect(() => {
        if (!visible) cancelHover();
    }, [visible, cancelHover]);
    const focusFirst = () => {
        if (!canInteract()) return;
        const requested = initialFocus.current;
        initialFocus.current = 'first';
        if (Platform.OS === 'web') {
            const scope = menuScope.current as unknown as HTMLElement | null;
            // A user can enter a row/submenu before the fade finishes. The
            // opening callback must not take focus back from that interaction.
            if (activeSubmenuRef.current || scope?.contains(document.activeElement)) return;
        }
        if (filterable) {
            filterRef.current?.focus();
            return;
        }
        // Disabled actions remain focusable in MD3 menus; activation is guarded
        // separately, so keyboard users can discover unavailable commands.
        const targets = orderFocusTargets([...focusTargets.current.values()]);
        const target = requested === 'last' ? targets[targets.length - 1] : targets[0];
        target?.focus();
    };
    const exitWithTab = (reverse: boolean) => {
        if (parent) {
            parent.exitWithTab(reverse);
            return;
        }
        const candidates = [
            ...document.querySelectorAll<HTMLElement>(
                'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
            ),
        ].filter(
            (node) =>
                node.getClientRects().length &&
                !node.closest('[role="menu"],[inert],[hidden],[aria-hidden="true"]')
        );
        const start = candidates.indexOf(previousFocus.current!);
        dismiss();
        const index = start < 0 ? (reverse ? 0 : -1) : start;
        candidates[(index + (reverse ? -1 : 1) + candidates.length) % candidates.length]?.focus();
    };
    const trigger =
        isValidElement<Pick<ComponentProps<typeof Button>, 'pressed' | 'accessibilityState'> & { 'aria-haspopup'?: 'menu' }>(anchor) &&
        (anchor.type === Button || anchor.type === IconButton || anchor.type === Chip)
            ? cloneElement(anchor, {
                  pressed: visible || anchor.props.pressed,
                  accessibilityState: { ...anchor.props.accessibilityState, expanded: visible },
                  ...(Platform.OS === 'web' ? { 'aria-haspopup': 'menu' as const } : {}),
              })
            : anchor;
    const triggerKeyboard =
        Platform.OS === 'web' && isValidElement<MenuTriggerProps>(anchor) && anchor.props.onPress
            ? {
                  onKeyDown: (event: {
                      nativeEvent: { key?: string };
                      defaultPrevented?: boolean;
                      preventDefault: () => void;
                      stopPropagation: () => void;
                  }) => {
                      const key = event.nativeEvent.key;
                      const source = currentAnchor.current;
                      // Dismissal keys can arrive before the enter transition
                      // moves focus from the trigger into the menu.
                      if ((key === 'Tab' || key === 'Escape') && visibleRef.current && canInteract()) {
                          if (key === 'Escape') {
                              event.preventDefault();
                              event.stopPropagation();
                              onKeyboardDismiss?.();
                              setActiveSubmenu(null);
                          }
                          onDismiss?.();
                          return;
                      }
                      if (visibleRef.current && canInteract() && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key ?? '')) {
                          event.preventDefault();
                          event.stopPropagation();
                          initialFocus.current = key === 'ArrowUp' || key === 'End' ? 'last' : 'first';
                          const scope = menuScope.current as unknown as HTMLElement | null;
                          if (focusTargets.current.size && scope?.isConnected && !scope.closest('[inert],[aria-hidden="true"]')) focusFirst();
                          return;
                      }
                      if (
                          visibleRef.current ||
                          interactionSession.current.version !== interactionVersion ||
                          event.defaultPrevented ||
                          parent?.canInteract() === false ||
                          !isValidElement<MenuTriggerProps>(source) ||
                          !source.props.onPress ||
                          source.props.disabled ||
                          source.props.loading ||
                          source.props.accessibilityState?.disabled ||
                          (key !== 'ArrowDown' && key !== 'ArrowUp')
                      )
                          return;
                      event.preventDefault();
                      event.stopPropagation();
                      initialFocus.current = key === 'ArrowUp' ? 'last' : 'first';
                      source.props.onPress(event as unknown as Parameters<NonNullable<ComponentProps<typeof Button>['onPress']>>[0]);
                  },
              }
            : undefined;
    const keyboard =
        Platform.OS === 'web'
            ? {
                  onKeyDown: (event: {
                      nativeEvent: { key?: string; ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean };
                      preventDefault: () => void;
                      stopPropagation: () => void;
                  }) => {
                      const key = event.nativeEvent.key;
                      if (!canInteract()) return;
                      if (key === 'Tab') {
                          event.preventDefault();
                          event.stopPropagation();
                          exitWithTab(Boolean((event.nativeEvent as { shiftKey?: boolean }).shiftKey));
                          return;
                      }
                      if (
                          filterRef.current?.isFocused() &&
                          (key === 'Home' || key === 'End' || key === 'ArrowLeft' || key === 'ArrowRight')
                      )
                          return;
                      if (key === 'Escape') {
                          event.preventDefault();
                          event.stopPropagation();
                          onKeyboardDismiss?.();
                          setActiveSubmenu(null);
                          onDismiss?.();
                          return;
                      }
                      const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
                      const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
                      if ((key === ' ' || key === 'Enter') && focusTargets.current.get(focusedId.current ?? '')?.disabled) {
                          event.preventDefault();
                          event.stopPropagation();
                          return;
                      }
                      if (key === forward) {
                          const focused = focusTargets.current.get(focusedId.current ?? '');
                          if (focused?.openSubmenu && !focused.disabled) {
                              event.preventDefault();
                              event.stopPropagation();
                              focused.openSubmenu();
                          }
                          return;
                      }
                      if (key === backward && parent) {
                          event.preventDefault();
                          event.stopPropagation();
                          onKeyboardDismiss?.();
                          onDismiss?.();
                          return;
                      }
                      const targets = orderFocusTargets([...focusTargets.current.values()]);
                      if (!targets.length) return;
                      if (
                          key?.length === 1 &&
                          key !== ' ' &&
                          !event.nativeEvent.ctrlKey &&
                          !event.nativeEvent.altKey &&
                          !event.nativeEvent.metaKey &&
                          !filterRef.current?.isFocused()
                      ) {
                          const now = Date.now(),
                              character = searchKey(key);
                          if (!character) return;
                          const value = now - typeahead.current.time > 700 ? character : typeahead.current.value + character;
                          typeahead.current = { value, time: now };
                          const search = [...value].every((letter) => letter === character) ? character : value;
                          const current = targets.findIndex((target) => target.id === focusedId.current);
                          const start = search.length === 1 ? current + 1 : Math.max(0, current);
                          const target = Array.from(
                              { length: targets.length },
                              (_, offset) => targets[(start + offset) % targets.length]
                          ).find((entry) => searchKey(entry.label).startsWith(search));
                          if (target) {
                              event.preventDefault();
                              event.stopPropagation();
                              target.focus();
                          }
                          return;
                      }
                      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key ?? '')) return;
                      event.preventDefault();
                      event.stopPropagation();
                      const current = targets.findIndex((target) => target.id === focusedId.current);
                      const next =
                          key === 'Home'
                              ? 0
                              : key === 'End'
                                ? targets.length - 1
                                : current < 0
                                  ? key === 'ArrowDown'
                                      ? 0
                                      : targets.length - 1
                                  : (current + (key === 'ArrowDown' ? 1 : -1) + targets.length) % targets.length;
                      targets[next].focus();
                  },
                  onMouseEnter: () => onPointerInside?.(),
                  onMouseMove: (event: { nativeEvent: { pageX: number; pageY: number; clientX?: number; clientY?: number } }) => {
                      pointer.current = pointerPoint(event);
                  },
              }
            : {};
    const requestSubmenu = (key: string | null, point?: Point) => {
        cancelHover();
        if (!canInteract()) return;
        if (activeSubmenu === key) return;
        const bounds = activeSubmenu ? submenuRects.current.get(activeSubmenu) : undefined;
        // Keep the current submenu open while the pointer travels toward it.
        // MD3 specifies the corridor but not a delay;300ms is local pointer tolerance.
        if (point && pointer.current && bounds && insidePointerCorridor(point, pointer.current, bounds)) {
            hoverTimer.current = setTimeout(() => {
                hoverTimer.current = null;
                if (canInteract()) setActiveSubmenu(key);
            }, 300);
        } else setActiveSubmenu(key);
    };
    useEffect(() => {
        if (!visible) {
            setActiveSubmenu(null);
            setOverflow(false);
            focusedId.current = null;
            typeahead.current = { value: '', time: 0 };
        }
    }, [visible]);
    const grouped = layout === 'grouped' && variant !== 'baseline' && Platform.OS !== 'web' && !overflow;
    const backgroundColor =
        variant === 'vibrant'
            ? theme.colors.tertiaryContainer
            : variant === 'baseline'
              ? theme.colors.surfaceContainer
              : theme.colors.surfaceContainerLow;
    const effectiveQuery = filterValue ?? query;
    const items = useMemo(() => filterChildren(children, filterable ? effectiveQuery : ''), [children, filterable, effectiveQuery]);
    const dismiss = () => {
        if (!canInteract()) return;
        setActiveSubmenu(null);
        onDismiss?.();
        parent?.dismiss();
    };
    const spatial = theme.motion.spring.default.spatial;
    const transition = theme.animation.scale
        ? LinearTransition.springify()
              .stiffness(spatial.stiffness)
              .damping(2 * spatial.damping * Math.sqrt(spatial.stiffness))
              .mass(1)
              .reduceMotion(ReduceMotion.Never)
        : undefined;
    let gapCount = 0;
    const rows = items.map((child, index) => {
        const previous = items[index - 1];
        const groupBoundary =
            layout === 'grouped' &&
            index > 0 &&
            isValidElement(child) &&
            child.type === MenuGroup &&
            isValidElement(previous) &&
            previous.type === MenuGroup;
        const gap = groupBoundary && grouped && gapCount++ < 2;
        return (
            <Animated.View key={isValidElement(child) ? (child.key ?? index) : index} layout={transition} collapsable={false}>
                {groupBoundary ? (
                    gap ? (
                        <View style={{ height: 2 }} />
                    ) : (
                        <View style={{ paddingVertical: 8 }}>
                            <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant }} />
                        </View>
                    )
                ) : null}
                {isValidElement(child) && child.type === Divider ? <View style={{ paddingVertical: 8 }}>{child}</View> : child}
            </Animated.View>
        );
    });
    return (
        <AnchoredPopup
            scrollIndicators={{ vertical: overflow, ...scrollIndicators }}
            presentation="portal"
            dismissOnOutside={!parent}
            anchor={triggerKeyboard ? <View {...triggerKeyboard}>{isValidElement(trigger) ? trigger : null}</View> : trigger}
            anchorStyle={anchorStyle}
            visible={visible}
            onClosed={closed}
            onOpened={focusFirst}
            onPositionChange={onPositionChange}
            onDismiss={() => {
                if (!canInteract()) return;
                setActiveSubmenu(null);
                onDismiss?.();
            }}
            placement={placement ?? (anchorPosition === 'top' ? 'overlap' : 'below')}
            gap={anchorGap}
            width={Math.max(112, Math.min(280, width))}
            elevation={elevation}
            onOverflowChange={setOverflow}
            contentStyle={[
                { backgroundColor: grouped ? 'transparent' : backgroundColor, borderRadius: variant === 'baseline' ? 4 : 16 },
                contentStyle,
            ]}
            style={style}
            accessibilityLabel={overlayAccessibilityLabel}
            testID={testID}
            theme={override}
        >
            <MenuContext.Provider
                value={{
                    variant,
                    dismiss,
                    grouped,
                    activeSubmenu,
                    setActiveSubmenu: (key) => {
                        cancelHover();
                        if (canInteract()) setActiveSubmenu(key);
                    },
                    scrollIndicators,
                    registerFocus,
                    focusedItem,
                    requestSubmenu,
                    submenuPosition,
                    cancelHover,
                    canInteract,
                    submenuVersion: () => submenuVersion.current,
                    exitWithTab,
                }}
            >
                <View
                    ref={menuScope}
                    {...keyboard}
                    {...(Platform.OS === 'web' ? { accessibilityRole: 'menu' as const, 'aria-orientation': 'vertical' as const } : {})}
                    style={{ paddingVertical: 8, paddingHorizontal: variant === 'baseline' ? 0 : 4, gap: grouped || variant === 'baseline' ? 0 : 2 }}
                >
                    {filterable ? (
                        <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
                            <TextField
                                ref={filterRef}
                                value={effectiveQuery}
                                onChangeText={(next) => {
                                    setQuery(next);
                                    onFilterChange?.(next);
                                    setActiveSubmenu(null);
                                }}
                                variant="outlined"
                                placeholder={filterPlaceholder}
                                accessibilityLabel={filterAccessibilityLabel}
                                onFocus={() => {
                                    focusedId.current = null;
                                }}
                                // RN Web TextInput stops keydown propagation;
                                // route its public key event to the same menu handler.
                                onKeyPress={Platform.OS === 'web' ? keyboard.onKeyDown : undefined}
                                leadingIcon="search"
                                autoCorrect={false}
                                autoCapitalize="none"
                                testID={`${testID}-filter`}
                            />
                        </View>
                    ) : null}
                    {rows.length ? (
                        rows
                    ) : (
                        <Text
                            variant="bodyMedium"
                            accessibilityLiveRegion="polite"
                            style={{ padding: 16, color: theme.colors.onSurfaceVariant }}
                            testID={`${testID}-empty`}
                        >
                            {emptyLabel}
                        </Text>
                    )}
                </View>
            </MenuContext.Provider>
        </AnchoredPopup>
    );
}
export type MenuItemProps = Omit<ComponentProps<typeof PaperMenu.Item>, 'dense' | 'style' | 'title'> & {
    ref?: Ref<React.ComponentRef<typeof View>>;
    onOpenSubmenu?: () => void;
    onHoverIn?: ComponentProps<typeof TouchableRipple>['onHoverIn'];
    title?: ReactNode;
    selected?: boolean;
    selectionMode?: 'single' | 'multiple';
    /** A trailing check preserves a leading icon, as in the MD3 activity menu. */
    selectionIndicatorPosition?: 'leading' | 'trailing';
    supportingText?: string;
    trailingText?: string;
    badge?: ReactNode;
    /** A simple visual slot; the row remains the only action and accessible target. */
    content?: ReactNode;
    leading?: ReactNode;
    trailing?: ReactNode;
    /** Search text for non-string title/content slots. */
    searchText?: string;
    closeOnPress?: boolean;
    position?: 'first' | 'middle' | 'last' | 'only';
    style?: StyleProp<ViewStyle>;
};
function VisualSlot({ children }: { children: ReactNode }) {
    return (
        <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            {...(Platform.OS === 'web' ? { 'aria-hidden': true, inert: true } : {})}
        >
            {children}
        </View>
    );
}
export function MenuItem(props: MenuItemProps): React.JSX.Element;
export function MenuItem({
    title,
    leadingIcon,
    trailingIcon,
    disabled = false,
    selected,
    selectionMode,
    selectionIndicatorPosition = 'leading',
    supportingText,
    trailingText,
    badge,
    content,
    leading: leadingSlot,
    trailing: trailingSlot,
    searchText,
    closeOnPress = selectionMode !== 'multiple',
    position,
    onPress,
    onOpenSubmenu,
    onHoverIn,
    titleStyle,
    contentStyle,
    style,
    accessibilityLabel,
    accessibilityState,
    // Keep legacy untyped values out of the native props spread.
    dense: _dense,
    titleMaxFontSizeMultiplier,
    testID = 'mobile-menu-item',
    theme: override,
    ref: forwardedRef,
    ...props
}: MenuItemProps & { dense?: unknown }) {
    const theme = useMobileTheme(override),
        { direction } = useLocale();
    const context = useContext(MenuContext);
    const focusId = useId();
    const focusTarget = useRef<React.ComponentRef<typeof View>>(null);
    useImperativeHandle(forwardedRef, () => focusTarget.current!, []);
    const openSubmenuRef = useRef(onOpenSubmenu);
    openSubmenuRef.current = onOpenSubmenu;
    const disabledRef = useRef(disabled);
    disabledRef.current = disabled;
    const handlers = useRef({ onPress, closeOnPress, onHoverIn });
    handlers.current = { onPress, closeOnPress, onHoverIn };
    const labelRef = useRef('');
    labelRef.current = searchText ?? (typeof title === 'string' || typeof title === 'number' ? String(title) : '');
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    const submenu = Boolean(onOpenSubmenu);
    useLayoutEffect(
        () =>
            context?.registerFocus(
                focusId,
                () => focusTarget.current?.focus(),
                () => disabledRef.current,
                () => focusTarget.current,
                submenu ? () => openSubmenuRef.current?.() : undefined,
                () => labelRef.current
            ),
        [context?.registerFocus, focusId, submenu]
    );
    const variant = context?.variant ?? 'standard';
    const [focused, setFocused] = useState(false),
        [hovered, setHovered] = useState(false),
        [pressed, setPressed] = useState(false);
    const interactive = context?.canInteract() !== false;
    const itemSession = useRef({ disabled, interactive, version: 0 });
    if (itemSession.current.disabled !== disabled || itemSession.current.interactive !== interactive)
        itemSession.current = { disabled, interactive, version: itemSession.current.version + 1 };
    const itemVersion = itemSession.current.version;
    const canDiscover = () => alive.current && itemSession.current.version === itemVersion && context?.canInteract() !== false;
    const canActivate = () => canDiscover() && !disabledRef.current;
    useEffect(() => {
        setHovered(false);
        setPressed(false);
        setFocused(false);
    }, [itemVersion]);
    const vibrant = variant === 'vibrant',
        baseline = variant === 'baseline';
    const active = submenu && Boolean(accessibilityState?.expanded);
    const fill = selected
        ? vibrant
            ? theme.colors.tertiary
            : baseline
              ? theme.colors.secondaryContainer
              : theme.colors.tertiaryContainer
        : 'transparent';
    const ink = selected
        ? vibrant
            ? theme.colors.onTertiary
            : baseline
              ? theme.colors.onSecondaryContainer
              : theme.colors.onTertiaryContainer
        : vibrant
          ? theme.colors.onTertiaryContainer
          : theme.colors.onSurface;
    const secondary = selected ? ink : vibrant ? theme.colors.onTertiaryContainer : theme.colors.onSurfaceVariant;
    const target = baseline ? 0 : selected || (!disabled && (active || focused || hovered || pressed)) ? 12 : 4;
    const radius = useSharedValue(target);
    useEffect(() => {
        const spring = theme.motion.spring.fast.spatial;
        radius.set(
            theme.animation.scale === 0
                ? target
                : withSpring(target, {
                      stiffness: spring.stiffness,
                      damping: 2 * spring.damping * Math.sqrt(spring.stiffness),
                      reduceMotion: ReduceMotion.Never,
                  })
        );
        return () => cancelAnimation(radius);
    }, [radius, target, theme]);
    const shape = useAnimatedStyle(() => ({
        borderRadius: Math.max(0, radius.get()),
        ...(!baseline && (position === 'first' || position === 'only')
            ? { borderTopLeftRadius: Math.max(12, radius.get()), borderTopRightRadius: Math.max(12, radius.get()) }
            : {}),
        ...(!baseline && (position === 'last' || position === 'only')
            ? { borderBottomLeftRadius: Math.max(12, radius.get()), borderBottomRightRadius: Math.max(12, radius.get()) }
            : {}),
    }));
    const leadingIconSource = selected && selectionMode && selectionIndicatorPosition === 'leading' ? 'check' : leadingIcon;
    const trailingIconSource = selected && selectionMode && selectionIndicatorPosition === 'trailing' ? 'check' : trailingIcon;
    const spatial = theme.motion.spring.default.spatial;
    const transition = theme.animation.scale
        ? LinearTransition.springify()
              .stiffness(spatial.stiffness)
              .damping(2 * spatial.damping * Math.sqrt(spatial.stiffness))
              .mass(1)
              .reduceMotion(ReduceMotion.Never)
        : undefined;
    // A disabled command is discoverable by keyboard/focus, but has no touch
    // handler or ripple. View preserves its disabled accessibility state; an
    // enabled native Pressable would overwrite that state with disabled=false.
    const ItemSurface = disabled ? View : TouchableRipple;
    const activation = disabled
        ? {}
        : {
              disabled: !interactive,
              onPress: (event: Parameters<NonNullable<MenuItemProps['onPress']>>[0]) => {
                  if (!canActivate()) return;
                  handlers.current.onPress?.(event);
                  if (handlers.current.closeOnPress) context?.dismiss();
              },
              onPressIn: () => {
                  if (canActivate()) setPressed(true);
              },
              onPressOut: () => {
                  if (canDiscover()) setPressed(false);
              },
              onHoverIn: (event: Parameters<NonNullable<MenuItemProps['onHoverIn']>>[0]) => {
                  if (!canActivate()) return;
                  setHovered(true);
                  if (!onOpenSubmenu) context?.requestSubmenu(null, pointerPoint(event));
                  handlers.current.onHoverIn?.(event);
              },
              onHoverOut: () => {
                  if (canDiscover()) setHovered(false);
              },
              rippleColor: typeof ink === 'string' ? withAlpha(ink, 0.1) : theme.colors.stateLayerPressed,
          };
    return (
        <Animated.View layout={transition} style={[shape, style, { overflow: 'hidden' }]}>
            <View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: fill, opacity: disabled ? 0.38 : 1 }} />
            <ItemSurface
                key={`${disabled ? 'disabled' : 'enabled'}-${interactive ? 'open' : 'closed'}`}
                {...props}
                {...activation}
                ref={focusTarget}
                accessible
                focusable={interactive}
                tabIndex={disabled ? (interactive ? 0 : -1) : undefined}
                accessibilityLabel={
                    accessibilityLabel ?? (typeof title === 'string' || typeof title === 'number' ? String(title) : undefined)
                }
                accessibilityRole={selectionMode ? (selectionMode === 'single' ? 'radio' : 'checkbox') : 'menuitem'}
                accessibilityState={{
                    ...accessibilityState,
                    disabled,
                    ...(selectionMode ? { checked: Boolean(selected) } : selected == null ? {} : { selected }),
                }}
                {...(Platform.OS === 'web'
                    ? {
                          'aria-disabled': disabled,
                          'aria-expanded': accessibilityState?.expanded,
                          ...(submenu ? { 'aria-haspopup': 'menu' as const } : {}),
                          ...(selectionMode
                              ? {
                                    // RN Web forwards these ARIA roles even though native Role omits them.
                                    role: (selectionMode === 'single' ? 'menuitemradio' : 'menuitemcheckbox') as ComponentProps<
                                        typeof View
                                    >['role'],
                                    'aria-checked': Boolean(selected),
                                }
                              : selected == null
                                ? {}
                                : { 'aria-selected': selected }),
                      }
                    : {})}
                onFocus={() => {
                    if (canDiscover()) {
                        setFocused(true);
                        context?.focusedItem(focusId);
                    }
                }}
                onBlur={() => {
                    if (canDiscover()) {
                        setFocused(false);
                        setPressed(false);
                    }
                }}
                style={{ minHeight: 48 }}
                testID={testID}
            >
                <View
                    style={[
                        {
                            minHeight: 48,
                            paddingHorizontal: baseline ? 12 : 16,
                            paddingVertical: 8,
                            flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                            direction: 'ltr',
                            alignItems: 'center',
                            gap: 12,
                            opacity: disabled ? 0.38 : 1,
                            backgroundColor:
                                !disabled && !pressed && (active || focused || hovered)
                                    ? typeof ink === 'string'
                                        ? withAlpha(ink, focused ? 0.1 : 0.08)
                                        : theme.colors.stateLayerPressed
                                    : 'transparent',
                        },
                        contentStyle,
                    ]}
                >
                    {leadingSlot ? (
                        <VisualSlot>{leadingSlot}</VisualSlot>
                    ) : leadingIconSource ? (
                        <VisualSlot>
                            <Icon source={leadingIconSource} size={baseline ? 24 : 20} color={secondary} />
                        </VisualSlot>
                    ) : null}
                    <View style={{ flex: 1, minWidth: 0 }}>
                        {content ? (
                            <VisualSlot>{content}</VisualSlot>
                        ) : (
                            <>
                                <Text
                                    numberOfLines={1}
                                    maxFontSizeMultiplier={titleMaxFontSizeMultiplier}
                                    variant="labelLarge"
                                    style={[{ color: ink, textAlign: direction === 'rtl' ? 'right' : 'left' }, titleStyle]}
                                >
                                    {title}
                                </Text>
                                {supportingText ? (
                                    <Text variant="bodySmall" style={{ color: secondary, textAlign: direction === 'rtl' ? 'right' : 'left' }}>
                                        {supportingText}
                                    </Text>
                                ) : null}
                            </>
                        )}
                    </View>
                    {badge ? <VisualSlot>{badge}</VisualSlot> : null}
                    {trailingText ? (
                        <Text variant="labelLarge" style={{ color: secondary }}>
                            {trailingText}
                        </Text>
                    ) : null}
                    {trailingSlot ? (
                        <VisualSlot>{trailingSlot}</VisualSlot>
                    ) : trailingIconSource ? (
                        <VisualSlot>
                            <Icon source={trailingIconSource} size={baseline ? 24 : 20} color={secondary} />
                        </VisualSlot>
                    ) : null}
                </View>
            </ItemSurface>
            {focused && interactive ? (
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        inset: 1,
                        borderWidth: 3,
                        borderRadius: target,
                        borderColor: theme.colors.secondary,
                    }}
                />
            ) : null}
        </Animated.View>
    );
}
export function MenuGroup({ children, label }: { children: ReactNode; label?: string }) {
    const theme = useMobileTheme(),
        context = useContext(MenuContext);
    const variant = context?.variant ?? 'standard';
    const items = menuChildren(children),
        fill = variant === 'vibrant' ? theme.colors.tertiaryContainer : theme.colors.surfaceContainerLow;
    return (
        <View
            {...(Platform.OS === 'web' ? { role: 'group' as const, 'aria-label': label } : {})}
            style={{ padding: context?.grouped ? 2 : 0, borderRadius: context?.grouped ? 8 : 0, backgroundColor: context?.grouped ? fill : 'transparent', gap: variant === 'baseline' ? 0 : 2 }}
        >
            {label ? (
                <Text
                    variant="labelLarge"
                    {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                    style={{ padding: 12, color: variant === 'vibrant' ? theme.colors.onTertiaryContainer : theme.colors.onSurfaceVariant }}
                >
                    {label}
                </Text>
            ) : null}
            {items.map((child, index) =>
                isValidElement<MenuItemProps>(child) && (child.type === MenuItem || child.type === MenuSubmenu)
                    ? cloneElement(child, {
                          position: context?.grouped
                              ? items.length === 1
                                  ? 'only'
                                  : index === 0
                                    ? 'first'
                                    : index === items.length - 1
                                      ? 'last'
                                      : 'middle'
                              : undefined,
                      })
                    : child
            )}
        </View>
    );
}
export type MenuSubmenuProps = Omit<MenuItemProps, 'closeOnPress' | 'trailingIcon'> & {
    scrollIndicators?: ScrollIndicatorOptions;
    children: ReactNode;
    width?: number;
    submenuAccessibilityLabel?: string;
};
export function MenuSubmenu({
    scrollIndicators,
    children,
    width = 280,
    submenuAccessibilityLabel,
    testID = 'mobile-submenu',
    onPress,
    ...item
}: MenuSubmenuProps) {
    const parent = useContext(MenuContext),
        key = useId(),
        { direction } = useLocale(),
        window = useWindowDimensions();
    const [standaloneOpen, setStandaloneOpen] = useState(false);
    const triggerRef = useRef<React.ComponentRef<typeof View>>(null);
    const focusReturnVersion = useRef<number | null>(null);
    const open = !item.disabled && (parent ? parent.activeSubmenu === key : standaloneOpen);
    const setOpen = (next: boolean) => {
        if (parent) parent.setActiveSubmenu(next ? key : null);
        else setStandaloneOpen(next);
    };
    useEffect(() => {
        if (!item.disabled) return;
        if (parent?.activeSubmenu === key) parent.setActiveSubmenu(null);
        else if (!parent) setStandaloneOpen(false);
    }, [item.disabled, key, parent?.activeSubmenu]);
    return (
        <MenuRoot
            scrollIndicators={scrollIndicators ?? parent?.scrollIndicators}
            anchor={
                <MenuItem
                    {...item}
                    ref={triggerRef}
                    testID={testID}
                    onPress={(event) => {
                        onPress?.(event);
                        setOpen(true);
                    }}
                    closeOnPress={false}
                    onOpenSubmenu={() => {
                        item.onOpenSubmenu?.();
                        setOpen(true);
                    }}
                    onHoverIn={(event) => {
                        if (parent) parent.requestSubmenu(key, pointerPoint(event));
                        else setStandaloneOpen(true);
                        item.onHoverIn?.(event);
                    }}
                    selected={item.selected}
                    accessibilityState={{ ...item.accessibilityState, expanded: open }}
                    trailingIcon={direction === 'rtl' ? 'arrow_left' : 'arrow_right'}
                />
            }
            anchorStyle={{ alignSelf: 'stretch' }}
            placement={window.width < 600 ? 'below' : 'side'}
            anchorGap={4}
            visible={open}
            onKeyboardDismiss={() => {
                focusReturnVersion.current = parent ? parent.submenuVersion() + 1 : 0;
            }}
            onDismiss={() => setOpen(false)}
            onClosed={() => {
                const requested = focusReturnVersion.current;
                focusReturnVersion.current = null;
                if (
                    requested !== null &&
                    parent?.canInteract() !== false &&
                    !parent?.activeSubmenu &&
                    (!parent || parent.submenuVersion() === requested)
                )
                    triggerRef.current?.focus();
            }}
            onPositionChange={(bounds) => parent?.submenuPosition(key, bounds)}
            onPointerInside={() => parent?.cancelHover()}
            width={width}
            testID={`${testID}-popup`}
            overlayAccessibilityLabel={submenuAccessibilityLabel ?? (typeof item.title === 'string' ? item.title : undefined)}
            variant={parent?.variant}
        >
            {children}
        </MenuRoot>
    );
}
export const Menu = Object.assign(MenuRoot, { Item: MenuItem, Group: MenuGroup, Submenu: MenuSubmenu });
