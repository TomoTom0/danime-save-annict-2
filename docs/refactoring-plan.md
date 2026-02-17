# Refactoring Plan

## Overview

このドキュメントは、danime-save-annict-2のリファクタリング計画を記載しています。

### Current Status
- **Version**: 0.6.4.0
- **Main Issues**:
  - `src/scripts/index.ts`: 775行の単一ファイルに全機能が集中
  - 責務が不明確で保守性が低い
  - テストが書きにくい
  - 新機能追加が困難

### Goals
- 責務の明確化とモジュール分割
- テストカバレッジの向上
- 保守性・拡張性の向上
- ドキュメントの整備

## Phase 1: Planning and Documentation

### TASK-26: リファクタリング計画書の作成
- **Status**: WIP
- **Goal**: 今回作成したリファクタリング計画を正式なドキュメントとして保存する
- **Deliverables**:
  - `docs/refactoring-plan.md` (このファイル)
- **Expected Outcome**: リファクタリングの全体像が明確になり、進捗管理が容易になる

## Phase 2: Code Restructuring

### TASK-19: index.tsのモジュール分割
- **Status**: TODO
- **Goal**: 775行のindex.tsを責務ごとに分割して保守性を向上させる
- **Dependencies**: なし
- **Priority**: High

#### 新しいディレクトリ構成
```
src/
  modules/
    sites/
      danime.ts     - dアニメストア固有のロジック
      amazon.ts     - Amazon Prime Video固有のロジック
      abema.ts      - AbemaTV固有のロジック
    api/
      annict.ts     - Annict API通信
      webhook.ts    - Webhook送信
    storage/
      storage.ts    - Chrome Storage管理
    ui/
      notification.ts - 通知UI（showMessage等）
    utils/
      string.ts     - 文字列処理（remakeString, kanji2arab等）
      parser.ts     - データパース処理
  scripts/
    index.ts        - エントリーポイント（各モジュールを統合）
```

#### Expected Benefits
- 責務の明確化
- テストが書きやすい
- 保守性の向上
- 新機能追加が容易

### TASK-20: 共通の型定義の集約
- **Status**: TODO
- **Goal**: プロジェクト全体で使用する型定義を一箇所に集約して型の一貫性を保つ
- **Dependencies**: TASK-19と並行可能
- **Priority**: High

#### 新しいディレクトリ構成
```
src/
  types/
    index.ts      - 全ての型をエクスポート
    watching.ts   - WatchingEpisode等
    work.ts       - WorkInfo等
    storage.ts    - ストレージ関連の型
    webhook.ts    - Webhook関連の型
    site.ts       - サイト別の型
```

#### Current Issues
- 型定義が各ファイルに散在
- 同じような型が重複定義されている可能性

#### Expected Benefits
- 型の一元管理
- インポートの簡潔化
- 型の再利用性向上

## Phase 3: Test Migration

### TASK-21: テストファイルのTypeScript移行
- **Status**: TODO
- **Goal**: tests/配下の全てのJavaScriptテストをTypeScriptに移行する
- **Dependencies**: なし（Phase 2と並行可能）
- **Priority**: Medium

#### 対象ファイル
- `tests/unit/index.test.js` → `index.test.ts`
- `tests/unit/options.test.js` → `options.test.ts`
- `tests/integration/workflow.test.js` → `workflow.test.ts`
- `tests/setup.js` → `setup.ts`

#### Required Work
1. `@types/jest`のインストール
2. `tests/tsconfig.json`の作成
3. 各ファイルの`.ts`化と型定義追加
4. `package.json`のtestスクリプト更新

#### Expected Benefits
- 本体コードと同じTypeScriptで記述
- テストコードの型安全性向上
- リファクタリング時のエラー検出

## Phase 4: Test Coverage Improvement

### TASK-22: テストカバレッジの測定と向上
- **Status**: TODO
- **Goal**: Jestのカバレッジ機能を有効化し、カバレッジ80%以上を目指す
- **Dependencies**: TASK-21推奨（並行可能）
- **Priority**: Medium

#### Current Status
- 28テストが存在
- カバレッジ未測定

#### Implementation
1. `package.json`にカバレッジ設定追加
2. `npm run test:coverage`コマンド作成
3. カバレッジレポート確認
4. カバレッジが低い箇所のテスト追加

#### Target Metrics
- Statement Coverage: 80%以上
- Branch Coverage: 75%以上
- Function Coverage: 80%以上
- Line Coverage: 80%以上

