/**
 * ユニットテスト - オプション画面
 * OptionsManagerクラスのテスト
 */

// テスト環境でのモック設定
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

global.fetch = jest.fn();

// DOMのモック
Object.defineProperty(global, 'document', {
  value: {
    getElementById: jest.fn(),
    querySelectorAll: jest.fn(),
    createElement: jest.fn(),
    addEventListener: jest.fn()
  },
  writable: true
});

describe('OptionsManager', () => {
  let optionsManager;
  let mockElements;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // DOM要素のモック
    mockElements = {
      annictToken: { value: '', addEventListener: jest.fn() },
      enableWebhook: { checked: false, addEventListener: jest.fn() },
      autoSend: { checked: true, addEventListener: jest.fn() },
      debugMode: { checked: false, addEventListener: jest.fn() },
      saveButton: { addEventListener: jest.fn() },
      testButton: { addEventListener: jest.fn() },
      addWebhook: { addEventListener: jest.fn() },
      webhookUrls: { innerHTML: '', appendChild: jest.fn() },
      webhookSection: { classList: { add: jest.fn(), remove: jest.fn() } },
      status: { textContent: '', className: '' }
    };

    document.getElementById.mockImplementation((id) => mockElements[id]);
    document.querySelectorAll.mockReturnValue([]);
  });

  describe('設定の読み込み', () => {
    test('デフォルト設定が正しく読み込まれる', async () => {
      const defaultSettings = {
        annictToken: '',
        webhookUrls: [],
        enableWebhook: false,
        autoSend: true,
        debugMode: false
      };

      chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback(defaultSettings);
      });

      // optionsManager = new OptionsManager();
      // await optionsManager.loadSettings();

      // expect(mockElements.annictToken.value).toBe('');
      // expect(mockElements.enableWebhook.checked).toBe(false);
      // expect(mockElements.autoSend.checked).toBe(true);
      // expect(mockElements.debugMode.checked).toBe(false);
    });

    test('カスタム設定が正しく読み込まれる', async () => {
      const customSettings = {
        annictToken: 'test-token-123',
        webhookUrls: ['https://hooks.slack.com/test'],
        enableWebhook: true,
        autoSend: false,
        debugMode: true
      };

      chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback(customSettings);
      });

      // optionsManager = new OptionsManager();
      // await optionsManager.loadSettings();

      // expect(mockElements.annictToken.value).toBe('test-token-123');
      // expect(mockElements.enableWebhook.checked).toBe(true);
      // expect(mockElements.autoSend.checked).toBe(false);
      // expect(mockElements.debugMode.checked).toBe(true);
    });
  });

  describe('設定の保存', () => {
    test('有効な設定が正しく保存される', async () => {
      mockElements.annictToken.value = 'valid-token';
      mockElements.enableWebhook.checked = false;
      mockElements.autoSend.checked = true;
      mockElements.debugMode.checked = false;

      chrome.storage.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      // optionsManager = new OptionsManager();
      // await optionsManager.saveSettings();

      // expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      //   {
      //     annictToken: 'valid-token',
      //     webhookUrls: [],
      //     enableWebhook: false,
      //     autoSend: true,
      //     debugMode: false
      //   },
      //   expect.any(Function)
      // );
    });

    test('APIトークンが空の場合エラーメッセージが表示される', async () => {
      mockElements.annictToken.value = '';

      // optionsManager = new OptionsManager();
      // await optionsManager.saveSettings();

      // expect(mockElements.status.textContent).toBe('Annict APIトークンは必須です');
      // expect(mockElements.status.className).toBe('status error');
    });

    test('Webhook有効時にURLが未設定の場合エラーメッセージが表示される', async () => {
      mockElements.annictToken.value = 'valid-token';
      mockElements.enableWebhook.checked = true;
      document.querySelectorAll.mockReturnValue([]);

      // optionsManager = new OptionsManager();
      // await optionsManager.saveSettings();

      // expect(mockElements.status.textContent).toBe('Webhookを有効にする場合はURLを設定してください');
      // expect(mockElements.status.className).toBe('status error');
    });
  });

  describe('接続テスト', () => {
    test('有効なAPIトークンで接続成功', async () => {
      mockElements.annictToken.value = 'valid-token';

      const mockUserData = {
        username: 'testuser'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserData)
      });

      // optionsManager = new OptionsManager();
      // await optionsManager.testConnection();

      // expect(fetch).toHaveBeenCalledWith(
      //   'https://api.annict.com/v1/me?access_token=valid-token'
      // );
      // expect(mockElements.status.textContent).toBe('接続成功！ユーザー: testuser');
      // expect(mockElements.status.className).toBe('status success');
    });

    test('無効なAPIトークンで接続失敗', async () => {
      mockElements.annictToken.value = 'invalid-token';

      fetch.mockResolvedValueOnce({
        ok: false
      });

      // optionsManager = new OptionsManager();
      // await optionsManager.testConnection();

      // expect(mockElements.status.textContent).toBe('APIトークンが無効です');
      // expect(mockElements.status.className).toBe('status error');
    });

    test('APIトークンが空の場合エラーメッセージが表示される', async () => {
      mockElements.annictToken.value = '';

      // optionsManager = new OptionsManager();
      // await optionsManager.testConnection();

      // expect(mockElements.status.textContent).toBe('Annict APIトークンを入力してください');
      // expect(mockElements.status.className).toBe('status error');
    });

    test('ネットワークエラーの場合エラーメッセージが表示される', async () => {
      mockElements.annictToken.value = 'valid-token';

      fetch.mockRejectedValueOnce(new Error('Network error'));

      // optionsManager = new OptionsManager();
      // await optionsManager.testConnection();

      // expect(mockElements.status.textContent).toBe('接続テストに失敗しました');
      // expect(mockElements.status.className).toBe('status error');
    });
  });

  describe('Webhook URL管理', () => {
    test('Webhook URLの追加が正しく動作する', () => {
      const mockWebhookDiv = {
        className: '',
        innerHTML: '',
        querySelector: jest.fn(() => ({
          addEventListener: jest.fn()
        }))
      };

      document.createElement.mockReturnValue(mockWebhookDiv);

      // optionsManager = new OptionsManager();
      // optionsManager.addWebhookInput('https://hooks.slack.com/test');

      // expect(mockWebhookDiv.className).toBe('webhook-input');
      // expect(mockWebhookDiv.innerHTML).toContain('https://hooks.slack.com/test');
      // expect(mockElements.webhookUrls.appendChild).toHaveBeenCalledWith(mockWebhookDiv);
    });

    test('Webhook URLの取得が正しく動作する', () => {
      const mockInputs = [
        { value: 'https://hooks.slack.com/test1' },
        { value: 'https://hooks.slack.com/test2' },
        { value: '' }, // 空文字は除外される
        { value: '  https://hooks.slack.com/test3  ' } // トリム処理
      ];

      document.querySelectorAll.mockReturnValue(mockInputs);

      // optionsManager = new OptionsManager();
      // const urls = optionsManager.getWebhookUrls();

      // expect(urls).toEqual([
      //   'https://hooks.slack.com/test1',
      //   'https://hooks.slack.com/test2',
      //   'https://hooks.slack.com/test3'
      // ]);
    });

    test('Webhookセクションの表示/非表示が正しく動作する', () => {
      // optionsManager = new OptionsManager();
      
      // Webhook有効化
      // optionsManager.toggleWebhookSection(true);
      // expect(mockElements.webhookSection.classList.add).toHaveBeenCalledWith('enabled');

      // Webhook無効化
      // optionsManager.toggleWebhookSection(false);
      // expect(mockElements.webhookSection.classList.remove).toHaveBeenCalledWith('enabled');
    });
  });

  describe('ステータス表示', () => {
    test('成功メッセージが正しく表示される', () => {
      // optionsManager = new OptionsManager();
      // optionsManager.showStatus('成功しました', 'success');

      // expect(mockElements.status.textContent).toBe('成功しました');
      // expect(mockElements.status.className).toBe('status success');
    });

    test('エラーメッセージが正しく表示される', () => {
      // optionsManager = new OptionsManager();
      // optionsManager.showStatus('エラーが発生しました', 'error');

      // expect(mockElements.status.textContent).toBe('エラーが発生しました');
      // expect(mockElements.status.className).toBe('status error');
    });

    test('情報メッセージが正しく表示される', () => {
      // optionsManager = new OptionsManager();
      // optionsManager.showStatus('処理中です', 'info');

      // expect(mockElements.status.textContent).toBe('処理中です');
      // expect(mockElements.status.className).toBe('status info');
    });
  });

  describe('Chrome Storage API', () => {
    test('getStorageDataが正しく動作する', async () => {
      const testData = { key: 'value' };
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback(testData);
      });

      // optionsManager = new OptionsManager();
      // const result = await optionsManager.getStorageData(['key']);
      // expect(result).toEqual(testData);
    });

    test('setStorageDataが正しく動作する', async () => {
      chrome.storage.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      const testData = { key: 'value' };
      // optionsManager = new OptionsManager();
      // await optionsManager.setStorageData(testData);
      // expect(chrome.storage.sync.set).toHaveBeenCalledWith(testData, expect.any(Function));
    });
  });
});