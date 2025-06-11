# Webhook API ドキュメント

## 概要

danime-save-annict-2は、視聴記録をAnnictに送信した後、設定されたWebhook URLに通知を送信する機能があります。

## 基本仕様

### 送信方式
- **HTTP Method**: POST
- **Content-Type**: application/json
- **タイムアウト**: 10秒

### 送信タイミング
- Annictへの記録送信が成功した直後
- 複数のWebhook URLが設定されている場合、すべてに並行送信

## 送信データ形式

### 基本形式
```json
{
  "text": "アニメタイトル 第X話を視聴しました (サイト名)"
}
```

### 実際の送信例
```json
{
  "text": "鬼滅の刃 第1話を視聴しました (dアニメストア)"
}
```

### 詳細データ形式（将来的な拡張予定）
```json
{
  "anime_title": "鬼滅の刃",
  "episode_number": 1,
  "site": "dアニメストア",
  "timestamp": "2025-06-11T08:30:00Z",
  "annict_url": "https://annict.com/works/4654",
  "rating": "great"
}
```

## 対応サービス

### Slack
**Webhook URL形式**: `https://hooks.slack.com/services/...`

**設定方法**:
1. Slackワークスペースで「Incoming Webhooks」アプリを追加
2. チャンネルを選択してWebhook URLを生成
3. 拡張機能の設定画面にURLを登録

**表示例**:
```
🎬 鬼滅の刃 第1話を視聴しました (dアニメストア)
```

### Discord
**Webhook URL形式**: `https://discord.com/api/webhooks/...`

**設定方法**:
1. Discordサーバーの設定 > 連携サービス > ウェブフック
2. 「ウェブフックを作成」をクリック
3. チャンネルを選択してWebhook URLをコピー
4. 拡張機能の設定画面にURLを登録

### Microsoft Teams
**Webhook URL形式**: `https://outlook.office.com/webhook/...`

**設定方法**:
1. Teamsチャンネルで「コネクタ」を選択
2. 「Incoming Webhook」を追加
3. 名前とアイコンを設定してWebhook URLを取得
4. 拡張機能の設定画面にURLを登録

### カスタムWebhook
独自のサーバーでWebhookを受信する場合の実装例：

#### Node.js (Express)
```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const { text } = req.body;
  console.log('視聴記録:', text);
  
  // 独自の処理（データベース保存、メール送信など）
  
  res.status(200).json({ success: true });
});

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

#### Python (Flask)
```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    text = data.get('text')
    print(f'視聴記録: {text}')
    
    # 独自の処理
    
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(port=3000)
```

## エラーハンドリング

### 拡張機能側の処理
```javascript
async function sendWebhooks(episodeData) {
  for (const webhookUrl of this.settings.webhookUrls) {
    if (!webhookUrl.trim()) continue;
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `${episodeData.animeTitle} 第${episodeData.episodeNumber}話を視聴しました (${episodeData.site})`
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Webhook送信エラー:', error);
      // エラーログは記録するが、ユーザーには通知しない
    }
  }
}
```

### よくあるエラー

#### 404 Not Found
- Webhook URLが無効または削除されている
- URLのタイプミス

#### 401 Unauthorized
- 認証が必要なWebhookで認証情報が不正
- トークンの期限切れ

#### 429 Too Many Requests
- Webhookサービスのレート制限に到達
- 短時間での大量送信

#### タイムアウト
- ネットワーク接続の問題
- Webhookサーバーの応答遅延

## セキュリティ考慮事項

### HTTPS必須
- すべてのWebhook URLはHTTPSである必要があります
- HTTP URLは設定時にエラーとなります

### 機密情報の取り扱い
- Webhook URLには認証情報が含まれる場合があるため、安全に管理してください
- URLをログに出力する際は一部をマスクします

### レート制限
- 同一URLへの連続送信を制限
- 1分間に最大10回まで（予定）

## テスト機能

### Webhook テスト送信
設定画面から「Webhookテスト」ボタンでテスト送信が可能：

```json
{
  "text": "Webhook接続テスト - danime-save-annict-2"
}
```

### デバッグログ
デバッグモード有効時のログ出力例：
```
[DanimeAnnict] Webhook送信開始: https://hooks.slack.com/services/***
[DanimeAnnict] Webhook送信成功: 200 OK
[DanimeAnnict] Webhook送信完了: 2/2 URLs
```

## 設定例

### 複数サービスへの同時送信
```javascript
// 設定例
const webhookUrls = [
  'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
  'https://discord.com/api/webhooks/123456789/XXXXXXXXXXXXXXXXXXXXXXXX',
  'https://your-server.com/webhook'
];
```

### 条件付き送信（将来の機能）
```javascript
// アニメタイトルやサイトに応じて送信先を変更
const webhookConfig = {
  'default': ['https://hooks.slack.com/services/...'],
  'dアニメストア': ['https://discord.com/api/webhooks/...'],
  '鬼滅の刃': ['https://special-webhook.com/kimetsu']
};
```

## 関連リンク

- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Discord Webhooks](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks)
- [Microsoft Teams Webhooks](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/)