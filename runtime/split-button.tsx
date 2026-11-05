import { SelectField } from './select-field';
import { Prose, RuntimeTextRoot } from './prose';
import { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Button, Card, IconButton, MaterialSymbol, MobileDesignProvider, SplitButton, Text, type SplitButtonProps } from 'mobile-design';
import { RuntimeBridge, useRuntimeEnvironment } from './environment';
function useLiveCopy() {
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    return async (text: string, update: (message: string) => void, success: string) => {
        try {
            await navigator.clipboard.writeText(text);
            if (alive.current) update(success);
        } catch {
            if (alive.current) update('No se pudo copiar.');
        }
    };
}
const sizes = ['extra-small', 'small', 'medium', 'large', 'extra-large'] as const;
const variants = ['filled', 'tonal', 'outlined', 'elevated'] as const;
function Uses() {
    const { width } = useWindowDimensions();
    const copy = useLiveCopy(),
        scheduleField = useRef<HTMLInputElement>(null),
        wasScheduling = useRef(false);
    const [message, setMessage] = useState('Nos vemos mañana.'),
        [mailState, setMailState] = useState(''),
        [schedule, setSchedule] = useState(false),
        [date, setDate] = useState('2026-11-04T10:00');
    useEffect(() => {
        const r = requestAnimationFrame(() => {
            if (schedule) scheduleField.current?.focus();
            else if (wasScheduling.current) document.querySelector<HTMLElement>('[data-testid="send-split-toggle"]')?.focus();
            wasScheduling.current = schedule;
        });
        return () => cancelAnimationFrame(r);
    }, [schedule]);
    const [cart, setCart] = useState(0),
        [buyResult, setBuyResult] = useState(''),
        [route, setRoute] = useState('Ruta habitual'),
        [started, setStarted] = useState(false),
        [speed, setSpeed] = useState(1),
        [country, setCountry] = useState('Canadá'),
        [filterApplied, setFilterApplied] = useState(false);
    const [favorites, setFavorites] = useState<Record<string, boolean>>({});
    const [savedDestinations, setSavedDestinations] = useState<Record<string, boolean>>({});
    const [destinationStatus, setDestinationStatus] = useState<{ country: string; message: string } | null>(null);
    const favorite = Boolean(favorites[country]),
        saved = Boolean(savedDestinations[country]);
    return (
        <section className="usage-section">
            <Prose as="h2">Ejemplos en acción</Prose>
            <article className="component-use">
                <Prose as="h3">Enviar, programar o guardar borrador</Prose>
                <Prose as="label" className="usage-field">
                    Mensaje
                    <textarea id="split-message" value={message} onChange={(e) => setMessage(e.target.value)} />
                </Prose>
                <SplitButton
                    label="Enviar"
                    icon="send"
                    menuAccessibilityLabel="Más opciones de envío"
                    onPress={() => setMailState(message.trim() ? 'Mensaje enviado: ' + message : 'Escribe un mensaje.')}
                    testID="send-split"
                    actions={[
                        { key: 'schedule', label: 'Programar envío', icon: 'schedule', onPress: () => setSchedule(true) },
                        {
                            key: 'draft',
                            label: 'Guardar borrador',
                            icon: 'draft',
                            onPress: () => setMailState('Borrador guardado: ' + message),
                        },
                    ]}
                />
                {schedule ? (
                    <form
                        className="inline-task"
                        onSubmit={(e) => {
                            e.preventDefault();
                            setMailState('Envío programado: ' + date.replace('T', ' '));
                            setSchedule(false);
                        }}
                    >
                        <Prose as="label">
                            Fecha y hora
                            <input
                                ref={scheduleField}
                                id="split-date"
                                required
                                type="datetime-local"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </Prose>
                        <Prose as="div" className="usage-row">
                            <Button variant="text" onPress={() => setSchedule(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onPress={() => document.querySelector<HTMLFormElement>('.inline-task')?.requestSubmit()}
                                testID="confirm-schedule"
                            >
                                Programar
                            </Button>
                        </Prose>
                    </form>
                ) : null}
                <Prose as="p" id="send-result" role="status">
                    {mailState || 'El envío es una acción local de demostración.'}
                </Prose>
            </article>
            <article className="component-use">
                <Prose as="h3">Comprar una taza</Prose>
                <Card variant="filled" style={{ maxWidth: 360 }}>
                    <Card.Title title="Tazas esmaltadas" subtitle="Disponibles en azul, negro, blanco, verde y rojo" />
                    <Card.Content>
                        <Text variant="bodyMedium" {...{ dataSet: { runtimeText: 'native' } }}>
                            Para el café y el próximo viaje.
                        </Text>
                    </Card.Content>
                    <Card.Actions style={{ justifyContent: 'center' }}>
                        <SplitButton
                            size={width < 390 ? 'medium' : 'large'}
                            label="$ 7.49"
                            icon={(props: { size: number; color: string }) => <MaterialSymbol {...props} name="add_circle" filled />}
                            primaryAccessibilityLabel="Añadir una taza al carrito por 7.49 dólares"
                            menuAccessibilityLabel="Más opciones de compra"
                            onPress={() => {
                                setCart((n) => n + 1);
                                setBuyResult('Taza añadida al carrito.');
                            }}
                            testID="buy-split"
                            actions={[
                                {
                                    key: 'save',
                                    label: 'Guardar para después',
                                    icon: 'bookmark',
                                    onPress: () => setBuyResult('Taza guardada para después.'),
                                },
                                {
                                    key: 'share',
                                    label: 'Compartir enlace',
                                    icon: 'share',
                                    onPress: () => {
                                        void copy('https://example.com/taza', setBuyResult, 'Enlace de la taza copiado.');
                                    },
                                },
                            ]}
                        />
                    </Card.Actions>
                </Card>
                <Prose as="p" id="buy-result" role="status">
                    {buyResult || 'Elige cómo continuar.'} · Carrito: {cart}
                </Prose>
            </article>
            <article className="component-use">
                <Prose as="h3">Iniciar una ruta</Prose>
                <Prose as="div" className="usage-row">
                    <SplitButton
                        label="Iniciar"
                        icon="directions_car"
                        menuAccessibilityLabel="Más opciones de ruta"
                        onPress={() => setStarted(true)}
                        testID="route-split"
                        actions={[
                            {
                                key: 'tolls',
                                label: 'Evitar peajes',
                                onPress: () => {
                                    setRoute('Sin peajes');
                                    setStarted(false);
                                },
                            },
                            {
                                key: 'highway',
                                label: 'Evitar autopistas',
                                onPress: () => {
                                    setRoute('Sin autopistas');
                                    setStarted(false);
                                },
                            },
                        ]}
                    />
                </Prose>
                <Prose as="p" id="route-result" role="status">
                    {route} · {started ? 'Navegación iniciada' : 'Lista para comenzar'}
                </Prose>
            </article>
            <article className="component-use">
                <Prose as="h3">Velocidad de reproducción</Prose>
                <Prose as="p">Configuración local del control multimedia.</Prose>
                <SplitButton
                    label={speed + '×'}
                    primaryAccessibilityLabel={'Cambiar velocidad, actual ' + speed + '×'}
                    onPress={() => setSpeed((v) => (v === 1 ? 1.5 : v === 1.5 ? 2 : 1))}
                    menuAccessibilityLabel="Elegir velocidad de reproducción"
                    testID="speed-split"
                    actions={[0.5, 1, 1.5, 2].map((v) => ({
                        key: String(v),
                        label: v + '×',
                        selected: speed === v,
                        onPress: () => setSpeed(v),
                    }))}
                />
                <Prose as="p" id="speed-result" role="status">
                    Velocidad seleccionada: {speed}×
                </Prose>
            </article>
            <article className="component-use">
                <Prose as="h3">Explorar actividades por destino</Prose>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 16, rowGap: 4 }}>
                    <SplitButton
                        label={country}
                        icon="folder"
                        onPress={() => setFilterApplied(true)}
                        menuAccessibilityLabel="Más destinos"
                        testID="country-split"
                        actions={['Canadá', 'México', 'Japón'].map((c) => ({
                            key: c,
                            label: c,
                            selected: country === c,
                            onPress: () => {
                                setCountry(c);
                                setFilterApplied(false);
                                setDestinationStatus(null);
                            },
                        }))}
                    />
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                        <IconButton
                            icon="ios_share"
                            mode="contained-tonal"
                            widthVariant="narrow"
                            accessibilityLabel="Compartir destino"
                            onPress={() => {
                                void copy(
                                    'https://example.com/actividades/' + encodeURIComponent(country),
                                    (message) => setDestinationStatus({ country, message }),
                                    'Enlace del destino copiado.'
                                );
                            }}
                        />
                        <IconButton
                            icon={(p) => <MaterialSymbol {...p} name="star" filled={favorite} />}
                            mode="contained-tonal"
                            widthVariant="narrow"
                            accessibilityLabel="Destino favorito"
                            selected={favorite}
                            onPress={() => setFavorites((values) => ({ ...values, [country]: !values[country] }))}
                        />
                        <IconButton
                            icon={(p) => <MaterialSymbol {...p} name="bookmark" filled={saved} />}
                            mode="contained-tonal"
                            widthVariant="narrow"
                            accessibilityLabel="Guardar destino"
                            selected={saved}
                            onPress={() => setSavedDestinations((values) => ({ ...values, [country]: !values[country] }))}
                        />
                    </View>
                </View>
                {destinationStatus?.country === country ? (
                    <Prose as="p" role="status">
                        {destinationStatus.message}
                    </Prose>
                ) : null}
                <Prose as="p" id="country-result" role="status">
                    {country === 'Canadá'
                        ? 'Senderismo · Lago Louise'
                        : country === 'México'
                          ? 'Museos · Centro histórico'
                          : 'Jardines · Kioto'}
                    {filterApplied ? ' · Filtro aplicado: ' + country : ''}
                </Prose>
            </article>
        </section>
    );
}
export function SplitButtonRuntime() {
    const environment = useRuntimeEnvironment(),
        copy = useLiveCopy();
    const [motion, setMotion] = useState<'standard' | 'expressive'>('expressive');
    const [size, setSize] = useState<NonNullable<SplitButtonProps['size']>>('small'),
        [variant, setVariant] = useState<NonNullable<SplitButtonProps['variant']>>('filled'),
        [content, setContent] = useState('both'),
        [disabled, setDisabled] = useState(false),
        [empty, setEmpty] = useState(false),
        [disableAction, setDisableAction] = useState(false),
        [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr'),
        [label, setLabel] = useState('Enviar'),
        [count, setCount] = useState(0),
        [result, setResult] = useState('Elige una acción.'),
        [expanded, setExpanded] = useState(false);
    const icon: SplitButtonProps['icon'] =
        content === 'label' ? undefined : (p: { size: number; color: string }) => <MaterialSymbol {...p} name="send" filled />;
    const actions: SplitButtonProps['actions'] = empty
        ? []
        : [
              { key: 'schedule', label: 'Programar envío', icon: 'schedule', onPress: () => setResult('Se eligió programar el envío.') },
              {
                  key: 'draft',
                  label: 'Guardar borrador',
                  icon: 'draft',
                  disabled: disableAction,
                  onPress: () => setResult('Borrador guardado.'),
              },
              {
                  key: 'copy',
                  label: 'Copiar mensaje',
                  icon: 'content_copy',
                  onPress: () => {
                      void copy('Mensaje de ejemplo', setResult, 'Mensaje copiado.');
                  },
              },
          ];
    const code = `<SplitButton\n  label={${JSON.stringify(content === 'icon' ? '' : label)}}${content !== 'label' ? '\n  icon="send"' : ''}\n  variant="${variant}"\n  size="${size}"${disabled ? '\n  disabled' : ''}\n  primaryAccessibilityLabel="Enviar mensaje"\n  menuAccessibilityLabel="Más opciones de envío"\n  onPress={handleSend}\n  actions={${empty ? '[]' : `[\n    { key: 'schedule', label: 'Programar envío', icon: 'schedule', onPress: handleSchedule },\n    { key: 'draft', label: 'Guardar borrador', icon: 'draft',${disableAction ? ' disabled: true,' : ''} onPress: handleDraft },\n    { key: 'copy', label: 'Copiar mensaje', icon: 'content_copy', onPress: handleCopy },\n  ]`}}\n/>`;
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            direction={direction}
            motion={motion}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <RuntimeTextRoot>
                <main aria-label="Ejemplo interactivo de Split button">
                    <Prose as="div" className="playground-controls">
                        <SelectField
                            label="Tamaño"
                            id="split-size"
                            value={size}
                            onValueChange={(nextValue) => setSize(nextValue as typeof size)}
                            options={sizes.map((s) => ({ value: s, label: s }))}
                        />
                        <SelectField
                            label="Estilo"
                            id="split-variant"
                            value={variant}
                            onValueChange={(nextValue) => setVariant(nextValue as typeof variant)}
                            options={variants.map((v) => ({ value: v, label: v }))}
                        />
                        <SelectField
                            label="Contenido principal"
                            id="split-content"
                            value={content}
                            onValueChange={(nextValue) => setContent(nextValue)}
                            options={[
                                { value: 'both', label: 'Icono y etiqueta' },
                                { value: 'label', label: 'Etiqueta' },
                                { value: 'icon', label: 'Icono' },
                            ]}
                        />
                        <SelectField
                            label="Dirección"
                            id="split-direction"
                            value={direction}
                            onValueChange={(nextValue) => setDirection(nextValue as typeof direction)}
                            options={[
                                { value: 'ltr', label: 'Izquierda a derecha' },
                                { value: 'rtl', label: 'Derecha a izquierda' },
                            ]}
                        />
                        <Prose as="label">
                            Etiqueta
                            <input id="split-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} />
                        </Prose>
                        <SelectField
                            label="Movimiento"
                            id="split-motion"
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
                                    id="split-disabled"
                                    type="checkbox"
                                    checked={disabled}
                                    onChange={(e) => setDisabled(e.target.checked)}
                                />
                                Disabled
                            </Prose>
                            <Prose as="label">
                                <input id="split-empty" type="checkbox" checked={empty} onChange={(e) => setEmpty(e.target.checked)} />
                                Sin alternativas
                            </Prose>
                            <Prose as="label">
                                <input
                                    id="split-disable-action"
                                    type="checkbox"
                                    checked={disableAction}
                                    onChange={(e) => setDisableAction(e.target.checked)}
                                />
                                Borrador deshabilitado
                            </Prose>
                        </Prose>
                    </Prose>
                    <Prose as="div" className="button-stage split-stage" dir={direction}>
                        <View>
                            <SplitButton
                                label={content === 'icon' ? '' : label}
                                icon={icon}
                                size={size}
                                variant={variant}
                                disabled={disabled}
                                expanded={expanded}
                                onExpandedChange={setExpanded}
                                primaryAccessibilityLabel="Enviar mensaje"
                                menuAccessibilityLabel="Más opciones de envío"
                                onPress={() => {
                                    setCount((n) => n + 1);
                                    setResult('Mensaje enviado.');
                                }}
                                actions={actions}
                                testID="example-split"
                            />
                        </View>
                    </Prose>
                    <Prose as="div" className="example-result" role="status">
                        <Prose as="span" id="split-result">
                            {result}
                        </Prose>
                        <Prose as="span">
                            <Prose as="span" id="split-primary-count">
                                {count}
                            </Prose>{' '}
                            acciones principales
                        </Prose>
                    </Prose>
                    <section className="example-code">
                        <Prose as="h2">Código de la configuración</Prose>
                        <pre tabIndex={0}>
                            <code>{code}</code>
                        </pre>
                    </section>
                    <section className="sizes-section">
                        <Prose as="h2">Los cinco tamaños</Prose>
                        <Prose as="div" className="split-size-list">
                            {sizes.map((s) => (
                                <Prose as="div" key={s} className="control-scroll">
                                    <Prose as="h3">{s}</Prose>
                                    <SplitButton
                                        size={s}
                                        variant={variant}
                                        label="Enviar"
                                        icon="send"
                                        onPress={() => setResult('Enviar · ' + s)}
                                        actions={actions}
                                        menuAccessibilityLabel={'Más opciones · ' + s}
                                    />
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
