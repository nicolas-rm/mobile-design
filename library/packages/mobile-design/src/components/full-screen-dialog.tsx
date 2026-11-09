import { getScrollIndicatorProps, type ScrollIndicatorOptions } from '../scroll-indicators';
import { NativeModal as Modal } from '../native-modal';
import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Surface, Text, ThemeProvider, useLocale } from 'react-native-paper';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobileTheme } from '../core';
import { PaperMotionBridge } from '../paper-motion-bridge';
import { Button } from './button';
import { IconButton } from './icon-button';
import { ContainerTransformSurface, useContainerTransformPresence, type ContainerTransformOrigin } from './container-transform';

export type FullScreenDialogProps = {
    /** Scrollbars are opt-in for this component only; both axes are hidden by default. */
    scrollIndicators?: ScrollIndicatorOptions;
    visible: boolean;
    title: string;
    onDismiss: () => void;
    onClosed?: () => void;
    /** Optional measured source for a shared-container enter/return transition. */
    transitionOrigin?: ContainerTransformOrigin;
    /** Keep a pending save on screen and disable every dismissal control. */
    dismissible?: boolean;
    onConfirm?: () => void;
    confirmLabel?: string;
    confirmDisabled?: boolean;
    children: ReactNode;
    /** Decorative background behind the header and content. */
    backgroundContent?: ReactNode;
    /** Disable when the content owns its scrolling (for example a vertical carousel). */
    scrollable?: boolean;
    accessibilityLabel?: string;
    closeAccessibilityLabel?: string;
    testID?: string;
};

