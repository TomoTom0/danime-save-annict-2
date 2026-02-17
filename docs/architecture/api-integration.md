# Annict API連携仕様

## 使用APIエンドポイント

### 1. GraphQL API - 作品検索

**URL**: `https://api.annict.com/graphql`
**メソッド**: POST
**認証**: Bearer トークン (Authorization ヘッダー)

**クエリ**:
```graphql
{
  searchWorks(
    titles: "<タイトル>",
    orderBy: { field: WATCHERS_COUNT, direction: DESC }
  ) {
    edges {
      node {
        title
        annictId
        media
        episodes(orderBy: { field: SORT_NUMBER, direction: ASC }) {
          edges {
            node {
              annictId
              sortNumber
              number
              title
            }
          }
        }
      }
    }
  }
}
```

**戻り値**: `WorkNode[]`
**エラー時**: 空配列 `[]` を返す

### 2. Annict DB API - VOD情報取得

**URL**: `https://api.annict.com/db/works/{annictId}/programs`
**メソッド**: GET
**認証**: なし (非公開 REST エンドポイント)

HTML レスポンスを DOMParser で解析し、VOD チャンネルID と外部サービスIDを取得する。

**VODチャンネルID対応表**:
| サイト | チャンネルID |
|--------|------------|
| danime | 241 |
| amazon | 243 |
| netflix | 244 |
| abema | 260 |

### 3. dアニメ REST API - エピソード詳細確認

**URL**: `https://animestore.docomo.ne.jp/animestore/rest/WS030101?partId={workId}{numberFromUrl}`
**メソッド**: GET
**認証**: なし

danime での workId が直接マッチしない場合 (web版など) のフォールバック確認用。
`partTitle` と `partDispNumber` でエピソード一致を確認する。

### 4. Annict REST API - 視聴記録登録

#### 通常エピソードの記録

**URL**: `https://api.annict.com/v1/me/records`
**メソッド**: POST
**パラメータ** (クエリ文字列):
- `episode_id`: エピソードID
- `access_token`: アクセストークン
- `share_twitter`: Twitter共有フラグ
- `share_facebook`: Facebook共有フラグ

#### 0話エピソード (映画・単話作品) のステータス変更

**URL**: `https://api.annict.com/v1/me/statuses`
**メソッド**: POST
**パラメータ** (クエリ文字列):
- `work_id`: 作品ID
- `kind`: "watched"
- `access_token`: アクセストークン

## 作品特定アルゴリズム

### エピソード同定の優先順位

以下の条件を優先順位順に評価し、最初にマッチした条件でエピソードを確定する:

1. workIdが一致 AND エピソードタイトルが一致 AND エピソード番号が一致
2. workIdが一致 AND エピソードタイトルが一致
3. workIdが一致 AND エピソード番号が一致
4. エピソードタイトルが一致 AND エピソード番号が一致
5. エピソードタイトルが一致
6. エピソード番号が一致

### エラーコード

| コード | 意味 |
|--------|------|
| `none` | 正常に特定できた |
| `noWorkMatched` | 作品が見つからなかった |
| `noEpisodeMatched` | エピソードが見つからなかった |
| `noWorkId` | VOD IDマッチングが未確認 |

### 結合エピソードの処理

エピソード番号が `1～3` や `1／2` などの形式の場合:
- 範囲内の各エピソード番号に対して `identifyWork` を実行
- 全エピソードの `nodes` を結合して返す

## タイトルマッチング

`checkTitle([episodeTitle, workTitle], mode)` を使用。

### titleモードの正規化処理 (remakeString)
- 全角英数字 → 半角
- ローマ数字 (Ⅰ→I, Ⅱ→II, ...) → ラテン文字
- カギ括弧 (`「」『』｢｣`) を削除

### タイトル分割 (splitTitle)
- スペース、中点 (・)、括弧 (`(`, `)`, `（`, `）`) で分割
- 先頭トークンで GraphQL 検索
