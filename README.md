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
- 42 ejemplos React Native descargables, incluidos Search view, selección de rango, Input chips, menú → diálogo, contraseña y progreso → success.
- 72 capturas nativas, claras/oscuras, de la revisión iOS del 2 de noviembre de 2026.
- Búsqueda de guías, componentes y propiedades; temas claro/oscuro, navegación adaptable, enlaces directos a apartados, foco visible y reducción de movimiento.

Las ilustraciones del catálogo son decorativas. Las fichas muestran capturas nativas y código TSX; no ejecutan imitaciones HTML del componente. Las fuentes de diseño MD3 aparecen como bibliografía complementaria identificada.

## Plataformas

| Entorno | Alcance |
| --- | --- |
| React Native con Expo | Entorno principal del paquete documentado. |
| React Native con módulos Expo integrados | Requiere los peers y su configuración nativa. |
| iOS | Evidencia de ejecución representativa registrada en el cierre nativo. |
| Android | Objetivo de implementación; no se ejecutó durante el último cierre iOS. |
| Expo Web / React Native Web | **Pendiente de verificación integral.** El código existente se conserva. |
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

## Organización

| Ruta | Responsabilidad |
| --- | --- |
| `dist/` | Sitio estático listo para servir. |
| `dist/component-docs.js` | Presentación autosuficiente de las fichas. |
| `dist/site-sections.js` | Portada, contenido editorial, arquitectura de navegación y pie del sitio. |
| `dist/structure.css` | Composición editorial y navegación adaptable con roles MD3. |
| `dist/illustrations.js` | Ilustraciones decorativas, sin runtime de componentes. |
| `dist/examples/` | Ejemplos nativos TSX descargables. |
| `dist/native/` | Capturas nativas claras/oscuras. |
| `content/` | Descripciones, integración, comportamiento, accesibilidad y ejemplos fuente. |
| `scripts/` | Servidor, comprobaciones y sincronización opcional. |
| `AGENTS.md` / `CONTRIBUTING.md` | Estándar MD3 y reglas de contribución. |

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

`npm test` comprueba cobertura de fichas, contratos, estado web pendiente, recursos, ejemplos, igualdad de datos integrados, sintaxis JavaScript y enlaces de la arquitectura editorial (170 rutas). Se ejecuta en GitHub Actions sin acceso a la app.

`npm run check:examples` compila los 42 ejemplos contra el paquete indicado. Esa comprobación requiere su workspace; no se presenta como una prueba de píxeles, gestos o rendimiento.

Los resultados nativos publicados proceden del cierre iOS del 2 de noviembre. Las verificaciones del sitio no sustituyen una ejecución del paquete en Android o navegador. El soporte web de los componentes se mantiene expresamente pendiente.

## Estilo y licencias

Se conservan MD3 Baseline, Roboto y Material Symbols Rounded. Los nuevos cambios deben usar los roles semánticos y componentes de documentación existentes; consulta [CONTRIBUTING.md](CONTRIBUTING.md).

El código de documentación se distribuye bajo [MIT](LICENSE). Las fuentes y recursos mantienen sus licencias y atribuciones en `dist/assets/`. Este proyecto es independiente de Google; Material Design 3 es su referencia de diseño.
