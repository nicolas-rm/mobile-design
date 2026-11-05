# Verificación del sitio · 3 de noviembre de 2026

## Catálogo restante · revisión local por parejas

Las 25 familias que faltaban ya montan los componentes originales mediante React Native Web. El manifiesto contiene las 36 familias y Text. Se portaron 22 módulos de las galerías originales; `runtime/showcases/provenance.json` conserva las huellas de origen. Los ejemplos de ventanas acotadas comparten tema, dirección y preferencia de movimiento; las escenas de navegación tienen su propio contexto. Código, capturas y configuración editorial permanecen visibles; los menús y las listas expandibles siguen siendo interacciones del propio ejemplo.

| Pareja | Familias                                | Configuraciones y recorridos incluidos                                                                                                                          |
| ------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | Carousel · Checkbox                     | Seis disposiciones, máscaras/parallax, colección y visor; selección total, parcial, guardado, error y bloqueo.                                                  |
| 2      | Chips · Date pickers                    | Assist/filter/input/suggestion, edición y eliminación; docked, modal, entrada, período, pantalla completa, años y restricciones.                                |
| 3      | Time pickers · Dialogs                  | Reloj/entrada, 12/24 h, borrador, confirmación y cancelación; diálogos básicos, desplazables, pantalla completa, descarte, error/reintento.                     |
| 4      | Divider · Lists                         | Divisores completos/inset/verticales; filas estándar/segmentadas, selección, acciones independientes, expansión, swipe, reordenamiento y 20 pantallas de uso.   |
| 5      | Loading indicator · Progress indicators | Contenido/uncontained, tamaños, sustitución, anexado, pestaña y refresh; lineal/circular, plano/ondulado, determinado/indeterminado y pago → éxito.             |
| 6      | Menus · Navigation bar                  | Tres tratamientos, grupos, submenús y editor al cerrar; 3–5 destinos y contenido compartido/adaptable.                                                          |
| 7      | Navigation drawer · Navigation rail     | Secciones, contadores, estado activo, expansión, indicador y modales; composición de correo.                                                                    |
| 8      | Radio button · Search                   | Exclusividad y aplicación real; barra/vista, consulta, borrar, resultados, destino y guardado, carga y vacío.                                                   |
| 9      | Bottom sheets · Side sheets             | Estándar/modal, detents, scroll/contenido, formulario, adjuntos/vídeo; panel de detalle, borrador, aplicar/cancelar y bordes lógicos.                           |
| 10     | Sliders · Snackbar                      | Cinco tamaños, continuo/stops/centered/range, horizontal/vertical, valor editable y bloqueo; cinco configuraciones, cierre, duración y deshacer.                |
| 11     | Switch · Tabs                           | Tres configuraciones de iconos y efectos inmediatos; primary/secondary, fijo/scrollable, iconos/etiquetas/badges, jerarquía, pager y cinco pantallas completas. |
| 12     | Text fields · Toolbars                  | Filled/outlined, vacío/contenido/error, iconos, afijos, multilínea, contraseña y sólo lectura; docked/flotante, formato, guardado, overflow, FAB y orientación. |
| 13     | Tooltips                                | Plain/rich, hover/foco/pulsación larga, cinco anatomías, ayuda persistente y continuación local.                                                                |

Correcciones en los originales compartidos:

- RN Web recibe estados ARIA explícitos de selección, valores, expansión, carga y bloqueo. Checkbox/Radio Item conservan un único objetivo lógico y nombres de prueba distintos para el control decorativo. Espacio activa los controles de selección una vez al soltar; el responder conserva Enter.
- Avatar, drawer, búsqueda, tabs, swipe, toolbar, reloj, switch y campos usan la misma indicación compartida, respetando las esquinas y el área visual animada. El área de toque del calendario mide 48 dp y conserva la indicación circular de 40 dp; el año conserva la pastilla de 36 dp dentro del objetivo de 48.
- Carousel incorpora interrupción por rueda/puntero/tacto, arrastre de ratón y ajuste a los mismos keylines. TabsPager tiene un adaptador web de desplazamiento y finalización; el indicador sigue la fracción de página y las páginas inactivas quedan fuera de la interacción. Los paneles con altura explícita conservan esa altura.
- El calendario conserva foco entre fechas con flechas, Home/End y PageUp/PageDown, incluso al cambiar mes/año; el paginado web actualiza el encabezado al terminar el desplazamiento del usuario. Las flechas y el orden del paginado siguen RTL. La entrada manual sustituye al calendario si el ancho no permite objetivos utilizables; el borrador y la confirmación se conservan.
- Reordenar tiene acciones de teclado. Las acciones de swipe cerradas son inertes; Escape cierra la revelación. DockedDatePicker cierra con Escape. Los popups descartan sus acciones durante la salida.
- Los campos relacionan la ayuda/error/contador con su entrada y publican validación y bloqueo. Se retiró la interferencia del CSS editorial dentro de las ventanas originales.
- RichTooltip evita el foco modal en web, conserva acceso lineal al resto del documento y comparte Escape. Las ayudas exponen su función y descripción del ancla. Las hojas laterales exponen un diálogo nombrado.
- El progreso indeterminado no anuncia un porcentaje ficticio. Los ejemplos descargables muestran resultados de acciones y un deshacer real; el ejemplo con BottomSheetScrollView declara `scrollable`.

Las fotografías de Carousel y los recursos de Lists/Tabs se sirven localmente, con su procedencia y licencias. El reproductor de muestra sólo solicita el vídeo público al activar su reproducción.

La investigación se contrastó con el contenido oficial vigente `2026-10-13_06-10-19`, verificado el 3 de noviembre de 2026. Los inventarios de medios son una referencia de composición; no constituyen una medición temporal o una afirmación de identidad de todos los vídeos. La cobertura de navegador es de casos representativos; no certifica todos los motores, dispositivos, combinaciones, lectores de pantalla ni FPS. No se ejecutó una nueva verificación visual nativa en esta entrega. No se publicó, desplegó ni envió al remoto.

