# エラーハンドリング改善ドキュメント

## 概要

danime-save-annict-2 では、ユーザー体験を向上させるため、包括的なエラーハンドリングを実装しています。

## 実装済みエラーハンドリング

### 1. ネットワークエラー対応

#### タイムアウト制御
```javascript
// API呼び出し時のタイムアウト設定
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒

const response = await fetch(url, {
  signal: controller.signal
});

clearTimeout(timeoutId);
```

#### タイムアウト時間の設定
- **Annict検索**: 10秒
- **Annict記録**: 15秒
- **Webhook送信**: 5秒
- **接続テスト**: 10秒

### 2. HTTP ステータスコード別エラー処理

#### 401 Unauthorized
```javascript
if (error.message.includes('HTTP 401')) {
  this.showNotification('APIトークンが無効です', 'error');
}
```

#### 422 Unprocessable Entity
```javascript
if (error.message.includes('HTTP 422')) {
  this.showNotification('記録データが無効です', 'error');
}
```

#### 429 Too Many Requests
```javascript
if (error.message.includes('HTTP 429')) {
  this.showNotification('API制限に達しました。しばらく待ってから再試行してください', 'error');
}
```

### 3. Webhook エラー処理

#### 成功・失敗カウント
```javascript
async sendWebhooks(episodeData) {
  let successCount = 0;
  let failureCount = 0;
  
  // 各Webhookの送信処理
  for (const webhookUrl of this.settings.webhookUrls) {
    try {
      // 送信処理
      successCount++;
    } catch (error) {
      failureCount++;
    }
  }
  
  // 結果の通知
  if (successCount > 0 && failureCount > 0) {
    this.showNotification(`Webhook送信: ${successCount}件成功、${failureCount}件失敗`, 'error');
  }
}
```

#### URL マスキング
```javascript
maskUrl(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.hostname}${urlObj.pathname.substring(0, 10)}***`;
  } catch {
    return url.substring(0, 20) + '***';
  }
}
```

### 4. 設定画面でのエラー処理

#### 接続テスト
```javascript
async testConnection() {
  try {
    const response = await fetch(url, { signal: controller.signal });
    
    if (response.ok) {
      // 成功処理
    } else if (response.status === 401) {
      this.showStatus('APIトークンが無効または期限切れです', 'error');
    } else if (response.status === 429) {
      this.showStatus('API制限に達しています', 'error');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      this.showStatus('接続テストがタイムアウトしました', 'error');
    } else if (error.message.includes('Failed to fetch')) {
      this.showStatus('ネットワークエラー: インターネット接続を確認してください', 'error');
    }
  }
}
```

## エラーカテゴリー別対応

### 1. ネットワーク関連エラー

| エラー種別 | 原因 | 対応方法 | ユーザー表示 |
|------------|------|----------|--------------|
| タイムアウト | ネットワーク遅延 | AbortController使用 | "タイムアウトしました" |
| 接続失敗 | インターネット切断 | Failed to fetch検知 | "ネットワークエラー" |
| DNS解決失敗 | DNS設定問題 | URL検証 | "接続に失敗しました" |

### 2. API関連エラー

| HTTPステータス | 原因 | 対応方法 | ユーザー表示 |
|----------------|------|----------|--------------|
| 401 | 無効なAPIトークン | トークン再設定促進 | "APIトークンが無効です" |
| 422 | 無効なデータ | データ検証強化 | "記録データが無効です" |
| 429 | レート制限 | 再試行制御 | "API制限に達しました" |
| 500 | サーバーエラー | 後で再試行促進 | "サーバーエラーが発生しました" |

### 3. データ処理エラー

| エラー種別 | 原因 | 対応方法 | ユーザー表示 |
|------------|------|----------|--------------|
| JSON解析失敗 | 不正なレスポンス | try-catch | "データ処理エラー" |
| DOM要素不存在 | サイト構造変更 | 早期リターン | （無音で処理継続） |
| 正規表現エラー | 予期しないテキスト | パターン検証 | （無音で処理継続） |

## エラー通知システム

### 1. 通知レベル

#### Error（赤色）
- API認証失敗
- 送信完全失敗
- ネットワークエラー

#### Warning（橙色）
- 部分的な失敗
- 一時的なエラー

#### Info（青色）
- 処理状況の通知
- 成功メッセージ

### 2. 通知メッセージの設計原則

#### ユーザーフレンドリー
```javascript
// ❌ 技術的すぎる
"HTTP 401: Unauthorized"

