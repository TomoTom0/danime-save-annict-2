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

// DOM要素はjsdomのデフォルト実装を使用
// カスタムモックは必要な場合のみテスト内で設定

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
  }
};

// デバッグ用：テスト実行時の環境情報を出力
if (process.env.NODE_ENV === 'development') {
  console.log('Jest setup completed - Test environment ready');
}
