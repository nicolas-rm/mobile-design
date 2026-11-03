# Verificación del sitio · 3 de noviembre de 2026

## Segmented buttons, Split button y Cards

- Se consultaron Overview, Specs, Guidelines y Accessibility actuales de las tres familias, incluidas descripciones de imágenes y demostraciones. Segmented buttons se conserva como familia publicada; Connected button groups es la recomendación para diseños Expressive nuevos.
- SegmentedButtons original mide las etiquetas con la fuente real en web, conserva segmentos de igual ancho y separa el objetivo de 48 dp de las cuatro alturas visuales. Incluye selección única/múltiple, iconos/check, contenido uniforme, teclado y RTL.
- SplitButton original conserva cinco tamaños, cuatro estilos, separación de 2 dp, objetivos de 48 dp, giro y forma del chevrón y anclaje a 4 dp de la superficie visual. Bloquear un menú controlado también descarta la solicitud de apertura, evitando que reaparezca al habilitarlo.
- Card original utiliza el ripple compartido en web, recortado al radio de 12 dp; conserva Pressable nativo. href permite enlaces reales del navegador. Se distinguen contenedores con acciones internas y superficies directamente pulsables, sin anidar controles.
- Tres galerías interactivas y tres módulos descargables nuevos: filtros de precio, envío con alternativas y colección con archivo/deshacer. Los ejemplos de uso incluyen reservas, datos por periodo, compra, rutas, velocidad, destinos, transformación a detalle, controles independientes, expansión y siete distribuciones de colección.
- El catálogo consume Card original con 36 enlaces reales. Los encabezados de ejemplos descargables utilizan SplitButton original para copiar, descargar y copiar el enlace. Se verificaron estas acciones y la limpieza de portales al cambiar de ruta.
- Matriz nueva: 192 configuraciones de Segmented buttons, 120 de Split button y 72 de Cards: 384 en total. Además: selección, teclado, objetivos de presión, RTL, cancelación, foco, ripple, movimiento reducido, acciones, arrastre y deslizamiento reales, deshacer y anchos 320/390. Los resultados y capturas se guardan en .artifacts/segmented-split-cards-web/.
- El runtime y los 46 módulos descargables compilan contra el paquete; los 37 bloques automáticos del paquete también pasan con fronteras nativas simuladas. No se realizó una nueva verificación visual en dispositivo.
- Repetida la matriz de 180 configuraciones de Buttons sobre la exportación final: presión, tacto, teclado, cancelación, carga, temas y movimiento sin regresiones.
- Corregida la inserción del JSON de datos en HTML para conservar literalmente secuencias como $' en ejemplos de precios. Las huellas, los datos integrados y las 170 rutas mantienen sus comprobaciones estáticas.
- Alcance actual: ocho familias web interactivas y 28 pendientes. Las pruebas anteriores sumaban 1,032 configuraciones; esta entrega añade 384 (1,416 acumuladas). Esa cifra no representa una repetición de las matrices anteriores ni acredita otros motores o lectores de pantalla.

Las secciones siguientes conservan los resultados de entregas anteriores.

## Contenido visible y pareja FABs / Icon buttons

