# danime-save-annict-2

## 概要

dアニメストア、Amazon Prime Video、AbemaTVの視聴記録を自動でAnnictに送信するChrome拡張機能です。[kakunpcさんのRepository](https://github.com/kakunpc/danime-save-annict)からforkした改良版で、モダンなJavaScriptによる完全リライトを行いました。

<img src="img/dsaveAnnict-ssss.png" style="width:60%;" alt="danime-save-annict-2 スクリーンショット">

## 特徴

- **3サイト対応**: dアニメストア、Amazon Prime Video、AbemaTVの視聴記録を自動検出
- **Annict連携**: 視聴記録を自動でAnnictに送信
- **Webhook対応**: 複数のWebhook URLに同時通知可能
- **重複防止**: 同じエピソードの重複送信を自動で防止
- **モダン設計**: jQuery不使用、Manifest V3対応
- **レスポンシブUI**: 美しく使いやすい設定画面

## インストール

### Chrome Web Store（推奨）
[Chrome Web Store](https://chrome.google.com/webstore/detail/danime-save-annict-2/kclfdffcicdnmfjaiikclpoldoojfnpj?hl=ja)からインストール

### 開発版
1. このリポジトリをクローン
2. Chromeで `chrome://extensions/` にアクセス
3. 「デベロッパーモード」を有効
4. 「パッケージ化されていない拡張機能を読み込む」で `src` フォルダを選択

## 使用方法

詳細な使用方法は [使用方法ドキュメント](doc/usage.md) をご覧ください。

### 基本設定
1. 拡張機能のオプション画面を開く
2. [Annict](https://annict.com/settings/apps) からAPIトークンを取得
3. APIトークンを設定画面に入力
4. 必要に応じてWebhook URLを設定

### 対応サイト
- **dアニメストア** (animestore.docomo.ne.jp)
- **Amazon Prime Video** (amazon.co.jp)
- **AbemaTV** (abema.tv)

## 技術仕様

### バージョン
現在のバージョン: **0.6.5.0** ([バージョン履歴](doc/update.md))

### 主要技術
- **Manifest V3**: Chrome拡張機能の最新仕様
- **ES6+ JavaScript**: モダンなネイティブJavaScript
- **CSS3**: レスポンシブデザイン
- **Chrome Storage API**: 設定とデータの管理

### ブラウザ対応
- Chrome 88以降
- Edge 88以降（Chromiumベース）

## プロジェクト構造

```
.
├── src/                 # 拡張機能のソースコード
│   ├── manifest.json   # Chrome拡張機能の設定
│   ├── scripts/        # JavaScriptファイル
│   ├── html/           # HTMLファイル
│   ├── css/            # CSSファイル
│   ├── styles/         # 追加スタイル
│   └── img/            # 画像ファイル
├── tests/              # テストコード
│   ├── unit/           # ユニットテスト
│   ├── integration/    # インテグレーションテスト
│   └── e2e/            # E2Eテスト
├── doc/                # ドキュメント
│   ├── usage.md        # 使用方法
│   ├── update.md       # 更新履歴
│   ├── CHANGELOG.md    # 変更ログ
│   └── API/            # API仕様書
├── .clinerules         # 開発ルール
├── .todo               # TODOリスト
├── .done               # 完了タスク履歴
└── version.dat         # バージョン情報
```

## 開発

### 必要な環境
- Node.js 16以降（テスト実行用）
- Chrome/Chromium（開発・テスト用）

### テスト実行
```bash
cd tests
npm install
npm test                # 全テスト実行
npm run test:unit       # ユニットテストのみ
npm run test:e2e        # E2Eテストのみ
npm run test:coverage   # カバレッジ測定
```

詳細は [テストドキュメント](tests/README.md) をご覧ください。

### 開発ガイド
- [実装ガイド](IMPLEMENTATION.md): 開発者向けの詳細な実装情報
- [API仕様書](doc/API/): Annict API、Webhook APIの仕様

## ドキュメント

- **[使用方法](doc/usage.md)**: インストールから基本的な使い方まで
- **[更新履歴](doc/update.md)**: バージョンごとの変更内容
- **[変更ログ](doc/CHANGELOG.md)**: 詳細な変更履歴
- **[プライバシーポリシー](PRIVACY_POLICY.md)**: 個人情報の取り扱いについて
- **[API仕様書](doc/API/)**: Annict API、Webhook APIの仕様

## 貢献

プルリクエストやイシューを歓迎します。

### 貢献方法
1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/new-feature`)
3. 変更をコミット (`git commit -am 'Add new feature'`)
4. ブランチにプッシュ (`git push origin feature/new-feature`)
5. プルリクエストを作成

### 開発ルール
- `.clinerules` の内容に従って開発
- テストコードを必ず追加
- ドキュメントの更新も忘れずに

## サポート

### バグ報告・機能要望
[GitHub Issues](https://github.com/TomoTom0/danime-save-annict-2/issues) でお知らせください。

### お問い合わせ
- **GitHub Issues**: [リポジトリのIssues](https://github.com/TomoTom0/danime-save-annict-2/issues)
- **Email**: TomoIris427+GitHub@gmail.com

## 参考・謝辞

- [kakunpc / danime-save-annict](https://github.com/kakunpc/danime-save-annict): 本プロジェクトの元となった素晴らしい拡張機能
- [Annict](https://annict.jp/): アニメ記録サービス
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)

## ライセンス

MIT License

詳細は [LICENSE](LICENSE) ファイルをご覧ください。

---

**English Description:**

This Chrome extension automatically sends your anime watching records from d-anime store, Amazon Prime Video, and AbemaTV to Annict. It's a modern rewrite of the original extension by kakunpc, featuring Manifest V3 support and modern JavaScript implementation.

**Features:**
- Support for 3 major anime streaming services
- Automatic integration with Annict
- Multiple webhook notifications
- Duplicate prevention
- Modern responsive UI
- No external dependencies (jQuery-free)

