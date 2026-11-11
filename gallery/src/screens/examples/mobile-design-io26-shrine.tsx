import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { ClipPath, Defs, G, Image as SvgImage, Rect } from 'react-native-svg';
import {
    Button,
    Card,
    Carousel,
    Chip,
    Dialog,
    Icon,
    IconButton,
    List,
    NavigationBar,
    NavigationRail,
    Text,
    ThemeProvider,
    TopAppBar,
    TouchableRipple,
    useMobileTheme,
    type CarouselItem,
} from 'mobile-design/react-native';

const categories = [
    { key: 'featured', label: 'Featured', icon: 'diamond' },
    { key: 'apartment', label: 'Apartment', icon: 'dresser' },
    { key: 'accessories', label: 'Accessories', icon: 'styler' },
    { key: 'apparel', label: 'Apparel', icon: 'apparel' },
    { key: 'objects', label: 'Objects', icon: 'flare' },
];
const colors = [
    { key: 'black', label: 'Black', value: '#101010' },
    { key: 'sand', label: 'Sand', value: '#F7D7A8' },
    { key: 'blue', label: 'Cornflower', value: '#A4E4E5' },
] as const;
type BasketItem = { key: string; size: string; color: string; quantity: number };
const photoViews = [
    [1045, 230, 395, 545],
    [1045, 790, 395, 218],
    [1045, 1018, 395, 120],
];
// The article uses a separately framed photo for the compact hero. The wide
// portrait's cover crop zooms into the model instead of showing the whole blouse.
const compactFrontPhoto = [356, 363, 363, 234];
const photoItems: readonly CarouselItem[] = [
    { id: 'front', title: 'Flow Shirt Blouse · front', aspectRatio: photoViews[0][2] / photoViews[0][3] },
    { id: 'detail', title: 'Pinstripe and button detail', aspectRatio: photoViews[1][2] / photoViews[1][3] },
    { id: 'alternate', title: 'Alternate blouse view', aspectRatio: photoViews[2][2] / photoViews[2][3] },
];
const renderProductPhoto = ({ index }: { index: number }) => <ProductPhoto index={index} compact />;
const renderPortraitPhoto = ({ index }: { index: number }) => <ProductPhoto index={index} />;
const collectionPreviews: Record<string, { title: string; icon: string; price: string }[]> = {
    apartment: [
        { title: 'Ceramic planter', icon: 'potted_plant', price: '$28' },
        { title: 'Reading lamp', icon: 'light', price: '$95' },
    ],
    accessories: [
        { title: 'Canvas tote', icon: 'shopping_bag', price: '$48' },
        { title: 'Everyday watch', icon: 'watch', price: '$120' },
    ],
    objects: [
        { title: 'Sculptural vase', icon: 'vase', price: '$64' },
        { title: 'Desk objects', icon: 'category', price: '$32' },
    ],
};

function ProductPhoto({ index, compact = false }: { index: number; compact?: boolean }) {
    const viewport = compact && index === 0 ? compactFrontPhoto : photoViews[index];
    const clip = `shrine-photo-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    return (
        <Svg width="100%" height="100%" viewBox={viewport.join(' ')} preserveAspectRatio="xMidYMin slice" accessible={false}>
            <Defs>
                <ClipPath id={clip}>
                    <Rect x={viewport[0]} y={viewport[1]} width={viewport[2]} height={viewport[3]} />
                </ClipPath>
            </Defs>
            <G clipPath={`url(#${clip})`}>
                <SvgImage href={require('./assets/io26/shrine-reference.png')} width={2203} height={1344} x={0} y={0} />
            </G>
        </Svg>
    );
}

