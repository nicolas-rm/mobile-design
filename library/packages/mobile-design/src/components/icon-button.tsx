import { type IconButtonProps as PaperIconButtonProps } from 'react-native-paper';
import { ButtonForIcon, type ButtonProps } from './button';
import { buttonSizeTokens, type ButtonSize } from '@mobile-design/tokens';
import { useMobileTheme } from '../core';

export type IconButtonProps = Omit<PaperIconButtonProps, 'ref' | 'animated'> &
    Pick<ButtonProps, 'ref'> & {
        /** Hold the pressed presentation while its associated popup is open. */
        pressed?: boolean;
        sizeClass?: ButtonSize;
        shape?: 'round' | 'square';
        /** Disable changes of shape while keeping press feedback. */
        morph?: boolean;
        widthVariant?: 'narrow' | 'default' | 'wide';
    };

const iconTokens = {
    'extra-small': { icon: 20, narrow: 4, default: 6, wide: 10 },
    small: { icon: 24, narrow: 4, default: 8, wide: 14 },
    medium: { icon: 24, narrow: 12, default: 16, wide: 24 },
    large: { icon: 32, narrow: 16, default: 32, wide: 48 },
    'extra-large': { icon: 40, narrow: 32, default: 48, wide: 72 },
} as const;

export function IconButton({
    sizeClass = 'small',
    shape = 'round',
    widthVariant = 'default',
    size,
    icon,
    iconColor,
    containerColor,
    mode,
    selected,
    style,
    ...props
}: IconButtonProps) {
    const theme = useMobileTheme(props.theme);
    const tokens = iconTokens[sizeClass];
    const iconSize = size ?? tokens.icon;
    return (
        <ButtonForIcon
            {...props}
            icon={icon}
            iconOnly
            iconSize={iconSize}
            size={sizeClass}
            shape={shape}
            variant={mode === 'contained' ? 'filled' : mode === 'contained-tonal' ? 'tonal' : mode === 'outlined' ? 'outlined' : 'text'}
            selected={selected}
            selectedRadius={shape === 'round' ? buttonSizeTokens[sizeClass].square : buttonSizeTokens[sizeClass].height / 2}
            containerWidth={iconSize + tokens[widthVariant] * 2}
            buttonColor={containerColor}
            textColor={
                iconColor ??
                (props.disabled
                    ? theme.colors.onSurface
                    : mode == null
                      ? selected
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant
                      : undefined)
            }
            disabledContentColor={theme.colors.onSurface}
            disabledContainerOpacity={0.1}
            disabledOutlineOpacity={0.38}
            style={style}
        >
            {null}
        </ButtonForIcon>
    );
}
