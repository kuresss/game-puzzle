# GAME1 Puzzle

15 パズルの Web / Capacitor (Android) プロジェクトです。

## 構成

### アプリ本体（Web / Capacitor 共通）

- `index.html`: アプリの HTML
- `styles.css`: 画面スタイル
- `script.js`: 15 パズル本体、永続化、入力連携
- `src/puzzleCore.js`: 15 パズルの盤面判定、移動、シャッフル（純粋関数）
- `src/inputControls.js`: 矢印キーとスワイプ入力
- `src/ads/AdManager.js`: `@capacitor-community/admob` の薄いラッパー
- `src/purchase/handleRemoveAdsPurchase.js`: 広告削除購入成功時の連携点
- `src/config/adIds.js`: AdMob 広告ユニット ID（現在はテスト ID）
- `assets/icon.png`, `assets/splash.png`: アプリ用画像
- `www/`: `npm run build` で生成される Capacitor 用 Web アセット

### Android ネイティブ

- `android/`: Capacitor が生成した Android プロジェクト一式
- `capacitor.config.json`: Capacitor 設定（`appId` = `com.game1.puzzle`、`webDir` = `www`）

### ドキュメント

- `docs/SPECIFICATION.md`: アプリ全体の現状仕様
- `docs/GAME_SPEC_FOR_AI_REVIEW.md`: 15 パズルのゲーム仕様（レビュー用）
- `docs/QA_REVIEW.md`: 直近の品質レビュー記録
- `docs/HARNESS_DESIGN.md`: 設計 / 実装 / レビューを回すハーネス設計
- `docs/HARNESS_RUNBOOK.md`: ハーネスの実行手順
- `docs/PRIVACY_POLICY.md`: プライバシーポリシーの文面ドラフト
- `docs/STORE_LISTING.md`: Google Play ストア掲載テキストと素材ドラフト
- `docs/tasks/`: 個別タスクごとの実装仕様書
- `docs/templates/`: ローテーション記録テンプレート

### スクリプト / テスト

- `scripts/build-web-assets.js`: `www/` へ Web アセットをコピーするビルドスクリプト（`npm run build`）
- `scripts/harness-check.js`: 無料で実行できる自動チェック（`npm run harness:check`）
- `test/puzzleCore.test.js`: `puzzleCore` の単体テスト（`npm test`、`node:test` 使用）

## 必要環境

- Node.js 20 以上（`node:test` を使用）
- Capacitor 6.2.0 系（`@capacitor/core` / `@capacitor/cli` / `@capacitor/android` いずれも 6.2.0）
- Android 確認時: JDK 17 と Android SDK 34

## 実行

```bash
npm install
npm test
npm start
```

`npm start` は `npm run build` を経由して `www/` を配信します。ソースの `script.js` は esbuild で `www/script.js` にバンドルされ、`@capacitor/core` などの依存モジュールが WebView でも解決できるようになります。

PowerShell の実行ポリシーで `npx` が止まる場合は、直接 `npx.cmd serve www` を使ってください。

## ビルドと Android 同期

```bash
npm run build
npx.cmd cap sync android
npx.cmd cap doctor android
```

`npm run build` は `scripts/build-web-assets.js` を実行し、`index.html` / `styles.css` / `assets/icon.png` / `assets/splash.png` を `www/` にコピーしたうえで、`script.js` を esbuild で `www/script.js` にバンドル出力します。

`android/` は Capacitor で再生成済みです。

アイコンとスプラッシュは `assets/icon.png` / `assets/splash.png` をソースとして Android 各解像度に一括生成できます。

```bash
npm run icons:generate
```

（内部で `@capacitor/assets generate --android` を実行します。`assets/` を更新したら再実行してください。）

## ハーネス

設計、実装、レビュー、再仕様化を 5 回ローテーションで回す手順は `docs/HARNESS_DESIGN.md` と `docs/HARNESS_RUNBOOK.md` にまとめています。各タスク着手前の実装仕様書は `docs/tasks/` に配置しています。

無料で実行できる基本チェックは以下です。いずれも Node.js だけで動作し、`ripgrep` など外部コマンドは不要です。

```bash
npm run harness:check
npm run harness:audit
```

## 広告

AdMob のテスト広告 ID は `src/config/adIds.js` にまとめています。**リリース前に本番 ID へ差し替えてください**。

Web 版では `#banner-ad` は開発確認用の表示領域のみです。ネイティブ広告を表示する場合は、`src/ads/AdManager.js` のラッパーから `@capacitor-community/admob` を呼び出します。

## 保存データ

`localStorage` に以下のキーで保存します。

- `game1_15_puzzle_best_moves`: 最小手数
- `game1_15_puzzle_state`: 盤面と手数
- `remove_ads_purchased`: 広告削除済みフラグ

## プライバシーポリシー

プライバシーポリシーの文面は `docs/PRIVACY_POLICY.md` に配置しています。オーナーのブログに転記後、公開 URL を本セクションに追記します。

本文中には問い合わせ先メールアドレスと公開 URL のプレースホルダーがあります。ブログ掲載前に、`<!-- OWNER_INPUT_NEEDED: ... -->` コメントに従って差し替えてください。
