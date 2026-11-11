import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Keyboard } from 'react-native';
import { FAB } from 'mobile-design/react-native';
import type { RootStackParamList } from '@/navigations/types';

/** Removable entry to the component gallery, hosted in Music's existing FAB slot. */
export function MobileDesignCatalogFab() {
    const focused = useIsFocused();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    return (
        <FAB
            icon="science"
            variant="tonalTertiary"
            visible={focused}
            accessibilityLabel="Abrir ejemplos de Mobile Design"
            onPress={() => {
                Keyboard.dismiss();
                navigation.navigate('MobileDesignCatalog');
            }}
            testID="music-mobile-design-fab"
        />
    );
}
