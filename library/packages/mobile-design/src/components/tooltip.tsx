import { Platform } from 'react-native';
import { cloneElement, useCallback, useEffect, useRef, useId, useState, type ComponentProps, type ReactElement } from 'react';
import { Text, type TooltipProps as PaperTooltipProps } from 'react-native-paper';
import { useMobileTheme } from '../core';
import { AnchoredPopup } from './popup';

let closeActiveTooltip: (() => void) | undefined;
type TriggerProps = Record<string, unknown> & {
    disabled?: boolean;
    visible?: boolean;
    onPressIn?: (...args: unknown[]) => void;
    onPress?: (...args: unknown[]) => void;
    onLongPress?: (...args: unknown[]) => void;
    onPressOut?: (...args: unknown[]) => void;
    onHoverIn?: (...args: unknown[]) => void;
    onHoverOut?: (...args: unknown[]) => void;
    onFocus?: (...args: unknown[]) => void;
    onBlur?: (...args: unknown[]) => void;
    onTouchCancel?: (...args: unknown[]) => void;
};

/** One transient tooltip at a time; timers are owned by the mounted trigger session. */
export function useTooltipTrigger(
    element: ReactElement,
    {
        enterTouchDelay = 500,
        leaveTouchDelay = 1500,
        persistent = false,
        visible,
        onDismiss,
    }: { enterTouchDelay?: number; leaveTouchDelay?: number; persistent?: boolean; visible?: boolean; onDismiss?: () => void } = {}
) {
    const [open, setOpen] = useState(false);
    const child = element.props as TriggerProps;
    const disabled = Boolean(child.disabled || child.visible === false);
    const session = useRef({ disabled, persistent, key: element.key, version: 0 });
    if (session.current.disabled !== disabled || session.current.persistent !== persistent || session.current.key !== element.key)
        session.current = { disabled, persistent, key: element.key, version: session.current.version + 1 };
    const version = session.current.version;
    const current = useRef({ disabled, persistent, visible, child, onDismiss });
    current.current = { disabled, persistent, visible, child, onDismiss };
    const active = useRef(Boolean(visible));
    const alive = useRef(true),
        held = useRef(false);
    const regions = useRef({ anchorHover: false, contentHover: false, anchorFocus: false, contentFocus: false });
    const timers = useRef<{ hide?: ReturnType<typeof setTimeout> }>({});
    const clear = useCallback(() => {
        clearTimeout(timers.current.hide);
    }, []);
    const hide = useCallback(() => {
        clear();
        if (closeActiveTooltip === hide) closeActiveTooltip = undefined;
        if (!alive.current || !active.current) return;
        active.current = false;
        setOpen(false);
        current.current.onDismiss?.();
    }, [clear]);
    const show = useCallback(() => {
        if (!alive.current || current.current.disabled || current.current.visible === false) return;
        clear();
        if (closeActiveTooltip !== hide) closeActiveTooltip?.();
        closeActiveTooltip = hide;
        active.current = true;
        setOpen(true);
    }, [clear, hide]);
    const leave = useCallback(() => {
        clear();
        if (!current.current.persistent && !Object.values(regions.current).some(Boolean))
            timers.current.hide = setTimeout(() => {
                if (!Object.values(regions.current).some(Boolean)) hide();
            }, leaveTouchDelay);
    }, [clear, hide, leaveTouchDelay]);
    const valid = () => alive.current && !current.current.disabled && session.current.version === version;
    const enterRegion = (key: keyof typeof regions.current) => {
        if (!valid()) return;
        regions.current[key] = true;
        clear();
        if (!current.current.persistent) show();
    };
    const leaveRegion = (key: keyof typeof regions.current) => {
        if (!valid()) return;
        regions.current[key] = false;
        leave();
    };
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            clear();
            if (closeActiveTooltip === hide) closeActiveTooltip = undefined;
        };
    }, [clear, hide]);
    useEffect(() => {
        if (visible !== undefined) active.current = visible;
        if (visible && closeActiveTooltip !== hide) {
            closeActiveTooltip?.();
            closeActiveTooltip = hide;
        } else if (visible === false && closeActiveTooltip === hide) closeActiveTooltip = undefined;
    }, [hide, visible]);
    useEffect(() => {
        clear();
        held.current = false;
        regions.current = { anchorHover: false, contentHover: false, anchorFocus: false, contentFocus: false };
        if (disabled) hide();
    }, [clear, disabled, hide, version]);
    const anchor = cloneElement(element as ReactElement<TriggerProps>, {
        delayLongPress: enterTouchDelay,
        onPressIn: (...args: unknown[]) => {
            if (!valid()) return;
            held.current = false;
            current.current.child.onPressIn?.(...args);
        },
        onLongPress: (...args: unknown[]) => {
            if (!valid()) return;
            if (!persistent) {
                held.current = true;
                show();
            }
            current.current.child.onLongPress?.(...args);
        },
        onPressOut: (...args: unknown[]) => {
            if (!valid()) return;
            leave();
            current.current.child.onPressOut?.(...args);
        },
        onPress: (...args: unknown[]) => {
            if (!valid()) return;
            if (held.current) {
                held.current = false;
                return;
            }
            if (persistent && visible === undefined) show();
            else if (!persistent) hide();
            current.current.child.onPress?.(...args);
        },
        onHoverIn: (...args: unknown[]) => {
            enterRegion('anchorHover');
            if (valid()) current.current.child.onHoverIn?.(...args);
        },
        onHoverOut: (...args: unknown[]) => {
            leaveRegion('anchorHover');
            if (valid()) current.current.child.onHoverOut?.(...args);
        },
        onFocus: (...args: unknown[]) => {
            const target = (args[0] as { target?: { matches?: (selector: string) => boolean } } | undefined)?.target;
            // Pointer/touch focus must not keep a released touch tooltip open indefinitely.
            if (Platform.OS !== 'web' || !target?.matches || target.matches(':focus-visible')) enterRegion('anchorFocus');
            if (valid()) current.current.child.onFocus?.(...args);
        },
        onBlur: (...args: unknown[]) => {
            leaveRegion('anchorFocus');
            if (valid()) current.current.child.onBlur?.(...args);
        },
        onTouchCancel: (...args: unknown[]) => {
            if (!valid()) return;
            held.current = false;
            if (!persistent) hide();
            current.current.child.onTouchCancel?.(...args);
        },
    });
    return {
        anchor,
        visible: !disabled && (visible ?? open),
        dismiss: hide,
        contentEvents: {
            onPointerEnter: () => enterRegion('contentHover'),
            onPointerLeave: () => leaveRegion('contentHover'),
            onFocus: () => enterRegion('contentFocus'),
            onBlur: () => leaveRegion('contentFocus'),
        },
    };
}

