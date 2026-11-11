import { useState, type ReactNode } from 'react';
import { Image, ScrollView, View } from 'react-native';
import {
    Button,
    Checkbox,
    Divider,
    IconButton,
    List,
    RadioButton,
    Select,
    SideSheet,
    Text,
    TextField,
    useLocale,
    useMobileTheme,
} from 'mobile-design/react-native';

const art = {
    festival: require('./assets/side-sheets/festival.png'),
    home: require('./assets/side-sheets/home-space.png'),
    sights: require('./assets/side-sheets/favorite-sights.png'),
};

/** Own the state above both presentations so resizing never discards edits. */
function AdaptivePanel({
    wide,
    open,
    onOpenChange,
    title,
    prefix,
    children,
}: {
    wide: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    prefix: string;
    children: ReactNode;
}) {
    return (
        <>
            <SideSheet
                variant="standard"
                width={320}
                open={wide && open}
                onOpenChange={onOpenChange}
                title={title}
                showDivider
                testID={`${prefix}-standard`}
            >
                {children}
            </SideSheet>
            <SideSheet width={320} open={!wide && open} onOpenChange={onOpenChange} title={title} testID={`${prefix}-modal`}>
                {children}
            </SideSheet>
        </>
    );
}

function PhotoInfo() {
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    const [width, setWidth] = useState(0);
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('Festival concert');
    const [album, setAlbum] = useState('');
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleLarge">Photo · Info</Text>
            <Text>
                La información acompaña a la foto en una región amplia y se abre como modal en una región compacta. El título editado se
                conserva al cambiar el ancho.
            </Text>
            <View
                onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
                style={{
                    height: 440,
                    overflow: 'hidden',
                    flexDirection: rtl ? 'row-reverse' : 'row',
                    direction: 'ltr',
                    backgroundColor: theme.colors.surface,
                }}
                testID="md-side-photo-host"
            >
                <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                        <Text variant="titleMedium" numberOfLines={1} style={{ flex: 1 }} testID="md-side-photo-title">
                            {title}
                        </Text>
                        <IconButton
                            icon="info"
                            accessibilityLabel="Photo information"
                            onPress={() => setOpen((value) => !value)}
                            testID="md-side-photo-open"
                        />
                    </View>
                    <Image
                        source={art.festival}
                        accessibilityLabel="Festival concert"
                        resizeMode="cover"
                        style={{ flex: 1, width: '100%' }}
                    />
                </View>
                <AdaptivePanel wide={width >= 600} open={open} onOpenChange={setOpen} title="Info" prefix="md-side-photo">
                    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 16 }} showsHorizontalScrollIndicator={false}>
                        <TextField
                            value={title}
                            onChangeText={setTitle}
                            accessibilityLabel="Photo title"
                            label="Title"
                            testID="md-side-photo-name"
                        />
                        <Divider />
                        <Text variant="labelLarge">Albums</Text>
                        {[
                            { key: 'home', title: 'Home space', detail: '64 items · November 5', image: art.home },
                            { key: 'sights', title: 'Favorite sights', detail: '378 items · October 28', image: art.sights },
                        ].map((item) => (
                            <List.Item
                                key={item.key}
                                variant="baseline"
                                style={{ backgroundColor: width >= 600 ? theme.colors.surface : theme.colors.surfaceContainerLow }}
                                title={item.title}
                                description={item.detail}
                                leading={<Image source={item.image} style={{ width: 64, height: 48, borderRadius: 8 }} />}
                                onPress={() => setAlbum(item.title)}
                                testID={`md-side-photo-${item.key}`}
                            />
                        ))}
                        <Text accessibilityLiveRegion="polite" testID="md-side-photo-album">
                            {album ? `Album: ${album}` : 'Choose an album'}
                        </Text>
                    </ScrollView>
                </AdaptivePanel>
            </View>
        </View>
    );
}

