# Verificación del sitio · 3 de noviembre de 2026

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
