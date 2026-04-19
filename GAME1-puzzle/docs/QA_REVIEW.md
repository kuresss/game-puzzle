# QA Review

実施日: 2026-04-18  
対象: GAME1 Puzzle 0.1.0  
確認環境: Android Emulator `emulator-5554`, Android SDK 34, Capacitor Android

## 1. ハルシネーション確認

### 外部根拠

15 パズルの定義について、以下の外部情報と照合した。

- Britannica: Fifteen Puzzle は 1 から 15 までの番号と 1 つの空きマスを持ち、スライドで数順に戻すパズルとして説明されている。
- Wikipedia: 15 puzzle は 4x4 の枠、1 から 15 のタイル、1 つの空き位置を持ち、数順に並べることを目的とする sliding puzzle と説明されている。
- Simon Tatham's Portable Puzzle Collection: Fifteen は 4x4、15 枚の番号タイル、1 つの空きマス、隣接タイルを空きマスへ滑らせるルールとして説明されている。

### 判定

現在のゲーム仕様、仕様書、実装は、15 パズルの中核ルールと矛盾していない。

### 修正した不整合

- `docs/SPECIFICATION.md` の Web 資産コピー欄に `assets/` 全体をコピーすると読める記述があったが、実装は `assets/icon.png` と `assets/splash.png` のみをコピーしているため修正した。
- `docs/SPECIFICATION.md` の外部根拠欄で、年代表現の出典が過剰に読める箇所を修正した。
- `README.md` の広告説明を、ネイティブ広告が自動表示されるように読めない表現へ修正した。

## 2. 静的チェック

| 確認 | 結果 |
| --- | --- |
| `node --check script.js` | 成功 |
| `npm test` | 5 件成功 |
| `npm run build` | 成功 |
| `npm audit --omit=dev` | 0 vulnerabilities |
| 旧 2048 / 文字化け / TODO 残骸検索 | 対象コードでは検出なし |
| `npx.cmd cap doctor android` | Android looking great |

## 3. 実機操作確認

### 初回起動

- アプリデータをクリアして起動。
- 白画面で停止せず、盤面が表示されることを確認。
- 日本語 UI が文字化けせず表示されることを確認。

### 操作

| 操作 | 結果 |
| --- | --- |
| 非隣接タイルをタップ | 手数は増えない |
| 隣接タイルをタップ | 手数が 0 から 1 に増加 |
| スワイプ操作 | 手数が 1 から 2 に増加 |
| アプリ再起動 | 盤面と手数 2 が復元 |
| Shuffle ボタン | 手数が 0 に戻り盤面が変化 |
| DPAD 左入力 | 手数が 0 から 1 に増加 |

### ログ

アプリ/WebView に絞って以下を検索し、該当なし。

- `FATAL EXCEPTION`
- `ANR in com.game1.puzzle`
- `chromium.*Uncaught`
- `chromium.*SyntaxError`
- `chromium.*ReferenceError`
- `chromium.*TypeError`
- `Capacitor.*Error`

## 4. 発見して修正したバグ

### 非隣接タイルが押せるように見える

非隣接タイルを押しても手数は増えなかったが、フォーカス枠が表示され、押せるタイルのように見えていた。

対応:

- 移動可能なタイルだけを有効なボタンに変更した。
- 空きマス、完成済み状態、非隣接タイルは disabled にした。

確認:

- 修正後、非隣接タイルのタップで手数が増えず、紛らわしいフォーカス枠も出ないことを確認。

## 5. 残リスク

- Google Play Billing の実購入フローは未実装。
- AdMob はテスト ID のみで、本番配信は未確認。
- 実機端末では未確認。今回は Android エミュレーターでの確認。
- UI、保存、広告イベントの自動テストはまだ限定的。
- 長時間プレイ、全クリアまでの人力プレイ、複数画面サイズでの網羅確認は今後の追加確認が必要。
