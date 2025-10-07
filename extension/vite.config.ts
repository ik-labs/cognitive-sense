import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        sw: resolve(__dirname, 'src/sw.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        panel: resolve(__dirname, 'panel.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: '[name].[ext]',
        format: 'es' // Use ES modules
      }
    },
    target: 'es2020',
    minify: false // For development debugging
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
