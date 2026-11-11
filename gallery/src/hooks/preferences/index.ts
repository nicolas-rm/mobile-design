import { useReducedMotion } from 'react-native-reanimated';

export function useAppPreferences() {
    const systemReduceMotionEnabled = useReducedMotion();
    return { systemReduceMotionEnabled, effectiveReduceMotionEnabled: systemReduceMotionEnabled, rippleEnabled: true };
}
