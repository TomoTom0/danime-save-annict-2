import { test, expect } from './fixtures';

interface SiteCase {
    label: string;
    url: string;
    body: string;
    expectedTitleFragment: string;
    needsPlayedOverride?: boolean;
}

const SITES: SiteCase[] = [
    {
        label: 'danime',
        url: 'https://animestore.docomo.ne.jp/animestore/sc_d_pc?partId=1234510100',
        body: `<html><head><meta charset="utf-8"></head><body>
            <video id="video"></video>
            <span class="backInfoTxt1">テストアニメ</span>
            <span class="backInfoTxt2">第1話</span>
            <span class="backInfoTxt3">始まりの章</span>
        </body></html>`,
        expectedTitleFragment: 'テストアニメ',
    },
    {
        label: 'amazon',
        // obtainWatchingFromAmazon only proceeds past its `video.played.length
        // == 0` guard once real playback has started (see needsPlayedOverride
        // below), mirroring the real Amazon Prime Video listing-page behavior
        // this check exists to work around.
        url: 'https://www.amazon.co.jp/gp/video/detail/testasin',
        body: `<html><head><meta charset="utf-8"></head><body>
            <video width="100%"></video>
            <h1 data-automation-id="title">テストアニメ</h1>
            <script type="text/template">${JSON.stringify({
                props: {
                    state: {
                        features: { isElcano: true },
                        pageTitleId: 'WORK001',
                        self: { WORK001: { asins: ['ASIN001'] } },
                        detail: {
                            detail: { WORK001: { genres: [{ text: 'アニメ' }] } },
                            headerDetail: {},
                        },
                    },
                },
            })}</script>
            <h2 class="subtitle">シーズン1、エピソード1 1 第1話タイトル</h2>
        </body></html>`,
        expectedTitleFragment: 'テストアニメ',
        needsPlayedOverride: true,
    },
    {
        label: 'abema',
        url: 'https://abema.tv/video/episode/12-3_s1_p1',
        body: `<html><head><meta charset="utf-8"></head><body>
            <video preload="metadata"></video>
            <script type="application/ld+json">
            {"itemListElement": [
              {"name": "ホーム"}, {"name": "アニメ"},
              {"name": "テストアニメ"}, {"name": "1 はじまりの物語"}
            ]}
            </script>
        </body></html>`,
        expectedTitleFragment: 'テストアニメ',
    },
];

for (const site of SITES) {
    test.describe(site.label, () => {
        // Cheap regression guard for TASK-28: the content script's async IIFE
        // adds a notification dialog div as one of its first actions, so its
        // presence proves the script parsed and started executing (this is
        // what TASK-28's ESM bundling bug used to break with a syntax error).
        // This does NOT verify any scraping/matching logic — see the test
        // below for that.
        test(`content script parses and starts executing on ${site.label}`, async ({ context }) => {
            const page = await context.newPage();
            const errors: string[] = [];
            page.on('pageerror', e => errors.push(e.message));

            const origin = new URL(site.url).origin;
            await context.route(`${origin}/**`, route =>
                route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: site.body })
            );

            await page.goto(site.url, { waitUntil: 'load' });
            await expect(page.locator('.dsa-dialog')).toBeAttached();

            expect(errors).toEqual([]);
        });

        // Deeper integration check: seeds a fake Annict token into the
        // extension's real chrome.storage.sync (via the options page, same
        // as a user would), serves a fixture page shaped like the real site's
        // DOM (mirrors the unit test fixtures for obtainWatchingFrom*), and
        // intercepts the outgoing Annict search request to confirm the
        // content script actually scraped the title out of that DOM and
        // formatted it into the search query. No real site or Annict account
        // is contacted; both are stubbed via context.route().
        //
        // Not run for amazon: obtainWatchingFromAmazon only proceeds once
        // `video.played.length > 0` (see needsPlayedOverride above), and that
        // can't be faked from here. MV3 content scripts execute in an
        // "isolated world" with their own copy of built-in prototypes
        // (confirmed empirically: page.addInitScript() patching
        // HTMLMediaElement.prototype.played is visible to main-world
        // page.evaluate() calls but not to the content script's reads of the
        // same element), so overriding `played` from Playwright's main world
        // has no effect on what the content script sees. Making this pass for
        // real would need either a genuinely playing video (a valid encoded
        // media fixture) or driving the override through the isolated world
        // via a raw CDP Runtime.evaluate targeting its execution context —
        // both are more machinery than this test file currently carries.
        test(`content script extracts watching info and queries Annict on ${site.label}`, async ({ context, extensionId }) => {
            test.skip(site.needsPlayedOverride === true, 'requires simulating real video playback across the MV3 isolated-world boundary — see comment above');
            const setupPage = await context.newPage();
            await setupPage.goto(`chrome-extension://${extensionId}/html/options.html`, { waitUntil: 'load' });
            await setupPage.evaluate(
                () => new Promise<void>(resolve => {
                    chrome.storage.sync.set({ token: 'e2e-test-token', sendingTime: 2 }, () => resolve());
                })
            );
            await setupPage.close();

            const page = await context.newPage();

            let capturedQuery: string | null = null;
            let resolveRequestSeen: () => void;
            const requestSeen = new Promise<void>(resolve => { resolveRequestSeen = resolve; });

            // Route registration is itself async (round-trips over CDP), so
            // it must be awaited before navigating — otherwise `page.goto`
            // can race ahead of interception being armed and hang forever
            // waiting for a response that a not-yet-installed route was
            // supposed to provide.
            await context.route('https://api.annict.com/graphql**', route => {
                const reqUrl = new URL(route.request().url());
                capturedQuery = reqUrl.searchParams.get('query');
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: { searchWorks: { edges: [] } } }),
                });
                resolveRequestSeen();
            });

            const origin = new URL(site.url).origin;
            await context.route(`${origin}/**`, route =>
                route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: site.body })
            );

            await page.goto(site.url, { waitUntil: 'load' });
            await Promise.race([
                requestSeen,
                new Promise<void>((_, reject) =>
                    setTimeout(() => reject(new Error('Annict search request not observed within timeout')), 10000)
                ),
            ]);

            expect(capturedQuery).not.toBeNull();
            expect(capturedQuery).toContain(site.expectedTitleFragment);
        });
    });
}
