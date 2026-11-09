import { renderMaterialIcon } from '@mobile-design/icons/react-native-web';
import { MobileDesignProvider, type MobileDesignProviderProps } from 'mobile-design/react-native-web';

const settings = { icon: renderMaterialIcon };

export function GalleryProvider(props: Omit<MobileDesignProviderProps, 'settings'>) {
    return <MobileDesignProvider {...props} settings={settings} />;
}
