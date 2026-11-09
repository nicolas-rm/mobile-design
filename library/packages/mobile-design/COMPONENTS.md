# Componentes de Mobile Design

Monta los ejemplos de pantalla bajo `MobileDesignProvider`, `SafeAreaProvider` y `GestureHandlerRootView`. Importan desde `mobile-design/react-native`. En un archivo específico del navegador, sustituye esa entrada por `mobile-design/react-native-web`. [Instalación y dependencias](README.md#instalación-desde-npm)

[Cómo leer los ejemplos](#cómo-leer-los-ejemplos) · [Propiedades comunes](#propiedades-comunes) · [Índice de componentes](#índice-de-componentes)

## Índice de componentes

| Familia | Fichas |
| --- | --- |
| [Acciones y botones](#acciones-y-botones) | [`Button`](#button), [`IconButton`](#iconbutton), [`ButtonGroup`](#buttongroup), [`SegmentedButtons`](#segmentedbuttons), [`SplitButton`](#splitbutton), [`FAB`](#fab), [`FAB.Extended`](#fabextended), [`FAB.Menu`](#fabmenu) |
| [Campos y selección](#campos-y-selección) | [`TextField`](#textfield), [`Select`](#select), [`Autocomplete`](#autocomplete), [`Checkbox`](#checkbox), [`RadioButton`](#radiobutton), [`Switch`](#switch), [`Slider`](#slider-y-rangeslider), [`RangeSlider`](#slider-y-rangeslider), [`DatePicker`](#datepicker-y-dockeddatepicker), [`DockedDatePicker`](#datepicker-y-dockeddatepicker), [`TimePicker`](#timepicker) |
| [Navegación y búsqueda](#navegación-y-búsqueda) | [`TopAppBar`](#topappbar), [`NavigationBar`](#navigationbar), [`NavigationRail`](#navigationrail), [`NavigationRailModal`](#navigationrail), [`NavigationDrawer`](#navigationdrawer), [`NavigationDrawerModal`](#navigationdrawer), [`NavigationDrawerItem`](#navigationdrawer), [`Tabs`](#tabs-y-tabspager), [`TabsPager`](#tabs-y-tabspager), [`Searchbar`](#searchbar-y-searchview), [`SearchView`](#searchbar-y-searchview), [`SearchTrigger`](#searchbar-y-searchview), [`SearchIconButton`](#searchbar-y-searchview), [`Toolbar`](#toolbar) |
| [Contenido y tipografía](#contenido-y-tipografía) | [`Text`](#text), [`Badge`](#badge-y-badgedbox), [`BadgedBox`](#badge-y-badgedbox), [`Card`](#card), [`Carousel`](#carousel), [`FullScreenCarousel`](#carousel), [`Chip`](#chip), [`Divider`](#divider), [`List`](#list), [`SwipeListItem`](#list), [`SwipeListGroup`](#list), [`ListReorderGroup`](#list) |
| [Superficies y ayuda](#superficies-y-ayuda) | [`Menu`](#menu), [`Dialog`](#dialog-y-fullscreendialog), [`FullScreenDialog`](#dialog-y-fullscreendialog), [`BottomSheet`](#bottomsheet), [Campos de BottomSheet](#edición-dentro-de-la-hoja), [Listas de BottomSheet](#listas-virtualizadas-dentro-de-la-hoja), [`SideSheet`](#sidesheet), [`Snackbar`](#snackbar), [`Tooltip`](#tooltip-y-richtooltip), [`RichTooltip`](#tooltip-y-richtooltip) |
| [Carga y progreso](#carga-y-progreso) | [`LoadingIndicator`](#loadingindicator-y-pulltorefresh), [`PullToRefresh`](#loadingindicator-y-pulltorefresh), [`ProgressIndicator`](#progressindicator), [`CircularProgressStatus`](#progressindicator), [`ProgressBar`](#progressindicator), [`ActivityIndicator`](#progressindicator) |
| [Primitivas](#primitivas-de-composición) | [Avatar](#avatar), [Icon y MaterialSymbol](#icon-y-materialsymbol), [TouchableRipple](#touchableripple), [Portal](#portal), [ContainerTransformSurface](#containertransformsurface), [Tema y dirección locales](#tema-y-dirección-locales), [Catálogo](#catálogo) |

## Cómo leer los ejemplos

- **Requerida** marca un valor de entrada obligatorio. **Inicial** recoge el valor que aplica el componente cuando se omite la propiedad. **—** indica que la tabla carece de un valor inicial explícito.
- La columna **Ejemplo** muestra cómo pasar la propiedad o cómo leer un campo de un objeto relacionado. Un fragmento como `onValueChange={setValue}` usa el estado de la pantalla. Los bloques TSX completos muestran dónde se declara ese estado y cómo se enlaza con el componente.
- Algunas variantes usan propiedades distintas o mutuamente excluyentes. Por ejemplo, `DatePicker` usa un `Date` con `mode="single"` y un `DateRange` con `mode="range"`. Elige el bloque que corresponda.
- En un componente controlado, el callback solicita un cambio y la pantalla devuelve el nuevo valor en la propiedad controlada. En una superficie, `onDismiss` solicita cerrar y `onClosed`, cuando existe, avisa después de la salida.

## Propiedades comunes

Cada ficha indica las propiedades del componente y los tipos de sus piezas. Para las propiedades que el tipo hereda del host, consulta el contrato de la primitiva correspondiente. Los contenedores pueden heredar de `View`, los controles pulsables de `Pressable` y los campos de `TextInput`. [View](https://reactnative.dev/docs/view#props) · [Pressable](https://reactnative.dev/docs/pressable#props) · [TextInput](https://reactnative.dev/docs/textinput#props) · [Text](https://reactnative.dev/docs/text#props) · [Accesibilidad](https://reactnative.dev/docs/accessibility)

| Propiedad | Para qué se usa | Ejemplo cuando la acepta el componente |
| --- | --- | --- |
| `style` | Estilo de la superficie que declara la ficha. Para etiqueta, entrada o contenido usa la propiedad específica cuando exista. | `style={{ marginTop: 12 }}` |
| `accessibilityLabel` | Nombre anunciado. Úsalo en controles sin texto visible. | `accessibilityLabel="Cerrar búsqueda"` |
| `accessibilityHint` | Explica el resultado cuando el nombre por sí solo no lo aclara. | `accessibilityHint="Abre las preferencias de la cuenta"` |
| `accessibilityState` | Estado accesible que corresponde al control, si el componente permite pasarlo. | `accessibilityState={{ disabled: true }}` junto con un control deshabilitado. |
| `nativeID` | Identifica el elemento para relacionarlo con otros nodos. | `nativeID="panel-preferencias"` junto con el `panelID` de la pestaña. |
| `testID` | Selector para pruebas de interfaz. | `testID="preferencias-guardar"` |
| `theme` | Ajusta roles en una instancia cuando su tipo admite un tema parcial. | `theme={{ colors: { primary: '#005AC1', onPrimary: '#FFFFFF' } }}` |

Cuando una ficha acepta `scrollIndicators`, su tipo `ScrollIndicatorOptions` contiene `vertical` y `horizontal`, ambos opcionales y desactivados al omitirse. Por ejemplo, pasa `scrollIndicators={{ vertical: true }}` a una lista vertical o `scrollIndicators={{ horizontal: true }}` a un carrusel horizontal.

### Acciones y botones

#### Button

Ayuda a completar tareas con acciones claras. Default ejecuta una acción. Toggle representa un estado seleccionado controlado.

- Define variant, size y shape según la jerarquía de la acción. Children contiene su etiqueta.
- Usa onPress para un comando. Para Toggle, controla selected desde la pantalla.
- loading=true muestra el progreso circular. Para una espera breve, loading también acepta un renderer que recibe size y color para componer LoadingIndicator. Ambos bloquean las pulsaciones repetidas.

El estado controlado se distingue por la presencia de `selected`. Conserva `pressed` para reflejar una superficie anclada que sigue abierta. En web puedes proporcionar `href` y `hrefAttrs` para obtener un enlace. En Android e iOS ejecuta la navegación en `onPress`.

**Propiedades de `Button`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `React.ReactNode` | — | Contenido que se compone dentro del componente. | `children="Guardar borrador"` o el texto entre las etiquetas Button |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Toca dos veces para confirmar"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Guardar cambios"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ busy: saving }}` |
| `buttonColor` | `ColorValue` | — | Color personalizado del fondo del botón. | `buttonColor="#325DA8"` en el botón principal del formulario |
| `contentStyle` | `StyleProp<ViewStyle>` | — | Estilo del contenido dentro de la superficie. | `contentStyle={{ paddingHorizontal: 16 }}` para ampliar el espacio junto a la etiqueta |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `hitSlop` | `RectOrSize` | — | Amplía la zona de pulsación más allá de los bordes visibles. La zona queda limitada por su contenedor y respeta el orden visual de los elementos superpuestos. | `hitSlop={8}` para ampliar la zona táctil ocho dp dentro del padre |
| `href` | `string` | — | Dirección del enlace real en el navegador. | `href="/ayuda/envios"` |
| `hrefAttrs` | `{ target?: string; rel?: string; download?: boolean \| string; }` | — | Atributos del enlace web, como `target`, `rel` o `download`. | `hrefAttrs={{ target: '_blank', rel: 'noopener noreferrer' }}` en navegador |
| `icon` | `IconSource` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon="bookmark"` para la acción de guardar |
| `iconSize` | `number` | Según `size` | Tamaño del glifo del botón. El tamaño del control se elige con `size`. | `icon="bookmark" iconSize={20}` |
| `labelStyle` | `StyleProp<TextStyle>` | — | Estilo aplicado a la etiqueta del botón. | `labelStyle={{ letterSpacing: 0.2 }}` para ajustar el espaciado de la etiqueta |
| `loading` | `boolean \| ((props: { size: number; color: ColorValue; }) => ReactNode)` | — | Booleano o función que recibe `size` y `color` para representar la carga. Bloquea las pulsaciones repetidas. | `loading={({ size, color }) => <ProgressIndicator variant="circular" size={size} color={color} />}` |
| `morph` | `boolean` | `true` | Cambia la forma en pulsación y selección. Con `false` conserva la forma de reposo. | `morph={false}` para mantener la forma durante la pulsación |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="collection-name"` para asociar el campo con su texto de ayuda |
| `onBlur` | `((event: BlurEvent) => void)` | — | Avisa cuando el control pierde el foco. | `onBlur={() => setKeyboardFocus(false)}` al salir del control |
| `onFocus` | `((event: FocusEvent) => void)` | — | Avisa cuando el control recibe el foco. | `onFocus={() => setKeyboardFocus(true)}` para mostrar ayuda al enfocar |
| `onHoverIn` | `((event: MouseEvent) => unknown)` | — | Avisa al entrar el puntero en la superficie. | `onHoverIn={() => setShowShortcut(true)}` en navegador |
| `onHoverOut` | `((event: MouseEvent) => unknown)` | — | Avisa al salir el puntero de la superficie. | `onHoverOut={() => setShowShortcut(false)}` en navegador |
| `onLongPress` | `((e: GestureResponderEvent) => void)` | — | Acción que requiere una pulsación mantenida. | `onLongPress={() => setShowActionDetails(true)}` |
| `onPress` | `((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress={() => setSaved((saved) => !saved)}` en un botón Guardar |
| `onPressIn` | `((e: GestureResponderEvent) => void)` | — | Avisa al iniciar una pulsación. | `onPressIn={() => setPreviewVisible(true)}` |
| `onPressOut` | `((e: GestureResponderEvent) => void)` | — | Avisa al terminar o salir de una pulsación. | `onPressOut={() => setPreviewVisible(false)}` |
| `pressed` | `boolean` | `false` | Conserva la apariencia de pulsación para composiciones coordinadas. | `pressed={actionsOpen}` para conservar la apariencia mientras está abierto el menú asociado |
| `ref` | `Ref<default>` | — | Referencia imperativa con las operaciones del componente anfitrión. | `ref={triggerRef}` con useRef<ComponentRef<typeof View>>(null) para medir la posición |
| `selected` | `boolean` | — | Selección persistente controlada por el consumidor. | `selected={saved}` para reflejar si el documento está guardado |
| `shape` | `"round" \| "square"` | `'round'` | Forma visual de la superficie. | `shape="square"` para una superficie cuadrada con esquinas redondeadas |
| `size` | `"extra-small" \| "small" \| "medium" \| "large" \| "extra-large"` | `'small'` | Tamaño visual o escala semántica del control. | `size="medium"` para una acción destacada |
| `style` | `Animated.WithAnimatedValue<StyleProp<ViewStyle>>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | `'mobile-button'` | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `textColor` | `ColorValue` | — | Color personalizado del texto del botón. | `textColor="#FFFFFF"` sobre un fondo azul oscuro |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#325DA8', onPrimary: '#FFFFFF' } }}` |
| `uppercase` | `boolean` | `false` | Convierte la etiqueta a mayúsculas cuando el contenido es texto. | `uppercase={true}` con la etiqueta de texto Guardar |
| `variant` | `"filled" \| "tonal" \| "elevated" \| "outlined" \| "text"` | `'filled'` | Tratamiento visual o modalidad del componente. | `variant="outlined"` para usar el tratamiento con contorno |
| `maxFontSizeMultiplier` | `number` | — | Límite de escalado de la etiqueta. | `maxFontSizeMultiplier={1.8}` |
| `rippleColor` | `ColorValue` | Tema | Color de la indicación de pulsación. | `rippleColor="#325DA833"` |
| `background` | `PressableAndroidRippleConfig` | — | Configuración de la indicación nativa en Android. | `background={{ color: "#325DA833", foreground: true }}` |

**Ejemplo**

```tsx
import { useState } from 'react';
import { Button, MaterialSymbol } from 'mobile-design/react-native';

export default function Example() {
  const [saved, setSaved] = useState(false);

  return (
    <Button
      variant="filled"
      size="medium"
      shape="round"
      selected={saved}
      icon={(props) => (
        <MaterialSymbol
          {...props}
          name="bookmark"
          filled={saved}
        />
      )}
      onPress={() => setSaved((value) => !value)}
    >
      {saved ? 'Guardado' : 'Guardar'}
    </Button>
  );
}
```

#### IconButton

Representa acciones reconocibles mediante iconos. Puede ejecutar un comando o alternar un estado seleccionado.

- Define icon y accessibilityLabel. SizeClass controla la escala completa. Size heredado puede personalizar el glifo. Usa MaterialSymbol para controlar su relleno.
- Default omite selected. Toggle recibe selected y lo actualiza en onPress. Mode="contained" corresponde a Filled, contained-tonal a Tonal, outlined a Outlined. Omitir mode corresponde a Standard.

El componente usa `mode` y `sizeClass`. `mode="contained"` aplica Filled, `contained-tonal` aplica Tonal, `outlined` aplica el contorno y omitirlo aplica Standard. El objetivo táctil no se deduce del tamaño del glifo.

**Propiedades de `IconButton`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `icon` · requerida | `IconSource` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon="bookmark"` para la acción de guardar |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Toca dos veces para confirmar"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Marcar como favorito"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ busy: saving }}` |
| `containerColor` | `ColorValue` | — | Color de la superficie del control. | `containerColor="#DCE6FF"` para la superficie del control |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `iconColor` | `ColorValue` | — | Color del icono. | `iconColor="#325DA8"` para un icono azul en un fondo claro |
| `loading` | `boolean` | — | Muestra el estado de carga y bloquea nuevas pulsaciones. | `loading={saving}` mientras se guarda la preferencia |
| `mode` | `IconButtonMode` | — | Modo de uso admitido por este componente. | `mode="contained-tonal"` para un icono sobre una superficie tonal |
| `morph` | `boolean` | — | Con `false` conserva la forma de reposo y mantiene la respuesta de pulsación. | `morph={false}` para mantener la forma durante la pulsación |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="collection-name"` para asociar el campo con su texto de ayuda |
| `onPress` | `(((event: GestureResponderEvent) => unknown) & ((e: GestureResponderEvent) => void) & ((e: GestureResponderEvent) => void))` | — | Ejecuta la acción al activar el control. | `onPress={() => setFavorite((current) => !current)}` |
| `pressed` | `boolean` | — | Conserva la apariencia de pulsación para composiciones coordinadas. | `pressed={actionsOpen}` para conservar la apariencia mientras está abierto el menú asociado |
| `ref` | `Ref<default>` | — | Referencia imperativa con las operaciones del componente anfitrión. | `ref={triggerRef}` con useRef<ComponentRef<typeof View>>(null) para medir la posición |
| `selected` | `boolean` | — | Selección persistente controlada por el consumidor. | `selected={favorite}` |
| `shape` | `"round" \| "square"` | `'round'` | Forma visual de la superficie. | `shape="square"` para una superficie cuadrada con esquinas redondeadas |
| `size` | `number` | — | Tamaño visual o escala semántica del control. | `size={20}` para el glifo, manteniendo el tamaño del objetivo |
| `sizeClass` | `ButtonSize` | `'small'` | Escala del botón, incluido el contenedor y el objetivo de interacción. | `sizeClass="small"` para usar la escala pequeña de IconButton |
| `style` | `Animated.WithAnimatedValue<StyleProp<ViewStyle>>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#325DA8', onPrimary: '#FFFFFF' } }}` |
| `widthVariant` | `"narrow" \| "default" \| "wide"` | `'default'` | Proporción del botón de icono. | `widthVariant="wide"` para ampliar el botón de icono |

**Ejemplo**

```tsx
import { useState } from 'react';
import {
  IconButton,
  MaterialSymbol,
  Tooltip,
} from 'mobile-design/react-native';

export default function Example() {
  const [favorite, setFavorite] = useState(false);
  const label = favorite ? 'Quitar de favoritos' : 'Añadir a favoritos';

  return (
    <Tooltip title={label}>
      <IconButton
        icon={(props) => (
          <MaterialSymbol
            {...props}
            name="favorite"
            filled={favorite}
          />
        )}
        accessibilityLabel="Favorito"
        mode="contained-tonal"
        selected={favorite}
        sizeClass="small"
        shape="round"
        widthVariant="default"
        onPress={() => setFavorite((value) => !value)}
      />
    </Tooltip>
  );
}
```

#### ButtonGroup

Reúne acciones relacionadas o alternativas de selección. Standard redistribuye el espacio al pulsar. Connected mantiene el grupo unido.

- Define items con value estable y label. Usa onPress por ítem para comandos.
- Para selección, controla selectionMode, value y onValueChange.

Cada ítem puede tener icono. Usa `showSelectedIcon` para controlar la marca de selección del grupo. `maxVisibleItems` limita cuántos se muestran y el resto aparece en el menú. Con selección múltiple el valor es un arreglo de claves.

**Propiedades de `ButtonGroup`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `items` · requerida | `readonly ButtonGroupItem[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. | `items={[{ value: 'week', label: 'Semana' }, { value: 'month', label: 'Mes' }]}` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Guardar cambios"` |
| `allowEmptySelection` | `boolean` | `false` | Permite que un conjunto seleccionable quede sin opciones activas. | `allowEmptySelection` con `selectionMode="single"` para quitar el filtro activo |
| `buttonVariant` | `ButtonVariant` | `'tonal'` | Tratamiento de los botones individuales. | `buttonVariant="outlined"` para que los ítems compartan un contorno |
| `density` | `0 \| -1 \| -2 \| -3` | `0` | Ajuste de densidad de los controles. | `density={-1}` para compactar el grupo sin reducir el objetivo táctil |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `expandedRatio` | `number` | `0.15` | Fracción de crecimiento al pulsar en un grupo estándar. Con `0` el ancho se mantiene fijo. | `expandedRatio={0.2}` para ensanchar un 20 % el ítem pulsado |
| `fullWidth` | `boolean` | — | Distribuye el grupo a lo ancho del contenedor. | `fullWidth={true}` para ocupar todo el ancho de la barra de filtros |
| `maxVisibleItems` | `number` | — | Limita los elementos directos y mueve el resto al menú. | `maxVisibleItems={3}` para mover las acciones restantes al menú |
| `onValueChange` | `((value: string \| string[]) => void)` | — | Entrega el siguiente valor para actualizar el estado del consumidor. | `onValueChange={setPeriod}` para guardar el intervalo del calendario |
| `overflowAccessibilityLabel` | `string` | `'Más opciones'` | Nombre accesible para abrir las opciones restantes. | `overflowAccessibilityLabel="Más intervalos del calendario"` |
| `selectionMode` | `"none" \| "single" \| "multiple"` | — | Define si la selección es inexistente, única o múltiple. | `selectionMode="single"` para elegir un intervalo a la vez |
| `shape` | `"round" \| "square"` | `'round'` | Forma visual de la superficie. | `shape="square"` para una superficie cuadrada con esquinas redondeadas |
| `showSelectedIcon` | `boolean` | `true` | Muestra el icono de selección en opciones activas. | `showSelectedIcon={false}` para distinguir la selección por el tratamiento visual |
| `size` | `"extra-small" \| "small" \| "medium" \| "large" \| "extra-large"` | `'small'` | Tamaño visual o escala semántica del control. | `size="medium"` para una acción destacada |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | `'mobile-button-group'` | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `value` | `string \| readonly string[]` | — | Valor actual controlado por la pantalla. | `value={period}` con `const [period, setPeriod] = useState<string \| string[]>('week')` |
| `variant` | `"standard" \| "connected"` | `'standard'` | Tratamiento visual o modalidad del componente. | `variant="connected"` para unir visualmente los intervalos |

<details>
<summary>Configuración complementaria de ButtonGroup</summary>

**`ButtonGroupItem`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label: 'Semana'` |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value: 'week'` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel: 'Guardar cambios'` |
| `buttonColor` | `ColorValue` | — | Color de fondo personalizado de esta opción. | `buttonColor: '#325DA8'` en el botón principal del formulario |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: saving` mientras se guarda la edición |
| `icon` | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: 'calendar_today'` |
| `iconOnly` | `boolean` | — | Muestra el icono y conserva `label` como nombre accesible del ítem. | `{ value: 'week', label: 'Semana', icon: 'calendar_today', iconOnly: true }` |
| `onPress` | `(() => void)` | — | Ejecuta la acción al activar el control. | `onPress: () => setCreateDialog(true)` para ejecutar el comando |
| `selectionMode` | `"none"` | — | Define si la selección es inexistente, única o múltiple. | `selectionMode: 'none'` para un comando dentro de un grupo estándar de filtros |
| `shape` | `"round" \| "square"` | — | Forma visual de la superficie. | `shape: 'square'` para una superficie cuadrada con esquinas redondeadas |
| `size` | `"small" \| "medium" \| "large" \| "extra-small" \| "extra-large"` | — | Tamaño visual o escala semántica del control. | `size: 'medium'` para una acción destacada |
| `textColor` | `ColorValue` | — | Color de texto personalizado de esta opción. | `textColor: '#FFFFFF'` sobre un fondo azul oscuro |
| `variant` | `"filled" \| "tonal" \| "elevated" \| "outlined" \| "text"` | — | Tratamiento visual o modalidad del componente. | `variant: 'outlined'` para usar el tratamiento con contorno |
| `weight` | `number` | — | Proporción de espacio asignada al elemento cuando el grupo ocupa todo el ancho. El tamaño del contenido fija el mínimo. | `weight: 2` en el ítem principal cuando el grupo usa fullWidth |
| `widthVariant` | `"narrow" \| "default" \| "wide"` | — | Proporción del botón de icono. | `widthVariant: 'wide'` en un ítem con iconOnly: true |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { ButtonGroup } from 'mobile-design/react-native';

export default function Example() {
  const [value, setValue] = useState<string | string[]>('week');

  return (
    <ButtonGroup
      variant="connected"
      selectionMode="single"
      accessibilityLabel="Intervalo del calendario"
      value={value}
      onValueChange={setValue}
      items={[
        { value: 'day', label: 'Día' },
        { value: 'week', label: 'Semana' },
        { value: 'month', label: 'Mes' },
      ]}
    />
  );
}
```

#### SegmentedButtons

Permite elegir una o varias alternativas de un conjunto pequeño y relacionado.

- Usa opciones con valores únicos y el mismo tratamiento visual para etiquetas e iconos.
- Controla value y onValueChange. Single-select recibe un valor. MultiSelect recibe un array.

**Propiedades de `SegmentedButtons`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `buttons` · requerida | `SegmentedButtonOption<T>[]` | — | Opciones de segmentación con claves únicas. | `buttons={[{ value: 'list', label: 'Lista' }, { value: 'grid', label: 'Cuadrícula' }]}` |
| `onValueChange` · requerida | `((value: T) => void) \| ((value: T[]) => void)` | — | Entrega el siguiente valor para actualizar el estado del consumidor. | `onValueChange={setLayout}` para alternar entre lista y cuadrícula |
| `value` · requerida | `T \| T[]` | — | Valor actual controlado por la pantalla. | `value={layout}` con `const [layout, setLayout] = useState<'list' \| 'grid'>('list')` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Guardar cambios"` |
| `density` | `"small" \| "medium" \| "regular" \| "high"` | — | Ajuste de densidad de los controles. | `density="small"` para una fila compacta de vistas |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `multiSelect` | `boolean` | — | Permite seleccionar varios valores y usar un arreglo de claves. | `multiSelect` con `value={['list', 'grid']}` para elegir varias vistas |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#325DA8', onPrimary: '#FFFFFF' } }}` |

<details>
<summary>Configuración complementaria de SegmentedButtons</summary>

**`SegmentedButtonOption`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `value` · requerida | `T` | — | Valor actual controlado por la pantalla. | `value: 'list'` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel: 'Guardar cambios'` |
| `checkedColor` | `string` | — | Color del contenido de la opción seleccionada. | `checkedColor: '#325DA8'` para el segmento activo |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: saving` mientras se guarda la edición |
| `icon` | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: 'image'` para la opción de cuadrícula |
| `label` | `string` | — | Etiqueta visible que describe la acción u opción. | `label: 'Cuadrícula'` |
| `labelStyle` | `StyleProp<TextStyle>` | — | Estilo aplicado a la etiqueta de esta opción. | `labelStyle: { letterSpacing: 0.2 }` para ajustar el espaciado de la etiqueta |
| `onPress` | `((event: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress: () => setPreviewVisible(true)` |
| `showSelectedCheck` | `boolean` | — | Muestra una marca al seleccionar la opción. | `showSelectedCheck: false` para una opción que ya se distingue por el color |
| `uncheckedColor` | `string` | — | Color del contenido de la opción sin seleccionar. | `uncheckedColor: '#525D72'` para el segmento inactivo |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { SegmentedButtons } from 'mobile-design/react-native';

export default function Example() {
  const [value, setValue] = useState('walk');

  return (
    <SegmentedButtons
      value={value}
      onValueChange={setValue}
      buttons={[
        { value: 'walk', label: 'A pie', icon: 'walk' },
        { value: 'car', label: 'Auto', icon: 'car-outline' },
      ]}
    />
  );
}
```

#### SplitButton

Combina una acción directa con un menú de opciones relacionadas. Cada región conserva su función independiente.

- Define label, icon opcional y onPress para el comando principal. Las actions contienen alternativas relacionadas con key, label y onPress.
- La mitad principal admite texto, icono o ambos. Conserva un nombre accesible explícito si no hay texto. Expanded/onExpandedChange permiten coordinar el menú.

**Propiedades de `SplitButton`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `actions` · requerida | `readonly SplitButtonAction[]` | — | Acciones relacionadas de la composición. | `actions={[{ key: 'csv', label: 'Exportar CSV', onPress: exportCsv }]}` |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label="Exportar PDF"` |
| `onPress` · requerida | `() => void` | — | Ejecuta la acción al activar el control. | `onPress={exportPdf}` para ejecutar el formato principal |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `expanded` | `boolean` | — | Estado controlado de expansión. | `expanded={actionsOpen}` al controlar el menú desde la pantalla |
| `icon` | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon="bookmark"` para la acción de guardar |
| `menuAccessibilityLabel` | `string` | `'Más acciones'` | Nombre accesible del disparador que abre el menú. | `menuAccessibilityLabel="Más formatos de exportación"` |
| `onExpandedChange` | `((expanded: boolean) => void)` | — | Recibe el siguiente estado de expansión. | `onExpandedChange={setActionsOpen}` |
| `primaryAccessibilityLabel` | `string` | — | Nombre accesible de la acción principal. | `primaryAccessibilityLabel="Exportar como PDF"` |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` para mostrar el indicador vertical |
| `size` | `"extra-small" \| "small" \| "medium" \| "large" \| "extra-large"` | `'small'` | Tamaño visual o escala semántica del control. | `size="medium"` para una acción destacada |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | `'mobile-split-button'` | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `variant` | `"filled" \| "tonal" \| "elevated" \| "outlined"` | `'filled'` | Tratamiento visual o modalidad del componente. | `variant="outlined"` para usar el tratamiento con contorno |

<details>
<summary>Configuración complementaria de SplitButton</summary>

**`SplitButtonAction`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `key` · requerida | `string` | — | Identificador único y estable dentro del conjunto. | `key: 'export-csv'` para conservar la identidad si cambia la etiqueta |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label: 'Exportar CSV'` |
| `onPress` · requerida | `() => void` | — | Ejecuta la acción al activar el control. | `onPress: exportCsv` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: saving` mientras se guarda la edición |
| `icon` | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: 'save'` |
| `selected` | `boolean` | — | Selección persistente controlada por el consumidor. | `selected: format` === 'csv' |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { SplitButton, MaterialSymbol, Text } from 'mobile-design/react-native';

export default function Example() {
  const [feedback, setFeedback] = useState('');

  return (
    <View style={{ gap: 16 }}>
      <SplitButton
        label="Enviar"
        icon={(props: { size: number; color: string }) => (
          <MaterialSymbol
            {...props}
            name="send"
            filled
          />
        )}
        onPress={() => setFeedback('Mensaje enviado')}
        menuAccessibilityLabel="Más opciones de envío"
        actions={[
          {
            key: 'later',
            label: 'Programar envío',
            icon: 'clock-outline',
            onPress: () => setFeedback('Programar envío'),
          },
          {
            key: 'draft',
            label: 'Guardar borrador',
            icon: 'content-save-outline',
            onPress: () => setFeedback('Borrador guardado'),
          },
        ]}
      />
      <Text accessibilityLiveRegion="polite">{feedback}</Text>
    </View>
  );
}
```

#### FAB

Da presencia a la acción principal de la pantalla mediante una superficie flotante y un único icono.

- Define icon, accessibilityLabel y onPress para la acción principal. MaterialSymbol permite elegir el relleno del glifo.
- El host controla visible, posición e insets. Size y variant seleccionan tamaño y par de colores semánticos. Añade Tooltip para explicar la acción al pasar el puntero o enfocar.

**Propiedades de `FAB`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `icon` · requerida | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon="add"` para crear una carpeta |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Crear carpeta"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ busy: saving }}` |
| `aria-describedby` | `string` | — | Identificador del texto que complementa el nombre accesible en navegador. | `aria-describedby="save-help"` con `<Text nativeID="save-help">Guarda el borrador</Text>` |
| `aria-haspopup` | `"menu"` | — | Identifica un FAB que abre un menú en el árbol accesible web. | `aria-haspopup="menu"` en el FAB que abre las opciones de creación |
| `background` | `PressableAndroidRippleConfig` | — | Superficie personalizada del FAB. | `background={{ color: '#FFFFFF33', foreground: true }}` para la onda de Android |
| `containerColor` | `ColorValue` | — | Color de la superficie del control. | `containerColor="#DCE6FF"` para la superficie del control |
| `contentColor` | `ColorValue` | — | Color del texto o glifo que aparece sobre la superficie. | `contentColor="#10254F"` sobre una superficie azul clara |
| `elevation` | `0 \| 1 \| 2 \| 3` | — | Nivel de elevación de la superficie. | `elevation={0}` cuando el FAB se integra en una barra de navegación lateral |
| `onPress` | `((event: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress={() => setCreateDialog(true)}` |
| `ref` | `Ref<default>` | — | Referencia imperativa con las operaciones del componente anfitrión. | `ref={triggerRef}` con useRef<ComponentRef<typeof View>>(null) para medir la posición |
| `size` | `FABSize` | `'default'` | Tamaño visual o escala semántica del control. | `size="medium"` para una acción destacada |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#325DA8', onPrimary: '#FFFFFF' } }}` |
| `variant` | `"primary" \| "secondary" \| "tertiary" \| "tonalPrimary" \| "tonalSecondary" \| "tonalTertiary"` | `'tonalPrimary'` | Tratamiento visual o modalidad del componente. | `variant="tonalSecondary"` para la acción principal de la pantalla |
| `visible` | `boolean` | — | Controla si la superficie o el indicador se presenta. | `visible={!editing}` para ocultar la acción de creación mientras se edita |

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { FAB, MaterialSymbol, Tooltip, Text } from 'mobile-design/react-native';

export default function Example() {
  const [feedback, setFeedback] = useState('');

  return (
    <View style={{ gap: 16 }}>
      <Tooltip title="Crear lista">
        <FAB
          size="medium"
          variant="tonalPrimary"
          icon={(props: { size: number; color: string }) => (
            <MaterialSymbol
              {...props}
              name="add"
              filled
            />
          )}
          accessibilityLabel="Crear lista"
          onPress={() => setFeedback('Nueva lista')}
        />
      </Tooltip>
      <Text accessibilityLiveRegion="polite">{feedback}</Text>
    </View>
  );
}
```

#### FAB.Extended

Destaca la acción principal de una pantalla con una etiqueta que permite entenderla antes de tocar.

- Usa FAB.Extended o ExtendedFAB con label e icon opcional. Size default corresponde al tamaño Small.
- Coloca la acción respetando las áreas seguras y controla expanded/visible.
- Conecta expanded al scroll para contraer al bajar y expandir al subir. En un rail expandido puede usarse elevation={0}.

**Propiedades de `FAB.Extended`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label="Crear carpeta"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Guardar cambios"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ busy: saving }}` |
| `aria-describedby` | `string` | — | Identificador del texto que complementa el nombre accesible en navegador. | `aria-describedby="save-help"` con `<Text nativeID="save-help">Guarda el borrador</Text>` |
| `aria-haspopup` | `"menu"` | — | Identifica un FAB que abre un menú en el árbol accesible web. | `aria-haspopup="menu"` en el FAB que abre las opciones de creación |
| `background` | `PressableAndroidRippleConfig` | — | Superficie personalizada del FAB. | `background={{ color: '#FFFFFF33', foreground: true }}` para la onda de Android |
| `containerColor` | `ColorValue` | — | Color de la superficie del control. | `containerColor="#DCE6FF"` para la superficie del control |
| `contentColor` | `ColorValue` | — | Color del texto o glifo que aparece sobre la superficie. | `contentColor="#10254F"` sobre una superficie azul clara |
| `elevation` | `0 \| 1 \| 2 \| 3` | — | Nivel de elevación de la superficie. | `elevation={0}` cuando el FAB se integra en una barra de navegación lateral |
| `expanded` | `boolean` | `true` | Estado controlado de expansión. | `expanded={!scrolled}` para contraer el FAB cuando cambia la posición de scroll |
| `icon` | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon="add"` para conservar un glifo cuando el FAB se contrae |
| `labelMaxFontSizeMultiplier` | `number` | — | Límite de escalado para la etiqueta. | `labelMaxFontSizeMultiplier={1.8}` cuando el espacio de la etiqueta está acotado |
| `onPress` | `((event: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress={() => setEditorOpen(true)}` |
| `ref` | `Ref<default>` | — | Referencia imperativa con las operaciones del componente anfitrión. | `ref={triggerRef}` con useRef<ComponentRef<typeof View>>(null) para medir la posición |
| `size` | `FABSize` | `'default'` | Tamaño visual o escala semántica del control. | `size="medium"` para una acción destacada |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#325DA8', onPrimary: '#FFFFFF' } }}` |
| `variant` | `"primary" \| "secondary" \| "tertiary" \| "tonalPrimary" \| "tonalSecondary" \| "tonalTertiary"` | `'tonalPrimary'` | Tratamiento visual o modalidad del componente. | `variant="tonalSecondary"` para la acción principal de la pantalla |
| `visible` | `boolean` | — | Controla si la superficie o el indicador se presenta. | `visible={!editing}` para ocultar la acción durante la edición |

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { FAB, Text } from 'mobile-design/react-native';

export default function Example() {
  const [feedback, setFeedback] = useState('');

  return (
    <View style={{ gap: 16 }}>
      <FAB.Extended
        size="medium"
        icon="pencil-outline"
        label="Crear nota"
        accessibilityLabel="Crear nota"
        onPress={() =>
          setFeedback(
            'Nueva nota. Aquí comienza la tarea principal',
          )
        }
      />
      <Text accessibilityLiveRegion="polite">{feedback}</Text>
    </View>
  );
}
```

#### FAB.Menu

Expande el FAB para mostrar un conjunto de acciones relacionadas con la tarea principal de la pantalla.

- Controla expanded y ciérralo desde onDismiss. Trigger define el FAB y su nombre accesible.
- Define items relacionados con label, icon y onPress.
- presentation="expressive" muestra la pila animada en todas las plataformas. La presentación adaptive utiliza el menú baseline en web.
- Para extender la pila, combina overflow="scroll" con maxHeight.

**Propiedades de `FAB.Menu`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `expanded` · requerida | `boolean` | — | Estado controlado de expansión. | `expanded={actionsOpen}` al controlar el menú desde la pantalla |
| `items` · requerida | `TwoToSix<FABMenuItemProps> \| readonly FABMenuItemProps[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. | `items={[{ label: 'Nota', onPress: createNote }, { label: 'Carpeta', onPress: createFolder }]}` |
| `onDismiss` · requerida | `() => void` | — | Solicita cerrar la superficie. | `onDismiss={() => setActionsOpen(false)}` |
| `trigger` · requerida | `FABMenuTriggerProps` | — | Configuración de la acción que abre el menú flotante. | `trigger={{ icon: 'add', accessibilityLabel: 'Crear', onPress: () => setActionsOpen(true) }}` |
| `backAccessibilityLabel` | `string` | — | Nombre accesible de la acción para volver. | `backAccessibilityLabel="Volver a las acciones de creación"` |
| `backLabel` | `string` | — | Etiqueta visible para volver del submenú. | `backLabel="Acciones de creación"` |
| `closeAccessibilityLabel` | `string` | — | Nombre accesible del cierre. | `closeAccessibilityLabel="Cerrar acciones de creación"` |
| `closeIcon` | `any` | — | Glifo de cierre. | `closeIcon="close"` |
| `maxHeight` | `number` | — | Altura máxima del contenido. | `maxHeight={280}` con `overflow="scroll"` para acotar el menú de acciones |
| `overflow` | `"scroll"` | — | Comportamiento cuando el contenido supera el espacio disponible. | `overflow="scroll"` para un menú con más de seis acciones |
| `presentation` | `"adaptive" \| "expressive"` | — | Modo de presentación visual o colocación. | `presentation="expressive"` para conservar la pila animada en todas las plataformas |
| `scrollDownAccessibilityLabel` | `string` | — | Nombre accesible de la acción para desplazar hacia abajo. | `scrollDownAccessibilityLabel="Desplazar hacia más acciones"` |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` para mostrar el indicador vertical |
| `scrollUpAccessibilityLabel` | `string` | — | Nombre accesible de la acción para desplazar hacia arriba. | `scrollUpAccessibilityLabel="Desplazar hacia las primeras acciones"` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#325DA8', onPrimary: '#FFFFFF' } }}` |

<details>
<summary>Configuración complementaria de FAB.Menu</summary>

**`FABMenuItemProps`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label: 'Carpeta'` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel: 'Guardar cambios'` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: saving` mientras se guarda la edición |
| `icon` | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: 'folder'` |
| `items` | `readonly FABMenuItemProps[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. | `items: [{ key: 'shared', label: 'Compartida', onPress: createSharedFolder }]` dentro de un ítem padre con label: 'Carpetas' |
| `key` | `string` | — | Clave estable del elemento aunque se edite o traduzca su submenú. | `key: 'shared-folder'` |
| `onPress` | `((event: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress: createFolder` en un ítem final, sin items |

**`FABMenuTriggerProps`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `icon` · requerida | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: 'add'` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel: 'Guardar cambios'` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState: { busy: saving }` |
| `aria-describedby` | `string` | — | Identificador del texto que complementa el nombre accesible en navegador. | `aria-describedby:` 'save-help' con `<Text nativeID="save-help">Guarda el borrador</Text>` |
| `aria-haspopup` | `"menu"` | — | Identifica un FAB que abre un menú en el árbol accesible web. | `aria-haspopup:` 'menu' en el FAB que abre las opciones de creación |
| `background` | `PressableAndroidRippleConfig` | — | Superficie personalizada del FAB. | `background: { color: '#FFFFFF33', foreground: true }` para la onda de Android |
| `containerColor` | `ColorValue` | — | Color de la superficie del control. | `containerColor: '#DCE6FF'` para la superficie del control |
| `contentColor` | `ColorValue` | — | Color del texto o glifo que aparece sobre la superficie. | `contentColor: '#10254F'` sobre una superficie azul clara |
| `elevation` | `0 \| 1 \| 3 \| 2` | — | Nivel de elevación de la superficie. | `elevation: 0` cuando el FAB se integra en una barra de navegación lateral |
| `onPress` | `((event: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress: () => setActionsOpen(true)` |
| `size` | `FABSize` | — | Tamaño visual o escala semántica del control. | `size: 'medium'` para una acción destacada |
| `variant` | `"primary" \| "secondary" \| "tertiary" \| "tonalPrimary" \| "tonalSecondary" \| "tonalTertiary"` | — | Tratamiento visual o modalidad del componente. | `variant: 'tonalSecondary'` |
| `visible` | `boolean` | — | Controla si la superficie o el indicador se presenta. | `visible: !editing` para ocultar la entrada durante la edición |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { FAB, Text } from 'mobile-design/react-native';

export default function Example() {
  const [feedback, setFeedback] = useState('');
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={{ gap: 16 }}>
      <View
        style={{
          minHeight: 280,
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
        }}
      >
        <FAB.Menu
          presentation="expressive"
          expanded={expanded}
          onDismiss={() => setExpanded(false)}
          trigger={{
            icon: 'plus',
            size: 'medium',
            accessibilityLabel: 'Crear',
            onPress: () => setExpanded(true),
          }}
          items={[
            {
              key: 'note',
              label: 'Nota',
              icon: 'pencil-outline',
              onPress: () => setFeedback('Nueva nota'),
            },
            {
              key: 'folder',
              label: 'Carpeta',
              icon: 'folder-outline',
              onPress: () => setFeedback('Nueva carpeta'),
            },
          ]}
        />
      </View>
      <Text accessibilityLiveRegion="polite">{feedback}</Text>
    </View>
  );
}
```

### Campos y selección

#### TextField

Recoge información mediante campos Filled u Outlined, con etiquetas, ayuda y errores asociados.

- Controla value y onChangeText. Elige Filled u Outlined y mantén la misma variante dentro de un formulario. Otra superficie, como un diálogo, puede utilizar la otra variante.
- Label identifica el dato incluso después de escribir. Para una etiqueta externa adyacente, usa accessibilityLabel y, en web, aria-labelledby con su nativeID.
- SupportingText explica el formato. Error y errorText sustituyen esa ayuda por una corrección concreta. El campo conserva la asociación accesible. Counter sólo muestra la longitud. MaxLength impone el límite.
- Leading/trailing admiten contenido. LeadingIcon/trailingIcon reservan iconos de 24 dp en objetivos de 48 dp. Sus acciones y nombres accesibles son independientes. Muestra Borrar sólo cuando haya texto.
- Prefix y suffix son afijos persistentes al editar o tener valor. Con una etiqueta externa permanecen visibles también cuando el campo está vacío. PrefixAccessibilityLabel y suffixAccessibilityLabel proporcionan nombres hablados para símbolos, unidades o dominios.

El contador muestra la longitud. `maxLength` establece el límite. El ref `TextFieldHandle` ofrece `focus`, `blur`, `clear` e `isFocused`. Para un área de texto de altura fija combina `multiline`, `autoGrow={false}` e `inputStyle` con una altura.

**Propiedades de `TextField`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `onChangeText` · requerida | `(value: string) => void` | — | Comunica el nuevo texto para actualizar el valor controlado. | `onChangeText={setCollectionName}` para conservar el texto editado |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value={collectionName}` con `const [collectionName, setCollectionName] = useState('Informe')` |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Toca dos veces para confirmar"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Nombre del documento"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ disabled: saving }}` junto a `disabled={saving}` |
| `autoGrow` | `boolean` | — | Ajusta la altura al contenido de un campo multilínea. Usa `false` para fijar la altura. | `autoGrow={false}` con multiline e inputStyle={{ height: 100 }} |
| `backgroundColor` | `ColorValue` | — | Color de la superficie bajo el campo o contenedor. | `backgroundColor="#FFF8F2"` cuando el campo está sobre una superficie crema |
| `children` | `React.ReactNode` | — | Contenido que se compone dentro del componente. | `children={undefined}`. Para un campo con valor controlado usa `value="Informe"` y reserva `leading` y `trailing` para contenido auxiliar. |
| `containerStyle` | `StyleProp<ViewStyle>` | — | Estilo adicional del contenedor del campo. | `containerStyle={{ flex: 1 }}` para compartir el ancho con otro campo |
| `counter` | `number \| boolean` | — | Muestra la longitud del texto. Usa `maxLength` para limitar la entrada. | `counter={40}` con `maxLength={40}` para mostrar y aplicar el límite |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `error` | `boolean` | — | Activa el tratamiento visual y accesible de error. | `error={name.trim().length === 0 && submitted}` |
| `errorText` | `string` | — | Mensaje mostrado en el estado de error. | `errorText="Escribe el nombre de la colección"` |
| `focused` | `boolean` | — | Controla la apariencia de foco de un campo integrado en otro control. El foco de entrada se gestiona por separado. | `focused={calendarOpen}` para conservar la apariencia de foco al abrir el calendario del campo |
| `inputComponent` | `React.ComponentType<TextInputProps & React.RefAttributes<_TextInputInstance>>` | — | Adaptador de la entrada nativa. Usa `BottomSheetTextInput` cuando la hoja deba coordinar el foco con el teclado. | `inputComponent={BottomSheetTextInput}` dentro de una BottomSheet |
| `inputStyle` | `StyleProp<TextStyle>` | — | Estilo que recibe la entrada de texto interna. | `inputStyle={{ textAlign: 'right' }}` para alinear un importe |
| `label` | `string` | — | Etiqueta visible que describe la acción u opción. | `label="Nombre de la colección"` |
| `leading` | `React.ReactNode` | — | Slot al inicio lógico del contenido. | `leading={<Text variant="labelMedium">MXN</Text>}` |
| `leadingIcon` | `any` | — | Icono al inicio del control. | `leadingIcon="folder"` en un campo que muestra el nombre de la carpeta |
| `leadingIconAccessibilityLabel` | `string` | — | Nombre accesible para la acción del icono inicial. | `leadingIconAccessibilityLabel="Abrir búsqueda"` |
| `maxLength` | `number` | — | Limita la entrada al número de caracteres indicado. | `maxLength={40}` para limitar el nombre a 40 caracteres |
| `multiline` | `boolean` | — | Permite escribir en varias líneas. | `multiline` para escribir una nota de varias líneas |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="collection-name"` para asociar el campo con su texto de ayuda |
| `numberOfLines` | `number` | — | Fija el número de líneas de la entrada cuando `multiline` está habilitado. | `numberOfLines={3}` con multiline en un campo de notas |
| `onChange` | `((e: TextInputChangeEvent) => unknown)` | — | Comunica el valor confirmado o el evento de entrada, según el componente. | `onChange={(event) => setInputLength(event.nativeEvent.text.length)}` para observar el evento nativo |
| `onLeadingIconPress` | `(() => void)` | — | Callback del icono inicial cuando es una acción independiente. | `onLeadingIconPress={() => setSearchOpen(true)}` |
| `onPress` | `((event: GestureResponderEvent) => unknown)` | — | Ejecuta la acción al activar el control. | `onPress={() => setHelperVisible(true)}` para mostrar instrucciones al tocar el campo |
| `onTrailingIconPress` | `(() => void)` | — | Callback del icono final cuando es una acción independiente. | `onTrailingIconPress={() => setCollectionName('')}` |
| `placeholder` | `string` | — | Texto de orientación cuando el campo está vacío. | `placeholder="Escribe el nombre"` |
| `prefix` | `string` | — | Afijo anterior al valor. | `prefix="$"` en un campo de importe |
| `prefixAccessibilityLabel` | `string` | — | Cómo se anuncia el prefijo. | `prefixAccessibilityLabel="Pesos mexicanos"` |
| `readOnly` | `boolean` | — | Permite mostrar o consultar el valor con la edición bloqueada. | `readOnly={true}` para mostrar el folio de una reserva sin editarlo |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `suffix` | `string` | — | Afijo posterior al valor. | `suffix="kg"` para indicar la unidad del peso |
| `suffixAccessibilityLabel` | `string` | — | Cómo se anuncia el sufijo. | `suffixAccessibilityLabel="Kilogramos"` |
| `supportingText` | `React.ReactNode` | — | Ayuda que acompaña al valor cuando no hay error. | `supportingText="Usa un nombre fácil de reconocer"` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `trailing` | `React.ReactNode` | — | Slot al final lógico del contenido. | `trailing={<Text variant="labelSmall">Opcional</Text>}` |
| `trailingIcon` | `any` | — | Icono al final del control. | `trailingIcon="close"` para borrar el contenido del campo |
| `trailingIconAccessibilityLabel` | `string` | — | Nombre accesible para la acción del icono final. | `trailingIconAccessibilityLabel="Borrar nombre"` |
| `variant` | `"filled" \| "outlined"` | — | Tratamiento visual o modalidad del componente. | `variant="outlined"` para usar el tratamiento con contorno |

<details>
<summary>Configuración complementaria de TextField</summary>

**`BottomSheetTextField`**

Comparte la configuración de TextField y coordina el campo con el gesto y el teclado de BottomSheet.

**`TextFieldHandle`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `blur` · requerida | `() => void` | — | Retira el foco de la entrada. | `fieldRef.current?.blur()` al terminar de editar |
| `clear` · requerida | `() => void` | — | Solicita vaciar el valor con `onChangeText` si el campo admite edición. | `fieldRef.current?.clear()` al reiniciar el formulario |
| `focus` · requerida | `() => void` | — | Coloca el foco en la entrada si está habilitada. | `fieldRef.current?.focus()` al pulsar Editar nombre |
| `isFocused` · requerida | `() => boolean` | — | Indica si la entrada tiene el foco. | `const editing = fieldRef.current?.isFocused() ?? false` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { TextField } from 'mobile-design/react-native';

export default function Example() {
  const [name, setName] = useState('');

  return (
    <TextField
      variant="outlined"
      label="Nombre de la colección"
      value={name}
      onChangeText={setName}
      counter={40}
      maxLength={40}
      supportingText="Elige un nombre fácil de reconocer"
    />
  );
}
```


**Ejemplo de `TextFieldHandle` para enfocar y limpiar**

```tsx
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, TextField, type TextFieldHandle } from 'mobile-design/react-native';

export default function EditCollectionName() {
  const fieldRef = useRef<TextFieldHandle>(null);
  const [name, setName] = useState('Documentos');

  function resetName() {
    const field = fieldRef.current;
    field?.clear();
    if (!field?.isFocused()) field?.focus();
  }

  return (
    <View style={{ gap: 8 }}>
      <TextField ref={fieldRef} label="Nombre" value={name} onChangeText={setName} />
      <Button variant="tonal" onPress={resetName}>Escribir otro nombre</Button>
      <Button variant="text" onPress={() => fieldRef.current?.blur()}>Ocultar teclado</Button>
    </View>
  );
}
```

**Ejemplo de `BottomSheetTextField`**

La hoja coordina el foco y el teclado del campo. Monta la pantalla bajo el proveedor y la raíz de gestos descritos en la instalación.

```tsx
import { useState } from 'react';
import { BottomSheet, BottomSheetTextField, Button } from 'mobile-design/react-native';

export default function RenameDocumentSheet() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Informe trimestral');

  return (
    <>
      <Button onPress={() => setOpen(true)}>Editar nombre</Button>
      <BottomSheet open={open} onOpenChange={setOpen} snapPoints={['45%']}>
        <BottomSheetTextField label="Nombre" value={name} onChangeText={setName} />
        <Button disabled={!name.trim()} onPress={() => setOpen(false)}>Listo</Button>
      </BottomSheet>
    </>
  );
}
```

#### Select

Select es una extensión de Mobile Design para elegir una opción fija en un formulario.

- Importa `Select` desde la entrada de tu plataforma. Es una extensión que compone el campo y las opciones del sistema de diseño. No añade una familia al catálogo de referencia.
- value contiene el identificador de una opción y onValueChange acepta la nueva elección. Cada value de options debe ser único y estable. Description e icon completan la información de cada opción.
- variant="outlined" es el valor predeterminado. Variant="filled" utiliza el segundo tratamiento del campo. Placeholder describe un valor aún no elegido y emptyLabel explica una lista vacía.
- Si el campo Outlined está sobre otra superficie, backgroundColor debe coincidir con esa superficie para recortar el contorno detrás de la etiqueta flotante.

Las opciones tienen `value` único y `label`. Puedes añadir `description`, `icon` y `disabled`. `Select` devuelve el identificador elegido, conserva el valor al cancelar y no abre un teclado de texto.

**Propiedades de `Select`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label="Método de entrega"` |
| `onValueChange` · requerida | `(value: string) => void` | — | Entrega el identificador `value` de la opción confirmada. | `onValueChange={setShippingMethod}` para guardar la opción elegida |
| `options` · requerida | `readonly ChoiceOption[]` | — | Opciones con identificador, etiqueta y disponibilidad. | `options={[{ value: 'pickup', label: 'Recoger en tienda' }, { value: 'delivery', label: 'Envío' }]}` |
| `value` · requerida | `string` | — | Identificador de la opción seleccionada o cadena vacía mientras no haya elección. | `value={shippingMethod}` con `const [shippingMethod, setShippingMethod] = useState('pickup')` |
| `backgroundColor` | `ColorValue` | — | Color de la superficie bajo el campo o contenedor. | `backgroundColor="#FFF8F2"` cuando el campo está sobre una superficie crema |
| `className` | `string` | — | Clase CSS del contenedor del campo en navegador. | `className="shipping-field"` en el navegador |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `emptyLabel` | `string` | `'No hay opciones.'` | Texto mostrado cuando no hay opciones o resultados. | `emptyLabel="No hay destinos de envío disponibles"` |
| `id` | `string` | — | Identificador del campo. | `id="shipping-method"` |
| `placeholder` | `string` | — | Texto de orientación cuando el campo está vacío. | `placeholder="Elige cómo recibir tu pedido"` |
| `variant` | `"filled" \| "outlined"` | `'outlined'` | Tratamiento visual o modalidad del componente. | `variant="outlined"` para usar el tratamiento con contorno |

<details>
<summary>Configuración complementaria de Select</summary>

**`ChoiceOption`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label: 'Entrega a domicilio'` |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value: 'delivery'` |
| `description` | `string` | — | Texto secundario de apoyo. | `description: 'Entrega en 24 horas'` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: saving` mientras se guarda la edición |
| `href` | `string` | — | Dirección del enlace real en el navegador. | `href: '/ciudades/monterrey'` en una sugerencia navegable de Autocomplete en web |
| `icon` | `string` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: 'directions_car'` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { Select } from 'mobile-design/react-native';

export default function Example() {
  const [format, setFormat] = useState('pdf');

  return (
    <Select
      label="Formato de exportación"
      value={format}
      onValueChange={setFormat}
      options={[
        { value: 'pdf', label: 'PDF' },
        { value: 'csv', label: 'CSV' },
        { value: 'xlsx', label: 'XLSX', disabled: true },
      ]}
    />
  );
}
```

#### Autocomplete

Autocomplete es una extensión de Mobile Design que muestra sugerencias a medida que se escribe.

- Importa `Autocomplete` desde la entrada de tu plataforma. Es una extensión compuesta con TextField y sugerencias. No se presenta como una familia adicional del catálogo de referencia.
- Controla el texto con value/onValueChange. Al elegir una sugerencia, el texto recibe su label y onSelect recibe la opción completa, incluido su identificador value. Conserva ese identificador por separado si lo necesitas para guardar el dato.
- variant permite outlined (predeterminado) o filled. Presentation permite popup (predeterminado) o inline. LeadingIcon completa el campo sin añadir un botón de búsqueda ni una acción de borrar.
- backgroundColor permite igualar la superficie del campo Outlined y de su etiqueta flotante con la ventana que lo contiene. Usa el rol de color de esa superficie desde el tema.
- options acepta identificadores únicos, etiqueta, descripción, icono, disponibilidad y destino opcional. Filter=false conserva el orden y los resultados entregados por la aplicación, incluso si sus etiquetas no contienen la consulta.

El campo admite texto libre. Tras confirmar una sugerencia, `onValueChange` recibe su etiqueta y `onSelect` la opción completa. Guarda por separado su `value` si el formulario necesita el identificador.

**Propiedades de `Autocomplete`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label="Ciudad"` |
| `onValueChange` · requerida | `(value: string) => void` | — | Entrega lo que se escribe y la etiqueta al seleccionar una sugerencia. | `onValueChange={setQuery}` para conservar la consulta y la etiqueta elegida |
| `options` · requerida | `readonly ChoiceOption[]` | — | Opciones con identificador, etiqueta y disponibilidad. | `options={[{ value: 'mty', label: 'Monterrey' }, { value: 'mid', label: 'Mérida' }]}` |
| `value` · requerida | `string` | — | Texto controlado del campo, que puede contener una etiqueta o una consulta libre. | `value={query}` con `const [query, setQuery] = useState('')` |
| `backgroundColor` | `ColorValue` | — | Color de la superficie bajo el campo o contenedor. | `backgroundColor="#FFF8F2"` cuando el campo está sobre una superficie crema |
| `className` | `string` | — | Clase CSS del contenedor del campo en navegador. | `className="shipping-field"` en el navegador |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `emptyLabel` | `string` | `'No hay resultados.'` | Texto mostrado cuando no hay opciones o resultados. | `emptyLabel="No se encontraron ciudades"` |
| `filter` | `boolean` | `true` | Activa el filtrado local de sugerencias. | `filter={false}` si el servidor ya ordenó las sugerencias |
| `id` | `string` | — | Identificador del campo. | `id="shipping-method"` |
| `leadingIcon` | `string` | — | Icono al inicio del control. | `leadingIcon="search"` para iniciar la búsqueda |
| `listId` | `string` | — | Identificador de la lista de sugerencias. | `listId="city-suggestions"` para identificar la lista de ciudades |
| `onEscape` | `(() => void)` | — | Se ejecuta al cancelar explícitamente con el teclado o una acción de accesibilidad. El desenfoque y el cierre al tocar fuera se gestionan por separado. | `onEscape={() => setQuery('')}` al cancelar explícitamente la búsqueda |
| `onSelect` | `((option: ChoiceOption) => void)` | — | Recibe la opción completa elegida en la lista. | `onSelect={(city) => setCityId(city.value)}` para guardar la clave elegida |
| `openOnFocus` | `boolean` | `true` | Abre las sugerencias cuando el campo recibe el foco. | `openOnFocus={true}` para mostrar ciudades sugeridas al enfocar |
| `placeholder` | `string` | — | Texto de orientación cuando el campo está vacío. | `placeholder="Busca tu ciudad"` |
| `presentation` | `"popup" \| "inline"` | `'popup'` | Modo de presentación visual o colocación. | `presentation="inline"` cuando el diálogo ya contiene la lista de sugerencias |
| `variant` | `"filled" \| "outlined"` | `'outlined'` | Tratamiento visual o modalidad del componente. | `variant="outlined"` para usar el tratamiento con contorno |

<details>
<summary>Configuración complementaria de Autocomplete</summary>

**`ChoiceOption`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label: 'Entrega a domicilio'` |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value: 'delivery'` |
| `description` | `string` | — | Texto secundario de apoyo. | `description: 'Entrega en 24 horas'` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: saving` mientras se guarda la edición |
| `href` | `string` | — | Dirección del enlace real en el navegador. | `href: '/ciudades/monterrey'` en una sugerencia navegable de Autocomplete en web |
| `icon` | `string` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: 'directions_car'` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { Autocomplete } from 'mobile-design/react-native';

export default function Example() {
  const [query, setQuery] = useState('');

  return (
    <Autocomplete
      label="Ciudad"
      value={query}
      onValueChange={setQuery}
      leadingIcon="search"
      options={[
        { value: 'mty', label: 'Monterrey', description: 'Nuevo León' },
        { value: 'mid', label: 'Mérida', description: 'Yucatán' },
        { value: 'qro', label: 'Querétaro', description: 'Querétaro' },
      ]}
    />
  );
}
```

#### Checkbox

Permite seleccionar varias opciones o representar una selección parcial en un conjunto.

- Controla status con checked, unchecked o indeterminate.
- Usa Checkbox.Item para una opción etiquetada y administra el conjunto seleccionado en la pantalla.

**Propiedades de `Checkbox`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `status` · requerida | `"checked" \| "unchecked" \| "indeterminate"` | — | Estado actual del control. | `status="indeterminate"` cuando hay archivos seleccionados y otros sin seleccionar |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Toca dos veces para confirmar"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Seleccionar todos los archivos"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ checked: 'mixed' }}` junto a `status="indeterminate"` |
| `color` | `ColorValue` | — | Color del elemento o trazo. | `color="#325DA8"` para el indicador activo |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="collection-name"` para asociar el campo con su texto de ayuda |
| `onPress` | `(((event: GestureResponderEvent) => unknown) & ((e: GestureResponderEvent) => void) & ((e: GestureResponderEvent) => void))` | — | Ejecuta la acción al activar el control. | `onPress={() => setChecked((current) => !current)}` |
| `style` | `Consultar el tipo TypeScript` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#325DA8', onPrimary: '#FFFFFF' } }}` |
| `error` | `boolean` | — | Aplica el estado visual de error. | `error={submitted && !accepted}` |
| `uncheckedColor` | `ColorValue` | Tema | Color de la casilla sin marcar. | `uncheckedColor="#57627A"` |

<details>
<summary>Configuración complementaria de Checkbox</summary>

**`Checkbox.Item`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label="Descargar con Wi-Fi"` |
| `status` · requerida | `"checked" \| "unchecked" \| "indeterminate"` | — | Estado actual del control. | `status={wifiOnly ? 'checked' : 'unchecked'}` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Guardar cambios"` |
| `aria-describedby` | `string` | — | Identificador del texto que complementa el nombre accesible en navegador. | `aria-describedby="save-help"` con `<Text nativeID="save-help">Guarda el borrador</Text>` |
| `color` | `string` | — | Color del elemento o trazo. | `color="#325DA8"` para el indicador activo |
| `description` | `string` | — | Texto secundario de apoyo. | `description="Las descargas esperan una conexión Wi-Fi"` |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `error` | `boolean` | `false` | Activa el tratamiento visual y accesible de error. | `error={submitted && !accepted}` en una confirmación obligatoria |
| `labelMaxFontSizeMultiplier` | `number` | — | Límite de escalado para la etiqueta. | `labelMaxFontSizeMultiplier={1.8}` cuando el espacio de la etiqueta está acotado |
| `labelStyle` | `StyleProp<TextStyle>` | — | Estilo aplicado a la etiqueta de la opción. | `labelStyle={{ letterSpacing: 0.2 }}` para ajustar el espaciado de la etiqueta |
| `labelVariant` | `TypescaleKey` | `'bodyLarge'` | Rol tipográfico de la etiqueta. | `labelVariant="bodyMedium"` para una fila compacta |
| `onPress` | `((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress={() => setWifiOnly((current) => !current)}` |
| `position` | `"leading" \| "trailing"` | `'trailing'` | Posición lógica o compartida de la superficie. | `position="leading"` para colocar el indicador antes de la etiqueta |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#325DA8', onPrimary: '#FFFFFF' } }}` |
| `uncheckedColor` | `string` | Tema | Color de la casilla sin marcar en la fila. | `uncheckedColor="#57627A"` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { Checkbox } from 'mobile-design/react-native';

export default function Example() {
  const [checked, setChecked] = useState(false);

  return (
    <Checkbox.Item
      label="Descargar con Wi-Fi"
      status={checked ? 'checked' : 'unchecked'}
      onPress={() => setChecked((value) => !value)}
    />
  );
}
```


**Ejemplo de `Checkbox` sin fila, con selección parcial**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { Checkbox } from 'mobile-design/react-native';

export default function SelectDocuments() {
  const [selected, setSelected] = useState([true, false]);
  const allSelected = selected.every(Boolean);
  const someSelected = selected.some(Boolean);

  return (
    <View>
      <Checkbox
        accessibilityLabel="Seleccionar todos los documentos"
        status={allSelected ? 'checked' : someSelected ? 'indeterminate' : 'unchecked'}
        onPress={() => setSelected(selected.map(() => !allSelected))}
      />
      {selected.map((checked, index) => (
        <Checkbox
          key={index}
          accessibilityLabel={index === 0 ? 'Seleccionar informe' : 'Seleccionar presupuesto'}
          status={checked ? 'checked' : 'unchecked'}
          onPress={() => setSelected((current) => current.map((value, i) => i === index ? !value : value))}
        />
      ))}
    </View>
  );
}
```

#### RadioButton

Permite seleccionar una opción de un conjunto. Elegir otra reemplaza la selección anterior.

- Usa RadioButton.Group con value/onValueChange y un nombre accesible que describa el conjunto. Cada opción tiene un value único.
- RadioButton.Item enlaza círculo y etiqueta en un único objetivo. La propiedad `position` coloca el control al inicio o al final lógico. Description añade texto de apoyo sin sustituir el nombre.
- El círculo mide 20 dp, el trazo 2 dp y el punto seleccionado 10 dp. La tinta circular mide 40 dp dentro de un objetivo táctil de 48 dp. Las filas crecen con el texto.

**Propiedades de `RadioButton`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `value` · requerida | `string` | — | Clave de la opción dentro de su grupo. | `value="pickup"` para la opción Recoger en tienda |
| `color` | `string` | — | Color del elemento o trazo. | `color="#325DA8"` para el indicador activo |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `onPress` | `((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress={() => setMethod('pickup')}` cuando se usa sin RadioButton.Group |
| `status` | `"checked" \| "unchecked"` | — | Estado actual del control. | `status={selected ? 'checked' : 'unchecked'}` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#325DA8', onPrimary: '#FFFFFF' } }}` |
| `uncheckedColor` | `string` | Tema | Color del indicador sin seleccionar. | `uncheckedColor="#57627A"` |

<details>
<summary>Configuración complementaria de RadioButton</summary>

**`RadioButton.Group`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `children={<RadioButton.Item value="pickup" label="Recoger en tienda" />}` |
| `onValueChange` · requerida | `(value: string) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. | `onValueChange={setShippingMethod}` para guardar la opción elegida |
| `value` · requerida | `string` | — | Clave de la opción seleccionada en el conjunto. | `value={shippingMethod}` con `const [shippingMethod, setShippingMethod] = useState('pickup')` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Método de entrega"` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |

**`RadioButton.Item`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label="Recoger en tienda"` |
| `value` · requerida | `string` | — | Clave única de la opción etiquetada. | `value="pickup"` para identificar la opción en el grupo |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Toca dos veces para confirmar"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Guardar cambios"` |
| `aria-describedby` | `string` | — | Identificador del texto que complementa el nombre accesible en navegador. | `aria-describedby="save-help"` con `<Text nativeID="save-help">Guarda el borrador</Text>` |
| `color` | `string` | — | Color del elemento o trazo. | `color="#325DA8"` para el indicador activo |
| `description` | `string` | — | Texto secundario de apoyo. | `description="Listo el mismo día"` |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `labelMaxFontSizeMultiplier` | `number` | — | Límite de escalado para la etiqueta. | `labelMaxFontSizeMultiplier={1.8}` cuando el espacio de la etiqueta está acotado |
| `labelStyle` | `StyleProp<TextStyle>` | — | Estilo aplicado a la etiqueta de la opción. | `labelStyle={{ letterSpacing: 0.2 }}` para ajustar el espaciado de la etiqueta |
| `labelVariant` | `TypescaleKey` | `'bodyLarge'` | Rol tipográfico de la etiqueta. | `labelVariant="bodyMedium"` para una fila compacta |
| `onPress` | `((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress={() => setMethod('pickup')}` para una fila sin grupo |
| `position` | `"leading" \| "trailing"` | `'trailing'` | Posición lógica o compartida de la superficie. | `position="leading"` para colocar el indicador antes de la etiqueta |
| `status` | `"checked" \| "unchecked"` | — | Estado actual del control. | `status={selected ? 'checked' : 'unchecked'}` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#325DA8', onPrimary: '#FFFFFF' } }}` |
| `uncheckedColor` | `string` | Tema | Color del indicador sin seleccionar en la fila. | `uncheckedColor="#57627A"` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { RadioButton } from 'mobile-design/react-native';

export default function Example() {
  const [value, setValue] = useState('home');

  return (
    <RadioButton.Group
      value={value}
      onValueChange={setValue}
      accessibilityLabel="Ship to"
    >
      <RadioButton.Item
        position="leading"
        value="home"
        label="Home"
        description="123 Main Street"
      />
      <RadioButton.Item
        position="leading"
        value="office"
        label="Office"
        description="456 Market Street"
      />
    </RadioButton.Group>
  );
}
```


**Ejemplo de `RadioButton` con control directo del estado**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { RadioButton, Text } from 'mobile-design/react-native';

const options = [{ id: 'pdf', label: 'PDF' }, { id: 'csv', label: 'CSV' }] as const;

export default function ExportFormat() {
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {options.map((option) => (
        <View key={option.id} style={{ alignItems: 'center' }}>
          <Text>{option.label}</Text>
          <RadioButton
            value={option.id}
            status={format === option.id ? 'checked' : 'unchecked'}
            onPress={() => setFormat(option.id)}
            testID={`export-format-${option.id}`}
          />
        </View>
      ))}
    </View>
  );
}
```

#### Switch

Activa o desactiva una configuración binaria mediante un track y un handle que expresan el estado.

- Controla value y actualízalo desde onValueChange. Aplica el ajuste al activarlo. No añadas Guardar ni una confirmación diferida.
- Coloca una etiqueta visible al lado y usa el mismo nombre estable en accessibilityLabel. La etiqueta describe el efecto de estar activado, sin cambiar a una instrucción de activar/desactivar.
- checkedIcon y uncheckedIcon permiten las tres configuraciones. Sin iconos, sólo un icono seleccionado, o un icono en cada estado. Usa símbolos claros como check y close.
- Si una fila controla la selección, muestra el Switch como decoración con accessible=false y sin onValueChange. La fila debe ser el único objetivo y anunciar su valor. Sin callback propio, Switch no crea otro destino interactivo.

**Propiedades de `Switch`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Recibe avisos sobre el estado de tu pedido"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Avisos de entrega"` |
| `accessible` | `boolean` | `true` | Usa `false` cuando la fila contenedora ya comunica el estado del interruptor y gestiona su activación. | `accessible={false}` cuando la fila padre ya anuncia y activa el interruptor |
| `checkedIcon` | `any` | — | Icono de un interruptor activado. | `checkedIcon="check"` para marcar la preferencia activa |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `onValueChange` | `((value: boolean) => void)` | — | Entrega el siguiente valor para actualizar el estado del consumidor. | `onValueChange={setNotificationsEnabled}` para actualizar la preferencia |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | `'mobile-switch'` | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#325DA8', onPrimary: '#FFFFFF' } }}` |
| `uncheckedIcon` | `any` | — | Icono de un interruptor desactivado. | `uncheckedIcon="close"` para la preferencia inactiva |
| `value` | `boolean` | `false` | Estado booleano de la configuración. | `value={notificationsEnabled}` con `const [notificationsEnabled, setNotificationsEnabled] = useState(false)` |

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import {
  Switch,
  Text,
  useMobileTheme,
  useLocale,
} from 'mobile-design/react-native';

export default function Example() {
  const { direction } = useLocale();
  const theme = useMobileTheme();
  const [enabled, setEnabled] = useState(true);

  return (
    <View
      style={{
        direction: 'ltr',
        flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <Text
        variant="bodyLarge"
        style={{ flex: 1, color: theme.colors.onSurface }}
      >
        Descargar sólo con Wi-Fi
      </Text>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        accessibilityLabel="Descargar sólo con Wi-Fi"
      />
    </View>
  );
}
```

#### Slider y RangeSlider

Permite recorrer un intervalo con control continuo o discreto, en una o dos posiciones.

- Usa Slider para standard o centered y RangeSlider para dos límites. Controla value/onValueChange. Step=0 es continuo y un step positivo define las detenciones de stops.
- Define minimumValue y maximumValue finitos. Cada extremo del rango tiene su propio nombre accesible. MinimumRange mantiene la separación sin cruzar los controles.
- Los tamaños xs, sm, md, lg y xl usan pistas de 16, 24, 40, 56 y 96 dp y controles de 44, 44, 52, 68 y 108 dp. Length define el ancho horizontal o la altura vertical.
- leadingIcon/trailingIcon se reservan a standard en md, lg y xl. ValueIndicator permite mostrar el valor durante la interacción, de forma permanente o nunca. ValueSuffix añade la unidad.

Publica una vista previa con `onValueChange` y confirma en `onSlidingComplete`. `onSlidingCancel` permite descartar el borrador. En el rango, usa una etiqueta diferente por cada extremo.

**Propiedades de `Slider`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `onValueChange` · requerida | `(value: number) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. | `onValueChange={setVolume}` para actualizar la vista durante el gesto |
| `value` · requerida | `number` | — | Posición actual del control dentro de los límites configurados. | `value={volume}` con `const [volume, setVolume] = useState(40)` |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Toca dos veces para confirmar"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Temperatura objetivo"` |
| `centered` | `boolean` | — | Extiende la pista activa desde el centro del intervalo, por ejemplo para valores positivos y negativos. | `centered` con `minimumValue={-10}` y `maximumValue={10}` para un ajuste con cero al centro |
| `continuousTickCount` | `number` | — | Número de marcas visuales equidistantes en una pista continua. El gesto se mantiene continuo. | `continuousTickCount={5}` con `step={0}` para dibujar cinco marcas sin escalones |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `leadingIcon` | `any` | — | Icono al inicio del control. | `leadingIcon="device_thermostat"` con `size="md"` y el control estándar |
| `length` | `number` | — | Ancho en un control horizontal o altura en uno vertical. La altura vertical predeterminada es de 240 dp. | `length={220}` para un control vertical de 220 dp |
| `maximumValue` | `number` | — | Extremo superior del intervalo. | `maximumValue={100}` para un porcentaje |
| `minimumValue` | `number` | — | Extremo inferior del intervalo. | `minimumValue={0}` para un porcentaje |
| `onSlidingCancel` | `((value: number) => void)` | — | Avisa de una interacción cancelada para descartar el borrador. | `onSlidingCancel={() => setDraftVolume(savedVolume)}` |
| `onSlidingComplete` | `((value: number) => void)` | — | Recibe el valor confirmado al terminar el gesto. | `onSlidingComplete={setSavedVolume}` para confirmar al soltar |
| `onSlidingStart` | `((value: number) => void)` | — | Avisa al iniciar el gesto. | `onSlidingStart={(initial) => setVolumeBeforeDrag(initial)}` |
| `orientation` | `"horizontal" \| "vertical"` | — | Eje de la composición. | `orientation="vertical"` para mostrar el control en vertical |
| `reversed` | `boolean` | — | Invierte la dirección visual de la pista y conserva los valores numéricos. | `reversed` para situar el máximo al inicio de la pista |
| `showStopIndicator` | `boolean` | — | Muestra la marca de final de pista. | `showStopIndicator={false}` para ocultar la marca final de la pista |
| `showTicks` | `boolean` | — | Muestra las marcas del intervalo. | `showTicks` con `step={10}` para marcar cada decena |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | — | Tamaño visual o escala semántica del control. | `size="md"` para una pista con espacio para iconos |
| `step` | `number` | — | Incremento entre paradas. Cero conserva el control continuo. | `step={5}` para avanzar de cinco en cinco |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `trailingIcon` | `any` | — | Icono al final del control. | `trailingIcon="device_thermostat"` con `size="md"` y el control estándar |
| `valueIndicator` | `"never" \| "always" \| "on-drag"` | — | Configura cuándo se muestra la etiqueta del valor. | `valueIndicator="always"` para mostrar la lectura incluso fuera del gesto |
| `valueLabel` | `string` | — | Etiqueta de la lectura del valor. Pasa una cadena vacía para mostrar solo el número. | `valueLabel="Volumen"` |
| `valuePrecision` | `number` | — | Decimales del indicador y del texto accesible. `step` controla por separado el incremento de la selección. | `valuePrecision={1}` para mostrar un decimal |
| `valueSuffix` | `string` | — | Unidad o texto que acompaña al número. | `valueSuffix=" %"` |

<details>
<summary>Configuración complementaria de Slider y RangeSlider</summary>

**`RangeSlider`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `onValueChange` · requerida | `(value: [number, number]) => void` | — | Entrega los dos extremos actuales para actualizar el estado. | `onValueChange={setRange}` para actualizar los dos extremos |
| `value` · requerida | `readonly [number, number]` | — | Par controlado con mínimo y máximo del intervalo seleccionado. | `value={range}` con `const [range, setRange] = useState<[number, number]>([18, 24])` |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Toca dos veces para confirmar"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Rango de temperatura"` |
| `continuousTickCount` | `number` | — | Número de marcas visuales equidistantes en una pista continua. El gesto se mantiene continuo. | `continuousTickCount={5}` con `step={0}` para dibujar cinco marcas sin escalones |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `endAccessibilityLabel` | `string` | — | Nombre accesible del extremo superior del rango. | `endAccessibilityLabel="Temperatura máxima"` |
| `leadingIcon` | `any` | — | Icono al inicio del control. | Usa `leadingIcon="device_thermostat"` con `Slider` `size="md"`. `RangeSlider` lanza un error si recibe un icono dentro de la pista. |
| `length` | `number` | — | Ancho en un control horizontal o altura en uno vertical. La altura vertical predeterminada es de 240 dp. | `length={220}` para un control vertical de 220 dp |
| `maximumValue` | `number` | — | Extremo superior del intervalo. | `maximumValue={35}` para un rango de temperatura |
| `minimumRange` | `number` | — | Separación mínima entre los dos extremos. | `minimumRange={5}` para separar al menos cinco grados ambos extremos |
| `minimumValue` | `number` | — | Extremo inferior del intervalo. | `minimumValue={10}` para un rango de temperatura |
| `onSlidingCancel` | `((value: [number, number]) => void)` | — | Avisa de una interacción cancelada para descartar el borrador. | `onSlidingCancel={() => setRange(accepted)}` para restaurar los dos extremos confirmados |
| `onSlidingComplete` | `((value: [number, number]) => void)` | — | Recibe el valor confirmado al terminar el gesto. | `onSlidingComplete={setAccepted}` para confirmar el intervalo completo |
| `onSlidingStart` | `((value: [number, number]) => void)` | — | Avisa al iniciar el gesto. | `onSlidingStart={([min, max]) => setInitialRange([min, max])}` |
| `orientation` | `"horizontal" \| "vertical"` | — | Eje de la composición. | `orientation="vertical"` para mostrar el control en vertical |
| `reversed` | `boolean` | — | Invierte la dirección visual de la pista y conserva los valores numéricos. | `reversed` para situar el máximo al inicio de la pista |
| `showStopIndicator` | `boolean` | — | Muestra la marca de final de pista. | `showStopIndicator={false}` para ocultar la marca final de la pista |
| `showTicks` | `boolean` | — | Muestra las marcas del intervalo. | `showTicks` con `step={10}` para marcar cada decena |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | — | Tamaño visual o escala semántica del control. | `size="md"` para aumentar el grosor de la pista |
| `startAccessibilityLabel` | `string` | — | Nombre accesible del extremo inferior del rango. | `startAccessibilityLabel="Temperatura mínima"` |
| `step` | `number` | — | Incremento entre paradas. Cero conserva el control continuo. | `step={5}` para avanzar de cinco en cinco |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `trailingIcon` | `any` | — | Icono al final del control. | Usa `trailingIcon="device_thermostat"` con `Slider` `size="md"`. Para un rango, monta el icono junto al control. |
| `valueIndicator` | `"never" \| "always" \| "on-drag"` | — | Configura cuándo se muestra la etiqueta del valor. | `valueIndicator="always"` para mostrar la lectura incluso fuera del gesto |
| `valueLabel` | `string` | — | Etiqueta de la lectura del valor. Pasa una cadena vacía para mostrar solo el número. | `valueLabel="Temperatura"` |
| `valuePrecision` | `number` | — | Decimales del indicador y del texto accesible. `step` controla por separado el incremento de la selección. | `valuePrecision={1}` para mostrar un decimal |
| `valueSuffix` | `string` | — | Unidad o texto que acompaña al número. | `valueSuffix=" °C"` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { Slider } from 'mobile-design/react-native';

export default function Example() {
  const [value, setValue] = useState(40);

  return (
    <Slider
      value={value}
      onValueChange={setValue}
      minimumValue={0}
      maximumValue={100}
      step={5}
      accessibilityLabel="Volumen"
      valueSuffix="%"
    />
  );
}
```


**Ejemplo de `RangeSlider` con confirmación y cancelación**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { RangeSlider, Text } from 'mobile-design/react-native';

type TemperatureRange = [number, number];

export default function TemperatureFilter() {
  const [accepted, setAccepted] = useState<TemperatureRange>([18, 24]);
  const [draft, setDraft] = useState<TemperatureRange>(accepted);

  return (
    <View style={{ gap: 8 }}>
      <Text>Temperatura elegida {accepted[0]} a {accepted[1]} °C</Text>
      <RangeSlider
        value={draft}
        minimumValue={10}
        maximumValue={35}
        minimumRange={3}
        step={1}
        size="md"
        valueIndicator="on-drag"
        valueSuffix=" °C"
        startAccessibilityLabel="Temperatura mínima"
        endAccessibilityLabel="Temperatura máxima"
        onValueChange={setDraft}
        onSlidingComplete={(next) => {
          setDraft(next);
          setAccepted(next);
        }}
        onSlidingCancel={() => setDraft(accepted)}
      />
    </View>
  );
}
```

#### DatePicker y DockedDatePicker

Permite elegir días mediante calendario, entrada manual o un selector anclado al campo.

- Controla visible, value, onChange y onDismiss. Mode distingue fecha simple de rango.
- Define locale, firstDayOfWeek y límites cuando la tarea los requiera. DockedDatePicker aporta la composición anclada.

En modo simple el valor confirmado es un `Date`. En rango usa un objeto `DateRange` con `start` y `end`. Conviene tratar los días como fechas del calendario local y decidir explícitamente cómo se guardan. El callback de cambio recibe el resultado confirmado.

**Propiedades de `DatePicker`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `onChange` · requerida | `((date: Date) => void) \| ((range: DateRange) => void)` | — | Entrega el día o el rango confirmado, según el modo. | `onChange={setArrivalDate}` al confirmar la fecha de llegada |
| `onDismiss` · requerida | `() => void` | — | Solicita cerrar la superficie. | `onDismiss={() => setDatePickerOpen(false)}` |
| `visible` · requerida | `boolean` | — | Controla si la superficie o el indicador se presenta. | `visible={dialogOpen}` para mostrar el selector al abrir el formulario |
| `cancelLabel` | `string` | — | Etiqueta de la acción para descartar. | `cancelLabel="Descartar"` |
| `confirmLabel` | `string` | — | Etiqueta de la acción para confirmar. | `confirmLabel="Confirmar reserva"` |
| `firstDayOfWeek` | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` | — | Índice del día que inicia la cuadrícula del calendario. | `firstDayOfWeek={1}` para comenzar el calendario en lunes |
| `initialCalendarView` | `"days" \| "years"` | — | Vista de calendario inicial. | `initialCalendarView="years"` para elegir primero el año |
| `initialDisplayMode` | `"calendar" \| "input"` | — | Modo inicial de calendario o entrada manual según el componente. | `initialDisplayMode="input"` para iniciar en la entrada manual |
| `isDateDisabled` | `((date: Date) => boolean)` | — | Predicado para bloquear fechas específicas. | `isDateDisabled={(day) => day.getDay() === 0}` para bloquear los domingos |
| `locale` | `string` | — | Locale utilizado para mostrar y analizar las fechas. | `locale="es-MX"` para el formato de fecha mexicano |
| `maximumDate` | `Date` | — | Última fecha que se permite elegir. | `maximumDate={new Date(2026, 11, 31)}` para cerrar reservas al terminar el año |
| `minimumDate` | `Date` | — | Primera fecha que se permite elegir. | `minimumDate={new Date(2026, 10, 1)}` para abrir reservas a partir de noviembre |
| `mode` | `"single" \| "range"` | — | Elige entre `single` y `range`. | `mode="range"` para reservar varios días |
| `presentation` | `"dialog" \| "full-screen"` | — | Modo de presentación visual o colocación. | `presentation="full-screen"` para un calendario que usa la ventana completa |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` para mostrar el indicador vertical |
| `showClearButton` | `boolean` | — | Muestra la acción para limpiar la selección. | `showClearButton={true}` para limpiar la selección provisional |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `title` | `string` | — | Título visible o contenido principal. | `title="Elegir fecha de llegada"` |
| `value` | `Date \| DateRange` | — | Valor actual controlado por la pantalla. | `value={arrivalDate}` con `const [arrivalDate, setArrivalDate] = useState<Date>()` |

<details>
<summary>Configuración complementaria de DatePicker y DockedDatePicker</summary>

**`DockedDatePicker`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `onChange` · requerida | `(date: Date) => void` | — | Entrega la selección confirmada en el selector anclado. | `onChange={setDeliveryDay}` para confirmar la fecha de entrega |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={saving}` mientras se guarda la edición |
| `firstDayOfWeek` | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` | `0` | Índice del día que inicia la cuadrícula del calendario. | `firstDayOfWeek={1}` para comenzar el calendario en lunes |
| `initialCalendarView` | `"days" \| "years" \| "months"` | `'days'` | Vista de calendario inicial. | `initialCalendarView="months"` para elegir primero el mes |
| `initiallyOpen` | `boolean` | `false` | Abre el calendario al montar cuando la apertura es interna. | `initiallyOpen={true}` para mostrar el selector al montar sin controlar open |
| `isDateDisabled` | `((date: Date) => boolean)` | — | Predicado para bloquear fechas específicas. | `isDateDisabled={(day) => day.getDay() === 0}` para bloquear los domingos |
| `label` | `string` | `'Fecha del evento'` | Etiqueta visible que describe la acción u opción. | `label="Fecha de entrega"` |
| `locale` | `string` | `'es-MX'` | Locale utilizado para mostrar y analizar las fechas. | `locale="es-MX"` para el formato de fecha mexicano |
| `maximumDate` | `Date` | — | Última fecha que se permite elegir. | `maximumDate={new Date(2026, 11, 31)}` para cerrar reservas al terminar el año |
| `minimumDate` | `Date` | — | Primera fecha que se permite elegir. | `minimumDate={new Date(2026, 10, 1)}` para abrir reservas a partir de noviembre |
| `onOpenChange` | `((open: boolean) => void)` | — | Solicita abrir o cerrar. Actualiza `open` en la pantalla. | `onOpenChange={setCalendarOpen}` para coordinar la apertura del calendario |
| `open` | `boolean` | — | Controla si la superficie está abierta. | `open={calendarOpen}` junto con `onOpenChange={setCalendarOpen}` |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` para mostrar el indicador vertical |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'flex-start', marginTop: 8 }}` |
| `testID` | `string` | `'docked-date-picker'` | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `value` | `Date` | — | Valor actual controlado por la pantalla. | `value={deliveryDay}` con `const [deliveryDay, setDeliveryDay] = useState<Date>()` |

**`DateRange`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `end` · requerida | `Date` | — | Último día del intervalo de fechas. | `end: new Date(2026, 10, 10)` |
| `start` · requerida | `Date` | — | Primer día del intervalo de fechas. | `start: new Date(2026, 10, 7)` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { Button, DatePicker } from 'mobile-design/react-native';

export default function Example() {
  const [visible, setVisible] = useState(false);
  const [date, setDate] = useState(new Date(2026, 10, 3));

  return (
    <>
      <Button onPress={() => setVisible(true)}>Elegir fecha</Button>
      <DatePicker
        mode="single"
        visible={visible}
        value={date}
        locale="es-MX"
        onDismiss={() => setVisible(false)}
        onChange={(next) => {
          setDate(next);
          setVisible(false);
        }}
      />
    </>
  );
}
```


**Ejemplo de `DockedDatePicker` con fecha editable y días bloqueados**

```tsx
import { useState } from 'react';
import { DockedDatePicker } from 'mobile-design/react-native';

export default function DeliveryDate() {
  const [day, setDay] = useState<Date>();

  return (
    <DockedDatePicker
      label="Fecha de entrega"
      locale="es-MX"
      firstDayOfWeek={1}
      value={day}
      onChange={setDay}
      minimumDate={new Date()}
      isDateDisabled={(date) => date.getDay() === 0}
    />
  );
}
```

**Ejemplo de `DatePicker` con rango y confirmación**

```tsx
import { useState } from 'react';
import { Button, DatePicker, Text, type DateRange } from 'mobile-design/react-native';

export default function BookingDates() {
  const [visible, setVisible] = useState(false);
  const [range, setRange] = useState<DateRange>();
  const dayFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' });

  return (
    <>
      <Button onPress={() => setVisible(true)}>Elegir fechas</Button>
      {range && <Text>{dayFormat.format(range.start)} a {dayFormat.format(range.end)}</Text>}
      <DatePicker
        mode="range"
        visible={visible}
        value={range}
        title="Fechas de la reserva"
        confirmLabel="Confirmar fechas"
        minimumDate={new Date()}
        onDismiss={() => setVisible(false)}
        onChange={(next) => {
          setRange(next);
          setVisible(false);
        }}
      />
    </>
  );
}
```

#### TimePicker

Selecciona hora y minutos en formato de 12 o 24 horas, con un borrador que se confirma explícitamente.

- Controla visible y value como { hours, minutes }, y acepta el resultado en onConfirm.
- Define is24Hour y el modo inicial. El valor usa horas de 0 a 23 incluso cuando la presentación es de 12 horas.
- Personaliza title e inputTitle para nombrar el reloj y la entrada manual.

El objeto `TimeValue` siempre usa `hours` de 0 a 23 y `minutes` de 0 a 59. `is24Hour` modifica la presentación. Cierra o confirma desde los callbacks y guarda el valor confirmado en el estado de la pantalla.

**Propiedades de `TimePicker`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `onConfirm` · requerida | `(value: TimeValue) => void` | — | Entrega el borrador validado al confirmar. | `onConfirm={(next) => { setStartTime(next); setClockOpen(false) }}` |
| `onDismiss` · requerida | `() => void` | — | Solicita cerrar la superficie. | `onDismiss={() => setClockOpen(false)}` |
| `value` · requerida | `TimeValue` | — | Valor actual controlado por la pantalla. | `value={{ hours: 14, minutes: 30 }}` para mostrar 14:30 |
| `visible` · requerida | `boolean` | — | Controla si la superficie o el indicador se presenta. | `visible={clockOpen}` tras pulsar Elegir hora |
| `autoSwitchToMinutes` | `boolean` | — | Avanza a los minutos al elegir la hora. La exploración táctil nativa conserva el foco y en web el avance automático se activa con puntero. | `autoSwitchToMinutes={false}` para dejar al usuario en la selección de horas |
| `cancelLabel` | `string` | — | Etiqueta de la acción para descartar. | `cancelLabel="Descartar"` |
| `confirmLabel` | `string` | — | Etiqueta de la acción para confirmar. | `confirmLabel="Confirmar reserva"` |
| `dialModeLabel` | `string` | — | Nombre del control que activa el reloj. | `dialModeLabel="Cambiar al reloj"` |
| `hourLabel` | `string` | — | Nombre del control para editar horas. | `hourLabel="Hora de inicio"` |
| `initialDisplayMode` | `"input" \| "dial"` | — | Selecciona reloj o entrada manual como vista inicial. | `initialDisplayMode="input"` para iniciar en la entrada manual |
| `initialSelection` | `"hours" \| "minutes"` | — | Parte de la hora que se edita al abrir. | `initialSelection="minutes"` para editar primero los minutos |
| `inputTitle` | `string` | — | Título cuando se usa la entrada manual. | `inputTitle="Escribe la hora de inicio"` |
| `invalidTimeLabel` | `string` | — | Mensaje asociado a una hora inválida. | `invalidTimeLabel="Escribe una hora válida"` |
| `is24Hour` | `boolean` | — | Usa una presentación de 24 horas. | `is24Hour={true}` para presentar 14:30 |
| `keyboardModeLabel` | `string` | — | Nombre del control que activa la entrada manual. | `keyboardModeLabel="Cambiar al teclado numérico"` |
| `minuteLabel` | `string` | — | Nombre del control para editar minutos. | `minuteLabel="Minutos de inicio"` |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` para mostrar el indicador vertical |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="booking-confirm"` para localizar el control en pruebas |
| `title` | `string` | — | Título visible o contenido principal. | `title="Hora de inicio"` |

<details>
<summary>Configuración complementaria de TimePicker</summary>

**`TimeValue`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `hours` · requerida | `number` | — | Hora de 0 a 23 en ambos formatos de presentación. | `hours: 14` |
| `minutes` · requerida | `number` | — | Minutos de 0 a 59. | `minutes: 30` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { Button, TimePicker } from 'mobile-design/react-native';

export default function Example() {
  const [visible, setVisible] = useState(false);
  const [time, setTime] = useState({ hours: 15, minutes: 45 });

  return (
    <>
      <Button onPress={() => setVisible(true)}>Elegir hora</Button>
      <TimePicker
        visible={visible}
        value={time}
        is24Hour={false}
        onDismiss={() => setVisible(false)}
        onConfirm={(next) => {
          setTime(next);
          setVisible(false);
        }}
      />
    </>
  );
}
```

### Navegación y búsqueda

#### TopAppBar

Ofrece contexto, navegación y acciones relacionadas con la pantalla. Las barras flexibles responden al desplazamiento del contenido.

- Elige variant y proporciona title. Subtitle, navigationIcon y actions completan la anatomía.
- Para una barra desplazable, conecta useAppBarScrollBehavior con la barra y el contenido de la misma pantalla. El host decide navegación y rutas.

**Propiedades de `TopAppBar`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `title` · requerida | `ReactNode` | — | Título visible o contenido principal. | `title="Tu biblioteca"` |
| `actions` | `readonly TopAppBarAction[]` | `[]` | Acciones relacionadas de la composición. | `actions={[{ key: "search", icon: "search", label: "Buscar", onPress: abrirBusqueda }]}` |
| `collapsedTitle` | `ReactNode` | — | Título mostrado al contraer la barra. | `collapsedTitle="Biblioteca"` para un encabezado compacto |
| `collapseProgress` | `SharedValue<number>` | — | Progreso de contracción. Usa 0 para la barra expandida y 1 para la contraída. Enlaza el desplazamiento en el hilo de interfaz. | `collapseProgress={progresoDeScroll}` con 0 al inicio y 1 al contraer |
| `containerColor` | `ColorValue` | — | Color de la superficie del control. | `containerColor={theme.colors.surface}` |
| `containerColorSource` | `Readonly<Pick<SharedValue<ColorValue>, "get">>` | — | Color animado de la superficie en el hilo de interfaz, por ejemplo durante el desplazamiento. | `containerColorSource={colorDelEncabezado}` donde un valor derivado cambia con el scroll |
| `image` | `ReactNode` | — | Logotipo o imagen sobre el título en las variantes flexibles. | `image={<Image source={logoBiblioteca} style={{ width: 56, height: 56 }} />}` |
| `leading` | `ReactNode` | — | Slot al inicio lógico del contenido. | `leading={<Avatar.Text label="BL" size={32} />}` |
| `navigationIcon` | `any` | — | Icono de navegación al inicio de la barra. | `navigationIcon="arrow_back"` |
| `navigationLabel` | `string` | `'Volver'` | Nombre accesible del control de navegación. | `navigationLabel="Volver a colecciones"` |
| `navigationMode` | `"outlined" \| "contained" \| "contained-tonal"` | — | Tratamiento del botón de navegación. | `navigationMode="contained-tonal"` sobre una superficie con foto |
| `navigationWidthVariant` | `"narrow" \| "default" \| "wide"` | — | Ancho visual del botón de navegación. | `navigationWidthVariant="wide"` para dar énfasis a Volver |
| `onNavigationPress` | `(() => void)` | — | Acción asociada al botón de navegación. | `onNavigationPress={regresarAColecciones}` |
| `scrollBehavior` | `AppBarScrollBehavior` | — | Estado y callbacks compartidos con el contenedor desplazable. | `scrollBehavior={barra}` junto con onScroll={barra.onScroll} en Animated.ScrollView |
| `scrolled` | `boolean` | `false` | Marca la apariencia de la barra cuando el contenido está desplazado. | `scrolled={offsetY > 0}` si la pantalla controla el desplazamiento |
| `scrolledContainerColor` | `ColorValue` | — | Color de la superficie al desplazar. | `scrolledContainerColor={theme.colors.surfaceContainer}` |
| `scrolledSearchContainerColor` | `ColorValue` | — | Color de la superficie de búsqueda al desplazar. | `scrolledSearchContainerColor={theme.colors.surfaceContainerHigh}` |
| `search` | `ReactNode` | — | Punto de entrada de un `SearchView` controlado dentro de la barra. | `search={<SearchView {...busquedaControlada} barContainerColor="transparent" />}` |
| `searchContainerColor` | `ColorValue` | — | Color del contenedor de búsqueda. Usa un fondo transparente en el disparador hijo para dejar visible este color. | `searchContainerColor={theme.colors.surfaceContainerLow}` |
| `statusBarHeight` | `number` | — | Espacio que debe reservar la barra para la barra de estado. | `statusBarHeight={0}` si un contenedor ya reserva el inset superior |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `subtitle` | `string` | — | Contenido secundario bajo el título. | `subtitle="5 colecciones guardadas"` |
| `testID` | `string` | `'mobile-top-appbar'` | Identificador para automatización en el host. | `testID="biblioteca-appbar"` |
| `textAlign` | `"start" \| "center"` | `'start'` | Alineación del título. | `textAlign="center"` en una portada de biblioteca |
| `trailing` | `ReactNode` | — | Slot al final lógico del contenido. | `trailing={<IconButton icon="more_vert" accessibilityLabel="Opciones" onPress={abrirOpciones} />}` |
| `variant` | `"small" \| "medium-flexible" \| "large-flexible"` | `'small'` | Tratamiento visual o modalidad del componente. | `variant="large-flexible"` para una cabecera con imagen |

<details>
<summary>Configuración complementaria de TopAppBar</summary>

**`useAppBarScrollBehavior`**

Crea el estado y los callbacks de desplazamiento. Enlaza su resultado con `scrollBehavior` en la barra y con `onScroll` del contenedor. El ejemplo usa un único controlador.

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `behavior` | `AppBarScrollMode` | `'exit-until-collapsed'` | Indica cómo se contrae la barra al desplazar el contenido. | `useAppBarScrollBehavior({ behavior: "enter-always" })` para recuperar la barra al volver arriba |
| `snap` | `boolean` | `true` | Activa el ajuste a las posiciones de reposo al terminar el desplazamiento. | `useAppBarScrollBehavior({ snap: false })` para mantener la posición intermedia |

El hook devuelve un `AppBarScrollBehavior` con estos miembros para la pantalla.

| Miembro | Uso | Ejemplo |
| --- | --- | --- |
| `onScroll` | Handler de desplazamiento de Reanimated. | `<Animated.ScrollView onScroll={bar.onScroll} scrollEventThrottle={16} />` |
| `collapseProgress` | Valor compartido de `0` a `1` con la proporción contraída. | `useDerivedValue(() => 1 - bar.collapseProgress.get())` para la opacidad de un encabezado asociado. |
| `heightOffset` | Desplazamiento vertical de la barra. Parte de `0` y se vuelve negativo al contraerse. | `useAnimatedStyle(() => ({ transform: [{ translateY: bar.heightOffset.get() }] }))` para un elemento que acompaña la barra. |
| `reset()` | Reinicia la barra. El desplazamiento de la lista lo controla la pantalla. | `onPress={() => { bar.reset(); scrollRef.current?.scrollTo({ y: 0 }); }}` |

**`TopAppBarAction`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `icon` · requerida | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: "search"` |
| `key` · requerida | `string` | — | Identificador único y estable dentro del conjunto. | `key: "search"` |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label: "Buscar en biblioteca"` |
| `onPress` · requerida | `((event: GestureResponderEvent) => unknown) & ((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress: abrirBusqueda` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: indexando` si se está creando el índice |
| `mode` | `"contained" \| "contained-tonal" \| "outlined"` | — | Modo de uso admitido por este componente. | `mode: "contained-tonal"` para la acción principal |
| `widthVariant` | `"narrow" \| "default" \| "wide"` | — | Proporción del botón de icono. | `widthVariant: "wide"` para el icono Buscar |
| `testID` | `string` | — | Identificador para localizar la acción. | `testID: "biblioteca-buscar"` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { TopAppBar, Text } from 'mobile-design/react-native';

export default function Example() {
  const [feedback, setFeedback] = useState('');

  return (
    <View style={{ gap: 16 }}>
      <TopAppBar
        variant="medium-flexible"
        title="Tu biblioteca"
        navigationIcon="arrow_back"
        navigationLabel="Volver"
        onNavigationPress={() =>
          setFeedback(
            'Navegación. Regresar a la pantalla anterior',
          )
        }
        actions={[
          {
            key: 'search',
            icon: 'search',
            label: 'Buscar',
            onPress: () => setFeedback('Buscar'),
          },
        ]}
      />
      <Text accessibilityLiveRegion="polite">{feedback}</Text>
    </View>
  );
}
```

**Barra flexible conectada al scroll**

La barra y la lista comparten el controlador. El modo `exit-until-collapsed` conserva la cabecera compacta al bajar. Al subir hasta el inicio, reaparece el título expandido.

```tsx
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text, TopAppBar, useAppBarScrollBehavior } from 'mobile-design/react-native';

export function BibliotecaDesplazable() {
  const barra = useAppBarScrollBehavior({ behavior: 'exit-until-collapsed', snap: true });

  return (
    <View style={{ flex: 1 }}>
      <TopAppBar
        title="Tu biblioteca"
        collapsedTitle="Biblioteca"
        subtitle="Colecciones guardadas"
        variant="large-flexible"
        scrollBehavior={barra}
      />
      <Animated.ScrollView onScroll={barra.onScroll} scrollEventThrottle={16}>
        {Array.from({ length: 25 }, (_, index) => (
          <Text key={index} style={{ padding: 16 }}>Colección {index + 1}</Text>
        ))}
      </Animated.ScrollView>
    </View>
  );
}
```

#### NavigationBar

Permite cambiar entre destinos principales de una interfaz compacta con iconos, etiquetas e indicadores.

- Define items con key estable, label e icon y conecta value/onValueChange.
- Usa entre tres y cinco destinos principales, con iconos y etiquetas breves siempre visibles. Proporciona selectedIcon para representar el destino activo con un icono relleno.
- La barra flexible usa variant="short" y una altura mínima de 64 dp. En ventanas compactas combina iconPosition="top" con arrangement="equal". En ventanas medianas combina iconPosition="start" con arrangement="centered".
- Los indicadores verticales miden 56 × 32 dp en `short` y 64 × 32 dp en `standard`. Los horizontales tienen una altura mínima de 40 dp e incluyen el icono y la etiqueta, separados por 4 dp. El grupo centrado reduce sus anchos cuando el espacio disponible lo requiere.
- Sitúa la barra al fondo de la pantalla. SafeArea añade los insets del dispositivo. Usa safeArea={false} dentro de un ejemplo o contenedor que ya los incluya. AccessibilityLabel permite nombrar el conjunto de destinos.

La barra reporta claves de destino. La pantalla decide qué ruta abrir, qué destino está activo y dónde anclar el conjunto. Si la pantalla ya incorpora el inset inferior, configura `safeArea={false}`.

**Propiedades de `NavigationBar`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `items` · requerida | `readonly NavigationDestination[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. | `items={destinos}` con las claves inicio, biblioteca y archivo |
| `onValueChange` · requerida | `(key: string) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. | `onValueChange={setDestino}` para cambiar la pantalla activa |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value={destino}` con "biblioteca" como destino activo |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="destinos principales"` |
| `arrangement` | `"centered" \| "equal"` | `'centered'` con `short` e iconos al inicio. `'equal'` en los demás casos. | Distribución de destinos a lo ancho de la barra. | `arrangement="centered"` en una ventana mediana |
| `iconPosition` | `"start" \| "top"` | `'top'` | Posición lógica del icono respecto de la etiqueta. | `iconPosition="start"` para poner el icono junto a la etiqueta |
| `labelVisibility` | `"none" \| "selected" \| "all"` | `'all'` | Configura cuándo se muestra la etiqueta visual. | `labelVisibility="selected"` cuando el espacio es reducido |
| `leading` | `ReactNode` | — | Slot al inicio lógico del contenido. | `leading={<MaterialSymbol name="folder" />}` |
| `safeArea` | `boolean` | `true` | Incluye los insets correspondientes de la ventana. | `safeArea={false} dentro de una pantalla que ya añade el inset inferior` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | `'mobile-navigation-bar'` | Identificador para automatización en el host. | `testID="biblioteca-barra"` |
| `trailing` | `ReactNode` | — | Slot al final lógico del contenido. | `trailing={<IconButton icon="more_vert" accessibilityLabel="Opciones" onPress={abrirOpciones} />}` |
| `variant` | `"standard" \| "short"` | `'short'` | Tratamiento visual o modalidad del componente. | `variant="short"` en la barra flexible |

<details>
<summary>Configuración complementaria de NavigationBar</summary>

**`NavigationDestination`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `icon` · requerida | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: "folder"` |
| `key` · requerida | `string` | — | Identificador único y estable dentro del conjunto. | `key: "biblioteca"` |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label: "Biblioteca"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel: "Biblioteca, ocho documentos nuevos"` |
| `badge` | `string \| number \| boolean` | — | Insignia que acompaña al elemento de menú. | `badge: 8` para indicar nuevas incorporaciones |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: !cuentaActiva` en un destino que requiere cuenta |
| `hiddenWhenCollapsed` | `boolean` | — | Oculta el destino cuando el rail se contrae, excepto si es el destino seleccionado. | `hiddenWhenCollapsed: true` para Archivo |
| `section` | `string` | — | Etiqueta de la sección que agrupa destinos consecutivos en el drawer. | `section: "Colecciones"` |
| `selectedIcon` | `any` | — | Icono alternativo para el estado activo. | `selectedIcon: "folder_fill1"` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { NavigationBar } from 'mobile-design/react-native';

export default function Example() {
  const [value, setValue] = useState('home');

  return (
    <NavigationBar
      value={value}
      onValueChange={setValue}
      items={[
        {
          key: 'home',
          label: 'Inicio',
          icon: 'home-outline',
          selectedIcon: 'home',
        },
        {
          key: 'library',
          label: 'Biblioteca',
          icon: 'folder-outline',
          badge: 3,
        },
        { key: 'saved', label: 'Guardado', icon: 'bookmark-outline' },
      ]}
    />
  );
}
```

#### NavigationRail

Mantiene destinos principales en una columna que puede expandirse para dar contexto adicional.

- Pasa items, value y onValueChange y coloca el rail al inicio lógico del layout, junto al contenido. La pantalla decide el breakpoint y sus rutas.
- Controla expanded/onExpandedChange para alternar las presentaciones contraída y expandida. Header, footer y fab son slots opcionales. El FAB debe tener elevación 0 y puede pasar a Extended FAB al expandir.
- En ventanas compactas utiliza NavigationRailModal con open/onOpenChange, o una Navigation bar. La selección comparte el mismo value entre presentaciones. OnClosed permite coordinar una acción al completar la salida.

Controla `expanded` para cambiar de ancho sin reiniciar el destino. La pantalla decide el breakpoint. El modal puede compartir los mismos `items` y `value` con la variante persistente.

**Propiedades de `NavigationRail`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `items` · requerida | `readonly (NavigationDestination & { href?: string; })[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. | `items={destinos}` con las claves inicio, biblioteca y archivo |
| `onValueChange` · requerida | `(key: string) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. | `onValueChange={setDestino}` para cambiar la pantalla activa |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value={destino}` con "biblioteca" como destino activo |
| `accessibilityLabel` | `string` | `'Navegación'` | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="navegación de biblioteca"` |
| `alignment` | `"top" \| "center"` | `'top'` | Alineación de los elementos en su región. | `alignment="center"` para centrar el grupo |
| `collapsedWidth` | `number` | `96` | Ancho del rail contraído. | `collapsedWidth={80}` en un layout ajustado |
| `expanded` | `boolean` | `false` | Estado controlado de expansión. | `expanded={expandido}` para alternar el ancho con el botón del rail |
| `expandedWidth` | `number` | `256` | Ancho del rail expandido. | `expandedWidth={280}` para etiquetas largas |
| `fab` | `ReactNode` | — | Slot para la acción flotante del layout. | `fab={<ExtendedFAB icon="edit" label="Crear" elevation={0} expanded={expandido} onPress={crearBorrador} />}` |
| `footer` | `ReactNode` | — | Contenido que permanece en el pie. | `footer={<Text variant="labelSmall">Modo sin conexión</Text>}` |
| `header` | `ReactNode` | — | Contenido que permanece en la cabecera. | `header={<Text variant="titleMedium">Biblioteca</Text>}` |
| `indicatorWidth` | `"content" \| "full"` | `'content'` | Configura cuánto espacio ocupa el indicador de destino. | `indicatorWidth="full"` para abarcar la fila |
| `labelVisibility` | `"none" \| "selected" \| "all"` | `'all'` | Configura cuándo se muestra la etiqueta visual. | `labelVisibility="selected"` cuando el espacio es reducido |
| `onExpandedChange` | `((expanded: boolean) => void)` | — | Recibe el siguiente estado de expansión. | `onExpandedChange={setExpandido}` |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` si hay contenido fuera de pantalla |
| `showDivider` | `boolean` | `false` | Muestra la separación visual. | `showDivider` junto a un panel del mismo color |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | `'mobile-navigation-rail'` | Identificador para automatización en el host. | `testID="biblioteca-rail"` |
| `toggleAccessibilityLabel` | `string` | — | Nombre accesible personalizado de la acción de menú cuando la expansión cierra el rail modal. | `toggleAccessibilityLabel="Abrir navegación completa"` |

<details>
<summary>Configuración complementaria de NavigationRail</summary>

**`NavigationRailModal`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `items` · requerida | `readonly NavigationDestination[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. | `items={destinos}` con las claves inicio, biblioteca y archivo |
| `onOpenChange` · requerida | `(open: boolean) => void` | — | Solicita abrir o cerrar. Actualiza `open` en la pantalla. | `onOpenChange={setOpen}` para reflejar apertura y cierre |
| `onValueChange` · requerida | `(key: string) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. | `onValueChange={setDestino}` para cambiar la pantalla activa |
| `open` · requerida | `boolean` | — | Controla si la superficie está abierta. | `open={open}` tras pulsar el botón Abrir |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value={destino}` con "biblioteca" como destino activo |
| `alignment` | `"top" \| "center"` | — | Alineación de los elementos en su región. | `alignment="center"` para centrar el grupo |
| `closeOnSelect` | `boolean` | `true` | Cierra la superficie después de elegir un destino. | `closeOnSelect={false}` en una vista que compara destinos |
| `dismissible` | `boolean` | `true` | Permite descartar la superficie con sus gestos y acciones de cierre. | `dismissible={false}` si el usuario debe elegir un destino |
| `fab` | `ReactNode` | — | Slot para la acción flotante del layout. | `fab={<FAB icon="edit" accessibilityLabel="Crear borrador" elevation={0} onPress={crearBorrador} />}` |
| `footer` | `ReactNode` | — | Contenido que permanece en el pie. | `footer={<Text variant="labelSmall">Modo sin conexión</Text>}` |
| `header` | `ReactNode` | — | Contenido que permanece en la cabecera. | `header={<Text variant="titleMedium">Biblioteca</Text>}` |
| `indicatorWidth` | `"content" \| "full"` | — | Configura cuánto espacio ocupa el indicador de destino. | `indicatorWidth="full"` para abarcar la fila |
| `onClosed` | `(() => void)` | — | Avisa cuando concluye la salida de la superficie. | `onClosed={() => contenidoRef.current?.focus()}` al terminar la salida |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` si hay contenido fuera de pantalla |
| `testID` | `string` | `'mobile-navigation-rail-modal'` | Identificador para automatización en el host. | `testID="biblioteca-rail-modal"` |
| `title` | `string` | — | Título visible o contenido principal. | `title="Destinos de la biblioteca"` |
| `width` | `number` | `256` | Ancho de la superficie. | `width={280}` para una navegación modal compacta |

**`NavigationDestination`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `icon` · requerida | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: "folder"` |
| `key` · requerida | `string` | — | Identificador único y estable dentro del conjunto. | `key: "biblioteca"` |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label: "Biblioteca"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel: "Biblioteca, ocho documentos nuevos"` |
| `badge` | `string \| number \| boolean` | — | Insignia que acompaña al elemento de menú. | `badge: 8` para indicar nuevas incorporaciones |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: !cuentaActiva` en un destino que requiere cuenta |
| `hiddenWhenCollapsed` | `boolean` | — | Oculta el destino cuando el rail se contrae, excepto si es el destino seleccionado. | `hiddenWhenCollapsed: true` para Archivo |
| `section` | `string` | — | Etiqueta de la sección que agrupa destinos consecutivos en el drawer. | `section: "Colecciones"` |
| `selectedIcon` | `any` | — | Icono alternativo para el estado activo. | `selectedIcon: "folder_fill1"` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { ExtendedFAB, NavigationRail, Text } from 'mobile-design/react-native';

export default function Example() {
  const [value, setValue] = useState('home');
  const [expanded, setExpanded] = useState(false);
  const [drafts, setDrafts] = useState(0);

  return (
    <View style={{ height: 600, flexDirection: 'row' }}>
      <NavigationRail
        value={value}
        onValueChange={setValue}
        accessibilityLabel="Navegación principal"
        expanded={expanded}
        onExpandedChange={setExpanded}
        expandedWidth={256}
        fab={
          <ExtendedFAB
            icon="edit"
            label="Crear"
            elevation={0}
            expanded={expanded}
            onPress={() => {
              setDrafts((count) => count + 1);
              setValue('drafts');
            }}
          />
        }
        items={[
          {
            key: 'home',
            label: 'Inicio',
            icon: 'home',
            selectedIcon: 'home_fill1',
          },
          {
            key: 'search',
            label: 'Explorar',
            icon: 'explore',
            selectedIcon: 'explore_fill1',
          },
          {
            key: 'drafts',
            label: 'Borradores',
            icon: 'draft',
            badge: drafts || undefined,
          },
          {
            key: 'archive',
            label: 'Archivo',
            icon: 'archive',
            section: 'Biblioteca',
            hiddenWhenCollapsed: true,
          },
        ]}
      />
      <View style={{ flex: 1, padding: 24 }}>
        <Text>Destino activo: {value}</Text>
      </View>
    </View>
  );
}
```

**Rail modal**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { Button, NavigationRailModal, Text } from 'mobile-design/react-native';

const destinos = [
  { key: 'inicio', label: 'Inicio', icon: 'home' },
  { key: 'guardados', label: 'Guardados', icon: 'bookmark', badge: 3 },
];

export function BibliotecaConRailModal() {
  const [open, setOpen] = useState(false);
  const [destino, setDestino] = useState('inicio');

  return (
    <View style={{ flex: 1 }}>
      <Button onPress={() => setOpen(true)}>Abrir navegación</Button>
      <Text>{destino === 'inicio' ? 'Inicio' : 'Guardados'}</Text>
      <NavigationRailModal
        open={open}
        onOpenChange={setOpen}
        items={destinos}
        value={destino}
        onValueChange={setDestino}
        title="Biblioteca"
        closeOnSelect
      />
    </View>
  );
}
```

#### NavigationDrawer

Organiza destinos y secciones en un panel lateral estándar o modal.

- Define items y controla value/onValueChange. Header y footer añaden contenido de contexto.
- Usa NavigationDrawerModal para superponer la navegación sobre un scrim. CloseOnSelect cierra al elegir un destino. Conserva su valor inicial true en la navegación habitual.
- onClosed se ejecuta al terminar la salida. Úsalo para iniciar una ruta o enfocar el nuevo contenido sin competir con el cierre. Una reapertura interrumpe la salida anterior.
- El contenedor define la altura disponible. Los destinos desplazan dentro del drawer mientras header y footer permanecen fuera de esa lista.

La vista estándar comparte espacio con el contenido. La modal superpone el panel y cierra al seleccionar por defecto. Usa el callback de cierre completo si el nuevo destino requiere recibir foco.

**Propiedades de `NavigationDrawer`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `items` · requerida | `readonly NavigationDrawerDestination[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. | `items={proyectos}` con las claves resumen, informes y equipo |
| `onValueChange` · requerida | `(key: string) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. | `onValueChange={setProyectoActivo}` |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value={proyectoActivo}` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="proyectos"` |
| `children` | `ReactNode` | — | Contenido que se compone dentro del componente. | `children={<NavigationDrawerItem item={informes} selected={destino === "informes"} onPress={abrirInformes} />}` para un grupo personalizado |
| `footer` | `ReactNode` | — | Contenido que permanece en el pie. | `footer={<Text variant="labelSmall">Modo sin conexión</Text>}` |
| `header` | `ReactNode` | — | Contenido que permanece en la cabecera. | `header={<Text variant="titleMedium">Biblioteca</Text>}` |
| `modal` | `boolean` | `false` | Activa la composición modal del panel. | `modal` en un drawer alojado dentro de una superficie modal |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` si hay contenido fuera de pantalla |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | `'mobile-navigation-drawer-standard'` | Identificador para automatización en el host. | `testID="proyectos-drawer"` |
| `width` | `number` | `360` | Ancho de la superficie. | `width={320}` junto al contenido |

<details>
<summary>Configuración complementaria de NavigationDrawer</summary>

**`NavigationDrawerModal`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `items` · requerida | `readonly NavigationDrawerDestination[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. | `items={proyectos}` con destinos y secciones |
| `onOpenChange` · requerida | `(open: boolean) => void` | — | Solicita abrir o cerrar. Actualiza `open` en la pantalla. | `onOpenChange={setOpen}` para reflejar apertura y cierre |
| `onValueChange` · requerida | `(key: string) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. | `onValueChange={setProyectoActivo}` |
| `open` · requerida | `boolean` | — | Controla si la superficie está abierta. | `open={open}` tras pulsar el botón Abrir |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value={proyectoActivo}` compartido con el drawer estándar |
| `closeOnSelect` | `boolean` | `true` | Cierra la superficie después de elegir un destino. | `closeOnSelect={false}` en una vista que compara destinos |
| `dismissible` | `boolean` | `true` | Permite descartar la superficie con sus gestos y acciones de cierre. | `dismissible={false}` si el usuario debe elegir un destino |
| `footer` | `ReactNode` | — | Contenido que permanece en el pie. | `footer={<Text variant="labelSmall">Modo sin conexión</Text>}` |
| `header` | `ReactNode` | — | Contenido que permanece en la cabecera. | `header={<Text variant="titleMedium">Biblioteca</Text>}` |
| `onClosed` | `(() => void)` | — | Avisa cuando concluye la salida de la superficie. | `onClosed={() => contenidoRef.current?.focus()}` al terminar la salida |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` si hay contenido fuera de pantalla |
| `testID` | `string` | `'mobile-navigation-drawer'` | Identificador para automatización en el host. | `testID="proyectos-drawer-modal"` |
| `title` | `string` | `'Navegación'` | Título visible o contenido principal. | `title="Proyectos"` |
| `width` | `number` | `360` | Ancho de la superficie. | `width={280}` en un panel de biblioteca |

**`NavigationDrawerItem`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `item` · requerida | `NavigationDrawerDestination` | — | Destino de navegación con una clave y una etiqueta. | `item={{ key: "informes", label: "Informes", icon: "draft" }}` |
| `selected` · requerida | `boolean` | — | Selección persistente controlada por el consumidor. | `selected={proyectoActivo === "informes"}` |
| `contentStyle` | `StyleProp<ViewStyle>` | — | Estilo del contenido dentro de la superficie. | `contentStyle={{ paddingHorizontal: 20 }}` para alinear con el encabezado |
| `focusRef` | `((target: unknown) => void)` | — | Referencia usada para coordinar el foco entre destinos. | `focusRef={(node) => destinosRef.current.set("informes", node)}` |
| `href` | `string` | — | Dirección del enlace real en el navegador. | `href="/proyectos/informes"` con importación web |
| `onKeyDown` | `((event: NavigationFocusEvent) => void)` | — | Callback de teclado en navegador. | `onKeyDown={manejarTecladoDeDestinos}` para navegación por flechas en web |
| `onPress` | `(() => void)` | — | Ejecuta la acción al activar el control. | `onPress={abrirInformes}` para navegar en móvil |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="proyectos-informes"` |

**`NavigationDrawerDestination`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `key` · requerida | `string` | — | Identificador único y estable dentro del conjunto. | `key: "informes"` |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label: "Informes"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel: "Informes compartidos, dos nuevos"` |
| `badge` | `string \| number \| boolean` | — | Insignia que acompaña al elemento de menú. | `badge: 2` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: !puedeVerInformes` |
| `hiddenWhenCollapsed` | `boolean` | — | Oculta el destino cuando el rail se contrae, excepto si es el destino seleccionado. | `hiddenWhenCollapsed: true` para Archivo |
| `icon` | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: "draft"` |
| `section` | `string` | — | Etiqueta de la sección que agrupa destinos consecutivos en el drawer. | `section: "Documentos"` |
| `selectedIcon` | `any` | — | Icono alternativo para el estado activo. | `selectedIcon: "draft_fill1"` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  NavigationDrawer,
  NavigationDrawerModal,
  Text,
} from 'mobile-design/react-native';

export default function Example() {
  const [value, setValue] = useState('folder');
  const [open, setOpen] = useState(false);
  const items = [
    {
      key: 'folder',
      label: 'Carpetas',
      icon: 'folder',
      selectedIcon: 'folder',
      badge: 12,
    },
    {
      key: 'sent',
      label: 'Compartidos',
      icon: 'send',
      selectedIcon: 'send_fill1',
    },
    {
      key: 'drafts',
      label: 'Pendientes',
      icon: 'draft',
      section: 'Biblioteca',
    },
    {
      key: 'archive',
      label: 'Archivados',
      icon: 'archive',
      section: 'Biblioteca',
    },
  ];

  return (
    <View style={{ gap: 16 }}>
      <NavigationDrawer
        items={items}
        value={value}
        onValueChange={setValue}
        accessibilityLabel="Proyectos"
        style={{ height: 360 }}
      />
      <Text>
        Destino activo: {items.find((item) => item.key === value)?.label}
      </Text>
      <Button onPress={() => setOpen(true)}>Abrir navegación modal</Button>
      <NavigationDrawerModal
        title="Proyectos"
        open={open}
        onOpenChange={setOpen}
        items={items}
        value={value}
        onValueChange={setValue}
      />
    </View>
  );
}
```

**Ítem personalizado en el drawer**

Cuando usas `children`, la pantalla compone las filas del drawer y controla su selección.

```tsx
import { useState } from 'react';
import { NavigationDrawer, NavigationDrawerItem, Text } from 'mobile-design/react-native';

const informes = { key: 'informes', label: 'Informes', icon: 'draft', badge: 2 };
const resumen = { key: 'resumen', label: 'Resumen', icon: 'home' };

export function DrawerDeProyecto() {
  const [destino, setDestino] = useState('resumen');

  return (
    <NavigationDrawer items={[resumen, informes]} value={destino} onValueChange={setDestino}>
      <Text variant="titleSmall">Proyecto Atlas</Text>
      {[resumen, informes].map((item) => (
        <NavigationDrawerItem
          key={item.key}
          item={item}
          selected={destino === item.key}
          onPress={() => setDestino(item.key)}
        />
      ))}
    </NavigationDrawer>
  );
}
```

#### Tabs y TabsPager

Organiza contenido del mismo nivel mediante pestañas Primary o Secondary y un indicador de selección.

- Define destinos pares con key y label. Primary organiza los destinos principales. Secondary añade un nivel dentro del contenido. Comparte value/onValueChange entre Tabs y contenido.
- Con TabsPager, enlaza position del hilo UI y selectionRequest para coordinar toque, reelección y swipe.
- Asigna un nativeID único a cada pestaña y su panelID al panel correspondiente. TabsPager usa esas mismas propiedades para asociar el panel con su etiqueta. Si compones el contenido manualmente, conserva esa relación.
- Usa etiquetas breves y una configuración coherente de iconos en el conjunto. Los iconos sin etiqueta visual necesitan accessibilityLabel. El badge describe novedades y se actualiza cuando se consulta el contenido.

Para deslizar entre paneles comparte `value`, `position` y la solicitud de selección entre `Tabs` y `TabsPager`. Si gestionas los paneles por tu cuenta, enlaza el `nativeID` de la pestaña y el `panelID` del panel.

**Propiedades de `Tabs`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `items` · requerida | `readonly TabItem[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. | `items={secciones}` con claves recientes y guardados |
| `onValueChange` · requerida | `(key: string) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. | `onValueChange={setSeccion}` |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value={seccion}` |
| `accessibilityLabel` | `string` | `'Pestañas'` | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="secciones de biblioteca"` |
| `edgePadding` | `number` | — | Margen en cada extremo de la fila desplazable de pestañas. | `edgePadding={24}` para alinear pestañas desplazables con el contenido |
| `iconPosition` | `"start" \| "top"` | `'top'` | Posición lógica del icono respecto de la etiqueta. | `iconPosition="start"` en pestañas con icono y texto en línea |
| `onTabPress` | `((key: string) => void)` | — | Se ejecuta en cada activación por pulsación o teclado, incluso al volver a elegir la pestaña actual durante un gesto. | `onTabPress={() => setSolicitud((n) => n + 1)}` para interrumpir un swipe al volver a pulsar |
| `position` | `SharedValue<number>` | — | Posición fraccional compartida con TabsPager para animar el indicador. | `position={pagina}` con pagina creada por useSharedValue(0) |
| `scrollable` | `boolean` | `false` | Habilita el desplazamiento de la fila o superficie. | `scrollable` cuando las etiquetas no caben en una sola fila fija |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ horizontal: true }}` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | `'mobile-tabs'` | Identificador para automatización en el host. | `testID="biblioteca-pestanas"` |
| `variant` | `"primary" \| "secondary"` | `'primary'` | Tratamiento visual o modalidad del componente. | `variant="secondary"` para subsecciones dentro de Biblioteca |

<details>
<summary>Configuración complementaria de Tabs y TabsPager</summary>

**`TabsPager`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `items` · requerida | `readonly TabItem[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. | `items={secciones}` con la misma lista que Tabs |
| `onValueChange` · requerida | `(key: string) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. | `onValueChange={setSeccion}` después de terminar un swipe |
| `position` · requerida | `SharedValue<number>` | — | Valor compartido para sincronizar página e indicador de Tabs. | `position={pagina}` con el mismo SharedValue de Tabs |
| `renderPage` · requerida | `(item: TabItem, selected: boolean) => ReactNode` | — | Compone el contenido asociado a cada pestaña. | `renderPage={(item) => <Text>{item.label}</Text>}` |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value={seccion}` compartido con Tabs |
| `enabled` | `boolean` | `true` | Usa `false` para desactivar el paginador y cancelar movimientos pendientes mientras el panel esté ocupado o inactivo. | `enabled={!mostrandoDialogo}` para cancelar el movimiento al abrir una capa |
| `selectionRequest` | `number` | `0` | Señal para coordinar una solicitud de selección en TabsPager. | `selectionRequest={solicitud}` incrementada en Tabs.onTabPress |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ flex: 1 }}` para ocupar la altura restante |
| `swipeEnabled` | `boolean` | `true` | Permite cambiar de página mediante un gesto horizontal. | `swipeEnabled={!arrastrandoFoto}` para ceder el gesto al carrusel |
| `testID` | `string` | `'mobile-tabs-pager'` | Identificador para automatización en el host. | `testID="biblioteca-paneles"` |

**`TabItem`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `key` · requerida | `string` | — | Identificador único y estable dentro del conjunto. | `key: "guardados"` |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label: "Guardados"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel: "Guardados, tres nuevos"` |
| `badge` | `string \| number \| boolean` | — | Insignia que acompaña al elemento de menú. | `badge: 3` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: !cuentaActiva` |
| `icon` | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: "bookmark"` |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID: "tab-guardados"` |
| `panelID` | `string` | — | Identificador del panel que corresponde a la pestaña. | `panelID: "panel-guardados"` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Tabs, TabsPager, Text } from 'mobile-design/react-native';

export default function Example() {
  const [value, setValue] = useState('files');
  const [request, setRequest] = useState(0);
  const position = useSharedValue(0);
  const items = [
    {
      key: 'files',
      label: 'Archivos',
      icon: 'folder',
      nativeID: 'library-files-tab',
      panelID: 'library-files-panel',
    },
    {
      key: 'recent',
      label: 'Recientes',
      icon: 'schedule',
      nativeID: 'library-recent-tab',
      panelID: 'library-recent-panel',
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        items={items}
        value={value}
        onValueChange={setValue}
        position={position}
        onTabPress={() => setRequest((value) => value + 1)}
      />
      <TabsPager
        items={items}
        value={value}
        onValueChange={setValue}
        position={position}
        selectionRequest={request}
        renderPage={(item) => (
          <View style={{ padding: 24 }}>
            <Text>{item.label}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

#### Searchbar y SearchView

Conecta una barra de búsqueda con una vista que presenta consulta, sugerencias y resultados.

- Searchbar compone el campo con los IconButton, símbolos y colores compartidos. SearchView añade el punto de entrada, la transición y la vista de sugerencias/resultados.
- Controla open/onOpenChange, value/onChangeText y onSearch. OnResultPress entrega el dato elegido. RenderResults permite componer listas propias. FooterContent conserva controles contextuales al pie.
- La barra mide 56 dp, con objetivos de 48 dp, iconos de 24 dp y gaps interiores de 4 dp. Texto e iconos conservan sus centros al escribir, borrar o ampliar la fuente. El título de búsqueda es su etiqueta accesible.

El filtrado y la obtención de resultados pertenecen al consumidor. Si las sugerencias llegan de un servicio, descarta respuestas de consultas anteriores. `SearchTrigger` y `SearchIconButton` ayudan a construir el punto de entrada y sus acciones.

**Propiedades de `Searchbar`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value={query}` con "informe" como consulta |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Escribe el título o el autor"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="búsqueda de documentos"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ disabled: !editable }} y loading={cargando}` |
| `autoCapitalize` | `AutoCapitalize` | `'none'` | Capitalización automática. Elige `characters` para todas las letras, `words` para cada palabra, `sentences` para cada oración o `none` para conservar la entrada. | `autoCapitalize="none"` para códigos y nombres |
| `autoCorrect` | `boolean` | `false` | Activa la autocorrección de la entrada. | `autoCorrect={false}` para números de expediente |
| `children` | `React.ReactNode` | — | Contenido que se compone dentro del componente. | Usa `right={() => <Text>PDF</Text>}` para contenido adicional junto al campo controlado. `children` se reenvía al TextInput. |
| `clearAccessibilityLabel` | `string` | `'Borrar búsqueda'` | Nombre que anuncia el lector de pantalla para el botón. Proporciona una etiqueta que describa la acción. | `clearAccessibilityLabel="Borrar consulta de documentos"` |
| `clearIcon` | `IconSource` | `'close'` | Icono de borrar. Se muestra cuando hay texto, la carga está inactiva y el espacio final queda libre de contenido personalizado. | `clearIcon="close"` |
| `editable` | `boolean` | `true` | Permite editar el texto de búsqueda. | `editable={!sinPermiso}` |
| `elevation` | `0 \| Animated.Value \| 1 \| 2 \| 3 \| 4 \| 5` | `0` | Nivel de elevación de la superficie. | `elevation={1}` en una barra superpuesta |
| `icon` | `IconSource` | `'search'` | Nombre de icono o elemento de representación admitido por la propiedad. | `icon="search"` para el buscador |
| `iconColor` | `ColorValue` | — | Color del icono. | `iconColor={theme.colors.primary}` |
| `inputStyle` | `StyleProp<TextStyle>` | — | Estilo que recibe la entrada de texto interna. | `inputStyle={{ fontSize: 16 }}` |
| `loading` | `Boolean` | `false` | Representa una operación en curso. | `loading={cargando}` durante la consulta |
| `maxLength` | `number` | — | Limita la entrada al número de caracteres indicado. | `maxLength={80}` para limitar la consulta |
| `mode` | `"bar" \| "view"` | `'bar'` | Controla la presentación como barra independiente o dentro de una vista de búsqueda. | `mode="view"` para una barra integrada en la pantalla de resultados |
| `multiline` | `boolean` | — | Permite escribir en varias líneas. | `multiline` si el campo acepta términos en varias líneas |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="documentos-busqueda"` |
| `numberOfLines` | `number` | — | Fija el número de líneas de la entrada cuando `multiline` está habilitado. | `numberOfLines={2}` junto con multiline |
| `onChange` | `((e: TextInputChangeEvent) => unknown)` | — | Evento de cambio de la entrada subyacente. | `onChange={({ nativeEvent }) => registrarEdicion(nativeEvent.text)}` |
| `onChangeText` | `(((text: string) => unknown) & ((query: string) => void))` | — | Comunica el nuevo texto para actualizar el valor controlado. | `onChangeText={setQuery}` |
| `onClearIconPress` | `((e: GestureResponderEvent) => void)` | — | Se ejecuta después de vaciar la consulta con el botón de borrar. | `onClearIconPress={() => setResultados([])}` para descartar los resultados anteriores |
| `onIconPress` | `((e: GestureResponderEvent) => void)` | — | Acción del icono independiente. | `onIconPress={() => buscarDocumentos(query)}` para hacer accionable la lupa |
| `onPress` | `((event: GestureResponderEvent) => unknown)` | — | Ejecuta la acción al activar el control. | `onPress={() => setEditando(true)}` al pulsar el TextInput |
| `onTraileringIconPress` | `((e: GestureResponderEvent) => void)` | — | Se ejecuta al pulsar el icono adicional del extremo final. | `onTraileringIconPress={abrirFiltros}` junto con traileringIcon |
| `placeholder` | `string` | `'Buscar'` | Texto de orientación cuando el campo está vacío. | `placeholder="Buscar documentos"` |
| `placeholderTextColor` | `ColorValue` | — | Color del texto que orienta al usuario cuando el campo está vacío. | `placeholderTextColor={theme.colors.onSurfaceVariant}` |
| `ref` | `React.Ref<TextInputHandles>` | — | Referencia imperativa con las operaciones del componente anfitrión. | `ref={searchRef} y searchRef.current?.focus()` al abrir el buscador |
| `right` | `((props: { color: ColorValue; style: Style; testID: string; }) => React.ReactNode)` | — | Contenido del lado final en `mode="bar"`. | `right={() => <Text variant="labelSmall">PDF</Text>}` para un indicador al final |
| `searchAccessibilityLabel` | `string` | `'Buscar'` | Nombre que anuncia el lector de pantalla para el botón. Proporciona una etiqueta que describa la acción. | `searchAccessibilityLabel="Ejecutar búsqueda"` junto con onIconPress |
| `showDivider` | `boolean` | `true` | Muestra la separación visual. | `showDivider={false}` en mode="view" si ya hay un separador |
| `style` | `Consultar el tipo TypeScript` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | `'search-bar'` | Identificador para automatización en el host. | `testID="documentos-busqueda"` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { onSurface: "#241B2F" } }}` en búsqueda de documentos |
| `traileringIcon` | `IconSource` | — | Icono adicional en `mode="bar"` cuando la barra no está cargando y la consulta está vacía o se definió `right`. | `traileringIcon="tune"` para la acción Filtros |
| `traileringIconAccessibilityLabel` | `string` | — | Nombre accesible del botón con icono adicional al final de la barra. | `traileringIconAccessibilityLabel="Abrir filtros"` |
| `traileringIconColor` | `ColorValue` | — | Color del icono adicional al final. | `traileringIconColor={theme.colors.primary}` |

<details>
<summary>Configuración complementaria de Searchbar y SearchView</summary>

**`SearchView`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `onChangeText` · requerida | `(value: string) => void` | — | Comunica el nuevo texto para actualizar el valor controlado. | `onChangeText={setQuery}` |
| `onOpenChange` · requerida | `(open: boolean) => void` | — | Solicita abrir o cerrar. Actualiza `open` en la pantalla. | `onOpenChange={setOpen}` |
| `onSearch` · requerida | `(query: string) => void` | — | Ejecuta la consulta cuando se confirma la entrada. | `onSearch={(texto) => buscarDocumentos(texto.trim())}` |
| `open` · requerida | `boolean` | — | Controla si la superficie está abierta. | `open={open}` con estado controlado |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value={query}` |
| `autoFocus` | `boolean` | `true` | Coloca el foco en la entrada al abrir. | `autoFocus={false}` si primero se muestran búsquedas recientes |
| `barContainerColor` | `ColorValue` | — | Color del punto de entrada cerrado. La barra de aplicación puede controlar su fondo animado. | `barContainerColor="transparent" dentro de TopAppBar` |
| `barTextAlign` | `"start" \| "center"` | `'start'` | Alineación del texto en la barra cerrada. | `barTextAlign="center"` en un disparador ancho |
| `closeOnSelect` | `boolean` | `true` | Cierra la superficie después de elegir un destino. | `closeOnSelect` al abrir el detalle del documento |
| `closeOnSubmit` | `boolean` | `false` | Cierra la superficie al confirmar la consulta. | `closeOnSubmit` al enviar la búsqueda a una ruta de resultados |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={sinPermiso}` para bloquear la entrada |
| `emptyContent` | `ReactNode` | — | Contenido de la búsqueda cuando la lista está vacía. | `emptyContent={<Text>No encontramos documentos</Text>}` |
| `footerAvoidsKeyboard` | `boolean` | `true` | Mantiene el pie visible por encima del teclado. Con `false` queda al fondo de la ventana y el teclado puede cubrirlo. | `footerAvoidsKeyboard` para mantener visible Filtrar al escribir |
| `footerContainerColor` | `ColorValue` | — | Color del espacio reservado debajo del pie. Su altura se conserva. | `footerContainerColor={theme.colors.surfaceContainer}` |
| `footerContent` | `ReactNode` | — | Controles contextuales que permanecen debajo de los resultados desplazables. | `footerContent={<Button onPress={abrirFiltros}>Filtrar</Button>}` |
| `inputTrailingContent` | `ReactNode` | — | Controles independientes dentro de la entrada expandida, junto al botón de borrar. | `inputTrailingContent={<SearchIconButton icon="tune" accessibilityLabel="Filtros" onPress={abrirFiltros} />}` |
| `leadingIcon` | `IconSource` | `'search'` | Icono al inicio del control. | `leadingIcon="folder"` para buscar dentro de la biblioteca |
| `loading` | `boolean` | `false` | Representa una operación en curso. | `loading={cargando}` mientras llega la consulta |
| `onClosed` | `(() => void)` | — | Avisa cuando concluye la salida de la superficie. | `onClosed={() => abrirDocumentoPendiente()}` al finalizar la salida |
| `onLeadingPress` | `(() => void)` | — | Acción del icono inicial del disparador cerrado predeterminado. Si usas `renderTrigger`, conecta la acción en tu disparador. | `onLeadingPress={abrirBiblioteca}` junto con `leadingIcon` |
| `onResultPress` | `((result: SearchResult) => void)` | — | Recibe el resultado activado. | `onResultPress={(resultado) => abrirDocumento(resultado.key)}` |
| `placeholder` | `string` | `'Buscar'` | Texto de orientación cuando el campo está vacío. | `placeholder="Busca por título o autor"` |
| `presentation` | `"auto" \| "full-screen" \| "docked"` | `'auto'` | Modo de presentación visual o colocación. | `presentation="docked"` para un panel anclado |
| `renderResults` | `((state: { containerColor: ColorValue; }) => ReactNode)` | — | Renderiza una región de resultados propia y recibe su color de fondo. | `renderResults={({ containerColor }) => <View style={{ backgroundColor: containerColor }}><Text>Recientes</Text></View>}` |
| `renderTrigger` | `((state: { open: () => void; disabled: boolean; expanded: boolean; }) => ReactNode)` | — | Renderiza un disparador alternativo. Usa `SearchTrigger` para una cápsula o `IconButton` y `Chip` para sus propias formas. | `renderTrigger={({ open, disabled }) => <SearchTrigger disabled={disabled} onPress={open}><Text>Buscar</Text></SearchTrigger>}` |
| `results` | `readonly SearchResult[]` | `[]` | Resultados con claves estables que prepara la pantalla. | `results={[{ key: "q4", title: "Informe trimestral", icon: "draft" }]}` |
| `resultsAccessibilityLabel` | `string` | — | Texto que se anuncia al cambiar los resultados personalizados, incluso cuando están vacíos o cargando. | `resultsAccessibilityLabel="Tres documentos encontrados"` |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` si hay contenido fuera de pantalla |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `supportingContent` | `ReactNode` | — | Contenido adicional que acompaña a los resultados. | `supportingContent={<Text>Busca dentro de la colección actual</Text>}` |
| `testID` | `string` | `'mobile-search'` | Identificador para automatización en el host. | `testID="documentos-resultados"` |
| `trailingActions` | `readonly { key: string; icon: SearchIcon; label: string; onPress: () => void; disabled?: boolean; testID?: string; }[]` | `[]` | Acciones al final de la barra. Cada una usa clave, icono, etiqueta y acción. | `trailingActions={[{ key: "filters", icon: "tune", label: "Filtros", onPress: abrirFiltros }]}` |
| `trailingContent` | `ReactNode` | — | Contenido al final de la barra cerrada. | `trailingContent={<Avatar.Text label="BL" size={32} />}` |
| `variant` | `"contained" \| "divided"` | `'contained'` | Tratamiento visual o modalidad del componente. | `variant="divided"` para una entrada separada de los resultados |

**`SearchTrigger`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `children={<Text>Buscar en biblioteca</Text>}` |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Abre búsqueda de documentos"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="búsqueda de documentos"` |
| `accessibilityRole` | `string` | `'button'` | Rol semántico que debe anunciar la fila. | `accessibilityRole="button"` al abrir el buscador |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ disabled: true }}` durante la carga de búsqueda de documentos |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={sinPermiso}` si búsqueda de documentos requiere permisos |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="documentos-disparador"` |
| `onPress` | `(((event: GestureResponderEvent) => unknown) & ((e: GestureResponderEvent) => void))` | — | Ejecuta la acción al activar el control. | `onPress={open}` recibido en SearchView.renderTrigger |
| `ref` | `Ref<default>` | — | Referencia imperativa con las operaciones del componente anfitrión. | `ref={referencia}` para medir búsqueda de documentos desde el host |
| `rippleColor` | `ColorValue` | — | Color del efecto de pulsación en Android y navegador. | `rippleColor="rgba(103, 80, 164, 0.1)"` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="documentos-disparador"` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { onSurface: "#241B2F" } }}` en búsqueda de documentos |
| `underlayColor` | `string` | — | Color de fondo del efecto de pulsación en iOS. | `underlayColor="rgba(103, 80, 164, 0.1)"` para la indicación nativa |

**`SearchIconButton`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `icon` · requerida | `IconSource` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon="tune"` para filtros |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Abre filtros de búsqueda"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="filtros de búsqueda"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ disabled: true }}` durante la carga de filtros de búsqueda |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={sinPermiso}` si filtros de búsqueda requiere permisos |
| `loading` | `boolean` | — | Representa una operación en curso. | `loading={aplicandoFiltros}` mientras se guardan los criterios |
| `mode` | `IconButtonMode` | — | Modo de uso admitido por este componente. | `mode="contained-tonal"` para distinguir Filtros |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="documentos-filtros"` |
| `onPress` | `(((event: GestureResponderEvent) => unknown) & ((e: GestureResponderEvent) => void) & ((e: GestureResponderEvent) => void))` | — | Ejecuta la acción al activar el control. | `onPress={abrirFiltros}` |
| `pressed` | `boolean` | — | Conserva la apariencia de pulsación para composiciones coordinadas. | `pressed={filtrosAbiertos}` mientras el panel sigue visible |
| `ref` | `Ref<default>` | — | Referencia imperativa con las operaciones del componente anfitrión. | `ref={referencia}` para medir filtros de búsqueda desde el host |
| `selected` | `boolean` | — | Selección persistente controlada por el consumidor. | `selected={hayFiltrosActivos}` |
| `sizeClass` | `ButtonSize` | — | Escala del botón, incluido el contenedor y el objetivo de interacción. | `sizeClass="small" dentro de la entrada expandida` |
| `style` | `Animated.WithAnimatedValue<StyleProp<ViewStyle>>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="documentos-filtros"` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { onSurface: "#241B2F" } }}` en filtros de búsqueda |
| `widthVariant` | `"narrow" \| "default" \| "wide"` | — | Proporción del botón de icono. | `widthVariant="wide"` en una barra amplia |
| `size` | `number` | Según `sizeClass` | Tamaño del glifo dentro del botón. | `size={20}` |
| `iconColor` | `ColorValue` | Tema | Color del glifo. | `iconColor="#325DA8"` |
| `containerColor` | `ColorValue` | Tema | Color del contenedor. | `containerColor="#DCE6FF"` |
| `contentStyle` | `StyleProp<ViewStyle>` | — | Estilo del contenido. | `contentStyle={{ alignItems: "center" }}` |

**`SearchResult`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `key` · requerida | `string` | — | Identificador único y estable dentro del conjunto. | `key: "informe-q4"` |
| `title` · requerida | `string` | — | Título visible o contenido principal. | `title: "Informe trimestral"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel: "Informe trimestral, PDF"` |
| `description` | `string` | — | Texto secundario de apoyo. | `description: "PDF · Actualizado hoy"` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: !puedeAbrirInforme` |
| `icon` | `IconSource` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: "draft"` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { Searchbar } from 'mobile-design/react-native';

export default function Example() {
  const [query, setQuery] = useState('');

  return (
    <Searchbar
      placeholder="Buscar documentos"
      value={query}
      onChangeText={setQuery}
      accessibilityLabel="Buscar documentos"
    />
  );
}
```

**Búsqueda controlada con disparador y acción de filtros**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { SearchIconButton, SearchTrigger, SearchView, Text } from 'mobile-design/react-native';

const documentos = [
  { key: 'q4', title: 'Informe trimestral', description: 'PDF', icon: 'draft' },
  { key: 'notes', title: 'Notas del equipo', description: 'Texto', icon: 'edit' },
];

export function BuscadorDeDocumentos() {
  const [open, setOpen] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [seleccionado, setSeleccionado] = useState('');
  const [soloPDF, setSoloPDF] = useState(false);
  const resultados = documentos.filter(
    (doc) =>
      doc.title.toLocaleLowerCase().includes(consulta.toLocaleLowerCase()) &&
      (!soloPDF || doc.description === 'PDF'),
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <SearchView
        open={open}
        onOpenChange={setOpen}
        value={consulta}
        onChangeText={setConsulta}
        onSearch={(text) => setConsulta(text.trim())}
        results={resultados}
        resultsAccessibilityLabel={`${resultados.length} documentos encontrados`}
        onResultPress={(item) => setSeleccionado(item.title)}
        placeholder="Busca por título"
        emptyContent={<Text>No encontramos documentos</Text>}
        renderTrigger={({ open: abrir, disabled, expanded }) => (
          <SearchTrigger
            accessibilityLabel="Buscar documentos"
            accessibilityState={{ expanded }}
            disabled={disabled}
            onPress={abrir}
          >
            <Text>{consulta || 'Buscar documentos'}</Text>
          </SearchTrigger>
        )}
        inputTrailingContent={
          <SearchIconButton
            icon="draft"
            accessibilityLabel="Mostrar sólo PDF"
            mode="contained-tonal"
            selected={soloPDF}
            onPress={() => setSoloPDF((activo) => !activo)}
          />
        }
      />
      <Text accessibilityLiveRegion="polite">
        {seleccionado ? `Seleccionado: ${seleccionado}` : 'Elige un documento'}
      </Text>
    </View>
  );
}
```

#### Toolbar

Agrupa acciones de edición o contexto en barras Docked o Floating, horizontales o verticales.

- Cada acción usa `key`, `icon`, `label` y `onPress`. Usa `selected` para una selección persistente.
- Docked ocupa el borde inferior con esquinas rectas. Floating conserva una cápsula independiente del contenido y puede disponerse horizontal o verticalmente. Standard y Vibrant son configuraciones de color.
- Leading, children y trailing admiten elementos originales. Iconos, botones, textos y campos. Elige un único énfasis principal. El ancho de los slots se mide antes de mover acciones al menú.
- Fab coloca una acción principal junto a Floating. Expanded=false recoge las herramientas y amplía el FAB de 56 a 80 dp, conservando su extremo. Sin FAB, expanded controla los slots de los extremos y conserva las acciones centrales.
- El host coloca la barra dentro de la pantalla o panel. El formato horizontal reserva al menos 16 dp. El vertical, 24 dp. Limita maxHeight cuando una barra vertical viva dentro de un panel más corto que la ventana.

**Propiedades de `Toolbar`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `actions` · requerida | `readonly ToolbarAction[]` | — | Acciones relacionadas de la composición. | `actions={[{ key: "save", icon: "save", label: "Guardar", onPress: guardar }]}` |
| `accessibilityLabel` | `string` | `'Herramientas'` | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="acciones de edición"` |
| `alignment` | `"start" \| "center" \| "space-between"` | — | Alineación de los elementos en su región. | `alignment="center"` para centrar el grupo |
| `children` | `ReactNode` | — | Contenido que se compone dentro del componente. | `children={<Text variant="labelLarge">Edición</Text>}` |
| `color` | `"standard" \| "vibrant"` | `'standard'` | Color del elemento o trazo. | `color="vibrant"` para la edición activa |
| `elevation` | `0 \| 1 \| 2 \| 3` | — | Nivel de elevación de la superficie. | `elevation={1}` sobre una foto o lista con detalle |
| `expanded` | `boolean` | `true` | Estado controlado de expansión. | `expanded={herramientasVisibles}` para controlar el colapso |
| `fab` | `ToolbarAction` | — | Slot para la acción flotante del layout. | `fab={{ key: "add", icon: "add", label: "Añadir documento", onPress: crearDocumento }}` |
| `leading` | `ReactNode` | — | Slot al inicio lógico del contenido. | `leading={<Text>3 seleccionados</Text>}` |
| `maxVisibleActions` | `number` | — | Las acciones que superan el espacio disponible pasan al menú. | `maxVisibleActions={3}` para enviar acciones extra al menú |
| `orientation` | `"horizontal" \| "vertical"` | `'horizontal'` | Eje de la composición. | `orientation="vertical"` junto al lienzo |
| `safeArea` | `boolean` | `true` | Incluye los insets correspondientes de la ventana. | `safeArea={false}` si el host ya reserva el inset |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | `'mobile-toolbar'` | Identificador para automatización en el host. | `testID="coleccion-herramientas"` |
| `trailing` | `ReactNode` | — | Slot al final lógico del contenido. | `trailing={<Text>Sincronizado</Text>}` |
| `variant` | `"docked" \| "floating"` | `'docked'` | Tratamiento visual o modalidad del componente. | `variant="floating"` para la edición sobre el contenido |
| `visible` | `boolean` | `true` | Controla si la superficie o el indicador se presenta. | `visible={editando}` para ocultar la barra al salir de edición |

<details>
<summary>Configuración complementaria de Toolbar</summary>

**`ToolbarAction`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `icon` · requerida | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: "save"` |
| `key` · requerida | `string` | — | Identificador único y estable dentro del conjunto. | `key: "save"` |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label: "Guardar colección"` |
| `onPress` · requerida | `() => void` | — | Ejecuta la acción al activar el control. | `onPress: guardarColeccion` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: !hayCambios` |
| `mode` | `"contained" \| "contained-tonal" \| "outlined"` | — | Modo de uso admitido por este componente. | `mode: "contained-tonal"` para la acción principal |
| `selected` | `boolean` | — | Selección persistente controlada por el consumidor. | `selected: marcadoComoFavorito` |
| `widthVariant` | `"narrow" \| "default" \| "wide"` | — | Proporción del botón de icono. | `widthVariant: "wide"` para una acción destacada |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { Toolbar, TextField, Text } from 'mobile-design/react-native';

export default function Example() {
  const [title, setTitle] = useState('Mi colección');
  const [saved, setSaved] = useState('Mi colección');
  const [deleted, setDeleted] = useState(false);

  return (
    <View style={{ gap: 24 }}>
      <TextField
        label="Nombre"
        value={title}
        onChangeText={setTitle}
        disabled={deleted}
      />
      <Text accessibilityLiveRegion="polite">
        {deleted ? 'Colección eliminada' : 'Guardado: ' + saved}
      </Text>
      <Toolbar
        variant="floating"
        accessibilityLabel="Editar colección"
        actions={[
          {
            key: 'save',
            icon: 'save',
            label: 'Guardar',
            disabled: deleted || title === saved,
            onPress: () => setSaved(title),
          },
          {
            key: 'undo',
            icon: 'undo',
            label: 'Restaurar',
            onPress: () => {
              setDeleted(false);
              setTitle(saved);
            },
          },
          {
            key: 'delete',
            icon: 'delete',
            label: 'Eliminar',
            disabled: deleted,
            onPress: () => setDeleted(true),
          },
        ]}
      />
    </View>
  );
}
```

### Contenido y tipografía

#### Text

Aplica la escala tipográfica del tema a contenido, etiquetas y títulos. Los roles de texto conservan sus métricas al cambiar la familia en el proveedor.

- Combina `display`, `headline`, `title`, `body` o `label` con `Large`, `Medium` o `Small`. Agrega `Emphasized` para enfatizar el mismo rol.
- Usa `languageHeight` en MobileDesignProvider para cambiar el perfil de interlineado según el contenido. `Text` permite las propiedades de texto del host como `selectable` y `numberOfLines`.
- Conserva `accessibilityRole="header"` cuando el contenido actúe como encabezado. `variant` cambia la tipografía, mientras el rol accesible describe la estructura.

**Propiedades de `Text`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `variant` | `TextVariant` | — | Rol tipográfico del tema. | `variant="headlineMedium"` en el título Documentos |
| `children` · requerida | `React.ReactNode` | — | Contenido que se compone dentro del componente. | `children={<Text variant="bodyLargeEmphasized">Guardado</Text>} dentro de una frase` |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Abre resumen de la biblioteca"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="resumen de la biblioteca"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ disabled: true }}` durante la carga de resumen de la biblioteca |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={sinPermiso}` si resumen de la biblioteca requiere permisos |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="biblioteca-resumen"` |
| `numberOfLines` | `number` | — | Número de líneas antes de truncar el texto. Con `0` el texto puede ocupar las líneas necesarias. | `numberOfLines={2}` en un espacio estrecho |
| `onPress` | `((event: GestureResponderEvent) => unknown)` | — | Ejecuta la acción al activar el control. | `onPress={abrirLicencia}` para una referencia en texto |
| `selectable` | `boolean` | — | Permite seleccionar el texto para copiarlo. | `selectable` para copiar un número de expediente |
| `style` | `((false \| void \| "" \| Readonly<Partial<TextStyle>> \| readonly StyleProp<Readonly<Partial<TextStyle>>>[]) & (false \| void \| "" \| TextStyle \| readonly StyleProp<TextStyle>[])) \| null` | — | Estilo de la superficie exterior. | `style={{ color: theme.colors.onSurfaceVariant }}` en un pie de página |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="biblioteca-resumen"` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { onSurface: "#241B2F" } }}` en resumen de la biblioteca |

**Ejemplo**

```tsx
import { View } from 'react-native';
import { Text } from 'mobile-design/react-native';

export default function Example() {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="headlineMedium" accessibilityRole="header">Documentos</Text>
      <Text variant="bodyLarge" selectable>
        Elige un archivo. <Text variant="bodyLargeEmphasized">Guardamos tus cambios.</Text>
      </Text>
      <Text variant="labelSmall">Actualizado hoy</Text>
    </View>
  );
}
```

#### Badge y BadgedBox

Comunica novedades o cantidades junto a un destino, un icono o una etiqueta, sin interrumpir la tarea.

- Usa Badge para la insignia visual o BadgedBox para anclarla a un icono o destino.
- Pasa un número como badge para cantidades o true para una novedad sin texto. El destino conserva su acción.

**Propiedades de `Badge`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `accessibilityElementsHidden` | `boolean \| Node \| AnimatedAddition \| AnimatedSubtraction \| AnimatedDivision \| AnimatedMultiplication \| AnimatedModulo \| AnimatedDiffClamp \| Value \| Interpolation<string \| number> \| Interpolation<number> \| Interpolation<string> \| Interpolation<NativeColorValue>` | — | Oculta los elementos descendientes a las tecnologías de asistencia. | `accessibilityElementsHidden` si el botón ya anuncia el recuento |
| `accessibilityHint` | `string \| Node \| AnimatedAddition \| AnimatedSubtraction \| AnimatedDivision \| AnimatedMultiplication \| AnimatedModulo \| AnimatedDiffClamp \| Value \| Interpolation<string \| number> \| Interpolation<number> \| Interpolation<string> \| Interpolation<NativeColorValue>` | — | Contexto adicional sobre la acción. | `accessibilityHint="Indica correo sin leer"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="ocho mensajes nuevos"` |
| `accessibilityState` | `Consultar el tipo TypeScript` | — | Estado semántico del control. | `accessibilityState={{ disabled: true }}` si la acción que lo contiene está deshabilitada |
| `children` | `ReactNode` | — | Contenido breve de una insignia de tipo `large`. | `children={8}` para indicar ocho mensajes sin leer |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={sinPermiso}` si ocho mensajes nuevos requiere permisos |
| `importantForAccessibility` | `Node \| AnimatedAddition \| AnimatedSubtraction \| AnimatedDivision \| AnimatedMultiplication \| AnimatedModulo \| AnimatedDiffClamp \| Value \| Interpolation<string \| number> \| Interpolation<number> \| Interpolation<string> \| Interpolation<NativeColorValue> \| "auto" \| "yes" \| "no" \| "no-hide-descendants"` | — | Controla qué elementos se exponen a las tecnologías de asistencia en Android. `auto` delega la decisión al sistema, `yes` incluye el elemento, `no` lo excluye y `no-hide-descendants` excluye también a sus descendientes. | `importantForAccessibility="no-hide-descendants"` si el botón ya anuncia el recuento |
| `maximum` | `number` | `999` | A partir de este límite un número se muestra con sufijo `+`. | `maximum={99}` para mostrar "99+" con más de 99 mensajes |
| `nativeID` | `string \| Node \| AnimatedAddition \| AnimatedSubtraction \| AnimatedDivision \| AnimatedMultiplication \| AnimatedModulo \| AnimatedDiffClamp \| Value \| Interpolation<string \| number> \| Interpolation<number> \| Interpolation<string> \| Interpolation<NativeColorValue>` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="correo-insignia"` |
| `numberOfLines` | `number \| Node \| AnimatedAddition \| AnimatedSubtraction \| AnimatedDivision \| AnimatedMultiplication \| AnimatedModulo \| AnimatedDiffClamp \| Value \| Interpolation<string \| number> \| Interpolation<number> \| Interpolation<string> \| Interpolation<NativeColorValue>` | — | Número de líneas antes de truncar el texto. Con `0` el texto puede ocupar las líneas necesarias. | `numberOfLines={1}` para un contador corto |
| `onPress` | `((event: GestureResponderEvent) => unknown)` | — | Ejecuta la acción al activar el control. | `onPress={abrirCorreo}` si el badge es autónomo. Si está en un icono, coloca la acción en IconButton. |
| `selectable` | `boolean \| Node \| AnimatedAddition \| AnimatedSubtraction \| AnimatedDivision \| AnimatedMultiplication \| AnimatedModulo \| AnimatedDiffClamp \| Value \| Interpolation<string \| number> \| Interpolation<number> \| Interpolation<string> \| Interpolation<NativeColorValue>` | — | Permite seleccionar el texto para copiarlo. | `selectable={false}` en un recuento decorativo |
| `size` | `number` | — | Tamaño visual o escala semántica del control. | `size={20}` para aumentar el diámetro de una insignia grande |
| `style` | `Consultar el tipo TypeScript` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="correo-insignia"` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { error: "#BA1A1A", onError: "#FFFFFF" } }}` para la insignia |
| `variant` | `"large" \| "dot"` | — | Tratamiento visual o modalidad del componente. | `variant="dot"` para novedades sin número |
| `visible` | `boolean` | `true` | Controla si la superficie o el indicador se presenta. | `visible={sinLeer > 0}` |

<details>
<summary>Configuración complementaria de Badge y BadgedBox</summary>

**`BadgedBox`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `children={<MaterialSymbol name="mail" size={24} />}` |
| `badge` | `string \| number \| boolean` | — | Acepta un número, texto o `true` para mostrar una novedad sin texto. Oculta la insignia con `false` u omitiendo el valor. | `badge={8}` para el icono Correo |
| `badgeContainerStyle` | `StyleProp<AnimatedStyle<____ViewStyleProp_Internal \| undefined>>` | — | Estilo del contenedor que posiciona la insignia sobre el ancla. | `badgeContainerStyle={{ marginTop: 2 }}` para ajustar el anclaje |
| `maximum` | `number` | `999` | Tope que se usa para mostrar cantidades. | `maximum={99}` para recuentos truncados |
| `onBadgeLayout` | `((event: LayoutChangeEvent) => unknown) \| SharedValueDisableContravariance<((event: LayoutChangeEvent) => unknown) \| undefined>` | — | Recibe el evento de layout del contenedor de la insignia. | `onBadgeLayout={({ nativeEvent }) => setAnchoInsignia(nativeEvent.layout.width)}` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | `'mobile-badged-box'` | Identificador para automatización en el host. | `testID="correo-ancla"` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import {
  BadgedBox,
  IconButton,
  MaterialSymbol,
  Text,
} from 'mobile-design/react-native';

export default function Example() {
  const [feedback, setFeedback] = useState('');

  return (
    <View style={{ gap: 16 }}>
      <IconButton
        icon={(props) => (
          <BadgedBox badge={8}>
            <MaterialSymbol
              {...props}
              name="mail"
            />
          </BadgedBox>
        )}
        accessibilityLabel="Correo, 8 mensajes nuevos"
        onPress={() =>
          setFeedback('Correo. Tienes 8 mensajes nuevos')
        }
      />
      <Text accessibilityLiveRegion="polite">{feedback}</Text>
    </View>
  );
}
```

**Indicador de estado independiente**

Usa una insignia con texto si también hay un nombre accesible. Para anunciar el significado en un botón con `BadgedBox`, pon el recuento en el nombre del botón.

```tsx
import { View } from 'react-native';
import { Badge, Text } from 'mobile-design/react-native';

export function EstadoDeBandeja({ sinLeer }: { sinLeer: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text>Bandeja de entrada</Text>
      <Badge variant="large" maximum={99} visible={sinLeer > 0} accessibilityLabel={`${sinLeer} sin leer`}>
        {sinLeer}
      </Badge>
    </View>
  );
}
```

#### Card

Agrupa contenido y acciones que pertenecen a una misma entidad, con tratamientos Elevated, Filled u Outlined.

- Escoge Elevated, Filled u Outlined y compón Card.Title, Card.Content, Card.Cover y Card.Actions. El contenedor es el único elemento obligatorio.
- Usa una tarjeta informativa con controles internos, o una superficie directamente pulsable sin otros controles dentro. En navegador, href crea un enlace real. OnPress permite coordinar navegación en la aplicación.

Compón el contenido con `Card.Title`, `Card.Content`, `Card.Cover` y `Card.Actions`. Si toda la tarjeta abre un destino, reserva sus hijos para contenido de presentación. Si tiene varias acciones, coloca los controles dentro de `Card.Actions` y deja la superficie como contenedor.

<details>
<summary>Propiedades de las piezas de Card</summary>

| Pieza | Propiedad | Uso | Ejemplo |
| --- | --- | --- | --- |
| `Card.Title` | `title` · requerida y `subtitle` | Texto principal y secundario de la cabecera. | `title="Biblioteca" subtitle="6 colecciones"` |
| `Card.Title` | `titleVariant` y `subtitleVariant` | Escalas tipográficas. Inicialmente `'bodyLarge'` y `'bodyMedium'`. | `titleVariant="titleMedium" subtitleVariant="bodySmall"` |
| `Card.Title` | `titleNumberOfLines` y `subtitleNumberOfLines` | Máximo de líneas, inicialmente `1` en cada texto. | `titleNumberOfLines={2} subtitleNumberOfLines={2}` |
| `Card.Title` | `titleStyle` y `subtitleStyle` | Estilos específicos del título y subtítulo. | `titleStyle={{ fontWeight: '700' }} subtitleStyle={{ letterSpacing: 0.2 }}` |
| `Card.Title` | `titleMaxFontSizeMultiplier` y `subtitleMaxFontSizeMultiplier` | Límites de escala de texto. | `titleMaxFontSizeMultiplier={2} subtitleMaxFontSizeMultiplier={2}` |
| `Card.Title` | `left` y `right` | Renderizadores laterales que reciben `size`. | `left={({ size }) => <Avatar.Icon icon="folder" size={size} />}` y `right={() => <Text>6</Text>}` |
| `Card.Title` | `leftStyle`, `rightStyle` y `style` | Estilos de ambos slots y de la cabecera. | `leftStyle={{ marginEnd: 8 }} rightStyle={{ marginEnd: 12 }} style={{ minHeight: 72 }}` |
| `Card.Content` | `children` · requerida y `style` | Contenido principal y estilo de su contenedor. | `<Card.Content style={{ gap: 8 }}><Text>Contenido</Text></Card.Content>` |
| `Card.Cover` | `source` y `style` | Imagen de portada y estilo de su región. Admite propiedades de imagen del host. | `source={portada} style={{ height: 180 }}` |
| `Card.Actions` | `children` · requerida y `style` | Acciones y estilo de la región que las agrupa. | `<Card.Actions style={{ gap: 8 }}><Button onPress={openDetails}>Ver detalles</Button></Card.Actions>` |
| `Card.Title`, `Card.Cover` y `Card.Actions` | `theme` | Ajuste local en la pieza que lo declara. | `theme={{ shapes: { corner: { medium: 16 } } }}` en `Card.Cover`. |

</details>

**Propiedades de `Card`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `React.ReactNode` | — | Contenido que se compone dentro del componente. | `children={<Card.Content><Text>Una colección para descubrir</Text></Card.Content>}` |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Abre colección En buena compañía"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="colección En buena compañía"` |
| `accessibilityRole` | `string` | — | Rol semántico que debe anunciar la fila. | `accessibilityRole="checkbox"` en una tarjeta seleccionable |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ checked: guardada }}` en una tarjeta seleccionable |
| `accessible` | `boolean` | — | Expone la tarjeta como elemento accesible. Una tarjeta interactiva puede agrupar su contenido en un objetivo accesible. | `accessible` en una tarjeta que tiene un único destino |
| `contentStyle` | `StyleProp<ViewStyle>` | — | Estilo del contenido dentro de la superficie. | `contentStyle={{ paddingVertical: 8 }}` |
| `delayLongPress` | `number` | — | Tiempo en milisegundos antes de activar la pulsación mantenida. | `delayLongPress={500}` para abrir opciones después de medio segundo |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={sinPermiso}` si colección En buena compañía requiere permisos |
| `dragged` | `boolean` | `false` | Aplica el estado visual de arrastre. | `dragged={arrastrando}` desde el controlador de reordenamiento |
| `elevation` | `0 \| Animated.Value \| 1 \| 2 \| 3 \| 4 \| 5` | — | Nivel de elevación de la superficie. | `elevation={1}` en una tarjeta destacada |
| `href` | `string` | — | Dirección del enlace real en el navegador. | `href="/colecciones/en-buena-compania"` desde el entry web |
| `hrefAttrs` | `{ rel?: string; }` | — | Atributos del enlace web, como `target`, `rel` o `download`. | `hrefAttrs={{ rel: "noopener" }}` para el enlace web |
| `mode` | `"elevated" \| "outlined" \| "contained"` | `'elevated'` | Modo de uso admitido por este componente. | `mode="contained" corresponde a variant="filled"; usa variant` en código nuevo |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="coleccion-tarjeta"` |
| `onBlur` | `((event: BlurEvent) => void)` | — | Avisa cuando el control pierde el foco. | `onBlur={() => setTieneFoco(false)}` |
| `onFocus` | `((event: FocusEvent) => void)` | — | Avisa cuando el control recibe el foco. | `onFocus={() => setTieneFoco(true)}` |
| `onHoverIn` | `((event: MouseEvent) => unknown)` | — | Avisa al entrar el puntero en la superficie. | `onHoverIn={() => setVistaPrevia(true)}` en web |
| `onHoverOut` | `((event: MouseEvent) => unknown)` | — | Avisa al salir el puntero de la superficie. | `onHoverOut={() => setVistaPrevia(false)}` en web |
| `onLongPress` | `(() => void)` | — | Acción que requiere una pulsación mantenida. | `onLongPress={abrirOpciones}` |
| `onPress` | `((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress={abrirColeccion}` en la app nativa |
| `onPressIn` | `((event: GestureResponderEvent) => void)` | — | Avisa al iniciar una pulsación. | `onPressIn={() => setPulsando(true)}` |
| `onPressOut` | `((event: GestureResponderEvent) => void)` | — | Avisa al terminar o salir de una pulsación. | `onPressOut={() => setPulsando(false)}` |
| `ref` | `React.Ref<(props: Omit<ViewProps, "ref"> & { ref?: React.Ref<ViewInstance> \| undefined; }) => React.ReactNode>` | — | Referencia imperativa con las operaciones del componente anfitrión. | `ref={referencia}` para medir colección En buena compañía desde el host |
| `style` | `Animated.WithAnimatedValue<StyleProp<ViewStyle>>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }} entre tarjetas` |
| `testID` | `string` | `'mobile-card'` | Identificador para automatización en el host. | `testID="coleccion-tarjeta"` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { onSurface: "#241B2F" } }}` en colección En buena compañía |
| `variant` | `"filled" \| "elevated" \| "outlined"` | — | Tratamiento visual o modalidad del componente. | `variant="filled"` para agrupar contenido sobre una superficie tonal |

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { Card, Text, Button } from 'mobile-design/react-native';

export default function Example() {
  const [feedback, setFeedback] = useState('');

  return (
    <View style={{ gap: 16 }}>
      <Card variant="filled">
        <Card.Title
          title="En buena compañía"
          subtitle="Una colección para descubrir"
        />
        <Card.Content>
          <Text variant="bodyMedium">
            Contenido y acciones de una misma idea.
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button
            variant="text"
            onPress={() => setFeedback('Colección abierta')}
          >
            Explorar
          </Button>
        </Card.Actions>
      </Card>
      <Text accessibilityLiveRegion="polite">{feedback}</Text>
    </View>
  );
}
```

**Portada, título, contenido y acciones de una Card**

```tsx
import type { ImageSourcePropType } from 'react-native';
import { Button, Card, Text } from 'mobile-design/react-native';

type Props = { portada: ImageSourcePropType; abrirColeccion: () => void };

export function ColeccionDestacada({ portada, abrirColeccion }: Props) {
  return (
    <Card variant="outlined">
      <Card.Cover source={portada} />
      <Card.Title title="En buena compañía" subtitle="Colección editorial" />
      <Card.Content><Text>Doce documentos seleccionados por el equipo.</Text></Card.Content>
      <Card.Actions>
        <Button variant="text" onPress={abrirColeccion}>Abrir colección</Button>
      </Card.Actions>
    </Card>
  );
}
```

#### Carousel

Muestra colecciones visuales en las variantes de la referencia y en Vertical, una extensión propia de Mobile Design para galerías de distintas proporciones.

- Pasa items con id único y title. Image, icon y aspectRatio describen su contenido visual.
- Elige variant y conecta onItemPress con el destino. OnIndexChange permite observar la posición aceptada.
- Para una galería apilada usa variant="vertical" y height como altura del viewport. Cada aspectRatio expresa ancho dividido entre alto. Una proporción ausente o inválida utiliza 1.

Cada elemento usa un `id` estable. `aspectRatio` es ancho dividido entre alto. `onIndexChange` observa el índice aceptado, mientras `initialIndex` fija la posición de arranque.

**Propiedades de `Carousel`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `items` · requerida | `readonly CarouselItem[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. | `items={destinos}` con id, title e image en cada ficha |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="destinos para explorar"` |
| `alignment` | `"start" \| "center"` | — | Alineación de los elementos en su región. | `alignment="center"` para centrar el grupo |
| `contentPadding` | `number` | — | Espacio exterior del carrusel. En uncontained afecta al borde inicial y en vertical a todos los bordes. | `contentPadding={16}` para separar las imágenes del borde |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={sinPermiso}` si destinos para explorar requiere permisos |
| `height` | `number` | — | Altura disponible en dp o unidades lógicas del host. | `height={240}` para imágenes de portada |
| `initialIndex` | `number` | — | Índice inicial al montar la colección. | `initialIndex={1}` para iniciar en la segunda foto |
| `onIndexChange` | `((index: number) => void)` | — | Avisa del cambio de índice aceptado. | `onIndexChange={setFotoActual}` para sincronizar un contador |
| `onItemPress` | `((item: CarouselItem, index: number) => void)` | — | Entrega el elemento activado. | `onItemPress={(item) => abrirDestino(item.id)}` |
| `preferredItemWidth` | `number` | — | Ancho deseado antes del recorte. La variante multi-browse lo ajusta a la distribución disponible. | `preferredItemWidth={240}` para una ficha de imagen |
| `renderItemContent` | `((props: { item: CarouselItem; index: number; width: number; height: number; }) => ReactNode)` | — | Renderiza el contenido visual dentro de la máscara. Recibe las dimensiones antes del recorte y usa `null` para volver a la imagen o icono del elemento. | `renderItemContent={({ item, width, height }) => <Image source={item.image} style={{ width, height }} />}` |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ horizontal: true }}` en una galería horizontal |
| `showControls` | `boolean` | — | Muestra los controles de navegación de la colección. | `showControls` para ofrecer botones Anterior y Siguiente |
| `showText` | `boolean` | — | Muestra el texto que acompaña al elemento. | `showText={false}` si cada imagen ya incorpora su título |
| `snapping` | `boolean` | — | Ajusta el desplazamiento a posiciones fijas en las variantes vertical y uncontained. Las variantes contenidas y de pantalla completa ya aplican el ajuste. | `snapping` en variant="vertical" para ajustar el desplazamiento a una imagen |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="destinos-carrusel"` |
| `textInsetBottom` | `number` | — | Espacio inferior reservado para el texto. | `textInsetBottom={24}` para separar pies de foto del borde inferior en pantalla completa |
| `textPlacement` | `"overlay" \| "below"` | — | Posición del texto respecto del contenido visual. | `textPlacement="below"` para texto bajo la imagen |
| `variant` | `"multi-browse" \| "hero" \| "center-aligned-hero" \| "uncontained" \| "uncontained-multi-aspect" \| "full-screen" \| "vertical"` | — | Tratamiento visual o modalidad del componente. | `variant="hero"` para destacar la primera ficha |

<details>
<summary>Configuración complementaria de Carousel</summary>

**`FullScreenCarousel`**

Cada página usa la altura del viewport en una colección vertical paginada. Úsalo con una ventana compacta o mediana y sin margen exterior. Esta composición toma la parte de `CarouselProps` correspondiente a los elementos, índice inicial, controles y viewport. Su paginación y presentación son fijas. Configura `variant`, `preferredItemWidth`, `contentPadding`, `alignment`, `snapping` y `textPlacement` en `Carousel` cuando necesites esas opciones.

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `items` · requerida | `readonly CarouselItem[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. | `items={fotosDelViaje}` con identificadores estables |
| `accessibilityLabel` | `string` | `'Carrusel vertical'` | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="fotos del viaje"` |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={sinPermiso}` si fotos del viaje requiere permisos |
| `height` | `number` | `640` | Altura disponible en dp o unidades lógicas del host. | `height={alturaDisponible}` para ocupar un visor |
| `initialIndex` | `number` | `0` | Índice inicial al montar la colección. | `initialIndex={fotoTocada}` para abrir el elemento pulsado |
| `onIndexChange` | `((index: number) => void)` | — | Avisa del cambio de índice aceptado. | `onIndexChange={setFotoActual}` |
| `onItemPress` | `((item: CarouselItem, index: number) => void)` | — | Entrega el elemento activado. | `onItemPress={(item) => abrirDetalleDeFoto(item.id)}` |
| `renderItemContent` | `((props: { item: CarouselItem; index: number; width: number; height: number; }) => ReactNode)` | — | Renderiza el contenido visual dentro de la máscara. Recibe las dimensiones antes del recorte y usa `null` para volver a la imagen o icono del elemento. | `renderItemContent={({ item, width, height }) => <Image source={item.image} style={{ width, height }} />}` |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` si hay contenido fuera de pantalla |
| `showControls` | `boolean` | `false` | Muestra los controles de navegación de la colección. | `showControls` para navegar sin deslizar |
| `showText` | `boolean` | `true` | Muestra el texto que acompaña al elemento. | `showText` para mostrar títulos |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | `'carousel'` | Identificador para automatización en el host. | `testID="viaje-fotos"` |
| `textInsetBottom` | `number` | `0` | Espacio inferior reservado para el texto. | `textInsetBottom={24}` para separar los títulos del borde inferior |

**`CarouselItem`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `id` · requerida | `string` | — | Identificador del campo. | `id: "bosque"` |
| `title` · requerida | `string` | — | Título visible o contenido principal. | `title: "Bosque al amanecer"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel: "Bosque con neblina al amanecer"` |
| `aspectRatio` | `number` | — | Relación entre ancho y alto del contenido visual. La variante vertical conserva la proporción indicada y usa `1` cuando se omite. | `aspectRatio: 4 / 3` para una foto apaisada |
| `description` | `string` | — | Texto secundario de apoyo. | `description: "Ruta de montaña, 6 km"` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: !rutaDisponible` |
| `icon` | `string` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: "landscape"` como respaldo si no hay imagen |
| `image` | `number \| ImageSource` | — | Fuente de imagen del elemento, como un recurso local o un objeto con URI. | `image: require("./assets/bosque.jpg")` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { Carousel, Text } from 'mobile-design/react-native';

export default function Example() {
  const [feedback, setFeedback] = useState('');

  return (
    <View style={{ gap: 16 }}>
      <Carousel
        variant="multi-browse"
        height={240}
        accessibilityLabel="Destinos para explorar"
        items={[
          { id: 'mountain', title: 'Montaña', icon: 'image-outline' },
          { id: 'coast', title: 'Costa', icon: 'image-outline' },
          { id: 'forest', title: 'Bosque', icon: 'image-outline' },
        ]}
        onItemPress={(item) => setFeedback(item.title)}
      />
      <Text accessibilityLiveRegion="polite">{feedback}</Text>
    </View>
  );
}
```

**Visor con FullScreenCarousel**

```tsx
import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { FullScreenCarousel, Text, type CarouselItem } from 'mobile-design/react-native';

export function VisorDeFotos({ fotos }: { fotos: readonly CarouselItem[] }) {
  const { height } = useWindowDimensions();
  const [indice, setIndice] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      <Text accessibilityLiveRegion="polite">Foto {indice + 1} de {fotos.length}</Text>
      <FullScreenCarousel
        items={fotos}
        height={Math.round(height * 0.8)}
        initialIndex={0}
        onIndexChange={setIndice}
        showControls
        textInsetBottom={24}
        accessibilityLabel="Fotos del viaje"
      />
    </View>
  );
}
```

#### Chip

Representa acciones auxiliares, filtros, datos introducidos y sugerencias en superficies compactas.

- Elige variant según Assist, Filter, Input o Suggestion. Children aporta la etiqueta.
- Controla selected para filtros. OnClose retira una entrada. OnPress conserva una función distinta.

**Propiedades de `Chip`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `React.ReactNode` | — | Contenido que se compone dentro del componente. | `children="Disponible"` |
| `accessibilityActions` | `readonly Readonly<{ name: AccessibilityActionName \| string; label?: string \| undefined; }>[]` | — | Acciones personalizadas que ofrece el control a las tecnologías de asistencia. | `accessibilityActions={[{ name: "activate", label: "Aplicar filtro Disponible" }]}` |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Abre filtro Disponible"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="filtro Disponible"` |
| `accessibilityRole` | `string` | — | Rol semántico que debe anunciar la fila. | `accessibilityRole="checkbox"` para un filtro con selección |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ checked: disponible }}` |
| `avatar` | `React.ReactNode` | — | Avatar mostrado al inicio del chip. Úsalo para ocupar el espacio visual del icono. | `avatar={<Avatar.Text label="AL" size={24} />}` en un chip de destinatario |
| `closeIcon` | `IconSource` | `'close'` | Glifo de cierre. | `closeIcon="close"` para quitar un destinatario |
| `closeIconAccessibilityLabel` | `string` | `'Quitar'` | Nombre que anuncia el lector de pantalla para la acción de quitar el chip. | `closeIconAccessibilityLabel="Quitar a Alicia"` |
| `containerRef` | `Ref<default>` | — | Referencia de la superficie visible de 32 dp. La zona de interacción exterior mide 48 dp. | `containerRef={superficieRef}` si Menu necesita medir la superficie visible |
| `delayLongPress` | `number` | — | Tiempo en milisegundos antes de activar la pulsación mantenida. | `delayLongPress={500}` para abrir opciones después de medio segundo |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={sinPermiso}` si filtro Disponible requiere permisos |
| `dragged` | `boolean` | `false` | Aplica el estado visual de arrastre. | `dragged={reordenandoDestinatario}` en una lista ordenable |
| `elevated` | `boolean` | `false` | Aplica el tratamiento elevado al chip. | `elevated` para un chip sobre una imagen |
| `ellipsizeMode` | `EllipsizeProp` | — | Posición de los puntos suspensivos cuando se trunca la etiqueta. | `ellipsizeMode="tail"` para una etiqueta de destinatario larga |
| `hitSlop` | `RectOrSize` | — | Amplía la zona de pulsación más allá de los bordes visibles. La zona queda limitada por su contenedor y respeta el orden visual de los elementos superpuestos. | `hitSlop={8}` si hay espacio suficiente alrededor de un chip aislado |
| `icon` | `IconSource` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon="folder"` |
| `maxFontSizeMultiplier` | `number` | — | Límite de escalado del contenido de texto. | `maxFontSizeMultiplier={2}` si el chip tiene una restricción de espacio |
| `mode` | `"flat" \| "outlined"` | — | Modo de uso admitido por este componente. | `mode="outlined"` para un filtro de contorno |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="filtro-disponible"` |
| `onAccessibilityAction` | `((event: AccessibilityActionEvent) => unknown)` | — | Se ejecuta cuando se activa una de las acciones de accesibilidad del chip. | `onAccessibilityAction={({ nativeEvent }) => { if (nativeEvent.actionName === "activate") alternarDisponible(); }}` |
| `onBlur` | `((event: BlurEvent) => void)` | — | Avisa cuando el control pierde el foco. | `onBlur={() => setTieneFoco(false)}` |
| `onClose` | `(() => void)` | — | Acción de cierre o eliminación. Al pasarla se muestra el botón de cierre. | `onClose={quitarAlicia}` para quitar el destinatario |
| `onFocus` | `((event: FocusEvent) => void)` | — | Avisa cuando el control recibe el foco. | `onFocus={() => setTieneFoco(true)}` |
| `onHoverIn` | `((event: MouseEvent) => unknown)` | — | Avisa al entrar el puntero en la superficie. | `onHoverIn={() => setVistaPrevia(true)}` en web |
| `onHoverOut` | `((event: MouseEvent) => unknown)` | — | Avisa al salir el puntero de la superficie. | `onHoverOut={() => setVistaPrevia(false)}` en web |
| `onLongPress` | `(() => void)` | — | Acción que requiere una pulsación mantenida. | `onLongPress={mostrarInformacionDelFiltro}` |
| `onPress` | `((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress={alternarDisponible}` para aplicar o retirar el filtro |
| `onPressIn` | `((e: GestureResponderEvent) => void)` | — | Avisa al iniciar una pulsación. | `onPressIn={() => setPulsando(true)}` |
| `onPressOut` | `((e: GestureResponderEvent) => void)` | — | Avisa al terminar o salir de una pulsación. | `onPressOut={() => setPulsando(false)}` |
| `onTrailingIconPress` | `(() => void)` | — | Callback del icono final cuando es una acción independiente. | `onTrailingIconPress={abrirCategorias}` |
| `pressed` | `boolean` | `false` | Conserva la apariencia de pulsación para composiciones coordinadas. | `pressed={menuCategoriasAbierto}` mientras el menú siga visible |
| `ref` | `Ref<default>` | — | Referencia imperativa con las operaciones del componente anfitrión. | `ref={referencia}` para medir filtro Disponible desde el host |
| `selected` | `boolean` | `false` | Selección persistente controlada por el consumidor. | `selected={disponible}` |
| `selectedColor` | `ColorValue` | — | Color personalizado del texto y del icono inicial cuando el chip está habilitado. | `selectedColor={theme.colors.primary}` |
| `showSelectedCheck` | `boolean` | — | Muestra una marca de selección en un chip seleccionado que admite ese estado. La marca ocupa el lugar del icono inicial. | `showSelectedCheck={false}` si el filtro lleva un icono propio |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | `'chip'` | Identificador para automatización en el host. | `testID="filtro-disponible"` |
| `textStyle` | `StyleProp<TextStyle>` | — | Estilo aplicado al texto del chip. | `textStyle={{ fontWeight: "600" }}` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { onSurface: "#241B2F" } }}` en filtro Disponible |
| `trailingIcon` | `any` | — | Icono al final del control. | `trailingIcon="arrow_drop_down"` para mostrar un menú de categorías |
| `trailingIconAccessibilityLabel` | `string` | — | Nombre accesible para la acción del icono final. | `trailingIconAccessibilityLabel="Abrir categorías"` |
| `variant` | `"filter" \| "input" \| "assist" \| "suggestion"` | `'assist'` | Tratamiento visual o modalidad del componente. | `variant="filter"` en el conjunto de filtros |

<details>
<summary>Configuración complementaria de Chip</summary>

**`Chip.Group`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `children={<Chip variant="filter" onPress={alternarDisponible}>Disponible</Chip>}` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="filtros de biblioteca"` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ gap: 8, flexWrap: "wrap" }}` para un grupo que puede ocupar dos líneas |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="biblioteca-filtros"` |

