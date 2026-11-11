import { useRef, useState, type ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Button, Dialog, Text, TextField, type TextFieldHandle } from 'mobile-design/react-native';

type ExampleProps = { onEvent: (message: string) => void };
function Example({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium">{title}</Text>
            {description && <Text variant="bodyMedium">{description}</Text>}
            {children}
        </View>
    );
}

export function TextFieldExamples({ onEvent }: ExampleProps) {
    const [email, setEmail] = useState('correo-incompleto');
    const [password, setPassword] = useState('');
    const [secure, setSecure] = useState(true);
    const [amount, setAmount] = useState('120.00');
    const [price, setPrice] = useState('');
    const [note, setNote] = useState('');
    const passwordRef = useRef<TextFieldHandle>(null);
    const emailError = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return (
        <View style={{ gap: 24 }}>
            <Text variant="bodyMedium">
                Filled y Outlined son las dos variantes. Error, foco y disponibilidad son estados; iconos, afijos y multilínea son
                configuraciones.
            </Text>
            <FieldVariantConfigurations variant="filled" />
            <FieldVariantConfigurations variant="outlined" />
            <Example
                title="Error y texto de apoyo"
                description="Corrige el correo para quitar el error. El contador muestra la longitud y el campo limita a 40 caracteres."
            >
                <TextField
                    variant="outlined"
                    label="Correo electrónico"
                    value={email}
                    onChangeText={setEmail}
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={emailError}
                    errorText="Escribe un correo como nombre@ejemplo.com."
                    supportingText="Usaremos esta dirección para contactarte."
                    trailingIcon={emailError ? 'alert-circle' : 'check'}
                    counter
                    maxLength={40}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    testID="catalog-field-error"
                />
            </Example>
            <Example title="Icono de acción" description="El icono conserva el texto y alterna la visibilidad de la contraseña.">
                <TextField
                    ref={passwordRef}
                    variant="filled"
                    label="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={secure}
                    autoCapitalize="none"
                    autoCorrect={false}
                    trailingIcon={secure ? 'eye-outline' : 'eye-off-outline'}
                    onTrailingIconPress={() => setSecure((current) => !current)}
                    trailingIconAccessibilityLabel={secure ? 'Mostrar contraseña' : 'Ocultar contraseña'}
                    testID="catalog-field-password"
                />
            </Example>
            <Example title="Prefijo y sufijo">
                <TextField
                    variant="outlined"
                    label="Importe"
                    value={amount}
                    onChangeText={setAmount}
                    prefix="$"
                    suffix="MXN"
                    prefixAccessibilityLabel="Pesos mexicanos"
                    suffixAccessibilityLabel="Moneda: pesos mexicanos"
                    inputMode="decimal"
                    supportingText="Importe en pesos mexicanos."
                    testID="catalog-field-affixes"
                />
            </Example>
            <Example
                title="Etiqueta adyacente"
                description="La etiqueta externa identifica el campo. Los afijos permanecen visibles aunque el valor esté vacío."
            >
                <Text nativeID="catalog-field-adjacent-label">Precio por unidad</Text>
                <TextField
                    variant="outlined"
                    accessibilityLabel="Precio por unidad"
                    aria-labelledby="catalog-field-adjacent-label"
                    value={price}
                    onChangeText={setPrice}
                    prefix="$"
                    suffix="MXN"
                    prefixAccessibilityLabel="Pesos mexicanos"
                    suffixAccessibilityLabel="Moneda: pesos mexicanos"
                    inputMode="decimal"
                    testID="catalog-field-adjacent"
                />
            </Example>
            <Example title="Multilínea y contador">
                <TextField
                    variant="filled"
                    label="Comentario"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={3}
                    inputStyle={{ minHeight: 72 }}
                    counter
                    maxLength={140}
                    supportingText="Agrega indicaciones para la entrega."
                    testID="catalog-field-multiline"
                />
            </Example>
            <ContactFormExample onEvent={onEvent} />
            <Example title="Deshabilitado y solo lectura">
                <TextField
                    variant="filled"
                    label="Filled deshabilitado"
                    value="Sin edición"
                    onChangeText={() => {}}
                    leadingIcon="account-outline"
                    disabled
                    testID="catalog-field-disabled-filled"
                />
                <TextField
                    variant="outlined"
                    label="Outlined deshabilitado"
                    value="Sin edición"
                    onChangeText={() => {}}
                    trailingIcon="lock-outline"
                    disabled
                    testID="catalog-field-disabled-outlined"
                />
                <TextField
                    variant="outlined"
                    label="Folio de referencia"
                    value="MD-2026-0042"
                    onChangeText={() => {}}
                    readOnly
                    supportingText="Dato informativo."
                    testID="catalog-field-read-only"
                />
            </Example>
        </View>
    );
}

