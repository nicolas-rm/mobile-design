# Desarrollo de Mobile Design

Este workspace contiene el código fuente de los tres paquetes publicados. La configuración fija las versiones de Expo, React Native y sus dependencias para desarrollar la librería y ejecutar las pruebas.

| Paquete | Contenido |
| --- | --- |
| [mobile-design](packages/mobile-design/README.md) | Componentes, proveedor, tipografía y el conjunto de símbolos incluido. |
| [@mobile-design/tokens](packages/mobile-design-tokens/README.md) | Colores, medidas y valores compartidos. |
| [@mobile-design/icons](packages/mobile-design-icons/README.md) | Colección opcional de símbolos y sus archivos de fuente. |

La [referencia de componentes](packages/mobile-design/COMPONENTS.md) reúne las propiedades y los ejemplos. El sitio del repositorio tiene sus propios comandos de desarrollo y verificación. [Documentación del sitio](../README.md)

## Instalar y comprobar

Usa Node.js 22.18 o posterior y pnpm 11.7.0. Instala las dependencias y ejecuta la suite desde la carpeta de la librería.

~~~sh
cd library
pnpm install --frozen-lockfile
pnpm test
~~~

La verificación revisa TypeScript y ejecuta los contratos de componentes, interacción, animación, navegación, temas y fuentes en Node. Los recorridos con dispositivos y los ejemplos interactivos del sitio tienen sus propias comprobaciones.

## Generar una paleta

Desde `library/` puedes regenerar el módulo de colores de tokens y su declaración TypeScript. El preset publicado usa los valores de MD3 Baseline. Una semilla hexadecimal genera las dos paletas mediante Material Color Utilities.

~~~sh
pnpm theme:generate md3-baseline
pnpm theme:generate neutral
pnpm theme:generate '#246B57'
~~~

Ejecuta el comando del preset que quieras conservar. Los archivos generados están en `packages/mobile-design-tokens/src/generated/` dentro de este workspace.

## Empaquetar

Para revisar una versión, ejecuta `pnpm pack` en cada carpeta de paquete. pnpm resuelve las referencias `workspace:*` a las versiones locales al crear los tarballs. Publica primero tokens, luego Mobile Design y al final iconos cuando cambien las versiones de los tres paquetes.
