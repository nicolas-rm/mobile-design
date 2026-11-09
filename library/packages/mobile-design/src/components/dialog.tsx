import { NativeModal as Modal } from '../native-modal';
import {
    Children,
    Fragment,
    cloneElement,
    createContext,
    isValidElement,
    useContext,
    useState,
    type ComponentProps,
    type ReactNode,
} from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions,
    type ColorValue,
    type StyleProp,
    type ViewProps,
    type ViewStyle,
} from 'react-native';
import { Icon, Surface, Text, ThemeProvider, useLocale, type DialogProps as PaperDialogProps } from 'react-native-paper';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobileTheme } from '../core';
import { PaperMotionBridge } from '../paper-motion-bridge';
import { FullScreenDialog } from './full-screen-dialog';
import { ContainerTransformSurface, useContainerTransformPresence, type ContainerTransformOrigin } from './container-transform';

export type DialogProps = Omit<PaperDialogProps, 'style'> & {
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
    onClosed?: () => void;
    transitionOrigin?: ContainerTransformOrigin;
    position?: { horizontal?: 'start' | 'center' | 'end'; vertical?: 'top' | 'center' | 'bottom' };
};
const DialogContext = createContext({ withIcon: false, visible: true });
type PartProps = ViewProps & { children: ReactNode };

function DialogTitle({ children, style, ...props }: ComponentProps<typeof Text>) {
    const theme = useMobileTheme();
    const { withIcon } = useContext(DialogContext);
    const { direction } = useLocale();
    return (
        <Text
            {...props}
            accessibilityRole={props.accessibilityRole ?? 'header'}
            variant="headlineSmall"
            style={[{ color: theme.colors.onSurface, textAlign: withIcon ? 'center' : direction === 'rtl' ? 'right' : 'left' }, style]}
        >
            {children}
        </Text>
    );
}

/** Change supporting text without recoloring labels inside interactive components. */
function supportingText(children: ReactNode, color: ColorValue): ReactNode {
    return Children.map(children, (child) => {
        if (typeof child === 'string' || typeof child === 'number')
            return (
                <Text variant="bodyMedium" style={{ color }}>
                    {child}
                </Text>
            );
        if (!isValidElement<{ children?: ReactNode; style?: ComponentProps<typeof Text>['style'] }>(child)) return child;
        if (child.type === Text) return cloneElement(child, { style: [{ color }, child.props.style] });
        if (child.type === View || child.type === Fragment)
            return cloneElement(child, { children: supportingText(child.props.children, color) });
        return child;
    });
}
function DialogContent({ children, style, ...props }: PartProps) {
    const theme = useMobileTheme();
    return (
        <View {...props} style={style}>
            {supportingText(children, theme.colors.onSurfaceVariant)}
        </View>
    );
}
function DialogIcon({
    icon,
    color,
    size = 24,
    style,
    ...props
}: Omit<ComponentProps<typeof Icon>, 'source' | 'size'> & {
    icon: ComponentProps<typeof Icon>['source'];
    size?: number;
    style?: StyleProp<ViewStyle>;
}) {
    const theme = useMobileTheme();
    return (
        <View
            {...props}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[{ alignItems: 'center' }, style]}
        >
            <Icon source={icon} color={color ?? theme.colors.secondary} size={size} />
        </View>
    );
}
function DialogScrollArea({ children, style, ...props }: PartProps) {
    const theme = useMobileTheme();
    return (
        <View
            {...props}
            style={[
                { flexShrink: 1, marginHorizontal: -24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.outlineVariant },
                style,
            ]}
        >
            <View style={{ flexShrink: 1, paddingHorizontal: 24 }}>{children}</View>
        </View>
    );
}

