import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRuntimeEnvironment } from './environment';

/** A bounded example window gives native overlays their own real viewport. */
export function ComponentWindow({
    component,
    configuration,
    title,
    width = 0,
    height = 560,
    testID,
    onBack,
    onScenarioChange,
}: {
    component: string;
    configuration: object;
    title: string;
    width?: number;
    height?: number;
    testID: string;
    onBack?: () => void;
    onScenarioChange?: (scenario: string) => void;
}) {
    const environment = useRuntimeEnvironment(),
        frame = useRef<HTMLIFrameElement>(null);
    const url = useMemo(() => {
        const u = new URL('./index.html', location.href);
        u.searchParams.set('component', component);
        return u.href;
    }, [component]);
    const synchronize = useCallback(() => {
        frame.current?.contentWindow?.postMessage(
            { type: 'mobile-design:environment', theme: environment.colorScheme, reduced: environment.reduced },
            location.origin
        );
        frame.current?.contentWindow?.postMessage({ type: 'mobile-design:window-config', configuration }, location.origin);
    }, [configuration, environment]);
    useEffect(synchronize, [synchronize]);
    useEffect(() => {
        const ready = (event: MessageEvent) => {
            if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
            if (event.data?.type === 'mobile-design:window-ready') synchronize();
            if (event.data?.type === 'mobile-design:window-back') onBack?.();
            if (event.data?.type === 'mobile-design:window-scenario' && typeof event.data.scenario === 'string')
                onScenarioChange?.(event.data.scenario);
        };
        window.addEventListener('message', ready);
        return () => window.removeEventListener('message', ready);
    }, [synchronize, onBack, onScenarioChange]);
    return (
        <div className="component-window-scroll">
            <iframe
                ref={frame}
                src={url}
                title={title}
                onLoad={synchronize}
                data-testid={testID}
                className="component-window"
                style={{ width: width || '100%', height }}
            />
        </div>
    );
}
export function useWindowConfiguration<T extends object>(initial: T) {
    const [configuration, setConfiguration] = useState(initial);
    useEffect(() => {
        const receive = (event: MessageEvent) => {
            if (
                event.origin === location.origin &&
                event.source === parent &&
                event.data?.type === 'mobile-design:window-config' &&
                event.data.configuration &&
                typeof event.data.configuration === 'object'
            )
                setConfiguration({ ...initial, ...event.data.configuration });
        };
        window.addEventListener('message', receive);
        parent.postMessage({ type: 'mobile-design:window-ready' }, location.origin);
        return () => window.removeEventListener('message', receive);
    }, []);
    return configuration;
}