**`ChipGroupProps`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `children={<Chip variant="filter" onPress={alternarDisponible}>Disponible</Chip>}` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="filtros de biblioteca"` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { Chip } from 'mobile-design/react-native';

export default function Example() {
  const [selected, setSelected] = useState(false);

  return (
    <Chip
      variant="filter"
      selected={selected}
      onPress={() => setSelected((value) => !value)}
    >
      Descargadas
    </Chip>
  );
}
```

**Grupo de filtros con selección independiente**

```tsx
import { useState } from 'react';
import { Chip } from 'mobile-design/react-native';

const filtros = ['Disponibles', 'Recientes', 'Compartidos'];

export function FiltrosDeBiblioteca() {
  const [activos, setActivos] = useState<string[]>([]);

  return (
    <Chip.Group accessibilityLabel="Filtros de biblioteca">
      {filtros.map((filtro) => (
        <Chip
          key={filtro}
          variant="filter"
          selected={activos.includes(filtro)}
          onPress={() =>
            setActivos((previos) =>
              previos.includes(filtro) ? previos.filter((item) => item !== filtro) : [...previos, filtro],
            )
          }
        >
          {filtro}
        </Chip>
      ))}
    </Chip.Group>
  );
}
```

#### Divider

Ayuda a distinguir contenido o regiones de una composición mediante una línea sutil.

