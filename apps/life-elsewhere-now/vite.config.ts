import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const shim = (name: string) => fileURLToPath(new URL(`./src/vendor/${name}.ts`, import.meta.url));

export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app'],
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app'],
  },
  plugins: [react()],
  base: './',
  publicDir: 'content',
  resolve: {
    alias: {
      // @eazo/sdk 0.22.8 的 decrypt.js 引用 node:crypto / node:buffer，该路径仅服务端使用。
      // 在浏览器构建中替换为惰性 shim，消除 Vite 的 crypto/buffer 外部化警告。
      crypto: shim('node-crypto-shim'),
      'node:crypto': shim('node-crypto-shim'),
      buffer: shim('node-buffer-shim'),
      'node:buffer': shim('node-buffer-shim'),
    },
  },
  build: { sourcemap: true, assetsInlineLimit: 4096, chunkSizeWarningLimit: 1200 },
});
