import { useMemo } from 'react';
import { PaperProvider as ReactNativePaperProvider, type ProviderProps } from 'react-native-paper';
import { renderPaperIcon } from '@/theme/icons';

export function PaperProvider({ settings, ...props }: ProviderProps) {
    const mergedSettings = useMemo(
        () => ({
            ...settings,
            icon: settings?.icon ?? renderPaperIcon,
        }),
        [settings]
    );

    return <ReactNativePaperProvider {...props} settings={mergedSettings} />;
}
