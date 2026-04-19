# Task 006: 広告SDKを配線（AdManager wire up + interstitial リスナー）

最終更新日: 2026-04-18
対応タスク: #7 (広告SDKを配線)
仕様書順: `docs/SPECIFICATION.md §10 広告・課金仕様` / §15 は直接言及なしだが §10.2 の実装補完
コスト: 無料（AdMob テスト ID で動作確認まで）

## 1. 目的・スコープ

現状、`src/ads/AdManager.js` クラスと `src/purchase/handleRemoveAdsPurchase.js` 関数は定義のみで、どこからも呼び出されていない。`script.js` から `game1:interstitial-requested` CustomEvent は発火されているが、リスナーが存在しないため広告表示されない。

本タスクでは、JS 層の広告 SDK を配線し、**テスト ID のまま** Android 実機／エミュレーターで広告が表示される状態にする。

### 対象

- `src/ads/setupAdvertising.js`（新規）: アプリ起動時のバナー表示、インタースティシャルリスナー登録のオーケストレーション
- `script.js` への接続（init 時に setupAdvertising を呼ぶ）
- `handleRemoveAdsPurchaseSuccess` の呼び出し経路準備（Task #8 Play Billing 実装で接続されるまで未配線でよいが、経路を明示）
- Capacitor 判定（`Capacitor.isNativePlatform()`）で Web では AdMob を呼ばない
- テスト: `setupAdvertising` の判定ロジック（Web/native 切替、remove_ads フラグ時のスキップ）

### 対象外

- AdMob 本番 ID への差し替え（Task #6）
- Google Play Billing 連携（Task #8）
- UMP / GDPR 同意 UI（別タスク）
- iOS 対応（現スコープ外）

## 2. 前提と制約

- `@capacitor-community/admob@6.0.0` が dependencies に含まれている（確認済み）
- `AndroidManifest.xml` に AdMob APPLICATION_ID `ca-app-pub-3940256099942544~3347511713`（Google 公式テスト ID）が設定済み（確認済み）
- `src/config/adIds.js` に banner/interstitial テスト ID が設定済み（Google 公式テスト ID）
- `Capacitor` グローバルは native 実行時のみ `@capacitor/core` 経由で利用可能
- Web（ブラウザ開発）では AdMob 呼び出しはスキップする（例外を投げない）
- テストは Node 環境で動き、`@capacitor-community/admob` の import を避けるため DI を使う

## 3. 現状

```
script.js (init)
   ↓ 発火
   game1:interstitial-requested
   ↓
   ∅ （リスナー未登録）

src/ads/AdManager.js （定義のみ、呼び出し元なし）
src/purchase/handleRemoveAdsPurchase.js （定義のみ、呼び出し元なし）
```

## 4. 対応案の評価

| 案 | 内容 | 長所 | 短所 |
| --- | --- | --- | --- |
| (a) | `script.js` に直接 AdMob import + リスナー登録 | シンプル | `script.js` が重くなる、テスト困難、Web 実行でエラー |
| (b) | `src/ads/setupAdvertising.js` に分離、DI で plugin とストレージを注入 | テスト容易、Web/native 切替が分かりやすい | 1 ファイル追加 |
| (c) | Capacitor プラグイン登録の hook に乗せる | プラットフォーム判定が綺麗 | Capacitor の lifecycle 理解が必要、学習コスト |

## 5. 確定事項

### 5.1 採用案: **(b) `src/ads/setupAdvertising.js` に分離**

### 5.2 `setupAdvertising(options)` API

```javascript
/**
 * @typedef {Object} SetupAdvertisingOptions
 * @property {AdManager} adManager
 * @property {Storage} storage        - localStorage 互換
 * @property {EventTarget} eventTarget - interstitial-requested を受信
 * @property {() => boolean} isNative - Capacitor.isNativePlatform() 相当
 * @property {(error: Error) => void} [onError] - 広告呼び出し失敗時のログ
 */
export async function setupAdvertising(options) { ... }
```

動作:
1. `!options.isNative()` なら即 return（Web 時は何もしない）
2. `isRemoveAdsPurchased(storage)` が true なら、interstitial リスナーも登録せず return
3. adManager.initialize() → loadBanner() → interstitial リスナー登録
4. リスナーは event を受けたら `adManager.loadInterstitial()` → `adManager.showInterstitial()` を順に呼ぶ
5. いずれかの非同期呼び出しで例外が起きたら `onError` を呼ぶ（未設定ならコンソールに warn）

### 5.3 script.js からの呼び出し

