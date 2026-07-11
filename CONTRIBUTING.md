# Shioriへの貢献

不具合報告、アクセシビリティ改善、表示性能の改善、ドキュメント修正、機能提案を歓迎します。

## 最初に確認すること

- セキュリティ上の問題は公開Issueへ書かず、[`SECURITY.md`](SECURITY.md) の方法で報告してください。
- 個人の日記、画像、プロフィール、秘密情報を上流へのPull Requestへ含めないでください。
- 表示確認に記録が必要な場合は、実在の人物・場所・連絡先を含まない架空fixtureを使ってください。
- 大きな情報設計変更は、実装前にIssueで目的と利用者への影響を相談してください。

## 開発環境

- Node.js 22.12以上
- npm 10以上

```bash
git clone https://github.com/birdrock621-max/Shiori.git
cd Shiori
npm ci
npm run dev
```

## 変更前の設計原則

1. 複製してCloudflare Pagesへ接続するだけの導入体験を壊さない。
2. データベース、APIキー、必須環境変数を追加しない。
3. JavaScriptがなくても本文と記録リンクを読めるようにする。
4. 本棚の演出より、検索性、可読性、モバイル性能を優先する。
5. `AGENTS.md` と実際のコンテンツスキーマを一致させる。
6. 0件、少量、数百件のすべてを考慮する。

## Pull Request前の確認

```bash
npm run validate
git diff --check
```

画面に関わる変更では次も確認してください。

- 390px、768px、1440pxで意図しない横スクロールがない。
- キーボードだけで全操作ができ、フォーカスが見える。
- 明るいテーマと暗いテーマの両方で読める。
- `prefers-reduced-motion: reduce` で不要な動きが止まる。
- 長い題名、長文、画像、表、コード、多数のタグで破綻しない。
- 変更前後のスクリーンショットをPull Requestへ添える。

## コードと文書

- 既存のAstro + TypeScript構成を維持します。
- クライアント依存を追加する前に、CSSまたは標準Web APIで解決できないか確認します。
- UI文字列と初心者向け文書は、専門用語だけに頼らず具体的に書きます。
- 新しいfront matter項目を追加した場合は、`src/content.config.ts`、`AGENTS.md`、テンプレート、サンプル、検証スクリプトを同じPull Requestで更新します。
- 生成物の `dist/` と依存関係の `node_modules/` はcommitしません。

## Commit

Conventional Commitsに近い短い形式を推奨します。

```text
feat: add year navigation to archive
fix: keep mobile navigation at viewport bottom
docs: clarify Cloudflare Pages settings
test: cover records with many tags
```

Pull Requestは一つの目的に絞り、何を、なぜ変えたか、どう検証したかを書いてください。
