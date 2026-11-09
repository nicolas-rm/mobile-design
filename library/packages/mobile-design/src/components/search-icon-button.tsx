import { IconButton, type IconButtonProps } from './icon-button';

export type SearchIconButtonProps = Omit<IconButtonProps, 'shape' | 'morph'>;

/** Search actions keep a circular indication in every interaction state. */
export function SearchIconButton(props: SearchIconButtonProps) {
    return <IconButton {...props} shape="round" morph={false} />;
}
