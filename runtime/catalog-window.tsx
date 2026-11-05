import { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { ScrollView, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { MobileDesignProvider, Text, useMobileTheme, type MobileDesignComponentId } from 'mobile-design';
import { useRuntimeEnvironment } from './environment';
import { useWindowConfiguration } from './component-window';
import families from './remaining-families.json';
import { CoreExamples } from './showcases/mobile-design-core-examples';
import { SelectionExamples } from './showcases/mobile-design-selection-examples';
import { NavigationExamples } from './showcases/mobile-design-navigation-examples';
import { ActionExamples } from './showcases/mobile-design-action-examples';
import { SheetContentExamples } from './showcases/mobile-design-sheet-content-examples';
import { NavigationPlayground } from './showcases/mobile-design-navigation-playground';
import { ListPlayground } from './showcases/mobile-design-list-examples';
import { LoadingPlayground } from './showcases/mobile-design-action-scenarios';
import { ProgressPlayground } from './showcases/mobile-design-progress-examples';
import { TabsUsageContent } from './showcases/mobile-design-tabs-usage-screen';
import { ListUsageContent } from './showcases/mobile-design-list-usage-screen';
import type { ListUsageScenario } from './showcases/mobile-design-list-usage-data';
import type { TabsUsageScenario } from './showcases/mobile-design-tabs-usage-data';
type Config = { family: keyof typeof families; scenario: string; direction: 'ltr' | 'rtl'; motion: 'standard' | 'expressive' };
const query = new URLSearchParams(location.search);
const requestedFamily = query.get('family') ?? '';
const initial: Config = {
    family: requestedFamily in families ? (requestedFamily as Config['family']) : 'carousel',
    scenario: query.get('scenario') ?? 'gallery',
    direction: query.get('direction') === 'rtl' ? 'rtl' : 'ltr',
    motion: 'expressive',
};
function Body({ config }: { config: Config }) {
    const theme = useMobileTheme();
    const [status, setStatus] = useState(''),
        id = config.family,
        scenario = config.scenario;
    const choose = (scenario: string) => parent.postMessage({ type: 'mobile-design:window-scenario', scenario }, location.origin);
    const back = () => parent.postMessage({ type: 'mobile-design:window-back' }, location.origin);
    if (scenario === 'mail') return <NavigationPlayground onEvent={setStatus} />;
    if (id === 'lists' && scenario !== 'gallery')
        return (
            <NavigationContainer
                theme={{
                    ...(theme.dark ? DarkTheme : DefaultTheme),
                    colors: {
                        ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
                        background: String(theme.colors.surface),
                        card: String(theme.colors.surfaceContainer),
                        text: String(theme.colors.onSurface),
                        primary: String(theme.colors.primary),
                        border: String(theme.colors.outlineVariant),
                        notification: String(theme.colors.error),
                    },
                }}
            >
                <ListUsageContent scenario={scenario as ListUsageScenario} onBack={back} />
            </NavigationContainer>
        );
    if (scenario === 'loading') return <LoadingPlayground onEvent={setStatus} />;
    if (scenario === 'progress') return <ProgressPlayground />;
    if (id === 'tabs' && scenario !== 'gallery') return <TabsUsageContent scenario={scenario as TabsUsageScenario} onBack={back} />;
    const content = ['date-pickers', 'time-pickers', 'sliders', 'text-fields'].includes(id) ? (
        <SelectionExamples id={id} onEvent={setStatus} />
    ) : ['bottom-sheets', 'side-sheets', 'navigation-bar', 'navigation-drawer', 'navigation-rail', 'tabs', 'search', 'toolbars'].includes(
          id
      ) ? (
        <>
            <NavigationExamples id={id} onEvent={setStatus} onOpenPlayground={() => choose('mail')} />
            {id === 'bottom-sheets' ? <SheetContentExamples /> : null}
        </>
    ) : ['loading-indicator', 'tooltips'].includes(id) ? (
        <ActionExamples id={id as MobileDesignComponentId} onEvent={setStatus} onOpenPlayground={() => choose('loading')} />
    ) : (
        <CoreExamples id={id} onEvent={setStatus} onOpenProgressPlayground={() => choose('progress')} />
    );
    return (
        <ScrollView
            testID="family-gallery"
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, gap: 24 }}
            keyboardShouldPersistTaps="handled"
        >
            {content}
            <Text variant="bodySmall" accessibilityLiveRegion="polite" testID="family-status">
                {status}
            </Text>
        </ScrollView>
    );
}
export function CatalogWindow() {
    const environment = useRuntimeEnvironment(),
        config = useWindowConfiguration(initial);
    useEffect(() => {
        if (config.family !== 'time-pickers' || !window.frameElement) return;
        let activeDialog: HTMLElement | null = null;
        const observer = new MutationObserver(() => {
            const dialog = document.querySelector<HTMLElement>('[data-testid="catalog-time-picker"]');
            if (dialog === activeDialog) return;
            activeDialog = dialog;
            if (!dialog) return;
            const { top, height } = dialog.getBoundingClientRect();
            let y = top;
            let viewport: Window = window;
            // The bounded demo sits inside the documentation runtime iframe.
            // Scroll the containing document if the clock opens below its viewport.
            for (let frame = viewport.frameElement; frame; frame = viewport.frameElement) {
                y += frame.getBoundingClientRect().top + frame.clientTop;
                viewport = viewport.parent;
            }
            if (y < 16 || y + height > viewport.innerHeight - 16)
                viewport.scrollBy({ top: y - (viewport.innerHeight - height) / 2, behavior: 'instant' });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [config.family]);
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            direction={config.direction}
            motion={config.motion}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <main className="native-window" aria-label={families[config.family].title}>
                <GestureHandlerRootView style={{ flex: 1, minHeight: 0 }}>
                    <SafeAreaInsetsContext.Provider value={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                        <View style={{ flex: 1, minHeight: 0 }}>
                            <Body key={config.family + '-' + config.scenario} config={config} />
                        </View>
                    </SafeAreaInsetsContext.Provider>
                </GestureHandlerRootView>
            </main>
        </MobileDesignProvider>
    );
}
