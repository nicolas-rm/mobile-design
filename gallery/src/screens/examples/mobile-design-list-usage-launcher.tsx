import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { FAB, Portal } from 'mobile-design/react-native';
import { listUsageExamples, type ListUsageScenario } from './mobile-design-list-usage-data';

/** A removable launcher; every example belongs to the same scrollable list. */
export function ListUsageLauncher({ onOpen }: { onOpen: (scenario: ListUsageScenario) => void }) {
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
                closeAccessibilityLabel="Cerrar ejemplos de Lists"
                overflow="scroll"
                maxHeight={360}
                items={listUsageExamples.map((example) => ({
                    key: example.id,
                    icon: example.icon,
                    label: example.title,
                    onPress: () => {
                        setExpanded(false);
                        onOpen(example.id);
                    },
                    testID: `md-list-usage-open-${example.id}`,
                }))}
                trigger={{
                    icon: 'play_arrow',
                    variant: 'tonalTertiary',
                    accessibilityLabel: 'Lists: ver ejemplos en acción',
                    onPress: () => {
                        Keyboard.dismiss();
                        setExpanded(true);
                    },
                    testID: 'md-list-usage-fab',
                }}
                testID="md-list-usage-menu"
            />
        </Portal>
    );
}
