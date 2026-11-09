import { SelectField } from './select-field';
import { Prose, RuntimeTextRoot } from './prose';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, type ViewInstance } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing, ReduceMotion, cancelAnimation, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
    Button,
    Card,
    Chip,
    ContainerTransformSurface,
    Divider,
    IconButton,
    ListReorderGroup,
    Menu,
    Slider,
    SwipeListGroup,
    SwipeListItem,
    Text,
    useMobileTheme,
    type CardProps,
    type ContainerTransformOrigin,
} from 'mobile-design/react-native-web';
import { MaterialSymbol } from '@mobile-design/icons/react-native-web';
import { GalleryProvider as MobileDesignProvider } from './gallery-provider';
import { RuntimeBridge, useRuntimeEnvironment } from './environment';
const photo = (name = 'bao') => ({ uri: location.origin + '/assets/examples/' + name + '.png' });
const variants = ['elevated', 'filled', 'outlined'] as const;
type RecordItem = { id: string; title: string; category: string; saved: boolean; date: number };
const initial: RecordItem[] = [
    { id: 'bread', title: 'Pan de masa madre', category: 'Recetas', saved: false, date: 3 },
    { id: 'bao', title: 'Bao al vapor', category: 'Recetas', saved: true, date: 1 },
    { id: 'weekend', title: 'Ideas para el fin de semana', category: 'Colecciones', saved: false, date: 2 },
];
function ControlsCard() {
    const [rating, setRating] = useState(3),
        [time, setTime] = useState('18:00'),
        [volume, setVolume] = useState(40),
        [expanded, setExpanded] = useState(false),
        [result, setResult] = useState('');
    return (
        <article className="component-use">
            <Prose as="h3">Contenido y controles independientes</Prose>
            <Card variant="outlined" style={{ maxWidth: 480 }}>
                <Card.Title title="Una tarde compartida" subtitle="Reservas y preferencias" titleVariant="titleLarge" />
                <Card.Content>
                    <Text variant="bodyMedium" {...{ dataSet: { runtimeText: 'native' } }}>
                        La tarjeta es un contenedor. Cada acción conserva su propio objetivo.
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginVertical: 12 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <IconButton
                                key={n}
                                icon={(p) => <MaterialSymbol {...p} name="star" filled={n <= rating} />}
                                selected={n <= rating}
                                accessibilityLabel={'Calificar con ' + n + ' estrellas'}
                                onPress={() => setRating(n)}
                                testID={'card-rating-' + n}
                            />
                        ))}
                    </View>
                    <Chip.Group accessibilityLabel="Hora de reserva">
                        {['18:00', '19:00', '20:00'].map((t) => (
                            <Chip key={t} variant="filter" selected={time === t} onPress={() => setTime(t)} testID={'card-time-' + t}>
                                {t}
                            </Chip>
                        ))}
                    </Chip.Group>
                    <Text variant="labelLarge" style={{ marginTop: 16 }} {...{ dataSet: { runtimeText: 'native' } }}>
                        Volumen: {Math.round(volume)} %
                    </Text>
                    <Slider
                        value={volume}
                        onValueChange={setVolume}
                        minimumValue={0}
                        maximumValue={100}
                        step={1}
                        accessibilityLabel="Volumen de la música"
                        testID="card-volume"
                    />
                </Card.Content>
                <Card.Actions>
                    <Button
                        variant="text"
                        icon={expanded ? 'expand_less' : 'expand_more'}
                        accessibilityState={{ expanded }}
                        onPress={() => setExpanded((v) => !v)}
                        testID="card-expand"
                    >
                        {expanded ? 'Menos información' : 'Más información'}
                    </Button>
                    <Button
                        onPress={() =>
                            setResult('Reserva para las ' + time + ' · ' + rating + ' estrellas · volumen ' + Math.round(volume) + ' %.')
                        }
                        testID="card-reserve"
                    >
                        Reservar
                    </Button>
                </Card.Actions>
                {expanded ? (
                    <>
                        <Divider />
                        <Card.Content>
                            <Text
                                variant="bodyMedium"
                                style={{ marginVertical: 16 }}
                                testID="card-extra"
                                {...{ dataSet: { runtimeText: 'native' } }}
                            >
                                Llegada con diez minutos de anticipación. Puedes modificar tus preferencias antes de confirmar.
                            </Text>
                        </Card.Content>
                    </>
                ) : null}
            </Card>
            <Prose as="p" id="card-preferences-result" role="status">
                {result || 'Ajusta las preferencias y confirma la reserva.'}
            </Prose>
        </article>
    );
}
function DetailExample() {
    const theme = useMobileTheme();
    const [open, setOpen] = useState(false),
        [closing, setClosing] = useState(false),
        [ready, setReady] = useState(false),
        [saved, setSaved] = useState(false),
        [origin, setOrigin] = useState<ContainerTransformOrigin>();
    const source = useRef<HTMLElement | null>(null),
        isClosing = useRef(false);
    const progress = useSharedValue(0);
    const completeClose = useCallback(() => setOpen(false), []);
    useLayoutEffect(() => {
        if (open || !isClosing.current) return;
        isClosing.current = false;
        source.current?.focus({ preventScroll: true });
    }, [open]);
    const transition = useCallback(
        (to: number) => {
            progress.set(
                withTiming(
                    to,
                    {
                        duration: (to ? theme.motion.duration.long2 : theme.motion.duration.medium4) * theme.animation.scale,
                        easing: Easing.bezier(...theme.motion.easing.emphasized),
                        reduceMotion: ReduceMotion.Never,
                    },
                    (done) => {
                        if (done && to === 0) scheduleOnRN(completeClose);
                    }
                )
            );
        },
        [theme, progress, completeClose]
    );
    const close = () => {
        if (isClosing.current) return;
        isClosing.current = true;
        if (theme.animation.scale === 0) {
            progress.set(0);
            completeClose();
            return;
        }
        setClosing(true);
        transition(0);
    };
    useEffect(() => {
        if (open && ready && !closing) transition(1);
    }, [open, ready, closing, transition]);
    useEffect(() => () => cancelAnimation(progress), [progress]);
    useEffect(() => {
        if (theme.animation.scale === 0 && open) {
            progress.set(closing ? 0 : 1);
            if (closing) completeClose();
        }
    }, [theme.animation.scale, open, closing, progress, completeClose]);
    const focus = useRef<ViewInstance | null>(null);
    useEffect(() => {
        if (open) {
            const r = requestAnimationFrame(() => focus.current?.focus());
            return () => cancelAnimationFrame(r);
        }
    }, [open]);
    return (
        <article className="component-use">
            <Prose as="h3">Tarjeta y vista de detalle</Prose>
            <Prose as="p">
                La superficie completa abre el detalle. La vista conserva una acción para volver y restaura el foco al cerrar.
            </Prose>
            <Prose as="div" className="card-detail-scene" data-open={open}>
                <Prose as="div" className="card-detail-source" inert={open}>
                    <Card
                        variant="elevated"
                        onPress={(e) => {
                            const t = e.currentTarget as unknown as HTMLElement;
                            source.current = t;
                            const r = t.getBoundingClientRect();
                            setOrigin({
                                x: r.x,
                                y: r.y,
                                width: r.width,
                                height: r.height,
                                borderRadius: 12,
                                backgroundColor: theme.colors.surfaceContainerLow,
                            });
                            progress.set(0);
                            isClosing.current = false;
                            setClosing(false);
                            setReady(false);
                            setOpen(true);
                        }}
                        accessibilityLabel="Abrir receta de bao al vapor"
                        testID="card-open-detail"
                        style={{ maxWidth: 320 }}
                    >
                        <Card.Cover source={photo()} style={{ height: 150, borderRadius: 0 }} accessible={false} />
                        <Card.Title title="Bao al vapor" subtitle="Una receta para compartir" />
                        <Card.Content>
                            <Text variant="bodyMedium" style={{ marginBottom: 16 }} {...{ dataSet: { runtimeText: 'native' } }}>
                                Ingredientes sencillos y tiempo para disfrutar.
                            </Text>
                        </Card.Content>
                    </Card>
                </Prose>
                {open ? (
                    <View style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
                        <ContainerTransformSurface
                            fill
                            origin={origin}
                            progress={progress}
                            entering={!closing}
                            transforming={theme.animation.scale !== 0}
                            onMeasured={() => setReady(true)}
                            borderRadius={0}
                            backgroundColor={theme.colors.surface}
                            testID="card-detail-transform"
                        >
                            <Prose
                                as="div"
                                className="card-detail-body"
                                role="region"
                                aria-label="Detalle de Bao al vapor"
                                inert={closing}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        e.preventDefault();
                                        close();
                                    }
                                }}
                            >
                                <header>
                                    <IconButton
                                        ref={focus}
                                        icon="arrow_back"
                                        accessibilityLabel="Volver a la tarjeta"
                                        onPress={close}
                                        testID="card-close-detail"
                                    />
                                    <Text variant="titleLarge" {...{ dataSet: { runtimeText: 'native' } }}>
                                        Bao al vapor
                                    </Text>
                                    <IconButton
                                        icon={(p) => <MaterialSymbol {...p} name="bookmark" filled={saved} />}
                                        selected={saved}
                                        accessibilityLabel="Guardar receta"
                                        onPress={() => setSaved((v) => !v)}
                                        testID="card-detail-save"
                                    />
                                </header>
                                <img src={photo().uri} alt="Bao al vapor" />
                                <Prose as="h4">Una receta para compartir</Prose>
                                <Prose as="p">
                                    Mezcla la masa, deja reposar y cocina al vapor. Sirve con verduras frescas y tu salsa favorita.
                                </Prose>
                                <ul>
                                    <Prose as="li">30 minutos de preparación</Prose>
                                    <Prose as="li">4 porciones</Prose>
                                    <Prose as="li">Harina, agua, levadura y verduras</Prose>
                                </ul>
                                <Prose as="p" role="status" id="card-detail-status">
                                    {saved ? 'Receta guardada.' : 'La receta aún no está guardada.'}
                                </Prose>
                            </Prose>
                        </ContainerTransformSurface>
                    </View>
                ) : null}
            </Prose>
        </article>
    );
}
function Collection() {
    const undoRef = useRef<ViewInstance | null>(null),
        focusUndo = useRef(false),
        focusRestored = useRef('');
    const [records, setRecords] = useState(initial),
        [layout, setLayout] = useState('grid'),
        [filter, setFilter] = useState('all'),
        [sort, setSort] = useState('date'),
        [menu, setMenu] = useState<string | null>(null),
        [removed, setRemoved] = useState<{ item: RecordItem; index: number }>(),
        [status, setStatus] = useState('');
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            if (removed && focusUndo.current) {
                undoRef.current?.focus();
                focusUndo.current = false;
            } else if (!removed && focusRestored.current) {
                document.querySelector<HTMLElement>('[data-testid="collection-menu-' + focusRestored.current + '"]')?.focus();
                focusRestored.current = '';
            }
        });
        return () => cancelAnimationFrame(frame);
    }, [removed]);
    const archive = (id: string) => {
        focusUndo.current = Boolean(
            document.activeElement?.getAttribute('role') === 'menuitem' && document.activeElement.matches(':focus-visible')
        );
        const index = records.findIndex((r) => r.id === id);
        if (index < 0) return;
        setRemoved({ item: records[index], index });
        setRecords((r) => r.filter((x) => x.id !== id));
        setStatus('Tarjeta archivada.');
    };
    const visible =
        layout === 'reorder'
            ? records
            : records
                  .filter((r) => filter !== 'saved' || r.saved)
                  .toSorted((a, b) => (sort === 'title' ? a.title.localeCompare(b.title) : sort === 'date' ? a.date - b.date : 0));
    const move = (id: string, delta: number) => {
        const from = visible.findIndex((item) => item.id === id),
            to = from + delta;
        if (from < 0 || to < 0 || to >= visible.length) return;
        const order = [...visible];
        order.splice(to, 0, order.splice(from, 1)[0]);
        const keys = new Set(order.map((item) => item.id));
        setRecords((rows) => {
            let index = 0;
            return rows.map((row) => (keys.has(row.id) ? order[index++] : row));
        });
        setSort('manual');
        setStatus('Orden actualizado.');
    };
    const actions = (item: RecordItem) => (
        <Menu
            visible={menu === item.id}
            onDismiss={() => setMenu(null)}
            anchor={
                <IconButton
                    icon="more_vert"
                    accessibilityLabel={'Opciones de ' + item.title}
                    onPress={() => setMenu(item.id)}
                    testID={'collection-menu-' + item.id}
                />
            }
        >
            <Menu.Item
                title={item.saved ? 'Quitar de guardados' : 'Guardar'}
                leadingIcon="bookmark"
                onPress={() => setRecords((r) => r.map((v) => (v.id === item.id ? { ...v, saved: !v.saved } : v)))}
            />
            <Menu.Item
                title="Mover arriba"
                leadingIcon="arrow_upward"
                disabled={visible[0]?.id === item.id}
                onPress={() => move(item.id, -1)}
            />
            <Menu.Item
                title="Mover abajo"
                leadingIcon="arrow_downward"
                disabled={visible.at(-1)?.id === item.id}
                onPress={() => move(item.id, 1)}
            />
            <Menu.Item title="Archivar" leadingIcon="archive" onPress={() => archive(item.id)} />
        </Menu>
    );
    return (
        <article className="component-use">
            <Prose as="h3">Colecciones, acciones y gestos</Prose>
            <Prose as="p">
                El filtro y el orden pertenecen a la colección. Cada menú ofrece alternativas para mover o archivar sin arrastrar.
            </Prose>
            <Prose as="div" className="playground-controls">
                <SelectField
                    label="Distribución"
                    id="card-layout"
                    value={layout}
                    onValueChange={(nextValue) => {
                        setLayout(nextValue);
                        if (nextValue === 'reorder') {
                            setFilter('all');
                            setSort('manual');
                        }
                    }}
                    options={[
                        ['grid', 'Cuadrícula'],
                        ['list', 'Lista vertical'],
                        ['horizontal', 'Fila horizontal'],
                        ['mosaic', 'Mosaico'],
                        ['staggered', 'Escalonada'],
                        ['swipe', 'Deslizar para archivar'],
                        ['reorder', 'Arrastrar para ordenar'],
                    ].map(([v, l]) => ({ value: v, label: l }))}
                />
                <SelectField
                    label="Mostrar"
                    id="card-filter"
                    disabled={layout === 'reorder'}
                    value={filter}
                    onValueChange={(nextValue) => setFilter(nextValue)}
                    options={[
                        { value: 'all', label: 'Todas' },
                        { value: 'saved', label: 'Guardadas' },
                    ]}
                />
                <SelectField
                    label="Orden"
                    id="card-sort"
                    disabled={layout === 'reorder'}
                    value={sort}
                    onValueChange={(nextValue) => setSort(nextValue)}
                    options={[
                        { value: 'date', label: 'Fecha' },
                        { value: 'title', label: 'Título' },
                        { value: 'manual', label: 'Manual' },
                    ]}
                />
            </Prose>
            {layout === 'reorder' ? (
                <ListReorderGroup
                    items={records}
                    keyExtractor={(item) => item.id}
                    itemHeight={112}
                    gap={8}
                    onReorder={(items) => {
                        setRecords(items);
                        setSort('manual');
                        setStatus('Orden actualizado.');
                    }}
                    testID="card-reorder"
                    renderItem={({ item, dragged, renderHandle }) => (
                        <Card variant="elevated" dragged={dragged} style={{ height: 112 }} testID={'reorder-card-' + item.id}>
                            <View style={{ flexDirection: 'row', height: 112, alignItems: 'center', paddingHorizontal: 16, gap: 8 }}>
                                {renderHandle(<MaterialSymbol name="drag_handle" size={24} />, 'Mover ' + item.title)}
                                <View style={{ flex: 1 }}>
                                    <Text variant="titleMedium" {...{ dataSet: { runtimeText: 'native' } }}>
                                        {item.title}
                                    </Text>
                                    <Text variant="bodyMedium" {...{ dataSet: { runtimeText: 'native' } }}>
                                        {item.category}
                                    </Text>
                                </View>
                                {actions(item)}
                            </View>
                        </Card>
                    )}
                />
            ) : layout === 'swipe' ? (
                <SwipeListGroup>
                    <View style={{ gap: 8 }}>
                        {visible.map((item) => (
                            <SwipeListItem
                                key={item.id}
                                id={item.id}
                                trailingSwipeMode="direct"
                                trailingActions={[{ key: 'archive', label: 'Archivar', icon: 'archive', onPress: () => archive(item.id) }]}
                                testID={'card-swipe-' + item.id}
                            >
                                <Card variant="filled">
                                    <Card.Title title={item.title} subtitle={item.category} right={() => actions(item)} />
                                </Card>
                            </SwipeListItem>
                        ))}
                    </View>
                </SwipeListGroup>
            ) : (
                <Prose as="div" className={'card-collection ' + layout} id="card-collection">
                    {visible.map((item) => (
                        <Card key={item.id} variant="filled" testID={'collection-card-' + item.id}>
                            <Card.Cover
                                source={photo(item.id === 'bread' ? 'bread' : 'bao')}
                                style={{ height: item.id === 'weekend' && layout === 'staggered' ? 200 : 120, borderRadius: 0 }}
                                accessible={false}
                            />
                            <Card.Title title={item.title} subtitle={item.saved ? 'Guardada' : item.category} right={() => actions(item)} />
                            <Card.Content>
                                <Text variant="bodyMedium" style={{ marginBottom: 16 }} {...{ dataSet: { runtimeText: 'native' } }}>
                                    Una idea para volver a disfrutar.
                                </Text>
                            </Card.Content>
                        </Card>
                    ))}
                </Prose>
            )}
            {!visible.length && layout !== 'reorder' ? (
                <Prose as="p" role="status">
                    No hay tarjetas con este filtro.
                </Prose>
            ) : null}
            <Prose as="div" className="usage-row">
                <Prose as="p" id="card-collection-status" role="status">
                    {status || records.length + ' tarjetas en la colección.'}
                </Prose>
                {removed ? (
                    <Button
                        variant="text"
                        onPress={() => {
                            setRecords((r) => {
                                if (r.some((x) => x.id === removed.item.id)) return r;
                                const n = [...r];
                                n.splice(removed.index, 0, removed.item);
                                return n;
                            });
                            if (document.activeElement?.matches(':focus-visible')) focusRestored.current = removed.item.id;
                            setRemoved(undefined);
                            setStatus('Tarjeta restaurada.');
                        }}
                        ref={undoRef}
                        testID="card-undo"
                    >
                        Deshacer
                    </Button>
                ) : null}
            </Prose>
        </article>
    );
}
export function CardsRuntime() {
    const environment = useRuntimeEnvironment();
    const [variant, setVariant] = useState<CardProps['variant']>('elevated'),
        [interaction, setInteraction] = useState('container'),
        [cover, setCover] = useState(true),
        [disabled, setDisabled] = useState(false),
        [dragged, setDragged] = useState(false),
        [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr'),
        [count, setCount] = useState(0),
        [saved, setSaved] = useState(false);
    const disabledProp = disabled ? ' disabled' : '';
    const code = `<Card variant="${variant}"${disabledProp}${dragged ? ' dragged' : ''}${interaction === 'direct' ? '\n  onPress={activateCard}\n  accessibilityLabel="Activar tarjeta de bao"' : ''}>${cover ? '\n  <Card.Cover source={recipeImage} accessible={false} />' : ''}
  <Card.Title title="Bao al vapor" subtitle="Una receta para compartir" />
  <Card.Content>
    <Text variant="bodyMedium">Ingredientes sencillos y tiempo para disfrutar.</Text>
  </Card.Content>${
      interaction === 'container'
          ? `
  <Card.Actions>
    <Button variant="text"${disabledProp} onPress={saveRecipe}>Guardar</Button>
    <Button${disabledProp} onPress={exploreRecipe}>Explorar</Button>
  </Card.Actions>`
          : ''
  }
</Card>`;
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            direction={direction}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <RuntimeTextRoot>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <main aria-label="Ejemplo interactivo de Cards">
                        <Prose as="div" className="playground-controls">
                            <SelectField
                                label="Variante"
                                id="card-variant"
                                value={variant}
                                onValueChange={(nextValue) => setVariant(nextValue as CardProps['variant'])}
                                options={variants.map((v) => ({ value: v, label: v }))}
                            />
                            <SelectField
                                label="Acción"
                                id="card-interaction"
                                value={interaction}
                                onValueChange={(nextValue) => setInteraction(nextValue)}
                                options={[
                                    { value: 'container', label: 'Contenedor con botones' },
                                    { value: 'direct', label: 'Tarjeta completa pulsable' },
                                ]}
                            />
                            <SelectField
                                label="Dirección"
                                id="card-direction"
                                value={direction}
                                onValueChange={(nextValue) => setDirection(nextValue as typeof direction)}
                                options={[
                                    { value: 'ltr', label: 'Izquierda a derecha' },
                                    { value: 'rtl', label: 'Derecha a izquierda' },
                                ]}
                            />
                            <Prose as="div" className="state-options">
                                <Prose as="label">
                                    <input id="card-cover" type="checkbox" checked={cover} onChange={(e) => setCover(e.target.checked)} />
                                    Imagen
                                </Prose>
                                <Prose as="label">
                                    <input
                                        id="card-disabled"
                                        type="checkbox"
                                        checked={disabled}
                                        onChange={(e) => setDisabled(e.target.checked)}
                                    />
                                    Disabled
                                </Prose>
                                <Prose as="label">
                                    <input
                                        id="card-dragged"
                                        type="checkbox"
                                        checked={dragged}
                                        onChange={(e) => setDragged(e.target.checked)}
                                    />
                                    Estado dragged
                                </Prose>
                            </Prose>
                        </Prose>
                        <Prose as="div" className="button-stage card-stage" dir={direction}>
                            <Card
                                variant={variant}
                                disabled={disabled}
                                dragged={dragged}
                                style={{ width: '100%', maxWidth: 360 }}
                                onPress={interaction === 'direct' ? () => setCount((v) => v + 1) : undefined}
                                accessibilityLabel={interaction === 'direct' ? 'Activar tarjeta de bao' : undefined}
                                testID="example-card"
                            >
                                {cover ? <Card.Cover source={photo()} style={{ height: 160, borderRadius: 0 }} accessible={false} /> : null}
                                <Card.Title title="Bao al vapor" subtitle="Una receta para compartir" titleVariant="titleLarge" />
                                <Card.Content>
                                    <Text variant="bodyMedium" style={{ marginBottom: 16 }} {...{ dataSet: { runtimeText: 'native' } }}>
                                        Ingredientes sencillos y tiempo para disfrutar.
                                    </Text>
                                </Card.Content>
                                {interaction === 'container' ? (
                                    <Card.Actions>
                                        <Button variant="text" disabled={disabled} onPress={() => setSaved((v) => !v)} testID="card-save">
                                            {saved ? 'Guardada' : 'Guardar'}
                                        </Button>
                                        <Button disabled={disabled} onPress={() => setCount((v) => v + 1)} testID="card-explore">
                                            Explorar
                                        </Button>
                                    </Card.Actions>
                                ) : null}
                            </Card>
                        </Prose>
                        <Prose as="div" className="example-result" role="status">
                            <Prose as="span">
                                {interaction === 'direct'
                                    ? 'La superficie completa es una acción.'
                                    : 'Cada botón actúa de forma independiente.'}{' '}
                                {saved ? 'Receta guardada.' : ''}
                            </Prose>
                            <Prose as="span">
                                <Prose as="span" id="card-activation-count">
                                    {count}
                                </Prose>{' '}
                                acciones
                            </Prose>
                        </Prose>
                        <section className="example-code">
                            <Prose as="h2">Código de la configuración</Prose>
                            <pre tabIndex={0}>
                                <code>{code}</code>
                            </pre>
                        </section>
                        <section className="sizes-section">
                            <Prose as="h2">Las tres variantes</Prose>
                            <Prose as="div" className="compact-card-grid">
                                {variants.map((v) => (
                                    <Card key={v} variant={v}>
                                        <Card.Title title={v} />
                                        <Card.Content>
                                            <Text
                                                variant="bodyMedium"
                                                style={{ marginBottom: 16 }}
                                                {...{ dataSet: { runtimeText: 'native' } }}
                                            >
                                                Misma función y distinta separación visual.
                                            </Text>
                                        </Card.Content>
                                    </Card>
                                ))}
                            </Prose>
                        </section>
                        <section className="usage-section">
                            <Prose as="h2">Ejemplos en acción</Prose>
                            <DetailExample />
                            <ControlsCard />
                            <Collection />
                        </section>
                    </main>
                    <RuntimeBridge />
                </GestureHandlerRootView>
            </RuntimeTextRoot>
        </MobileDesignProvider>
    );
}
