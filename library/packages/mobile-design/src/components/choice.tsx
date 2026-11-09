import { useEffect, useId, useRef, useState, type Ref } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View, type ViewInstance } from 'react-native';
import { Icon, Surface, useLocale } from 'react-native-paper';
import Animated from 'react-native-reanimated';
import { useMobileTheme } from '../core';
import { useOutsideInteraction } from '../outside-interaction';
import { TouchableRipple } from '../ripple';
import { Text } from '../typography';
import { matchingChoices, type AutocompleteProps, type ChoiceOption, type SelectProps } from './choice-types';
import { AnchoredPopup } from './popup';
import { usePressScope } from './press-scope';
import { ChoiceIndicator, useChoicePresence } from './choice-motion';
import { TextField, type TextFieldHandle } from './text-field';

type ChoiceRowsProps = {
    id: string;
    options: readonly ChoiceOption[];
    onChoose: (option: ChoiceOption) => void;
    emptyLabel: string;
    selection?: string;
    firstOptionRef?: Ref<ViewInstance>;
    interactive?: boolean;
    onInitialOptionLayout?: (target: { y: number; height: number }) => void;
};

function ChoiceRows({
    id,
    options,
    selection,
    emptyLabel,
    onChoose,
    firstOptionRef,
    interactive = true,
    onInitialOptionLayout,
}: ChoiceRowsProps) {
    const { colors } = useMobileTheme();
    const { direction } = useLocale();
    const first = options.find((option) => !option.disabled && option.value === selection) ?? options.find((option) => !option.disabled);

    return (
        <View nativeID={id} testID={id} style={{ padding: 4 }}>
            {options.length ? (
                options.map((option) => {
                    const checked = selection === option.value;
                    return (
                        <TouchableRipple
                            key={option.value}
                            onLayout={
                                option === first && onInitialOptionLayout
                                    ? (event) =>
                                          onInitialOptionLayout({ y: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height })
                                    : undefined
                            }
                            ref={option === first ? firstOptionRef : undefined}
                            testID={`${id}-${option.value}`}
                            accessibilityRole={selection === undefined ? 'button' : 'radio'}
                            accessibilityLabel={option.description ? `${option.label}, ${option.description}` : option.label}
                            accessibilityState={{ disabled: option.disabled, checked: selection === undefined ? undefined : checked }}
                            disabled={option.disabled || !interactive}
                            onPress={() => {
                                if (interactive && !option.disabled) onChoose(option);
                            }}
                            style={{
                                minHeight: 48,
                                justifyContent: 'center',
                                borderRadius: 4,
                                overflow: 'hidden',
                                opacity: option.disabled ? 0.38 : 1,
                                backgroundColor: checked ? colors.secondaryContainer : 'transparent',
                            }}
                        >
                            <View
                                pointerEvents="none"
                                accessibilityElementsHidden
                                importantForAccessibility="no-hide-descendants"
                                style={{
                                    flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                                    direction: 'ltr',
                                    alignItems: 'center',
                                    gap: 12,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                }}
                            >
                                {option.icon ? <Icon source={option.icon} size={20} color={colors.onSurfaceVariant} /> : null}
                                <View style={{ flex: 1, minWidth: 0, gap: 0 }}>
                                    <Text
                                        variant="bodyLarge"
                                        style={{
                                            color: checked ? colors.onSecondaryContainer : colors.onSurface,
                                            textAlign: direction === 'rtl' ? 'right' : 'left',
                                        }}
                                    >
                                        {option.label}
                                    </Text>
                                    {option.description ? (
                                        <Text
                                            variant="bodyMedium"
                                            style={{
                                                color: checked ? colors.onSecondaryContainer : colors.onSurfaceVariant,
                                                textAlign: direction === 'rtl' ? 'right' : 'left',
                                            }}
                                        >
                                            {option.description}
                                        </Text>
                                    ) : null}
                                </View>
                                {checked ? <Icon source="check" size={20} color={colors.primary} /> : null}
                            </View>
                        </TouchableRipple>
                    );
                })
            ) : (
                <Text variant="bodyMedium" accessibilityLiveRegion="polite" style={{ padding: 12, color: colors.onSurfaceVariant }}>
                    {emptyLabel}
                </Text>
            )}
        </View>
    );
}

