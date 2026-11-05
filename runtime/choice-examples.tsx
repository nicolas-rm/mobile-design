import { MobileDesignProvider } from 'mobile-design';
import { ChoiceExamples } from './showcases/mobile-design-choice-examples';
import { RuntimeBridge, useRuntimeEnvironment } from './environment';
import { Prose, RuntimeTextRoot } from './prose';

function ChoiceRuntime({ id }: { id: 'select' | 'autocomplete' }) {
    const environment = useRuntimeEnvironment();
    return (
        <MobileDesignProvider colorScheme={environment.colorScheme} reduceMotion={environment.reduced ? 'on' : 'auto'}>
            <RuntimeTextRoot>
                <main aria-label={id === 'select' ? 'Ejemplo de Select' : 'Ejemplo de Autocomplete'} style={{ minHeight: 460 }}>
                    <Prose as="p" className="preview-guidance">
                        {id === 'select'
                            ? 'Abre el campo y elige una calidad de audio.'
                            : 'Escribe una ciudad y elige una de las sugerencias.'}
                    </Prose>
                    <ChoiceExamples id={id} />
                    <RuntimeBridge />
                </main>
            </RuntimeTextRoot>
        </MobileDesignProvider>
    );
}

export const SelectRuntime = () => <ChoiceRuntime id="select" />;
export const AutocompleteRuntime = () => <ChoiceRuntime id="autocomplete" />;
