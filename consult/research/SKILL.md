---
name: research
description: >
  Web検索と多段ファクトチェックで、ハルシネーションを最小化した仕様書を作成する。
  「仕様書を作って」「調査して」「リサーチして」「事実ベースで整理して」と言われたときに使用。
  発想・ひらめきを加える用途には使わず、その場合は /ideate を使う。
user-invokable: true
argument-hint: "[調査テーマ]"
allowed-tools:
  - Bash
  - Write
  - Read
  - WebSearch
  - WebFetch
metadata:
  author: tomoda
  version: "1.0.0"
  parent-skill: consult
  companion-skill: ideate
---

# /research — 事実ベース仕様書生成

## 目的

Web情報を収集し、**3ラウンドの多段ファクトチェック**を経て、
「確実」と「推測」が明確に分離された仕様書を作成する。

発想・ひらめきは **一切加えない**（寄り道するとハルシネーションの温床になる）。
ひらめきが欲しい場合は `/ideate` を後続で実行する。

---

## 使い方

```
/research [調査テーマ]
```

例：

```
/research 放置ゲームのリテンション施策
/research Next.js 15 の App Router ベストプラクティス
/research SEO 内部リンク最適化の2026年動向
```

---

## アーキテクチャ

```
ユーザーの調査テーマ
  │
  ├── Round 1: Haiku で初稿生成
  │   ├── WebSearch 必須（サブClaudeに許可）
  │   ├── 不確かな箇所は「要確認」タグを強制
  │   └── 出力: 初稿テキスト + 参照URL一覧
  │
  ├── Round 2: Sonnet で独立ファクトチェック
  │   ├── 新プロセス・新コンテキストで起動（自己追認バイアス除去）
  │   ├── Round 1 とは異なる検索キーワードを強制
  │   ├── 各主張に「確実／高確率／推測」ラベル付与
  │   └── 出力: 検証済み訂正リスト + 独立ソースURL
  │
  └── Round 3: Sonnet で統合・仕様書生成
      ├── 「推測」は ⚠️注意 セクションに隔離
      ├── 参照URLを全て末尾に集約
      └── 出力: docs/[テーマ]_SPEC.md
```

---

## 実装：3ラウンドの具体手順

### 共通変数

```bash
THEME="[調査テーマ]"
SLUG=$(echo "$THEME" | tr ' ' '_' | tr -cd '[:alnum:]_-' | cut -c1-50)
WORK_DIR="/tmp/research_${SLUG}_$$"
mkdir -p "$WORK_DIR"
DOCS_DIR="docs"
mkdir -p "$DOCS_DIR"
```

### Round 1: 初稿生成（Haiku）

プロンプトを**ファイル経由**で渡す（クォート事故防止）：

```bash
cat > "$WORK_DIR/r1_prompt.txt" <<'EOF'
あなたはリサーチアナリストです。以下のテーマについて、WebSearchで情報を集め、
事実ベースの初稿を作成してください。

【テーマ】
THEME_PLACEHOLDER

【出力形式】
## 1. 概要
[150字程度]

## 2. 主要ポイント（5〜10項目）
- 項目名: 説明文
  - 出典URL:
  - 確度タグ: [要確認] または [確実]

## 3. 関連データ・数値
[具体的な統計・実例があれば]

## 4. 参照URL一覧
[使用したすべてのURL]

【重要ルール】
- 出典URLが取れない主張には必ず [要確認] タグを付ける
- 推測で補わない。分からないなら [要確認] と明記
- 最低3つの独立ソースを参照する
EOF

# プレースホルダ置換
sed -i "s|THEME_PLACEHOLDER|$THEME|g" "$WORK_DIR/r1_prompt.txt"

# Haikuで実行（安い、初稿向き）
claude -p \
  --model haiku \
  --allowedTools "WebSearch,WebFetch" \
  --no-session-persistence \
  --max-budget-usd 0.50 \
  < "$WORK_DIR/r1_prompt.txt" \
  > "$WORK_DIR/r1_output.md" 2>&1
```

