import fs from 'node:fs';
import path from 'node:path';
import { packageContext } from './package-context.mjs';
const { site, packageRoot, workspace, ts, options } = packageContext();
const files = fs
    .readdirSync(path.join(site, 'dist/examples'))
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => path.join(site, 'dist/examples', f));
const dependencyPaths = Object.fromEntries(
    ['react-native', 'react-native-reanimated'].map((name) => {
        const resolution = ts.resolveModuleName(name, path.join(workspace, 'package.json'), options, ts.sys).resolvedModule;
        if (!resolution) throw new Error(`No se encontró ${name} en el workspace de Mobile Design.`);
        return [name, [resolution.resolvedFileName]];
    })
);
const program = ts.createProgram([...files, path.join(packageRoot, 'src/paper-internals.d.ts')], {
    ...options,
    noEmit: true,
    paths: { ...options.paths, ...dependencyPaths, 'mobile-design': options.paths['mobile-design/react-native'] },
});
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
    console.error(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
            getCanonicalFileName: (f) => f,
            getCurrentDirectory: () => workspace,
            getNewLine: () => '\n',
        })
    );
    process.exitCode = 1;
} else console.log(`PASS: ${files.length} complete React Native examples type-check against Mobile Design.`);
