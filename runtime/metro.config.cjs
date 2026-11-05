const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const packageRoot = process.env.MOBILE_DESIGN_PACKAGE_DIR;
if (!packageRoot) throw new Error('Set MOBILE_DESIGN_PACKAGE_DIR to the Mobile Design source package.');
let workspace = packageRoot;
while (!fs.existsSync(path.join(workspace, 'tsconfig.json'))) {
    const parent = path.dirname(workspace);
    if (parent === workspace) throw new Error('Mobile Design workspace not found.');
    workspace = parent;
}
const workspaceRequire = createRequire(path.join(workspace, 'package.json'));
const { getDefaultConfig } = workspaceRequire('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.watchFolders = [...new Set([...(config.watchFolders || []), workspace, packageRoot])];
config.resolver.nodeModulesPaths = [path.join(workspace, 'node_modules')];
config.resolver.extraNodeModules = { ...config.resolver.extraNodeModules, 'mobile-design': packageRoot };
module.exports = config;
