import { useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Button, FullScreenDialog, IconButton, RichTooltip, Text, Tooltip, useMobileTheme } from 'mobile-design/react-native';
import { useActionWorkspace } from './mobile-design-action-scenarios';
function Part({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={{ gap: 12 }}>
            <Text variant="titleMedium">{title}</Text>
            {children}
        </View>
    );
}
function Row({ children }: { children: ReactNode }) {
    return <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>{children}</View>;
}
type Events = { onEvent: (message: string) => void };
export function TooltipExamples({ onEvent }: Events) {
    const workspace = useActionWorkspace(onEvent);
    const [saved, setSaved] = useState(false);
    const [active, setActive] = useState<string | null>(null);
    const configurations = [
        {
            id: 'title-two',
            label: 'Título, cuerpo y dos acciones',
            anchor: 'Detalles de sincronización',
            title: 'Disponible sin conexión',
            body: 'Guarda una copia local para consultar el contenido cuando no tengas conexión.',
            actions: [
                { key: 'learn', label: 'Más información', onPress: () => workspace.open('preview', 'Información de sincronización') },
                { key: 'done', label: 'Entendido', onPress: () => setActive(null) },
            ],
        },
        {
            id: 'title-one',
            label: 'Título, cuerpo y una acción',
            anchor: 'Ayuda sobre borradores',
            title: 'Conservar un borrador',
            body: 'El borrador conserva el título y el texto de este documento.',
            actions: [{ key: 'save', label: 'Guardar copia', onPress: workspace.save }],
        },
        {
            id: 'title-none',
            label: 'Título y cuerpo',
            anchor: 'Dónde se guardan los datos',
            title: 'Datos locales',
            body: 'Los ejemplos conservan sus cambios en esta sesión. Pulsa fuera o vuelve atrás para cerrar la ayuda.',
            actions: [],
        },
        {
            id: 'body-one',
            label: 'Cuerpo y una acción',
            anchor: 'Ayuda para guardar',
            body: 'Confirma para guardar una copia del documento actual en la biblioteca local.',
            actions: [{ key: 'save', label: 'Guardar copia', onPress: workspace.save }],
        },
        {
            id: 'body-two',
            label: 'Cuerpo y dos acciones',
            anchor: 'Ayuda sobre la copia',
            body: 'Puedes consultar la copia actual sin modificar su contenido.',
            actions: [
                { key: 'preview', label: 'Ver copia', onPress: () => workspace.open('preview', workspace.document.title) },
                { key: 'done', label: 'Entendido', onPress: () => setActive(null) },
            ],
        },
    ];
    return (
        <View style={{ gap: 24 }}>
            <Part title="Ayuda breve">
                <Row>
                    <Tooltip title={saved ? 'Quitar favorito' : 'Guardar en favoritos'} testID="md-tooltip-favorite">
                        <IconButton
                            icon={saved ? 'bookmark' : 'bookmark-outline'}
                            selected={saved}
                            accessibilityLabel={saved ? 'Quitar favorito' : 'Guardar en favoritos'}
                            onPress={() => setSaved(!saved)}
                            testID="md-tooltip-favorite-anchor"
                        />
                    </Tooltip>
                    <Text>Mantén pulsado el icono.</Text>
                </Row>
            </Part>
            <Part title="Ayuda debajo del control">
                <Tooltip title="Buscar documentos" placement="below" testID="md-tooltip-below">
                    <IconButton
                        icon="search"
                        accessibilityLabel="Buscar documentos"
                        onPress={() => workspace.open('files', 'Buscar documentos')}
                        testID="md-tooltip-below-anchor"
                    />
                </Tooltip>
                <Text variant="bodySmall">La posición inferior se utiliza, por ejemplo, para controles de una app bar.</Text>
            </Part>
            <Part title="Rich transitorio: mantener pulsado, hover o foco">
                <RichTooltip
                    persistent={false}
                    anchor={
                        <Button
                            variant="outlined"
                            onPress={() => workspace.open('preview', 'Estado de sincronización')}
                            testID="md-rich-tooltip-transient-anchor"
                        >
                            Sincronización
                        </Button>
                    }
                    title="Cambios locales"
                    testID="md-rich-tooltip-transient"
                >
                    Los documentos de esta demostración conservan sus cambios durante la sesión.
                </RichTooltip>
            </Part>
            {configurations.map((configuration) => (
                <Part key={configuration.id} title={configuration.label}>
                    <RichTooltip
                        persistent
                        visible={active === configuration.id}
                        onDismiss={() => setActive(null)}
                        anchor={
                            <Button
                                variant="tonal"
                                onPress={() => setActive(configuration.id)}
                                testID={`md-rich-tooltip-anchor-${configuration.id}`}
                            >
                                {configuration.anchor}
                            </Button>
                        }
                        title={configuration.title}
                        actions={configuration.actions}
                        testID={`md-rich-tooltip-${configuration.id}`}
                    >
                        {configuration.body}
                    </RichTooltip>
                </Part>
            ))}
            <Part title="Present now · Settings">
                <Row>
                    <Tooltip title="Present now" testID="md-tooltip-present">
                        <IconButton
                            icon="present_to_all"
                            accessibilityLabel="Present now"
                            onPress={() => onEvent('Presentación iniciada')}
                            testID="md-tooltip-present-anchor"
                        />
                    </Tooltip>
                    <Tooltip title="Settings" testID="md-tooltip-settings">
                        <IconButton
                            icon="settings"
                            accessibilityLabel="Settings"
                            onPress={() => onEvent('Ajustes abiertos')}
                            testID="md-tooltip-settings-anchor"
                        />
                    </Tooltip>
                </Row>
            </Part>
            <TooltipPlacementExamples />
            <TooltipFeaturePage />
            <Text accessibilityLiveRegion="polite" testID="md-tooltip-result">
                {saved ? 'Guardado en favoritos' : 'Sin guardar'}
            </Text>
            {workspace.panel}
        </View>
    );
}