Evidencia reproducible: `npm run test:web:remaining` registra resultados, fotogramas/capturas y 13 archivos por pareja en `.artifacts/remaining-web/`. Los registros contractuales, de ejemplos, del sitio y de regresión de esta entrega están en `.artifacts/remaining-*.log`.

Resultado de cierre:

- Pasaron las **174 comprobaciones** de las 25 familias restantes, sin errores de página ni fallos de caso. Incluyen las 30 pantallas adicionales de uso y la integración de las 25 fichas. El registro está en `.artifacts/remaining-web/results.json`; los 13 informes conservan el detalle por pareja.
- La regresión general aprobó también todas las matrices anteriores: acciones, superficies, estados visibles, movimiento, tipografía, controles editoriales, Button groups y los 135 casos de App bars/Badges. Text se verificó en **170 rutas y 37 runtimes**. Su registro completo está en `.artifacts/remaining-regression.log`.
- El último recorrido táctil de esa regresión detectó que DockedDatePicker intentaba enfocar antes del montaje diferido del Portal y la medición de FlatList. Se corrigió en el original compartido: el foco espera al nodo del popup y a sus fechas; la observación se desconecta al enfocar o cerrar. Se exportó de nuevo y se repitieron sobre el `dist` local definitivo los **15 casos de Date pickers** y los **seis casos de tacto/atajos/movimiento reducido**, todos aprobados. No se contabiliza el intento anterior como aprobado. Evidencia final: `.artifacts/remaining-date-primary-final.log`, `.artifacts/remaining-touch-final.log` y sus JSON.
- Los seis casos finales prueban swipe táctil de Tabs en LTR/RTL, arrastre y ajuste de Carousel, cambio controlado del Slider, atajo de mes que mueve el foco sin abrir el selector y forma estática de carga con movimiento reducido. El movimiento normal se contrasta con fotogramas del morph SVG y del indicador de Tabs, sin atribuir esos resultados a FPS de hardware físico.
- Pasaron los **37 bloques automáticos del paquete**, la compilación de **51 ejemplos TSX** y la comprobación estática de las 36 fichas, 72 capturas existentes y 170 rutas. La exportación definitiva pasó TypeScript estricto y comparte la huella de fuentes del paquete actual. Las capturas nativas existentes no se presentan como nuevas pruebas visuales de esta entrega.

## Button groups · revisión local actual

- La ficha consume `ButtonGroup` original bajo `MobileDesignProvider`, con Text original para las explicaciones. Incluye Standard y Connected, cinco tamaños, Round/Square, etiquetas/iconos/ambos, Filled/Tonal/Outlined y Elevated en Connected, selección única/múltiple/opcional, densidad, anchos Narrow/Default/Wide, RTL, bloqueo y texto ampliado. El código, los estados y las muestras permanecen visibles.
- Se contrastaron Specs, Guidelines y Accessibility de MD3 y las nueve composiciones nativas existentes: Welcome, Video call, Files, Shopping, Filters, Calculator, The Lawerence tree, Photo actions y Dinner Club. El arte conserva su procedencia en `dist/assets/examples/button-groups/sources.json`; los controles son componentes vivos. Las continuaciones son locales: preferencias, formulario, llamada/chat, búsqueda/detalle de archivos, carrito, filtros, cálculo, reproducción simulada, favoritos, portapapeles y edición/archivo/eliminación reversible de una conversación de muestra. No se reproducen audios ni se contactan servicios reales en estas nueve pantallas.
- Correcciones en el original compartido: los objetivos web tienen 48 × 48 dp reales; el ripple usa la máscara compartida y sigue cada esquina animada sin cubrir el espacio transparente. Espacio confirma radio/checkbox una vez al soltar; Enter utiliza el responder web. Se distinguen foco de teclado y puntero, se publican los estados checked false/true y se cancela una pulsación al bloquear, desenfocar o cambiar configuración.
- El overflow comunica selección con `Menu.Item`, cierra antes de continuar, restaura el foco y admite Escape incluso durante la primera apertura. Las etiquetas invisibles conservan su medición natural sin ampliar el área desplazable. La medición de altura se invalida al cambiar geometría. Ancho y desplazamiento de presión se calculan juntos para evitar mezclar el ancho anterior con el nuevo padding al redimensionar.
- Los filtros de categorías de la página consumen Connected original; se retiraron sus superficies HTML/CSS anteriores. Las muestras grandes tienen scroll propio, los grupos de acciones permanecen en una línea y el overflow queda al extremo final. Los controles independientes de las pantallas pueden redistribuirse cuando el área disponible es estrecha.
- `test:web:button-groups` aprobó **420 configuraciones** de tema/variante/tamaño/forma/contenido/tratamiento, **30 combinaciones de ancho de iconos**, **20 combinaciones de densidad/tamaño** y **8 casos de movimiento por fotogramas** entre perfiles y direcciones. Verifica expansión sólo entre vecinos inmediatos, conservación del ancho total, anchos estables en Connected, máscaras por fotograma, borde exterior del objetivo XS, selección, teclado, cancelación, texto ampliado, cierre/foco del menú, las nueve pantallas a 320/390 px y filtros reales del catálogo. Los rectángulos de cada fila se leen en el mismo fotograma para no confundir movimiento entre lecturas con un cambio de separación.
- Pasan los 51 TSX descargables, la comprobación estática, los controles de la página y el consumo de Text en 170 rutas y 12 runtimes. Los contratos del original aprobaron 51 presupuestos de texto y 103 regresiones de interacción/accesibilidad/overflow; también pasan los 37 bloques generales del paquete.
- Evidencia local: `.artifacts/button-groups-web/results.json`, capturas de esa carpeta, `button-groups-final.log`, `button-groups-page-controls.log`, `button-groups-page-typography.log`, `button-groups-examples.log` y los registros contractuales en `/private/tmp/button-group-native-contracts.log` y `/private/tmp/button-groups-package-verification.log`. No se realizó una nueva inspección visual en simulador/dispositivo, medición de FPS, prueba completa de lector de pantalla ni de otros motores. No se publicó ni desplegó esta revisión.

