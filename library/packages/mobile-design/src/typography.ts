import { customText, type TextProps as PaperTextProps } from 'react-native-paper';

/** Paper's runtime ships all 30 MD3 styles; its alpha declarations omit the emphasized 15. */
export type EmphasizedTextVariant = `${'display' | 'headline' | 'title' | 'label' | 'body'}${'Large' | 'Medium' | 'Small'}Emphasized`;
export type TextVariant = `${'display' | 'headline' | 'title' | 'label' | 'body'}${'Large' | 'Medium' | 'Small'}` | EmphasizedTextVariant;
export type TextProps<T extends string = never> = PaperTextProps<T | EmphasizedTextVariant>;

// customText preserves Paper's original renderer and theme lookup without another native view.
export const Text = customText<EmphasizedTextVariant>();
