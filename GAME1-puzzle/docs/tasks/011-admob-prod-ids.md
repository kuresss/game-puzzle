# Task 011: AdMob 本番 ID 取得と差し替え

最終更新日: 2026-04-18
対応タスク: #6 (AdMob 本番 ID を取得して差し替え)
コスト: 無料（AdMob アカウントは Google アカウントがあれば無料）

## 1. 目的・スコープ

現在 `src/config/adIds.js` に設定されているテスト広告 ID を、AdMob コンソールで発行した本番広告ユニット ID に差し替える。

## 2. 前提

- Google アカウント（`kuresukensuruna@gmail.com` 等）があること
- アプリ ID は `com.game1.puzzle`
- 必要な広告ユニット: バナー × 1、インタースティシャル × 1

## 3. 手順

### 3.1 AdMob アカウント作成

1. https://admob.google.com/ にアクセスしてサインイン
2. 初回はアカウント設定（国・タイムゾーン・支払い通貨）を入力
3. 「始める」でアプリ追加へ

### 3.2 アプリ登録

1. 「アプリを追加」→ Android → Google Play に公開済み? → **いいえ**
2. アプリ名: `GAME1 Puzzle`、プラットフォーム: `Android`
3. 追加後に **アプリ ID** が発行される（例: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`）

### 3.3 広告ユニット作成

| ユニット名 | 形式 | 用途 |
| --- | --- | --- |
| `game1-banner` | バナー | 盤面下部の常時表示 |
| `game1-interstitial` | インタースティシャル | クリア時の全画面 |

各ユニットに **広告ユニット ID** が発行される（例: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`）。

### 3.4 コードへの反映

`src/config/adIds.js` を以下のように差し替える:

```javascript
// 本番 ID に差し替え済み（Task #11 完了）
export const AD_IDS = {
  banner: {
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // game1-banner
  },
  interstitial: {
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // game1-interstitial
  },
};
```

`AndroidManifest.xml` の `com.google.android.gms.ads.APPLICATION_ID` メタデータも更新する:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
```

現在の場所: `android/app/src/main/AndroidManifest.xml`

### 3.5 ビルドと確認

```bash
npm run build
npx.cmd cap sync android
cd android && ./gradlew.bat assembleRelease
```

リリースビルドで実際の広告が返ってくることを logcat で確認。

## 4. 現在のテスト ID（参照用）

`src/config/adIds.js` の現在値:

```javascript
export const AD_IDS = {
  banner: {
    android: 'ca-app-pub-3940256099942544/6300978111',
  },
  interstitial: {
    android: 'ca-app-pub-3940256099942544/1033173712',
  },
};
```

`AndroidManifest.xml` の現在値: `ca-app-pub-3940256099942544~3347511713`（テスト用アプリ ID）

## 5. 受け入れ基準

| ID | 確認内容 | 合格条件 |
| --- | --- | --- |
| AC-001 | `src/config/adIds.js` の ID がテスト ID から本番 ID に変わっている | `ca-app-pub-3940256099942544` が残っていない |
| AC-002 | `AndroidManifest.xml` の APPLICATION_ID が本番アプリ ID になっている | テスト ID から本番 ID に変更済み |
| AC-003 | `npm run build && npx.cmd cap sync android` が成功する | ビルドエラーなし |
| AC-004 | harness:check が pass する | 禁止パターン 0 件 |

## 6. 注意事項

- 本番 ID を git に push する前に、`.gitignore` へ `src/config/adIds.js` を追加するか検討する（広告 ID は公開情報だが、ID を晒すことで無効クリックのターゲットになるリスクがある）
- AdMob ポリシー違反（不正クリック誘導、自己クリック等）は即アカウント停止の対象
- Play Store に申請する前に必ず本番 ID に差し替えること（テスト ID のまま申請すると審査落ちの原因になる）
