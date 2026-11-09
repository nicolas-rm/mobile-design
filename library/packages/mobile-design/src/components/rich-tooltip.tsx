import { cloneElement, useId, isValidElement, useRef, type ReactElement, type ReactNode, type ComponentProps } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text, useLocale } from 'react-native-paper';
import { useMobileTheme } from '../core';
import { Button } from './button';
import { AnchoredPopup } from './popup';
import type { ScrollIndicatorOptions } from '../scroll-indicators';
import { usePressScope } from './press-scope';
import { useTooltipTrigger } from './tooltip';

export type RichTooltipAction = { key: string; label: string; onPress: () => void; disabled?: boolean; keepOpen?: boolean };
export type RichTooltipProps = {
    scrollIndicators?: ScrollIndicatorOptions;
    anchor: ReactNode;
    visible?: boolean;
    onDismiss?: () => void;
    persistent?: boolean;
    title?: string;
    children: ReactNode;
    actions?: readonly RichTooltipAction[];
    maxWidth?: number;
    anchorPosition?: 'top' | 'bottom';
    dismissAccessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

/** Current rich tooltip, placed beyond its anchor with adaptive4dp separation. */
export function RichTooltip({
    scrollIndicators,
    anchor,
    visible,
    onDismiss,
    persistent = false,
    title,
    children,
    actions = [],
    maxWidth = 320,
    anchorPosition = 'bottom',
    dismissAccessibilityLabel = 'Cerrar ayuda',
    style,
    testID = 'mobile-rich-tooltip',
}: RichTooltipProps) {
    if (actions.length > 2) throw new RangeError('RichTooltip admite un máximo de dos acciones; usa otro componente para más opciones.');
    const theme = useMobileTheme();
    const { direction } = useLocale();
    const element = isValidElement(anchor) ? anchor : <View>{anchor}</View>;
    const descriptionId = useId();
    const contentRef = useRef<React.ComponentRef<typeof View>>(null);
    const anchorElement = useRef<HTMLElement | null>(null);
    const trigger = useTooltipTrigger(element as ReactElement, { persistent, visible, onDismiss });
    const canAct = usePressScope(!trigger.visible, JSON.stringify(actions.map((action) => [action.key, action.disabled])));
    const latestActions = useRef(actions);
    latestActions.current = actions;
    const focusable = (root: ParentNode) =>
        Array.from(root.querySelectorAll<HTMLElement>('[tabindex],button,a[href],input,textarea')).filter(
            (node) =>
                node.tabIndex >= 0 &&
                node.getAttribute('aria-disabled') !== 'true' &&
                !node.closest('[inert]') &&
                node.getClientRects().length > 0
        );
    const popupKey: NonNullable<ComponentProps<typeof View>['onKeyDown']> = (event) => {
        if (event.nativeEvent.key !== 'Tab' || !trigger.visible) return;
        const host = contentRef.current as unknown as HTMLElement | null;
        if (!host) return;
        const targets = focusable(host),
            first = targets[0],
            last = targets.at(-1);
        const target = event.target as unknown as HTMLElement;
        if (event.nativeEvent.shiftKey && first?.contains(target)) {
            event.preventDefault();
            anchorElement.current?.focus();
        } else if (!event.nativeEvent.shiftKey && last?.contains(target) && anchorElement.current) {
            const page = focusable(document).filter((node) => !host.contains(node));
            const next = page[page.indexOf(anchorElement.current) + 1];
            if (next) {
                event.preventDefault();
                next.focus();
                trigger.dismiss();
            }
        }
    };
    return (
        <AnchoredPopup
            scrollIndicators={scrollIndicators}
            anchor={
                Platform.OS === 'web'
                    ? cloneElement(trigger.anchor as ReactElement<Record<string, unknown>>, {
                          onFocus: (event: Parameters<NonNullable<ComponentProps<typeof View>['onFocus']>>[0]) => {
                              anchorElement.current = event.currentTarget as unknown as HTMLElement;
                              (trigger.anchor.props as { onFocus?: (event: unknown) => void }).onFocus?.(event);
                          },
                          onKeyDown: (event: Parameters<NonNullable<ComponentProps<typeof View>['onKeyDown']>>[0]) => {
                              (element.props as { onKeyDown?: typeof popupKey }).onKeyDown?.(event);
                              if (
                                  event.defaultPrevented ||
                                  event.nativeEvent.key !== 'Tab' ||
                                  event.nativeEvent.shiftKey ||
                                  !trigger.visible
                              )
                                  return;
                              const host = contentRef.current as unknown as HTMLElement | null;
                              const first = host && focusable(host)[0];
                              if (first) {
                                  anchorElement.current = event.currentTarget as unknown as HTMLElement;
                                  event.preventDefault();
                                  first.focus();
                              }
                          },
                          'aria-describedby':
                              [(element.props as Record<string, unknown>)['aria-describedby'], trigger.visible ? descriptionId : null]
                                  .filter(Boolean)
                                  .join(' ') || undefined,
                      })
                    : trigger.anchor
            }
            visible={trigger.visible}
            onDismiss={trigger.dismiss}
            placement={anchorPosition === 'top' ? 'tooltip-above' : 'tooltip-below'}
            gap={4}
            width={Math.max(40, Math.min(320, maxWidth))}
            elevation={2}
            modal={false}
            presentation="portal"
            dismissOnOutside={persistent}
            contentStyle={[{ backgroundColor: theme.colors.surfaceContainer, borderRadius: 12 }, style]}
            accessibilityLabel={dismissAccessibilityLabel}
            testID={testID}
        >
            <View
                ref={contentRef}
                {...(Platform.OS === 'web' ? { onKeyDown: popupKey } : {})}
                {...trigger.contentEvents}
                nativeID={descriptionId}
                {...(Platform.OS === 'web' ? { role: 'tooltip' as const } : {})}
                style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}
            >
                {title ? (
                    <Text accessibilityRole="header" variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
                        {title}
                    </Text>
                ) : null}
                {typeof children === 'string' ? (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {children}
                    </Text>
                ) : (
                    children
                )}
                {actions.length ? (
                    <View
                        style={{
                            direction: 'ltr',
                            flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                            justifyContent: 'flex-start',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginTop: 12,
                        }}
                    >
                        {actions.map((action) => (
                            <Button
                                key={action.key}
                                variant="text"
                                disabled={action.disabled || !trigger.visible}
                                onPress={() => {
                                    const latest = latestActions.current.find((entry) => entry.key === action.key);
                                    if (!canAct() || !latest || latest.disabled) return;
                                    if (!latest.keepOpen) trigger.dismiss();
                                    latest.onPress();
                                }}
                                testID={`${testID}-${action.key}`}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </View>
                ) : null}
            </View>
        </AnchoredPopup>
    );
}
