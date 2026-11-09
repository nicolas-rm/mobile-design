# Mobile Design Icons

Colección opcional de **Material Symbols Rounded** para `mobile-design`. Incluye 4304 nombres y alias que corresponden a 4004 puntos de código Unicode. La fuente es variable y permite ajustar el relleno, el peso, el grado y el tamaño óptico de cada símbolo.

- [Instalación y entradas públicas](#instalación-y-entradas-públicas)
- [Dependencias](#para-qué-sirve-cada-dependencia)
- [Símbolos individuales](#símbolos-individuales) y [propiedades](#propiedades-de-materialsymbol)
- [Configuración global](#configuración-global)
- [Un solo control](#ajustar-un-solo-control) y [renderizador propio](#renderizador-propio)
- [Carga de la fuente](#carga-de-la-fuente)
- [Nombres y alias](#nombres-y-alias)
- [Licencias](#licencias)

## Instalación y entradas públicas

Configura primero [Mobile Design](https://www.npmjs.com/package/mobile-design) y sus dependencias en tu app. Instala una versión de `@mobile-design/icons` que corresponda a la versión del paquete base.

```sh
npm install @mobile-design/icons
```

| Import | Uso |
| --- | --- |
| `@mobile-design/icons/react-native` | Android e iOS. Usa la fuente TTF. |
| `@mobile-design/icons/react-native-web` | React Native Web. Usa la fuente WOFF2. |
| `@mobile-design/icons/codepoints` | Mapa de solo lectura `materialSymbolCodepoints` con nombres oficiales y valores Unicode. |
| `@mobile-design/icons/fonts/MaterialSymbolsRounded.ttf` | Acceso directo al archivo de fuente nativa. |
| `@mobile-design/icons/fonts/MaterialSymbolsRounded.woff2` | Acceso directo al archivo de fuente web. |

Las dos entradas de componentes exponen `MaterialSymbol`, el tipo `MaterialSymbolProps`, `renderMaterialIcon`, `mobileDesignSymbolsFont` y `materialSymbolsFontFamily`. Los ejemplos usan el import nativo. En web usa las entradas `/react-native-web` tanto de este paquete como de `mobile-design`.

La configuración probada usa Expo `58.0.17`, React Native `0.88.0`, React Native Web `0.21.4` y `expo-font` `58.0.10`. El paquete base ya incluye un subconjunto de símbolos para sus componentes. Usa esta colección cuando necesites símbolos adicionales, como `bakery_dining`.

### Para qué sirve cada dependencia

| Paquete | Uso |
| --- | --- |
| `mobile-design` | Dependencia del paquete de iconos. Proporciona el renderizador y la integración con el tema y los componentes. |
| `react` | Peer de la app. Ejecuta los componentes y hooks que cargan la fuente. |
| `expo-font` | Peer de la app. Registra Material Symbols Rounded desde TTF en Android e iOS, o WOFF2 en web. |
| `react-native-paper` | Peer de la app. Define el contrato de `settings.icon` y el respaldo que utiliza el renderizador del paquete base. |

El resto de la configuración corresponde a `mobile-design`, incluidos los hosts nativos y de web. [Instalación de Mobile Design](https://www.npmjs.com/package/mobile-design)

## Símbolos individuales

Monta el símbolo bajo `MobileDesignProvider` para leer los colores del tema con `useMobileTheme`. El símbolo también se puede montar por sí solo cuando le pasas un color directo.

```tsx
import { View } from 'react-native';
import { Text, useMobileTheme } from 'mobile-design/react-native';
import { MaterialSymbol } from '@mobile-design/icons/react-native';

export function CategoriaPanaderia() {
    const { colors } = useMobileTheme();

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialSymbol
                name="bakery_dining"
                size={32}
                color={colors.primary}
                filled
                weight={500}
                grade={0}
                opticalSize={32}
                testID="icono-panaderia"
            />
            <Text variant="labelLarge">Panadería</Text>
        </View>
    );
}
```

### Propiedades de MaterialSymbol

| Propiedad | Tipo | Valor inicial | Cómo se usa | Ejemplo |
| --- | --- | --- | --- | --- |
| `name` | `string` | Obligatoria | Nombre oficial o alias reconocido. | `name="bakery_dining"` |
| `size` | `number` | `24` | Ancho y alto del cuadro del símbolo. Al dibujar con la fuente, el valor queda entre `1` y `512` unidades de diseño de React Native. | `size={32}` |
| `color` | `ColorValue` | `'#000000'` | Color del glifo. Pasa un rol del tema para adaptar el contraste al esquema claro u oscuro. | `color={colors.primary}` |
| `filled` | `boolean` | El relleno del nombre resuelto | Controla `FILL`. `true` selecciona `1` y `false` selecciona `0`. Cuando se omite, el alias puede escoger la variante rellena. | `filled={included}` para marcar una opción elegida. |
| `weight` | `number` | `400` | Eje `wght`, de `100` a `700`. Cambia el peso del trazado. | `weight={500}` |
| `grade` | `number` | `0` | Eje `GRAD`, de `-50` a `200`. Ajusta el grosor aparente con independencia del peso. | `grade={50}` |
| `opticalSize` | `number` | `size` limitado al rango óptico | Eje `opsz`, de `20` a `48`. Ajusta el diseño del glifo al tamaño de lectura sin cambiar el cuadro. | `size={32} opticalSize={24}` |
| `direction` | `'ltr' \| 'rtl'` | `'ltr'` | `rtl` refleja horizontalmente el símbolo. Úsalo con iconos direccionales cuando deban seguir la lectura. | `<MaterialSymbol name="arrow_back" direction="rtl" />` |
| `testID` | `string` | Opcional | Identificador para localizar el elemento en pruebas de interfaz. | `testID="icono-panaderia"` |

Los ejes numéricos se limitan a sus rangos. Si omites `opticalSize`, un símbolo de `16` usa `20` como tamaño óptico y uno de `64` usa `48`. En ambos casos, `size` sigue definiendo el cuadro del icono. Para alternar entre el contorno y el relleno de una misma acción, conserva el nombre y actualiza `filled`.

El glifo es decorativo. En un botón que solo muestra un icono, pon `accessibilityLabel` en el botón con el nombre de la acción. Si el icono acompaña texto visible que ya explica su significado, ese texto aporta la etiqueta.

## Configuración global

Pasa `renderMaterialIcon` a `settings.icon` de `MobileDesignProvider` para que los componentes resuelvan sus iconos por nombre con la colección completa. El renderizador recibe nombre, tamaño, color y dirección cuando el componente se los pasa. Las fuentes de icono que el componente recibe como imagen o función se resuelven en ese componente.

```tsx
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, MobileDesignProvider } from 'mobile-design/react-native';
import { renderMaterialIcon } from '@mobile-design/icons/react-native';

const iconSettings = { icon: renderMaterialIcon };

export default function App() {
    const [included, setIncluded] = useState(false);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <MobileDesignProvider settings={iconSettings}>
                    <Button
                        icon={included ? 'check' : 'bakery_dining'}
                        variant="filled"
                        onPress={() => setIncluded((value) => !value)}
                    >
                        {included ? 'Quitar categoría' : 'Añadir categoría'}
                    </Button>
                </MobileDesignProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
```

### Ajustar un solo control

Un `IconButton` puede recibir una función que dibuje el símbolo. Conserva el tamaño y el color que entrega el componente para respetar sus estados. En el ejemplo, `selected` decide el relleno.

```tsx
import { IconButton } from 'mobile-design/react-native';
import { MaterialSymbol } from '@mobile-design/icons/react-native';

type FavoriteButtonProps = {
    selected: boolean;
    onToggle: () => void;
};

export function FavoriteButton({ selected, onToggle }: FavoriteButtonProps) {
    return (
        <IconButton
            selected={selected}
            accessibilityLabel={selected ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            icon={({ color, size }) => (
                <MaterialSymbol
                    name="favorite"
                    filled={selected}
                    color={color}
                    size={size}
                    weight={selected ? 600 : 400}
                />
            )}
            onPress={onToggle}
        />
    );
}
```

### Renderizador propio

Puedes introducir nombres de tu app en un renderizador global. Delega los demás nombres al renderizador de la colección. Usa `iconSettings` en el mismo `settings` del proveedor.

```tsx
import { MaterialSymbol, renderMaterialIcon } from '@mobile-design/icons/react-native';

const renderAppIcon: typeof renderMaterialIcon = (props) => {
    if (props.name === 'featured-category') {
        return <MaterialSymbol {...props} name="star" filled weight={500} />;
    }

    return renderMaterialIcon(props);
};

export const iconSettings = { icon: renderAppIcon };
```

## Carga de la fuente

La fuente completa se registra mediante `expo-font` cuando se monta `MaterialSymbol`, también cuando el componente llega por `renderMaterialIcon`. Mientras carga, se muestra el SVG de respaldo si existe para el nombre. Los SVG tienen un trazado fijo y la fuente aplica los ejes variables al quedar disponible. Un nombre conocido sin SVG reserva su espacio hasta que puede dibujar el glifo. Si falla la carga del archivo, el componente propaga el error.

`materialSymbolsFontFamily` contiene el nombre de registro `MobileDesignMaterialSymbolsRoundedFull`. `mobileDesignSymbolsFont` es la definición de familia para `expo-font` y referencia el formato de la plataforma. Úsala si la primera pantalla requiere que todos los símbolos estén disponibles desde el primer render.

```tsx
import type { PropsWithChildren } from 'react';
import { useFonts } from 'expo-font';
import { mobileDesignSymbolsFont } from '@mobile-design/icons/react-native';

const fonts = [mobileDesignSymbolsFont];

export function LoadSymbols({ children }: PropsWithChildren) {
    const [loaded, error] = useFonts(fonts);

    if (error) throw error;
    if (!loaded) return null;

    return <>{children}</>;
}
```

Envuelve con `LoadSymbols` el árbol que debe esperar la carga. Mantén el renderizador global o los usos individuales según el alcance que necesites.

## Nombres y alias

El mapa público ofrece los nombres oficiales en `snake_case`. Algunos nombres comparten un mismo punto de código. Los alias que adapta el renderizador de Paper se resuelven antes de consultar ese mapa.

| Nombre enviado | Símbolo resuelto | Relleno si omites `filled` |
| --- | --- | --- |
| `magnify` | `search` | Contorno |
| `arrow-left` | `arrow_back` | Contorno |
| `bookmark-outline` | `bookmark` | Contorno |
| `bookmark` | `bookmark` | Relleno |

Para validar un nombre oficial procedente de datos, consulta el mapa por su clave. Los alias de Paper, como `magnify`, se pueden usar directamente en el componente aunque su clave oficial en el mapa sea `search`.

```ts
import { materialSymbolCodepoints } from '@mobile-design/icons/codepoints';

export function isMaterialSymbolName(name: string): boolean {
    return Object.hasOwn(materialSymbolCodepoints, name);
}

export const bakeryCodepoint = materialSymbolCodepoints.bakery_dining;
```

Si un nombre sigue siendo desconocido después de resolver los alias, el componente lo pasa al renderizador de respaldo de React Native Paper. Si ves un cuadro vacío, verifica primero el nombre en el mapa o mapea ese nombre en tu `settings.icon`. Para los símbolos direccionales enviados a un componente que acepta el formato de icono de Paper, usa `{ source: 'arrow_back', direction: 'auto' }` para seguir la dirección del proveedor.

## Licencias

Consulta [LICENSE](LICENSE), [LICENSE-Apache-2.0.txt](LICENSE-Apache-2.0.txt) y [NOTICE](NOTICE).
