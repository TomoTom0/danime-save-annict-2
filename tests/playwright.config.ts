import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './chrome-extension',
    testMatch: '**/*.spec.ts',
    fullyParallel: false,
    workers: 1,
    reporter: 'list',
    use: {
        headless: true,
    },
});
