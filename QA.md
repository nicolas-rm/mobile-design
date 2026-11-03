# Verificación del sitio · 3 de noviembre de 2026

## Integración web vigente: Buttons

- El ejemplo interactivo monta `Button` del paquete original mediante Expo y React Native Web. Mantiene su proveedor, tokens, fuentes, iconos y animación; no utiliza una recreación HTML del botón.
- 180 configuraciones aprobadas: Default/Toggle, cinco estilos (cuatro en Toggle), cinco tamaños, dos formas y ambos temas.
- Comprobados teclado, foco visible, activación única, origen del ripple, animación y cancelación, pulsaciones rápidas, carga, bloqueo durante una pulsación, operación asíncrona y limpieza al abandonar el ejemplo.
- Corregida la máscara del ripple en el original web compartido: hereda las cuatro esquinas animadas del control en vez de conservar las esquinas del instante inicial. Comparados fotogramas al pulsar y soltar, con ambas formas y los estados de selección, además de pulsación táctil mantenida.
- Comprobados movimiento reducido del sistema y del sitio, perfiles de movimiento, dirección RTL, alineación de icono/texto, cambio de tema conservando estado y anchos de 390/320 px sin overflow.
- Las fuentes web son conversiones WOFF2 completas de las originales. Se compararon los once archivos: mapa de caracteres, orden de glifos, métricas y ejes variables conservados.
- Recorridas de nuevo las 170 rutas; aprobadas navegación móvil, búsqueda, filtros de API, enlaces de apartados, temas y reducción de movimiento. Sin errores de página ni respuestas HTTP fallidas.
- `npm test` comprueba los recursos del runtime, sus huellas de contenido y el alcance web parcial. Las otras 35 familias conservan sus implementaciones y siguen pendientes de ejecución web.
- Las verificaciones del paquete no sustituyen un recorrido visual nativo. No se abrió un simulador ni un dispositivo para esta entrega.
- El verificador integral del paquete también terminó sin errores, incluido TypeScript y los contratos de interacción y ciclo de vida existentes.

Las secciones siguientes conservan el registro de entregas anteriores; sus límites de soporte web describen esas entregas, anteriores al runtime interactivo de Buttons.

## Limpieza de referencias visibles

- Retirado el bloque de fuentes de diseño de todas las fichas y los enlaces de referencia externos de las páginas editoriales.
- Unificados los textos de portada, capturas, descripciones de imágenes, accesibilidad, desarrollo, soporte, verificación y búsqueda sin nombres de sistemas operativos ni modelos de dispositivo.
- 170 rutas comprobadas en navegador: sin el bloque retirado, enlaces de referencia externos ni nombres de sistemas operativos en contenido visible o descripciones de imágenes. Se verificó también la búsqueda de soporte.
- Navegación, temas, filtros y layout adaptable aprobados. Los registros técnicos anteriores conservan la trazabilidad de las revisiones.

## Arquitectura y estilo editorial MD3

- Revisión de la portada y navegación reales de Material Design 3: destinos principales, menús por sección, guías de fundamentos y estilos, tarjetas editoriales y pie de página.
- Portada propia y siete destinos principales: Inicio, Comenzar, Desarrollo, Fundamentos, Estilos, Componentes y Recursos. No se inventan noticias, versiones ni recursos de diseño del proyecto.
- 16 guías editoriales, cinco temas de estilo con contenido reutilizado y ampliado, instalación/proveedor y fichas separadas de elevación y espaciado.
- 170 rutas recorridas en Chrome aislado, esperando la ruta renderizada y comprobando destino activo, título, identificadores únicos, anclas y ausencia de overflow del documento.
- 11 rutas representativas revisadas a 390 px y portada a 320 px. Verificados menú móvil, fondo inerte, cierre con Escape, restauración de foco, búsqueda de guías y componentes, filtros de API, enlaces de apartados, temas e imágenes y movimiento reducido.
- Cero errores de página y cero respuestas HTTP fallidas en el recorrido. Revisión visual de portada, Fundamentos y Color; capturas de escritorio/móvil y ambos temas guardadas fuera del repositorio.
- `npm test` incorpora validación de destinos y enlaces editoriales, además de los contratos y recursos nativos existentes.
- La primera apertura publicada mezcló el HTML nuevo con JavaScript almacenado de la versión anterior. Se añadieron huellas de contenido a módulos, CSS y fuente de iconos, y comprobaciones de consistencia para impedir esa mezcla entre entregas.
- Los 42 módulos de ejemplo, las 72 capturas y el catálogo sincronizado no cambiaron. El soporte web del paquete continúa pendiente y su código se conserva.
- No se ejecutaron pruebas nativas ni se modificó la app para esta entrega. La revisión de ejemplos queda para la siguiente etapa solicitada.

## Revisión vigente: documentación nativa y repositorio autónomo