## Select y Autocomplete · integración de la documentación

Los 91 selectores HTML de las galerías se sustituyeron por `Select` del paquete. `Autocomplete` recibe los resultados del buscador global y conserva enlaces con destino, coincidencias sin acentos, atajo de teclado y estado vacío. Los filtros de catálogo y API consumen `TextField` y el acceso lateral al buscador consume `Button`. Los enlaces de navegación conservan su semántica de enlace.

La prueba de los dos controles pasó en Chromium, WebKit y Firefox. Incluye selección con ratón y teclado, opciones deshabilitadas, cierre, un único paso de foco por selector, posición a 320 px y navegación desde los resultados. El tacto simulado se comprobó en Chromium y WebKit. El atajo global se verifica con foco en la página que contiene la documentación. La cabecera permite abrir el buscador mientras se usa una galería embebida.

Se repitieron las 420 configuraciones de Button groups, los ocho casos de movimiento y los nueve ejemplos de uso. La matriz de navegador también revisa densidad, anchos de icono, expansión entre vecinos y overflow. Los contratos compartidos pasaron 51 presupuestos de texto, 103 casos de interacción y 27 comprobaciones de ejemplos. La revisión visual de esta pasada se hizo en la documentación local.

## Buttons · revisión individual

La ficha usa `Button` de Mobile Design. La implementación resuelve tamaños, estados y cambios de forma, y usa primitivas de Paper para texto, iconos y pulsación. El código del configurador ahora representa las etiquetas editadas como cadenas JSX, incluidas las que contienen comillas, llaves o signos angulares. La vista y el código usan la misma etiqueta predeterminada cuando el campo queda vacío.

Pasaron las 180 configuraciones de Chromium con foco de teclado, pulsación, cancelación, carga, cambio de tema, RTL y vista estrecha. También pasaron los 161 contratos de acciones compartidas y los 37 de ejemplos de Buttons. La verificación de esta pasada cubrió navegador y contratos.

## Extended FABs y alineación de campos · revisión individual

- La demostración web recupera la etiqueta al subir o al llegar al final del contenido, igual que la galería nativa. El ejemplo descargable sigue la misma regla. Los formularios de Extended FABs y FABs usan el `TextField` del paquete, con foco inicial, envío por teclado, cancelación con Escape y retorno del foco.
- En iOS, el `TextField` de una sola línea deja que el editor nativo centre sus glifos. En el Autocomplete en línea, la misma letra subió 5 puntos respecto al icono en la comparación de capturas y el borde se mantuvo en 56 puntos. Se conservaron las métricas de los campos multilínea. Los casos web de Select y Autocomplete verifican que el campo mantenga su posición al escribir.
- A 320 px, la etiqueta de acceso a Comenzar desbordaba la ficha. La etiqueta más corta conserva el destino y cabe sin añadir desplazamiento horizontal al documento.
- Pasaron 144 configuraciones de Extended FABs con teclado, foco, animación, desplazamiento y cinco flujos. Se comprobó también el formulario en WebKit y Firefox, y los campos de texto, búsqueda, fecha y hora en las galerías web. La prueba del simulador confirmó la escritura en Autocomplete y la contracción y expansión de Extended FAB al desplazar.

## FAB menu · revisión individual

- Si las acciones Expressive superan la altura disponible, el menú abre junto al FAB y mantiene el cierre en su posición. La lista admite desplazamiento sin controles auxiliares. En web, Av Pág y Re Pág calculan el recorrido con la altura real del contenedor.
- Pasaron las 192 configuraciones de la galería. En Chromium, WebKit y Firefox se comprobó la apertura de seis acciones con altura limitada, el recorrido con rueda y teclado y el cierre con Escape.
- En el simulador, con seis acciones en horizontal, se comprobó que la última estaba visible al abrir y que la primera aparecía al arrastrar. El cierre circular de 56 puntos conservó su posición durante el gesto. Pasaron las pruebas por fotogramas con ambos perfiles y movimiento reducido.

## FABs · revisión individual

- El FAB enlaza su ayuda visible con el botón mediante `aria-describedby`. La ayuda se abre con foco o puntero y se cierra con Escape manteniendo el foco en el botón.
- Los ejemplos de FAB usan símbolos rellenos en las variantes de tamaño y en los flujos de la galería. El ejemplo nativo utiliza el mismo símbolo en el botón y al abrir el editor.
- Pasaron las 36 combinaciones de tamaño, color y tema, los cinco flujos de uso y las pruebas de movimiento. Chromium, WebKit y Firefox comprobaron la ayuda y el retorno del foco. En el simulador se verificaron los 80 puntos del FAB Medium, su posición al desplazar la biblioteca y la apertura del editor.

## Icon buttons · revisión individual

- Los ejemplos separan favorito y guardado. Los botones que alternan un estado conservan su nombre accesible y comunican la selección por separado. La ayuda visible sigue describiendo la acción disponible. Los controles equivalentes de Music siguen la misma convención.
- El botón de opciones anuncia que abre un menú y si está expandido. Chromium, WebKit y Firefox confirmaron la asociación de la ayuda, la selección por teclado, la independencia de ambos estados y el retorno del foco al cerrar el menú con Escape.
- En el simulador, marcar Favorito dejó Guardar documento sin seleccionar. Guardar después conservó ambos estados y el nombre accesible de Favorito.
- Pasaron las 480 configuraciones de Icon buttons, con pruebas de área táctil, animación de pulsación, cancelación, teclado y vista estrecha.

