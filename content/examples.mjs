// Each example is a complete React Native module, type-checked against the local package.
export const examples = {
    select: {
        imports: 'Select',
        body: `const [quality, setQuality] = useState('standard');
  return <Select label="Calidad de audio" value={quality} onValueChange={setQuality}
    options={[
      { value: 'standard', label: 'Estándar' },
      { value: 'high', label: 'Alta calidad' },
      { value: 'lossless', label: 'Sin pérdida', disabled: true },
    ]} />;`,
    },
    autocomplete: {
        imports: 'Autocomplete',
        body: `const [query, setQuery] = useState('');
  return <Autocomplete label="Ciudad" value={query} onValueChange={setQuery}
    leadingIcon="search"
    options={[
      { value: 'mty', label: 'Monterrey', description: 'Nuevo León' },
      { value: 'mid', label: 'Mérida', description: 'Yucatán' },
      { value: 'qro', label: 'Querétaro', description: 'Querétaro' },
    ]} />;`,
    },
    'app-bars': {
        imports: 'TopAppBar',
        body: `return <TopAppBar
    variant="medium-flexible"
    title="Tu biblioteca"
    navigationIcon="arrow_back"
    navigationLabel="Volver"
    onNavigationPress={() => Alert.alert('Navegación', 'Regresar a la pantalla anterior')}
    actions={[{ key: 'search', icon: 'search', label: 'Buscar', onPress: () => Alert.alert('Buscar') }]}
  />;`,
    },
    badges: {
        imports: 'BadgedBox, IconButton, MaterialSymbol',
        body: `return <IconButton
    icon={props => <BadgedBox badge={8}>
      <MaterialSymbol {...props} name="mail" />
    </BadgedBox>}
    accessibilityLabel="Correo, 8 mensajes nuevos"
    onPress={() => Alert.alert('Correo', 'Tienes 8 mensajes nuevos')} />;`,
    },
    'button-groups': {
        imports: 'ButtonGroup',
        body: `const [value, setValue] = useState<string | string[]>('week');
  return <ButtonGroup variant="connected" selectionMode="single"
    accessibilityLabel="Intervalo del calendario" value={value} onValueChange={setValue}
    items={[{ value: 'day', label: 'Día' }, { value: 'week', label: 'Semana' }, { value: 'month', label: 'Mes' }]} />;`,
    },
    buttons: {
        imports: 'Button, MaterialSymbol',
        body: `const [saved, setSaved] = useState(false);
  return <Button variant="filled" size="medium" shape="round"
    selected={saved} icon={props => <MaterialSymbol {...props} name="bookmark" filled={saved} />}
    onPress={() => setSaved(value => !value)}>
    {saved ? 'Guardado' : 'Guardar'}
  </Button>;`,
    },
    'extended-fab': {
        imports: 'FAB',
        body: `return <FAB.Extended size="medium" icon="pencil-outline" label="Crear nota"
    accessibilityLabel="Crear nota"
    onPress={() => Alert.alert('Nueva nota', 'Aquí comienza la tarea principal')} />;`,
    },
    'fab-menu': {
        imports: 'FAB',
        body: `const [expanded, setExpanded] = useState(false);
  return <View style={{ minHeight: 280, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
    <FAB.Menu presentation="expressive" expanded={expanded} onDismiss={() => setExpanded(false)}
      trigger={{ icon: 'plus', size: 'medium', accessibilityLabel: 'Crear', onPress: () => setExpanded(true) }}
      items={[
        { key: 'note', label: 'Nota', icon: 'pencil-outline', onPress: () => Alert.alert('Nueva nota') },
        { key: 'folder', label: 'Carpeta', icon: 'folder-outline', onPress: () => Alert.alert('Nueva carpeta') },
      ]} />
  </View>;`,
    },
    'floating-action-button': {
        imports: 'FAB, MaterialSymbol, Tooltip',
        body: `return <Tooltip title="Crear lista">
    <FAB size="medium" variant="tonalPrimary"
      icon={(props: { size: number; color: string }) => <MaterialSymbol {...props} name="add" filled />}
      accessibilityLabel="Crear lista"
      onPress={() => Alert.alert('Nueva lista')} />
  </Tooltip>;`,
    },
    'icon-buttons': {
        imports: 'IconButton, MaterialSymbol, Tooltip',
        body: `const [favorite, setFavorite] = useState(false);
  const label = favorite ? 'Quitar de favoritos' : 'Añadir a favoritos';
  return <Tooltip title={label}>
    <IconButton icon={props => <MaterialSymbol {...props} name="favorite" filled={favorite} />}
      accessibilityLabel="Favorito" mode="contained-tonal" selected={favorite}
      sizeClass="small" shape="round" widthVariant="default"
      onPress={() => setFavorite(value => !value)} />
  </Tooltip>;`,
    },
    'segmented-buttons': {
        imports: 'SegmentedButtons',
        body: `const [value, setValue] = useState('walk');
  return <SegmentedButtons value={value} onValueChange={setValue}
    buttons={[{ value: 'walk', label: 'A pie', icon: 'walk' },
      { value: 'bike', label: 'Bici', icon: 'bike' },
      { value: 'car', label: 'Auto', icon: 'car-outline' }]} />;`,
    },
    'split-button': {
        imports: 'SplitButton, MaterialSymbol',
        body: `return <SplitButton label="Enviar"
    icon={(props: { size: number; color: string }) => <MaterialSymbol {...props} name="send" filled />}
    onPress={() => Alert.alert('Mensaje enviado')}
    menuAccessibilityLabel="Más opciones de envío"
    actions={[
      { key: 'later', label: 'Programar envío', icon: 'clock-outline', onPress: () => Alert.alert('Programar envío') },
      { key: 'draft', label: 'Guardar borrador', icon: 'content-save-outline', onPress: () => Alert.alert('Borrador guardado') },
    ]} />;`,
    },
    cards: {
        imports: 'Card, Text, Button',
        body: `return <Card variant="filled">
    <Card.Title title="En buena compañía" subtitle="Una colección para descubrir" />
    <Card.Content><Text variant="bodyMedium">Contenido y acciones de una misma idea.</Text></Card.Content>
    <Card.Actions><Button variant="text" onPress={() => Alert.alert('Colección abierta')}>Explorar</Button></Card.Actions>
  </Card>;`,
    },
    carousel: {
        imports: 'Carousel',
        body: `return <Carousel variant="multi-browse" height={240}
    accessibilityLabel="Destinos para explorar"
    items={[{ id: 'mountain', title: 'Montaña', icon: 'image-outline' },
      { id: 'coast', title: 'Costa', icon: 'image-outline' },
      { id: 'forest', title: 'Bosque', icon: 'image-outline' }]}
    onItemPress={item => Alert.alert(item.title)} />;`,
    },
    checkbox: {
        imports: 'Checkbox',
        body: `const [checked, setChecked] = useState(false);
  return <Checkbox.Item label="Descargar con Wi-Fi"
    status={checked ? 'checked' : 'unchecked'}
    onPress={() => setChecked(value => !value)} />;`,
    },
    chips: {
        imports: 'Chip',
        body: `const [selected, setSelected] = useState(false);
  return <Chip variant="filter" selected={selected}
    onPress={() => setSelected(value => !value)}>Descargadas</Chip>;`,
    },
    'date-pickers': {
        imports: 'Button, DatePicker',
        body: `const [visible, setVisible] = useState(false);
  const [date, setDate] = useState(new Date(2026, 10, 3));
  return <>
    <Button onPress={() => setVisible(true)}>Elegir fecha</Button>
    <DatePicker mode="single" visible={visible} value={date} locale="es-MX"
      onDismiss={() => setVisible(false)}
      onChange={next => { setDate(next); setVisible(false); }} />
  </>;`,
    },
    'time-pickers': {
        imports: 'Button, TimePicker',
        body: `const [visible, setVisible] = useState(false);
  const [time, setTime] = useState({ hours: 15, minutes: 45 });
  return <>
    <Button onPress={() => setVisible(true)}>Elegir hora</Button>
    <TimePicker visible={visible} value={time} is24Hour={false}
      onDismiss={() => setVisible(false)}
      onConfirm={next => { setTime(next); setVisible(false); }} />
  </>;`,
    },
    dialogs: {
        imports: 'Button, Dialog, Text',
        body: `const [visible, setVisible] = useState(false);
  return <>
    <Button onPress={() => setVisible(true)}>Eliminar descarga</Button>
    <Dialog visible={visible} onDismiss={() => setVisible(false)}>
      <Dialog.Title>¿Eliminar descarga?</Dialog.Title>
      <Dialog.Content><Text>Podrás descargarla de nuevo cuando quieras.</Text></Dialog.Content>
      <Dialog.Actions>
        <Button variant="text" onPress={() => setVisible(false)}>Cancelar</Button>
        <Button variant="text" onPress={() => { setVisible(false); Alert.alert('Descarga eliminada'); }}>Eliminar</Button>
      </Dialog.Actions>
    </Dialog>
  </>;`,
    },
    divider: {
        imports: 'Divider, Text',
        body: `return <View style={{ gap: 16 }}>
    <Text variant="titleMedium">Tu biblioteca</Text>
    <Divider />
    <Text variant="bodyMedium">Colecciones guardadas</Text>
  </View>;`,
    },
    lists: {
        imports: 'List, IconButton',
        body: `return <List.Item title="Long Walk" description="L. R. Coleman" lines={2}
    onPress={() => Alert.alert('Detalle de la canción')}
    trailing={<IconButton icon="play-outline" accessibilityLabel="Reproducir Long Walk"
      onPress={() => Alert.alert('Reproduciendo Long Walk')} />} />;`,
    },
    'loading-indicator': {
        imports: 'LoadingIndicator',
        body: `return <LoadingIndicator variant="contained" size={48}
    accessibilityLabel="Cargando tu biblioteca" />;`,
    },
    'progress-indicators': {
        imports: 'ProgressIndicator, Text, Button',
        body: `const [progress, setProgress] = useState(0.4);
  return <View style={{ gap: 24 }}>
    <Text>Descarga: {Math.round(progress * 100)} %</Text>
    <ProgressIndicator variant="linear" appearance="wavy" progress={progress}
      accessibilityLabel="Descarga de la colección" />
    <Button variant="tonal" onPress={() => setProgress(value => Math.min(1, value + 0.2))}>Avanzar demostración</Button>
  </View>;`,
    },
    menus: {
        imports: 'Menu, Button',
        body: `const [visible, setVisible] = useState(false);
  return <Menu visible={visible} onDismiss={() => setVisible(false)}
    anchor={<Button variant="tonal" onPress={() => setVisible(true)}>Opciones</Button>}>
    <Menu.Item title="Guardar" leadingIcon="bookmark-outline"
      onPress={() => Alert.alert('Guardado')} />
    <Menu.Item title="Compartir" leadingIcon="share-variant-outline"
      onPress={() => Alert.alert('Compartir')} />
  </Menu>;`,
    },
    'navigation-bar': {
        imports: 'NavigationBar',
        body: `const [value, setValue] = useState('home');
  return <NavigationBar value={value} onValueChange={setValue}
    items={[{ key: 'home', label: 'Inicio', icon: 'home-outline', selectedIcon: 'home' },
      { key: 'library', label: 'Biblioteca', icon: 'music-box-outline', badge: 3 },
      { key: 'saved', label: 'Guardado', icon: 'bookmark-outline' }]} />;`,
    },
    'navigation-drawer': {
        imports: 'NavigationDrawer',
        body: `const [value, setValue] = useState('inbox');
  return <NavigationDrawer value={value} onValueChange={setValue}
    items={[{ key: 'inbox', label: 'Recibidos', icon: 'inbox-outline', badge: 8 },
      { key: 'sent', label: 'Enviados', icon: 'send-outline' },
      { key: 'saved', label: 'Guardados', icon: 'bookmark-outline' }]} />;`,
    },
    'navigation-rail': {
        imports: 'NavigationRail',
        body: `const [value, setValue] = useState('home');
  return <NavigationRail expanded value={value} onValueChange={setValue}
    items={[{ key: 'home', label: 'Inicio', icon: 'home-outline' },
      { key: 'search', label: 'Explorar', icon: 'compass-outline' },
      { key: 'saved', label: 'Guardado', icon: 'bookmark-outline' }]} />;`,
    },
    'radio-button': {
        imports: 'RadioButton',
        body: `const [value, setValue] = useState('standard');
  return <RadioButton.Group value={value} onValueChange={setValue}>
    <RadioButton.Item value="standard" label="Calidad estándar" />
    <RadioButton.Item value="high" label="Calidad alta" />
  </RadioButton.Group>;`,
    },
    search: {
        imports: 'Searchbar',
        body: `const [query, setQuery] = useState('');
  return <Searchbar placeholder="Buscar música" value={query}
    onChangeText={setQuery} accessibilityLabel="Buscar música" />;`,
    },
    'bottom-sheets': {
        imports: 'BottomSheet, BottomSheetScrollView, Text, Button',
        body: `const [open, setOpen] = useState(false);
  return <>
    <Button onPress={() => setOpen(true)}>Ver detalles</Button>
    <BottomSheet open={open} onOpenChange={setOpen} variant="modal"
      scrollable snapPoints={['50%', '85%']} accessibilityLabel="Detalles de la colección">
      <BottomSheetScrollView contentContainerStyle={{ padding: 24 }}>
        <Text variant="headlineSmall">Tu colección</Text>
        <Text>Información adicional de la colección guardada.</Text>
        <Button variant="text" onPress={() => setOpen(false)}>Cerrar</Button>
      </BottomSheetScrollView>
    </BottomSheet>
  </>;`,
    },
    'side-sheets': {
        imports: 'SideSheet, Button, Text',
        body: `const [open, setOpen] = useState(false);
  return <>
    <Button onPress={() => setOpen(true)}>Ver información</Button>
    <SideSheet open={open} onOpenChange={setOpen} variant="modal" title="Información">
      <Text>Contenido complementario de esta pantalla.</Text>
    </SideSheet>
  </>;`,
    },
    sliders: {
        imports: 'Slider',
        body: `const [value, setValue] = useState(40);
  return <Slider value={value} onValueChange={setValue}
    minimumValue={0} maximumValue={100} step={5}
    accessibilityLabel="Volumen" valueSuffix="%" />;`,
    },
    snackbar: {
        imports: 'Snackbar, Portal, Button, Text',
        body: `const [visible, setVisible] = useState(false);
  const [archived, setArchived] = useState(false);
  return <View style={{ gap: 16 }}>
    <Text accessibilityLiveRegion="polite">{archived ? 'Colección archivada' : 'Colección disponible'}</Text>
    <Button onPress={() => { setArchived(true); setVisible(true); }}>Archivar colección</Button>
    <Portal><Snackbar visible={visible} onDismiss={() => setVisible(false)} inlineFeedback
      action={{ label: 'Deshacer', onPress: () => { setArchived(false); setVisible(false); } }}>
      Colección archivada
    </Snackbar></Portal>
  </View>;`,
    },
    switch: {
        imports: 'Switch',
        body: `const [enabled, setEnabled] = useState(true);
  return <Switch value={enabled} onValueChange={setEnabled}
    accessibilityLabel="Descargar sólo con Wi-Fi" />;`,
    },
    tabs: {
        imports: 'Tabs, TabsPager, Text',
        reanimated: true,
        body: `const [value, setValue] = useState('music');
  const [request, setRequest] = useState(0);
  const position = useSharedValue(0);
  const items = [{ key: 'music', label: 'Música', icon: 'music-note-outline' },
    { key: 'podcasts', label: 'Podcasts', icon: 'podcast' }];
  return <View style={{ flex: 1 }}>
    <Tabs items={items} value={value} onValueChange={setValue} position={position}
      onTabPress={() => setRequest(value => value + 1)} />
    <TabsPager items={items} value={value} onValueChange={setValue}
      position={position} selectionRequest={request}
      renderPage={item => <View style={{ padding: 24 }}><Text>{item.label}</Text></View>} />
  </View>;`,
    },
    'text-fields': {
        imports: 'TextField',
        body: `const [name, setName] = useState('');
  return <TextField variant="outlined" label="Nombre de la colección"
    value={name} onChangeText={setName} counter={40} maxLength={40}
    supportingText="Elige un nombre fácil de reconocer" />;`,
    },
    toolbars: {
        imports: 'Toolbar, TextField, Text',
        body: `const [title, setTitle] = useState('Mi colección');
  const [saved, setSaved] = useState('Mi colección');
  const [deleted, setDeleted] = useState(false);
  return <View style={{ gap: 24 }}>
    <TextField label="Nombre" value={title} onChangeText={setTitle} disabled={deleted} />
    <Text accessibilityLiveRegion="polite">{deleted ? 'Colección eliminada' : 'Guardado: ' + saved}</Text>
    <Toolbar variant="floating" accessibilityLabel="Editar colección"
      actions={[{ key: 'save', icon: 'save', label: 'Guardar', disabled: deleted || title === saved, onPress: () => setSaved(title) },
        { key: 'undo', icon: 'undo', label: 'Restaurar', onPress: () => { setDeleted(false); setTitle(saved); } },
        { key: 'delete', icon: 'delete', label: 'Eliminar', disabled: deleted, onPress: () => setDeleted(true) }]} />
  </View>;`,
    },
    tooltips: {
        imports: 'RichTooltip, Button, Text',
        body: `const [visible, setVisible] = useState(false);
  return <RichTooltip visible={visible} onDismiss={() => setVisible(false)}
    title="Escucha sin conexión"
    anchor={<Button variant="tonal" onPress={() => setVisible(true)}>Más información</Button>}
    actions={[{ key: 'done', label: 'Entendido', onPress: () => setVisible(false) }]}>
    <Text>Guarda tus colecciones para escucharlas cuando no tengas conexión.</Text>
  </RichTooltip>;`,
    },
};

