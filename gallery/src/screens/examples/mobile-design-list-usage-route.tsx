import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { MobileDesignGalleryProvider as MobileDesignProvider } from './mobile-design-gallery-provider';
import type { RootStackParamList } from '@/navigations/types';
import { ListUsageContent } from './mobile-design-list-usage-screen';

export function MobileDesignListUsageScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'MobileDesignListUsage'>) {
    const focused = useIsFocused();
    return (
        <MobileDesignProvider
            colorScheme={route.params.colorScheme}
            motion="standard"
            fontFamily="Roboto"
            reduceMotion={route.params.reduceMotion ? 'on' : 'auto'}
        >
            {focused ? <StatusBar style={route.params.colorScheme === 'dark' ? 'light' : 'dark'} /> : null}
            <ListUsageContent scenario={route.params.scenario} onBack={() => navigation.goBack()} />
        </MobileDesignProvider>
    );
}
