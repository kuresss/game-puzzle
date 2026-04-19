# ゲームポータル SEO・成長戦略 実装仕様書

**対象URL:** `https://kuresss.github.io/game-puzzle/`
**作成日:** 2026-04-20
**策定プロセス:** Claude Sonnet 4.6 × 3ラウンドのラリーで精査（ハルシネーション注意点を都度明記）

---

## 1. 実装タスク一覧（チェックリスト形式）

### Phase 1: 無料・即効（1〜2日）
- [ ] `sitemap.xml` 作成・配置（ルート直下）
- [ ] `robots.txt` 作成・配置（ルート直下）
- [ ] `index.html` にOGPメタタグ追加（ポータルTOP）
- [ ] 各ゲームの `index.html` にOGPメタタグ追加（13ファイル）
- [ ] `index.html` に `SoftwareApplication` 構造化データJSON-LD追加
- [ ] Google Search Console 所有権確認（メタタグ方式）
- [ ] Search Console にサイトマップ送信

### Phase 2: 外部展開（3〜7日）
- [ ] itch.io にポータルページ作成
- [ ] ふりーむ に代表ゲーム登録（2048 / マインスイーパー）
- [ ] Qiita または Zenn に開発記事投稿

### Phase 3: 拡散（随時）
- [ ] note 記事（全ゲーム紹介）投稿
- [ ] X (Twitter) 告知ポスト
- [ ] OGP画像自動生成スクリプト整備

---

## 2. 施策A: sitemap.xml + robots.txt + OGPメタタグ

### 2-1. `sitemap.xml`

**ファイル:** `/sitemap.xml`（リポジトリルート直下）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://kuresss.github.io/game-puzzle/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://kuresss.github.io/game-puzzle/GAME3-2048/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kuresss.github.io/game-puzzle/GAME4-minesweeper/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kuresss.github.io/game-puzzle/GAME5-memory/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kuresss.github.io/game-puzzle/GAME6-snake/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kuresss.github.io/game-puzzle/GAME7-hitblow/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kuresss.github.io/game-puzzle/GAME8-simon/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kuresss.github.io/game-puzzle/GAME9-flood/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kuresss.github.io/game-puzzle/GAME10-reversi/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kuresss.github.io/game-puzzle/GAME11-mastermind/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kuresss.github.io/game-puzzle/GAME12-connectfour/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kuresss.github.io/game-puzzle/GAME13-mole/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kuresss.github.io/game-puzzle/GAME14-breakout/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kuresss.github.io/game-puzzle/GAME15-hanoi/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### 2-2. `robots.txt`

**ファイル:** `/robots.txt`（リポジトリルート直下）

```
User-agent: *
Allow: /

Sitemap: https://kuresss.github.io/game-puzzle/sitemap.xml
```

### 2-3. OGPメタタグ（ポータルTOP用）

**ファイル:** `/index.html` の `<head>` 内

```html
<!-- SEO基本 -->
<meta name="description" content="13種類の本格パズル・カジュアルゲームを無料でプレイ。2048・マインスイーパー・スネーク・リバーシなどブラウザで即プレイ可能。スマホ対応・オフライン対応・完全無料。" />
<meta name="keywords" content="パズルゲーム,ブラウザゲーム,無料ゲーム,2048,マインスイーパー,スネーク,リバーシ,ハノイの塔" />
<link rel="canonical" href="https://kuresss.github.io/game-puzzle/" />

<!-- OGP (Open Graph) -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://kuresss.github.io/game-puzzle/" />
<meta property="og:title" content="パズルゲーム集 🎮 | 13種類のブラウザゲーム無料プレイ" />
<meta property="og:description" content="2048・マインスイーパー・スネーク・リバーシなど13本。広告なし・登録不要・スマホ対応。" />
<meta property="og:image" content="https://kuresss.github.io/game-puzzle/ogp/portal.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="ja_JP" />
<meta property="og:site_name" content="パズルゲーム集" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="パズルゲーム集 🎮 | 13種類のブラウザゲーム無料プレイ" />
<meta name="twitter:description" content="2048・マインスイーパー・スネーク・リバーシなど13本。広告なし・登録不要・スマホ対応。" />
<meta name="twitter:image" content="https://kuresss.github.io/game-puzzle/ogp/portal.png" />
```

