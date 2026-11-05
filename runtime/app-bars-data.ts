export const appBarVariants = ['search', 'small', 'medium-flexible', 'large-flexible'] as const;
export type AppBarConfiguration = {
    variant: (typeof appBarVariants)[number];
    title: string;
    subtitle: boolean;
    align: 'start' | 'center';
    navigation: 'back' | 'menu' | 'logo' | 'none';
    actions: number;
    actionStyle: 'standard' | 'contained' | 'contained-tonal';
    wide: boolean;
    image: boolean;
    scrolled: boolean;
    inside: boolean;
    disabled: boolean;
    direction: 'ltr' | 'rtl';
    motion: 'standard' | 'expressive';
    inset: number;
};
export const initialAppBar: AppBarConfiguration = {
    variant: 'small',
    title: 'Headline',
    subtitle: false,
    align: 'start',
    navigation: 'back',
    actions: 2,
    actionStyle: 'standard',
    wide: false,
    image: false,
    scrolled: false,
    inside: false,
    disabled: false,
    direction: 'ltr',
    motion: 'expressive',
    inset: 0,
};
export const appBarScenes = [
    {
        id: 'podcasts',
        title: 'Saved podcasts',
        description: 'Colección guardada, adjuntar archivo, fecha, menú y detalle.',
        kind: 'podcasts',
        variant: 'large-flexible',
        scroll: 'exit-until-collapsed',
    },
    {
        id: 'search-messages',
        title: 'Search messages',
        description: 'La entrada abre SearchView; consulta, recientes y conversación.',
        kind: 'search',
        variant: 'small',
        scroll: 'pinned',
    },
    {
        id: 'search',
        title: 'Search product',
        description: 'Búsqueda, resultado y detalle; navegación y cuenta independientes.',
        kind: 'search',
        variant: 'small',
        scroll: 'pinned',
    },
    {
        id: 'search-inbox',
        title: 'Search inbox',
        description: 'Micrófono y resultados de mensajes.',
        kind: 'search',
        variant: 'small',
        scroll: 'pinned',
    },
    {
        id: 'search-photos',
        title: 'Search Photos',
        description: 'Micrófono dentro del campo y acción adicional fuera.',
        kind: 'search',
        variant: 'small',
        scroll: 'pinned',
    },
    {
        id: 'scroll-color',
        title: 'Top Stories',
        description: 'Pinned mantiene el encabezado y cambia su superficie al desplazar.',
        kind: 'news',
        variant: 'small',
        scroll: 'pinned',
    },
    {
        id: 'scroll-hide',
        title: 'Aki Aro',
        description: 'Enter always oculta y revela la barra al invertir el desplazamiento.',
        kind: 'article',
        variant: 'small',
        scroll: 'enter-always',
    },
    {
        id: 'scroll-collapse',
        title: 'Recap',
        description: 'Large flexible se comprime a Small y conserva sus acciones.',
        kind: 'gallery',
        variant: 'large-flexible',
        scroll: 'exit-until-collapsed',
    },
    {
        id: 'adaptive-width',
        title: 'Must watch films',
        description: 'El encabezado ocupa todo el ancho disponible; editar conserva los datos.',
        kind: 'films',
        variant: 'large-flexible',
        scroll: 'exit-until-collapsed',
    },
    {
        id: 'adaptive-actions',
        title: 'Aki Aro · acciones',
        description: 'Acciones visibles en amplio y alternativas en compacto.',
        kind: 'article',
        variant: 'small',
        scroll: 'pinned',
    },
    {
        id: 'adaptive-search',
        title: 'Search · adaptable',
        description: 'Hasta 312 dp, después crece al 50 % del intervalo disponible.',
        kind: 'search',
        variant: 'small',
        scroll: 'pinned',
    },
    {
        id: 'transparent',
        title: 'So Duri',
        description: 'La carta pasa bajo una barra transparente con controles contenidos.',
        kind: 'letter',
        variant: 'small',
        scroll: 'pinned',
    },
    {
        id: 'text-wrap',
        title: 'Hiking trip',
        description: 'Título de dos líneas y acción de ruta.',
        kind: 'hiking',
        variant: 'medium-flexible',
        scroll: 'exit-until-collapsed',
    },
    {
        id: 'sushi',
        title: 'The best sushi spots',
        description: 'Artículo con título de dos líneas y Share tonal.',
        kind: 'sushi',
        variant: 'medium-flexible',
        scroll: 'exit-until-collapsed',
    },
    {
        id: 'top-trails',
        title: 'Top 10 hiking trails',
        description: 'Título, subtítulo, guardado y recorridos.',
        kind: 'trails',
        variant: 'large-flexible',
        scroll: 'exit-until-collapsed',
    },
    {
        id: 'brand',
        title: 'The Fortnightly',
        description: 'La marca reemplaza el título Small y acompaña a las flexibles.',
        kind: 'news',
        variant: 'medium-flexible',
        scroll: 'exit-until-collapsed',
    },
    {
        id: 'primary-action',
        title: 'Image',
        description: 'Ilustración, metadatos y Send como acción principal.',
        kind: 'send',
        variant: 'small',
        scroll: 'pinned',
    },
    {
        id: 'compose',
        title: 'New message',
        description: 'Editar, cancelar y enviar un borrador local.',
        kind: 'compose',
        variant: 'small',
        scroll: 'pinned',
    },
    {
        id: 'collection',
        title: 'Bookstores in LA',
        description: 'Guardar una colección y descargar su contenido.',
        kind: 'collection',
        variant: 'large-flexible',
        scroll: 'exit-until-collapsed',
    },
    {
        id: 'rtl',
        title: 'מסלולי טיול',
        description: 'Navegación, título y acciones reflejados en RTL.',
        kind: 'hiking',
        variant: 'medium-flexible',
        scroll: 'exit-until-collapsed',
    },
    {
        id: 'interaction',
        title: 'Thrift stores near me',
        description: 'Foco, hover, selección de tienda y ruta a pie.',
        kind: 'stores',
        variant: 'small',
        scroll: 'pinned',
    },
] as const;
export type AppBarSceneId = (typeof appBarScenes)[number]['id'];
