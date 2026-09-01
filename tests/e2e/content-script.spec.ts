import { test, expect } from './fixtures';

const SITES = [
    {
        label: 'danime',
        url: 'https://animestore.docomo.ne.jp/animestore/sc_d_pc?partId=test123',
        body: '<html><body><video id="video"></video></body></html>',
    },
    {
        label: 'amazon',
        url: 'https://www.amazon.co.jp/gp/video/detail/testasin',
        body: '<html><body><video width="100%"></video></body></html>',
    },
    {
        label: 'abema',
        url: 'https://abema.tv/video/episode/12-3_s1_p1',
        body: `<html><body><video preload="metadata"></video>
            <script type="application/ld+json">
            {"itemListElement": [
              {"name": "ホーム"}, {"name": "アニメ"},
              {"name": "テストアニメ"}, {"name": "1 はじまりの物語"}
            ]}
            </script>
        </body></html>`,
    },
];

for (const site of SITES) {
    test(`content script injects without errors on ${site.label}`, async ({ context }) => {
        const page = await context.newPage();
        const errors: string[] = [];
        page.on('pageerror', e => errors.push(e.message));

        const origin = new URL(site.url).origin;
        await context.route(`${origin}/**`, route =>
            route.fulfill({ status: 200, contentType: 'text/html', body: site.body })
        );

        await page.goto(site.url, { waitUntil: 'load' });
        // The content script's async IIFE adds a notification dialog div
        // as one of its first actions; its presence proves the script
        // parsed and started executing (this is what TASK-28's ESM
        // bundling bug used to break with a syntax error).
        await expect(page.locator('.dsa-dialog')).toBeAttached();

        expect(errors).toEqual([]);
    });
}
