import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './browser',
    testMatch: '**/*.spec.ts',
    fullyParallel: false,
    workers: 1,
    reporter: 'list',
    use: {
        headless: true,
    },
});
