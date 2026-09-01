import { test, expect } from './fixtures';

test.describe('Options page', () => {
    test('loads without console/page errors', async ({ context, extensionId }) => {
        const page = await context.newPage();
        const errors: string[] = [];
        page.on('pageerror', e => errors.push(e.message));

        await page.goto(`chrome-extension://${extensionId}/html/options.html`, { waitUntil: 'load' });

        expect(errors).toEqual([]);
        await expect(page.locator('#input_token')).toBeVisible();
    });

    test('saves the Annict token and restores it after reload', async ({ context, extensionId }) => {
        const page = await context.newPage();
        const errors: string[] = [];
        page.on('pageerror', e => errors.push(e.message));

        await page.goto(`chrome-extension://${extensionId}/html/options.html`, { waitUntil: 'load' });

        await page.fill('#input_token', 'e2e-test-token');
        await page.click('#btn_token');

        const stored = await page.evaluate(
            () => new Promise(resolve => chrome.storage.sync.get('token', resolve))
        );
        expect((stored as { token: string }).token).toBe('e2e-test-token');

        await page.reload({ waitUntil: 'load' });
        await expect(page.locator('#input_token')).toHaveValue('e2e-test-token');

        expect(errors).toEqual([]);
    });
});
