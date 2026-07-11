# Shioriを更新する

更新前に、個人記録を別の場所へバックアップしてください。

```text
content/records/
public/images/records/
src/site.config.ts
```

上流へのPull RequestやIssueへ、個人記録の本文・画像・設定を添付しないでください。

## Forkから作った場合

GitHub上で自分のリポジトリを開き、**Sync fork** → **Update branch** を選びます。競合がなければ、そのまま上流の更新が入ります。

競合が表示された場合は、更新前にバックアップを取り、次のファイルを自分側として保持します。

- `content/records/**`
- `public/images/records/**`

`src/site.config.ts` が競合した場合は、古いファイルを丸ごと残さないでください。新しい上流版の項目構成を採用し、バックアップから `name`、`owner`、`description`、`timezone`、`profile` など自分の値だけを移します。これにより、新バージョンで追加された設定項目を失いません。

`src/` のその他のファイル、`AGENTS.md`、`content/_templates/`、`scripts/`、`tests/`、設定ファイルは、基本的に新しい上流側を採用します。解決後に `npm run validate` を実行してください。

コマンドラインの場合：

```bash
git remote add upstream https://github.com/birdrock621-max/Shiori.git
git fetch upstream
git merge upstream/main
npm ci
npm run validate
```

すでに `upstream` があれば最初の行は不要です。競合を理解できない場合はpushせず、バックアップとエラー内容をAIエージェントまたは詳しい人へ渡してください。

## ImportまたはUse this templateで独立コピーした場合

独立コピーしたリポジトリは上流と自動同期されません。安全で分かりやすい方法は、リリース単位でコア部分だけを更新することです。

1. 自分の記録・画像・`site.config.ts` をバックアップする。
2. Shioriの最新ReleaseからSource codeをダウンロードし、現在のリポジトリとは別のフォルダへ展開する。
3. `CHANGELOG.md` にMigration手順があれば、先に読む。
4. 次のコア部分を新しい版へ置き換える。自分でカスタマイズしたコアファイルがあれば、上書き前に個別に差分を確認する。

```text
.github/
.gitignore
.node-version
AGENTS.md
README.md
CHANGELOG.md
CODE_OF_CONDUCT.md
CONTRIBUTING.md
LICENSE
SECURITY.md
docs/
content/_templates/
src/
scripts/
tests/
public/theme-init.js
public/favicon.svg
public/_headers
public/robots.txt
astro.config.mjs
package.json
package-lock.json
tsconfig.json
```

5. バックアップした `content/records/` と `public/images/records/` がそのまま残っていることを確認する。
6. 新しい `src/site.config.ts` の構造を保ち、バックアップから自分の設定値だけを移す。古いファイルで丸ごと上書きしない。
7. 次を実行する。

```bash
npm ci
npm run validate
```

8. 記録数と画像を含む主要画面を確認し、意図しない個人記録の削除がないことを `git diff` で確認してからcommit・pushする。

## 破壊的変更

front matterやディレクトリ構成が変わる場合は、`CHANGELOG.md` の **Changed** または **Migration** に移行方法を記載します。メジャーバージョンを跨ぐときは、一つずつ順番に更新してください。

## 更新後に記録が消えたように見える

1. `content/records/` にMarkdownが残っているか確認する。
2. `draft: true` になっていないか確認する。
3. `npm run check` でスキーマエラーを確認する。
4. GitHubのcommit履歴から、更新前のファイルを復元する。

Cloudflareの古い成功デプロイも一時的な確認には使えますが、唯一のバックアップにはしないでください。
