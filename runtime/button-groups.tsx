import { SelectField } from './select-field';
import { useState } from 'react';
import { View } from 'react-native';
import { ButtonGroup, createMobileDesignTheme, type ButtonGroupProps, type ButtonGroupItem } from 'mobile-design/react-native-web';
import { GalleryProvider as MobileDesignProvider } from './gallery-provider';
import { buttonGroupSizeTokens } from '@mobile-design/tokens';
import { Prose, RuntimeTextRoot } from './prose';
import { ButtonGroupUses } from './button-group-usage';
import { RuntimeBridge, useRuntimeEnvironment } from './environment';

type Size = NonNullable<ButtonGroupProps['size']>;
type Treatment = NonNullable<ButtonGroupProps['buttonVariant']>;
type Mode = NonNullable<ButtonGroupProps['selectionMode']>;
const sizes = Object.keys(buttonGroupSizeTokens) as Size[];
const choices = [
    ['one', 'Label', 'bookmark'],
    ['two', 'Label', 'alarm'],
    ['three', 'Label', 'event'],
    ['four', 'Label', 'favorite'],
    ['five', 'Label', 'music_note'],
    ['six', 'Label', 'folder'],
];
const values = (value: string | string[]) => (typeof value === 'string' ? (value ? [value] : []) : value);
function Specimen({
    id,
    variant = 'standard',
    size = 'small',
    icons = false,
    shape = 'round',
    treatment = 'tonal',
    density = 0,
}: {
    id: string;
    variant?: 'standard' | 'connected';
    size?: Size;
    icons?: boolean;
    shape?: 'round' | 'square';
    treatment?: Treatment;
    density?: ButtonGroupProps['density'];
}) {
    const [value, setValue] = useState<string | string[]>('one'),
        [result, setResult] = useState('');
    const token = buttonGroupSizeTokens[size],
        font = createMobileDesignTheme().fonts[token.text];
    const width = Math.max(
        300,
        3 * (icons ? token.iconOnly + token.iconWide * 2 : font.fontSize * 4 + token.padding * 2 + token.icon + token.gap) +
            token.between * 2
    );
    return (
        <Prose as="div" className="group-specimen">
            <Prose as="div" className="control-scroll">
                <View style={{ width }}>
                    <ButtonGroup
                        variant={variant}
                        size={size}
                        shape={shape}
                        buttonVariant={treatment}
                        density={density}
                        selectionMode={variant === 'connected' ? 'single' : 'none'}
                        value={value}
                        onValueChange={setValue}
                        items={choices
                            .slice(0, 3)
                            .map(([value, label, icon]) => ({
                                value,
                                label: icons ? icon : label,
                                icon: icons ? icon : undefined,
                                iconOnly: icons,
                                onPress: () => setResult(value),
                            }))}
                        testID={id}
                    />
                </View>
            </Prose>
            <Prose as="span" className="group-specimen-result" role="status">
                {variant === 'connected'
                    ? 'Selección: ' + String(value)
                    : result
                      ? 'Acción: ' + result
                      : 'Mantén pulsado para ver la respuesta.'}
            </Prose>
        </Prose>
    );
}
function CommonLayouts() {
    const [playing, setPlaying] = useState(false),
        [result, setResult] = useState('');
    return (
        <section className="sizes-section">
            <Prose as="h2">Composiciones comunes</Prose>
            <Prose as="p">Etiquetas, iconos y combinaciones con una jerarquía clara. Los grupos permanecen en una sola línea.</Prose>
            <article className="component-use">
                <Prose as="h3">Start · Directions · Share</Prose>
                <ButtonGroup
                    fullWidth
                    items={[
                        ['start', 'Start', 'directions_car'],
                        ['directions', 'Directions', 'directions_car'],
                        ['share', 'Share', 'share'],
                    ].map(([value, label, icon]) => ({ value, label, icon, onPress: () => setResult(label + ' activated.') }))}
                    testID="layout-directions"
                />
            </article>
            <article className="component-use">
                <Prose as="h3">Rewind · Play · Forward</Prose>
                <ButtonGroup
                    fullWidth
                    buttonVariant="filled"
                    items={[
                        {
                            value: 'rewind',
                            label: 'Rewind',
                            icon: 'fast_rewind',
                            iconOnly: true,
                            onPress: () => setResult('Rewind activated.'),
                        },
                        {
                            value: 'play',
                            label: playing ? 'Pause' : 'Play',
                            icon: playing ? 'pause' : 'play_arrow',
                            weight: 3,
                            onPress: () => setPlaying((v) => !v),
                        },
                        {
                            value: 'forward',
                            label: 'Forward',
                            icon: 'fast_forward',
                            iconOnly: true,
                            onPress: () => setResult('Forward activated.'),
                        },
                    ]}
                    testID="layout-player"
                />
            </article>
            <article className="component-use">
                <Prose as="h3">Extra small · Filled · Square</Prose>
                <ButtonGroup
                    size="extra-small"
                    shape="square"
                    buttonVariant="filled"
                    items={['bluetooth', 'bookmark', 'alarm', 'event'].map((value) => ({
                        value,
                        label: value,
                        icon: value,
                        iconOnly: true,
                        onPress: () => setResult(value + ' activated.'),
                    }))}
                    testID="layout-shortcuts"
                />
            </article>
            <article className="component-use">
                <Prose as="h3">Large · Tonal · Square · Default / Narrow / Wide</Prose>
                <Prose as="div" className="control-scroll">
                    <View style={{ width: 640 }}>
                        <ButtonGroup
                            size="large"
                            shape="square"
                            items={['bookmark', 'alarm', 'event'].map((value, i) => ({
                                value,
                                label: value,
                                icon: value,
                                iconOnly: true,
                                widthVariant: i === 1 ? 'narrow' : i === 2 ? 'wide' : 'default',
                                onPress: () => setResult(value + ' activated.'),
                            }))}
                            testID="layout-widths"
                        />
                    </View>
                </Prose>
            </article>
            <Prose as="p" role="status" id="layout-result">
                {playing ? 'Playing.' : result || 'Prueba las acciones de cada composición.'}
            </Prose>
        </section>
    );
}
export function ButtonGroupsRuntime() {
    const environment = useRuntimeEnvironment();
    const [variant, setVariant] = useState<'standard' | 'connected'>('standard'),
        [size, setSize] = useState<Size>('small'),
        [shape, setShape] = useState<'round' | 'square'>('round'),
        [treatment, setTreatment] = useState<Treatment>('tonal');
    const [iconWidth, setIconWidth] = useState<'narrow' | 'default' | 'wide'>('default');
    const [mode, setMode] = useState<Mode>('none'),
        [selected, setSelected] = useState<string[]>(['one']),
        [content, setContent] = useState('labels'),
        [count, setCount] = useState(3),
        [density, setDensity] = useState<0 | -1 | -2 | -3>(0),
        [width, setWidth] = useState(720),
        [max, setMax] = useState('auto');
    const [full, setFull] = useState(false),
        [check, setCheck] = useState(true),
        [empty, setEmpty] = useState(false),
        [disabled, setDisabled] = useState(false),
        [disableMiddle, setDisableMiddle] = useState(false),
        [largeText, setLargeText] = useState(false),
        [label, setLabel] = useState('');
    const [motion, setMotion] = useState<'expressive' | 'standard'>('expressive'),
        [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr'),
        [changes, setChanges] = useState(0),
        [actions, setActions] = useState(0),
        [result, setResult] = useState('Prueba la presión y la selección.');
    const base = createMobileDesignTheme({ colorScheme: environment.colorScheme });
    const fonts = largeText
        ? Object.fromEntries(
              Object.entries(base.fonts).map(([key, font]) => [
                  key,
                  { ...font, ...('fontSize' in font ? { fontSize: font.fontSize * 2, lineHeight: font.lineHeight * 2 } : {}) },
              ])
          )
        : undefined;
    const items: ButtonGroupItem[] = choices.slice(0, count).map(([value, copy, icon], index) => ({
        value,
        label: index === 1 && label ? label : copy,
        icon: content === 'labels' ? undefined : icon,
        iconOnly: content === 'icons',
        widthVariant: iconWidth,
        disabled: disableMiddle && index === 1,
        onPress: () => {
            setActions((v) => v + 1);
            setResult('Acción: ' + value);
        },
    }));
    const selection = mode === 'multiple' ? selected : (selected[0] ?? '');
    const code = `const [value, setValue] = useState<${mode === 'multiple' ? 'string[]' : 'string'}>(${JSON.stringify(selection)});\n\n<ButtonGroup\n  variant="${variant}"\n  size="${size}"\n  shape="${shape}"\n  buttonVariant="${treatment}"\n  selectionMode="${mode}"${mode !== 'none' ? '\n  value={value}\n  onValueChange={setValue}' : ''}${density ? '\n  density={' + density + '}' : ''}${full ? '\n  fullWidth' : ''}${!check ? '\n  showSelectedIcon={false}' : ''}${empty ? '\n  allowEmptySelection' : ''}${disabled ? '\n  disabled' : ''}${max !== 'auto' ? '\n  maxVisibleItems={' + max + '}' : ''}\n  items={[\n${items.map((item) => `    { value: ${JSON.stringify(item.value)}, label: ${JSON.stringify(item.label)}${item.icon ? ', icon: ' + JSON.stringify(item.icon) : ''}${item.iconOnly ? ', iconOnly: true, widthVariant: ' + JSON.stringify(iconWidth) : ''}${item.disabled ? ', disabled: true' : ''}, onPress: handleAction },`).join('\n')}\n  ]}\n/>`;
    const changeVariant = (next: 'standard' | 'connected') => {
        setVariant(next);
        setFull(next === 'connected');
        if (next === 'connected' && mode === 'none') setMode('single');
        if (next === 'standard' && treatment === 'elevated') setTreatment('tonal');
    };
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            motion={motion}
            direction={direction}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
            theme={fonts ? { fonts } : undefined}
        >
            <RuntimeTextRoot>
                <main aria-label="Ejemplo interactivo de Button groups">
                    <Prose as="div" className="playground-controls">
                        <SelectField
                            label="Variante"
                            id="group-variant"
                            value={variant}
                            onValueChange={(nextValue) => changeVariant(nextValue as typeof variant)}
                            options={[
                                { value: 'standard', label: 'Standard' },
                                { value: 'connected', label: 'Connected' },
                            ]}
                        />
                        <SelectField
                            label="Tamaño"
                            id="group-size"
                            value={size}
                            onValueChange={(nextValue) => setSize(nextValue as Size)}
                            options={sizes.map((s) => ({ value: s, label: s }))}
                        />
                        <SelectField
                            label="Forma"
                            id="group-shape"
                            value={shape}
                            onValueChange={(nextValue) => setShape(nextValue as typeof shape)}
                            options={[
                                { value: 'round', label: 'Round' },
                                { value: 'square', label: 'Square' },
                            ]}
                        />
                        <SelectField
                            label="Tratamiento"
                            id="group-treatment"
                            value={treatment}
                            onValueChange={(nextValue) => setTreatment(nextValue as Treatment)}
                            options={['filled', 'tonal', 'outlined', 'elevated'].map((v) => ({
                                value: v,
                                label: v,
                                disabled: variant === 'standard' && v === 'elevated',
                            }))}
                        />
                        <SelectField
                            label="Selección"
                            id="group-selection"
                            value={mode}
                            onValueChange={(nextValue) => setMode(nextValue as Mode)}
                            options={[
                                { value: 'none', label: 'Comandos independientes', disabled: variant === 'connected' },
                                { value: 'single', label: 'Única' },
                                { value: 'multiple', label: 'Múltiple' },
                            ]}
                        />
                        <SelectField
                            label="Contenido"
                            id="group-content"
                            value={content}
                            onValueChange={(nextValue) => setContent(nextValue)}
                            options={[
                                { value: 'labels', label: 'Etiquetas' },
                                { value: 'both', label: 'Icono y etiqueta' },
                                { value: 'icons', label: 'Iconos' },
                            ]}
                        />
                        <SelectField
                            label="Ancho de iconos"
                            id="group-icon-width"
                            value={iconWidth}
                            onValueChange={(nextValue) => setIconWidth(nextValue as typeof iconWidth)}
                            options={['narrow', 'default', 'wide'].map((value) => ({ value: value, label: value }))}
                        />
                        <SelectField
                            label="Cantidad"
                            id="group-count"
                            value={count}
                            onValueChange={(nextValue) => setCount(Number(nextValue))}
                            options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: n }))}
                        />
                        <SelectField
                            label="Densidad"
                            id="group-density"
                            value={density}
                            onValueChange={(nextValue) => setDensity(Number(nextValue) as typeof density)}
                            options={[0, -1, -2, -3].map((n) => ({ value: n, label: n }))}
                        />
                        <SelectField
                            label="Opciones visibles"
                            id="group-visible"
                            value={max}
                            onValueChange={(nextValue) => setMax(nextValue)}
                            options={[
                                { value: 'auto', label: 'Según espacio disponible' },
                                ...[0, 2, 3].map((n) => ({ value: n, label: n })),
                            ]}
                        />
                        <Prose as="label">
                            Ancho disponible
                            <input
                                id="group-width"
                                type="range"
                                min={180}
                                max={1000}
                                value={width}
                                onChange={(e) => setWidth(Number(e.target.value))}
                            />
                        </Prose>
                        <Prose as="label">
                            Etiqueta del segundo botón
                            <input id="group-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
                        </Prose>
                        <SelectField
                            label="Dirección"
                            id="group-direction"
                            value={direction}
                            onValueChange={(nextValue) => setDirection(nextValue as typeof direction)}
                            options={[
                                { value: 'ltr', label: 'LTR' },
                                { value: 'rtl', label: 'RTL' },
                            ]}
                        />
                        <SelectField
                            label="Movimiento"
                            id="group-motion"
                            value={motion}
                            onValueChange={(nextValue) => setMotion(nextValue as typeof motion)}
                            options={[
                                { value: 'expressive', label: 'Expressive' },
                                { value: 'standard', label: 'Standard' },
                            ]}
                        />
                        <Prose as="div" className="state-options">
                            {[
                                ['group-full', 'Ancho completo', full, setFull],
                                ['group-check', 'Indicador de selección', check, setCheck],
                                ['group-empty', 'Permitir selección vacía', empty, setEmpty],
                                ['group-disabled', 'Disabled', disabled, setDisabled],
                                ['group-disable-middle', 'Segundo botón deshabilitado', disableMiddle, setDisableMiddle],
                                ['group-large-text', 'Texto de muestra ×2', largeText, setLargeText],
                            ].map(([id, text, value, update]) => (
                                <Prose as="label" key={id as string}>
                                    <input
                                        id={id as string}
                                        type="checkbox"
                                        checked={value as boolean}
                                        onChange={(e) => (update as (v: boolean) => void)(e.target.checked)}
                                    />
                                    {text as string}
                                </Prose>
                            ))}
                        </Prose>
                    </Prose>
                    <Prose as="div" className="button-stage group-stage" dir={direction}>
                        <View style={{ width, maxWidth: '100%' }}>
                            <ButtonGroup
                                items={items}
                                variant={variant}
                                size={size}
                                shape={shape}
                                buttonVariant={treatment}
                                selectionMode={mode}
                                value={selection}
                                onValueChange={(v) => {
                                    setSelected(values(v));
                                    setChanges((n) => n + 1);
                                }}
                                density={density}
                                fullWidth={full}
                                showSelectedIcon={check}
                                allowEmptySelection={empty}
                                disabled={disabled}
                                maxVisibleItems={max === 'auto' ? undefined : Number(max)}
                                testID="example-group"
                            />
                        </View>
                    </Prose>
                    <Prose as="div" className="example-result" role="status">
                        <Prose as="span" id="group-result">
                            {result} {mode !== 'none' ? 'Selección: ' + (selected.join(', ') || 'vacía') : ''}
                        </Prose>
                        <Prose as="span">
                            <Prose as="span" id="group-action-count">
                                {actions}
                            </Prose>{' '}
                            acciones ·{' '}
                            <Prose as="span" id="group-change-count">
                                {changes}
                            </Prose>{' '}
                            cambios
                        </Prose>
                    </Prose>
                    <section className="example-code">
                        <Prose as="h2">Código de la configuración</Prose>
                        <pre tabIndex={0}>
                            <code>{code}</code>
                        </pre>
                    </section>
                    <section className="sizes-section">
                        <Prose as="h2">Standard y Connected</Prose>
                        <Prose as="p">
                            Standard responde entre vecinos inmediatos. Connected conserva los anchos. En selección, la forma y el color
                            comunican el estado; el check es opcional.
                        </Prose>
                        <Prose as="h3">Standard</Prose>
                        <Specimen id="variant-standard" />
                        <Prose as="h3">Connected</Prose>
                        <Specimen id="variant-connected" variant="connected" />
                    </section>
                    <CommonLayouts />
                    <section className="sizes-section">
                        <Prose as="h2">Los cinco tamaños</Prose>
                        <Prose as="p">Muestras a escala real. Desplaza las filas grandes horizontalmente para ver todos sus botones.</Prose>
                        {sizes.map((s) => (
                            <article key={s} className="component-use">
                                <Prose as="h3">
                                    {s} · {buttonGroupSizeTokens[s].height} dp
                                </Prose>
                                {(['standard', 'connected'] as const).flatMap((v) =>
                                    [false, true].map((icons) => (
                                        <div key={v + icons}>
                                            <Prose as="p">
                                                {v} · {icons ? 'iconos' : 'etiquetas'}
                                            </Prose>
                                            <Specimen
                                                id={'size-' + s + '-' + v + '-' + (icons ? 'icons' : 'labels')}
                                                size={s}
                                                variant={v}
                                                icons={icons}
                                            />
                                        </div>
                                    ))
                                )}
                            </article>
                        ))}
                    </section>
                    <section className="sizes-section">
                        <Prose as="h2">Formas y tratamientos</Prose>
                        <Prose as="p">
                            Round y Square son configuraciones de ambas variantes. Connected mantiene un tratamiento uniforme. Standard
                            admite jerarquía entre acciones; evita text buttons y standard icon buttons sin superficie. Elevated se muestra
                            en Connected.
                        </Prose>
                        {(['round', 'square'] as const).map((s) => (
                            <article key={s}>
                                <Prose as="h3">{s}</Prose>
                                <Specimen id={'shape-' + s} variant="connected" shape={s} />
                            </article>
                        ))}
                        {(['filled', 'tonal', 'outlined', 'elevated'] as const).map((v) => (
                            <article key={v}>
                                <Prose as="h3">{v}</Prose>
                                <Specimen id={'treatment-' + v} variant="connected" treatment={v} />
                            </article>
                        ))}
                    </section>
                    <section className="sizes-section">
                        <Prose as="h2">Medidas y densidad</Prose>
                        <Prose as="p">
                            Los objetivos de interacción conservan al menos 48 × 48 dp. Connected usa separación de 2 dp en todas las
                            tallas. La densidad resta 4 dp por paso a la altura visual, conserva texto y objetivos y se elige de forma
                            explícita.
                        </Prose>
                        <Prose as="div" className="control-scroll">
                            <table className="group-token-table">
                                <thead>
                                    <tr>
                                        {['Tamaño', 'Altura', 'Separación Standard', 'Interior Connected', 'Interior pressed', 'Texto'].map(
                                            (t) => (
                                                <th key={t}>
                                                    <Prose as="span">{t}</Prose>
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sizes.map((s) => {
                                        const t = buttonGroupSizeTokens[s];
                                        return (
                                            <tr key={s}>
                                                {[s, t.height, t.between, t.inner, t.pressedInner, t.text].map((v, i) => (
                                                    <td key={i}>
                                                        <Prose as="span">{v}</Prose>
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Prose>
                        {([0, -1, -2, -3] as const).map((d) => (
                            <article key={d}>
                                <Prose as="h3">Densidad {d}</Prose>
                                <Specimen id={'density-' + d} variant="connected" density={d} />
                            </article>
                        ))}
                    </section>
                    <section className="sizes-section">
                        <Prose as="h2">Teclado y movimiento</Prose>
                        <Prose as="p">
                            Tab entra en el grupo; las flechas recorren las opciones disponibles, Home y End llegan a los extremos y Enter o
                            Espacio activan una vez. El contenedor no recibe foco. Al cancelar o cambiar la configuración, la presión se
                            limpia. Movimiento reducido conserva la selección y aplica los cambios de estado sin recorrido animado.
                        </Prose>
                    </section>
                    <ButtonGroupUses />
                </main>
                <RuntimeBridge />
            </RuntimeTextRoot>
        </MobileDesignProvider>
    );
}
