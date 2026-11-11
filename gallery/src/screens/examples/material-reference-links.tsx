import { useState } from 'react';
import { Linking, View } from 'react-native';
import { Button, Text, useMobileTheme, type MobileDesignComponentId } from 'mobile-design/react-native';

export function MaterialReferenceLinks({ component }: { component: MobileDesignComponentId }) {
    const theme = useMobileTheme();
    const [error, setError] = useState(false);
    const open = async (section: string) => {
        try {
            setError(false);
            await Linking.openURL(`https://m3.material.io/components/${component}/${section}`);
        } catch {
            setError(true);
        }
    };
    return (
        <View style={{ gap: 8 }}>
            <Text variant="titleMedium">Referencia de Material 3</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {(
                    [
                        ['overview', 'Resumen'],
                        ['specs', 'Especificaciones'],
                        ['guidelines', 'Guía de uso'],
                        ['accessibility', 'Accesibilidad'],
                    ] as const
                ).map(([section, label]) => (
                    <Button
                        key={section}
                        icon="open-in-new"
                        variant="text"
                        onPress={() => void open(section)}
                        testID={`${component}-reference-${section}`}
                    >
                        {label}
                    </Button>
                ))}
            </View>
            {error ? (
                <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.error }}>
                    No se pudo abrir el enlace.
                </Text>
            ) : null}
        </View>
    );
}
