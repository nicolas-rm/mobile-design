import Svg, { Image } from 'react-native-svg';

/** Only photographic/art regions are visible. All controls stay native, live components. */
export const referenceArt = {
    'search-recipe-thursday': {
        source: require('./assets/md3-reference/search-recipe-thursday-frame.png'),
        image: [1352, 600],
        crop: [296, 438, 112, 112],
    },
    'search-recipe-tacos': {
        source: require('./assets/md3-reference/search-recipe-tacos-frame.png'),
        image: [1352, 600],
        crop: [296, 440, 112, 112],
    },
    photo: { source: require('./assets/md3-reference/photo.png'), image: [656, 600], crop: [0, 340, 534, 260] },
    'photo-avatar': { source: require('./assets/md3-reference/photo.png'), image: [656, 600], crop: [470, 220, 64, 64] },
    music: { source: require('./assets/md3-reference/music-frame.png'), image: [1352, 960], crop: [480, 104, 414, 390] },
    call: { source: require('./assets/md3-reference/call-frame.png'), image: [1352, 600], crop: [65, 0, 1222, 300] },
    'collection-podcast': { source: require('./assets/md3-reference/collection.png'), image: [1004, 600], crop: [123, 441, 366, 159] },
    'collection-photo': { source: require('./assets/md3-reference/collection.png'), image: [1004, 600], crop: [515, 441, 366, 159] },
    'email-avatar': { source: require('./assets/md3-reference/dinner-club.png'), image: [1352, 600], crop: [143, 299, 74, 74] },
} as const;
export type ReferenceArtName = keyof typeof referenceArt;

export function ReferenceArt({ name }: { name: ReferenceArtName }) {
    const art = referenceArt[name];
    return (
        <Svg width="100%" height="100%" viewBox={art.crop.join(' ')} preserveAspectRatio="xMidYMid slice" accessible={false}>
            <Image href={art.source} x={0} y={0} width={art.image[0]} height={art.image[1]} />
        </Svg>
    );
}
