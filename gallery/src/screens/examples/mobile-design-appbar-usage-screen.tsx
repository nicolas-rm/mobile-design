import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { MobileDesignGalleryProvider as MobileDesignProvider } from './mobile-design-gallery-provider';
import type { RootStackParamList } from '@/navigations/types';
import { AppBarPodcastScreen } from './mobile-design-appbar-podcast-screen';
import { AppBarSearchScreen } from './mobile-design-appbar-search-screen';
import { AppBarCollectionScreen } from './mobile-design-appbar-collection-screen';
import {
    AppBarAdaptiveWindow,
    AppBarAlbumScreen,
    AppBarChatScreen,
    AppBarEditorScreen,
    AppBarImageScreen,
    AppBarInteractionScreen,
    AppBarLetterScreen,
    AppBarNewsScreen,
    AppBarSushiScreen,
    AppBarTopTrailsScreen,
} from './mobile-design-appbar-context-screens';
import type { AppBarUsageScenario } from './mobile-design-appbar-usage-data';

export function AppBarUsageContent({ scenario, onBack }: { scenario: AppBarUsageScenario; onBack: () => void }) {
    switch (scenario) {
        case 'podcasts':
            return <AppBarPodcastScreen onBack={onBack} />;
        case 'search-messages':
            return <AppBarSearchScreen onBack={onBack} mode="messages" />;
        case 'search':
            return <AppBarSearchScreen onBack={onBack} mode="product" />;
        case 'search-inbox':
            return <AppBarSearchScreen onBack={onBack} mode="inbox" />;
        case 'search-photos':
            return <AppBarSearchScreen onBack={onBack} mode="photos" />;
        case 'scroll-color':
            return <AppBarNewsScreen onBack={onBack} />;
        case 'scroll-hide':
            return <AppBarChatScreen onBack={onBack} />;
        case 'scroll-collapse':
            return <AppBarAlbumScreen onBack={onBack} />;
        case 'adaptive-width':
            return <AppBarAdaptiveWindow>{() => <AppBarEditorScreen onBack={onBack} films />}</AppBarAdaptiveWindow>;
        case 'adaptive-actions':
            return (
                <AppBarAdaptiveWindow>
                    {(width) => <AppBarChatScreen onBack={onBack} adaptive viewportWidth={width} />}
                </AppBarAdaptiveWindow>
            );
        case 'adaptive-search':
            return <AppBarAdaptiveWindow>{() => <AppBarSearchScreen onBack={onBack} mode="product" />}</AppBarAdaptiveWindow>;
        case 'transparent':
            return <AppBarLetterScreen onBack={onBack} />;
        case 'text-wrap':
            return <AppBarAlbumScreen onBack={onBack} hiking />;
        case 'top-trails':
            return <AppBarTopTrailsScreen onBack={onBack} />;
        case 'sushi':
            return <AppBarSushiScreen onBack={onBack} />;
        case 'brand':
            return <AppBarNewsScreen onBack={onBack} branded />;
        case 'primary-action':
            return <AppBarImageScreen onBack={onBack} />;
        case 'compose':
            return <AppBarEditorScreen onBack={onBack} />;
        case 'collection':
            return <AppBarCollectionScreen onBack={onBack} />;
        case 'rtl':
            return <AppBarInteractionScreen onBack={onBack} rtl />;
        case 'interaction':
            return <AppBarInteractionScreen onBack={onBack} />;
    }
}

/** Each selection is a native-stack screen with its own bar, safe area and scrolling content. */
export function MobileDesignAppBarUsageScreen({
    navigation,
    route,
}: NativeStackScreenProps<RootStackParamList, 'MobileDesignAppBarUsage'>) {
    const focused = useIsFocused();
    return (
        <MobileDesignProvider
            colorScheme={route.params.colorScheme}
            fontFamily="Roboto"
            reduceMotion={route.params.reduceMotion ? 'on' : 'auto'}
        >
            {focused ? <StatusBar style={route.params.colorScheme === 'dark' ? 'light' : 'dark'} /> : null}
            <AppBarUsageContent scenario={route.params.scenario} onBack={() => navigation.goBack()} />
        </MobileDesignProvider>
    );
}