function FieldVariantConfigurations({ variant }: { variant: 'filled' | 'outlined' }) {
    const [values, setValues] = useState<Record<string, string>>({
        plain: '',
        supporting: 'Un ejemplo',
        trailing: 'Texto',
        leading: '',
        both: 'Ana',
        prefix: '120.00',
        suffix: '25',
        grade: '85',
        domain: 'alex',
        multiline: '',
        textarea: '',
    });
    const supportingRef = useRef<TextFieldHandle>(null);
    const update = (key: string) => (text: string) => setValues((previous) => ({ ...previous, [key]: text }));
    const input = (key: string) => ({
        variant,
        value: values[key],
        onChangeText: update(key),
        testID: key === 'plain' ? `catalog-field-${variant}` : `catalog-field-${variant}-${key}`,
    });
    return (
        <Example
            title={variant === 'filled' ? 'Filled: configuraciones' : 'Outlined: configuraciones'}
            description="Campos vacíos y poblados. Escribe o borra para recorrer ambos estados; la etiqueta siempre conserva su contexto."
        >
            <TextField
                {...input('plain')}
                label="Nombre *"
                supportingText="* Campo obligatorio."
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => supportingRef.current?.focus()}
            />
            <TextField
                {...input('supporting')}
                ref={supportingRef}
                label="Referencia"
                supportingText="Información adicional sobre la referencia."
            />
            <TextField
                {...input('trailing')}
                label="Texto con acción"
                trailingIcon={values.trailing ? 'close' : undefined}
                onTrailingIconPress={() => update('trailing')('')}
                trailingIconAccessibilityLabel="Borrar texto"
            />
            <TextField {...input('leading')} label="Buscar" leadingIcon="magnify" />
            <TextField
                {...input('both')}
                label="Persona"
                leadingIcon="account-outline"
                trailingIcon={values.both ? 'close' : undefined}
                onTrailingIconPress={() => update('both')('')}
                trailingIconAccessibilityLabel="Borrar persona"
            />
            <TextField {...input('prefix')} label="Importe" prefix="$" prefixAccessibilityLabel="Dólares" inputMode="decimal" />
            <TextField {...input('suffix')} label="Distancia" suffix="km" suffixAccessibilityLabel="Kilómetros" inputMode="decimal" />
            <TextField
                {...input('grade')}
                label="Calificación"
                suffix="/100"
                suffixAccessibilityLabel="De un máximo de cien"
                inputMode="numeric"
            />
            <TextField
                {...input('domain')}
                label="Usuario"
                suffix="@gmail.com"
                suffixAccessibilityLabel="En gmail punto com"
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TextField
                {...input('multiline')}
                label="Comentario"
                multiline
                counter
                maxLength={140}
                supportingText="Crece y se contrae con el contenido. Para formularios web se recomienda el área fija del siguiente ejemplo."
            />
            <TextField
                {...input('textarea')}
                label="Descripción extensa"
                multiline
                autoGrow={false}
                inputStyle={{ height: 96 }}
                counter
                maxLength={300}
                supportingText="Área fija con desplazamiento al superar cuatro líneas."
            />
        </Example>
    );
}

