# Mobile Design

<img src="dist/assets/favicon.svg" width="64" height="64" alt="Mobile Design">

Documentación en español de Mobile Design para React Native con módulos Expo. El sitio reúne guías de diseño e integración, referencias de API y ejemplos interactivos basados en Material Design 3.

[![Documentation checks](https://github.com/nicolas-rm/mobile-design/actions/workflows/docs-check.yml/badge.svg)](https://github.com/nicolas-rm/mobile-design/actions/workflows/docs-check.yml)

[Documentación publicada](https://mobile-design-docs.satinfig8.chatgpt.site/) · [Contribuir](CONTRIBUTING.md) · [Verificación](QA.md)

El código fuente de los tres paquetes está en `library/packages/`. El sitio de documentación y su exportación estática están en la raíz. [Desarrollo de la librería](library/README.md)

| Paquete | Documentación |
| --- | --- |
| `mobile-design` | [Instalación y uso](library/packages/mobile-design/README.md) · [Referencia de componentes](library/packages/mobile-design/COMPONENTS.md) |
| `@mobile-design/tokens` | [Colores, tipografía, tamaños y movimiento](library/packages/mobile-design-tokens/README.md) |
| `@mobile-design/icons` | [Colección opcional de iconos](library/packages/mobile-design-icons/README.md) |

## Abrir en local

Con **Node.js 22 o posterior**, clona el repositorio y sirve la exportación incluida.

```sh
git clone https://github.com/nicolas-rm/mobile-design.git
cd mobile-design
npm start
```

Abre [la documentación local](http://127.0.0.1:4317/). Para cambiar el puerto, usa `PORT=4320 npm start`. Las rutas usan hash y funcionan con un servidor estático. Tanto `npm start` como `npm test` pueden ejecutarse directamente después de clonar.

## Qué incluye

- **36 familias de componentes MD3 y dos extensiones**, Select y Autocomplete. Cada ficha reúne descripción, especificaciones, API y accesibilidad. Los tipos y los valores iniciales disponibles se extraen del paquete.
- **38 galerías interactivas** que ejecutan los componentes originales con React Native Web, además del laboratorio de `Text`. Las ventanas de ejemplo permiten probar variantes, temas y comportamientos. Las ilustraciones del catálogo tienen una función decorativa.
- **53 ejemplos TSX descargables** y **72 capturas de referencia**. El código, las capturas y los contratos se muestran en la página. Los ejemplos descargables ofrecen acciones para copiar el código, descargarlo y compartir su enlace.
- Guías de inicio, desarrollo, fundamentos, estilos y recursos. La guía de instalación distingue los requisitos del paquete de los dos específicos del navegador. El buscador incluye guías, componentes y propiedades.

El sitio reutiliza el paquete en su propia interfaz. `NavigationRail` y `NavigationDrawer` componen la navegación lateral. `TopAppBar` sirve de cabecera en ventanas estrechas. El catálogo usa `Card` con enlaces reales y `ButtonGroup` para las categorías. Los filtros y la búsqueda emplean `TextField` y `Autocomplete`. Los controles de tema y movimiento usan `IconButton` y los encabezados de ejemplos descargables usan `SplitButton`.

Los textos editoriales consumen `Text` manteniendo encabezados, enlaces, listas y tablas semánticos. El sitio conserva Roboto, Material Symbols Rounded, temas claro y oscuro, foco visible y preferencia de movimiento reducido.

## Alcance por plataforma

| Entorno                       | Alcance                                                                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Native con módulos Expo | Entorno principal del paquete y de los ejemplos TSX. La integración y los rangos declarados se explican en **Desarrollo → Instalación y proveedor**.     |
| Expo Web y React Native Web   | Todas las familias y extensiones tienen una galería. La cobertura de comportamientos, combinaciones y motores se registra por familia en [QA.md](QA.md). |
| React DOM independiente       | La implementación web documentada usa React Native Web.                                                                                                  |

Las pruebas de navegador cubren los casos descritos en QA. La aplicación consumidora puede necesitar verificaciones adicionales con sus propios gestos, navegación, lectores de pantalla y configuraciones.

## Dónde editar

| Ruta                   | Contenido                                                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`content/`](content/) | Textos de fichas, guías, medidas y fuentes de ejemplos descargables.                                                                                                                    |
| [`runtime/`](runtime/) | Host Expo de las galerías y componentes compartidos de la página. `runtime/showcases/` contiene las composiciones de ejemplo. |
| [`dist/`](dist/)       | Sitio que sirve el navegador. `app.js` y `site-sections.js` gestionan páginas y navegación. `component-docs.js` presenta las fichas. `styles.css` y `structure.css` definen el aspecto. |
| [`scripts/`](scripts/) | Servidor, sincronización, exportación y comprobaciones.                                                                                                                                 |

Los datos de `dist/data.json`, su copia integrada en `dist/index.html` y los TSX de `dist/examples/` se generan juntos. El runtime precompilado se guarda en `dist/runtime/` y se registra en `dist/web-examples.js`. Las galerías usan ventanas del mismo origen para aislar estilos y sincronizar tema y movimiento.

## Sincronizar y reconstruir

Los comandos de reconstrucción usan los paquetes de `library/`. Ejecuta las comprobaciones desde la raíz del repositorio.

```sh
(cd library && pnpm install --frozen-lockfile)
npm run sync
npm run check:examples
npm run assets
npm test
```

`sync` actualiza la información del paquete, los ejemplos y los recursos compartidos de la librería. Conserva las capturas y el registro de verificación existente. Para importar nuevas capturas, ejecuta `npm run sync -- --evidence-dir /ruta/a/capturas`.

Si cambias un componente o una galería, edita la fuente en `library/packages/` o `runtime/` y reconstruye el runtime.

```sh
npm run build:web
npm run sync
npm run assets
npm test
```

Si sólo cambias JavaScript, CSS o recursos del sitio, actualiza las huellas con `npm run assets` y ejecuta `npm test`.

## Verificación

| Comando                                                                | Qué comprueba                                                                                           |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm test`                                                             | Datos integrados, rutas, enlaces, recursos, contratos y sintaxis. Es la comprobación de GitHub Actions. |
| `npm run check:examples`                                                | Tipos de los módulos TSX descargables contra el paquete del workspace.                                  |
| `(cd library && pnpm test)`                                            | Tipos y pruebas de los paquetes de Mobile Design. |
| `npm run test:web`                                                     | Matrices de navegador de las galerías y controles del sitio sobre la exportación incluida.              |
| `npm run test:web:page-controls`                                       | Navegación, foco, búsqueda y acciones de copiar y descargar.                                            |
| `npm run test:web:page-typography`                                     | Consumo de `Text` en el sitio y los ejemplos.                                                           |
| `npm run test:web:choices`                                             | Integración de Select y Autocomplete con teclado y puntero.                                             |
| `npm run test:web:remaining`                                           | Galerías revisadas por parejas, configuraciones y recorridos de interacción.                            |

Para las pruebas web ejecuta `npm ci` e instala Chrome o Chromium. Si el ejecutor está en otra ubicación, indica su ruta con `CHROME_PATH`. Los resultados y capturas se guardan en `.artifacts/`. Puedes filtrar una familia con `node scripts/check-remaining-web.mjs --family=carousel`. La suite de Select y Autocomplete también admite `WEB_CHOICE_ENGINES=chromium,webkit,firefox` con los motores correspondientes instalados.

Para probar una exportación aislada, parte de una copia de `dist/`. `MOBILE_DESIGN_DOCS_DIST_DIR` indica dónde escribir el runtime reconstruido. `MOBILE_DESIGN_DOCS_TEST_DIST_DIR` indica qué copia completa verificar con `test:web:remaining`.

Consulta [QA.md](QA.md) para los casos, resultados y límites de cada revisión.

## Licencias

El código de documentación se distribuye bajo [MIT](LICENSE). Las fuentes, imágenes y dependencias conservan sus atribuciones en [`dist/assets/NOTICE`](dist/assets/NOTICE) y en los [avisos del runtime](dist/runtime/components/THIRD_PARTY_NOTICES.txt). Mobile Design es un proyecto independiente de Google.