### ⚠️ 注意
- `og:image` のパスは `ogp/` フォルダを作成して画像を配置するまで機能しない（Section 7参照）
- GitHub Pagesはサブディレクトリ構造なので `canonical` は必ずフルURLで記述
- `og:type` はポータルTOP・各ゲームとも `website` で統一（`game` 型はOGP仕様に存在しない）

---

## 3. 施策B: SoftwareApplication 構造化データ

> **VideoGame スキーマを使用しない理由（Round 2ファクトチェック結果）:**
> schema.orgにVideoGameは定義されているが、GoogleのリッチリザルトはSoftwareApplicationのみ公式対応。VideoGameのリッチリザルト効果は不明確なため、確実性が高いSoftwareApplicationを採用。

### 3-1. ポータルページ用（ItemList形式）

**ファイル:** `/index.html` の `</body>` 直前

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "パズルゲーム集",
  "description": "13種類の本格パズル・カジュアルゲームを無料でプレイ",
  "url": "https://kuresss.github.io/game-puzzle/",
  "numberOfItems": 13,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "SoftwareApplication",
        "name": "2048",
        "url": "https://kuresss.github.io/game-puzzle/GAME3-2048/",
        "applicationCategory": "GameApplication",
        "operatingSystem": "Web Browser",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
        "description": "スライドしてタイルを合わせ、2048を目指すパズルゲーム。鬼モードは5×5で8192挑戦。"
      }
    },
    {
      "@type": "ListItem",
      "position": 2,
      "item": {
        "@type": "SoftwareApplication",
        "name": "マインスイーパー",
        "url": "https://kuresss.github.io/game-puzzle/GAME4-minesweeper/",
        "applicationCategory": "GameApplication",
        "operatingSystem": "Web Browser",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
        "description": "地雷を避けながら全てのマスを開けよう。鬼モードは30×20の超巨大フィールド。"
      }
    }
    // ← 残り11ゲームを同形式で position 3〜13 に追加
  ]
}
</script>
```

### 3-2. 各ゲームページ用（2048の例）

**ファイル:** `/GAME3-2048/index.html` の `</body>` 直前

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "2048",
  "url": "https://kuresss.github.io/game-puzzle/GAME3-2048/",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web Browser",
  "inLanguage": "ja",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
  "description": "スライドしてタイルを合わせ、2048を目指すパズルゲーム。鬼モードは5×5で8192挑戦。元に戻す機能付き。スマホ対応。",
  "featureList": ["鬼モード（5×5 / 8192）", "元に戻す機能", "スマホ対応", "オフライン対応"],
  "isAccessibleForFree": true,
  "browserRequirements": "HTML5対応ブラウザ"
}
</script>
```

### ⚠️ 注意
- `aggregateRating` は実際のレビュー数がないうちは追加しない（架空データはGoogleペナルティ対象）
- 構造化データの検証は Google Rich Results Test で必ず確認

---

## 4. 施策C: Google Search Console 登録手順（5ステップ）

**前提:** Googleアカウント `kuresukensuruna@gmail.com` でログイン済みの状態

1. `https://search.google.com/search-console/` でプロパティ追加 → URLプレフィックス → `https://kuresss.github.io/game-puzzle/`
2. 「HTMLタグ」タブ → `<meta name="google-site-verification" content="XXXX..." />` をコピー
3. `/index.html` の `<head>` 内に貼り付け → コミット・プッシュ
4. GitHub Pages反映後（1〜2分）に「確認」ボタンをクリック
5. 左メニュー「サイトマップ」→ `sitemap.xml` と入力して送信

### ⚠️ 注意
- DNSレコード方式は `github.io` サブドメインでは設定不可（独自ドメイン専用）→ **メタタグ方式が唯一の実用選択肢**
- `content` 値は自分のSearch Console画面からコピーすること（本仕様書の値はダミー）

---

## 5. 施策D: 外部サイト登録戦略

### 対象サイト

