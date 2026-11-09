import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { AccessibilityInfo, View, type ViewInstance } from 'react-native';
import { useLocale } from 'react-native-paper';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
    cancelAnimation,
    LinearTransition,
    ReduceMotion,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Avatar, Button, Chip, Dialog, Icon, RadioButton, Text, useMobileTheme } from 'mobile-design/react-native-web';

type Field = 'to' | 'cc';
type Contact = { id: string; name: string; addresses: readonly string[] };
type Rect = { x: number; y: number; width: number; height: number };
const contacts: readonly Contact[] = [
    { id: 'ana', name: 'Ana', addresses: ['ana@ejemplo.com', 'ana.trabajo@ejemplo.com'] },
    { id: 'luis', name: 'Luis', addresses: ['luis@ejemplo.com'] },
    { id: 'mar', name: 'Mar', addresses: ['mar@ejemplo.com', 'mar.trabajo@ejemplo.com'] },
];

/** The published To→Cc/reorder pattern uses real fields, not extra arrow buttons on a chip. */
export function InputChipFields() {
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    const [fields, setFields] = useState<Record<Field, string[]>>({ to: ['ana', 'luis'], cc: ['mar'] });
    const [addresses, setAddresses] = useState<Record<string, string>>({});
    const [detail, setDetail] = useState<string | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailOrigin, setDetailOrigin] = useState<ComponentProps<typeof Dialog>['transitionOrigin']>();
    const [dragged, setDragged] = useState<string | null>(null);
    const fieldRects = useRef<Partial<Record<Field, Rect>>>({});
    const chipRects = useRef(new Map<string, Rect>());
    const fieldViews = useRef<Partial<Record<Field, ViewInstance | null>>>({});
    const currentFields = useRef(fields);
    currentFields.current = fields;
    const move = (id: string, destination: Field, index: number) => {
        setFields((current) => {
            const next = { to: current.to.filter((key) => key !== id), cc: current.cc.filter((key) => key !== id) };
            next[destination].splice(Math.max(0, Math.min(next[destination].length, index)), 0, id);
            return next;
        });
        AccessibilityInfo.announceForAccessibility(
            `${contacts.find((contact) => contact.id === id)?.name ?? id}, ${destination === 'to' ? 'Para' : 'Cc'}, posición${index + 1}.`
        );
    };
    const measure = () => {
        (['to', 'cc'] as const).forEach((field) =>
            fieldViews.current[field]?.measureInWindow((x, y, width, height) => {
                fieldRects.current[field] = { x, y, width, height };
            })
        );
    };
    const destination = (id: string, x: number, y: number) => {
        const field = (['to', 'cc'] as const).find((key) => {
            const rect = fieldRects.current[key];
            return rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
        });
        if (!field) return null;
        const peers = currentFields.current[field].filter((key) => key !== id);
        const nearest = peers
            .map((key, index) => ({ index, rect: chipRects.current.get(key) }))
            .filter((entry) => entry.rect)
            .sort((a, b) => {
                const distance = (rect: Rect) => Math.hypot(x - rect.x - rect.width / 2, y - rect.y - rect.height / 2);
                return distance(a.rect!) - distance(b.rect!);
            })[0];
        const index = nearest
            ? nearest.index +
              ((rtl ? x < nearest.rect!.x + nearest.rect!.width / 2 : x > nearest.rect!.x + nearest.rect!.width / 2) ? 1 : 0)
            : 0;
        return { field, index };
    };
    const contact = contacts.find((item) => item.id === detail);
    return (
        <View style={{ gap: 12 }} testID="md-chip-input-fields">
            <Text variant="titleMedium">Input · campos Para y Cc</Text>
            <Text variant="bodyMedium">
                Mantén pulsado un contacto y arrástralo para reordenar o moverlo entre campos. Tócalo para elegir su dirección.
            </Text>
            {(['to', 'cc'] as const).map((field) => (
                <View
                    key={field}
                    ref={(node) => {
                        fieldViews.current[field] = node;
                    }}
                    collapsable={false}
                    onLayout={measure}
                    style={{
                        zIndex: dragged && fields[field].includes(dragged) ? 1 : 0,
                        minHeight: 88,
                        padding: 12,
                        borderWidth: 1,
                        borderRadius: 4,
                        borderColor: theme.colors.outlineVariant,
                        gap: 4,
                    }}
                    testID={`md-chip-field-${field}`}
                >
                    <Text variant="labelLarge">{field === 'to' ? 'Para' : 'Cc'}</Text>
                    <Chip.Group accessibilityLabel={field === 'to' ? 'Destinatarios' : 'Con copia'}>
                        {fields[field].map((id, index) => (
                            <MovableInputChip
                                key={id}
                                contact={contacts.find((item) => item.id === id)!}
                                field={field}
                                index={index}
                                count={fields[field].length}
                                address={addresses[id]}
                                active={dragged}
                                sourceHidden={detail === id}
                                onDrag={(next) => {
                                    measure();
                                    setDragged(next);
                                }}
                                onMeasure={(rect) => chipRects.current.set(id, rect)}
                                destination={destination}
                                onMove={move}
                                onOpen={(origin) => {
                                    setDetailOrigin(origin);
                                    setDetail(id);
                                    setDetailOpen(true);
                                }}
                                onRemove={() =>
                                    setFields((current) => ({ ...current, [field]: current[field].filter((key) => key !== id) }))
                                }
                            />
                        ))}
                        {!fields[field].length ? (
                            <Text
                                variant="bodyMedium"
                                style={{ minHeight: 48, textAlignVertical: 'center', color: theme.colors.onSurfaceVariant }}
                            >
                                Sin contactos
                            </Text>
                        ) : null}
                    </Chip.Group>
                </View>
            ))}
            <Dialog
                visible={detailOpen}
                onDismiss={() => setDetailOpen(false)}
                onClosed={() => setDetail(null)}
                transitionOrigin={detailOrigin}
                testID="md-chip-contact-detail"
            >
                <Dialog.Title>{contact?.name}</Dialog.Title>
                <Dialog.Content>
                    <Text>Elige una dirección para este contacto.</Text>
                    <RadioButton.Group
                        value={contact ? (addresses[contact.id] ?? contact.addresses[0]) : ''}
                        onValueChange={(address) => {
                            if (contact) setAddresses((current) => ({ ...current, [contact.id]: address }));
                        }}
                        accessibilityLabel="Direcciones del contacto"
                    >
                        {contact?.addresses.map((address) => (
                            <RadioButton.Item key={address} label={address} value={address} position="leading" />
                        ))}
                    </RadioButton.Group>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button variant="text" onPress={() => setDetailOpen(false)}>
                        Listo
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
}

