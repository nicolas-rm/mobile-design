# Contribuir a la documentación

La documentación conserva el estilo Material Design 3 del proyecto. Prioriza contenido preciso y autosuficiente sobre enlaces a otra página.

## Cambiar contenido

- `content/editorial.mjs`: descripciones y medidas documentadas.
- `content/guides.mjs`: integración, funcionamiento, accesibilidad, responsabilidades y tipos relacionados de cada familia.
- `content/examples.mjs` y `content/recipes.mjs`: módulos React Native completos.
- `dist/component-docs.js`: presentación de las fichas.
- `dist/app.js`, `dist/styles.css`: navegación y estilo de la documentación.

Si cambias contenido fuente, sincroniza la salida con el paquete nativo configurado. `dist/data.json`, sus ejemplos y los datos integrados en el HTML deben permanecer iguales. No cambies una API del paquete para acomodar un ejemplo incorrecto.

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
npm run check:examples -- --package-dir /ruta/al/paquete/mobile-design
npm start
```

La primera comprobación es autónoma y se ejecuta en CI. La segunda compila todos los ejemplos contra el paquete nativo y necesita su workspace. En el navegador revisa catálogo, ficha, búsqueda, tema, menú móvil y capturas. El soporte web de los componentes permanece pendiente; estas comprobaciones prueban el sitio de documentación.
