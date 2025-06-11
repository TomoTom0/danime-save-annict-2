# テストスイート

danime-save-annict-2 Chrome拡張機能のテストスイートです。

## テスト構成

### 1. ユニットテスト (`unit/`)
個別のクラスやメソッドの動作をテストします。

- `index.test.js`: メインコンテンツスクリプトのテスト
- `options.test.js`: 設定画面のテスト

### 2. インテグレーションテスト (`integration/`)
複数のコンポーネント間の連携をテストします。

- `workflow.test.js`: 全体ワークフローのテスト

### 3. E2Eテスト (`e2e/`)
実際のブラウザ環境での動作をテストします。

- `extension.test.js`: 拡張機能全体の動作テスト

## 使用技術

- **Jest**: ユニット・インテグレーションテスト
- **Playwright**: E2Eテスト
- **ESLint**: コード品質チェック

## セットアップ

### 1. 依存関係のインストール
```bash
cd tests
npm install
```

### 2. Playwrightのセットアップ
```bash
npm run playwright:install
```

## テスト実行

### 全テスト実行
```bash
npm test
```

### ユニットテストのみ
```bash
npm run test:unit
```

### インテグレーションテストのみ
```bash
npm run test:integration
```

### E2Eテストのみ
```bash
npm run test:e2e
```

### ウォッチモード
```bash
npm run test:watch
```

### カバレッジ測定
```bash
npm run test:coverage
```

### CI環境での実行
```bash
npm run test:ci
```

## テスト項目

### ユニットテスト

#### DanimeAnnictSender クラス
- [x] サイト検出機能（dアニメストア、Amazon、AbemaTV）
- [x] エピソード番号抽出（複数パターン対応）
- [x] 設定読み込み（デフォルト・カスタム設定）
- [x] Annict API連携（作品検索、記録投稿）
- [x] 重複防止機能
- [x] Webhook送信機能

#### OptionsManager クラス
- [x] 設定の読み込み・保存
- [x] APIトークンの検証
- [x] 接続テスト
- [x] Webhook URL管理
- [x] エラーハンドリング

### インテグレーションテスト

#### 全体ワークフロー
- [x] 視聴検出から記録送信までの完全フロー
- [x] 重複送信の防止
- [x] 各サイト固有のDOM構造対応
- [x] エラーハンドリング
- [x] 設定画面との連携

### E2Eテスト

#### 設定画面
- [x] UIの表示・操作
- [x] 設定の保存・読み込み
- [x] 接続テスト
- [x] Webhook URL管理
- [x] レスポンシブデザイン

#### 対応サイト
- [x] dアニメストア での動作
- [x] Amazon Prime Video での動作
- [x] AbemaTV での動作

#### 通知システム
- [x] 成功・エラー通知の表示
- [x] 通知の自動消去

#### パフォーマンス
- [x] ページ読み込み時間
- [x] メモリ使用量

#### セキュリティ
- [x] CSP準拠
- [x] HTTPS通信

## モック・テストヘルパー

### Chrome API モック
```javascript
// setup.js で設定済み
global.chrome.storage.sync.get
global.chrome.storage.local.set
global.chrome.runtime.getURL
```

### テストヘルパー関数
```javascript
// ストレージモックの設定
testHelpers.setupStorageMock({
  annictToken: 'test-token'
});

// Fetch APIモックの設定
testHelpers.setupFetchMock([
  { ok: true, data: { works: [] } }
]);

// DOM要素の作成
const element = testHelpers.createMockElement('div', {
  className: 'test-class',
  textContent: 'test content'
});
```

## カバレッジ目標

- **ライン カバレッジ**: 90%以上
- **ブランチ カバレッジ**: 85%以上
- **関数 カバレッジ**: 95%以上

## CI/CD

### GitHub Actions との連携
```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    cd tests
    npm install
    npm run test:ci
```

### テスト結果の確認
- カバレッジレポート: `tests/coverage/index.html`
- JUnitレポート: 対応予定

## トラブルシューティング

### よくある問題

#### Chrome API が undefined エラー
```javascript
// setup.js でグローバルモックを確認
global.chrome = { ... };
```

#### DOM要素が見つからないエラー
```javascript
// モック要素の作成
document.getElementById.mockReturnValue(mockElement);
```

#### Playwright で拡張機能が読み込まれない
```javascript
// Chromiumブラウザを使用
test.use({ 
  browserName: 'chromium',
  launchOptions: {
    args: ['--load-extension=./src']
  }
});
```

### デバッグ方法

#### テストの詳細ログ
```bash
# Jest デバッグモード
npm test -- --verbose

# 特定のテストファイルを実行
npm test -- index.test.js
```

#### Playwright でのデバッグ
```bash
# ヘッドフルモードで実行
npx playwright test --headed

# デバッグモード
npx playwright test --debug
```

## 貢献ガイド

### 新しいテストの追加
1. 適切なディレクトリにテストファイルを作成
2. `describe` と `test` で構造化
3. モックとアサーションを明確に記述
4. カバレッジを確認

### テスト品質のガイドライン
- テストは独立性を保つ
- モックは最小限に留める
- エラーケースも含める
- 実装詳細ではなく動作をテストする

## 参考リンク

- [Jest Documentation](https://jestjs.io/docs/)
- [Playwright Documentation](https://playwright.dev/)
- [Chrome Extensions Testing](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)