import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Switch, Text, TextField, Toolbar, useMobileTheme, type ToolbarAction } from 'mobile-design/react-native';
import { Surface, useTheme, type Theme } from 'react-native-paper';
import { initialDocument, sameDocument } from './mobile-design-navigation-state';
import { ToolbarUsageExamples } from './mobile-design-toolbar-usage-examples';
type ExampleProps = { onEvent: (message: string) => void };
function Example({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium">{title}</Text>
            {description && <Text>{description}</Text>}
            {children}
        </View>
    );
}
function Toggle({
    label,
    value,
    onValueChange,
    testID,
}: {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    testID: string;
}) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ flex: 1 }}>{label}</Text>
            <Switch value={value} onValueChange={onValueChange} accessibilityLabel={label} testID={testID} />
        </View>
    );
}
export function ToolbarExamples({ onEvent }: ExampleProps) {
    const theme = useTheme<Theme>();
    const [document, setDocument] = useState({ ...initialDocument });
    const [savedDocument, setSavedDocument] = useState({ ...initialDocument });
    const [visible, setVisible] = useState(true);
    const [vibrant, setVibrant] = useState(false);
    const [toolbarExpanded, setToolbarExpanded] = useState(true);
    const [withFab, setWithFab] = useState(false);
    const [vertical, setVertical] = useState(false);
    const [revision, setRevision] = useState(0);
    const [moreActions, setMoreActions] = useState(false);
    const dirty = !sameDocument(document, savedDocument);
    const save = () => {
        if (!dirty) return;
        setSavedDocument({ ...document });
        setRevision((value) => value + 1);
        onEvent('Texto y formato guardados en la versión local.');
    };
    const actions: readonly ToolbarAction[] = [
        {
            key: 'bold',
            icon: 'format-bold',
            label: 'Negrita',
            selected: document.bold,
            onPress: () => setDocument((value) => ({ ...value, bold: !value.bold })),
        },
        {
            key: 'italic',
            icon: 'format-italic',
            label: 'Cursiva',
            selected: document.italic,
            onPress: () => setDocument((value) => ({ ...value, italic: !value.italic })),
        },
        {
            key: 'favorite',
            icon: document.favorite ? 'star' : 'star-outline',
            label: 'Destacar',
            selected: document.favorite,
            onPress: () => setDocument((value) => ({ ...value, favorite: !value.favorite })),
        },
        { key: 'save', icon: 'content-save-outline', label: 'Guardar documento', mode: 'contained', disabled: !dirty, onPress: save },
        ...(moreActions
            ? [
                  {
                      key: 'undo',
                      icon: 'undo',
                      label: 'Recuperar versión guardada',
                      disabled: !dirty,
                      onPress: () => setDocument({ ...savedDocument }),
                  },
                  {
                      key: 'uppercase',
                      icon: 'format-letter-case',
                      label: 'Convertir a mayúsculas',
                      disabled: !document.text,
                      onPress: () => setDocument((value) => ({ ...value, text: value.text.toLocaleUpperCase('es-MX') })),
                  },
                  {
                      key: 'clear',
                      icon: 'delete-outline',
                      label: 'Vaciar documento',
                      disabled: !document.text,
                      onPress: () => setDocument((value) => ({ ...value, text: '' })),
                  },
              ]
            : []),
    ];
    const preview = (
        <Text variant="bodyLarge" style={{ fontWeight: document.bold ? '700' : '400', fontStyle: document.italic ? 'italic' : 'normal' }}>
            {document.text}
            {document.favorite ? ' ★' : ''}
        </Text>
    );
    return (
        <View style={{ gap: 32 }}>
            <ToolbarReferenceExamples onEvent={onEvent} />
            <ToolbarUsageExamples onEvent={onEvent} />
            <Example
                title="Editar, guardar y recuperar"
                description="El texto y formato son un borrador. Guardar crea una versión local; Cancelar cambios restaura esa versión. Guardar se deshabilita cuando no hay cambios."
            >
                <TextField
                    label="Documento"
                    value={document.text}
                    onChangeText={(text) => setDocument((value) => ({ ...value, text }))}
                    multiline
                    testID="catalog-toolbar-document"
                />
                {preview}
                <Text testID="catalog-toolbar-save-state">
                    {dirty ? 'Cambios sin guardar' : 'Versión guardada'} · revisión {revision}
                </Text>
                <Button
                    style={{ alignSelf: 'flex-start' }}
                    variant="outlined"
                    disabled={!dirty}
                    onPress={() => setDocument({ ...savedDocument })}
                    testID="catalog-toolbar-cancel"
                >
                    Cancelar cambios
                </Button>
                <Text variant="labelLarge">Última versión guardada</Text>
                <Text style={{ fontWeight: savedDocument.bold ? '700' : '400', fontStyle: savedDocument.italic ? 'italic' : 'normal' }}>
                    {savedDocument.text}
                    {savedDocument.favorite ? ' ★' : ''}
                </Text>
                <Toggle label="Color vibrante" value={vibrant} onValueChange={setVibrant} testID="catalog-toolbar-vibrant" />
                <Toggle label="Mostrar barras" value={visible} onValueChange={setVisible} testID="catalog-toolbar-visible" />
                <Toggle
                    label="Acciones adicionales con menú de desbordamiento"
                    value={moreActions}
                    onValueChange={setMoreActions}
                    testID="catalog-toolbar-more-actions"
                />
            </Example>
            <Example
                title="Docked"
                description="La barra ocupa todo el borde inferior de esta región de trabajo, con controles separados del contenido."
            >
                <Surface mode="flat" elevation={0} style={{ backgroundColor: theme.colors.surfaceContainerLow }}>
                    <View style={{ minHeight: 160, padding: 24 }}>{preview}</View>
                    <Toolbar
                        actions={actions}
                        variant="docked"
                        safeArea={false}
                        color={vibrant ? 'vibrant' : 'standard'}
                        visible={visible}
                        testID="catalog-toolbar-docked"
                    />
                </Surface>
            </Example>
            <Example
                title="Flotante horizontal y vertical"
                description="La barra conserva los márgenes de su región. Con FAB, contraer oculta las acciones y agranda Guardar; los cambios pendientes se conservan."
            >
                <Toggle label="Incluir FAB de Guardar" value={withFab} onValueChange={setWithFab} testID="catalog-toolbar-fab" />
                <Toggle label="Expandida" value={toolbarExpanded} onValueChange={setToolbarExpanded} testID="catalog-toolbar-expanded" />
                <Toggle label="Orientación vertical" value={vertical} onValueChange={setVertical} testID="catalog-toolbar-vertical" />
                <Surface
                    mode="flat"
                    elevation={0}
                    style={{ minHeight: vertical ? 392 : 280, backgroundColor: theme.colors.surfaceContainerLow, position: 'relative' }}
                >
                    <View style={{ padding: 24, paddingEnd: vertical ? 128 : 24, paddingBottom: vertical ? 24 : 112 }}>{preview}</View>
                    <Toolbar
                        actions={withFab ? actions.filter((action) => action.key !== 'save') : actions}
                        fab={withFab ? actions[3] : undefined}
                        maxVisibleActions={vertical ? 4 : undefined}
                        expanded={toolbarExpanded}
                        safeArea={false}
                        variant="floating"
                        orientation={vertical ? 'vertical' : 'horizontal'}
                        color={vibrant ? 'vibrant' : 'standard'}
                        visible={visible}
                        style={
                            vertical ? { position: 'absolute', right: 0, top: 0 } : { position: 'absolute', bottom: 0, maxWidth: '100%' }
                        }
                        testID="catalog-toolbar-floating"
                    />
                </Surface>
            </Example>
        </View>
    );
}

