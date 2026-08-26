import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    target: 'es2020',
    // Phaser is one big chunk; the warning is expected, not actionable.
    chunkSizeWarningLimit: 1600,
  },
});
