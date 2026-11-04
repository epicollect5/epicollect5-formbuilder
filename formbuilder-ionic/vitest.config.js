import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    test: {
        environment: 'jsdom',
        environmentOptions: {
            jsdom: {
                // same window as the legacy mocha setup (js/test/setup-node.js)
                url: 'http://localhost/',
                pretendToBeVisual: true
            }
        },
        include: ['tests/**/*.test.js'],
        restoreMocks: true
    }
});
