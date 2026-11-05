import { SelectField } from './select-field';
import { Prose, RuntimeTextRoot } from './prose';
import { useState } from 'react';
import { View } from 'react-native';
import { MobileDesignProvider, Text, useMobileTheme, type TextVariant } from 'mobile-design';
import { type LanguageHeight } from '@mobile-design/tokens';
import { RuntimeBridge, useRuntimeEnvironment } from './environment';

const roles = ['display', 'headline', 'title', 'body', 'label'] as const;
const sizes = ['Large', 'Medium', 'Small'] as const;
const variants = roles.flatMap((role) => sizes.map((size) => (role + size) as TextVariant));
const copy = 'La música también se lee. Encuentra espacio para tus canciones, tus historias y tus próximos descubrimientos.';

function Specimen({ variant, text }: { variant: TextVariant; text: string }) {
    const theme = useMobileTheme();
    const token = theme.fonts[variant as keyof typeof theme.fonts] as {
        fontSize: number;
        lineHeight: number;
        letterSpacing: number;
        fontWeight: string;
    };
    return (
        <Prose as="div" className="type-specimen" data-variant={variant}>
            <Prose as="div" className="type-specimen-meta">
                <code>{variant}</code>
                <Prose as="span">
                    {token.fontSize} / {token.lineHeight} · peso {token.fontWeight} · espaciado {token.letterSpacing}
                </Prose>
            </Prose>
            <Text variant={variant} selectable testID={'type-' + variant} {...{ dataSet: { runtimeText: 'native' } }}>
                {text}
            </Text>
        </Prose>
    );
}
function Content({
    variant,
    text,
    alignment,
    color,
    selectable,
    width,
}: {
    variant: TextVariant;
    text: string;
    alignment: 'left' | 'center' | 'right';
    color: 'onSurface' | 'onSurfaceVariant' | 'primary' | 'error';
    selectable: boolean;
    width: number;
}) {
    const theme = useMobileTheme();
    const token = theme.fonts[variant as keyof typeof theme.fonts] as {
        fontSize: number;
        lineHeight: number;
        letterSpacing: number;
        fontWeight: string;
    };
    return (
        <>
            <Prose as="div" className="typography-stage">
                <Text
                    variant={variant}
                    selectable={selectable}
                    style={{ textAlign: alignment, color: theme.colors[color], width: '100%' }}
                    testID="example-text"
                    {...{ dataSet: { runtimeText: 'native' } }}
                >
                    {text || 'Escribe una frase para verla aquí.'}
                </Text>
            </Prose>
            <Prose as="p" className="type-metrics" id="type-metrics">
                Roboto · {token.fontSize} / {token.lineHeight} · peso {token.fontWeight} · espaciado {token.letterSpacing}
            </Prose>
            <section className="example-code">
                <Prose as="h2">Código de la configuración</Prose>
                <pre tabIndex={0}>
                    <code>{`<Text\n  variant="${variant}"${selectable ? '\n  selectable' : ''}\n  style={{ textAlign: '${alignment}', color: theme.colors.${color} }}\n>\n  ${text}\n</Text>`}</code>
                </pre>
            </section>
            <section className="sizes-section" id="type-scale">
                <Prose as="h2">Los 30 estilos</Prose>
                <Prose as="p">Base y énfasis conservan tamaño, interlineado y espaciado. El énfasis utiliza el peso de su token.</Prose>
                {variants.map((base) => (
                    <article className="type-pair" key={base} aria-label={base}>
                        <Specimen variant={base} text="Diseña para escuchar." />
                        <Specimen variant={(base + 'Emphasized') as TextVariant} text="Diseña para escuchar." />
                    </article>
                ))}
            </section>
            <section className="usage-section">
                <Prose as="h2">Ejemplos en contexto</Prose>
                <article className="type-context" style={{ maxWidth: width }}>
                    <View style={{ gap: 16 }}>
                        <Text variant="labelLarge" style={{ color: theme.colors.primary }} {...{ dataSet: { runtimeText: 'native' } }}>
                            TU BIBLIOTECA
                        </Text>
                        <Text variant="headlineMedium" role="heading" aria-level={3} {...{ dataSet: { runtimeText: 'native' } }}>
                            Historias para el camino
                        </Text>
                        <Text variant="bodyLarge" selectable {...{ dataSet: { runtimeText: 'native' } }}>
                            {copy} Escuchar también es una manera de recordar. Mañana habrá nuevas voces esperando.
                        </Text>
                        <Text
                            variant="bodyMedium"
                            style={{ color: theme.colors.onSurfaceVariant }}
                            {...{ dataSet: { runtimeText: 'native' } }}
                        >
                            Actualizado hoy · 12 canciones
                        </Text>
                    </View>
                </article>
                <article className="type-context">
                    <View style={{ gap: 12 }}>
                        <Text variant="titleMedium" role="heading" aria-level={3} {...{ dataSet: { runtimeText: 'native' } }}>
                            Énfasis dentro de un párrafo
                        </Text>
                        <Text variant="bodyLarge" {...{ dataSet: { runtimeText: 'native' } }}>
                            Escucha sin prisas.{' '}
                            <Text variant="bodyLargeEmphasized" {...{ dataSet: { runtimeText: 'native' } }}>
                                Tus favoritos siguen aquí.
                            </Text>{' '}
                            El resto del párrafo conserva su estilo base.
                        </Text>
                        <Text variant="bodyLarge" selectable {...{ dataSet: { runtimeText: 'native' } }}>
                            Árbol, pingüino, canción, ¿qué escucharás hoy? 0123456789 · +52 · @music
                        </Text>
                    </View>
                </article>
                <article className="type-context">
                    <View style={{ gap: 12 }}>
                        <Text variant="titleMedium" role="heading" aria-level={3} {...{ dataSet: { runtimeText: 'native' } }}>
                            Números que mantienen su ancho
                        </Text>
                        <Text
                            variant="displaySmall"
                            style={{ fontVariant: ['tabular-nums'] }}
                            testID="type-clock"
                            {...{ dataSet: { runtimeText: 'native' } }}
                        >
                            01:11 / 08:48
                        </Text>
                        <Text variant="bodyMedium" {...{ dataSet: { runtimeText: 'native' } }}>
                            Los números tabulares evitan que el contador cambie de anchura. No se añade una animación al texto estático.
                        </Text>
                    </View>
                </article>
            </section>
        </>
    );
}
export function TypographyRuntime() {
    const environment = useRuntimeEnvironment();
    const [role, setRole] = useState<(typeof roles)[number]>('body'),
        [size, setSize] = useState<(typeof sizes)[number]>('Large');
    const [emphasized, setEmphasized] = useState(false),
        [text, setText] = useState(copy),
        [selectable, setSelectable] = useState(true);
    const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left'),
        [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
    const [color, setColor] = useState<'onSurface' | 'onSurfaceVariant' | 'primary' | 'error'>('onSurface');
    const [height, setHeight] = useState<LanguageHeight>('small'),
        [width, setWidth] = useState(560);
    const variant = (role + size + (emphasized ? 'Emphasized' : '')) as TextVariant;
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            direction={direction}
            languageHeight={height}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <RuntimeTextRoot>
                <main aria-label="Text y escala tipográfica">
                    <Prose as="div" className="playground-controls">
                        <SelectField
                            label="Función"
                            id="type-role"
                            value={role}
                            onValueChange={(nextValue) => setRole(nextValue as typeof role)}
                            options={roles.map((r) => ({ value: r, label: r }))}
                        />
                        <SelectField
                            label="Tamaño"
                            id="type-size"
                            value={size}
                            onValueChange={(nextValue) => setSize(nextValue as typeof size)}
                            options={sizes.map((s) => ({ value: s, label: s }))}
                        />
                        <SelectField
                            label="Estilo"
                            id="type-emphasis"
                            value={emphasized ? 'emphasized' : 'baseline'}
                            onValueChange={(nextValue) => setEmphasized(nextValue === 'emphasized')}
                            options={[
                                { value: 'baseline', label: 'Baseline' },
                                { value: 'emphasized', label: 'Emphasized' },
                            ]}
                        />
                        <SelectField
                            label="Color"
                            id="type-color"
                            value={color}
                            onValueChange={(nextValue) => setColor(nextValue as typeof color)}
                            options={['onSurface', 'onSurfaceVariant', 'primary', 'error'].map((c) => ({ value: c, label: c }))}
                        />
                        <SelectField
                            label="Alineación"
                            id="type-alignment"
                            value={alignment}
                            onValueChange={(nextValue) => setAlignment(nextValue as typeof alignment)}
                            options={[
                                { value: 'left', label: 'Izquierda' },
                                { value: 'center', label: 'Centro' },
                                { value: 'right', label: 'Derecha' },
                            ]}
                        />
                        <SelectField
                            label="Dirección"
                            id="type-direction"
                            value={direction}
                            onValueChange={(nextValue) => setDirection(nextValue as typeof direction)}
                            options={[
                                { value: 'ltr', label: 'LTR' },
                                { value: 'rtl', label: 'RTL' },
                            ]}
                        />
                        <SelectField
                            label="Altura de escritura"
                            id="type-language-height"
                            value={height}
                            onValueChange={(nextValue) => setHeight(nextValue as LanguageHeight)}
                            options={['small', 'medium', 'large', 'extraLarge'].map((h) => ({ value: h, label: h }))}
                        />
                        <Prose as="label">
                            Ancho de lectura
                            <input
                                id="type-reading-width"
                                type="range"
                                min="180"
                                max="640"
                                value={width}
                                onChange={(e) => setWidth(Number(e.target.value))}
                            />
                        </Prose>
                        <Prose as="div" className="state-options">
                            <Prose as="label">
                                <input
                                    id="type-selectable"
                                    type="checkbox"
                                    checked={selectable}
                                    onChange={(e) => setSelectable(e.target.checked)}
                                />
                                Texto seleccionable
                            </Prose>
                        </Prose>
                    </Prose>
                    <Prose as="label" className="type-input" htmlFor="type-copy">
                        Contenido
                        <textarea id="type-copy" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
                    </Prose>
                    <Content variant={variant} text={text} alignment={alignment} color={color} selectable={selectable} width={width} />
                </main>
                <RuntimeBridge />
            </RuntimeTextRoot>
        </MobileDesignProvider>
    );
}
