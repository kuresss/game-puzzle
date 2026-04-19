# Task 003: 自動テストを UI・保存・広告イベントに拡張

最終更新日: 2026-04-18
対応タスク: #12 (自動テストを UI・保存・広告イベントに拡張)
仕様書順: `docs/SPECIFICATION.md §15 項目 3`
コスト: 無料（devDependency を追加しない方針）

## 1. 目的・スコープ

現行の自動テストは `test/puzzleCore.test.js`（5 件、純粋関数のみ）に限定されている。SPECIFICATION §15 項目 3 に従い、**保存ロジック**、**広告イベント発火**、**UI の表示ロジック**まで自動テストを拡張する。

将来の変更時に UI・保存・広告周りのリグレッションを検出できる状態を作るのが目的。

### 対象

- 既存のテスト対象外コードのうち、純粋ロジックとして切り出せるもののテスト追加
- 必要最小限のリファクタリング: `script.js` から保存・広告イベント・描画モデル構築のロジックを独立モジュールに抽出
- テスト追加: `test/storage.test.js`, `test/adEvents.test.js`, `test/gridView.test.js`（仮名）

### 対象外

- ブラウザ・実機での動作確認（Task #11 と #13 が担当）
- E2E テスト（Playwright 等、追加依存が必要）
- AdMob 実 SDK のモック（Task #7 の範囲）
- Capacitor ネイティブ API のテスト

## 2. 前提と制約

- 追加の devDependency は入れない（`jsdom`, `linkedom`, `happy-dom` など導入なし）
- テストは `node:test` + `node:assert/strict` のみで書く
- 既存テスト（`puzzleCore.test.js` 5 件）は壊さない
- `npm run harness:check` が引き続き成功すること
- `script.js` の DOM 依存部分（`document.getElementById`, `addEventListener`, `createElement` 等）は直接テストしない

## 3. 現状コード構造

```
script.js (264 行)
├─ localStorage I/O (loadBestMoves / saveBestMoves / saveGameState / loadGameState / isRemoveAdsPurchased)
├─ 広告イベント (updateAdPlaceholder / requestInterstitialAd)
├─ 描画 (renderScores / renderGrid / renderStatus / render)
├─ ゲームロジック (moveTileAt / moveEmpty / startNewPuzzle / resetBestMoves / completePuzzleIfSolved)
├─ DOM 取得 (getRequiredElement)
└─ 起動 (init / createInputController)

src/puzzleCore.js ← テスト済み（5件）
src/inputControls.js ← テスト対象外（DOM イベント依存）
src/ads/AdManager.js ← テスト対象外（Capacitor SDK 依存、Task #7 の範囲）
src/purchase/handleRemoveAdsPurchase.js ← 対象（localStorage と removeBanner 呼び出し）
```

## 4. 対応案の評価

| 案 | 内容 | 長所 | 短所 |
| --- | --- | --- | --- |
| (a) | `jsdom` 等を devDep 追加し script.js をそのままテスト | DOM を含めた挙動を網羅できる | 新規依存（~40MB）、攻撃面とメンテコスト増 |
| (b) | 純粋モジュール抽出 + `node:test` のみでテスト | 依存追加なし、コード品質向上 | script.js の軽いリファクタが発生 |
| (c) | 現在 import 可能な関数のみテスト追加 | リスク最小 | UI / 保存のカバレッジがほぼ増えない。§15-3 を満たせない |

## 5. 確定事項

### 5.1 採用案: **(b) 純粋モジュール抽出 + `node:test` のみ**

理由:
- オーナー方針「コスト不要」に合致（依存追加なし、無料運用）
- `script.js` の責務分離が進み、今後の変更リスクも低減
- §15-3 の UI・保存・広告イベントを定性的にカバー可能

### 5.2 抽出する新規モジュール

