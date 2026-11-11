import { useState, type ComponentProps, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import {
    Button,
    IconButton,
    LoadingIndicator,
    SplitButton,
    Switch,
    Text,
    Tooltip,
    useMobileTheme,
    type MobileDesignComponentId,
} from 'mobile-design/react-native';
import { type ButtonSize } from '@mobile-design/tokens';
import {
    AppendLoadingExample,
    EmbeddedLoadingExample,
    LoadingSuccessExample,
    TabLoadingExample,
    useActionWorkspace,
} from './mobile-design-action-scenarios';
import { useDemoTask } from './mobile-design-demo-task';
import { ButtonGroupExamples } from './mobile-design-button-group-examples';
import { TooltipExamples } from './mobile-design-tooltip-examples';
import { ButtonExamples } from './mobile-design-button-examples';

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
    const [favorite, setFavorite] = useState(false);
    const [saved, setSaved] = useState(false);
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
                        accessibilityLabel="Reproducción"
                        selected={playing}
                        onPress={() => setPlaying(!playing)}
                    />
                    <TipIconButton
                        mode="contained-tonal"
                        selected={favorite}
                        icon={favorite ? 'favorite_fill1' : 'favorite'}
                        accessibilityLabel="Favorito"
                        testID="md-icon-favorite"
                        onPress={() => {
                            setFavorite(!favorite);
                            onEvent(favorite ? 'Favorito quitado' : 'Favorito guardado');
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
                            selected={saved}
                            icon={saved ? 'bookmark_fill1' : 'bookmark-outline'}
                            accessibilityLabel={`Guardar documento · ${mode ?? 'Estándar'}`}
                            testID={`md-icon-save-${mode ?? 'standard'}`}
                            onPress={() => setSaved(!saved)}
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
                {playing ? 'Reproduciendo la colección' : 'Reproducción pausada'} · {saved ? 'Documento guardado' : 'Sin guardar'}
            </Text>
            {workspace.panel}
        </View>
    );
}

function Splits({ onEvent }: Events) {
    const workspace = useActionWorkspace(onEvent);
    const task = useDemoTask<string>();
    const [speed, setSpeed] = useState(1);
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
            <Part title="Velocidad de reproducción">
                <SplitButton
                    label={`${speed}×`}
                    primaryAccessibilityLabel={`Cambiar velocidad, actual ${speed}×`}
                    menuAccessibilityLabel="Elegir velocidad de reproducción"
                    onPress={() => setSpeed((value) => (value === 1 ? 1.5 : value === 1.5 ? 2 : 1))}
                    actions={[0.5, 1, 1.5, 2].map((value) => ({
                        key: String(value),
                        label: `${value}×`,
                        selected: value === speed,
                        onPress: () => setSpeed(value),
                    }))}
                    testID="md-split-speed"
                />
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
    const [showLarge, setShowLarge] = useState(false);
    return (
        <View style={{ gap: 24 }}>
            <Part title="Transformación de siete figuras">
                <Row>
                    <View style={{ alignItems: 'center', gap: 8 }}>
                        <LoadingIndicator animating={animating} accessibilityLabel="Sincronizando" testID="md-loading-uncontained" />
                        <Text variant="labelMedium">Sin contenedor</Text>
                    </View>
                    <View style={{ alignItems: 'center', gap: 8 }}>
                        <LoadingIndicator
                            animating={animating}
                            variant="contained"
                            accessibilityLabel="Cargando contenido"
                            testID="md-loading-contained"
                        />
                        <Text variant="labelMedium">Con contenedor</Text>
                    </View>
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
            <Part title="Tamaños de 24 a 240 dp">
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: 8 }}>
                    {[24, 48, 96].map((size) => (
                        <View key={size} style={{ alignItems: 'center', gap: 8 }}>
                            <View style={{ height: 96, justifyContent: 'center' }}>
                                <LoadingIndicator size={size} animating={animating} accessibilityLabel={`Cargando vista de ${size} dp`} />
                            </View>
                            <Text variant="labelMedium">{size} dp</Text>
                        </View>
                    ))}
                </View>
                <Button
                    variant="text"
                    style={{ alignSelf: 'flex-start' }}
                    accessibilityState={{ expanded: showLarge }}
                    onPress={() => setShowLarge((open) => !open)}
                    testID="md-loading-large-preview"
                >
                    {showLarge ? 'Ocultar muestra de 240 dp' : 'Ver muestra de 240 dp'}
                </Button>
                {showLarge ? (
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                        <LoadingIndicator
                            size={240}
                            animating={animating}
                            accessibilityLabel="Cargando vista de 240 dp"
                            testID="md-loading-size-240"
                        />
                    </View>
                ) : null}
                <Text>
                    El tamaño predeterminado es 48 dp, con una figura de 38 dp. Reserva los tamaños mayores para ventanas grandes.
                </Text>
            </Part>
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
            <LoadingSuccessExample onEvent={onEvent} />
            <EmbeddedLoadingExample />
            <AppendLoadingExample />
            <TabLoadingExample />
            <Text variant="bodyMedium">Para esperas breves. En procesos largos utiliza un indicador de progreso.</Text>
        </View>
    );
}

/** Each catalogue entry mounts only its own interactive examples. */
export function ActionExamples({ id, onEvent, onOpenPlayground }: ActionExamplesProps) {
    switch (id) {
        case 'buttons':
            return <ButtonExamples onEvent={onEvent} />;
        case 'icon-buttons':
            return <IconButtons onEvent={onEvent} />;
        case 'button-groups':
            return <ButtonGroupExamples onEvent={onEvent} />;
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
            return <TooltipExamples onEvent={onEvent} />;
        default:
            return null;
    }
}

export { ActionPlayground } from './mobile-design-action-playground';
