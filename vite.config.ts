import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const frontendDir = path.resolve(import.meta.dirname, 'artifacts/estoque-facil');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(frontendDir, 'src'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
      '@workspace/api-client-react': path.resolve(
        frontendDir,
        'src/lib/api-client.ts',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: frontendDir,
  envDir: import.meta.dirname,
  build: {
    outDir: path.resolve(frontendDir, 'dist'),
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
