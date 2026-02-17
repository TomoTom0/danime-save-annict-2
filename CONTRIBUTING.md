# コントリビューションガイド

このドキュメントでは、danime-save-annict-2 の開発に参加するための手順を説明します。

## 目次

1. [開発環境のセットアップ](#開発環境のセットアップ)
2. [ブランチ戦略](#ブランチ戦略)
3. [コミットメッセージ規約](#コミットメッセージ規約)
4. [PR作成ガイドライン](#pr作成ガイドライン)
5. [コードスタイルガイド](#コードスタイルガイド)
6. [テストの書き方](#テストの書き方)
7. [レビュープロセス](#レビュープロセス)
8. [リリースプロセス](#リリースプロセス)

---

## 開発環境のセットアップ

### 必要ツール

- Node.js (v18 以上推奨)
- npm
- Google Chrome

### セットアップ手順

```bash
# リポジトリをクローン
git clone https://github.com/TomoTom0/danime-save-annict-2.git
cd danime-save-annict-2

# ルートの依存関係をインストール (ビルドツール)
npm install

# テスト用の依存関係をインストール
cd tests && npm install && cd ..
```

### ビルド

```bash
# 全体ビルド (TypeScript + SCSS + ファイルコピー)
npm run build

# ウォッチモード (開発時)
npm run watch
```

ビルド成果物は `dist/` ディレクトリに出力されます。

### Chrome 拡張機能として読み込む

1. Chrome で `chrome://extensions` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `dist/` ディレクトリを選択

### テスト実行

```bash
# 全テスト実行
npm test

# ユニットテストのみ
cd tests && npm run test:unit

# 統合テストのみ
cd tests && npm run test:integration

# カバレッジ付き
cd tests && npm run test:coverage
```

---

## ブランチ戦略

### ブランチ名の規則

```
feature/<機能名>     # 新機能
fix/<バグ内容>       # バグ修正
refactor/<対象>      # リファクタリング
docs/<対象>          # ドキュメント更新
```

### マージ先

- 開発ブランチ: `dev`
- メインブランチ: `develop`

通常の開発は `dev` ブランチから feature ブランチを切り、`dev` へ PR を送ります。

---

## コミットメッセージ規約

### フォーマット

```
<type>: <summary>

<body> (オプション)
```

### type の種類

| type | 用途 |
|------|------|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `refactor` | リファクタリング (機能変更なし) |
| `docs` | ドキュメントの更新 |
| `test` | テストの追加・修正 |
| `chore` | ビルドツール・設定の変更 |

### 例

```
feat: Netflix対応を追加

Netflixのvideo-titleクラスを解析してエピソード情報を取得する。
```

---

## PR作成ガイドライン

### PR を送る前に

- [ ] `npm run build` でビルドエラーがないことを確認
- [ ] `npm test` で全テストがパスすることを確認
- [ ] カバレッジが閾値 (Statements 80%, Branches 75%, Functions 80%, Lines 80%) を維持していること

### PR の説明文

以下の内容を記載してください:

- **変更内容**: 何を変更したか
- **変更理由**: なぜ変更が必要か
- **テスト方法**: 動作確認の手順
- **スクリーンショット** (UI変更の場合)

---

## コードスタイルガイド

### TypeScript

- **型安全性**: `as` キャストは使用しない。型ガードを使用する
- **`any` 型禁止**: 型ガードを使用する
- **`null` チェック**: オプショナルチェーン (`?.`) と Null 合体演算子 (`??`) を活用する

### 命名規則

- 変数・関数: `camelCase`
- 型・インターフェース: `PascalCase`
- 定数: `camelCase` (TypeScript の const は大文字にしない)

### ファイル構成

新しいサイトへの対応を追加する場合:
1. `src/modules/sites/<sitename>.ts` を作成
2. `src/modules/sites/index.ts` にインポートと分岐を追加
3. `src/modules/storage/storage.ts` の `obtainVideoSite` に URL パターンを追加
4. `src/types/` に必要な型定義を追加
5. `tests/unit/sites/<sitename>.test.ts` を作成

### 禁止事項

- 絵文字の使用 (ソースコード・コミットメッセージ・ドキュメント全般)
- `alert()` / `confirm()` / `prompt()` などのブラウザネイティブダイアログ
- デバッグ用の `console.log` をプロダクションコードに残す (`debugLog` を使用)

---

## テストの書き方

### テストファイルの配置

```
tests/
├── unit/
│   ├── sites/         # サイト別テスト
│   ├── api/           # API連携テスト
│   ├── storage/       # ストレージテスト
│   ├── ui/            # UI テスト
│   └── utils/         # ユーティリティテスト
└── integration/       # 統合テスト
```

### テストの基本構造

```typescript
import { myFunction } from '../../../src/modules/my-module';

describe('myFunction', () => {
  test('正常系: 期待する動作の説明', () => {
    // Arrange
    const input = ...;

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toEqual(expected);
  });

  test('異常系: エラーケースの説明', () => {
    expect(myFunction(null)).toEqual({});
  });
});
```

### テスト対象ごとの注意点

#### サイトモジュール (DOM依存)

jsdom 環境で DOM を設定してテストする:

```typescript
test('DOMから情報を取得する', () => {
  document.body.innerHTML = `<span class="title">テスト</span>`;
  const result = obtainWatchingFromDanime();
  expect(result.workTitle).toBe('テスト');
});
```

#### URL依存のテスト

jsdom 環境では `window.location` を変更できないため、`@jest-environment-options` で URL を設定する:

```typescript
/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://specific-url.com/path"}
 */
```

#### API連携テスト

fetch をモックして使用する:

```typescript
(fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve({ data: { searchWorks: { edges: [] } } }),
});
```

### カバレッジ閾値

| 種別 | 閾値 |
|------|------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

---

## レビュープロセス

1. PR を作成したら、リポジトリオーナー (TomoTom0) にレビューを依頼
2. レビューコメントには 5 営業日以内に対応
3. 承認 (Approve) が得られたら `develop` へマージ

---

## リリースプロセス

### バージョン番号

`package.json` と `manifest.json` のバージョンを更新する。バージョン形式: `X.Y.Z.W`

### リリース手順

1. `develop` ブランチで変更内容を確認
2. `CHANGELOG` に変更内容を記載 (`docs/changelog/`)
3. `npm run build` でビルド
4. `npm test` で全テストパスを確認
5. バージョンを更新 (`manifest.json`, `package.json`)
6. Chrome Web Store へアップロード
