# Mobile Design · estándar de documentación MD3

Este repositorio contiene la librería Mobile Design para React Native con módulos Expo y su documentación web. El código fuente y las pruebas de los paquetes viven en `library/`.

- Mantén nombres, orden y agrupación del catálogo MD3 sincronizados desde el paquete original.
- Conserva el lenguaje visual existente: roles semánticos MD3 Baseline, temas claro/oscuro, Roboto, Material Symbols Rounded, formas y movimiento accesibles.
- Cada ficha concentra uso, integración, funcionamiento, variantes/configuraciones, API, ejemplos y accesibilidad. Los enlaces externos son bibliografía complementaria y deben identificarse como externos.
- No añadas bloques de fuentes de diseño ni enlaces de referencia a MD3 en el contenido visible. Conserva las licencias y atribuciones obligatorias de los recursos.
- La fuente de verdad de la API es TypeScript del paquete. El runtime usa `mobile-design/react-native-web` y los ejemplos descargables usan `mobile-design/react-native`.
- Las ilustraciones del catálogo son decorativas. Los ejemplos interactivos montan el componente original mediante React Native Web y se registran en `dist/web-examples.js`; no son réplicas HTML.
- Las 36 familias cuentan con integración web mediante los originales del paquete. Conserva todos los runtimes del manifiesto. Las 25 incorporaciones más recientes se comprueban con `test:web:remaining` y se registran por parejas en QA.md; conserva las matrices anteriores. La cobertura ejecutada no equivale a compatibilidad universal ni a fidelidad visual de todas las combinaciones.
- La galería FAB menu muestra primero `presentation="expressive"`, con ítems de elevación 0 y cierre circular. La opción adaptive conserva el menú baseline web; cambiar el perfil de movimiento no cambia la presentación.
- El catálogo consume Card original con href y ButtonGroup Connected para sus categorías; los encabezados de ejemplos descargables consumen SplitButton original para copiar/descargar. No recrees esas superficies en CSS.
- Los botones de acción e iconos de la página se montan desde `runtime/docs-controls.tsx` con un único proveedor y portales. Libera los portales antes de sustituir su contenedor. La cabecera móvil consume TopAppBar y el contador del buscador consume Badge. La navegación y otros controles aún conservan parte de la implementación del sitio; no presentes la migración como completa.
- Los textos editoriales consumen Text original mediante `runtime/docs-typography.tsx`, bajo el proveedor compartido. Conserva el HTML semántico de encabezados, enlaces, listas y tablas. El código, los glifos de iconos y los valores de campos editables conservan sus renderers específicos. Los ejemplos React consumen Text directamente con `runtime/prose.tsx`; no modifiques su DOM desde el observador del sitio. Mantén la comprobación de las 170 rutas y los 37 runtimes del manifiesto (36 familias y Text) en `test:web:page-typography`.
- Mantén código, capturas, contratos y muestras visibles sin desplegables. Los selectores de configuración conservan su forma compacta. Usa tipografía de código sólo para código, firmas e identificadores; las explicaciones usan texto normal.
- Presenta la evidencia visible sin nombres de sistemas operativos, modelos de dispositivo ni referencias al lugar donde se ejecutó. Describe el alcance de los casos revisados y los límites de la cobertura web. La trazabilidad técnica puede mantenerse en los registros de verificación.
- El sitio debe ejecutar `npm start` y `npm test` después de clonar este repositorio, sin necesitar la app original ni rutas personales.
- Desde la raíz, instala el workspace con `(cd library && pnpm install --frozen-lockfile)` y verifica los paquetes con `(cd library && pnpm test)`.
- `npm run sync`, `npm run check:examples` y `npm run build:web` resuelven los paquetes desde `library/`. `npm run test:web` verifica el runtime precompilado con Chrome/Chromium. Actualiza las huellas con `npm run assets` después de construirlo.
- Incluye la librería, su documentación, pruebas y recursos. Mantén fuera las credenciales, perfiles, logs locales y archivos de aplicaciones consumidoras.
- Conserva la audiencia del Site al publicar sus cambios. El repositorio de GitHub y el acceso al sitio son configuraciones distintas.
