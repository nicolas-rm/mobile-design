import { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocale } from 'react-native-paper';
import {
    BottomSheet,
    BottomSheetScrollView,
    BottomSheetTextInput,
    Button,
    Icon,
    Text,
    TopAppBar,
    TouchableRipple,
    useMobileTheme,
} from 'mobile-design';

const photo = require('./assets/welcome-wallpaper.png');
// Public sample used by https://docs.expo.dev/versions/v57.0.0/sdk/video/.
const videoSource = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
type AttachmentKind = 'document' | 'image' | 'camera';
type Attachment = { kind: AttachmentKind; name: string };
const choices = [
    { kind: 'document', icon: 'file-document-outline', label: 'Archivo', name: 'itinerario.txt' },
    { kind: 'image', icon: 'image-outline', label: 'Imagen', name: 'Ilustración del recorrido' },
    { kind: 'camera', icon: 'camera-outline', label: 'Cámara · muestra', name: 'Foto local de demostración' },
] as const;

function SheetVideo({ active, onReady }: { active: boolean; onReady: (ready: boolean) => void }) {
    const player = useVideoPlayer(null);
    const { status, error } = useEvent(player, 'statusChange', { status: player.status, error: undefined });
    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
    const [requested, setRequested] = useState(false);
    const [busy, setBusy] = useState(false);
    const [failure, setFailure] = useState('');
    const alive = useRef(true),
        activeRef = useRef(active),
        pending = useRef(false);
    activeRef.current = active;
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    useEffect(() => {
        if (!active) player.pause();
    }, [active, player]);
    useEffect(() => {
        onReady(active && status === 'readyToPlay' && !busy && !failure);
    }, [active, busy, failure, onReady, status]);
    const play = async () => {
        if (!activeRef.current || pending.current) return;
        if (requested && status === 'readyToPlay') {
            if (isPlaying) player.pause();
            else player.play();
            return;
        }
        pending.current = true;
        setBusy(true);
        setFailure('');
        setRequested(true);
        try {
            await player.replaceAsync(videoSource);
            if (alive.current && activeRef.current) player.play();
        } catch {
            if (alive.current) setFailure('No se pudo cargar el video. Comprueba la conexión y vuelve a intentarlo.');
        } finally {
            pending.current = false;
            if (alive.current) setBusy(false);
        }
    };
    const loading = busy || status === 'loading';
    const failed = failure || error || status === 'error';
    return (
        <View style={{ gap: 16 }}>
            {requested ? (
                <VideoView
                    player={player}
                    nativeControls
                    contentFit="contain"
                    surfaceType="textureView"
                    fullscreenOptions={{ enable: true }}
                    style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }}
                    testID="md-sheet-media-player"
                />
            ) : (
                <Image
                    source={photo}
                    accessibilityLabel="Ilustración previa al video"
                    style={{ width: '100%', height: 180, borderRadius: 12 }}
                />
            )}
            <Text variant="titleMedium">Big Buck Bunny</Text>
            <Text variant="bodyMedium">
                Video público de la muestra de Expo. Se carga por internet al reproducir; no inicia automáticamente.
            </Text>
            {failed ? (
                <Text accessibilityLiveRegion="polite" testID="md-sheet-media-error">
                    {failure || 'No se pudo reproducir el video. Puedes volver a intentarlo.'}
                </Text>
            ) : null}
            <Button
                style={{ alignSelf: 'flex-start' }}
                icon={isPlaying ? 'pause' : 'play'}
                disabled={!active || loading}
                loading={loading}
                onPress={play}
                testID="md-sheet-media-play"
            >
                {loading ? 'Cargando video' : isPlaying ? 'Pausar' : failed ? 'Reintentar' : 'Reproducir'}
            </Button>
        </View>
    );
}