const labels = ['Events', 'Personal', 'Projects', 'Reminders', 'Family', 'Work'];
const files = [
    { title: 'Concert tickets', label: 'Events', format: 'document', today: true },
    { title: 'Project brief', label: 'Projects', format: 'document', today: false },
    { title: 'Design review', label: 'Reminders', format: 'document', today: true },
    { title: 'Family portrait', label: 'Family', format: 'image', today: false },
    { title: 'Work notes', label: 'Work', format: 'document', today: true },
];
function FileFilters() {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(['Projects', 'Reminders']);
    const [format, setFormat] = useState('all');
    const [today, setToday] = useState(false);
    const visible = files.filter(
        (file) =>
            (!selected.length || selected.includes(file.label)) && (format === 'all' || file.format === format) && (!today || file.today)
    );
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleLarge">Files · Filters</Text>
            <Text>
                Los filtros se aplican al contenido principal inmediatamente. El encabezado y su cierre permanecen fijos mientras el
                contenido se desplaza.
            </Text>
            <Button icon="tune" style={{ alignSelf: 'flex-start' }} onPress={() => setOpen(true)} testID="md-side-filters-open">
                Filters
            </Button>
            <Text testID="md-side-files-count" accessibilityLiveRegion="polite">
                {visible.length} files
            </Text>
            <List.Collection>
                {visible.map((file) => (
                    <List.Item key={file.title} variant="baseline" title={file.title} description={file.label} />
                ))}
            </List.Collection>
            <SideSheet open={open} onOpenChange={setOpen} title="Filters" detached testID="md-side-filters">
                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 16 }}
                    showsHorizontalScrollIndicator={false}
                    testID="md-side-filters-scroll"
                >
                    <Text variant="labelLarge">Labels</Text>
                    {labels.map((label, index) => (
                        <Checkbox.Item
                            key={label}
                            label={label}
                            position="leading"
                            status={selected.includes(label) ? 'checked' : 'unchecked'}
                            style={{ paddingHorizontal: 0 }}
                            onPress={() =>
                                setSelected((values) =>
                                    values.includes(label) ? values.filter((value) => value !== label) : [...values, label]
                                )
                            }
                            testID={`md-side-label-${index}`}
                        />
                    ))}
                    <Select
                        id="md-side-format"
                        label="Format"
                        value={format}
                        onValueChange={setFormat}
                        options={[
                            { value: 'all', label: 'All' },
                            { value: 'document', label: 'Documents' },
                            { value: 'image', label: 'Images' },
                        ]}
                    />
                    <Text variant="labelLarge">Last modified</Text>
                    <Checkbox.Item
                        label="Today"
                        position="leading"
                        status={today ? 'checked' : 'unchecked'}
                        onPress={() => setToday((value) => !value)}
                        testID="md-side-today"
                    />
                </ScrollView>
            </SideSheet>
        </View>
    );
}

function MailSettings() {
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    const [width, setWidth] = useState(0);
    const [open, setOpen] = useState(false);
    const [density, setDensity] = useState('Default');
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleLarge">Mail · Settings</Text>
            <Text>
                La densidad modifica las filas de correo. La hoja estándar deja disponible la lista principal y la modal se cierra antes de
                volver a ella.
            </Text>
            <View
                onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
                style={{
                    height: 400,
                    overflow: 'hidden',
                    flexDirection: rtl ? 'row-reverse' : 'row',
                    direction: 'ltr',
                    backgroundColor: theme.colors.surface,
                }}
            >
                <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                        <Text variant="titleMedium" style={{ flex: 1 }}>
                            Inbox
                        </Text>
                        <IconButton
                            icon="settings"
                            accessibilityLabel="Mail settings"
                            onPress={() => setOpen((value) => !value)}
                            testID="md-side-settings-open"
                        />
                    </View>
                    <Text style={{ paddingHorizontal: 16 }} testID="md-side-density">
                        Density: {density}
                    </Text>
                    <ScrollView testID="md-side-mail-scroll">
                        {['Alejandro Ortega', 'Carmen Villanueva', 'Sofía Sacchi', 'Lee Villanueva', 'Design team', 'Music team'].map(
                            (name, i) => (
                                <View
                                    key={name}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: density === 'Compact' ? 8 : density === 'Comfortable' ? 20 : 14,
                                        borderBottomWidth: 1,
                                        borderColor: theme.colors.outlineVariant,
                                    }}
                                    testID={`md-side-mail-${i}`}
                                >
                                    <Text variant="titleSmall">{name}</Text>
                                    <Text variant="bodyMedium" numberOfLines={1}>
                                        {i % 2 ? 'Design review and notes' : 'Festival concert'}
                                    </Text>
                                </View>
                            )
                        )}
                    </ScrollView>
                </View>
                <AdaptivePanel wide={width >= 600} open={open} onOpenChange={setOpen} title="Settings" prefix="md-side-settings">
                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 16 }}
                        showsHorizontalScrollIndicator={false}
                    >
                        <Text variant="labelLarge">Density</Text>
                        <RadioButton.Group value={density} onValueChange={setDensity} accessibilityLabel="Density">
                            {['Default', 'Comfortable', 'Compact'].map((value) => (
                                <RadioButton.Item
                                    key={value}
                                    value={value}
                                    label={value}
                                    position="leading"
                                    testID={`md-side-density-${value}`}
                                />
                            ))}
                        </RadioButton.Group>
                    </ScrollView>
                </AdaptivePanel>
            </View>
        </View>
    );
}

export function SideSheetUsageExamples() {
    return (
        <View style={{ gap: 32 }}>
            <PhotoInfo />
            <FileFilters />
            <MailSettings />
        </View>
    );
}
