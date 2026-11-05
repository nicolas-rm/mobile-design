import { SelectField } from './select-field';
import { Prose, RuntimeTextRoot } from './prose';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, MaterialSymbol, MobileDesignProvider, Tooltip, Menu, type IconButtonProps } from 'mobile-design';
import { type ButtonSize } from '@mobile-design/tokens';
import { RuntimeBridge, useRuntimeEnvironment } from './environment';

const sizes: ButtonSize[] = ['extra-small', 'small', 'medium', 'large', 'extra-large'];
const styles = ['filled', 'tonal', 'outlined', 'standard'] as const;
type Treatment = (typeof styles)[number];
const mode = (value: Treatment): IconButtonProps['mode'] =>
    value === 'filled' ? 'contained' : value === 'tonal' ? 'contained-tonal' : value === 'outlined' ? 'outlined' : undefined;
const widths = ['narrow', 'default', 'wide'] as const;

function Uses() {
    const [favorite, setFavorite] = useState(false),
        [bookmark, setBookmark] = useState(false),
        [playing, setPlaying] = useState(false),
        [track, setTrack] = useState(0);
    const [mic, setMic] = useState(true),
        [camera, setCamera] = useState(true),
        [hand, setHand] = useState(false),
        [call, setCall] = useState(true);
    const [menu, setMenu] = useState(false),
        [status, setStatus] = useState('Elige una acción del menú.');
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    const tracks = ['Long Walk', 'In the Dark', 'A new beginning'];
    return (
        <section className="usage-section">
            <Prose as="h2">Ejemplos en acción</Prose>
            <article className="icon-usage">
                <Prose as="h3">Guardar y marcar como favorito</Prose>
                <Prose as="p">Una selección controlada cambia forma, color y relleno del icono.</Prose>
                <Prose as="div" className="usage-row">
                    <Tooltip title={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
                        <IconButton
                            icon={(props) => <MaterialSymbol {...props} name="favorite" filled={favorite} />}
                            mode="contained-tonal"
                            selected={favorite}
                            accessibilityLabel="Favorito"
                            onPress={() => setFavorite((v) => !v)}
                            testID="usage-favorite"
                        />
                    </Tooltip>
                    <Tooltip title={bookmark ? 'Quitar marcador' : 'Guardar artículo'}>
                        <IconButton
                            icon={(props) => <MaterialSymbol {...props} name="bookmark" filled={bookmark} />}
                            mode="outlined"
                            selected={bookmark}
                            accessibilityLabel="Guardar artículo"
                            onPress={() => setBookmark((v) => !v)}
                            testID="usage-bookmark"
                        />
                    </Tooltip>
                    <Prose as="span" role="status" id="icon-saved-state">
                        {favorite ? 'En favoritos' : 'Sin favorito'} · {bookmark ? 'Artículo guardado' : 'Sin marcador'}
                    </Prose>
                </Prose>
            </article>
            <article className="icon-usage">
                <Prose as="h3">Controles de reproducción</Prose>
                <Prose as="p" id="icon-track" role="status">
                    {tracks[track]} · {playing ? 'Reproduciendo' : 'En pausa'}
                </Prose>
                <Prose as="div" className="media-actions">
                    <Tooltip title="Canción anterior" anchorStyle={{ alignSelf: 'center' }}>
                        <IconButton
                            icon={(p) => <MaterialSymbol {...p} name="skip_previous" filled />}
                            mode="outlined"
                            accessibilityLabel="Canción anterior"
                            onPress={() => setTrack((v) => (v + tracks.length - 1) % tracks.length)}
                            testID="usage-previous"
                        />
                    </Tooltip>
                    <Tooltip title={playing ? 'Pausar' : 'Reproducir'} anchorStyle={{ alignSelf: 'center' }}>
                        <IconButton
                            icon={(p) => <MaterialSymbol {...p} name={playing ? 'pause' : 'play_arrow'} filled />}
                            mode="contained"
                            sizeClass="medium"
                            widthVariant="wide"
                            accessibilityLabel={playing ? 'Pausar' : 'Reproducir'}
                            onPress={() => setPlaying((v) => !v)}
                            testID="usage-play"
                        />
                    </Tooltip>
                    <Tooltip title="Canción siguiente" anchorStyle={{ alignSelf: 'center' }}>
                        <IconButton
                            icon={(p) => <MaterialSymbol {...p} name="skip_next" filled />}
                            mode="outlined"
                            accessibilityLabel="Canción siguiente"
                            onPress={() => setTrack((v) => (v + 1) % tracks.length)}
                            testID="usage-next"
                        />
                    </Tooltip>
                </Prose>
            </article>
            <article className="icon-usage">
                <Prose as="h3">Acciones en una llamada</Prose>
                {call ? (
                    <>
                        <Prose as="div" className="usage-row">
                            <Tooltip title={mic ? 'Silenciar micrófono' : 'Activar micrófono'}>
                                <IconButton
                                    icon={(p) => <MaterialSymbol {...p} name={mic ? 'mic' : 'mic_off'} filled={!mic} />}
                                    mode="contained-tonal"
                                    selected={!mic}
                                    accessibilityLabel="Silenciar micrófono"
                                    onPress={() => setMic((v) => !v)}
                                    testID="usage-mic"
                                />
                            </Tooltip>
                            <Tooltip title={camera ? 'Apagar cámara' : 'Activar cámara'}>
                                <IconButton
                                    icon={(p) => <MaterialSymbol {...p} name={camera ? 'videocam' : 'videocam_off'} filled={!camera} />}
                                    mode="contained-tonal"
                                    selected={!camera}
                                    accessibilityLabel="Apagar cámara"
                                    onPress={() => setCamera((v) => !v)}
                                    testID="usage-camera"
                                />
                            </Tooltip>
                            <Tooltip title={hand ? 'Bajar la mano' : 'Levantar la mano'}>
                                <IconButton
                                    icon={(p) => <MaterialSymbol {...p} name="front_hand" filled={hand} />}
                                    mode="contained-tonal"
                                    selected={hand}
                                    accessibilityLabel="Levantar la mano"
                                    onPress={() => setHand((v) => !v)}
                                    testID="usage-hand"
                                />
                            </Tooltip>
                            <Tooltip title="Salir de la llamada">
                                <IconButton
                                    icon={(p) => <MaterialSymbol {...p} name="call_end" filled />}
                                    mode="contained"
                                    accessibilityLabel="Salir de la llamada"
                                    onPress={() => setCall(false)}
                                    testID="usage-leave"
                                />
                            </Tooltip>
                        </Prose>
                        <Prose as="p" id="icon-call-state" role="status">
                            {mic ? 'Micrófono activo' : 'Micrófono silenciado'} · {camera ? 'Cámara activa' : 'Cámara apagada'} ·{' '}
                            {hand ? 'Mano levantada' : 'Mano abajo'}
                        </Prose>
                    </>
                ) : (
                    <Prose as="div" className="usage-row">
                        <Prose as="p" role="status">
                            Has salido de la llamada de ejemplo.
                        </Prose>
                        <Button onPress={() => setCall(true)}>Volver a unirme</Button>
                    </Prose>
                )}
            </article>
            <article className="icon-usage">
                <Prose as="h3">Abrir un menú</Prose>
                <Prose as="p">El estado de presión permanece mientras la superficie asociada está abierta.</Prose>
                <Menu
                    visible={menu}
                    onDismiss={() => setMenu(false)}
                    anchor={
                        <IconButton
                            icon="more_vert"
                            accessibilityLabel="Acciones del artículo"
                            onPress={() => setMenu(true)}
                            testID="usage-more"
                        />
                    }
                >
                    <Menu.Item
                        title="Copiar título"
                        leadingIcon="content_copy"
                        onPress={() => {
                            navigator.clipboard.writeText('Mi artículo').then(
                                () => {
                                    if (alive.current) setStatus('Título copiado.');
                                },
                                () => {
                                    if (alive.current) setStatus('No se pudo copiar.');
                                }
                            );
                        }}
                    />
                    <Menu.Item
                        title="Marcar para después"
                        leadingIcon="bookmark"
                        onPress={() => {
                            setBookmark(true);
                            setStatus('Artículo guardado para después.');
                        }}
                    />
                </Menu>
                <Prose as="p" role="status" id="icon-menu-result">
                    {status}
                </Prose>
            </article>
        </section>
    );
}

export function IconButtonsRuntime() {
    const environment = useRuntimeEnvironment();
    const [size, setSize] = useState<ButtonSize>('small'),
        [treatment, setTreatment] = useState<Treatment>('filled');
    const [shape, setShape] = useState<'round' | 'square'>('round'),
        [width, setWidth] = useState<(typeof widths)[number]>('default');
    const [toggle, setToggle] = useState(false),
        [selected, setSelected] = useState(false),
        [disabled, setDisabled] = useState(false),
        [loading, setLoading] = useState(false),
        [count, setCount] = useState(0);
    const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr'),
        [motion, setMotion] = useState<'standard' | 'expressive'>('expressive');
    const icon: IconButtonProps['icon'] = useCallback(
        (p) => <MaterialSymbol {...p} name="favorite" filled={toggle ? selected : true} />,
        [toggle, selected]
    );
    const actionName = toggle ? 'selected ? "Quitar de favoritos" : "Añadir a favoritos"' : '"Añadir a favoritos"';
    const accessibleName = toggle ? 'Favorito' : 'Añadir a favoritos';
    const code = `<Tooltip title={${actionName}}>\n  <IconButton\n    icon={props => <MaterialSymbol {...props} name="favorite" filled={${toggle ? 'selected' : 'true'}} />}\n    ${mode(treatment) ? `mode="${mode(treatment)}"\n    ` : ''}sizeClass="${size}"\n    shape="${shape}"\n    widthVariant="${width}"${toggle ? '\n    selected={selected}' : ''}${disabled ? '\n    disabled' : ''}${loading ? '\n    loading' : ''}\n    accessibilityLabel="${accessibleName}"\n    onPress={${toggle ? '() => setSelected(value => !value)' : 'handlePress'}}\n  />\n</Tooltip>`;
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            direction={direction}
            motion={motion}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <RuntimeTextRoot>
                <main aria-label="Ejemplo interactivo de Icon buttons">
                    <Prose as="div" className="playground-controls" aria-label="Configurar IconButton">
                        <SelectField
                            label="Tipo"
                            id="icon-type"
                            value={toggle ? 'toggle' : 'default'}
                            onValueChange={(nextValue) => setToggle(nextValue === 'toggle')}
                            options={[
                                { value: 'default', label: 'Default' },
                                { value: 'toggle', label: 'Toggle' },
                            ]}
                        />
                        <SelectField
                            label="Estilo"
                            id="icon-treatment"
                            value={treatment}
                            onValueChange={(nextValue) => setTreatment(nextValue as Treatment)}
                            options={styles.map((s) => ({ value: s, label: s }))}
                        />
                        <SelectField
                            label="Tamaño"
                            id="icon-size"
                            value={size}
                            onValueChange={(nextValue) => setSize(nextValue as ButtonSize)}
                            options={sizes.map((s) => ({ value: s, label: s }))}
                        />
                        <SelectField
                            label="Anchura"
                            id="icon-width"
                            value={width}
                            onValueChange={(nextValue) => setWidth(nextValue as typeof width)}
                            options={widths.map((s) => ({ value: s, label: s }))}
                        />
                        <SelectField
                            label="Forma"
                            id="icon-shape"
                            value={shape}
                            onValueChange={(nextValue) => setShape(nextValue as typeof shape)}
                            options={[
                                { value: 'round', label: 'Round' },
                                { value: 'square', label: 'Square' },
                            ]}
                        />
                        <SelectField
                            label="Dirección"
                            id="icon-direction"
                            value={direction}
                            onValueChange={(nextValue) => setDirection(nextValue as typeof direction)}
                            options={[
                                { value: 'ltr', label: 'Izquierda a derecha' },
                                { value: 'rtl', label: 'Derecha a izquierda' },
                            ]}
                        />
                        <SelectField
                            label="Movimiento"
                            id="icon-motion"
                            value={motion}
                            onValueChange={(nextValue) => setMotion(nextValue as typeof motion)}
                            options={[
                                { value: 'expressive', label: 'Expressive' },
                                { value: 'standard', label: 'Standard' },
                            ]}
                        />
                        <Prose as="div" className="state-options">
                            <Prose as="label">
                                <input
                                    id="icon-disabled"
                                    type="checkbox"
                                    checked={disabled}
                                    onChange={(e) => setDisabled(e.target.checked)}
                                />
                                Disabled
                            </Prose>
                            <Prose as="label">
                                <input id="icon-loading" type="checkbox" checked={loading} onChange={(e) => setLoading(e.target.checked)} />
                                Loading
                            </Prose>
                            {toggle ? (
                                <Prose as="label">
                                    <input
                                        id="icon-selected"
                                        type="checkbox"
                                        checked={selected}
                                        onChange={(e) => setSelected(e.target.checked)}
                                    />
                                    Selected
                                </Prose>
                            ) : null}
                        </Prose>
                    </Prose>
                    <Prose as="div" className="button-stage" dir={direction}>
                        <View>
                            <Tooltip title={toggle && selected ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
                                <IconButton
                                    icon={icon}
                                    mode={mode(treatment)}
                                    sizeClass={size}
                                    widthVariant={width}
                                    shape={shape}
                                    selected={toggle ? selected : undefined}
                                    disabled={disabled}
                                    loading={loading}
                                    accessibilityLabel={accessibleName}
                                    onPress={() => {
                                        setCount((v) => v + 1);
                                        if (toggle) setSelected((v) => !v);
                                    }}
                                    testID="example-icon-button"
                                />
                            </Tooltip>
                        </View>
                    </Prose>
                    <Prose as="div" className="example-result" role="status">
                        <Prose as="span">
                            {toggle ? (selected ? 'Seleccionado' : 'Sin seleccionar') : 'Acción sin selección persistente'}
                        </Prose>
                        <Prose as="span">
                            <Prose as="span" id="icon-activation-count">
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
                        <Prose as="h2">Cinco tamaños y tres anchuras</Prose>
                        <Prose as="div" className="icon-size-examples">
                            {sizes.map((s) => (
                                <Prose as="div" className="icon-size-row" key={s}>
                                    <Prose as="h3">{s}</Prose>
                                    <Prose as="div" className="variant-examples">
                                        {widths.map((w) => (
                                            <Prose as="div" className="labeled-example" key={w}>
                                                <IconButton
                                                    icon={(p) => <MaterialSymbol {...p} name="add" filled />}
                                                    mode={mode(treatment)}
                                                    sizeClass={s}
                                                    widthVariant={w}
                                                    shape={shape}
                                                    accessibilityLabel={'Añadir · ' + s + ' · ' + w}
                                                    onPress={() => setCount((v) => v + 1)}
                                                />
                                                <Prose as="span">{w}</Prose>
                                            </Prose>
                                        ))}
                                    </Prose>
                                </Prose>
                            ))}
                        </Prose>
                    </section>
                    <Uses />
                </main>
                <RuntimeBridge />
            </RuntimeTextRoot>
        </MobileDesignProvider>
    );
}
