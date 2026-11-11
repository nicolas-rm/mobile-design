const guidelines = 'https://m3.material.io/components/buttons/guidelines';

/** Independent contexts from the published figures and clips, rather than extra Button variants. */
export const buttonUsageExamples = [
    { id: 'call', title: 'Video call · Join / End', icon: 'videocam', reference: `${guidelines}#usage` },
    { id: 'playlist', title: 'Edit playlist · intrinsic width', icon: 'queue_music', reference: `${guidelines}#container` },
    { id: 'audio-player', title: 'Audio · Play', icon: 'play_arrow', reference: `${guidelines}#usage` },
    { id: 'timer', title: 'Timer · Start / Stop', icon: 'timer', reference: `${guidelines}#toggle-buttons` },
    { id: 'photo-elevated', title: 'Photo · elevated action', icon: 'photo', reference: `${guidelines}#elevated-style` },
    { id: 'shopping-elevated', title: 'Shopping · elevated action', icon: 'shopping_bag', reference: `${guidelines}#elevated-style` },
    { id: 'payment', title: 'Make payment', icon: 'payments', reference: `${guidelines}#filled-style` },
    { id: 'music-filled', title: 'Audio · filled Pause', icon: 'pause', reference: `${guidelines}#filled-style` },
    { id: 'shopping-tonal', title: 'Shopping · Visit site', icon: 'storefront', reference: `${guidelines}#tonal-style` },
    { id: 'films', title: 'Movies · Back / Next movie', icon: 'movie', reference: `${guidelines}#outlined-style` },
    { id: 'shopping-outlined', title: 'Shopping · Add to cart', icon: 'shopping_cart', reference: `${guidelines}#outlined-style` },
    { id: 'calendar-gradient', title: 'Add to calendar · gradient', icon: 'event', reference: `${guidelines}#outlined-style` },
    { id: 'photo-outlined', title: 'Photo · contrasting outlined action', icon: 'image', reference: `${guidelines}#outlined-style` },
    { id: 'calendar-text', title: 'Calendar · text actions', icon: 'calendar_month', reference: `${guidelines}#text-style` },
    { id: 'retry', title: 'Snackbar · Retry', icon: 'refresh', reference: `${guidelines}#text-style` },
    { id: 'album', title: 'View album', icon: 'album', reference: `${guidelines}#text-style` },
    { id: 'sourdough', title: 'Sourdough · Learn more', icon: 'bakery_dining', reference: `${guidelines}#text-style` },
    { id: 'newsletter', title: 'Newsletter · Cancel / Subscribe', icon: 'mail', reference: `${guidelines}#text-style` },
    { id: 'flights', title: 'Flights · compact / wide', icon: 'flight', reference: `${guidelines}#resizing` },
    {
        id: 'download',
        title: 'Download playlist · 200% text',
        icon: 'download',
        reference: 'https://m3.material.io/components/buttons/accessibility#200-text-size',
    },
    { id: 'food-order', title: 'Pork bao buns · Add to order', icon: 'restaurant', reference: `${guidelines}#usage` },
    { id: 'food-checkout', title: 'Food · Place order', icon: 'shopping_bag', reference: `${guidelines}#usage` },
    { id: 'recipes', title: 'Easy recipes · responsive card', icon: 'menu_book', reference: `${guidelines}#presentation` },
    {
        id: 'rapid-player',
        title: 'Audio · rapid Next presses',
        icon: 'skip_next',
        reference: 'https://m3.material.io/components/buttons/accessibility#rapid-clicks',
    },
] as const;

export type ButtonUsageScenario = (typeof buttonUsageExamples)[number]['id'];

export const buttonAudioTracks = [
    { id: 'coleman', title: 'Long Walk', artist: 'L.R. Coleman', duration: 278 },
    { id: 'key', title: 'In the Dark', artist: 'Sole R. Rey', duration: 202 },
] as const;

export const buttonShoppingOffers = [
    { id: 'youbuy', seller: 'YouBuy', price: '$499.99', tax: '+$48.60 tax', total: '$548.59' },
    { id: 'super', seller: 'super.', price: '$239.99', tax: '+$19.89 tax', total: '$259.88' },
] as const;

export const buttonFlights = [
    {
        id: 'next',
        date: '19 Oct',
        relative: 'Tomorrow',
        duration: '2h 30m',
        departure: '3:15 PM',
        arrival: '6:00 PM',
        from: 'SEA',
        to: 'LAX',
        flight: 'LC345',
        booking: 'LS604',
        terminal: '2',
        gate: 'C4',
    },
    {
        id: 'upcoming',
        date: '23 Oct',
        relative: 'Next week',
        duration: '2h 45m',
        departure: '6:30 PM',
        arrival: '9:15 PM',
        from: 'LAX',
        to: 'SEA',
        flight: '',
        booking: '',
        terminal: '',
        gate: '',
    },
    {
        id: 'november',
        date: '16 Nov',
        relative: 'Next Month',
        duration: '2h 45m',
        departure: '',
        arrival: '',
        from: '',
        to: '',
        flight: '',
        booking: '',
        terminal: '',
        gate: '',
    },
] as const;

export function buttonClock(seconds: number) {
    const total = Math.max(0, Math.floor(seconds));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