## Segmented buttons · revisión individual

- Tab entra por la opción seleccionada en selección única. Las flechas mueven el foco y Enter o Espacio activan la opción. Mantener Espacio produce una sola activación al soltarlo. Chromium, WebKit y Firefox confirmaron este recorrido.
- La muestra de código conserva los caracteres especiales de la etiqueta visible y del nombre accesible. El selector de sincronización de letras de Music tiene un nombre de grupo.
- Pasaron las 192 configuraciones de la galería, los recorridos a 320 y 390 px y los 16 casos de animación por fotogramas. En el simulador se comprobó que elegir Semana sustituye Día y que se puede desmarcar un día sin modificar los demás.

## Split button · revisión individual

- El comando principal y el menú conservan acciones independientes. La opción actual de velocidad o destino se anuncia y se distingue con una marca. Reabrir el menú interrumpe la entrega pendiente del cierre anterior.
- El menú calcula su posición respecto a la ventana visible, incluida la parte visible de la galería incrustada. La compra muestra el precio completo a 320 y 390 px y usa el tamaño mediano cuando el espacio es limitado.
- Chromium, Firefox y WebKit confirmaron el menú al desplazar la página, la selección con Espacio y el retorno del foco. La matriz de movimiento verificó el giro de ida y vuelta del chevrón con ambos perfiles y con movimiento reducido.
- En el simulador se comprobó la alineación de los cuatro estilos, la apertura de Programar envío desde el menú y el cambio de velocidad a 1.5×.

## Cards · revisión individual

- La capa de estado de la tarjeta queda por encima del contenido y dentro del radio de 12 dp. La pulsación con movimiento reducido conserva feedback visible sobre la imagen.
- Las opciones para mover usan el mismo orden y conjunto de tarjetas que el arrastre. El ejemplo de expansión anuncia su estado y el detalle devuelve el foco a la tarjeta de origen al cerrar con Escape.
- Pasaron 72 configuraciones, archivo y deshacer, movimiento por menú, arrastre, deslizamiento y anchos de 320 y 390 px. Chromium, Firefox y WebKit confirmaron la capa sobre la imagen, las acciones independientes y el retorno del foco. En el simulador se comprobó el detalle, el guardado, el regreso y el cambio de estado de la tarjeta seleccionable.

## Carousel · revisión individual

- Se contrastaron las seis disposiciones, los recortes de Multi-browse y Hero y las proporciones de Uncontained. El visor vertical permite entrar con Tab a la página activa y recorrerla con las flechas. El contorno de teclado queda dentro del recorte.
- Chromium, Firefox y WebKit recorrieron las cinco páginas del visor con movimiento normal y reducido. Se comprobaron también arrastre, ajuste al soltar y acceso a la colección. En el simulador se deslizó el carrusel horizontal, se abrió el elemento focal y se recorrió y cerró el visor vertical.

## Checkbox · revisión individual

- La fila etiquetada conserva un único objetivo de interacción. El nombre, la descripción y el estado parcial se exponen por separado en la web. La pulsación conserva una capa de 40 dp dentro del objetivo de 48 dp con movimiento reducido.
- Chromium, Firefox y WebKit confirmaron la selección parcial, Espacio y la pulsación con movimiento reducido. En el simulador se comprobó la selección total, el borrado de la selección y la actualización del estado parcial al marcar una opción.

## Chips · revisión individual

- Espacio cambia el estado del filtro al soltar la tecla. Perder el foco cancela una pulsación pendiente y mantener la tecla no repite la acción. Con movimiento reducido se muestra una sola capa de estado.
- Chromium, Firefox y WebKit confirmaron Espacio, Enter y la eliminación independiente de un participante. En el simulador se comprobó el cambio de Favoritos y la apertura del editor desde Añadir evento.

## Date pickers · revisión individual

- Se contrastaron Docked, Modal y Modal date input con la documentación de Material 3. La galería monta el componente original y cubre fecha simple, rango, pantalla completa, selección de año y fechas restringidas.
- La navegación por teclado compara días locales. Inicio y Fin recorren sólo el mes actual y los cambios de mes o año permanecen en el mes de destino. El calendario de rango comparte un punto de entrada por Tab entre sus meses. Al abrir el modal, el foco entra en el diálogo y al cerrar con Escape vuelve al control de origen. El fondo conserva el cierre por puntero.
- Pasaron 17 comprobaciones web de Date pickers, seis casos compartidos de tacto, atajos y movimiento reducido, y los 27 contratos del selector. Chromium, Firefox y WebKit confirmaron el cruce de mes y año y la devolución del foco. La ficha local desplaza el calendario de rango hasta mostrar la fecha enfocada.
- En el simulador se comprobó que Cancelar conserva la fecha confirmada y Aceptar guarda el borrador de fecha única.

## Time pickers · revisión individual

- Se contrastaron el reloj, la entrada manual y los formatos de 12 y 24 horas. El dial mide 256 dp y las cifras tienen objetivos de 48 dp. La vista horizontal centra los selectores junto al reloj. La entrada de 12 horas conserva AM/PM y los márgenes de 24 dp a 320 px.
- En la web, Enter y Espacio seleccionan la cifra enfocada. El puntero puede avanzar a minutos y un arrastre iniciado sobre una cifra conserva el minuto final. El diálogo toma el foco, lo devuelve con Escape y vincula los errores a los campos inválidos. La documentación desplaza la vista si el selector se abre fuera de la parte visible de la ficha.
- Pasaron 14 casos web, incluida la interacción en la ficha completa, y 33 casos de interacción de controles de selección. Chromium, Firefox y WebKit comprobaron el teclado, el toque, el arrastre y el movimiento reducido.
- En el simulador se comprobó la selección de hora y minuto, Cancelar, Aceptar y la reapertura en entrada manual con el valor confirmado y su encabezado.

