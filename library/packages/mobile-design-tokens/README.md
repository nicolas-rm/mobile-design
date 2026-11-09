# Mobile Design Tokens

Valores de diseño Material Design 3 para compartir colores, interlineado, medidas y movimiento entre pantallas y componentes. Puedes usar las tablas en tu propio código TypeScript sin montar un proveedor de React.

[Instalación](#instalación-e-imports) · [Roles de color](#colores-y-roles-semánticos) · [Temas](#configurar-los-colores-en-mobile-design) · [Generador](#generación-a-partir-de-un-color-semilla) · [Tipografía](#tipografía-e-interlineado) · [Medidas](#medidas-de-componentes) · [Espaciado y estados](#espaciado-puntos-de-ruptura-y-estados) · [Movimiento](#movimiento-espacial) · [Licencias](#licencias)

## Instalación e imports

`@mobile-design/tokens` no declara dependencias ni peers. Puedes usar sus datos fuera de React y Expo. La entrada principal necesita soporte de TypeScript y la entrada `/colors` también se puede leer desde CommonJS. Si instalas `mobile-design`, npm ya instala los tokens para sus componentes. Para importar los datos directamente en tu propia app, decláralos como dependencia.

```sh
npm install @mobile-design/tokens
```

| Entrada | Contenido |
| --- | --- |
| `@mobile-design/tokens` | Exportaciones nombradas de medidas, tipografía, opacidad y movimiento. Publica código fuente TypeScript. |
| `@mobile-design/tokens/colors` | Exportación de un objeto CommonJS con dos paletas, sus roles y metadatos. Tiene declaraciones TypeScript y se puede importar con un import por defecto en Expo y Metro. |
| `@mobile-design/tokens/package.json` | Metadatos del paquete. |

Usa un bundler con soporte para TypeScript, como Metro. Las tablas de la entrada principal conservan sus claves y valores literales en los tipos. Úsalas como datos de solo lectura y crea una copia al personalizarlas.

```ts
import { buttonSizeTokens, mobileDesignTokens, type ButtonSize } from '@mobile-design/tokens';
import materialColors from '@mobile-design/tokens/colors';

export function buttonLayout(size: ButtonSize = 'small') {
    const token = buttonSizeTokens[size];
    return {
        minHeight: token.height,
        paddingHorizontal: token.padding,
        paddingVertical: token.verticalPadding,
        gap: token.gap,
    };
}

export const screenDefaults = {
    padding: mobileDesignTokens.spacing.medium,
    backgroundColor: materialColors.appColorTokens.light.surface,
};
```

## Colores y roles semánticos

La paleta de fábrica es Material Design 3 Baseline. `materialColorPreset` vale `md3-baseline` y `materialColorSeed` guarda `#6750A4` como referencia de origen. `appColorTokens.light` y `appColorTokens.dark` tienen las mismas 58 claves con valores distintos según el modo. `materialColorRoles` enumera esas claves en orden y permite recorrerlas con el mismo tipo que usan los mapas.

Los colores se publican como cadenas `rgba(...)` o `transparent`. La tabla usa hexadecimal para facilitar la comparación de algunos valores opacos.

| Rol | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `primary` | `#6750A4` | `#D0BCFF` | Superficie de énfasis principal. |
| `onPrimary` | `#FFFFFF` | `#381E72` | Texto e iconos sobre `primary`. |
| `primaryContainer` | `#EADDFF` | `#4F378B` | Contenedor de énfasis más suave. |
| `onPrimaryContainer` | `#21005D` | `#EADDFF` | Contenido dentro de `primaryContainer`. |
| `surface` | `#FEF7FF` | `#141218` | Superficie base. |
| `onSurface` | `#1D1B20` | `#E6E0E9` | Contenido principal sobre una superficie. |
| `surfaceContainer` | `#F3EDF7` | `#211F26` | Contenedor diferenciado de la superficie base. |
| `outline` | `#79747E` | `#938F99` | Bordes que requieren contraste. |

| Familia | Claves y aplicación |
| --- | --- |
| Énfasis | `primary`, `secondary` y `tertiary`. Cada familia tiene su pareja `onPrimary`, `onSecondary` u `onTertiary`, una clave `*Container` y una pareja `on*Container`. |
| Error | `error`, `onError`, `errorContainer` y `onErrorContainer` para estados y mensajes de error. |
| Fondo y superficie | `background` con `onBackground`, `surface` con `onSurface` y `surfaceVariant` con `onSurfaceVariant`. `surfaceDim`, `surfaceBright` y los niveles `surfaceContainerLowest`, `surfaceContainerLow`, `surfaceContainer`, `surfaceContainerHigh` y `surfaceContainerHighest` ofrecen alternativas de superficie. |
| Contornos e inversos | `outline`, `outlineVariant`, `inverseSurface`, `inverseOnSurface` e `inversePrimary`. |
| Roles fijos | Cada familia de énfasis tiene `*Fixed`, `*FixedDim`, `on*Fixed` y `on*FixedVariant`. Por ejemplo, `primaryFixed`, `primaryFixedDim`, `onPrimaryFixed` y `onPrimaryFixedVariant`. |
| Elevación | `elevationLevel0` a `elevationLevel5` son colores de superficie por nivel. El nivel `0` es `transparent`. |
| Capas | `shadow` y `scrim` definen colores para sombras y fondos que atenúan el contenido. `stateLayerPressed` es una capa de pulsación que incluye alfa. |
| Datos auxiliares | `surfaceDisabled`, `onSurfaceDisabled` y `backdrop` se entregan en el mapa plano para consumidores de esos roles. |

Usa cada rol `on*` con su superficie correspondiente. Si sustituyes una superficie, elige también el color de contenido y revisa el contraste en los dos modos.

```ts
import materialColors from '@mobile-design/tokens/colors';

export type ColorMode = keyof typeof materialColors.appColorTokens;
export type ColorRole = keyof typeof materialColors.appColorTokens.light;
export type ColorScheme = (typeof materialColors.appColorTokens)[ColorMode];

export function collectionColors(mode: ColorMode) {
    const colors = materialColors.appColorTokens[mode];
    return {
        card: { backgroundColor: colors.primaryContainer, borderColor: colors.outlineVariant },
        title: { color: colors.onPrimaryContainer },
        button: { backgroundColor: colors.primary },
        buttonLabel: { color: colors.onPrimary },
    };
}
```

## Configurar los colores en Mobile Design

El proveedor pertenece a `mobile-design`. Sigue el modo del sistema por defecto. Pasa `colorScheme="light"` o `colorScheme="dark"` para fijarlo. `theme.colors` acepta un conjunto parcial de roles y mantiene el resto del tema. `theme.dark`, si lo incluyes, tiene prioridad sobre `colorScheme`.

Este ejemplo fija el modo oscuro y modifica dos pares de roles. Monta este proveedor en la configuración raíz de una app de [Mobile Design](https://www.npmjs.com/package/mobile-design). Usa la entrada `mobile-design/react-native-web` para los mismos imports en navegador.

```tsx
import type { ReactNode } from 'react';
import { MobileDesignProvider } from 'mobile-design/react-native';

export function BrandTheme({ children }: { children: ReactNode }) {
    return (
        <MobileDesignProvider
            colorScheme="dark"
            theme={{
                colors: {
                    primary: '#91D5B7',
                    onPrimary: '#003825',
                    primaryContainer: '#19513E',
                    onPrimaryContainer: '#AEF2D2',
                },
            }}
        >
            {children}
        </MobileDesignProvider>
    );
}
```

Cuando tienes una paleta completa o parches por modo, `createMobileDesignColors` toma el mapa plano de 58 roles y lo adapta a la estructura del tema. Agrupa `elevationLevel0` a `elevationLevel5` en `colors.elevation.level0` a `level5` y deja los tres datos auxiliares fuera del tema de Paper. Pasa el resultado a `createMobileDesignTheme` para combinarlo con la tipografía, formas y movimiento del tema base.

```ts
import materialColors from '@mobile-design/tokens/colors';
import { createMobileDesignColors, createMobileDesignTheme } from 'mobile-design/react-native';

type Mode = keyof typeof materialColors.appColorTokens;
type ColorScheme = (typeof materialColors.appColorTokens)[Mode];

const brand = {
    light: { primary: '#246B57', onPrimary: '#FFFFFF' },
    dark: { primary: '#91D5B7', onPrimary: '#003825' },
} satisfies Record<Mode, Partial<ColorScheme>>;

export function createBrandTheme(mode: Mode) {
    const palette = { ...materialColors.appColorTokens[mode], ...brand[mode] };
    return createMobileDesignTheme({
        colorScheme: mode,
        theme: { colors: createMobileDesignColors(palette) },
    });
}
```

Puedes pasar el resultado como `theme={createBrandTheme(mode)}` al proveedor. Cambiar `primary` ajusta los componentes que usan ese rol. Para personalizar también variantes tonales, bordes, contenedores o elevación, ajusta sus propios roles en cada modo.

## Generación a partir de un color semilla

El paquete instalado distribuye paletas ya generadas. `materialColorSeed` y `materialColorPreset` son metadatos, y `createMobileDesignColors` adapta roles existentes. En tu app puedes generar los roles claros y oscuros con un color de origen, guardarlos como datos y aplicarlos como en el ejemplo anterior. [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/)

El generador de mantenimiento se ejecuta en el workspace de desarrollo. Los comandos regeneran el módulo de colores y sus tipos dentro de este paquete. El modo `md3-baseline` usa los valores canónicos de Baseline. `neutral` genera el preset neutral `shadcn-neutral`. Una semilla hexadecimal `#RGB` o `#RRGGBB` genera los dos esquemas `material-source` mediante Material Color Utilities.

```sh
pnpm theme:generate md3-baseline
pnpm theme:generate neutral
pnpm theme:generate '#246B57'
```

El valor predeterminado del generador sin argumentos es `md3-baseline`. Ejecuta el comando del modo que quieras conservar como salida. La generación por semilla también produce roles de superficie, roles fijos, elevación y capas de estado.

## Tipografía e interlineado

`LanguageHeight` es el tipo `'small' | 'medium' | 'large' | 'extraLarge'`. `languageLineHeights` tiene 15 roles tipográficos y una tupla de cuatro valores en ese orden para cada rol. Los grupos de roles son `display`, `headline`, `title`, `body` y `label`. Cada uno tiene `Large`, `Medium` y `Small`.

En `bodyLarge` los valores son `24`, `27`, `31` y `41` en unidades lógicas de React Native para `lineHeight`. El perfil `small` corresponde a la escala latina base. Selecciona un perfil según el espacio vertical que necesite el idioma del contenido. El perfil cambia el interlineado y es independiente del escalado de texto del sistema. `languageHeight` en `MobileDesignProvider` o `createMobileDesignTheme` aplica este perfil a la tipografía del tema.

```ts
import { languageLineHeights, type LanguageHeight } from '@mobile-design/tokens';

const profileIndex = { small: 0, medium: 1, large: 2, extraLarge: 3 } as const;
type TextRole = keyof typeof languageLineHeights;

export function lineHeight(role: TextRole, profile: LanguageHeight = 'small') {
    return languageLineHeights[role][profileIndex[profile]];
}
```

## Medidas de componentes

Las medidas geométricas son unidades lógicas de React Native, equivalentes a dp. `height` describe una medida de referencia del componente. El texto, el contenido o el área segura pueden aumentar el tamaño final. Los campos `text`, `title` y `subtitle` son nombres de roles tipográficos. Los radios expresados como cadenas corresponden a roles de forma del tema.

| Exportación | Claves de selección | Campos y significado |
| --- | --- | --- |
| `buttonSizeTokens` | `extra-small`, `small`, `medium`, `large`, `extra-large` | `height`, `padding`, `verticalPadding`, `icon`, `gap`, radio cuadrado `square`, radio en pulsación `pressed`, grosor de borde `outline` y rol `text`. |
| `buttonGroupSizeTokens` | Los mismos cinco tamaños | `height`, `padding`, `icon`, tamaño de icono sin etiqueta `iconOnly`, rellenos laterales `iconNarrow`, `iconPadding` e `iconWide`, separación de etiqueta `gap` y entre botones `between`. Incluye radios `inner`, `pressedInner`, `outerSquare`, `square`, `pressed`, grosor `outline` y rol `text`. |
| `topAppBarTokens` | `small`, `medium-flexible`, `large-flexible` | `height` de referencia, roles `title` y `subtitle`, y `subtitleHeight` en las variantes flexibles. |
| `fabSizeTokens` | `default`, `medium`, `large` | `height`, `icon`, rol de forma `radius`, rellenos `leading` y `trailing`, `gap` y rol `text` para la etiqueta del FAB extendido. |
| `sliderSizeTokens` | `xs`, `sm`, `md`, `lg`, `xl` | Grosor de pista `track`, medida transversal del tirador `handle`, radio exterior `corner` y tamaño `icon`. El tamaño de icono es `0` en `xs` y `sm`. |
| `badgeTokens` | Una tabla | `smallSize` del punto, `largeMinSize`, `largePadding`, límites `maximumCharacters` y `maximumCount`, y desplazamientos de anclaje `smallAnchorStartOffset`, `smallAnchorBottom`, `largeAnchorStartOffset` y `largeAnchorBottom`. |
| `tabsTokens` | Una tabla | Alturas `containerHeight` y `stackedContainerHeight`, `iconSize`, separaciones `inlineIconGap`, `stackedIconGap` y `badgeGap`, solapamiento `iconBadgeOverlap` y `horizontalPadding`. Las pestañas desplazables usan `scrollableMinimumTabWidth` y `scrollableEdgePadding`. La tabla también define `dividerHeight`, `primaryIndicatorHeight`, `primaryIndicatorMinimumWidth`, `primaryIndicatorInset` y `secondaryIndicatorHeight`. |

`ButtonSize` declara las cinco claves de tamaño. `ButtonVariant` declara `'filled' | 'tonal' | 'elevated' | 'outlined' | 'text'`. El tamaño selecciona medidas y la variante describe la presentación del botón.

| Patrón | Valores de referencia en dp |
| --- | --- |
| Alturas de botón y grupo | `32`, `40`, `56`, `96` y `136` de `extra-small` a `extra-large`. |
| Alturas de barra superior | `64` para `small`, `112` para `medium-flexible` y `120` para `large-flexible`. Con subtítulo, las flexibles usan `136` y `152`. |
| Alturas de FAB | `56`, `80` y `96` para `default`, `medium` y `large`. |
| Grosor de pista de slider | `16`, `24`, `40`, `56` y `96` de `xs` a `xl`. |
| Tamaños de insignia | `6` para el punto y al menos `16` para la insignia con contenido. La tabla indica un máximo de `999` para conteos y `4` caracteres para etiquetas. |
| Alturas de pestaña | `48` en línea y `64` con icono y etiqueta apilados. |

```ts
import { badgeTokens, fabSizeTokens, sliderSizeTokens, tabsTokens, topAppBarTokens } from '@mobile-design/tokens';

export const layoutReference = {
    largeBadgeMinSize: badgeTokens.largeMinSize,
    standardFabIcon: fabSizeTokens.default.icon,
    mediumSliderTrack: sliderSizeTokens.md.track,
    stackedTabHeight: tabsTokens.stackedContainerHeight,
    expandedHeaderWithSubtitle: topAppBarTokens['medium-flexible'].subtitleHeight,
};
```

## Espaciado, puntos de ruptura y estados

`mobileDesignTokens` reúne medidas y opacidades para patrones de interacción.

| Campo | Claves y valores |
| --- | --- |
| `minimumTouchTarget` | `48` dp para el área interactiva de referencia. |
| `spacing` | `none` `0`, `extraSmall` `4`, `small` `8`, `medium` `16`, `large` `24` y `extraLarge` `32` dp. |
| `breakpoints` | Anchos de referencia `medium` `600`, `expanded` `840`, `large` `1200` y `extraLarge` `1600` dp. |
| `state` | Opacidades de `0` a `1`. `hovered` `0.08`, `focused` `0.1`, `pressed` `0.1`, `dragged` `0.16`, `disabledContent` `0.38` y `disabledContainer` `0.12`. |

```ts
import { mobileDesignTokens } from '@mobile-design/tokens';

export function responsiveLayout(width: number) {
    const { breakpoints, spacing, minimumTouchTarget } = mobileDesignTokens;
    const expanded = width >= breakpoints.expanded;
    return {
        columns: expanded ? 2 : 1,
        padding: expanded ? spacing.large : spacing.medium,
        minControlHeight: minimumTouchTarget,
    };
}
```

## Movimiento espacial

`spatialMotionTokens` contiene los perfiles `expressive` y `standard`. Cada uno ofrece `fast`, `default` y `slow` para resortes de desplazamiento o cambio de tamaño. `stiffness` es la rigidez del resorte y `damping` es la razón de amortiguamiento. Los valores de `stiffness` y `damping` se muestran en ese orden.

| Perfil | `fast` | `default` | `slow` |
| --- | --- | --- | --- |
| `expressive` | `800`, `0.6` | `380`, `0.8` | `200`, `0.8` |
| `standard` | `1400`, `0.9` | `700`, `0.9` | `300`, `0.9` |

En Mobile Design, `motion="expressive"` es el perfil predeterminado. El proveedor aplica estas tablas al movimiento espacial del tema. Si las usas en tu propia animación con Reanimated y masa `1`, convierte la razón de amortiguamiento al coeficiente que espera el resorte.

```ts
import { spatialMotionTokens } from '@mobile-design/tokens';

export function fastSpatialSpring() {
    const { stiffness, damping } = spatialMotionTokens.standard.fast;
    return {
        stiffness,
        damping: 2 * damping * Math.sqrt(stiffness),
        mass: 1,
    };
}
```

## Licencias

Consulta [LICENSE](LICENSE), [LICENSE-Apache-2.0.txt](LICENSE-Apache-2.0.txt) y [NOTICE](NOTICE).
