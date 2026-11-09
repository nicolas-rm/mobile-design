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
        values['package-dir'] ?? process.env.MOBILE_DESIGN_PACKAGE_DIR ?? path.join(site, 'library/packages/mobile-design')
    );
    if (!fs.existsSync(path.join(packageRoot, 'src/index.ts')))
        throw new Error(
            'No se encontró el paquete nativo. Indica --package-dir /ruta/al/paquete/mobile-design. El sitio incluido en dist funciona sin ese paquete.'
        );
    const packageRequire = createRequire(path.join(packageRoot, 'package.json'));
    const tokensRoot = path.dirname(packageRequire.resolve('@mobile-design/tokens/package.json'));
    let workspace = packageRoot;
    while (!fs.existsSync(path.join(workspace, 'tsconfig.json'))) {
        const parent = path.dirname(workspace);
        if (parent === workspace) throw new Error('No se encontró el tsconfig.json del workspace nativo.');
        workspace = parent;
    }
    const workspaceRequire = createRequire(path.join(workspace, 'package.json'));
    const siblingIcons = path.resolve(packageRoot, '../mobile-design-icons');
    const iconsRoot = fs.existsSync(path.join(siblingIcons, 'package.json'))
        ? siblingIcons
        : path.dirname(workspaceRequire.resolve('@mobile-design/icons/package.json'));
    const iconsRequire = createRequire(path.join(iconsRoot, 'package.json'));
    const ts = workspaceRequire('typescript');
    const config = ts.readConfigFile(path.join(workspace, 'tsconfig.json'), ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, workspace);
    const options = {
        ...parsed.options,
        typeRoots: [...(parsed.options.typeRoots ?? []), path.join(workspace, 'node_modules/@types')],
        paths: {
            ...parsed.options.paths,
            'mobile-design/react-native': [packageRequire.resolve('mobile-design/react-native')],
            'mobile-design/react-native-web': [packageRequire.resolve('mobile-design/react-native-web')],
            '@mobile-design/icons/react-native-web': [iconsRequire.resolve('@mobile-design/icons/react-native-web')],
            '@mobile-design/tokens': [packageRequire.resolve('@mobile-design/tokens')],
            '@mobile-design/tokens/colors': [path.join(tokensRoot, 'src/generated/material-colors.d.ts')],
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
