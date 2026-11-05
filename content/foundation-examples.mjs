export const foundationExamples = {
    typography: {
        id: 'typography',
        title: 'Text, jerarquía y énfasis',
        code: `import { ScrollView, View } from 'react-native';
import { MobileDesignProvider, Text, type TextVariant } from 'mobile-design';

const roles = ['display', 'headline', 'title', 'body', 'label'] as const;
const sizes = ['Large', 'Medium', 'Small'] as const;

export default function TypographyExample() {
  return <MobileDesignProvider languageHeight="small">
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
      <Text variant="headlineMedium" accessibilityRole="header">Tu biblioteca</Text>
      <Text variant="bodyLarge" selectable>
        Escucha sin prisas. <Text variant="bodyLargeEmphasized">Tus favoritos siguen aquí.</Text>
      </Text>
      <Text variant="displaySmall" style={{ fontVariant: ['tabular-nums'] }}>01:11 / 08:48</Text>
      {roles.flatMap(role => sizes.map(size => {
        const baseline = (role + size) as TextVariant;
        const emphasized = (role + size + 'Emphasized') as TextVariant;
        return <View key={baseline} style={{ gap: 12 }}>
          <Text variant="labelMedium">{baseline}</Text>
          <Text variant={baseline} selectable>Diseña para escuchar.</Text>
          <Text variant={emphasized} selectable>Diseña para escuchar.</Text>
        </View>;
      }))}
    </ScrollView>
  </MobileDesignProvider>;
}
`,
    },
};
