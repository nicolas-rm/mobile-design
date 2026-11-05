import Svg, { Image as SvgImage } from 'react-native-svg';

/** Only source photo regions are rendered; all controls and text remain native. */
export const tabsReferenceArt = {
    floral: { source: require('./assets/tabs/music.png'), image: [658, 984], crop: [115, 442, 232, 232] },
    astral: { source: require('./assets/tabs/music.png'), image: [658, 984], crop: [379, 442, 232, 232] },
    traveler: { source: require('./assets/tabs/music-wide.png'), image: [1352, 952], crop: [824, 542, 232, 232] },
    mountain: { source: require('./assets/tabs/music-scrolled.png'), image: [1352, 952], crop: [296, 708, 232, 232] },
    cranes: { source: require('./assets/tabs/music-scrolled.png'), image: [1352, 952], crop: [560, 708, 232, 232] },
    water: { source: require('./assets/tabs/music-wide.png'), image: [1352, 952], crop: [296, 542, 232, 232] },
    tent: { source: require('./assets/tabs/white-noise.png'), image: [1352, 952], crop: [296, 542, 232, 232] },
    station: { source: require('./assets/tabs/white-noise.png'), image: [1352, 952], crop: [560, 542, 232, 232] },
    magdalena: { source: require('./assets/tabs/white-noise.png'), image: [1352, 952], crop: [824, 542, 232, 232] },
    alaskan: { source: require('./assets/tabs/dogs.png'), image: [656, 600], crop: [112, 442, 365, 158] },
    middleSummer: { source: require('./assets/tabs/movie-posters.png'), image: [656, 600], crop: [110, 184, 232, 288] },
    bestBess: { source: require('./assets/tabs/movie-posters.png'), image: [656, 600], crop: [374, 184, 232, 288] },
    poke: { source: require('./assets/tabs/recipe.png'), image: [1352, 600], crop: [296, 0, 760, 206] },
} as const;
export type TabsReferenceArtName = keyof typeof tabsReferenceArt;

export function TabsSourceArt({ name }: { name: TabsReferenceArtName }) {
    const art = tabsReferenceArt[name];
    return (
        <Svg width="100%" height="100%" viewBox={art.crop.join(' ')} preserveAspectRatio="xMidYMid slice" accessible={false}>
            <SvgImage href={art.source} x={0} y={0} width={art.image[0]} height={art.image[1]} />
        </Svg>
    );
}
