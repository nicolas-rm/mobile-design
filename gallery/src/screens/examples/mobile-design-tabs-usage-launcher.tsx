import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { FAB, Portal } from 'mobile-design/react-native';
import { tabsUsageExamples, type TabsUsageScenario } from './mobile-design-tabs-usage-data';

/** Removing this launcher does not affect the shared Tabs or their consumers. */
export function TabsUsageLauncher({ onOpen }: { onOpen: (scenario: TabsUsageScenario) => void }) {
    const focused = useIsFocused();
    const [expanded, setExpanded] = useState(false);
    useEffect(() => {
        if (!focused) setExpanded(false);
    }, [focused]);
    if (!focused) return null;
    return (
        <Portal>
            <FAB.Menu
                expanded={expanded}
                onDismiss={() => setExpanded(false)}
                closeAccessibilityLabel="Cerrar ejemplos de Tabs"
                items={tabsUsageExamples.map((example) => ({
                    key: example.id,
                    icon: example.icon,
                    label: example.title,
                    onPress: () => {
                        setExpanded(false);
                        onOpen(example.id);
                    },
                    testID: `md-tabs-usage-open-${example.id}`,
                }))}
                overflow="scroll"
                maxHeight={360}
                trigger={{
                    icon: 'play_arrow',
                    variant: 'tonalTertiary',
                    accessibilityLabel: 'Tabs: ver ejemplos en acción',
                    onPress: () => {
                        Keyboard.dismiss();
                        setExpanded(true);
                    },
                    testID: 'md-tabs-usage-fab',
                }}
                testID="md-tabs-usage-menu"
            />
        </Portal>
    );
}