#### Critical Areas
- Annict API通信処理
- Webhook送信処理
- エラーハンドリング

## Phase 5: Module Testing

### TASK-23: モジュール分割後のユニットテスト追加
- **Status**: TODO
- **Goal**: モジュール分割（TASK-19）完了後、各モジュールのユニットテストを追加する
- **Dependencies**: TASK-19完了後に実施
- **Priority**: High

#### Test Structure
```
tests/unit/
  sites/
    danime.test.ts
    amazon.test.ts
    abema.test.ts
  api/
    annict.test.ts
    webhook.test.ts
  storage/
    storage.test.ts
  ui/
    notification.test.ts
  utils/
    string.test.ts
    parser.test.ts
```

#### Minimum Test Requirements per Module
- 正常系のテスト
- 異常系のテスト（エラーハンドリング）
- エッジケースのテスト

## Phase 6: Documentation

### TASK-24: アーキテクチャドキュメントの作成
- **Status**: TODO
- **Goal**: プロジェクトのアーキテクチャ、設計思想、モジュール構成を文書化する
- **Dependencies**: TASK-19, TASK-20完了推奨
- **Priority**: Medium

#### Documents to Create
```
docs/architecture/
  overview.md           - アーキテクチャ概要
  modules.md            - モジュール構成と責務
  data-flow.md          - データフロー図
  api-integration.md    - Annict API連携仕様
  webhook.md            - Webhook仕様
  storage.md            - ストレージ設計
```

#### Content
- システム全体の構成図
- 各モジュールの責務と依存関係
- データフローの説明
- 設計の決定事項と理由
- 制約事項

#### Target Audience
- 新規コントリビューター
- 将来の自分
- レビュアー

### TASK-25: コントリビューションガイドの作成
- **Status**: TODO
- **Goal**: 新規コントリビューターが開発に参加しやすいようにガイドを整備する
- **Dependencies**: なし
- **Priority**: Low

#### Document to Create
`CONTRIBUTING.md`

#### Content
1. 開発環境のセットアップ
2. ブランチ戦略
3. コミットメッセージ規約
4. PR作成ガイドライン
5. コードスタイルガイド
6. テストの書き方
7. レビュープロセス
8. リリースプロセス

#### Additional Items
- ESLint/Prettier設定の追加
- pre-commitフックの設定
- CIの導入検討

## Progress Tracking

### Overall Progress
- Phase 1: Planning and Documentation - **In Progress** (1/1)
- Phase 2: Code Restructuring - **Not Started** (0/2)
- Phase 3: Test Migration - **Not Started** (0/1)
- Phase 4: Test Coverage Improvement - **Not Started** (0/1)
- Phase 5: Module Testing - **Not Started** (0/1)
- Phase 6: Documentation - **Not Started** (0/2)

### Task Status Summary
- Total Tasks: 8
- Completed: 0
- In Progress: 1 (TASK-26)
- TODO: 7

## Next Steps

1. Complete TASK-26 (this document)
2. Start TASK-19 (module splitting) - High Priority
3. Start TASK-20 (type definition consolidation) - Can run in parallel with TASK-19
4. After TASK-19 completion, start TASK-23 (module testing)
5. Start TASK-21 and TASK-22 (can run in parallel)
6. Finally, start TASK-24 and TASK-25 (documentation)

## Notes

- TASK-19とTASK-20は並行して進めることが可能
- TASK-21とTASK-22も並行可能
- TASK-23はTASK-19の完了を待つ必要がある
- TASK-24はTASK-19, TASK-20完了後が望ましい
- TASK-25は独立しており、いつでも着手可能

## Risks and Mitigation

### Risks
1. **Breaking Changes**: モジュール分割により既存の動作が壊れる可能性
   - **Mitigation**: 既存のテストを活用し、各段階で動作確認を実施
2. **Large Scope**: 複数のPhaseにわたる大規模リファクタリング
   - **Mitigation**: Phase単位で進め、各Phase完了ごとにコミット・レビュー
3. **Test Coverage**: 既存のテストカバレッジが不明
   - **Mitigation**: Phase 4で測定し、優先度を調整

### Success Criteria
- 全てのPhaseが完了
- テストカバレッジ80%以上達成
- 既存機能の動作に問題なし
- ドキュメントが整備され、新規コントリビューターが参加しやすい状態

## Version

- **Document Version**: 1.0
- **Created**: 2026-02-16
- **Last Updated**: 2026-02-16
- **Related Version**: 0.6.4.0
