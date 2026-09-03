# Webhook 仕様

## 概要

視聴記録送信のタイミングで任意の HTTP エンドポイントに通知を送ることができる。
複数の Webhook を設定可能で、エラー状態に応じて送信先を制御できる。

## リクエスト仕様

### メソッド
POST

### ヘッダー
```
Accept: application/json
Content-Type: application/json
```

### ボディ (標準フォーマット)

```json
{
  "workTitle": "作品タイトル",
  "episodeNumber": "第1話",
  "episodeTitle": "エピソードタイトル",
  "vodWorkId": "VODサービスでの作品ID",
  "danimeWorkId": "dアニメでの作品ID",
  "site": "danime",
  "error": "none"
}
```

### ボディ (カスタムフォーマット)

`webhookContentChanged: true` のとき、`webhookContent` のキー/値ペアがボディとなる。
値の `{key}` プレースホルダーは標準フォーマットの各フィールドに置換される。

例:
```json
{
  "webhookContent": {
    "content": "{workTitle} {episodeNumber}を視聴しました"
  }
}
```

→ 送信ボディ:
```json
{
  "content": "テストアニメ 第1話を視聴しました"
}
```

## 送信条件

各 Webhook の `WebhookSetting` オブジェクトの以下フラグで送信を制御:

| フラグ | 送信条件 |
|--------|--------|
| `webhookSuccess` | `error: "none"` (正常に特定できた) |
| `webhookNoWorkId` | `error` に `"noWorkId"` を含む (VOD ID未確認) |
| `webhookNoMatched` | `error` に `"noWorkMatched"` または `"noEpisodeMatched"` を含む |

## エラーコードの組み合わせ

エラーコードは複数のコードがスペース区切りで結合される場合がある:
- `"none"`: 正常
- `"noWorkId"`: VOD IDマッチングが未確認だが、エピソードは特定できた
- `"noWorkMatched"`: 作品が見つからなかった
- `"noEpisodeMatched"`: エピソードが見つからなかった
- `"noWorkId noEpisodeMatched"`: 複合エラー

## Google Apps Script の設定方法

Google Apps Script を Webhook として利用する場合:

1. GAS で Web アプリをデプロイし URL を取得
2. URL が `script.google.com/macros/` を含むため、自動的に `mode: 'no-cors'` でリクエスト送信
3. GAS 側でのレスポンスは無視される (no-cors のため)

### GAS での受信例

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  // data.workTitle, data.episodeNumber などを利用
  console.log(data.workTitle + ' ' + data.episodeNumber);
}
```
