import { useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import {
    Button,
    FullScreenDialog,
    IconButton,
    LoadingIndicator,
    RichTooltip,
    SplitButton,
    Switch,
    Text,
    Tooltip,
    useMobileTheme,
    type MobileDesignComponentId,
} from 'mobile-design/react-native-web';
import { type ButtonSize } from '@mobile-design/tokens';
import {
    AppendLoadingExample,
    EmbeddedLoadingExample,
    LoadingSuccessExample,
    TabLoadingExample,
    useActionWorkspace,
} from './mobile-design-action-scenarios';
import { useDemoTask } from './mobile-design-demo-task';

export type ActionExamplesProps = { id: MobileDesignComponentId; onEvent: (message: string) => void; onOpenPlayground?: () => void };
type Events = Pick<ActionExamplesProps, 'onEvent'>;

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
function TipIconButton(props: ComponentProps<typeof IconButton>) {
    return (
        <Tooltip title={props.accessibilityLabel ?? 'Acción'} anchorStyle={{ alignSelf: 'center' }}>
            <IconButton {...props} />
        </Tooltip>
    );
}
const buttonSizes: ButtonSize[] = ['extra-small', 'small', 'medium', 'large', 'extra-large'];
function IconButtons({ onEvent }: Events) {
    const workspace = useActionWorkspace(onEvent);
    const [playing, setPlaying] = useState(false);
    const [selected, setSelected] = useState(false);
    return (
        <View style={{ gap: 24 }}>
            <Part title="Acciones: estándar, lleno, tonal y contorneado">
                <Row>
                    {([undefined, 'contained', 'contained-tonal', 'outlined'] as const).map((mode) => (
                        <TipIconButton
                            key={mode ?? 'standard'}
                            mode={mode}
                            icon="pencil"
                            accessibilityLabel={`Editar: ${mode ?? 'standard'}`}
                            onPress={() => workspace.open('compose', 'Editar documento')}
                        />
                    ))}
                </Row>
            </Part>
            <Part title="Cinco tamaños y tres anchos">
                <ScrollView
                    horizontal
                    contentContainerStyle={{ gap: 16, alignItems: 'center' }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    {buttonSizes.map((size) => (
                        <TipIconButton
                            key={size}
                            sizeClass={size}
                            icon="camera"
                            mode="contained-tonal"
                            accessibilityLabel={`Cámara ${size}`}
                            onPress={() => workspace.open('files', `Elegir imagen: ${size}`)}
                        />
                    ))}
                </ScrollView>
                <Row>
                    {(['narrow', 'default', 'wide'] as const).map((widthVariant) => (
                        <TipIconButton
                            key={widthVariant}
                            icon="arrow-right"
                            mode="outlined"
                            widthVariant={widthVariant}
                            accessibilityLabel={`Continuar: ${widthVariant}`}
                            onPress={() => workspace.open('preview', `Documento: ${widthVariant}`)}
                        />
                    ))}
                </Row>
            </Part>
            <Part title="Forma y conmutación">
                <Row>
                    <TipIconButton
                        shape="square"
                        mode="contained"
                        icon={playing ? 'pause' : 'play'}
                        accessibilityLabel={playing ? 'Pausar' : 'Reproducir'}
                        selected={playing}
                        onPress={() => setPlaying(!playing)}
                    />
                    <TipIconButton
                        mode="contained-tonal"
                        selected={selected}
                        icon={selected ? 'heart' : 'heart-outline'}
                        accessibilityLabel={selected ? 'Quitar favorito' : 'Guardar favorito'}
                        onPress={() => {
                            setSelected(!selected);
                            onEvent(selected ? 'Favorito quitado' : 'Favorito guardado');
                        }}
                    />
                </Row>
            </Part>
            <Part title="Conmutación en los cuatro tratamientos">
                <Row>
                    {([undefined, 'contained', 'contained-tonal', 'outlined'] as const).map((mode) => (
                        <TipIconButton
                            key={mode ?? 'standard'}
                            mode={mode}
                            selected={selected}
                            icon={selected ? 'bookmark' : 'bookmark-outline'}
                            accessibilityLabel={`${mode ?? 'Estándar'}: ${selected ? 'quitar guardado' : 'guardar'}`}
                            onPress={() => setSelected(!selected)}
                        />
                    ))}
                </Row>
                <Row>
                    {([undefined, 'contained', 'contained-tonal', 'outlined'] as const).map((mode) => (
                        <TipIconButton
                            key={mode ?? 'standard'}
                            mode={mode}
                            disabled
                            icon="bookmark-outline"
                            accessibilityLabel={`${mode ?? 'Estándar'} deshabilitado`}
                        />
                    ))}
                </Row>
            </Part>
            <Text accessibilityLiveRegion="polite">
                {playing ? 'Reproduciendo la colección' : 'Reproducción pausada'} · {selected ? 'Documento guardado' : 'Sin guardar'}
            </Text>
            {workspace.panel}
        </View>
    );
}

function Splits({ onEvent }: Events) {
    const workspace = useActionWorkspace(onEvent);
    const task = useDemoTask<string>();
    const send = () => {
        void task.run(async ({ wait }) => {
            await wait(1800);
            return `Mensaje enviado: ${workspace.document.title}`;
        });
    };
    const actions = [
        { key: 'schedule', label: 'Programar envío', icon: 'clock-outline', onPress: () => workspace.open('schedule', 'Programar envío') },
        {
            key: 'draft',
            label: 'Guardar borrador',
            icon: 'content-save-outline',
            onPress: () => workspace.open('compose', 'Editar borrador'),
        },
        { key: 'disabled', label: 'Sin permisos', disabled: true, onPress: () => onEvent('No debe ejecutarse') },
    ];
    return (
        <View style={{ gap: 24 }}>
            <Part title="Cuatro tratamientos">
                <View style={{ gap: 12 }}>
                    {(['filled', 'tonal', 'outlined', 'elevated'] as const).map((variant) => (
                        <SplitButton
                            key={variant}
                            variant={variant}
                            label={task.busy ? 'Enviando' : 'Enviar'}
                            icon="send"
                            disabled={task.busy}
                            onPress={send}
                            actions={actions}
                            testID={`md-split-${variant}`}
                        />
                    ))}
                </View>
            </Part>
            <Part title="Cinco tamaños">
                <ScrollView
                    horizontal
                    contentContainerStyle={{ gap: 16, alignItems: 'center' }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    {buttonSizes.map((size) => (
                        <SplitButton
                            key={size}
                            size={size}
                            variant="tonal"
                            label={size}
                            disabled={task.busy}
                            onPress={send}
                            actions={actions}
                        />
                    ))}
                </ScrollView>
            </Part>
            <Part title="Deshabilitado">
                <SplitButton disabled label="Enviar" onPress={() => onEvent('No debe ejecutarse')} actions={actions} />
            </Part>
            <Part title="Acción principal de icono">
                <SplitButton
                    label=""
                    icon="send"
                    primaryAccessibilityLabel="Enviar mensaje"
                    disabled={task.busy}
                    onPress={send}
                    actions={actions}
                />
            </Part>
            {task.busy ? (
                <Row>
                    <LoadingIndicator size={24} />
                    <Button variant="text" onPress={task.cancel}>
                        Cancelar envío
                    </Button>
                </Row>
            ) : null}
            {task.status === 'success' ? (
                <Text accessibilityLiveRegion="polite">{task.result}</Text>
            ) : task.status === 'cancelled' ? (
                <Text accessibilityLiveRegion="polite">Envío cancelado.</Text>
            ) : null}
            {workspace.panel}
        </View>
    );
}

function FloatingButtons({ onOpenPlayground }: Pick<ActionExamplesProps, 'onOpenPlayground'>) {
    return (
        <View style={{ gap: 16 }}>
            <Text>
                Una acción principal sobre una biblioteca desplazable. Prueba las tres alturas56/80/96dp, los seis colores semánticos y la
                aparición o salida.
            </Text>
            <Text variant="bodySmall">
                El ejemplo conserva un solo FAB, con icono lleno y posición fija durante el scroll. El tamaño medio es la recomendación
                general de M3; small40dp y surface no se presentan como variantes actuales.
            </Text>
            {onOpenPlayground ? (
                <Button style={{ alignSelf: 'flex-start' }} icon="open-in-new" onPress={onOpenPlayground} testID="md-fab-open-playground">
                    Abrir pantalla con FAB
                </Button>
            ) : null}
        </View>
    );
}

function ExtendedButtons({ onOpenPlayground }: Pick<ActionExamplesProps, 'onOpenPlayground'>) {
    return (
        <View style={{ gap: 16 }}>
            <Text>
                Un FAB extendido permanece sobre la biblioteca. Su etiqueta se contrae al bajar y vuelve al subir o llegar al final.
            </Text>
            <Text variant="bodySmall">
                Selecciona small56dp, medium80dp o large96dp y sus seis colores en la configuración separada. La etiqueta siempre existe: al
                quitar el icono no se contrae a un botón vacío.
            </Text>
            {onOpenPlayground ? (
                <Button
                    style={{ alignSelf: 'flex-start' }}
                    icon="open-in-new"
                    onPress={onOpenPlayground}
                    testID="md-extended-open-playground"
                >
                    Abrir FAB extendido con scroll
                </Button>
            ) : null}
        </View>
    );
}

function FloatingMenu({ onOpenPlayground }: Pick<ActionExamplesProps, 'onOpenPlayground'>) {
    return (
        <View style={{ gap: 16 }}>
            <Text>
                Un FAB abre dos o seis acciones relacionadas para crear contenido, alineadas al borde final de la pantalla. Cerrar, Volver o
                elegir una acción cierra el menú.
            </Text>
            <Text variant="bodySmall">
                El menú tiene un tamaño de ítem y tres familias de color. Puedes cambiar los tres tamaños y seis colores del FAB de origen;
                el cierre contrasta con los ítems. Con poca altura la lista pasa por detrás del cierre.
            </Text>
            {onOpenPlayground ? (
                <Button
                    style={{ alignSelf: 'flex-start' }}
                    icon="open-in-new"
                    onPress={onOpenPlayground}
                    testID="md-fab-menu-open-playground"
                >
                    Abrir pantalla con menú FAB
                </Button>
            ) : null}
        </View>
    );
}

function Loading({ onEvent, onOpenPlayground }: Events & Pick<ActionExamplesProps, 'onOpenPlayground'>) {
    const [animating, setAnimating] = useState(true);
    return (
        <View style={{ gap: 24 }}>
            <Part title="Contenedor opcional y morph de siete figuras">
                <Row>
                    <LoadingIndicator animating={animating} variant="contained" accessibilityLabel="Cargando contenido" />
                    <LoadingIndicator animating={animating} accessibilityLabel="Sincronizando" />
                </Row>
                <Row>
                    <Text>Animación activa</Text>
                    <Switch
                        value={animating}
                        onValueChange={(next) => {
                            setAnimating(next);
                            onEvent(next ? 'Carga reanudada' : 'Carga pausada');
                        }}
                        accessibilityLabel="Animar indicador de carga"
                    />
                </Row>
            </Part>
            <Part title="Tamaño adaptable:24–240dp">
                <ScrollView
                    horizontal
                    contentContainerStyle={{ gap: 24, alignItems: 'center' }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    {[24, 48, 96, 240].map((size) => (
                        <View key={size} style={{ alignItems: 'center', gap: 8 }}>
                            <LoadingIndicator size={size} animating={animating} accessibilityLabel={`Cargando vista de ${size}dp`} />
                            <Text variant="labelMedium">{size}dp</Text>
                        </View>
                    ))}
                </ScrollView>
                <Text>
                    El proceso continúa sin porcentaje. Cuando se conoce el avance, utiliza Progress indicators durante todo ese proceso.
                </Text>
            </Part>
            <LoadingSuccessExample onEvent={onEvent} />
            <EmbeddedLoadingExample />
            <AppendLoadingExample />
            <TabLoadingExample />
            {onOpenPlayground ? (
                <Button
                    style={{ alignSelf: 'flex-start' }}
                    icon="gesture-swipe-down"
                    onPress={onOpenPlayground}
                    testID="md-loading-open-playground"
                >
                    Abrir carga y pull-to-refresh
                </Button>
            ) : null}
            <Text variant="bodyMedium">Para esperas breves. En procesos largos utiliza un indicador de progreso.</Text>
        </View>
    );
}

function Tooltips({ onEvent }: Events) {
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
                    <Tooltip title="Guardar en favoritos">
                        <IconButton
                            icon={saved ? 'bookmark' : 'bookmark-outline'}
                            selected={saved}
                            accessibilityLabel={saved ? 'Quitar favorito' : 'Guardar en favoritos'}
                            onPress={() => setSaved(!saved)}
                        />
                    </Tooltip>
                    <Text>Mantén pulsado el icono.</Text>
                </Row>
            </Part>
            <Part title="Ayuda debajo del control">
                <Tooltip title="Buscar documentos" placement="below">
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
                        visible={active === configuration.id}
                        onDismiss={() => setActive(null)}
                        anchor={
                            <Button
                                variant="tonal"
                                onPress={() => setActive(configuration.id)}
                                onLongPress={() => setActive(configuration.id)}
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
            <TooltipFeaturePage />
            <Text accessibilityLiveRegion="polite">{saved ? 'Guardado en favoritos' : 'Sin guardar'}</Text>
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

/** Each catalogue entry mounts only its own interactive examples. */
export function ActionExamples({ id, onEvent, onOpenPlayground }: ActionExamplesProps) {
    switch (id) {
        case 'icon-buttons':
            return <IconButtons onEvent={onEvent} />;

        case 'split-button':
            return <Splits onEvent={onEvent} />;
        case 'floating-action-button':
            return <FloatingButtons onOpenPlayground={onOpenPlayground} />;
        case 'extended-fab':
            return <ExtendedButtons onOpenPlayground={onOpenPlayground} />;
        case 'fab-menu':
            return <FloatingMenu onOpenPlayground={onOpenPlayground} />;
        case 'loading-indicator':
            return <Loading onEvent={onEvent} onOpenPlayground={onOpenPlayground} />;
        case 'tooltips':
            return <Tooltips onEvent={onEvent} />;
        default:
            return null;
    }
}
