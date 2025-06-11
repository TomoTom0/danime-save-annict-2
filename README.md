# danime-save-annict-2

## 概要

dアニメストア、Amazon Prime Video、AbemaTVの視聴記録を自動でAnnictに送信するChrome拡張機能です。[kakunpcさんのRepository](https://github.com/kakunpc/danime-save-annict)からforkした改良版で、モダンなJavaScriptによる完全リライトを行いました。

<img src="img/dsaveAnnict-ssss.png" style="width:60%;" alt="danime-save-annict-2 スクリーンショット">

## 特徴

### 🎯 **視聴記録の自動化**
- **3サイト対応**: dアニメストア、Amazon Prime Video、AbemaTVの視聴記録を自動検出
- **柔軟な連携**: Annict連携とWebhook通知を自由に組み合わせ可能（どちらか一方、または両方）
- **重複防止**: 同じエピソードの重複送信を自動で防止

### 🔧 **高度なカスタマイズ**
- **サイト別設定**: 各動画サイトを個別に有効/無効可能
- **送信タイミング**: 視聴開始から0-300秒の遅延時間設定
- **通知制御**: 画面通知の表示/非表示切り替え
- **自動保存**: チェックボックス設定は即座に保存、その他は未保存警告で安心

### 📡 **高度なWebhook機能**
- **5種類の送信形式**: シンプル/Slack/Discord/Teams/カスタム形式
- **個別制御**: 複数WebhookURLの個別有効化/無効化
- **認証対応**: カスタムヘッダーでトークン認証可能
- **変数置換**: カスタムテンプレートで柔軟な通知内容

### 📊 **視聴履歴管理**
- **完全な履歴**: 全ての視聴記録をローカルストレージに保存
- **送信状況**: Annict/Webhook送信の成功/失敗状況を管理
- **検索・フィルタ**: タイトル検索、サイト別・送信状況別フィルタ
- **データ管理**: CSV形式でのインポート/エクスポート機能
- **再送信**: 未送信の記録を個別または一括で再送信

### 💎 **モダンなUI/UX**
- **タブ式設定画面**: 5つのタブで情報を整理（基本設定/Annict連携/Webhook設定/視聴履歴/情報）
- **レスポンシブデザイン**: PC・モバイル両対応
- **未保存警告**: 設定変更時の保存忘れを防止
- **スムーズアニメーション**: 読み込み時のちらつきを排除

## インストール

### Chrome Web Store（推奨）
[Chrome Web Store](https://chrome.google.com/webstore/detail/danime-save-annict-2/kclfdffcicdnmfjaiikclpoldoojfnpj)からインストール

### 開発版
1. このリポジトリをクローン
2. Chromeで `chrome://extensions/` にアクセス
3. 「デベロッパーモード」を有効
4. 「パッケージ化されていない拡張機能を読み込む」で `src` フォルダを選択

## 使用方法

詳細な使用方法は [使用方法ドキュメント](doc/usage.md) をご覧ください。

### 基本設定
1. 拡張機能のオプション画面を開く
2. **Annict連携の場合**: [Annict](https://annict.com/settings/apps) からAPIトークンを取得して入力
3. **Webhook通知の場合**: Webhook URLを設定し、送信形式を選択
4. **両方の併用も可能**: AnnictとWebhookを同時に使用可能

### 対応サイト
- **dアニメストア** (animestore.docomo.ne.jp)
- **Amazon Prime Video** (amazon.co.jp)
- **AbemaTV** (abema.tv)

## 技術仕様

### バージョン
現在のバージョン: **0.6.6.0** ([バージョン履歴](doc/update.md) | [変更ログ](doc/CHANGELOG.md))

### 主要技術
- **Manifest V3**: Chrome拡張機能の最新仕様
- **ES6+ JavaScript**: モダンなネイティブJavaScript（依存関係なし）
- **CSS3**: レスポンシブデザインとアニメーション
- **Chrome Storage API**: 設定とデータの管理
- **CSP準拠**: セキュリティ強化のためのContent Security Policy対応

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
- [エラーハンドリング](doc/error-handling.md): エラー処理とデバッグ方法
- [パフォーマンス](doc/performance.md): パフォーマンス最適化の指針

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

### お問い合わせ
- **📝 お問い合わせフォーム**: [Google Forms](https://docs.google.com/forms/d/e/1FAIpQLSdh2wRCUWpX6ZLfma-g5O46eD93wOPHpDHWQGxdOcJLmm_tGQ/viewform?usp=pp_url&entry.1848091360=danime-save-annict-2) - バグ報告、機能要望、使用方法の質問
- **🐛 GitHub Issues**: [リポジトリのIssues](https://github.com/TomoTom0/danime-save-annict-2/issues) - 技術的な問題やバグ報告（開発者向け）
- **⭐ Chrome Web Store**: [拡張機能の評価・レビュー](https://chrome.google.com/webstore/detail/danime-save-annict-2/kclfdffcicdnmfjaiikclpoldoojfnpj)

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
- Automatic integration with Annict and webhook notifications
- Advanced webhook system with 5 different formats
- Duplicate prevention and viewing history management
- Modern responsive UI with smooth animations
- No external dependencies (jQuery-free, Bootstrap-free)
- Complete rewrite with ES6+ and Manifest V3

