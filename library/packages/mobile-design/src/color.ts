import type { ColorValue } from 'react-native';

export function withAlpha(color: string, alpha: number) {
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);

    if (rgbMatch) {
        return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
    }

    const hexMatch = color.match(/^#?([a-f\d]{3}|[a-f\d]{6})$/i);

    if (!hexMatch) {
        return color;
    }

    const hexValue =
        hexMatch[1].length === 3
            ? hexMatch[1]
                  .split('')
                  .map((character) => `${character}${character}`)
                  .join('')
            : hexMatch[1];
    const red = Number.parseInt(hexValue.slice(0, 2), 16);
    const green = Number.parseInt(hexValue.slice(2, 4), 16);
    const blue = Number.parseInt(hexValue.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/** Adapt numeric ARGB colors at the vector-icon boundary without casting dynamic colors. */
export function toIconColor(color: ColorValue | undefined) {
    if (color == null) return undefined;
    if (typeof color !== 'number') return color;
    return `rgba(${(color >>> 16) & 255}, ${(color >>> 8) & 255}, ${color & 255}, ${((color >>> 24) & 255) / 255})`;
}
