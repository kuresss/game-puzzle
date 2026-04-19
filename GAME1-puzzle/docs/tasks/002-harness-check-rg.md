# Task 002: harness:check の rg 依存を解消

最終更新日: 2026-04-18
対応タスク: #16 (harness:check の rg 依存を解消)
検出元: `docs/tasks/001-readme-update.md §10.2`
コスト: 無料

## 1. 目的・スコープ

現行の `scripts/harness-check.js` は外部コマンド `rg`（ripgrep）を呼び出して禁止パターン検索を行っている。現環境に `rg` が未インストールで `npm run harness:check` が環境エラーで失敗する。以降のタスクで自動検証を使えるようにするため、rg 依存を解消する。

### 対象

- `scripts/harness-check.js`（禁止パターン検索部分）
- 必要であれば `package.json`（scripts や devDependencies の調整。本タスクでは最小限に留める）

### 対象外

- ほかのテスト・ビルド機構の変更
- 禁止パターンそのものの見直し
- CI 設定の追加

## 2. 前提と制約

- 現 `harness-check.js` が呼び出す他コマンド（`node --check`, `node --test`, `node scripts/build-web-assets.js`）はそのまま残す
- 禁止パターンの内容と検索対象ファイル群は現行と同一にする
- 検索結果のエラーメッセージは、現在の「Unexpected matches found by ...」相当のヒット箇所付き形式を維持（デバッグしやすさ）
- Windows bash / PowerShell / macOS / Linux のいずれでも追加インストールなしで動作すること
- Node 20+ の組み込み API のみ使用（外部パッケージ追加しない）

## 3. 現状の挙動

```javascript
run('rg', [
  '-n',
  disallowedPattern,   // '2048|score-up|game-over|繧|縺|螳|譁|莉墓|TODO|FIXME|single-file demo'
  'index.html',
  'script.js',
  'styles.css',
  'src',               // ディレクトリ再帰
  'README.md',
  'package.json',
], { capture: true, expectNoMatches: true });
```

- rg の exit code: 0 = 一致あり（失敗扱い）、1 = 一致なし（成功）、2+ = エラー
- `expectNoMatches` 分岐で、1 なら return、それ以外は throw
- ディレクトリ `src` は rg が再帰的にスキャン

## 4. 対応案の評価

| 案 | 内容 | 長所 | 短所 |
| --- | --- | --- | --- |
| (a) | rg を前提として各環境にインストール要求 | スクリプト変更不要、既存 rg の速度と堅牢性を享受 | 環境依存が残る。CI やチームメンバー間で導入手順が増える |
| (b) | `node:fs` ベースに書き換え | 追加インストール不要。Node だけで完結 | 実装追加（ファイル列挙と正規表現走査）。速度は劣るが対象が小さいので無視できる |
| (c) | README / HARNESS_RUNBOOK に「rg 要」と明記するだけ | 最小変更 | 環境差が残り、rg 未導入で失敗する現状が再発 |

## 5. 確定事項

### 5.1 採用案: **(b) `node:fs` ベースに書き換え**

理由:
- Node 20+ の組み込み API だけで完結でき、追加インストール不要
- 検索対象ファイルは 6 パス（うち 1 つがディレクトリ）と少なく、パフォーマンス劣化は実質無視できる
- Windows 環境で再現性が高い
- CI 化や他メンバー参加時の障壁を除去

### 5.2 実装仕様

新規関数 `checkDisallowedPatterns(patterns, targets)` を `harness-check.js` 内に定義する。

- 引数
  - `patterns`: 文字列配列（禁止パターンのリテラル）
  - `targets`: ファイルまたはディレクトリのパス配列
- 動作
  1. `targets` 各要素について、ファイルなら読む、ディレクトリなら再帰的に列挙してテキストファイルを読む
  2. 各ファイルを 1 行ずつ走査し、`patterns` のいずれかが含まれる行を収集する
  3. 一致があれば、`path:line:snippet` 形式で連結して `Error` を throw
  4. 一致が 1 件もなければ何も返さず終了
- 再帰対象の拡張子: `.js`, `.mjs`, `.cjs`, `.ts`, `.html`, `.htm`, `.css`, `.md`, `.json`, `.xml`
  - それ以外はスキップ（バイナリ誤読防止）
- 無視対象: `node_modules`, `.git`, `www`, `artifacts`, `android.partial-backup-*`
- 文字コード: UTF-8 で読む（`fs.readFileSync(path, 'utf8')`）
- 大文字小文字の区別: 現行 rg 相当（区別する）
- 検索方式: ループ内で `line.includes(pattern)` または正規表現 `new RegExp(patterns.join('|'), 'g')` 相当。現行の OR 結合と同等

### 5.3 package.json の扱い

- `scripts` エントリ `harness:check` はそのまま（`node scripts/harness-check.js`）
- 追加依存なし
- `engines` は本タスクで触らない（別タスク化）

## 6. 未確定・要オーナー判断

