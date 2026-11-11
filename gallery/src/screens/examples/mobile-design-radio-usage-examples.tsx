import { useMemo, useState } from 'react';
import { View, useColorScheme } from 'react-native';
import { Button, Dialog, RadioButton, Text, ThemeProvider, createMobileDesignTheme, useMobileTheme } from 'mobile-design/react-native';

const ringtones = ['None', 'Callisto', 'Ganymede', 'Luna'];
const languages = ['English', 'Chinese (Mandarin)', 'Spanish'];
const sortOptions = ['Relevance', 'Lowest price', 'Highest rating', 'Most reviewed'];
const products = [
    { name: 'Studio headphones', price: 89, rating: 4.6, reviews: 126 },
    { name: 'Portable speaker', price: 49, rating: 4.8, reviews: 84 },
    { name: 'Wireless earbuds', price: 69, rating: 4.4, reviews: 241 },
];

/** Working compositions from the radio guidelines; the gallery owns navigation. */
export function RadioUsageExamples() {
    const [ringtone, setRingtone] = useState('Callisto');
    const [language, setLanguage] = useState('English');
    const [draftLanguage, setDraftLanguage] = useState(language);
    const [dialog, setDialog] = useState(false);
    const [address, setAddress] = useState('Office');
    const [sort, setSort] = useState('Relevance');
    const [notification, setNotification] = useState('Allow notifications');
    const [optional, setOptional] = useState('');
    const sorted = [...products].sort((a, b) =>
        sort === 'Lowest price'
            ? a.price - b.price
            : sort === 'Highest rating'
              ? b.rating - a.rating
              : sort === 'Most reviewed'
                ? b.reviews - a.reviews
                : 0
    );
    return (
        <View style={{ gap: 32 }}>
            <View style={{ gap: 8 }}>
                <Text variant="titleLarge">Ringtone</Text>
                <RadioButton.Group value={ringtone} onValueChange={setRingtone} accessibilityLabel="Ringtone" testID="md-radio-ringtones">
                    {ringtones.map((label) => (
                        <RadioButton.Item
                            key={label}
                            position="leading"
                            value={label}
                            label={label}
                            testID={`md-radio-ringtone-${label.toLowerCase()}`}
                        />
                    ))}
                </RadioButton.Group>
                <Text testID="md-radio-ringtone-result" accessibilityLiveRegion="polite">
                    Ringtone: {ringtone}. La selección se aplica inmediatamente; esta muestra no reproduce audio.
                </Text>
            </View>
            <View style={{ gap: 8 }}>
                <Text variant="titleLarge">Language</Text>
                <RadioButton.Group value={language} onValueChange={setLanguage} accessibilityLabel="Language" testID="md-radio-languages">
                    {languages.map((label, index) => (
                        <RadioButton.Item
                            key={label}
                            position="leading"
                            value={label}
                            label={label}
                            testID={`md-radio-language-${index}`}
                        />
                    ))}
                </RadioButton.Group>
                <Text testID="md-radio-language-result">Language: {language}</Text>
                <Button
                    variant="outlined"
                    style={{ alignSelf: 'flex-start' }}
                    onPress={() => {
                        setDraftLanguage(language);
                        setDialog(true);
                    }}
                    testID="md-radio-language-open"
                >
                    Choose your language
                </Button>
            </View>
            <Dialog
                visible={dialog}
                onDismiss={() => setDialog(false)}
                accessibilityLabel="Choose your language"
                testID="md-radio-language-dialog"
            >
                <Dialog.Icon icon="language" />
                <Dialog.Title>Choose your language</Dialog.Title>
                <Dialog.Content>
                    <Text>You can always change this later</Text>
                    <RadioButton.Group value={draftLanguage} onValueChange={setDraftLanguage} accessibilityLabel="Choose your language">
                        {languages.map((label, index) => (
                            <RadioButton.Item
                                key={label}
                                position="leading"
                                value={label}
                                label={label}
                                testID={`md-radio-dialog-language-${index}`}
                            />
                        ))}
                    </RadioButton.Group>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setDialog(false)} testID="md-radio-language-cancel">
                        Cancel
                    </Button>
                    <Button
                        variant="text"
                        onPress={() => {
                            setLanguage(draftLanguage);
                            setDialog(false);
                        }}
                        testID="md-radio-language-continue"
                    >
                        Continue
                    </Button>
                </Dialog.Actions>
            </Dialog>
            <View style={{ gap: 8 }}>
                <Text variant="titleLarge">Checkout</Text>
                <Text variant="titleMedium">Ship to</Text>
                <RadioButton.Group value={address} onValueChange={setAddress} accessibilityLabel="Ship to" testID="md-radio-addresses">
                    {['Home', 'Office'].map((label) => (
                        <RadioButton.Item
                            key={label}
                            position="leading"
                            value={label}
                            label={label}
                            testID={`md-radio-address-${label.toLowerCase()}`}
                        />
                    ))}
                </RadioButton.Group>
                <Text testID="md-radio-address-result" accessibilityLiveRegion="polite">
                    {address === 'Home' ? 'Home · 123 Main Street' : 'Office · 456 Market Street'}
                </Text>
            </View>
            <View style={{ gap: 8 }}>
                <Text variant="titleLarge">Filters</Text>
                <Text variant="titleMedium">Sort by</Text>
                <RadioButton.Group value={sort} onValueChange={setSort} accessibilityLabel="Sort by" testID="md-radio-sort">
                    {sortOptions.map((label, index) => (
                        <RadioButton.Item key={label} position="leading" value={label} label={label} testID={`md-radio-sort-${index}`} />
                    ))}
                </RadioButton.Group>
                <View style={{ gap: 12 }} testID="md-radio-sorted-products">
                    {sorted.map((item) => (
                        <View key={item.name} style={{ gap: 4 }}>
                            <Text variant="titleSmall">{item.name}</Text>
                            <Text variant="bodyMedium">
                                ${item.price} · {item.rating} / 5 · {item.reviews} reviews
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
            <RadioDisplayExample />
            <View style={{ gap: 8 }}>
                <Text variant="titleLarge">Notifications</Text>
                <RadioButton.Group
                    value={notification}
                    onValueChange={setNotification}
                    accessibilityLabel="Notifications"
                    testID="md-radio-notifications"
                >
                    {['Allow notifications', 'Don’t allow'].map((label, index) => (
                        <RadioButton.Item
                            key={label}
                            position="leading"
                            value={label}
                            label={label}
                            testID={`md-radio-notification-${index}`}
                        />
                    ))}
                </RadioButton.Group>
                <Text testID="md-radio-notification-result">
                    {notification === 'Allow notifications'
                        ? 'Las notificaciones de esta muestra están activadas.'
                        : 'Las notificaciones de esta muestra están desactivadas.'}
                </Text>
            </View>
            <View style={{ gap: 8 }}>
                <Text variant="titleLarge">Selección inicialmente vacía</Text>
                <Text>
                    Tab entra en la primera opción; Shift+Tab, en la última. Una vez seleccionada, pulsarla de nuevo conserva la selección.
                </Text>
                <RadioButton.Group
                    value={optional}
                    onValueChange={setOptional}
                    accessibilityLabel="Selección inicialmente vacía"
                    testID="md-radio-empty"
                >
                    {['Home', 'Office', 'Not applicable'].map((label, index) => (
                        <RadioButton.Item key={label} position="leading" value={label} label={label} testID={`md-radio-empty-${index}`} />
                    ))}
                </RadioButton.Group>
                <Text testID="md-radio-empty-result">{optional || 'Sin selección inicial'}</Text>
            </View>
        </View>
    );
}

function RadioDisplayExample() {
    const host = useMobileTheme();
    const system = useColorScheme();
    const [mode, setMode] = useState('System default');
    const dark = mode === 'Dark' || (mode === 'System default' && system === 'dark');
    // The same canonical palette and motion preferences as the app; scoped to
    // this preview so exploring Display does not overwrite the host preference.
    const theme = useMemo(
        () =>
            createMobileDesignTheme({
                colorScheme: dark ? 'dark' : 'light',
                theme: { animation: host.animation, motion: host.motion, fonts: host.fonts },
            }),
        [dark, host.animation, host.motion, host.fonts]
    );
    return (
        <ThemeProvider theme={theme}>
            <View style={{ padding: 16, gap: 8, backgroundColor: theme.colors.surface }} testID="md-radio-display">
                <Text variant="titleLarge">Display</Text>
                <RadioButton.Group value={mode} onValueChange={setMode} accessibilityLabel="Display">
                    {['Light', 'Dark', 'System default'].map((label, index) => (
                        <RadioButton.Item key={label} position="leading" value={label} label={label} testID={`md-radio-theme-${index}`} />
                    ))}
                </RadioButton.Group>
                <Text testID="md-radio-theme-result">Display: {mode}</Text>
            </View>
        </ThemeProvider>
    );
}
