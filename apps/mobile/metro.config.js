const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch only what the mobile app actually needs from the monorepo —
// the shared workspace packages it imports (@comfytag/types/ui/utils) and
// the root node_modules for pnpm's hoisted resolution. Previously this
// watched the entire workspaceRoot, which also recursively watches
// apps/web, apps/partner, apps/admin, and apps/api (each with their own
// large node_modules) even though mobile never imports from any of them.
// That's very likely what pushed Metro's file watcher past its startup
// timeout ("Failed to start watch mode") after node_modules grew from the
// react-native-reanimated/@gorhom/bottom-sheet/react-native-worklets installs.
config.watchFolders = [
  path.resolve(workspaceRoot, 'packages'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies through symlinks
config.resolver.unstable_enableSymlinks = true;

// 4. SURGICAL PIN: Bypass Windows NTFS Junction blind spots for peer-resolved packages
config.resolver.extraNodeModules = {
  'expo-modules-core': path.resolve(workspaceRoot, 'node_modules/expo-modules-core'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
  'expo': path.resolve(workspaceRoot, 'node_modules/expo'),
  'react': path.resolve(workspaceRoot, 'node_modules/react'),
};

module.exports = config;