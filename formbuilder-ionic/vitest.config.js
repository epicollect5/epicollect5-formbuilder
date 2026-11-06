import { defineConfig } from 'vitest/config';
import { resolveAliases } from './scripts/resolve-aliases.mjs';

export default defineConfig({
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
        restoreMocks: true
    }
});
