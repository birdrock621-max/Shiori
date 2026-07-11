# Changelog

このプロジェクトの主な変更を記録します。形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) を参考にし、バージョン番号は [Semantic Versioning](https://semver.org/lang/ja/) に従います。

## [Unreleased]

### Added

- 二枚の地質画像を使い、カーソルへ滑らかに追従する円形スポットライトで別の地層を見せる全画面ヒーロー。
- Playfair DisplayとInterを組み合わせた新しいタイポグラフィ、ガラス状の固定ナビゲーション、モバイルメニュー。
- タッチ端末、短い画面、横向き画面、動きの低減、強制カラーモード、印刷表示への専用調整。
- 地質・地層の世界観を本棚、選択記録、AIエージェント案内までつなぐ編集的なトップページ。

### Changed

- トップページを、明るい二列ヒーローから `100dvh` の没入型ダークヒーローへ再設計。
- ヘッダーをヒーロー上では白いガラス表示、スクロール後は本文向けの明るい表示へ切り替える構成へ変更。
- Cloudflare向けCSPを、指定のHTTPS画像とGoogle Fontsを安全に読み込める設定へ更新。

## [1.0.0] - 2026-07-11

### Added

- 月ごとに記録を並べるレスポンシブな本棚表示。
- キーワード、年、種類、タグ、プロジェクトの複合検索。
- 本棚・一覧表示の切り替えと、検索条件のURL同期。
- 長文、画像、表、コード、引用、タスクに対応した記録ページ。
- 前後の記録、目次、読了時間、完了タスク集計。
- 明るい・暗い・端末追従のテーマ。
- スマートフォン向け横長背表紙と下部ナビゲーション。
- 6種類を網羅する架空サンプル記録。
- Astro Content Collectionsによるスキーマ検証。
- 記録作成CLIと公開安全性を含む検証スクリプト。
- AIエージェント向けの完全な `AGENTS.md`。
- Cloudflare Pagesの最短導入を含む初心者向けREADME。
- セキュリティヘッダー、404、Web App Manifest。
- CI、単体テスト、貢献・セキュリティ・更新ガイド。

[Unreleased]: https://github.com/birdrock621-max/Shiori/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/birdrock621-max/Shiori/releases/tag/v1.0.0