/** Shrine's product detail from the article hero. Selection/cart stay local and survive reflow. */
export function ShrineProductExample({ onBack }: { onBack?: () => void }) {
    const theme = useMobileTheme(),
        insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const safeWidth = width - insets.left - insets.right;
    const safeHeight = height - insets.top - insets.bottom;
    const wide = safeWidth >= 840 || (width > height && safeWidth >= 600);
    const shortWindow = height < 600;
    const pagePadding = wide && !shortWindow ? 24 : 16;
    const columnGap = shortWindow ? 16 : 24;
    const [bodyMeasurement, setBodyMeasurement] = useState<{
        windowWidth: number;
        windowHeight: number;
        width: number;
        height: number;
    }>();
    const measured = bodyMeasurement?.windowWidth === width && bodyMeasurement.windowHeight === height;
    const bodyWidth = measured ? bodyMeasurement.width : safeWidth - (wide ? 96 : 0);
    const bodyHeight = measured ? bodyMeasurement.height : safeHeight;
    const availableColumnsWidth = Math.max(0, bodyWidth - pagePadding * 2 - columnGap);
    // The shared vertical variant owns the natural photo heights and its own
    // scroll viewport; do not shrink the whole collection to make it fit.
    const galleryWidth = Math.max(1, availableColumnsWidth * 0.48);
    const galleryHeight = Math.max(1, bodyHeight - pagePadding * 2);
    const productWidth = wide ? Math.max(0, availableColumnsWidth - galleryWidth) : undefined;
    const compactContentWidth = Math.min(560, Math.max(0, bodyWidth - 32));
    const [basketHeight, setBasketHeight] = useState(0);
    const [navigationHeight, setNavigationHeight] = useState(0);
    const [size, setSize] = useState('06');
    const [color, setColor] = useState('sand');
    const [favorite, setFavorite] = useState(false);
    const [details, setDetails] = useState(false);
    const [reviewsOverride, setReviewsOverride] = useState<boolean>();
    const reviews = reviewsOverride ?? wide;
    const [fullReview, setFullReview] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);
    const [section, setSection] = useState('featured');
    const [showCollection, setShowCollection] = useState(false);
    const backLabel = showCollection
        ? 'Volver al producto destacado'
        : section !== 'featured'
          ? 'Volver a la colección'
          : 'Volver a Mobile Design';
    const [basket, setBasket] = useState<BasketItem[]>([]);
    const [basketOpen, setBasketOpen] = useState(false);
    const page = useRef<ScrollViewInstance>(null);
    const sizesScroll = useRef<ScrollViewInstance>(null);
    const sizeLayouts = useRef(new Map<string, { x: number; width: number }>());
    const sizeViewport = useRef(0);
    const revealSize = useCallback(() => {
        const frame = sizeLayouts.current.get(size),
            viewport = sizeViewport.current;
        if (!frame || !viewport) return;
        const next = Math.max(0, frame.x + frame.width - viewport);
        sizesScroll.current?.scrollTo({ x: next, animated: false });
    }, [size]);
    useEffect(revealSize, [revealSize, width]);
    const count = basket.reduce((sum, item) => sum + item.quantity, 0);
    const scrollBottomPadding = count ? basketHeight + 24 : 16;
    const buy = () => {
        const key = `${size}-${color}`;
        setBasket((current) =>
            current.some((item) => item.key === key)
                ? current.map((item) => (item.key === key ? { ...item, quantity: item.quantity + 1 } : item))
                : [...current, { key, size, color, quantity: 1 }]
        );
    };
    const navigate = (key: string) => {
        setSection(key);
        setShowCollection(key !== 'featured');
        page.current?.scrollTo({ y: 0, animated: theme.animation.scale !== 0 });
    };
    const back = () => {
        if (showCollection) {
            setSection('featured');
            setShowCollection(false);
        } else if (section !== 'featured') setShowCollection(true);
        else onBack?.();
    };
    const accordionTheme = useMemo(() => ({ ...theme, colors: { ...theme.colors, surface: theme.colors.surfaceContainerLow } }), [theme]);
    const brandTheme = useMemo(
        () => ({
            ...theme,
            colors: {
                ...theme.colors,
                secondaryContainer: theme.colors.tertiaryContainer,
                onSecondaryContainer: theme.colors.onTertiaryContainer,
            },
        }),
        [theme]
    );
    const pictures = wide ? (
        <View
            style={{ width: galleryWidth, flexShrink: 0 }}
            accessibilityValue={{
                min: 1,
                max: photoItems.length,
                now: photoIndex + 1,
                text: `Foto ${photoIndex + 1} de ${photoItems.length}`,
            }}
            testID="md-io26-shrine-photos-wide"
        >
            <Carousel
                items={photoItems}
                variant="vertical"
                height={galleryHeight}
                contentPadding={0}
                showText={false}
                initialIndex={photoIndex}
                onIndexChange={setPhotoIndex}
                renderItemContent={renderPortraitPhoto}
                accessibilityLabel="Flow Shirt Blouse product photos"
                testID="md-io26-shrine-photos-wide-carousel"
            />
        </View>
    ) : (
        <Carousel
            items={photoItems}
            variant="hero"
            height={compactContentWidth * 0.56}
            contentPadding={0}
            showText={false}
            initialIndex={photoIndex}
            onIndexChange={setPhotoIndex}
            renderItemContent={renderProductPhoto}
            accessibilityLabel="Flow Shirt Blouse product photos"
            testID="md-io26-shrine-photos-compact"
        />
    );
    const breadcrumb = (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Featured › LMBRJK › Tops
        </Text>
    );
    const product = (
        <View
            style={{ width: productWidth, flexShrink: 0, minWidth: 0, gap: wide && shortWindow ? 8 : 12 }}
            testID="md-io26-shrine-options"
        >
            {wide ? (
                <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ flex: 1 }}>{breadcrumb}</View>
                        <Text variant="titleLarge">$240</Text>
                    </View>
                    <Text variant={shortWindow ? 'headlineSmall' : 'headlineLarge'} accessibilityRole="header">
                        Flow Shirt Blouse
                    </Text>
                </>
            ) : null}
            <Text variant="bodyMedium">
                Pinstriped cornflower blue cotton blouse takes you on a walk to the park or just down the hall.
            </Text>
            <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                accessibilityRole="radiogroup"
                accessibilityLabel="Size"
            >
                <Text variant="bodyMedium">Size</Text>
                <ScrollView
                    ref={sizesScroll}
                    horizontal
                    style={{ flex: 1 }}
                    contentContainerStyle={{ gap: 4, alignItems: 'center' }}
                    showsHorizontalScrollIndicator={false}
                    accessibilityLabel="Size"
                    onLayout={({ nativeEvent }) => {
                        sizeViewport.current = nativeEvent.layout.width;
                        revealSize();
                    }}
                    onContentSizeChange={revealSize}
                    testID="md-io26-shrine-sizes-scroll"
                >
                    <Chip.Group style={{ flexWrap: 'nowrap', gap: 4 }}>
                        {['00', '02', '04', '06', '08', '10', '12'].map((value) => (
                            <View
                                key={value}
                                onLayout={({ nativeEvent }) => {
                                    sizeLayouts.current.set(value, nativeEvent.layout);
                                    revealSize();
                                }}
                            >
                                <Chip
                                    variant="filter"
                                    showSelectedCheck={false}
                                    selected={size === value}
                                    style={{ borderRadius: wide && size !== value ? 16 : 8 }}
                                    selectedColor={size === value ? theme.colors.onTertiaryContainer : theme.colors.onSurfaceVariant}
                                    onPress={() => setSize(value)}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: size === value }}
                                    accessibilityLabel={`Size ${value}`}
                                    testID={`md-io26-shrine-size-${value}`}
                                >
                                    {value}
                                </Chip>
                            </View>
                        ))}
                    </Chip.Group>
                </ScrollView>
            </View>
            <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}
                accessibilityRole="radiogroup"
                accessibilityLabel="Color de la blusa"
            >
                <Text variant="bodyMedium" style={{ marginEnd: 8 }}>
                    Color
                </Text>
                {colors.map((option) => {
                    const selected = color === option.key;
                    const faceWidth = 40;
                    const faceHeight = selected ? 32 : 20;
                    return (
                        <View key={option.key} style={{ width: 48, height: 48, justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableRipple
                                key={option.key}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: selected }}
                                accessibilityLabel={option.label}
                                onPress={() => setColor(option.key)}
                                style={{
                                    width: faceWidth,
                                    height: faceHeight,
                                    borderRadius: selected ? 6 : 10,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: selected ? 2 : 0,
                                    borderColor: theme.colors.outline,
                                    backgroundColor: option.value,
                                    overflow: 'hidden',
                                }}
                                borderless={false}
                                rippleColor={theme.colors.stateLayerPressed}
                                hitSlop={{
                                    top: (48 - faceHeight) / 2,
                                    bottom: (48 - faceHeight) / 2,
                                    left: (48 - faceWidth) / 2,
                                    right: (48 - faceWidth) / 2,
                                }}
                                testID={`md-io26-shrine-color-${option.key}`}
                            >
                                <View pointerEvents="none" style={{ flex: 1 }} />
                            </TouchableRipple>
                        </View>
                    );
                })}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Button
                    buttonColor={theme.colors.tertiaryContainer}
                    textColor={theme.colors.onTertiaryContainer}
                    shape="square"
                    style={{ flex: 1 }}
                    onPress={buy}
                    testID="md-io26-shrine-add"
                >
                    Add to shopping basket
                </Button>
                <IconButton
                    icon={favorite ? 'favorite_fill1' : 'favorite'}
                    mode="contained-tonal"
                    shape="square"
                    selected={favorite}
                    containerColor={theme.colors.tertiaryContainer}
                    iconColor={theme.colors.onTertiaryContainer}
                    accessibilityLabel={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                    onPress={() => setFavorite((value) => !value)}
                    testID="md-io26-shrine-favorite"
                />
            </View>
            <ThemeProvider theme={accordionTheme}>
                <View style={{ gap: 8 }}>
                    <List.Accordion
                        title={<Text variant="titleSmall">More details</Text>}
                        expanded={details}
                        onPress={() => setDetails((value) => !value)}
                        testID="md-io26-shrine-details"
                    >
                        <Text variant="bodyMedium" style={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 }}>
                            Relaxed fit · 100% cotton{`\n`}Button front · Machine wash cold{`\n`}Size {size} ·{' '}
                            {colors.find((item) => item.key === color)?.label}
                        </Text>
                    </List.Accordion>
                    <List.Accordion
                        title={<Text variant="titleSmall">Ratings and Reviews</Text>}
                        expanded={reviews}
                        onPress={() => setReviewsOverride(!reviews)}
                        testID="md-io26-shrine-reviews"
                    >
                        <View style={{ paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4, gap: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                                <View
                                    accessible
                                    accessibilityRole="image"
                                    accessibilityLabel="4 de 5 estrellas"
                                    style={{ flexDirection: 'row' }}
                                >
                                    {[0, 1, 2, 3, 4].map((star) => (
                                        <Icon key={star} source={star < 4 ? 'star_fill1' : 'star-outline'} size={12} />
                                    ))}
                                </View>
                                <Text variant="labelSmall">Perfect transition piece</Text>
                            </View>
                            <Text variant="bodySmall" numberOfLines={fullReview ? undefined : 4}>
                                I’ve been living in this blouse since it arrived. The cornflower color is stunning in person.
                                {fullReview
                                    ? ' The light cotton is comfortable throughout the day, and the relaxed fit makes it easy to wear with my favorite pieces.'
                                    : ''}
                            </Text>
                            <Button
                                variant="text"
                                size="extra-small"
                                onPress={() => setFullReview((value) => !value)}
                                style={{ alignSelf: 'flex-start' }}
                                testID="md-io26-shrine-review-more"
                            >
                                {fullReview ? 'Show less' : 'Read more'}
                            </Button>
                        </View>
                    </List.Accordion>
                </View>
            </ThemeProvider>
        </View>
    );
    const collection = (
        <View style={{ gap: 16 }} testID={`md-io26-shrine-collection-${section}`}>
            <Text variant="headlineMedium">{categories.find((item) => item.key === section)?.label}</Text>
            {section === 'apparel' ? (
                <Card
                    variant="filled"
                    onPress={() => setShowCollection(false)}
                    accessibilityLabel="Abrir Flow Shirt Blouse"
                    testID="md-io26-shrine-collection-blouse"
                >
                    <View style={{ height: 240, borderRadius: 12, overflow: 'hidden' }}>
                        <ProductPhoto index={0} />
                    </View>
                    <Card.Content style={{ paddingVertical: 16 }}>
                        <Text variant="titleMedium">Flow Shirt Blouse</Text>
                        <Text>$240</Text>
                    </Card.Content>
                </Card>
            ) : (
                (collectionPreviews[section] ?? []).map((item) => (
                    <Card key={item.title} variant="filled">
                        <Card.Content style={{ paddingVertical: 24, gap: 16 }}>
                            <Icon source={item.icon} size={48} />
                            <Text variant="titleMedium">{item.title}</Text>
                            <Text>{item.price}</Text>
                        </Card.Content>
                    </Card>
                ))
            )}
        </View>
    );
    return (
        <ThemeProvider theme={brandTheme}>
            <View
                style={{
                    flex: 1,
                    backgroundColor: theme.colors.surface,
                    paddingTop: wide ? insets.top : 0,
                    paddingLeft: wide ? insets.left : 0,
                    paddingRight: wide ? insets.right : 0,
                    paddingBottom: wide ? insets.bottom : 0,
                }}
                testID="md-io26-shrine"
            >
                {!wide ? (
                    <TopAppBar
                        title={
                            <Text variant="titleLarge" numberOfLines={1} accessibilityRole="header">
                                {showCollection
                                    ? (categories.find((item) => item.key === section)?.label ?? 'Shrine')
                                    : 'Flow Shirt Blouse'}
                            </Text>
                        }
                        leading={
                            <IconButton
                                icon="arrow_back"
                                mode="contained-tonal"
                                sizeClass="extra-small"
                                containerColor={theme.colors.surfaceContainerLow}
                                iconColor={theme.colors.onSurface}
                                accessibilityLabel={backLabel}
                                onPress={back}
                                testID="md-io26-appbar-navigation"
                            />
                        }
                        trailing={
                            showCollection ? undefined : (
                                <View style={{ paddingEnd: 12 }}>
                                    <Text variant="titleLarge" testID="md-io26-shrine-price">
                                        $240
                                    </Text>
                                </View>
                            )
                        }
                        style={{ maxWidth: 592, alignSelf: 'center' }}
                        testID="md-io26-appbar"
                    />
                ) : null}
                <View style={{ flex: 1, flexDirection: 'row' }}>
                    {wide ? (
                        <View style={{ width: 96, flexShrink: 0 }}>
                            {shortWindow ? (
                                <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                                    <IconButton
                                        icon="diamond"
                                        size={32}
                                        iconColor={theme.colors.tertiary}
                                        onPress={back}
                                        accessibilityLabel={backLabel}
                                        testID="md-io26-shrine-home"
                                    />
                                </View>
                            ) : null}
                            <NavigationRail
                                items={categories}
                                value={section}
                                onValueChange={navigate}
                                alignment="center"
                                header={
                                    shortWindow ? undefined : (
                                        <IconButton
                                            icon="diamond"
                                            size={32}
                                            iconColor={theme.colors.tertiary}
                                            onPress={back}
                                            accessibilityLabel={backLabel}
                                            testID="md-io26-shrine-home"
                                        />
                                    )
                                }
                                style={{ flex: 1, paddingTop: shortWindow ? 0 : 16, paddingBottom: 0 }}
                                testID="md-io26-shrine-rail"
                            />
                        </View>
                    ) : null}
                    <View
                        style={{ flex: 1, minWidth: 0 }}
                        onLayout={({ nativeEvent }) => setBodyMeasurement({ windowWidth: width, windowHeight: height, ...nativeEvent.layout })}
                        testID="md-io26-shrine-body"
                    >
                        {wide && !showCollection ? (
                            <View style={{ flex: 1, flexDirection: 'row', padding: pagePadding, gap: columnGap }}>
                                {pictures}
                                <ScrollView
                                    key="wide-product"
                                    ref={page}
                                    style={{ width: productWidth, flexGrow: 0 }}
                                    contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
                                    testID="md-io26-shrine-scroll"
                                >
                                    {product}
                                </ScrollView>
                            </View>
                        ) : (
                            <ScrollView
                                key={wide ? 'wide-collection' : 'compact'}
                                ref={page}
                                contentContainerStyle={{ padding: pagePadding, paddingBottom: scrollBottomPadding, alignItems: 'center' }}
                                testID="md-io26-shrine-scroll"
                            >
                                <View style={{ width: '100%', maxWidth: wide ? undefined : 560, gap: 16 }}>
                                    {showCollection ? (
                                        collection
                                    ) : (
                                        <>
                                            {breadcrumb}
                                            <View style={{ gap: 16 }}>
                                                {pictures}
                                                {product}
                                            </View>
                                        </>
                                    )}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
                {count ? (
                    <View
                        pointerEvents="box-none"
                        onLayout={({ nativeEvent }) => setBasketHeight(nativeEvent.layout.height)}
                        style={{
                            position: 'absolute',
                            bottom: wide ? insets.bottom + 16 : navigationHeight + 8,
                            left: insets.left + 16,
                            right: insets.right + pagePadding,
                            alignItems: wide ? 'flex-end' : 'center',
                        }}
                    >
                        <Card
                            variant="elevated"
                            elevation={2}
                            onPress={() => setBasketOpen(true)}
                            accessibilityLabel={`Shopping basket, ${count} ${count === 1 ? 'item' : 'items'}, $${count * 240}`}
                            testID="md-io26-shrine-basket"
                            style={{
                                borderRadius: 12,
                                backgroundColor: theme.colors.tertiaryContainer,
                            }}
                        >
                            <View
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}
                            >
                                <Icon source="shopping_cart" size={24} color={theme.colors.onTertiaryContainer} />
                                <View style={{ width: 24, height: 32, borderRadius: 4, overflow: 'hidden' }}>
                                    <ProductPhoto index={0} />
                                </View>
                                <Text
                                    variant="labelLarge"
                                    accessibilityLiveRegion="polite"
                                    style={{ color: theme.colors.onTertiaryContainer }}
                                >
                                    +{count}
                                </Text>
                            </View>
                        </Card>
                    </View>
                ) : null}
                {!wide ? (
                    <View onLayout={({ nativeEvent }) => setNavigationHeight(nativeEvent.layout.height)}>
                        <NavigationBar
                            items={categories}
                            value={section}
                            onValueChange={navigate}
                            variant="short"
                            accessibilityLabel="Shrine categories"
                            testID="md-io26-shrine-bar"
                        />
                    </View>
                ) : null}
                <Dialog
                    visible={basketOpen}
                    onDismiss={() => setBasketOpen(false)}
                    accessibilityLabel="Cesta de Shrine"
                    testID="md-io26-shrine-basket-dialog"
                >
                    <Dialog.Title>Shopping basket</Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView style={{ maxHeight: 320 }}>
                            {basket.map((item) => (
                                <List.Item
                                    key={item.key}
                                    title="Flow Shirt Blouse"
                                    description={`Size ${item.size} · ${colors.find((option) => option.key === item.color)?.label} · ${item.quantity} × $240`}
                                    multiAction
                                    trailing={
                                        <IconButton
                                            icon="delete"
                                            accessibilityLabel={`Quitar talla ${item.size}, ${item.color}`}
                                            onPress={() => setBasket((current) => current.filter((entry) => entry.key !== item.key))}
                                        />
                                    }
                                />
                            ))}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Content>
                        <Text variant="titleLarge">Total: ${count * 240}</Text>
                        <Text variant="bodySmall">Cesta local de demostración; no realiza compras.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button variant="text" onPress={() => setBasketOpen(false)}>
                            Continue shopping
                        </Button>
                    </Dialog.Actions>
                </Dialog>
                {/* Screen-local diagnostic overlay: paint the actual OS insets without adding padding. */}
                <View
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 10000 }}
                    testID="md-io26-shrine-safe-areas"
                >
                    {insets.top > 0 ? (
                        <View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: insets.left,
                                right: insets.right,
                                height: insets.top,
                                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                            }}
                            testID="md-io26-shrine-safe-top"
                        />
                    ) : null}
                    {insets.bottom > 0 ? (
                        <View
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: insets.left,
                                right: insets.right,
                                height: insets.bottom,
                                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                            }}
                            testID="md-io26-shrine-safe-bottom"
                        />
                    ) : null}
                    {insets.left > 0 ? (
                        <View
                            style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: 0,
                                width: insets.left,
                                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                            }}
                            testID="md-io26-shrine-safe-left"
                        />
                    ) : null}
                    {insets.right > 0 ? (
                        <View
                            style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                right: 0,
                                width: insets.right,
                                backgroundColor: 'rgba(245, 158, 11, 0.5)',
                            }}
                            testID="md-io26-shrine-safe-right"
                        />
                    ) : null}
                </View>
            </View>
        </ThemeProvider>
    );
}