- Coloca Divider entre regiones. Orientation cambia el eje y thickness e insets ajustan la línea.

**Propiedades de `Divider`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | Para una separación con significado, pon accessibilityHint en el encabezado o control adyacente |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | Pon el nombre del grupo en `<Text accessibilityRole="header">Guardados</Text>`. Divider queda oculto al lector. |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | Pon `accessibilityState={{ expanded: true }}` en el control que abre el grupo. Divider es decorativo. |
| `bold` | `boolean` | `true` | Usa el tratamiento más marcado del divisor. | `bold={false}` para usar el grosor fino del dispositivo |
| `horizontalInset` | `boolean` | — | Reserva margen en ambos extremos de la línea horizontal. | `horizontalInset entre filas que comparten sangría a ambos lados` |
| `leftInset` | `boolean` | — | Reserva un margen al inicio lógico de la línea horizontal. | `leftInset` para alinear con el inicio lógico del texto |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="colecciones-separador"` |
| `orientation` | `"horizontal" \| "vertical"` | `'horizontal'` | Eje de la composición. | `orientation="vertical" entre dos columnas` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="colecciones-separador"` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { onSurface: "#241B2F" } }}` en separación de colecciones |
| `thickness` | `number` | — | Grosor del trazo en dp. | `thickness={2}` para un separador de 2 dp |

**Ejemplo**

```tsx
import { View } from 'react-native';
import { Divider, Text } from 'mobile-design/react-native';

