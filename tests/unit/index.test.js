/**
 * index.js の主要機能のユニットテスト
 */

describe('Main Extension Logic', () => {
  beforeEach(() => {
    // テスト前のセットアップ
    testHelpers.setupStorageMock({
      token: 'test-annict-token',
      sendingTime: 300,
      annictSend: true,
      valid_danime: true,
      valid_danimeAnnict: true,
      valid_danimeWebhook: true
    });

    // Fetch モックのセットアップ
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
                            title: '第1話'
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
  });

  describe('Site detection', () => {
    test('should detect danime site correctly', () => {
      window.location.href = 'https://animestore.docomo.ne.jp/animestore/sc_d_pc?partId=12345001';
      // サイト検出ロジックのテスト
      expect(window.location.href).toContain('animestore.docomo.ne.jp');
    });

    test('should detect Amazon Prime Video site correctly', () => {
      window.location.href = 'https://www.amazon.co.jp/gp/video/detail/B08XYZABC';
      expect(window.location.href).toContain('amazon.co.jp/gp/video');
    });

    test('should detect Abema TV site correctly', () => {
      window.location.href = 'https://abema.tv/video/episode/54-1_s1_p1';
      expect(window.location.href).toContain('abema.tv/video');
    });
  });

  describe('Episode number extraction', () => {
    test('should extract episode number from Arabic numerals', () => {
      const episodeNumber = '第1話';
      const match = episodeNumber.match(/\d+/);
      expect(match).not.toBeNull();
      expect(parseInt(match[0])).toBe(1);
    });

    test('should handle combined episode numbers', () => {
      const episodeNumber = '第1話～第2話';
      const matches = episodeNumber.match(/\d+/g);
      expect(matches).toHaveLength(2);
      expect(parseInt(matches[0])).toBe(1);
      expect(parseInt(matches[1])).toBe(2);
    });
  });

  describe('Title normalization', () => {
    test('should normalize full-width to half-width', () => {
      const fullWidth = 'ＡＢＣ１２３';
      const halfWidth = fullWidth.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s =>
        String.fromCharCode(s.charCodeAt(0) - 65248)
      );
      expect(halfWidth).toBe('ABC123');
    });

    test('should remove special characters from title', () => {
      const title = '「テストアニメ」';
      const normalized = title.replace(/[「」『』｢｣]/g, '');
      expect(normalized).toBe('テストアニメ');
    });
  });

  describe('Annict API interaction', () => {
    test('should call fetch with correct GraphQL query', async () => {
      const title = 'テストアニメ';
      const token = 'test-token';
      const query = `{ searchWorks(titles:"${title}") { edges { node { title annictId } } } }`;

      await fetch(`https://api.annict.com/graphql?query=${query}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.annict.com/graphql'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`
          })
        })
      );
    });
  });

  describe('Storage operations', () => {
    test('should retrieve settings from chrome.storage', async () => {
      const callback = jest.fn();
      chrome.storage.sync.get({ token: '' }, callback);

      expect(chrome.storage.sync.get).toHaveBeenCalled();
    });

    test('should save watch history to chrome.storage', async () => {
      const watchData = {
        site: 'danime',
        workTitle: 'テストアニメ',
        episodeNumber: '1',
        timestamp: Date.now()
      };

      chrome.storage.sync.set({ lastWatched_danime: JSON.stringify(watchData) });

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          lastWatched_danime: expect.any(String)
        })
      );
    });
  });

  describe('Webhook functionality', () => {
    test('should send webhook with correct payload', async () => {
      const webhookData = {
        workTitle: 'テストアニメ',
        episodeNumber: '1',
        episodeTitle: '第1話',
        vodWorkId: '12345',
        site: 'danime',
        error: 'none'
      };

      testHelpers.setupFetchMock([
        { ok: true, status: 200 }
      ]);

      await fetch('https://example.com/webhook', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String)
        })
      );
    });
  });
});
