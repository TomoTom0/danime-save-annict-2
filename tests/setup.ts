/**
 * Jestテストセットアップファイル
 * 全テストで共通して使用するモックや設定
 */

import type { Chrome } from '@types/chrome';

// Chrome APIのグローバルモック
(global as any).chrome = {
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
(global as any).fetch = jest.fn();

// MutationObserverのモック
(global as any).MutationObserver = class MutationObserver {
  callback: MutationCallback;

  constructor(callback: MutationCallback) {
    this.callback = callback;
  }

  observe(): void {
    // モック実装
  }

  disconnect(): void {
    // モック実装
  }

  takeRecords(): MutationRecord[] {
    return [];
  }
};

// DOM要素はjsdomのデフォルト実装を使用
// カスタムモックは必要な場合のみテスト内で設定

// Locationオブジェクトのモック
// jsdomでは window.location の再定義ができないため、
// 各テストで window.location.href を直接参照する


// コンソールのスパイ設定（テスト出力をクリーンにする）
const originalConsole = global.console;
(global as any).console = {
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
  (fetch as jest.Mock).mockClear();
});

interface FetchResponse {
  ok?: boolean;
  status?: number;
  data?: any;
  text?: string;
}

interface MockElementAttributes {
  value?: string;
  checked?: boolean;
  className?: string;
  id?: string;
  [key: string]: any;
}

interface TestHelpers {
  setupStorageMock: (syncData?: Record<string, any>, localData?: Record<string, any>) => void;
  setupFetchMock: (responses?: FetchResponse[]) => void;
  createMockElement: (tag: string, attributes?: MockElementAttributes, textContent?: string) => any;
}

// テスト用ヘルパー関数
(global as any).testHelpers = {
  // Chrome storage モックの簡易セットアップ
  setupStorageMock: (syncData: Record<string, any> = {}, localData: Record<string, any> = {}) => {
    (chrome.storage.sync.get as jest.Mock).mockImplementation((keys: any, callback: (items: any) => void) => {
      callback(syncData);
    });

    (chrome.storage.local.get as jest.Mock).mockImplementation((keys: any, callback: (items: any) => void) => {
      callback(localData);
    });
  },

  // Fetch API モックの簡易セットアップ
  setupFetchMock: (responses: FetchResponse[] = []) => {
    responses.forEach((response) => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: response.ok !== false,
        status: response.status || 200,
        json: () => Promise.resolve(response.data || {}),
        text: () => Promise.resolve(response.text || '')
      });
    });
  },

  // DOM要素の作成ヘルパー
  createMockElement: (tag: string, attributes: MockElementAttributes = {}, textContent: string = '') => {
    const element: any = {
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
      getAttribute: jest.fn((attr: string) => attributes[attr]),
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
} as TestHelpers;

// グローバル型宣言
declare global {
  var testHelpers: TestHelpers;
}

// デバッグ用：テスト実行時の環境情報を出力
if (process.env.NODE_ENV === 'development') {
  console.log('Jest setup completed - Test environment ready');
}
