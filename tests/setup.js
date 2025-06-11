/**
 * Jestテストセットアップファイル
 * 全テストで共通して使用するモックや設定
 */

// Chrome APIのグローバルモック
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
    getURL: jest.fn(() => 'chrome-extension://test/'),
    onMessage: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

// Fetch APIのグローバルモック
global.fetch = jest.fn();

// MutationObserverのモック
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {
    // モック実装
  }
  
  disconnect() {
    // モック実装
  }
};

// DOMメソッドのモック強化
Object.defineProperty(document, 'querySelector', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(document, 'querySelectorAll', {
  value: jest.fn(() => []),
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    appendChild: jest.fn(),
    setAttribute: jest.fn(),
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn()
    },
    addEventListener: jest.fn()
  })),
  writable: true
});

Object.defineProperty(document, 'head', {
  value: {
    appendChild: jest.fn()
  },
  writable: true
});

Object.defineProperty(document, 'body', {
  value: {
    appendChild: jest.fn(),
    innerHTML: ''
  },
  writable: true
});

// Locationオブジェクトのモック
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    href: 'http://localhost'
  },
  writable: true
});

// コンソールのスパイ設定（テスト出力をクリーンにする）
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// 各テスト後のクリーンアップ
afterEach(() => {
  jest.clearAllMocks();
  
  // DOMのリセット
  if (document.body) {
    document.body.innerHTML = '';
  }
  
  // Fetchモックのリセット
  fetch.mockClear();
});

// テスト用ヘルパー関数
global.testHelpers = {
  // Chrome storage モックの簡易セットアップ
  setupStorageMock: (syncData = {}, localData = {}) => {
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback(syncData);
    });
    
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback(localData);
    });
  },
  
  // Fetch API モックの簡易セットアップ
  setupFetchMock: (responses = []) => {
    responses.forEach((response, index) => {
      fetch.mockResolvedValueOnce({
        ok: response.ok !== false,
        status: response.status || 200,
        json: () => Promise.resolve(response.data || {}),
        text: () => Promise.resolve(response.text || '')
      });
    });
  },
  
  // DOM要素の作成ヘルパー
  createMockElement: (tag, attributes = {}, textContent = '') => {
    const element = {
      tagName: tag.toUpperCase(),
      textContent,
      innerHTML: textContent,
      value: attributes.value || '',
      checked: attributes.checked || false,
      className: attributes.className || '',
      id: attributes.id || '',
      style: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(),
        toggle: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getAttribute: jest.fn(attr => attributes[attr]),
      setAttribute: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      parentNode: null
    };
    
    // 特定の属性を設定
    Object.keys(attributes).forEach(key => {
      element[key] = attributes[key];
    });
    
    return element;
  },
  
  // DanimeAnnictSender のモック設定
  createSenderMock: (siteName = 'danime') => {
    return {
      siteName,
      settings: {
        annictToken: 'test-token',
        webhookUrls: [],
        enableWebhook: false,
        autoSend: true,
        debugMode: false
      },
      isDebug: false,
      init: jest.fn(),
      loadSettings: jest.fn(),
      detectSite: jest.fn(() => siteName),
      setupSiteSpecificObserver: jest.fn(),
      extractEpisodeNumber: jest.fn(),
      sendToAnnict: jest.fn(),
      searchAnimeOnAnnict: jest.fn(),
      recordEpisodeOnAnnict: jest.fn(),
      sendWebhooks: jest.fn(),
      showNotification: jest.fn(),
      checkAlreadySent: jest.fn(() => false),
      markAsSent: jest.fn(),
      log: jest.fn()
    };
  },
  
  // OptionsManager のモック設定
  createOptionsManagerMock: () => {
    return {
      webhookCount: 0,
      init: jest.fn(),
      setupEventListeners: jest.fn(),
      loadSettings: jest.fn(),
      saveSettings: jest.fn(),
      testConnection: jest.fn(),
      setupWebhookInputs: jest.fn(),
      addWebhookInput: jest.fn(),
      getWebhookUrls: jest.fn(() => []),
      toggleWebhookSection: jest.fn(),
      showStatus: jest.fn(),
      getStorageData: jest.fn(),
      setStorageData: jest.fn()
    };
  }
};

// デバッグ用：テスト実行時の環境情報を出力
if (process.env.NODE_ENV === 'development') {
  console.log('Jest setup completed - Test environment ready');
}