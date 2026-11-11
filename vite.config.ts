import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // Core tests run in plain Node; UI tests opt in with `// @vitest-environment jsdom`.
    environment: 'node',
  },
});
