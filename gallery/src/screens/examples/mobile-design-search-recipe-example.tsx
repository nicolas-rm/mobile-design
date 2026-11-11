import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, List, SearchView, Text, type SearchResult } from 'mobile-design/react-native';
import { ReferenceArt } from './mobile-design-reference-art';

const recipes = [
    {
        key: 'thursday',
        title: 'Recipes for Thursday night',
        description: 'Here are some healthy weeknight recipes',
        icon: 'restaurant',
        tags: 'quick dinners healthy',
        ingredients: ['Vegetables', 'Rice', 'Fresh herbs'],
        method: 'Cook the rice. Roast the vegetables and finish with fresh herbs.',
    },
    {
        key: 'tacos',
        title: 'Simple Classic Tacos',
        description: 'Here’s a simple recipe for a fantastic taco dinner.',
        icon: 'restaurant',
        tags: 'mexican dishes tacos dinner',
        ingredients: ['Corn tortillas', 'Beans', 'Tomato', 'Lime'],
        method: 'Warm the tortillas. Add the beans and tomato, then finish with lime.',
    },
    {
        key: 'salad',
        title: 'Green salad',
        description: 'A fresh lunch with seasonal vegetables.',
        icon: 'restaurant',
        tags: 'vegetarian lunch salad',
        ingredients: ['Leafy greens', 'Cucumber', 'Lemon'],
        method: 'Wash and chop the vegetables. Toss with lemon just before serving.',
    },
] as const;

/** The recipe-query example has a real local result and a usable detail view. */
export function SearchRecipeExample() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [recent, setRecent] = useState<string[]>([]);
    const [selected, setSelected] = useState<(typeof recipes)[number] | null>(null);
    const normalized = query.toLocaleLowerCase().trim();
    const matches = recipes.filter((item) => `${item.title} ${item.description} ${item.tags}`.toLocaleLowerCase().includes(normalized));
    const results: readonly SearchResult[] =
        !normalized && recent.length
            ? recent.map((title, index) => ({ key: `recent-${index}`, title, icon: 'history' }))
            : normalized
              ? matches
              : [recipes[0]];
    const remember = (value: string) => {
        const next = value.trim();
        if (next) setRecent((items) => [next, ...items.filter((item) => item !== next)].slice(0, 5));
    };
    const choose = (result: SearchResult) => {
        setQuery(result.title);
        if (result.key.startsWith('recent-')) return;
        const recipe = recipes.find((item) => item.key === result.key);
        if (recipe) {
            remember(query);
            setSelected(recipe);
            setOpen(false);
        }
    };
    return (
        <View style={{ gap: 16 }}>
            <Text variant="titleLarge">Search recipes</Text>
            <Text>
                Prueba «Mexican dishes» para encontrar Simple Classic Tacos. Enviar conserva la consulta y oculta el teclado; elegir la
                receta abre su detalle.
            </Text>
            <SearchView
                open={open}
                onOpenChange={setOpen}
                value={query}
                onChangeText={setQuery}
                onSearch={remember}
                closeOnSelect={false}
                placeholder="Search recipes"
                results={results}
                resultsAccessibilityLabel={`${results.length} ${normalized ? 'results' : 'suggestions'}`}
                trailingActions={[
                    {
                        key: 'history',
                        icon: 'history',
                        label: 'Recent recipe searches',
                        onPress: () => {
                            setQuery('');
                            setOpen(true);
                        },
                    },
                ]}
                onResultPress={choose}
                renderResults={({ containerColor }) => (
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 24 }}
                    >
                        {results.map((result) => (
                            <List.Item
                                key={result.key}
                                title={result.title}
                                description={result.description}
                                style={{ backgroundColor: containerColor }}
                                leading={
                                    result.key === 'thursday' || result.key === 'tacos' ? (
                                        <View style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden' }}>
                                            <ReferenceArt
                                                name={result.key === 'thursday' ? 'search-recipe-thursday' : 'search-recipe-tacos'}
                                            />
                                        </View>
                                    ) : (
                                        <List.Icon icon={result.icon ?? 'restaurant'} />
                                    )
                                }
                                onPress={() => choose(result)}
                                testID={`catalog-search-recipes-result-${result.key}`}
                            />
                        ))}
                        {!results.length ? <Text style={{ padding: 24 }}>No recipes match “{query}”.</Text> : null}
                    </ScrollView>
                )}
                supportingContent={
                    <Text variant="labelLarge" accessibilityLiveRegion="polite" style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
                        {normalized ? 'Results' : recent.length ? 'Recent searches' : 'Suggested results'}
                    </Text>
                }
                emptyContent={<Text>No recipes match “{query}”.</Text>}
                testID="catalog-search-recipes"
            />
            {selected ? (
                <View style={{ gap: 12 }} testID="catalog-search-recipe-detail">
                    <Text variant="headlineSmall">{selected.title}</Text>
                    <Text>{selected.description}</Text>
                    <Text variant="titleMedium">Ingredients</Text>
                    {selected.ingredients.map((ingredient) => (
                        <Text key={ingredient}>• {ingredient}</Text>
                    ))}
                    <Text variant="titleMedium">Method</Text>
                    <Text>{selected.method}</Text>
                    <Button variant="text" style={{ alignSelf: 'flex-start' }} onPress={() => setOpen(true)}>
                        Back to results
                    </Button>
                </View>
            ) : (
                <Text>Selecciona una receta para ver ingredientes y preparación.</Text>
            )}
        </View>
    );
}
