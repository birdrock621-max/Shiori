# Immersive hero assets

Shioriのトップページは、時間の蓄積を「地層」として表現するため、二枚の画像を重ねています。

## 使用している画像

- Base layer: `https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85`
- Reveal layer: `https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_201152_bba90a12-bf12-459f-91f0-51f237dbaf3b.png&w=1280&q=85`

URLは `src/pages/index.astro` の `BG_IMAGE_1` と `BG_IMAGE_2` に集約しています。別の写真へ変更する場合は、この二つの定数だけを差し替えてください。同じ構図や被写体位置を持つ二枚を選ぶと、スポットライトによる切り替えが自然に見えます。

## 実装上の注意

- 画像はCSS背景として読み込み、本文の読みやすさを保つ暗いオーバーレイを重ねています。
- Reveal layerは `radial-gradient()` のCSSマスクで表示します。毎フレームCanvasを画像化しないため、長時間閲覧時のメモリ負荷を抑えています。
- タッチ端末と `prefers-reduced-motion: reduce` では、スポットライトを見栄えのよい固定位置へ置きます。
- 画像が一時的に取得できない場合も、黒い背景と前景コンテンツは表示されます。
- `public/_headers` のContent Security Policyは、HTTPS画像とGoogle Fontsの読み込みだけを追加で許可しています。
