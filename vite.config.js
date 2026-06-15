import { sveltekit } from '@sveltejs/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      '$lib': '/src/lib'
    }
  }
});