| サービス | 登録対象 | 優先度 | 備考 |
|---|---|---|---|
| **itch.io** | ポータル全体 + 代表ゲーム2〜3本 | 高 | 英語ページ推奨、海外流入を狙える |
| **ふりーむ** | 2048、マインスイーパー | 中 | 国内向け、審査不確実性あり（登録前に規約確認） |
| **Qiita / Zenn** | 開発記事（技術ブログ） | 中 | 開発者経由のバックリンク獲得 |
| **unityroom** | **対象外** | — | Unity WebGL専用のため除外（Round 2確認済み） |

### 用意するアセット一覧

| アセット | サイズ・形式 | 用途 |
|---|---|---|
| OGP画像（ポータル） | 1200×630px PNG | OGP/itch.io/ふりーむ |
| OGP画像（各ゲーム×13枚） | 1200×630px PNG | 各ゲームページOGP |
| スクリーンショット（各ゲーム×13枚） | 800×600px以上 PNG | itch.io/ふりーむ登録 |
| アイコン画像 | 512×512px PNG | itch.io/ふりーむ登録 |
| ゲーム説明文（英語） | 200文字以内 | itch.io用 |
| ゲーム説明文（日本語） | 200文字以内 | ふりーむ用 |

---

## 6. 施策E: note/X 拡散テンプレート

### note 記事テンプレート

```
【タイトル】無料ブラウザゲーム13本を作りました【パズルゲーム集】

こんにちは。個人で作ったブラウザゲーム集を公開しました。

【収録ゲーム一覧】
🔢 2048（スライドパズル）
💣 マインスイーパー
🃏 神経衰弱
🐍 スネーク
🎯 ヒットアンドブロー
🔵 サイモン
🌊 フラッドフィル
⚫ リバーシ
🔴 マスターマインド
🟡 コネクトフォー
🦔 モグラたたき
🧱 ブロック崩し
🗼 ハノイの塔

【特徴】
✅ 全ゲーム無料・広告なし・登録不要
✅ スマホ・タブレット対応
✅ オフライン対応（PWA）
✅ 全ゲームに「鬼モード」搭載

▶️ プレイはこちら: https://kuresss.github.io/game-puzzle/
```

### X (Twitter) 初回告知テンプレート

```
🎮 ブラウザゲーム13本を無料公開しました！

2048・マインスイーパー・スネーク・リバーシ・ハノイの塔など全13本。
広告なし・登録不要・スマホ対応・オフライン可。

全ゲームに「鬼モード」搭載で歯ごたえあり👹

▶️ https://kuresss.github.io/game-puzzle/

#ブラウザゲーム #無料ゲーム #個人開発 #パズル
```

### ⚠️ 注意
- X はリンク付き投稿のリーチを抑制する傾向あり。リプライにURLを書く方法も有効
- OGP画像が設定されていないとXカードが表示されない → 施策Aを先に実施

---

## 7. OGP画像自動生成（node-canvasビルドスクリプト）

### ディレクトリ構成

```
game-puzzle/
├── scripts/
│   └── generate-ogp.js   ← ビルドスクリプト
├── ogp/                   ← 生成先（.gitignoreに入れないこと）
│   ├── portal.png
│   ├── game3-2048.png
│   └── ... (計14枚)
└── package.json
```

### `scripts/generate-ogp.js`

