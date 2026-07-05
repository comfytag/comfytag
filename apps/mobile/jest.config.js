module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  // pnpm stores packages at node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>/
  // The standard regex anchors to the first node_modules/ and then the package name,
  // which fails for pnpm because the next segment is ".pnpm/" not the package name.
  // Using .* inside the lookahead makes the check match anywhere further in the path.
  transformIgnorePatterns: [
    'node_modules/(?!.*(react-native|@react-native|expo|@expo|@comfytag|lucide-react-native|@shopify|react-native-gifted-charts|react-native-webview|react-native-qrcode-svg|socket\\.io|zustand|@tanstack))',
  ],
  moduleNameMapper: {
    '^@comfytag/ui/tokens$':
      '<rootDir>/../../packages/ui/src/tokens/index.native.ts',
    '^@comfytag/types$': '<rootDir>/../../packages/types/src/index.ts',
    '^@comfytag/utils$': '<rootDir>/../../packages/utils/src/index.ts',
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
    '^@react-native-community/netinfo$':
      '@react-native-community/netinfo/jest/netinfo-mock',
  },
}
