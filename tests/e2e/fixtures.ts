import { test as base, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

const EXT_PATH = path.resolve(__dirname, '../../dist');

async function resolveExtensionId(userDataDir: string): Promise<string> {
    for (let i = 0; i < 30; i++) {
        try {
            const prefs = JSON.parse(fs.readFileSync(path.join(userDataDir, 'Default', 'Preferences'), 'utf-8'));
            for (const [id, v] of Object.entries<{ path?: string }>(prefs.extensions?.settings || {})) {
                if (v.path === EXT_PATH) return id;
            }
        } catch {
            // Preferences not written yet; retry below.
        }
        await new Promise(r => setTimeout(r, 200));
    }
    throw new Error('Could not resolve extension id from Chrome profile Preferences within timeout');
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
        const context = await chromium.launchPersistentContext(userDataDir, {
            headless: true,
            args: [
                `--disable-extensions-except=${EXT_PATH}`,
                `--load-extension=${EXT_PATH}`,
                '--headless=new',
                '--no-sandbox',
            ],
        });
        (context as unknown as { __userDataDir: string }).__userDataDir = userDataDir;
        // Chrome needs a brief moment after launch to finish registering
        // the unpacked extension (content scripts / extension id) before
        // it is reliably available to a freshly opened page.
        await new Promise(r => setTimeout(r, 1500));
        await use(context);
        await context.close();
        fs.rmSync(userDataDir, { recursive: true, force: true });
    },

    extensionId: async ({ context }, use) => {
        const userDataDir = (context as unknown as { __userDataDir: string }).__userDataDir;
        const extensionId = await resolveExtensionId(userDataDir);
        await use(extensionId);
    },
});

export const expect = test.expect;
