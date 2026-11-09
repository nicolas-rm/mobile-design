import { useEffect, useRef } from 'react';

/** Revoke queued native presses when their target is blocked, replaced or unmounted. */
export function usePressScope(blocked: boolean, owner?: string) {
    const scope = useRef({ alive: true, blocked, owner, revision: 0 });
    if (scope.current.blocked !== blocked || scope.current.owner !== owner) scope.current.revision++;
    scope.current.blocked = blocked;
    scope.current.owner = owner;
    const revision = scope.current.revision;
    useEffect(() => {
        scope.current.alive = true;
        return () => {
            scope.current.alive = false;
        };
    }, []);
    return () => scope.current.alive && !scope.current.blocked && scope.current.revision === revision;
}
