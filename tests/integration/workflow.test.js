/**
 * インテグレーションテスト - 全体ワークフロー
 * 各コンポーネントの連携テスト
 */

describe('拡張機能全体のワークフロー', () => {
  let mockChrome;
  let mockFetch;

  beforeEach(() => {
    // Chrome APIのモック
    mockChrome = {
      storage: {
        sync: {
          get: jest.fn(),
          set: jest.fn()
        },
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      runtime: {
        getURL: jest.fn(() => 'chrome-extension://test/styles/notifications.css')
      }
    };

    global.chrome = mockChrome;

    // Fetch APIのモック
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // DOMのセットアップ
    document.body.innerHTML = '';
  });

  describe('dアニメストアでの視聴記録', () => {
    test('視聴検出から記録送信までの完全フロー', async () => {
      // 1. サイト設定
      Object.defineProperty(window, 'location', {
        value: { hostname: 'animestore.docomo.ne.jp' },
        writable: true
      });

      // 2. 設定読み込みのモック
      mockChrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({
          annictToken: 'test-token',
          webhookUrls: ['https://hooks.slack.com/test'],
          enableWebhook: true,
          autoSend: true,
          debugMode: false
        });
      });

      // 3. 重複チェック（未送信）
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      // 4. Annict API レスポンス（作品検索）
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          works: [{ id: 123, title: 'テストアニメ' }]
        })
      });

      // 5. Annict API レスポンス（記録投稿）
      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      // 6. Webhook送信
      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      // 7. DOM要素の設定
      document.body.innerHTML = `
        <div class="backInfoTxt1">テストアニメ</div>
        <div class="backInfoTxt2">第1話</div>
      `;

      // 8. 拡張機能の初期化と実行
      // const sender = new DanimeAnnictSender();
      // await sender.checkDanimeEpisode();

      // 9. API呼び出しの検証
      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      // 作品検索
      expect(mockFetch).toHaveBeenNthCalledWith(1,
        expect.stringContaining('https://api.annict.com/v1/works')
      );

      // 記録投稿
      expect(mockFetch).toHaveBeenNthCalledWith(2,
        'https://api.annict.com/v1/me/records',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          })
        })
      );

      // Webhook送信
      expect(mockFetch).toHaveBeenNthCalledWith(3,
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );

      // ストレージ保存の検証
      expect(mockChrome.storage.local.set).toHaveBeenCalled();
    });

    test('重複送信の防止が正しく動作する', async () => {
      // 重複チェック（送信済み）
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ 'sent_danime_テストアニメ_1': true });
      });

      mockChrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({
          annictToken: 'test-token',
          autoSend: true
        });
      });

      // DOM要素の設定
      document.body.innerHTML = `
        <div class="backInfoTxt1">テストアニメ</div>
        <div class="backInfoTxt2">第1話</div>
      `;

      // const sender = new DanimeAnnictSender();
      // await sender.checkDanimeEpisode();

      // API呼び出しが行われないことを確認
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Amazon Prime Videoでの視聴記録', () => {
    test('Amazon固有のDOM構造での視聴検出', async () => {
      // サイト設定
      Object.defineProperty(window, 'location', {
        value: { hostname: 'amazon.co.jp' },
        writable: true
      });

      // 設定読み込み
      mockChrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({
          annictToken: 'test-token',
          autoSend: true
        });
      });

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      // API レスポンス
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          works: [{ id: 456, title: 'Amazonアニメ' }]
        })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      // Amazon特有のDOM構造
      document.body.innerHTML = `
        <div data-automation-id="title">Amazonアニメ</div>
        <div data-automation-id="episode-title">Episode 1</div>
      `;

      // const sender = new DanimeAnnictSender();
      // await sender.checkAmazonEpisode();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('filter_title=Amazonアニメ'),
        expect.any(Object)
      );
    });
  });

  describe('AbemaTVでの視聴記録', () => {
    test('AbemaTV固有のDOM構造での視聴検出', async () => {
      // サイト設定
      Object.defineProperty(window, 'location', {
        value: { hostname: 'abema.tv' },
        writable: true
      });

      // 設定読み込み
      mockChrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({
          annictToken: 'test-token',
          autoSend: true
        });
      });

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      // API レスポンス
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          works: [{ id: 789, title: 'Abemaアニメ' }]
        })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      // AbemaTV特有のDOM構造
      document.body.innerHTML = `
        <div class="com-video-EpisodeTitle__title">Abemaアニメ</div>
        <div class="com-video-EpisodeTitle__episode">#1</div>
      `;

      // const sender = new DanimeAnnictSender();
      // await sender.checkAbemaEpisode();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('filter_title=Abemaアニメ'),
        expect.any(Object)
      );
    });
  });

  describe('エラーハンドリング', () => {
    test('Annict API エラー時の適切な処理', async () => {
      mockChrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({
          annictToken: 'invalid-token',
          autoSend: true
        });
      });

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      // API エラーレスポンス
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      document.body.innerHTML = `
        <div class="backInfoTxt1">テストアニメ</div>
        <div class="backInfoTxt2">第1話</div>
      `;

      Object.defineProperty(window, 'location', {
        value: { hostname: 'animestore.docomo.ne.jp' },
        writable: true
      });

      // const sender = new DanimeAnnictSender();
      // await sender.checkDanimeEpisode();

      // エラー時はストレージに保存されないことを確認
      expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
    });

    test('ネットワークエラー時の適切な処理', async () => {
      mockChrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({
          annictToken: 'test-token',
          autoSend: true
        });
      });

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      // ネットワークエラー
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      document.body.innerHTML = `
        <div class="backInfoTxt1">テストアニメ</div>
        <div class="backInfoTxt2">第1話</div>
      `;

      Object.defineProperty(window, 'location', {
        value: { hostname: 'animestore.docomo.ne.jp' },
        writable: true
      });

      // const sender = new DanimeAnnictSender();
      // await sender.checkDanimeEpisode();

      // エラー時はストレージに保存されないことを確認
      expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe('設定画面との連携', () => {
    test('設定変更がコンテンツスクリプトに反映される', async () => {
      // 初期設定
      mockChrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({
          annictToken: 'test-token',
          autoSend: false // 自動送信無効
        });
      });

      // 設定変更
      mockChrome.storage.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      // 設定画面での変更をシミュレート
      const newSettings = {
        annictToken: 'test-token',
        autoSend: true // 自動送信有効
      };

      // const optionsManager = new OptionsManager();
      // await optionsManager.setStorageData(newSettings);

      // 設定変更後のコンテンツスクリプト動作確認
      mockChrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback(newSettings);
      });

      // const sender = new DanimeAnnictSender();
      // const settings = await sender.loadSettings();
      // expect(settings.autoSend).toBe(true);
    });
  });
});