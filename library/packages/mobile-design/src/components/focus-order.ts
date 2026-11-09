/** DOM order follows keyed rows after reorder/insert; native collections retain registration order. */
export function orderFocusTargets<T extends { node: () => unknown }>(targets: T[]): T[] {
    return targets.sort((a, b) => {
        const first = a.node() as { compareDocumentPosition?: (other: unknown) => number } | null;
        const second = b.node();
        if (!first?.compareDocumentPosition || !second) return 0;
        const position = first.compareDocumentPosition(second);
        if (position & 1) return 0; // Detached trees cannot provide a shared order.
        return position & 4 ? -1 : position & 2 ? 1 : 0;
    });
}

/** Carousel Up/Down exits its horizontal collection to the surrounding page. */
export function focusOutsideCollection(host: unknown, backwards: boolean): boolean {
    type FocusNode = {
        focus: () => void;
        contains: (node: unknown) => boolean;
        getAttribute: (name: string) => string | null;
        getClientRects: () => ArrayLike<unknown>;
        disabled?: boolean;
        tabIndex: number;
        ownerDocument?: { querySelectorAll: (selector: string) => ArrayLike<FocusNode> };
    };
    const root = host as FocusNode | null;
    if (!root?.ownerDocument || !root.contains) return false;
    const nodes = Array.from(root.ownerDocument.querySelectorAll('button,[href],input,select,textarea,[tabindex]')).filter(
        (node) =>
            !node.disabled &&
            node.tabIndex >= 0 &&
            node.getAttribute('aria-hidden') !== 'true' &&
            node.getAttribute('aria-disabled') !== 'true' &&
            node.getClientRects().length > 0
    );
    const members = nodes.map((node, index) => (root.contains(node) ? index : -1)).filter((index) => index >= 0);
    if (!members.length) return false;
    const candidate = nodes[(backwards ? members[0] : members[members.length - 1]) + (backwards ? -1 : 1)];
    if (!candidate) return false;
    candidate.focus();
    return true;
}
