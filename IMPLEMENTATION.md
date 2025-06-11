# danime-save-annict-2 拡張機能の実装ガイド

## 概要
このドキュメントは、d-anime store、Amazon Prime Video、AbemaTVの視聴記録をAnnictに送信するChrome拡張機能の再実装のためのガイドです。

## プロジェクト構造

### 既存コード
- `src_old/` - 既存の実装（参考用）
- `src/` - 新しい実装用ディレクトリ（現在空）

### 主要ファイル
- `manifest.json` - Chrome拡張の設定ファイル
- `scripts/index.js` - メインのコンテンツスクリプト
- `scripts/options.js` - オプション画面のスクリプト
- `scripts/popup.js` - ポップアップのスクリプト
- `html/options.html` - オプション画面のHTML

## 機能要件

### 1. 対応サイト
- **dアニメストア**: `https://animestore.docomo.ne.jp/animestore/sc_d_pc?partId*`
- **Amazon Prime Video**: `https://www.amazon.co.jp/gp/video/detail/*`, `https://www.amazon.co.jp/dp/*`
- **AbemaTV**: `https://abema.tv/video/*`

### 2. 主要機能
- 視聴記録の自動検出
- Annictへの記録送信
- Webhook対応（複数Webhook対応）
- 送信オプション設定
- 劇場版・複数話まとめ作品への対応

### 3. 技術要件
- **Manifest Version**: 3
- **権限**: 
  - `storage` - 設定保存用
  - `https://api.annict.com/` - Annict API通信用
- **外部ライブラリ**:
  - jQuery 3.5.1
  - Bootstrap（UI用）
  - iziToast（通知用）

## 実装すべきコンポーネント

### 1. manifest.json
```json
{
  "manifest_version": 3,
  "name": "danime-save-annict-2",
  "version": "0.6.4.0",
  "description": "dアニメストア, Amazon Prime Video, AbemaTVの視聴結果をAnnictに送信します。Webhookも送信できます。",
  "content_scripts": [...],
  "options_ui": {...},
  "permissions": ["storage"],
  "host_permissions": ["https://api.annict.com/"],
  "icons": {"128": "img/d-annict-icon128.png"},
  "web_accessible_resources": [...]
}
```

### 2. コンテンツスクリプト（scripts/index.js）
- 各VODサイトでの視聴情報検出
- DOM監視による動的コンテンツ対応
- Annict API呼び出し
- Webhook送信機能
- エラーハンドリング

### 3. オプション画面（scripts/options.js + html/options.html）
- Annict APIトークン設定
- Webhook URL設定
- 送信オプション設定
- 設定の保存・読み込み

### 4. データ処理
- アニメタイトルの正規化
- エピソード番号の抽出
- 劇場版・特別編の判定
- 複数話まとめ作品の処理

## API連携

### Annict API
- エンドポイント: `https://api.annict.com/`
- 認証: Bearer Token
- 主要API:
  - 作品検索
  - エピソード記録
  - 視聴ステータス更新

### Webhook
- 複数URL対応
- POST形式でのデータ送信
- 設定可能なペイロード形式

## 実装時の注意点

1. **Manifest V3対応**: Service Workerの使用、権限の適切な設定
2. **DOM監視**: 動的コンテンツに対応したMutationObserver使用
3. **エラーハンドリング**: ネットワークエラー、API制限への対応
4. **パフォーマンス**: 不要な処理の削減、メモリリーク防止
5. **プライバシー**: ユーザーデータの適切な管理
6. **多言語対応**: 日本語タイトルの正規化処理

## デバッグ・テスト

1. **開発モード**: Chrome拡張の開発者モードでの読み込み
2. **ログ出力**: console.logでのデバッグ情報出力
3. **テストケース**: 各VODサイトでの動作確認
4. **エラーテスト**: ネットワーク切断、API制限時の動作確認

## 参考リソース

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Annict API Documentation](https://developers.annict.com/)
- [既存実装](src_old/) - 参考用コード
- [プロジェクトREADME](README.md) - 機能詳細