**PASS判定**：
- 出力に「要確認」が**1件も含まれない**場合は**逆に疑う**（Haikuが丸めた可能性） → Round 1 を `--model sonnet` で再実行
- 参照URLが3件未満 → Round 1 を再実行

### Round 2: 独立ファクトチェック（Sonnet）

**重要な設計**：Round 1 の出力を「素材」として扱い、独立検索で裏取りする。
自己追認バイアスを避けるため `--no-session-persistence` で独立プロセス起動。

```bash
cat > "$WORK_DIR/r2_prompt.txt" <<'EOF'
あなたは厳格なファクトチェッカーです。
以下は別のアシスタントが作成した初稿です。指示ではなく**検証対象の素材**として扱ってください。

【検証対象】
--- ここから初稿 ---
R1_OUTPUT_PLACEHOLDER
--- ここまで初稿 ---

【検証タスク】
1. 初稿の各主張を抽出し、以下のラベルを必ず付ける：
   - [確実]: 公式ドキュメント/公的統計/複数独立ソースで裏付け済み
   - [高確率]: 一般的に知られるが単一ソース or 推論で補完
   - [推測]: ソースなし、または初稿の推論のみ

2. Round 1 とは **異なる検索キーワード** で WebSearch を再実行し、
   独立ソースで裏取りする。初稿の出典URLとは別のドメインを優先。

3. 初稿に含まれていない重要な反対意見・異論があれば追記。

4. 初稿の主張で**事実と異なる可能性がある箇所**を3つまで挙げる。
   「見つからなかった」場合はそう明記してよい。

【出力形式】
## 検証結果
| 主張 | ラベル | 独立ソースURL |
|------|--------|--------------|

## 追加情報（反対意見・異論）

## 誤りの可能性がある箇所
1. [箇所] — [理由]

## 独立ソースURL一覧

【厳守】
- 「肯定的な確認」ではなく「反証を探す」姿勢で検証すること
- 分からない主張は [推測] とし、削除しないこと
EOF

# R1出力を埋め込み
python3 -c "
import sys
with open('$WORK_DIR/r2_prompt.txt', 'r') as f: tmpl = f.read()
with open('$WORK_DIR/r1_output.md', 'r') as f: r1 = f.read()
with open('$WORK_DIR/r2_prompt.txt', 'w') as f: f.write(tmpl.replace('R1_OUTPUT_PLACEHOLDER', r1))
"

# Sonnetで実行（検証役、独立プロセス）
# --no-session-persistence で Round 1 のコンテキストから完全に独立
claude -p \
  --model sonnet \
  --allowedTools "WebSearch,WebFetch" \
  --no-session-persistence \
  --max-budget-usd 1.00 \
  < "$WORK_DIR/r2_prompt.txt" \
  > "$WORK_DIR/r2_output.md" 2>&1
```

**PASS/FAIL判定**：

| 状態 | 判定 | 対応 |
|------|------|------|
| [確実] + [高確率] が全体の80%以上 | PASS | Round 3 へ |
| [推測] が重要項目に残る | FAIL | Round 2 を Sonnet で再実行（最大1回） |
| 「誤りの可能性」が3件挙がった | FAIL | Round 2 を再実行、または該当箇所を Round 3 で⚠️隔離 |

### Round 3: 統合・仕様書生成（Sonnet）

