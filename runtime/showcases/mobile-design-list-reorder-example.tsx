import { useState } from 'react';
import { Image, View, useWindowDimensions } from 'react-native';
import { Icon, List, ListReorderGroup, Text, ThemeProvider, useMobileTheme } from 'mobile-design/react-native-web';
import { listTracks } from './mobile-design-list-usage-data';

const tracks = [
    ...listTracks.map((track) => ({ ...track })),
    { id: 'play-it-as-it-lays' as const, title: 'Play it as it lays', artist: 'Kim Petras', album: '', art: 'play-it-as-it-lays' },
];
const covers = {
    strangers: require('./assets/lists/strangers.png'),
    '21st-century-strangers': require('./assets/lists/21st-century-reorder.png'),
    decorations: require('./assets/lists/decorations.png'),
    'play-it-as-it-lays': require('./assets/lists/play-it-as-it-lays.png'),
};
const artworkColors = {
    strangers: '#DDDDE6',
    '21st-century-strangers': '#F4ADC9',
    decorations: '#CCD7D3',
    'play-it-as-it-lays': '#CCCCCC',
};

/** G07: only the handle drags. A completed drop persists the new order. */
export function ListReorderExample({ onEvent }: { onEvent: (message: string) => void }) {
    const theme = useMobileTheme(),
        { fontScale } = useWindowDimensions();
    const [items, setItems] = useState(tracks);
    const itemHeight = Math.max(96, 20 + 64 * fontScale);
    // Artwork is intrinsically light in G07; its ink must remain dark in both schemes.
    const artworkTheme = { ...theme, colors: { ...theme.colors, onSurface: '#241B20', onSurfaceVariant: '#494149' } };
    return (
        <View style={{ padding: 16, gap: 16 }}>
            <Text variant="displaySmall" style={{ color: theme.colors.onSurface }}>
                My top favorites
            </Text>
            <ListReorderGroup
                items={items}
                keyExtractor={(item) => item.id}
                itemHeight={itemHeight}
                onReorder={(next) => {
                    setItems(next);
                    onEvent(`Order updated: ${next.map((item) => item.title).join(', ')}`);
                }}
                renderItem={({ item, index, dragged, renderHandle }) => (
                    <ThemeProvider theme={dragged ? artworkTheme : theme}>
                        <List.Item
                            title={item.title}
                            description={[item.artist, item.album].filter(Boolean).join('\n')}
                            lines={3}
                            dragged={dragged}
                            multiAction
                            leading={<Image source={covers[item.id]} style={{ width: 56, height: 56, borderRadius: 8 }} />}
                            trailing={({ height, style }) => (
                                <View style={[style, { height, justifyContent: 'center' }]}>
                                    {renderHandle(
                                        <Icon
                                            source="drag_handle"
                                            size={20}
                                            color={dragged ? artworkTheme.colors.onSurface : theme.colors.onSurface}
                                        />,
                                        `Reorder ${item.title}, ${index + 1} of ${items.length}`
                                    )}
                                </View>
                            )}
                            style={{ height: itemHeight, backgroundColor: dragged ? artworkColors[item.id] : theme.colors.surface }}
                            testID={`md-list-reorder-track-${item.id}`}
                        />
                    </ThemeProvider>
                )}
                testID="md-list-favorites-reorder"
            />
        </View>
    );
}
