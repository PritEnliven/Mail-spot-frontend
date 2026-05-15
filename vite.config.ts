import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  visualizer({
    filename: 'dist/stats.html',
    open: true,                
    gzipSize: true,            
    brotliSize: true            
  })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // https: {
    //   key: './certs/server.key',
    //   cert: './certs/server.cert'
    // }
  },
  resolve: {
    alias: {
      '@routes': path.resolve(__dirname, 'src/routes'),
      '@images': path.resolve(__dirname, 'src/assets/images'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@styles': path.resolve(__dirname, 'src/assets/styles'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@models': path.resolve(__dirname, 'src/models'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
    },
  }
})
