import { useEffect, useReducer, useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { useLocale } from 'react-native-paper';
import {
    Button,
    Chip,
    ExtendedFAB,
    Icon,
    IconButton,
    List,
    NavigationBar,
    NavigationDrawer,
    NavigationDrawerModal,
    NavigationRail,
    NavigationRailModal,
    SearchView,
    Text,
    TextField,
    TopAppBar,
    useMobileTheme,
    type NavigationDestination,
} from 'mobile-design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMailState, mailReducer, selectMail, type MailDraft, type MailMessage } from './mobile-design-navigation-state';

type NavigationMode = 'bar' | 'rail' | 'drawer';
const folders: readonly NavigationDestination[] = [
    { key: 'inbox', label: 'Recibidos', icon: 'inbox-outline', selectedIcon: 'inbox' },
    { key: 'starred', label: 'Favoritos', icon: 'star-outline', selectedIcon: 'star' },
    { key: 'drafts', label: 'Borradores', icon: 'file-outline', selectedIcon: 'file' },
    { key: 'sent', label: 'Enviados', icon: 'send-outline', selectedIcon: 'send' },
    { key: 'archive', label: 'Archivo', icon: 'archive-outline', selectedIcon: 'archive', hiddenWhenCollapsed: true },
];

/** Real local destination/task state in a viewport owned by the native playground route. */
export function NavigationPlayground({ onEvent }: { onEvent: (message: string) => void }) {
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    const window = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [viewportHeight, setViewportHeight] = useState(window.height);
    const [state, dispatch] = useReducer(mailReducer, undefined, createMailState);
    const [mode, setMode] = useState<NavigationMode>('bar');
    const [folder, setFolder] = useState('inbox');
    const [expanded, setExpanded] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string>();
    const [editor, setEditor] = useState<MailDraft>();
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [notice, setNotice] = useState('Los cambios se conservan mientras permanezcas en esta pantalla.');
    const scroll = useRef<ScrollViewInstance>(null);
    const offsets = useRef<Record<string, number>>({});
    const frame = useRef<number | undefined>(undefined);
    useEffect(
        () => () => {
            if (frame.current !== undefined) cancelAnimationFrame(frame.current);
        },
        []
    );
    useEffect(() => {
        if (frame.current !== undefined) cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
            scroll.current?.scrollTo({ y: selectedId ? 0 : (offsets.current[folder] ?? 0), animated: false });
        });
    }, [folder, selectedId]);
    const selected = state.messages.find((message) => message.id === selectedId);
    const items = folders.map((item) => ({
        ...item,
        badge:
            item.key === 'inbox'
                ? state.messages.filter((message) => message.folder === 'inbox' && !message.read).length || undefined
                : item.key === 'drafts'
                  ? state.messages.filter((message) => message.folder === 'drafts').length || undefined
                  : undefined,
    }));
    const standardRail = (mode === 'rail' && window.width >= 600) || (mode === 'bar' && window.width >= 840);
    const drawerCapable = mode === 'drawer' && window.width >= 840;
    const standardDrawer = drawerCapable && drawerVisible;
    const report = (message: string) => {
        setNotice(message);
        onEvent(message);
    };
    const selectFolder = (key: string) => {
        setSelectedId(undefined);
        if (key === folder) {
            offsets.current[key] = 0;
            scroll.current?.scrollTo({ y: 0, animated: theme.animation.scale !== 0 });
        } else setFolder(key);
        setNotice(`Bandeja ${folders.find((item) => item.key === key)?.label ?? key}. Los mensajes y borradores guardados se conservan.`);
    };
    const compose = (draft: MailDraft = { to: '', subject: '', body: '' }) => {
        setEditor({ ...draft });
        setMenuOpen(false);
    };
    const openMessage = (message: MailMessage) => {
        if (message.folder === 'drafts') {
            compose({ id: message.id, to: message.to, subject: message.subject, body: message.body });
            return;
        }
        dispatch({ type: 'read', id: message.id });
        setSelectedId(message.id);
    };
    const saveDraft = () => {
        if (!editor) return;
        dispatch({ type: 'save-draft', draft: editor });
        setEditor(undefined);
        selectFolder('drafts');
        report('Borrador guardado. Puedes abrirlo desde Borradores y continuar editando.');
    };
    const send = () => {
        if (!editor?.to.trim() || !editor.subject.trim()) return;
        dispatch({ type: 'send', draft: editor });
        setEditor(undefined);
        selectFolder('sent');
        report('Mensaje agregado a Enviados en esta bandeja local. No se envió correo por internet.');
    };
    const archive = () => {
        if (!selected) return;
        dispatch({ type: selected.folder === 'archive' ? 'restore' : 'archive', id: selected.id });
        setSelectedId(undefined);
        report(selected.folder === 'archive' ? 'Mensaje devuelto a Recibidos.' : 'Mensaje movido a Archivo.');
    };
    const menu = () => {
        if (standardRail) setExpanded((value) => !value);
        else if (drawerCapable) setDrawerVisible((value) => !value);
        else setMenuOpen(true);
    };
    const mail = selectMail(state.messages, folder);
    const results = selectMail(state.messages, 'all', query).map((message) => ({
        key: message.id,
        title: message.subject || 'Sin asunto',
        description: `${message.from} · ${folders.find((item) => item.key === message.folder)?.label}`,
        icon: message.folder === 'drafts' ? 'file-edit-outline' : message.read ? 'email-open-outline' : 'email-outline',
    }));
    const fab = (
        <ExtendedFAB
            icon="pencil"
            label="Redactar"
            elevation={0}
            expanded={standardDrawer || expanded}
            onPress={() => compose()}
            accessibilityLabel="Crear borrador"
            testID="workspace-compose-fab"
        />
    );
    const navigation = standardRail ? (
        <NavigationRail
            items={items}
            value={folder}
            onValueChange={selectFolder}
            expanded={expanded}
            onExpandedChange={setExpanded}
            expandedWidth={256}
            fab={fab}
            style={{ paddingTop: 12, paddingBottom: 0 }}
            testID="workspace-rail"
        />
    ) : standardDrawer ? (
        <NavigationDrawer
            items={items}
            value={folder}
            onValueChange={selectFolder}
            width={320}
            header={<View style={{ padding: 16 }}>{fab}</View>}
            testID="workspace-drawer"
        />
    ) : null;
    if (editor)
        return (
            <View style={{ flex: 1, backgroundColor: theme.colors.surface }} testID="workspace-editor">
                <TopAppBar
                    title={editor.id ? 'Editar borrador' : 'Nuevo mensaje'}
                    statusBarHeight={0}
                    navigationIcon="close"
                    navigationLabel="Cancelar edición"
                    onNavigationPress={() => {
                        setEditor(undefined);
                        setNotice('Edición cancelada; se conserva la última versión guardada.');
                    }}
                    actions={[{ key: 'save', icon: 'content-save-outline', label: 'Guardar borrador', onPress: saveDraft }]}
                    testID="workspace-editor-header"
                />
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ padding: 24, paddingBottom: 24 + insets.bottom }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={{ gap: 16 }}>
                        <TextField
                            label="Para"
                            value={editor?.to ?? ''}
                            onChangeText={(to) => setEditor((draft) => (draft ? { ...draft, to } : draft))}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            testID="workspace-editor-to"
                        />
                        <TextField
                            label="Asunto"
                            value={editor?.subject ?? ''}
                            onChangeText={(subject) => setEditor((draft) => (draft ? { ...draft, subject } : draft))}
                            testID="workspace-editor-subject"
                        />
                        <TextField
                            label="Mensaje"
                            value={editor?.body ?? ''}
                            onChangeText={(body) => setEditor((draft) => (draft ? { ...draft, body } : draft))}
                            multiline
                            numberOfLines={5}
                            testID="workspace-editor-body"
                        />
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            Para y Asunto son necesarios para agregar el mensaje a Enviados. La operación es local e inmediata.
                        </Text>
                        <Button
                            style={{ alignSelf: 'flex-start' }}
                            icon="send"
                            disabled={!editor?.to.trim() || !editor.subject.trim()}
                            onPress={send}
                            testID="workspace-editor-send"
                        >
                            Enviar localmente
                        </Button>
                        <Button
                            style={{ alignSelf: 'flex-start' }}
                            variant="outlined"
                            onPress={() => {
                                setEditor(undefined);
                                setNotice('Edición cancelada; se conserva la última versión guardada.');
                            }}
                            testID="workspace-editor-cancel"
                        >
                            Cancelar cambios
                        </Button>
                        {editor?.id ? (
                            <Button
                                style={{ alignSelf: 'flex-start' }}
                                variant="text"
                                icon="delete-outline"
                                onPress={() => {
                                    dispatch({ type: 'delete-draft', id: editor.id! });
                                    setEditor(undefined);
                                    selectFolder('drafts');
                                    report('Borrador eliminado.');
                                }}
                                testID="workspace-editor-delete"
                            >
                                Eliminar borrador
                            </Button>
                        ) : null}
                    </View>
                </ScrollView>
            </View>
        );
    return (
        <View
            onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
            style={{ flex: 1, backgroundColor: theme.colors.surface }}
        >
            <View style={{ paddingHorizontal: 16, paddingVertical: viewportHeight < 420 ? 4 : 8, gap: 8 }}>
                {viewportHeight >= 420 ? <Text variant="labelMedium">Configuración del ejemplo · datos de correo locales</Text> : null}
                <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', gap: 8 }}>
                    {(
                        [
                            { key: 'bar', label: 'Barra' },
                            { key: 'rail', label: 'Rail' },
                            { key: 'drawer', label: 'Cajón' },
                        ] as const
                    ).map((item) => (
                        <Chip
                            key={item.key}
                            variant="filter"
                            selected={mode === item.key}
                            onPress={() => {
                                setMode(item.key);
                                setMenuOpen(false);
                            }}
                            testID={`workspace-mode-${item.key}`}
                        >
                            {item.label}
                        </Chip>
                    ))}
                </View>
            </View>
            <View style={{ flex: 1, minHeight: 0, flexDirection: rtl ? 'row-reverse' : 'row' }}>
                {navigation}
                <View style={{ flex: 1, minWidth: 0 }}>
                    <TopAppBar
                        title={selected?.subject || 'Correo'}
                        statusBarHeight={0}
                        navigationIcon={selected ? (rtl ? 'arrow-right' : 'arrow-left') : 'menu'}
                        navigationLabel={selected ? 'Volver a los mensajes' : 'Abrir navegación'}
                        onNavigationPress={selected ? () => setSelectedId(undefined) : menu}
                        search={
                            !selected ? (
                                <SearchView
                                    open={searchOpen}
                                    onOpenChange={setSearchOpen}
                                    value={query}
                                    onChangeText={setQuery}
                                    placeholder="Buscar correo"
                                    results={results}
                                    onSearch={() => setNotice(`${results.length} mensajes encontrados en la bandeja.`)}
                                    onResultPress={(result) => {
                                        const message = state.messages.find((item) => item.id === result.key);
                                        if (message) {
                                            setFolder(message.folder);
                                            dispatch({ type: 'read', id: message.id });
                                            setSelectedId(message.id);
                                        }
                                    }}
                                    supportingContent={
                                        <Text variant="bodySmall" style={{ padding: 16 }}>
                                            {query ? `${results.length} resultados` : 'Mensajes y borradores disponibles'}
                                        </Text>
                                    }
                                    testID="workspace-search"
                                />
                            ) : undefined
                        }
                        actions={
                            selected
                                ? selected.folder === 'drafts'
                                    ? [
                                          {
                                              key: 'edit',
                                              icon: 'pencil',
                                              label: 'Editar borrador',
                                              onPress: () =>
                                                  compose({
                                                      id: selected.id,
                                                      to: selected.to,
                                                      subject: selected.subject,
                                                      body: selected.body,
                                                  }),
                                          },
                                          {
                                              key: 'delete',
                                              icon: 'delete-outline',
                                              label: 'Eliminar borrador',
                                              onPress: () => {
                                                  dispatch({ type: 'delete-draft', id: selected.id });
                                                  setSelectedId(undefined);
                                                  report('Borrador eliminado.');
                                              },
                                          },
                                      ]
                                    : [
                                          {
                                              key: 'star',
                                              icon: selected.starred ? 'star' : 'star-outline',
                                              label: selected.starred ? 'Quitar destacado' : 'Destacar mensaje',
                                              onPress: () => dispatch({ type: 'star', id: selected.id }),
                                          },
                                          {
                                              key: 'archive',
                                              icon: selected.folder === 'archive' ? 'archive-arrow-up-outline' : 'archive-outline',
                                              label: selected.folder === 'archive' ? 'Restaurar mensaje' : 'Archivar mensaje',
                                              onPress: archive,
                                          },
                                      ]
                                : [
                                      {
                                          key: 'compose',
                                          icon: 'pencil',
                                          label: 'Redactar mensaje',
                                          mode: 'contained-tonal',
                                          onPress: () => compose(),
                                      },
                                  ]
                        }
                        testID="workspace-appbar"
                    />
                    <ScrollView
                        ref={scroll}
                        style={{ flex: 1 }}
                        keyboardShouldPersistTaps="handled"
                        onScroll={(event) => {
                            if (!selected) offsets.current[folder] = event.nativeEvent.contentOffset.y;
                        }}
                        scrollEventThrottle={32}
                        testID="workspace-content"
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        {selected ? (
                            <View style={{ padding: 24, gap: 16 }}>
                                <Text variant="headlineSmall">{selected.subject}</Text>
                                <Text variant="labelLarge">
                                    {selected.from} → {selected.to}
                                </Text>
                                <Text variant="bodyLarge">{selected.body}</Text>
                                <Button
                                    style={{ alignSelf: 'flex-start' }}
                                    variant="outlined"
                                    icon={selected.folder === 'drafts' ? 'pencil' : 'reply'}
                                    onPress={() =>
                                        selected.folder === 'drafts'
                                            ? compose({ id: selected.id, to: selected.to, subject: selected.subject, body: selected.body })
                                            : compose({
                                                  to:
                                                      selected.from === 'Tú'
                                                          ? selected.to
                                                          : `${selected.from.split(' ')[0].toLowerCase()}@ejemplo.test`,
                                                  subject: `Re: ${selected.subject}`,
                                                  body: '',
                                              })
                                    }
                                    testID="workspace-reply"
                                >
                                    {selected.folder === 'drafts' ? 'Editar borrador' : 'Responder'}
                                </Button>
                            </View>
                        ) : (
                            <>
                                <View style={{ padding: 16, gap: 8 }}>
                                    <Text variant="headlineSmall">{folders.find((item) => item.key === folder)?.label}</Text>
                                    <Text variant="bodyMedium">{mail.length} mensajes · abrir uno lo marca como leído</Text>
                                    {!standardRail && !standardDrawer && mode !== 'bar' ? (
                                        <Text variant="bodySmall">El menú abre la navegación modal en esta ventana.</Text>
                                    ) : null}
                                </View>
                                {mail.map((message) => (
                                    <List.Item
                                        key={message.id}
                                        title={message.subject || 'Sin asunto'}
                                        description={`${message.from} · ${message.body || 'Borrador vacío'}`}
                                        lines={3}
                                        multiAction
                                        onPress={() => openMessage(message)}
                                        leading={
                                            <Icon
                                                source={
                                                    message.folder === 'drafts'
                                                        ? 'file-edit-outline'
                                                        : message.read
                                                          ? 'email-open-outline'
                                                          : 'email-outline'
                                                }
                                                size={24}
                                            />
                                        }
                                        trailing={
                                            <IconButton
                                                icon={message.starred ? 'star' : 'star-outline'}
                                                accessibilityLabel={
                                                    message.starred
                                                        ? `Quitar destacado de ${message.subject}`
                                                        : `Destacar ${message.subject}`
                                                }
                                                onPress={() => dispatch({ type: 'star', id: message.id })}
                                                testID={`workspace-star-${message.id}`}
                                            />
                                        }
                                        testID={`workspace-message-${message.id}`}
                                    />
                                ))}
                                {!mail.length ? (
                                    <View style={{ padding: 24, gap: 16 }}>
                                        <Text>No hay mensajes en esta bandeja.</Text>
                                        <Button
                                            style={{ alignSelf: 'flex-start' }}
                                            onPress={() => compose()}
                                            testID="workspace-empty-compose"
                                        >
                                            Crear borrador
                                        </Button>
                                    </View>
                                ) : null}
                            </>
                        )}
                    </ScrollView>
                    <Text
                        accessibilityLiveRegion="polite"
                        numberOfLines={viewportHeight < 420 ? 1 : 2}
                        variant="bodySmall"
                        style={{
                            paddingHorizontal: 16,
                            paddingTop: 8,
                            paddingBottom: mode === 'bar' && !standardRail ? 8 : 8 + insets.bottom,
                            color: theme.colors.onSurfaceVariant,
                        }}
                        testID="workspace-notice"
                    >
                        {notice}
                    </Text>
                    {mode === 'bar' && !standardRail ? (
                        <NavigationBar
                            items={items}
                            value={folder}
                            onValueChange={selectFolder}
                            iconPosition={window.width >= 600 ? 'start' : 'top'}
                            arrangement={window.width >= 600 ? 'centered' : 'equal'}
                            testID="workspace-navbar"
                        />
                    ) : null}
                </View>
            </View>
            <NavigationRailModal
                open={menuOpen && mode !== 'drawer'}
                onOpenChange={setMenuOpen}
                items={items}
                value={folder}
                onValueChange={selectFolder}
                fab={
                    <ExtendedFAB
                        icon="pencil"
                        label="Redactar"
                        elevation={0}
                        expanded
                        onPress={() => compose()}
                        testID="workspace-modal-compose"
                    />
                }
                title="Correo"
                testID="workspace-rail-modal"
            />
            <NavigationDrawerModal
                open={menuOpen && mode === 'drawer'}
                onOpenChange={setMenuOpen}
                items={items}
                value={folder}
                onValueChange={selectFolder}
                header={
                    <View style={{ padding: 16 }}>
                        <Text variant="titleLarge">Correo</Text>
                        {fab}
                    </View>
                }
                testID="workspace-drawer-modal"
            />
        </View>
    );
}
