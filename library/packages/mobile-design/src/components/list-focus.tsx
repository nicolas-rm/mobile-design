import { createContext, useCallback, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { orderFocusTargets } from './focus-order';

type FocusNode = {
    disabled?: boolean;
    tabIndex: number;
    ownerDocument?: { activeElement?: unknown };
    focus: () => void;
    contains: (node: unknown) => boolean;
    closest: (selector: string) => FocusNode | null;
    querySelectorAll: (selector: string) => ArrayLike<FocusNode>;
    getClientRects: () => ArrayLike<unknown>;
    getAttribute: (name: string) => string | null;
    setAttribute: (name: string, value: string) => void;
    removeAttribute: (name: string) => void;
};
type ListTarget = {
    node: () => unknown;
    primary: () => unknown;
    disabled: () => boolean;
    selected: () => boolean;
    actionable: () => boolean;
};
type KeyboardEvent = {
    nativeEvent: { key?: string; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; isComposing?: boolean };
    defaultPrevented?: boolean;
    preventDefault: () => void;
    stopPropagation: () => void;
};
type ListFocus = {
    register: (id: string, target: ListTarget) => () => void;
    refresh: () => void;
    onKeyDown: (event: KeyboardEvent) => void;
};
export const ListFocusContext = createContext<ListFocus | null>(null);
export type ListCollectionProps = { children: ReactNode };

const itemSelector = '[data-mobile-design-list-item]';
const focusSelector = 'button,[href],input,select,textarea,[tabindex]';
const ownsArrowKeys =
    'input,select,textarea,[contenteditable="true"],[role="textbox"],[role="slider"],[role="menu"],[role="listbox"],[role="combobox"],[role="tablist"],[role="radiogroup"]';

/** Explicit focus boundary, without a host that changes layout, list refs or gesture ownership. */
export function ListCollection({ children }: ListCollectionProps) {
    const targets = useRef(new Map<string, ListTarget>());
    const originalTabIndices = useRef(new Map<FocusNode, string | null>());
    const observer = useRef<{ observe: (node: unknown, options: unknown) => void; disconnect: () => void } | undefined>(undefined);
    const observeOptions = useMemo(
        () => ({
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'aria-disabled', 'aria-hidden', 'hidden'],
        }),
        []
    );
    const nodes = useCallback(() => {
        if (Platform.OS !== 'web') return [];
        return orderFocusTargets([...targets.current.values()]).flatMap((target) => {
            const row = target.node() as FocusNode | null;
            if (!row?.querySelectorAll || target.disabled()) return [];
            return Array.from(row.querySelectorAll(focusSelector))
                .filter((node) => {
                    const initial = originalTabIndices.current.get(node);
                    return (
                        node.closest(itemSelector) === row &&
                        (node !== target.primary() || target.actionable()) &&
                        !node.disabled &&
                        !node.closest('[aria-hidden="true"],[aria-disabled="true"],[inert]') &&
                        node.getClientRects().length > 0 &&
                        (originalTabIndices.current.has(node) ? initial === null || Number(initial) >= 0 : node.tabIndex >= 0)
                    );
                })
                .map((node) => ({ node, selected: target.selected(), primary: node === target.primary() }));
        });
    }, []);
    const refresh = useCallback(() => {
        if (Platform.OS !== 'web') return;
        const available = nodes();
        const active = available[0]?.node.ownerDocument?.activeElement;
        const entry =
            available.find(({ node }) => node === active) ?? available.find(({ selected, primary }) => selected && primary) ?? available[0];
        const currentNodes = new Set(available.map(({ node }) => node));
        for (const [node, initial] of originalTabIndices.current) {
            if (![...targets.current.values()].some((target) => (target.node() as FocusNode | null)?.contains?.(node))) {
                if (initial === null) node.removeAttribute('tabindex');
                else node.setAttribute('tabindex', initial);
                originalTabIndices.current.delete(node);
            } else if (!currentNodes.has(node) && node.getAttribute('tabindex') !== '-1') node.setAttribute('tabindex', '-1');
        }
        for (const { node } of available) {
            if (!originalTabIndices.current.has(node)) originalTabIndices.current.set(node, node.getAttribute('tabindex'));
            const next = node === entry?.node ? '0' : '-1';
            if (node.getAttribute('tabindex') !== next) node.setAttribute('tabindex', next);
        }
    }, [nodes]);
    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (Platform.OS !== 'web') return;
            const { key, altKey, ctrlKey, metaKey, isComposing } = event.nativeEvent;
            if (
                event.defaultPrevented ||
                altKey ||
                ctrlKey ||
                metaKey ||
                isComposing ||
                !['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key ?? '')
            )
                return;
            const available = nodes();
            const active = available[0]?.node.ownerDocument?.activeElement as FocusNode | null;
            if (!active?.closest) return;
            const nestedControl = active.closest(ownsArrowKeys);
            if (nestedControl && active.closest(itemSelector)?.contains(nestedControl)) return;
            const index = available.findIndex(({ node }) => node === active);
            if (index < 0) return;
            const next =
                key === 'Home'
                    ? 0
                    : key === 'End'
                      ? available.length - 1
                      : (index + (key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 1) + available.length) % available.length;
            event.preventDefault();
            event.stopPropagation();
            available[next].node.focus();
            refresh();
        },
        [nodes, refresh]
    );
    const context = useMemo<ListFocus>(
        () => ({
            register: (id, target) => {
                targets.current.set(id, target);
                const row = target.node();
                if (row) observer.current?.observe(row, observeOptions);
                refresh();
                return () => {
                    targets.current.delete(id);
                    // Virtualized rows must not remain retained by MutationObserver.
                    observer.current?.disconnect();
                    for (const remaining of targets.current.values()) {
                        const node = remaining.node();
                        if (node) observer.current?.observe(node, observeOptions);
                    }
                    refresh();
                };
            },
            refresh,
            onKeyDown,
        }),
        [refresh, onKeyDown, observeOptions]
    );
    useLayoutEffect(refresh);
    useLayoutEffect(() => {
        if (Platform.OS !== 'web') return;
        const Observer = (
            globalThis as unknown as {
                MutationObserver?: new (callback: () => void) => {
                    observe: (node: unknown, options: unknown) => void;
                    disconnect: () => void;
                };
            }
        ).MutationObserver;
        observer.current = Observer ? new Observer(refresh) : undefined;
        // React controls can become unavailable without rerendering the row.
        for (const target of targets.current.values()) {
            const row = target.node();
            if (row) observer.current?.observe(row, observeOptions);
        }
        return () => {
            observer.current?.disconnect();
            observer.current = undefined;
            for (const [node, initial] of originalTabIndices.current) {
                if (initial === null) node.removeAttribute('tabindex');
                else node.setAttribute('tabindex', initial);
            }
            originalTabIndices.current.clear();
        };
    }, [refresh, observeOptions]);
    return <ListFocusContext.Provider value={context}>{children}</ListFocusContext.Provider>;
}