export function Select({
    id,
    label,
    value,
    onValueChange,
    options,
    disabled = false,
    placeholder,
    variant = 'outlined',
    backgroundColor,
    emptyLabel = 'No hay opciones.',
}: SelectProps) {
    const instance = useId();
    const fieldId = id ?? `mobile-design-select-${instance}`;
    const { colors } = useMobileTheme();
    const trigger = useRef<ViewInstance>(null);
    const firstOption = useRef<ViewInstance>(null);
    const [open, setOpen] = useState(false);
    const [width, setWidth] = useState(280);
    const [initialScrollTarget, setInitialScrollTarget] = useState<{ y: number; height: number }>();
    const selected = options.find((option) => option.value === value);
    const expanded = open && !disabled;
    const current = useRef({ options, value, onValueChange });
    current.current = { options, value, onValueChange };
    const canOpen = usePressScope(disabled, fieldId);
    const canChoose = usePressScope(!expanded, JSON.stringify([fieldId, options.map((option) => [option.value, option.disabled])]));

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    return (
        <AnchoredPopup
            anchor={
                <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
                    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                        <TextField
                            variant={variant}
                            backgroundColor={backgroundColor}
                            label={label}
                            placeholder={placeholder}
                            value={selected?.label ?? ''}
                            readOnly
                            focused={expanded}
                            disabled={disabled}
                            onChangeText={() => {}}
                            trailing={<ChoiceIndicator expanded={expanded} testID={`${fieldId}-direction-indicator`} />}
                        />
                    </View>
                    <TouchableRipple
                        ref={trigger}
                        nativeID={fieldId}
                        testID={fieldId}
                        accessible
                        accessibilityRole="combobox"
                        accessibilityLabel={label}
                        accessibilityState={{ expanded, disabled }}
                        accessibilityValue={selected ? { text: selected.label } : undefined}
                        disabled={disabled}
                        onPress={() => {
                            if (canOpen()) {
                                setInitialScrollTarget(undefined);
                                setOpen((value) => !value);
                            }
                        }}
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                borderTopLeftRadius: 4,
                                borderTopRightRadius: 4,
                                borderBottomLeftRadius: variant === 'filled' ? 0 : 4,
                                borderBottomRightRadius: variant === 'filled' ? 0 : 4,
                                overflow: 'hidden',
                            },
                        ]}
                    >
                        <View />
                    </TouchableRipple>
                </View>
            }
            anchorStyle={{ alignSelf: 'stretch' }}
            visible={expanded}
            width={width}
            initialScrollTarget={initialScrollTarget}
            gap={4}
            onDismiss={() => setOpen(false)}
            onOpened={() => {
                if (canChoose() && firstOption.current) AccessibilityInfo.sendAccessibilityEvent(firstOption.current, 'focus');
            }}
            onClosed={() => {
                if (canOpen() && trigger.current) AccessibilityInfo.sendAccessibilityEvent(trigger.current, 'focus');
            }}
            testID={`${fieldId}-popup`}
            contentStyle={{ borderRadius: 8, backgroundColor: colors.surfaceContainer }}
        >
            <ChoiceRows
                id={`${fieldId}-options`}
                options={options}
                selection={value}
                emptyLabel={emptyLabel}
                interactive={expanded}
                firstOptionRef={firstOption}
                onInitialOptionLayout={(target) => {
                    if (canChoose())
                        setInitialScrollTarget((previous) =>
                            previous?.y === target.y && previous.height === target.height ? previous : target
                        );
                }}
                onChoose={(option) => {
                    const latest = current.current.options.find((entry) => entry.value === option.value);
                    if (!canChoose() || !latest || latest.disabled) return;
                    setOpen(false);
                    if (latest.value !== current.current.value) current.current.onValueChange(latest.value);
                }}
            />
        </AnchoredPopup>
    );
}

