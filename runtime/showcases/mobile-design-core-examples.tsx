import { useRef, useState } from 'react';
import { Portal as SnackbarPortal } from 'mobile-design/react-native-web';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Carousel,
    Chip,
    Dialog,
    Divider,
    FullScreenDialog,
    Icon,
    IconButton,
    List,
    Snackbar,
    Text,
    type CarouselItem,
} from 'mobile-design/react-native-web';

import { ChipExamples, MenuExamples, CheckboxExamples, RadioExamples, SwitchExamples } from './mobile-design-content-examples';
import { ListExamples } from './mobile-design-list-examples';

import { ProgressExamples } from './mobile-design-progress-examples';
import { DialogExamples } from './mobile-design-dialog-examples';

import { SheetContentExamples } from './mobile-design-sheet-content-examples';

type Props = {
    id: string;
    onEvent: (message: string) => void;
    onOpenAppBarPlayground?: () => void;
    onOpenProgressPlayground?: () => void;
    onOpenCardPlayground?: () => void;
};
const row = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, alignItems: 'center' as const, gap: 16 };
const travel: CarouselItem[] = [
    {
        id: 'forest',
        title: 'El bosque',
        description: 'Respira y explora',
        image: require('./assets/carousel/forest.jpg'),
        aspectRatio: 16 / 9,
    },
    {
        id: 'coast',
        title: 'La costa',
        description: 'Sigue la marea',
        image: require('./assets/carousel/coast.jpg'),
        aspectRatio: 9 / 16,
    },
    {
        id: 'desert',
        title: 'El desierto',
        description: 'Cambia de horizonte',
        image: require('./assets/carousel/desert.jpg'),
        aspectRatio: 1,
    },
    { id: 'mountains', title: 'La montaña', description: 'Una nueva perspectiva', icon: 'terrain', aspectRatio: 3 / 4 },
    { id: 'city', title: 'La ciudad', description: 'Descubre otra ruta', icon: 'city-variant-outline', aspectRatio: 16 / 9 },
];

