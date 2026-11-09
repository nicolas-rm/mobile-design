import { useCallback, useEffect, useRef, type ComponentRef } from 'react';
import { Platform, type FlatList, type ScrollView } from 'react-native';
import {
    ReduceMotion,
    cancelAnimation,
    Easing,
    scrollTo,
    useAnimatedReaction,
    useAnimatedRef,
    useAnimatedScrollHandler,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

/**
 * Finger movement stays native. Button/focus navigation uses Flutter CarouselController's
 * documented 300ms / Curves.ease, instead of the platform-dependent scrollTo(animated:true).
 * https://api.flutter.dev/flutter/material/CarouselController/animateToItem.html
 */
export function useCarouselScrollController<Item>({
    maxOffset,
    vertical = false,
    rtl = false,
    animationScale,
    snapOffsets,
    interactive = true,
    onInterrupted,
    onSettled,
}: {
    maxOffset: number;
    vertical?: boolean;
    rtl?: boolean;
    animationScale: number;
    /** Native snap props are not implemented by RN Web. Use the same logical keylines. */
    snapOffsets?: readonly number[];
    interactive?: boolean;
    onInterrupted?: () => void;
    onSettled?: () => void;
}) {
    const ref = useAnimatedRef<ComponentRef<typeof ScrollView> | FlatList<Item>>();
    const offset = useSharedValue(0);
    const commandOffset = useSharedValue(0);
    const commandActive = useSharedValue(false);
    const revision = useSharedValue(0);
    const uiCommand = useSharedValue(0);
    const commandRevision = useRef(0);
    const requestedTarget = useRef<number | undefined>(undefined);
    const mounted = useRef(true);
    const webCleanup = useRef<(() => void) | undefined>(undefined);
    const notifyInterrupted = useCallback(
        (command: number, expectedRevision: number) => {
            if (mounted.current && commandRevision.current === command && revision.get() === expectedRevision) {
                requestedTarget.current = undefined;
                onInterrupted?.();
            }
        },
        [onInterrupted, revision]
    );
    const notifySettled = useCallback(
        (command: number, expectedRevision: number) => {
            if (mounted.current && commandRevision.current === command && revision.get() === expectedRevision) {
                requestedTarget.current = undefined;
                onSettled?.();
            }
        },
        [onSettled, revision]
    );
    const invalidateUI = useCallback(
        (command: number) => {
            'worklet';
            if (command < uiCommand.get()) return;
            uiCommand.set(command);
            revision.set(revision.get() + 1);
            commandActive.set(false);
            cancelAnimation(commandOffset);
        },
        [commandActive, commandOffset, revision, uiCommand]
    );
    const invalidate = useCallback(() => {
        const command = ++commandRevision.current;
        requestedTarget.current = undefined;
        scheduleOnUI(invalidateUI, command);
    }, [invalidateUI]);
    const isCurrentRequest = useCallback(
        (command: number) =>
            commandRevision.current === command &&
            // Pending RN commands are already current. Once UI applies one, a drag
            // can invalidate it before its interruption callback reaches RN.
            (uiCommand.get() !== command || commandActive.get()),
        [commandActive, uiCommand]
    );

    useAnimatedReaction(
        () => ({ active: commandActive.get(), position: commandOffset.get() }),
        ({ active, position }) => {
            if (!active) return;
            offset.set(position);
            scrollTo(ref, vertical ? 0 : rtl ? maxOffset - position : position, vertical ? position : 0, false);
        }
    );

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            if (commandActive.get()) return;
            const position = vertical ? event.contentOffset.y : rtl ? maxOffset - event.contentOffset.x : event.contentOffset.x;
            offset.set(Math.max(0, Math.min(maxOffset, position)));
        },
        onBeginDrag: () => {
            const nextRevision = revision.get() + 1;
            revision.set(nextRevision);
            commandActive.set(false);
            cancelAnimation(commandOffset);
            scheduleOnRN(notifyInterrupted, uiCommand.get(), nextRevision);
        },
        onMomentumEnd: (event) => {
            if (commandActive.get()) return;
            const position = vertical ? event.contentOffset.y : rtl ? maxOffset - event.contentOffset.x : event.contentOffset.x;
            offset.set(Math.max(0, Math.min(maxOffset, position)));
            scheduleOnRN(notifySettled, uiCommand.get(), revision.get());
        },
    });

    const startCommand = useCallback(
        (target: number, duration: number, command: number) => {
            'worklet';
            if (command < uiCommand.get()) return;
            uiCommand.set(command);
            const nextRevision = revision.get() + 1;
            revision.set(nextRevision);
            cancelAnimation(commandOffset);
            commandOffset.set(offset.get());
            commandActive.set(true);
            commandOffset.set(
                withTiming(
                    target,
                    {
                        reduceMotion: ReduceMotion.Never,
                        duration,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    },
                    (finished) => {
                        if (!finished || uiCommand.get() !== command || revision.get() !== nextRevision) return;
                        // Deliver the final command explicitly: changing active to false must not drop it.
                        scrollTo(ref, vertical ? 0 : rtl ? maxOffset - target : target, vertical ? target : 0, false);
                        offset.set(target);
                        commandActive.set(false);
                        scheduleOnRN(notifySettled, command, nextRevision);
                    }
                )
            );
        },
        [commandActive, commandOffset, maxOffset, notifySettled, offset, ref, revision, rtl, uiCommand, vertical]
    );
    const goTo = useCallback(
        (position: number, animate = true) => {
            if (!mounted.current) return commandRevision.current;
            const target = Math.max(0, Math.min(maxOffset, position));
            // RN owns an immediate command generation; UI owns the atomic animation
            // transaction. A pending UI write must not make the next button reuse an
            // old destination, nor allow an older RN completion to clear this request.
            const command = ++commandRevision.current;
            requestedTarget.current = target;
            scheduleOnUI(startCommand, target, animate ? 300 * animationScale : 0, command);
            return command;
        },
        [animationScale, maxOffset, startCommand]
    );

    // RN Web emits scroll, but not native drag/momentum callbacks or snapToOffsets.
    // Pointer/wheel interruption and settling use the same controller and keylines.
    const webOptions = useRef({ maxOffset, vertical, rtl, snapOffsets, interactive, goTo, onInterrupted, onSettled });
    webOptions.current = { maxOffset, vertical, rtl, snapOffsets, interactive, goTo, onInterrupted, onSettled };
    const attachRef = useCallback(
        (node: ComponentRef<typeof ScrollView> | FlatList<Item> | null) => {
            webCleanup.current?.();
            webCleanup.current = undefined;
            if (node === null) invalidate();
            ref(node);
            if (Platform.OS !== 'web' || !node) return;
            const handle = node as unknown as {
                getScrollableNode?: () => HTMLElement;
                getNativeScrollRef?: () => HTMLElement;
            };
            const element = handle.getScrollableNode?.() ?? handle.getNativeScrollRef?.() ?? (node as unknown as HTMLElement);
            if (typeof element.addEventListener !== 'function') return;
            let timer: ReturnType<typeof setTimeout> | undefined;
            let pointer: { id: number; x: number; y: number; start: number; dragged: boolean } | undefined;
            let suppressClick = false;
            const position = () => {
                const options = webOptions.current;
                const physical = options.vertical ? element.scrollTop : element.scrollLeft;
                return Math.max(0, Math.min(options.maxOffset, !options.vertical && options.rtl ? options.maxOffset - physical : physical));
            };
            const interrupt = () => {
                if (timer) clearTimeout(timer);
                invalidate();
                offset.set(position());
                webOptions.current.onInterrupted?.();
            };
            const settle = () => {
                if (commandActive.get() || pointer?.dragged) return;
                const value = position(),
                    options = webOptions.current;
                offset.set(value);
                const points = options.snapOffsets;
                const target = points?.reduce(
                    (nearest, point) => (Math.abs(point - value) < Math.abs(nearest - value) ? point : nearest),
                    points[0] ?? value
                );
                if (target !== undefined && Math.abs(target - value) > 0.5) options.goTo(target);
                else options.onSettled?.();
            };
            const scrolled = () => {
                if (timer) clearTimeout(timer);
                // Programmatic animation owns its completion and must not resnap mid-flight.
                if (!commandActive.get()) timer = setTimeout(settle, 120);
            };
            const down = (event: PointerEvent) => {
                if (!webOptions.current.interactive || event.pointerType !== 'mouse' || event.button !== 0) return;
                interrupt();
                suppressClick = false;
                pointer = {
                    id: event.pointerId,
                    x: event.clientX,
                    y: event.clientY,
                    start: webOptions.current.vertical ? element.scrollTop : element.scrollLeft,
                    dragged: false,
                };
            };
            const move = (event: PointerEvent) => {
                if (!pointer || pointer.id !== event.pointerId) return;
                const dx = event.clientX - pointer.x,
                    dy = event.clientY - pointer.y;
                const delta = webOptions.current.vertical ? dy : dx;
                const cross = webOptions.current.vertical ? dx : dy;
                if (!pointer.dragged) {
                    if (Math.abs(delta) < 8 || Math.abs(delta) <= Math.abs(cross)) return;
                    pointer.dragged = true;
                    suppressClick = true;
                    element.setPointerCapture(event.pointerId);
                }
                event.preventDefault();
                if (webOptions.current.vertical) element.scrollTop = pointer.start - delta;
                else element.scrollLeft = pointer.start - delta;
                offset.set(position());
            };
            const up = () => {
                const dragged = pointer?.dragged;
                if (pointer && element.hasPointerCapture(pointer.id)) element.releasePointerCapture(pointer.id);
                pointer = undefined;
                if (dragged) settle();
            };
            const click = (event: MouseEvent) => {
                if (!suppressClick) return;
                suppressClick = false;
                event.preventDefault();
                event.stopPropagation();
            };
            const touch = () => interrupt();
            element.addEventListener('wheel', interrupt, { passive: true });
            element.addEventListener('touchstart', touch, { passive: true });
            element.addEventListener('scroll', scrolled, { passive: true });
            element.addEventListener('pointerdown', down);
            element.addEventListener('pointermove', move);
            element.addEventListener('pointerup', up);
            element.addEventListener('pointercancel', up);
            element.addEventListener('click', click, true);
            webCleanup.current = () => {
                if (timer) clearTimeout(timer);
                element.removeEventListener('wheel', interrupt);
                element.removeEventListener('touchstart', touch);
                element.removeEventListener('scroll', scrolled);
                element.removeEventListener('pointerdown', down);
                element.removeEventListener('pointermove', move);
                element.removeEventListener('pointerup', up);
                element.removeEventListener('pointercancel', up);
                element.removeEventListener('click', click, true);
            };
        },
        [commandActive, invalidate, offset, ref]
    );

    useEffect(() => {
        // A preference change also finishes an animation that is already running.
        // Preserve the logical request generation: changing its motion must not
        // invalidate the destination used by a following RN button press.
        if (animationScale === 0 && requestedTarget.current !== undefined && isCurrentRequest(commandRevision.current)) {
            scheduleOnUI(startCommand, requestedTarget.current, 0, commandRevision.current);
        }
    }, [animationScale, isCurrentRequest, startCommand]);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            webCleanup.current?.();
            invalidate();
        };
    }, [invalidate]);

    return { ref: attachRef, offset, onScroll, goTo, isCurrentRequest };
}