export default function Example() {
  return (
    <View style={{ gap: 16 }}>
      <Text variant="titleMedium">Tu biblioteca</Text>
      <Divider />
      <Text variant="bodyMedium">Colecciones guardadas</Text>
    </View>
  );
}
```

#### List

Presenta elementos con título, descripción y contenido de apoyo en listas Standard o Segmented.

- Compón List.Item con title y slots leading/trailing. Description y lines definen apoyo y altura.
- En List.Group, usa accessibilityLabel para nombrar la selección. Los elementos seleccionables de un mismo modo forman una lista de opciones en web.
- Usa una región primaria para navegación y controles trailing independientes cuando la fila tenga varias acciones.

Usa `List.Collection` para contenido agrupado y `List.Group` para filas coordinadas. `List.Icon`, `List.Image`, `List.Section` y `List.Subheader` son piezas de composición. Para una colección grande monta las filas en una lista virtualizada del consumidor.

<details>
<summary>Propiedades de los slots de List</summary>

| Pieza | Propiedad | Uso | Ejemplo |
| --- | --- | --- | --- |
| `List.Icon` | `icon` · requerida, `color` y `style` | Icono para un slot de una fila y su estilo. | `leading={({ color }) => <List.Icon icon="folder" color={color} style={{ marginEnd: 8 }} />}` |
| `List.Image` | `source` · requerida, `variant` y `style` | Imagen de una fila. `variant` admite `'image'` y `'video'`. | `leading={<List.Image source={thumbnail} variant="video" style={{ borderRadius: 8 }} />}` |
| `List.Section` | `children` · requerida, `title`, `titleStyle` y `style` | Agrupa filas y puede renderizar su encabezado. | `<List.Section title="Favoritos" titleStyle={{ fontWeight: '700' }} style={{ marginTop: 12 }}><List.Item title="Notas" /></List.Section>` |
| `List.Subheader` | `children` · requerida, `style` y `maxFontSizeMultiplier` | Encabezado de texto. También acepta las props de `Text` que hereda. | `<List.Subheader style={{ marginBottom: 8 }} maxFontSizeMultiplier={2}>Carpetas</List.Subheader>` |
| Los cuatro slots | `theme` | Ajustes locales de tema. | `theme={{ colors: { onSurfaceVariant: '#42474E' } }}` en `List.Subheader`. |

</details>

**Propiedades de `List.Item`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `title` · requerida | `ReactNode` | — | Título visible o contenido principal. | `title="Informe trimestral"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Informe trimestral"` |
| `accessibilityRole` | `string` | — | Rol semántico que debe anunciar la fila. | `accessibilityRole="button"` para abrir el documento |
| `content` | `ReactNode` | — | Contenido propio dentro de la fila. | `content={<Text variant="bodyLarge">Informe trimestral</Text>}` al componer contenido propio |
| `delayLongPress` | `number` | — | Tiempo en milisegundos antes de activar la pulsación mantenida. | `delayLongPress={500}` para abrir opciones después de medio segundo |
| `description` | `ReactNode` | — | Texto secundario de apoyo. | `description="Documento compartido por Alicia"` |
| `descriptionNumberOfLines` | `1 \| 2 \| 3` | — | Máximo de líneas de la descripción. | `descriptionNumberOfLines={2}` para una descripción larga |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={sinPermiso}` si Informe trimestral requiere permisos |
| `dragged` | `boolean` | `false` | Aplica el estado visual de arrastre. | `dragged={arrastrando}` cuando ListReorderGroup mueve esta fila |
| `expanded` | `boolean` | — | Estado controlado de expansión. | `expanded={carpetaAbierta}` para representar un destino desplegado |
| `leading` | `ReactNode \| ((props: ListSlotProps) => ReactNode)` | — | Slot al inicio lógico del contenido. | `leading={<MaterialSymbol name="folder" />}` |
| `lines` | `1 \| 2 \| 3` | — | Número de líneas que determina la anatomía y altura de la fila. | `lines={2}` para título y descripción |
| `metadata` | `ReactNode` | — | Contenido auxiliar en el extremo de la fila. | `metadata="PDF · 2,4 MB"` |
| `multiAction` | `boolean` | `false` | Coordina el foco cuando la fila contiene varias acciones independientes. | `multiAction` con onPress={abrirInforme} y un IconButton independiente en trailing |
| `onLongPress` | `(((event: GestureResponderEvent) => unknown) & ((e: GestureResponderEvent) => void))` | — | Acción que requiere una pulsación mantenida. | `onLongPress={abrirOpciones}` |
| `onPress` | `(() => void)` | — | Ejecuta la acción al activar el control. | `onPress={abrirDetalle}` para abrir Informe trimestral |
| `overline` | `string` | — | Etiqueta breve sobre el título de la fila. | `overline="Compartido"` |
| `position` | `Position` | — | Posición lógica o compartida de la superficie. | `position="first"` para redondear el inicio de un grupo compuesto manualmente |
| `selected` | `boolean` | `false` | Selección persistente controlada por el consumidor. | `selected={documentosMarcados.includes("q4")}` |
| `selectionMode` | `"single" \| "multiple"` | — | Define si la selección es inexistente, única o múltiple. | `selectionMode="multiple"` para marcar varios informes |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | `'mobile-list-item'` | Identificador para automatización en el host. | `testID="informe-trimestral"` |
| `titleNumberOfLines` | `number` | `1` | Máximo de líneas del título. | `titleNumberOfLines={2}` |
| `trailing` | `ReactNode \| ((props: ListSlotProps) => ReactNode)` | — | Slot al final lógico del contenido. | `trailing={<IconButton icon="more_vert" accessibilityLabel="Opciones" onPress={abrirOpciones} />}` |
| `variant` | `"expressive" \| "baseline"` | `'expressive'` | Tratamiento visual o modalidad del componente. | `variant="baseline"` para filas rectas sin forma expresiva |

<details>
<summary>Configuración complementaria de List</summary>

**`List.Group`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `children={[<List.Item key="q4" title="Informe trimestral" />, <List.Item key="notes" title="Notas del equipo" />]}` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="documentos compartidos"` |
| `variant` | `"standard" \| "segmented"` | `'segmented'` | Tratamiento visual o modalidad del componente. | `variant="segmented"` para filas con separación y forma propia |

