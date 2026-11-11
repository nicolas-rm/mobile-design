import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { FAB, Portal } from 'mobile-design/react-native';
import { buttonUsageExamples, type ButtonUsageScenario } from './mobile-design-button-usage-data';

/** Removable gallery launcher; all destinations stay in one touch-scroll list. */
export function ButtonUsageLauncher({ onOpen }: { onOpen: (scenario: ButtonUsageScenario) => void }) {
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
                closeAccessibilityLabel="Cerrar ejemplos de Buttons"
                overflow="scroll"
                maxHeight={360}
                items={buttonUsageExamples.map((example) => ({
                    key: example.id,
                    icon: example.icon,
                    label: example.title,
                    onPress: () => {
                        setExpanded(false);
                        onOpen(example.id);
                    },
                    testID: `md-button-usage-open-${example.id}`,
                }))}
                trigger={{
                    icon: 'play_arrow',
                    variant: 'tonalTertiary',
                    accessibilityLabel: 'Buttons: ver ejemplos en acción',
                    onPress: () => {
                        Keyboard.dismiss();
                        setExpanded(true);
                    },
                    testID: 'md-button-usage-fab',
                }}
                testID="md-button-usage-menu"
            />
        </Portal>
    );
}
