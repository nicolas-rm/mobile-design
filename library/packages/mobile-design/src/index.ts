/** Explicit rendering primitives; component families below use Mobile Design's implementations. */
export { Icon, customText, ThemeProvider, LocaleProvider, useLocale } from 'react-native-paper';
export { Text, type TextProps, type TextVariant, type EmphasizedTextVariant } from './typography';
export { TouchableRipple, type TouchableRippleProps } from './ripple';
export { type ScrollIndicatorOptions } from './scroll-indicators';
export { MaterialSymbol, createMaterialSymbolRenderer, renderMaterialIcon, type MaterialSymbolProps } from './material-symbols';
export { createMobileDesignColors } from './color-scheme';
export { Portal } from './paper-motion';
export { Menu } from './components/menu';
export {
    MobileDesignProvider,
    createMobileDesignTheme,
    useMobileTheme,
    type MobileDesignTheme,
    type MobileDesignThemeOptions,
    type MobileDesignProviderProps,
} from './core';
export {
    mobileDesignCatalog,
    mobileDesignCatalogGroups,
    getMobileDesignComponent,
    type MobileDesignCatalogEntry,
    type MobileDesignComponentId,
    type MobileDesignCategory,
    type MobileDesignCatalogGroupId,
} from './catalog';
export { Button, type ButtonProps } from './components/button';
export { IconButton, type IconButtonProps } from './components/icon-button';
export { Avatar, AvatarButton, type AvatarButtonProps } from './components/avatar';
export {
    FAB,
    ExtendedFAB,
    FABMenu,
    type FABProps,
    type FABSize,
    type FABVariant,
    type ExtendedFABProps,
    type FABMenuProps,
    type FABMenuItemProps,
    type FABMenuTriggerProps,
} from './components/fab';
export { Checkbox, RadioButton } from './components/selection-controls';
export { Switch, type SwitchProps } from './components/switch';
export { SegmentedButtons, type SegmentedButtonsProps, type SegmentedButtonOption } from './components/segmented-buttons';
export {
    Badge,
    BadgedBox,
    Chip,
    Divider,
    List,
    ListItem,
    type BadgeProps,
    type BadgedBoxProps,
    type ChipProps,
    type ChipGroupProps,
    type ListItemProps,
    type ListGroupProps,
    ListCollection,
    type ListCollectionProps,
    type ListSlotProps,
    type ListAccordionProps,
    type DividerProps,
} from './components/content';
export { Dialog, type DialogProps } from './components/dialog';
export { Card, type CardProps } from './components/card';
export { Snackbar, type SnackbarProps } from './components/snackbar';
export { TextField, type TextFieldProps, type TextFieldHandle } from './components/text-field';
export { Select, Autocomplete } from './components/choice';
export type { SelectProps, AutocompleteProps, ChoiceOption } from './components/choice-types';
export { FullScreenDialog, type FullScreenDialogProps } from './components/full-screen-dialog';
export type { ContainerTransformOrigin } from './components/container-transform';
export { ContainerTransformSurface } from './components/container-transform';
export { BottomSheetTextField, type BottomSheetTextFieldProps } from './components/bottom-sheet-text-field';
export { Carousel, type CarouselItem, type CarouselProps, type CarouselVariant } from './components/carousel';
export { FullScreenCarousel } from './components/carousel-full-screen';
export { DatePicker, type DatePickerProps, type DateRange } from './components/date-picker';
export { DockedDatePicker, type DockedDatePickerProps } from './components/docked-date-picker';
export { TimePicker, type TimePickerProps, type TimeValue } from './components/time-picker';
export { Slider, RangeSlider, type SliderProps, type RangeSliderProps } from './components/slider';
export { ProgressIndicator, type ProgressIndicatorProps } from './components/progress-indicator';
export { CircularProgressStatus, type CircularProgressStatusProps } from './components/circular-progress-status';
export { mobileDesignFonts, mobileDesignRobotoFont, mobileDesignSymbolsFont, materialSymbolsFontFamily } from './font-assets';
export { ProgressBar, ActivityIndicator, type ProgressBarProps, type ActivityIndicatorProps } from './components/progress';
export { LoadingIndicator, type LoadingIndicatorProps } from './components/loading-indicator';
export { PullToRefresh, type PullToRefreshProps } from './components/pull-to-refresh';
export { ButtonGroup, type ButtonGroupProps, type ButtonGroupItem } from './components/button-group';
export { SplitButton, type SplitButtonProps, type SplitButtonAction } from './components/split-button';
export { RichTooltip, type RichTooltipProps, type RichTooltipAction } from './components/rich-tooltip';
export { Tooltip, type TooltipProps } from './components/tooltip';
export type { MenuProps, MenuItemProps, MenuVariant, MenuSubmenuProps } from './components/menu';
export {
    BottomSheet,
    SideSheet,
    BottomSheetScrollView,
    BottomSheetFlatList,
    BottomSheetSectionList,
    BottomSheetTextInput,
    type BottomSheetProps,
    type SideSheetProps,
} from './components/sheets';
export {
    NavigationRail,
    NavigationRailModal,
    NavigationDrawerModal,
    Tabs,
    type NavigationRailProps,
    type NavigationRailModalProps,
    type NavigationDrawerModalProps,
    type NavigationDestination,
    type TabsProps,
    type TabItem,
} from './components/navigation';
export { NavigationBar, type NavigationBarProps } from './components/navigation-bar';
export { TabsPager, type TabsPagerProps } from './components/tabs-pager';
export { NavigationDrawer, NavigationDrawerItem, type NavigationDrawerProps, type NavigationDrawerDestination } from './components/drawer';
export {
    TopAppBar,
    useAppBarScrollBehavior,
    type AppBarScrollBehavior,
    type AppBarScrollMode,
    type TopAppBarProps,
    type TopAppBarAction,
    type TopAppBarVariant,
} from './components/appbar';
export { SearchView, type SearchViewProps, type SearchResult } from './components/search-view';
export { Searchbar } from './components/searchbar';
export { SearchTrigger, type SearchTriggerProps } from './components/search-trigger';
export { SearchIconButton, type SearchIconButtonProps } from './components/search-icon-button';
export { Toolbar, type ToolbarProps, type ToolbarAction } from './components/toolbar';
export {
    SwipeListItem,
    SwipeListGroup,
    type SwipeListItemProps,
    type SwipeListItemHandle,
    type SwipeListGroupHandle,
    type SwipeListAction,
    type SwipeListSide,
} from './components/swipe-list-item';
export { ListReorderGroup, type ListReorderGroupProps, type ListReorderItemInfo } from './components/list-reorder';