export function CoreExamples({ id, onEvent, onOpenAppBarPlayground, onOpenProgressPlayground, onOpenCardPlayground }: Props) {
    const window = useWindowDimensions();
    const [viewer, setViewer] = useState<string | null>(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerFromCollection, setViewerFromCollection] = useState(false);
    const pendingViewer = useRef<CarouselItem | null>(null);
    const restoreCollection = useRef(false);
    const [viewerHeight, setViewerHeight] = useState(1);
    const [viewerIndex, setViewerIndex] = useState(0);
    const [collection, setCollection] = useState(false);
    const [collectionTitle, setCollectionTitle] = useState('Colección');
    const [dividerDetails, setDividerDetails] = useState(false);
    const [dividerFilters, setDividerFilters] = useState<string[]>(['Fotos']);
    const verticalViewer = window.width < 840 && window.height > window.width;
    const openViewer = (item: CarouselItem) => {
        setViewerIndex(travel.findIndex((candidate) => candidate.id === item.id));
        setViewer(item.id);
        setViewerOpen(true);
    };
    const openCollection = (heading: string) => {
        setCollectionTitle(heading);
        setCollection(true);
    };

    switch (id) {
        case 'bottom-sheets':
            return <SheetContentExamples />;
        case 'checkbox':
            return <CheckboxExamples />;
        case 'radio-button':
            return <RadioExamples />;
        case 'chips':
            return <ChipExamples onEvent={onEvent} />;
        case 'dialogs':
            return <DialogExamples onEvent={onEvent} />;
        case 'divider':
            return (
                <View style={{ gap: 24 }}>
                    <Text variant="titleMedium">Completo · secciones diferentes</Text>
                    <View>
                        <List.Item title="Notificaciones" description="Preferencias de avisos" />
                        <Divider />
                        <List.Item title="Almacenamiento" description="Archivos guardados en este dispositivo" />
                    </View>
                    <Text variant="titleMedium">Inset · elementos relacionados</Text>
                    <View>
                        <List.Item title="Documentos" leading={<Icon source="folder-outline" size={24} />} />
                        <Divider horizontalInset />
                        <List.Item title="Imágenes" leading={<Icon source="image-outline" size={24} />} />
                    </View>
                    <Text variant="titleMedium">Inset inicial · margen de16dp</Text>
                    <View>
                        <List.Item title="Archivos de la colección" leading={<Icon source="folder-outline" size={24} />} />
                        <Divider leftInset />
                        <List.Item title="Archivos compartidos" leading={<Icon source="folder-outline" size={24} />} />
                    </View>
                    <Text variant="titleMedium">Contenido y acciones</Text>
                    <Card variant="outlined">
                        <Card.Content>
                            <Text variant="titleMedium">Guía de la colección</Text>
                            <Text>Información descriptiva antes de la región de acciones.</Text>
                        </Card.Content>
                        <Divider />
                        <Card.Actions>
                            <Button variant="text" onPress={() => setDividerDetails(true)} testID="md-divider-read-more">
                                Leer más
                            </Button>
                        </Card.Actions>
                    </Card>
                    <Dialog visible={dividerDetails} onDismiss={() => setDividerDetails(false)} testID="md-divider-detail">
                        <Dialog.Title>Guía de la colección</Dialog.Title>
                        <Dialog.Content>
                            <Text>
                                Organiza imágenes y documentos en colecciones. El divisor completo distingue la información del área donde
                                se abre esta guía.
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button variant="text" onPress={() => setDividerDetails(false)}>
                                Cerrar
                            </Button>
                        </Dialog.Actions>
                    </Dialog>
                    <Text variant="titleMedium">Texto y selección relacionada</Text>
                    <View style={{ gap: 4 }}>
                        <Text>Filtra los archivos de esta colección.</Text>
                        <Divider horizontalInset />
                        <View style={row}>
                            {['Fotos', 'Documentos', 'Vídeos'].map((label) => (
                                <Chip
                                    key={label}
                                    variant="filter"
                                    selected={dividerFilters.includes(label)}
                                    onPress={() =>
                                        setDividerFilters((current) =>
                                            current.includes(label) ? current.filter((item) => item !== label) : [...current, label]
                                        )
                                    }
                                >
                                    {label}
                                </Chip>
                            ))}
                        </View>
                        <Text accessibilityLiveRegion="polite">Mostrando: {dividerFilters.join(', ') || 'ninguna categoría'}</Text>
                    </View>
                    <Text variant="titleMedium">Vertical · regiones contiguas</Text>
                    <View style={{ flexDirection: 'row', minHeight: 112, gap: 16 }}>
                        <View style={{ flex: 1 }}>
                            <Text variant="titleSmall">Descripción</Text>
                            <Text variant="bodyMedium">Información de la colección.</Text>
                        </View>
                        <Divider orientation="vertical" />
                        <View style={{ flex: 1 }}>
                            <Text variant="titleSmall">Detalles</Text>
                            <Text variant="bodyMedium">12 archivos guardados.</Text>
                        </View>
                    </View>
                </View>
            );
        case 'lists':
            return <ListExamples onEvent={onEvent} />;
        case 'menus':
            return <MenuExamples onEvent={onEvent} />;
        case 'snackbar':
            return <CoreSnackbarExamples />;
        case 'switch':
            return <SwitchExamples />;
        case 'progress-indicators':
            return <ProgressExamples onOpenPlayground={onOpenProgressPlayground} />;
        case 'carousel':
            return (
                <View style={{ gap: 32, marginHorizontal: -24 }}>
                    {(['multi-browse', 'uncontained', 'uncontained-multi-aspect', 'hero', 'center-aligned-hero'] as const).map(
                        (variant) => (
                            <View key={variant} style={{ gap: 12 }}>
                                <CarouselHeading title={variant} onViewAll={openCollection} />
                                <Carousel
                                    items={travel}
                                    variant={variant}
                                    height={220}
                                    onItemPress={openViewer}
                                    testID={`md-carousel-${variant}`}
                                />
                            </View>
                        )
                    )}
                    <CarouselHeading title="Multi-browse centrado" onViewAll={openCollection} />
                    <Carousel items={travel} alignment="center" height={220} onItemPress={openViewer} />
                    <CarouselHeading title="Texto debajo" onViewAll={openCollection} />
                    <Carousel items={travel} variant="uncontained" textPlacement="below" height={300} onItemPress={openViewer} />
                    <View style={{ gap: 4 }}>
                        <Carousel
                            items={travel}
                            variant="uncontained"
                            height={220}
                            onItemPress={openViewer}
                            testID="md-carousel-no-header"
                        />
                        <Button
                            variant="text"
                            style={{ alignSelf: 'flex-start', marginHorizontal: 16 }}
                            onPress={() => openCollection('Todos los destinos')}
                            testID="md-carousel-show-all"
                        >
                            Ver todos
                        </Button>
                    </View>
                    <View style={{ paddingHorizontal: 16, gap: 12 }}>
                        <Text variant="titleMedium">Full-screen vertical</Text>
                        <Button style={{ alignSelf: 'flex-start' }} onPress={() => openViewer(travel[0])} testID="md-carousel-full">
                            Abrir carrusel vertical
                        </Button>
                    </View>
                    <Text variant="titleMedium" style={{ paddingHorizontal: 16 }}>
                        Deshabilitado
                    </Text>
                    <Carousel items={travel.slice(0, 3)} height={200} disabled />
                    <Dialog
                        visible={collection}
                        onDismiss={() => setCollection(false)}
                        onClosed={() => {
                            const item = pendingViewer.current;
                            if (!item) return;
                            pendingViewer.current = null;
                            setViewerFromCollection(true);
                            openViewer(item);
                        }}
                        accessibilityLabel={collectionTitle}
                        testID="md-carousel-collection"
                    >
                        <Dialog.Title>{collectionTitle}</Dialog.Title>
                        <Dialog.ScrollArea>
                            <ScrollView
                                style={{ maxHeight: Math.max(72, Math.min(384, window.height - 184)) }}
                                contentContainerStyle={{ paddingVertical: 8 }}
                            >
                                <List.Group>
                                    {travel.map((item, index) => (
                                        <List.Item
                                            key={item.id}
                                            title={item.title}
                                            description={item.description}
                                            leading={<Avatar.Icon icon={item.icon ?? 'image-outline'} size={40} />}
                                            trailing={<Icon source="chevron-right" size={24} />}
                                            onPress={() => {
                                                pendingViewer.current = item;
                                                setCollection(false);
                                            }}
                                            testID={`md-carousel-collection-${index}`}
                                        />
                                    ))}
                                </List.Group>
                            </ScrollView>
                        </Dialog.ScrollArea>
                        <Dialog.Actions>
                            <Button variant="text" onPress={() => setCollection(false)}>
                                Cerrar
                            </Button>
                        </Dialog.Actions>
                    </Dialog>
                    <FullScreenDialog
                        title="Vista ampliada"
                        visible={viewerOpen}
                        scrollable={false}
                        onDismiss={() => setViewerOpen(false)}
                        onClosed={() => {
                            setViewer(null);
                            setViewerFromCollection(false);
                            if (restoreCollection.current) {
                                restoreCollection.current = false;
                                setCollection(true);
                            }
                        }}
                        testID="md-carousel-viewer"
                    >
                        {viewer != null ? (
                            <View style={{ flex: 1 }}>
                                {viewerFromCollection ? (
                                    <Button
                                        style={{ alignSelf: 'flex-start' }}
                                        variant="text"
                                        icon="arrow-left"
                                        onPress={() => {
                                            restoreCollection.current = true;
                                            setViewerOpen(false);
                                        }}
                                        testID="md-carousel-collection-back"
                                    >
                                        Volver a la colección
                                    </Button>
                                ) : null}
                                <View
                                    style={{ flex: 1 }}
                                    onLayout={(event) => setViewerHeight(Math.max(1, event.nativeEvent.layout.height))}
                                >
                                    <Carousel
                                        key={viewer}
                                        items={travel}
                                        variant={verticalViewer ? 'full-screen' : 'hero'}
                                        initialIndex={viewerIndex}
                                        onIndexChange={setViewerIndex}
                                        height={viewerHeight}
                                        testID="md-carousel-viewer-content"
                                    />
                                </View>
                            </View>
                        ) : null}
                    </FullScreenDialog>
                </View>
            );
        default:
            return null;
    }
}