function MovableInputChip({
    contact,
    field,
    index,
    count,
    address,
    active,
    sourceHidden,
    onDrag,
    onMeasure,
    destination,
    onMove,
    onOpen,
    onRemove,
}: {
    contact: Contact;
    field: Field;
    index: number;
    count: number;
    address?: string;
    active: string | null;
    sourceHidden: boolean;
    onDrag: (id: string | null) => void;
    onMeasure: (rect: Rect) => void;
    destination: (id: string, x: number, y: number) => { field: Field; index: number } | null;
    onMove: (id: string, field: Field, index: number) => void;
    onOpen: (origin?: ComponentProps<typeof Dialog>['transitionOrigin']) => void;
    onRemove: () => void;
}) {
    const theme = useMobileTheme();
    const view = useRef<ViewInstance>(null);
    const rtl = useLocale().direction === 'rtl';
    const container = useRef<ViewInstance>(null);
    const alive = useRef(true),
        revision = useRef(0),
        openRequest = useRef(0);
    const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latest = useRef({ onDrag, onMeasure, destination, onMove });
    useLayoutEffect(() => {
        latest.current = { onDrag, onMeasure, destination, onMove };
    }, [onDrag, onMeasure, destination, onMove]);
    const translateX = useSharedValue(0),
        translateY = useSharedValue(0),
        held = useSharedValue(false),
        token = useSharedValue(0);
    const reset = () => {
        const spatial = theme.motion.spring.default.spatial;
        const config = {
            stiffness: spatial.stiffness,
            damping: 2 * spatial.damping * Math.sqrt(spatial.stiffness),
            reduceMotion: theme.animation.scale === 0 ? ReduceMotion.Always : ReduceMotion.Never,
        };
        translateX.set(withSpring(0, config));
        translateY.set(withSpring(0, config));
        held.set(false);
        latest.current.onDrag(null);
    };
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            revision.current++;
            openRequest.current++;
            if (openTimer.current) clearTimeout(openTimer.current);
            cancelAnimation(translateX);
            cancelAnimation(translateY);
        };
    }, [translateX, translateY]);
    const begin = (gesture: number) => {
        if (!alive.current || gesture !== token.get()) return;
        openRequest.current++;
        if (openTimer.current) clearTimeout(openTimer.current);
        revision.current = gesture;
        latest.current.onDrag(contact.id);
        view.current?.measureInWindow((x, y, width, height) => {
            if (alive.current && gesture === token.get() && gesture === revision.current) latest.current.onMeasure({ x, y, width, height });
        });
    };
    const release = (gesture: number, x: number, y: number, canceled: boolean) => {
        if (!alive.current || gesture !== token.get() || gesture !== revision.current) return;
        const next = canceled ? null : latest.current.destination(contact.id, x, y);
        if (next) latest.current.onMove(contact.id, next.field, next.index);
        reset();
    };
    const pan = usePanGesture({
        enabled: !active || active === contact.id,
        activateAfterLongPress: 350,
        minDistance: 1,
        maxPointers: 1,
        onActivate: () => {
            'worklet';
            token.set(token.get() + 1);
            cancelAnimation(translateX);
            cancelAnimation(translateY);
            held.set(true);
            scheduleOnRN(begin, token.get());
        },
        onUpdate: (event) => {
            'worklet';
            if (held.get()) {
                translateX.set(event.translationX);
                translateY.set(event.translationY);
            }
        },
        onDeactivate: (event) => {
            'worklet';
            if (held.get()) scheduleOnRN(release, token.get(), event.absoluteX, event.absoluteY, event.canceled);
        },
    });
    const motion = useAnimatedStyle(() => ({
        zIndex: held.get() ? 10 : 0,
        transform: [{ translateX: translateX.get() }, { translateY: translateY.get() }],
    }));
    const spatial = theme.motion.spring.default.spatial;
    const transition =
        theme.animation.scale === 0
            ? undefined
            : LinearTransition.springify()
                  .stiffness(spatial.stiffness)
                  .damping(2 * spatial.damping * Math.sqrt(spatial.stiffness))
                  .reduceMotion(ReduceMotion.Never);
    return (
        <GestureDetector gesture={pan}>
            <Animated.View
                ref={view}
                pointerEvents={sourceHidden ? 'none' : 'auto'}
                accessibilityElementsHidden={sourceHidden}
                importantForAccessibility={sourceHidden ? 'no-hide-descendants' : 'auto'}
                collapsable={false}
                layout={transition}
                style={[{ opacity: sourceHidden ? 0 : 1 }, motion]}
                onLayout={() =>
                    view.current?.measureInWindow((x, y, width, height) => {
                        if (alive.current) latest.current.onMeasure({ x, y, width, height });
                    })
                }
            >
                <Chip
                    variant="input"
                    containerRef={container}
                    avatar={<Avatar.Text size={24} label={contact.name.slice(0, 1)} />}
                    dragged={active === contact.id}
                    onPress={() => {
                        const request = ++openRequest.current,
                            gesture = token.get();
                        if (openTimer.current) clearTimeout(openTimer.current);
                        let resolved = false;
                        const deliver = (origin?: ComponentProps<typeof Dialog>['transitionOrigin']) => {
                            if (resolved || !alive.current || request !== openRequest.current || gesture !== token.get()) return;
                            resolved = true;
                            if (openTimer.current) clearTimeout(openTimer.current);
                            openTimer.current = null;
                            onOpen(origin);
                        };
                        if (!container.current?.measureInWindow) {
                            deliver();
                            return;
                        }
                        openTimer.current = setTimeout(() => deliver(), 250);
                        try {
                            container.current.measureInWindow((x, y, width, height) => {
                                deliver(
                                    width > 0 && height > 0
                                        ? {
                                              x,
                                              y,
                                              width,
                                              height,
                                              borderRadius: 8,
                                              backgroundColor: theme.colors.surface,
                                              content: (
                                                  <View
                                                      style={{
                                                          width: '100%',
                                                          height: '100%',
                                                          backgroundColor: theme.colors.surface,
                                                          borderRadius: 8,
                                                          overflow: 'hidden',
                                                      }}
                                                  >
                                                      <View
                                                          style={{
                                                              position: 'absolute',
                                                              inset: 0,
                                                              borderWidth: 1,
                                                              borderRadius: 8,
                                                              borderColor: theme.colors.outlineVariant,
                                                          }}
                                                      />
                                                      <View
                                                          style={{
                                                              direction: 'ltr',
                                                              flexDirection: rtl ? 'row-reverse' : 'row',
                                                              height: '100%',
                                                              alignItems: 'center',
                                                              gap: 8,
                                                              paddingLeft: rtl ? 32 : 4,
                                                              paddingRight: rtl ? 4 : 32,
                                                          }}
                                                      >
                                                          <Avatar.Text size={24} label={contact.name.slice(0, 1)} />
                                                          <Text
                                                              variant="labelLarge"
                                                              numberOfLines={1}
                                                              style={{ minWidth: 42, flexShrink: 1, color: theme.colors.onSurfaceVariant }}
                                                          >
                                                              {contact.name}
                                                          </Text>
                                                      </View>
                                                      <View
                                                          style={{
                                                              position: 'absolute',
                                                              left: rtl ? 7 : undefined,
                                                              right: rtl ? undefined : 7,
                                                              top: 0,
                                                              bottom: 0,
                                                              justifyContent: 'center',
                                                          }}
                                                      >
                                                          <Icon source="close" size={18} color={theme.colors.onSurfaceVariant} />
                                                      </View>
                                                  </View>
                                              ),
                                          }
                                        : undefined
                                );
                            });
                        } catch {
                            deliver();
                        }
                    }}
                    onClose={onRemove}
                    accessibilityLabel={`${contact.name}, ${address ?? contact.addresses[0]}, ${field === 'to' ? 'Para' : 'Cc'}`}
                    accessibilityHint="Mantén pulsado para arrastrar, o usa las acciones mover anterior, mover siguiente y cambiar campo."
                    accessibilityActions={[
                        { name: 'move-previous', label: 'Mover anterior' },
                        { name: 'move-next', label: 'Mover siguiente' },
                        { name: 'move-field', label: field === 'to' ? 'Mover a Cc' : 'Mover a Para' },
                    ]}
                    onAccessibilityAction={(event) => {
                        if (event.nativeEvent.actionName === 'move-field') onMove(contact.id, field === 'to' ? 'cc' : 'to', 0);
                        else if (event.nativeEvent.actionName === 'move-previous') onMove(contact.id, field, Math.max(0, index - 1));
                        else if (event.nativeEvent.actionName === 'move-next') onMove(contact.id, field, Math.min(count - 1, index + 1));
                    }}
                    closeIconAccessibilityLabel={`Quitar a ${contact.name}`}
                    testID={`md-chip-movable-${contact.id}`}
                >
                    {contact.name}
                </Chip>
            </Animated.View>
        </GestureDetector>
    );
}
