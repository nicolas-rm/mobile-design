import { SelectField } from './select-field';
import { Prose, RuntimeTextRoot } from './prose';
import { useState } from 'react';
import { View } from 'react-native';
import {
    Button,
    Card,
    SegmentedButtons,
    Text,
    type SegmentedButtonOption,
    type SegmentedButtonsProps,
} from 'mobile-design/react-native-web';
import { MaterialSymbol } from '@mobile-design/icons/react-native-web';
import { GalleryProvider as MobileDesignProvider } from './gallery-provider';
import { RuntimeBridge, useRuntimeEnvironment } from './environment';
const choices = [
    ['walk', 'A pie', 'directions_walk'],
    ['transit', 'Transporte', 'directions_transit'],
    ['car', 'Auto', 'directions_car'],
    ['bike', 'Bici', 'directions_bike'],
    ['flight', 'Vuelo', 'flight'],
] as const;
const alignments = [
    ['left', 'Izquierda', 'format_align_left'],
    ['center', 'Centro', 'format_align_center'],
    ['right', 'Derecha', 'format_align_right'],
] as const;
type Density = NonNullable<SegmentedButtonsProps['density']>;
function ContentVariants() {
    const [period, setPeriod] = useState('day'),
        [transport, setTransport] = useState('walk'),
        [alignment, setAlignment] = useState('left');
    return (
        <section className="sizes-section">
            <Prose as="h2">Contenido y movimiento</Prose>
            <article className="component-use">
                <Prose as="h3">Sólo etiquetas</Prose>
                <Prose as="p">Al seleccionar otra opción, el check aparece con escala y el texto se desplaza para dejarle espacio.</Prose>
                <Prose as="div" className="control-scroll">
                    <SegmentedButtons
                        value={period}
                        onValueChange={setPeriod}
                        accessibilityLabel="Vista del calendario"
                        buttons={[
                            { value: 'day', label: 'Día' },
                            { value: 'week', label: 'Semana' },
                            { value: 'month', label: 'Mes' },
                        ]}
                        testID="motion-labels"
                    />
                </Prose>
            </article>
            <article className="component-use">
                <Prose as="h3">Icono y etiqueta</Prose>
                <Prose as="p">
                    El check sustituye al icono mediante un fundido. La etiqueta conserva su posición porque el espacio del icono ya existe.
                </Prose>
                <Prose as="div" className="control-scroll">
                    <SegmentedButtons
                        value={transport}
                        onValueChange={setTransport}
                        accessibilityLabel="Transporte de la muestra"
                        buttons={choices
                            .slice(0, 3)
                            .map(([value, label, name]) => ({
                                value,
                                label,
                                icon: (props: { size: number; color: string }) => <MaterialSymbol {...props} name={name} />,
                            }))}
                        testID="motion-icons-labels"
                    />
                </Prose>
            </article>
            <article className="component-use">
                <Prose as="h3">Sólo iconos</Prose>
                <Prose as="p">
                    La selección conserva el icono y cambia el estado del segmento. Mantener pulsado muestra el efecto de presión.
                </Prose>
                <Prose as="div" className="control-scroll">
                    <SegmentedButtons
                        value={alignment}
                        onValueChange={setAlignment}
                        accessibilityLabel="Alineación del texto"
                        buttons={alignments.map(([value, label, name]) => ({
                            value,
                            accessibilityLabel: label,
                            icon: (props: { size: number; color: string }) => <MaterialSymbol {...props} name={name} />,
                            showSelectedCheck: false,
                        }))}
                        testID="motion-icons"
                    />
                </Prose>
            </article>
        </section>
    );
}
function Uses() {
    const [place, setPlace] = useState('restaurants'),
        [prices, setPrices] = useState<string[]>(['2']),
        [cup, setCup] = useState('medium'),
        [cart, setCart] = useState(''),
        [period, setPeriod] = useState('week');
    const venues = [
        { name: 'Casa verde', type: 'restaurants', price: '2' },
        { name: 'La terraza', type: 'restaurants', price: '3' },
        { name: 'Café del centro', type: 'restaurants', price: '1' },
        { name: 'Azotea', type: 'bars', price: '2' },
    ];
    return (
        <section className="usage-section">
            <Prose as="h2">Ejemplos en acción</Prose>
            <article className="component-use">
                <Prose as="h3">Restaurantes y bares</Prose>
                <Prose as="div" className="control-scroll">
                    <SegmentedButtons
                        value={place}
                        onValueChange={setPlace}
                        accessibilityLabel="Tipo de lugar"
                        buttons={[
                            { value: 'restaurants', label: 'Restaurantes' },
                            { value: 'bars', label: 'Bares' },
                        ]}
                        testID="places-segments"
                    />
                </Prose>
                <Prose as="div" className="compact-card-grid" id="places-results">
                    {venues
                        .filter((v) => v.type === place)
                        .map((v) => (
                            <Card key={v.name} variant="filled">
                                <Card.Content>
                                    <Text variant="titleMedium" {...{ dataSet: { runtimeText: 'native' } }}>
                                        {v.name}
                                    </Text>
                                    <Text variant="bodyMedium" {...{ dataSet: { runtimeText: 'native' } }}>
                                        {'$'.repeat(Number(v.price))} · Abierto
                                    </Text>
                                </Card.Content>
                            </Card>
                        ))}
                </Prose>
            </article>
            <article className="component-use">
                <Prose as="h3">Filtrar por precio · selección múltiple</Prose>
                <Prose as="div" className="control-scroll">
                    <SegmentedButtons
                        multiSelect
                        value={prices}
                        onValueChange={setPrices}
                        accessibilityLabel="Precio por persona"
                        buttons={[1, 2, 3, 4].map((n) => ({
                            value: String(n),
                            label: '$'.repeat(n),
                            accessibilityLabel: ['Económico', 'Moderado', 'Alto', 'Muy alto'][n - 1],
                        }))}
                        testID="price-segments"
                    />
                </Prose>
                <Prose as="p" id="price-results" role="status">
                    {venues
                        .filter((v) => prices.includes(v.price))
                        .map((v) => v.name)
                        .join(' · ') || 'Sin coincidencias. Puedes seleccionar todos o ninguno.'}
                </Prose>
            </article>
            <article className="component-use">
                <Prose as="h3">Elegir el tamaño de una bebida</Prose>
                <Prose as="div" className="control-scroll">
                    <SegmentedButtons
                        value={cup}
                        onValueChange={setCup}
                        accessibilityLabel="Tamaño de la bebida"
                        buttons={[
                            { value: 'small', label: 'Chica' },
                            { value: 'medium', label: 'Mediana' },
                            { value: 'large', label: 'Grande' },
                        ]}
                        testID="cup-segments"
                    />
                </Prose>
                <Prose as="div" className="usage-row">
                    <Text variant="titleMedium" {...{ dataSet: { runtimeText: 'native' } }}>
                        ${cup === 'small' ? 35 : cup === 'medium' ? 45 : 55}
                    </Text>
                    <Button
                        onPress={() =>
                            setCart('Bebida ' + { small: 'chica', medium: 'mediana', large: 'grande' }[cup] + ' añadida al carrito.')
                        }
                        testID="add-drink"
                    >
                        Añadir
                    </Button>
                </Prose>
                <Prose as="p" id="drink-result" role="status">
                    {cart || 'Elige un tamaño antes de añadir.'}
                </Prose>
            </article>
            <article className="component-use">
                <Prose as="h3">Cambiar la vista de datos</Prose>
                <Prose as="div" className="control-scroll">
                    <SegmentedButtons
                        value={period}
                        onValueChange={setPeriod}
                        accessibilityLabel="Periodo"
                        buttons={[
                            { value: 'day', label: 'Día' },
                            { value: 'week', label: 'Semana' },
                            { value: 'month', label: 'Mes' },
                        ]}
                        testID="period-segments"
                    />
                </Prose>
                <Prose as="p" id="period-result" role="status">
                    {period === 'day' ? 'Hoy: 38 min' : period === 'week' ? 'Esta semana: 4 h 20 min' : 'Este mes: 19 h 45 min'}
                </Prose>
            </article>
        </section>
    );
}
export function SegmentedButtonsRuntime() {
    const environment = useRuntimeEnvironment();
    const [motion, setMotion] = useState<'standard' | 'expressive'>('expressive');
    const [multi, setMulti] = useState(false),
        [value, setValue] = useState('walk'),
        [values, setValues] = useState<string[]>(['walk']);
    const [density, setDensity] = useState<Density>('regular'),
        [content, setContent] = useState('labels'),
        [count, setCount] = useState(3),
        [check, setCheck] = useState(true),
        [disabled, setDisabled] = useState(false),
        [disableMiddle, setDisableMiddle] = useState(false),
        [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr'),
        [changes, setChanges] = useState(0),
        [label, setLabel] = useState('');
    const buttons: SegmentedButtonOption[] = choices
        .slice(0, count)
        .map(([id, text, symbol], i) => ({
            value: id,
            label: content === 'icons' ? undefined : i === 0 && label ? label : text,
            icon: content === 'labels' ? undefined : (p: { size: number; color: string }) => <MaterialSymbol {...p} name={symbol} />,
            accessibilityLabel: i === 0 && label ? label : text,
            showSelectedCheck: content === 'icons' ? false : check,
            disabled: disableMiddle && i === 1,
        }));
    const common = { buttons, density, disabled, accessibilityLabel: 'Medio de transporte', testID: 'example-segmented' };
    const code = `<SegmentedButtons${multi ? '\n  multiSelect' : ''}\n  value={${multi ? 'selectedValues' : 'selectedValue'}}\n  onValueChange={${multi ? 'setSelectedValues' : 'setSelectedValue'}}\n  density="${density}"${disabled ? '\n  disabled' : ''}\n  accessibilityLabel="Medio de transporte"\n  buttons={[\n${buttons.map((b, i) => `    { value: '${b.value}',${b.label ? ` label: ${JSON.stringify(b.label)},` : ''}${content !== 'labels' ? ` icon: props => <MaterialSymbol {...props} name="${choices[i][2]}" />,` : ''} accessibilityLabel: ${JSON.stringify(b.accessibilityLabel)}, showSelectedCheck: ${b.showSelectedCheck}${b.disabled ? ', disabled: true' : ''} },`).join('\n')}\n  ]}\n/>`;
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            direction={direction}
            motion={motion}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <RuntimeTextRoot>
                <main aria-label="Ejemplo interactivo de Segmented buttons">
                    <Prose as="p" className="preview-guidance">
                        Esta familia conserva el diseño segmentado publicado. Para un diseño Expressive nuevo, consulta{' '}
                        <Prose as="a" href="../../../#/components/button-groups/overview" target="_parent">
                            Connected button groups
                        </Prose>
                        .
                    </Prose>
                    <Prose as="div" className="playground-controls">
                        <SelectField
                            label="Selección"
                            id="segment-mode"
                            value={multi ? 'multi' : 'single'}
                            onValueChange={(nextValue) => setMulti(nextValue === 'multi')}
                            options={[
                                { value: 'single', label: 'Single-select' },
                                { value: 'multi', label: 'Multi-select' },
                            ]}
                        />
                        <SelectField
                            label="Contenido"
                            id="segment-content"
                            value={content}
                            onValueChange={(nextValue) => setContent(nextValue)}
                            options={[
                                { value: 'both', label: 'Icono y etiqueta' },
                                { value: 'labels', label: 'Etiquetas' },
                                { value: 'icons', label: 'Sólo iconos' },
                            ]}
                        />
                        <SelectField
                            label="Segmentos"
                            id="segment-count"
                            value={count}
                            onValueChange={(nextValue) => {
                                const n = Number(nextValue);
                                setCount(n);
                                if (!choices.slice(0, n).some((c) => c[0] === value)) setValue('walk');
                                setValues((v) => v.filter((id) => choices.slice(0, n).some((c) => c[0] === id)));
                            }}
                            options={[2, 3, 4, 5].map((n) => ({ value: n, label: n }))}
                        />
                        <SelectField
                            label="Densidad"
                            id="segment-density"
                            value={density}
                            onValueChange={(nextValue) => setDensity(nextValue as Density)}
                            options={['regular', 'small', 'medium', 'high'].map((d) => ({ value: d, label: d }))}
                        />
                        <SelectField
                            label="Dirección"
                            id="segment-direction"
                            value={direction}
                            onValueChange={(nextValue) => setDirection(nextValue as typeof direction)}
                            options={[
                                { value: 'ltr', label: 'Izquierda a derecha' },
                                { value: 'rtl', label: 'Derecha a izquierda' },
                            ]}
                        />
                        <Prose as="label">
                            Primera etiqueta
                            <input
                                id="segment-label"
                                value={label}
                                placeholder="A pie"
                                onChange={(e) => setLabel(e.target.value)}
                                maxLength={48}
                            />
                        </Prose>
                        <SelectField
                            label="Movimiento"
                            id="segment-motion"
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
                                    id="segment-check"
                                    type="checkbox"
                                    checked={check}
                                    onChange={(e) => setCheck(e.target.checked)}
                                    disabled={content === 'icons'}
                                />
                                Check seleccionado
                            </Prose>
                            <Prose as="label">
                                <input
                                    id="segment-disabled"
                                    type="checkbox"
                                    checked={disabled}
                                    onChange={(e) => setDisabled(e.target.checked)}
                                />
                                Grupo deshabilitado
                            </Prose>
                            <Prose as="label">
                                <input
                                    id="segment-disable-middle"
                                    type="checkbox"
                                    checked={disableMiddle}
                                    onChange={(e) => setDisableMiddle(e.target.checked)}
                                />
                                Segunda opción deshabilitada
                            </Prose>
                        </Prose>
                    </Prose>
                    <Prose as="div" className="button-stage segmented-stage" dir={direction}>
                        <View>
                            {multi ? (
                                <SegmentedButtons
                                    {...common}
                                    multiSelect
                                    value={values}
                                    onValueChange={(v) => {
                                        setValues(v);
                                        setChanges((n) => n + 1);
                                    }}
                                />
                            ) : (
                                <SegmentedButtons
                                    {...common}
                                    value={value}
                                    onValueChange={(v) => {
                                        setValue(v);
                                        setChanges((n) => n + 1);
                                    }}
                                />
                            )}
                        </View>
                    </Prose>
                    <Prose as="div" className="example-result" role="status">
                        <Prose as="span" id="segment-value">
                            {multi ? values.join(', ') || 'Sin selección' : value}
                        </Prose>
                        <Prose as="span">
                            <Prose as="span" id="segment-changes">
                                {changes}
                            </Prose>{' '}
                            cambios
                        </Prose>
                    </Prose>
                    <ContentVariants />
                    <section className="example-code">
                        <Prose as="h2">Código de la configuración</Prose>
                        <pre tabIndex={0}>
                            <code>{code}</code>
                        </pre>
                    </section>
                    <Uses />
                </main>
                <RuntimeBridge />
            </RuntimeTextRoot>
        </MobileDesignProvider>
    );
}