| 項目 | 選択肢 | 推奨 |
| --- | --- | --- |
| README で前提に触れるか | (i) 「rg 不要、Node 20+ のみ」と追記 / (ii) 現状維持 | (i)。Task 001 で触れた rg 依存が解消された旨を残す |
| 禁止パターンのリテラル追加 | (i) 追加しない / (ii) AdMob 本番 ID らしきパターンを追加 / (iii) 他 | (i) 既存維持。拡張は別タスクで検討 |

## 7. 受け入れ基準

| ID | 確認内容 | 合格条件 |
| --- | --- | --- |
| AC-001 | `rg` が PATH になくても実行できる | `which rg` が失敗する環境で `npm run harness:check` が exit 0 |
| AC-002 | 既存の禁止パターンを検出する | 一時的にテスト用ファイルに `TODO` を含めて走らせると、該当行を含む Error が throw される（確認後削除） |
| AC-003 | 現状の成功ケースを維持する | 変更後も `npm run harness:check` が現行 README / script.js / styles.css / src / package.json で一致 0 件、exit 0 |
| AC-004 | 副作用なし | `npm test` 5/5、`npm run build` 成功、`node --check script.js` 成功（現行維持） |
| AC-005 | 外部依存追加なし | `package.json` の dependencies / devDependencies に変更なし、もしくは追加なし |
| AC-006 | エラー出力がデバッグ可能 | 一致があった場合、`path:line:matchedPattern` が最低限含まれる |
| AC-007 | Windows bash で動作 | `C:\Users\tomoda\GAME-puzzle\GAME1-puzzle` の bash セッションで `npm run harness:check` が成功 |

## 8. 外部根拠

- Node.js v20 公式: `fs.readdirSync(dir, { recursive: true, withFileTypes: true })` は v20 で安定版（Node docs）。
- 本タスクで呼び出すのは `node:fs` と `node:path` の既存安定 API のみ。追加の外部仕様照合は不要。

## 9. 想定リスク・未確認

| リスク | 対応 |
| --- | --- |
| 再帰対象拡張子の不足で将来追加されたファイル種別を見落とす | 拡張子リストを関数引数で注入可能にし、将来の追加に備える |
| バイナリ・画像を誤って読む | 拡張子ホワイトリストでブロック |
| 行末コード差（CRLF / LF）による一致漏れ | `includes` ベースなら影響なし。正規表現使用時も対応 |
| 大量ファイルでパフォーマンス劣化 | 対象は小さいので問題ない想定。問題発生時に streaming 読みへ切替 |

## 10. 実装手順（承認後に実施）

1. 推奨に従い未確定事項を確定（(i), (i)）
2. `scripts/harness-check.js` を書き換え:
   - `run('rg', ...)` 呼び出しを削除
   - `checkDisallowedPatterns(disallowedPatterns, targets)` を追加
   - 既存の `node --check`, `node --test`, `node scripts/build-web-assets.js` の呼び出しは維持
3. `npm run harness:check` 実行 → AC-001, AC-003, AC-007 確認
4. 一時ファイルに `TODO` を含めてテスト → AC-002 確認 → 一時ファイル削除
5. `npm test`, `npm run build` で AC-004 確認
6. `package.json` に変更がないこと確認 → AC-005
7. Error 出力形式を確認 → AC-006
8. `docs/tasks/002-harness-check-rg.md §11` に実装後レビュー追記
9. git commit / push

## 11. 実装後レビュー

実施日: 2026-04-18

### 11.1 受け入れ基準結果

| ID | 結果 | 確認方法 |
| --- | --- | --- |
| AC-001 | Pass | `which rg` が失敗する環境（本環境）で `npm run harness:check` が exit 0 で完走 |
| AC-002 | Pass | 一時ファイル `src/_ac002_probe.js` に `TODO` を含めて走行 → `src\_ac002_probe.js:2: [TODO] // TODO: remove this file after verification.` が検出され throw された。プローブ削除後に再走行して合格確認済み |
| AC-003 | Pass | クリーン状態で `npm run harness:check` が exit 0。テスト 5/5 pass、build 成功、禁止パターン検索 0 件 |
| AC-004 | Pass | `npm test` 5/5（harness:check 内で実行）、`node scripts/build-web-assets.js` 成功（harness:check 内で実行） |
| AC-005 | Pass | `git diff package.json` が空。dependencies / devDependencies / scripts いずれも変更なし |
| AC-006 | Pass | エラー出力形式: `path:line: [pattern] matched_line`。path, line, matched pattern, 行内容が含まれる |
| AC-007 | Pass | Windows bash セッション（`C:\Users\tomoda\GAME-puzzle\GAME1-puzzle`）で成功 |

### 11.2 副次的な変更

- `README.md §ハーネス` に「Node.js だけで動作し、ripgrep など外部コマンドは不要」の 1 行を追記（仕様書 §6 (i)）。

### 11.3 検出された別件

なし。

### 11.4 判定

Pass。`rg` 依存は完全に除去され、以降のタスクで `npm run harness:check` を自動検証として使える状態になった。

