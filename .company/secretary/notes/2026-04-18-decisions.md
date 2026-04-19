---
date: "2026-04-18"
type: decisions
---

# 意思決定ログ - 2026-04-18

## 決定事項

### フォルダ整理（GAME1-puzzle）
- **背景**: 前日までの作業で `android.partial-backup-20260417223347/`（旧 partial Android フォルダの退避先）と `artifacts/` 内の古い反復スクショが蓄積していた。
- **判断**: 以下を削除。
  - `android.partial-backup-20260417223347/` 全体
  - `artifacts/cycle*.png`（cycle0〜cycle5 系、計10枚）
  - `artifacts/design*.png`（design1〜design5 系、計15枚）
  - `artifacts/window-cycle0.xml`
- **残したもの**: `artifacts/review-*.png`, `review2-*.png`, `japanese-ui*.png`, `review-ui.xml`（直近のレビュー証跡）
- **理由**: `android/` は Capacitor で再生成済みでバックアップは役目終了。古いサイクルのスクショは開発過程の証跡であり、直近の review 群で十分代替できる。`www/` は `npm run build` で再生成されるビルド出力のため触らない。
- **対応部署**: 秘書室

### 全コード ハルシネイションチェック結果
- **対象**: `index.html`, `script.js`, `styles.css`, `src/**`, `scripts/**`, `test/**`, `docs/**`, `package.json`, `capacitor.config.json`, `README.md`
- **判定**: クリティカルなハルシネイションなし。
- **検証済み整合性**:
  - HTML の全 ID と `script.js` の `getRequiredElement` 呼び出しが一致
  - `script.js` の import 対象（`./src/inputControls.js`, `./src/puzzleCore.js`）は実在
  - `puzzleCore.js` の全 export は `script.js` とテストから参照されている
  - `AdManager.js` が import する `@capacitor-community/admob` の `AdMob`/`BannerAdSize`/`BannerAdPosition` は実在 API
  - AdMob テスト ID（`ca-app-pub-3940256099942544/6300978111` banner, `/1033173712` interstitial）は Google 公式テスト ID と一致
  - `capacitor.config.json` の `webDir: "www"` とディレクトリ実態が一致
  - README / SPECIFICATION が挙げる全ファイルパスは実在
- **グレーゾーン（虚偽ではないが配線未完。SPECIFICATION に「未実装」と明記ずみ）**:
  - `script.js:234` の `game1:interstitial-requested` CustomEvent のリスナーが未配線（SPECIFICATION §10.2 で意図的疎結合と記載）
  - `AdManager` クラスと `handleRemoveAdsPurchaseSuccess` 関数は定義のみで呼び出し元なし（SPECIFICATION §10.1/§10.3 で「未実装」と明記）
  - `QA_REVIEW.md §2` の `cap doctor` 出力「Android looking great」は Capacitor の定型出力と一致しない可能性あり（意訳の疑い、軽微）
- **対応部署**: 秘書室

## フォローアップ
- [ ] 広告 SDK 配線（リスナー実装 or AdManager の Wire up）は SPECIFICATION §15 のリリース前作業に含まれているため、その時点で着手
- [ ] `assets/icon.png` / `splash.png` の実画像差し替え（前日より継続）