- 36 fichas con integración, funcionamiento, accesibilidad, responsabilidades, API y tipos relacionados dentro del sitio.
- 42 módulos TSX compilados sin errores contra el paquete local.
- 72 capturas nativas claras/oscuras. Las fichas no montan controles HTML que imiten el runtime del paquete.
- 144 secciones recorridas en una sesión aislada de Chrome: títulos, contenido propio, API y ausencia de enlaces MD3 visibles como contenido principal.
- Diez comprobaciones adicionales de navegación, búsqueda, filtros, imágenes por tema, ancla de código, soporte pendiente y menú móvil. Cero errores de página o peticiones fallidas.
- Copia del proyecto fuera del workspace: `npm test` aprobado y `npm start` servido en el puerto 4320 sin la app nativa ni rutas personales.
- El controlador del navegador integrado devolvió `browser.user is unavailable`; se utilizaron Chrome local aislado y Playwright Core en una carpeta temporal de QA. No se accedió al perfil del navegador del usuario.
- La captura móvil se tomó después de completar la salida del drawer; el primer fotograma se había capturado durante esa transición.
- Se conserva íntegro el código de soporte web del paquete nativo. Su validación sigue pendiente; ninguna prueba del sitio se presenta como validación de React Native Web.
- El repositorio contiene el estándar MD3 en AGENTS/CONTRIBUTING y una comprobación autónoma para GitHub Actions.

## Historial: primera versión, anterior a la depuración

Los recorridos que siguen corresponden a la primera versión del sitio. Sus representaciones HTML interactivas fueron retiradas en la revisión vigente; estas notas no describen el runtime actual de las fichas.

## Datos y código

- 36 familias, nombres y orden sincronizados desde `packages/mobile-design/src/catalog.ts`.
- 601 propiedades extraídas de los tipos actuales mediante el checker de TypeScript; se excluyen hooks de composición identificados como internos.
- 36 módulos de ejemplo TSX completos: compilación sin errores contra el paquete local. La primera pasada detectó `key` ausente en una acción del ejemplo App bars; se corrigió el ejemplo y se repitió la comprobación.
- 36 capturas nativas de la matriz iOS del 2 de noviembre incluidas en `dist/native/`.
- Comprobación estática aprobada: cobertura, archivos, ejemplos descargables, tarjetas sin controles interactivos anidados en enlaces, paleta canónica y sintaxis JS.
- Roboto y el subconjunto oficial de Material Symbols Rounded se sirven desde archivos locales.
- La primera captura del proveedor se tomó durante el fetch inicial del catálogo. Los mismos datos se integraron en el HTML para que el módulo renderice al arrancar, sin esa petición adicional. Se verifica igualdad entre el JSON integrado y `data.json`.

## Navegador

Se recorrieron las cuatro secciones de las 36 fichas: **144 secciones aprobadas**, comprobando el título, Dimensiones, tabla de API no vacía y Semántica e interacción. La comprobación inicial necesitó esperar a la sección nueva tras cambiar el hash; se corrigió el recorrido sin alterar el contenido para satisfacerlo.

Acciones observadas:

- Button: Guardar → Guardado y estado seleccionado.
- API: filtrar `selected` deja una propiedad visible.
- Copiar código: confirmación de escritura en el portapapeles.
- Búsqueda global: `pestañas` encuentra Tabs; Enter abre su ficha.
- Tabs: ArrowRight selecciona Podcasts y actualiza su panel.
- Tema oscuro: paleta compartida Primary `#D0BCFF` y persistencia al recargar.
- Search: Borrar oculto en vacío; escribir Long muestra un resultado; limpiar retira la acción.
- FAB menu: apertura con opciones y cierre de la pila.
- Evidencia: imagen nativa de FAB menu cargada con ancho original de 1320 px.
- Viewport estrecho: menú con foco inicial y fondo inerte, Escape devuelve el foco a Abrir navegación, seleccionar Tabs cierra el panel.
- Ancho estrecho observado de 325 px CSS, sin overflow horizontal del documento. La tira de secciones y las tablas largas tienen su propio scroll.
- Inspección de consola del navegador sin errores.

Se corrigieron el marcado de las tarjetas estáticas, el acceso al contenido sin alterar la ruta, la disponibilidad del menú fuera del viewport, el foco de su cierre y el scrim decorativo excluido del árbol accesible. Se observaron capturas en escritorio y móvil, claro/oscuro, con el navegador integrado. Se retiró el override temporal de viewport al terminar.

## Alcance

Las demostraciones del navegador son representaciones web identificadas como tales. La página no monta el renderer React Native ni mide sus animaciones. Los ejemplos TSX y las capturas nativas corresponden al paquete; los 65 casos nativos y los 37 bloques descritos en Verificación proceden del cierre del 2 de noviembre, no de una repetición nativa durante la creación de este sitio.

No se ejecutaron nuevos recorridos en simulador ni se cambió el código de los componentes de la app para crear esta página.
