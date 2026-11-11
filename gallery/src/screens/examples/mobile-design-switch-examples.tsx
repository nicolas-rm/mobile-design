import { useMemo, useState } from 'react';
import { View } from 'react-native';
import {
    Icon,
    Switch,
    Text,
    TextField,
    ThemeProvider,
    createMobileDesignTheme,
    useMobileTheme,
    useLocale,
    type SwitchProps,
} from 'mobile-design/react-native';

function Setting({ title, description, icon, ...control }: SwitchProps & { title: string; description?: string; icon?: string }) {
    const theme = useMobileTheme();
    const { direction } = useLocale();
    return (
        <View
            style={{
                direction: 'ltr',
                flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 16,
                minHeight: 64,
                paddingVertical: 8,
            }}
        >
            {icon ? <Icon source={icon} size={24} color={theme.colors.onSurfaceVariant} /> : null}
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Text
                    variant="bodyLarge"
                    style={{
                        color: theme.colors.onSurface,
                        writingDirection: direction,
                        textAlign: direction === 'rtl' ? 'right' : 'left',
                    }}
                >
                    {title}
                </Text>
                {description ? (
                    <Text
                        variant="bodyMedium"
                        style={{
                            color: theme.colors.onSurfaceVariant,
                            writingDirection: direction,
                            textAlign: direction === 'rtl' ? 'right' : 'left',
                        }}
                    >
                        {description}
                    </Text>
                ) : null}
            </View>
            <Switch {...control} accessibilityLabel={control.accessibilityLabel ?? title} />
        </View>
    );
}

