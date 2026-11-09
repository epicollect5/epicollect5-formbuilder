import { defineConfig } from 'vitest/config';
import { resolveAliases } from './scripts/resolve-aliases.mjs';

/*
 * Dedicated config for the legacy-project load audit. It uses the same jsdom
 * and jQuery setup as the normal suite, but only collects the audit file and
 * disables the test timeout: the export has 214k projects and the audit
 * writes progress instead of finishing inside the normal five-second budget.
 */
export default defineConfig({
    resolve: {
        alias: resolveAliases()
    },
    test: {
        environment: 'jsdom',
        environmentOptions: {
            jsdom: {
                url: 'http://localhost/',
                pretendToBeVisual: true
            }
        },
        include: ['scripts/audit-legacy-projects.test.js'],
        setupFiles: ['./tests/jquery-setup.js'],
        restoreMocks: true,
        testTimeout: 86400000,
        hookTimeout: 86400000,
        fileParallelism: false,
        maxWorkers: 1
    }
});
