import { SelectField } from './select-field';
import { useState } from 'react';
import { View } from 'react-native';
import {
    Badge,
    BadgedBox,
    Icon,
    IconButton,
    NavigationBar,
    NavigationRail,
    Text,
} from 'mobile-design/react-native-web';
import { MaterialSymbol } from '@mobile-design/icons/react-native-web';
import { GalleryProvider as MobileDesignProvider } from './gallery-provider';
import { Prose, RuntimeTextRoot } from './prose';
import { RuntimeBridge, useRuntimeEnvironment } from './environment';
import { ComponentWindow } from './component-window';
export const badgeScenarios = [
    ['navigation-bar', 'Mail · Chat · Rooms · Meet'],
    ['navigation-rail', 'Files · Photos · Documents'],
    ['tabs', 'Favorites · Collections'],
    ['app-bar', 'My collection'],
    ['travel', 'Flights · Hotels · Events'],
] as const;
const matrix = [
    { id: 'inactive-label', title: 'Inactive · con etiqueta', active: false, labels: true, rail: false },
    { id: 'inactive-no-label', title: 'Inactive · sin etiqueta', active: false, labels: false, rail: false },
    { id: 'active-label', title: 'Active · con etiqueta', active: true, labels: true, rail: false },
    { id: 'active-bar-no-label', title: 'Active · Navigation bar · sin etiqueta', active: true, labels: false, rail: false },
    { id: 'active-rail-no-label', title: 'Active · Navigation rail · sin etiqueta', active: true, labels: false, rail: true },
];
function Specimen({ row, badge, index }: { row: (typeof matrix)[number]; badge: boolean | number; index: number }) {
    const [value, setValue] = useState(row.active ? 'sample' : ''),
        items = [{ key: 'sample', label: 'Label', icon: 'change_history', selectedIcon: 'circle_fill1', badge }];
    return (
        <View style={{ width: 110, alignItems: 'center' }} testID={'badge-spec-' + row.id + '-' + index}>
            {row.rail ? (
                <NavigationRail
                    value={value}
                    onValueChange={setValue}
                    items={items}
                    labelVisibility={row.labels ? 'all' : 'none'}
                    style={{ paddingTop: 0, paddingBottom: 0 }}
                    testID={'badge-spec-rail-' + index}
                />
            ) : (
                <NavigationBar
                    value={value}
                    onValueChange={setValue}
                    items={items}
                    labelVisibility={row.labels ? 'all' : 'none'}
                    safeArea={false}
                    style={{ width: 110 }}
                    testID={'badge-spec-bar-' + row.id + '-' + index}
                />
            )}
        </View>
    );
}
function Contexts() {
    const [places, setPlaces] = useState('places'),
        [files, setFiles] = useState('files'),
        [photos, setPhotos] = useState('photos'),
        [made, setMade] = useState('home');
    return (
        <section className="sizes-section">
            <Prose as="h2">Composiciones de las figuras</Prose>
            <article className="component-use">
                <Prose as="h3">Small · Home / My places / Explore</Prose>
                <NavigationBar
                    safeArea={false}
                    value={places}
                    onValueChange={setPlaces}
                    items={[
                        { key: 'home', label: 'Home', icon: 'home', selectedIcon: 'home_fill1' },
                        { key: 'places', label: 'My places', icon: 'map', selectedIcon: 'map_fill1', badge: true },
                        { key: 'explore', label: 'Explore', icon: 'explore' },
                    ]}
                    testID="badge-context-places"
                />
            </article>
            <article className="component-use">
                <Prose as="h3">Large · Files / Recent / Favorite</Prose>
                <NavigationBar
                    safeArea={false}
                    value={files}
                    onValueChange={setFiles}
                    items={[
                        { key: 'files', label: 'Files', icon: 'folder_open', selectedIcon: 'folder_fill1', badge: 1004 },
                        { key: 'recent', label: 'Recent', icon: 'schedule' },
                        { key: 'favorite', label: 'Favorite', icon: 'favorite' },
                    ]}
                    testID="badge-context-files"
                />
            </article>
            <article className="component-use">
                <Prose as="h3">Color · Photos / Albums / Recents</Prose>
                <NavigationBar
                    safeArea={false}
                    value={photos}
                    onValueChange={setPhotos}
                    items={[
                        { key: 'photos', label: 'Photos', icon: 'image', selectedIcon: 'image_fill1', badge: 1 },
                        { key: 'albums', label: 'Albums', icon: 'photo_library', badge: true },
                        { key: 'recents', label: 'Recents', icon: 'schedule', badge: 1 },
                    ]}
                    testID="badge-context-photos"
                />
            </article>
            <article className="component-use">
                <Prose as="h3">Made for Lee · cantidad y novedad sin cantidad</Prose>
                {[1, true].map((badge, i) => (
                    <View key={i} style={{ marginBottom: 12 }}>
                        <NavigationBar
                            safeArea={false}
                            value={made}
                            onValueChange={setMade}
                            items={[
                                {
                                    key: 'home',
                                    label: 'Home',
                                    icon: 'home',
                                    selectedIcon: 'home_fill1',
                                    badge,
                                    accessibilityLabel: badge === true ? 'Home, nueva notificación' : 'Home, una nueva notificación',
                                },
                                { key: 'music', label: 'Music', icon: 'library_music' },
                                { key: 'podcasts', label: 'Podcasts', icon: 'podcasts' },
                            ]}
                            testID={'badge-context-made-' + i}
                        />
                    </View>
                ))}
            </article>
        </section>
    );
}
export function BadgesRuntime() {
    const environment = useRuntimeEnvironment(),
        [variant, setVariant] = useState<'dot' | 'large'>('large'),
        [kind, setKind] = useState('number'),
        [number, setNumber] = useState(1004),
        [label, setLabel] = useState('NEW'),
        [maximum, setMaximum] = useState(999),
        [visible, setVisible] = useState(true),
        [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr'),
        [motion, setMotion] = useState<'expressive' | 'standard'>('expressive'),
        [scenario, setScenario] = useState('navigation-bar'),
        [width, setWidth] = useState(390),
        [count, setCount] = useState(0);
    const content = kind === 'number' ? number : label.trim();
    const badge = variant === 'dot' ? true : content;
    const showBadge = visible && badge !== '';
    let destinationLabel = 'Correo';
    if (showBadge) {
        if (badge === true) destinationLabel += ', nueva notificación';
        else if (typeof badge === 'number') destinationLabel += `, ${badge} ${badge === 1 ? 'mensaje' : 'mensajes'}`;
        else destinationLabel += `, ${badge}`;
    }
    const code = `<BadgedBox badge={${showBadge ? JSON.stringify(badge) : 'undefined'}} maximum={${maximum}}>\n  <Icon source="mail" size={24} />\n</BadgedBox>\n\n<Badge variant="${variant}" visible={${showBadge}} maximum={${maximum}}>\n  ${variant === 'dot' ? '' : `{${JSON.stringify(content)}}`}\n</Badge>`;
    return (
        <MobileDesignProvider
            colorScheme={environment.colorScheme}
            motion={motion}
            direction={direction}
            reduceMotion={environment.reduced ? 'on' : 'auto'}
        >
            <RuntimeTextRoot>
                <main aria-label="Ejemplo interactivo de Badges">
                    <Prose as="div" className="playground-controls">
                        <SelectField
                            label="Variante"
                            id="badge-variant"
                            value={variant}
                            onValueChange={(nextValue) => setVariant(nextValue as typeof variant)}
                            options={[
                                { value: 'dot', label: 'Small · sin texto' },
                                { value: 'large', label: 'Large · con etiqueta' },
                            ]}
                        />
                        <SelectField
                            label="Contenido"
                            id="badge-content"
                            value={kind}
                            disabled={variant === 'dot'}
                            onValueChange={(nextValue) => setKind(nextValue)}
                            options={[
                                { value: 'number', label: 'Cantidad numérica' },
                                { value: 'label', label: 'Texto breve' },
                            ]}
                        />
                        {kind === 'number' ? (
                            <Prose as="label">
                                Cantidad
                                <input
                                    id="badge-number"
                                    type="number"
                                    min={0}
                                    max={100000}
                                    value={number}
                                    onChange={(e) => setNumber(Math.max(0, Number(e.target.value)))}
                                />
                            </Prose>
                        ) : (
                            <Prose as="label">
                                Etiqueta
                                <input id="badge-label" value={label} maxLength={20} onChange={(e) => setLabel(e.target.value)} />
                            </Prose>
                        )}
                        <SelectField
                            label="Máximo"
                            id="badge-maximum"
                            value={maximum}
                            onValueChange={(nextValue) => setMaximum(Number(nextValue))}
                            options={[
                                { value: '99', label: '99' },
                                { value: '999', label: '999' },
                            ]}
                        />
                        <SelectField
                            label="Dirección"
                            id="badge-direction"
                            value={direction}
                            onValueChange={(nextValue) => setDirection(nextValue as typeof direction)}
                            options={[
                                { value: 'ltr', label: 'Izquierda a derecha' },
                                { value: 'rtl', label: 'Derecha a izquierda' },
                            ]}
                        />
                        <SelectField
                            label="Movimiento"
                            id="badge-motion"
                            value={motion}
                            onValueChange={(nextValue) => setMotion(nextValue as typeof motion)}
                            options={[
                                { value: 'expressive', label: 'Expressive' },
                                { value: 'standard', label: 'Standard' },
                            ]}
                        />
                        <Prose as="label">
                            <input id="badge-visible" type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
                            Visible
                        </Prose>
                    </Prose>
                    <Prose as="div" className="button-stage badge-stage" dir={direction}>
                        <View style={{ flexDirection: 'row', gap: 56, alignItems: 'center' }}>
                            <View style={{ alignItems: 'center', gap: 20 }}>
                                <Badge variant={variant} maximum={maximum} visible={showBadge} testID="example-badge">
                                    {variant === 'dot' ? undefined : content}
                                </Badge>
                                <Text {...{ dataSet: { runtimeText: 'native' } }} variant="labelMedium">
                                    Badge
                                </Text>
                            </View>
                            <View style={{ alignItems: 'center', gap: 12 }}>
                                <IconButton
                                    icon={(props) => (
                                        <BadgedBox badge={showBadge ? badge : undefined} maximum={maximum} testID="example-badged-box">
                                            <MaterialSymbol {...props} name="mail" />
                                        </BadgedBox>
                                    )}
                                    accessibilityLabel={destinationLabel}
                                    onPress={() => setCount((value) => value + 1)}
                                    testID="example-badge-destination"
                                />
                                <Text {...{ dataSet: { runtimeText: 'native' } }} variant="labelMedium">
                                    BadgedBox
                                </Text>
                            </View>
                        </View>
                    </Prose>
                    <Prose as="div" className="example-result" role="status">
                        <Prose as="span">{count} aperturas del destino.</Prose>
                        <Prose as="span">El indicador no añade otro botón.</Prose>
                    </Prose>
                    <Prose as="p">
                        Badge.visible conserva su transición de presencia. BadgedBox aparece o se retira con el dato. Small mide 6 dp; Large
                        conserva al menos 16 dp y crece horizontalmente con la etiqueta.
                    </Prose>
                    <section className="example-code">
                        <Prose as="h2">Código de la configuración</Prose>
                        <pre tabIndex={0}>
                            <code>{code}</code>
                        </pre>
                    </section>
                    <section className="sizes-section">
                        <Prose as="h2">Etiquetas de una a cuatro cifras</Prose>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 24 }}>
                            {[1, 22, 333, 1004].map((value) => (
                                <Badge key={value} variant="large" testID={'badge-label-' + value}>
                                    {value}
                                </Badge>
                            ))}
                        </View>
                        <Prose as="div" className="badge-icon-samples">
                            {[
                                { title: 'Favorite', icon: 'star', badge: 3, max: 999 },
                                { title: 'Recent', icon: 'schedule', badge: 10, max: 999 },
                                { title: 'Contacts', icon: 'person', badge: 120, max: 99 },
                                { title: 'Voicemail', icon: 'voicemail', badge: 1004, max: 999 },
                            ].map((item) => (
                                <View key={item.title} style={{ alignItems: 'center', gap: 16, padding: 12 }}>
                                    <BadgedBox badge={item.badge} maximum={item.max} testID={'badge-figure-' + item.title}>
                                        <Icon source={item.icon} size={24} />
                                    </BadgedBox>
                                    <Text {...{ dataSet: { runtimeText: 'native' } }} variant="labelMedium">
                                        {item.title}
                                    </Text>
                                </View>
                            ))}
                        </Prose>
                    </section>
                    <section className="sizes-section">
                        <Prose as="h2">Las quince configuraciones de Specs</Prose>
                        <Prose as="p">
                            Small, Large y máximo de caracteres en cinco disposiciones. Las figuras conservan el marcador; los usos en
                            acción atienden las novedades.
                        </Prose>
                        {matrix.map((row) => (
                            <article key={row.id} className="component-use">
                                <Prose as="h3">{row.title}</Prose>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 12 }}>
                                    {[true, row.rail ? 3 : 1, 1004].map((value, index) => (
                                        <Specimen key={index} row={row} badge={value} index={index} />
                                    ))}
                                </View>
                            </article>
                        ))}
                    </section>
                    <Contexts />
                    <section className="sizes-section">
                        <Prose as="h2">Etiquetas largas y cantidades truncadas</Prose>
                        <Prose as="p">
                            La etiqueta del destino puede ocupar el espacio disponible; el conteo conserva cuatro caracteres y queda después
                            del grupo.
                        </Prose>
                        {[
                            { label: 'All Files', badge: 1004 },
                            { label: 'Library', badge: '123+' },
                        ].map((item, index) => (
                            <NavigationRail
                                key={item.label}
                                expanded
                                expandedWidth={280}
                                value="sample"
                                onValueChange={() => {}}
                                items={[{ key: 'sample', label: item.label, icon: 'folder', badge: item.badge }]}
                                style={{ paddingTop: 0, paddingBottom: 0 }}
                                testID={'badge-truncated-rail-' + index}
                            />
                        ))}
                    </section>
                    <section className="usage-section">
                        <Prose as="h2">Ejemplos en acción</Prose>
                        <Prose as="div" className="playground-controls">
                            <SelectField
                                label="Composición"
                                id="badge-scenario"
                                value={scenario}
                                onValueChange={(nextValue) => setScenario(nextValue)}
                                options={badgeScenarios.map(([id, title]) => ({ value: id, label: title }))}
                            />
                            <SelectField
                                label="Ancho de ventana"
                                id="badge-width"
                                value={width}
                                onValueChange={(nextValue) => setWidth(Number(nextValue))}
                                options={[320, 390, 600, 960].map((value) => ({ value: value, label: value }))}
                            />
                        </Prose>
                        <ComponentWindow
                            component="badges-window"
                            title="Navegación con Badges"
                            testID="badge-usage"
                            onBack={() => {
                                document.getElementById('badge-scenario')?.focus({ preventScroll: true });
                                document.getElementById('badge-scenario')?.scrollIntoView({ block: 'center' });
                            }}
                            width={width}
                            height={600}
                            configuration={{ scenario, direction, motion }}
                        />
                        <Prose as="p">
                            Seleccionar un destino atiende sus novedades. Los totales de Photos y Favorites permanecen porque representan el
                            contenido de la colección. Abrir un registro y volver conserva el estado.
                        </Prose>
                    </section>
                    <section className="sizes-section">
                        <Prose as="h2">Anclaje y restricciones</Prose>
                        <Prose as="p">
                            El punto y Large se anclan dentro de la esquina superior final del icono. En RTL cambian de lado. Al crecer el
                            conteo se conserva el borde inicial del indicador.
                        </Prose>
                        <View style={{ flexDirection: 'row', gap: 40, padding: 24, justifyContent: 'center' }}>
                            {[true, 1, 1004].map((value, i) => (
                                <BadgedBox key={i} badge={value} testID={'badge-rtl-' + i}>
                                    <Icon source="mail" size={24} />
                                </BadgedBox>
                            ))}
                        </View>
                        <Prose as="p">
                            En acciones de App bar se utiliza Small para evitar colisiones. Si el icono va seguido de texto, la insignia
                            Large se coloca después del grupo. Mantén error/onError y limita la etiqueta a cuatro caracteres, incluido +.
                        </Prose>
                    </section>
                </main>
                <RuntimeBridge />
            </RuntimeTextRoot>
        </MobileDesignProvider>
    );
}
