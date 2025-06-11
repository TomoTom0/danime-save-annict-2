# Annict API ドキュメント

## 概要

danime-save-annict-2は、[Annict API](https://developers.annict.com/)を使用してアニメの視聴記録を送信します。

## 使用するAPIエンドポイント

### 1. ユーザー情報取得
```
GET https://api.annict.com/v1/me
```

**用途**: 接続テスト、ユーザー認証確認

**レスポンス例**:
```json
{
  "id": 123,
  "username": "example_user",
  "name": "Example User",
  "email": "user@example.com"
}
```

### 2. 作品検索
```
GET https://api.annict.com/v1/works
```

**パラメータ**:
- `access_token`: APIトークン（必須）
- `filter_title`: 検索するアニメタイトル
- `per_page`: 取得件数（デフォルト: 1）

**使用例**:
```javascript
const response = await fetch(`https://api.annict.com/v1/works?access_token=${token}&filter_title=${encodeURIComponent(title)}&per_page=1`);
```

**レスポンス例**:
```json
{
  "works": [
    {
      "id": 4654,
      "title": "鬼滅の刃",
      "title_kana": "きめつのやいば",
      "media": "tv",
      "released_on": "2019-04-06",
      "watchers_count": 25000
    }
  ],
  "total_count": 1,
  "next_page": null,
  "prev_page": null
}
```

### 3. 視聴記録投稿
```
POST https://api.annict.com/v1/me/records
```

**ヘッダー**:
- `Content-Type: application/json`
- `Authorization: Bearer {access_token}`

**ボディパラメータ**:
- `work_id`: 作品ID（必須）
- `episode_number`: エピソード番号
- `rating_state`: 評価（`great`, `good`, `average`, `bad`）

**使用例**:
```javascript
const response = await fetch('https://api.annict.com/v1/me/records', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    work_id: 4654,
    episode_number: 1,
    rating_state: 'great'
  })
});
```

**レスポンス例**:
```json
{
  "id": 789012,
  "comment": null,
  "rating": null,
  "rating_state": "great",
  "liked_count": 0,
  "episode": {
    "id": 12345,
    "number": "1",
    "title": "第1話"
  },
  "work": {
    "id": 4654,
    "title": "鬼滅の刃"
  }
}
```

## エラーハンドリング

### 一般的なエラーレスポンス

**401 Unauthorized**:
```json
{
  "error": "The access token is invalid"
}
```

**422 Unprocessable Entity**:
```json
{
  "errors": [
    "Work can't be blank"
  ]
}
```

**429 Too Many Requests**:
```json
{
  "error": "API rate limit exceeded"
}
```

### 拡張機能でのエラー処理

```javascript
async function handleApiError(response) {
  if (response.status === 401) {
    throw new Error('APIトークンが無効です');
  } else if (response.status === 422) {
    throw new Error('送信データに問題があります');
  } else if (response.status === 429) {
    throw new Error('API制限に達しました。しばらく待ってから再試行してください');
  } else {
    throw new Error(`API呼び出しに失敗しました: ${response.status}`);
  }
}
```

## レート制限

- **制限**: 1時間あたり1500リクエスト
- **ヘッダー情報**:
  - `X-RateLimit-Limit`: 制限数
  - `X-RateLimit-Remaining`: 残り回数
  - `X-RateLimit-Reset`: リセット時刻

## 認証

### APIトークンの取得方法

1. [Annict](https://annict.com/)にログイン
2. [設定 > アプリ](https://annict.com/settings/apps)にアクセス
3. 「アクセストークンを発行」をクリック
4. 必要なスコープを選択:
   - `read`: 基本的な読み取り権限
   - `write`: 記録の作成・編集権限

### 必要なスコープ

- **read**: ユーザー情報と作品情報の取得
- **write**: 視聴記録の投稿

## 実装上の注意点

### 1. タイトル正規化
Annictの作品検索では、タイトルの表記揺れに対応するため以下の処理を行います：

```javascript
function normalizeTitle(title) {
  return title
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[Ａ-Ｚａ-ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .trim();
}
```

### 2. エピソード番号の抽出
各サイトから取得したエピソード情報から番号を抽出：

```javascript
function extractEpisodeNumber(text) {
  const patterns = [
    /第?(\d+)話/,
    /第?(\d+)回/,
    /episode\s*(\d+)/i,
    /ep\.?\s*(\d+)/i,
    /#(\d+)/,
    /(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  return null;
}
```

### 3. 重複防止
同じエピソードの重複送信を防ぐため、ローカルストレージに送信履歴を保存：

```javascript
const storageKey = `sent_${siteName}_${animeTitle}_${episodeNumber}`;
const alreadySent = await chrome.storage.local.get([storageKey]);
```

## テスト用データ

### 開発・テスト用の作品例
- **作品名**: "テストアニメ"
- **作品ID**: 存在しないIDを使用してエラーハンドリングをテスト
- **エピソード**: 1話〜最終話

## 関連リンク

- [Annict API公式ドキュメント](https://developers.annict.com/)
- [Annict利用規約](https://annict.com/terms)
- [Annictプライバシーポリシー](https://annict.com/privacy)