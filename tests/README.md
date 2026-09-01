# テストスイート

danime-save-annict-2 Chrome拡張機能のテストスイートです。

## テスト構成

```
tests/
├── setup.ts                 # Jestセットアップファイル（グローバルモック、ヘルパー関数）
├── playwright.config.ts     # Playwrightのブラウザ結合テスト設定（testDirをbrowser/に限定、tests/unitとの衝突を回避）
├── unit/                    # ユニットテスト（*.test.ts）
├── integration/             # 統合テスト（*.test.ts, jsdom）
└── browser/                 # ブラウザ結合テスト（Playwright, *.spec.ts）
    ├── fixtures.ts           # dist/を拡張機能として読み込むcontextのfixture
    ├── options.spec.ts       # オプション画面が実Chromeで開けるかの結合テスト
    └── content-script.spec.ts # content scriptが実サイトDOM相当のフィクスチャから正しく視聴情報を抽出しAnnictへ送信するかの結合テスト（danime/amazon/abema）
```

### テストの位置づけ（重要）

このプロジェクトのテストは3階層あり、**「ブラウザ結合テスト」を安易に「E2E」と呼ばないこと**。

| 階層 | 実行環境 | 外部依存 | 検証範囲 |
|---|---|---|---|
| ユニット/統合テスト | jsdom | 全てモック | 個々の関数・モジュールのロジック |
| **ブラウザ結合テスト**(`tests/browser/`) | 実Chrome(拡張機能として`dist/`を読み込み) | サイトDOMはフィクスチャ、Annict APIはモック(`context.route()`) | 拡張機能が実Chrome環境で正しくビルド・注入・実行され、フィクスチャDOMから視聴情報を抽出してAnnictへの送信ペイロードを正しく組み立てられるか |
| **E2E**(未実装、TASK-33) | 実Chrome | 実際のdアニメストア/Amazon Prime Video/AbemaTVの実アカウント、実Annictテストアカウント | ユーザーが実際に動画を見る→拡張機能が検知→Annictに実送信、という一連の実フロー |

d アニメストア/Amazon Prime Video/AbemaTVはいずれも要ログインの有料サービスであり、真のE2Eには実アカウントの認証情報が必須のため、Claude側で勝手に用意することはできない。TASK-33としてユーザー提供の実アカウント情報待ちで記録している。

### ブラウザ結合テスト実行時の注意点

`chromium.launchPersistentContext`で`dist/`を`--load-extension`で読み込む方式を採る。

- **`--load-extension`はheadlessモードでは無視される**(Chrome自体の既知の制限。`--headless=new`はもちろん
  レガシー`--headless`でも拡張機能は読み込まれない)。そのため`fixtures.ts`は`headless: false`固定。
  ディスプレイのない環境(CI、WSL2等)では`xvfb-run`で仮想ディスプレイを用意して実行すること:
  ```bash
  npm run test:browser:xvfb
  ```
- **拡張機能IDの解決はプロファイルの`Preferences`ファイルではなく`chrome://extensions`のDOMから行う**。
  `Preferences`ファイルはheadfulでも拡張機能読み込み後すぐには書き込まれず(環境によっては数秒待っても
  生成されない)、タイムアウトの原因になっていた。`chrome://extensions`を開いてshadow DOM越しに
  `extensions-item`の`id`属性を読む方式は即座に解決できる(`fixtures.ts`の`resolveExtensionId`参照)。

2026-09時点で上記2点を反映した状態でこの環境(WSL2, Xvfb)にて全件passを複数回確認済み。

`content-script.spec.ts`の各サイトには2種類のテストがある:

- **起動確認**(全サイト): content scriptが構文エラーなく実行開始するか(TASK-28の回帰防止)
- **抽出+送信ペイロード確認**(danime, abemaのみ): フィクスチャDOMから`obtainWatchingFrom*`が実際に視聴情報を抽出し、Annictへの検索クエリに正しく組み込まれるかを実Chrome上で検証。amazonのみ`test.skip`: `obtainWatchingFromAmazon`は`video.played.length > 0`(実再生開始)が条件になっており、MV3のcontent scriptは"isolated world"で動くため`page.addInitScript()`によるプロトタイプ上書きが届かない(main worldからは上書きが見えるが、isolated worldのcontent scriptからは見えないことを実験で確認済み)。実現するには本物の再生可能な動画フィクスチャか、isolated worldを狙ったCDP `Runtime.evaluate`が必要で、現状のテストファイルの範囲を超える。

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

# ブラウザ結合テストのみ（事前にプロジェクトルートで npm run build が必要）
npm run test:browser
# ディスプレイのない環境（CI、WSL2等）では
npm run test:browser:xvfb

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
- ブラウザ結合テストは `dist/` を拡張機能として読み込むため、実行前に必ずプロジェクトルートで `npm run build` を実行してください
- Chrome拡張機能の実行環境を jsdom でシミュレートしています（ブラウザ結合テストのみ実Chromeを使用）
