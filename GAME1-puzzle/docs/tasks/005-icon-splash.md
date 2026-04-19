# Task 005: 実画像のアイコン・スプラッシュを Android へ反映

最終更新日: 2026-04-18
対応タスク: #5 (実画像のアイコン・スプラッシュを差し替え)
仕様書順: `docs/SPECIFICATION.md §15 項目 7（アイコン部分）`
コスト: 無料

## 1. 目的・スコープ

`assets/icon.png` （512x512）と `assets/splash.png` （2732x2732）は既に完成度の高い 15 パズルデザインが入っているが、Android 側 (`android/app/src/main/res/mipmap-*/ic_launcher*.png` および `drawable*/splash.png`) は Capacitor デフォルトの launcher アイコン（青い X）のままである。

本タスクでは、`assets/` の画像を Android 各解像度の mipmap / drawable へ反映し、エミュレーターやインストール時に正しいアイコン・スプラッシュが表示されるようにする。

### 対象

- Android launcher icon の全解像度 (`mipmap-mdpi` 〜 `mipmap-xxxhdpi`、`ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`)
- Android splash drawable の全解像度 (`drawable-*`, `drawable-port-*`, `drawable-land-*`)
- 上記を自動再生成できる仕組み（将来 `assets/` を更新した際に再実行可能）

### 対象外

- `assets/icon.png` / `assets/splash.png` そのもののデザイン変更（既に完成）
- iOS 側のアイコン（iOS ビルドはまだ対象外）
- Play Store 用 Feature Graphic / スクリーンショット（Task #10 で別途）

## 2. 前提と制約

- `assets/icon.png` は 512x512 RGBA PNG（確認済み）
- `assets/splash.png` は 2732x2732 RGBA PNG（確認済み）
- Android mipmap の各サイズ要件は Android 公式に従う（48, 72, 96, 144, 192 px など）
- 可能な限り、既存の Capacitor ワークフロー（`@capacitor/assets` 等）を活用し、独自実装を避ける
- 画像リサイズには `sharp` 等のネイティブ依存を持つライブラリを追加してよい（devDependency として。Windows で動かない場合はフォールバックを用意）

## 3. 調査結果

### 3.1 現状

| ファイル | 状態 |
| --- | --- |
| `assets/icon.png` | 15 パズルデザイン（512x512）済 |
| `assets/splash.png` | 15 パズル + "GAME1 Puzzle" タイトル（2732x2732）済 |
| `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` | Capacitor デフォルト（青い X、192x192） |
| `android/app/src/main/res/drawable/splash.png` | Capacitor デフォルト（480x320） |

### 3.2 標準ツール

`@capacitor/assets` は Capacitor プロジェクト向けの公式アイコン・スプラッシュ生成ツール。

- リポジトリ: https://github.com/ionic-team/capacitor-assets
- 使い方: `npx @capacitor/assets generate --android`
- 入力: `assets/icon.png`（1024x1024 推奨だが 512 でも可）, `assets/splash.png`（2732x2732）
- 出力: Android の mipmap-*, drawable-* 全解像度 + iOS 用も必要なら

現行の `assets/` ファイル配置はそのまま `@capacitor/assets` の入力として使える。

### 3.3 ネイティブ依存の懸念

`@capacitor/assets` は `sharp` に依存する。`sharp` は Windows でも prebuilt binary が提供されており、通常は `npm install` で動く。

## 4. 対応案の評価

| 案 | 内容 | 長所 | 短所 |
| --- | --- | --- | --- |
| (a) | `@capacitor/assets` を devDep 追加 | 標準ツール、メンテ楽、iOS 追加時も同じ | devDep 1 件追加（`sharp` 含む ~50MB） |
| (b) | 手動で全サイズを生成・配置 | 追加依存なし | 20 ファイル以上を手作業、再生成不可 |
| (c) | 自前の Node 生成スクリプト | 追加依存なし | `sharp` 等を自分で書く必要がある。実質不可能 |

## 5. 確定事項

### 5.1 採用案: **(a) `@capacitor/assets` を devDep 追加**

理由:
- Capacitor 公式エコシステムの標準ツールで、この用途に最適化されている
- アイコン・スプラッシュの再生成が 1 コマンドで完結（`npm run icons:generate` 等）
- `sharp` は Windows 対応済みで、prebuilt binary により native build 不要の想定
- 無料ツールのため「コスト不要」方針に合致

### 5.2 実装手順

1. `npm install --save-dev @capacitor/assets` で devDep 追加
2. `package.json` に script を追加: `"icons:generate": "npx @capacitor/assets generate --android"`
3. `npm run icons:generate` を実行し、Android mipmap / drawable を更新
4. 生成結果を git で差分確認、期待通りになっているか目視
5. `npx cap sync android` で反映確認（`@capacitor/assets` が直接 android 下に書く場合は不要）
6. README にコマンドを追記

### 5.3 想定される生成内容

`@capacitor/assets` は以下を生成する（公式ドキュメントによる）:

- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)
- 同系統の `ic_launcher_round.png`
- Adaptive icon 対応 `ic_launcher_foreground.png`
- `android/app/src/main/res/drawable*/splash.png` 各解像度

## 6. 未確定・要オーナー判断

