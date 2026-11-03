import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Keep the rendering library cacheable independently of game updates.
        manualChunks: { three: ['three'] },
      },
    },
  },
});