```js
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const BG = '#0d1b2a', ACCENT = '#00bcd4', MUTED = '#8eacc4', GOLD = '#f59e0b';

const games = [
  { id: 'portal',              emoji: '🎮', title: 'パズルゲーム集',     sub: '13種類のブラウザゲーム無料プレイ' },
  { id: 'game3-2048',          emoji: '🔢', title: '2048',              sub: 'スライドパズル | 鬼: 5×5 / 8192' },
  { id: 'game4-minesweeper',   emoji: '💣', title: 'マインスイーパー',   sub: '地雷回避 | 鬼: 30×20 / 150地雷' },
  { id: 'game5-memory',        emoji: '🃏', title: '神経衰弱',           sub: 'カード合わせ | 鬼: 24ペア' },
  { id: 'game6-snake',         emoji: '🐍', title: 'スネーク',           sub: '壁なし鬼 | 70ms高速モード' },
  { id: 'game7-hitblow',       emoji: '🎯', title: 'ヒットアンドブロー', sub: '数字推理 | 鬼: 5桁 / 6回' },
  { id: 'game8-simon',         emoji: '🔵', title: 'サイモン',           sub: 'パターン記憶 | 鬼: ×2.2速' },
  { id: 'game9-flood',         emoji: '🌊', title: 'フラッドフィル',     sub: '塗りつぶし | 鬼: 20×20 / 18手' },
  { id: 'game10-reversi',      emoji: '⚫', title: 'リバーシ',           sub: 'CPU対戦 | 鬼: minimax 深5' },
  { id: 'game11-mastermind',   emoji: '🔴', title: 'マスターマインド',   sub: 'カラーコード | 鬼: 8色6桁6回' },
  { id: 'game12-connectfour',  emoji: '🟡', title: 'コネクトフォー',     sub: 'CPU対戦 | 鬼: minimax 深6' },
  { id: 'game13-mole',         emoji: '🦔', title: 'モグラたたき',       sub: 'タップ反応 | 鬼: ダミーあり' },
  { id: 'game14-breakout',     emoji: '🧱', title: 'ブロック崩し',       sub: 'アクション | 鬼: ボール2個' },
  { id: 'game15-hanoi',        emoji: '🗼', title: 'ハノイの塔',         sub: '論理パズル | 鬼: 7枚 / 127手' },
];

function drawCard(game) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, W * 0.6, H * 0.5);
  grad.addColorStop(0, 'rgba(0,188,212,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.font = '120px serif';
  ctx.fillText(game.emoji, 80, 220);

  ctx.fillStyle = ACCENT;
  ctx.font = 'bold 80px sans-serif';
  ctx.fillText(game.title, 80, 340);

  ctx.fillStyle = MUTED;
  ctx.font = '36px sans-serif';
  ctx.fillText(game.sub, 80, 420);

  ctx.fillStyle = GOLD;
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('kuresss.github.io/game-puzzle/', 80, 560);

  fs.mkdirSync('ogp', { recursive: true });
  fs.writeFileSync(path.join('ogp', `${game.id}.png`), canvas.toBuffer('image/png'));
  console.log(`✓ ogp/${game.id}.png`);
}

games.forEach(drawCard);
console.log('OGP画像生成完了');
```

### package.json に追加

```json
{
  "scripts": {
    "generate-ogp": "node scripts/generate-ogp.js"
  },
  "devDependencies": {
    "canvas": "^2.11.2"
  }
}
```

### ⚠️ 注意
- Windows環境では `canvas` パッケージのインストールに `node-gyp` が必要。エラーが出た場合は `npm install --global windows-build-tools` を検討
- 日本語フォントは `registerFont()` で明示指定が必要な場合あり
- 生成後に必ず目視確認すること（絵文字の描画はプラットフォーム依存）

---

## 8. 実装優先度ロードマップ

```
Week 1（コスト0・即効）
├── Day 1-2: robots.txt / sitemap.xml 作成
├── Day 2-3: index.html に OGP + 構造化データ追加
├── Day 3:   Search Console 所有権確認 + サイトマップ送信
└── Day 4-5: 各ゲームの OGP メタタグ追加（13ファイル）

Week 2（コスト0・外部展開）
├── Day 1-2: node-canvas で OGP 画像14枚生成
├── Day 3-4: itch.io アカウント作成・ポータル登録
├── Day 5:   ふりーむ に 2048 / マインスイーパー登録
└── Day 6-7: Qiita または Zenn に開発記事投稿

Week 3〜（継続施策）
├── note 記事投稿（全ゲーム紹介）
├── X で週1ゲーム紹介ポスト（13週ローテーション）
└── Search Console でインデックス状況・流入キーワード確認
```

| 優先度 | 施策 | 理由 |
|---|---|---|
| ★★★ | sitemap + robots + Search Console | インデックス化の前提条件 |
| ★★★ | OGPメタタグ | SNS拡散時のCTRに直結。コスト0 |
| ★★☆ | 構造化データ | リッチリザルト獲得の可能性 |
| ★★☆ | itch.io登録 | 英語圏流入ルートの開拓 |
| ★☆☆ | ふりーむ登録 | 国内ユーザー向け補完 |
| ★☆☆ | note/X拡散 | 短期流入に有効だが持続性は低い |
