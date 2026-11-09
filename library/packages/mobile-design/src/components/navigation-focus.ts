import { useRef } from 'react';

export type NavigationFocusEvent = {
    key?: string;
    nativeEvent?: { key?: string };
    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    preventDefault?: () => void;
};
type FocusTarget = { focus?: () => void };

/** Vertical navigation moves focus separately from activation and skips unavailable destinations. */
export function useNavigationFocus(items: readonly { key: string; disabled?: boolean }[]) {
    const targets = useRef(new Map<string, FocusTarget>());
    return {
        focusFirst: () => {
            const first = items.find((item) => !item.disabled);
            if (first) targets.current.get(first.key)?.focus?.();
        },
        refFor: (key: string) => (target: unknown) => {
            if (target) targets.current.set(key, target as FocusTarget);
            else targets.current.delete(key);
        },
        onKeyDown: (current: string, event: NavigationFocusEvent) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            const key = event.nativeEvent?.key ?? event.key;
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key ?? '')) return;
            const enabled = items.filter((item) => !item.disabled);
            if (!enabled.length) return;
            const index = Math.max(
                0,
                enabled.findIndex((item) => item.key === current)
            );
            const next =
                key === 'Home'
                    ? 0
                    : key === 'End'
                      ? enabled.length - 1
                      : Math.max(0, Math.min(enabled.length - 1, index + (key === 'ArrowDown' ? 1 : -1)));
            event.preventDefault?.();
            targets.current.get(enabled[next].key)?.focus?.();
        },
    };
}
