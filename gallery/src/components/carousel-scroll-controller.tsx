import { useCallback, useEffect, useRef, type ComponentRef } from 'react';
import { type FlatList, type ScrollView } from 'react-native';
import {
    cancelAnimation,
    Easing,
    scrollTo,
    useAnimatedReaction,
    useAnimatedRef,
    useAnimatedScrollHandler,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

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
    onInterrupted,
    onSettled,
}: {
    maxOffset: number;
    vertical?: boolean;
    rtl?: boolean;
    animationScale: number;
    onInterrupted?: () => void;
    onSettled?: () => void;
}) {
    const ref = useAnimatedRef<ComponentRef<typeof ScrollView> | FlatList<Item>>();
    const offset = useSharedValue(0);
    const commandOffset = useSharedValue(0);
    const commandActive = useSharedValue(false);
    const commandTarget = useSharedValue(0);
    const revision = useSharedValue(0);
    const mounted = useRef(true);
    const notifyInterrupted = useCallback(
        (expectedRevision: number) => {
            if (mounted.current && revision.get() === expectedRevision) onInterrupted?.();
        },
        [onInterrupted, revision]
    );
    const notifySettled = useCallback(
        (expectedRevision: number) => {
            if (mounted.current && revision.get() === expectedRevision) onSettled?.();
        },
        [onSettled, revision]
    );
    const attachRef = useCallback(
        (node: ComponentRef<typeof ScrollView> | FlatList<Item> | null) => {
            if (node === null) {
                revision.set(revision.get() + 1);
                commandActive.set(false);
                cancelAnimation(commandOffset);
            }
            ref(node);
        },
        [commandActive, commandOffset, ref, revision]
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
            scheduleOnRN(notifyInterrupted, nextRevision);
        },
        onMomentumEnd: (event) => {
            if (commandActive.get()) return;
            const position = vertical ? event.contentOffset.y : rtl ? maxOffset - event.contentOffset.x : event.contentOffset.x;
            offset.set(Math.max(0, Math.min(maxOffset, position)));
            scheduleOnRN(notifySettled, revision.get());
        },
    });

    const goTo = useCallback(
        (position: number, animate = true) => {
            const target = Math.max(0, Math.min(maxOffset, position));
            const nextRevision = revision.get() + 1;
            revision.set(nextRevision);
            cancelAnimation(commandOffset);
            commandOffset.set(offset.get());
            commandTarget.set(target);
            commandActive.set(true);
            commandOffset.set(
                withTiming(
                    target,
                    {
                        duration: animate ? 300 * animationScale : 0,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    },
                    (finished) => {
                        if (!finished) return;
                        // Deliver the final command explicitly: changing active to false must not drop it.
                        scrollTo(ref, vertical ? 0 : rtl ? maxOffset - target : target, vertical ? target : 0, false);
                        offset.set(target);
                        commandActive.set(false);
                        scheduleOnRN(notifySettled, nextRevision);
                    }
                )
            );
            return nextRevision;
        },
        [animationScale, commandActive, commandOffset, commandTarget, maxOffset, notifySettled, offset, ref, revision, rtl, vertical]
    );

    useEffect(() => {
        // A preference change also finishes an animation that is already running.
        if (animationScale === 0 && commandActive.get()) goTo(commandTarget.get(), false);
    }, [animationScale, commandActive, commandTarget, goTo]);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            revision.set(revision.get() + 1);
            cancelAnimation(commandOffset);
            commandActive.set(false);
        };
    }, [commandActive, commandOffset, revision]);

    return { ref: attachRef, offset, onScroll, goTo, revision };
}