export function SwitchExamples() {
    const theme = useMobileTheme();
    const [enabled, setEnabled] = useState(true),
        [sound, setSound] = useState(false),
        [preview, setPreview] = useState(true);
    const [dark, setDark] = useState(false),
        [airplane, setAirplane] = useState(false),
        [wifi, setWifi] = useState(true);
    const [permission, setPermission] = useState(true),
        [camera, setCamera] = useState(false),
        [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('Material design');
    const previewTheme = useMemo(
        () =>
            createMobileDesignTheme({
                colorScheme: dark ? 'dark' : 'light',
                theme: { animation: { scale: theme.animation.scale }, motion: theme.motion },
            }),
        [dark, theme.animation.scale, theme.motion]
    );
    return (
        <View style={{ gap: 24, paddingBottom: 24 }}>
            <Text>
                Un ajuste binario que se aplica al momento, sin Guardar. Toca el control, arrastra su handle horizontalmente o utiliza
                Espacio/Enter.
            </Text>
            <View style={{ gap: 8 }}>
                <Text variant="titleMedium">Tres configuraciones</Text>
                <Setting title="Notificaciones" description="Sin iconos" value={enabled} onValueChange={setEnabled} testID="md-switch" />
                <Setting
                    title="Sonido"
                    description="Icono sólo cuando está activado"
                    value={sound}
                    onValueChange={setSound}
                    checkedIcon="check"
                    disabled={!enabled}
                    testID="md-switch-selected-icon"
                />
                <Setting
                    title="Vista previa"
                    description="Iconos de activado y desactivado"
                    value={preview}
                    onValueChange={setPreview}
                    checkedIcon="check"
                    uncheckedIcon="close"
                    disabled={!enabled}
                    testID="md-switch-both-icons"
                />
                <View style={{ padding: 16, borderRadius: 12, backgroundColor: theme.colors.surfaceContainer }}>
                    <Text accessibilityLiveRegion="polite" testID="md-switch-notification-result">
                        {enabled
                            ? `${sound ? 'Con sonido' : 'Sin sonido'} · ${preview ? 'Ana: Nos vemos a las 4.' : 'Tienes un mensaje nuevo.'}`
                            : 'Las notificaciones están desactivadas.'}
                    </Text>
                </View>
            </View>
            <View style={{ gap: 8 }}>
                <Text variant="titleMedium">Estados deshabilitados</Text>
                <Setting title="Sin iconos · desactivado" value={false} disabled testID="md-switch-disabled-off" />
                <Setting title="Sin iconos · activado" value disabled testID="md-switch-disabled-on" />
                <Setting
                    title="Icono seleccionado · desactivado"
                    value={false}
                    checkedIcon="check"
                    disabled
                    testID="md-switch-disabled-selected-off"
                />
                <Setting title="Icono seleccionado · activado" value checkedIcon="check" disabled testID="md-switch-disabled-selected-on" />
                <Setting
                    title="Dos iconos · desactivado"
                    value={false}
                    checkedIcon="check"
                    uncheckedIcon="close"
                    disabled
                    testID="md-switch-disabled-both-off"
                />
                <Setting
                    title="Dos iconos · activado"
                    value
                    checkedIcon="check"
                    uncheckedIcon="close"
                    disabled
                    testID="md-switch-disabled-both-on"
                />
            </View>
            <View style={{ gap: 12 }}>
                <Text variant="titleMedium">Settings · Dark theme</Text>
                <Text>La configuración cambia los colores de esta vista previa al activarse. No cambia el tema de la aplicación.</Text>
                <ThemeProvider theme={previewTheme}>
                    <View
                        style={{ padding: 16, borderRadius: 16, backgroundColor: previewTheme.colors.surface }}
                        testID="md-switch-theme-surface"
                    >
                        <Text variant="headlineSmall" style={{ color: previewTheme.colors.onSurface }}>
                            Settings
                        </Text>
                        <Setting
                            title="Dark theme"
                            description="Use a dark background"
                            value={dark}
                            onValueChange={setDark}
                            testID="md-switch-theme"
                        />
                        <Text style={{ color: previewTheme.colors.onSurfaceVariant }} testID="md-switch-theme-result">
                            {dark ? 'Dark theme is on' : 'Dark theme is off'}
                        </Text>
                    </View>
                </ThemeProvider>
            </View>
            <View style={{ gap: 8 }}>
                <Text variant="titleMedium">Airplane mode y Wi-Fi</Text>
                <Text>Activar Airplane mode desactiva Wi-Fi en esta demostración. Los ajustes del dispositivo se conservan.</Text>
                <Setting
                    title="Airplane mode"
                    icon="airplanemode_active"
                    value={airplane}
                    onValueChange={(value) => {
                        setAirplane(value);
                        if (value) setWifi(false);
                    }}
                    testID="md-switch-airplane"
                />
                <Setting title="Wi-Fi" icon="wifi" value={wifi} onValueChange={setWifi} testID="md-switch-wifi" />
                <Text accessibilityLiveRegion="polite" testID="md-switch-connectivity-result">
                    {airplane ? 'Airplane mode on' : 'Airplane mode off'} · {wifi ? 'Wi-Fi on' : 'Wi-Fi off'}
                </Text>
            </View>
            <View style={{ gap: 8 }}>
                <Text variant="titleMedium">Privacy settings</Text>
                <Setting
                    title="Permission manager"
                    description="App has access to your data"
                    value={permission}
                    onValueChange={setPermission}
                    checkedIcon="check"
                    testID="md-switch-permission"
                />
                <Setting
                    title="Camera access"
                    description="App has access to your camera"
                    value={camera}
                    onValueChange={setCamera}
                    checkedIcon="check"
                    testID="md-switch-camera"
                />
                <Text accessibilityLiveRegion="polite" testID="md-switch-privacy-result">
                    {permission ? 'Data access allowed' : 'Data access blocked'} ·{' '}
                    {camera ? 'Camera access allowed' : 'Camera access blocked'}
                </Text>
                <TextField
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    testID="md-switch-password-input"
                />
                <Setting title="Show password" value={showPassword} onValueChange={setShowPassword} testID="md-switch-show-password" />
            </View>
            <Text>
                La etiqueta describe lo que queda activado y conserva su color al interactuar. Los iconos del handle son opcionales; check y
                close expresan el estado sin sustituir la etiqueta.
            </Text>
        </View>
    );
}
