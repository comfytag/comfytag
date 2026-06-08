export default {
  // TypeScript/JavaScript files - lint and typecheck
  '**/*.{ts,tsx,js,jsx}': [
    'pnpm lint',
    'pnpm typecheck',
  ],
};
