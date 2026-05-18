import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        /**
         * Split the heaviest vendor libraries into their own named chunks.
         * Named chunks get long-term browser cache hits: a new deploy that
         * touches only app code leaves these chunks unchanged, so users do
         * not re-download them.
         *
         * CKEditor / FullCalendar / ag-grid are only ever imported by
         * lazy-loaded routes/modals, so these chunks are NOT part of the
         * initial page load — they are fetched on demand.
         */
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-editor': ['ckeditor5', '@ckeditor/ckeditor5-react'],
          'vendor-calendar': [
            '@fullcalendar/react',
            '@fullcalendar/core',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            '@fullcalendar/interaction',
            '@fullcalendar/rrule',
            '@fullcalendar/bootstrap5',
            'rrule',
          ],
          'vendor-grid': ['ag-grid-react'],
          'vendor-socket': ['socket.io-client'],
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
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