/** Compact full-screen task dialog; medium/expanded windows adapt to a560dp modal. */
export function FullScreenDialog({
    scrollIndicators,
    visible,
    title,
    onDismiss,
    onClosed,
    transitionOrigin,
    dismissible = true,
    onConfirm,
    confirmLabel = 'Guardar',
    confirmDisabled = false,
    children,
    backgroundContent,
    scrollable = true,
    accessibilityLabel = title,
    closeAccessibilityLabel = 'Cerrar diálogo',
    testID = 'mobile-full-screen-dialog',
}: FullScreenDialogProps) {
    const theme = useMobileTheme();
    const { direction } = useLocale();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const compact = window.width < 600;
    const outerMargin = window.width >= 840 ? 56 : 24;
    const availableHeight = Math.max(1, window.height - insets.top - insets.bottom - outerMargin * 2);
    const [contentHeight, setContentHeight] = useState(0);
    const [headerHeight, setHeaderHeight] = useState(56);
    const height = !scrollable || contentHeight === 0 ? availableHeight : Math.min(availableHeight, headerHeight + contentHeight);
    const { present, progress, origin, transforming, measured } = useContainerTransformPresence(visible, transitionOrigin, theme, onClosed);
    useEffect(() => {
        if (!visible && present) Keyboard.dismiss();
    }, [present, visible]);
    const scrim = useAnimatedStyle(() => ({ opacity: progress.get() * 0.32 }));
    if (!present) return null;
    const dismiss = () => {
        if (!visible || !dismissible) return;
        Keyboard.dismiss();
        onDismiss();
    };
    return (
        <Modal
            {...(Platform.OS === 'web' ? { accessibilityLabel } : {})}
            transparent
            animationType="none"
            visible
            onRequestClose={dismiss}
            webDismissOnKeyDown
            statusBarTranslucent
            navigationBarTranslucent
        >
            {!compact || transforming ? (
                <>
                    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.scrim }, scrim]} />
                    {Platform.OS === 'web' ? (
                        <View aria-hidden {...{ onClick: dismiss }} style={StyleSheet.absoluteFill} testID={`${testID}-scrim`} />
                    ) : (
                        <Pressable
                            accessible={false}
                            onPress={dismiss}
                            disabled={!visible || !dismissible}
                            style={StyleSheet.absoluteFill}
                            testID={`${testID}-scrim`}
                        />
                    )}
                </>
            ) : null}
            <KeyboardAvoidingView
                pointerEvents="box-none"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: compact ? 0 : insets.top + outerMargin,
                    paddingBottom: compact ? 0 : insets.bottom + outerMargin,
                    paddingLeft: compact ? 0 : insets.left + outerMargin,
                    paddingRight: compact ? 0 : insets.right + outerMargin,
                }}
            >
                <Animated.View
                    {...(Platform.OS === 'web' ? { 'aria-hidden': !visible, inert: !visible } : {})}
                    pointerEvents={visible ? 'auto' : 'none'}
                    accessibilityLabel={accessibilityLabel}
                    accessibilityElementsHidden={!visible}
                    importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
                    accessibilityViewIsModal
                    onAccessibilityEscape={dismiss}
                    style={[{ width: '100%', flexShrink: 1, maxHeight: '100%', ...(compact ? { flex: 1 } : { maxWidth: 560, height }) }]}
                    testID={testID}
                >
                    <ThemeProvider theme={theme}>
                        <PaperMotionBridge>
                            <ContainerTransformSurface
                                origin={origin}
                                transforming={transforming}
                                entering={visible}
                                progress={progress}
                                onMeasured={measured}
                                borderRadius={compact ? 0 : 28}
                                backgroundColor={theme.colors.surfaceContainerHigh}
                                fill
                                testID={`${testID}-container-transform`}
                            >
                                <Surface
                                    elevation={compact ? 0 : 3}
                                    mode="flat"
                                    style={{
                                        flex: 1,
                                        minHeight: 0,
                                        backgroundColor: theme.colors.surfaceContainerHigh,
                                        borderRadius: compact ? 0 : 28,
                                        overflow: 'hidden',
                                        paddingTop: compact ? insets.top : 0,
                                        paddingBottom: compact ? insets.bottom : 0,
                                        paddingLeft: compact ? insets.left : 0,
                                        paddingRight: compact ? insets.right : 0,
                                    }}
                                >
                                    {backgroundContent ? (
                                        <View
                                            pointerEvents="none"
                                            accessible={false}
                                            accessibilityElementsHidden
                                            importantForAccessibility="no-hide-descendants"
                                            style={StyleSheet.absoluteFill}
                                        >
                                            {backgroundContent}
                                        </View>
                                    ) : null}
                                    <View
                                        onLayout={(event) => setHeaderHeight(Math.ceil(event.nativeEvent.layout.height))}
                                        style={{
                                            minHeight: 56,
                                            direction: 'ltr',
                                            flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                                            alignItems: 'center',
                                            paddingHorizontal: 4,
                                            gap: 8,
                                        }}
                                        testID={`${testID}-header`}
                                    >
                                        <IconButton
                                            icon="close"
                                            iconColor={theme.colors.onSurface}
                                            accessibilityLabel={closeAccessibilityLabel}
                                            onPress={dismiss}
                                            disabled={!visible || !dismissible}
                                            testID={`${testID}-close`}
                                        />
                                        <Text
                                            numberOfLines={1}
                                            variant="titleLarge"
                                            accessibilityRole="header"
                                            style={{
                                                flex: 1,
                                                color: theme.colors.onSurface,
                                                textAlign: direction === 'rtl' ? 'right' : 'left',
                                            }}
                                        >
                                            {title}
                                        </Text>
                                        {onConfirm ? (
                                            <Button
                                                variant="text"
                                                disabled={confirmDisabled || !visible}
                                                onPress={() => {
                                                    if (visible && !confirmDisabled) onConfirm();
                                                }}
                                                testID={`${testID}-confirm`}
                                            >
                                                {confirmLabel}
                                            </Button>
                                        ) : null}
                                    </View>
                                    {scrollable ? (
                                        <ScrollView
                                            style={{ flex: 1, minHeight: 0 }}
                                            keyboardShouldPersistTaps="handled"
                                            contentContainerStyle={{ padding: 24 }}
                                            onContentSizeChange={(_, height) => setContentHeight(Math.ceil(height))}
                                            {...getScrollIndicatorProps(scrollIndicators)}
                                        >
                                            <View>{children}</View>
                                        </ScrollView>
                                    ) : (
                                        <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
                                    )}
                                </Surface>
                            </ContainerTransformSurface>
                        </PaperMotionBridge>
                    </ThemeProvider>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
