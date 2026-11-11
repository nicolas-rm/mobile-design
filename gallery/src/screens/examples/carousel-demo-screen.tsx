import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, I18nManager, ScrollView, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Carousel, type CarouselItem, type CarouselVariant } from 'mobile-design/react-native';

import { Appbar, Button, IconButton, PaperProvider, Surface, Switch, Text, TouchableRipple } from '@/components';
import { useSafeAreaInsets } from '@/hooks/settings';
import { useAppPreferences } from '@/hooks/preferences';
import { useAppTheme } from '@/hooks/theme';
import type { RootStackParamList } from '@/navigations/types';
import { MaterialReferenceLinks } from './material-reference-links';
import { createPaperTheme, usePaperTheme } from '@/theme/paper';

type Props = NativeStackScreenProps<RootStackParamList, 'CarouselDemo'>;

const destinations: readonly CarouselItem[] = [
    {
        id: 'forest',
        title: 'Respira profundo',
        description: 'Entre árboles y caminos',
        icon: 'pine-tree',
        image: { uri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=85' },
    },
    {
        id: 'coast',
        title: 'Sigue la marea',
        description: 'Un momento junto al mar',
        icon: 'waves',
        image: { uri: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1000&q=85' },
    },
    {
        id: 'desert',
        title: 'Cambia de horizonte',
        description: 'La calma del desierto',
        icon: 'weather-sunny',
        image: { uri: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1000&q=85' },
    },
    {
        id: 'mountains',
        title: 'Llega más alto',
        description: 'Una nueva perspectiva',
        icon: 'image-filter-hdr',
        image: { uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=85' },
    },
    {
        id: 'city',
        title: 'Descubre otra ruta',
        description: 'Historias en cada esquina',
        icon: 'city-variant-outline',
        image: { uri: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1000&q=85' },
    },
];

const configurations: { variant: CarouselVariant; title: string; description: string }[] = [
    {
        variant: 'multi-browse',
        title: 'Multi-browse',
        description: 'Máscaras grandes, medianas y pequeñas; el tamaño grande se adapta al espacio disponible. Desliza o usa las flechas.',
    },
    {
        variant: 'uncontained',
        title: 'Uncontained',
        description: 'Tarjetas de tamaño fijo que continúan fuera del borde; desplazamiento libre.',
    },
    {
        variant: 'uncontained-multi-aspect',
        title: 'Uncontained de distintas proporciones',
        description: 'Uncontained multi-aspect ratio: imágenes 16:9, 9:16, 1:1 y 3:4, sin deformarlas.',
    },
    { variant: 'hero', title: 'Hero', description: 'Un elemento protagonista y una pequeña vista previa del siguiente.' },
    {
        variant: 'center-aligned-hero',
        title: 'Hero centrado',
        description: 'El foco se centra al avanzar. Al principio y al final se desplaza hacia el borde para evitar espacios vacíos.',
    },
];
const mixedDestinations = destinations.map((item, index) => ({ ...item, aspectRatio: [16 / 9, 9 / 16, 1, 3 / 4, 4 / 3][index] }));
const verticalDestinations = destinations.map((item, index) => ({ ...item, aspectRatio: [4 / 3, 16 / 9, 3, 3 / 4, 1][index] }));

type CarouselDemoContentProps = Props & {
    onToggleTheme: () => void;
    reduceMotion: boolean;
    setReduceMotion: (value: boolean) => void;
};

function CarouselDemoContent({ navigation, onToggleTheme, reduceMotion, setReduceMotion }: CarouselDemoContentProps) {
    const theme = usePaperTheme();
    const insets = useSafeAreaInsets();
    const systemReduceMotion = useReducedMotion();
    const [snapFree, setSnapFree] = useState(false);
    const [centerMulti, setCenterMulti] = useState(false);
    const [verticalSnap, setVerticalSnap] = useState(false);
    const [verticalControls, setVerticalControls] = useState(false);
    const [verticalIndex, setVerticalIndex] = useState(0);
    const { width: windowWidth } = useWindowDimensions();
    const previewParams = {
        themeMode: theme.dark ? ('dark' as const) : ('light' as const),
        reduceMotion: reduceMotion || systemReduceMotion,
    };
    const openItem = (item: CarouselItem, title = 'Lugares para descubrir') =>
        navigation.navigate('CarouselViewer', { ...previewParams, title, itemId: item.id });
    const openCollection = (title: string) => navigation.navigate('CarouselCollection', { ...previewParams, title });

    return (
        <View style={{ backgroundColor: theme.colors.background, flex: 1 }} testID="carousel-demo-screen">
            <StatusBar style={theme.dark ? 'light' : 'dark'} />
            <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="Carrusel" />
                <IconButton
                    accessibilityLabel={theme.dark ? 'Ver demo en tema claro' : 'Ver demo en tema oscuro'}
                    icon={theme.dark ? 'weather-sunny' : 'weather-night'}
                    onPress={onToggleTheme}
                    testID="carousel-demo-theme"
                />
            </Appbar.Header>
            <ScrollView
                contentContainerStyle={{ gap: 24, paddingBottom: insets.useBottom + 24, paddingHorizontal: 16, paddingTop: 16 }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <View style={{ gap: 8 }}>
                    <Text variant="titleLarge">Diseños y comportamiento</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodyMedium">
                        Los seis diseños de la referencia y una extensión vertical propia de Mobile Design.
                    </Text>
                </View>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: 16 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text variant="titleMedium">Movimiento reducido</Text>
                        <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodySmall">
                            {systemReduceMotion
                                ? 'Activado por el sistema. Usa tamaños fijos y elimina el paralaje.'
                                : reduceMotion
                                  ? 'Activado: tamaños fijos, sin paralaje.'
                                  : 'Desactivado: máscaras y paralaje al desplazar.'}
                        </Text>
                    </View>
                    <Switch
                        accessibilityLabel="Movimiento reducido en la demo"
                        disabled={systemReduceMotion}
                        onValueChange={setReduceMotion}
                        testID="carousel-demo-reduce-motion"
                        value={reduceMotion || systemReduceMotion}
                    />
                </View>
                {configurations.map(({ variant, title, description }) => (
                    <View key={variant} style={{ gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Text accessibilityRole="header" style={{ flex: 1 }} variant="titleLarge">
                                {title}
                            </Text>
                            <IconButton
                                accessibilityLabel={`Ver todos: ${title}`}
                                icon={I18nManager.isRTL ? 'arrow-left' : 'arrow-right'}
                                onPress={() => openCollection(title)}
                                style={{ width: 48, height: 48, margin: 0 }}
                                testID={`carousel-show-all-${variant}`}
                            />
                        </View>
                        <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodyMedium">
                            {description}
                        </Text>
                        {variant === 'multi-browse' ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                <Text style={{ flex: 1 }}>Alineación centrada</Text>
                                <Switch
                                    accessibilityLabel="Centrar el carrusel Multi-browse"
                                    onValueChange={setCenterMulti}
                                    testID="carousel-center-multi"
                                    value={centerMulti}
                                />
                            </View>
                        ) : null}
                        <Carousel
                            accessibilityLabel={title}
                            alignment={variant === 'multi-browse' && centerMulti ? 'center' : 'start'}
                            contentPadding={16}
                            height={variant === 'uncontained-multi-aspect' ? Math.min(240, (Math.max(1, windowWidth - 32) * 9) / 16) : 240}
                            items={variant === 'uncontained-multi-aspect' ? mixedDestinations : destinations}
                            onItemPress={(item) => openItem(item, title)}
                            showText={false}
                            snapping={variant.startsWith('uncontained') ? snapFree : undefined}
                            style={{ marginHorizontal: -16 }}
                            testID={`demo-carousel-${variant}`}
                            variant={variant}
                        />
                    </View>
                ))}
                <View style={{ gap: 12 }}>
                    <Text accessibilityRole="header" variant="titleLarge">
                        Pantalla completa
                    </Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        Un elemento por pantalla, bordes rectos y 16 dp entre elementos. En horizontal se adapta al diseño Hero.
                    </Text>
                    <Image source={destinations[0].image} contentFit="cover" style={{ height: 200, borderRadius: 28 }} />
                    <Button
                        icon="fullscreen"
                        onPress={() =>
                            navigation.navigate('CarouselViewer', {
                                ...previewParams,
                                title: 'Pantalla completa',
                                itemId: destinations[0].id,
                            })
                        }
                        testID="carousel-open-full-screen"
                    >
                        Abrir carrusel vertical
                    </Button>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <Text style={{ flex: 1 }}>Encajar tarjetas en las dos variantes Uncontained</Text>
                    <Switch accessibilityLabel="Snap en carruseles Uncontained" value={snapFree} onValueChange={setSnapFree} />
                </View>
                <View style={{ gap: 12 }}>
                    <Text accessibilityRole="header" variant="titleLarge">
                        Vertical · extensión propia
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Galería desplazable con varias fotos y alturas según su proporción. Es una extensión de Mobile Design, independiente
                        del diseño Full-screen de MD3.
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <Text style={{ flex: 1 }}>Encajar fotos al soltar</Text>
                        <Switch
                            accessibilityLabel="Encajar fotos de la galería vertical"
                            value={verticalSnap}
                            onValueChange={setVerticalSnap}
                            testID="carousel-vertical-snap"
                        />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <Text style={{ flex: 1 }}>Mostrar controles arriba y abajo</Text>
                        <Switch
                            accessibilityLabel="Mostrar controles de la galería vertical"
                            value={verticalControls}
                            onValueChange={setVerticalControls}
                            testID="carousel-vertical-controls"
                        />
                    </View>
                    <View style={{ width: '100%', maxWidth: 280, alignSelf: 'center' }}>
                        <Carousel
                            accessibilityLabel="Galería vertical de destinos"
                            variant="vertical"
                            height={420}
                            contentPadding={0}
                            items={verticalDestinations}
                            showText={false}
                            showControls={verticalControls}
                            snapping={verticalSnap}
                            initialIndex={verticalIndex}
                            onIndexChange={setVerticalIndex}
                            onItemPress={(item) => openItem(item, 'Galería vertical')}
                            testID="demo-carousel-vertical"
                        />
                    </View>
                    <Text variant="bodySmall" accessibilityLiveRegion="polite" testID="carousel-vertical-position">
                        Foto {verticalIndex + 1} de {verticalDestinations.length}
                    </Text>
                </View>
                <View style={{ gap: 12 }}>
                    <Text variant="titleMedium">Texto sobre las imágenes</Text>
                    <Carousel
                        height={240}
                        items={destinations}
                        variant="hero"
                        onItemPress={(item) => openItem(item)}
                        testID="carousel-text-overlay"
                    />
                    <Text variant="titleMedium">Texto debajo de las imágenes</Text>
                    <Carousel
                        contentPadding={16}
                        height={300}
                        preferredItemWidth={240}
                        items={destinations}
                        variant="uncontained"
                        textPlacement="below"
                        onItemPress={(item) => openItem(item)}
                        style={{ marginHorizontal: -16 }}
                        testID="carousel-text-below"
                    />
                    <Carousel
                        accessibilityLabel="Lugares para descubrir"
                        height={160}
                        items={destinations}
                        onItemPress={(item) => openItem(item)}
                        showText={false}
                        showControls={false}
                        testID="carousel-images-only"
                    />
                    <Button
                        contentStyle={{ minHeight: 48, paddingHorizontal: 4 }}
                        labelStyle={{ marginHorizontal: 0 }}
                        mode="text"
                        onPress={() => openCollection('Lugares para descubrir')}
                        style={{ alignSelf: 'flex-start' }}
                        testID="carousel-show-all-no-header"
                    >
                        Ver todos
                    </Button>
                    <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodySmall">
                        Sin encabezado, el acceso a la colección se coloca debajo del carrusel.
                    </Text>
                    <Text variant="titleMedium">Estado deshabilitado</Text>
                    <Carousel
                        height={160}
                        items={destinations.slice(0, 3)}
                        disabled
                        showControls={false}
                        onItemPress={(item) => openItem(item)}
                        testID="carousel-disabled"
                    />
                    <Text variant="titleMedium">También funciona sin imágenes</Text>
                    <Carousel
                        accessibilityLabel="Colección sin imágenes"
                        height={180}
                        items={destinations.slice(0, 3).map(({ image, ...item }) => item)}
                        showControls={false}
                        testID="fallback-carousel"
                        variant="hero"
                    />
                </View>
                <MaterialReferenceLinks component="carousel" />
            </ScrollView>
        </View>
    );
}

export function CarouselDemoScreen(props: Props) {
    const { themeMode } = useAppTheme();
    const { effectiveReduceMotionEnabled, rippleEnabled, systemReduceMotionEnabled } = useAppPreferences();
    const [mode, setMode] = useState(themeMode);
    const [reduceMotion, setReduceMotion] = useState(effectiveReduceMotionEnabled);
    const effectiveReduceMotion = reduceMotion || systemReduceMotionEnabled;
    const theme = useMemo(() => createPaperTheme(mode, effectiveReduceMotion), [mode, effectiveReduceMotion]);

    return (
        <PaperProvider reduceMotion={effectiveReduceMotion ? 'on' : 'auto'} settings={{ rippleEffectEnabled: rippleEnabled }} theme={theme}>
            <CarouselDemoContent
                {...props}
                onToggleTheme={() => setMode((value) => (value === 'dark' ? 'light' : 'dark'))}
                reduceMotion={effectiveReduceMotion}
                setReduceMotion={setReduceMotion}
            />
        </PaperProvider>
    );
}

type CollectionProps = NativeStackScreenProps<RootStackParamList, 'CarouselCollection'>;
type ViewerProps = NativeStackScreenProps<RootStackParamList, 'CarouselViewer'>;

function CarouselPageTheme({ params, children }: { params: RootStackParamList['CarouselCollection']; children: ReactNode }) {
    const { rippleEnabled, systemReduceMotionEnabled } = useAppPreferences();
    const reduceMotion = params.reduceMotion || systemReduceMotionEnabled;
    const theme = useMemo(() => createPaperTheme(params.themeMode, reduceMotion), [params.themeMode, reduceMotion]);
    const settings = useMemo(() => ({ rippleEffectEnabled: rippleEnabled }), [rippleEnabled]);
    return (
        <PaperProvider reduceMotion={reduceMotion ? 'on' : 'auto'} settings={settings} theme={theme}>
            {children}
        </PaperProvider>
    );
}

function CarouselCollectionContent({ route, navigation }: CollectionProps) {
    const theme = usePaperTheme();
    const insets = useSafeAreaInsets();
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }} testID="carousel-all-items">
            <StatusBar style={theme.dark ? 'light' : 'dark'} />
            <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} testID="carousel-collection-back" />
                <Appbar.Content title={route.params.title} />
            </Appbar.Header>
            <FlatList
                data={destinations}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: insets.bottom + 24 }}
                renderItem={({ item, index }) => (
                    <TouchableRipple
                        accessibilityLabel={`${item.title}. ${item.description}. ${index + 1} de ${destinations.length}`}
                        accessibilityRole="button"
                        onPress={() => navigation.navigate('CarouselViewer', { ...route.params, itemId: item.id })}
                        style={{ borderRadius: theme.shapes.corner.extraLarge, overflow: 'hidden' }}
                        testID={`carousel-collection-item-${item.id}`}
                    >
                        <View style={{ gap: 12, backgroundColor: theme.colors.surfaceContainer }}>
                            <Image accessible={false} source={item.image} contentFit="cover" style={{ height: 240, width: '100%' }} />
                            <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 4 }}>
                                <Text variant="titleLarge">{item.title}</Text>
                                <Text variant="bodyLarge">{item.description}</Text>
                            </View>
                        </View>
                    </TouchableRipple>
                )}
                testID="carousel-collection-list"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            />
        </View>
    );
}

