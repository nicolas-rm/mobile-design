import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';

export type DemoTaskStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled';
export type DemoTaskState<T> = { status: DemoTaskStatus; result?: T; progress?: number; error?: string };
export type DemoTaskContext = { wait: (milliseconds: number) => Promise<void>; report: (completed: number, total: number) => void };

/** Local asynchronous work for the catalogue, invalidated on cancel/blur/unmount. */
export function useDemoTask<T>() {
    const focused = useIsFocused();
    const [state, setState] = useState<DemoTaskState<T>>({ status: 'idle' });
    const alive = useRef(true);
    const focusedNow = useRef(focused);
    const revision = useRef(0);
    const pending = useRef(new Map<ReturnType<typeof setTimeout>, () => void>());
    const invalidate = useCallback(() => {
        revision.current++;
        const waits = Array.from(pending.current);
        pending.current.clear();
        waits.forEach(([timer, reject]) => {
            clearTimeout(timer);
            reject();
        });
    }, []);
    const cancel = useCallback(() => {
        invalidate();
        if (alive.current)
            setState((previous) => (previous.status === 'running' ? { ...previous, status: 'cancelled', progress: undefined } : previous));
    }, [invalidate]);
    const reset = useCallback(() => {
        invalidate();
        if (alive.current) setState({ status: 'idle' });
    }, [invalidate]);
    const run = useCallback(
        async (work: (context: DemoTaskContext) => Promise<T>) => {
            invalidate();
            const token = revision.current;
            const current = () => alive.current && focusedNow.current && revision.current === token;
            if (!alive.current || !focusedNow.current) return;
            setState((previous) => ({ status: 'running', result: previous.result }));
            const context: DemoTaskContext = {
                wait: (milliseconds) =>
                    new Promise<void>((resolve, reject) => {
                        if (!current()) {
                            reject(new Error('cancelled'));
                            return;
                        }
                        const timer = setTimeout(() => {
                            pending.current.delete(timer);
                            if (current()) resolve();
                            else reject(new Error('cancelled'));
                        }, milliseconds);
                        pending.current.set(timer, () => reject(new Error('cancelled')));
                    }),
                report: (completed, total) => {
                    if (current())
                        setState((previous) => ({
                            ...previous,
                            progress: total > 0 ? Math.max(0, Math.min(1, completed / total)) : undefined,
                        }));
                },
            };
            try {
                const result = await work(context);
                if (current()) setState({ status: 'success', result, progress: 1 });
            } catch (error) {
                if (current())
                    setState((previous) => ({
                        ...previous,
                        status: 'error',
                        progress: undefined,
                        error: error instanceof Error ? error.message : String(error),
                    }));
            }
        },
        [invalidate]
    );
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            invalidate();
        };
    }, [invalidate]);
    useLayoutEffect(() => {
        focusedNow.current = focused;
    }, [focused]);
    useEffect(() => {
        if (!focused) cancel();
    }, [cancel, focused]);
    return { ...state, run, cancel, reset, busy: state.status === 'running' };
}
