# ストレージ設計

## 概要

Chrome Extension の `chrome.storage.sync` API を使用してユーザー設定を保存する。
`sync` ストレージを使用するため、同じ Chrome アカウントでログインした複数の端末間で設定が同期される。

## ストレージキー一覧

### 基本設定

| キー | 型 | デフォルト | 説明 |
|------|-----|---------|------|
| `token` | string | `""` | Annict アクセストークン |
| `sendingTime` | number | `300` | 視聴開始から記録送信までの待機時間(秒) |
| `annictSend` | boolean | `true` | Annict への記録送信を有効にするか |
| `withTwitter` | boolean | `false` | 記録時に Twitter でシェアするか |
| `withFacebook` | boolean | `false` | 記録時に Facebook でシェアするか |
| `webhookSettings` | string | (JSON) | Webhook 設定 (JSON文字列) |

### サイト別設定

`valid_<site>` の形式で各サイトの有効/無効を設定する。

| キー | 型 | デフォルト | 説明 |
|------|-----|---------|------|
| `valid_danime` | boolean | `true` | dアニメ有効 |
| `valid_amazon` | boolean | `false` | Amazon有効 |
| `valid_abema` | boolean | `false` | Abema有効 |
| `valid_danimeAnnict` | boolean | `true` | dアニメのAnnict送信 |
| `valid_amazonAnnict` | boolean | `true` | AmazonのAnnict送信 |
| `valid_abemaAnnict` | boolean | `true` | AbemaのAnnict送信 |
| `valid_danimeWebhook` | boolean | `true` | dアニメのWebhook送信 |
| `valid_amazonWebhook` | boolean | `true` | AmazonのWebhook送信 |
| `valid_abemaWebhook` | boolean | `true` | AbemaのWebhook送信 |
| `valid_danimeGenre` | boolean | `false` | dアニメのジャンルフィルタ |
| `valid_amazonGenre` | boolean | `false` | AmazonのジャンルフィルタAmazon はデフォルトでアニメ判定が必要 |
| `valid_abemaGenre` | boolean | `false` | AbemaのジャンルフィルタAbema はデフォルトでアニメ判定が必要 |

### セッション状態

| キー | 型 | デフォルト | 説明 |
|------|-----|---------|------|
| `lastWatched_<site>` | string | `"{}"` | 最後に視聴したエピソード情報 (JSON) |
| `lastVideoOver` | boolean | `true` | 最後まで視聴したか |

## Webhook 設定の構造

`webhookSettings` は JSON 文字列として保存される。キーは任意の文字列 (タイムスタンプ推奨)、値は `WebhookSetting` オブジェクト。

```typescript
interface WebhookSetting {
  postUrl: string;              // WebhookエンドポイントURL
  webhookNoMatched: boolean;    // 作品マッチ失敗時に送信するか
  webhookNoWorkId: boolean;     // VOD ID未確認時に送信するか
  webhookSuccess: boolean;      // 正常時に送信するか
  webhookContentChanged: boolean; // カスタムコンテンツを使用するか
  webhookContent: Record<string, string>; // カスタムコンテンツテンプレート
}
```

### カスタムコンテンツのプレースホルダー

`webhookContentChanged: true` のとき、`webhookContent` の値内の `{key}` は以下の変数に置換される:

| プレースホルダー | 置換値 |
|----------------|--------|
| `{workTitle}` | 作品タイトル |
| `{episodeNumber}` | エピソード番号 |
| `{episodeTitle}` | エピソードタイトル |
| `{vodWorkId}` | VOD サービスでの作品ID |
| `{danimeWorkId}` | dアニメでの作品ID |
| `{site}` | サービス名 (danime/amazon/netflix/abema) |
| `{error}` | エラーコード |

### Google Apps Script への対応

Webhook URL が `://script.google.com/macros/` を含む場合、`mode: 'no-cors'` でリクエストを送信する (CORS制限回避)。

## ストレージ操作の API

```typescript
// 取得 (型安全)
const items = await getSyncStorage({ token: "", sendingTime: 300 });

// 保存
await setSyncStorage({ token: "new-token" });
```

`getSyncStorage` はデフォルト値を含むオブジェクトをキーとして受け取り、ストレージから取得した値を返す。TypeScript のジェネリクスにより型推論が効く。
