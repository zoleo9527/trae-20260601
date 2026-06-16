import { defineConfig } from 'vite';
import { svelte } from 'vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: './src/lib',
      $db: './src/db',
      $server: './src/server'
    }
  }
});
