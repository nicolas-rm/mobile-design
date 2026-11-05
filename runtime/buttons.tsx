import { SelectField } from './select-field';
import { Prose, RuntimeTextRoot } from './prose';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, type ColorValue } from 'react-native';
import { Button, MaterialSymbol, MobileDesignProvider } from 'mobile-design';
import { type ButtonSize, type ButtonVariant } from '@mobile-design/tokens';
import './styles.css';

import { RuntimeBridge, useRuntimeEnvironment } from './environment';
const sizes: ButtonSize[] = ['extra-small', 'small', 'medium', 'large', 'extra-large'];
const variants: ButtonVariant[] = ['filled', 'tonal', 'elevated', 'outlined', 'text'];
const labels: Record<ButtonSize, string> = { 'extra-small': 'XS', small: 'S', medium: 'M', large: 'L', 'extra-large': 'XL' };
const defaults = {
    variant: 'filled' as ButtonVariant,
    size: 'small' as ButtonSize,
    shape: 'round' as 'round' | 'square',
    toggle: false,
    icon: true,
    disabled: false,
    loading: false,
    label: 'Guardar',
};

function ToggleExamples() {
    const [round, setRound] = useState(false),
        [square, setSquare] = useState(false);
    return (
        <section className="sizes-section">
            <Prose as="h2">Selección y cambio de forma</Prose>
            <Prose as="p">
                Al seleccionar, cambia el relleno del icono y se invierte la forma de reposo. Mantener pulsado muestra la forma de presión.
            </Prose>
            <Prose as="div" className="variant-examples">
                <Button
                    variant="tonal"
                    shape="round"
                    selected={round}
                    icon={(props) => <MaterialSymbol {...props} name="bookmark" filled={round} />}
                    onPress={() => setRound((value) => !value)}
                    testID="button-toggle-round"
                >
                    {round ? 'Guardado' : 'Guardar'}
                </Button>
                <Button
                    variant="tonal"
                    shape="square"
                    selected={square}
                    icon={(props) => <MaterialSymbol {...props} name="bookmark" filled={square} />}
                    onPress={() => setSquare((value) => !value)}
                    testID="button-toggle-square"
                >
                    {square ? 'Guardado' : 'Guardar'}
                </Button>
            </Prose>
        </section>
    );
}

