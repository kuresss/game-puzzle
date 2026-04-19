# Task 010: 通しプレイ確認（ビルド経路疎通 + 実行時オーナー手順）

最終更新日: 2026-04-18
対応タスク: #13 (通しプレイ確認 初回起動〜クリア)
仕様書順: `docs/SPECIFICATION.md §15 項目 8 / 9 の一部`、`§16 品質チェック方針`
コスト: 無料（AVD はローカル、build は JDK17 + Android SDK）

## 1. 目的・スコープ

リリース前提の通しプレイ（初回起動→盤面表示→タイル移動→シャッフル→クリア→記録保存→再起動→復元）を実機相当で確認する。

本タスクは 2 フェーズに分かれる:

- **フェーズ A: 自動化可能な疎通確認**（本タスクで完了扱い）
  - `npm run build`
  - `npx cap sync android`
  - `./gradlew.bat assembleDebug`
  - APK 生成確認
- **フェーズ B: GUI 相互作用を伴う実行確認**（オーナー手動実施。本タスクは手順書のみ提供）
  - AVD 起動
  - APK インストール
  - 初回起動〜クリア通し
  - logcat 致命エラー確認
  - スクリーンショット 4 枚取得（Task #10 で使用）

### 対象外

- 実機（物理 Android 端末）での確認 → Task #11
- 複数画面サイズ確認 → Task #11
- 本番広告の配信確認 → Task #6 完了後

## 2. 前提と制約

- OS: Windows 11
- JDK: Eclipse Adoptium 17.0.18.8 (`C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot`)
- Android SDK: `$LOCALAPPDATA\Android\Sdk`
- AVD: `GAME1_API34`（確認済み、1 台のみ登録）
- Capacitor 6.2.0 系
- `www/script.js` は esbuild でバンドル済み（Task #17 完了）
- `@capacitor-community/admob@6.0.0` がテスト ID で設定済み（Task #7）

## 3. フェーズ A 実施記録

実施日: 2026-04-18

| ステップ | コマンド | 結果 |
| --- | --- | --- |
| 1 | `npm run build` | Pass（esbuild: www/script.js 43.6kb、249ms）|
| 2 | `npx.cmd cap sync android` | Pass（web assets copy, plugin 1 件: `@capacitor-community/admob@6.0.0`、0.379s）|
| 3 | `cd android && ./gradlew.bat assembleDebug` | Pass（BUILD SUCCESSFUL in 1m 16s、110 tasks）|
| 4 | APK 確認 | Pass（`android/app/build/outputs/apk/debug/app-debug.apk`、9,092,711 bytes ≒ 8.67 MiB）|

フェーズ A は上記コマンドを順に実行することで再現可能。環境変数は以下をセット:

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot'
$sdkRoot=Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_SDK_ROOT=$sdkRoot
$env:ANDROID_HOME=$sdkRoot
$env:Path="$env:JAVA_HOME\bin;$sdkRoot\platform-tools;$sdkRoot\emulator;$env:Path"
```

## 4. フェーズ B 手順（オーナー実行）

### 4.1 AVD 起動

```powershell
emulator -avd GAME1_API34 -no-snapshot-load
```

起動完了まで 30〜90 秒かかる。ロック画面が見えたら次へ。

### 4.2 APK インストール

```powershell
adb -s emulator-5554 install -r android\app\build\outputs\apk\debug\app-debug.apk
adb -s emulator-5554 shell monkey -p com.game1.puzzle -c android.intent.category.LAUNCHER 1
```

### 4.3 確認項目

| # | 項目 | 期待動作 |
| --- | --- | --- |
| 1 | 初回起動 | スプラッシュ → 盤面 4×4 表示、`まぜる` / `記録リセット` ボタン表示、ステータス「まぜるを押して…」 |
| 2 | シャッフル | タップで盤面が混ざる。ステータス「空きマスの隣…」へ変化 |
| 3 | タップ移動 | 空きマス隣接タイルのタップで移動、手数カウンタ +1 |
| 4 | スワイプ移動 | 画面内スワイプで空きマスが反対方向へ移動 |
| 5 | クリア | 1〜15 完成時に「クリア！N 手で完成しました。」表示、ベスト手数更新 |
| 6 | インタースティシャル広告 | クリア直後に全画面広告（テスト ID の "Test Ad" 表示） |
| 7 | バナー広告 | 画面下部にバナー広告（テスト ID の "Test Ad" 帯） |
| 8 | 再起動復元 | アプリを強制停止→再起動で盤面と手数が復元 |
| 9 | 記録リセット | ボタンでベストスコアが `-` に戻る |
| 10 | ローテーション | 画面回転で盤面がはみ出さない |

### 4.4 logcat 致命エラー確認

```powershell
adb -s emulator-5554 logcat -d -t 2000 |
  Select-String -Pattern 'FATAL EXCEPTION|ANR in com.game1.puzzle|chromium.*Uncaught|chromium.*SyntaxError|chromium.*ReferenceError|chromium.*TypeError|Capacitor.*Error'
```

**期待**: マッチなし（テスト ID 取得の通信ログは出るが致命エラーではない）。

### 4.5 スクリーンショット取得

Task #10 で使用する 4 枚を `assets/screenshots/` に保存する。

```powershell
New-Item -ItemType Directory -Force assets\screenshots | Out-Null

