# Recursos de referencia de Material Design 3

Fotografía y arte de Google/Material Design, procedentes de los recursos públicos de sus páginas Badges y Button groups. `sources.json` registra URL, sección, identificador Carbon, versión publicada, dimensiones, hash y tiempo del fotograma cuando corresponde.

Los PNG originales se conservan completos para que su procedencia sea comprobable. `ReferenceArt` muestra exclusivamente los rectángulos fotográficos mediante un viewport SVG: no dibuja los controles, textos, marcos de dispositivo ni barras de estado de esas figuras. Todos los botones y estados de la demo siguen siendo componentes React Native interactivos.

`music-frame.png` y `call-frame.png` son fotogramas del segundo 1 de los clips oficiales. Se usa el arte como imagen fija, no se representa una videollamada real, animación de video o grabación musical. La figura de llamada sólo publica un encuadre del torso; no se inventa un retrato completo. El recorte de My collection sólo contiene la franja visible de sus dos primeras tarjetas: se muestra con proporción 366/159 para conservar su ancho íntegro, sin ampliar a un cuadro ni completar la fotografía inferior desconocida. Estos límites impiden afirmar igualdad de una pantalla completa fuera del área publicada.

Las coordenadas de los viewports están en `mobile-design-reference-art.tsx`. No se han generado imágenes sustitutas ni se han incluido capturas de nuestra aplicación como si fueran referencias oficiales.

Search añade dos fotogramas completos del clip oficial de recetas. Sus tiempos, dimensiones y hashes figuran en `sources.json`. Los viewports de 112×112 muestran únicamente las fotos de preparación y tacos; los textos, botones, sugerencias y resultados de la muestra son controles interactivos.