| 新規ファイル | 役割 | 切り出し元 |
| --- | --- | --- |
| `src/storage.js` | `localStorage` の薄いラッパー: best moves / game state / remove-ads flag の読み書き。storage を引数注入（テスト時はモックを渡す） | script.js の loadBestMoves / saveBestMoves / saveGameState / loadGameState / isRemoveAdsPurchased |
| `src/adEvents.js` | `dispatchInterstitialRequested(target)` のみの最小関数。`game1:interstitial-requested` CustomEvent を target に dispatch | script.js の requestInterstitialAd |
| `src/gridView.js` | 描画モデル構築: `buildGridViewModel(state)` が `{ number, className, ariaLabel, disabled, index }[]` を返す。DOM 生成は script.js に残す | script.js の renderGrid の分類ロジック部分（`tile === 0` / `canMove` / `className` 構築） |

### 5.3 script.js の改修

- 上記モジュールを import し、DOM 適用部分（`createElement`, `appendChild`, `textContent`, `classList`）は script.js 内に残す
- 挙動は現状と 1 ビット変わらないこと（受け入れ基準で確認）

### 5.4 追加するテストファイル

| テストファイル | 検証内容 |
| --- | --- |
| `test/storage.test.js` | best moves 保存・復元、不正値の拒否、state 保存・復元、破損 JSON の safe return、remove-ads フラグ真偽判定、null ベストのクリア挙動 |
| `test/adEvents.test.js` | `game1:interstitial-requested` イベントが正しい detail で dispatch される。target に渡した EventTarget で受信できる |
| `test/gridView.test.js` | solved 状態で `disabled` が全 tile に立つ、非隣接 tile の `canMove=false`、隣接 tile の `canMove=true`、空きマスの `className='tile empty'`、number と ariaLabel の組み立て |

**合計**: 最低 15 件以上のテストケース追加を目標（5 + 15 = 20 件）。

## 6. 未確定・要オーナー判断

| 項目 | 選択肢 | 推奨 |
| --- | --- | --- |
| script.js に残す描画コードのテスト | (i) ブラウザで目視確認のみ（#13 通しプレイ確認で担保）/ (ii) 将来 jsdom 導入時まで保留と明記 / (iii) 今スコープで jsdom 導入 | (i)。分割した `gridView.js` で View Model が検証できれば DOM 適用は自明なプラミング |
| `handleRemoveAdsPurchase` のテスト | (i) 含める / (ii) Task #7 広告SDK配線に合わせて拡張 | (i)。localStorage 書き込みと `removeBanner()` 呼び出しの有無を検証可能 |
| モジュール抽出の粒度 | (i) §5.2 の 3 モジュールのみ / (ii) `initGame` / `completePuzzleIfSolved` 等のゲーム進行ロジックも抽出 | (i)。スコープを拡げ過ぎると本タスクが膨張する |

## 7. 受け入れ基準

| ID | 確認内容 | 合格条件 |
| --- | --- | --- |
| AC-001 | 既存 5 件のテストが通る | `npm test` で `puzzleCore.test.js` 全件 pass |
| AC-002 | 追加テスト 15 件以上が通る | storage / adEvents / gridView で合計 15 件以上の `test(...)` が pass |
| AC-003 | `handleRemoveAdsPurchaseSuccess` のテストが含まれる | localStorage への 'true' 書き込みと `removeBanner` 呼び出しを検証 |
| AC-004 | script.js の挙動が現状と同じ | `npm run build` 成功、`node --check script.js` 成功、`npm run harness:check` pass |
| AC-005 | 追加依存なし | `package.json` の dependencies / devDependencies に変更なし |
| AC-006 | 抽出モジュールが独立して import できる | `src/storage.js`, `src/adEvents.js`, `src/gridView.js` が単独で `node -e "import('...')"` できる |
| AC-007 | 禁止パターン検出なし | `npm run harness:check` で新規ファイルにも TODO/FIXME/文字化け等が混入していない |
| AC-008 | `build-web-assets.js` が新規ファイルを漏れなくコピー | `www/src/` に新規 3 モジュールが存在。現行の `src` 丸ごとコピー仕様に依存するので自動で OK の想定だが要確認 |

## 8. 外部根拠

- Node.js `node:test` と `node:assert/strict`: Node 20+ で安定 API。
- Node.js `EventTarget` / `CustomEvent`: Node 19+ でグローバル提供（本環境 Node 22.15.0 で利用可能）。
- CustomEvent `detail` プロパティは標準仕様（WHATWG DOM）。