// ✅ ユーザーが理解しやすい
"APIトークンが無効です"
```

#### 解決方法の提示
```javascript
// ❌ 問題だけ報告
"接続に失敗しました"

// ✅ 解決方法も提示
"ネットワークエラー: インターネット接続を確認してください"
```

#### 適切な緊急度
```javascript
// ❌ すべてエラー扱い
this.showNotification('アニメが見つかりませんでした', 'error');

// ✅ 情報として扱う
this.log('No anime found for title: ${title}');
```

## 回復処理（Recovery Mechanisms）

### 1. 自動リトライ

#### 実装予定（将来の改善）
```javascript
async fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      // 一時的なエラーの場合はリトライ
      if (response.status >= 500 || response.status === 429) {
        await this.delay(Math.pow(2, i) * 1000); // 指数バックオフ
        continue;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await this.delay(Math.pow(2, i) * 1000);
    }
  }
}
```

### 2. グレースフルデグラデーション

#### Webhook失敗時
```javascript
// Webhook失敗してもメイン機能（Annict送信）は継続
const success = await this.recordEpisodeOnAnnict(animeId, episodeNumber);

if (success) {
  // Webhook送信失敗は個別に処理
  if (this.settings.enableWebhook) {
    await this.sendWebhooks(episodeData).catch(error => {
      this.log('Webhook failed but main function succeeded:', error);
    });
  }
}
```

#### API検索失敗時
```javascript
// タイトル完全一致で失敗した場合、部分一致を試行（将来の改善）
let animeId = await this.searchAnimeOnAnnict(exactTitle);
if (!animeId) {
  animeId = await this.searchAnimeOnAnnict(normalizedTitle);
}
```

## ログ出力システム

### 1. ログレベル

#### Debug
```javascript
this.log('Found episode:', episodeData); // デバッグモード時のみ
```

#### Info
```javascript
this.log('Webhook sent successfully'); // 常に出力
```

#### Error
```javascript
console.error('Critical error:', error); // 常に出力
```

### 2. ログ情報の匿名化

#### 個人情報の保護
```javascript
// ❌ APIトークンを直接ログ出力
this.log('Using token:', this.settings.annictToken);

// ✅ マスクして出力
this.log('Using token:', this.settings.annictToken.substring(0, 8) + '***');
```

#### URL の保護
```javascript
// Webhook URLのマスキング
maskUrl(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.hostname}${urlObj.pathname.substring(0, 10)}***`;
  } catch {
    return url.substring(0, 20) + '***';
  }
}
```

## 監視とメトリクス

### 1. エラー率の追跡

#### 実装予定
```javascript
class ErrorTracker {
  constructor() {
    this.errors = new Map();
    this.total = 0;
  }
  
  recordError(type, error) {
    this.total++;
    const count = this.errors.get(type) || 0;
    this.errors.set(type, count + 1);
    
    // 定期的にメトリクスを出力
    if (this.total % 100 === 0) {
      this.reportMetrics();
    }
  }
  
  reportMetrics() {
    for (const [type, count] of this.errors) {
      const rate = (count / this.total * 100).toFixed(2);
      console.log(`${type} error rate: ${rate}%`);
    }
  }
}
```

### 2. パフォーマンス監視

#### レスポンス時間の測定
```javascript
async measureApiCall(apiCall) {
  const start = performance.now();
  try {
    const result = await apiCall();
    const duration = performance.now() - start;
    this.log(`API call took ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    this.log(`API call failed after ${duration.toFixed(2)}ms`);
    throw error;
  }
}
```

## 今後の改善計画

### 短期（1-2週間）
- [ ] 自動リトライ機能の実装
- [ ] より詳細なエラー分類
- [ ] オフライン検知機能

### 中期（1-2ヶ月）
- [ ] エラー率の自動監視
- [ ] ユーザーフィードバック収集
- [ ] A/Bテストによるエラーメッセージ最適化

### 長期（3-6ヶ月）
- [ ] 機械学習によるエラー予測
- [ ] プロアクティブなエラー防止
- [ ] 詳細な分析ダッシュボード

これらのエラーハンドリング改善により、ユーザーにとって信頼性が高く、使いやすい拡張機能を提供しています。