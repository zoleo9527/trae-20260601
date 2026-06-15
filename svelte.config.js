import { vitePreprocess } from '@sveltejs/kit/vite';
import { defineConfig } from 'svelte';

export default defineConfig({
  preprocess: vitePreprocess()
});
