/** Current MD3 Lists media, indexed in the dated reference inventory. */
export const listUsageExamples = [
    { id: 'party', title: 'Party planning · selección múltiple', icon: 'checklist' },
    { id: 'colors', title: 'Color selection · muestras', icon: 'palette' },
    { id: 'contacts', title: 'Contacts · avatares', icon: 'contacts' },
    { id: 'topics', title: 'Topics · iconos y navegación', icon: 'category' },
    { id: 'tickets', title: 'Concert tickets · fecha', icon: 'confirmation_number' },
    { id: 'cart', title: 'Cart · imágenes y precios', icon: 'shopping_cart' },
    { id: 'music-actions', title: 'Music · acciones independientes', icon: 'music_note' },
    { id: 'reorder', title: 'My top favorites · reordenar', icon: 'drag_handle' },
    { id: 'inbox', title: 'Inbox · una o dos columnas', icon: 'inbox' },
    { id: 'cities', title: 'Cities · divisores', icon: 'location_city' },
    { id: 'photos-detail', title: 'Photos · lista y detalle', icon: 'photo_library' },
    { id: 'photos-columns', title: 'Photos · columnas', icon: 'view_column' },
    { id: 'photos-images', title: 'Photos · imágenes adaptables', icon: 'image' },
    { id: 'photos-cards', title: 'Photos · tarjetas adaptables', icon: 'view_agenda' },
    { id: 'photos-carousel', title: 'Photos · carrusel adaptable', icon: 'view_carousel' },
    { id: 'podcasts', title: 'Trending now · texto adaptable', icon: 'podcasts' },
    { id: 'timeline', title: 'Space · información estática', icon: 'rocket_launch' },
    { id: 'tasks', title: 'Tasks · expansión y contracción', icon: 'expand_more' },
    { id: 'recipes', title: 'Recipes · deslizar y alternativas', icon: 'swipe' },
    { id: 'mailbox', title: 'Inbox interactiva · virtualización', icon: 'mail' },
] as const;

export type ListUsageScenario = (typeof listUsageExamples)[number]['id'];

export const listTracks = [
    { id: 'strangers', title: 'Strangers', artist: 'Trapezoid', album: 'Warped Speed', art: 'strangers' },
    { id: '21st-century-strangers', title: '21st Century Strangers', artist: 'For Now', album: 'NBR', art: '21st-century-strangers' },
    { id: 'decorations', title: 'Decorations', artist: 'Personal Voice', album: 'AMB Music', art: 'decorations' },
] as const;

export const listAlbums = [
    {
        id: 'festivals',
        title: 'Festivals',
        art: 'festival',
        date: 'May 8',
        count: '293',
        description: 'Food, music, arts, community, tradition, culture, and celebration – a collection of events around the world.',
    },
    {
        id: 'arts',
        title: 'Arts',
        art: 'arts',
        date: 'May 7',
        count: '1028',
        description:
            'Literature, games, music, physical and visual forms – explore the art that has inspired and moved humanity through history and…',
    },
    {
        id: 'family',
        title: 'Family & friends',
        art: 'family-friends',
        date: 'May 4',
        count: '359',
        description: 'The relationships that bring and bind us together and shape our world.',
    },
    {
        id: 'pets',
        title: 'Pets',
        art: 'pets',
        date: 'May 8',
        count: '',
        description: 'Not just companions, but often referred as extended family members.',
    },
] as const;

export const listMessages = [
    {
        id: 'tickets',
        title: 'Pre-sale concert tickets',
        description: 'I just saw there are a couple good shows coming up.',
        art: 'alejandro-inbox',
        date: '15 mins',
    },
    { id: 'lunch', title: 'Good healthy lunch idea', description: 'My coworker just sent this recipe.', art: 'pia', date: '' },
    {
        id: 'birthday',
        title: 'Cumpleaños de mamá',
        description: 'With mamá’s birthday around the corner, I’d like to…',
        art: 'ana',
        date: '',
    },
] as const;

export const listTasks = [
    { id: 'presentation', title: 'Finalize presentation', description: 'Due today', icon: 'notifications' },
    { id: 'review', title: 'Review mock-ups', description: 'Due Friday', icon: 'visibility' },
    { id: 'supplies', title: 'Pick up supplies', description: 'Due Monday', icon: 'handyman' },
    { id: 'draft', title: 'Draft project plan', description: 'Due Wednesday', icon: undefined },
    { id: 'invoice', title: 'Pay invoice', description: 'Due January 2026', icon: 'attach_money' },
] as const;

export const listPodcasts = [
    {
        id: 'breakdown',
        title: 'The Breakdown',
        count: '58 episodes',
        description: 'Analyzing of current events, news, economy, health, science, history, arts, a…',
    },
    {
        id: 'ecuador',
        title: 'A Year in Ecuador',
        count: '10 episodes',
        description: 'An inspiring year lived in the culturally diverse land of ecuador.',
    },
    { id: 'song-histories', title: 'Song Histories', count: '10 episodes', description: 'Khalil wakes up and finds…' },
] as const;

export const listProducts = [
    { id: 'cactus', title: 'Cactus', description: 'In stock', price: '$9.50' },
    { id: 'succulent', title: 'Succulent', description: '', price: '$7.50' },
] as const;

export const listTopics = [
    { id: 'attractions', title: 'Attractions & entertainment', icon: 'theaters' },
    { id: 'dining', title: 'Dining', icon: 'restaurant' },
    { id: 'education', title: 'Education', icon: 'edit' },
] as const;
