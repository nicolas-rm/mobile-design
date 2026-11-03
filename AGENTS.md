# Mobile Design · estándar de documentación MD3

Este repositorio contiene la documentación web del paquete Mobile Design para React Native con módulos Expo. No contiene la app Music Design ni distribuye el paquete nativo en npm.

- Mantén nombres, orden y agrupación del catálogo MD3 sincronizados desde el paquete original.
- Conserva el lenguaje visual existente: roles semánticos MD3 Baseline, temas claro/oscuro, Roboto, Material Symbols Rounded, formas y movimiento accesibles.
- Cada ficha concentra uso, integración, funcionamiento, variantes/configuraciones, API, ejemplos y accesibilidad. Los enlaces externos son bibliografía complementaria y deben identificarse como externos.
- No añadas bloques de fuentes de diseño ni enlaces de referencia a MD3 en el contenido visible. Conserva las licencias y atribuciones obligatorias de los recursos.
- La fuente de verdad de la API es TypeScript del paquete. Los ejemplos importan `mobile-design`; no se presentan controles HTML simulados como ejecución del componente original.
- Las ilustraciones del catálogo son decorativas. Los ejemplos interactivos montan el componente original mediante React Native Web y se registran en `dist/web-examples.js`; no son réplicas HTML.
- Buttons, Extended FABs y FAB menu cuentan con integración web y sus matrices de navegador. Las otras 33 familias siguen pendientes de verificación. Conserva las implementaciones existentes y no publiques compatibilidad integral sin ejecutarla.
- Los botones de acción de la página se montan desde `runtime/docs-controls.tsx` con un único proveedor y portales. Libera los portales antes de sustituir su contenedor. Navegación, buscador y otros controles aún conservan su implementación del sitio; no presentes la migración como completa.
- Presenta la evidencia visible sin nombres de sistemas operativos, modelos de dispositivo ni referencias al lugar donde se ejecutó. Conserva el alcance de los casos revisados y el soporte web pendiente, sin afirmar compatibilidad universal. La trazabilidad técnica puede mantenerse en los registros de verificación.
- El sitio debe ejecutar `npm start` y `npm test` después de clonar este repositorio, sin necesitar la app original ni rutas personales.
- `npm run sync -- --package-dir /ruta/mobile-design` y `npm run check:examples -- --package-dir /ruta/mobile-design` necesitan el paquete nativo y su workspace configurado.
- `npm run build:web -- --package-dir /ruta/mobile-design` necesita ese workspace con Expo y dependencias web; `npm run test:web` verifica el runtime precompilado con Chrome/Chromium. Actualiza las huellas con `npm run assets` después de construirlo.
- Mantén en GitHub solamente este proyecto de documentación, sus recursos, datos sincronizados y ejemplos. No añadas credenciales, perfiles, logs locales ni archivos de la app.
- Conserva la audiencia del Site al publicar sus cambios. El repositorio de GitHub y el acceso al sitio son configuraciones distintas.
