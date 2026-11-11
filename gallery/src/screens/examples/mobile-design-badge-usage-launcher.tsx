import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { FAB, Portal } from 'mobile-design/react-native';
import { badgeUsageExamples, type BadgeUsageScenario } from './mobile-design-badge-usage-data';

/** The launcher stays in the Badges gallery; usage screens show their actual controls. */
export function BadgeUsageLauncher({ onOpen }: { onOpen: (scenario: BadgeUsageScenario) => void }) {
    const focused = useIsFocused();
    const [expanded, setExpanded] = useState(false);
    useEffect(() => {
        if (!focused) setExpanded(false);
    }, [focused]);
    const item = (example: (typeof badgeUsageExamples)[number]) => ({
        key: example.id,
        icon: example.icon,
        label: example.title,
        onPress: () => {
            setExpanded(false);
            onOpen(example.id);
        },
        testID: `md-badge-usage-open-${example.id}`,
    });
    const items = badgeUsageExamples.map(item);
    if (!focused) return null;
    return (
        <Portal>
            <FAB.Menu
                expanded={expanded}
                onDismiss={() => setExpanded(false)}
                closeAccessibilityLabel="Cerrar ejemplos de Badges"
                items={items}
                overflow="scroll"
                maxHeight={360}
                trigger={{
                    icon: 'play_arrow',
                    variant: 'tonalTertiary',
                    accessibilityLabel: 'Badges: ver ejemplos en acción',
                    onPress: () => {
                        Keyboard.dismiss();
                        setExpanded(true);
                    },
                    testID: 'md-badge-usage-fab',
                }}
                testID="md-badge-usage-menu"
            />
        </Portal>
    );
}
