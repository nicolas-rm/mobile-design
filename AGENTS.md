# Mobile Design · estándar de documentación MD3

Este repositorio contiene la documentación web del paquete Mobile Design para React Native con módulos Expo. No contiene la app Music Design ni distribuye el paquete nativo en npm.

- Mantén nombres, orden y agrupación del catálogo MD3 sincronizados desde el paquete original.
- Conserva el lenguaje visual existente: roles semánticos MD3 Baseline, temas claro/oscuro, Roboto, Material Symbols Rounded, formas y movimiento accesibles.
- Cada ficha concentra uso, integración, funcionamiento, variantes/configuraciones, API, ejemplos y accesibilidad. Los enlaces externos son bibliografía complementaria y deben identificarse como externos.
- La fuente de verdad de la API es TypeScript del paquete. Los ejemplos importan `mobile-design`; no se presentan controles HTML simulados como ejecución del componente original.
- Las ilustraciones del catálogo son decorativas; la evidencia de la implementación se presenta con capturas nativas y ejemplos TSX.
- El soporte de componentes en Expo Web / React Native Web está pendiente de verificación. Conserva las implementaciones existentes y el estado pendiente; no publiques compatibilidad integral sin ejecutarla.
- Separa evidencia de iOS, Android, navegador, lector de pantalla y texto ampliado. Una captura y una compilación de tipos acreditan cosas diferentes.
- El sitio debe ejecutar `npm start` y `npm test` después de clonar este repositorio, sin necesitar la app original ni rutas personales.
- `npm run sync -- --package-dir /ruta/mobile-design` y `npm run check:examples -- --package-dir /ruta/mobile-design` necesitan el paquete nativo y su workspace configurado.
- Mantén en GitHub solamente este proyecto de documentación, sus recursos, datos sincronizados y ejemplos. No añadas credenciales, perfiles, logs locales ni archivos de la app.
- Conserva la audiencia del Site al publicar sus cambios. El repositorio de GitHub y el acceso al sitio son configuraciones distintas.
