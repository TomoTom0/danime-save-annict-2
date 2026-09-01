# ドキュメント構成

## 構成

- `docs/architecture/` — アーキテクチャドキュメント（設計・モジュール構成・データフロー等）。コード構造を変更した場合は該当ファイルを更新する
  - `overview.md` — アーキテクチャ概要
  - `modules.md` — モジュール構成と責務
  - `data-flow.md` — データフロー図
  - `api-integration.md` — Annict API連携仕様
  - `webhook.md` — Webhook仕様
  - `storage.md` — ストレージ設計
- `docs/dev/` — 開発プロセス関連ドキュメント
  - `feature/` — 技術的負債の記録（`<カテゴリ>-<概要>.md`）。詳細は `~/.claude/CLAUDE.md` の「技術的負債の管理」を参照
  - 進捗・タスク管理は`tm`で行う（マークダウンでの独自タスク採番は行わない）
- `docs/changelog/` — リリースごとの変更履歴（`unreleased.md` 等）。未作成の場合はリリース準備時に作成する

## 更新タイミング

| ドキュメント | 更新タイミング |
|---|---|
| `docs/architecture/*.md` | `src/modules/` 配下の構成やAPI連携仕様を変更したとき |
| `docs/dev/feature/*.md` | PRレビューで指摘されたが即対応しない改善提案が出たとき |
| `docs/changelog/unreleased.md` | tmタスクを完了（`tm finish`）したとき |