## Badges · revisión individual

La galería distingue los estados de texto de las cantidades al anunciar Correo. Una etiqueta vacía oculta la insignia y un conteo truncado conserva su valor completo en el nombre accesible. Al abrir Folders desde My collection, el foco pasa a su cabecera. Al volver, regresa a la acción Folders con su notificación atendida.

Pasaron ocho combinaciones de anclaje por motor en Chromium, WebKit y Firefox, con Small de 6 dp, Large de 16 dp, ambos temas y LTR/RTL. Las cinco composiciones se probaron a 320 y 960. También se verificaron el crecimiento del contador hasta `999+`, el contraste de la etiqueta (6.54:1 en claro y 7.66:1 en oscuro), el movimiento reducido, la retirada de avisos y la persistencia de totales. Pasaron los 139 casos de la regresión compartida, los 18 contratos de los ejemplos nativos, los 167 casos de geometría compartida y la comprobación estática. La revisión visual se realizó en la documentación web local.

Evidencia local en `.artifacts/badges-individual-results.json`, `.artifacts/badges-individual.png` y `.artifacts/badges-individual-regression.log`.

## App bars · revisión individual del 4 de noviembre de 2026

Se corrigieron dos diferencias reproducidas en Chromium, WebKit y Firefox. `TopAppBar` sale del recorrido de Tab al quedar completamente oculta en modo `Enter always` y vuelve a recibir foco al reaparecer. En el ejemplo Search, el micrófono y el espacio que reserva siguen el extremo final del campo en LTR y RTL.

Pasaron 16 configuraciones por motor con las cuatro variantes, ambos temas y ambas direcciones. También se verificaron anchos de 320 y 960, objetivos de 48 dp, ocultación, colapso y cambio de superficie al desplazar. Se abrió Search con Enter, se seleccionó un resultado y se comprobó el retorno del foco al cerrar el detalle. Pasaron además los 137 casos de la regresión compartida en Chromium, los 42 contratos de App bars y la comprobación estática. La revisión visual se realizó en la documentación web local. Los contratos nativos se ejecutaron con fronteras simuladas.

Evidencia local en `.artifacts/app-bars-individual-results.json`, `.artifacts/app-bars-individual.png` y `.artifacts/app-bars-individual-regression.log`.

## App bars y Badges · revisión conjunta anterior

- Las dos fichas montan los originales del paquete mediante React Native Web. Sus ventanas acotadas dan a búsqueda, navegación, diálogos y transformaciones el viewport real de cada ejemplo. El cambio de tema y movimiento conserva su estado. No se publicaron cambios ni se enviaron al repositorio remoto.
- App bars: Search, Small, Medium flexible y Large flexible; alineación inicial/central, subtítulo, marca, acciones Standard/Filled/Tonal, ancho Wide, superficie Flat/On scroll, inset superior y RTL. Se conservan los mínimos 64/112/120 dp y 136/152 con subtítulo; los títulos flexibles crecen al ocupar dos líneas.
- Se incluyen 21 composiciones de uso: Saved podcasts, búsquedas, color al desplazar, ocultación/colapso, adaptación de ancho/acciones, carta transparente, títulos multilínea, artículo, rutas, marca, envío, edición, colección y RTL. Las continuaciones son locales: filtrar, seleccionar, guardar, compartir/copiar, descargar, elegir cuenta/fecha, enviar una vez y abrir/cerrar detalles con retorno de foco. Adjuntar audio habilita reproducción real del archivo local; el dictado utiliza el teclado como en la galería nativa.
- Las noticias conservan sus opciones específicas: Top Stories utiliza el menú de opciones y The Fortnightly presenta Top News/Saved. Guardar una noticia actualiza Saved; volver a una sección lleva también el contenido al inicio. El wordmark conserva sus recursos originales de densidad y licencia.
- Correcciones en TopAppBar original: RTL se refleja una sola vez en web; los dos encabezados intercambian su visibilidad accesible al colapsar; las suscripciones al color leen sus SharedValues directamente, por lo que Pinned cambia de tonalidad. El adaptador web espera 120 ms sin nuevos eventos de scroll y utiliza el mismo resorte de ajuste; reset, cambios de modo y desmontaje revocan ese cierre pendiente.
- Badges: Small 6 dp y Large mínimo 16 dp, error/onError, Label Small, cantidades 0/1/22/333/999+, límite alternativo 99+, texto breve y cuatro caracteres. Se reproducen las quince disposiciones de Specs, anclajes LTR/RTL, etiqueta con icono, truncación y contextos de navegación, pestañas, colección y viajes. Las novedades atendidas se retiran; los totales de Photos/Favorites permanecen.
- Correcciones compartidas para esos usos: BadgedBox oculta sus marcadores decorativos del árbol web; NavigationBar y NavigationRail abarcan la fila completa sin extender hover/ripple fuera de su pastilla. El rail utiliza una sola geometría para el objetivo, de modo que no se reduce al seleccionar. NavigationBar, NavigationRail y Tabs publican selección y bloqueo explícitos en web. Se conserva el comportamiento nativo.
- La página también consume TopAppBar en su cabecera estrecha y Badge en el contador del buscador. Se conservan un solo proveedor de controles, Text editorial, HTML semántico y limpieza al sustituir rutas.
- Verificación aprobada: **135 casos de navegador** en `test:web:appbar-badges`, con 64 configuraciones de altura/alineación/subtítulo/dirección/tema, anchos 320/390/600/960, los tres recorridos de scroll, snap desactivado, fotogramas de color/colapso/presencia, movimiento reducido, las 21 pantallas y acciones reales. Incluye bordes de objetivos, teclado, cantidades persistentes y regreso a registros.
- Pasan los **51 módulos TSX**, el catálogo estático de 36 familias y las 170 rutas. La comprobación editorial pasó en **170 rutas y 12 runtimes**. También pasó la batería general de 37 bloques del paquete; después de los últimos ajustes se repitieron los contratos afectados: 42 AppBar, 71 Tabs, 167 casos de geometría de navegación/insignias y 3,584 combinaciones del objetivo del rail.
- Referencias contrastadas: contenido oficial de App bars y Badges del catálogo MD3 exportado el 13 de octubre de 2026, las galerías nativas existentes y sus recursos de arte. Esta entrega no añade una nueva inspección visual en dispositivo físico, una medición de FPS ni certificación de lectores de pantalla u otros motores. Las demás familias conservan su alcance independiente.
- La repetición adicional del movimiento compartido aprobó 52 casos por fotogramas; los controles de la página volvieron a pasar sobre una copia inmutable de la exportación.
- Evidencia: `.artifacts/appbar-badges-web/results.json`, capturas de esa carpeta, `appbar-final-contract.log`, `navigation-final-contract.log`, `tabs-final-contract.log`, `rail-final-contract.log`, `appbars-badges-examples.log` y `appbars-badges-static.log`.

