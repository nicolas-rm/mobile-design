import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { FAB, Portal, type FABMenuItemProps } from 'mobile-design/react-native';
import { buttonGroupUsageExamples, type ButtonGroupUsageScenario } from './mobile-design-button-group-usage-data';

/** One removable launcher belongs to the gallery, outside the reference compositions. */
export function ButtonGroupUsageLauncher({ onOpen }: { onOpen: (scenario: ButtonGroupUsageScenario) => void }) {
    const focused = useIsFocused();
    const [expanded, setExpanded] = useState(false);
    useEffect(() => {
        if (!focused) setExpanded(false);
    }, [focused]);
    const item = (example: (typeof buttonGroupUsageExamples)[number]): FABMenuItemProps => ({
        key: example.id,
        icon: example.icon,
        label: example.title,
        onPress: () => {
            setExpanded(false);
            onOpen(example.id);
        },
        testID: `md-button-group-usage-open-${example.id}`,
    });
    const items = buttonGroupUsageExamples.map(item);
    if (!focused) return null;
    return (
        <Portal>
            <FAB.Menu
                expanded={expanded}
                onDismiss={() => setExpanded(false)}
                closeAccessibilityLabel="Cerrar ejemplos de Button groups"
                items={items}
                overflow="scroll"
                maxHeight={360}
                trigger={{
                    icon: 'play_arrow',
                    variant: 'tonalTertiary',
                    accessibilityLabel: 'Button groups: ver ejemplos en acción',
                    onPress: () => {
                        Keyboard.dismiss();
                        setExpanded(true);
                    },
                    testID: 'md-button-group-usage-fab',
                }}
                testID="md-button-group-usage-menu"
            />
        </Portal>
    );
}
