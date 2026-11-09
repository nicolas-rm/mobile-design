# Contribuir a la documentación

La documentación conserva el estilo Material Design 3 del proyecto. Prioriza contenido preciso y autosuficiente sobre enlaces a otra página.

## Cambiar contenido

- `content/editorial.mjs`: descripciones y medidas documentadas.
- `content/guides.mjs`: integración, funcionamiento, accesibilidad, responsabilidades y tipos relacionados de cada familia.
- `content/examples.mjs` y `content/recipes.mjs`: módulos React Native completos.
- `dist/component-docs.js`: presentación de las fichas.
- `dist/app.js`, `dist/styles.css`: navegación y estilo de la documentación.

Si cambias contenido fuente, instala las dependencias con `(cd library && pnpm install --frozen-lockfile)` y ejecuta `npm run sync` desde la raíz. Mantén sincronizados `dist/data.json`, sus ejemplos y los datos integrados en el HTML. Corrige los ejemplos para que usen la API pública del paquete.

## Criterios MD3

1. Usa los roles semánticos existentes para fondos, texto, bordes y estados.
2. Conserva Roboto y Material Symbols Rounded con sus licencias.
3. Distingue variante, configuración, estado y composición.
4. Comprueba navegación con teclado, texto legible, foco visible, contraste y movimiento reducido.
5. Identifica imágenes estáticas y el alcance real de las pruebas.
6. Mantén dentro de cada ficha las instrucciones necesarias para usar el componente. Una referencia externa aporta atribución, no reemplaza la accesibilidad o implementación.

## Verificación

```sh
npm test
npm run check:examples
npm start
```

La primera comprobación es autónoma y se ejecuta en CI. La segunda comprueba los tipos de todos los ejemplos contra el paquete nativo del workspace. En el navegador revisa catálogo, fichas, búsqueda, tema, menú móvil y capturas.
