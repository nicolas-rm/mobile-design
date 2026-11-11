export const badgeUsageExamples = [
    {
        id: 'navigation-bar',
        title: 'Mail, Chat, Rooms, Meet',
        description: 'Seleccionar un destino oculta su insignia y abre su contenido.',
        icon: 'mail',
        reference: 'https://m3.material.io/components/badges/guidelines#usage',
    },
    {
        id: 'navigation-rail',
        title: 'Files',
        description: 'Photos 999+, Fonts, Documents y Delete en navegación expandida.',
        icon: 'folder_open',
        reference: 'https://m3.material.io/components/badges/guidelines#placement',
    },
    {
        id: 'tabs',
        title: 'Favorites',
        description: 'El conteo de 84 favoritos permanece después del grupo icono y texto.',
        icon: 'favorite',
        reference: 'https://m3.material.io/components/badges/guidelines#placement',
    },
    {
        id: 'app-bar',
        title: 'My collection',
        description: 'Insignias pequeñas en acciones de un app bar.',
        icon: 'web_asset',
        reference: 'https://m3.material.io/components/badges/guidelines#placement',
    },
    {
        id: 'travel',
        title: 'Flights, Hotels, Events',
        description: 'El ejemplo de accesibilidad con destinos y novedades.',
        icon: 'flight_takeoff',
        reference: 'https://m3.material.io/components/badges/accessibility',
    },
] as const;

export type BadgeUsageScenario = (typeof badgeUsageExamples)[number]['id'];
export type BadgeUsageRecord = { id: string; title: string; summary: string; body: string; icon: string };
export type BadgeUsageDestination = {
    key: string;
    label: string;
    icon: string;
    selectedIcon?: string;
    badge?: boolean | number;
    /** Counts describe the collection; unread markers are acknowledged on visiting a destination. */
    badgeMeaning?: 'count' | 'unread';
    badgeUnit?: string;
    records: BadgeUsageRecord[];
};

/** Local records make all represented counts inspectable, including the 999+ threshold. */
function records(prefix: string, count: number, icon: string, titles: readonly string[]): BadgeUsageRecord[] {
    return Array.from({ length: count }, (_, index) => {
        const title = titles[index % titles.length];
        const suffix = index >= titles.length ? ` ${Math.floor(index / titles.length) + 1}` : '';
        const body =
            prefix === 'mail'
                ? `Hi Lee,\n\n${
                      [
                          'Your saved collection is ready. The new photos from our garden walk are included, together with the notes from last weekend.',
                          'The design review is Thursday at 10:00. We will review navigation, typography, and the latest component examples. Please bring your notes.',
                          'Shall we visit the park on Saturday morning? The weather looks good for a walk and we can have lunch nearby afterward.',
                          'Here are the project notes from our last meeting. The next review covers the collection screen and the reading experience.',
                      ][index % 4]
                  }\n\nThanks,\nTaylor`
                : prefix === 'chat'
                  ? `${title}\n\nHi Lee! Our next catch-up is Thursday at 10:00. I have added the latest notes to the shared collection. Looking forward to hearing your ideas.`
                  : prefix === 'rooms'
                    ? `${title}\n\nMembers: Lee, Taylor, Alex, and Sam.\n\nLatest update\nThe meeting notes and photos are ready to review. Our next catch-up is Thursday at 10:00.`
                    : prefix === 'meet'
                      ? `${title}\n\nThursday · 10:00–11:00\nParticipants: Lee, Taylor, and Alex\n\nAgenda\n• Review recent work\n• Discuss the next release\n• Agree on follow-up tasks`
                      : prefix === 'event'
                        ? `${title}\n\nOctober ${19 + (index % 5)} · 10:00–12:00\nCalgary\n\nYour reservation is confirmed. Bring your ticket to the entrance. Doors open 30 minutes before the event.`
                        : prefix === 'documents'
                          ? `${title}\n\nProject: My collection\nUpdated: October ${25 - (index % 7)}\n\nThese are the notes and documents saved with this collection. Open the related photos and fonts from Files to review the remaining project materials.`
                          : prefix === 'fonts'
                            ? `${title}\n\nFont family: ${title}\nStyle: Regular\n\n${title === 'Material Symbols Rounded' ? 'A collection of rounded symbols for interface actions and navigation.' : 'A type family for clear, comfortable reading across headlines and body text.'}`
                            : `${title}${suffix}\n\nCollection: ${['Nature', 'Architecture', 'Summer', 'Everyday'][index % 4]}\nAdded: October ${25 - (index % 7)}\n\n${['A quiet morning among the trees and flowers.', 'Light and shadow along a familiar city street.', 'A view of the coast at the end of the afternoon.', 'The trail opens onto a wide mountain view.'][index % 4]}`;
        const summary =
            prefix === 'mail' || prefix === 'chat'
                ? `${prefix === 'mail' ? 'Taylor' : 'Latest message'} · ${index < 4 ? 'Today' : 'Yesterday'}`
                : prefix === 'meet'
                  ? 'Thursday · 10:00'
                  : prefix === 'rooms'
                    ? 'Lee, Taylor, Alex, Sam'
                    : prefix === 'fonts'
                      ? 'Regular'
                      : prefix === 'event'
                        ? `October ${19 + (index % 5)} · Calgary`
                        : prefix === 'documents'
                          ? 'Document · My collection'
                          : ['Nature', 'Architecture', 'Summer', 'Everyday'][index % 4];
        return { id: `${prefix}-${index + 1}`, title: `${title}${suffix}`, summary, body, icon };
    });
}

