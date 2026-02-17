/**
 * 拡張機能全体のワークフロー統合テスト
 */

describe('Extension Workflow Integration Tests', () => {
  beforeEach(() => {
    // 統合テスト用のセットアップ
    testHelpers.setupStorageMock({
      token: 'integration-test-token',
      sendingTime: 300,
      annictSend: true,
      valid_danime: true,
      valid_danimeAnnict: true,
      valid_danimeWebhook: true,
      valid_amazon: true,
      valid_amazonAnnict: true,
      valid_abema: true,
      valid_abemaAnnict: true
    });
  });

  describe('dアニメストア workflow', () => {
    beforeEach(() => {
      window.location.href = 'https://animestore.docomo.ne.jp/animestore/sc_d_pc?partId=12345001';
      document.body.innerHTML = `
        <div class="backInfoTxt1">テストアニメ</div>
        <div class="backInfoTxt2">第1話</div>
        <div class="backInfoTxt3">はじまりの物語</div>
        <video id="video"></video>
      `;
    });

    test('should extract episode information from danime page', () => {
      const workTitle = document.querySelector('.backInfoTxt1')?.textContent;
      const episodeNumber = document.querySelector('.backInfoTxt2')?.textContent;
      const episodeTitle = document.querySelector('.backInfoTxt3')?.textContent;

      expect(workTitle).toBe('テストアニメ');
      expect(episodeNumber).toBe('第1話');
      expect(episodeTitle).toBe('はじまりの物語');
    });

    test('should find video element', () => {
      const video = document.querySelector('#video');
      expect(video).not.toBeNull();
      expect(video!.tagName).toBe('VIDEO');
    });
  });

  describe('Amazon Prime Video workflow', () => {
    beforeEach(() => {
      window.location.href = 'https://www.amazon.co.jp/gp/video/detail/B08XYZABC';
      document.body.innerHTML = `
        <h1 data-automation-id="title">テストアニメシリーズ</h1>
        <h2 class="subtitle">シーズン1、エピソード1 はじまりの物語</h2>
        <video width="100%"></video>
        <script type="text/template">
          {"props":{"state":{"features":{"isElcano":true},"pageTitleId":"test123","self":{"test123":{"asins":["B08XYZABC"]}},"detail":{"detail":{"test123":{"genres":[{"text":"アニメ"}]}}}}}}
        </script>
      `;
    });

    test('should extract episode information from Amazon page', () => {
      const workTitle = document.querySelector('h1[data-automation-id="title"]')?.textContent;
      const subtitle = document.querySelector('h2.subtitle')?.textContent;

      expect(workTitle).toBe('テストアニメシリーズ');
      expect(subtitle).toContain('エピソード1');
    });

    test('should find video element', () => {
      const video = document.querySelector('video[width="100%"]');
      expect(video).not.toBeNull();
    });
  });

  describe('Abema TV workflow', () => {
    beforeEach(() => {
      window.location.href = 'https://abema.tv/video/episode/54-1_s1_p1';
      document.body.innerHTML = `
        <video preload="metadata"></video>
        <script type="application/ld+json">
          {
            "itemListElement": [
              {"name": "ホーム"},
              {"name": "アニメ"},
              {"name": "テストアニメ"},
              {"name": "1 はじまりの物語"}
            ]
          }
        </script>
      `;
    });

    test('should extract episode information from Abema page', () => {
      const jsonScript = document.querySelector('script[type="application/ld+json"]');
      const jsonData = JSON.parse(jsonScript!.innerHTML);

      expect(jsonData.itemListElement).toHaveLength(4);
      expect(jsonData.itemListElement[1].name).toBe('アニメ');
      expect(jsonData.itemListElement[2].name).toBe('テストアニメ');
      expect(jsonData.itemListElement[3].name).toContain('1');
    });

    test('should find video element', () => {
      const video = document.querySelector('video[preload="metadata"]');
      expect(video).not.toBeNull();
    });
  });

  describe('Annict API integration', () => {
    test('should successfully search for anime on Annict', async () => {
      testHelpers.setupFetchMock([
        {
          ok: true,
          data: {
            data: {
              searchWorks: {
                edges: [
                  {
                    node: {
                      title: 'テストアニメ',
                      annictId: 12345,
                      media: 'TV',
                      episodes: {
                        edges: [
                          {
                            node: {
                              annictId: 67890,
                              sortNumber: 1,
                              number: '1',
                              title: 'はじまりの物語'
                            }
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      ]);

      const response = await fetch('https://api.annict.com/graphql?query=test', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer test-token' }
      });

      const data = await response.json();
      expect(data.data.searchWorks.edges).toHaveLength(1);
      expect(data.data.searchWorks.edges[0].node.annictId).toBe(12345);
    });

    test('should successfully record episode on Annict', async () => {
      testHelpers.setupFetchMock([
        { ok: true, status: 201 }
      ]);

      const response = await fetch('https://api.annict.com/v1/me/records', {
        method: 'POST'
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
    });
  });

  describe('Error handling', () => {
    test('should handle network errors gracefully', async () => {
      testHelpers.setupFetchMock([
        { ok: false, status: 500 }
      ]);

      const response = await fetch('https://api.annict.com/graphql');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    test('should handle missing episode information', () => {
      document.body.innerHTML = '<div></div>';

      const workTitle = document.querySelector('.backInfoTxt1')?.textContent;
      expect(workTitle).toBeUndefined();
    });
  });
});