function ToolbarReferenceExamples({ onEvent }: ExampleProps) {
    const [selected, setSelected] = useState<string[]>(['bold']);
    const [last, setLast] = useState('Selecciona una herramienta.');
    const [comment, setComment] = useState('');
    const run = (label: string) => {
        setLast(label);
        onEvent(label);
    };
    const mail: ToolbarAction[] = [
        ['archive', 'archive', 'Archivar'],
        ['delete', 'delete', 'Eliminar'],
        ['unread', 'mark_email_unread', 'Marcar sin leer'],
        ['snooze', 'snooze', 'Posponer'],
        ['star', 'star', 'Destacar'],
    ].map(([key, icon, label]) => ({ key, icon, label, onPress: () => run(label) }));
    const editing: ToolbarAction[] = [
        ['bold', 'format_bold', 'Negrita'],
        ['italic', 'format_italic', 'Cursiva'],
        ['underline', 'format_underlined', 'Subrayado'],
        ['color', 'format_color_text', 'Color de texto'],
        ['paint', 'format_color_fill', 'Color de fondo'],
    ].map(([key, icon, label]) => ({
        key,
        icon,
        label,
        selected: ['bold', 'italic', 'underline'].includes(key) ? selected.includes(key) : undefined,
        onPress: () => {
            setSelected((current) => (current.includes(key) ? current.filter((value) => value !== key) : [...current, key]));
            run(label);
        },
    }));
    return (
        <>
            <Example
                title="Docked · Standard y Vibrant"
                description="64 dp, esquinas rectas, margen interior mínimo de 16 dp y objetivos de 48 dp. La separación se adapta al ancho disponible."
            >
                {(['standard', 'vibrant'] as const).map((color) => (
                    <Toolbar
                        key={color}
                        variant="docked"
                        color={color}
                        actions={mail}
                        safeArea={false}
                        testID={'catalog-toolbar-mail-' + color}
                    />
                ))}
            </Example>
            <Example
                title="Floating · Standard y Vibrant"
                description="Contenedor redondeado, 8 dp de padding interior y separación de 4 dp. Los controles conservan su propia forma y estado."
            >
                {(['standard', 'vibrant'] as const).map((color) => (
                    <Toolbar
                        key={color}
                        variant="floating"
                        color={color}
                        actions={editing}
                        safeArea={false}
                        maxVisibleActions={4}
                        testID={'catalog-toolbar-edit-' + color}
                    />
                ))}
                <Text testID="catalog-toolbar-reference-result" accessibilityLiveRegion="polite">
                    {last}
                </Text>
            </Example>
            <Example
                title="Slots · texto, botón e iconos"
                description="La acción principal tiene un único énfasis. Los otros elementos conservan su propio comportamiento."
            >
                <Toolbar
                    variant="docked"
                    actions={[]}
                    safeArea={false}
                    leading={<IconButton icon="close" accessibilityLabel="Cancelar" onPress={() => run('Edición cancelada')} />}
                    trailing={<Button onPress={() => run('Cambios aplicados')}>Aplicar</Button>}
                    testID="catalog-toolbar-slots"
                >
                    <Text variant="titleMedium">Editar foto</Text>
                </Toolbar>
            </Example>
            <Example
                title="Slot · campo de texto"
                description="Los slots conservan el teclado y la medición del componente que contienen. La altura se adapta al contenido."
            >
                <Toolbar variant="floating" actions={[]} safeArea={false} testID="catalog-toolbar-field-slot">
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <TextField
                            label="Comentario"
                            value={comment}
                            onChangeText={setComment}
                            style={{ width: 160 }}
                            testID="catalog-toolbar-slot-comment"
                        />
                        <IconButton
                            icon="send"
                            mode="contained"
                            disabled={!comment.trim()}
                            accessibilityLabel="Enviar comentario"
                            onPress={() => {
                                run('Enviado: ' + comment.trim());
                                setComment('');
                            }}
                            testID="catalog-toolbar-slot-send"
                        />
                    </View>
                </Toolbar>
            </Example>
        </>
    );
}
