import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Keep the rendering library cacheable independently of game updates.
        manualChunks(id) {
          if (id.includes('/node_modules/three/examples/')) return 'three-effects';
          if (id.endsWith('/three/build/three.core.js')) return 'three-core';
          if (id.includes('/node_modules/three/')) return 'three-renderer';
        },
      },
    },
  },
});
