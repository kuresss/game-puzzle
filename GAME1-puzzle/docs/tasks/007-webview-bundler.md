# Task 007: WebView ランタイムでの bare specifier 解決手段を整備

最終更新日: 2026-04-18
派生元: Task 006 (広告SDK配線) の AC-008 持ち越し分
仕様書順: `docs/SPECIFICATION.md §10 広告・課金仕様` の実装前提
コスト: 無料（ツール追加は devDependency のみ）

## 1. 目的・スコープ

`script.js` から `@capacitor-community/admob` や `@capacitor/core` を import し、`setupAdvertising` を起動時に呼び出せるようにする。現状、`index.html` は `<script type="module" src="script.js">` で直接読み込む構成のため、bare specifier を含む import 文をブラウザ／WebView の native ES module loader が解決できない。

本タスクでは以下のいずれかの手段で解決する:

- (a) import map を `index.html` に追加してパスを明示解決
- (b) esbuild 等で `script.js` を `www/script.js` にバンドルし、`node_modules` 参照を埋め込む
- (c) Vite 等のフル bundler を導入

### 対象

- `@capacitor-community/admob`, `@capacitor/core` が WebView でロード可能になる
- `script.js` から `setupAdvertising` を await import して起動できる
- `npm run build` 経由で bundler 処理が走り、`www/` に成果物を出力
- 既存の `test/` は影響を受けない（Node 環境で個別モジュールをそのまま import）

### 対象外

- UMP / GDPR 同意 UI
- AdMob 本番 ID 差し替え（Task #6）
- iOS 対応

## 2. 前提と制約

- 現状の `npm run build` は `scripts/build.js` で `www/` に静的アセットをコピーする方式（手書き）
- `node_modules` は `www/` にコピーしていない
- `@capacitor-community/admob@6.0.0`, `@capacitor/core@6.2.0` が dependencies に存在
- Capacitor WebView は Chromium ベース。native ES module + import map には対応するが、bare specifier は解決できない

## 3. 対応案の評価

| 案 | 内容 | 長所 | 短所 |
| --- | --- | --- | --- |
| (a) import map | `index.html` に `<script type="importmap">` で `@capacitor-*` を `./node_modules/...` or `www/vendor/...` にマップ | bundler 不要、シンプル | 依存グラフを手動でフラット化する必要。推移的依存があると難しい |
| (b) esbuild | `script.js` を entry に esbuild で `www/script.bundle.js` を作成 | 高速、依存解決自動、tree-shake あり | devDep 1件追加 |
| (c) Vite | `index.html` を entry に dev/build | HMR、高度な機能 | 学習コスト、既存 `scripts/build.js` と競合 |

## 4. 推奨案

**(b) esbuild**。導入コストが低く、既存 `scripts/build.js` に数行足すだけで完結する。devDep 1件（esbuild は prebuilt binary で Windows も動く）。

## 5. 受け入れ基準（ドラフト）

| ID | 確認内容 |
| --- | --- |
| AC-001 | `script.js` から `@capacitor-community/admob` の import が解決できる |
| AC-002 | `setupAdvertising` が起動時に呼ばれる（Web では isNative=false で即 return） |
| AC-003 | 既存テスト 36 件が引き続き pass |
| AC-004 | `npm run build` でバンドルが `www/` に出力される |
| AC-005 | `harness:check` pass |

## 6. 実装方針（確定）

### 6.1 採用: (b) esbuild + ビルドステップ統合

理由:
- `@capacitor/core@6.2.0` と `@capacitor-community/admob@6.0.0` はともに `module` フィールドで ESM build を提供しており、esbuild の bundle で問題なく解決できる（確認済み）
- 現行 `scripts/build-web-assets.js` は node:fs のみで構成されており、そこに esbuild 呼び出しを 1 回差し込むだけで完結する
- devDependencies 1 件追加（Windows に prebuilt binary あり）

### 6.2 ソース構成変更

`script.js`（ルート）に次の 3 行を追加する:

```javascript
import { Capacitor } from '@capacitor/core';
import { AdManager } from './src/ads/AdManager.js';
import { setupAdvertising } from './src/ads/setupAdvertising.js';
```

および末尾に IIFE:

```javascript
(async () => {
  try {
    const adManager = new AdManager();
    await setupAdvertising({
      adManager,
      storage: localStorage,
      eventTarget: window,
      isNative: () => Capacitor.isNativePlatform(),
      onError: (error) => console.warn('[ads]', error),
    });
  } catch (error) {
    console.warn('[ads] setup skipped:', error);
  }
})();
```

### 6.3 ビルドステップ

`scripts/build-web-assets.js` の `pathsToCopy` から `script.js` を除外し、代わりに esbuild で `script.js` を entry point としてバンドルし `www/script.js` に出力する:

```javascript
import { build } from 'esbuild';
// ...
await build({
  entryPoints: [join(rootDir, 'script.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  outfile: join(outputDir, 'script.js'),
});
```

### 6.4 dev モード

`npm start` は `npm run build && npx serve www` に変更する。ブラウザは常にバンドル済みコードを読み込むため、ads は `Capacitor.isNativePlatform()` が false → setupAdvertising が `{ started: false, reason: 'not-native' }` を返して即終了する（コンソールエラーなし）。

### 6.5 テスト

`npm test` は Node 環境で各モジュールを直接 import しており、script.js の静的 import 追加とは無関係。既存の 36 件はそのまま pass するはず。

## 7. 受け入れ基準（確定）

| ID | 確認内容 | 合格条件 |
| --- | --- | --- |
| AC-001 | `script.js` が `@capacitor/core` を static import | `script.js` に該当 import 文あり |
| AC-002 | `setupAdvertising` が起動時に呼ばれる | `script.js` 末尾の IIFE で呼び出し、Web では non-native で即 return |
| AC-003 | 既存テスト 36 件が pass | `npm test` 36/36 pass |
| AC-004 | `npm run build` でバンドルが www/ に出力される | `www/script.js` が `@capacitor` の実装を含む（外部参照なし） |
| AC-005 | harness:check pass | 禁止パターン検出なし |
| AC-006 | `npm start` が動作する | `npx serve www` 経由でローカル表示可能、コンソールに critical error なし |

## 8. 実装手順

1. `npm install --save-dev esbuild`
2. `script.js` に静的 import 3 行と末尾 IIFE を追加
3. `scripts/build-web-assets.js` を esbuild 統合版に書き換え
4. `package.json` の `start` を `npm run build && npx serve www` に変更
5. `npm run build` 実行、`www/script.js` の出力確認
6. `npm test` と `npm run harness:check` 実行
7. commit / push

## 9. 実装後レビュー

実施日: 2026-04-18

### 9.1 実装内容

- `esbuild@^0.28.0` を devDependencies に追加
- `scripts/build-web-assets.js` を esbuild 統合版に書き換え（`script.js` を entry として bundle し `www/script.js` に出力、`src/` コピーは廃止）
- `script.js` に `@capacitor/core`, `AdManager`, `setupAdvertising` の静的 import と起動時 IIFE を追加
- `package.json` の `start` を `npm run build && npx serve www` に変更
- README の「実行」「ビルドと Android 同期」セクションを bundler 前提に更新

### 9.2 受け入れ基準結果

| ID | 結果 | 確認方法 |
| --- | --- | --- |
| AC-001 | Pass | `script.js` 冒頭に `import { Capacitor } from '@capacitor/core';` ほか 2 行を確認 |
| AC-002 | Pass | `script.js` 末尾の IIFE が `setupAdvertising` を呼び、`isNative: () => Capacitor.isNativePlatform()` を渡す |
| AC-003 | Pass | `npm test` 36/36 pass |
| AC-004 | Pass | `npm run build` 成功、`www/script.js` は 43.6kb、`@capacitor/core` の実装がインライン化されているのを grep で確認（41 ヒット） |
| AC-005 | Pass | `npm run harness:check` 禁止パターン 0 件 |
| AC-006 | Pass | `npm start` は `npm run build && npx serve www` に変更済み。ブラウザで開くと Web 判定で ads は `not-native` で即 return（コンソールに critical error なし） |

### 9.3 判定

Pass。Task #7 で Ready にしておいた `setupAdvertising` が起動時に自動で呼ばれるようになり、native 実行時に AdMob テスト ID で配信が走る状態になった。実機／エミュレーターでの動作確認は Task #13 で実施する。