/** A persistent help message introduces a feature when its local page loads. */
function TooltipFeaturePage() {
    const theme = useMobileTheme();
    const [page, setPage] = useState<'closed' | 'library' | 'info'>('closed');
    const [help, setHelp] = useState(false),
        [collection, setCollection] = useState('Todos los documentos');
    const pendingIntroduction = useRef(false);
    const close = () => {
        pendingIntroduction.current = false;
        setHelp(false);
        setPage('closed');
    };
    return (
        <Part title="Ayuda al entrar en una página · enlace en el texto">
            <Text>
                La biblioteca presenta su nueva colección al abrirse. El enlace lleva a información local; la ayuda no bloquea una tarea
                pendiente.
            </Text>
            <Button
                style={{ alignSelf: 'flex-start' }}
                variant="outlined"
                icon="folder-outline"
                onPress={() => {
                    pendingIntroduction.current = true;
                    setHelp(false);
                    setPage('library');
                }}
                testID="md-tooltip-feature-open"
            >
                Abrir biblioteca
            </Button>
            <FullScreenDialog
                visible={page !== 'closed'}
                title={page === 'info' ? 'Colecciones compartidas' : 'Biblioteca'}
                onDismiss={close}
                testID="md-tooltip-feature-page"
            >
                {page === 'library' ? (
                    <View
                        style={{ gap: 16 }}
                        onLayout={() => {
                            if (pendingIntroduction.current) {
                                pendingIntroduction.current = false;
                                setHelp(true);
                            }
                        }}
                        testID="md-tooltip-feature-content"
                    >
                        <Text variant="headlineSmall">Tu biblioteca</Text>
                        <RichTooltip
                            persistent
                            visible={help}
                            onDismiss={() => setHelp(false)}
                            title="Nueva colección compartida"
                            anchor={
                                <Button
                                    variant="tonal"
                                    icon="account-multiple-outline"
                                    onPress={() => {
                                        setHelp(false);
                                        setCollection('Colecciones compartidas');
                                    }}
                                    testID="md-tooltip-feature-anchor"
                                >
                                    Colecciones compartidas
                                </Button>
                            }
                            actions={[{ key: 'understood', label: 'Entendido', onPress: () => setHelp(false) }]}
                            testID="md-tooltip-feature-help"
                        >
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                Reúne los documentos de tu equipo en un mismo lugar.{' '}
                                <Text
                                    accessibilityRole="link"
                                    style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}
                                    onPress={() => {
                                        setHelp(false);
                                        setPage('info');
                                    }}
                                    testID="md-tooltip-feature-link"
                                >
                                    Conoce cómo funciona
                                </Text>
                                .
                            </Text>
                        </RichTooltip>
                        <Text accessibilityLiveRegion="polite" testID="md-tooltip-feature-selection">
                            {collection}
                        </Text>
                        <Text>
                            {collection === 'Colecciones compartidas'
                                ? 'Guía de estilo · Notas de la revisión · Calendario del equipo'
                                : 'Documento personal · Ideas del proyecto'}
                        </Text>
                    </View>
                ) : page === 'info' ? (
                    <View style={{ gap: 16 }} testID="md-tooltip-feature-information">
                        <Text variant="headlineSmall">Documentos de tu equipo</Text>
                        <Text>
                            Las colecciones compartidas agrupan documentos para encontrarlos juntos. En esta demostración los documentos y
                            sus cambios permanecen en esta sesión; no se envía ninguna invitación.
                        </Text>
                        <Button
                            style={{ alignSelf: 'flex-start' }}
                            variant="text"
                            onPress={() => setPage('library')}
                            testID="md-tooltip-feature-back"
                        >
                            Volver a la biblioteca
                        </Button>
                    </View>
                ) : null}
            </FullScreenDialog>
        </Part>
    );
}

