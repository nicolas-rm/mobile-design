# Mobile Design

![Logo de Mobile Design](https://raw.githubusercontent.com/nicolas-rm/mobile-design/main/dist/assets/favicon.svg)

Componentes Material Design 3 para React Native y React Native Web. El paquete integra el tema, las fuentes y los componentes sobre React Native Paper.

[Instalación](#instalación-desde-npm) · [Dependencias](#para-qué-sirve-cada-dependencia) · [Primer componente](#primer-componente) · [Proveedor](#configurar-el-proveedor) · [Temas y colores](#temas-y-colores) · [Tipografía e iconos](#tipografía-e-iconos) · [Índice de componentes](#índice-de-componentes)

La referencia detallada de propiedades y ejemplos viaja con el paquete. Puedes abrir `node_modules/mobile-design/COMPONENTS.md` para consultar la versión instalada. [Referencia en este código fuente](COMPONENTS.md) · [Referencia de la versión publicada](https://cdn.jsdelivr.net/npm/mobile-design@latest/COMPONENTS.md)

## Instalación desde npm

En una app Expo, usa Metro y las versiones de React y React Native de tu SDK. El paquete distribuye TypeScript y Metro resuelve los archivos específicos de cada plataforma. La configuración verificada usa Expo `58.0.17`, React Native `0.88.0`, React `19.3.0` y la versión preliminar `6.0.0-alpha.0` de React Native Paper.

Ejecuta estos comandos desde la raíz de la app para instalar `mobile-design` con las versiones probadas de sus dependencias.

```sh
npx expo install expo-font@58.0.10 expo-image@58.0.16 \
  react-native-gesture-handler@3.3.0 react-native-reanimated@4.7.1 \
  react-native-worklets@0.13.0 react-native-safe-area-context@5.10.1 \
  react-native-svg@15.16.0
npm install mobile-design react-native-paper@6.0.0-alpha.0 @gorhom/bottom-sheet@5.2.14
```

Para React Native Web, configura `expo.web.bundler` como `"metro"` en `app.json` o su equivalente en la configuración dinámica. Instala las dependencias del navegador antes de iniciar Expo.

```sh
npx expo install react-dom@19.3.0 react-native-web@0.21.4 @expo/metro-runtime@58.0.17
npx expo start --web
```

`mobile-design` instala `@mobile-design/tokens` como dependencia e incluye Roboto y los símbolos MD3 que necesitan los componentes. Con estas versiones se verificaron TypeScript, la exportación de Metro en Android, iOS y web, y el renderizado de fuentes y símbolos en Chromium con dependencias públicas.

### Para qué sirve cada dependencia

Los *peers* forman parte de la configuración de la app. Los comandos anteriores fijan las versiones probadas. En una app Expo, el SDK ya determina las versiones de `react` y `react-native`.

| Paquete | Dónde se necesita | Qué aporta |
| --- | --- | --- |
| `mobile-design` | Android, iOS y web | Componentes, proveedor MD3, Roboto y los símbolos incluidos. |
| `@mobile-design/tokens` | Se instala con `mobile-design` | Paletas clara y oscura, tamaños, tipografía y movimiento. Se puede instalar solo si tu app consume únicamente los valores. |
| `expo` | App Expo o proyecto React Native con módulos Expo configurados | Integra los módulos Expo como fuentes e imágenes. Metro procesa el TypeScript que distribuye el paquete. |
| `react` | Peer común | Estado, hooks y composición de componentes. |
| `react-native` | Peer común | Vistas, estilos, accesibilidad y eventos. En web, Metro resuelve los hosts mediante React Native Web. |
| `react-native-paper` | Peer común | Tema base, iconos por nombre, dirección de lectura, portal y primitivas como `Avatar` y `TouchableRipple`. |
| `expo-font` | Peer común | Registra Roboto y la fuente de símbolos. También carga las familias que aporta tu app. |
| `expo-image` | Peer común | Renderiza las imágenes de `Carousel` y `FullScreenCarousel`. |
| `react-native-gesture-handler` | Peer común | Gestos de arrastre y desplazamiento en hojas, sliders, listas y otros controles. Monta `GestureHandlerRootView` en la raíz. |
| `react-native-reanimated` | Peer común | Valores compartidos, transiciones de estado y animaciones de los componentes. |
| `react-native-worklets` | Peer común | Ejecuta callbacks de gestos y animación en UI y comunica resultados al estado de React. |
| `react-native-safe-area-context` | Peer común | Proporciona los bordes seguros para barras y superficies superpuestas. Monta `SafeAreaProvider` en la raíz. |
| `react-native-svg` | Peer común | Dibuja indicadores de progreso y las rutas SVG de símbolos disponibles antes de cargar la fuente. |
| `@gorhom/bottom-sheet` | Peer común | Motor de `BottomSheet` y sus listas, scroll y campos de texto coordinados con el teclado. |
| `react-dom` | Peer de web | Monta el árbol de React en el DOM. |
| `react-native-web` | Peer de web | Traduce las primitivas React Native a elementos y eventos del navegador. |
| `@expo/metro-runtime` | App Expo con Metro en web | Runtime para los bundles web de Expo. Se instala en la app. |
| `@mobile-design/icons` | Opcional en las tres plataformas | Catálogo completo de Material Symbols Rounded. Instala la versión que corresponda a `mobile-design`. |
| `@expo/vector-icons` | Opcional en las tres plataformas | Proveedor alternativo si tu app elige, por ejemplo, Ionicons. |

### Elegir la entrada del paquete

| Entrada | Cuándo usarla |
| --- | --- |
| `mobile-design/react-native` | Android e iOS. |
| `mobile-design/react-native-web` | React Native Web. |
| `@mobile-design/tokens` | Medidas, interlineado, estados y resortes en código propio. |
| `@mobile-design/tokens/colors` | Roles de color claros y oscuros ya generados. |
| `@mobile-design/icons/react-native` y `@mobile-design/icons/react-native-web` | Colección completa de iconos, instalable por separado. |

Las dos entradas de componentes ofrecen la misma API. En un proyecto multiplataforma puedes elegir la entrada con un módulo `.ts` para nativo y otro `.web.ts` para navegador. La guía de cada paquete profundiza en sus datos y opciones. [Tokens](https://www.npmjs.com/package/@mobile-design/tokens) · [Catálogo de iconos](https://www.npmjs.com/package/@mobile-design/icons)

Si mantienes una sola pantalla para las dos plataformas, crea `ui.ts` junto a `ui.web.ts` y desde la pantalla importa los componentes desde `./ui`. Exporta solo lo que necesite tu app.

`ui.ts`

```ts
export { Button, MobileDesignProvider, TextField } from 'mobile-design/react-native';
```

`ui.web.ts`

```ts
export { Button, MobileDesignProvider, TextField } from 'mobile-design/react-native-web';
```

## Primer componente

Usa `mobile-design/react-native` en Android e iOS y `mobile-design/react-native-web` en el navegador. Monta la app dentro de `GestureHandlerRootView`, `SafeAreaProvider` y `MobileDesignProvider`.

```tsx
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, MobileDesignProvider, TextField } from 'mobile-design/react-native';

export default function App() {
    const [name, setName] = useState('');

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <MobileDesignProvider>
                    <TextField label="Nombre" value={name} onChangeText={setName} />
                    <Button variant="filled" onPress={() => setName('')}>
                        Limpiar
                    </Button>
                </MobileDesignProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
```

`TextField` es controlado. El estado `name` es la fuente del valor, `onChangeText` recibe el nuevo texto y `Button.onPress` lo limpia. Puedes pegar este ejemplo en `App.tsx` y cambiar el import a `mobile-design/react-native-web` para el navegador.

## Configurar el proveedor

Monta un `MobileDesignProvider` en la raíz para compartir el tema, la dirección de lectura y los portales. `GestureHandlerRootView` da soporte a los gestos y `SafeAreaProvider` permite a las barras y hojas respetar los bordes de la pantalla. Mantén ambos por fuera del proveedor.

| Propiedad | Valores y comportamiento | Ejemplo |
| --- | --- | --- |
| `children` | Pantallas y componentes que consumen el tema y el host de `Portal`. | `<MobileDesignProvider><Button>Guardar</Button></MobileDesignProvider>` |
| `colorScheme` | `'light'` o `'dark'`. Si se omite, el proveedor sigue el esquema del sistema y usa claro cuando el sistema no declara modo oscuro. | `colorScheme="dark"` para una vista previa fija. |
| `theme` | Tema parcial de Paper. Fusiona por rol objetos como `colors`, `fonts`, `shapes`, `elevation` y `motion`. `theme.dark` explícito prevalece sobre `colorScheme`. | `theme={{ fonts: { titleLarge: { fontWeight: '700' } } }}` para enfatizar los títulos grandes. |
| `fontFamily` | Nombre de una familia registrada. Por defecto usa `'Roboto'`. Aplica la familia a la escala tipográfica y puedes ajustar un estilo concreto con `theme.fonts`. | `fontFamily="Inter"` después de registrar Inter. |
| `languageHeight` | `'small'`, `'medium'`, `'large'` o `'extraLarge'`. El valor inicial es `'small'`. Cambia el interlineado de los estilos MD3 base y enfatizados. | `languageHeight="large"` para texto que requiera más altura de línea. |
| `motion` | `'expressive'` o `'standard'`. El valor inicial es `'expressive'`. Selecciona el perfil de los resortes espaciales. | `motion="standard"` para usar el perfil espacial estándar. |
| `reduceMotion` | `'auto'`, `'on'` u `'off'`. El valor inicial es `'auto'` y sigue la preferencia del sistema. | `reduceMotion="on"` para habilitar la reducción en una vista previa. |
| `direction` | `'ltr'` o `'rtl'`. Si se omite, Paper usa la dirección del entorno. | `direction="rtl"` para una interfaz en árabe. |
| `settings.icon` | Renderizador para iconos pedidos por nombre. Por defecto usa los Material Symbols del paquete base. | `settings={{ icon: renderMaterialIcon }}` con el renderizador de la colección opcional. |
| `settings.rippleEffectEnabled` | Habilita el ripple en los controles que consultan este ajuste. Paper lo habilita de forma predeterminada. | `settings={{ rippleEffectEnabled: false }}` para desactivar el efecto en esos controles. |

El proveedor carga las fuentes predeterminadas que necesita el tema o el renderizador elegido. Antes de la primera carga completa puede mostrar el árbol vacío. Registra las caras y pesos de una fuente personalizada en tu app con `expo-font` antes de pasar su `fontFamily`.

`createMobileDesignTheme(options)` permite construir el mismo tema fuera de un componente. Sus opciones son `colorScheme`, `theme`, `fontFamily`, `motion` y `languageHeight`. La función directa usa claro si omites `colorScheme`. `useMobileTheme()` lee el tema de la pantalla actual. `useMobileTheme(overrides)` permite fusionar ajustes para el componente que llama al hook.

## Temas y colores

### Elegir roles para la interfaz

La paleta instalada es MD3 Baseline. El preset `md3-baseline` incluye 58 roles por modo y conserva `#6750A4` como referencia de origen. Cambiar a oscuro selecciona otro conjunto completo de roles. Por ejemplo, `primary` es `#6750A4` en claro y `#D0BCFF` en oscuro.

| Roles | Uso |
| --- | --- |
| `primary`, `onPrimary` | Fondo de acción principal y color de texto o icono encima. |
| `primaryContainer`, `onPrimaryContainer` | Superficie de énfasis de la familia principal y su contenido. |
| `secondary*`, `tertiary*` | Acentos secundarios y terciarios, con sus respectivos pares `on…`. |
| `surface`, `onSurface`, `onSurfaceVariant` | Fondo de pantalla y contenidos de énfasis alto o secundario. |
| `surfaceContainerLowest` a `surfaceContainerHighest` | Niveles de superficie para diferenciar tarjetas, paneles y regiones. |
| `outline`, `outlineVariant` | Bordes y separadores con dos niveles de énfasis. |
| `error`, `onError`, `errorContainer`, `onErrorContainer` | Estados de error y sus colores de contenido. |
| `inverseSurface`, `inverseOnSurface`, `inversePrimary` | Superficie, contenido y acento de regiones con contraste invertido. |
| `elevation.level0` a `elevation.level5` | Roles anidados de elevación en el tema de los componentes. |

Los roles `on…` son colores para el contenido que va encima de su fondo correspondiente. Usa el par previsto y revisa su contraste en claro y oscuro. [Roles de color de Material Design](https://m3.material.io/styles/color/the-color-system/)

### Personalizar un tema claro y oscuro

Pasa los roles que cambian mediante `theme.colors`. El proveedor conserva los demás roles del modo elegido. Cambiar `primary` por sí solo no calcula `onPrimary`, los contenedores ni el modo oscuro.

```tsx
import { useColorScheme, View } from 'react-native';
import {
    Button,
    MobileDesignProvider,
    Text,
    useMobileTheme,
    type MobileDesignTheme,
} from 'mobile-design/react-native';

const brandColors = {
    light: {
        primary: '#005AC1',
        onPrimary: '#FFFFFF',
        primaryContainer: '#D8E2FF',
        onPrimaryContainer: '#001A41',
    },
    dark: {
        primary: '#ADC6FF',
        onPrimary: '#002E69',
        primaryContainer: '#004494',
        onPrimaryContainer: '#D8E2FF',
    },
} satisfies Record<'light' | 'dark', Partial<MobileDesignTheme['colors']>>;

function Content() {
    const { colors } = useMobileTheme();
    return (
        <View style={{ flex: 1, backgroundColor: colors.surface, padding: 16, gap: 12 }}>
            <Text variant="titleLarge" style={{ color: colors.onSurface }}>
                Preferencias
            </Text>
            <Button variant="filled" onPress={() => {}}>Guardar</Button>
        </View>
    );
}

export default function BrandTheme() {
    const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
    return (
        <MobileDesignProvider
            colorScheme={mode}
            theme={{ colors: brandColors[mode], fonts: { titleLarge: { fontWeight: '700' } } }}
            motion="standard"
        >
            <Content />
        </MobileDesignProvider>
    );
}
```

Usa `BrandTheme` en el lugar que ocupa `MobileDesignProvider` en el primer ejemplo, dentro de los dos proveedores raíz. Para fijar un modo en una pantalla de configuración, puedes sustituir `useColorScheme()` por la preferencia guardada por tu app.

### Aplicar una paleta creada desde un color semilla

El paquete npm trae las paletas ya calculadas. Su API aplica roles y combina temas. La generación de una paleta a partir de un hex, una foto o el fondo de pantalla se realiza fuera de esa API.

1. Elige un color de origen en [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/) y obtén los esquemas claro y oscuro.
2. Guarda los roles de cada modo en la app con nombres como `primary`, `onPrimary` y `surfaceContainer`. Completa los roles adicionales con la base de `@mobile-design/tokens/colors`.
3. Si partes del formato plano de tokens, llama a `createMobileDesignColors(roles)` antes de pasar los colores al tema. El adaptador reúne los seis roles `elevationLevel0` a `elevationLevel5` bajo `colors.elevation`. Si ya tienes los roles con la estructura de `theme.colors`, pásalos directamente.

El ejemplo toma los cuatro roles primarios por modo que devuelve el generador del workspace para la semilla `#246B57` y conserva la base para los demás roles. Para aplicar una marca a toda la paleta, sustituye los mapas completos `light` y `dark` por los generados para esa marca.

```ts
import materialColors from '@mobile-design/tokens/colors';
import { createMobileDesignColors, createMobileDesignTheme } from 'mobile-design/react-native';

const brandPrimaryRoles = {
    light: {
        primary: '#006B54',
        onPrimary: '#FFFFFF',
        primaryContainer: '#80F8D2',
        onPrimaryContainer: '#002118',
    },
    dark: {
        primary: '#61DBB7',
        onPrimary: '#00382B',
        primaryContainer: '#00513F',
        onPrimaryContainer: '#80F8D2',
    },
};

export function createBrandTheme(mode: 'light' | 'dark') {
    const roles = { ...materialColors.appColorTokens[mode], ...brandPrimaryRoles[mode] };
    return createMobileDesignTheme({
        colorScheme: mode,
        theme: { colors: createMobileDesignColors(roles) },
    });
}
```

Pasa `theme={createBrandTheme(mode)}` al proveedor, donde `mode` viene del sistema o de la preferencia guardada por tu app. Para ofrecer varios temas de marca, conserva un mapa de roles por marca y modo y usa la marca activa al construir el tema. `createMobileDesignColors` adapta roles existentes y espera un registro completo de tokens. En particular, `surfaceDisabled`, `onSurfaceDisabled` y `backdrop` son roles planos de compatibilidad que el adaptador de Paper no incorpora.

En el workspace de desarrollo existe el comando `pnpm theme:generate '#246B57'`. Genera las dos paletas mediante Material Color Utilities y escribe el módulo de colores y sus tipos dentro de @mobile-design/tokens. `pnpm theme:generate md3-baseline` restaura la paleta MD3 publicada y `pnpm theme:generate neutral` genera el preset neutro. Estos comandos corresponden al código fuente del workspace. En una app que instala el paquete usa los roles de tokens, el exportador externo y las APIs de tema anteriores.

## Tipografía e iconos

Roboto es la tipografía predeterminada. El proveedor usa un subconjunto de Material Symbols Rounded que cubre los controles y ejemplos de integración. El proveedor carga las fuentes predeterminadas que utiliza el tema o el renderizador activo. Para elegir otra tipografía, registra su familia y los pesos que utilices en tu app y pasa, por ejemplo, `fontFamily="Inter"`.

Agrupa las caras de una misma familia para que Expo pueda elegir el peso correcto. Coloca los archivos de tu fuente en la app y adapta las rutas del ejemplo. Monta `CustomTypeface` en el lugar que ocupa el proveedor en el primer ejemplo.

```tsx
import { useFonts } from 'expo-font';
import { MobileDesignProvider, Text } from 'mobile-design/react-native';

const fonts = [
    {
        fontFamily: 'Inter',
        fontDefinitions: [
            { path: require('./assets/fonts/Inter-Regular.ttf'), weight: 400 },
            { path: require('./assets/fonts/Inter-Bold.ttf'), weight: 700 },
        ],
    },
] satisfies Parameters<typeof useFonts>[0];

export function CustomTypeface() {
    const [ready, error] = useFonts(fonts);
    if (error) throw error;
    if (!ready) return null;

    return (
        <MobileDesignProvider fontFamily="Inter">
            <Text variant="bodyLarge">Contenido</Text>
            <Text variant="titleLarge" style={{ fontWeight: '700' }}>Encabezado</Text>
        </MobileDesignProvider>
    );
}
```

Para cambiar los iconos por nombre en toda la app, pasa `settings={{ icon: renderIcon }}` al proveedor. Tu renderizador recibe `name`, `size`, `color`, `direction` y `testID`. Traduce los nombres que usan los componentes a los de tu conjunto. Por ejemplo, Paper envía `magnify` y `check`, que en Ionicons se llaman `search` y `checkmark`. La app instala el conjunto que elija.

Si quieres usar la colección completa, instala `@mobile-design/icons` en la misma versión que `mobile-design`.

```sh
npm install @mobile-design/icons
```

Importa `MaterialSymbol` o `renderMaterialIcon` desde `@mobile-design/icons/react-native` en Android e iOS, o desde `@mobile-design/icons/react-native-web` en el navegador. Pasa el renderizador de esa entrada a `settings.icon` para aplicar la colección completa a los iconos por nombre. La fuente se carga al renderizar un símbolo. También puedes precargarla con `useFonts([mobileDesignSymbolsFont])` de `expo-font`.

Para cambiar el icono de un solo control, pasa una función al prop `icon`. Este ejemplo usa Ionicons. Instala su dependencia opcional con `npx expo install @expo/vector-icons`. [Catálogo de Expo](https://icons.expo.fyi/Index)

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { IconButton } from 'mobile-design/react-native';

export function CloseButton({ onClose }: { onClose: () => void }) {
    return (
        <IconButton
            accessibilityLabel="Cerrar"
            icon={({ size, color }) => <Ionicons name="close" size={size} style={{ color }} accessible={false} />}
            onPress={onClose}
        />
    );
}
```

## Referencia de componentes

Los ejemplos se montan bajo el proveedor de la instalación. Importan desde `mobile-design/react-native`. En un archivo específico del navegador, usa `mobile-design/react-native-web`.

El archivo `node_modules/mobile-design/COMPONENTS.md` amplía la tabla de cada familia, las piezas relacionadas y los ejemplos completos.

## Índice de componentes

| Familia | Fichas |
| --- | --- |
| [Acciones y botones](#acciones-y-botones) | [`Button`](#button), [`IconButton`](#iconbutton), [`ButtonGroup`](#buttongroup), [`SegmentedButtons`](#segmentedbuttons), [`SplitButton`](#splitbutton), [`FAB`](#fab), [`FAB.Extended`](#fabextended), [`FAB.Menu`](#fabmenu) |
| [Campos y selección](#campos-y-selección) | [`TextField`](#textfield), [`Select`](#select), [`Autocomplete`](#autocomplete), [`Checkbox`](#checkbox), [`RadioButton`](#radiobutton), [`Switch`](#switch), [`Slider`](#slider-y-rangeslider), [`RangeSlider`](#slider-y-rangeslider), [`DatePicker`](#datepicker-y-dockeddatepicker), [`DockedDatePicker`](#datepicker-y-dockeddatepicker), [`TimePicker`](#timepicker) |
| [Navegación y búsqueda](#navegación-y-búsqueda) | [`TopAppBar`](#topappbar), [`NavigationBar`](#navigationbar), [`NavigationRail`](#navigationrail), [`NavigationDrawer`](#navigationdrawer), [`Tabs`](#tabs-y-tabspager), [`TabsPager`](#tabs-y-tabspager), [`Searchbar`](#searchbar-y-searchview), [`SearchView`](#searchbar-y-searchview), [`Toolbar`](#toolbar) |
| [Contenido y tipografía](#contenido-y-tipografía) | [`Text`](#text), [`Badge`](#badge-y-badgedbox), [`BadgedBox`](#badge-y-badgedbox), [`Card`](#card), [`Carousel`](#carousel), [`Chip`](#chip), [`Divider`](#divider), [`List`](#list) |
| [Superficies y ayuda](#superficies-y-ayuda) | [`Menu`](#menu), [`Dialog`](#dialog-y-fullscreendialog), [`FullScreenDialog`](#dialog-y-fullscreendialog), [`BottomSheet`](#bottomsheet), [`SideSheet`](#sidesheet), [`Snackbar`](#snackbar), [`Tooltip`](#tooltip-y-richtooltip), [`RichTooltip`](#tooltip-y-richtooltip) |
| [Carga y progreso](#carga-y-progreso) | [`LoadingIndicator`](#loadingindicator-y-pulltorefresh), [`PullToRefresh`](#loadingindicator-y-pulltorefresh), [`ProgressIndicator`](#progressindicator) |

### Acciones y botones

#### Button

Ayuda a completar tareas con acciones claras. Default ejecuta una acción. Toggle representa un estado seleccionado controlado.

El estado controlado se distingue por la presencia de `selected`. Conserva `pressed` para reflejar una superficie anclada que sigue abierta. En web puedes proporcionar `href` y `hrefAttrs` para obtener un enlace. En Android e iOS ejecuta la navegación en `onPress`.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `variant` | `"filled" \| "tonal" \| "elevated" \| "outlined" \| "text"` | `'filled'` | Tratamiento visual o modalidad del componente. |
| `size` | `"extra-small" \| "small" \| "medium" \| "large" \| "extra-large"` | `'small'` | Tamaño visual o escala semántica del control. |
| `shape` | `"round" \| "square"` | `'round'` | Forma visual de la superficie. |
| `selected` | `boolean` | — | Selección persistente controlada por el consumidor. |

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

El componente usa `mode` y `sizeClass`. `mode="contained"` aplica Filled, `contained-tonal` aplica Tonal, `outlined` aplica el contorno y omitirlo aplica Standard. El objetivo táctil no se deduce del tamaño del glifo.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `icon` · requerida | `IconSource` | — | Nombre de icono o elemento de representación admitido por la propiedad. |
| `mode` | `IconButtonMode` | — | Modo de uso admitido por este componente. |
| `sizeClass` | `ButtonSize` | `'small'` | Escala del botón, incluido el contenedor y el objetivo de interacción. |
| `widthVariant` | `"narrow" \| "default" \| "wide"` | `'default'` | Proporción del botón de icono. |

#### ButtonGroup

Reúne acciones relacionadas o alternativas de selección. Standard redistribuye el espacio al pulsar. Connected mantiene el grupo unido.

Cada ítem puede tener `icon`. Con `showSelectedIcon`, el ítem seleccionado muestra una marca de verificación. `maxVisibleItems` limita cuántos se muestran y el resto aparece en el menú. Con selección múltiple el valor es un arreglo de claves.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `items` · requerida | `readonly ButtonGroupItem[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. |
| `value` | `string \| readonly string[]` | — | Valor actual controlado por la pantalla. |
| `onValueChange` | `((value: string \| string[]) => void)` | — | Entrega el siguiente valor para actualizar el estado del consumidor. |
| `variant` | `"standard" \| "connected"` | `'standard'` | Tratamiento visual o modalidad del componente. |

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

Usa opciones con valores únicos y el mismo tratamiento visual para etiquetas e iconos.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `buttons` · requerida | `SegmentedButtonOption<T>[]` | — | Opciones de segmentación con claves únicas. |
| `value` · requerida | `T \| T[]` | — | Valor actual controlado por la pantalla. |
| `onValueChange` · requerida | `((value: T) => void) \| ((value: T[]) => void)` | — | Entrega el siguiente valor para actualizar el estado del consumidor. |
| `multiSelect` | `boolean` | — | Permite seleccionar varios valores y usar un arreglo de claves. |

#### SplitButton

Combina una acción directa con un menú de opciones relacionadas. Cada región conserva su función independiente.

Define label, icon opcional y onPress para el comando principal. Las actions contienen alternativas relacionadas con key, label y onPress.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. |
| `actions` · requerida | `readonly SplitButtonAction[]` | — | Acciones relacionadas de la composición. |
| `onPress` · requerida | `() => void` | — | Ejecuta la acción al activar el control. |
| `expanded` | `boolean` | — | Estado controlado de expansión. |

#### FAB

Da presencia a la acción principal de la pantalla mediante una superficie flotante y un único icono.

Define icon, accessibilityLabel y onPress para la acción principal. MaterialSymbol permite elegir el relleno del glifo.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `icon` · requerida | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. |
| `size` | `FABSize` | `'default'` | Tamaño visual o escala semántica del control. |
| `variant` | `"primary" \| "secondary" \| "tertiary" \| "tonalPrimary" \| "tonalSecondary" \| "tonalTertiary"` | `'tonalPrimary'` | Tratamiento visual o modalidad del componente. |
| `visible` | `boolean` | — | Controla si la superficie o el indicador se presenta. |

#### FAB.Extended

Destaca la acción principal de una pantalla con una etiqueta que permite entenderla antes de tocar.

Usa FAB.Extended o ExtendedFAB con label e icon opcional. Size default corresponde al tamaño Small.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. |
| `icon` | `any` | — | Nombre de icono o elemento de representación admitido por la propiedad. |
| `size` | `FABSize` | `'default'` | Tamaño visual o escala semántica del control. |
| `variant` | `"primary" \| "secondary" \| "tertiary" \| "tonalPrimary" \| "tonalSecondary" \| "tonalTertiary"` | `'tonalPrimary'` | Tratamiento visual o modalidad del componente. |

#### FAB.Menu

Expande el FAB para mostrar un conjunto de acciones relacionadas con la tarea principal de la pantalla.

Controla expanded y ciérralo desde onDismiss. Trigger define el FAB y su nombre accesible.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `trigger` · requerida | `FABMenuTriggerProps` | — | Configuración de la acción que abre el menú flotante. |
| `items` · requerida | `TwoToSix<FABMenuItemProps> \| readonly FABMenuItemProps[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. |
| `expanded` · requerida | `boolean` | — | Estado controlado de expansión. |
| `onDismiss` · requerida | `() => void` | — | Solicita cerrar la superficie. |

### Campos y selección

#### TextField

Recoge información mediante campos Filled u Outlined, con etiquetas, ayuda y errores asociados.

El contador muestra la longitud. `maxLength` establece el límite. El ref `TextFieldHandle` ofrece `focus`, `blur`, `clear` e `isFocused`. Para un área de texto de altura fija combina `multiline`, `autoGrow={false}` e `inputStyle` con una altura.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. |
| `onChangeText` · requerida | `(value: string) => void` | — | Comunica el nuevo texto para actualizar el valor controlado. |
| `variant` | `"filled" \| "outlined"` | — | Tratamiento visual o modalidad del componente. |
| `error` | `boolean` | — | Activa el tratamiento visual y accesible de error. |

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

#### Select

Select es una extensión de Mobile Design para elegir una opción fija en un formulario.

Las opciones tienen `value` único y `label`. Puedes añadir `description`, `icon` y `disabled`. `Select` devuelve el identificador elegido, conserva el valor al cancelar y no abre un teclado de texto.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. |
| `value` · requerida | `string` | — | Identificador de la opción seleccionada o cadena vacía mientras no haya elección. |
| `options` · requerida | `readonly ChoiceOption[]` | — | Opciones con identificador, etiqueta y disponibilidad. |
| `onValueChange` · requerida | `(value: string) => void` | — | Entrega el identificador `value` de la opción confirmada. |

#### Autocomplete

Autocomplete es una extensión de Mobile Design que muestra sugerencias a medida que se escribe.

El campo admite texto libre. Tras confirmar una sugerencia, `onValueChange` recibe su etiqueta y `onSelect` la opción completa. Guarda por separado su `value` si el formulario necesita el identificador.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `label` · requerida | `string` | — | Etiqueta visible que describe la acción u opción. |
| `value` · requerida | `string` | — | Texto controlado del campo, que puede contener una etiqueta o una consulta libre. |
| `options` · requerida | `readonly ChoiceOption[]` | — | Opciones con identificador, etiqueta y disponibilidad. |
| `onValueChange` · requerida | `(value: string) => void` | — | Entrega lo que se escribe y la etiqueta al seleccionar una sugerencia. |

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

Controla status con checked, unchecked o indeterminate.

En `Checkbox.Item`, pasa `label`, `status` y `onPress` para hacer interactiva toda la fila. Configura `position` para colocar el indicador a la izquierda o la derecha.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `status` · requerida | `"checked" \| "unchecked" \| "indeterminate"` | — | Estado actual del control. |
| `onPress` | `(((event: GestureResponderEvent) => unknown) & ((e: GestureResponderEvent) => void) & ((e: GestureResponderEvent) => void))` | — | Ejecuta la acción al activar el control. |
| `color` | `ColorValue` | — | Color del elemento o trazo. |
| `disabled` | `boolean` | — | Bloquea la interacción del control. |

#### RadioButton

Permite seleccionar una opción de un conjunto. Elegir otra reemplaza la selección anterior.

`RadioButton.Group` recibe `value` y `onValueChange`. Cada `RadioButton.Item` aporta un `value` único, `label` y `disabled` si corresponde.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `value` · requerida | `string` | — | Clave de la opción dentro de su grupo. |
| `status` | `"checked" \| "unchecked"` | — | Estado actual del control. |
| `onPress` | `((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. |
| `disabled` | `boolean` | — | Bloquea la interacción del control. |

#### Switch

Activa o desactiva una configuración binaria mediante un track y un handle que expresan el estado.

Controla value y actualízalo desde onValueChange. Aplica el ajuste al activarlo. No añadas Guardar ni una confirmación diferida.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `value` | `boolean` | `false` | Estado booleano de la configuración. |
| `onValueChange` | `((value: boolean) => void)` | — | Entrega el siguiente valor para actualizar el estado del consumidor. |
| `checkedIcon` | `any` | — | Icono de un interruptor activado. |
| `uncheckedIcon` | `any` | — | Icono de un interruptor desactivado. |

#### Slider y RangeSlider

Permite recorrer un intervalo con control continuo o discreto, en una o dos posiciones.

Publica una vista previa con `onValueChange` y confirma en `onSlidingComplete`. `onSlidingCancel` permite descartar el borrador. En el rango, usa una etiqueta diferente por cada extremo.

`RangeSlider` recibe la tupla `[mínimo, máximo]`. Usa `minimumRange` para impedir que ambos extremos se junten y `startAccessibilityLabel` y `endAccessibilityLabel` para distinguirlos.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `value` · requerida | `number` | — | Posición actual del control dentro de los límites configurados. |
| `onValueChange` · requerida | `(value: number) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. |
| `onSlidingComplete` | `((value: number) => void)` | — | Recibe el valor confirmado al terminar el gesto. |
| `minimumValue` | `number` | — | Extremo inferior del intervalo. |

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

#### DatePicker y DockedDatePicker

Permite elegir días mediante calendario, entrada manual o un selector anclado al campo.

En modo simple el valor confirmado es un `Date`. En rango usa un objeto `DateRange` con `start` y `end`. Conviene tratar los días como fechas del calendario local y decidir explícitamente cómo se guardan. El callback de cambio recibe el resultado confirmado.

`DockedDatePicker` usa un campo anclado. Define su `label` y conserva el valor elegido con `value` y `onChange`.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `value` | `Date \| DateRange` | — | Valor actual controlado por la pantalla. |
| `mode` | `"single" \| "range"` | — | Elige entre `single` y `range`. |
| `onChange` · requerida | `((date: Date) => void) \| ((range: DateRange) => void)` | — | Entrega el día o el rango confirmado, según el modo. |
| `onDismiss` · requerida | `() => void` | — | Solicita cerrar la superficie. |

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

#### TimePicker

Selecciona hora y minutos en formato de 12 o 24 horas, con un borrador que se confirma explícitamente.

El objeto `TimeValue` siempre usa `hours` de 0 a 23 y `minutes` de 0 a 59. `is24Hour` modifica la presentación. Cierra o confirma desde los callbacks y guarda el valor confirmado en el estado de la pantalla.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `value` · requerida | `TimeValue` | — | Valor actual controlado por la pantalla. |
| `visible` · requerida | `boolean` | — | Controla si la superficie o el indicador se presenta. |
| `onConfirm` · requerida | `(value: TimeValue) => void` | — | Entrega el borrador validado al confirmar. |
| `onDismiss` · requerida | `() => void` | — | Solicita cerrar la superficie. |

### Navegación y búsqueda

#### TopAppBar

Ofrece contexto, navegación y acciones relacionadas con la pantalla. Las barras flexibles responden al desplazamiento del contenido.

Elige variant y proporciona title. Subtitle, navigationIcon y actions completan la anatomía.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `title` · requerida | `ReactNode` | — | Título visible o contenido principal. |
| `variant` | `"small" \| "medium-flexible" \| "large-flexible"` | `'small'` | Tratamiento visual o modalidad del componente. |
| `actions` | `readonly TopAppBarAction[]` | `[]` | Acciones relacionadas de la composición. |
| `navigationIcon` | `any` | — | Icono de navegación al inicio de la barra. |

#### NavigationBar

Permite cambiar entre destinos principales de una interfaz compacta con iconos, etiquetas e indicadores.

La barra reporta claves de destino. La pantalla decide qué ruta abrir, qué destino está activo y dónde anclar el conjunto. Si la pantalla ya incorpora el inset inferior, configura `safeArea={false}`.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `items` · requerida | `readonly NavigationDestination[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. |
| `onValueChange` · requerida | `(key: string) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. |
| `variant` | `"standard" \| "short"` | `'short'` | Tratamiento visual o modalidad del componente. |

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

Controla `expanded` para cambiar de ancho sin reiniciar el destino. La pantalla decide el breakpoint. El modal puede compartir los mismos `items` y `value` con la variante persistente.

`NavigationRailModal` recibe `open`, `onOpenChange`, `items`, `value` y `onValueChange`.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `items` · requerida | `readonly (NavigationDestination & { href?: string; })[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. |
| `onValueChange` · requerida | `(key: string) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. |
| `expanded` | `boolean` | `false` | Estado controlado de expansión. |

#### NavigationDrawer

Organiza destinos y secciones en un panel lateral estándar o modal.

La vista estándar comparte espacio con el contenido. La modal superpone el panel y cierra al seleccionar por defecto. Usa el callback de cierre completo si el nuevo destino requiere recibir foco.

`NavigationDrawerModal` controla su apertura con `open` y `onOpenChange`. `NavigationDrawerItem` recibe un objeto `item` y permite controlar su selección.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `items` · requerida | `readonly NavigationDrawerDestination[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. |
| `onValueChange` · requerida | `(key: string) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. |
| `modal` | `boolean` | `false` | Activa la composición modal del panel. |

#### Tabs y TabsPager

Organiza contenido del mismo nivel mediante pestañas Primary o Secondary y un indicador de selección.

Para deslizar entre paneles comparte `value`, `position` y la solicitud de selección entre `Tabs` y `TabsPager`. Si gestionas los paneles por tu cuenta, enlaza el `nativeID` de la pestaña y el `panelID` del panel.

`TabsPager` monta cada vista con `renderPage` y permite deslizar con `swipeEnabled`. Conserva las mismas claves y orden de `items` que en `Tabs`.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `items` · requerida | `readonly TabItem[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. |
| `onValueChange` · requerida | `(key: string) => void` | — | Entrega el siguiente valor para actualizar el estado del consumidor. |
| `variant` | `"primary" \| "secondary"` | `'primary'` | Tratamiento visual o modalidad del componente. |

#### Searchbar y SearchView

Conecta una barra de búsqueda con una vista que presenta consulta, sugerencias y resultados.

El filtrado y la obtención de resultados pertenecen al consumidor. Si las sugerencias llegan de un servicio, descarta respuestas de consultas anteriores. `SearchTrigger` y `SearchIconButton` ayudan a construir el punto de entrada y sus acciones.

`SearchView` recibe `open`, `onOpenChange`, `value`, `onChangeText` y `onSearch`. Pasa `results` y usa `onResultPress` para abrir un resultado.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `value` · requerida | `string` | — | Valor actual controlado por la pantalla. |
| `onChangeText` | `(((text: string) => unknown) & ((query: string) => void))` | — | Comunica el nuevo texto para actualizar el valor controlado. |
| `onIconPress` | `((e: GestureResponderEvent) => void)` | — | Acción del icono independiente. |
| `right` | `((props: { color: ColorValue; style: Style; testID: string; }) => React.ReactNode)` | — | Contenido del lado final. |

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

#### Toolbar

Agrupa acciones de edición o contexto en barras Docked o Floating, horizontales o verticales.

Cada acción usa `key`, `icon`, `label` y `onPress`. Usa `selected` para una selección persistente.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `actions` · requerida | `readonly ToolbarAction[]` | — | Acciones relacionadas de la composición. |
| `variant` | `"docked" \| "floating"` | `'docked'` | Tratamiento visual o modalidad del componente. |
| `orientation` | `"horizontal" \| "vertical"` | `'horizontal'` | Eje de la composición. |
| `expanded` | `boolean` | `true` | Estado controlado de expansión. |

### Contenido y tipografía

#### Text

Aplica la escala tipográfica del tema a contenido, etiquetas y títulos. Los roles de texto conservan sus métricas al cambiar la familia en el proveedor.

Combina `display`, `headline`, `title`, `body` o `label` con `Large`, `Medium` o `Small`. Agrega `Emphasized` para enfatizar el mismo rol.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `variant` | `TextVariant` | — | Rol tipográfico del tema. |
| `numberOfLines` | `number` | — | Truncate text with an ellipsis after this many lines. `0` means no restriction. |
| `selectable` | `boolean` | — | Lets the user select text for native copy and paste. |
| `style` | `((false \| void \| "" \| Readonly<Partial<TextStyle>> \| readonly StyleProp<Readonly<Partial<TextStyle>>>[]) & (false \| void \| "" \| TextStyle \| readonly StyleProp<TextStyle>[])) \| null` | — | Estilo de la superficie exterior. |

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

`BadgedBox` ancla `badge` al elemento hijo. Usa `true` para un punto, un número para un contador, o texto para una etiqueta breve. Ajusta la posición con `badgeContainerStyle`.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Contenido breve de una insignia de tipo `large`. |
| `variant` | `"large" \| "dot"` | — | Tratamiento visual o modalidad del componente. |
| `size` | `number` | — | Tamaño visual o escala semántica del control. |
| `maximum` | `number` | `999` | A partir de este límite un número se muestra con sufijo `+`. |

#### Card

Agrupa contenido y acciones que pertenecen a una misma entidad, con tratamientos Elevated, Filled u Outlined.

Compón el contenido con `Card.Title`, `Card.Content`, `Card.Cover` y `Card.Actions`. Si toda la tarjeta abre un destino, reserva sus hijos para contenido de presentación. Si tiene varias acciones, coloca los controles dentro de `Card.Actions` y deja la superficie como contenedor.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `variant` | `"filled" \| "elevated" \| "outlined"` | — | Tratamiento visual o modalidad del componente. |
| `mode` | `"elevated" \| "outlined" \| "contained"` | `'elevated'` | Modo de uso admitido por este componente. |
| `onPress` | `((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. |
| `disabled` | `boolean` | `false` | Bloquea la interacción del control. |

#### Carousel

Muestra colecciones visuales en las variantes de la referencia y en Vertical, una extensión propia de Mobile Design para galerías de distintas proporciones.

Cada elemento usa un `id` estable. `aspectRatio` es ancho dividido entre alto. `onIndexChange` observa el índice aceptado, mientras `initialIndex` fija la posición de arranque.

`FullScreenCarousel` usa un elemento por página vertical. Pásale `items`, `initialIndex` y `onIndexChange` igual que a la composición principal.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `items` · requerida | `readonly CarouselItem[]` | — | Elementos del conjunto. Usa identificadores únicos y estables. |
| `variant` | `"multi-browse" \| "hero" \| "center-aligned-hero" \| "uncontained" \| "uncontained-multi-aspect" \| "full-screen" \| "vertical"` | — | Tratamiento visual o modalidad del componente. |
| `initialIndex` | `number` | — | Índice inicial al montar la colección. |
| `onIndexChange` | `((index: number) => void)` | — | Avisa del cambio de índice aceptado. |

#### Chip

Representa acciones auxiliares, filtros, datos introducidos y sugerencias en superficies compactas.

Elige variant según Assist, Filter, Input o Suggestion. Children aporta la etiqueta.

`Chip.Group` distribuye chips en filas con salto automático y coordina el foco por teclado en web. Los estados seleccionados los conserva la pantalla.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `variant` | `"filter" \| "input" \| "assist" \| "suggestion"` | `'assist'` | Tratamiento visual o modalidad del componente. |
| `selected` | `boolean` | `false` | Selección persistente controlada por el consumidor. |
| `showSelectedCheck` | `boolean` | — | Whether to display default check icon on selected chip. Note. Check will not be shown if `icon` is specified. If specified, `icon` will be shown regardless of `selected`. |
| `onPress` | `((e: GestureResponderEvent) => void)` | — | Ejecuta la acción al activar el control. |

#### Divider

Ayuda a distinguir contenido o regiones de una composición mediante una línea sutil.

Coloca Divider entre regiones. Orientation cambia el eje y thickness e insets ajustan la línea.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | `'horizontal'` | Eje de la composición. |
| `bold` | `boolean` | `true` | Usa el tratamiento más marcado del divisor. |
| `thickness` | `number` | — | Grosor del trazo en dp. |
| `leftInset` | `boolean` | — | Reserva un margen al inicio lógico de la línea horizontal. |

#### List

Presenta elementos con título, descripción y contenido de apoyo en listas Standard o Segmented.

Usa `List.Collection` para contenido agrupado y `List.Group` para filas coordinadas. `List.Icon`, `List.Image`, `List.Section` y `List.Subheader` son piezas de composición. Para una colección grande monta las filas en una lista virtualizada del consumidor.

Usa `List.Accordion` con `title`, `expanded` y `onPress`. Configura las acciones laterales con `SwipeListItem` y su grupo, y el orden editable con `ListReorderGroup`, `items`, `keyExtractor` y `onReorder`.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `title` · requerida | `ReactNode` | — | Título visible o contenido principal. |
| `description` | `ReactNode` | — | Texto secundario de apoyo. |
| `variant` | `"expressive" \| "baseline"` | `'expressive'` | Tratamiento visual o modalidad del componente. |
| `selectionMode` | `"single" \| "multiple"` | — | Define si la selección es inexistente, única o múltiple. |

### Superficies y ayuda

#### Menu

Muestra acciones o alternativas en una superficie anclada, con grupos, selección y submenús cuando hacen falta.

Controla visible y onDismiss y proporciona un anchor que abra el menú.

`Menu.Item` recibe `title`, `onPress` e iconos inicial y final. `Menu.Group` crea una sección y `Menu.Submenu` anida opciones.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `anchor` · requerida | `React.ReactNode \| { x: number; y: number; }` | — | Control o coordenadas que sirven como origen de la superficie. |
| `visible` · requerida | `boolean` | — | Controla si la superficie o el indicador se presenta. |
| `onDismiss` | `(() => void)` | — | Solicita cerrar la superficie. |
| `onClosed` | `(() => void)` | — | Avisa cuando concluye la salida de la superficie. |

#### Dialog y FullScreenDialog

Presenta información o una tarea que necesita atención antes de volver al contenido anterior.

Compón `Dialog.Title`, `Dialog.Icon`, `Dialog.Content`, `Dialog.ScrollArea` y `Dialog.Actions` según la tarea. `Dialog` ya controla su portal. Para medir un origen compartido para la animación de entrada, pasa `transitionOrigin` en las coordenadas de ventana que espera la superficie.

`FullScreenDialog` recibe `title`, `visible`, `onDismiss` y permite configurar la confirmación con `confirmLabel`, `onConfirm` y `confirmDisabled`.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `visible` · requerida | `boolean` | — | Controla si la superficie o el indicador se presenta. |
| `onDismiss` | `(() => void)` | — | Solicita cerrar la superficie. |
| `onClosed` | `(() => void)` | — | Avisa cuando concluye la salida de la superficie. |
| `dismissable` | `boolean` | `true` | Determines whether clicking outside the dialog dismiss it. |

#### BottomSheet

Presenta tareas o información de apoyo con una hoja estándar o modal y posiciones de expansión.

Monta `GestureHandlerRootView` como se muestra en el ejemplo de instalación. Usa `BottomSheetTextField` o `BottomSheetTextInput` al editar dentro de la hoja. Mantén los hijos durante la salida si su contenido debe permanecer visible hasta `onClosed`.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `open` · requerida | `boolean` | — | Controla si la superficie está abierta. |
| `onOpenChange` · requerida | `(open: boolean) => void` | — | Solicita abrir o cerrar. Actualiza `open` en la pantalla. |
| `variant` | `"standard" \| "modal"` | `'modal'` | `standard` comparte el layout y `modal` presenta una hoja superpuesta. |
| `snapPoints` | `(string \| number)[]` | — | Posiciones de reposo de la hoja. Admite puntos en dp o porcentajes según el tipo. |

#### SideSheet

Muestra una tarea complementaria desde un borde lateral, como parte del layout o en una superficie modal.

En pantallas estrechas abre la hoja modal. En una región amplia puedes montar la estándar como parte del layout. Mantén la selección o los cambios del formulario en el padre para conservarlos al cambiar de presentación.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `open` · requerida | `boolean` | — | Controla si la superficie está abierta. |
| `onOpenChange` · requerida | `(open: boolean) => void` | — | Solicita abrir o cerrar. Actualiza `open` en la pantalla. |
| `variant` | `"standard" \| "modal"` | `'modal'` | `standard` acompaña al contenido y `modal` lo superpone. |
| `edge` | `"end" \| "start"` | `'end'` | Borde lógico desde el que aparece la hoja. |

#### Snackbar

Confirma el resultado de una acción mediante un mensaje temporal y una acción opcional.

Monta un solo `Snackbar` en `Portal` bajo `MobileDesignProvider`. `messageKey` permite volver a mostrar un mensaje idéntico. Usa `bottomOffset` para reservar el espacio de un FAB o una barra inferior.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. |
| `visible` · requerida | `boolean` | — | Controla si la superficie o el indicador se presenta. |
| `onDismiss` · requerida | `() => void` | — | Solicita cerrar la superficie. |
| `action` | `(Omit<ButtonProps, "children" \| "variant"> & { label: string; })` | — | Configuración de la acción de texto. |

#### Tooltip y RichTooltip

Aclara el propósito de un control mediante una ayuda Plain o aporta contenido y acciones con Rich tooltip.

Usa `Tooltip` para explicar un control y `RichTooltip` para un contenido que incluye título o acciones. `persistent` cambia la forma de apertura de la ayuda rica. Conserva una etiqueta accesible en el control aunque tenga tooltip.

`Tooltip` necesita `title` y un elemento hijo que sirve de ancla. Usa `RichTooltip` cuando debas incluir contenido o acciones.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `anchor` · requerida | `ReactNode` | — | Control o coordenadas que sirven como origen de la superficie. |
| `visible` | `boolean` | — | Controla si la superficie o el indicador se presenta. |
| `children` · requerida | `ReactNode` | — | Contenido que se compone dentro del componente. |
| `title` | `string` | — | Título visible o contenido principal. |

### Carga y progreso

#### LoadingIndicator y PullToRefresh

Comunica trabajo indeterminado mediante una secuencia de formas que cambia continuamente.

Centra el indicador dentro de la región que está cargando. `animating={false}` pausa el movimiento y `visible={false}` oculta la figura. Usa un indicador de progreso si la tarea informa un porcentaje.

`PullToRefresh` envuelve el contenido desplazable. Controla `refreshing`, ejecuta la actualización en `onRefresh` y configura `threshold` cuando necesites ajustar la distancia de arrastre.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `variant` | `"contained" \| "uncontained"` | `'uncontained'` | Tratamiento visual o modalidad del componente. |
| `visible` | `boolean` | `true` | Controla si la superficie o el indicador se presenta. |
| `animating` | `boolean` | `true` | Controla si el indicador cambia de forma o gira. |
| `size` | `number` | `48` | Tamaño visual o escala semántica del control. |

#### ProgressIndicator

Comunica progreso determinado o indeterminado con indicadores lineales y circulares, planos u ondulados.

Elige `progress` de 0 a 1 cuando conoces el avance. Si usas `progressSource` para animarlo en UI, publica también hitos accesibles con `progress`. Si no entregas ninguno, el indicador es indeterminado.

`CircularProgressStatus` comunica los estados `progress` y `success`. `ProgressBar` ofrece avance lineal, y `ActivityIndicator` una indicación circular de actividad.

| Propiedad | Tipo | Inicial | Uso |
| --- | --- | --- | --- |
| `variant` | `"circular" \| "linear"` | `'linear'` | Tratamiento visual o modalidad del componente. |
| `progress` | `number` | — | Fracción de avance determinada de 0 a 1. |
| `progressSource` | `SharedValue<number>` | — | Valor compartido que conduce el avance visual en el hilo UI. |
| `appearance` | `"flat" \| "wavy"` | `'flat'` | Tratamiento plano u ondulado del indicador. |

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

### Primitivas de composición

| Exportación | Uso |
| --- | --- |
| `Icon` y `MaterialSymbol` | Renderiza iconos por nombre o solicita explícitamente un glifo del conjunto incluido. El catálogo completo se instala por separado. |
| `TouchableRipple` | Compone una superficie interactiva con respuesta de pulsación. Pasa una acción y un nombre accesible cuando el contenido no tenga etiqueta. |
| `Avatar.Icon`, `Avatar.Image`, `Avatar.Text` y `Avatar.Button` | Usa `icon`, `source` o `label` para el avatar visual. Envuelve el avatar en `Avatar.Button` con `onPress` y `accessibilityLabel` para abrir un perfil o menú. |
| `Portal` | Presenta contenido por encima del layout del padre dentro del mismo proveedor. Las superficies que ya crean su propia ventana o portal no necesitan envolverse para repetir ese comportamiento. |
| `ContainerTransformSurface` | Superficie para las composiciones que conservan un origen medido durante su transición. |
| `ThemeProvider`, `LocaleProvider`, `useLocale` y `customText` | Primitivas de integración de React Native Paper para tema local, dirección de lectura y variantes de texto personalizadas. |
| `mobileDesignCatalog`, `mobileDesignCatalogGroups` y `getMobileDesignComponent` | Metadatos consultables de las familias y grupos. La aplicación decide cómo mostrarlos. |

## Desarrollo en el workspace

Declara `"mobile-design": "workspace:*"` en la app del workspace. Si usas el catálogo completo, declara también `"@mobile-design/icons": "workspace:*"`. Ejecuta `pnpm install` y `pnpm verify:mobile-design` desde la raíz.

## Licencias

Consulta [LICENSE](LICENSE), [LICENSE-Apache-2.0.txt](LICENSE-Apache-2.0.txt), [NOTICE](NOTICE) y la [licencia de Roboto](assets/fonts/roboto/OFL.txt).