| 項目 | 選択肢 | 推奨 |
| --- | --- | --- |
| Adaptive icon の背景 | (i) 単色生成 / (ii) `assets/icon-background.png` を別途用意 | (i)。スタイルシートの `--board` 色で埋める |
| Foreground のマージン | (i) デフォルト / (ii) カスタム | (i)。まず標準で進める |
| `npm install` 失敗時のフォールバック | (i) 手動配置 / (ii) 現状維持 / (iii) 別ツール | 発生時に判断 |

## 7. 受け入れ基準

| ID | 確認内容 | 合格条件 |
| --- | --- | --- |
| AC-001 | `@capacitor/assets` が devDep に追加されている | `package.json` の devDependencies に存在、`npm install` 成功 |
| AC-002 | `icons:generate` スクリプトが `package.json` にある | `npm run icons:generate` で実行可能 |
| AC-003 | Android launcher icon が 15 puzzle デザインに差し替わる | `mipmap-xxxhdpi/ic_launcher.png` の内容が `assets/icon.png` 由来になる（視覚確認）|
| AC-004 | Android splash drawable が 15 puzzle 画像に差し替わる | `drawable-port-xxxhdpi/splash.png` などが `assets/splash.png` 由来になる |
| AC-005 | 既存テストが通る | `npm test` 28/28 pass |
| AC-006 | `harness:check` pass | 禁止パターン検出なし |
| AC-007 | `npm run build` 成功 | www アセットコピーが引き続き成功 |
| AC-008 | README に再生成コマンドが記載されている | 該当セクションが追加されている |

## 8. 外部根拠

- `@capacitor/assets` 公式リポジトリ: https://github.com/ionic-team/capacitor-assets
- Android launcher icon size ガイド: 48/72/96/144/192 px（Android 公式）
- Adaptive icon 仕様（Android 8.0+）: 108x108 dp の foreground + background

## 9. 想定リスク・未確認

| リスク | 対応 |
| --- | --- |
| `sharp` の native build が Windows で失敗する | prebuilt binary でまず試す。失敗なら fallback として手動配置または別ツール検討 |
| `@capacitor/assets` のバージョンが Capacitor 6.x と非互換 | 最新版を試す。非互換なら旧バージョン固定 |
| 生成画像が Play Store ポリシーに合わない（透明領域、円形マスク等） | 目視確認。問題あれば Adaptive icon 再調整 |
| Android プロジェクトに既にある Capacitor デフォルトアイコンの上書きが失敗 | 生成コマンドは既存ファイルを上書きする仕様。git diff で確認 |
| `icons:generate` が `cap sync` を含むかどうか | 公式ドキュメント確認。不要なら single command、必要なら chain |

## 10. 実装手順

1. `npm install --save-dev @capacitor/assets@latest` 実行
2. インストール成否を確認。失敗時は §9 のリスク対応へ
3. `package.json` scripts に `"icons:generate": "npx @capacitor/assets generate --android"` を追加
4. `npm run icons:generate` 実行
5. `git diff` で Android mipmap / drawable の差分を確認
6. AC-003, AC-004 を `Read` tool で視覚確認
7. `npm test` (AC-005), `npm run harness:check` (AC-006), `npm run build` (AC-007) 実行
8. README §Android ネイティブ 付近に `npm run icons:generate` の案内を追加（AC-008）
9. `docs/tasks/005-icon-splash.md §11` に実装後レビュー追記
10. git commit / push

## 11. 実装後レビュー

実施日: 2026-04-18

### 11.1 実装内容

- `@capacitor/assets@^3.0.5` を devDependency に追加
- `package.json` scripts に `icons:generate` を追加
- `npx @capacitor/assets generate --android` で Android 87 ファイル生成（mipmap 各解像度、drawable 各解像度、adaptive icon foreground、dark mode splash 含む）
- `README.md §ビルドと Android 同期` に再生成コマンドの案内を追記

### 11.2 受け入れ基準結果

| ID | 結果 | 確認方法 |
| --- | --- | --- |
| AC-001 | Pass | `package.json` devDependencies に `@capacitor/assets: ^3.0.5`、`npm install` 成功 (329 packages added) |
| AC-002 | Pass | `package.json` scripts に `icons:generate` 追加、`npm run icons:generate` で実行可能 |
| AC-003 | Pass | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` を目視確認 → 15 puzzle デザインに差し替わり |
| AC-004 | Pass | `android/app/src/main/res/drawable-port-xhdpi/splash.png` を目視確認 → "GAME1 Puzzle" ロゴ付きの splash に差し替わり |
| AC-005 | Pass | `npm test` 28/28 pass |
| AC-006 | Pass | `npm run harness:check` 禁止パターン検出 0 件 |
| AC-007 | Pass | `npm run build` 成功 |
| AC-008 | Pass | README に `npm run icons:generate` のコマンド追記済み |

### 11.3 検出された別件

- **npm audit 脆弱性件数の増加**: `@capacitor/assets` 導入に伴い high severity が **2 → 8 件**に増加。Task #14 (npm audit 対応) のスコープが拡大。description を更新して追跡する。

### 11.4 判定

Pass。Android 側のアイコン・スプラッシュが本来のデザインに差し替わり、エミュレーター／実機でのブランド体験が改善される。`icons:generate` により `assets/` を更新すれば再生成が 1 コマンドで可能。

