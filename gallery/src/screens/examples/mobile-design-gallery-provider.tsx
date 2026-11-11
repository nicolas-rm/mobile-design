import { renderMaterialIcon } from '@mobile-design/icons/react-native';
import { MobileDesignProvider, type MobileDesignProviderProps } from 'mobile-design/react-native';

const settings = { icon: renderMaterialIcon };

export function MobileDesignGalleryProvider(props: Omit<MobileDesignProviderProps, 'settings'>) {
    return <MobileDesignProvider {...props} settings={settings} />;
}
