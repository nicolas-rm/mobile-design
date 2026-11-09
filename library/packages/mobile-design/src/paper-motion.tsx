/// <reference path="./paper-internals.d.ts" />
import { useContext, type ComponentProps } from 'react';
import { Portal as PaperPortal, useTheme, type Theme } from 'react-native-paper';
import { ReduceMotionContext } from 'react-native-paper/lib/module/theme/accessibility/ReduceMotionContext';

/**
 * The installed Paper Portal transports theme, settings and locale but not its
 * separate motion context. Preserve that context at the current Portal boundary.
 */
export { PaperMotionBridge } from './paper-motion-bridge';

function PortalRoot({ children, ...props }: ComponentProps<typeof PaperPortal>) {
    // Capture before crossing PortalHost, then explicitly re-provide inside its destination.
    const theme = useTheme<Theme>();
    const reduced =
        useContext(ReduceMotionContext) ||
        ((props.theme as { animation?: { scale?: number } } | undefined)?.animation?.scale ?? theme.animation.scale) === 0;
    return (
        <PaperPortal {...props}>
            <ReduceMotionContext.Provider value={reduced}>{children}</ReduceMotionContext.Provider>
        </PaperPortal>
    );
}
export const Portal = Object.assign(PortalRoot, { Host: PaperPortal.Host });
