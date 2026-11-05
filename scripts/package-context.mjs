import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export function packageContext() {
    const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const { values } = parseArgs({
        options: { 'package-dir': { type: 'string' }, 'evidence-dir': { type: 'string' } },
        allowPositionals: false,
    });
    const packageRoot = path.resolve(
        values['package-dir'] ?? process.env.MOBILE_DESIGN_PACKAGE_DIR ?? path.join(site, '../../packages/mobile-design')
    );
    if (!fs.existsSync(path.join(packageRoot, 'src/index.ts')))
        throw new Error(
            'No se encontró el paquete nativo. Indica --package-dir /ruta/al/paquete/mobile-design. El sitio incluido en dist funciona sin ese paquete.'
        );
    const packageRequire = createRequire(path.join(packageRoot, 'package.json'));
    const tokensRoot = path.dirname(packageRequire.resolve('@mobile-design/tokens/package.json'));
    const iconsRoot = path.dirname(packageRequire.resolve('@mobile-design/icons/package.json'));
    let workspace = packageRoot;
    while (!fs.existsSync(path.join(workspace, 'tsconfig.json'))) {
        const parent = path.dirname(workspace);
        if (parent === workspace) throw new Error('No se encontró el tsconfig.json del workspace nativo.');
        workspace = parent;
    }
    const ts = createRequire(path.join(workspace, 'package.json'))('typescript');
    const config = ts.readConfigFile(path.join(workspace, 'tsconfig.json'), ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, workspace);
    const options = {
        ...parsed.options,
        paths: {
            ...parsed.options.paths,
            'mobile-design': [path.join(packageRoot, 'src/index.ts')],
            'mobile-design/web': [path.join(packageRoot, 'src/web.ts')],
        },
    };
    return {
        site,
        packageRoot,
        packageRequire,
        tokensRoot,
        iconsRoot,
        workspace,
        ts,
        options,
        evidence: values['evidence-dir'] ? path.resolve(values['evidence-dir']) : undefined,
    };
}
