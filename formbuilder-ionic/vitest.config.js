import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolveAliases } from './scripts/resolve-aliases.mjs';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: resolveAliases()
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
        setupFiles: ['./tests/jquery-setup.js'],
        restoreMocks: true
    }
});
