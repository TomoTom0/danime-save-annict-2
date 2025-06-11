# 変更履歴 (CHANGELOG)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 予定されている変更
- テストカバレッジの向上
- 新しい動画配信サービスへの対応
- バックアップ・リストア機能

## [0.6.6.0] - 2025-06-11

### Added
- 視聴履歴タブでの自動履歴表示機能
- UI要素の優先度に基づく配置改善
- 包括的な.gitignoreファイル

### Changed
- 視聴履歴管理のユーザビリティ向上
- ボタン配置の最適化（主要アクションを上部、二次的アクションを下部に配置）
- READMEドキュメントの技術仕様とリンク強化

### Improved
- 履歴確認のワークフロー改善（タブを開くだけで自動表示）
- 誤操作防止のためのUI設計

## [0.6.5.0] - 2025-06-11

### Added
- モダンなJavaScript（ES6+）による完全リライト
- Manifest V3対応
- クラスベースの設計パターン
- レスポンシブデザインの設定画面
- CSS3アニメーション通知システム
- 複数Webhook URLの動的管理
- 改善されたエラーハンドリング
- デバッグモード機能
- プライバシーポリシー文書
- 包括的なドキュメント体系
- プロジェクト管理ファイル（.clinerules、.todo、.done）

### Changed
- jQuery依存を削除し、ネイティブJavaScriptに移行
- Bootstrap依存を削除し、独自CSSに移行
- iziToast依存を削除し、独自通知システムに移行
- 設定画面のUI/UXを現代的なデザインに刷新
- エラーメッセージとログ出力の改善
- ストレージAPIの最適化

### Removed
- jQuery 3.5.1依存
- Bootstrap CSS/JS依存
- iziToast依存
- 古いManifest V2記法

### Security
- CSP（Content Security Policy）準拠
- HTTPS通信の強制
- セキュアストレージの使用
- 最小権限の原則に基づく権限設定

### Fixed
- Manifest V3での権限問題
- 通知表示の安定性向上
- 重複送信防止機能の改善

## [0.6.4.0] - 2023年以前

### Added
- dアニメストアURL変更への対応
- 重複送信の修正

### Fixed
- dアニメストアのURL変更に伴う動作不良
- 重複記録送信の問題

## [0.6.3.0] - 2023年以前

### Fixed
- 重複送信記録のバグ修正

## [0.6.2.0] - 2023年以前

### Added
- Amazon Prime Video対応
- 劇場版作品対応
- 複数話まとめ作品対応

### Changed
- 作品認識精度の向上

## [0.6.1.0] - 2023年以前

### Added
- AbemaTV対応
- Webhook機能

### Improved
- UI/UXの改善

## [0.6.0.0] - 2023年以前

### Added
- 初期リリース（kakunpcさんのfork）
- dアニメストア対応
- Annict連携機能
- 基本的な設定画面

---

## 変更の種類

- `Added`: 新機能
- `Changed`: 既存機能の変更
- `Deprecated`: 非推奨となった機能
- `Removed`: 削除された機能
- `Fixed`: バグ修正
- `Security`: セキュリティ関連の変更

## リンク形式

[Unreleased]: https://github.com/TomoTom0/danime-save-annict-2/compare/v0.6.5.0...HEAD
[0.6.5.0]: https://github.com/TomoTom0/danime-save-annict-2/compare/v0.6.4.0...v0.6.5.0
[0.6.4.0]: https://github.com/TomoTom0/danime-save-annict-2/releases/tag/v0.6.4.0