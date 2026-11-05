import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    BadgedBox,
    Button,
    CircularProgressStatus,
    Dialog,
    Icon,
    IconButton,
    List,
    ProgressIndicator,
    SegmentedButtons,
    SplitButton,
    Switch,
    Text,
    TopAppBar,
    useMobileTheme,
} from 'mobile-design';
import { useDemoTask } from './mobile-design-demo-task';
import { ProgressTaskExample } from './mobile-design-action-scenarios';
import { ProgressUsageExamples } from './mobile-design-progress-usage-examples';

/** The order/payment composition shown in the official Progress indicators overview. */
export function ProgressPaymentExample() {
    const theme = useMobileTheme();
    const order = useDemoTask<boolean>();
    const payment = useDemoTask<boolean>();
    const [screen, setScreen] = useState<'order' | 'store'>('order');
    const [cart, setCart] = useState(false);
    const [delivery, setDelivery] = useState('Envío estándar');
    const load = () => {
        void order.run(async ({ wait, report }) => {
            for (let unit = 1; unit <= 6; unit++) {
                await wait(950);
                report(unit, 6);
            }
            return true;
        });
    };
    useEffect(() => {
        load();
    }, []);
    const buy = () => {
        void payment.run(async ({ wait }) => {
            // The reference payment has an unknown duration; elapsed demo time
            // does not provide a real percentage of the payment operation.
            await wait(6000);
            return true;
        });
    };
    const paidOrPaying = payment.busy || payment.status === 'success';
    const returnToStore = () => {
        order.reset();
        payment.reset();
        setScreen('store');
    };
    return (
        <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, overflow: 'hidden' }} testID="md-progress-payment-example">
            {screen === 'store' ? (
                <View style={{ padding: 16, gap: 16 }}>
                    <Text variant="headlineSmall">Tienda</Text>
                    <List.Item
                        title="Auriculares de estudio"
                        description="Sonido de alta definición · $81.99"
                        leading={<Icon source="image-outline" size={40} />}
                        trailing={<Icon source="chevron-right" size={24} />}
                        onPress={() => {
                            setScreen('order');
                            load();
                        }}
                        testID="md-progress-open-order"
                    />
                </View>
            ) : (
                <>
                    <TopAppBar
                        title="Detalles del pedido"
                        variant="small"
                        statusBarHeight={0}
                        navigationIcon="arrow-left"
                        navigationLabel="Volver a la tienda"
                        onNavigationPress={returnToStore}
                        actions={[
                            {
                                key: 'cart',
                                icon: () => (
                                    <BadgedBox badge={1}>
                                        <Icon source="cart-outline" size={24} />
                                    </BadgedBox>
                                ),
                                label: 'Carrito, 1 artículo',
                                onPress: () => setCart(true),
                            },
                        ]}
                        testID="md-progress-order-appbar"
                    />
                    {order.busy ? (
                        <View style={{ minHeight: 240 }}>
                            <ProgressIndicator
                                variant="linear"
                                appearance="wavy"
                                progress={order.progress}
                                accessibilityLabel="Cargando el pedido"
                                testID="md-progress-order-loading"
                            />
                        </View>
                    ) : (
                        <View style={{ padding: 16, gap: 8 }}>
                            <View
                                style={{
                                    minHeight: paidOrPaying ? 240 : 164,
                                    padding: 16,
                                    borderRadius: 20,
                                    backgroundColor: theme.colors.surfaceContainerLowest,
                                    justifyContent: paidOrPaying ? 'center' : 'flex-start',
                                    gap: 12,
                                }}
                            >
                                {paidOrPaying ? (
                                    <CircularProgressStatus
                                        status={payment.status === 'success' ? 'success' : 'progress'}
                                        appearance="wavy"
                                        progressLabel="Processing payment…"
                                        successLabel="Payment complete"
                                        testID="md-progress-payment-status"
                                    />
                                ) : (
                                    <>
                                        <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                                            Auriculares de estudio
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                            <View
                                                style={{
                                                    width: 72,
                                                    height: 72,
                                                    borderRadius: 16,
                                                    backgroundColor: theme.colors.surfaceContainerHigh,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Icon source="image-outline" size={40} color={theme.colors.primary} />
                                            </View>
                                            <View style={{ flex: 1, gap: 4 }}>
                                                <Price label="Subtotal" value="$86.00" />
                                                <Price label="Envío" value="$5.99" />
                                                <Price label="Descuento" value="−$10.00" />
                                                <View
                                                    accessible
                                                    accessibilityLabel="Total: $81.99"
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'baseline',
                                                        justifyContent: 'space-between',
                                                    }}
                                                >
                                                    <Text accessible={false} variant="bodySmall">
                                                        Total
                                                    </Text>
                                                    <Text accessible={false} variant="headlineSmall">
                                                        $81.99
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                            {!paidOrPaying ? (
                                <View style={{ alignItems: 'flex-end' }}>
                                    <SplitButton
                                        label="Buy"
                                        icon="credit-card-outline"
                                        onPress={buy}
                                        style={{ alignSelf: 'flex-end' }}
                                        actions={[
                                            {
                                                key: 'standard',
                                                label: 'Envío estándar',
                                                icon: 'truck-outline',
                                                onPress: () => setDelivery('Envío estándar'),
                                            },
                                            {
                                                key: 'pickup',
                                                label: 'Recoger en tienda',
                                                icon: 'store-outline',
                                                onPress: () => setDelivery('Recoger en tienda'),
                                            },
                                        ]}
                                        testID="md-progress-buy"
                                    />
                                </View>
                            ) : null}
                            {!paidOrPaying ? (
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    {delivery}
                                </Text>
                            ) : null}
                        </View>
                    )}
                </>
            )}
            <Dialog visible={cart} onDismiss={() => setCart(false)} testID="md-progress-cart">
                <Dialog.Title>Carrito</Dialog.Title>
                <Dialog.Content>
                    <Text>Auriculares de estudio · 1 unidad · $81.99</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setCart(false)}>
                        Continuar
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
}
function Price({ label, value }: { label: string; value: string }) {
    return (
        <View
            accessible
            accessibilityLabel={`${label}: ${value}`}
            style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
        >
            <Text accessible={false} variant="bodySmall">
                {label}
            </Text>
            <Text accessible={false} variant="labelSmall">
                {value}
            </Text>
        </View>
    );
}

