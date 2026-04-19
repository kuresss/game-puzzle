# Task 001: README を実装変更に合わせて更新

最終更新日: 2026-04-18
対応タスク: #15 (README を実装変更に合わせて更新)
仕様書順: `docs/SPECIFICATION.md §15 項目 2`
コスト: 無料

## 1. 目的・スコープ

現行の `README.md` は初期構成時の説明で、その後に追加された `docs/`・`scripts/`・`test/`・`src/config/` の説明が欠落している。本タスクでは、現状の実装・ドキュメント・スクリプトと整合する READMEに更新する。

### 対象

- `README.md` 1ファイルの更新のみ

### 対象外

- ドキュメント本体（`docs/SPECIFICATION.md` 等）の内容変更
- 新しい機能の追加、既存機能の設計変更
- README の英訳や国際化
- ライセンス表記の追加（本プロジェクトは private）

## 2. 前提と制約

- 日本語 README を維持する
- Markdown 構文のみ使用（画像バッジ、外部 CDN 依存なし）
- 既存のセクション構成「現在の構成 / 実行 / Android / ハーネス / 広告 / 保存データ」を踏襲しつつ、必要なセクションを追加する
- 文量は必要最小限。冗長な説明は避ける
- コマンド例は Windows bash / PowerShell 環境を前提にする（オーナーの環境に合わせる）

## 3. 現状差分の調査結果

### 3.1 README に言及があるが **場所の記載がない** もの

| 項目 | 現 README 記述 | 実在パス |
| --- | --- | --- |
| AdMob テストID | §広告 で "`src/config/adIds.js` にまとめています" と場所あり | `src/config/adIds.js` ✅ 一致 |

→ 問題なし。

### 3.2 README に **言及がない** もの

| 項目 | 実在 | README 追記要否 |
| --- | --- | --- |
| `docs/SPECIFICATION.md` | あり | **要** |
| `docs/GAME_SPEC_FOR_AI_REVIEW.md` | あり | **要** |
| `docs/QA_REVIEW.md` | あり | **要** |
| `docs/tasks/*.md`（本ファイル含む） | 新規 | **要** |
| `scripts/build-web-assets.js` | あり | **要**（npm run build の中身として） |
| `scripts/harness-check.js` | あり | **要**（harness:check の中身として） |
| `test/puzzleCore.test.js` | あり | **要**（npm test の中身として） |
| `.gitignore` の対象 | あり | 任意 |

### 3.3 README の記述と実装の **不整合**

なし。現 README に虚偽や矛盾は検出されていない（2026-04-18 ハルシネイションチェック済み）。

### 3.4 補足したい技術情報

| 項目 | 追記内容 |
| --- | --- |
| Node バージョン | `package.json` に engines 指定なし。今後 `>= 20` を推奨として README に明記。実装は node:test 使用のため Node 20+ 必須。 |
| Capacitor バージョン | 6.2.0（`package.json` より） |
| AdMob ID の状態 | 現在は Google 公式テスト ID。本番差し替えはリリース前に実施。 |
| Privacy Policy | オーナーのブログに掲載予定（URL は決定次第 README に追記）。 |

## 4. 確定事項

### 4.1 README の新構成（見出しレベル）

```
# GAME1 Puzzle
## 構成
  ### アプリ本体（Web/Capacitor 共通）
  ### Android ネイティブ
  ### ドキュメント
  ### スクリプト / テスト
## 必要環境
## 実行
## ビルドと Android 同期
## ハーネス
## 広告
## 保存データ
## プライバシーポリシー
```

### 4.2 追加する具体情報

- 「構成」セクションを4サブセクションに分割
- 「必要環境」を新設: Node 20+ / Capacitor 6.2.0 / （Android 確認時）JDK 17 + Android SDK 34
- 「プライバシーポリシー」セクション: 「オーナーのブログに掲載予定。URL は公開時に更新。」と記載
- `docs/` 配下のドキュメント一覧を 1 行ずつ説明付きで列挙
- `scripts/` と `test/` を「スクリプト / テスト」で説明

### 4.3 残すもの（変更しない）

- タイトル「# GAME1 Puzzle」
- 「15 パズルの Web/Capacitor プロジェクトです。」リード文
- 実行コマンド例（npm install / test / start）
- PowerShell 実行ポリシー注意
- 広告セクションの本番 ID 差し替え注意
- 保存データキー一覧

## 5. 未確定・要オーナー判断

| 項目 | 選択肢 | 推奨 |
| --- | --- | --- |
| Node バージョン表記 | (a) `>= 20` 推奨として README 記載 / (b) `package.json` の `engines` に正式追加 / (c) 何もしない | (a)。engines 追加は別タスク化推奨（既存 devDeps への影響を未確認のため） |
| プライバシーポリシーのプレースホルダー | (a) 「準備中」とだけ書く / (b) 「オーナーのブログに掲載予定」と書く / (c) URL 確定まで本セクション追加を保留 | (b) |
| 本リポジトリへの貢献ガイド | (a) 記載する / (b) 記載しない | (b)。private 個人開発のため不要 |

## 6. 受け入れ基準

