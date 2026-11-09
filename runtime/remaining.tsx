import { SelectField } from './select-field';
import { useState } from 'react';
import { GalleryProvider as MobileDesignProvider } from './gallery-provider';
import { Prose, RuntimeTextRoot } from './prose';
import { RuntimeBridge, useRuntimeEnvironment } from './environment';
import { ComponentWindow } from './component-window';
import families from './remaining-families.json';
export type RemainingFamily = keyof typeof families;
export function RemainingRuntime() {
    const family = new URLSearchParams(location.search).get('component') as RemainingFamily,
        entry = families[family],
        environment = useRuntimeEnvironment();
    const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr'),
        [motion, setMotion] = useState<'standard' | 'expressive'>('expressive'),
        [width, setWidth] = useState(0),
        [height, setHeight] = useState(680),
        [scenario, setScenario] = useState('gallery');
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            direction={direction}
            motion={motion}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <RuntimeTextRoot>
                <main aria-label={'Ejemplo interactivo de ' + entry.title}>
                    <Prose as="div" className="playground-controls">
                        <SelectField
                            label="Ejemplo"
                            id="family-scenario"
                            value={scenario}
                            onValueChange={(nextValue) => setScenario(nextValue)}
                            options={entry.scenarios.map(([id, title]) => ({ value: id, label: title }))}
                        />
                        <SelectField
                            label="Ancho de ventana"
                            id="family-width"
                            value={width}
                            onValueChange={(nextValue) => setWidth(Number(nextValue))}
                            options={[
                                { value: '0', label: 'Disponible' },
                                ...[320, 390, 600, 960].map((value) => ({ value: value, label: String(value) + String(' dp') })),
                            ]}
                        />
                        <SelectField
                            label="Altura de ventana"
                            id="family-height"
                            value={height}
                            onValueChange={(nextValue) => setHeight(Number(nextValue))}
                            options={[480, 680, 900].map((value) => ({ value: value, label: value }))}
                        />
                        <SelectField
                            label="Dirección"
                            id="family-direction"
                            value={direction}
                            onValueChange={(nextValue) => setDirection(nextValue as typeof direction)}
                            options={[
                                { value: 'ltr', label: 'Izquierda a derecha' },
                                { value: 'rtl', label: 'Derecha a izquierda' },
                            ]}
                        />
                        <SelectField
                            label="Movimiento"
                            id="family-motion"
                            value={motion}
                            onValueChange={(nextValue) => setMotion(nextValue as typeof motion)}
                            options={[
                                { value: 'expressive', label: 'Expressive' },
                                { value: 'standard', label: 'Standard' },
                            ]}
                        />
                    </Prose>
                    <Prose as="p" className="preview-guidance">
                        Explora las variantes, estados y ejemplos completos. Las opciones conservan las acciones y el movimiento del
                        componente original; los paneles y el desplazamiento se ejecutan dentro de esta ventana.
                    </Prose>
                    <ComponentWindow
                        component="catalog-window"
                        testID="family-window"
                        title={entry.title + ' · variantes y usos'}
                        width={width}
                        height={height}
                        configuration={{ family, scenario, direction, motion }}
                        onScenarioChange={setScenario}
                        onBack={() => {
                            setScenario('gallery');
                            document.getElementById('family-scenario')?.focus({ preventScroll: true });
                        }}
                    />
                    <section className="sizes-section">
                        <Prose as="h2">Variantes y configuración</Prose>
                        <Prose as="p">
                            {entry.variants.length ? entry.variants.join(' · ') : 'Estados y composiciones del componente'}
                        </Prose>
                        <Prose as="p">
                            Dentro de la galería se muestran las propiedades, medidas y configuraciones correspondientes. Los ejemplos de
                            integración y la API completa permanecen disponibles en esta ficha.
                        </Prose>
                    </section>
                </main>
                <RuntimeBridge />
            </RuntimeTextRoot>
        </MobileDesignProvider>
    );
}
