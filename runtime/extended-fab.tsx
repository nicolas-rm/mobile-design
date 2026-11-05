import { SelectField } from './select-field';
import { Prose, RuntimeTextRoot } from './prose';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
    Button,
    FAB,
    Icon,
    MobileDesignProvider,
    ContainerTransformSurface,
    TextField,
    Tooltip,
    useMobileTheme,
    type ContainerTransformOrigin,
    type FABSize,
    type FABVariant,
    type TextFieldHandle,
} from 'mobile-design';
import { cancelAnimation, useSharedValue, withTiming, Easing, ReduceMotion } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { RuntimeBridge, useRuntimeEnvironment } from './environment';

const sizes: FABSize[] = ['default', 'medium', 'large'];
const variants: FABVariant[] = ['tonalPrimary', 'tonalSecondary', 'tonalTertiary', 'primary', 'secondary', 'tertiary'];
const variantNames = ['Tonal primary', 'Tonal secondary', 'Tonal tertiary', 'Primary', 'Secondary', 'Tertiary'];
const scenarios = {
    mail: {
        title: 'Recibidos',
        label: 'Redactar',
        icon: 'pencil-outline',
        form: 'Nuevo mensaje',
        field: 'Asunto',
        submit: 'Enviar',
        result: 'Mensaje enviado.',
        rows: [
            'Reunión de diseño',
            'Tu próxima lectura',
            'Una idea para el viernes',
            'Materiales del proyecto',
            'Nos vemos pronto',
            'Novedades de la semana',
            'Revisión de la propuesta',
            'Notas del equipo',
            'La próxima entrega',
            'Un nuevo comienzo',
            'Planes compartidos',
            'Gracias por tu mensaje',
        ],
    },
    checkout: {
        title: 'Tu carrito',
        label: 'Comprar',
        icon: 'cart-outline',
        form: 'Finalizar compra',
        field: 'Dirección de entrega',
        submit: 'Confirmar compra',
        result: 'Compra confirmada.',
        rows: [
            'Lámpara de escritorio',
            'Cuaderno de notas',
            'Taza de cerámica',
            'Bolsa de algodón',
            'Libro de diseño',
            'Planta de interior',
            'Lápices de colores',
            'Organizador',
            'Vela aromática',
            'Marco de madera',
            'Libreta de viaje',
            'Botella reutilizable',
        ],
    },
    article: {
        title: 'Tu artículo',
        label: 'Publicar',
        icon: 'publish',
        form: 'Publicar artículo',
        field: 'Título',
        submit: 'Publicar',
        result: 'Artículo publicado.',
        rows: [
            'Una idea que merece contarse',
            'El comienzo de la historia',
            'Un lugar para la inspiración',
            'Observa los pequeños detalles',
            'Encuentra tu propio ritmo',
            'Dale espacio a las ideas',
            'Las personas primero',
            'Una perspectiva diferente',
            'Aprender del proceso',
            'Lo que viene después',
            'Una pausa para pensar',
            'El siguiente capítulo',
        ],
    },
    tasks: {
        title: 'Mis tareas',
        label: 'Nueva tarea',
        icon: 'plus',
        form: 'Crear tarea',
        field: 'Nombre de la tarea',
        submit: 'Crear',
        result: 'Tarea creada.',
        rows: [
            'Preparar la presentación',
            'Revisar los bocetos',
            'Organizar la biblioteca',
            'Compartir la propuesta',
            'Actualizar las notas',
            'Planear la semana',
            'Leer el nuevo capítulo',
            'Elegir una portada',
            'Reunir referencias',
            'Confirmar la reunión',
            'Revisar el calendario',
            'Anotar nuevas ideas',
        ],
    },
    flights: {
        title: 'Tu próximo viaje',
        label: 'Buscar vuelos',
        icon: 'airplane',
        form: 'Buscar vuelos',
        field: 'Destino',
        submit: 'Buscar',
        result: '3 vuelos disponibles para tu destino.',
        rows: [
            'Ciudad de México',
            'Monterrey',
            'Guadalajara',
            'Mérida',
            'Cancún',
            'Oaxaca',
            'Puerto Vallarta',
            'La Paz',
            'Querétaro',
            'Tijuana',
            'Hermosillo',
            'León',
        ],
    },
};
type Scenario = keyof typeof scenarios;
const filledIcons: Record<Scenario, string> = {
    mail: 'edit_fill1',
    checkout: 'shopping_cart_fill1',
    article: 'publish_fill1',
    tasks: 'add_fill1',
    flights: 'flight_fill1',
};

