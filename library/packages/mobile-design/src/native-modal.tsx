/// <reference path="./paper-internals.d.ts" />
import { useContext, type ComponentProps } from 'react';
import { Modal as RNModal, Platform } from 'react-native';
import { Portal, ThemeProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReduceMotionContext } from 'react-native-paper/lib/module/theme/accessibility/ReduceMotionContext';
import { OutsideInteractionBoundary } from './outside-interaction';
import { useMobileTheme } from './core';

type NativeModalProps = ComponentProps<typeof RNModal> & { webDismissOnKeyDown?: boolean };

/** A Portal must target the current native window, rather than a host behind it. */
export function NativeModal({ children, onRequestClose, webDismissOnKeyDown, ...props }: NativeModalProps) {
    const theme = useMobileTheme();
    const reduced = useContext(ReduceMotionContext) || theme.animation.scale === 0;
    const handleEscapeOnKeyDown = Platform.OS === 'web' && webDismissOnKeyDown;
    // Nested menus handle Escape on keydown. RNW's default keyup would also close their dialog.
    const dismissOnEscape: NonNullable<NativeModalProps['onKeyDown']> = (event) => {
        const modal = event.currentTarget as unknown as HTMLElement;
        const keyboard = event.nativeEvent as KeyboardEvent;
        if (
            keyboard.key !== 'Escape' ||
            event.defaultPrevented ||
            keyboard.repeat ||
            modal.getAttribute('role') !== 'dialog' ||
            !modal.contains(event.target as unknown as Node)
        )
            return;
        event.preventDefault();
        event.stopPropagation();
        onRequestClose?.(event as unknown as Parameters<NonNullable<NativeModalProps['onRequestClose']>>[0]);
    };
    return (
        <RNModal
            {...props}
            onRequestClose={handleEscapeOnKeyDown ? undefined : onRequestClose}
            {...(handleEscapeOnKeyDown ? { onKeyDown: dismissOnEscape } : {})}
        >
            <ThemeProvider theme={theme}>
                <ReduceMotionContext.Provider value={reduced}>
                    <OutsideInteractionBoundary>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                            <Portal.Host>{children}</Portal.Host>
                        </GestureHandlerRootView>
                    </OutsideInteractionBoundary>
                </ReduceMotionContext.Provider>
            </ThemeProvider>
        </RNModal>
    );
}