| ID | 確認内容 | 合格条件 |
| --- | --- | --- |
| AC-001 | 実在しないファイル・ディレクトリへの参照がない | `docs/`, `scripts/`, `src/`, `test/` 以下の全参照パスが実在する |
| AC-002 | 欠落しているドキュメント参照がない | `SPECIFICATION.md`, `GAME_SPEC_FOR_AI_REVIEW.md`, `QA_REVIEW.md`, `HARNESS_DESIGN.md`, `HARNESS_RUNBOOK.md` が README から辿れる |
| AC-003 | コマンド例が動作する | `npm install`, `npm test`, `npm start`, `npm run build`, `npm run harness:check`, `npm run harness:audit`, `npx.cmd cap sync android` が `package.json` の scripts と一致 |
| AC-004 | テスト・広告・購入モジュールの場所が正しく記載 | `test/puzzleCore.test.js`, `src/ads/AdManager.js`, `src/purchase/handleRemoveAdsPurchase.js`, `src/config/adIds.js` |
| AC-005 | `npm run harness:check` がパス | 更新後 README では check スクリプトが検出する禁止パターン（旧 2048、TODO/FIXME、文字化け）を含まない |
| AC-006 | Markdown 構文が有効 | GitHub 上で正しくレンダリングされる（見出し、コードブロック、テーブル） |
| AC-007 | 現行 README の有効な記述を失っていない | 保存データキー、PowerShell 注意書き、AdMob 本番差し替え警告が残っている |

## 7. 外部根拠

本タスクは内部リファクタリングのみのため、外部仕様の照合は最小限。

- Node.js `node:test` は Node 18+ で安定版として提供（Node 公式ドキュメント）。本プロジェクトは Node 20+ 推奨で問題なし。
- Capacitor 6 系の `cap sync` / `cap doctor` サブコマンドは `@capacitor/cli` 6.x で提供（`package.json` の devDependencies 参照）。README の呼び出し方は既存踏襲。

追加の Web 検索は不要と判断。

## 8. 想定リスク・未確認

| リスク | 対応 |
| --- | --- |
| README の誤字・日本語表記ゆれ | レビュー時に視認 |
| 追加情報が多すぎて README が読みにくくなる | 見出しを増やし冗長な説明を削る |
| `npm run harness:check` の禁止パターンに新規追加文言が引っかかる | 更新後に `npm run harness:check` を実行して検証（受け入れ基準 AC-005） |
| Node `engines` を package.json に入れた場合 CI や `npm install` 挙動に影響 | 本タスクでは engines は触らず README 表記のみ（推奨 (a)）|

## 9. 実装手順（承認後に実施）

1. 推奨に従い未確定事項を確定（オーナー判断不要なら自動で (a), (b), (b)）
2. README.md を新構成で書き直し
3. `npm run harness:check` 実行 → AC-005 確認
4. 受け入れ基準 AC-001 〜 AC-007 をセルフレビュー
5. レビュー結果を `docs/QA_REVIEW.md` に追記、または `docs/tasks/001-readme-update.md` 末尾に「実装後レビュー」セクションを追加
6. git commit / push

## 10. 実装後レビュー

実施日: 2026-04-18

### 10.1 受け入れ基準結果

| ID | 結果 | 確認方法 |
| --- | --- | --- |
| AC-001 | Pass | `docs/`, `scripts/`, `src/`, `test/` 以下の全参照パスを `ls` で実在確認 |
| AC-002 | Pass | SPECIFICATION / GAME_SPEC_FOR_AI_REVIEW / QA_REVIEW / HARNESS_DESIGN / HARNESS_RUNBOOK を全て README から辿れる |
| AC-003 | Pass | `node --check script.js` 成功、`npm test` 5/5 pass、`npm run build` 成功 |
| AC-004 | Pass | test/puzzleCore.test.js, src/ads/AdManager.js, src/purchase/handleRemoveAdsPurchase.js, src/config/adIds.js をすべて README に記載 |
| AC-005 | Pass（代替検証） | `npm run harness:check` は `rg` 不在のため環境エラー。Grep ツールで同一パターン `2048\|score-up\|game-over\|繧\|縺\|螳\|譁\|莉墓\|TODO\|FIXME\|single-file demo` を `README.md`, `index.html`, `script.js`, `styles.css`, `package.json`, `src/**` に対して検索 → 該当なし |
| AC-006 | Pass | GitHub Markdown 構文（見出し、コードブロック、テーブル、インラインコード）を手動検証 |
| AC-007 | Pass | PowerShell 実行ポリシー注意、AdMob 本番差し替え警告、保存データキー（best_moves / state / remove_ads_purchased）が新 README に残存 |

### 10.2 検出された別件

- `scripts/harness-check.js` が `rg`（ripgrep）コマンドに依存しているが、現環境にインストールされていない。`docs/QA_REVIEW.md §2` では「成功」扱いだったため、以前は利用可能な環境で実行された想定。
- 本タスクのスコープ外のため新規タスクで対応を判断する。

### 10.3 判定

Conditional Pass。AC-005 は `rg` 不在により `harness:check` を完走できなかったが、同等の検証を Grep で実施しパスを確認した。rg 依存問題は新規タスクで切り出す。