**`List.Collection`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `children={<List.Item title="Informe trimestral" onPress={abrirInforme} />}` para habilitar la colección de foco |

**`List.Accordion`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `children={<List.Item title="Informe trimestral" onPress={abrirInforme} />}` |
| `title` · requerida | `ReactNode` | — | Título visible o contenido principal. | `title="Informes"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="carpeta Informes"` |
| `description` | `ReactNode` | — | Texto secundario de apoyo. | `description="Tres documentos compartidos"` |
| `descriptionNumberOfLines` | `1 \| 2 \| 3` | — | Máximo de líneas de la descripción. | `descriptionNumberOfLines={2}` |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={sinPermiso}` si carpeta Informes requiere permisos |
| `expanded` | `boolean` | — | Estado controlado de expansión. | `expanded={carpetaAbierta}` |
| `leading` | `ReactNode \| ((props: ListSlotProps) => ReactNode)` | — | Slot al inicio lógico del contenido. | `leading={<MaterialSymbol name="folder" />}` |
| `onPress` | `(() => void)` | — | Ejecuta la acción al activar el control. | `onPress={() => setCarpetaAbierta((abierta) => !abierta)}` |
| `testID` | `string` | `'mobile-list-accordion'` | Identificador para automatización en el host. | `testID="carpeta-informes"` |
| `titleNumberOfLines` | `number` | — | Máximo de líneas del título. | `titleNumberOfLines={2}` |

**`SwipeListItem`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `children={<List.Item title="Informe trimestral" onPress={abrirInforme} />}` |
| `id` · requerida | `string` | — | Identificador único de la fila dentro del grupo. | `id="informe-q4"` para coordinar el cierre con otras filas |
| `closeAccessibilityLabel` | `string` | — | Nombre accesible del cierre. | `closeAccessibilityLabel="Cerrar acciones de Informe trimestral"` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={sinPermiso}` si fila del informe requiere permisos |
| `leadingActions` | `readonly SwipeListAction[]` | — | Acciones que aparecen al deslizar. Cada objetivo mide 64 dp más márgenes de 2 dp y el conjunto debe caber en la fila. Agrupa acciones adicionales en un `Menu`. | `leadingActions={[{ key: "save", icon: "bookmark", label: "Guardar", onPress: guardarInforme }]}` |
| `leadingSwipeMode` | `"disabled" \| "direct" \| "indirect"` | — | Presentación de la acción de deslizamiento del lado inicial. | `leadingSwipeMode="indirect"` para revelar Guardar antes de tocarlo |
| `onOpenChange` | `((side: SwipeListSide \| null) => void)` | — | Notifica qué lado se abrió. Devuelve `null` al cerrar las acciones. | `onOpenChange={(side) => setAccionesVisibles(side !== null)}` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="informe-deslizable"` |
| `trailingActions` | `readonly SwipeListAction[]` | — | Acciones que aparecen al deslizar. Cada objetivo mide 64 dp más márgenes de 2 dp y el conjunto debe caber en la fila. Agrupa acciones adicionales en un `Menu`. | `trailingActions={[{ key: "delete", icon: "delete", label: "Eliminar", destructive: true, onPress: confirmarEliminar }]}` |
| `trailingSwipeMode` | `"disabled" \| "direct" \| "indirect"` | — | Presentación de la acción de deslizamiento del lado final. | `trailingSwipeMode="indirect"` para mostrar Eliminar sin ejecutarlo al deslizar |
| `ref` | `Ref<SwipeListItemHandle>` | — | Control imperativo de esta fila. | `ref={itemRef}` con `useRef<SwipeListItemHandle>(null)`. |

**`SwipeListGroup`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `children={<SwipeListItem id="informe-q4"><List.Item title="Informe trimestral" /></SwipeListItem>}` |
| `ref` | `Ref<SwipeListGroupHandle>` | — | Control imperativo del grupo. | `ref={groupRef}` con `useRef<SwipeListGroupHandle>(null)`. |

| Referencia | Método | Uso | Ejemplo |
| --- | --- | --- | --- |
| `SwipeListItemHandle` | `open(side)` | Revela las acciones del lado `'leading'` o `'trailing'` si existen. | `itemRef.current?.open('trailing')` |
| `SwipeListItemHandle` | `close()` | Cierra las acciones abiertas con la transición de la fila. | `itemRef.current?.close()` |
| `SwipeListItemHandle` | `reset()` | Reinicia la posición y cancela el gesto o transición en curso. | `itemRef.current?.reset()` antes de reciclar una fila. |
| `SwipeListGroupHandle` | `closeAll()` | Cierra todas las filas coordinadas. | `onPress={() => groupRef.current?.closeAll()}` |

**`ListReorderGroup`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `itemHeight` · requerida | `number` | — | Altura fija en dp que deben respetar todas las filas renderizadas. | `itemHeight={64}` con todas las filas de 64 dp |
| `items` · requerida | `readonly T[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. | `items={documentos}` con id estable en cada elemento |
| `keyExtractor` · requerida | `(item: T) => string` | — | Devuelve la clave estable de cada elemento reordenable. | `keyExtractor={(item) => item.id}` |
| `onReorder` · requerida | `(items: T[]) => void` | — | Entrega el arreglo en el nuevo orden. | `onReorder={setDocumentos}` para guardar el nuevo orden |
| `renderItem` · requerida | `(info: ListReorderItemInfo<T>) => ReactNode` | — | Renderiza cada elemento con su información de reordenamiento. | `renderItem={({ item, dragged, renderHandle }) => <List.Item title={item.title} dragged={dragged} style={{ height: 64 }} trailing={renderHandle(<MaterialSymbol name="menu" />, "Mover " + item.title)} />}` |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. | `disabled={guardandoOrden}` para pausar el gesto mientras se persiste |
| `gap` | `number` | `2` | Espacio en dp entre filas reordenables. | `gap={4}` entre filas |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` en la pantalla |
| `testID` | `string` | `'mobile-list-reorder'` | Identificador para automatización en el host. | `testID="documentos-orden"` |

| Campo de `ListReorderItemInfo<T>` | Uso | Ejemplo dentro de `renderItem` |
| --- | --- | --- |
| `item` | Registro que representa la fila. | `title={item.title}` |
| `index` | Índice actual basado en cero. | `description={'Posición ' + (index + 1)}` |
| `dragged` | Indica si se está arrastrando esa fila. | `dragged={dragged}` en `List.Item`. |
| `renderHandle` | Coloca el gesto y las acciones accesibles en un asa. | `trailing={renderHandle(<MaterialSymbol name="menu" />, 'Mover ' + item.title)}` |

**`ListSlotProps`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `color` · requerida | `ColorValue` | — | Color del elemento o trazo. | `leading={({ color }) => <MaterialSymbol name="draft" color={color} />}` |
| `disabled` · requerida | `boolean` | — | Bloquea la interacción del control. | `trailing={({ disabled }) => <IconButton icon="edit" accessibilityLabel="Editar" disabled={disabled} onPress={editarInforme} />}` |
| `height` · requerida | `number` | — | Altura disponible en dp o unidades lógicas del host. | `leading={({ height }) => <View style={{ minHeight: height }} />}` para reservar una región de la altura de la fila. |
| `selected` · requerida | `boolean` | — | Selección persistente controlada por el consumidor. | `leading={({ selected }) => <MaterialSymbol name="bookmark" filled={selected} />}` |

**`SwipeListAction`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `icon` · requerida | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. | `icon: "delete"` |
| `key` · requerida | `string` | — | Identificador único y estable dentro del conjunto. | `key: "delete"` |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label: "Eliminar informe"` |
| `onPress` · requerida | `() => void` | — | Ejecuta la acción al activar el control. | `onPress: confirmarEliminar` |
| `destructive` | `boolean` | — | Aplica el tratamiento visual de acción destructiva. | `destructive: true` para distinguir una eliminación |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: !puedeEliminar` |
| `variant` | `"outlined" \| "standard" \| "filled" \| "tonal"` | — | Tratamiento visual o modalidad del componente. | `variant: "outlined"` para una acción secundaria |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { List, IconButton, Text } from 'mobile-design/react-native';

export default function Example() {
  const [feedback, setFeedback] = useState('');

  return (
    <View style={{ gap: 16 }}>
      <List.Item
        title="Informe trimestral"
        description="Documento compartido"
        lines={2}
        multiAction
        onPress={() => setFeedback('Detalle del documento')}
        trailing={
          <IconButton
            icon="bookmark-outline"
            accessibilityLabel="Guardar Informe trimestral"
            onPress={() => setFeedback('Guardado Informe trimestral')}
          />
        }
      />
      <Text accessibilityLiveRegion="polite">{feedback}</Text>
    </View>
  );
}
```


**Carpetas, acciones al deslizar y reordenamiento**

`List.Collection` agrupa el foco. `SwipeListGroup` coordina las filas abiertas. Mantén las filas reordenables con una altura fija y coloca el gesto sólo en el asa.

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { List, ListReorderGroup, MaterialSymbol, SwipeListGroup, SwipeListItem, Text } from 'mobile-design/react-native';

const inicial = [
  { id: 'q4', title: 'Informe trimestral' },
  { id: 'notes', title: 'Notas del equipo' },
];

export function DocumentosCompartidos() {
  const [open, setOpen] = useState(false);
  const [documentos, setDocumentos] = useState(inicial);
  const [estado, setEstado] = useState('');

  return (
    <View style={{ gap: 16 }}>
      <List.Collection>
        <List.Group variant="segmented" accessibilityLabel="Carpetas del equipo">
          <List.Accordion title="Informes" expanded={open} onPress={() => setOpen((valor) => !valor)}>
            <SwipeListGroup>
              {documentos.map((item) => (
                <SwipeListItem
                  key={item.id}
                  id={item.id}
                  leadingActions={[{
                    key: 'save',
                    icon: 'bookmark',
                    label: 'Guardar',
                    onPress: () => setEstado(`Guardado: ${item.title}`),
                  }]}
                  leadingSwipeMode="indirect"
                >
                  <List.Item
                    title={item.title}
                    leading={({ color }) => <List.Icon icon="draft" color={color} />}
                    onPress={() => setEstado(`Abierto: ${item.title}`)}
                  />
                </SwipeListItem>
              ))}
            </SwipeListGroup>
          </List.Accordion>
        </List.Group>
      </List.Collection>

      <List.Section>
        <List.Subheader>Orden de favoritos</List.Subheader>
        <ListReorderGroup
          items={documentos}
          keyExtractor={(item) => item.id}
          itemHeight={64}
          onReorder={setDocumentos}
          renderItem={({ item, dragged, renderHandle }) => (
            <List.Item
              title={item.title}
              dragged={dragged}
              style={{ height: 64 }}
              trailing={renderHandle(<MaterialSymbol name="menu" />, `Mover ${item.title}`)}
            />
          )}
        />
      </List.Section>
      <Text accessibilityLiveRegion="polite">{estado}</Text>
    </View>
  );
}
```

Para una fila con vista previa gráfica, pasa `leading={<List.Image source={miniatura} />}` a `List.Item`. El host proporciona la fuente de la imagen.

### Superficies y ayuda

#### Menu

Muestra acciones o alternativas en una superficie anclada, con grupos, selección y submenús cuando hacen falta.

- Controla visible y onDismiss y proporciona un anchor que abra el menú.
- Compón Menu.Item y grupos. OnClosed permite coordinar la siguiente superficie después de la salida.
- variant elige standard, vibrant o baseline. Standard y vibrant usan el menú vertical expresivo. Baseline conserva sus medidas propias. El ancho va de 112 a 280 dp y los ítems conservan un objetivo mínimo de 48 dp.
- Usa layout="grouped" y Menu.Group para separar acciones relacionadas. Los grupos usan hasta dos gaps donde están disponibles y divisores cuando el menú necesita scroll o esa presentación no admite gaps.
- Para opciones contextuales controla visible y usa anchor={ { x, y } }. Ofrece una activación accesible además de la pulsación mantenida o el clic derecho.

**Propiedades de `Menu`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `anchor` · requerida | `React.ReactNode \| { x: number; y: number; }` | — | Control o coordenadas que sirven como origen de la superficie. | `anchor={<Button onPress={() => setVisible(true)}>Opciones</Button>}` |
| `children` · requerida | `React.ReactNode` | — | Contenido que se compone dentro del componente. | `<Menu.Item title="Guardar" onPress={saveCollection} />` |
| `visible` · requerida | `boolean` | — | Controla si la superficie o el indicador se presenta. | `visible={visible}` |
| `anchorGap` | `number` | `0` | Separación entre el ancla y la superficie. | `anchorGap={8}` |
| `anchorPosition` | `"bottom" \| "top"` | `'bottom'` | Lado preferido respecto del ancla. | `anchorPosition="top"` |
| `anchorStyle` | `StyleProp<ViewStyle>` | — | Estilo del envoltorio del ancla. | `anchorStyle={{ alignSelf: 'flex-start' }}` |
| `contentStyle` | `StyleProp<ViewStyle>` | — | Estilo del contenido dentro de la superficie. | `contentStyle={{ paddingVertical: 8 }}` |
| `elevation` | `Elevation` | `2` | Nivel de elevación de la superficie. | `elevation={3}` |
| `emptyLabel` | `string` | `'No results'` | Texto mostrado cuando no hay opciones o resultados. | `emptyLabel="No hay opciones para esta búsqueda"` |
| `filterable` | `boolean` | `false` | Muestra un campo para filtrar opciones. | `filterable` |
| `filterAccessibilityLabel` | `string` | Hereda `filterPlaceholder` | Nombre accesible del campo de filtro. | `filterAccessibilityLabel="Filtrar acciones de la colección"` |
| `filterPlaceholder` | `string` | `'Filter options'` | Texto inicial del campo de filtro. | `filterPlaceholder="Buscar acción"` |
| `filterValue` | `string` | — | Consulta de filtrado controlada. | `filterValue={query}` |
| `layout` | `"standard" \| "grouped"` | `'standard'` | Distribución de las opciones dentro de la superficie. | `layout="grouped"` |
| `onClosed` | `(() => void)` | — | Avisa cuando concluye la salida de la superficie. | `onClosed={() => setQuery('')}` |
| `onDismiss` | `(() => void)` | — | Solicita cerrar la superficie. | `onDismiss={() => setVisible(false)}` |
| `onFilterChange` | `((value: string) => void)` | — | Recibe los cambios de la consulta del filtro. | `onFilterChange={setQuery}` |
| `onKeyboardDismiss` | `(() => void)` | — | Callback para coordinar el cierre del teclado. | `onKeyboardDismiss={() => setEditingFilter(false)}` |
| `onPointerInside` | `(() => void)` | — | Avisa cuando el puntero está dentro del menú. | `onPointerInside={() => setHoveringActions(true)}` |
| `onPositionChange` | `(bounds: { x: number; y: number; width: number; height: number }) => void` | — | Recibe la geometría final de la superficie visible. Se usa internamente para coordinar submenús. | `onPositionChange={({ width }) => setMenuWidth(width)}` |
| `overlayAccessibilityLabel` | `string` | `'Cerrar menú'` | Nombre que anuncia el lector de pantalla para la superficie exterior que cierra el menú. | `overlayAccessibilityLabel="Cerrar acciones de la colección"` |
| `placement` | `PopupPlacement` | — | Posición de apertura respecto del ancla. | `placement="below-end"` |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'center' }}` |
| `testID` | `string` | `'mobile-menu'` | Identificador para automatización en el host. | `testID="collection-actions"` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#2759AA' } }}` |
| `variant` | `"standard" \| "vibrant" \| "baseline"` | `'standard'` | Tratamiento visual o modalidad del componente. | `variant="vibrant"` |
| `width` | `number` | `280` | Ancho de la superficie. | `width={240}` |

<details>
<summary>Configuración complementaria de Menu</summary>

**`Menu.Item`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Guardar esta colección"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ selected: isSaved }}` |
| `badge` | `ReactNode` | — | Insignia que acompaña al elemento de menú. | `badge={<Badge>3</Badge>}` |
| `closeOnPress` | `boolean` | — | Cierra el menú después de activar la opción. | `closeOnPress={false}` |
| `content` | `ReactNode` | — | Contenido propio dentro de la fila. | `content={<Text>Guardar como borrador</Text>}` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={!canEdit}` |
| `leading` | `ReactNode` | — | Slot al inicio lógico del contenido. | `leading={<Icon source="folder-outline" size={20} />}` |
| `leadingIcon` | `IconSource` | — | Icono al inicio de la fila cuando no proporcionas el slot `leading`. | `leadingIcon="bookmark-outline"` |
| `onHoverIn` | `((event: MouseEvent) => unknown)` | — | Avisa al entrar el puntero en la superficie. | `onHoverIn={() => setHint('Guardar en tu biblioteca')}` |
| `onOpenSubmenu` | `(() => void)` | — | Abre el submenú asociado. | `onOpenSubmenu={() => setHint('Elige el destino')}` |
| `onPress` | `((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress={() => setSaved(true)}` |
| `position` | `"middle" \| "first" \| "last" \| "only"` | — | Posición lógica o compartida de la superficie. | `position="first"` |
| `ref` | `React.Ref<React.ComponentRef<typeof View>>` | — | Referencia imperativa al anfitrión de la fila. | [Referencia al elemento de menú](#referencia-al-elemento-de-menú) |
| `searchText` | `string` | — | Texto que se usa para filtrar opciones cuyo título o contenido es un elemento de React. | `searchText="guardar colección borrador"` |
| `selected` | `boolean` | — | Selección persistente controlada por el consumidor. | `selected={isSaved}` |
| `selectionIndicatorPosition` | `"leading" \| "trailing"` | — | Coloca la marca de selección al inicio o al final. Usa `trailing` para conservar el icono inicial. | `selectionIndicatorPosition="trailing"` |
| `selectionMode` | `"single" \| "multiple"` | — | Define si la selección es inexistente, única o múltiple. | `selectionMode="multiple"` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ minHeight: 56 }}` |
| `supportingText` | `string` | — | Ayuda que acompaña al valor cuando no hay error. | `supportingText="Disponible sin conexión"` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="collection-actions-save"` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#2759AA' } }}` |
| `title` | `ReactNode` | — | Título visible o contenido principal. | `title="Guardar"` |
| `titleStyle` | `StyleProp<TextStyle>` | — | Estilo del texto del título cuando el título es texto. | `titleStyle={{ fontWeight: '700' }}` |
| `titleMaxFontSizeMultiplier` | `number` | — | Límite de la escala del título cuando el título es texto. | `titleMaxFontSizeMultiplier={2}` |
| `trailing` | `ReactNode` | — | Slot al final lógico del contenido. | `trailing={<Icon source="chevron-right" size={20} />}` |
| `trailingIcon` | `IconSource` | — | Icono al final de la fila cuando no proporcionas el slot `trailing`. | `trailingIcon="chevron-right"` |
| `trailingText` | `string` | — | Texto auxiliar de la opción, como un atajo. | `trailingText="Ctrl+S"` |
| `contentStyle` | `StyleProp<ViewStyle>` | — | Estilo interno del elemento. | `contentStyle={{ gap: 12 }}` |

**`Menu.Group`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `<Menu.Item title="Archivar" onPress={archiveCollection} />` |
| `label` | `string` | — | Etiqueta visible que describe la acción u opción. | `label="Organización"` |

**`Menu.Submenu`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `<Menu.Item title="Favoritos" onPress={moveToFavorites} />` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Mover colección"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ selected: isSaved }}` |
| `badge` | `ReactNode` | — | Insignia que acompaña al elemento de menú. | `badge={<Badge>3</Badge>}` |
| `content` | `ReactNode` | — | Contenido propio dentro de la fila. | `content={<Text>Guardar como borrador</Text>}` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={!canEdit}` |
| `leading` | `ReactNode` | — | Slot al inicio lógico del contenido. | `leading={<Icon source="folder-outline" size={20} />}` |
| `leadingIcon` | `IconSource` | — | Icono al inicio de la fila que abre el submenú. | `leadingIcon="folder-outline"` |
| `onHoverIn` | `((event: MouseEvent) => unknown)` | — | Avisa al entrar el puntero en la superficie. | `onHoverIn={() => setHint('Guardar en tu biblioteca')}` |
| `onOpenSubmenu` | `(() => void)` | — | Abre el submenú asociado. | `onOpenSubmenu={() => setHint('Elige el destino')}` |
| `onPress` | `((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress={() => setSaved(true)}` |
| `position` | `"middle" \| "first" \| "last" \| "only"` | — | Posición lógica o compartida de la superficie. | `position="first"` |
| `ref` | `React.Ref<React.ComponentRef<typeof View>>` | — | La firma lo hereda de `MenuItemProps`. El submenú usa una referencia interna para devolver el foco a su disparador. | Para obtener una referencia propia, usa [`Menu.Item` con `ref`](#referencia-al-elemento-de-menú). |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` |
| `searchText` | `string` | — | Texto que se usa para filtrar opciones cuyo título o contenido es un elemento de React. | `searchText="guardar colección borrador"` |
| `selected` | `boolean` | — | Selección persistente controlada por el consumidor. | `selected={isSaved}` |
| `selectionIndicatorPosition` | `"leading" \| "trailing"` | — | Coloca la marca de selección al inicio o al final. Usa `trailing` para conservar el icono inicial. | `selectionIndicatorPosition="trailing"` |
| `selectionMode` | `"single" \| "multiple"` | — | Define si la selección es inexistente, única o múltiple. | `selectionMode="multiple"` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'center' }}` |
| `submenuAccessibilityLabel` | `string` | — | Nombre accesible del acceso al submenú. | `submenuAccessibilityLabel="Opciones de destino"` |
| `supportingText` | `string` | — | Ayuda que acompaña al valor cuando no hay error. | `supportingText="Disponible sin conexión"` |
| `testID` | `string` | `'mobile-submenu'` | Identificador para automatización en el host. | `testID="collection-actions-destinations"` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#2759AA' } }}` |
| `title` | `ReactNode` | — | Título visible o contenido principal. | `title="Mover a"` |
| `trailing` | `ReactNode` | — | Slot al final lógico del contenido. | `trailing={<Icon source="chevron-right" size={20} />}` |
| `trailingText` | `string` | — | Texto auxiliar de la opción, como un atajo. | `trailingText="Ctrl+S"` |
| `width` | `number` | `280` | Ancho de la superficie. | `width={216}` |
| `titleStyle` | `StyleProp<TextStyle>` | — | Estilo del título de la fila que abre el submenú. | `titleStyle={{ fontWeight: "700" }}` |
| `contentStyle` | `StyleProp<ViewStyle>` | — | Estilo interno de la fila. | `contentStyle={{ gap: 12 }}` |
| `titleMaxFontSizeMultiplier` | `number` | — | Límite de escalado del título. | `titleMaxFontSizeMultiplier={1.8}` |

**`MenuItemProps`**

Usa este tipo al crear un envoltorio de `Menu.Item`. Para la variante clásica, aplica `variant="baseline"` al `Menu` que contiene los ítems.

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `badge` | `ReactNode` | — | Insignia que acompaña al elemento de menú. | `badge={<Badge>3</Badge>}` |
| `closeOnPress` | `boolean` | — | Cierra el menú después de activar la opción. | `closeOnPress={false}` |
| `content` | `ReactNode` | — | Contenido propio dentro de la fila. | `content={<Text>Guardar como borrador</Text>}` |
| `leading` | `ReactNode` | — | Slot al inicio lógico del contenido. | `leading={<Icon source="folder-outline" size={20} />}` |
| `onHoverIn` | `((event: MouseEvent) => unknown)` | — | Avisa al entrar el puntero en la superficie. | `onHoverIn={() => setHint('Guardar en tu biblioteca')}` |
| `onOpenSubmenu` | `(() => void)` | — | Abre el submenú asociado. | `onOpenSubmenu={() => setHint('Elige el destino')}` |
| `position` | `"middle" \| "first" \| "last" \| "only"` | — | Posición lógica o compartida de la superficie. | `position="only"` |
| `ref` | `React.Ref<React.ComponentRef<typeof View>>` | — | Referencia imperativa al anfitrión de la fila. | [Referencia al elemento de menú](#referencia-al-elemento-de-menú) |
| `searchText` | `string` | — | Texto que se usa para filtrar opciones cuyo título o contenido es un elemento de React. | `searchText="guardar colección borrador"` |
| `selected` | `boolean` | — | Selección persistente controlada por el consumidor. | `selected={isSaved}` |
| `selectionMode` | `"single" \| "multiple"` | — | Define si la selección es inexistente, única o múltiple. | `selectionMode="single"` |
| `supportingText` | `string` | — | Ayuda que acompaña al valor cuando no hay error. | `supportingText="Disponible sin conexión"` |
| `title` | `ReactNode` | — | Título visible o contenido principal. | `title="Guardar"` |
| `trailing` | `ReactNode` | — | Slot al final lógico del contenido. | `trailing={<Icon source="chevron-right" size={20} />}` |
| `trailingText` | `string` | — | Texto auxiliar de la opción, como un atajo. | `trailingText="Ctrl+S"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Guardar esta colección"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ selected: isSaved }}` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={!canEdit}` |
| `onPress` | `((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress={() => setSaved(true)}` |

**`MenuSubmenuProps`**

Usa este tipo al crear un envoltorio de `Menu.Submenu`. El submenú adopta la variante de su menú padre.

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `<Menu.Item title="Favoritos" onPress={moveToFavorites} />` |
| `badge` | `ReactNode` | — | Insignia que acompaña al elemento de menú. | `badge={<Badge>3</Badge>}` |
| `content` | `ReactNode` | — | Contenido propio dentro de la fila. | `content={<Text>Guardar como borrador</Text>}` |
| `leading` | `ReactNode` | — | Slot al inicio lógico del contenido. | `leading={<Icon source="folder-outline" size={20} />}` |
| `onHoverIn` | `((event: MouseEvent) => unknown)` | — | Avisa al entrar el puntero en la superficie. | `onHoverIn={() => setHint('Guardar en tu biblioteca')}` |
| `onOpenSubmenu` | `(() => void)` | — | Abre el submenú asociado. | `onOpenSubmenu={() => setHint('Elige el destino')}` |
| `position` | `"middle" \| "first" \| "last" \| "only"` | — | Posición lógica o compartida de la superficie. | `position="first"` |
| `ref` | `React.Ref<React.ComponentRef<typeof View>>` | — | La firma lo hereda de `MenuItemProps`. El submenú usa una referencia interna para devolver el foco a su disparador. | Para obtener una referencia propia, usa [`Menu.Item` con `ref`](#referencia-al-elemento-de-menú). |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` |
| `searchText` | `string` | — | Texto que se usa para filtrar opciones cuyo título o contenido es un elemento de React. | `searchText="guardar colección borrador"` |
| `selected` | `boolean` | — | Selección persistente controlada por el consumidor. | `selected={isSaved}` |
| `selectionMode` | `"single" \| "multiple"` | — | Define si la selección es inexistente, única o múltiple. | `selectionMode="multiple"` |
| `submenuAccessibilityLabel` | `string` | — | Nombre accesible del acceso al submenú. | `submenuAccessibilityLabel="Opciones de destino"` |
| `supportingText` | `string` | — | Ayuda que acompaña al valor cuando no hay error. | `supportingText="Disponible sin conexión"` |
| `title` | `ReactNode` | — | Título visible o contenido principal. | `title="Mover a"` |
| `trailing` | `ReactNode` | — | Slot al final lógico del contenido. | `trailing={<Icon source="chevron-right" size={20} />}` |
| `trailingText` | `string` | — | Texto auxiliar de la opción, como un atajo. | `trailingText="Ctrl+S"` |
| `width` | `number` | — | Ancho de la superficie. | `width={240}` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Mover colección"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ selected: isSaved }}` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={!canEdit}` |
| `onPress` | `((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. | `onPress={() => setSaved(true)}` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { Menu, Button, Text } from 'mobile-design/react-native';

export default function Example() {
  const [feedback, setFeedback] = useState('');
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ gap: 16 }}>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button
            variant="tonal"
            onPress={() => setVisible(true)}
          >
            Opciones
          </Button>
        }
      >
        <Menu.Item
          title="Guardar"
          leadingIcon="bookmark-outline"
          onPress={() => setFeedback('Guardado')}
        />
        <Menu.Item
          title="Enviar"
          leadingIcon="send-outline"
          onPress={() => setFeedback('Enviar')}
        />
      </Menu>
      <Text accessibilityLiveRegion="polite">{feedback}</Text>
    </View>
  );
}
```

##### Menú agrupado con filtro y submenú

En este ejemplo el filtro encuentra «Sin conexión» aunque el título sea un elemento de React. La fila conserva el icono inicial y muestra la selección al final. El submenú elige un destino y cierra el menú principal al confirmar.

```tsx
import { useState } from 'react';
import { Button, Menu, Text, type MenuItemProps, type MenuSubmenuProps } from 'mobile-design/react-native';

function Destination({ children, ...props }: MenuSubmenuProps) {
  return <Menu.Submenu {...props}>{children}</Menu.Submenu>;
}

export default function GroupedMenuExample() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [offline, setOffline] = useState(false);
  const [destination, setDestination] = useState('Biblioteca');

  const offlineOption: MenuItemProps = {
    title: <Text>Sin conexión</Text>,
    searchText: 'sin conexión descarga',
    leadingIcon: 'arrow_downward',
    selectionMode: 'multiple',
    selectionIndicatorPosition: 'trailing',
    selected: offline,
    onPress: () => setOffline((value) => !value),
  };

  return (
    <Menu
      anchor={<Button onPress={() => setVisible(true)}>Destino actual · {destination}</Button>}
      visible={visible}
      onDismiss={() => setVisible(false)}
      onClosed={() => setQuery('')}
      layout="grouped"
      variant="vibrant"
      filterable
      filterPlaceholder="Buscar acción"
      filterValue={query}
      onFilterChange={setQuery}
      emptyLabel="Sin resultados"
    >
      <Menu.Group label="Disponibilidad">
        <Menu.Item {...offlineOption} />
      </Menu.Group>
      <Menu.Group label="Organización">
        <Destination title="Mover a" submenuAccessibilityLabel="Cerrar destinos" width={216}>
          <Menu.Item
            title="Favoritos"
            onPress={() => {
              setDestination('Favoritos');
              setVisible(false);
            }}
          />
        </Destination>
      </Menu.Group>
    </Menu>
  );
}
```

##### Referencia al elemento de menú

En este ejemplo una referencia permite medir la fila cuando el usuario la activa. Con `variant="baseline"` las filas adoptan el tratamiento clásico. El ancho y el comportamiento siguen bajo control de `Menu`.

```tsx
import { useRef, useState, type ComponentRef } from 'react';
import { View } from 'react-native';
import { Button, Menu, Text } from 'mobile-design/react-native';

export default function MenuItemRefExample() {
  const rowRef = useRef<ComponentRef<typeof View>>(null);
  const [visible, setVisible] = useState(false);
  const [rowWidth, setRowWidth] = useState(0);

  return (
    <>
      <Menu
        anchor={<Button onPress={() => setVisible(true)}>Opciones clásicas</Button>}
        variant="baseline"
        visible={visible}
        onDismiss={() => setVisible(false)}
      >
        <Menu.Item
          title="Medir esta opción"
          ref={rowRef}
          closeOnPress={false}
          onPress={() => rowRef.current?.measure((_x, _y, width) => setRowWidth(width))}
        />
      </Menu>
      <Text accessibilityLiveRegion="polite">Ancho de la opción: {Math.round(rowWidth)} dp</Text>
    </>
  );
}
```

#### Dialog y FullScreenDialog

Presenta información o una tarea que necesita atención antes de volver al contenido anterior.

- Controla visible y onDismiss. Compón Title, Content y Actions dentro de Dialog.
- Usa FullScreenDialog para una tarea extensa y separa guardar de descartar.

Compón `Dialog.Title`, `Dialog.Icon`, `Dialog.Content`, `Dialog.ScrollArea` y `Dialog.Actions` según la tarea. `Dialog` ya controla su portal. Para medir un origen compartido para la animación de entrada, pasa `transitionOrigin` en las coordenadas de ventana que espera la superficie.

`Dialog.FullScreen` es la misma implementación que la exportación directa `FullScreenDialog`. El ejemplo de transición usa la exportación directa y admite los mismos argumentos.

**Propiedades de `Dialog`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `React.ReactNode` | — | Contenido que se compone dentro del componente. | `<Dialog.Title>¿Eliminar descarga?</Dialog.Title>` |
| `visible` · requerida | `boolean` | — | Controla si la superficie o el indicador se presenta. | `visible={visible}` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Confirmar eliminación de descarga"` |
| `dismissable` | `boolean` | `true` | Permite cerrar el diálogo al tocar fuera de la superficie. | `dismissable={false}` |
| `dismissableBackButton` | `boolean` | Hereda `dismissable` | Permite cerrar el diálogo con la acción Atrás de Android. | `dismissableBackButton={false}` |
| `onClosed` | `(() => void)` | — | Avisa cuando concluye la salida de la superficie. | `onClosed={() => setSelectedDownload(null)}` |
| `onDismiss` | `(() => void)` | — | Solicita cerrar la superficie. | `onDismiss={() => setVisible(false)}` |
| `position` | `{ horizontal?: "start" \| "center" \| "end"; vertical?: "top" \| "center" \| "bottom"; }` | — | Posición lógica o compartida de la superficie. | `position={{ horizontal: 'center', vertical: 'top' }}` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ maxWidth: 420, alignSelf: 'center' }}` |
| `testID` | `string` | `'mobile-dialog'` | Identificador para automatización en el host. | `testID="delete-download-dialog"` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#2759AA' } }}` |
| `transitionOrigin` | `ContainerTransformOrigin` | — | Origen medido para la transición de la superficie. | [Transición desde una tarjeta](#transición-desde-una-tarjeta) |

<details>
<summary>Configuración complementaria de Dialog y FullScreenDialog</summary>

**`FullScreenDialog`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `<TextField label="Nombre" value={draft} onChangeText={setDraft} />` |
| `onDismiss` · requerida | `() => void` | — | Solicita cerrar la superficie. | `onDismiss={() => setVisible(false)}` |
| `title` · requerida | `string` | — | Título visible o contenido principal. | `title="Editar colección"` |
| `visible` · requerida | `boolean` | — | Controla si la superficie o el indicador se presenta. | `visible={visible}` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Editar nombre de la colección"` |
| `backgroundContent` | `ReactNode` | — | Contenido decorativo situado detrás de la cabecera y el contenido del diálogo. | `backgroundContent={<View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#F0F4FF' }]} />}` |
| `closeAccessibilityLabel` | `string` | `'Cerrar diálogo'` | Nombre accesible del cierre. | `closeAccessibilityLabel="Cerrar editor de colección"` |
| `confirmDisabled` | `boolean` | `false` | Bloquea la acción de confirmación del encabezado. | `confirmDisabled={!draft.trim()}` |
| `confirmLabel` | `string` | `'Guardar'` | Etiqueta de la acción para confirmar. | `confirmLabel="Guardar cambios"` |
| `dismissible` | `boolean` | `true` | Permite descartar la superficie con sus gestos y acciones de cierre. | `dismissible={!saving}` |
| `onClosed` | `(() => void)` | — | Avisa cuando concluye la salida de la superficie. | `onClosed={() => setDraft('')}` |
| `onConfirm` | `(() => void)` | — | Entrega el borrador validado al confirmar. | `onConfirm={() => setName(draft.trim())}` |
| `scrollable` | `boolean` | `true` | Habilita el desplazamiento de la fila o superficie. | `scrollable={false}` |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` |
| `testID` | `string` | `'mobile-full-screen-dialog'` | Identificador para automatización en el host. | `testID="edit-collection-dialog"` |
| `transitionOrigin` | `ContainerTransformOrigin` | — | Origen medido para la transición de la superficie. | [Transición desde una tarjeta](#transición-desde-una-tarjeta) |

**`ContainerTransformOrigin`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `height` · requerida | `number` | — | Altura disponible en dp o unidades lógicas del host. | `height: 56` |
| `width` · requerida | `number` | — | Ancho de la superficie. | `width: 160` |
| `x` · requerida | `number` | — | Coordenada horizontal del origen medida en la ventana. | `x: 24` |
| `y` · requerida | `number` | — | Coordenada vertical del origen medida en la ventana. | `y: 96` |
| `backgroundColor` | `ColorValue` | — | Color de la superficie bajo el campo o contenedor. | `backgroundColor: '#F0F4FF'` |
| `borderRadius` | `number` | — | Radio inicial de las esquinas en la transición. | `borderRadius: 16` |
| `content` | `ReactNode` | — | Contenido propio dentro de la fila. | `content: <Text>Editar colección</Text>` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Dialog, Text } from 'mobile-design/react-native';

export default function Example() {
  const [feedback, setFeedback] = useState('');
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ gap: 16 }}>
      <>
        <Button onPress={() => setVisible(true)}>Eliminar descarga</Button>
        <Dialog
          visible={visible}
          onDismiss={() => setVisible(false)}
        >
          <Dialog.Title>¿Eliminar descarga?</Dialog.Title>
          <Dialog.Content>
            <Text>Podrás descargarla de nuevo cuando quieras.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              variant="text"
              onPress={() => setVisible(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="text"
              onPress={() => {
                setVisible(false);
                setFeedback('Descarga eliminada');
              }}
            >
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </>
      <Text accessibilityLiveRegion="polite">{feedback}</Text>
    </View>
  );
}
```

##### Transición desde una tarjeta

`Dialog.FullScreen` y `FullScreenDialog` son dos accesos al mismo componente. En esta composición, mide el anfitrión de la tarjeta con `measureInWindow`, guarda el rectángulo antes de abrir y limpia el borrador y el origen al concluir el cierre. `content` del origen acepta una vista decorativa. Mantén el control interactivo en la pantalla que inicia la transición.

```tsx
import { useRef, useState, type ComponentRef } from 'react';
import { View } from 'react-native';
import {
  Button,
  FullScreenDialog,
  Text,
  TextField,
  type ContainerTransformOrigin,
} from 'mobile-design/react-native';

export default function FullScreenDialogExample() {
  const source = useRef<ComponentRef<typeof View>>(null);
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('Documentos de viaje');
  const [draft, setDraft] = useState('');
  const [origin, setOrigin] = useState<ContainerTransformOrigin>();

  const openEditor = () => {
    setDraft(name);
    if (!source.current) {
      setVisible(true);
      return;
    }
    source.current.measureInWindow((x, y, width, height) => {
      setOrigin({
        x,
        y,
        width,
        height,
        borderRadius: 16,
        backgroundColor: '#F0F4FF',
        content: <Text>Editar colección</Text>,
      });
      setVisible(true);
    });
  };

  return (
    <>
      <View
        ref={source}
        collapsable={false}
        style={{ alignSelf: 'flex-start', backgroundColor: '#F0F4FF', borderRadius: 16, padding: 8 }}
      >
        <Button onPress={openEditor}>Editar colección</Button>
      </View>
      <Text>{name}</Text>
      <FullScreenDialog
        visible={visible}
        title="Editar colección"
        closeAccessibilityLabel="Cerrar editor de colección"
        confirmLabel="Guardar cambios"
        confirmDisabled={!draft.trim()}
        transitionOrigin={origin}
        onDismiss={() => setVisible(false)}
        onClosed={() => {
          setDraft('');
          setOrigin(undefined);
        }}
        onConfirm={() => {
          setName(draft.trim());
          setVisible(false);
        }}
        scrollIndicators={{ vertical: true }}
      >
        <View style={{ padding: 24 }}>
          <TextField label="Nombre" variant="outlined" value={draft} onChangeText={setDraft} />
        </View>
      </FullScreenDialog>
    </>
  );
}
```

##### Diálogo con icono y área desplazable

`Dialog.Icon` recibe `icon`, `size`, `color` y `style`. Es decorativo. `Dialog.Title` acepta las props de `Text` y se renderiza como `headlineSmall`. `Dialog.Content`, `Dialog.ScrollArea` y `Dialog.Actions` aceptan hijos y las props de `View` para posicionar y estilizar su región. Monta el `ScrollView` dentro de `Dialog.ScrollArea` para mantener el título y las acciones fuera del desplazamiento.

```tsx
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Dialog, Text } from 'mobile-design/react-native';

const documents = Array.from({ length: 16 }, (_, index) => `Documento ${index + 1}`);

export default function DialogScrollAreaExample() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onPress={() => setVisible(true)}>Consultar documentos</Button>
      <Dialog visible={visible} onDismiss={() => setVisible(false)}>
        <Dialog.Icon icon="lightbulb" size={24} color="#2759AA" style={{ marginTop: 8 }} />
        <Dialog.Title numberOfLines={2}>Documentos de la colección</Dialog.Title>
        <Dialog.Content style={{ paddingBottom: 12 }}>
          <Text>Desplázate para consultar todos los nombres.</Text>
        </Dialog.Content>
        <Dialog.ScrollArea style={{ maxHeight: 220 }}>
          <ScrollView contentContainerStyle={{ gap: 12, paddingVertical: 12 }}>
            {documents.map((name) => <Text key={name}>{name}</Text>)}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={{ marginTop: 8 }}>
          <Button variant="text" onPress={() => setVisible(false)}>Listo</Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}
```

#### BottomSheet

Presenta tareas o información de apoyo con una hoja estándar o modal y posiciones de expansión.

- BottomSheet compone una superficie estándar o modal con el motor coordinado de gestos y scroll. Controla open/onOpenChange. OnClosed avisa después de retirar la superficie, incluso al cerrar durante una animación.
- La estándar comparte la región con el contenido principal y no añade scrim ni bloqueo de foco. La modal bloquea el fondo, tiene nombre de diálogo y scrim al 32%.
- Usa GestureHandlerRootView en la raíz de la aplicación. Dentro de la hoja usa BottomSheetScrollView, BottomSheetFlatList o BottomSheetSectionList y BottomSheetTextField para coordinar edición, teclado y gestos.

Monta `GestureHandlerRootView` como se muestra en el ejemplo de instalación. Si controlas `index`, numera las posiciones desde cero y actualiza el índice con `onIndexChange`. Para cerrar, actualiza `open` a `false`. Usa `BottomSheetTextField` o `BottomSheetTextInput` al editar dentro de la hoja. Mantén los hijos durante la salida si su contenido debe permanecer visible hasta `onClosed`.

**Propiedades de `BottomSheet`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `onOpenChange` · requerida | `(open: boolean) => void` | — | Solicita abrir o cerrar. Actualiza `open` en la pantalla. | `onOpenChange={setOpen}` |
| `open` · requerida | `boolean` | — | Controla si la superficie está abierta. | `open={open}` |
| `accessibilityLabel` | `string` | `'Hoja inferior'` | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Detalles de la colección"` |
| `backgroundContent` | `ReactNode \| ((props: BottomSheetBackgroundProps & { containerHeight: number; }) => ReactNode)` | — | Contenido decorativo recortado detrás del tirador y el contenido desplazable de la hoja. | `backgroundContent={<View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#F0F4FF' }]} />}` |
| `children` | `ReactNode` | — | Contenido que se compone dentro del componente. | `<BottomSheetScrollView><Text>Detalles</Text></BottomSheetScrollView>` |
| `contentPanning` | `boolean` | `true` | Permite que el gesto sobre el contenido mueva la hoja. | `contentPanning={false}` |
| `dismissible` | `boolean` | `true` | Permite descartar la superficie con sus gestos y acciones de cierre. | `dismissible={!saving}` |
| `draggable` | `boolean` | `true` | Habilita la manipulación por arrastre. | `draggable={false}` |
| `index` | `number` | `0` | Índice inicial o controlado de la posición entre `snapPoints` según la composición. | `index={snapIndex}` |
| `keyboardBehavior` | `"interactive" \| "extend" \| "fillParent"` | `'interactive'` | Configura el ajuste de la hoja cuando aparece el teclado. | `keyboardBehavior="extend"` |
| `maxWidth` | `number` | `640` | Ancho máximo de la superficie. | `maxWidth={560}` |
| `minimized` | `boolean` | `false` | Solicita la presentación minimizada. | `minimized={minimized}` |
| `onClosed` | `(() => void)` | — | Avisa cuando concluye la salida de la superficie. | `onClosed={() => setSelectedCollection(null)}` |
| `onIndexChange` | `((index: number) => void)` | — | Avisa del cambio de índice aceptado. | `onIndexChange={setSnapIndex}` |
| `scrollable` | `boolean` | `false` | Habilita el desplazamiento de la fila o superficie. | `scrollable` |
| `showDragHandle` | `boolean` | `true` | Muestra el control de arrastre y cambio de altura. | `showDragHandle={false}` |
| `snapPoints` | `(string \| number)[]` | — | Posiciones de reposo de la hoja. Admite puntos en dp o porcentajes según el tipo. | `snapPoints={['50%', '85%']}` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 12 }}` |
| `testID` | `string` | `'mobile-bottom-sheet'` | Identificador para automatización en el host. | `testID="collection-details-sheet"` |
| `topInset` | `number` | — | Espacio reservado en el borde superior de la ventana. | `topInset={insets.top + 16}` |
| `variant` | `"standard" \| "modal"` | `'modal'` | `standard` comparte el layout y `modal` presenta una hoja superpuesta. | `variant="modal"` |

<details>
<summary>Configuración complementaria de BottomSheet</summary>

**`BottomSheetScrollView`**

Recibe las props del área desplazable de Gorhom. `BottomSheetFlatList` utiliza el contrato de `FlatList` y `BottomSheetSectionList` el de `SectionList`. En los tres casos los indicadores están ocultos inicialmente y se activan con `showsVerticalScrollIndicator` o `showsHorizontalScrollIndicator`.

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `<Text variant="headlineSmall">Detalles de la colección</Text>` |
| `contentContainerStyle` | `StyleProp<AnimatedStyle<____ViewStyleProp_Internal \| undefined>>` | — | Estilo del contenedor que agrupa los hijos del área desplazable. Úsalo para añadir relleno alrededor del contenido. | `contentContainerStyle={{ gap: 12, padding: 24 }}` |
| `horizontal` | `boolean \| SharedValueDisableContravariance<boolean \| undefined>` | — | Distribuye los hijos en una fila horizontal. | `horizontal` |
| `showsHorizontalScrollIndicator` | `boolean` | `false` | Muestra el indicador de la hoja horizontal. | `horizontal showsHorizontalScrollIndicator` |
| `showsVerticalScrollIndicator` | `boolean` | `false` | Muestra el indicador cuando el contenido se desplaza verticalmente. | `showsVerticalScrollIndicator` |

**`BottomSheetTextFieldProps`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `onChangeText` · requerida | `(value: string) => void` | — | Comunica el nuevo texto para actualizar el valor controlado. | `onChangeText={setTitle}` |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. | `value={title}` |
| `autoGrow` | `boolean` | — | Ajusta la altura al contenido de un campo multilínea. Usa `false` para fijar la altura. | `autoGrow={false}` |
| `backgroundColor` | `ColorValue` | — | Color de la superficie bajo el campo o contenedor. | `backgroundColor="#F0F4FF"` |
| `containerStyle` | `StyleProp<ViewStyle>` | — | Estilo adicional del contenedor del campo. | `containerStyle={{ marginBottom: 16 }}` |
| `counter` | `number \| boolean` | — | Muestra la longitud del texto. Usa `maxLength` para limitar la entrada. | `counter={60}` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled={!canEdit}` |
| `error` | `boolean` | — | Activa el tratamiento visual y accesible de error. | `error={submitted && !title.trim()}` |
| `errorText` | `string` | — | Mensaje mostrado en el estado de error. | `errorText="Escribe un nombre para la colección"` |
| `focused` | `boolean` | — | Controla la apariencia de foco cuando un control compuesto administra el estado visual del campo. Usa su referencia para mover el foco de entrada. | `focused={editorFocused}` |
| `inputStyle` | `StyleProp<TextStyle>` | — | Estilo que recibe la entrada de texto interna. | `inputStyle={{ textAlign: 'right' }}` |
| `label` | `string` | — | Etiqueta visible que describe la acción u opción. | `label="Nombre de la colección"` |
| `maxLength` | `number` | — | Límite de entrada heredado de `TextInput`. Configúralo junto a `counter` para mostrar y aplicar el mismo máximo. | `maxLength={60} counter={60}` |
| `leading` | `React.ReactNode` | — | Slot al inicio lógico del contenido. | `leading={<Icon source="folder-outline" size={20} />}` |
| `leadingIcon` | `IconSource` | — | Icono al inicio del control. | `leadingIcon="magnify"` |
| `leadingIconAccessibilityLabel` | `string` | — | Nombre accesible para la acción del icono inicial. | `leadingIconAccessibilityLabel="Buscar colecciones"` |
| `onLeadingIconPress` | `(() => void)` | — | Callback del icono inicial cuando es una acción independiente. | `onLeadingIconPress={() => setSearchOpen(true)}` |
| `onTrailingIconPress` | `(() => void)` | — | Callback del icono final cuando es una acción independiente. | `onTrailingIconPress={() => setTitle('')}` |
| `prefix` | `string` | — | Afijo anterior al valor. | `prefix="$"` |
| `prefixAccessibilityLabel` | `string` | — | Cómo se anuncia el prefijo. | `prefixAccessibilityLabel="Dólares"` |
| `readOnly` | `boolean` | — | Permite mostrar o consultar el valor con la edición bloqueada. | `readOnly={!canEdit}` |
| `suffix` | `string` | — | Afijo posterior al valor. | `suffix="kg"` |
| `suffixAccessibilityLabel` | `string` | — | Cómo se anuncia el sufijo. | `suffixAccessibilityLabel="Kilogramos"` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo adicional de la superficie del campo. | `style={{ minHeight: 56 }}` |
| `supportingText` | `React.ReactNode` | — | Ayuda que acompaña al valor cuando no hay error. | `supportingText="Usa un nombre corto para identificarla"` |
| `trailing` | `React.ReactNode` | — | Slot al final lógico del contenido. | `trailing={<Text>Opcional</Text>}` |
| `trailingIcon` | `IconSource` | — | Icono al final del control. | `trailingIcon="close"` |
| `trailingIconAccessibilityLabel` | `string` | — | Nombre accesible para la acción del icono final. | `trailingIconAccessibilityLabel="Borrar texto"` |
| `testID` | `string` | — | Identificador del campo para automatización. | `testID="new-collection-name"` |
| `variant` | `"outlined" \| "filled"` | — | Tratamiento visual o modalidad del componente. | `variant="outlined"` |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Escribe un nombre de hasta sesenta caracteres"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Nombre editable de la colección"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ disabled: !canEdit }}` |
| `children` | `React.ReactNode` | — | Prop heredada de la entrada de texto anfitriona. Compón la etiqueta, ayudas y acciones con las props específicas del campo. | Consulta [Edición dentro de la hoja](#edición-dentro-de-la-hoja) para usar el campo junto a otros hijos de la hoja. |
| `onChange` | `((e: TextInputChangeEvent) => unknown)` | — | Comunica el valor confirmado o el evento de entrada, según el componente. | `onChange={(event) => setNativeText(event.nativeEvent.text)}` |
| `onPress` | `((event: GestureResponderEvent) => unknown)` | — | Ejecuta la acción al activar el control. | `onPress={() => setEditingTitle(true)}` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import {
  BottomSheet,
  BottomSheetScrollView,
  Text,
  Button,
} from 'mobile-design/react-native';

export default function Example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setOpen(true)}>Ver detalles</Button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        variant="modal"
        scrollable
        snapPoints={['50%', '85%']}
        accessibilityLabel="Detalles de la colección"
      >
        <BottomSheetScrollView contentContainerStyle={{ padding: 24 }}>
          <Text variant="headlineSmall">Tu colección</Text>
          <Text>Información adicional de la colección guardada.</Text>
          <Button
            variant="text"
            onPress={() => setOpen(false)}
          >
            Cerrar
          </Button>
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  );
}
```

##### Edición dentro de la hoja

`BottomSheetTextField` combina la interfaz de `TextField` con una entrada que informa a la hoja sobre el foco. `BottomSheetTextInput` expone la entrada coordinada para construir un campo propio. Usa una etiqueta accesible en ambas y ajusta `keyboardBehavior` en la hoja.

```tsx
import { useState } from 'react';
import {
  BottomSheet,
  BottomSheetScrollView,
  BottomSheetTextField,
  BottomSheetTextInput,
  Button,
  Text,
} from 'mobile-design/react-native';

export default function BottomSheetEditorExample() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <>
      <Button onPress={() => setOpen(true)}>Nueva colección</Button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        scrollable
        keyboardBehavior="extend"
        snapPoints={['55%', '85%']}
        accessibilityLabel="Nueva colección"
      >
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 16, padding: 24 }}
        >
          <BottomSheetTextField
            label="Nombre"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
            counter={60}
            supportingText="Usa un nombre corto para identificarla"
            trailingIcon="close"
            trailingIconAccessibilityLabel="Borrar nombre"
            onTrailingIconPress={() => setTitle('')}
          />
          <Text>Nota interna</Text>
          <BottomSheetTextInput
            accessibilityLabel="Nota interna"
            value={notes}
            onChangeText={setNotes}
            placeholder="Añade una nota"
            multiline
          />
          <Button disabled={!title.trim()} onPress={() => setOpen(false)}>Listo</Button>
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  );
}
```

##### Listas virtualizadas dentro de la hoja

Cada presentación monta una sola lista que recibe el desplazamiento vertical. `BottomSheetFlatList` recibe los elementos en `data` y `BottomSheetSectionList` los agrupa con `sections` y `renderSectionHeader`.

```tsx
import { useState } from 'react';
import { BottomSheet, BottomSheetFlatList, BottomSheetSectionList, Button, Text } from 'mobile-design/react-native';

const documents = [
  { id: 'route', name: 'Ruta' },
  { id: 'tickets', name: 'Billetes' },
];
const sections = [{ title: 'Viaje', data: documents }];

export default function BottomSheetListsExample() {
  const [open, setOpen] = useState(false);
  const [grouped, setGrouped] = useState(false);

  return (
    <>
      <Button onPress={() => { setGrouped(false); setOpen(true); }}>Ver documentos</Button>
      <Button onPress={() => { setGrouped(true); setOpen(true); }}>Ver por sección</Button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        scrollable
        snapPoints={['60%']}
        accessibilityLabel="Documentos guardados"
      >
        {grouped ? (
          <BottomSheetSectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section }) => <Text variant="titleMedium">{section.title}</Text>}
            renderItem={({ item }) => <Text>{item.name}</Text>}
            contentContainerStyle={{ padding: 24 }}
          />
        ) : (
          <BottomSheetFlatList
            data={documents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <Text>{item.name}</Text>}
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator
          />
        )}
      </BottomSheet>
    </>
  );
}
```

#### SideSheet

Muestra una tarea complementaria desde un borde lateral, como parte del layout o en una superficie modal.

- Controla open/onOpenChange. La estándar ocupa una región junto al contenido. La modal bloquea el fondo hasta cerrarse.
- Usa el ancho disponible de tu región para cambiar entre modal compacta y estándar en una región amplia. Mantén valores editados y selecciones por encima de ambas presentaciones.
- El título aporta el nombre accesible por defecto. AccessibilityLabel permite un nombre específico. Un header personalizado conserva sus propias acciones de salida.

En pantallas estrechas abre la hoja modal. En una región amplia puedes montar la estándar como parte del layout. Mantén la selección o los cambios del formulario en el padre para conservarlos al cambiar de presentación.

**Propiedades de `SideSheet`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `onOpenChange` · requerida | `(open: boolean) => void` | — | Solicita abrir o cerrar. Actualiza `open` en la pantalla. | `onOpenChange={setOpen}` |
| `open` · requerida | `boolean` | — | Controla si la superficie está abierta. | `open={open}` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Filtros de la colección"` |
| `children` | `ReactNode` | — | Contenido que se compone dentro del componente. | `<Text>Filtra por categoría</Text>` |
| `detached` | `boolean` | `false` | Separa visualmente la superficie del borde de la ventana. | `detached` |
| `dismissible` | `boolean` | `true` | Permite descartar la superficie con sus gestos y acciones de cierre. | `dismissible={!saving}` |
| `draggable` | `boolean` | `true` | Habilita la manipulación por arrastre. | `draggable={false}` |
| `edge` | `"end" \| "start"` | `'end'` | Borde lógico desde el que aparece la hoja. | `edge="start"` |
| `elevation` | `0 \| 1 \| 2 \| 3` | — | Nivel de elevación de la superficie. | `elevation={3}` |
| `footer` | `ReactNode` | — | Contenido que permanece en el pie. | `footer={<Button onPress={() => setOpen(false)}>Listo</Button>}` |
| `header` | `ReactNode` | — | Contenido que permanece en la cabecera. | `header={<Text variant="titleLarge">Filtros activos</Text>}` |
| `motion` | `"sheet" \| "drawer"` | `'sheet'` | Perfil o mecanismo de transición del componente. | `motion="drawer"` |
| `onBackPress` | `(() => void)` | — | Acción que se ejecuta al pedir volver. | `onBackPress={() => setFilterSection('overview')}` |
| `onClosed` | `(() => void)` | — | Avisa cuando concluye la salida de la superficie. | `onClosed={() => setFilterSection('overview')}` |
| `showCloseButton` | `boolean` | `true` | Muestra el control de cierre incorporado. | `showCloseButton={false}` |
| `showDivider` | `boolean` | `false` | Muestra la separación visual. | `showDivider` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ maxWidth: 400 }}` |
| `testID` | `string` | `'mobile-side-sheet'` | Identificador para automatización en el host. | `testID="collection-filters-sheet"` |
| `title` | `string` | — | Título visible o contenido principal. | `title="Filtros"` |
| `variant` | `"standard" \| "modal"` | `'modal'` | `standard` acompaña al contenido y `modal` lo superpone. | `variant="standard"` |
| `width` | `number` | `360` | Ancho de la superficie. | `width={320}` |

**Ejemplo**

```tsx
import { useState } from 'react';
import { SideSheet, Button, Text } from 'mobile-design/react-native';