外部依存（DOM 全体）は避け、純粋 JavaScript API のみを使う。

## 9. 想定リスク・未確認

| リスク | 対応 |
| --- | --- |
| 抽出により import 循環や副作用順が変わる | 抽出モジュールは import のみの pure module とし、top-level 実行を置かない |
| script.js の挙動が僅かに変わる（例: 初期化順） | 既存の render / init フローを変更しない。抽出元の関数シグネチャに合わせる |
| `node:test` で `EventTarget` が期待どおり動かない | Node 22 環境で事前に最小プロトコルテスト可能。差分あれば fallback として手製 EventTarget 的モックに切替 |
| storage モジュールのインターフェースが Web Storage 仕様とずれる | `getItem` / `setItem` / `removeItem` の 3 関数のみを注入点とし、Web Storage の部分集合に限定する |
| テスト追加で harness:check の scanTargets に `test/` が含まれるようになって大量ヒット | 現 scanTargets は `test/` を含まないので影響なし。本タスクでも scanTargets は変えない |

## 10. 実装手順（承認後に実施）

1. 推奨 (i)(i)(i) で未確定事項を確定
2. `src/storage.js` を新規作成 → 3 機能（best moves / game state / remove-ads）
3. `src/adEvents.js` を新規作成 → `dispatchInterstitialRequested(target)` のみ
4. `src/gridView.js` を新規作成 → `buildGridViewModel(state)` のみ
5. `script.js` を改修 → 新規モジュールを import、該当ロジックを置換
6. `test/storage.test.js` 追加（~7 件想定）
7. `test/adEvents.test.js` 追加（~3 件想定）
8. `test/gridView.test.js` 追加（~5 件想定）
9. `npm test` で 20 件以上 pass を確認（AC-001, AC-002, AC-003）
10. `npm run build` で www 反映確認（AC-008）
11. `npm run harness:check` pass（AC-004, AC-007）
12. `git diff package.json` が空（AC-005）
13. `docs/tasks/003-test-expansion.md §11` に実装後レビュー追記
14. git commit / push

## 11. 実装後レビュー

実施日: 2026-04-18

### 11.1 実装内容

- 新規モジュール 3 本: `src/storage.js`, `src/adEvents.js`, `src/gridView.js`
- テストファイル 4 本（`test/purchase.test.js` を追加し 4 本構成に変更）
- `script.js` をリファクタ: STORAGE_KEYS / UI_TEXT 一部 / renderGrid の分類ロジック / requestInterstitialAd を新モジュールへ委譲

### 11.2 受け入れ基準結果

| ID | 結果 | 確認方法 |
| --- | --- | --- |
| AC-001 | Pass | `npm test` で `puzzleCore.test.js` 5/5 pass |
| AC-002 | Pass | 追加 23 件（storage 12 / adEvents 3 / gridView 5 / purchase 3）、合計 28/28 pass |
| AC-003 | Pass | `test/purchase.test.js` 3 件で localStorage 書き込みと `removeBanner` 呼び出し、null 許容を検証 |
| AC-004 | Pass | `node --check script.js`、`npm run build`、`npm run harness:check` いずれも成功 |
| AC-005 | Pass | `git diff package.json` 空。dependencies / devDependencies 変更なし |
| AC-006 | Pass | `node -e "import('./src/storage.js').then(m=>...)"` 等で各モジュールが独立 import 可能、想定 export を確認 |
| AC-007 | Pass | `npm run harness:check` で禁止パターン検出 0 件 |
| AC-008 | Pass | `npm run build` 後に `www/src/` に `adEvents.js`, `gridView.js`, `storage.js` が配置されることを `ls` で確認 |

### 11.3 仕様書からの差分

- テストファイルを 3 本（§5.4）から 4 本に変更（`handleRemoveAdsPurchaseSuccess` 用に `purchase.test.js` を独立させた）。総テスト件数は計画 15 → 実績 23 で仕様書の想定を超過達成。

### 11.4 検出された別件

なし。

### 11.5 判定

Pass。§15-3 の UI（View Model 層）、保存、広告イベントの自動テストが整備され、以降のリファクタ・機能追加でのリグレッション検出基盤が揃った。