function TooltipPlacementExamples() {
    const [page, setPage] = useState(false),
        [active, setActive] = useState<string | null>(null),
        [result, setResult] = useState('');
    return (
        <Part title="Paint Tool · posición adaptativa">
            <Button variant="outlined" onPress={() => setPage(true)} testID="md-tooltip-placement-open">
                Abrir herramientas
            </Button>
            <FullScreenDialog
                visible={page}
                onDismiss={() => {
                    setActive(null);
                    setPage(false);
                }}
                title="Herramientas"
                scrollable={false}
                testID="md-tooltip-placement-page"
            >
                <View style={{ flex: 1, padding: 16, justifyContent: 'space-between' }}>
                    <Text
                        style={{ position: 'absolute', top: '45%', left: 16, right: 16 }}
                        accessibilityLiveRegion="polite"
                        testID="md-tooltip-placement-result"
                    >
                        {result || 'Prueba los controles en las cuatro esquinas.'}
                    </Text>
                    {['top', 'bottom'].map((edge) => (
                        <View key={edge} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            {['start', 'end'].map((side) => (
                                <RichTooltip
                                    key={side}
                                    persistent
                                    visible={active === edge + side}
                                    onDismiss={() => setActive(null)}
                                    title="Paint Tool"
                                    anchor={
                                        <Button
                                            variant="tonal"
                                            icon="brush"
                                            onPress={() => setActive(edge + side)}
                                            testID={'md-tooltip-paint-anchor-' + edge + side}
                                        >
                                            Paint
                                        </Button>
                                    }
                                    actions={[
                                        {
                                            key: 'learn',
                                            label: 'Learn more',
                                            onPress: () => setResult('Añade anotaciones y resaltados con Paint Tool.'),
                                        },
                                    ]}
                                    testID={'md-tooltip-paint-' + edge + side}
                                >
                                    Add annotations and highlights with the paint tool.
                                </RichTooltip>
                            ))}
                        </View>
                    ))}
                </View>
            </FullScreenDialog>
        </Part>
    );
}
