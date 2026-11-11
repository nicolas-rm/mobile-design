import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { FAB, Portal, type FABMenuItemProps } from 'mobile-design/react-native';
import { appBarUsageExamples, type AppBarUsageScenario } from './mobile-design-appbar-usage-data';

/** This launcher belongs to the App bars gallery; reference screens retain their own controls. */
export function AppBarUsageLauncher({ onOpen }: { onOpen: (scenario: AppBarUsageScenario) => void }) {
    const focused = useIsFocused();
    const [expanded, setExpanded] = useState(false);
    useEffect(() => {
        if (!focused) setExpanded(false);
    }, [focused]);
    const open = (scenario: AppBarUsageScenario) => {
        setExpanded(false);
        onOpen(scenario);
    };
    const items: FABMenuItemProps[] = appBarUsageExamples.map((example) => ({
        key: example.id,
        icon: example.icon,
        label: example.menuLabel,
        accessibilityLabel: example.title,
        onPress: () => open(example.id),
        testID: `md-appbar-usage-open-${example.id}`,
    }));
    if (!focused) return null;
    return (
        <Portal>
            <FAB.Menu
                expanded={expanded}
                onDismiss={() => setExpanded(false)}
                items={items}
                overflow="scroll"
                maxHeight={360}
                closeAccessibilityLabel="Cerrar ejemplos de App bars"
                trigger={{
                    icon: 'play_arrow',
                    variant: 'tonalTertiary',
                    accessibilityLabel: 'App bars: ver ejemplos en acción',
                    onPress: () => {
                        Keyboard.dismiss();
                        setExpanded(true);
                    },
                    testID: 'md-appbar-usage-fab',
                }}
                testID="md-appbar-usage-menu"
            />
        </Portal>
    );
}
