import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { MobileDesignGalleryProvider as MobileDesignProvider } from './mobile-design-gallery-provider';
import type { RootStackParamList } from '@/navigations/types';
import { TabsUsageContent } from './mobile-design-tabs-usage-screen';

export function MobileDesignTabsUsageScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'MobileDesignTabsUsage'>) {
    const focused = useIsFocused();
    return (
        <MobileDesignProvider
            colorScheme={route.params.colorScheme}
            motion="standard"
            fontFamily="Roboto"
            reduceMotion={route.params.reduceMotion ? 'on' : 'auto'}
        >
            {focused ? <StatusBar style={route.params.colorScheme === 'dark' ? 'light' : 'dark'} /> : null}
            <TabsUsageContent scenario={route.params.scenario} onBack={() => navigation.goBack()} />
        </MobileDesignProvider>
    );
}
