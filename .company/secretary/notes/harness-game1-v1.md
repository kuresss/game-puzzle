# GAME1 Puzzle 品質改善 ハーネス仕様書 v1（大サイクル 1）

作成日: 2026-04-19

## 対象ファイル

| ファイル | 役割 |
|---------|------|
| `src/puzzleCore.js` | 盤面ロジック（シャッフル含む） |
| `src/inputControls.js` | タッチ・キーボード入力制御 |
| `src/ads/AdManager.js` | AdMob ラッパー |
| `src/storage.js` | localStorage 永続化 |
| `script.js` | メインゲームロジック |
| `index.html` | UI マークアップ |

## 発見された問題（精査済み）

### Critical（1件）— 小サイクル 1 で修正

| # | 問題 | ファイル | 行 | 修正方針 |
|---|------|---------|-----|---------|
| C1 | `createShuffledTiles` が再帰。理論上無限ループあり | puzzleCore.js | 78-80 | `while` ループに変換、上限 MAX_RETRIES=10 |

### High（2件）— 小サイクル 2 で修正

| # | 問題 | ファイル | 行 | 修正方針 |
|---|------|---------|-----|---------|
| H1 | `handleTouchEnd` が `canAcceptInput=false` で返るとき touchState をリセットしない。パズルクリア直後に stale な startX/Y が残り次の touchEnd で誤動作の可能性 | inputControls.js | 56-58 | `canAcceptInput=false` のとき touchState をリセットしてから return |
| H2 | `AdManager.loadBanner/loadInterstitial` に try-catch なし。plugin 呼び出し失敗が silent に | AdManager.js | 38, 50 | 各 plugin 呼び出しを try-catch で囲み onError ハンドラに渡す |

### Medium（3件）— 小サイクル 3 で修正

| # | 問題 | ファイル | 行 | 修正方針 |
|---|------|---------|-----|---------|
| M1 | `showClearModal` が `document.getElementById` 直接呼び出し。missing 時に null 参照エラー | script.js | 72-74 | モジュールレベルで `getRequiredElement` を使って定数化 |
| M2 | `saveGameState` が `isSolved` を JSON 保存しているが `loadGameState` で無視している。無駄なデータ保存 | storage.js / script.js | 23-26 | `saveGameState` 呼び出し時に `isSolved` を除外 |
| M3 | `index.html` の aria-label が HTML エンティティの数値参照。人間が読めない | index.html | 17, 20, 23, 26, 30 | 直接 UTF-8 日本語に書き換え |

### Low（1件）— 小サイクル 4 で修正

| # | 問題 | ファイル | 行 | 修正方針 |
|---|------|---------|-----|---------|
| L1 | `UI_TEXT` の日本語が `\u` エスケープ。可読性が低い | script.js | 23-28 | 直接 UTF-8 文字に書き換え |

### 小サイクル 5 — 検証

- `npm test` 全件 pass
- `npm run harness:check` pass
- C1 修正の回帰テスト追加

## 小サイクル計画

| 小サイクル | 対象 | 完了基準 |
|-----------|------|---------|
| 1 | C1: createShuffledTiles iterative | テスト pass、ループなし |
| 2 | H1: touchState reset / H2: AdManager try-catch | 動作確認 |
| 3 | M1: clearModal 定数化 / M2: isSolved 削除 / M3: aria-label | build pass |
| 4 | L1: UI_TEXT UTF-8 化 | テスト pass |
| 5 | 全テスト・harness:check・回帰確認 | pass |
