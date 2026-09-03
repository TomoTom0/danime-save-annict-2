# データフロー

## 視聴記録送信の全体フロー

```
[ブラウザ] 動画サイトを開く
    |
    v
[index.ts] 2秒間隔ポーリング開始
    |
    v
[storage.ts] obtainVideoSite()
    |  URL パターンマッチングでサイト種別を判定
    |
    +-- "danime" / "amazon" / "netflix" / "abema" --> 処理継続
    +-- "" (対象外サイト) --> スキップ
    |
    v
[sites/index.ts] obtainWatching(videoSite, genreLimit)
    |  DOM解析で視聴エピソード情報を取得
    |
    v
[WatchingEpisode オブジェクト]
    {
      site: "danime",
      workTitle: "テストアニメ",
      episodeTitle: "第1話タイトル",
      episodeNumber: "第1話",
      number: 1,
      workId: "12345",
      workIds: [],
      genre: "アニメ"
    }
    |
    v
[index.ts] 前回視聴と比較 (WatchingEpisodeNow != WatchingEpisodeLast)
    |  変化あり → 処理継続
    |
    v
[index.ts] 動画要素 (video) の存在確認
    |  存在しない or WatchingEpisodeが空 → スキップ
    |  (Amazonのみ) video.played.length == 0 (未再生) → スキップ
    |    一覧ページで「続きのエピソード」用のvideo要素が先に用意されるため
    |
    v
[api/annict.ts] obtainWork(WatchingEpisode, token)
    |
    +-- [fetchWork] GraphQL で作品検索
    |     https://api.annict.com/graphql
    |     タイトルの先頭トークンで検索
    |
    +-- [checkTitleWithWorkId] VOD ID照合で候補絞り込み
    |     https://api.annict.com/db/works/{id}/programs
    |     HTML解析でVOD IDを取得してworkIdと照合
    |
    +-- [identifyWork] エピソード同定
    |     タイトル + 番号 の組み合わせで最適なエピソードを選択
    |
    v
[WorkInfo オブジェクト]
    {
      WatchingEpisode: {...},
      nodes: [EpisodeNode],
      webhook: { WatchingEpisode, error: "none" }
    }
    |
    +-- nodes.length == 0 --> エラー通知 + Webhook送信(noWorkMatched等)
    |
    v (nodes.length > 0)
[index.ts] sendingTime秒後(デフォルト300秒=5分)にsendRecord実行
    |  video要素のendedイベントは送信トリガーとして使わない(意図的)
    |  理由: サイトによってはplay/playingイベントが信頼できない(Abema等)ため、
    |        固定時間待機のみを唯一の送信経路とする設計
    |  ended発生時はRecordWillBeSent=falseで送信をブロックし、
    |  lastVideoOverの更新のみ行う(Amazon作品ページでの二重送信防止、eaaa8d8由来)
    |
    v
[index.ts] 重複チェック
    |  IsSuspended / IsSameMovie / IsSplitedEpisode のいずれかが true → スキップ
    |
    v
[api/webhook.ts] post2webhook(webhook, items)
    |  各Webhook設定に対してPOST
    |
    v
[api/annict.ts] sendAnnict(workInfo, items)
    |  各エピソードノードに対して
    |  通常エピソード: POST /v1/me/records
    |  0話エピソード: POST /v1/me/statuses (watched)
    |
    v
[ui/notification.ts] showMessage(result_message)
    |  送信結果をダイアログ表示
    v
完了
```

## Webhook データフロー

```
[error 情報] → [webhookMatchingObj]
  "noWorkMatched"    → "webhookNoMatched"
  "noEpisodeMatched" → "webhookNoMatched"
  "noWorkId"         → "webhookNoWorkId"
  "none"             → "webhookSuccess"

[WebhookSetting] の webhookNoMatched/webhookNoWorkId/webhookSuccess フラグと照合
→ マッチした設定のエンドポイントにのみ POST

[postData]:
  webhookContentChanged = false → 標準フォーマット送信
  {
    workTitle, episodeNumber, episodeTitle,
    vodWorkId, danimeWorkId, site, error
  }

  webhookContentChanged = true → カスタムテンプレートで送信
  webhookContent の各値の {key} プレースホルダーを実際の値に置換
```

## Chrome ストレージのデータ構造

```
sync storage:
  token: string              # Annict アクセストークン
  sendingTime: number        # 記録送信待機時間(秒) デフォルト300
  annictSend: boolean        # Annict送信の有効/無効
  withTwitter: boolean       # Twitter共有
  withFacebook: boolean      # Facebook共有
  webhookSettings: string    # JSON文字列 (Record<string, WebhookSetting>)
  valid_danime: boolean      # dアニメ有効
  valid_amazon: boolean      # Amazon有効
  valid_abema: boolean       # Abema有効
  valid_<site>Annict: boolean   # サイト別Annict送信
  valid_<site>Webhook: boolean  # サイト別Webhook送信
  valid_<site>Genre: boolean    # サイト別ジャンルフィルタ
  lastWatched_<site>: string    # 最後の視聴情報 (JSON)
  lastVideoOver: boolean        # 最後まで視聴したか
```
