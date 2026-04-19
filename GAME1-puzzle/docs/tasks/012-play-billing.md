# Task 012: Google Play Billing — 広告削除購入フロー実装

最終更新日: 2026-04-18
対応タスク: #8 (Google Play Billing の広告削除購入フローを実装)
コスト: Play Console 登録 US$25（一回払い）、テスト購入は無料

## 1. 目的・スコープ

「広告を削除する」アプリ内購入（非消費型 IAP）を実装する。購入成功時に広告を非表示にし、`localStorage` の `remove_ads_purchased` フラグを立てる。

### 対象

- Google Play Billing Library 連携（`@capacitor-community/in-app-purchases-2` 等）
- 購入フローのトリガー UI（「広告を削除 ¥XXX」ボタン）
- 購入成功時の広告停止処理
- 再起動後の購入状態復元（`localStorage` 確認 → 必要に応じてレシート検証）

### 対象外

- iOS（今回は Android 限定）
- サーバーサイドレシート検証（初版はクライアント側のみ）
- 返金処理

## 2. 前提

- Play Console アカウント登録済み（US$25 支払い済み）
- Task #6（AdMob 本番 ID）完了済み
- アプリが内部テストトラック以上で公開されていること（Billing はドラフト状態では動かない）

## 3. 推奨ライブラリ

`@capacitor-community/in-app-purchases-2` v4 系（Capacitor 6 対応）

```bash
npm install @capacitor-community/in-app-purchases-2
npx.cmd cap sync android
```

## 4. Play Console での商品設定

1. アプリ → 収益化 → アプリ内商品 → 管理された商品
2. 商品 ID: `remove_ads`
3. 価格: ¥250 推奨（Google が端数を自動設定）
4. 状態: アクティブ

## 5. 実装概要

### 5.1 購入トリガー UI

`index.html` に「広告を削除」ボタンを追加（バナー広告の上、または設定メニュー内）。

`remove_ads_purchased` が `'true'` なら非表示にする。

### 5.2 購入フロー（`src/purchase/handleRemoveAdsPurchase.js` の拡張）

現在の `handleRemoveAdsPurchase.js` はスタブ状態。以下を実装:

```javascript
import { InAppPurchases } from '@capacitor-community/in-app-purchases-2';

export async function initPurchase({ storage, adManager }) {
  await InAppPurchases.addListener('purchaseUpdated', async ({ purchase }) => {
    if (purchase.productId === 'remove_ads' && purchase.state === 'purchased') {
      storage.setItem('remove_ads_purchased', 'true');
      await adManager.hideBanner();
      await InAppPurchases.finishTransaction({ transaction: purchase });
    }
  });
}

export async function purchaseRemoveAds() {
  await InAppPurchases.purchase({ productId: 'remove_ads' });
}

export async function restorePurchases({ storage, adManager }) {
  const { purchases } = await InAppPurchases.restorePurchases();
  const purchased = purchases.some(p => p.productId === 'remove_ads');
  if (purchased) {
    storage.setItem('remove_ads_purchased', 'true');
    await adManager.hideBanner();
  }
}
```

### 5.3 起動時の復元

`script.js` の IIFE 内で `restorePurchases()` を呼び出す（`setupAdvertising` の後）:

```javascript
if (localStorage.getItem('remove_ads_purchased') !== 'true') {
  await restorePurchases({ storage: localStorage, adManager });
}
```

## 6. テスト方法

1. Play Console → ライセンステスター に自分の Gmail を追加
2. テスト購入はライセンステスターアカウントで実行（無料）
3. `adb logcat` で `InAppPurchases` タグを監視

## 7. 受け入れ基準

| ID | 確認内容 | 合格条件 |
| --- | --- | --- |
| AC-001 | `remove_ads` 商品 ID が Play Console に登録されている | アクティブ状態 |
| AC-002 | 購入フローが完走する | テスト購入でフロー完了 |
| AC-003 | 購入後に広告バナーが非表示になる | `adManager.hideBanner()` 呼び出し確認 |
| AC-004 | 再起動後も広告非表示が維持される | `localStorage.remove_ads_purchased === 'true'` |
| AC-005 | 購入復元が機能する | `restorePurchases()` で再取得 |
| AC-006 | 既存テストと harness:check が影響を受けない | 36 件 pass、禁止パターン 0 |

## 8. 想定リスク

| リスク | 対応 |
| --- | --- |
| Billing API がテストトラック外では動かない | 内部テストトラックに APK を上げてから実機テスト |
| `hideBanner()` が `AdManager` に未実装 | `AdManager.js` に `hideBanner()` メソッドを追加する（Task #6 と同時対応） |
| レシート検証なしのクライアント実装は改ざん可能 | 初版は許容。将来的にサーバー検証を追加する |