/** Content compositions from Bottom sheets Guidelines; every save is local and cancellable. */
export function SheetContentExamples() {
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    const [actionsOpen, setActionsOpen] = useState(false);
    const [candidate, setCandidate] = useState<Attachment>();
    const [attachment, setAttachment] = useState<Attachment>();
    const [media, setMedia] = useState<{ kind: 'photo' | 'video'; session: number }>();
    const [mediaOpen, setMediaOpen] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [appliedMedia, setAppliedMedia] = useState<'photo' | 'video'>();
    const session = useRef(0);
    const actionsVisible = useRef(false),
        mediaVisible = useRef(false),
        actionSession = useRef(0);
    const renderedActionSession = actionSession.current;
    const closeActions = () => {
        actionsVisible.current = false;
        setActionsOpen(false);
    };
    const closeMedia = () => {
        mediaVisible.current = false;
        setMediaOpen(false);
    };
    const showMedia = (kind: 'photo' | 'video') => {
        mediaVisible.current = true;
        setVideoReady(false);
        setMedia({ kind, session: ++session.current });
        setMediaOpen(true);
    };
    return (
        <View style={{ gap: 24 }}>
            <View style={{ gap: 12 }}>
                <Text variant="titleMedium" accessibilityRole="header">
                    Menú de acciones en una hoja
                </Text>
                <Text>
                    Elige un adjunto de muestra y confírmalo en la cabecera. Cerrar, Atrás o el scrim descartan la selección sin cambiar el
                    adjunto anterior.
                </Text>
                <Button
                    style={{ alignSelf: 'flex-start' }}
                    icon="paperclip"
                    onPress={() => {
                        actionsVisible.current = true;
                        actionSession.current += 1;
                        setCandidate(undefined);
                        setActionsOpen(true);
                    }}
                    testID="md-sheet-actions-open"
                >
                    Adjuntar contenido
                </Button>
                <Text accessibilityLiveRegion="polite" testID="md-sheet-attachment-result">
                    {attachment ? `Adjunto: ${attachment.name}` : 'Sin adjunto confirmado'}
                </Text>
                {attachment && attachment.kind !== 'document' ? (
                    <Image source={photo} accessibilityLabel={attachment.name} style={{ width: '100%', height: 120, borderRadius: 12 }} />
                ) : null}
            </View>
            <View style={{ gap: 12 }}>
                <Text variant="titleMedium" accessibilityRole="header">
                    Foto y video dentro de una hoja
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <Button variant="outlined" icon="image-outline" onPress={() => showMedia('photo')} testID="md-sheet-photo-open">
                        Ver foto
                    </Button>
                    <Button variant="outlined" icon="play" onPress={() => showMedia('video')} testID="md-sheet-video-open">
                        Ver video
                    </Button>
                </View>
                <Text accessibilityLiveRegion="polite" testID="md-sheet-media-result">
                    {appliedMedia
                        ? `Medio elegido: ${appliedMedia === 'photo' ? 'Foto de muestra' : 'Big Buck Bunny'}`
                        : 'Sin medio elegido'}
                </Text>
            </View>
            <BottomSheet
                open={actionsOpen}
                onOpenChange={(open) => {
                    actionsVisible.current = open;
                    setActionsOpen(open);
                }}
                snapPoints={['50%', '95%']}
                scrollable
                accessibilityLabel="Adjuntar contenido"
                testID="md-sheet-actions"
            >
                <BottomSheetScrollView
                    stickyHeaderIndices={[0]}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    <TopAppBar
                        title={candidate ? 'Revisar adjunto' : 'Adjuntar'}
                        statusBarHeight={0}
                        navigationIcon={candidate ? (rtl ? 'arrow-right' : 'arrow-left') : 'close'}
                        navigationLabel={candidate ? 'Volver al menú de adjuntos' : 'Cancelar adjunto'}
                        onNavigationPress={candidate ? () => setCandidate(undefined) : closeActions}
                        actions={
                            candidate
                                ? [
                                      {
                                          key: 'use',
                                          icon: 'check',
                                          label: 'Confirmar adjunto',
                                          disabled: !actionsOpen || !candidate.name.trim(),
                                          onPress: () => {
                                              if (
                                                  !actionsVisible.current ||
                                                  actionSession.current !== renderedActionSession ||
                                                  !candidate.name.trim()
                                              )
                                                  return;
                                              setAttachment({ ...candidate, name: candidate.name.trim() });
                                              closeActions();
                                          },
                                          testID: 'md-sheet-actions-confirm',
                                      },
                                      {
                                          key: 'close',
                                          icon: 'close',
                                          label: 'Cancelar adjunto',
                                          onPress: closeActions,
                                          testID: 'md-sheet-actions-close',
                                      },
                                  ]
                                : []
                        }
                        testID="md-sheet-actions-appbar"
                    />
                    {candidate ? (
                        <View style={{ paddingHorizontal: 24, gap: 16 }}>
                            {candidate.kind === 'document' ? (
                                <>
                                    <Text variant="labelLarge">Nombre del archivo local de muestra</Text>
                                    <BottomSheetTextInput
                                        value={candidate.name}
                                        onChangeText={(name) => setCandidate((value) => (value ? { ...value, name } : value))}
                                        accessibilityLabel="Nombre del adjunto"
                                        style={{
                                            ...theme.fonts.bodyLarge,
                                            color: theme.colors.onSurface,
                                            padding: 16,
                                            borderRadius: 12,
                                            backgroundColor: theme.colors.surfaceContainerHigh,
                                        }}
                                        testID="md-sheet-attachment-name"
                                    />
                                    <Text variant="titleMedium">Vista previa de itinerario.txt</Text>
                                    <Text>
                                        09:00 · Punto de encuentro{'\n'}10:00 · Recorrido del centro{'\n'}12:00 · Visita al museo
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Image
                                        source={photo}
                                        accessibilityLabel={candidate.name}
                                        style={{ width: '100%', height: 200, borderRadius: 12 }}
                                    />
                                    <Text variant="titleMedium">{candidate.name}</Text>
                                    <Text>
                                        {candidate.kind === 'camera'
                                            ? 'Este catálogo usa una foto local de demostración. No abre la cámara ni pide permisos.'
                                            : 'Imagen incluida en la aplicación, disponible sin conexión.'}
                                    </Text>
                                </>
                            )}
                        </View>
                    ) : (
                        <View style={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {choices.map((choice) => (
                                <TouchableRipple
                                    key={choice.kind}
                                    accessibilityRole="button"
                                    accessibilityLabel={choice.label}
                                    onPress={() => setCandidate({ kind: choice.kind, name: choice.name })}
                                    style={{ width: '48%', flexGrow: 1, minHeight: 96, borderRadius: 12 }}
                                    testID={`md-sheet-action-${choice.kind}`}
                                >
                                    <View
                                        pointerEvents="none"
                                        style={{ alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8 }}
                                    >
                                        <View
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 20,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: theme.colors.secondaryContainer,
                                            }}
                                        >
                                            <Icon source={choice.icon} size={24} color={theme.colors.onSecondaryContainer} />
                                        </View>
                                        <Text variant="labelLarge" style={{ textAlign: 'center' }}>
                                            {choice.label}
                                        </Text>
                                    </View>
                                </TouchableRipple>
                            ))}
                        </View>
                    )}
                </BottomSheetScrollView>
            </BottomSheet>
            <BottomSheet
                open={mediaOpen}
                onOpenChange={(open) => {
                    mediaVisible.current = open;
                    setMediaOpen(open);
                }}
                onClosed={() => {
                    if (!mediaVisible.current) setMedia(undefined);
                }}
                snapPoints={['50%', '95%']}
                scrollable
                accessibilityLabel={media?.kind === 'video' ? 'Video' : 'Foto'}
                testID="md-sheet-media"
            >
                <BottomSheetScrollView
                    stickyHeaderIndices={[0]}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    <TopAppBar
                        title={media?.kind === 'video' ? 'Video' : 'Foto'}
                        statusBarHeight={0}
                        navigationIcon="close"
                        navigationLabel="Cancelar selección de medio"
                        onNavigationPress={closeMedia}
                        actions={[
                            {
                                key: 'use',
                                icon: 'check',
                                label: 'Elegir este medio',
                                disabled: !mediaOpen || !media || (media.kind === 'video' && !videoReady),
                                onPress: () => {
                                    if (
                                        mediaVisible.current &&
                                        media &&
                                        media.session === session.current &&
                                        (media.kind === 'photo' || videoReady)
                                    ) {
                                        setAppliedMedia(media.kind);
                                        closeMedia();
                                    }
                                },
                                testID: 'md-sheet-media-confirm',
                            },
                        ]}
                        testID="md-sheet-media-appbar"
                    />
                    <View style={{ paddingHorizontal: 24, gap: 16 }}>
                        {media?.kind === 'video' ? (
                            <SheetVideo key={media.session} active={mediaOpen} onReady={setVideoReady} />
                        ) : media ? (
                            <>
                                <Image
                                    source={photo}
                                    accessibilityLabel="Ilustración de la colección"
                                    style={{ width: '100%', height: 240, borderRadius: 12 }}
                                />
                                <Text variant="titleMedium">Foto de muestra</Text>
                                <Text>La imagen forma parte de la aplicación. Cerrar vuelve a la pantalla anterior sin elegirla.</Text>
                            </>
                        ) : null}
                    </View>
                </BottomSheetScrollView>
            </BottomSheet>
        </View>
    );
}
