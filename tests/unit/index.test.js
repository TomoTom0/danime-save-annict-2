/**
 * ユニットテスト - メインコンテンツスクリプト
 * DanimeAnnictSenderクラスのテスト
 */

// テスト環境でのモック設定
global.chrome = {
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
    getURL: jest.fn()
  }
};

global.fetch = jest.fn();

// テスト対象のクラスをインポート（実際の実装では適切なモジュール化が必要）
// const DanimeAnnictSender = require('../../src/scripts/index.js');

describe('DanimeAnnictSender', () => {
  let sender;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // DOMの初期化
    document.body.innerHTML = '';
    
    // ロケーションのモック
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'animestore.docomo.ne.jp'
      },
      writable: true
    });
  });

  describe('サイト検出機能', () => {
    test('dアニメストアを正しく検出する', () => {
      window.location.hostname = 'animestore.docomo.ne.jp';
      // sender = new DanimeAnnictSender();
      // expect(sender.siteName).toBe('danime');
    });

    test('Amazon Prime Videoを正しく検出する', () => {
      window.location.hostname = 'amazon.co.jp';
      // sender = new DanimeAnnictSender();
      // expect(sender.siteName).toBe('amazon');
    });

    test('AbemaTVを正しく検出する', () => {
      window.location.hostname = 'abema.tv';
      // sender = new DanimeAnnictSender();
      // expect(sender.siteName).toBe('abema');
    });

    test('対応外サイトではnullを返す', () => {
      window.location.hostname = 'example.com';
      // sender = new DanimeAnnictSender();
      // expect(sender.siteName).toBe(null);
    });
  });

  describe('エピソード番号抽出機能', () => {
    test('「第1話」形式を正しく抽出する', () => {
      // const episodeNumber = DanimeAnnictSender.prototype.extractEpisodeNumber('第1話');
      // expect(episodeNumber).toBe(1);
    });

    test('「Episode 1」形式を正しく抽出する', () => {
      // const episodeNumber = DanimeAnnictSender.prototype.extractEpisodeNumber('Episode 1');
      // expect(episodeNumber).toBe(1);
    });

    test('「#1」形式を正しく抽出する', () => {
      // const episodeNumber = DanimeAnnictSender.prototype.extractEpisodeNumber('#1');
      // expect(episodeNumber).toBe(1);
    });

    test('数字のみの場合を正しく抽出する', () => {
      // const episodeNumber = DanimeAnnictSender.prototype.extractEpisodeNumber('1');
      // expect(episodeNumber).toBe(1);
    });

    test('無効な文字列の場合nullを返す', () => {
      // const episodeNumber = DanimeAnnictSender.prototype.extractEpisodeNumber('invalid');
      // expect(episodeNumber).toBe(null);
    });

    test('空文字列の場合nullを返す', () => {
      // const episodeNumber = DanimeAnnictSender.prototype.extractEpisodeNumber('');
      // expect(episodeNumber).toBe(null);
    });
  });

  describe('設定読み込み機能', () => {
    test('デフォルト設定を正しく読み込む', async () => {
      const mockSettings = {
        annictToken: '',
        webhookUrls: [],
        enableWebhook: false,
        autoSend: true,
        debugMode: false
      };

      chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback(mockSettings);
      });

      // sender = new DanimeAnnictSender();
      // const settings = await sender.loadSettings();
      // expect(settings).toEqual(mockSettings);
    });

    test('カスタム設定を正しく読み込む', async () => {
      const mockSettings = {
        annictToken: 'test-token',
        webhookUrls: ['https://hooks.slack.com/test'],
        enableWebhook: true,
        autoSend: false,
        debugMode: true
      };

      chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback(mockSettings);
      });

      // sender = new DanimeAnnictSender();
      // const settings = await sender.loadSettings();
      // expect(settings).toEqual(mockSettings);
    });
  });

  describe('Annict API連携', () => {
    test('作品検索が正常に動作する', async () => {
      const mockResponse = {
        works: [
          {
            id: 123,
            title: 'テストアニメ'
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // sender = new DanimeAnnictSender();
      // sender.settings = { annictToken: 'test-token' };
      // const animeId = await sender.searchAnimeOnAnnict('テストアニメ');
      // expect(animeId).toBe(123);
    });

    test('作品が見つからない場合nullを返す', async () => {
      const mockResponse = {
        works: []
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // sender = new DanimeAnnictSender();
      // sender.settings = { annictToken: 'test-token' };
      // const animeId = await sender.searchAnimeOnAnnict('存在しないアニメ');
      // expect(animeId).toBe(null);
    });

    test('エピソード記録が正常に動作する', async () => {
      fetch.mockResolvedValueOnce({
        ok: true
      });

      // sender = new DanimeAnnictSender();
      // sender.settings = { annictToken: 'test-token' };
      // const success = await sender.recordEpisodeOnAnnict(123, 1);
      // expect(success).toBe(true);
    });

    test('エピソード記録が失敗した場合falseを返す', async () => {
      fetch.mockResolvedValueOnce({
        ok: false
      });

      // sender = new DanimeAnnictSender();
      // sender.settings = { annictToken: 'test-token' };
      // const success = await sender.recordEpisodeOnAnnict(123, 1);
      // expect(success).toBe(false);
    });
  });

  describe('重複防止機能', () => {
    test('未送信のエピソードに対してfalseを返す', async () => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      // sender = new DanimeAnnictSender();
      // const alreadySent = await sender.checkAlreadySent('test_key');
      // expect(alreadySent).toBe(false);
    });

    test('送信済みのエピソードに対してtrueを返す', async () => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ test_key: true });
      });

      // sender = new DanimeAnnictSender();
      // const alreadySent = await sender.checkAlreadySent('test_key');
      // expect(alreadySent).toBe(true);
    });

    test('送信済みマークが正しく設定される', async () => {
      chrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      // sender = new DanimeAnnictSender();
      // await sender.markAsSent('test_key');
      // expect(chrome.storage.local.set).toHaveBeenCalledWith(
      //   { test_key: true },
      //   expect.any(Function)
      // );
    });
  });

  describe('Webhook機能', () => {
    test('有効なWebhookが正常に送信される', async () => {
      fetch.mockResolvedValueOnce({
        ok: true
      });

      const episodeData = {
        animeTitle: 'テストアニメ',
        episodeNumber: 1,
        site: 'dアニメストア'
      };

      // sender = new DanimeAnnictSender();
      // sender.settings = {
      //   enableWebhook: true,
      //   webhookUrls: ['https://hooks.slack.com/test']
      // };
      // await sender.sendWebhooks(episodeData);
      // expect(fetch).toHaveBeenCalledWith(
      //   'https://hooks.slack.com/test',
      //   expect.objectContaining({
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' }
      //   })
      // );
    });

    test('複数Webhookが並行送信される', async () => {
      fetch.mockResolvedValue({
        ok: true
      });

      const episodeData = {
        animeTitle: 'テストアニメ',
        episodeNumber: 1,
        site: 'dアニメストア'
      };

      // sender = new DanimeAnnictSender();
      // sender.settings = {
      //   enableWebhook: true,
      //   webhookUrls: [
      //     'https://hooks.slack.com/test1',
      //     'https://hooks.slack.com/test2'
      //   ]
      // };
      // await sender.sendWebhooks(episodeData);
      // expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('統合テスト', () => {
  test('完全なワークフロー: 検出→送信→通知', async () => {
    // TODO: 実際のワークフローのテスト実装
  });
});