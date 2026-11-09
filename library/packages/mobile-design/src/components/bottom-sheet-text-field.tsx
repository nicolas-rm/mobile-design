import { forwardRef } from 'react';
import { BottomSheetTextInput } from './bottom-sheet-text-input';
import { TextField, type TextFieldHandle, type TextFieldProps } from './text-field';

export type BottomSheetTextFieldProps = Omit<TextFieldProps, 'inputComponent'>;

// Gorhom forwards the native input handle; its published ref still uses RN's old component alias.
const CoordinatedInput = BottomSheetTextInput as NonNullable<TextFieldProps['inputComponent']>;

/** MD3 field chrome with Gorhom's keyboard and focus coordination inside a sheet. */
export const BottomSheetTextField = forwardRef<TextFieldHandle, BottomSheetTextFieldProps>(function BottomSheetTextField(props, ref) {
    return <TextField {...props} ref={ref} inputComponent={CoordinatedInput} />;
});