export default function Example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setOpen(true)}>Ver información</Button>
      <SideSheet
        open={open}
        onOpenChange={setOpen}
        variant="modal"
        title="Información"
      >
        <Text>Contenido complementario de esta pantalla.</Text>
      </SideSheet>
    </>
  );
}
```

#### Snackbar

Confirma el resultado de una acción mediante un mensaje temporal y una acción opcional.

- Renderiza un único Snackbar dentro de Portal y controla visible/onDismiss. Actualiza su contenido para sustituir información anterior. No apiles instancias.
- children contiene un mensaje breve de hasta dos líneas. Action añade una sola acción de texto. ActionOnNewLine coloca una acción larga debajo.
- onIconPress añade un cierre opcional. No es necesario para mensajes breves que desaparecen por sí solos. Usa una etiqueta accesible si cambias su icono.
- messageKey identifica una notificación nueva aunque repita el mismo texto. Reinicia su tiempo sin desmontar la superficie ni reiniciar la animación de presencia.
- bottomOffset reserva el espacio real ocupado por navegación o FAB. El componente añade por separado el área segura y 12 dp de margen inferior.

Monta un solo `Snackbar` en `Portal` bajo `MobileDesignProvider`. `messageKey` permite volver a mostrar un mensaje idéntico. Usa `bottomOffset` para reservar el espacio de un FAB o una barra inferior.

**Propiedades de `Snackbar`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `Colección archivada` |
| `onDismiss` · requerida | `() => void` | — | Solicita cerrar la superficie. | `onDismiss={() => setVisible(false)}` |
| `visible` · requerida | `boolean` | — | Controla si la superficie o el indicador se presenta. | `visible={visible}` |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="La acción Deshacer restaura la colección"` |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Colección archivada"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ busy: restoring }}` |
| `action` | `(Omit<ButtonProps, "children" \| "variant"> & { label: string; })` | — | Configuración de la acción de texto. | `action={{ label: 'Deshacer', onPress: undoArchive }}` |
| `actionOnNewLine` | `boolean` | `false` | Coloca la acción debajo del mensaje. | `actionOnNewLine` |
| `bottomOffset` | `number` | `0` | Espacio adicional que la aplicación reserva bajo el mensaje. | `bottomOffset={72}` |
| `contentStyle` | `StyleProp<ViewStyle>` | — | Estilo del contenido dentro de la superficie. | `contentStyle={{ paddingVertical: 8 }}` |
| `duration` | `number` | `4000` | Tiempo del mensaje en milisegundos. | `duration={6000}` |
| `elevation` | `SurfaceElevation` | `3` | Nivel de elevación de la superficie. | `elevation={3}` |
| `focusShortcut` | `false \| "Alt+G"` | `'Alt+G'` | Atajo de teclado para llevar el foco al mensaje en navegador. Usa `false` cuando la aplicación ya utilice Alt+G. | `focusShortcut="Alt+G"` |
| `icon` | `IconSource` | `'close'` | Nombre de icono o elemento de representación admitido por la propiedad. | `icon="close"` |
| `iconAccessibilityLabel` | `string` | `'Cerrar mensaje'` | Nombre accesible del icono cuando actúa como control. | `iconAccessibilityLabel="Cerrar aviso de archivo"` |
| `inlineFeedback` | `boolean` | `false` | Habilita el cierre automático en navegador. La pantalla debe comunicar también el resultado mediante contenido accesible en línea. | `inlineFeedback` |
| `maxFontSizeMultiplier` | `number` | — | Límite de escalado del contenido de texto. | `maxFontSizeMultiplier={2}` |
| `messageKey` | `string \| number` | — | Identificador que permite mostrar un mensaje nuevo aunque repita texto. | `messageKey={archiveOperationId}` |
| `mode` | `"flat" \| "elevated"` | — | Tratamiento visual de la superficie del mensaje. | `mode="elevated"` |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="collection-archive-status"` |
| `onIconPress` | `(() => void)` | — | Acción del icono independiente. | `onIconPress={() => setVisible(false)}` |
| `style` | `WithAnimatedValue<StyleProp<ViewStyle>>` | — | Estilo de la superficie exterior. | `style={{ marginBottom: 8 }}` |
| `testID` | `string` | `'mobile-snackbar'` | Identificador para automatización en el host. | `testID="collection-archived-snackbar"` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#2759AA' } }}` |
| `wrapperStyle` | `StyleProp<ViewStyle>` | — | Estilo del contenedor exterior de posicionamiento. | `wrapperStyle={{ marginHorizontal: 16 }}` |

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { Snackbar, Portal, Button, Text } from 'mobile-design/react-native';