export function FABUsage({ direction, extended = true }: { extended?: boolean; direction: 'ltr' | 'rtl' }) {
    const theme = useMobileTheme();
    const [scenario, setScenario] = useState<Scenario>('mail');
    const item = scenarios[scenario];
    const filledIcon = filledIcons[scenario];
    const [alignment, setAlignment] = useState('end');
    const [rail, setRail] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [open, setOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const closing = useRef(false);
    const [wide, setWide] = useState(false);
    const [value, setValue] = useState('');
    const [body, setBody] = useState('');
    const [result, setResult] = useState('');
    const [created, setCreated] = useState<string[]>([]);
    const scene = useRef<HTMLDivElement>(null),
        scroller = useRef<HTMLDivElement>(null),
        opener = useRef<HTMLElement | null>(null),
        field = useRef<TextFieldHandle>(null);
    const previousY = useRef(0);
    const progress = useSharedValue(0);
    const [origin, setOrigin] = useState<ContainerTransformOrigin>();
    const [ready, setReady] = useState(false);
    const finishClose = useCallback(() => {
        setOpen(false);
        requestAnimationFrame(() => {
            if (opener.current?.isConnected) opener.current.focus();
        });
    }, []);
    const transition = useCallback(
        (to: number) => {
            const curve = theme.motion.easing.emphasized,
                duration = (to ? theme.motion.duration.long2 : theme.motion.duration.medium4) * theme.animation.scale;
            progress.set(
                withTiming(to, { duration, easing: Easing.bezier(...curve), reduceMotion: ReduceMotion.Never }, (finished) => {
                    if (finished && to === 0) scheduleOnRN(finishClose);
                })
            );
        },
        [theme, progress, finishClose]
    );
    const measured = useCallback(
        (source: ContainerTransformOrigin) => {
            if (source === origin) setReady(true);
        },
        [origin]
    );
    useEffect(() => {
        if (open && (ready || theme.animation.scale === 0) && !isClosing) transition(1);
    }, [open, ready, isClosing, transition]);
    useEffect(() => () => cancelAnimation(progress), [progress]);
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            const fits = entries[0].contentRect.width >= 600;
            setWide(fits);
            if (!fits) setRail(false);
        });
        observer.observe(scene.current!);
        return () => observer.disconnect();
    }, []);
    useEffect(() => {
        if (theme.animation.scale === 0) {
            progress.set(open && !closing.current ? 1 : 0);
            if (closing.current) finishClose();
        }
    }, [open, progress, theme.animation.scale, finishClose]);
    useEffect(() => {
        if (!open) return;
        const frame = requestAnimationFrame(() => field.current?.focus());
        return () => cancelAnimationFrame(frame);
    }, [open]);
    const show = (event: { currentTarget: unknown }) => {
        const trigger = event.currentTarget as HTMLElement,
            button = trigger.getBoundingClientRect();
        opener.current = trigger;
        setOrigin({
            x: button.left,
            y: button.top,
            width: button.width,
            height: button.height,
            borderRadius: parseFloat(getComputedStyle(trigger).borderRadius) || 16,
            backgroundColor: theme.colors.primaryContainer,
        });
        progress.set(0);
        setReady(false);
        closing.current = false;
        setIsClosing(false);
        setValue('');
        setBody('');
        setOpen(true);
    };
    const close = () => {
        if (closing.current) return;
        closing.current = true;
        setIsClosing(true);
        transition(0);
    };
    const submit = () => {
        const title = value.trim();
        if (closing.current || !title) return;
        if (scenario === 'tasks' || scenario === 'mail') setCreated((rows) => [title, ...rows]);
        setResult(item.result);
        close();
    };
    const choose = (next: Scenario) => {
        setScenario(next);
        setCreated([]);
        setResult('');
        setExpanded(true);
        previousY.current = 0;
        if (scroller.current) scroller.current.scrollTop = 0;
    };
    return (
        <section className="usage-section" aria-labelledby="fab-usage-title">
            <Prose as="h2" id="fab-usage-title">
                Ejemplos en acción
            </Prose>
            <Prose as="p">
                {extended
                    ? 'Una acción principal persistente. Desplaza el contenido hacia abajo para contraerla; la etiqueta vuelve al subir o llegar al final.'
                    : 'Una acción principal persistente que conserva su posición mientras se desplaza el contenido. Abre y completa la tarea.'}
            </Prose>
            <Prose as="div" className="playground-controls">
                <SelectField
                    label="Ejemplo"
                    id="fab-scenario"
                    disabled={open}
                    value={scenario}
                    onValueChange={(nextValue) => choose(nextValue as Scenario)}
                    options={Object.entries(scenarios).map(([key, s]) => ({ value: key, label: s.title }))}
                />
                <SelectField
                    label="Posición"
                    id="fab-alignment"
                    disabled={open}
                    value={alignment}
                    onValueChange={(nextValue) => setAlignment(nextValue)}
                    options={[
                        { value: 'end', label: 'Extremo final' },
                        { value: 'center', label: 'Centro inferior' },
                    ]}
                />
                <Prose as="div" className="state-options">
                    <Prose as="label">
                        <input
                            id="fab-rail"
                            disabled={open || !wide}
                            type="checkbox"
                            checked={rail}
                            onChange={(e) => setRail(e.target.checked)}
                        />
                        Navegación expandida (ancho amplio)
                    </Prose>
                </Prose>
            </Prose>
            <Prose as="div" className={'fab-scene' + (rail ? ' with-rail' : '')} ref={scene} dir={direction} data-open={open}>
                <Prose as="div" className="fab-scene-content" inert={open}>
                    <header>
                        <Prose as="h3">{item.title}</Prose>
                    </header>
                    {rail ? (
                        <aside className="fab-example-rail" aria-label="Acción principal">
                            {extended ? (
                                <FAB.Extended icon={item.icon} label={item.label} elevation={0} onPress={show} testID="usage-rail-fab" />
                            ) : (
                                <Tooltip title={item.label}>
                                    <FAB
                                        icon={filledIcon}
                                        elevation={0}
                                        accessibilityLabel={item.label}
                                        onPress={show}
                                        testID="usage-rail-fab"
                                    />
                                </Tooltip>
                            )}
                            <Prose as="span">Tu espacio</Prose>
                        </aside>
                    ) : null}
                    <Prose
                        as="div"
                        className="fab-scroll-content"
                        id="fab-scroll-content"
                        ref={scroller}
                        tabIndex={0}
                        aria-label={'Contenido de ' + item.title}
                        onScroll={(e) => {
                            if (!extended) return;
                            const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
                            const y = Math.max(0, scrollTop),
                                delta = y - previousY.current,
                                bottom = y + clientHeight >= scrollHeight - 1;
                            if (Math.abs(delta) > 1 || y === 0 || bottom) {
                                setExpanded(y === 0 || bottom || delta < 0);
                                previousY.current = y;
                            }
                        }}
                    >
                        {[...created, ...item.rows].map((row, index) => (
                            <Prose as="div" className="fab-example-row" key={row + index}>
                                <Prose as="span" className="example-row-icon">
                                    <Icon
                                        source={
                                            scenario === 'mail'
                                                ? 'email-outline'
                                                : scenario === 'tasks'
                                                  ? 'checkbox-blank-outline'
                                                  : scenario === 'flights'
                                                    ? 'map-marker-outline'
                                                    : scenario === 'checkout'
                                                      ? 'shopping-outline'
                                                      : 'text-box-outline'
                                        }
                                        size={24}
                                    />
                                </Prose>
                                <Prose as="span">
                                    <Prose as="strong">{row}</Prose>
                                    <Prose as="small">
                                        {scenario === 'checkout'
                                            ? '1 artículo'
                                            : scenario === 'article'
                                              ? 'Ideas, historias y una nueva perspectiva.'
                                              : 'Una nueva oportunidad para crear.'}
                                    </Prose>
                                </Prose>
                            </Prose>
                        ))}
                    </Prose>
                    {!rail ? (
                        <Prose as="div" className={'fab-example-dock ' + alignment}>
                            {extended ? (
                                <FAB.Extended icon={item.icon} label={item.label} expanded={expanded} onPress={show} testID="usage-fab" />
                            ) : (
                                <Tooltip title={item.label}>
                                    <FAB
                                        icon={filledIcon}
                                        size="medium"
                                        accessibilityLabel={item.label}
                                        onPress={show}
                                        testID="usage-fab"
                                    />
                                </Tooltip>
                            )}
                        </Prose>
                    ) : null}
                </Prose>
                {open ? (
                    <View style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
                        <ContainerTransformSurface
                            origin={origin}
                            transforming={theme.animation.scale !== 0}
                            entering={!isClosing}
                            progress={progress}
                            onMeasured={measured}
                            borderRadius={0}
                            backgroundColor={theme.colors.surfaceContainerHigh}
                            fill
                            testID="fab-transform-surface"
                        >
                            <form
                                style={{ backgroundColor: 'var(--raised)' }}
                                className="fab-example-form"
                                inert={isClosing}
                                aria-label={item.form}
                                onKeyDownCapture={(e) => {
                                    if (e.key === 'Escape') {
                                        e.preventDefault();
                                        close();
                                    }
                                }}
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    submit();
                                }}
                            >
                                <Prose as="h3">{item.form}</Prose>
                                <TextField
                                    ref={field}
                                    nativeID="fab-usage-field"
                                    testID="fab-form-title"
                                    label={item.field}
                                    value={value}
                                    onChangeText={setValue}
                                    onSubmitEditing={submit}
                                />
                                {scenario === 'mail' || scenario === 'article' ? (
                                    <TextField
                                        testID="fab-form-body"
                                        label={scenario === 'mail' ? 'Mensaje' : 'Contenido'}
                                        value={body}
                                        onChangeText={setBody}
                                        multiline
                                        inputStyle={{ minHeight: 96 }}
                                    />
                                ) : null}
                                <Prose as="div" className="fab-form-actions">
                                    <Button variant="text" onPress={close} testID="fab-cancel">
                                        Cancelar
                                    </Button>
                                    <Button disabled={!value.trim()} onPress={submit} testID="fab-submit">
                                        {item.submit}
                                    </Button>
                                </Prose>
                            </form>
                        </ContainerTransformSurface>
                    </View>
                ) : null}
            </Prose>
            <Prose as="p" id="fab-usage-result" role="status" aria-live="polite">
                {result || 'Abre la acción para completar el ejemplo.'}
            </Prose>
        </section>
    );
}

