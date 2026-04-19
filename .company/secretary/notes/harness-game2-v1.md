# GAME2 Lights Out 品質改善 ハーネス仕様書 v1（大サイクル 1）

作成日: 2026-04-19

## ゲーム概要

**ライツアウト（Lights Out）**
- 5×5 = 25 マスのグリッド
- セルをクリックすると、そのセルと上下左右が ON/OFF 反転
- 全セルを消灯（OFF）にしたらクリア
- 少ない手数でクリアするほど高得点
- ランダムな解ける状態から開始（解済み状態から逆算生成）

## 対象ファイル（新規作成）

| ファイル | 役割 |
|---------|------|
| `src/lightsCore.js` | グリッドロジック純粋関数 |
| `src/storage.js` | localStorage 永続化 |
| `src/gridView.js` | ViewModel 生成 |
| `script.js` | ゲームループ・DOM操作 |
| `index.html` | UI |
| `styles.css` | ダーク＋グロウデザイン |
| `test/lightsCore.test.js` | コアロジックテスト |
| `scripts/build-web-assets.js` | esbuild バンドル |
| `scripts/harness-check.js` | 自動品質チェック |
| `package.json` | 設定 |

## 小サイクル計画

| サイクル | 対象 | 完了基準 |
|---------|------|---------|
| 1 | package.json + lightsCore.js + テスト | npm test pass |
| 2 | index.html + styles.css | 視覚構造完成 |
| 3 | gridView.js + storage.js | テスト pass |
| 4 | script.js + build-web-assets.js + harness-check.js | npm start 動作 |
| 5 | 全テスト・harness:check・ブラウザ確認 | pass |
