# テストスイート

danime-save-annict-2 Chrome拡張機能のテストスイートです。

## テスト構成

```
tests/
├── setup.js                 # Jestセットアップファイル（グローバルモック、ヘルパー関数）
├── unit/                    # ユニットテスト
│   ├── index.test.js        # 主要ロジックのテスト
│   └── options.test.js      # オプション画面のテスト
├── integration/             # 統合テスト
│   └── workflow.test.js     # 全体ワークフローのテスト
└── e2e/                     # E2Eテスト（Playwright）
    └── extension.test.js    # 拡張機能全体のE2Eテスト
```

## セットアップ

```bash
cd tests
npm install
```

## テスト実行

```bash
# 全テスト実行
npm test

# ユニットテストのみ
npm run test:unit

# 統合テストのみ
npm run test:integration

# ウォッチモード
npm run test:watch

# カバレッジ付き
npm run test:coverage
```

## テスト対象

### ユニットテスト

- **index.test.js**: 主要な拡張機能ロジック
  - サイト検出（dアニメストア、Amazon Prime Video、Abema TV）
  - エピソード番号抽出
  - タイトル正規化
  - Annict API連携
  - ストレージ操作
  - Webhook機能

- **options.test.js**: オプション画面
  - 設定の読み込み・保存
  - フォームバリデーション
  - チェックボックスの状態管理
  - Webhook設定

### 統合テスト

- **workflow.test.js**: 全体ワークフロー
  - dアニメストアでの動作
  - Amazon Prime Videoでの動作
  - Abema TVでの動作
  - Annict API統合
  - エラーハンドリング

## モック

テストでは以下のAPIをモック化しています：

- `chrome.storage.sync` - Chrome拡張機能のストレージAPI
- `chrome.storage.local` - ローカルストレージAPI
- `chrome.runtime` - ランタイムAPI
- `fetch` - Fetch API（Annict API呼び出し用）
- DOM API - `document.querySelector`など

モックの詳細は `setup.js` を参照してください。

## テストヘルパー

`setup.js` には以下のヘルパー関数が定義されています：

- `testHelpers.setupStorageMock(syncData, localData)` - Chrome storageのモック設定
- `testHelpers.setupFetchMock(responses)` - Fetch APIのモック設定
- `testHelpers.createMockElement(tag, attributes, textContent)` - DOM要素の作成

## カバレッジ

カバレッジレポートは `tests/coverage/` に生成されます。

```bash
npm run test:coverage
```

## CI/CD

CI環境でのテスト実行：

```bash
npm run test:ci
```

## 注意事項

- テストは TypeScript コンパイル後の JavaScript ファイル（`dist/scripts/`）を対象としています
- テスト実行前に `npm run build` を実行してください
- Chrome拡張機能の実行環境を jsdom でシミュレートしています
