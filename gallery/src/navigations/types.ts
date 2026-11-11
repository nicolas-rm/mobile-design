import type { MobileDesignComponentId } from 'mobile-design/react-native';
import type { AppBarUsageScenario } from '@/screens/examples/mobile-design-appbar-usage-data';
import type { BadgeUsageScenario } from '@/screens/examples/mobile-design-badge-usage-data';
import type { ButtonGroupUsageScenario } from '@/screens/examples/mobile-design-button-group-usage-data';
import type { ButtonUsageScenario } from '@/screens/examples/mobile-design-button-usage-data';
import type { ListUsageScenario } from '@/screens/examples/mobile-design-list-usage-data';
import type { TabsUsageScenario } from '@/screens/examples/mobile-design-tabs-usage-data';
import type { Io26Scenario } from '@/screens/examples/mobile-design-io26-data';

export type RootStackParamList = {
    MobileDesignSearchUsage: {
        scenario: import('@/screens/examples/mobile-design-search-usage-screen').SearchUsageScenario;
        colorScheme: 'light' | 'dark';
        reduceMotion: boolean;
    };
    MobileDesignCatalog: undefined;
    MobileDesignIo26: { scenario: Io26Scenario; colorScheme: 'light' | 'dark'; reduceMotion: boolean };
    MobileDesignAppBarUsage: { scenario: AppBarUsageScenario; colorScheme: 'light' | 'dark'; reduceMotion: boolean };
    MobileDesignBadgeUsage: { scenario: BadgeUsageScenario; colorScheme: 'light' | 'dark'; reduceMotion: boolean };
    MobileDesignButtonGroupUsage: { scenario: ButtonGroupUsageScenario; colorScheme: 'light' | 'dark'; reduceMotion: boolean };
    MobileDesignButtonUsage: { scenario: ButtonUsageScenario; colorScheme: 'light' | 'dark'; reduceMotion: boolean };
    MobileDesignListUsage: { scenario: ListUsageScenario; colorScheme: 'light' | 'dark'; reduceMotion: boolean };
    MobileDesignTabsUsage: { scenario: TabsUsageScenario; colorScheme: 'light' | 'dark'; reduceMotion: boolean };
    MobileDesignComponent: { id: MobileDesignComponentId; colorScheme: 'light' | 'dark'; reduceMotion: boolean };
    MobileDesignPlayground: {
        scenario: 'loading' | 'navigation' | 'lists' | 'app-bars' | 'progress' | 'actions' | 'cards';
        family?: MobileDesignComponentId;
        colorScheme: 'light' | 'dark';
        reduceMotion: boolean;
    };
    CarouselDemo: undefined;
    CarouselCollection: { title: string; itemId?: string; themeMode: 'light' | 'dark'; reduceMotion: boolean };
    CarouselViewer: { title: string; itemId?: string; themeMode: 'light' | 'dark'; reduceMotion: boolean };
    DatePickerDemo: undefined;
    ProgressIndicatorsDemo: undefined;
};