export default function Example() {
  const [visible, setVisible] = useState(false);
  const [archived, setArchived] = useState(false);

  return (
    <View style={{ gap: 16 }}>
      <Text accessibilityLiveRegion="polite">
        {archived ? 'Colección archivada' : 'Colección disponible'}
      </Text>
      <Button
        onPress={() => {
          setArchived(true);
          setVisible(true);
        }}
      >
        Archivar colección
      </Button>
      <Portal>
        <Snackbar
          visible={visible}
          onDismiss={() => setVisible(false)}
          inlineFeedback
          action={{
            label: 'Deshacer',
            onPress: () => {
              setArchived(false);
              setVisible(false);
            },
          }}
        >
          Colección archivada
        </Snackbar>
      </Portal>
    </View>
  );
}
```

#### Tooltip y RichTooltip

Aclara el propósito de un control mediante una ayuda Plain o aporta contenido y acciones con Rich tooltip.

- Envuelve un control real con Tooltip para describir una acción sin etiqueta, como Present now o Settings. El control conserva su nombre accesible y su acción normal.
- RichTooltip es transitorio por defecto. Aparece con hover, foco o pulsación mantenida. Persistent activa la ayuda que aparece al pulsar o al introducir una función al abrir una página.
- Para controlar una introducción usa visible/onDismiss y persistent. El contenido admite texto, enlaces y hasta dos acciones con key. KeepOpen conserva la ayuda después de ejecutar una acción.

Usa `Tooltip` para explicar un control y `RichTooltip` para un contenido que incluye título o acciones. `persistent` permite mantener la ayuda abierta para interactuar con sus acciones. `RichTooltip` admite hasta dos acciones. Conserva una etiqueta accesible en el control aunque tenga tooltip.

**Propiedades de `RichTooltip`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `anchor` · requerida | `ReactNode` | — | Control o coordenadas que sirven como origen de la superficie. | `anchor={<Button onPress={() => setVisible(true)}>Más información</Button>}` |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. | `<Text>Consulta documentos descargados sin conexión.</Text>` |
| `actions` | `readonly RichTooltipAction[]` | `[]` | Acciones relacionadas de la composición. | `actions={[{ key: 'done', label: 'Entendido', onPress: () => setVisible(false) }]}` |
| `anchorPosition` | `"bottom" \| "top"` | `'bottom'` | Lado preferido respecto del ancla. | `anchorPosition="top"` |
| `dismissAccessibilityLabel` | `string` | `'Cerrar ayuda'` | Nombre accesible para cerrar la ayuda. | `dismissAccessibilityLabel="Cerrar ayuda de descarga"` |
| `maxWidth` | `number` | `320` | Ancho máximo de la superficie. | `maxWidth={320}` |
| `onDismiss` | `(() => void)` | — | Solicita cerrar la superficie. | `onDismiss={() => setVisible(false)}` |
| `persistent` | `boolean` | `false` | Cambia la ayuda rica a apertura persistente. | `persistent` |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'center' }}` |
| `testID` | `string` | `'mobile-rich-tooltip'` | Identificador para automatización en el host. | `testID="offline-help"` |
| `title` | `string` | — | Título visible o contenido principal. | `title="Consulta sin conexión"` |
| `visible` | `boolean` | — | Controla si la superficie o el indicador se presenta. | `visible={visible}` |

<details>
<summary>Configuración complementaria de Tooltip y RichTooltip</summary>

**`Tooltip`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `children` · requerida | `React.ReactElement<unknown, string \| React.JSXElementConstructor<any>>` | — | Contenido que se compone dentro del componente. | `<IconButton icon="bookmark-outline" accessibilityLabel="Guardar colección" onPress={saveCollection} />` |
| `title` · requerida | `string` | — | Título visible o contenido principal. | `title="Guardar para más tarde"` |
| `anchorStyle` | `StyleProp<ViewStyle>` | — | Estilo del envoltorio del ancla. | `anchorStyle={{ alignSelf: 'flex-start' }}` |
| `enterTouchDelay` | `number` | `500` | Tiempo de pulsación, en milisegundos, antes de mostrar la ayuda. | `enterTouchDelay={400}` |
| `gap` | `4 \| 8` | `4` | Espacio en dp entre elementos o entre el ancla y la ayuda. | `gap={8}` |
| `leaveTouchDelay` | `number` | `1500` | Tiempo, en milisegundos, desde que termina la pulsación hasta que se oculta la ayuda. | `leaveTouchDelay={1000}` |
| `placement` | `"below" \| "above"` | `'above'` | Posición de apertura respecto del ancla. | `placement="above"` |
| `testID` | `string` | `'mobile-tooltip'` | Identificador para automatización en el host. | `testID="save-collection-tooltip"` |
| `theme` | `$DeepPartial<Theme>` | — | Ajustes locales sobre el tema efectivo. | `theme={{ colors: { primary: '#2759AA' } }}` |
| `titleMaxFontSizeMultiplier` | `number` | — | Límite de escalado del tamaño del texto de la ayuda. | `titleMaxFontSizeMultiplier={2}` |

