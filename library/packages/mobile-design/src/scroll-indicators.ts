import type { ScrollViewProps } from 'react-native';

export type ScrollIndicatorOptions = { vertical?: boolean; horizontal?: boolean };
type ScrollIndicatorProps = Required<Pick<ScrollViewProps, 'showsVerticalScrollIndicator' | 'showsHorizontalScrollIndicator'>>;

/** Each component owns its options. Omitted axes stay hidden; there is no global setting. */
export function getScrollIndicatorProps(options: ScrollIndicatorOptions = {}): ScrollIndicatorProps {
    return {
        showsVerticalScrollIndicator: options.vertical ?? false,
        showsHorizontalScrollIndicator: options.horizontal ?? false,
    };
}