- Código de configuración, capturas, muestras y contratos TypeScript completos permanecen visibles. Se retiraron los acordeones de contenido y de grupos del catálogo. Las explicaciones usan texto normal; código, firmas e identificadores conservan tipografía de código. Los selectores de configuración siguen compactos.
- FABs monta el componente original: tamaños 56/80/96, iconos rellenos, seis pares de color, presencia, teclado, ayuda contextual y anclaje durante el desplazamiento. Cinco tareas permiten abrir, confirmar, cancelar y recuperar el foco.
- Icon buttons monta el original con Default/Toggle, cuatro tratamientos, cinco tamaños, tres anchuras y dos formas. Incluye selección, reproducción, llamada local y menú con copia al portapapeles; no simula una llamada ni reproducción de audio real.
- Se corrigió el objetivo web compartido de Button/IconButton: el área real responde en los cuatro lados de los 48 × 48 mínimos, mientras la superficie y la máscara del ripple conservan las dimensiones visuales y las esquinas animadas. La rama nativa conserva hitSlop y su indicación original.
- Tooltip permite configurar anchorStyle para que la composición centre acciones de alturas diferentes sin desplazar sus glifos. El ejemplo de reproducción comprueba ese centro común.
- La página consume IconButton original en tema, movimiento, apertura/cierre de navegación y búsqueda, enlaces de apartados y controles de captura. Conserva un único proveedor; se comprobaron portales, retorno de foco móvil, diálogo de búsqueda, copia y reemplazos de ruta. Los enlaces, campos y filtros restantes conservan su implementación del sitio.
- Matriz nueva: 36 configuraciones de FABs y 480 de Icon buttons. Además: colores semánticos, medición, presión/cancelación, transiciones interrumpidas, disabled/loading, teclado, tacto, RTL, movimiento reducido y anchos 320/390.
- Regresiones de Buttons (180), Extended FABs (144), FAB menu (192) y controles de la página sobre los componentes compartidos. Total: 1,032 configuraciones entre las cinco familias; sin errores de página ni recursos fallidos en los recorridos aprobados.
- El runtime y los 43 módulos descargables compilan contra el paquete. Verificador integral de 37 bloques aprobado; contrato de Tooltip repetido después del ajuste de composición. Son verificaciones automáticas con fronteras nativas simuladas, sin nuevo recorrido visual en dispositivo.
- Alcance actual: cinco familias web interactivas y 31 pendientes. El navegador de verificación fue Chromium; otros motores y lectores de pantalla web no se dan por acreditados con esta matriz.

## Corrección visual del FAB menu Expressive

- El token oficial `md.comp.fab-menu.menu-item.container.elevation` marca 0dp. Los ítems compartidos utilizaban erróneamente la elevación 3 del FAB; ahora son planos. El cierre conserva la elevación que le corresponde.
- Se mantiene altura de ítem 56, radio 28, icono 24, tipografía titleMedium, padding lateral 24, separación icono/etiqueta 8 y separación entre ítems 4. El cierre mide 56 y conserva la esquina superior final del FAB Small/Medium/Large.
- La galería inicia con M3 Expressive. `presentation="expressive"` permite mostrar el motor original de pastillas también en web. `adaptive` mantiene la adaptación baseline de navegador indicada por la referencia; no se confunde el cambio de perfil de movimiento con la presentación visual.
- Matriz ampliada con 90 configuraciones Expressive en ambos temas. Comprueba geometría, ausencia de sombras, cierre, anclaje y orden de Tab. Junto con los 102 casos existentes cubre 192 configuraciones de FAB menu.
- La lista de ejemplos de App bars utiliza iconos propios de cada destino y etiquetas breves. El nombre accesible conserva el título completo. Sus más de seis opciones siguen siendo una extensión solicitada para navegar por las demostraciones.
- El runtime y los 43 ejemplos compilan contra el paquete. Aprobados el verificador integral, los 161 contratos de acciones y los 45 escenarios de App bars con fronteras nativas simuladas. No se realizó un recorrido visual en dispositivo en esta corrección.

## FAB menu: tercera familia y consumo en la página