export function ExtendedFABRuntime() {
    const environment = useRuntimeEnvironment();
    const [size, setSize] = useState<FABSize>('medium'),
        [variant, setVariant] = useState<FABVariant>('tonalPrimary');
    const [icon, setIcon] = useState(true),
        [expanded, setExpanded] = useState(true),
        [visible, setVisible] = useState(true),
        [label, setLabel] = useState('Redactar');
    const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr'),
        [motion, setMotion] = useState<'standard' | 'expressive'>('expressive'),
        [count, setCount] = useState(0);
    const code = `<FAB.Extended\n  size="${size}"\n  variant="${variant}"${icon ? '\n  icon="pencil-outline"' : ''}\n  label=${JSON.stringify(label || 'Redactar')}\n  expanded={${expanded}}\n  visible={${visible}}\n  onPress={handlePress}\n/>`;
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            motion={motion}
            direction={direction}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <RuntimeTextRoot>
                <main aria-label="Ejemplo interactivo de Extended FABs">
                    <Prose as="div" className="playground-controls" aria-label="Configurar Extended FAB">
                        <SelectField
                            label="Tamaño"
                            id="fab-size"
                            value={size}
                            onValueChange={(nextValue) => setSize(nextValue as FABSize)}
                            options={sizes.map((s, i) => ({ value: s, label: ['Small · 56', 'Medium · 80', 'Large · 96'][i] }))}
                        />
                        <SelectField
                            label="Color"
                            id="fab-variant"
                            value={variant}
                            onValueChange={(nextValue) => setVariant(nextValue as FABVariant)}
                            options={variants.map((v, i) => ({ value: v, label: variantNames[i] }))}
                        />
                        <Prose as="label">
                            Etiqueta
                            <input id="fab-label" maxLength={48} value={label} onChange={(e) => setLabel(e.target.value)} />
                        </Prose>
                        <SelectField
                            label="Movimiento"
                            id="fab-motion"
                            value={motion}
                            onValueChange={(nextValue) => setMotion(nextValue as typeof motion)}
                            options={[
                                { value: 'expressive', label: 'Expressive' },
                                { value: 'standard', label: 'Standard' },
                            ]}
                        />
                        <SelectField
                            label="Dirección"
                            id="fab-direction"
                            value={direction}
                            onValueChange={(nextValue) => setDirection(nextValue as typeof direction)}
                            options={[
                                { value: 'ltr', label: 'Izquierda a derecha' },
                                { value: 'rtl', label: 'Derecha a izquierda' },
                            ]}
                        />
                        <Prose as="div" className="state-options">
                            <Prose as="label">
                                <input type="checkbox" id="fab-icon" checked={icon} onChange={(e) => setIcon(e.target.checked)} />
                                Icono
                            </Prose>
                            <Prose as="label">
                                <input
                                    type="checkbox"
                                    id="fab-expanded"
                                    checked={expanded}
                                    onChange={(e) => setExpanded(e.target.checked)}
                                />
                                Expanded
                            </Prose>
                            <Prose as="label">
                                <input type="checkbox" id="fab-visible" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
                                Visible
                            </Prose>
                        </Prose>
                    </Prose>
                    <Prose as="div" className="button-stage fab-stage" dir={direction}>
                        <View>
                            <FAB.Extended
                                size={size}
                                variant={variant}
                                icon={icon ? 'pencil-outline' : undefined}
                                label={label || 'Redactar'}
                                expanded={expanded}
                                visible={visible}
                                onPress={() => setCount((v) => v + 1)}
                                testID="example-fab"
                            />
                        </View>
                    </Prose>
                    <Prose as="p" className="preview-guidance">
                        En espacios estrechos, desliza la muestra horizontalmente para explorar los tamaños grandes.
                    </Prose>
                    <Prose as="div" className="example-result" role="status" aria-live="polite">
                        <Prose as="span">
                            {icon ? 'La etiqueta conserva su nombre accesible al contraerse.' : 'Sin icono, la etiqueta permanece visible.'}
                        </Prose>
                        <Prose as="span">
                            <Prose as="span" id="fab-activation-count">
                                {count}
                            </Prose>{' '}
                            acciones
                        </Prose>
                    </Prose>
                    <section className="example-code" aria-label="Código de la configuración">
                        <Prose as="h2">Código de la configuración</Prose>
                        <pre tabIndex={0}>
                            <code>{code}</code>
                        </pre>
                    </section>
                    <FABUsage direction={direction} />
                </main>
                <RuntimeBridge />
            </RuntimeTextRoot>
        </MobileDesignProvider>
    );
}