function CarouselHeading({ title, onViewAll }: { title: string; onViewAll: (title: string) => void }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 16 }}>
            <Text variant="titleMedium" style={{ flex: 1 }}>
                {title}
            </Text>
            <IconButton icon="arrow-right" accessibilityLabel={`Ver todos: ${title}`} onPress={() => onViewAll(title)} />
        </View>
    );
}

function CoreSnackbarExamples() {
    const [message, setMessage] = useState<'single' | 'two' | 'action' | 'two-action' | 'long' | 'dismiss' | null>(null);
    const [duration, setDuration] = useState(4000);
    const [feedback, setFeedback] = useState('Todavía no hay operaciones.');
    const [archived, setArchived] = useState(false);
    const show = (next: NonNullable<typeof message>) => {
        setMessage(next);
        if (next === 'action' || next === 'two-action' || next === 'long') {
            setArchived(true);
            setFeedback('Elemento archivado. Puedes deshacer desde el mensaje.');
        } else setFeedback(next === 'single' ? 'Cambios guardados.' : 'La copia del documento quedó guardada en la biblioteca.');
    };
    const text =
        message === 'two'
            ? 'La copia del documento quedó guardada en la biblioteca y está disponible para consultar.'
            : message === 'long' || message === 'two-action'
              ? 'Se archivó el documento de la colección. Puedes devolverlo a su ubicación anterior.'
              : message === 'action'
                ? 'Se archivó el elemento'
                : 'Cambios guardados';
    const actionable = message === 'action' || message === 'two-action' || message === 'long';
    return (
        <View style={{ gap: 16 }}>
            <Text>
                Un mensaje a la vez, con la superficie inversa del tema. La acción permanece disponible hasta utilizarla; el cierre es una
                configuración opcional. El resultado de cada operación también permanece aquí.
            </Text>
            <Text accessibilityLiveRegion="polite">{feedback}</Text>
            <Text>Elemento: {archived ? 'Archivado' : 'Disponible'}</Text>
            <View style={{ gap: 12 }}>
                <Text variant="titleMedium">Configuración de la demostración</Text>
                <Text variant="bodySmall">Tiempo de los mensajes sin acción</Text>
                <View style={row}>
                    {[4000, 7000, 10000].map((value) => (
                        <Button
                            key={value}
                            variant={duration === value ? 'tonal' : 'outlined'}
                            onPress={() => setDuration(value)}
                            testID={`md-snackbar-duration-${value}`}
                        >
                            {value / 1000} s
                        </Button>
                    ))}
                </View>
            </View>
            <Button style={{ alignSelf: 'flex-start' }} onPress={() => show('single')} testID="md-snackbar-open">
                Una línea
            </Button>
            <Button style={{ alignSelf: 'flex-start' }} variant="outlined" onPress={() => show('two')} testID="md-snackbar-two">
                Dos líneas
            </Button>
            <Button style={{ alignSelf: 'flex-start' }} variant="outlined" onPress={() => show('action')} testID="md-snackbar-action-open">
                Con Deshacer
            </Button>
            <Button
                style={{ alignSelf: 'flex-start' }}
                variant="outlined"
                onPress={() => show('two-action')}
                testID="md-snackbar-two-action"
            >
                Dos líneas con acción
            </Button>
            <Button style={{ alignSelf: 'flex-start' }} variant="outlined" onPress={() => show('long')} testID="md-snackbar-long">
                Acción en tercera línea
            </Button>
            <Button
                style={{ alignSelf: 'flex-start' }}
                variant="outlined"
                onPress={() => show('dismiss')}
                testID="md-snackbar-dismiss-open"
            >
                Con cierre opcional
            </Button>
            <SnackbarPortal>
                <Snackbar
                    visible={message != null}
                    onDismiss={() => setMessage(null)}
                    duration={duration}
                    inlineFeedback
                    actionOnNewLine={message === 'long'}
                    onIconPress={
                        message === 'dismiss'
                            ? () => {
                                  setMessage(null);
                                  setFeedback('Mensaje cerrado. Los cambios siguen guardados.');
                              }
                            : undefined
                    }
                    action={
                        actionable
                            ? {
                                  label: message === 'long' ? 'Restaurar a la colección original' : 'Deshacer',
                                  onPress: () => {
                                      setArchived(false);
                                      setFeedback('Elemento restaurado a la colección.');
                                      setMessage(null);
                                  },
                              }
                            : undefined
                    }
                    testID="md-snackbar"
                >
                    {text}
                </Snackbar>
            </SnackbarPortal>
        </View>
    );
}