function DialogActions({ children, style, ...props }: PartProps) {
    const { direction } = useLocale();
    const { fontScale } = useWindowDimensions();
    const { visible } = useContext(DialogContext);
    const [available, setAvailable] = useState(0);
    const [widths, setWidths] = useState<Record<string, number>>({});
    const actions = Children.toArray(children);
    const keys = actions.map((child, index) => {
        const label = isValidElement<{ children?: ReactNode }>(child) ? child.props.children : child;
        return JSON.stringify([
            isValidElement(child) ? (child.key ?? index) : index,
            typeof label === 'string' || typeof label === 'number' ? label : 'node',
            fontScale,
        ]);
    });
    const ready = available > 0 && keys.every((key) => widths[key] != null);
    const stacked = ready && keys.reduce((sum, key) => sum + widths[key], 0) + Math.max(0, actions.length - 1) * 8 > available + 0.5;
    const ordered = actions.map((child, index) => ({ child, key: keys[index] }));
    if (stacked) ordered.reverse(); // Confirm is last horizontally and first vertically.
    return (
        <View
            {...props}
            onLayout={(event) => {
                setAvailable(event.nativeEvent.layout.width);
                props.onLayout?.(event);
            }}
            style={[
                {
                    alignSelf: 'stretch',
                    direction: 'ltr',
                    flexDirection: stacked ? 'column' : direction === 'rtl' ? 'row-reverse' : 'row',
                    alignItems: stacked ? (direction === 'rtl' ? 'flex-start' : 'flex-end') : 'center',
                    justifyContent: 'flex-end',
                    gap: 8,
                    opacity: ready ? 1 : 0,
                },
                style,
            ]}
        >
            {ordered.map(({ child, key }) => (
                <View
                    key={key}
                    onLayout={(event) => {
                        // Keep the intrinsic widths used to decide stacking.
                        // Measuring constrained rows would immediately undo it.
                        if (stacked) return;
                        const measured = event.nativeEvent.layout.width;
                        setWidths((previous) => (previous[key] === measured ? previous : { ...previous, [key]: measured }));
                    }}
                    style={{ flexShrink: 0, maxWidth: stacked ? '100%' : undefined }}
                >
                    {isValidElement<{ compact?: boolean; uppercase?: boolean; variant?: string; disabled?: boolean }>(child)
                        ? cloneElement(child, {
                              compact: true,
                              uppercase: false,
                              variant: child.props.variant ?? 'text',
                              disabled: !visible || child.props.disabled,
                          })
                        : child}
                </View>
            ))}
        </View>
    );
}

function containsIcon(children: ReactNode): boolean {
    return Children.toArray(children).some(
        (child) => isValidElement<{ children?: ReactNode }>(child) && (child.type === DialogIcon || containsIcon(child.props.children))
    );
}