/** The configurator is outside the indicator; it is not part of its anatomy. */
export function ProgressExamples({ onOpenPlayground }: { onOpenPlayground?: () => void }) {
    const [value, setValue] = useState(0.35),
        [mode, setMode] = useState('determinate'),
        [paused, setPaused] = useState(false),
        [rtl, setRtl] = useState(false);
    return (
        <View style={{ gap: 24 }}>
            <Text variant="titleMedium">Pedido y pago · referencia Overview</Text>
            <ProgressPaymentExample />
            {onOpenPlayground ? (
                <Button style={{ alignSelf: 'flex-start' }} variant="text" onPress={onOpenPlayground} testID="md-progress-open-playground">
                    Abrir el ejemplo completo
                </Button>
            ) : null}
            <View style={{ gap: 12 }}>
                <Text variant="titleMedium">Configuración de las muestras</Text>
                <View style={{ gap: 12, padding: 16 }}>
                    <SegmentedButtons
                        value={mode}
                        onValueChange={setMode}
                        buttons={[
                            { value: 'determinate', label: 'Determinado' },
                            { value: 'indeterminate', label: 'Indeterminado' },
                        ]}
                    />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Button variant="text" onPress={() => setValue(Math.max(0, value - 0.1))}>
                            −10 %
                        </Button>
                        <Text>{Math.round(value * 100)} %</Text>
                        <Button variant="text" onPress={() => setValue(Math.min(1, value + 0.1))}>
                            +10 %
                        </Button>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <Switch value={paused} onValueChange={setPaused} accessibilityLabel="Pausar movimiento de las muestras" />
                        <Text>Pausar movimiento</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <Switch value={rtl} onValueChange={setRtl} accessibilityLabel="Muestras lineales en RTL" />
                        <Text>RTL</Text>
                    </View>
                </View>
            </View>
            {(['flat', 'wavy'] as const).flatMap((appearance) =>
                [4, 8].map((thickness) => (
                    <View key={`${appearance}-${thickness}`} style={{ gap: 16 }}>
                        <Text variant="titleMedium">
                            {appearance === 'wavy' ? 'Ondulado' : 'Plano'} · {thickness} dp
                        </Text>
                        <ProgressIndicator
                            variant="linear"
                            appearance={appearance}
                            thickness={thickness}
                            progress={mode === 'indeterminate' ? undefined : value}
                            paused={paused}
                            direction={rtl ? 'rtl' : 'ltr'}
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', gap: 16 }}>
                            {[40, 48, 96].map((size) => (
                                <ProgressIndicator
                                    key={size}
                                    variant="circular"
                                    appearance={appearance}
                                    thickness={thickness}
                                    size={size}
                                    progress={mode === 'indeterminate' ? undefined : value}
                                    paused={paused}
                                />
                            ))}
                        </View>
                    </View>
                ))
            )}
            <Text variant="titleMedium">Inicio, avance y final · wave→flat</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: 8 }}>
                {[0, 0.01, 0.5, 1].map((progress) => (
                    <View key={progress} style={{ alignItems: 'center', gap: 8 }}>
                        <ProgressIndicator variant="circular" size={48} appearance="wavy" progress={progress} animated={false} />
                        <Text>{Math.round(progress * 100)} %</Text>
                    </View>
                ))}
            </View>
            <ProgressTaskExample />
            <ProgressUsageExamples />
            <Text variant="titleMedium">Progreso en el borde de una tarjeta</Text>
            <View style={{ borderRadius: 12, overflow: 'hidden' }}>
                <ProgressIndicator
                    variant="linear"
                    appearance="wavy"
                    progress={mode === 'indeterminate' ? undefined : value}
                    paused={paused}
                />
                <View style={{ minHeight: 120, padding: 16, justifyContent: 'center' }}>
                    <Text>Preparando la colección</Text>
                    <Text variant="bodySmall">Un indicador representa el proceso completo.</Text>
                </View>
            </View>
        </View>
    );
}
export function ProgressPlayground() {
    const insets = useSafeAreaInsets();
    return (
        <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
        >
            <ProgressPaymentExample />
        </ScrollView>
    );
}
