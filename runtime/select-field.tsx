import { Select, type ChoiceOption, type SelectProps } from 'mobile-design/react-native-web';

type Option = Omit<ChoiceOption, 'value' | 'label'> & { value: string | number; label: string | number };

type Props = Omit<SelectProps, 'options' | 'value'> & {
    options: readonly Option[];
    value: string | number | undefined;
};

export function SelectField({ options, value, ...props }: Props) {
    return (
        <Select
            {...props}
            value={value == null ? '' : String(value)}
            options={options.map((option) => ({
                ...option,
                value: String(option.value),
                label: String(option.label),
            }))}
        />
    );
}