- FAB menu monta `FAB.Menu` original. El patrón web utiliza Menu baseline anclado; `overflow="scroll"` muestra por separado la extensión de pila desplazable del paquete.
- 102 configuraciones verificadas: 36 combinaciones de tema/tamaño/color, 60 de tema/tamaño/número de acciones/escenario y seis de tamaño/altura para la pila. Además, teclado, Escape inmediato durante apertura, Tab, flechas, Inicio/Fin, búsqueda por prefijo y retorno de foco.
- Corregidos en los originales compartidos: colocación al extremo final y RTL sin doble inversión, semántica expandida/de menú, descubrimiento de comandos deshabilitados, medición web de pastillas, cierre único por acción y exclusión de elementos ocultos del teclado. El cierre no roba un foco que ya salió del menú.
- Popup utiliza el viewport visual del navegador en lugar de `Keyboard.metrics`, y su área de cierre exterior no añade una parada invisible de Tab.
- Los ejemplos crean contenido local o copian datos reales al portapapeles. La pila conserva el cierre dentro del área de ejemplo y permite desplazar sus 12 acciones sin botones extra. Comprobados altura limitada, RTL, movimiento reducido y anchos de 390/320.
- La página ya consume `Button` original para copiar código, limpiar filtros y las acciones con etiqueta de tema/movimiento. Un único proveedor y portales mantienen el control en su posición del artículo. Veinte reemplazos de ruta, copia pendiente al salir, foco, temas y adaptación comprobados sin duplicación ni errores.
- La migración de los demás controles de la página sigue pendiente: navegación, búsqueda, filtros e iconos conservan su implementación del sitio. Las ilustraciones del catálogo continúan siendo decorativas.
- TypeScript del runtime, 43 ejemplos TSX y el verificador integral del paquete aprobados. El contrato de Menu se repitió tras el ajuste final de Escape. Estas comprobaciones utilizan fronteras nativas simuladas; no se ejecutaron recorridos visuales nativos en esta entrega.
- Regresiones aprobadas sobre la misma exportación final: 180 configuraciones de Buttons, 144 de Extended FABs y los controles originales de la página; 426 configuraciones entre las tres familias.
- Alcance web actual: tres familias interactivas y 33 pendientes. La ejecución automatizada se realizó en Chromium; los lectores de pantalla y los demás motores de navegador siguen pendientes.

Los apartados siguientes conservan el registro de entregas anteriores; sus cifras de soporte describen el alcance en cada entrega.

## Extended FABs: segunda familia interactiva

- El runtime compartido monta Buttons y Extended FABs desde el paquete original. La exportación pasa a `runtime/components`; se retira la exportación anterior para evitar dos implementaciones o recursos duplicados.
- Revisados Overview, Specs, Guidelines y Accessibility de la referencia actual. Se conservan Small/Medium/Large (56/80/96), seis pares de color, icono opcional, etiqueta breve, márgenes y colocación. No se agregan estados loading/disabled a la API del FAB.
- Correcciones en el original compartido: medición web de texto con `onLayout`, efecto de pulsación compartido, foco de teclado y retirada de interacción/semántica cuando está oculto. El icono Large se centra al contraerse sin cambiar sus dimensiones.
- Matriz de 144 configuraciones: tres tamaños × seis colores × icono presente/ausente × expandido/contraído × ambos temas. Se comprueban medidas, radios, colores, tipografía, alineación, nombre accesible y activación única.
- Ejemplos locales de correo, carrito, publicación, tareas y vuelos; apertura, confirmación, cancelación, Escape y retorno de foco. La transformación utiliza `ContainerTransformSurface` del paquete y sus tokens de duración/easing, conservando el contenido a su tamaño final.
- Desplazamiento hacia abajo/arriba, colocación centrada/final y navegación expandida con elevación cero. El rail sólo se ofrece cuando el ancho permite mostrarlo.
- Comprobados ocultación, teclado, ripple, animación interrumpida, RTL, movimiento reducido, tacto y anchos de 390/320. No se sustituyen etiquetas largas por texto truncado; el área de exploración permite desplazamiento local.
- Nuevo ejemplo TSX descargable de colapso al desplazar y creación de una nota. Los 43 ejemplos compilan contra la API del paquete.
- El alcance web sigue siendo parcial: dos familias interactivas y 34 pendientes. No se ejecutaron recorridos visuales nativos en esta entrega.

## Buttons: primera familia interactiva

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