**`RichTooltipAction`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `key` · requerida | `string` | — | Identificador único y estable dentro del conjunto. | `key: 'done'` |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. | `label: 'Entendido'` |
| `onPress` · requerida | `() => void` | — | Ejecuta la acción al activar el control. | `onPress: () => setVisible(false)` |
| `disabled` | `boolean` | — | Bloquea la interacción del control. | `disabled: !canDownload` |
| `keepOpen` | `boolean` | — | Mantiene la ayuda visible después de ejecutar la acción. | `keepOpen: true` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { RichTooltip, Button, Text } from 'mobile-design/react-native';

export default function Example() {
  const [visible, setVisible] = useState(false);

  return (
    <RichTooltip
      persistent
      visible={visible}
      onDismiss={() => setVisible(false)}
      title="Consulta sin conexión"
      anchor={
        <Button
          variant="tonal"
          onPress={() => setVisible(true)}
        >
          Más información
        </Button>
      }
      actions={[
        { key: 'done', label: 'Entendido', onPress: () => setVisible(false) },
      ]}
    >
      <Text>
        Guarda un documento para consultarlo aunque no tengas conexión.
      </Text>
    </RichTooltip>
  );
}
```

##### Tooltip simple en un botón de icono

El botón conserva un nombre accesible propio. `Tooltip` recibe un único elemento que admite eventos de interacción. La ayuda se presenta al pasar el puntero, al enfocar o al mantener pulsado según el dispositivo.

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { IconButton, Text, Tooltip } from 'mobile-design/react-native';

export default function TooltipExample() {
  const [saved, setSaved] = useState(false);
  const label = saved ? 'Quitar de favoritos' : 'Guardar en favoritos';

  return (
    <View style={{ alignItems: 'flex-start', padding: 32 }}>
      <Tooltip title={label} placement="below" gap={8} enterTouchDelay={400}>
        <IconButton
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          accessibilityLabel={label}
          selected={saved}
          onPress={() => setSaved((value) => !value)}
        />
      </Tooltip>
      <Text accessibilityLiveRegion="polite">{saved ? 'En favoritos' : 'Sin guardar'}</Text>
    </View>
  );
}
```

### Carga y progreso

#### LoadingIndicator y PullToRefresh

Comunica trabajo indeterminado mediante una secuencia de formas que cambia continuamente.

- Usa LoadingIndicator para una espera indeterminada entre 200 ms y 5 s. Una respuesta inmediata no necesita indicador. Una tarea más larga usa ProgressIndicator.
- variant configura contenedor. Animating pausa el movimiento y visible controla presencia. El estado del trabajo pertenece al host.
- El tamaño base es 48 dp, con una figura de 38 dp. Size admite de 24 a 240 dp, conservando la proporción. Reserva los tamaños mayores para ventanas grandes.
- Centra el indicador en el espacio que está cargando. Al añadir contenido, colócalo en el espacio nuevo. Usa contained cuando se superpone a contenido y en pull-to-refresh.
- Dentro de Button, loading acepta un renderer que recibe size y color. Permite usar LoadingIndicator sin perder el contraste de la acción y bloquea las pulsaciones repetidas.

Centra el indicador dentro de la región que está cargando. `animating={false}` pausa el movimiento y `visible={false}` oculta la figura. Usa un indicador de progreso si la tarea informa un porcentaje.

**Propiedades de `LoadingIndicator`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `accessibilityLabel` | `string` | `'Cargando'` | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Cargando la colección"` |
| `animating` | `boolean` | `true` | Controla si el indicador cambia de forma o gira. | `animating={isLoading && isScreenActive}` |
| `color` | `ColorValue` | — | Color del elemento o trazo. | `color="#2759AA"` |
| `containerColor` | `ColorValue` | — | Color de la superficie del control. | `containerColor="#D8E3FF"` |
| `gestureProgress` | `number \| SharedValue<number>` | — | Progreso del gesto de arrastre que transforma la figura. Omítelo mientras se ejecuta la carga. | `gestureProgress={0.65}` para mostrar un arrastre al 65 % |
| `size` | `number` | `48` | Tamaño visual o escala semántica del control. | `size={48}` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'center' }}` |
| `testID` | `string` | `'mobile-loading-indicator'` | Identificador para automatización en el host. | `testID="collection-loading"` |
| `variant` | `"contained" \| "uncontained"` | `'uncontained'` | Tratamiento visual o modalidad del componente. | `variant="contained"` |
| `visible` | `boolean` | `true` | Controla si la superficie o el indicador se presenta. | `visible={isLoading}` |

<details>
<summary>Configuración complementaria de LoadingIndicator y PullToRefresh</summary>

**`PullToRefresh`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `onRefresh` · requerida | `() => void` | — | Inicia la actualización al completar el gesto. | `onRefresh={refreshCollection}` |
| `refreshing` · requerida | `boolean` | — | Estado controlado que permanece activo durante la actualización. | `refreshing={refreshing}` |
| `accessibilityHint` | `string` | — | Contexto adicional sobre la acción. | `accessibilityHint="Desliza hacia abajo desde el inicio para actualizar"` |
| `accessibilityLabel` | `string` | `'Actualizar contenido'` | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Actualizar la colección"` |
| `accessibilityState` | `AccessibilityState` | — | Estado semántico del control. | `accessibilityState={{ busy: refreshing }}` |
| `children` | `ReactNode` | — | Contenido que se compone dentro del componente. | `<Text>Documentos guardados</Text>` |
| `contentContainerStyle` | `____ViewStyleProp_Internal` | — | Estilo del contenedor que agrupa los hijos del área desplazable. Úsalo para añadir relleno alrededor del contenido. | `contentContainerStyle={{ gap: 12, padding: 24 }}` |
| `enabled` | `boolean` | `true` | Habilita el gesto para actualizar. | `enabled={isOnline}` |
| `indicatorMode` | `"overlay" \| "adjacent"` | `'overlay'` | Con `overlay` el indicador se superpone al contenido. Con `adjacent` el contenido se desplaza por debajo del indicador. | `indicatorMode="adjacent"` |
| `nativeID` | `string` | — | Identificador del control para enlazarlo a contenido accesible. | `nativeID="collection-refresh"` |
| `renderScrollComponent` | `((props: PullToRefreshViewportProps) => ReactNode)` | — | Renderiza una `Animated.FlatList` o `Animated.SectionList` como área desplazable. Pasa a la lista las propiedades de desplazamiento recibidas. | [Lista virtualizada](#pulltorefresh-con-lista-virtualizada) |
| `scrollIndicators` | `ScrollIndicatorOptions` | — | Configura los indicadores de desplazamiento del paquete. | `scrollIndicators={{ vertical: true }}` |
| `showsHorizontalScrollIndicator` | `boolean` | — | Muestra el indicador de desplazamiento horizontal. | `showsHorizontalScrollIndicator={false}` |
| `showsVerticalScrollIndicator` | `boolean` | — | Muestra el indicador de desplazamiento vertical. | `showsVerticalScrollIndicator` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ flex: 1 }}` |
| `testID` | `string` | `'mobile-pull-to-refresh'` | Identificador para automatización en el host. | `testID="collection-refresh-viewport"` |
| `threshold` | `number` | `80` | Desplazamiento del indicador en dp requerido para actualizar. El gesto aplica un factor de 0,5. Con un umbral de 96 dp, el arrastre debe superar 192 dp. | `threshold={96}` |

</details>

**Ejemplo**

```tsx
import { LoadingIndicator } from 'mobile-design/react-native';

export default function Example() {
  return (
    <LoadingIndicator
      variant="contained"
      size={48}
      accessibilityLabel="Cargando tu biblioteca"
    />
  );
}
```

##### PullToRefresh con contenido desplazable

`PullToRefresh` controla el área desplazable y necesita altura disponible. Úsalo como región principal con `flex: 1`. Desde la posición inicial, el arrastre hacia abajo puede solicitar `onRefresh`. Mantén `refreshing` activo durante la consulta y restablécelo aunque falle. El ejemplo simula una consulta local para que puedas probar el gesto sin un servidor.

```tsx
import { useState } from 'react';
import { Text, PullToRefresh } from 'mobile-design/react-native';

function loadCollection(revision: number) {
  return new Promise<string[]>((resolve) => {
    setTimeout(() => resolve(['Ruta del viaje', 'Billetes', `Revisión ${revision}`]), 500);
  });
}

export default function PullToRefreshExample() {
  const [items, setItems] = useState(['Ruta del viaje', 'Billetes']);
  const [revision, setRevision] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refreshCollection = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setError('');
    try {
      setItems(await loadCollection(revision + 1));
      setRevision(revision + 1);
    } catch {
      setError('No pudimos actualizar la colección.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <PullToRefresh
      refreshing={refreshing}
      onRefresh={refreshCollection}
      accessibilityLabel="Actualizar documentos guardados"
      indicatorMode="adjacent"
      scrollIndicators={{ vertical: true }}
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 12, padding: 24 }}
    >
      <Text variant="headlineSmall">Documentos guardados</Text>
      {items.map((item) => <Text key={item}>{item}</Text>)}
      {error ? <Text accessibilityLiveRegion="polite">{error}</Text> : null}
    </PullToRefresh>
  );
}
```

##### PullToRefresh con lista virtualizada

Devuelve una sola `Animated.FlatList` o `Animated.SectionList` desde `renderScrollComponent`. Propaga el objeto recibido para conservar el controlador de scroll, estilos, indicadores y acciones accesibles del área desplazable. Este componente recibe los datos y el estado de actualización de la pantalla que lo monta.

```tsx
import Animated from 'react-native-reanimated';
import { Text, PullToRefresh } from 'mobile-design/react-native';

type Document = { id: string; title: string };

type DocumentsProps = {
  documents: Document[];
  refreshing: boolean;
  reload: () => void;
};

export default function VirtualDocuments({ documents, refreshing, reload }: DocumentsProps) {
  return (
    <PullToRefresh
      refreshing={refreshing}
      onRefresh={reload}
      accessibilityLabel="Actualizar documentos"
      style={{ flex: 1 }}
      renderScrollComponent={(viewport) => (
        <Animated.FlatList
          {...viewport}
          data={documents}
          keyExtractor={(document) => document.id}
          renderItem={({ item }) => <Text style={{ padding: 16 }}>{item.title}</Text>}
        />
      )}
    />
  );
}
```

#### ProgressIndicator

Comunica progreso determinado o indeterminado con indicadores lineales y circulares, planos u ondulados.

- Elige linear o circular. Progress de 0 a 1 comunica avance determinado. Omitir progress y progressSource mantiene el modo indeterminado.
- appearance configura flat o wavy. CircularProgressStatus compone progreso y success.
- progressSource permite controlar el avance con un valor compartido. Sincroniza progress con valores significativos de la tarea para comunicar también el avance accesible. No es necesario publicar cada fotograma.
- Coloca el lineal en el borde del contenido que está cargando, con al menos 4 dp a cada extremo y un ancho mínimo de 40 dp. Centra el circular en el espacio que está cargando o donde aparecerá el contenido nuevo.
- El trazo base mide 4 dp y puede configurarse. El circular admite de 24 a 240 dp. Reserva los tamaños mayores para ventanas grandes. El ondulado aumenta la altura del lineal.

Elige `progress` de 0 a 1 cuando conoces el avance. Si usas `progressSource` para animarlo en UI, publica también hitos accesibles con `progress`. Si no entregas ninguno, el indicador es indeterminado.

**Propiedades de `ProgressIndicator`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `accessibilityLabel` | `string` | `'Progreso'` | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Avance de la descarga"` |
| `animated` | `boolean` | `true` | Con `false` representa el valor actual de forma estática. | `animated={false}` |
| `animationDuration` | `number` | — | Duración de cada ciclo indeterminado. Por defecto son 1750 ms en el indicador lineal y 6000 ms en el circular. | `animationDuration={2200}` |
| `appearance` | `"flat" \| "wavy"` | `'flat'` | Tratamiento plano u ondulado del indicador. | `appearance="wavy"` |
| `color` | `ColorValue` | — | Color del elemento o trazo. | `color="#2759AA"` |
| `direction` | `"ltr" \| "rtl"` | — | Dirección del indicador lineal. Si se omite, usa la dirección del contexto de idioma. | `direction="rtl"` |
| `paused` | `boolean` | `false` | Pausa la animación. | `paused={!isScreenActive}` |
| `progress` | `number` | — | Fracción de avance determinada de 0 a 1. | `progress={0.4}` |
| `progressSource` | `SharedValue<number>` | — | Valor compartido que conduce el avance visual en el hilo UI. | [Avance con valor compartido](#avance-con-valor-compartido) |
| `showStopIndicator` | `boolean` | `true` | Controla la marca de final de pista en el indicador lineal determinado. | `showStopIndicator={false}` |
| `showTrack` | `boolean` | `true` | Muestra la pista de fondo. | `showTrack={false}` |
| `size` | `number` | — | Tamaño visual o escala semántica del control. | `size={48}` con `variant="circular"` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` |
| `testID` | `string` | `'progress-indicator'` | Identificador para automatización en el host. | `testID="download-progress"` |
| `thickness` | `number` | — | Grosor del trazo en dp. | `thickness={6}` |
| `trackColor` | `ColorValue` | — | Color de la pista de fondo. | `trackColor="#D8E3FF"` |
| `variant` | `"circular" \| "linear"` | `'linear'` | Tratamiento visual o modalidad del componente. | `variant="circular"` |
| `waveAmplitude` | `number` | — | Altura en dp desde la línea media hasta la cresta con `appearance="wavy"`. | `waveAmplitude={3}` |
| `wavelength` | `number` | — | Separación en dp entre crestas con `appearance="wavy"`. | `wavelength={18}` |
| `waveSpeed` | `number` | — | Velocidad de la onda en dp por segundo. Por defecto avanza una longitud de onda por segundo. Con `0` queda estática. | `waveSpeed={24}` |

<details>
<summary>Configuración complementaria de ProgressIndicator</summary>

**`CircularProgressStatus`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `status` · requerida | `"progress" \| "success"` | — | Estado actual del control. | `status={saved ? 'success' : 'progress'}` |
| `animated` | `boolean` | `true` | Activa las transiciones de avance y finalización. | `animated={false}` |
| `appearance` | `"flat" \| "wavy"` | `'wavy'` | Tratamiento plano u ondulado del indicador. | `appearance="wavy"` |
| `color` | `ColorValue` | — | Color del elemento o trazo. | `color="#2759AA"` |
| `onSuccessAnimationEnd` | `(() => void)` | — | Avisa cuando concluye la animación de éxito. | `onSuccessAnimationEnd={() => setAnnounceReady(true)}` |
| `progress` | `number` | — | Fracción de avance determinada de 0 a 1. | `progress={0.4}` |
| `progressLabel` | `string` | `'Processing payment…'` | Nombre accesible durante el progreso. | `progressLabel="Guardando la colección"` |
| `size` | `number` | `48` | Tamaño visual o escala semántica del control. | `size={64}` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'center' }}` |
| `successLabel` | `string` | `'Payment complete'` | Nombre accesible al completar la tarea. | `successLabel="Colección guardada"` |
| `testID` | `string` | `'circular-progress-status'` | Identificador para automatización en el host. | `testID="save-progress-status"` |
| `thickness` | `number` | `4` | Grosor del trazo en dp. | `thickness={6}` |

**`ProgressBar`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Avance de la exportación"` |
| `animated` | `boolean` | — | Con `false` representa el valor actual de forma estática. | `animated={false}` |
| `animationDuration` | `number` | — | Duración de cada ciclo indeterminado. Por defecto son 1750 ms en el indicador lineal y 6000 ms en el circular. | `animationDuration={2200}` |
| `appearance` | `"flat" \| "wavy"` | — | Tratamiento plano u ondulado del indicador. | `appearance="wavy"` |
| `color` | `ColorValue` | — | Color del elemento o trazo. | `color="#2759AA"` |
| `direction` | `"ltr" \| "rtl"` | — | Dirección del indicador lineal. Si se omite, usa la dirección del contexto de idioma. | `direction="rtl"` |
| `indeterminate` | `boolean` | `false` | Activa el avance indeterminado. | `indeterminate` |
| `paused` | `boolean` | — | Pausa la animación. | `paused={!isScreenActive}` |
| `progress` | `number` | `0` | Avance entre 0 y 1 cuando `indeterminate` es falso. | `progress={0.4}` |
| `progressSource` | `SharedValue<number>` | — | Valor compartido que conduce el avance visual en el hilo UI. | [Avance con valor compartido](#avance-con-valor-compartido) |
| `showStopIndicator` | `boolean` | — | Controla la marca de final de pista en el indicador lineal determinado. | `showStopIndicator={false}` |
| `showTrack` | `boolean` | — | Muestra la pista de fondo. | `showTrack={false}` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ marginHorizontal: 16 }}` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="export-progress-bar"` |
| `thickness` | `number` | — | Grosor del trazo en dp. | `thickness={6}` |
| `trackColor` | `ColorValue` | — | Color de la pista de fondo. | `trackColor="#D8E3FF"` |
| `visible` | `boolean` | `true` | Controla si la superficie o el indicador se presenta. | `visible={exporting}` |
| `waveAmplitude` | `number` | — | Altura en dp desde la línea media hasta la cresta con `appearance="wavy"`. | `waveAmplitude={3}` |
| `wavelength` | `number` | — | Separación en dp entre crestas con `appearance="wavy"`. | `wavelength={18}` |
| `waveSpeed` | `number` | — | Velocidad de la onda en dp por segundo. Por defecto avanza una longitud de onda por segundo. Con `0` queda estática. | `waveSpeed={24}` |

**`ActivityIndicator`**

| Propiedad | Tipo | Inicial | Uso | Ejemplo |
| --- | --- | --- | --- | --- |
| `accessibilityLabel` | `string` | — | Nombre que anuncia la tecnología de asistencia. | `accessibilityLabel="Conectando con la biblioteca"` |
| `animating` | `boolean` | `true` | Controla si el indicador cambia de forma o gira. | `animating={connecting}` |
| `animationDuration` | `number` | — | Duración de cada ciclo indeterminado. Por defecto son 1750 ms en el indicador lineal y 6000 ms en el circular. | `animationDuration={2200}` |
| `appearance` | `"flat" \| "wavy"` | — | Tratamiento plano u ondulado del indicador. | `appearance="wavy"` |
| `color` | `ColorValue` | — | Color del elemento o trazo. | `color="#2759AA"` |
| `direction` | `"ltr" \| "rtl"` | — | La firma hereda esta opción del indicador base para el trazado lineal. | Usa `<ProgressBar direction="rtl" progress={0.4} />` para un avance hacia la izquierda. |
| `hidesWhenStopped` | `boolean` | `true` | Oculta el indicador al dejar de animar. | `hidesWhenStopped` |
| `paused` | `boolean` | — | Pausa la animación. | `paused={!isScreenActive}` |
| `showStopIndicator` | `boolean` | — | La firma hereda esta opción del indicador base para el trazado lineal determinado. | Usa `<ProgressBar progress={0.4} showStopIndicator={false} />` para ocultar la marca. |
| `showTrack` | `boolean` | — | Muestra la pista de fondo. | `showTrack={false}` |
| `size` | `number \| "small" \| "large"` | `'small'` | Tamaño visual o escala semántica del control. | `size="large"` |
| `style` | `StyleProp<ViewStyle>` | — | Estilo de la superficie exterior. | `style={{ alignSelf: 'center' }}` |
| `testID` | `string` | — | Identificador para automatización en el host. | `testID="library-connecting"` |
| `thickness` | `number` | — | Grosor del trazo en dp. | `thickness={6}` |
| `trackColor` | `ColorValue` | — | Color de la pista de fondo. | `trackColor="#D8E3FF"` |
| `waveAmplitude` | `number` | — | Altura en dp desde la línea media hasta la cresta con `appearance="wavy"`. | `waveAmplitude={3}` |
| `wavelength` | `number` | — | Separación en dp entre crestas con `appearance="wavy"`. | `wavelength={18}` |
| `waveSpeed` | `number` | — | Velocidad de la onda en dp por segundo. Por defecto avanza una longitud de onda por segundo. Con `0` queda estática. | `waveSpeed={24}` |

</details>

**Ejemplo**

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { ProgressIndicator, Text, Button } from 'mobile-design/react-native';

export default function Example() {
  const [progress, setProgress] = useState(0.4);

  return (
    <View style={{ gap: 24 }}>
      <Text>Descarga: {Math.round(progress * 100)} %</Text>
      <ProgressIndicator
        variant="linear"
        appearance="wavy"
        progress={progress}
        accessibilityLabel="Descarga de la colección"
      />
      <Button
        variant="tonal"
        onPress={() => setProgress((value) => Math.min(1, value + 0.2))}
      >
        Avanzar demostración
      </Button>
    </View>
  );
}
```

##### Avance con valor compartido

Actualiza `progressSource` con un `SharedValue<number>` de Reanimated y comunica el objetivo accesible con `progress`. `ProgressBar` ya elige la orientación lineal y utiliza ambas propiedades. Con `indeterminate` muestra el ciclo de espera.

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { Button, ProgressBar, Text } from 'mobile-design/react-native';

export default function ProgressBarExample() {
  const [progress, setProgress] = useState(0);
  const downloadProgress = useSharedValue(0);

  const advance = () => {
    const next = Math.min(1, progress + 0.25);
    setProgress(next);
    downloadProgress.set(withTiming(next, { duration: 600 }));
  };

  return (
    <View style={{ gap: 16, padding: 24 }}>
      <Text>Exportación · {Math.round(progress * 100)} %</Text>
      <ProgressBar
        progress={progress}
        progressSource={downloadProgress}
        accessibilityLabel="Avance de la exportación"
        thickness={6}
      />
      <Button onPress={advance} disabled={progress === 1}>Avanzar exportación</Button>
    </View>
  );
}
```

##### Actividad indeterminada y confirmación de éxito

`ActivityIndicator` ofrece una espera circular compacta. `CircularProgressStatus` mantiene el espacio del indicador y dibuja una marca al pasar de `status="progress"` a `status="success"`. Usa etiquetas que describan la operación. En este ejemplo los botones permiten disparar ambas fases y observar el resultado.

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Button, CircularProgressStatus, Text } from 'mobile-design/react-native';

export default function ProgressStatusExample() {
  const [connected, setConnected] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <View style={{ alignItems: 'flex-start', gap: 16, padding: 24 }}>
      <ActivityIndicator animating={!connected} size="small" accessibilityLabel="Conectando con la biblioteca" />
      <Button onPress={() => setConnected(true)} disabled={connected}>Simular conexión</Button>
      {connected ? (
        <>
          <CircularProgressStatus
            status={saved ? 'success' : 'progress'}
            progress={saved ? 1 : 0.6}
            progressLabel="Guardando la colección"
            successLabel="Colección guardada"
            onSuccessAnimationEnd={() => setConfirmed(true)}
          />
          <Button onPress={() => setSaved(true)} disabled={saved}>Simular guardado</Button>
        </>
      ) : null}
      {confirmed ? <Text accessibilityLiveRegion="polite">Ya puedes consultar la colección.</Text> : null}
    </View>
  );
}
```

### Primitivas de composición

#### Avatar

`Avatar.Icon` representa una entidad con un símbolo. `Avatar.Image` muestra una foto y `Avatar.Text` muestra iniciales. Las tres variantes visuales usan tamaño `64` si omites `size`. `Avatar.Button`, también exportado como `AvatarButton`, proporciona un objetivo pulsable de `48` con etiqueta accesible. Puedes montar dentro una variante visual de `40`.

| Pieza | Propiedad | Uso | Ejemplo |
| --- | --- | --- | --- |
| `Avatar.Icon` | `icon` · requerida | Símbolo del avatar. | `icon="folder"` |
| `Avatar.Image` | `source` · requerida | Fuente de imagen React Native o función que recibe `size`. | `source={photo}` con `photo` de tipo `ImageSourcePropType`. |
| `Avatar.Text` | `label` · requerida | Iniciales visibles. | `label="MR"` |
| Tres variantes visuales | `size` | Ancho y alto del círculo. | `size={40}` |
| Tres variantes visuales | `style` | Estilo del círculo. | `style={{ backgroundColor: '#D8E2FF' }}` |
| Tres variantes visuales | `theme` | Tema parcial de la instancia. | `theme={{ colors: { primary: '#D8E2FF' } }}` |
| `Avatar.Icon` y `Avatar.Text` | `color` | Color del símbolo o de las iniciales. | `color="#001A41"` sobre el fondo claro. |
| `Avatar.Text` | `labelStyle` | Estilo del texto de las iniciales. | `labelStyle={{ fontWeight: '700' }}` |
| `Avatar.Text` | `maxFontSizeMultiplier` | Límite de escala para el texto dentro del círculo. | `maxFontSizeMultiplier={2}` |
| `Avatar.Image` | `onLoadStart` y `onLoadEnd` | Principio y fin de la carga de la imagen. | `onLoadStart={() => setPhotoLoading(true)} onLoadEnd={() => setPhotoLoading(false)}` |
| `Avatar.Image` | `onLoad` | Avisa que la imagen cargó. | `onLoad={() => setPhotoReady(true)}` |
| `Avatar.Image` | `onError` | Avisa que falló la imagen. | `onError={() => setPhotoFailed(true)}` para mostrar iniciales de respaldo. |
| `Avatar.Image` | `onProgress` y `onLayout` | Progreso de la descarga y cambios de tamaño de la vista de imagen. | `onProgress={({ nativeEvent }) => console.log(nativeEvent.loaded)}` y `onLayout={({ nativeEvent }) => console.log(nativeEvent.layout.width)}` |
| `Avatar.Button` | `children`, `onPress` y `accessibilityLabel` · requeridas | Contenido visual, acción y nombre anunciado. | `<Avatar.Button accessibilityLabel="Abrir perfil" onPress={openProfile}><Avatar.Text size={40} label="MR" /></Avatar.Button>` |
| `Avatar.Button` | `disabled` | Bloquea la acción y refleja el estado accesible. | `disabled={!canOpenProfile}` |
| `Avatar.Button` | `style` | Estilo externo. El componente conserva el objetivo circular. | `style={{ marginEnd: 12 }}` |
| `Avatar.Button` | `testID` | Identificador de la acción para pruebas. | `testID="abrir-perfil"` |
| `Avatar.Button` | Eventos de pulsación, foco y puntero | Comparte las propiedades de interacción de `TouchableRipple`. | `onFocus={() => setProfileFocused(true)}`. Consulta [TouchableRipple](#touchableripple). |

```tsx
import { useState } from 'react';
import { View, type ImageSourcePropType } from 'react-native';
import { Avatar, Text } from 'mobile-design/react-native';

export function ProfileAvatar({ photo }: { photo?: ImageSourcePropType }) {
    const [photoFailed, setPhotoFailed] = useState(false);
    const [opened, setOpened] = useState(false);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Avatar.Icon size={32} icon="folder" />
            <Avatar.Button
                accessibilityLabel="Abrir perfil de Marta"
                onPress={() => setOpened((current) => !current)}
                testID="abrir-perfil"
            >
                {photo && !photoFailed ? (
                    <Avatar.Image size={40} source={photo} onError={() => setPhotoFailed(true)} />
                ) : (
                    <Avatar.Text size={40} label="MR" />
                )}
            </Avatar.Button>
            {opened && <Text>Marta Ruiz</Text>}
        </View>
    );
}
```

#### Icon y MaterialSymbol

`Icon` resuelve un `source` con la configuración del proveedor. Usa un nombre, una imagen React Native o un renderizador. `MaterialSymbol` ofrece control directo de los ejes del glifo Material Symbols Rounded. El paquete base incluye el conjunto de los componentes. Para nombres adicionales, instala el catálogo opcional. [Mobile Design Icons](https://www.npmjs.com/package/@mobile-design/icons)

| Pieza | Propiedad | Uso | Ejemplo |
| --- | --- | --- | --- |
| `Icon` | `source` y `size` · requeridas | Fuente y tamaño lógico del icono. | `source={{ source: 'arrow_back', direction: 'auto' }} size={24}` |
| `Icon` | `color`, `theme` y `testID` | Color directo, tema local e identificador de pruebas. | `color={colors.primary}`, `theme={{ colors: { onSurface: '#23352F' } }}` y `testID="volver-icono"` |
| `Icon` | `allowFontScaling` | Aparece en el tipo de Paper. Si dibujas el icono con texto, aplica la opción en ese texto. | `source={({ size, color }) => <Text allowFontScaling={false} style={{ fontSize: size, color }}>★</Text>}` |
| `MaterialSymbol` | `name` · requerida | Nombre oficial o alias reconocido. | `name="bookmark"` |
| `MaterialSymbol` | `size`, `color` | Cuadro del glifo y color. | `size={28} color={colors.primary}` |
| `MaterialSymbol` | `filled` | Selecciona relleno o contorno. | `filled={saved}` |
| `MaterialSymbol` | `weight`, `grade` y `opticalSize` | Peso, grado y tamaño óptico. | `weight={500} grade={0} opticalSize={24}` |
| `MaterialSymbol` | `direction` | Refleja el símbolo cuando la dirección es `'rtl'`. | `direction={direction}` en un símbolo direccional. |
| `MaterialSymbol` | `testID` | Selector para automatización. | `testID="marca-guardada"` |

```tsx
import { View } from 'react-native';
import { Icon, MaterialSymbol, Text, useMobileTheme } from 'mobile-design/react-native';

export function SavedMarker({ saved }: { saved: boolean }) {
    const { colors } = useMobileTheme();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon source={{ source: 'arrow_back', direction: 'auto' }} size={20} color={colors.onSurface} />
            <MaterialSymbol
                name="bookmark"
                size={28}
                color={colors.primary}
                filled={saved}
                weight={500}
                grade={0}
                opticalSize={24}
                testID="marca-guardada"
            />
            <Text>{saved ? 'Guardado' : 'Sin guardar'}</Text>
        </View>
    );
}
```

#### TouchableRipple

Construye un control pulsable con respuesta visual. Usa las propiedades de `Pressable` que acepte `TouchableRippleProps` para accesibilidad, interacción y eventos del puntero. `onPress` conecta la acción y `children` define el contenido. [Props de Pressable](https://reactnative.dev/docs/pressable#props)

| Propiedad | Uso | Ejemplo |
| --- | --- | --- |
| `children` y `style` | Contenido y estilo. Ambos pueden depender del estado de pulsación. | `style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}` |
| `onPress` y `onLongPress` | Activación normal y pulsación prolongada. | `onPress={() => setSaved(true)}`, `onLongPress={() => setActionsOpen(true)}` |
| `onPressIn` y `onPressOut` | Comienzo y fin del contacto. | `onPressIn={() => setHeld(true)} onPressOut={() => setHeld(false)}` |
| `disabled` | Desactiva el control. | `disabled={saving}` |
| `rippleColor` y `underlayColor` | Color de la indicación en los hosts correspondientes. | `rippleColor="rgba(0, 90, 193, 0.16)" underlayColor="#D8E2FF"` |
| `borderless` y `centered` | Controlan el límite y el origen de la indicación. `centered` aplica al navegador. | `borderless={false} centered` |
| `background` | Configuración del drawable de ripple en Android cuando la primitiva lo admite. | `background={{ color: '#D8E2FF', borderless: false }}` |
| `ref` | Referencia a la vista anfitriona para medir el control. | `ref={targetRef}` con `useRef<ViewInstance>(null)`. |
| `theme` | Tema parcial para esta instancia. | `theme={{ colors: { primary: '#005AC1' } }}` |

```tsx
import { useState } from 'react';
import { Text, TouchableRipple } from 'mobile-design/react-native';

export function SaveTile() {
    const [saved, setSaved] = useState(false);
    return (
        <TouchableRipple
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Quitar de guardados' : 'Guardar'}
            onPress={() => setSaved((current) => !current)}
            rippleColor="rgba(0, 90, 193, 0.16)"
            style={{ borderRadius: 12, padding: 16, overflow: 'hidden' }}
        >
            <Text>{saved ? 'Guardado' : 'Guardar'}</Text>
        </TouchableRipple>
    );
}
```

#### Portal

Monta `children` en un host común por encima del contenido normal. `theme` permite un ajuste local. `MobileDesignProvider` ya incluye un host. Usa `Portal.Host` con su propiedad `children` cuando necesites delimitar los portales a una región concreta. Para un cuadro de diálogo con foco y cierre usa [Dialog](#dialog-y-fullscreendialog).

```tsx
import { View } from 'react-native';
import { Portal, Text, useMobileTheme } from 'mobile-design/react-native';

export function MapNotice() {
    const { colors } = useMobileTheme();
    return (
        <Portal.Host>
            <View style={{ minHeight: 180, padding: 16 }}>
                <Text>Mapa de la zona</Text>
                <Portal>
                    <View style={{ position: 'absolute', bottom: 12, left: 12, padding: 8, backgroundColor: colors.surfaceContainer }}>
                        <Text>Vista sin conexión</Text>
                    </View>
                </Portal>
            </View>
        </Portal.Host>
    );
}
```

#### ContainerTransformSurface

Superficie de bajo nivel para transiciones que parten de una vista medida. Para integrar la transición en un cuadro de diálogo, empieza con `transitionOrigin` en [Dialog](#dialog-y-fullscreendialog). Usa la primitiva directa si tu composición controla la medida, el progreso y la presencia.

| Propiedad | Uso | Ejemplo |
| --- | --- | --- |
| `origin` | Instantánea de origen con `x`, `y`, `width` y `height` medidos en la ventana, más `borderRadius`, `backgroundColor` y `content` decorativo opcionales. | `origin={{ x: 16, y: 80, width: 120, height: 48, borderRadius: 12 }}` representa una instantánea. En pantalla, toma esos valores con `measureInWindow`. |
| `transforming` y `entering` · requeridas | Habilitan la transformación y distinguen entrada de salida. | `transforming={origin !== undefined} entering` |
| `progress` · requerida | Valor compartido de `0` a `1`. | `progress={progress}` con `useSharedValue(0)`. |
| `onMeasured` · requerida | Recibe el origen medido y el estado `'ready'` o `'fallback'`. | `onMeasured={(_, state) => progress.set(state === 'ready' ? withTiming(1) : 1)}` |
| `borderRadius` y `backgroundColor` · requeridas | Forma y color final de la superficie. | `borderRadius={24} backgroundColor={colors.surfaceContainerHigh}` |
| `fill` y `maxHeight` | Hacen crecer la superficie o limitan su altura. | `fill maxHeight={400}` |
| `children` y `testID` | Contenido final e identificador de pruebas. | `<Text>Detalles</Text>` y `testID="detalles-superficie"` |

```tsx
import { useSharedValue, withTiming } from 'react-native-reanimated';
import {
    ContainerTransformSurface,
    Text,
    useMobileTheme,
    type ContainerTransformOrigin,
} from 'mobile-design/react-native';

export function DetailSurface({ origin }: { origin?: ContainerTransformOrigin }) {
    const { colors } = useMobileTheme();
    const progress = useSharedValue(origin ? 0 : 1);

    return (
        <ContainerTransformSurface
            origin={origin}
            transforming={origin !== undefined}
            entering
            progress={progress}
            onMeasured={(_, state) => progress.set(state === 'ready' ? withTiming(1) : 1)}
            borderRadius={24}
            backgroundColor={colors.surfaceContainerHigh}
            testID="detalles-superficie"
        >
            <Text style={{ padding: 16 }}>Detalles</Text>
        </ContainerTransformSurface>
    );
}
```

#### Tema y dirección locales

`ThemeProvider` aplica `theme` a sus `children` sin registrar otra familia de fuentes ni crear un portal. `LocaleProvider` recibe `direction` y `children` para fijar la dirección de un subárbol. `useLocale()` lee la dirección de ese contexto. `customText<T>()` crea un componente de texto que acepta las variantes adicionales de `T`. Incluye sus métricas en `theme.fonts` para que la variante tenga efecto.

```tsx
import { LocaleProvider, ThemeProvider, customText, useLocale, useMobileTheme } from 'mobile-design/react-native';

const StatText = customText<'stat'>();

function LocalStat() {
    const { direction } = useLocale();
    return <StatText variant="stat">{direction === 'rtl' ? '١٢' : '12'}</StatText>;
}

export function PreviewStat() {
    const theme = useMobileTheme();
    const localTheme = {
        ...theme,
        fonts: { ...theme.fonts, stat: { ...theme.fonts.titleLarge, fontWeight: '700' as const } },
    };

    return (
        <ThemeProvider theme={localTheme}>
            <LocaleProvider direction="rtl">
                <LocalStat />
            </LocaleProvider>
        </ThemeProvider>
    );
}
```

#### Catálogo

`mobileDesignCatalog` enumera las fichas, variantes y nombres de exportación. `mobileDesignCatalogGroups` lista los grupos para construir una navegación. `getMobileDesignComponent(id)` devuelve la ficha del identificador o `undefined` si no existe.

```ts
import { getMobileDesignComponent, mobileDesignCatalog, mobileDesignCatalogGroups } from 'mobile-design/react-native';

export const buttonVariants = getMobileDesignComponent('buttons')?.variants ?? [];
export const sections = mobileDesignCatalogGroups.map((group) => ({
    id: group.id,
    label: group.title,
    components: mobileDesignCatalog.filter((entry) => entry.group === group.id),
}));
```