export function ButtonsRuntime() {
    const environment = useRuntimeEnvironment();
    const [config, setConfig] = useState(defaults);
    const [selected, setSelected] = useState(false);
    const [motion, setMotion] = useState<'standard' | 'expressive'>('standard');
    const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
    const [count, setCount] = useState(0);
    const icon = useCallback(
        (props: { size: number; color: ColorValue | null }) => (
            <MaterialSymbol {...props} name="bookmark" filled={config.toggle ? selected : true} />
        ),
        [config.toggle, selected]
    );
    const [feedback, setFeedback] = useState('Prueba el botón para ver su respuesta.');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveCount, setSaveCount] = useState(0);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const pending = useRef(false);
    useEffect(
        () => () => {
            clearTimeout(saveTimer.current);
            pending.current = false;
        },
        []
    );
    const change = <K extends keyof typeof defaults>(key: K, value: (typeof defaults)[K]) => {
        setConfig((current) => ({
            ...current,
            [key]: value,
            ...(key === 'toggle' && value && current.variant === 'text' ? { variant: 'filled' as ButtonVariant } : {}),
        }));
        setFeedback('Prueba el botón para ver su respuesta.');
    };
    const activate = () => {
        setCount((value) => value + 1);
        if (config.toggle) {
            setSelected((value) => !value);
            setFeedback(selected ? 'Elemento sin guardar.' : 'Elemento guardado.');
        } else setFeedback('Acción realizada.');
    };
    const save = () => {
        if (pending.current) return;
        pending.current = true;
        setSaving(true);
        setSaved(false);
        saveTimer.current = setTimeout(() => {
            pending.current = false;
            setSaving(false);
            setSaved(true);
            setSaveCount((value) => value + 1);
        }, 1000);
    };
    const label = config.label || defaults.label;
    const code = `<Button\n  variant="${config.variant}"\n  size="${config.size}"\n  shape="${config.shape}"${config.toggle ? '\n  selected={selected}' : ''}${config.icon ? `\n  icon={props => <MaterialSymbol {...props} name="bookmark" filled={${config.toggle ? 'selected' : 'true'}} />}` : ''}${config.disabled ? '\n  disabled' : ''}${config.loading ? '\n  loading' : ''}\n  onPress={${config.toggle ? '() => setSelected(value => !value)' : 'handlePress'}}\n>\n  {${JSON.stringify(label)}}\n</Button>`;
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            motion={motion}
            direction={direction}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <RuntimeTextRoot>
                <main aria-label="Ejemplo interactivo de Buttons">
                    <Prose as="div" className="playground-controls" aria-label="Configurar Button">
                        <SelectField
                            label="Tipo"
                            id="button-type"
                            value={config.toggle ? 'toggle' : 'default'}
                            onValueChange={(nextValue) => change('toggle', nextValue === 'toggle')}
                            options={[
                                { value: 'default', label: 'Default' },
                                { value: 'toggle', label: 'Toggle' },
                            ]}
                        />
                        <SelectField
                            label="Estilo"
                            id="button-variant"
                            value={config.variant}
                            onValueChange={(nextValue) => change('variant', nextValue as ButtonVariant)}
                            options={variants
                                .filter((kind) => !config.toggle || kind !== 'text')
                                .map((kind) => ({ value: kind, label: kind[0].toUpperCase() + kind.slice(1) }))}
                        />
                        <SelectField
                            label="Tamaño"
                            id="button-size"
                            value={config.size}
                            onValueChange={(nextValue) => change('size', nextValue as ButtonSize)}
                            options={sizes.map((size) => ({ value: size, label: String(labels[size]) + String(' · ') + String(size) }))}
                        />
                        <SelectField
                            label="Forma"
                            id="button-shape"
                            value={config.shape}
                            onValueChange={(nextValue) => change('shape', nextValue as 'round' | 'square')}
                            options={[
                                { value: 'round', label: 'Round' },
                                { value: 'square', label: 'Square' },
                            ]}
                        />
                        <Prose as="label">
                            Etiqueta
                            <input
                                id="button-label"
                                value={config.label}
                                maxLength={80}
                                onChange={(e) => change('label', e.target.value)}
                            />
                        </Prose>
                        <SelectField
                            label="Movimiento"
                            id="button-motion"
                            value={motion}
                            onValueChange={(nextValue) => setMotion(nextValue as typeof motion)}
                            options={[
                                { value: 'expressive', label: 'Expressive' },
                                { value: 'standard', label: 'Standard' },
                            ]}
                        />
                        <SelectField
                            label="Dirección"
                            id="button-direction"
                            value={direction}
                            onValueChange={(nextValue) => setDirection(nextValue as typeof direction)}
                            options={[
                                { value: 'ltr', label: 'Izquierda a derecha' },
                                { value: 'rtl', label: 'Derecha a izquierda' },
                            ]}
                        />
                        <Prose as="div" className="state-options">
                            <Prose as="label">
                                <input
                                    type="checkbox"
                                    id="button-icon"
                                    checked={config.icon}
                                    onChange={(e) => change('icon', e.target.checked)}
                                />
                                Icono
                            </Prose>
                            <Prose as="label">
                                <input
                                    type="checkbox"
                                    id="button-disabled"
                                    checked={config.disabled}
                                    onChange={(e) => change('disabled', e.target.checked)}
                                />
                                Disabled
                            </Prose>
                            <Prose as="label">
                                <input
                                    type="checkbox"
                                    id="button-loading"
                                    checked={config.loading}
                                    onChange={(e) => change('loading', e.target.checked)}
                                />
                                Loading
                            </Prose>
                            {config.toggle ? (
                                <Prose as="label">
                                    <input
                                        type="checkbox"
                                        id="button-selected"
                                        checked={selected}
                                        onChange={(e) => setSelected(e.target.checked)}
                                    />
                                    Selected
                                </Prose>
                            ) : null}
                        </Prose>
                    </Prose>
                    <Prose as="div" className="button-stage" dir={direction}>
                        <View style={{ maxWidth: '100%' }}>
                            <Button
                                variant={config.variant}
                                size={config.size}
                                shape={config.shape}
                                selected={config.toggle ? selected : undefined}
                                icon={config.icon ? icon : undefined}
                                disabled={config.disabled}
                                loading={config.loading}
                                onPress={activate}
                                testID="example-button"
                            >
                                {label}
                            </Button>
                        </View>
                    </Prose>
                    <Prose as="div" className="example-result" role="status" aria-live="polite">
                        <Prose as="span">{feedback}</Prose>
                        <Prose as="span">
                            <Prose as="span" id="activation-count">
                                {count}
                            </Prose>{' '}
                            acciones
                        </Prose>
                    </Prose>
                    <ToggleExamples />
                    <section className="example-code" aria-label="Código de la configuración">
                        <Prose as="h2">Código de la configuración</Prose>
                        <pre tabIndex={0}>
                            <code>{code}</code>
                        </pre>
                    </section>
                    <section className="usage-section" aria-labelledby="loading-title">
                        <Prose as="h2" id="loading-title">
                            Acción con carga
                        </Prose>
                        <Prose as="p">Guardar muestra el progreso y confirma el resultado al terminar.</Prose>
                        <Prose as="div" className="usage-row">
                            <Button
                                variant="filled"
                                icon={saved ? 'check' : 'content-save-outline'}
                                loading={saving}
                                onPress={save}
                                testID="async-button"
                            >
                                {saving ? 'Guardando' : saved ? 'Guardado' : 'Guardar cambios'}
                            </Button>
                            <Prose as="span" role="status" aria-live="polite" id="save-status" data-completed={saveCount}>
                                {saving ? 'Guardando cambios…' : saved ? 'Cambios guardados.' : 'Listo para guardar.'}
                            </Prose>
                        </Prose>
                    </section>
                    <section className="sizes-section">
                        <Prose as="h2">Los cinco estilos</Prose>
                        <Prose as="div" className="variant-examples">
                            {variants.map((variant) => (
                                <Button
                                    key={variant}
                                    variant={variant}
                                    icon="add"
                                    onPress={() => setFeedback(variant + ' activado.')}
                                    testID={'variant-' + variant}
                                >
                                    {variant[0].toUpperCase() + variant.slice(1)}
                                </Button>
                            ))}
                        </Prose>
                    </section>
                </main>
                <RuntimeBridge />
            </RuntimeTextRoot>
        </MobileDesignProvider>
    );
}
