import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { withAlpha } from '../color';
import { usePressScope } from './press-scope';
import { ChoiceIndicator, useChoicePresence } from './choice-motion';
import { Icon, Surface, useLocale } from 'react-native-paper';
import { useMobileTheme } from '../core';
import { TouchableRipple } from '../ripple';
import { Text } from '../typography';
import { matchingChoices, normalizeChoice, type AutocompleteProps, type ChoiceOption, type SelectProps } from './choice-types';
import { popupPosition } from './popup';
import { TextField, type TextFieldHandle } from './text-field';

export type { AutocompleteProps, ChoiceOption, SelectProps } from './choice-types';

export function Select(props: SelectProps) {
    return <ChoiceField {...props} selectOnly />;
}

export function Autocomplete(props: AutocompleteProps) {
    return <ChoiceField {...props} />;
}

const choicePadding = 4;
const choiceGap = 4;

/** Coordinates stay relative to the field's document, including when an example lives inside a tall iframe. */
function visibleViewport(start: Window) {
    const screen = start.visualViewport;
    const left = screen?.offsetLeft ?? 0;
    const top = screen?.offsetTop ?? 0;
    const bounds = { left, top, right: left + (screen?.width ?? start.innerWidth), bottom: top + (screen?.height ?? start.innerHeight) };
    const windows = [start];
    let current = start;
    let x = 0;
    let y = 0;
    while (current !== current.parent) {
        const frame = current.frameElement;
        if (!frame) break;
        const rect = frame.getBoundingClientRect();
        x += rect.left + frame.clientLeft;
        y += rect.top + frame.clientTop;
        current = current.parent;
        windows.push(current);
        const viewport = current.visualViewport;
        const viewportX = viewport?.offsetLeft ?? 0;
        const viewportY = viewport?.offsetTop ?? 0;
        bounds.left = Math.max(bounds.left, viewportX - x);
        bounds.top = Math.max(bounds.top, viewportY - y);
        bounds.right = Math.min(bounds.right, viewportX + (viewport?.width ?? current.innerWidth) - x);
        bounds.bottom = Math.min(bounds.bottom, viewportY + (viewport?.height ?? current.innerHeight) - y);
        for (const header of current.document.querySelectorAll('[data-mobile-design-popup-inset="top"]')) {
            const area = header.getBoundingClientRect();
            const style = current.getComputedStyle(header);
            const stuck = style.position === 'fixed' || (style.position === 'sticky' && area.top <= parseFloat(style.top) + 1);
            if (stuck && area.height > 0 && area.right > rect.left && area.left < rect.right) {
                bounds.top = Math.max(bounds.top, area.bottom - y);
            }
        }
    }
    return { ...bounds, windows };
}

