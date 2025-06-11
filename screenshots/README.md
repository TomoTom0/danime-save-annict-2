# Screenshots for Chrome Web Store

このディレクトリには、Chrome Web Store公開用のスクリーンショット生成に使用するHTMLファイルが含まれています。

## ファイル一覧

### 1. `demo.html`
- **用途**: メイン機能紹介画面
- **内容**: 
  - 拡張機能の主要機能説明
  - 対応サイト一覧
  - 設定画面プレビュー
  - 通知システムデモ
- **推奨サイズ**: 1280x800px

### 2. `options-preview.html`
- **用途**: 設定画面のスクリーンショット
- **内容**:
  - 実際の設定画面レイアウト
  - 新機能（サイト別設定、Webhook形式）のハイライト
  - 入力済みの設定例
- **推奨サイズ**: 1280x800px

### 3. `notification-demo.html`
- **用途**: 通知システムの動作デモ
- **内容**:
  - 疑似的なアニメ視聴サイト
  - リアルタイム通知アニメーション
  - インタラクティブなデモ機能
- **推奨サイズ**: 800x600px

## スクリーンショット撮影手順

### 1. ブラウザでの撮影
```bash
# 各HTMLファイルをブラウザで開く
open screenshots/demo.html
open screenshots/options-preview.html
open screenshots/notification-demo.html
```

### 2. 推奨設定
- **ブラウザ**: Chrome（最新版）
- **ウィンドウサイズ**: 1280x800px（通知デモは800x600px）
- **ズーム**: 100%
- **デベロッパーツール**: 非表示

### 3. Chrome Web Store要件
- **画像形式**: PNG、JPEG
- **最小サイズ**: 640x400px
- **最大サイズ**: 1280x800px
- **最大ファイルサイズ**: 16MB
- **枚数**: 最大5枚

## 撮影のポイント

### デモ画面 (`demo.html`)
- 全体の機能が一目で分かるようにする
- 通知が表示された状態でキャプチャ
- レスポンシブレイアウトの美しさを強調

### 設定画面 (`options-preview.html`)
- 新機能の「新機能!」バッジが見えるようにする
- 設定済み状態で実用性をアピール
- サイト別設定の分かりやすさを強調

### 通知デモ (`notification-demo.html`)
- 通知が表示されている瞬間をキャプチャ
- アニメーションの美しさを表現
- 実際の使用感を伝える

## 自動スクリーンショット（オプション）

Playwrightを使用した自動スクリーンショット生成も可能です：

```javascript
// screenshot-generator.js の例
const { chromium } = require('playwright');

async function generateScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // デモ画面
  await page.goto('file://' + __dirname + '/demo.html');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: 'demo-screenshot.png' });
  
  // 設定画面
  await page.goto('file://' + __dirname + '/options-preview.html');
  await page.screenshot({ path: 'options-screenshot.png' });
  
  // 通知デモ
  await page.goto('file://' + __dirname + '/notification-demo.html');
  await page.setViewportSize({ width: 800, height: 600 });
  await page.waitForTimeout(3000); // アニメーション待機
  await page.screenshot({ path: 'notification-screenshot.png' });
  
  await browser.close();
}
```

## 使用する画像

Chrome Web Storeでは以下の画像を使用することを推奨：

1. **メイン機能紹介** - `demo.html`のスクリーンショット
2. **設定画面** - `options-preview.html`のスクリーンショット  
3. **通知システム** - `notification-demo.html`のスクリーンショット
4. **対応サイト一覧** - `demo.html`の下部部分
5. **Webhook設定** - `options-preview.html`のWebhook部分

これらの画像により、拡張機能の価値と使いやすさを効果的にアピールできます。