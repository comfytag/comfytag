const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch only the shared packages that need hot-reload, not the entire monorepo.
// Watching workspaceRoot includes node_modules/.pnpm (thousands of dirs) which
// overflows Windows' file watcher handle limit.
config.watchFolders = [
  path.resolve(workspaceRoot, 'packages/ui'),
  path.resolve(workspaceRoot, 'packages/types'),
  path.resolve(workspaceRoot, 'packages/utils'),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// pnpm stores each package's dependencies as symlinks inside
// node_modules/.pnpm/<pkg>@<ver>/node_modules/<dep>.
// unstable_enableSymlinks lets Metro traverse those symlinks.
// disableHierarchicalLookup forces Metro to resolve only from nodeModulesPaths
// above, preventing it from walking up into .pnpm/<pkg> dirs and picking up
// wrong versions of shared deps (react, react-native, etc.).
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
