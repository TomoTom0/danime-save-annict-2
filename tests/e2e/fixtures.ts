import { test as base, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

const EXT_PATH = path.resolve(__dirname, '../../dist');

// Reading the extension id back out of the profile's `Preferences` file is
// unreliable: Chrome does not flush that file to disk promptly (observed to
// never appear within several seconds in this environment), even though the
// extension itself is already loaded and content scripts are running.
// Scraping the id out of chrome://extensions' shadow DOM is what Playwright
// itself does in its extension-testing examples, and resolves immediately.
async function resolveExtensionId(context: BrowserContext): Promise<string> {
    const page = await context.newPage();
    try {
        await page.goto('chrome://extensions');
        const extensionId = await page.evaluate(() => {
            const manager = document.querySelector('extensions-manager');
            const list = manager?.shadowRoot?.querySelector('extensions-item-list');
            const item = list?.shadowRoot?.querySelector('extensions-item');
            return item?.getAttribute('id') ?? null;
        });
        if (!extensionId) throw new Error('Could not resolve extension id via chrome://extensions');
        return extensionId;
    } finally {
        await page.close();
    }
}

export const test = base.extend<{
    context: BrowserContext;
    extensionId: string;
}>({
    // eslint-disable-next-line no-empty-pattern
    context: async ({}, use) => {
        if (!fs.existsSync(EXT_PATH)) {
            throw new Error(`dist/ not found at ${EXT_PATH}. Run "npm run build" in the project root before running e2e tests.`);
        }
        const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'danime-save-annict-e2e-'));
        // Chrome does not support loading unpacked extensions in headless
        // mode (--headless=new silently ignores --load-extension), so this
        // must run headful. Locally/CI without a display, wrap the test
        // command with `xvfb-run -a` to provide a virtual X server.
        const context = await chromium.launchPersistentContext(userDataDir, {
            headless: false,
            args: [
                `--disable-extensions-except=${EXT_PATH}`,
                `--load-extension=${EXT_PATH}`,
                '--no-sandbox',
            ],
        });
        // Chrome needs a brief moment after launch to finish registering
        // the unpacked extension (content scripts / extension id) before
        // it is reliably available to a freshly opened page.
        await new Promise(r => setTimeout(r, 1500));
        await use(context);
        await context.close();
        fs.rmSync(userDataDir, { recursive: true, force: true });
    },

    extensionId: async ({ context }, use) => {
        const extensionId = await resolveExtensionId(context);
        await use(extensionId);
    },
});

export const expect = test.expect;
