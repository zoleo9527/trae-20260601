import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            shared: path.resolve(__dirname, '../shared/src/index.ts'),
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:4001',
                changeOrigin: true,
            },
        },
    },
});
