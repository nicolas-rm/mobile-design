# Original App bars example artwork

These assets contain only photograph, illustration, map or avatar regions from the official Material 3 App bars figures and clips. Their source is the [published App bars page](https://m3.material.io/components/app-bars/overview), whose current SPA identifies Carbon export `2026-10-13_06-10-19` and page `4135ef28-314c-44dc-b829-6e94a36b69f2.json`.

[sources.json](sources.json) records the exact source URL, video frame time where applicable, crop rectangle `[x, y, width, height]`, decoded pixel dimensions and SHA-256 of every retained PNG. The original photographs and illustrations remain the work of their respective authors, published in Google Material Design's examples. No image was generated or redrawn for these files.

The figures or video frames were read for this requested local implementation, and only their artwork regions were retained as application assets. Status bars, headings, app bars, labels, touch pointers and buttons are excluded. The app renders its controls and content as React Native components; it does not present a captured interface as a working screen. Each crop was inspected visually. A visible example often cuts off the underlying image, so the retained pixel area and native `cover` presentation do not imply access to an unseen original full photograph.

The two podcast illustrations come from the Overview hero. The dog, station, mushrooms, beekeeper, tree, tent and valley come from the Recap clip; the tall tree and tent images also have their larger regions in the Hiking title-wrap figure. The baker is from Must watch films. The sky and map appear in the Top 10 hiking trails figure. Image/Send supplies its original illustration; the article with Share supplies its food photo; the transparent letter supplies So Duri's avatar.

`recap-tree.png`, `recap-tent.png` and `news-mushrooms.png` retain the smaller source regions for traceability; their larger or more useful source crops are used in the current layouts. They are not separate UI variants.
