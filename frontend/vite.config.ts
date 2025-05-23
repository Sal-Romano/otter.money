import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  esbuild: {
    // Use esbuild for faster builds
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild', // esbuild is faster than terser
    rollupOptions: {
      output: {
        // Temporarily disable manual chunking to fix initialization error
        // manualChunks: (id) => {
        //   // Split large dependencies into separate chunks
        //   if (id.includes('node_modules')) {
        //     if (id.includes('@chakra-ui')) {
        //       return 'chakra-ui';
        //     }
        //     if (id.includes('react') || id.includes('react-dom')) {
        //       return 'react-vendor';
        //     }
        //     if (id.includes('@supabase')) {
        //       return 'supabase';
        //     }
        //     if (id.includes('recharts')) {
        //       return 'recharts';
        //     }
        //     return 'vendor';
        //   }
        // },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      // Reduce memory usage during bundling
      maxParallelFileOps: 2,
    },
    // Reduce memory usage
    chunkSizeWarningLimit: 1000,
  },
  base: '/',
})