/** M3 basic dialog: one24dp inset, fixed title/actions and optional scrolling content. */
function DialogRoot({
    visible,
    onDismiss,
    onClosed,
    transitionOrigin,
    dismissable = true,
    dismissableBackButton = dismissable,
    children,
    style,
    theme: override,
    accessibilityLabel,
    position,
    testID = 'mobile-dialog',
}: DialogProps) {
    const theme = useMobileTheme(override);
    const insets = useSafeAreaInsets();
    const { direction } = useLocale();
    const window = useWindowDimensions();
    const outerMargin = window.width >= 840 ? 56 : 24;
    const { present, progress, origin, transforming, measured } = useContainerTransformPresence(visible, transitionOrigin, theme, onClosed);
    const scrim = useAnimatedStyle(() => ({ opacity: progress.get() * 0.32 }));
    if (!present) return null;
    const dismissOutside = () => {
        if (visible && dismissable) onDismiss?.();
    };
    const dismissBack = () => {
        if (visible && dismissableBackButton) onDismiss?.();
    };
    const parts = Children.toArray(children).filter((child) => child != null && typeof child !== 'boolean');
    const title = parts.find((child) => isValidElement(child) && child.type === DialogTitle);
    const titleText =
        isValidElement<{ children?: ReactNode }>(title) &&
        (typeof title.props.children === 'string' || typeof title.props.children === 'number')
            ? String(title.props.children)
            : undefined;
    const availableWidth = Math.max(1, window.width - outerMargin * 2 - insets.left - insets.right);
    const dialogStyle = StyleSheet.flatten(style);
    return (
        <Modal transparent visible animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={dismissBack} webDismissOnKeyDown>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.scrim }, scrim]} />
            {Platform.OS === 'web' ? (
                <View aria-hidden {...{ onClick: dismissOutside }} style={StyleSheet.absoluteFill} testID={`${testID}-scrim`} />
            ) : (
                <Pressable
                    accessible={false}
                    disabled={!dismissable || !visible}
                    onPress={dismissOutside}
                    style={StyleSheet.absoluteFill}
                    testID={`${testID}-scrim`}
                />
            )}
            <KeyboardAvoidingView
                pointerEvents="box-none"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{
                    flex: 1,
                    direction: 'ltr',
                    justifyContent: position?.vertical === 'top' ? 'flex-start' : position?.vertical === 'bottom' ? 'flex-end' : 'center',
                    alignItems:
                        !position?.horizontal || position.horizontal === 'center'
                            ? 'center'
                            : (position.horizontal === 'end') !== (direction === 'rtl')
                              ? 'flex-end'
                              : 'flex-start',
                    paddingLeft: outerMargin + insets.left,
                    paddingRight: outerMargin + insets.right,
                    paddingTop: outerMargin + insets.top,
                    paddingBottom: outerMargin + insets.bottom,
                }}
            >
                <Animated.View
                    accessibilityElementsHidden={!visible}
                    importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
                    accessibilityViewIsModal
                    accessibilityLabel={accessibilityLabel ?? titleText}
                    {...(Platform.OS === 'web' ? { role: 'alertdialog' as const, 'aria-hidden': !visible, inert: !visible } : {})}
                    onAccessibilityEscape={dismissBack}
                    pointerEvents={visible ? 'auto' : 'none'}
                    style={[{ width: '100%', maxWidth: 560, minWidth: Math.min(280, availableWidth), maxHeight: '100%', flexShrink: 1 }]}
                    testID={testID}
                >
                    <ThemeProvider theme={theme}>
                        <PaperMotionBridge>
                            <DialogContext.Provider value={{ withIcon: containsIcon(children), visible }}>
                                <ContainerTransformSurface
                                    origin={origin}
                                    transforming={transforming}
                                    entering={visible}
                                    progress={progress}
                                    onMeasured={measured}
                                    borderRadius={
                                        typeof dialogStyle?.borderRadius === 'number' && Number.isFinite(dialogStyle.borderRadius)
                                            ? dialogStyle.borderRadius
                                            : 28
                                    }
                                    backgroundColor={
                                        typeof dialogStyle?.backgroundColor === 'string'
                                            ? dialogStyle.backgroundColor
                                            : theme.colors.surfaceContainerHigh
                                    }
                                    maxHeight={Math.max(1, window.height - outerMargin * 2 - insets.top - insets.bottom)}
                                    testID={`${testID}-container-transform`}
                                >
                                    <Surface
                                        elevation={3}
                                        mode="flat"
                                        style={[
                                            {
                                                borderRadius: 28,
                                                backgroundColor: theme.colors.surfaceContainerHigh,
                                                flexShrink: 1,
                                                padding: 24,
                                            },
                                            style,
                                        ]}
                                    >
                                        {parts.map((child, index) => (
                                            <View
                                                key={isValidElement(child) ? (child.key ?? index) : index}
                                                style={{
                                                    flexShrink: isValidElement(child) && child.type === DialogScrollArea ? 1 : 0,
                                                    marginTop:
                                                        index === 0 ? 0 : isValidElement(child) && child.type === DialogActions ? 24 : 16,
                                                }}
                                            >
                                                {child}
                                            </View>
                                        ))}
                                    </Surface>
                                </ContainerTransformSurface>
                            </DialogContext.Provider>
                        </PaperMotionBridge>
                    </ThemeProvider>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

export const Dialog = Object.assign(DialogRoot, {
    Title: DialogTitle,
    Content: DialogContent,
    Actions: DialogActions,
    Icon: DialogIcon,
    ScrollArea: DialogScrollArea,
    FullScreen: FullScreenDialog,
});
