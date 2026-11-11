import { useState } from 'react';
import { View } from 'react-native';
import { Avatar, Button, IconButton, Menu, Text, useMobileTheme } from 'mobile-design/react-native';

const phoneTypes = [
    { label: 'Trabajo', icon: 'business_center' },
    { label: 'Móvil', icon: 'smartphone' },
    { label: 'Casa', icon: 'home' },
];
const dietaryOptions = ['Vegetariano', 'Sin frutos secos', 'Sin gluten'];
const categories = [
    { label: 'Ropa', icon: 'checkroom', detail: 'De temporada', sale: true },
    { label: 'Calzado', icon: 'steps', detail: 'Zapatos y botas', sale: false },
    { label: 'Accesorios', icon: 'watch', detail: 'Relojes y complementos', sale: false },
];

/** Local, functional examples of the activity, dietary and custom-slot MD3 menus. */
export function MenuReferenceExamples() {
    const theme = useMobileTheme();
    const [open, setOpen] = useState<'phone' | 'diet' | 'category' | null>(null);
    const [phone, setPhone] = useState('Trabajo');
    const [diet, setDiet] = useState<string[]>(['Vegetariano']);
    const [category, setCategory] = useState('Ropa');
    return (
        <View style={{ gap: 24 }}>
            <Text variant="titleMedium">Selección e iconos</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ flex: 1 }}>
                    <Text variant="bodyLarge">Tipo de teléfono</Text>
                    <Text testID="md-menu-phone-value">{phone}</Text>
                </View>
                <Menu
                    visible={open === 'phone'}
                    onDismiss={() => setOpen(null)}
                    testID="md-menu-phone"
                    anchor={
                        <IconButton icon="more_vert" accessibilityLabel="Cambiar tipo de teléfono" onPress={() => setOpen('phone')} testID="md-menu-phone-open" />
                    }
                >
                    {phoneTypes.map((option) => (
                        <Menu.Item
                            key={option.label}
                            title={option.label}
                            leadingIcon={option.icon}
                            selected={phone === option.label}
                            selectionMode="single"
                            selectionIndicatorPosition="trailing"
                            onPress={() => setPhone(option.label)}
                            testID={`md-menu-phone-${option.icon}`}
                        />
                    ))}
                </Menu>
            </View>
            <Text testID="md-menu-diet-value">Preferencias: {diet.join(', ') || 'Ninguna'}</Text>
            <Menu
                variant="vibrant"
                visible={open === 'diet'}
                onDismiss={() => setOpen(null)}
                testID="md-menu-diet"
                anchor={<Button variant="outlined" onPress={() => setOpen('diet')} testID="md-menu-diet-open">Preferencias de comida</Button>}
            >
                {dietaryOptions.map((option, index) => (
                    <Menu.Item
                        key={option}
                        title={option}
                        selectionMode="multiple"
                        selected={diet.includes(option)}
                        onPress={() => setDiet((current) => current.includes(option) ? current.filter((value) => value !== option) : [...current, option])}
                        testID={`md-menu-diet-${index}`}
                    />
                ))}
                <Menu.Item title="Listo" onPress={() => setOpen(null)} testID="md-menu-diet-done" />
            </Menu>
            <Text testID="md-menu-category-value">Categoría: {category}</Text>
            <Menu
                visible={open === 'category'}
                onDismiss={() => setOpen(null)}
                testID="md-menu-category"
                anchor={<Button variant="outlined" icon="storefront" onPress={() => setOpen('category')} testID="md-menu-category-open">Explorar categorías</Button>}
            >
                {categories.map((option) => (
                    <Menu.Item
                        key={option.label}
                        title={option.label}
                        supportingText={option.detail}
                        leading={<Avatar.Icon size={36} icon={option.icon} />}
                        badge={option.sale ? (
                            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: theme.colors.errorContainer }}>
                                <Text variant="labelSmall" style={{ color: theme.colors.onErrorContainer }}>Oferta</Text>
                            </View>
                        ) : undefined}
                        selected={category === option.label}
                        selectionMode="single"
                        selectionIndicatorPosition="trailing"
                        accessibilityLabel={`${option.label}${option.sale ? ', en oferta' : ''}`}
                        onPress={() => setCategory(option.label)}
                        testID={`md-menu-category-${option.icon}`}
                    />
                ))}
            </Menu>
        </View>
    );
}
