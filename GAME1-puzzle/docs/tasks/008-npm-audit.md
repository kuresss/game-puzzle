# Task 008: npm audit high severity 8 件の影響調査と対応判断

最終更新日: 2026-04-18
対応タスク: #14 (npm audit high severity 調査)
仕様書順: `docs/SPECIFICATION.md §15 項目 14` 該当
コスト: 無料

## 1. 目的・スコープ

`@capacitor/assets` 導入（Task #5）に伴い、`npm audit` の high severity が 2 → 8 件に増加した。本タスクでは 8 件すべてのルートを特定し、**プロダクションに影響があるか**、**即時 fix が必要か**、**保留の根拠は何か**を記録する。結論を元に `package.json` と README に方針を明記する。

### 対象

- `npm audit` の full report 解析
- 各脆弱性の（a）攻撃面（b）トリガー条件（c）本プロジェクトでの悪用可能性を評価
- Fix 手段の選択（immediate / defer）と理由の文書化

### 対象外

- Capacitor 7/8 系へのメジャーアップグレード（別タスク）
- `@capacitor/assets` の代替ツール選定（現時点で必要性なし）

## 2. 調査結果

### 2.1 プロダクション影響

```
$ npm audit --omit=dev
found 0 vulnerabilities
```

**shipped Android APK に同梱される dependencies には脆弱性なし**。dependencies は以下 3 点のみ:

- `@capacitor-community/admob@6.0.0`
- `@capacitor/android@6.2.0`
- `@capacitor/core@6.2.0`

### 2.2 devDependencies の 8 件

`npm audit --json` 解析結果:

| # | パッケージ | severity | via | 攻撃ベクタ | トリガー |
| --- | --- | --- | --- | --- | --- |
| 1 | `@capacitor/assets` | high | 推移的 | `@capacitor/cli` + `@trapezedev/project` 経由 | build-time のみ |
| 2 | `@capacitor/cli` | high | `tar` | tar symlink / hardlink path traversal | 悪意ある tarball 展開時 |
| 3 | `@trapezedev/project` | high | `@xmldom/xmldom`, `mergexml`, `replace` | XML injection / ReDoS | 悪意ある XML / glob 処理時 |
| 4 | `@xmldom/xmldom` | high | CVE-GHSA-wh4c-j3r5-mjhp | XML injection via unsafe CDATA | 攻撃者が書いた XML を parse |
| 5 | `mergexml` | high | `@xmldom/xmldom` | 同上 | 同上 |
| 6 | `minimatch` | high | 3 件の CVE | ReDoS via 特殊 glob パターン | 攻撃者が書いた glob 実行 |
| 7 | `replace` | high | `minimatch` | ReDoS | 同上 |
| 8 | `tar` | high | 6 件の CVE | path traversal / symlink poisoning / race | 攻撃者作成 tarball 展開 |

### 2.3 脆弱性のトリガー条件

すべての脆弱性は **「攻撃者が作成したデータを tool に処理させる」** ことで発現する。本プロジェクトの使い所は:

- `@capacitor/assets`: `assets/icon.png`, `assets/splash.png`（自分で置いた画像）を処理
- `@capacitor/cli`: `android/` 配下の AndroidManifest.xml / strings.xml（自分で書いた XML）を処理、`cap sync` で `www/` → Android プロジェクトへファイルコピー
- 関連の tar/glob は npm 自身または上記ツール内部での依存取得・リソース展開用

**悪意ある入力が存在しない**限り、これらの脆弱性は CI も開発者マシンも脅かさない。

### 2.4 Fix 手段の検討

| 案 | 内容 | 影響 | 判断 |
| --- | --- | --- | --- |
| (a) `npm audit fix` | 非破壊変更のみで修正 | `replace`→内部 `minimatch` 更新のみ（範囲内）。@capacitor/cli と @capacitor/assets には効かない（major bump が必要） | 効果限定的 |
| (b) `npm audit fix --force` | `@capacitor/cli@8.3.1` に major bump | Capacitor **6.2.0** dependencies と cli の **メジャーバージョン不一致** 発生。`@capacitor/android@6`, `@capacitor/core@6` との互換性未確認。Android プロジェクトの再生成が必要になる可能性 | 現スコープでは不採用。Task #11（実機確認）の後に別タスクで検討 |
| (c) 保留（現状維持） | 方針を文書化して記録 | devDep のみ、トリガー条件なしのため実質影響ゼロ | **採用** |

### 2.5 判断

**(c) 保留** を採用。

根拠:

1. **プロダクション影響なし**: shipped APK に混入しない
2. **開発環境の悪用可能性なし**: 脆弱性トリガーは「悪意ある tarball / XML / glob」の解析。本プロジェクトでは自分の書いたファイルのみ処理する
3. **fix --force は互換性リスク**: Capacitor 6 系統との整合が崩れる。#11 実機確認後、Capacitor 8 系へのフル移行タスクとして切り出す方が安全

## 3. 対応

### 3.1 ドキュメント

- 本ファイル（`docs/tasks/008-npm-audit.md`）に判断根拠を保存
- README のトラブルシューティングに一行、audit 結果の見方を追記する（任意）

### 3.2 package.json の変更

なし。依存バージョン固定のまま。

### 3.3 後続タスク

- Task #17 (WebView bundler) とは独立。並行で進行可
- 将来タスク案: **Capacitor 7/8 メジャーアップグレード**（別途仕様書で。Android build.gradle、Gradle wrapper、cap config 互換性調査含む）

## 4. 受け入れ基準

| ID | 確認内容 | 結果 |
| --- | --- | --- |
| AC-001 | `npm audit --omit=dev` が 0 件 | Pass（found 0 vulnerabilities）|
| AC-002 | devDep 8 件の来歴が文書化されている | Pass（§2.2 表参照）|
| AC-003 | 各脆弱性のトリガー条件と本プロジェクトでの悪用可能性が記録されている | Pass（§2.3 参照）|
| AC-004 | 対応判断（fix / defer）と理由が明文化されている | Pass（§2.5 参照）|
| AC-005 | 既存テストと harness:check が引き続き pass | 本タスクでコード変更なし、テスト結果に影響なし |

## 5. 判定

**Pass**。8 件の high severity は本プロジェクトの実害ゼロと判定し、`@capacitor/cli` のメジャーバージョン up は #11 実機確認後に別タスクで扱う。
