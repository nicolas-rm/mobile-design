/// <reference path="./paper-internals.d.ts" />
import { useContext, useMemo, useRef, type ComponentProps, type ComponentType, type Ref } from 'react';
import type { ViewInstance } from 'react-native';
import { TouchableRipple as PaperTouchableRipple, useTheme } from 'react-native-paper';
import { SettingsContext } from 'react-native-paper/lib/module/core/settings';
import { webAccessibility } from './web-accessibility';
import { ReduceMotionContext } from 'react-native-paper/lib/module/theme/accessibility/ReduceMotionContext';

export type TouchableRippleProps = Omit<ComponentProps<typeof PaperTouchableRipple>, 'ref'> & { ref?: Ref<ViewInstance> };
// Paper's declaration still uses Ref<View>; the host is RN 0.88's ViewInstance.
const PaperRipple = PaperTouchableRipple as ComponentType<TouchableRippleProps>;

/** Paper's web indication, following the host shape, pointer and motion settings. */
export function TouchableRipple({ onPressIn, ...props }: TouchableRippleProps) {
    const spacePressed = useRef(false);
    const inherited = useContext(SettingsContext);
    const theme = useTheme();
    const reduced = useContext(ReduceMotionContext) || theme.animation.scale === 0;
    const settings = useMemo(
        () => ({ ...inherited, rippleEffectEnabled: inherited.rippleEffectEnabled && !reduced }),
        [inherited, reduced]
    );
    const press: NonNullable<TouchableRippleProps['onPressIn']> = (event) => {
        onPressIn?.(event);
        if (!settings.rippleEffectEnabled) return;
        const native = event.nativeEvent as typeof event.nativeEvent & { key?: string; clientX?: number; clientY?: number };
        const target = event.currentTarget as unknown as HTMLElement;
        if (!target?.getBoundingClientRect) return;
        const bounds = target.getBoundingClientRect();
        const x = (native.clientX ?? native.pageX - window.scrollX) - bounds.left;
        const y = (native.clientY ?? native.pageY - window.scrollY) - bounds.top;
        // Paper snapshots the host's corners before its press morph starts.
        // Inherit them instead so the mask follows every animated frame.
        // Paper appends it after onPressIn; update before double-rAF expansion.
        queueMicrotask(() => {
            if (!target.isConnected) return;
            const container = target.querySelector<HTMLElement>(':scope > [data-paper-ripple]:last-child');
            if (!container) return;
            container.style.borderRadius = target.dataset.mobileDesignRippleRadius
                ? target.dataset.mobileDesignRippleRadius + 'px'
                : 'inherit';
            const padding = getComputedStyle(target);
            const inset =
                target.dataset.mobileDesignHitTarget === 'true'
                    ? {
                          top: parseFloat(padding.paddingTop) || 0,
                          right: parseFloat(padding.paddingRight) || 0,
                          bottom: parseFloat(padding.paddingBottom) || 0,
                          left: parseFloat(padding.paddingLeft) || 0,
                      }
                    : { top: 0, right: 0, bottom: 0, left: 0 };
            Object.assign(container.style, {
                top: inset.top + 'px',
                right: inset.right + 'px',
                bottom: inset.bottom + 'px',
                left: inset.left + 'px',
            });
            const ripple = container.firstElementChild as HTMLElement | null;
            // Keyboard and explicitly centered indications keep Paper's origin.
            if (ripple && !props.centered && !native.key && Number.isFinite(x) && Number.isFinite(y)) {
                ripple.style.left = Math.max(0, Math.min(bounds.width - inset.left - inset.right, x - inset.left)) + 'px';
                ripple.style.top = Math.max(0, Math.min(bounds.height - inset.top - inset.bottom, y - inset.top)) + 'px';
            } else if (ripple) {
                ripple.style.left = (bounds.width - inset.left - inset.right) / 2 + 'px';
                ripple.style.top = (bounds.height - inset.top - inset.bottom) / 2 + 'px';
            }
        });
    };
    return (
        <SettingsContext.Provider value={settings}>
            <PaperRipple
                {...webAccessibility({ role: props.accessibilityRole, state: props.accessibilityState, value: props.accessibilityValue })}
                {...props}
                onPressIn={press}
                onKeyDown={(event) => {
                    props.onKeyDown?.(event);
                    // RNW handles Enter for all roles, but Space only for button/menuitem.
                    // Selection controls retain their own semantics and activate on release.
                    if (
                        event.defaultPrevented ||
                        props.disabled ||
                        !['tab', 'checkbox', 'radio', 'switch', 'option', 'menuitemcheckbox', 'menuitemradio'].includes(props.accessibilityRole ?? '') ||
                        ![' ', 'Spacebar'].includes(event.nativeEvent.key)
                    )
                        return;
                    event.preventDefault();
                    event.stopPropagation();
                    if (spacePressed.current) return;
                    spacePressed.current = true;
                    onPressIn?.(event as unknown as Parameters<NonNullable<TouchableRippleProps['onPressIn']>>[0]);
                }}
                onKeyUp={(event) => {
                    props.onKeyUp?.(event);
                    if (!spacePressed.current || ![' ', 'Spacebar'].includes(event.nativeEvent.key)) return;
                    spacePressed.current = false;
                    event.preventDefault();
                    event.stopPropagation();
                    props.onPressOut?.(event as unknown as Parameters<NonNullable<TouchableRippleProps['onPressOut']>>[0]);
                    if (!props.disabled) props.onPress?.(event as unknown as Parameters<NonNullable<TouchableRippleProps['onPress']>>[0]);
                }}
                onBlur={(event) => {
                    spacePressed.current = false;
                    props.onBlur?.(event);
                }}
            />
        </SettingsContext.Provider>
    );
}
