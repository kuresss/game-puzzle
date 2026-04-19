# Harness Runbook

この Runbook は、`docs/HARNESS_DESIGN.md` のローテーションを実際に回すための手順である。

## 1. 事前準備

```bash
npm install
npm run harness:check
npm run harness:audit
```

Android 確認を行う場合は、JDK と Android SDK の環境変数を設定してから実行する。

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot'
$sdkRoot=Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_SDK_ROOT=$sdkRoot
$env:ANDROID_HOME=$sdkRoot
$env:Path="$env:JAVA_HOME\bin;$sdkRoot\cmdline-tools\latest\bin;$sdkRoot\platform-tools;$sdkRoot\emulator;$env:Path"
```

## 2. マイクロサイクル手順

1. 今回の目的を 1 つだけ決める。
2. 仕様書またはローテーション記録に、変更予定を書く。
3. 実装する。
4. `npm run harness:check` を実行する。
5. 必要なら Android ビルドとエミュレーター確認を実行する。
6. 発見事項をローテーション記録に書く。
7. 次のマイクロサイクルへ進む。

## 3. Android 確認手順

```powershell
npm run build
npx.cmd cap sync android
Push-Location android
.\gradlew.bat assembleDebug
Pop-Location
adb -s emulator-5554 install -r android\app\build\outputs\apk\debug\app-debug.apk
adb -s emulator-5554 shell am force-stop com.game1.puzzle
adb -s emulator-5554 shell monkey -p com.game1.puzzle -c android.intent.category.LAUNCHER 1
```

スクリーンショットを取る場合:

```powershell
New-Item -ItemType Directory -Force artifacts | Out-Null
adb -s emulator-5554 shell screencap -p /sdcard/harness-check.png
adb -s emulator-5554 pull /sdcard/harness-check.png artifacts\harness-check.png
```

logcat の致命エラー検索:

```powershell
adb -s emulator-5554 logcat -d -t 1500 |
  Select-String -Pattern 'FATAL EXCEPTION|ANR in com.game1.puzzle|chromium.*Uncaught|chromium.*SyntaxError|chromium.*ReferenceError|chromium.*TypeError|Capacitor.*Error'
```

## 4. マクロローテーション終了手順

5 回のマイクロサイクル後、以下を実行する。

1. `npm run harness:check`
2. 必要に応じて `npm run harness:audit`
3. Android ビルドとエミュレーター主要操作確認
4. `docs/SPECIFICATION.md` と実装の照合
5. `docs/QA_REVIEW.md` またはローテーション記録へ不足事項を追記
6. 必要な外部事実について予備検索
7. 仕様書更新
8. 次マクロローテーションの目的決定

## 5. 判定基準

| 判定 | 条件 |
| --- | --- |
| Pass | 自動チェック成功、主要操作成功、仕様ズレなし |
| Conditional Pass | 自動チェック成功、残リスクが明記済み |
| Fail | 起動不能、白画面、テスト失敗、仕様との矛盾 |

Fail の場合は、次のマイクロサイクルで新機能を入れず、失敗原因の修正だけを行う。
