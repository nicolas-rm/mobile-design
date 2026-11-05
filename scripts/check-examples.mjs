import fs from 'node:fs';
import path from 'node:path';
import { packageContext } from './package-context.mjs';
const { site, workspace, ts, options } = packageContext();
const files = fs
    .readdirSync(path.join(site, 'dist/examples'))
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => path.join(site, 'dist/examples', f));
const program = ts.createProgram(files, { ...options, noEmit: true });
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
