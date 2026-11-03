// Each example is a complete React Native module, type-checked against the local package.
export const examples = {
  'app-bars': { imports:'TopAppBar', body:`return <TopAppBar
    variant="medium-flexible"
    title="Tu biblioteca"
    navigationIcon="arrow-left"
    navigationLabel="Volver"
    onNavigationPress={() => Alert.alert('Navegación', 'Regresar a la pantalla anterior')}
    actions={[{ key: 'search', icon: 'magnify', label: 'Buscar', onPress: () => Alert.alert('Buscar') }]}
  />;` },
  badges: { imports:'BadgedBox, IconButton', body:`return <BadgedBox badge={8}>
    <IconButton icon="email-outline" accessibilityLabel="Correo, 8 mensajes nuevos"
      onPress={() => Alert.alert('Correo', 'Tienes 8 mensajes nuevos')} />
  </BadgedBox>;` },
  'button-groups': { imports:'ButtonGroup', body:`const [value, setValue] = useState<string | string[]>('week');
  return <ButtonGroup variant="connected" selectionMode="single"
    accessibilityLabel="Intervalo del calendario" value={value} onValueChange={setValue}
    items={[{ value: 'day', label: 'Día' }, { value: 'week', label: 'Semana' }, { value: 'month', label: 'Mes' }]} />;` },
  buttons: { imports:'Button', body:`const [saved, setSaved] = useState(false);
  return <Button variant="filled" size="medium" shape="round"
    selected={saved} icon={saved ? 'check' : 'bookmark-outline'}
    onPress={() => setSaved(value => !value)}>
    {saved ? 'Guardado' : 'Guardar'}
  </Button>;` },
  'extended-fab': { imports:'FAB', body:`return <FAB.Extended icon="pencil-outline" label="Crear nota"
    accessibilityLabel="Crear nota"
    onPress={() => Alert.alert('Nueva nota', 'Aquí comienza la tarea principal')} />;` },
  'fab-menu': { imports:'FAB', body:`const [expanded, setExpanded] = useState(false);
  return <View style={{ minHeight: 280, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
    <FAB.Menu expanded={expanded} onDismiss={() => setExpanded(false)}
      trigger={{ icon: 'plus', accessibilityLabel: 'Crear', onPress: () => setExpanded(true) }}
      items={[
        { key: 'note', label: 'Nota', icon: 'pencil-outline', onPress: () => Alert.alert('Nueva nota') },
        { key: 'folder', label: 'Carpeta', icon: 'folder-outline', onPress: () => Alert.alert('Nueva carpeta') },
      ]} />
  </View>;` },
  'floating-action-button': { imports:'FAB', body:`return <FAB icon="plus" accessibilityLabel="Crear lista"
    onPress={() => Alert.alert('Nueva lista')} />;` },
  'icon-buttons': { imports:'IconButton', body:`const [favorite, setFavorite] = useState(false);
  return <IconButton icon={favorite ? 'heart' : 'heart-outline'}
    accessibilityLabel={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    mode="contained-tonal" selected={favorite}
    onPress={() => setFavorite(value => !value)} />;` },
  'segmented-buttons': { imports:'SegmentedButtons', body:`const [value, setValue] = useState('walk');
  return <SegmentedButtons value={value} onValueChange={setValue}
    buttons={[{ value: 'walk', label: 'A pie', icon: 'walk' },
      { value: 'bike', label: 'Bici', icon: 'bike' },
      { value: 'car', label: 'Auto', icon: 'car-outline' }]} />;` },
  'split-button': { imports:'SplitButton', body:`return <SplitButton label="Enviar" icon="send-outline"
    onPress={() => Alert.alert('Mensaje enviado')}
    menuAccessibilityLabel="Más opciones de envío"
    actions={[
      { key: 'later', label: 'Programar envío', icon: 'clock-outline', onPress: () => Alert.alert('Programar envío') },
      { key: 'draft', label: 'Guardar borrador', icon: 'content-save-outline', onPress: () => Alert.alert('Borrador guardado') },
    ]} />;` },
  cards: { imports:'Card, Text, Button', body:`return <Card variant="filled">
    <Card.Title title="En buena compañía" subtitle="Una colección para descubrir" />
    <Card.Content><Text variant="bodyMedium">Contenido y acciones de una misma idea.</Text></Card.Content>
    <Card.Actions><Button variant="text" onPress={() => Alert.alert('Colección abierta')}>Explorar</Button></Card.Actions>
  </Card>;` },
  carousel: { imports:'Carousel', body:`return <Carousel variant="multi-browse" height={240}
    accessibilityLabel="Destinos para explorar"
    items={[{ id: 'mountain', title: 'Montaña', icon: 'image-outline' },
      { id: 'coast', title: 'Costa', icon: 'image-outline' },
      { id: 'forest', title: 'Bosque', icon: 'image-outline' }]}
    onItemPress={item => Alert.alert(item.title)} />;` },
  checkbox: { imports:'Checkbox', body:`const [checked, setChecked] = useState(false);
  return <Checkbox.Item label="Descargar con Wi-Fi"
    status={checked ? 'checked' : 'unchecked'}
    onPress={() => setChecked(value => !value)} />;` },
  chips: { imports:'Chip', body:`const [selected, setSelected] = useState(false);
  return <Chip variant="filter" selected={selected}
    onPress={() => setSelected(value => !value)}>Descargadas</Chip>;` },
  'date-pickers': { imports:'Button, DatePicker', body:`const [visible, setVisible] = useState(false);
  const [date, setDate] = useState(new Date(2026, 10, 3));
  return <>
    <Button onPress={() => setVisible(true)}>Elegir fecha</Button>
    <DatePicker mode="single" visible={visible} value={date} locale="es-MX"
      onDismiss={() => setVisible(false)}
      onChange={next => { setDate(next); setVisible(false); }} />
  </>;` },
  'time-pickers': { imports:'Button, TimePicker', body:`const [visible, setVisible] = useState(false);
  const [time, setTime] = useState({ hours: 15, minutes: 45 });
  return <>
    <Button onPress={() => setVisible(true)}>Elegir hora</Button>
    <TimePicker visible={visible} value={time} is24Hour={false}
      onDismiss={() => setVisible(false)}
      onConfirm={next => { setTime(next); setVisible(false); }} />
  </>;` },
  dialogs: { imports:'Button, Dialog, Text', body:`const [visible, setVisible] = useState(false);
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
  </>;` },
  divider: { imports:'Divider, Text', body:`return <View style={{ gap: 16 }}>
    <Text variant="titleMedium">Tu biblioteca</Text>
    <Divider />
    <Text variant="bodyMedium">Colecciones guardadas</Text>
  </View>;` },
  lists: { imports:'List, IconButton', body:`return <List.Item title="Long Walk" description="L. R. Coleman" lines={2}
    onPress={() => Alert.alert('Detalle de la canción')}
    trailing={<IconButton icon="play-outline" accessibilityLabel="Reproducir Long Walk"
      onPress={() => Alert.alert('Reproduciendo Long Walk')} />} />;` },
  'loading-indicator': { imports:'LoadingIndicator', body:`return <LoadingIndicator variant="contained" size={48}
    accessibilityLabel="Cargando tu biblioteca" />;` },
  'progress-indicators': { imports:'ProgressIndicator, Text, Button', body:`const [progress, setProgress] = useState(0.4);
  return <View style={{ gap: 24 }}>
    <Text>Descarga: {Math.round(progress * 100)} %</Text>
    <ProgressIndicator variant="linear" appearance="wavy" progress={progress}
      accessibilityLabel="Descarga de la colección" />
    <Button variant="tonal" onPress={() => setProgress(value => Math.min(1, value + 0.2))}>Avanzar demostración</Button>
  </View>;` },
  menus: { imports:'Menu, Button', body:`const [visible, setVisible] = useState(false);
  return <Menu visible={visible} onDismiss={() => setVisible(false)}
    anchor={<Button variant="tonal" onPress={() => setVisible(true)}>Opciones</Button>}>
    <Menu.Item title="Guardar" leadingIcon="bookmark-outline"
      onPress={() => Alert.alert('Guardado')} />
    <Menu.Item title="Compartir" leadingIcon="share-variant-outline"
      onPress={() => Alert.alert('Compartir')} />
  </Menu>;` },
  'navigation-bar': { imports:'NavigationBar', body:`const [value, setValue] = useState('home');
  return <NavigationBar value={value} onValueChange={setValue}
    items={[{ key: 'home', label: 'Inicio', icon: 'home-outline', selectedIcon: 'home' },
      { key: 'library', label: 'Biblioteca', icon: 'music-box-outline', badge: 3 },
      { key: 'saved', label: 'Guardado', icon: 'bookmark-outline' }]} />;` },
  'navigation-drawer': { imports:'NavigationDrawer', body:`const [value, setValue] = useState('inbox');
  return <NavigationDrawer value={value} onValueChange={setValue}
    items={[{ key: 'inbox', label: 'Recibidos', icon: 'inbox-outline', badge: 8 },
      { key: 'sent', label: 'Enviados', icon: 'send-outline' },
      { key: 'saved', label: 'Guardados', icon: 'bookmark-outline' }]} />;` },
  'navigation-rail': { imports:'NavigationRail', body:`const [value, setValue] = useState('home');
  return <NavigationRail expanded value={value} onValueChange={setValue}
    items={[{ key: 'home', label: 'Inicio', icon: 'home-outline' },
      { key: 'search', label: 'Explorar', icon: 'compass-outline' },
      { key: 'saved', label: 'Guardado', icon: 'bookmark-outline' }]} />;` },
  'radio-button': { imports:'RadioButton', body:`const [value, setValue] = useState('standard');
  return <RadioButton.Group value={value} onValueChange={setValue}>
    <RadioButton.Item value="standard" label="Calidad estándar" />
    <RadioButton.Item value="high" label="Calidad alta" />
  </RadioButton.Group>;` },
  search: { imports:'Searchbar', body:`const [query, setQuery] = useState('');
  return <Searchbar placeholder="Buscar música" value={query}
    onChangeText={setQuery} accessibilityLabel="Buscar música" />;` },
  'bottom-sheets': { imports:'BottomSheet, BottomSheetScrollView, Text, Button', body:`const [open, setOpen] = useState(false);
  return <>
    <Button onPress={() => setOpen(true)}>Ver detalles</Button>
    <BottomSheet open={open} onOpenChange={setOpen} variant="modal"
      snapPoints={['50%', '85%']} accessibilityLabel="Detalles de la colección">
      <BottomSheetScrollView contentContainerStyle={{ padding: 24 }}>
        <Text variant="headlineSmall">Tu colección</Text>
        <Text>Información adicional de la colección guardada.</Text>
        <Button variant="text" onPress={() => setOpen(false)}>Cerrar</Button>
      </BottomSheetScrollView>
    </BottomSheet>
  </>;` },
  'side-sheets': { imports:'SideSheet, Button, Text', body:`const [open, setOpen] = useState(false);
  return <>
    <Button onPress={() => setOpen(true)}>Ver información</Button>
    <SideSheet open={open} onOpenChange={setOpen} variant="modal" title="Información">
      <Text>Contenido complementario de esta pantalla.</Text>
    </SideSheet>
  </>;` },
  sliders: { imports:'Slider', body:`const [value, setValue] = useState(40);
  return <Slider value={value} onValueChange={setValue}
    minimumValue={0} maximumValue={100} step={5}
    accessibilityLabel="Volumen" valueSuffix="%" />;` },
  snackbar: { imports:'Snackbar, Button', body:`const [visible, setVisible] = useState(false);
  return <>
    <Button onPress={() => setVisible(true)}>Guardar colección</Button>
    <Snackbar visible={visible} onDismiss={() => setVisible(false)}
      action={{ label: 'Deshacer', onPress: () => { setVisible(false); Alert.alert('Acción deshecha'); } }}>
      Colección guardada
    </Snackbar>
  </>;` },
  switch: { imports:'Switch', body:`const [enabled, setEnabled] = useState(true);
  return <Switch value={enabled} onValueChange={setEnabled}
    accessibilityLabel="Descargar sólo con Wi-Fi" />;` },
  tabs: { imports:'Tabs, TabsPager, Text', reanimated:true, body:`const [value, setValue] = useState('music');
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
  </View>;` },
  'text-fields': { imports:'TextField', body:`const [name, setName] = useState('');
  return <TextField variant="outlined" label="Nombre de la colección"
    value={name} onChangeText={setName} counter={40} maxLength={40}
    supportingText="Elige un nombre fácil de reconocer" />;` },
  toolbars: { imports:'Toolbar', body:`return <Toolbar variant="floating" accessibilityLabel="Editar colección"
    actions={[{ key: 'edit', icon: 'pencil-outline', label: 'Editar', onPress: () => Alert.alert('Editar') },
      { key: 'share', icon: 'share-variant-outline', label: 'Compartir', onPress: () => Alert.alert('Compartir') },
      { key: 'delete', icon: 'delete-outline', label: 'Eliminar', onPress: () => Alert.alert('Eliminar') }]} />;` },
  tooltips: { imports:'RichTooltip, Button, Text', body:`const [visible, setVisible] = useState(false);
  return <RichTooltip visible={visible} onDismiss={() => setVisible(false)}
    title="Escucha sin conexión"
    anchor={<Button variant="tonal" onPress={() => setVisible(true)}>Más información</Button>}
    actions={[{ key: 'done', label: 'Entendido', onPress: () => setVisible(false) }]}>
    <Text>Guarda tus colecciones para escucharlas cuando no tengas conexión.</Text>
  </RichTooltip>;` },
};

export function exampleModule(example) {
  const native = ['View','Alert'].filter(name => new RegExp(`\\b${name}\\b`).test(example.body));
  const hooks=example.hooks??(example.body.includes('useState')?['useState']:[]);
  return `${hooks.length ? `import { ${hooks.join(', ')} } from 'react';\n` : ''}${native.length ? `import { ${native.join(', ')} } from 'react-native';\n` : ''}${example.reanimated ? "import { useSharedValue } from 'react-native-reanimated';\n" : ''}import { ${example.imports} } from 'mobile-design';\n\n// Renderizar dentro de MobileDesignProvider. Las hojas necesitan GestureHandlerRootView.\nexport default function Example() {\n  ${example.body}\n}\n`;
}
