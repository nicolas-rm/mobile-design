import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { FAB, Portal } from 'mobile-design/react-native';
import { io26Examples, type Io26Scenario } from './mobile-design-io26-data';

/** One catalogue entry point. The existing scrollable FAB menu owns positioning and dismissal. */
export function Io26ExamplesLauncher({ onOpen }: { onOpen: (scenario: Io26Scenario) => void }) {
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
                presentation="expressive"
                overflow="scroll"
                maxHeight={408}
                onDismiss={() => setExpanded(false)}
                closeAccessibilityLabel="Cerrar ejemplos de I/O 2026"
                items={io26Examples.map((example) => ({
                    key: example.id,
                    label: example.title,
                    icon: example.icon,
                    onPress: () => {
                        setExpanded(false);
                        onOpen(example.id);
                    },
                    testID: `md-io26-open-${example.id}`,
                }))}
                trigger={{
                    icon: 'auto_awesome',
                    variant: 'tonalTertiary',
                    accessibilityLabel: 'Ver ejemplos de Material I/O 2026',
                    onPress: () => {
                        Keyboard.dismiss();
                        setExpanded(true);
                    },
                    testID: 'md-io26-fab',
                }}
                testID="md-io26-menu"
            />
        </Portal>
    );
}
