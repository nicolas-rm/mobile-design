/** Examples and editorial media in the Material I/O 2026 announcement, checked 2026-11-05. */
export const io26Article = 'https://m3.material.io/blog/whats-new-at-io26';

export const io26Examples = [
    { id: 'shrine', title: 'Shrine · producto adaptable', icon: 'diamond', reference: io26Article },
    {
        id: 'layout',
        title: 'Layout adaptable',
        icon: 'dashboard',
        reference: 'https://m3.material.io/foundations/layout/scaffold/overview',
    },
    { id: 'spacing', title: 'Sistema de espaciado', icon: 'space_dashboard', reference: 'https://m3.material.io/styles/spacing/overview' },
    { id: 'lists', title: 'Listas Expressive', icon: 'drag_handle', reference: 'https://m3.material.io/components/lists/overview' },
    { id: 'menus', title: 'Menús Expressive', icon: 'restaurant_menu', reference: 'https://m3.material.io/components/menus/overview' },
    { id: 'search', title: 'Search y search app bar', icon: 'search', reference: 'https://m3.material.io/components/search/overview' },
    { id: 'watch', title: 'Reloj · reproductor', icon: 'watch', reference: 'https://m3.material.io/foundations/watches/overview' },
    { id: 'xr', title: 'XR · álbum compartido', icon: 'view_in_ar', reference: 'https://m3.material.io/foundations/xr/design/overview' },
    {
        id: 'transparent',
        title: 'Transparent Screens · clip',
        icon: 'visibility',
        reference: 'https://design.google/library/transparent-screens',
    },
    {
        id: 'gemini',
        title: 'Illustrating Gemini · clip',
        icon: 'auto_awesome',
        reference: 'https://design.google/library/gemini-ai-visual-design',
    },
    { id: 'article', title: 'Artículo y referencias', icon: 'article', reference: io26Article },
] as const;

export type Io26Scenario = (typeof io26Examples)[number]['id'];

export const io26Media = {
    transparent: {
        title: 'Designing for Transparent Screens',
        description: 'Clip original sobre interfaces para gafas con pantalla transparente. Puedes reproducirlo, pausarlo y recorrerlo.',
        uri: 'https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fm3%2Fimages%2Fmpgkueq7-00_Design-Hub_Hero_2X_16x9.mp4?alt=media',
    },
    gemini: {
        title: 'Illustrating the Gemini App',
        description: 'Clip original de las señales visuales, gestos, iconografía y movimiento de las ilustraciones de Gemini.',
        uri: 'https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fm3%2Fimages%2Fmpgl2c1p-1_IllustratingGemini-16x9.mp4?alt=media',
    },
} as const;

export const io26Recipes = [
    {
        id: 'salad',
        title: 'Garden Salad',
        category: 'Vegetarian',
        description: 'Fresh greens, herbs and a lemon dressing.',
        image: require('./assets/buttons/recipes.png'),
    },
    {
        id: 'dumplings',
        title: 'Homemade Dumplings',
        category: 'Weeknight',
        description: 'Steamed dumplings to share at the table.',
        image: require('./assets/buttons/bao.png'),
    },
    {
        id: 'bread',
        title: 'Simple Crusted Bread',
        category: 'Easy',
        description: 'A golden crust and a soft, airy crumb.',
        image: require('./assets/buttons/sourdough.png'),
    },
    {
        id: 'complex',
        title: 'The Most Complicated Recipe You’ll Still Want To Make',
        category: 'Vegetarian',
        description: 'A complete meal with soup, vegetables and fresh bread.',
        image: require('./assets/buttons/recipes.png'),
    },
    {
        id: 'tacos',
        title: 'Mexican dishes',
        category: 'Weeknight',
        description: 'Tacos with fresh vegetables and salsa.',
        image: require('./assets/lists/tacos.png'),
    },
] as const;

export function filterIo26Recipes(query: string, category: string) {
    const normalize = (text: string) =>
        text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase()
            .trim();
    const needle = normalize(query);
    return io26Recipes.filter(
        (recipe) =>
            (!category || recipe.category === category) &&
            normalize(`${recipe.title} ${recipe.description} ${recipe.category}`).includes(needle)
    );
}