export type TooltipProps = PaperTooltipProps &
    Pick<ComponentProps<typeof AnchoredPopup>, 'anchorStyle'> & { placement?: 'above' | 'below'; gap?: 4 | 8; testID?: string };

/** PlainTooltip: inverse roles, BodySmall, minimum24×40dp, padding8×4dp. */
export function Tooltip({
    title,
    children,
    enterTouchDelay = 500,
    leaveTouchDelay = 1500,
    titleMaxFontSizeMultiplier,
    placement = 'above',
    gap = 4,
    anchorStyle,
    testID = 'mobile-tooltip',
    theme: themeOverrides,
}: TooltipProps) {
    const theme = useMobileTheme(themeOverrides);
    const descriptionId = useId();
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    const trigger = useTooltipTrigger(children, { enterTouchDelay, leaveTouchDelay });
    // TooltipDefaults.plainTooltipMaxWidth is 200dp, distinct from rich tooltip320dp.
    const [textWidth, setTextWidth] = useState(184);
    return (
        <AnchoredPopup
            theme={themeOverrides}
            anchor={
                Platform.OS === 'web'
                    ? cloneElement(trigger.anchor as ReactElement<Record<string, unknown>>, {
                          'aria-describedby':
                              [(children.props as Record<string, unknown>)['aria-describedby'], trigger.visible ? descriptionId : null]
                                  .filter(Boolean)
                                  .join(' ') || undefined,
                      })
                    : trigger.anchor
            }
            anchorStyle={anchorStyle}
            visible={trigger.visible}
            onDismiss={trigger.dismiss}
            placement={placement === 'below' ? 'below-center' : 'above'}
            gap={gap}
            width={Math.min(200, Math.max(40, textWidth + 16))}
            elevation={0}
            modal={false}
            dismissOnOutside={false}
            scrollable={false}
            contentStyle={{ backgroundColor: theme.colors.inverseSurface, borderRadius: 4 }}
            testID={testID}
        >
            <Text
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                pointerEvents="none"
                numberOfLines={1}
                onTextLayout={
                    Platform.OS !== 'web'
                        ? (event) => {
                              if (mounted.current) setTextWidth(Math.min(184, event.nativeEvent.lines[0]?.width ?? 184));
                          }
                        : undefined
                }
                onLayout={
                    Platform.OS === 'web'
                        ? (event) => {
                              if (mounted.current) setTextWidth(Math.min(184, event.nativeEvent.layout.width));
                          }
                        : undefined
                }
                maxFontSizeMultiplier={titleMaxFontSizeMultiplier}
                variant="bodySmall"
                style={{
                    position: 'absolute',
                    alignSelf: 'flex-start',
                    ...(Platform.OS === 'web' ? { whiteSpace: 'nowrap' as const } : { width: 10000 }),
                    opacity: 0,
                }}
            >
                {title}
            </Text>
            <Text
                {...trigger.contentEvents}
                nativeID={descriptionId}
                {...(Platform.OS === 'web' ? { role: 'tooltip' as const } : {})}
                accessibilityLiveRegion="polite"
                numberOfLines={1}
                maxFontSizeMultiplier={titleMaxFontSizeMultiplier}
                variant="bodySmall"
                style={{ minHeight: 24, paddingHorizontal: 8, paddingVertical: 4, color: theme.colors.inverseOnSurface }}
            >
                {title}
            </Text>
        </AnchoredPopup>
    );
}
