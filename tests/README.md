# テストスイート

danime-save-annict-2 Chrome拡張機能のテストスイートです。

## テスト構成

```
tests/
├── setup.ts                 # Jestセットアップファイル（グローバルモック、ヘルパー関数）
├── playwright.config.ts     # PlaywrightのE2E設定（testDirをe2e/に限定、tests/unitとの衝突を回避）
├── unit/                    # ユニットテスト（*.test.ts）
├── integration/             # 統合テスト（*.test.ts）
└── e2e/                     # E2Eテスト（Playwright, *.spec.ts）
    ├── fixtures.ts           # dist/を拡張機能として読み込むcontextのfixture
    ├── options.spec.ts       # オプション画面のE2Eテスト
    └── content-script.spec.ts # content scriptの注入確認（danime/amazon/abema）
```

### E2Eテスト実行時の注意点

E2Eテストは`chromium.launchPersistentContext`で`dist/`を`--load-extension`で読み込む方式を採る。

- **`--load-extension`はheadlessモードでは無視される**(Chrome自体の既知の制限。`--headless=new`はもちろん
  レガシー`--headless`でも拡張機能は読み込まれない)。そのため`fixtures.ts`は`headless: false`固定。
  ディスプレイのない環境(CI、WSL2等)では`xvfb-run`で仮想ディスプレイを用意して実行すること:
  ```bash
  npm run test:e2e:xvfb
  ```
- **拡張機能IDの解決はプロファイルの`Preferences`ファイルではなく`chrome://extensions`のDOMから行う**。
  `Preferences`ファイルはheadfulでも拡張機能読み込み後すぐには書き込まれず(環境によっては数秒待っても
  生成されない)、タイムアウトの原因になっていた。`chrome://extensions`を開いてshadow DOM越しに
  `extensions-item`の`id`属性を読む方式は即座に解決できる(`fixtures.ts`の`resolveExtensionId`参照)。

2026-09時点で上記2点を反映した状態でこの環境(WSL2, Xvfb)にて5件全てpassを複数回確認済み。

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

- ユニット・統合テストは `src/` 配下の TypeScript を ts-jest で直接実行します（`dist/` は対象外）
- E2Eテストは `dist/` を拡張機能として読み込むため、実行前に必ずプロジェクトルートで `npm run build` を実行してください
- Chrome拡張機能の実行環境を jsdom でシミュレートしています（E2Eテストのみ実ブラウザを使用）
