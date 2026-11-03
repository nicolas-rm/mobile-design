export const recipes={
  'segmented-buttons':[{id:'segmented-price-filter',title:'Filtro de precio con selección múltiple',description:'El array puede contener todas, algunas o ninguna de las opciones. La lista refleja la selección controlada.',imports:'SegmentedButtons, Text',body:`const [prices, setPrices] = useState<string[]>(['2']);
  const places = [{ id: 'cafe', name: 'Café del centro', price: '1' },
    { id: 'casa', name: 'Casa verde', price: '2' }, { id: 'terraza', name: 'La terraza', price: '3' }];
  return <View style={{ padding: 24, gap: 16 }}>
    <SegmentedButtons multiSelect value={prices} onValueChange={setPrices}
      accessibilityLabel="Precio por persona"
      buttons={[1, 2, 3, 4].map(price => ({ value: String(price), label: '$'.repeat(price),
        accessibilityLabel: ['Económico', 'Moderado', 'Alto', 'Muy alto'][price - 1] }))} />
    {places.filter(place => prices.includes(place.price)).map(place => <Text key={place.id}>{place.name}</Text>)}
    {!places.some(place => prices.includes(place.price)) ? <Text>Sin coincidencias.</Text> : null}
  </View>;`}],
  'split-button':[{id:'split-message-actions',title:'Comando principal y alternativas de un mensaje',description:'Enviar, guardar borrador y descartar tienen resultados locales distintos. La alternativa se entrega después del cierre del menú.',imports:'SplitButton, TextField, Text',body:`const [message, setMessage] = useState('Nos vemos mañana.');
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState('');
  return <View style={{ padding: 24, gap: 20 }}>
    <TextField label="Mensaje" value={message} onChangeText={setMessage} />
    <SplitButton label="Enviar" icon="send" disabled={!message.trim()}
      onPress={() => { setResult('Mensaje enviado: ' + message); setMessage(''); }}
      menuAccessibilityLabel="Más opciones de envío" actions={[
        { key: 'draft', label: 'Guardar borrador', icon: 'draft',
          onPress: () => { setDraft(message); setResult('Borrador guardado.'); } },
        { key: 'discard', label: 'Descartar mensaje', icon: 'delete',
          onPress: () => { setMessage(''); setResult('Mensaje descartado.'); } },
      ]} />
    <Text accessibilityLiveRegion="polite">{result}</Text>
    {draft ? <Text>Borrador: {draft}</Text> : null}
  </View>;`}],
  cards:[{id:'cards-collection-actions',title:'Colección con guardado, archivo y deshacer',description:'Las tarjetas son contenedores informativos. Sus controles son independientes y el menú actualiza los datos de la colección.',imports:'Card, Menu, IconButton, Button, Text',body:`const [items, setItems] = useState([{ id: 'bread', title: 'Pan de masa madre', saved: false },
    { id: 'bao', title: 'Bao al vapor', saved: true }]);
  const [menu, setMenu] = useState<string | null>(null);
  const [removed, setRemoved] = useState<(typeof items)[number] | null>(null);
  return <View style={{ padding: 24, gap: 8 }}>
    {items.map(item => <Card key={item.id} variant="filled">
      <Card.Title title={item.title} subtitle={item.saved ? 'Guardada' : 'Receta'} right={() =>
        <Menu visible={menu === item.id} onDismiss={() => setMenu(null)}
          anchor={<IconButton icon="more_vert" accessibilityLabel={'Opciones de ' + item.title}
            onPress={() => setMenu(item.id)} />}>
          <Menu.Item title="Archivar" leadingIcon="archive" onPress={() => {
            setRemoved(item); setItems(value => value.filter(row => row.id !== item.id));
          }} />
        </Menu>} />
      <Card.Content><Text variant="bodyMedium">Una idea para volver a disfrutar.</Text></Card.Content>
      <Card.Actions><Button variant="text" onPress={() => setItems(value => value.map(row =>
        row.id === item.id ? { ...row, saved: !row.saved } : row))}>
        {item.saved ? 'Quitar de guardadas' : 'Guardar'}
      </Button></Card.Actions>
    </Card>)}
    {removed ? <Button variant="text" onPress={() => {
      setItems(value => value.some(item => item.id === removed.id) ? value : [...value, removed]); setRemoved(null);
    }}>Deshacer archivo</Button> : null}
  </View>;`}],
  'extended-fab':[{id:'extended-fab-scroll',title:'Contraer al desplazarse y crear una nota',description:'La pantalla controla expanded según la dirección del desplazamiento y abre una tarea completa. El FAB conserva su etiqueta accesible al contraerse.',hooks:['useState','useRef'],imports:'FAB, Button, Text, TextField',body:`const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState(Array.from({ length: 12 }, (_, i) => 'Nota ' + (i + 1)));
  const lastY = useRef(0);
  if (editing) return <View style={{ padding: 24, gap: 24 }}>
    <Text variant="headlineSmall">Nueva nota</Text>
    <TextField label="Título" value={title} onChangeText={setTitle} />
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
      <Button variant="text" onPress={() => setEditing(false)}>Cancelar</Button>
      <Button disabled={!title.trim()} onPress={() => {
        setNotes(items => [title.trim(), ...items]); setTitle(''); setEditing(false);
        lastY.current = 0; setExpanded(true);
      }}>Crear</Button>
    </View>
  </View>;
  return <View style={{ flex: 1, minHeight: 400 }}>
    <ScrollView scrollEventThrottle={16} contentContainerStyle={{ padding: 24, paddingBottom: 112 }}
      onScroll={event => {
        const y = Math.max(0, event.nativeEvent.contentOffset.y);
        if (Math.abs(y - lastY.current) > 3 || y === 0) {
          setExpanded(y === 0 || y < lastY.current); lastY.current = y;
        }
      }}>
      {notes.map((note, index) => <Text key={index} variant="bodyLarge" style={{ paddingVertical: 24 }}>{note}</Text>)}
    </ScrollView>
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, bottom: 16 }}>
      <FAB.Extended icon="pencil-outline" label="Crear nota" expanded={expanded}
        onPress={() => { setTitle(''); setEditing(true); }} />
    </View>
  </View>;`}],
  search:[{id:'search-view',title:'Barra y vista de búsqueda conectadas',description:'SearchView conserva su entrada, consulta, resultados y cierre dentro de la misma composición.',imports:'SearchView',body:`const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const songs = [{ key: 'long-walk', title: 'Long Walk', description: 'L. R. Coleman' },
    { key: 'in-the-dark', title: 'In the Dark', description: 'Sole R. Rey' }];
  const results = songs.filter(song => song.title.toLowerCase().includes(query.toLowerCase()));
  return <SearchView open={open} onOpenChange={setOpen}
    value={query} onChangeText={setQuery} onSearch={setQuery}
    placeholder="Buscar música" results={results}
    onResultPress={song => Alert.alert('Canción seleccionada', song.title)} />;`}],
  'progress-indicators':[{id:'progress-success',title:'Progreso y resultado success',description:'Composición nativa de una tarea local simulada. El indicador conserva su centro al mostrar el resultado.',hooks:['useState','useEffect'],imports:'CircularProgressStatus, Button, Text',body:`const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (progress >= 1) { setActive(false); return; }
    const timer = setTimeout(() => setProgress(value => Math.min(1, value + 0.2)), 400);
    return () => clearTimeout(timer);
  }, [active, progress]);
  return <View style={{ gap: 24, alignItems: 'center' }}>
    <CircularProgressStatus status={progress >= 1 ? 'success' : 'progress'} progress={progress}
      progressLabel="Preparando descarga" successLabel="Descarga completa" />
    <Text>{Math.round(progress * 100)} %</Text>
    <Button disabled={active} onPress={() => { setProgress(0); setActive(true); }}>
      {progress >= 1 ? 'Repetir ejemplo' : 'Iniciar ejemplo'}
    </Button>
  </View>;`}],
  chips:[{id:'input-chips',title:'Entradas con cierre independiente',description:'La región primaria elige una entrada; la X la retira sin compartir esa acción.',imports:'Chip, Text',body:`const [people, setPeople] = useState([{ id: 'ana', label: 'Ana' }, { id: 'luis', label: 'Luis' }]);
  const [selected, setSelected] = useState<string | null>(null);
  return <View style={{ gap: 16 }}>
    <Chip.Group accessibilityLabel="Destinatarios">
      {people.map(person => <Chip key={person.id} variant="input"
        onPress={() => setSelected(person.id)} closeIconAccessibilityLabel={'Quitar ' + person.label}
        onClose={() => { setPeople(value => value.filter(item => item.id !== person.id));
          setSelected(value => value === person.id ? null : value); }}>
        {person.label}
      </Chip>)}
    </Chip.Group>
    <Text>{selected ? 'Entrada elegida: ' + selected : 'Sin entrada elegida'}</Text>
  </View>;`}],
  'date-pickers':[{id:'date-range',title:'Selección de un rango',description:'El contrato cambia a DateRange al utilizar mode="range". Cancelar conserva el rango anterior.',imports:'Button, DatePicker, type DateRange',body:`const [visible, setVisible] = useState(false);
  const [range, setRange] = useState<DateRange>({ start: new Date(2026, 10, 3), end: new Date(2026, 10, 7) });
  return <>
    <Button onPress={() => setVisible(true)}>Elegir intervalo</Button>
    <DatePicker mode="range" visible={visible} value={range} locale="es-MX"
      onDismiss={() => setVisible(false)}
      onChange={next => { setRange(next); setVisible(false); }} />
  </>;`}],
  menus:[{id:'menu-dialog',title:'Cerrar el menú antes de abrir un diálogo',description:'La intención se conserva hasta onClosed. Una cancelación descarta la continuación pendiente.',hooks:['useState','useRef'],imports:'Menu, Button, Dialog, Text',body:`const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const openEditorAfterClose = useRef(false);
  return <>
    <Menu visible={menuOpen}
      onDismiss={() => { openEditorAfterClose.current = false; setMenuOpen(false); }}
      onClosed={() => { if (openEditorAfterClose.current) {
        openEditorAfterClose.current = false; setDialogOpen(true);
      } }}
      anchor={<Button onPress={() => setMenuOpen(true)}>Opciones</Button>}>
      <Menu.Item title="Editar colección" closeOnPress={false}
        onPress={() => { openEditorAfterClose.current = true; setMenuOpen(false); }} />
    </Menu>
    <Dialog visible={dialogOpen} onDismiss={() => setDialogOpen(false)}>
      <Dialog.Title>Editar colección</Dialog.Title>
      <Dialog.Content><Text>Contenido del editor de la pantalla.</Text></Dialog.Content>
      <Dialog.Actions><Button variant="text" onPress={() => setDialogOpen(false)}>Cerrar</Button></Dialog.Actions>
    </Dialog>
  </>;`}],
  'text-fields':[{id:'password-field',title:'Contraseña con acción de visibilidad',description:'La acción secundaria cambia la presentación sin sustituir el valor controlado del campo.',imports:'TextField',body:`const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(true);
  return <TextField label="Contraseña" value={password} onChangeText={setPassword}
    secureTextEntry={hidden} autoCapitalize="none"
    trailingIcon={hidden ? 'eye-outline' : 'eye-off-outline'}
    trailingIconAccessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
    onTrailingIconPress={() => setHidden(value => !value)} />;`}],
};
