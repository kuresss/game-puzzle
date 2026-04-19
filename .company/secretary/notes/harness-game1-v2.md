# GAME1 Puzzle 品質改善 ハーネス仕様書 v2（大サイクル 2）

作成日: 2026-04-19

## 発見された問題

### Critical（1件）— 小サイクル 1

| # | 問題 | ファイル | 修正方針 |
|---|------|---------|---------|
| C1 | `'remove_ads_purchased'` ハードコード。STORAGE_KEYS と乖離リスク | handleRemoveAdsPurchase.js:5, test/purchase.test.js:23,38,44 | STORAGE_KEYS をインポートして参照統一 |

### High（3件）— 小サイクル 2-3

| # | 問題 | ファイル | 修正方針 |
|---|------|---------|---------|
| H1 | `banner-ad` aria-label に HTML エンティティ残存 | index.html:42 | 直接 UTF-8「広告バナー領域」に書き換え |
| H2 | `TUTORIAL_KEY` が script.js ローカル。STORAGE_KEYS に未集約 | script.js:30, storage.js | STORAGE_KEYS.tutorialSeen を追加、script.js で import |
| H3 | `createInputController` 戻り値が破棄。destroy/setCanAcceptInput が呼べない | script.js:252 | `const inputController = createInputController(...)` で保持 |

### Low（1件）— 小サイクル 4

| # | 問題 | ファイル | 修正方針 |
|---|------|---------|---------|
| L1 | `GRID_VIEW_LABELS` の値が `\u` エスケープ | gridView.js:4-5 | 直接 UTF-8 に統一 |

## 小サイクル計画

| サイクル | 対象 | 完了基準 |
|---------|------|---------|
| 1 | C1: STORAGE_KEYS 統一（handleRemoveAdsPurchase + test） | テスト pass |
| 2 | H1: banner-ad aria-label UTF-8 / H2: TUTORIAL_KEY を STORAGE_KEYS へ | build pass |
| 3 | H3: inputController 戻り値保持 | テスト pass |
| 4 | L1: gridView.js \u エスケープ → UTF-8 | テスト pass |
| 5 | 全テスト・harness:check・PASS 確認 | 36件 pass、禁止パターン 0 |
