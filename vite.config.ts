import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base URL for GitHub Pages with custom domain
  base: '/',
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  
  server: {
    port: 3000,
    open: true,
  },
  
  // Handle shader files as raw text
  assetsInclude: ['**/*.vert', '**/*.frag'],
});



