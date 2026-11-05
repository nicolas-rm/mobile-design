import type { TabItem } from 'mobile-design';

const guidelines = 'https://m3.material.io/components/tabs/guidelines';

/** Published contexts; the catalogue launcher is separate from the original Tabs. */
export const tabsUsageExamples = [
    { id: 'media', title: 'My saved media', icon: 'video_library', reference: guidelines },
    { id: 'music', title: 'Music · tap, swipe, vertical scroll', icon: 'music_note', reference: guidelines },
    { id: 'dogs', title: 'Dog breeds · scrollable tabs', icon: 'pets', reference: guidelines },
    { id: 'movies', title: 'Movies near me · app bar + tabs', icon: 'movie', reference: guidelines },
    { id: 'recipe', title: 'Poke bowl · secondary tabs', icon: 'restaurant', reference: guidelines },
] as const;
export type TabsUsageScenario = (typeof tabsUsageExamples)[number]['id'];

export const tabsMediaItems: readonly TabItem[] = [
    { key: 'video', label: 'Video', icon: 'videocam' },
    { key: 'photos', label: 'Photos', icon: 'image' },
    { key: 'audio', label: 'Audio', icon: 'music_note_fill1' },
];
export const tabsMusicItems: readonly TabItem[] = [
    { key: 'ambient', label: 'Ambient' },
    { key: 'soundscapes', label: 'Soundscapes' },
    { key: 'white-noise', label: 'White Noise' },
];
export const tabsDogItems: readonly TabItem[] = [
    { key: 'akita', label: 'Akita' },
    { key: 'alaskan', label: 'Alaskan' },
    { key: 'australian-shepard', label: 'Australian Shepard' },
    { key: 'azawakh', label: 'Azawakh' },
    { key: 'barbet', label: 'Barbet' },
];
export const tabsTravelItems: readonly TabItem[] = [
    { key: 'flights', label: 'Flights', icon: 'flight' },
    { key: 'trips', label: 'Trips', icon: 'luggage' },
    { key: 'explore', label: 'Explore', icon: 'explore' },
];
export const tabsProductItems: readonly TabItem[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'specifications', label: 'Specifications' },
];
export const tabsIconItems: readonly TabItem[] = [
    { key: 'wishlist', label: '', icon: 'favorite_border', accessibilityLabel: 'Wishlist' },
    { key: 'location', label: '', icon: 'location_on', accessibilityLabel: 'Location' },
];
export const tabsMovieItems: readonly TabItem[] = [
    { key: 'movies', label: 'Movies' },
    { key: 'theatres', label: 'Theatres' },
];
