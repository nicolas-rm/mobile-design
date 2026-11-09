/// <reference path="./paper-internals.d.ts" />
import { useContext, type PropsWithChildren } from 'react';
import { useTheme, type Theme } from 'react-native-paper';
import { ReduceMotionContext } from 'react-native-paper/lib/module/theme/accessibility/ReduceMotionContext';

/** Keep provider setup independent of components that consume MobileDesign's theme. */
export function PaperMotionBridge({ children }: PropsWithChildren) {
    const theme = useTheme<Theme>();
    const inherited = useContext(ReduceMotionContext);
    return <ReduceMotionContext.Provider value={inherited || theme.animation.scale === 0}>{children}</ReduceMotionContext.Provider>;
}