## Consumo de Text en la documentación · revisión local

- Títulos, párrafos, navegación, listas, tablas, etiquetas y mensajes del sitio consumen el Text exportado por el paquete, bajo el proveedor compartido. Se conservan los elementos HTML que aportan semántica, destinos de enlace y relaciones de formularios; los textos reales se renderizan en línea mediante portales, sin encabezados duplicados ni bloques dentro de párrafos.
- `runtime/docs-typography.tsx` migra el contenido editorial y los cambios dinámicos de búsquedas, filtros, contadores y confirmaciones. Libera sus portales al sustituir una ruta. Los colores se heredan de la superficie y el enlace; tamaño, interlineado, peso y tracking proceden del tema. El título principal usa displayLarge en escritorio y displayMedium en pantallas estrechas.
- `runtime/prose.tsx` permite que las ocho galerías de componentes y la galería de tipografía consuman Text directamente desde React para sus explicaciones, etiquetas, encabezados y estados. El observador del sitio no modifica ese DOM ni el contenido interno de los originales compartidos.
- Código, firmas, identificadores, glifos de iconos y valores de campos editables conservan sus renderers específicos. Se comprueban la selección y copia del código, los enlaces con teclado y la composición de texto con énfasis y enlaces en el mismo párrafo.
- El límite de altura del ejemplo de tipografía admite ahora la galería completa en pantallas estrechas con los perfiles de mayor interlineado. La muestra de 30 estilos puede superar 10,000 px; se conserva la validación del origen, la ventana emisora y las medidas finitas del mensaje.
- Verificación de consumo aprobada en 170 rutas y nueve runtimes: semántica, contenido mixto en línea, código íntegro, enlaces reales, búsqueda, filtros, estados dinámicos, temas y redistribución a 320/390 px. Evidencia local en `.artifacts/page-typography/`.
- También pasan las 240 combinaciones de tipografía y los 47 ejemplos TSX. Las matrices de las ocho familias suman 1,416 configuraciones aprobadas; pasan los contratos de controles de página, estados visibles y las 68 comprobaciones de movimiento por fotogramas. La ejecución se completó por ejecutores; una sesión de Chrome interrumpida se repitió con éxito para FAB menu. Los registros de esta revisión se conservan en `.artifacts/text-consumption-*.log` y en los resultados de cada familia.
- Los servidores temporales de pruebas solicitan un puerto libre al sistema para no colisionar entre ejecuciones simultáneas. El servidor de desarrollo conserva el puerto 4317. Las comprobaciones estáticas y de sintaxis pasan sin modificar el servidor que utiliza el usuario.
- El servidor de desarrollo y la página permanecen en local. No se publica ni se envía esta revisión a un dominio o repositorio remoto.

## Paridad de movimiento entre las ocho galerías web

- Revisadas Buttons, Extended FABs, FAB menu, FABs, Icon buttons, Segmented buttons, Split button y Cards frente a sus originales y galerías nativas. Se conserva el mismo motor del paquete; no se añaden animaciones CSS para imitarlo.
- Buttons inicia con el perfil Standard que utiliza su galería nativa, y permite elegir Expressive. La muestra Toggle cambia el relleno del mismo símbolo bookmark junto con la selección. Se muestran por separado las formas Round y Square y se actualiza también el módulo descargable.
- Extended FABs y FAB menu inician en Medium, igual que el configurador nativo de acciones flotantes. Los tamaños de la API conservan sus valores por defecto. El módulo inicial de Split utiliza el símbolo Send relleno, como la muestra interactiva.
- Corrección en FAB original compartido: la superficie interna de presión recibía de golpe el radio de destino mientras el contenedor recorría su transformación. Ahora la superficie, su máscara y el contorno de foco siguen la geometría animada. Se comprueba tanto la apertura 80 → 56 como su regreso; el arreglo alcanza a los consumidores nativos y web del original.
- Las galerías conservan el contexto de texto dentro de su proveedor. La apertura directa de una muestra no depende de que la documentación haya creado previamente el contexto de idioma.
- El contexto inline de Text se limita a los textos editoriales mediante portales. Envolver toda la galería en Text convertía también los View originales en inline-flex, alterando el ancho disponible para menús y dejando en cero el de una colección reordenable. Los controles vuelven a conservar su disposición original; Prose sigue renderizando Text real dentro de encabezados, etiquetas y enlaces semánticos.
- El contenedor interno del ejemplo de FAB menu declara el ancho completo. Sin él, la composición de texto hacía que el contenedor se ajustase a su contenido y el FAB anclado quedaba desplazado hacia el centro. El contrato compara su posición con el borde real del área de ejemplo en LTR y RTL, tanto en menú anclado como en pila.
- `check-action-motion-web.mjs` registra fotogramas reales del navegador para siete familias: radios de presión y selección, relleno de iconos, anchura de Extended FAB, presencia de FABs, dimensiones/radios/contorno/orden de aparición de FAB menu, giro de Split y transformación de Card al abrir y regresar. Comprueba además que el detalle no desplace la página y devuelva el foco. Se complementa con los 16 casos específicos de Segmented buttons.
- Repetición nativa específica aprobada: selección de Buttons y tres aperturas/cierres de FAB menu Medium, comprobando estado accesible y dimensiones 80/56/80. Evidencia: `/private/tmp/md3-peer-motion-coordinate.xcresult` y sus capturas exportadas. El primer intento de pulsación sintética no confirmó el cambio de selección; el recorrido aprobado usa la coordenada central y verifica el estado publicado.
- Verificación final después de delimitar el contexto de texto: 180 Buttons, 144 Extended FABs, 192 FAB menu, 36 FABs, 480 Icon buttons, 192 Segmented buttons, 120 Split button y 72 Cards: 1,416 configuraciones aprobadas, además de acciones/teclado/medición/arrastre/cancelación y controles de la página. Pasan los 16 casos de movimiento de Segmented y los 52 del resto de familias (68 en total), los 240 casos de tipografía, los 47 TSX descargables y las 170 rutas. Los 37 bloques del paquete también pasan tras la corrección del FAB compartido.
- Evidencia final de navegador: `.artifacts/peer-final-actions.log`, `.artifacts/peer-final-compositions.log`, `.artifacts/peer-final-fab-menu.log`, `.artifacts/peer-final-typography.log` y los resultados de cada matriz. Las capturas de revisión local quedan en `.artifacts/peer-review-buttons.png` y `.artifacts/peer-review-fab-menu.png`.
- Esta inspección no acredita FPS en hardware físico ni todos los motores de navegador. El trabajo permanece local y no se publica a un dominio.

