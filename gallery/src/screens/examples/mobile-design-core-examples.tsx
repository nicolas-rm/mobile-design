import { useRef, useState } from 'react';
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
    Text,
    type CarouselItem,
} from 'mobile-design/react-native';

import { ChipExamples, MenuExamples, CheckboxExamples, RadioExamples, SwitchExamples } from './mobile-design-content-examples';
import { ListExamples } from './mobile-design-list-examples';
import { AppBarExamples } from './mobile-design-appbar-examples';
import { ProgressExamples } from './mobile-design-progress-examples';
import { DialogExamples } from './mobile-design-dialog-examples';
import { BadgeExamples } from './mobile-design-badge-examples';
import { CardExamples } from './mobile-design-card-examples';
import { SheetContentExamples } from './mobile-design-sheet-content-examples';
import { SnackbarExamples } from './mobile-design-snackbar-examples';

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
        image: { uri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&q=85' },
        aspectRatio: 16 / 9,
    },
    {
        id: 'coast',
        title: 'La costa',
        description: 'Sigue la marea',
        image: { uri: 'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=900&q=85' },
        aspectRatio: 9 / 16,
    },
    {
        id: 'desert',
        title: 'El desierto',
        description: 'Cambia de horizonte',
        image: { uri: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=900&q=85' },
        aspectRatio: 1,
    },
    { id: 'mountains', title: 'La montaña', description: 'Una nueva perspectiva', icon: 'terrain', aspectRatio: 3 / 4 },
    { id: 'city', title: 'La ciudad', description: 'Descubre otra ruta', icon: 'city-variant-outline', aspectRatio: 16 / 9 },
];
const verticalTravel = travel.map((item, index) => ({ ...item, aspectRatio: [4 / 3, 16 / 9, 3, 3 / 4, 1][index] }));

