import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { packageContext } from './package-context.mjs';
const { site, workspace, ts } = packageContext(),
    source = path.join(workspace, 'src/screens/examples'),
    target = path.join(site, 'runtime/showcases');
if (!fs.existsSync(source))
    throw new Error('Edita las galerías en runtime/showcases. Para importar desde otra aplicación, indica su paquete con --package-dir.');
fs.mkdirSync(target, { recursive: true });
const selected = [
    'core-examples',
    'content-examples',
    'selection-examples',
    'navigation-examples',
    'navigation-playground',
    'navigation-state',
    'progress-examples',
    'progress-usage-examples',
    'action-examples',
    'action-scenarios',
    'demo-task',
    'dialog-examples',
    'sheet-content-examples',
    'chip-input-examples',
    'list-examples',
    'tabs-examples',
    'tabs-usage-data',
    'tabs-usage-screen',
    'tabs-art',
    'list-usage-data',
    'list-usage-screen',
    'list-reorder-example',
    'choice-examples',
];
const records = [];
for (const key of selected) {
    const name = 'mobile-design-' + key,
        original = ['.tsx', '.ts'].map((ext) => path.join(source, name + ext)).find(fs.existsSync);
    let text = fs.readFileSync(original, 'utf8');
    const ast = ts.createSourceFile(original, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
        edits = [];
    const visit = (node) => {
        if (ts.isImportDeclaration(node) && ['mobile-design', 'mobile-design/react-native'].includes(node.moduleSpecifier.text))
            edits.push([node.moduleSpecifier.getStart(ast), node.moduleSpecifier.end, "'mobile-design/react-native-web'"]);
        if (ts.isImportDeclaration(node) && node.moduleSpecifier.text === '@mobile-design/icons/react-native')
            edits.push([node.moduleSpecifier.getStart(ast), node.moduleSpecifier.end, "'@mobile-design/icons/react-native-web'"]);
        if (
            ts.isImportDeclaration(node) &&
            [
                './mobile-design-appbar-examples',
                './mobile-design-badge-examples',
                './mobile-design-card-examples',
                './mobile-design-button-group-examples',
                './mobile-design-button-examples',
            ].includes(node.moduleSpecifier.text)
        )
            edits.push([node.getStart(ast), node.end, '']);
        if (ts.isExportDeclaration(node) && node.moduleSpecifier?.text === './mobile-design-action-playground')
            edits.push([node.getStart(ast), node.end, '']);
        if (
            ts.isCaseClause(node) &&
            ts.isStringLiteral(node.expression) &&
            ((key === 'core-examples' && ['app-bars', 'badges', 'cards'].includes(node.expression.text)) ||
                (key === 'action-examples' && ['buttons', 'button-groups'].includes(node.expression.text)))
        ) {
            edits.push([node.getStart(ast), node.end, '']);
            return;
        }
        if (ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) === 'List.Accordion') {
            const title = node.openingElement.attributes.properties.find(
                (attr) => ts.isJsxAttribute(attr) && attr.name.getText(ast) === 'title'
            )?.initializer;
            if (title && ts.isStringLiteral(title) && title.text.startsWith('Configuración')) {
                edits.push([
                    node.openingElement.getStart(ast),
                    node.openingElement.end,
                    '<View style={{gap:12}}><Text variant="titleMedium">' + title.text + '</Text>',
                ]);
                edits.push([node.closingElement.getStart(ast), node.closingElement.end, '</View>']);
            }
        }
        if (ts.isJsxElement(node) && node.getText(ast).includes('Linking.openURL') && node.openingElement.tagName.getText(ast) === 'Text') {
            edits.push([node.getStart(ast), node.end, '<></>']);
            return;
        }
        ts.forEachChild(node, visit);
    };
    visit(ast);
    for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0])) text = text.slice(0, start) + replacement + text.slice(end);
    if (key === 'core-examples')
        text = text.replaceAll(
            /image: \{ uri: 'https:\/\/images\.unsplash\.com\/photo-(1448375240586-882707db888b|1471922694854-ff1b63b20054|1509316785289-025f5b846b35)\?w=900&q=85' \}/g,
            (_, photo) =>
                `image: require('./assets/carousel/${{ '1448375240586-882707db888b': 'forest', '1471922694854-ff1b63b20054': 'coast', '1509316785289-025f5b846b35': 'desert' }[photo]}.jpg')`
        );
    if (key === 'list-examples') text = text.replace('están en el FAB.', 'están en el selector de ejemplos.');
    if (key === 'demo-task')
        text = text
            .replace("import { useIsFocused } from '@react-navigation/native';", '')
            .replace(
                'const focused = useIsFocused();',
                '// A showcase is mounted only while its local window is selected.\n    const focused = true;'
            );
    if (key === 'core-examples')
        text = text
            .replace(
                '<List.Accordion title="Configuración de la demostración">',
                '<View style={{gap:12}}><Text variant="titleMedium">Configuración de la demostración</Text>'
            )
            .replace('</List.Accordion>', '</View>');
    // Text follows the package typography, including emphasized roles.
    if (/import \{ Text \} from 'react-native-paper';/.test(text))
        text = text.replace("import { Text } from 'react-native-paper';", "import { Text } from 'mobile-design/react-native-web';");
    if (key === 'navigation-examples')
        text = text
            .replace('Surface, Text, useTheme', 'Surface, useTheme')
            .replace('import { initialDocument', "import { Text } from 'mobile-design/react-native-web';\nimport { initialDocument");
    text = text.replaceAll('siguiendo Android Material', 'con selección de 24 horas');
    text = text.replaceAll("require('../../assets/images/welcome-wallpaper.png')", "require('./assets/welcome-wallpaper.png')");
    fs.writeFileSync(path.join(target, path.basename(original)), text);
    records.push({
        source: path.relative(workspace, original),
        sha256: createHash('sha256').update(fs.readFileSync(original)).digest('hex'),
    });
}
for (const name of ['lists', 'tabs', 'buttons'])
    fs.cpSync(path.join(source, 'assets', name), path.join(target, 'assets', name), { recursive: true });
fs.copyFileSync(path.join(workspace, 'src/assets/images/welcome-wallpaper.png'), path.join(target, 'assets/welcome-wallpaper.png'));
fs.writeFileSync(
    path.join(target, 'provenance.json'),
    JSON.stringify(
        {
            description:
                'Original native showcase compositions, adapted for the web document lifecycle, inline configuration and self-contained local assets. Original components are imported from mobile-design/react-native-web.',
            files: records,
        },
        null,
        2
    ) + '\n'
);
console.log('Synchronized ' + records.length + ' showcase modules and original assets.');