export function Autocomplete({
    id,
    label,
    value,
    onValueChange,
    options,
    disabled = false,
    placeholder,
    variant = 'outlined',
    backgroundColor,
    onSelect,
    onEscape,
    leadingIcon,
    openOnFocus = true,
    filter = true,
    presentation = 'popup',
    listId,
    emptyLabel = 'No hay resultados.',
}: AutocompleteProps) {
    const instance = useId();
    const fieldId = id ?? `mobile-design-autocomplete-${instance}`;
    const optionsId = listId ?? `${fieldId}-options`;
    const { colors } = useMobileTheme();
    const { direction } = useLocale();
    const field = useRef<TextFieldHandle>(null);
    const container = useRef<ViewInstance>(null);
    const [open, setOpen] = useState(false);
    const [width, setWidth] = useState(280);
    const expanded = open && !disabled;
    const matches = matchingChoices(options, value, filter);
    const inline = presentation === 'inline';
    const presence = useChoicePresence(inline && expanded);
    const canEdit = usePressScope(disabled, JSON.stringify([fieldId, presentation]));
    const canChoose = usePressScope(
        !expanded,
        JSON.stringify([fieldId, presentation, value, matches.map((option) => [option.value, option.disabled])])
    );
    const current = useRef({ matches, onValueChange, onSelect, onEscape, expanded });
    current.current = { matches, onValueChange, onSelect, onEscape, expanded };
    useEffect(() => {
        if (inline) presence.origin.set({ x: direction === 'rtl' ? width : 0, y: 0 });
    }, [direction, inline, presence.origin, width]);

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    const choose = (option: ChoiceOption) => {
        const latest = current.current.matches.find((entry) => entry.value === option.value);
        if (!canChoose() || !current.current.expanded || !latest || latest.disabled) return;
        current.current.expanded = false;
        setOpen(false);
        field.current?.blur();
        current.current.onValueChange(latest.label);
        current.current.onSelect?.(latest);
    };

    const dismiss = () => {
        if (!canChoose() || !current.current.expanded) return;
        current.current.expanded = false;
        setOpen(false);
        field.current?.blur();
    };
    const escape = () => {
        if (!canChoose() || !current.current.expanded) return;
        dismiss();
        current.current.onEscape?.();
    };
    useOutsideInteraction(inline && expanded, ({ x, y }) => {
        container.current?.measureInWindow((left, top, width, height) => {
            if (canChoose() && current.current.expanded && (x < left || x > left + width || y < top || y > top + height)) dismiss();
        });
    });

    const anchor = (
        <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
            <TextField
                ref={field}
                nativeID={fieldId}
                testID={fieldId}
                variant={variant}
                backgroundColor={backgroundColor}
                label={label}
                placeholder={placeholder}
                value={value}
                disabled={disabled}
                leadingIcon={leadingIcon}
                accessibilityRole="combobox"
                accessibilityState={{ expanded, disabled }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                submitBehavior="submit"
                onFocus={() => {
                    if (openOnFocus && canEdit()) setOpen(true);
                }}
                onBlur={() => {
                    if (!canEdit()) return;
                    current.current.expanded = false;
                    setOpen(false);
                }}
                onChangeText={(next) => {
                    if (!canEdit()) return;
                    current.current.onValueChange(next);
                    setOpen(true);
                }}
                onKeyPress={(event) => {
                    if (event.nativeEvent.key === 'Escape') escape();
                }}
                onSubmitEditing={() => {
                    const first = current.current.matches.find((option) => !option.disabled);
                    if (first) choose(first);
                }}
            />
        </View>
    );
    const rows = <ChoiceRows id={optionsId} options={matches} onChoose={choose} emptyLabel={emptyLabel} interactive={expanded} />;
    const surfaceStyle = { borderRadius: 8, backgroundColor: colors.surfaceContainer };

    if (inline) {
        return (
            <View ref={container} collapsable={false} onAccessibilityEscape={expanded ? escape : undefined}>
                {anchor}
                {presence.present ? (
                    <Animated.View
                        testID={`${fieldId}-options-motion`}
                        style={[{ marginTop: 8 }, presence.style]}
                        pointerEvents={expanded ? 'auto' : 'none'}
                        accessibilityElementsHidden={!expanded}
                        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
                    >
                        <Surface mode="flat" elevation={0} style={surfaceStyle}>
                            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 320 }}>
                                {rows}
                            </ScrollView>
                        </Surface>
                    </Animated.View>
                ) : null}
            </View>
        );
    }

    return (
        <AnchoredPopup
            anchor={anchor}
            anchorStyle={{ alignSelf: 'stretch' }}
            width={width}
            gap={4}
            visible={expanded}
            modal={false}
            dismissOnOutside
            onDismiss={dismiss}
            onEscape={escape}
            testID={`${fieldId}-popup`}
            contentStyle={surfaceStyle}
        >
            {rows}
        </AnchoredPopup>
    );
}