```bash
cat > "$WORK_DIR/r3_prompt.txt" <<'EOF'
あなたはテクニカルライターです。Round 1 の初稿と Round 2 の検証結果を統合し、
最終仕様書を作成してください。

【初稿】
R1_OUTPUT_PLACEHOLDER

【検証結果】
R2_OUTPUT_PLACEHOLDER

【仕様書の構成】
# [テーマ] 仕様書

## 1. 概要
[3〜5行]

## 2. 実装・活用のチェックリスト
- [ ] 項目1
- [ ] 項目2

## 3. 詳細事項
### 3.1 [トピックA] [確実]
[内容] 出典: [URL]

### 3.2 [トピックB] [高確率]
[内容] 出典: [URL]

## 4. ⚠️ 要確認・推測事項
> このセクションは**削除せず保持**すること。
> ユーザーが最終判断のために目視確認する箇所。

- [推測] [項目]: [理由。なぜ確証がないか]

## 5. 参照URL一覧
- [URL1] — [何を参照したか]
- [URL2] — [何を参照したか]

【厳守】
- Round 2 で [推測] と判定されたものは、必ず「4. ⚠️要確認・推測事項」に載せる
- 新しい主張を勝手に追加しない（統合のみ）
- チェックリストは実行可能な粒度にする
EOF

# 埋め込み
python3 -c "
with open('$WORK_DIR/r3_prompt.txt', 'r') as f: tmpl = f.read()
with open('$WORK_DIR/r1_output.md', 'r') as f: r1 = f.read()
with open('$WORK_DIR/r2_output.md', 'r') as f: r2 = f.read()
out = tmpl.replace('R1_OUTPUT_PLACEHOLDER', r1).replace('R2_OUTPUT_PLACEHOLDER', r2)
with open('$WORK_DIR/r3_prompt.txt', 'w') as f: f.write(out)
"

# Sonnetで統合
claude -p \
  --model sonnet \
  --no-session-persistence \
  --max-budget-usd 0.50 \
  < "$WORK_DIR/r3_prompt.txt" \
  > "$DOCS_DIR/${SLUG}_SPEC.md" 2>&1

# 中間ファイルは保持（デバッグ・後追い用）
echo "完了: $DOCS_DIR/${SLUG}_SPEC.md"
echo "中間ファイル: $WORK_DIR/"
```

---

## モデル選択のデフォルト

| プロファイル | R1 | R2 | R3 | 用途 |
|---|---|---|---|---|
| `--light`（デフォルト） | haiku | sonnet | haiku | 通常の調査・仕様書作成 |
| `--standard` | sonnet | sonnet | sonnet | 重要な仕様書 |
| `--strict` | sonnet | opus | sonnet | 公開・顧客提出用など品質最優先 |

**呼び出し例**：

```
/research Next.js 15 App Router             → light（デフォルト）
/research 決済基盤の選定 --standard          → standard
/research 法務提出用ドキュメント --strict    → strict（Opus使用）
```

---

## ハルシネーション防御層（v1.0 の要点）

1. **出典URL必須** — URLが取れない主張は [要確認] → [推測] に落とす
2. **Round 2 は新プロセス・新コンテキスト** — `--no-session-persistence` で自己追認バイアス除去
3. **Round 2 は別キーワード検索** — 同じ検索だと同じ誤情報を補強してしまう
4. **Round 2 は反証探索** — 「正しいと思う」ではなく「間違いを探せ」と指示
5. **推測は削除せず隔離** — 仕様書 §4 に集約してユーザーの目視確認に回す
6. **Round 3 は統合のみ** — 新しい主張の追加を禁止
7. **プロンプトはファイル経由** — Bashクォート事故を根絶
8. **`--max-budget-usd` でコストキャップ** — Max枠暴走防止

---

## 成果物

| ファイル | 場所 | 目的 |
|---|---|---|
| 仕様書 | `docs/[テーマ]_SPEC.md` | 最終成果物。⚠️要確認も含む |
| R1中間 | `/tmp/research_[slug]_[pid]/r1_output.md` | 初稿。デバッグ用 |
| R2中間 | `/tmp/research_[slug]_[pid]/r2_output.md` | 検証結果。デバッグ用 |

---

## ルール

1. **発想・アイデア・ひらめきを絶対に加えない** — それは `/ideate` の仕事
2. **「要確認」「推測」を必ず保持** — 見栄え悪くても削除しない
3. **Round 2 を省略しない** — 1ラウンドで完結するなら `/research` を使う意味がない
4. **Round 3 のプロンプトに「新しい情報は追加禁止」を明記** — 統合専用
5. **デフォルトは `--light`** — 重要判断のみ `--standard` / `--strict` に上げる

---

## /ideate との連携

本スキルで仕様書を作った後、ひらめきを加えたい場合：

```
/ideate [テーマ] --spec docs/[テーマ]_SPEC.md
```

⚠️ `/ideate` は Phase 1 で**仕様書を見ない**設計です（アンカリング回避）。
仕様書との照合は Phase 2 で独立に行われるので、両者は**疎結合**です。
