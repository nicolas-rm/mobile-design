import { Platform } from 'react-native';
type State = { disabled?: boolean; selected?: boolean; checked?: boolean | 'mixed'; busy?: boolean; expanded?: boolean };
type Value = { min?: number; max?: number; now?: number; text?: string };
/** RN Web exposes the flat ARIA props; native renderers keep their grouped API. */
export function webAccessibility({ role, state, value, hidden }: { role?: string; state?: State; value?: Value; hidden?: boolean }) {
    if (Platform.OS !== 'web') return {};
    return {
        'aria-disabled': state?.disabled,
        'aria-checked': state?.checked,
        'aria-busy': state?.busy,
        'aria-expanded': state?.expanded,
        ...(role === 'button' ? { 'aria-pressed': state?.selected } : { 'aria-selected': state?.selected }),
        'aria-valuemin': value?.min,
        'aria-valuemax': value?.max,
        'aria-valuenow': value?.now,
        'aria-valuetext': value?.text,
        'aria-hidden': hidden,
    };
}
