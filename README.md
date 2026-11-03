# Mobile Design · Documentación

Sitio estático de documentación del paquete local Mobile Design, inspirado en la navegación y estructura de Material Design 3. Contiene las 36 familias en el orden del catálogo, fichas con cuatro secciones, API generada desde TypeScript, 36 módulos React Native descargables, capturas nativas de la revisión del 2 de noviembre, fundamentos de estilo y alcance de verificación.

`dist/` es la salida desplegable; no requiere build, dependencias del navegador ni un servidor de React Native. Roboto y el subconjunto de Material Symbols se sirven localmente con sus licencias. Las demostraciones interactivas son representaciones web y están identificadas como tales. Las capturas y los ejemplos TSX corresponden al paquete nativo.

## Vista local

```sh
cd sites/mobile-design-docs
python3 -m http.server 4317 --bind 127.0.0.1 --directory dist
```

Abre http://127.0.0.1:4317/. Las rutas usan hash y no necesitan reglas de rewrite.

## Sincronizar y verificar

Desde la raíz del workspace original:

```sh
node sites/mobile-design-docs/scripts/sync-package.mjs
node sites/mobile-design-docs/scripts/check-examples.mjs
node sites/mobile-design-docs/scripts/check-site.mjs
```

La sincronización necesita TypeScript instalado en el workspace y `packages/mobile-design`. Extrae nombres/orden, variantes, exportaciones, API, peer dependencies y colores reales. El contenido editorial y los ejemplos viven en `content/`. Si está disponible la carpeta de evidencia original, actualiza también las capturas; la salida ya incluye las imágenes necesarias para el despliegue.

`check-examples` compila los 36 módulos contra la API actual, sin emitir código. `check-site` revisa cobertura, activos, ejemplos, semántica de las vistas estáticas, colores y sintaxis. La verificación del sitio no sustituye las pruebas nativas del paquete.

## Publicación

`.openai/hosting.json` conserva la identidad privada del Site y declara `dist` como directorio estático. El checkout Git de esta subcarpeta es independiente: la publicación no incluye la app Music Design ni otros archivos del workspace.

La marca Mobile Design pertenece a este proyecto; la página no es una publicación oficial de Google. Las referencias oficiales MD3 se enlazan desde cada ficha.
