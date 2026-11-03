# mobile-design

<img src="dist/assets/favicon.svg" width="64" height="64" alt="Mobile Design">

**Documentación de Mobile Design para React Native con módulos Expo, con el lenguaje visual de Material Design 3.**

[![Documentation checks](https://github.com/nicolas-rm/mobile-design/actions/workflows/docs-check.yml/badge.svg)](https://github.com/nicolas-rm/mobile-design/actions/workflows/docs-check.yml)

[Documentación publicada](https://mobile-design-docs.satinfig8.chatgpt.site) · [Estándar MD3](CONTRIBUTING.md) · [Verificación](QA.md)

Este repositorio contiene el proyecto de documentación. No incluye la app Music Design ni constituye una distribución del paquete nativo en npm. El acceso al Site publicado es privado; es independiente de la visibilidad de este repositorio.

## Qué incluye

- Portada editorial, navegación principal en siete apartados y menús contextuales por sección, con estructura visual inspirada en el sitio MD3.
- Guías propias de inicio, desarrollo, accesibilidad, contenido, tokens, interacción, diseño adaptable y personalización.
- Páginas independientes de color, elevación, iconos, movimiento, forma, espaciado y tipografía.
- 36 familias con nombres, agrupación y orden del catálogo MD3.
- Fichas con uso, integración, funcionamiento, variantes, configuraciones, API y accesibilidad dentro del propio sitio.
- Propiedades, valores iniciales disponibles y contratos de datos extraídos de los tipos del paquete.
- 43 ejemplos React Native descargables, incluidos Search view, selección de rango, Input chips, menú → diálogo, contraseña y progreso → success.
- 72 capturas nativas, claras/oscuras, de la revisión del 2 de noviembre de 2026.
- Búsqueda de guías, componentes y propiedades; temas claro/oscuro, navegación adaptable, enlaces directos a apartados, foco visible y reducción de movimiento.

Las ilustraciones del catálogo son decorativas. Las fichas muestran capturas y código TSX. Buttons, Extended FABs, FAB menu, FABs e Icon buttons montan los componentes originales mediante React Native Web y permiten explorar sus propiedades; no son réplicas HTML. Los botones de copiar código, limpiar filtros y las acciones de tema/movimiento de las guías también usan Button original dentro de la página. Los iconos de tema, movimiento, búsqueda, menú móvil y enlaces de apartado utilizan IconButton original. Los enlaces de navegación, campos y filtros del sitio se integrarán al revisar sus familias.

## Plataformas

| Entorno | Alcance |
| --- | --- |
| React Native con Expo | Entorno principal del paquete documentado. |
| React Native con módulos Expo integrados | Requiere los peers y su configuración nativa. |
| Expo Web / React Native Web | Integración de Buttons, Extended FABs, FAB menu, FABs e Icon buttons con ejecución y matrices de navegador. Las demás familias continúan pendientes. |
| React DOM independiente | No hay una distribución DOM verificada del paquete. |

La compatibilidad del sitio web de documentación no acredita la compatibilidad web de los componentes.

## Abrir después de clonar

Necesitas **Node.js 22 o posterior**. El sitio y sus comprobaciones usan módulos incluidos en Node; no necesitan instalar dependencias ni tener la app original.

```sh
git clone https://github.com/nicolas-rm/mobile-design.git
cd mobile-design
npm test
npm start
```

Abre http://127.0.0.1:4317/. Las rutas utilizan hash y no necesitan reglas de rewrite. `PORT=4320 npm start` permite usar otro puerto.

Después de editar JavaScript, CSS o la fuente de iconos, ejecuta `npm run assets` y `npm test`. Las huellas de contenido en las URLs impiden mezclar recursos de diferentes versiones por caché; las comprobaciones detectan huellas desactualizadas.

## Organización

| Ruta | Responsabilidad |
| --- | --- |
| `dist/` | Sitio estático listo para servir. |
| `dist/component-docs.js` | Presentación de las fichas y montaje de ejemplos reales. |
| `runtime/` | Host React/Expo de ejemplos interactivos y controles de la página. |
| `dist/runtime/` | Exportación precompilada, fuentes y recursos listos para servir. |
| `dist/web-examples.js` | Registro de ejemplos y huella del código del paquete utilizado. |
| `dist/site-sections.js` | Portada, contenido editorial, arquitectura de navegación y pie del sitio. |
| `dist/structure.css` | Composición editorial y navegación adaptable con roles MD3. |
| `dist/illustrations.js` | Ilustraciones decorativas, sin runtime de componentes. |
| `dist/examples/` | Ejemplos nativos TSX descargables. |
| `dist/native/` | Capturas nativas claras/oscuras. |
| `content/` | Descripciones, integración, comportamiento, accesibilidad y ejemplos fuente. |
| `scripts/` | Servidor, comprobaciones y sincronización opcional. |
| `AGENTS.md` / `CONTRIBUTING.md` | Estándar MD3 y reglas de contribución. |

## Construir y verificar los ejemplos web

El runtime precompilado funciona al clonar el sitio. Para reconstruirlo, proporciona el paquete Mobile Design y su workspace con Expo, React DOM, React Native Web y Metro Runtime instalados. Las versiones deben corresponder al SDK de ese workspace.

```sh
npm run build:web -- --package-dir /ruta/al/paquete/mobile-design
npm run assets
npm test
```

La exportación utiliza el componente original y su proveedor, con fuentes locales WOFF2 completas. Los ejemplos se montan en un iframe del mismo origen para aislar estilos y sincronizar tema, movimiento y altura sin recargar su estado. Los controles de la página se montan con portales bajo un único MobileDesignProvider; se desmontan antes de sustituir el contenido de una ruta.

Para ejecutar la matriz de navegador sobre esa exportación:

```sh
npm ci
npm run test:web
```

Necesita Chrome/Chromium instalado (`CHROME_PATH` permite indicar su ejecutable). Cada ejecutor abre su propio servidor temporal, crea un perfil de navegador aislado y guarda capturas/resultados en `.artifacts/` por familia. No utiliza el perfil del usuario. `npm run test:web:extended-fab`, `npm run test:web:fab-menu` y `npm run test:web:fab-icon` y `npm run test:web:page-controls` permiten ejecutarlos por separado. Comprueba las combinaciones Default/Toggle, estilos, tamaños y formas en ambos temas, además de teclado, ratón, tacto, animación interrumpida, cancelación, bloqueo/carga, RTL, movimiento reducido y adaptación a ancho estrecho. Extended FABs añade 144 configuraciones y casos de desplazamiento, presencia, colocación, medición de texto, cinco tareas y transformación de contenedor. FAB menu añade 192 configuraciones: pila Expressive de 2–6 acciones y menú anclado, teclado, foco, acciones, portapapeles, RTL y pila desplazable opcional. FABs añade 36 configuraciones de tamaño/color/tema, cinco tareas y posición fija al desplazar. Icon buttons añade 480 configuraciones, las cuatro áreas exteriores del objetivo de 48 dp y acciones de selección, reproducción, llamada y menú. Los apartados de código, capturas y tipos se presentan siempre visibles; sólo los selectores de configuración permanecen compactos. El ejecutor de controles verifica copia, foco, limpieza de filtros y 20 reemplazos de ruta sin duplicar controles.

## Sincronizar con el paquete nativo

Esta operación es opcional para consultar o editar el sitio. Necesita el código original del paquete y un workspace con TypeScript y sus dependencias nativas instaladas.

```sh
npm run sync -- --package-dir /ruta/al/paquete/mobile-design
npm run check:examples -- --package-dir /ruta/al/paquete/mobile-design
npm test
```

Para actualizar también la evidencia existente:

```sh
npm run sync -- --package-dir /ruta/al/paquete/mobile-design --evidence-dir /ruta/a/las/capturas
```

Se pueden usar rutas absolutas o relativas. El sincronizador no modifica el paquete original. Sin una carpeta de evidencia, conserva las imágenes ya incluidas en este repositorio. `dist/data.json`, los ejemplos y el JSON integrado en el HTML se generan juntos.

## Verificación y límites

`npm test` comprueba cobertura de fichas, contratos, alcance web por familia, recursos, ejemplos, igualdad de datos integrados, sintaxis JavaScript y enlaces de la arquitectura editorial (170 rutas). Se ejecuta en GitHub Actions sin acceso a la app.

`npm run check:examples` compila los 43 ejemplos contra el paquete indicado. Esa comprobación requiere su workspace; no se presenta como una prueba de píxeles, gestos o rendimiento.

Los resultados publicados corresponden a los casos registrados en la revisión. Las verificaciones del sitio no sustituyen una ejecución del paquete en la aplicación consumidora. La cobertura web se registra por familias: Buttons, Extended FABs, FAB menu, FABs e Icon buttons tienen ejemplos interactivos y matrices de navegador; las otras 33 familias siguen pendientes. La revisión automatizada de foco y teclado no sustituye una comprobación con lectores de pantalla.

## Estilo y licencias

Se conservan MD3 Baseline, Roboto y Material Symbols Rounded. Los nuevos cambios deben usar los roles semánticos y componentes de documentación existentes; consulta [CONTRIBUTING.md](CONTRIBUTING.md).

El código de documentación se distribuye bajo [MIT](LICENSE). Las fuentes y recursos mantienen sus licencias y atribuciones en `dist/assets/`. Este proyecto es independiente de Google; Material Design 3 es su referencia de diseño.

La galería de FAB menu abre con la presentación Expressive: pastillas sin sombra y cierre circular. `presentation="expressive"` permite usar esa presentación en web; `adaptive` conserva el menú baseline de navegador indicado por la referencia. La lista de más de seis acciones permanece identificada como extensión.