function ChoiceField({
    id,
    label,
    value,
    onValueChange,
    options,
    disabled = false,
    placeholder,
    variant = 'outlined',
    backgroundColor,
    className,
    selectOnly = false,
    onSelect,
    onEscape,
    leadingIcon,
    openOnFocus = true,
    filter = true,
    presentation = 'popup',
    listId,
    emptyLabel = selectOnly ? 'No hay opciones.' : 'No hay resultados.',
}: AutocompleteProps & { selectOnly?: boolean }) {
    const instance = useId();
    const fieldId = id ?? `mobile-design-choice-${instance}`;
    const optionsId = listId ?? `${fieldId}-options`;
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    const field = useRef<TextFieldHandle>(null);
    const anchor = useRef<HTMLDivElement>(null);
    const list = useRef<HTMLDivElement>(null);
    const scrollArea = useRef<HTMLDivElement>(null);
    const typeahead = useRef({ text: '', at: 0 });
    const composing = useRef(false);
    const [open, setOpen] = useState(false);
    const [activeValue, setActiveValue] = useState<string>();
    const shown = matchingChoices(options, value, !selectOnly && filter);
    const enabled = shown.filter((option) => !option.disabled);
    const active = enabled.find((option) => option.value === activeValue);
    const optionId = (option: ChoiceOption) => `${optionsId}-${encodeURIComponent(option.value)}`;
    const expanded = open && !disabled;
    const presence = useChoicePresence(expanded);
    const rendered = presence.present;
    const current = useRef({ options: shown, value, onValueChange, onSelect, onEscape, expanded });
    current.current = { options: shown, value, onValueChange, onSelect, onEscape, expanded };
    const canOpen = usePressScope(disabled, fieldId);
    const canChoose = usePressScope(
        !expanded,
        JSON.stringify([fieldId, presentation, selectOnly ? null : value, shown.map((option) => [option.value, option.disabled])])
    );
    const inline = presentation === 'inline';
    const close = () => {
        composing.current = false;
        current.current.expanded = false;
        setOpen(false);
        setActiveValue(undefined);
        typeahead.current = { text: '', at: 0 };
    };
    const show = () => {
        if (!canOpen()) return;
        typeahead.current = { text: '', at: 0 };
        setOpen(true);
        setActiveValue(selectOnly ? enabled.find((option) => option.value === value)?.value : undefined);
    };
    const choose = (option: ChoiceOption) => {
        const latest = current.current.options.find((entry) => entry.value === option.value);
        if (!canChoose() || !current.current.expanded || !latest || latest.disabled) return;
        close();
        if (!selectOnly || latest.value !== current.current.value) current.current.onValueChange(selectOnly ? latest.value : latest.label);
        current.current.onSelect?.(latest);
    };

    useEffect(() => {
        if (disabled) {
            close();
        }
    }, [disabled]);
    useLayoutEffect(() => {
        if (inline) presence.origin.set({ x: rtl ? (anchor.current?.clientWidth ?? 0) : 0, y: 0 });
    }, [inline, rendered, rtl, presence.origin]);

    useLayoutEffect(() => {
        const popup = list.current;
        const trigger = anchor.current;
        const win = trigger?.ownerDocument.defaultView;
        if (!rendered || inline || !trigger || !popup || !win) return;
        popup.showPopover?.();
        let initialLayout = true;
        const update = () => {
            let viewport = visibleViewport(win);
            let rect = trigger.getBoundingClientRect();
            if (initialLayout && (rect.top < viewport.top || rect.bottom > viewport.bottom)) {
                trigger.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
                viewport = visibleViewport(win);
                rect = trigger.getBoundingClientRect();
            }
            initialLayout = false;
            if (rect.bottom <= viewport.top || rect.top >= viewport.bottom) {
                // An embedded viewport can move again during the same resize or scroll.
                popup.style.visibility = 'hidden';
                return;
            }
            popup.style.visibility = '';
            const width = Math.max(1, viewport.right - viewport.left);
            const height = Math.max(1, viewport.bottom - viewport.top);
            const popupWidth = Math.max(1, Math.min(width - 16, Math.max(160, rect.width)));
            popup.style.width = `${popupWidth}px`;
            const position = popupPosition(
                { x: rect.left - viewport.left, y: rect.top - viewport.top, width: rect.width, height: rect.height },
                { width: popupWidth, height: Math.min(scrollArea.current?.scrollHeight ?? popup.scrollHeight, 320) },
                { width, height },
                'below',
                choiceGap,
                { top: 0, right: 0, bottom: 0, left: 0 },
                rtl
            );
            popup.style.left = `${viewport.left + position.x}px`;
            popup.style.top = `${viewport.top + position.y}px`;
            popup.style.setProperty('--mobile-choice-max-height', `${position.height}px`);
            presence.origin.set({ x: position.originX, y: position.originY });
        };
        update();
        const { windows } = visibleViewport(win);
        const resize = new ResizeObserver(update);
        const dismissOutside = (event: PointerEvent) => {
            const target = event.target as Node | null;
            if (trigger.contains(target) || popup.contains(target)) return;
            close();
        };
        const escape = (event: globalThis.KeyboardEvent) => {
            if (event.key !== 'Escape' || !stateVisible.current) return;
            if (composing.current || event.isComposing || event.keyCode === 229) {
                event.stopPropagation();
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            close();
            current.current.onEscape?.();
        };
        win.document.addEventListener('keydown', escape, true);
        resize.observe(trigger);
        if (popup.firstElementChild) resize.observe(popup.firstElementChild);
        windows.forEach((frame) => {
            frame.addEventListener('scroll', update, true);
            frame.addEventListener('resize', update);
            frame.document.addEventListener('pointerdown', dismissOutside, true);
            frame.visualViewport?.addEventListener('resize', update);
            frame.visualViewport?.addEventListener('scroll', update);
        });
        return () => {
            resize.disconnect();
            win.document.removeEventListener('keydown', escape, true);
            windows.forEach((frame) => {
                frame.removeEventListener('scroll', update, true);
                frame.removeEventListener('resize', update);
                frame.document.removeEventListener('pointerdown', dismissOutside, true);
                frame.visualViewport?.removeEventListener('resize', update);
                frame.visualViewport?.removeEventListener('scroll', update);
            });
        };
    }, [rendered, inline, rtl, presence.origin, fieldId]);

    useLayoutEffect(() => {
        const popup = scrollArea.current;
        const option = active ? popup?.ownerDocument.getElementById(optionId(active)) : undefined;
        if (!popup || !option) return;
        // Use layout coordinates: the entering scale transforms client rects,
        // while scrollTop always uses untransformed CSS pixels.
        const top = option.offsetTop;
        const bottom = top + option.offsetHeight;
        if (top < popup.scrollTop) popup.scrollTop = top;
        else if (bottom > popup.scrollTop + popup.clientHeight) popup.scrollTop = bottom - popup.clientHeight;
    }, [active?.value, expanded, optionsId, rendered]);

    const stateVisible = useRef(expanded);
    stateVisible.current = expanded;
    const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
        if (
            !canOpen() ||
            composing.current ||
            event.nativeEvent.isComposing ||
            event.nativeEvent.keyCode === 229 ||
            (event.target as HTMLElement).id !== fieldId
        )
            return;
        const { key } = event;
        const handle = () => {
            event.preventDefault();
            event.stopPropagation();
        };
        if (key === 'Escape' && expanded) {
            handle();
            close();
            current.current.onEscape?.();
        } else if (key === 'Tab') {
            // Firefox restarts native Tab traversal at body when an open popover
            // becomes inert during this key. Move to the adjacent page control
            // explicitly while retaining the outgoing visual surface.
            const doc = anchor.current?.ownerDocument;
            const targets =
                expanded && doc
                    ? Array.from(doc.querySelectorAll<HTMLElement>('input,textarea,button,a[href],[tabindex]')).filter(
                          (node) =>
                              node.tabIndex >= 0 &&
                              !('disabled' in node && node.disabled) &&
                              node.getAttribute('aria-disabled') !== 'true' &&
                              !node.closest('[inert]') &&
                              !list.current?.contains(node) &&
                              node.getClientRects().length > 0
                      )
                    : [];
            const index = targets.findIndex((node) => node.id === fieldId);
            const next = index >= 0 ? targets[index + (event.shiftKey ? -1 : 1)] : undefined;
            if (next) handle();
            if (selectOnly && expanded && active) choose(active);
            else close();
            next?.focus();
        } else if (key === 'ArrowDown' || key === 'ArrowUp') {
            handle();
            if (event.altKey && key === 'ArrowUp') {
                close();
                return;
            }
            if (selectOnly && !expanded) {
                show();
                if (!enabled.some((option) => option.value === value))
                    setActiveValue((key === 'ArrowDown' ? enabled[0] : enabled.at(-1))?.value);
                return;
            }
            if (event.altKey) {
                show();
                return;
            }
            const index = expanded && active ? enabled.indexOf(active) : -1;
            const next =
                index < 0
                    ? key === 'ArrowDown'
                        ? 0
                        : enabled.length - 1
                    : Math.max(0, Math.min(enabled.length - 1, index + (key === 'ArrowDown' ? 1 : -1)));
            setOpen(true);
            setActiveValue(enabled[next]?.value);
        } else if (selectOnly && (key === 'Home' || key === 'End')) {
            handle();
            setOpen(true);
            setActiveValue((key === 'Home' ? enabled[0] : enabled.at(-1))?.value);
        } else if (key === 'Enter' || (selectOnly && key === ' ' && !(typeahead.current.text && Date.now() - typeahead.current.at < 700))) {
            if (event.repeat) {
                handle();
                return;
            }
            const target = active ?? (!selectOnly && expanded ? enabled[0] : undefined);
            if (expanded && target) {
                handle();
                const option = anchor.current?.ownerDocument.getElementById(optionId(target));
                if (!selectOnly && target.href && option?.tagName === 'A') option.click();
                else choose(target);
            } else if (selectOnly) {
                handle();
                if (expanded) close();
                else show();
            }
        } else if (selectOnly && key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            handle();
            const now = Date.now();
            const previous = now - typeahead.current.at < 700 ? typeahead.current.text : '';
            const letter = normalizeChoice(key);
            const repeated = previous === letter;
            const text = repeated ? letter : previous + letter;
            typeahead.current = { text, at: now };
            const index = enabled.findIndex((option) => option.value === (expanded ? activeValue : value));
            const ordered = repeated || !previous ? [...enabled.slice(index + 1), ...enabled.slice(0, index + 1)] : enabled;
            const match = ordered.find((option) => normalizeChoice(option.label).startsWith(text));
            if (match) {
                setOpen(true);
                setActiveValue(match.value);
            }
        }
    };

    const selected = selectOnly ? options.find((option) => option.value === value) : undefined;
    const choiceProps = {
        role: 'combobox' as const,
        'aria-expanded': expanded,
        'aria-haspopup': 'listbox' as const,
        'aria-controls': expanded ? optionsId : undefined,
        'aria-autocomplete': selectOnly ? undefined : ('list' as const),
        'aria-activedescendant': expanded && active ? optionId(active) : undefined,
        dataSet: { choiceValue: value, mobileDesignChoice: selectOnly ? 'select' : 'autocomplete' },
    };
    const contents: ReactNode = shown.length ? (
        shown.map((option) => {
            const highlighted = active?.value === option.value;
            const checked = selected?.value === option.value;
            return (
                <TouchableRipple
                    key={option.value}
                    nativeID={optionId(option)}
                    accessibilityLabel={option.description ? `${option.label}, ${option.description}` : option.label}
                    focusable={false}
                    disabled={option.disabled || !expanded}
                    {...{
                        role: 'option',
                        'aria-selected': selectOnly ? checked : highlighted,
                        'aria-disabled': option.disabled,
                        href: option.disabled || selectOnly ? undefined : option.href,
                        tabIndex: -1,
                        dataSet: { choiceOption: option.value },
                    }}
                    onPress={(event) => {
                        const pointer = event.nativeEvent as typeof event.nativeEvent & {
                            metaKey?: boolean;
                            ctrlKey?: boolean;
                            shiftKey?: boolean;
                            altKey?: boolean;
                        };
                        if (!selectOnly && option.href && (pointer.metaKey || pointer.ctrlKey || pointer.shiftKey || pointer.altKey))
                            return;
                        if (!selectOnly && option.href && current.current.onSelect) event.preventDefault();
                        choose(option);
                    }}
                    style={{
                        minHeight: 48,
                        justifyContent: 'center',
                        borderRadius: 4,
                        overflow: 'hidden',
                        backgroundColor: checked
                            ? theme.colors.secondaryContainer
                            : highlighted && typeof theme.colors.onSurface === 'string'
                              ? withAlpha(theme.colors.onSurface, 0.1)
                              : 'transparent',
                        opacity: option.disabled ? 0.38 : 1,
                    }}
                >
                    <View
                        pointerEvents="none"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        {...{ 'aria-hidden': true }}
                        style={{
                            flexDirection: rtl ? 'row-reverse' : 'row',
                            direction: 'ltr',
                            alignItems: 'center',
                            gap: 12,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                        }}
                    >
                        {option.icon && <Icon source={option.icon} size={20} color={theme.colors.onSurfaceVariant} />}
                        <View style={{ flex: 1, minWidth: 0, gap: 0 }}>
                            <Text
                                variant="bodyLarge"
                                numberOfLines={2}
                                style={{
                                    color: checked ? theme.colors.onSecondaryContainer : theme.colors.onSurface,
                                    textAlign: rtl ? 'right' : 'left',
                                }}
                            >
                                {option.label}
                            </Text>
                            {option.description && (
                                <Text
                                    variant="bodyMedium"
                                    numberOfLines={2}
                                    style={{
                                        color: checked ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant,
                                        textAlign: rtl ? 'right' : 'left',
                                    }}
                                >
                                    {option.description}
                                </Text>
                            )}
                        </View>
                        {checked && <Icon source="check" size={20} color={theme.colors.primary} />}
                    </View>
                </TouchableRipple>
            );
        })
    ) : (
        <Text
            variant="bodyMedium"
            accessibilityLiveRegion="polite"
            {...{ role: 'status' }}
            style={{ padding: 12, color: theme.colors.onSurfaceVariant }}
        >
            {emptyLabel}
        </Text>
    );

    return (
        <div
            className={className}
            data-mobile-design-choice-root=""
            onKeyDownCapture={handleKey}
            onCompositionStart={() => {
                composing.current = true;
            }}
            onCompositionEnd={() => {
                composing.current = false;
            }}
            style={{ minWidth: 0 }}
        >
            <div
                ref={anchor}
                onClickCapture={
                    selectOnly
                        ? () => {
                              if (!canOpen()) return;
                              field.current?.focus();
                              if (expanded) close();
                              else show();
                          }
                        : undefined
                }
            >
                <TextField
                    {...choiceProps}
                    nativeID={fieldId}
                    testID={fieldId}
                    ref={field}
                    variant={variant}
                    backgroundColor={backgroundColor}
                    label={label}
                    accessibilityLabel={label}
                    value={selectOnly ? (selected?.label ?? '') : value}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={selectOnly}
                    autoComplete="off"
                    inputMode={selectOnly ? 'none' : 'search'}
                    leadingIcon={leadingIcon}
                    trailing={selectOnly ? <ChoiceIndicator expanded={expanded} testID={`${fieldId}-direction-indicator`} /> : undefined}
                    onFocus={() => {
                        if (!selectOnly && openOnFocus) show();
                    }}
                    onBlur={(event) => {
                        if (!canOpen()) return;
                        const target = (event.nativeEvent as typeof event.nativeEvent & { relatedTarget?: Node }).relatedTarget;
                        if (!target || !list.current?.contains(target)) close();
                    }}
                    onChangeText={(next) => {
                        if (!canOpen()) return;
                        current.current.onValueChange(next);
                        setOpen(true);
                        setActiveValue(undefined);
                    }}
                />
            </div>
            {rendered && (
                <div
                    ref={list}
                    id={optionsId}
                    role="listbox"
                    aria-hidden={!expanded}
                    inert={!expanded}
                    data-testid={`${fieldId}-options-host`}
                    aria-label={label}
                    onMouseDown={(event) => event.preventDefault()}
                    onPointerMove={(event) => {
                        if (event.pointerType !== 'mouse') return;
                        const value = (event.target as Element).closest('[data-choice-option]')?.getAttribute('data-choice-option');
                        if (value != null && value !== activeValue && enabled.some((option) => option.value === value))
                            setActiveValue(value);
                    }}
                    {...(!inline && typeof HTMLElement.prototype.showPopover === 'function' ? { popover: 'manual' as const } : {})}
                    style={
                        inline
                            ? { marginTop: 8, pointerEvents: expanded ? 'auto' : 'none' }
                            : {
                                  position: 'fixed',
                                  zIndex: 1000,
                                  inset: 'auto',
                                  margin: 0,
                                  border: 0,
                                  padding: 0,
                                  background: 'transparent',
                                  borderRadius: 8,
                                  overflow: 'visible',
                                  pointerEvents: expanded ? 'auto' : 'none',
                              }
                    }
                >
                    <Animated.View testID={`${fieldId}-options-motion`} style={presence.style}>
                        <Surface
                            mode={inline ? 'flat' : 'elevated'}
                            elevation={inline ? 0 : 2}
                            style={{ borderRadius: 8, backgroundColor: theme.colors.surfaceContainer }}
                        >
                            <div
                                ref={scrollArea}
                                data-testid={`${fieldId}-options-scroll`}
                                style={{
                                    position: 'relative',
                                    padding: choicePadding,
                                    boxSizing: 'border-box',
                                    maxHeight: inline ? 320 : 'var(--mobile-choice-max-height,320px)',
                                    overflowY: 'auto',
                                    borderRadius: 8,
                                }}
                            >
                                {contents}
                            </div>
                        </Surface>
                    </Animated.View>
                </div>
            )}
        </div>
    );
}