export function exampleModule(example) {
    let body = example.body;
    const imports = example.imports.split(',').map((value) => value.trim());
    const hooks = new Set(example.hooks ?? (body.includes('useState') ? ['useState'] : []));
    // Action outcomes remain visible in the self-contained example on every renderer.
    if (body.includes('Alert.alert(')) {
        body = body.replace(/Alert\.alert\(([^)]*)\)/g, (_, args) => `setFeedback([${args}].join(': '))`);
        body =
            `const [feedback, setFeedback] = useState('');\n  ` +
            body.replace(
                /return\s+([\s\S]*);$/,
                (_, content) =>
                    `return <View style={{ gap: 16 }}>${content}<Text accessibilityLiveRegion="polite">{feedback}</Text></View>;`
            );
        hooks.add('useState');
        if (!imports.includes('Text')) imports.push('Text');
    }
    const native = ['View', 'ScrollView'].filter((name) => new RegExp(`\\b${name}\\b`).test(body));
    return `${hooks.size ? `import { ${[...hooks].join(', ')} } from 'react';\n` : ''}${native.length ? `import { ${native.join(', ')} } from 'react-native';\n` : ''}${example.reanimated ? "import Animated, { useSharedValue } from 'react-native-reanimated';\n" : ''}import { ${imports.join(', ')} } from 'mobile-design/react-native';\n\n// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.\nexport default function Example() {\n  ${body}\n}\n`;
}