## Revisión local de estados y movimiento

- Alcance: las ocho familias web integradas, sus originales compartidos y sus composiciones. No se publicó ni desplegó esta revisión.
- Segmented buttons: Enter activaba dos veces una opción porque el manejador propio y React Native Web confirmaban la misma tecla. El original conserva el manejo de Espacio para los roles radio/checkbox y deja Enter al responder web. La selección múltiple confirma ahora una sola vez por tecla.
- Segmented buttons también conservaba un marco de teclado tras una pulsación de ratón. Se corrigieron la entrada de foco y el cambio entre teclado y puntero. El mismo cambio de modalidad se aplica en Button (incluido IconButton), FAB/Extended FAB, ítems Expressive de FAB menu, SplitButton y Card.
- Las etiquetas auxiliares de medición quedan fuera del árbol accesible web; sus claves son únicas incluso cuando varios segmentos tienen el mismo texto. El ejemplo estrecho conserva el ancho del contenido y permite recorrer todas las opciones horizontalmente, sin comprimir cada etiqueta a una o dos letras.
- La muestra principal de Split queda centrada en el área de demostración en los cinco tamaños. Se mantiene la corrección anterior del centro entre sus dos mitades.
- Las galerías de Segmented y Split ya no fuerzan Standard: inician con Expressive, igual que el proveedor del paquete, y permiten elegir ambos perfiles. La galería de Segmented inicia con etiquetas y muestra las tres configuraciones de contenido a la vista. Sólo etiquetas anima escala del check y desplazamiento del texto; icono con etiqueta usa fundido entre icono/check sin mover la etiqueta; sólo iconos conserva su icono y muestra el estado y el feedback de presión.
- `check-visible-states-web.mjs` comprueba las ocho familias: foco al pasar de ratón a teclado y regresar, movimiento interrumpido con ambos perfiles/RTL, centrado del dibujo, teclado, medición accesible, scroll real con rueda y activación de la última opción fuera de pantalla.
- `check-segmented-motion-web.mjs` registra estilos y geometría en cada requestAnimationFrame: 16 casos entre ambos perfiles, ambos sentidos, etiquetas/ambos contenidos y movimiento normal/reducido. Exige posiciones y opacidades intermedias, crecimiento real del check y expansión real del ripple. No basta con llegar al estado final. Sin movimiento reducido, la etiqueta recorre 13 dp hasta su posición final; el perfil Expressive conserva el sobrepaso de su resorte. Con icono, el texto mantiene su posición. Con movimiento reducido, esos cambios son directos y no aparece ripple expansivo.
- Matrices de regresión recorridas: 180 Buttons, 144 Extended FABs, 192 FAB menu, 36 FABs, 480 Icon buttons, 192 Segmented, 120 Split y 72 Cards. Después de ajustar las galerías de movimiento se repitieron los 384 casos de Segmented/Split/Cards y las comprobaciones nuevas sobre la exportación final. También pasan los 46 TSX, el análisis estático de 170 rutas y los 37 bloques del paquete.
- Recorrido nativo local: dos métodos XCTest recorrieron las ocho galerías, con comprobaciones adicionales de centros, menús, reproducción y detalle de Card. Una repetición específica de Segmented esperó el contenido publicado tras Semana → Mes → Semana y la selección de Tren, usando pulsaciones de 0.12 s. Se conservaron captura y jerarquía con estado asentado. El primer intento con tap sintético no confirmó el primer cambio y no se contabiliza como aprobado.
- Evidencia técnica local: `.artifacts/visible-states-web/`, `.artifacts/segmented-motion-web/`, `.artifacts/local-motion-*.log`, `/private/tmp/md3-local-eight-review.xcresult` y `/private/tmp/md3-local-segmented-press.xcresult`. La ejecución representativa no acredita cada combinación nativa, FPS en hardware físico, otros motores web ni lectores de pantalla completos.

## Text y tipografía · revisión local

