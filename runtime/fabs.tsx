import { SelectField } from './select-field';
import { Prose, RuntimeTextRoot } from './prose';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { FAB, Tooltip, type FABProps, type FABSize, type FABVariant } from 'mobile-design/react-native-web';
import { MaterialSymbol } from '@mobile-design/icons/react-native-web';
import { GalleryProvider as MobileDesignProvider } from './gallery-provider';
import { RuntimeBridge, useRuntimeEnvironment } from './environment';
import { FABUsage } from './extended-fab';

const variants: FABVariant[] = ['tonalPrimary', 'tonalSecondary', 'tonalTertiary', 'primary', 'secondary', 'tertiary'];
const names = ['Primary container', 'Secondary container', 'Tertiary container', 'Primary', 'Secondary', 'Tertiary'];
const sizes: FABSize[] = ['default', 'medium', 'large'];
const sizeLabels: Record<FABSize, string> = { default: 'FAB · 56', medium: 'Medium · 80', large: 'Large · 96' };
export function FABsRuntime() {
    const environment = useRuntimeEnvironment();
    const [size, setSize] = useState<FABSize>('medium'),
        [variant, setVariant] = useState<FABVariant>('tonalPrimary');
    const [visible, setVisible] = useState(true),
        [symbol, setSymbol] = useState('edit'),
        [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
    const [motion, setMotion] = useState<'standard' | 'expressive'>('expressive'),
        [count, setCount] = useState(0);
    const icon: FABProps['icon'] = useCallback(
        ({ size, color }: { size: number; color: string }) => <MaterialSymbol name={symbol} size={size} color={color} filled />,
        [symbol]
    );
    const code = `<FAB\n  size="${size}"\n  variant="${variant}"\n  icon={(props: { size: number; color: string }) => <MaterialSymbol {...props} name="${symbol}" filled />}\n  visible={${visible}}\n  accessibilityLabel="Crear contenido"\n  onPress={handleCreate}\n/>`;
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            direction={direction}
            motion={motion}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <RuntimeTextRoot>
                <main aria-label="Ejemplo interactivo de FABs">
                    <Prose as="div" className="playground-controls" aria-label="Configurar FAB">
                        <SelectField
                            label="Tamaño"
                            id="fab-size"
                            value={size}
                            onValueChange={(nextValue) => setSize(nextValue as FABSize)}
                            options={sizes.map((value) => ({ value, label: sizeLabels[value] }))}
                        />
                        <SelectField
                            label="Color"
                            id="fab-variant"
                            value={variant}
                            onValueChange={(nextValue) => setVariant(nextValue as FABVariant)}
                            options={variants.map((v, i) => ({ value: v, label: names[i] }))}
                        />
                        <SelectField
                            label="Icono"
                            id="fab-symbol"
                            value={symbol}
                            onValueChange={(nextValue) => setSymbol(nextValue)}
                            options={['edit', 'add', 'share', 'favorite'].map((name) => ({ value: name, label: name }))}
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
                        <Prose as="div" className="state-options">
                            <Prose as="label">
                                <input id="fab-visible" type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
                                Visible
                            </Prose>
                        </Prose>
                    </Prose>
                    <Prose as="div" className="button-stage" dir={direction}>
                        <View>
                            <Tooltip title="Crear contenido">
                                <FAB
                                    size={size}
                                    variant={variant}
                                    icon={icon}
                                    visible={visible}
                                    accessibilityLabel="Crear contenido"
                                    onPress={() => setCount((v) => v + 1)}
                                    testID="example-fab"
                                />
                            </Tooltip>
                        </View>
                    </Prose>
                    <Prose as="div" className="example-result" role="status">
                        <Prose as="span">Una acción principal; se oculta cuando deja de estar disponible.</Prose>
                        <Prose as="span">
                            <Prose as="span" id="fab-activation-count">
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
                        <Prose as="h2">Los tres tamaños</Prose>
                        <Prose as="div" className="variant-examples">
                            {sizes.map((size) => (
                                <Prose as="div" className="labeled-example" key={size}>
                                    <Tooltip title="Crear contenido">
                                        <FAB
                                            size={size}
                                            icon={icon}
                                            accessibilityLabel={`Crear contenido · ${sizeLabels[size]}`}
                                            onPress={() => setCount((value) => value + 1)}
                                        />
                                    </Tooltip>
                                    <Prose as="span">{sizeLabels[size]}</Prose>
                                </Prose>
                            ))}
                        </Prose>
                    </section>
                    <FABUsage direction={direction} extended={false} />
                </main>
                <RuntimeBridge />
            </RuntimeTextRoot>
        </MobileDesignProvider>
    );
}
