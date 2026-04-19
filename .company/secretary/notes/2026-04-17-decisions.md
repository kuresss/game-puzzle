---
date: "2026-04-17"
type: decisions
---

# 意思決定ログ - 2026-04-17

## 決定事項

### GAME1-puzzle の package.json 修復方針
- **背景**: clone したリポジトリの `package.json` が2つの設定ブロックが重複して JSON として壊れていた。
- **判断**: 新しい方のバージョン（Capacitor 6.2.0）を採用し、AdMob 依存（@capacitor-community/admob 6.0.0）を含めた形で1ブロックに統合。旧ブロックの `cap:add:android` / `cap:sync` スクリプトと `serve` devDep は残した。
- **理由**: `script.js` に `isRemoveAdsPurchased()` と `showInterstitialAd()` があり、AdMob 連携が前提の設計。新しいバージョンを採用する方が将来の更新で詰まりにくい。
- **対応部署**: 秘書室（開発部が未作成のため）
- **フォローアップ**:
  - [ ] 実画像（icon/splash）の差し替え
  - [ ] `npx cap sync android` の実行と `android/` 再生成の検討

### capacitor.config.json の appId
- **背景**: `com.example.game1puzzle` と `com.game1.puzzle` が重複していた。
- **判断**: `com.game1.puzzle` を採用。
- **理由**: `example` ドメインは本番ストア配信に不適。新しい方がプロダクション志向。
- **対応部署**: 秘書室
- **フォローアップ**: ストア配信時に appId 変更が不可のため、この時点で確定しておくのが無難。