function ContactFormExample({ onEvent }: ExampleProps) {
    const { width } = useWindowDimensions();
    const [form, setForm] = useState({ first: '', last: '', email: '', notes: '' });
    const [attempted, setAttempted] = useState(false);
    const [saved, setSaved] = useState(false);
    const [albumOpen, setAlbumOpen] = useState(false);
    const [album, setAlbum] = useState('');
    const [albums, setAlbums] = useState<string[]>([]);
    const last = useRef<TextFieldHandle>(null),
        email = useRef<TextFieldHandle>(null),
        notes = useRef<TextFieldHandle>(null);
    const invalidEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    const update = (key: keyof typeof form) => (text: string) => {
        setSaved(false);
        setForm((previous) => ({ ...previous, [key]: text }));
    };
    const save = () => {
        setAttempted(true);
        if (!form.first.trim() || !form.last.trim() || invalidEmail) return;
        setSaved(true);
        onEvent('Contacto guardado en el ejemplo.');
    };
    return (
        <>
            <Example
                title="Contact form"
                description="* Campos obligatorios. La etiqueta y el asterisco comparten color. En un mismo formulario se mantiene una sola variante."
            >
                <View style={{ flexDirection: width >= 600 ? 'row' : 'column', gap: 16 }}>
                    <TextField
                        variant="outlined"
                        label="Nombre *"
                        value={form.first}
                        onChangeText={update('first')}
                        style={{ flex: width >= 600 ? 1 : undefined }}
                        error={attempted && !form.first.trim()}
                        errorText="Escribe tu nombre."
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => last.current?.focus()}
                        testID="catalog-field-contact-first"
                    />
                    <TextField
                        ref={last}
                        variant="outlined"
                        label="Apellido *"
                        value={form.last}
                        onChangeText={update('last')}
                        style={{ flex: width >= 600 ? 1 : undefined }}
                        error={attempted && !form.last.trim()}
                        errorText="Escribe tu apellido."
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => email.current?.focus()}
                        testID="catalog-field-contact-last"
                    />
                </View>
                <TextField
                    ref={email}
                    variant="outlined"
                    label="Correo electrónico *"
                    value={form.email}
                    onChangeText={update('email')}
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={attempted && invalidEmail}
                    errorText="Escribe una dirección completa como nombre@ejemplo.com."
                    supportingText="Recibirás la confirmación en esta dirección."
                    leadingIcon="mail"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => notes.current?.focus()}
                    testID="catalog-field-contact-email"
                />
                <Text variant="bodyLarge" nativeID="catalog-field-notes-label">
                    Notas (opcional)
                </Text>
                <TextField
                    ref={notes}
                    variant="outlined"
                    accessibilityLabel="Notas (opcional)"
                    aria-labelledby="catalog-field-notes-label"
                    value={form.notes}
                    onChangeText={update('notes')}
                    placeholder="Indicaciones adicionales"
                    multiline
                    autoGrow={false}
                    inputStyle={{ height: 96 }}
                    counter
                    maxLength={300}
                    submitBehavior="submit"
                    returnKeyType="done"
                    onSubmitEditing={save}
                    supportingText="Área fija con desplazamiento. Enter guarda; Mayús+Enter agrega una línea al usar teclado físico."
                    testID="catalog-field-contact-notes"
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <Button onPress={save} testID="catalog-field-contact-save">
                        Guardar contacto
                    </Button>
                    <Button variant="text" onPress={() => setAlbumOpen(true)} testID="catalog-field-album-open">
                        Crear álbum
                    </Button>
                </View>
                <Text accessibilityLiveRegion="polite" testID="catalog-field-contact-result">
                    {saved ? 'Contacto guardado.' : 'Completa el formulario para guardar el contacto.'}
                </Text>
                {albums.length > 0 && <Text testID="catalog-field-albums">Álbumes: {albums.join(', ')}</Text>}
            </Example>
            <Dialog visible={albumOpen} onDismiss={() => setAlbumOpen(false)} testID="catalog-field-album-dialog">
                <Dialog.Title>Nuevo álbum</Dialog.Title>
                <Dialog.Content>
                    <TextField
                        label="Nombre del álbum"
                        value={album}
                        onChangeText={setAlbum}
                        autoCorrect={false}
                        maxLength={60}
                        counter
                        testID="catalog-field-album-name"
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setAlbumOpen(false)} testID="catalog-field-album-cancel">
                        Cancelar
                    </Button>
                    <Button
                        variant="text"
                        disabled={!album.trim()}
                        onPress={() => {
                            setAlbums((current) => [...current, album.trim()]);
                            setAlbum('');
                            setAlbumOpen(false);
                            onEvent('Álbum creado.');
                        }}
                        testID="catalog-field-album-create"
                    >
                        Crear
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </>
    );
}
