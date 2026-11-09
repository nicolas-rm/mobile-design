import type { ComponentProps, ComponentType, Ref } from 'react';
import type { ViewInstance } from 'react-native';
import { TouchableRipple as PaperTouchableRipple } from 'react-native-paper';

/** Paper forwards this ref to its native View; RN 0.88 names that handle ViewInstance. */
export type TouchableRippleProps = Omit<ComponentProps<typeof PaperTouchableRipple>, 'ref'> & { ref?: Ref<ViewInstance> };
export const TouchableRipple = PaperTouchableRipple as ComponentType<TouchableRippleProps>;
