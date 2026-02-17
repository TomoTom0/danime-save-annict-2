# モジュール構成と責務

## ディレクトリ構成

```
src/
├── manifest.json          # Chrome拡張機能マニフェスト (Manifest V3)
├── html/
│   └── options.html       # オプション画面HTML
├── scripts/
│   ├── index.ts           # Content Script エントリーポイント
│   └── options.ts         # オプションページスクリプト
├── styles/
│   ├── notifications.scss # 通知ダイアログのスタイル
│   └── option.scss        # オプションページのスタイル
├── modules/
│   ├── sites/             # サイト別視聴情報取得
│   │   ├── index.ts       # ファサード
│   │   ├── danime.ts      # dアニメストア
│   │   ├── amazon.ts      # Amazon Prime Video
│   │   ├── netflix.ts     # Netflix
│   │   └── abema.ts       # Abema TV
│   ├── api/               # 外部API連携
│   │   ├── annict.ts      # Annict GraphQL/REST API
│   │   └── webhook.ts     # Webhook送信
│   ├── storage/           # Chrome ストレージ
│   │   └── storage.ts     # ストレージ操作・設定
│   └── utils/             # ユーティリティ
│       └── string.ts      # 文字列変換
└── types/                 # 型定義
    ├── index.ts           # re-export
    ├── site.ts            # サイト固有型 (Amazon)
    ├── storage.ts         # ストレージ型
    ├── watching.ts        # 視聴エピソード型
    ├── webhook.ts         # Webhook設定型
    ├── work.ts            # Annict作品/エピソード型
    └── workInfo.ts        # 作品情報集約型
```

## 各モジュールの責務

### scripts/index.ts
- Content Script のエントリーポイント
- 2秒間隔でポーリングを実行
- 動画要素の監視 (start/end イベント)
- 重複送信の判定ロジック
- 依存: sites, api, storage, ui

### scripts/options.ts
- オプションページの UI ロジック
- フォームからの設定の読み書き
- Webhook 設定の追加・削除
- 依存: storage

### modules/sites/

#### index.ts (ファサード)
- `obtainWatching(videoSite, genreLimit)` を公開
- videoSite に応じて各サイトモジュールに委譲

#### danime.ts
- DOM セレクタ (`.backInfoTxt1`, `.backInfoTxt2`, `.backInfoTxt3`) で視聴情報取得
- URL (`partId=XXXXXYYY`) からworkId/numberFromUrl抽出

#### amazon.ts
- `<script type="text/template">` 内の JSON (isElcano) を解析
- `<h2 class="subtitle">` からエピソード番号・タイトル抽出
- `genreLimit` フラグでアニメ以外をフィルタリング

#### netflix.ts
- `.video-title>div` の h4 (作品名) と span (エピソード情報) を解析

#### abema.ts
- `<script type="application/ld+json">` の JSON-LD (itemListElement) を解析
- URL (`episode/WORKID_...`) から workId 抽出

### modules/api/

#### annict.ts
- `fetchWork(title, token)`: GraphQL API で作品検索
- `checkTitleWithWorkId(episode, nodes)`: VOD ID 照合で候補絞り込み
- `identifyWork(episode, token)`: 作品・エピソードの同定
- `obtainWork(episode, token)`: 結合エピソード (1～3話等) への対応
- `sendAnnict(workInfo, items)`: Annict REST API へ視聴記録 POST

#### webhook.ts
- `checkWebhookSettings(settings)`: Webhook 設定の正規化
- `post2webhook(args, items)`: Webhook エンドポイントへ POST

### modules/storage/storage.ts
- `getSyncStorage(keys)`: Chrome ストレージから設定値取得
- `setSyncStorage(items)`: Chrome ストレージへ設定値保存
- `obtainVideoSite()`: 現在の URL からサイト種別を判定
- `inputObj`: デフォルト設定値
- `webhookDefaultSetting`, `webhookDefaultString`: Webhook 設定のデフォルト値

### modules/ui/notification.ts
- `debugLog(...args)`: デバッグログ出力 (DEBUG_MODE=false で無効)
- `showMessage(message, dialog?)`: 通知ダイアログにメッセージ表示
- `fadeIn(dialog)` / `fadeOut(dialog, delay)`: アニメーション制御
- `loadNotificationStyles()`: 通知スタイルシートの動的読み込み

### modules/utils/string.ts
- `kanji2arab(str)`: 漢数字をアラビア数字に変換
- `remakeString(str, mode)`: 全角→半角変換、カギ括弧削除等
- `title2number(str)`: 文字列から最初の数値を抽出
- `checkTitle([a, b], mode)`: 2つのタイトルの一致度チェック
- `splitTitle(str)`: タイトルをトークン分割

## 依存関係

```
index.ts
├── sites/index.ts → sites/danime.ts
│                 → sites/amazon.ts
│                 → sites/netflix.ts
│                 → sites/abema.ts
│                    └── utils/string.ts
├── api/annict.ts → api (utils/string.ts, ui/notification.ts)
├── api/webhook.ts → (ui/notification.ts, storage/storage.ts)
├── storage/storage.ts
└── ui/notification.ts
```
