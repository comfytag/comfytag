export default {
  '**/*.{ts,tsx,js,jsx}': () => ['pnpm lint', 'pnpm typecheck'],
};
