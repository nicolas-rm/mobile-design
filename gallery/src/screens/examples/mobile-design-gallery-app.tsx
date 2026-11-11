import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMobileTheme } from 'mobile-design/react-native';
import { MobileDesignGalleryProvider as MobileDesignProvider } from './mobile-design-gallery-provider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@/navigations/types';
import { MobileDesignAppBarUsageScreen } from './mobile-design-appbar-usage-screen';
import { MobileDesignBadgeUsageScreen } from './mobile-design-badge-usage-route';
import { MobileDesignButtonGroupUsageScreen } from './mobile-design-button-group-usage-route';
import { MobileDesignButtonUsageScreen } from './mobile-design-button-usage-route';
import { MobileDesignIo26Screen } from './mobile-design-io26-screen';
import { MobileDesignListUsageScreen } from './mobile-design-list-usage-route';
import { MobileDesignCatalogScreen, MobileDesignComponentScreen, MobileDesignPlaygroundScreen } from './mobile-design-screen';
import { MobileDesignSearchUsageScreen } from './mobile-design-search-usage-screen';
import { MobileDesignTabsUsageScreen } from './mobile-design-tabs-usage-route';

const Stack = createNativeStackNavigator<RootStackParamList>();

function GalleryNavigator() {
    const theme = useMobileTheme();
    const reducedMotion = theme.animation.scale === 0;
    const previewOptions = ({ route }: { route: { params: { reduceMotion: boolean } } }): NativeStackNavigationOptions => ({
        animation: reducedMotion || route.params.reduceMotion ? 'none' : 'default',
    });

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="MobileDesignCatalog"
                screenOptions={{
                    headerShown: false,
                    orientation: 'all',
                    animation: reducedMotion ? 'none' : 'default',
                    contentStyle: { backgroundColor: theme.colors.background },
                }}
            >
                <Stack.Screen name="MobileDesignCatalog" component={MobileDesignCatalogScreen} />
                <Stack.Screen name="MobileDesignComponent" component={MobileDesignComponentScreen} options={previewOptions} />
                <Stack.Screen name="MobileDesignPlayground" component={MobileDesignPlaygroundScreen} options={previewOptions} />
                <Stack.Screen name="MobileDesignIo26" component={MobileDesignIo26Screen} options={previewOptions} />
                <Stack.Screen name="MobileDesignAppBarUsage" component={MobileDesignAppBarUsageScreen} options={previewOptions} />
                <Stack.Screen name="MobileDesignBadgeUsage" component={MobileDesignBadgeUsageScreen} options={previewOptions} />
                <Stack.Screen name="MobileDesignButtonGroupUsage" component={MobileDesignButtonGroupUsageScreen} options={previewOptions} />
                <Stack.Screen name="MobileDesignButtonUsage" component={MobileDesignButtonUsageScreen} options={previewOptions} />
                <Stack.Screen name="MobileDesignListUsage" component={MobileDesignListUsageScreen} options={previewOptions} />
                <Stack.Screen name="MobileDesignTabsUsage" component={MobileDesignTabsUsageScreen} options={previewOptions} />
                <Stack.Screen name="MobileDesignSearchUsage" component={MobileDesignSearchUsageScreen} options={previewOptions} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function MobileDesignGalleryApp() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <MobileDesignProvider>
                    <BottomSheetModalProvider>
                        <GalleryNavigator />
                    </BottomSheetModalProvider>
                </MobileDesignProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