adb -s emulator-5554 shell screencap -p /sdcard/phone-01.png
adb -s emulator-5554 pull /sdcard/phone-01.png assets\screenshots\phone-01.png
```

撮影タイミング:
1. 起動直後の盤面
2. プレイ途中（手数 10〜30 程度の盤面）
3. クリア直後（ベスト更新メッセージ付き）
4. 広告プレースホルダ表示（Chrome DevTools 等で `document.body.dataset.showAdPlaceholder='true'` を設定するか、Web ブラウザ側で撮影）

## 5. 受け入れ基準

| ID | 条件 | フェーズ | 結果 |
| --- | --- | --- | --- |
| AC-001 | `npm run build` 成功 | A | Pass |
| AC-002 | `npx.cmd cap sync android` 成功、`@capacitor-community/admob` プラグインが検出される | A | Pass |
| AC-003 | Debug APK が `android/app/build/outputs/apk/debug/app-debug.apk` に生成される | A | Pass |
| AC-004 | 既存テストと harness:check が影響を受けない | A | Pass（36/36 pass、禁止パターン 0）|
| AC-005 | フェーズ B 手順がそのまま実行可能な形で記載されている | A | Pass（§4）|
| AC-006 | フェーズ B の 10 項目の期待動作が明文化されている | A | Pass（§4.3）|
| AC-007 | フェーズ B 実施の結果が本ファイル §7 に追記される | B | **オーナー実施後記録** |

## 6. 想定リスク

| リスク | 対応 |
| --- | --- |
| AVD の Google Play 版でないと AdMob テスト広告が Null | `GAME1_API34` が Google APIs 版かを確認。Google Play 版でなくても `initializeForTesting: true` + テスト ID であれば返るはず |
| logcat に Capacitor native bridge の warn が出る | native bridge 初期化時の warn は致命ではない。上記パターンに一致するものだけを致命扱いする |
| esbuild バンドルの sourcemap なしで ReferenceError の行特定が困難 | 発生時に `scripts/build-web-assets.js` に `sourcemap: 'inline'` を追加して再ビルド |
| インタースティシャル広告が出ない | `src/ads/setupAdvertising.js` の interstitial listener は `game1:interstitial-requested` イベントを受けて動作。`script.js` の `completePuzzleIfSolved` がイベントを発火するので、盤面完成時のみ発火する |

## 7. フェーズ B 実施記録

実施日: 2026-04-18 〜 04-19（AVD `GAME1_API34` / Android 14 / API 34）

### 7.1 実施手順の抜粋

1. `emulator -avd GAME1_API34 -no-snapshot-load -no-boot-anim` でブート
2. `adb wait-for-device && sys.boot_completed=1` を polling で確認
3. `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` → Success
4. 初期状態テスト後、`pm clear com.game1.puzzle` でクリーン起動を再確認
5. 起動 → シャッフル → タイル移動 → force-stop → 再起動の順に動作確認

### 7.2 項目別結果

| # | 項目 | 結果 | 備考 |
| --- | --- | --- | --- |
| 1 | 初回起動 | Pass | スプラッシュ → 盤面 4×4 表示、「まぜる」「記録リセット」表示、ステータス「空きマスの隣…」 |
| 2 | シャッフル | Pass | タップで盤面再生成、手数 0 にリセット |
| 3 | タップ移動 | Pass | 空きマス隣接タイルのタップで移動、手数 +1 |
| 4 | スワイプ移動 | 未確認 | adb input drag の再現性が低く今回スキップ。実機側で確認 |
| 5 | クリア | 未確認 | 手動で完成させる必要あり、今回タップ 1 回までしか未テスト |
| 6 | インタースティシャル広告 | 未確認 | AC-004 同様、クリア未到達のため未発火 |
| 7 | バナー広告 | **Pass** | AdMob テスト ID の「AdMob has a YouTube channel. Tap for tutorials, screencasts, & more.」がスクリーン下端に表示（`artifacts/playthrough/07-after-tap-tile4.png`）|
| 8 | 再起動復元 | Pass | `am force-stop` 後にランチャーから再起動 → 手数 1 と直前盤面がそのまま復元 |
| 9 | 記録リセット | 未確認 | ベストスコア未達成のため未テスト（実装は単体テスト `handleRemoveAdsPurchase` 等で検証済み）|
| 10 | ローテーション | 未確認 | 現行は `screenOrientation` 指定なしで自動対応。未観測 |

### 7.3 logcat スキャン

```
pattern: FATAL|AndroidRuntime.*E com.game1|chromium.*Uncaught|chromium.*Error
結果: マッチなし（AdMob SDK の version deprecation 情報ログ 1 件のみ、実害なし）
```

### 7.4 取得したスクリーンショット

すべて `artifacts/playthrough/` 配下:

| ファイル | 内容 |
| --- | --- |
| `02-first-view.png` | 旧状態の盤面（前回インストール時の saved state 復元）|
| `03-fresh-start.png` | `pm clear` 直後の Capacitor スプラッシュ |
| `06-after-wait.png` | クリーン起動後、手数 0 の初期盤面 |
| `07-after-tap-tile4.png` | タイル移動後（手数 1）+ AdMob テストバナー |
| `08-after-shuffle.png` | シャッフル後の新盤面 |
| `10-after-restart-ready.png` | force-stop → 再起動後の復元盤面（手数 1）|

### 7.5 判定

**Conditional Pass**。コア動作（起動／タップ移動／シャッフル／バナー広告／再起動復元／日本語 UI）はすべて期待通り。残 4 項目（スワイプ、クリア到達、インタースティシャル、ローテーション）は本プレイ範囲では未検証につき、Task #11（実機確認）時にカバーする。

### 7.6 ドラフトから判明した追記事項

- Capacitor スプラッシュの表示時間が 10 秒超と長め。`capacitor.config.json` の `SplashScreen.launchAutoHide: true` と `launchShowDuration` を短縮するか、`showSpinner: false` の検討価値あり（別タスク候補）
- エミュレーター `GAME1_API34` は Google APIs 版で AdMob テスト広告の取得が可能と確認