/** The collection uses the app's native stack so Back restores the source carousel and its scroll. */
export function CarouselCollectionScreen(props: CollectionProps) {
    return (
        <CarouselPageTheme params={props.route.params}>
            <CarouselCollectionContent {...props} />
        </CarouselPageTheme>
    );
}

function CarouselViewerContent({ navigation, route }: ViewerProps) {
    const theme = usePaperTheme();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const [height, setHeight] = useState(0);
    const initialIndex = Math.max(
        0,
        destinations.findIndex((item) => item.id === route.params.itemId)
    );
    const [index, setIndex] = useState(initialIndex);
    // Material permits full-screen carousels only on compact/medium windows in portrait.
    const fullScreen = window.width < 840 && window.height > window.width;
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }} testID="carousel-viewer-screen">
            <StatusBar style={theme.dark ? 'light' : 'dark'} />
            <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} testID="carousel-viewer-back" />
                <Appbar.Content title={route.params.title} />
                <Text
                    accessibilityLiveRegion="polite"
                    style={{ paddingEnd: 16, color: theme.colors.onSurfaceVariant }}
                    testID="carousel-viewer-position"
                >
                    {index + 1} / {destinations.length}
                </Text>
            </Appbar.Header>
            <View onLayout={(event) => setHeight(event.nativeEvent.layout.height)} style={{ flex: 1 }}>
                {height > 0 ? (
                    fullScreen ? (
                        <Carousel
                            accessibilityLabel={route.params.title}
                            height={height}
                            initialIndex={index}
                            items={destinations}
                            onIndexChange={setIndex}
                            showControls={false}
                            testID="full-screen-carousel"
                            textInsetBottom={insets.bottom}
                            variant="full-screen"
                        />
                    ) : (
                        <ScrollView
                            contentContainerStyle={{ paddingVertical: 16, paddingBottom: insets.bottom + 24, gap: 16 }}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                        >
                            <Carousel
                                accessibilityLabel={route.params.title}
                                contentPadding={16}
                                height={Math.min(280, Math.max(120, height / 2))}
                                initialIndex={index}
                                items={destinations}
                                onIndexChange={setIndex}
                                testID="full-screen-carousel"
                                variant="hero"
                            />
                            <Text style={{ paddingHorizontal: 16, color: theme.colors.onSurfaceVariant }} variant="bodyMedium">
                                {window.width >= 840
                                    ? 'En ventanas amplias se utiliza Hero para conservar las proporciones de las imágenes.'
                                    : 'En horizontal se utiliza Hero. Gira a vertical para ver una imagen por pantalla.'}
                            </Text>
                        </ScrollView>
                    )
                ) : null}
            </View>
        </View>
    );
}

/** Opens the selected item directly, rather than replacing content with an alert dialog. */
export function CarouselViewerScreen(props: ViewerProps) {
    return (
        <CarouselPageTheme params={props.route.params}>
            <CarouselViewerContent {...props} />
        </CarouselPageTheme>
    );
}