```javascript
// setupAdvertising を遅延 import する（@capacitor-community/admob を Web でも評価できるように）
(async () => {
  try {
    const { AdManager } = await import('./src/ads/AdManager.js');
    const { setupAdvertising } = await import('./src/ads/setupAdvertising.js');
    const { Capacitor } = await import('@capacitor/core').catch(() => ({ Capacitor: null }));

    const isNative = () => Boolean(Capacitor && Capacitor.isNativePlatform());
    const adManager = new AdManager();
    await setupAdvertising({
      adManager,
      storage: localStorage,
      eventTarget: window,
      isNative,
      onError: (err) => console.warn('[ads]', err),
    });
  } catch (error) {
    console.warn('[ads] setup skipped:', error);
  }
})();
```

ポイント:
- IIFE で起動時に非同期実行
- Capacitor 未配信（Web）環境では `await import('@capacitor/core')` が失敗する想定もあり、`.catch()` で安全化
- いずれのエラーも warn に留めてゲーム本体をブロックしない

### 5.4 `handleRemoveAdsPurchaseSuccess` の接続点

本タスクでは実配線しない（Play Billing 未実装のため）。代わりに、`src/purchase/handleRemoveAdsPurchase.js` の import パスと、呼び出し例を `docs/tasks/006-ad-sdk-wiring.md` 内に残し、Task #8 で使う。

```
// Task #8 で以下の形で呼び出す想定
await handleRemoveAdsPurchaseSuccess(adManager, localStorage);
// → remove_ads_purchased = 'true' 保存 + banner 削除
```

## 6. 未確定・要オーナー判断

| 項目 | 選択肢 | 推奨 |
| --- | --- | --- |
| Web 表示時に `#banner-ad` プレースホルダーを出すか | (i) `document.body.dataset.showAdPlaceholder='true'` を既定で立てる / (ii) 現状維持（非表示） | (ii)。開発時のみ手動で立てる |
| エラー通知方法 | (i) `console.warn` のみ / (ii) UI にトースト表示 / (iii) logcat 追加ログ | (i)。リリース後は必要に応じて Crashlytics 等で拡張 |
| initialize の引数 | (i) `{ initializeForTesting: true }` 維持 / (ii) 本番切替は #6 で | (i) |

## 7. 受け入れ基準

| ID | 確認内容 | 合格条件 |
| --- | --- | --- |
| AC-001 | `src/ads/setupAdvertising.js` が新規作成されている | 関数 `setupAdvertising` がエクスポートされている |
| AC-002 | `setupAdvertising` が Web（非 native）では何もしない | `isNative: () => false` で呼んだとき、`adManager.initialize` が 0 回呼ばれる |
| AC-003 | native + remove_ads=true で interstitial を呼ばない | storage に `remove_ads_purchased='true'` を立て、event 発火しても `showInterstitial` が呼ばれない |
| AC-004 | native + remove_ads=false で banner と interstitial が動く | `loadBanner` が呼ばれ、event 発火で `loadInterstitial` → `showInterstitial` が呼ばれる |
| AC-005 | 例外発生時も throw しない | `adManager.initialize` が reject してもテストが fail しない、`onError` が呼ばれる |
| AC-006 | 既存テストが通る | `npm test` 28+ 件 pass |
| AC-007 | harness:check pass | 禁止パターン検出なし |
| AC-008 | script.js の非ブロッキング起動 | `script.js` の先頭で await せずに IIFE で実行、ゲーム本体のレンダリングをブロックしない |

## 8. 外部根拠

- `@capacitor-community/admob` README: https://github.com/capacitor-community/admob
  - `AdMob.initialize`, `showBanner`, `prepareInterstitial`, `showInterstitial`, `removeBanner` API は README に記載の public API
- Capacitor 6 `Capacitor.isNativePlatform()`: Capacitor コアの公式 API（https://capacitorjs.com/docs/core-apis/web）
- Google 公式 AdMob テスト ID: https://developers.google.com/admob/android/test-ads
  - banner: `ca-app-pub-3940256099942544/6300978111`
  - interstitial: `ca-app-pub-3940256099942544/1033173712`
  - app id: `ca-app-pub-3940256099942544~3347511713`

これらは既存の `src/config/adIds.js` と `android/app/src/main/res/values/strings.xml` で使用されており、実装・設定とテスト ID の整合が取れている。

## 9. 想定リスク・未確認