export function CoreExamples({ id, onEvent, onOpenAppBarPlayground, onOpenProgressPlayground, onOpenCardPlayground }: Props) {
    const window = useWindowDimensions();
    const [viewer, setViewer] = useState<string | null>(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerFromCollection, setViewerFromCollection] = useState(false);
    const pendingViewer = useRef<CarouselItem | null>(null);
    const restoreCollection = useRef(false);
    const [viewerHeight, setViewerHeight] = useState(1);
    const [viewerIndex, setViewerIndex] = useState(0);
    const [verticalIndex, setVerticalIndex] = useState(0);
    const [verticalSnap, setVerticalSnap] = useState(false);
    const [verticalControls, setVerticalControls] = useState(false);
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
        case 'app-bars':
            return <AppBarExamples onOpenPlayground={onOpenAppBarPlayground} />;
        case 'badges':
            return <BadgeExamples />;
        case 'cards':
            return <CardExamples onEvent={onEvent} onOpenPlayground={onOpenCardPlayground} />;
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
                    <View style={{ alignItems: 'center' }} testID="md-divider-full-group">
                        <List.Item style={{ alignSelf: 'stretch' }} title="Notificaciones" description="Preferencias de avisos" />
                        <Divider testID="md-divider-full" />
                        <List.Item style={{ alignSelf: 'stretch' }} title="Almacenamiento" description="Archivos guardados en este dispositivo" />
                    </View>
                    <Text variant="titleMedium">Inset · elementos relacionados</Text>
                    <View testID="md-divider-inset-group">
                        <List.Item title="Documentos" leading={<Icon source="folder-outline" size={24} />} />
                        <Divider horizontalInset testID="md-divider-inset" />
                        <List.Item title="Imágenes" leading={<Icon source="image-outline" size={24} />} />
                    </View>
                    <Text variant="titleMedium">Inset inicial · margen de 16 dp</Text>
                    <View testID="md-divider-start-group">
                        <List.Item title="Archivos de la colección" leading={<Icon source="folder-outline" size={24} />} />
                        <Divider leftInset testID="md-divider-start" />
                        <List.Item title="Archivos compartidos" leading={<Icon source="folder-outline" size={24} />} />
                    </View>
                    <Text variant="titleMedium">Contenido y acciones</Text>
                    <Card variant="outlined">
                        <Card.Content>
                            <Text variant="titleMedium">Guía de la colección</Text>
                            <Text>Información descriptiva antes de la región de acciones.</Text>
                        </Card.Content>
                        <Divider testID="md-divider-card" />
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
                        <Divider horizontalInset testID="md-divider-supporting" />
                        <View style={row}>
                            {['Fotos', 'Documentos', 'Vídeos'].map((label) => (
                                <Chip
                                    key={label}
                                    variant="filter"
                                    testID={`md-divider-filter-${label}`}
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
                    <View style={{ flexDirection: 'row', minHeight: 112, gap: 16 }} testID="md-divider-vertical-group">
                        <View style={{ flex: 1 }}>
                            <Text variant="titleSmall">Descripción</Text>
                            <Text variant="bodyMedium">Información de la colección.</Text>
                        </View>
                        <Divider orientation="vertical" testID="md-divider-vertical" />
                        <View style={{ flex: 1 }}>
                            <Text variant="titleSmall">Detalles</Text>
                            <Text variant="bodyMedium">12 archivos guardados.</Text>
                        </View>
                    </View>
                    <Text variant="titleMedium">Jerarquía · secciones y contenido relacionado</Text>
                    <View testID="md-divider-hierarchy">
                        <Text variant="titleSmall">Favoritos</Text>
                        <List.Item title="Música" leading={<Icon source="music-note-outline" size={24} />} />
                        <Divider horizontalInset />
                        <List.Item title="Podcasts" leading={<Icon source="podcast" size={24} />} />
                        <Divider />
                        <Text variant="titleSmall">Descargas</Text>
                        <List.Item title="Disponible sin conexión" leading={<Icon source="download-outline" size={24} />} />
                    </View>
                    <Text variant="titleMedium">Elementos repetidos · separación con espacio</Text>
                    <View style={{ gap: 8 }} testID="md-divider-spacing-only">
                        <List.Item title="Imágenes del proyecto" leading={<Icon source="image-outline" size={24} />} />
                        <List.Item title="Documentos del proyecto" leading={<Icon source="file-document-outline" size={24} />} />
                    </View>
                </View>
            );
        case 'lists':
            return <ListExamples onEvent={onEvent} />;
        case 'menus':
            return <MenuExamples onEvent={onEvent} />;
        case 'snackbar':
            return <SnackbarExamples />;
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
                    <View style={{ paddingHorizontal: 16, gap: 12 }}>
                        <Text variant="titleMedium" accessibilityRole="header">
                            Vertical · extensión propia
                        </Text>
                        <Text variant="bodyMedium">
                            Extensión de Mobile Design para galerías con varias fotos y alturas distintas. Desliza arriba o abajo; cada foto
                            conserva su proporción. No es una variante oficial de MD3 ni un visor de pantalla completa.
                        </Text>
                        <Chip.Group accessibilityLabel="Opciones de la galería vertical">
                            <Chip
                                variant="filter"
                                selected={verticalSnap}
                                onPress={() => setVerticalSnap((value) => !value)}
                                testID="md-carousel-vertical-snap"
                            >
                                Encajar fotos
                            </Chip>
                            <Chip
                                variant="filter"
                                selected={verticalControls}
                                onPress={() => setVerticalControls((value) => !value)}
                                testID="md-carousel-vertical-controls"
                            >
                                Mostrar controles
                            </Chip>
                        </Chip.Group>
                        <View style={{ width: '100%', maxWidth: 280, alignSelf: 'center' }}>
                            <Carousel
                                items={verticalTravel}
                                variant="vertical"
                                height={420}
                                contentPadding={0}
                                showText={false}
                                showControls={verticalControls}
                                snapping={verticalSnap}
                                initialIndex={verticalIndex}
                                onIndexChange={setVerticalIndex}
                                onItemPress={openViewer}
                                accessibilityLabel="Galería vertical de destinos"
                                testID="md-carousel-vertical"
                            />
                        </View>
                        <Text variant="bodySmall" accessibilityLiveRegion="polite" testID="md-carousel-vertical-position">
                            Foto {verticalIndex + 1} de {verticalTravel.length}
                        </Text>
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