const recordFactories: Record<BadgeUsageScenario, () => BadgeUsageDestination[]> = {
    'navigation-bar': () => [
        {
            key: 'mail',
            label: 'Mail',
            icon: 'mail_outline',
            selectedIcon: 'mail_fill1',
            badge: 1004,
            records: records('mail', 1004, 'mail_outline', ['Your collection is ready', 'Design review', 'Weekend plans', 'Project notes']),
        },
        {
            key: 'chat',
            label: 'Chat',
            icon: 'chat_bubble_outline',
            selectedIcon: 'chat_bubble_fill1',
            badge: 10,
            records: records('chat', 10, 'chat_bubble_outline', ['Lee', 'Taylor', 'Alex', 'Sam']),
        },
        {
            key: 'rooms',
            label: 'Rooms',
            icon: 'groups',
            selectedIcon: 'groups_fill1',
            badge: true,
            records: records('rooms', 3, 'groups', ['Design team', 'Weekend trips', 'Reading club']),
        },
        {
            key: 'meet',
            label: 'Meet',
            icon: 'videocam',
            selectedIcon: 'videocam_fill1',
            badge: 3,
            records: records('meet', 3, 'videocam', ['Weekly catch-up', 'Design workshop', 'Planning meeting']),
        },
    ],
    'navigation-rail': () => [
        {
            key: 'photos',
            label: 'Photos',
            icon: 'image',
            selectedIcon: 'image_fill1',
            badge: 1004,
            badgeMeaning: 'count',
            badgeUnit: 'photos',
            records: records('photos', 1004, 'image', ['A walk in the garden', 'City light', 'At the beach', 'Mountain path']),
        },
        {
            key: 'fonts',
            label: 'Fonts',
            icon: 'font_download',
            records: records('fonts', 3, 'font_download', ['Roboto', 'Roboto Serif', 'Material Symbols Rounded']),
        },
        {
            key: 'documents',
            label: 'Documents',
            icon: 'article',
            records: records('documents', 3, 'article', ['Design notes', 'Project brief', 'Collection index']),
        },
        { key: 'delete', label: 'Delete', icon: 'delete_outline', records: [] },
    ],
    tabs: () => [
        {
            key: 'favorites',
            label: 'Favorites',
            icon: 'favorite_fill1',
            badge: 84,
            badgeMeaning: 'count',
            badgeUnit: 'favorites',
            records: records('favorite', 84, 'favorite_fill1', ['A walk in the garden', 'City light', 'At the beach', 'Mountain path']),
        },
        {
            key: 'collections',
            label: 'Collections',
            icon: 'folder_open',
            records: records('collection', 4, 'folder_open', ['Summer', 'Architecture', 'Nature', 'Everyday']),
        },
    ],
    'app-bar': () => [
        {
            key: 'all',
            label: 'My collection',
            icon: 'photo_library',
            records: records('collection-all', 12, 'image', ['A walk in the garden', 'City light', 'At the beach', 'Mountain path']),
        },
        {
            key: 'favorites',
            label: 'Favorites',
            icon: 'favorite_border',
            records: records('collection-favorite', 3, 'favorite_border', ['A walk in the garden', 'At the beach', 'Mountain path']),
        },
        {
            key: 'folders',
            label: 'Folders',
            icon: 'folder',
            badge: true,
            records: records('collection-folder', 4, 'folder_open', ['Summer', 'Architecture', 'Nature', 'Everyday']),
        },
    ],
    travel: () => [
        {
            key: 'flights',
            label: 'Flights',
            icon: 'flight_takeoff',
            badge: true,
            records: [
                {
                    id: 'flight-1',
                    title: 'JNB Johannesburg → YYC Calgary',
                    summary: '19 Oct–23 Oct',
                    body: 'JNB Johannesburg → YYC Calgary\n\n19 Oct–23 Oct\nSeat 12A\n\nYour reservation is confirmed. Check-in opens 24 hours before departure.',
                    icon: 'flight_takeoff',
                },
            ],
        },
        {
            key: 'hotels',
            label: 'Hotels',
            icon: 'bed',
            records: [
                {
                    id: 'hotel-1',
                    title: 'Garden Hotel',
                    summary: '19 Oct–23 Oct · 4 nights',
                    body: 'Garden Hotel\n\n19 Oct–23 Oct\nCheck-in after 15:00\nCheck-out before 11:00\n4 nights · 1 guest\n\nYour reservation is confirmed.',
                    icon: 'bed',
                },
            ],
        },
        {
            key: 'events',
            label: 'Events',
            icon: 'event_note',
            badge: 10,
            records: records('event', 10, 'event_note', ['Design workshop', 'Gallery opening', 'Evening concert', 'City walk']),
        },
    ],
};

const recordCache = new Map<BadgeUsageScenario, BadgeUsageDestination[]>();
/** Importing menu metadata allocates no records. Build only the opened context, once. */
export function getBadgeUsageRecords(scenario: BadgeUsageScenario): BadgeUsageDestination[] {
    const existing = recordCache.get(scenario);
    if (existing) return existing;
    const result = recordFactories[scenario]();
    recordCache.set(scenario, result);
    return result;
}
