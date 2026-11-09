import type { ColorValue } from 'react-native';

export type ChoiceOption = {
    value: string;
    label: string;
    description?: string;
    icon?: string;
    /** Browser link for suggestions that navigate. On native, handle navigation in onSelect. */
    href?: string;
    disabled?: boolean;
};

export type SelectProps = {
    id?: string;
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    options: readonly ChoiceOption[];
    disabled?: boolean;
    placeholder?: string;
    variant?: 'filled' | 'outlined';
    /** Surface behind an outlined field's floating label, for example inside a dialog. */
    backgroundColor?: ColorValue;
    emptyLabel?: string;
    /** Class applied to the browser field container. */
    className?: string;
};

export type AutocompleteProps = SelectProps & {
    onSelect?: (option: ChoiceOption) => void;
    /** Explicit keyboard/accessibility cancellation; ordinary blur/outside dismissal does not invoke it. */
    onEscape?: () => void;
    leadingIcon?: string;
    openOnFocus?: boolean;
    /** Set false when the supplied options are already filtered or ranked. */
    filter?: boolean;
    /** Inline results suit a search dialog that already owns the top layer. */
    presentation?: 'popup' | 'inline';
    listId?: string;
    emptyLabel?: string;
};

export const normalizeChoice = (value: string) =>
    value
        .normalize('NFD')
        .replace(/\p{Mark}/gu, '')
        .toLocaleLowerCase();

export function matchingChoices(options: readonly ChoiceOption[], query: string, filter: boolean) {
    const match = filter ? normalizeChoice(query.trim()) : '';
    return match ? options.filter((option) => normalizeChoice(`${option.label} ${option.description ?? ''}`).includes(match)) : options;
}
