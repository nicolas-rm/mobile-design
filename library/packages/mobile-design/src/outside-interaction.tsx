import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { Platform, View } from 'react-native';

type Point = { x: number; y: number };
type Listener = (point: Point) => void;
const OutsideInteractions = createContext<Set<Listener> | null>(null);

/** Observe native window touches without taking the responder from the actual control. */
export function OutsideInteractionBoundary({ children }: { children: ReactNode }) {
    const listeners = useRef(new Set<Listener>());
    if (Platform.OS === 'web') return children;
    return (
        <OutsideInteractions.Provider value={listeners.current}>
            <View
                style={{ flex: 1 }}
                onTouchStart={(event) => {
                    const { pageX: x, pageY: y } = event.nativeEvent;
                    for (const notify of [...listeners.current]) notify({ x, y });
                }}
            >
                {children}
            </View>
        </OutsideInteractions.Provider>
    );
}

export function useOutsideInteraction(enabled: boolean, notify: Listener) {
    const listeners = useContext(OutsideInteractions);
    const latest = useRef(notify);
    latest.current = notify;
    useEffect(() => {
        if (!enabled || !listeners) return;
        const listener: Listener = (point) => latest.current(point);
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, [enabled, listeners]);
}
