import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { version as appVersion } from './package.json'

const versionManifestPlugin: Plugin = {
  name: 'finly-version-manifest',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'app-version.json',
      source: `${JSON.stringify({ version: appVersion })}\n`,
    })
  },
}

export default defineConfig({
  plugins: [react(), versionManifestPlugin],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