| リスク | 対応 |
| --- | --- |
| `@capacitor/core` の dynamic import が Web サーバー経由で失敗する | try/catch で握り潰す。warn のみ |
| AdMob SDK の初期化が Android エミュレーターで広告を返さない | テスト ID は確実に返すはず。返らなければ Task #11 実機確認で判定 |
| `window.dispatchEvent` した CustomEvent がリスナーに届かない | 同一 event loop なので即届く想定。テストで確認 |
| 非同期リスナー内で例外発生したら UnhandledPromiseRejection | Promise chain 末尾で .catch して onError に流す |
| Web モードで `@capacitor-community/admob` を import した結果 ReferenceError | setupAdvertising では直接 import せず、script.js で先に isNative をチェックしてから AdManager だけ import する設計で回避 |

## 10. 実装手順

1. 推奨 (ii)(i)(i) で未確定事項を確定
2. `src/ads/setupAdvertising.js` を作成
3. `test/setupAdvertising.test.js` を作成（fake AdManager, fake EventTarget, fake storage で 5 件以上）
4. `script.js` に IIFE での setupAdvertising 呼び出しを追加
5. `npm test` で AC-002〜AC-006 を確認
6. `npm run harness:check` で AC-007 を確認
7. `npm run build` で www/ に反映
8. `docs/tasks/006-ad-sdk-wiring.md §11` に実装後レビュー追記
9. git commit / push

## 11. 実装後レビュー

実施日: 2026-04-18

### 11.1 実装内容

- `src/ads/setupAdvertising.js` を新規作成（DI ベース、57 行）
  - 契約: `setupAdvertising({ adManager, storage, eventTarget, isNative, onError })` → `{ started, reason, dispose }`
  - `isNative()` false → `{ started: false, reason: 'not-native' }`
  - `isRemoveAdsPurchased(storage)` true → `{ started: false, reason: 'ads-removed' }`
  - それ以外: `initialize()` → `loadBanner()` → interstitial リスナー登録、`dispose()` で解除
  - 例外はすべて `onError` に流し throw しない（デフォルトは `console.warn('[ads]', error)`）
- `test/setupAdvertising.test.js` を新規作成（184 行、8 ケース）
  - fake AdManager / memory storage / `EventTarget` を DI
  - native 判定、remove_ads 判定、banner ロード、interstitial リスナー、init 例外、interstitial 例外、必須引数、dispose の 8 観点
- `script.js` への配線は本タスクでは **見送り**（理由は 11.3 参照）

### 11.2 受け入れ基準結果

| ID | 結果 | 確認方法 |
| --- | --- | --- |
| AC-001 | Pass | `src/ads/setupAdvertising.js` が作成され `setupAdvertising` がエクスポートされている |
| AC-002 | Pass | テスト `skips initialization when platform is not native` で `initialize` 呼び出し 0 を確認 |
| AC-003 | Pass | テスト `skips when ads are already removed` で `initialize` 呼び出し 0 を確認。加えて dispose テストで listener 解除も確認済み |
| AC-004 | Pass | テスト `initializes and loads banner on native` および `registers an interstitial listener that loads and shows` で全呼び出しを確認 |
| AC-005 | Pass | `routes init errors to onError` および `routes interstitial errors to onError` テストで throw されず `onError` が受けることを確認 |
| AC-006 | Pass | `npm test` 36/36 pass（従来 28 件 + 本タスク 8 件）|
| AC-007 | Pass | `npm run harness:check` 禁止パターン検出 0 件 |
| AC-008 | 未実施 | script.js 配線を本タスクから切り離したため本AC も本タスクでは未達。派生タスク 007 で対応 |

### 11.3 script.js 配線を見送った理由

`@capacitor-community/admob` および `@capacitor/core` は bare specifier。現状の `script.js` は `type="module"` の直リンクで Capacitor WebView に読み込まれており、import map / bundler が無い状態で bare specifier を `await import()` すると解決に失敗する（ブラウザ / WebView の native ES module loader 挙動）。

`setupAdvertising.js` 自体は相対パス import (`../adEvents.js`, `../storage.js`) のみで完結し、DI で注入される `adManager` がどこから import されても動作する設計のため、ユーティリティとしては Ready。配線と同時にランタイム loader の整備が必要となるため、別タスクに分離した。

派生タスク: `docs/tasks/007-webview-bundler.md`（新規作成予定。esbuild か import map でのバンドル設計）

### 11.4 判定

Pass（AC-008 のみ派生タスク 007 に持ち越し）。setupAdvertising の本体実装とテストはすべて通過しており、bundler 整備後に script.js へ数行追加するだけで配線完了できる状態になった。