- El componente Text conserva el renderer de Paper, sus props nativas y la consulta del tema. Se tipa públicamente TextVariant con los 30 estilos. No se crea una segunda implementación HTML del texto.
- Contrastados los 15 estilos base y 15 enfatizados con el recurso oficial de tipografía actual, contexto Static/3P: tamaño, peso, tracking, familia e interlineado. La referencia numérica independiente queda en content/typography-reference.json.
- Añadidos al proveedor y a la fábrica de tema los cuatro perfiles de altura de escritura publicados en 2026. Small conserva la escala latina anterior; la elección de medium/large/extraLarge es explícita. El perfil afecta a las variantes base y enfatizadas y respeta los overrides de theme.fonts. No se presenta como detección automática de idioma ni se desactiva el escalado del sistema.
- La página local de tipografía monta Text real, muestra los 30 estilos completos y permite cambiar rol, tamaño, énfasis, contenido, alineación, dirección, color, selección y altura de escritura. Las medidas proceden del tema; se retiran las muestras HTML con line-height aproximado.
- Ejemplos de jerarquía de lectura, énfasis anidado, contenido con diacríticos y números tabulares. La integración editorial general con Text y HTML semántico se detalla en la revisión de consumo de Text de este registro.
- Se incluye un módulo completo descargable de tipografía, además de los ejemplos existentes.
- La matriz de navegador cubre 240 combinaciones (30 estilos × cuatro perfiles × dos temas), cotejadas con los tokens independientes. Verifica controles, semántica de encabezados, dirección, selección, redistribución a 320/390 px, altura completa del ejemplo y consumo real en la página.
- El recorrido nativo anterior de las ocho familias terminó correctamente en /private/tmp/md3-local-eight-review.xcresult. No acredita una inspección visual nativa de todos los perfiles de escritura de esta nueva galería de texto; los nuevos perfiles se comprueban en la fábrica compartida y en el navegador. Otros motores y lectores de pantalla siguen fuera de esta matriz.
- Verificación final: 240 combinaciones de tipografía aprobadas; 47 módulos TSX compilados; comprobación estática del sitio, contratos de controles de página y estados visibles aprobados. Los 37 bloques del paquete pasan, incluidos 35 casos de foundation.
- Trabajo exclusivamente local. No se publica ni se sube a un dominio.

## Correcciones locales de interacción de las ocho familias

- SegmentedButtons separa foco de teclado y puntero, oculta sus etiquetas de medición a accesibilidad y evita claves duplicadas si dos opciones tienen el mismo texto. Enter ya no activa dos veces: React Native Web resuelve esa tecla en keyup; Space conserva el manejo explícito de radio/checkbox.
- El cambio entre teclado y ratón limpia el anillo de foco en Button/IconButton, FAB/ExtendedFAB, ítems de FAB menu, Split y Card. La indicación de presión continúa en su superficie.
- El área de Segmented buttons permite desplazar configuraciones largas sin comprimir todas las etiquetas. El ejemplo de Split centra su contenedor en el área de demostración.
- Las matrices de las ocho familias aprobaron 1,416 configuraciones. El contrato adicional de estados visibles pasó después de reexportar el runtime con los controles de movimiento actuales. La evidencia local se conserva en .artifacts/visible-states-web/.

## Contraste con la galería nativa y corrección de alineación

- Se abrió Music Design en el simulador y se recorrieron las ocho galerías con ejecución XCTest: Buttons, Extended FABs, FAB menu, FABs, Icon buttons, Segmented buttons, Split button y Cards. Se conservaron capturas, jerarquías y vídeo de interacción antes de modificar los originales. Los medios oficiales actuales de las ocho familias se consultaron de nuevo; las medidas y los fotogramas de Split se compararon directamente.
- La revisión detectó una regresión introducida en Split: el anclaje del menú conservaba alignSelf: flex-start, mientras la mitad principal reservaba el objetivo de interacción. El desfase era de 8 dp en Extra small y 4 dp en Small. Se reprodujo en navegador y simulador. No era parte del diseño de MD3.
- Split centra ahora el anclaje visual dentro de la fila compartida, sin trasladar el dibujo con offsets ni modificar Popup para otros consumidores. Conserva separación de 2 dp, las cinco alturas, los objetivos web de 48 dp y el menú a 4 dp de la superficie visual. La corrección se aplica al original utilizado por móvil, los ejemplos web y los encabezados de copiar/descargar de la página.
- La fila nativa de cinco tamaños de Icon buttons heredaba la alineación inicial de Tooltip y mostraba centros diferentes. El helper de esa composición declara anchorStyle con alineación central, igual que la composición multimedia web. No se altera la colocación por defecto de menús ni ayudas en otros contextos.
- Split distingue el foco visible por teclado del foco recibido al pulsar con ratón. Se conserva el estado hover y el feedback de presión, sin dejar el contorno de teclado tras una pulsación de puntero.
- La prueba de navegador ahora compara centros verticales en cada combinación de Split, además de las cinco muestras y los cinco usos. Antes comprobaba alturas y separación horizontal, lo que permitió que pasara la desalineación. El nuevo contrato falló sobre la exportación anterior y pasó con el original corregido.
- La repetición nativa verificó centros coincidentes en los cuatro estilos de Split, apertura/cierre del menú, los cinco centros de la fila de Icon buttons (desfase máximo de 0 dp; antes había 44 dp), selección de reproducción, FAB menu abierto/cerrado y detalle de Card con guardado y regreso. XCTest terminó sin fallos y dejó Split visible.
- Repetidas y aprobadas las 1,416 configuraciones de las ocho familias con test:web completo, además de los controles originales de la página, 46 módulos TSX y los 37 bloques automáticos del paquete. Sin errores de página ni recursos fallidos en los recorridos aprobados.
- El recorrido nativo es representativo: no acredita cada combinación, un framerate mínimo ni rendimiento en dispositivo físico. Los registros de esta entrega se conservan localmente en /private/tmp/md3-web-native-audit-20261103; la matriz de navegador mantiene su evidencia en .artifacts/.

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
