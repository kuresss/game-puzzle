---
name: auto-consult
description: >
  新しい企画・アイデア・仕様を考え出すための3ステップ自動相談スキル。
  事実調査（Web検索）→ 発想発散（Opus）→ 接地分類を順に実行し、
  3つの成果物（SPEC / WILD / INSIGHT）を一気に生成する。
  
  以下のような命令で必ず起動する：
  
  ゲーム制作系:
  - 「新しいゲームを作って」「新しいゲームを作り出して」
  - 「ゲームを作りたい」「ゲームの企画を立てて」
  - 「面白いゲームを考えて」「ゲームのアイデアを出して」
  - 「既存ゲームの改善案を出して」「難易度を上げるメカニクスを考えて」
  - 「◯◯ゲームに搭載する機能を考えて」
  
  一般企画・技術選定系:
  - 「◯◯について調べて新しい発想も出して」
  - 「◯◯を実装するために何が良いか考えて」
  - 「◯◯の改善案がほしい」「◯◯を企画して」
  - 「新しい◯◯を作り出して」「◯◯の設計を考えて」
  
  テーマが曖昧な場合（「新しいゲームを作って」だけなど）は、
  AskUserQuestion でジャンル・ターゲット・方向性を先に確認してから実行する。
  
  明確なテーマ指定がある場合（「パズルゲームの難易度を上げる新メカニクス」など）は
  確認をスキップして即実行。
  
  内部で /research と /ideate を順に呼び出し、
  手動で3コマンド打つ手間をなくす統合スキル。
user-invokable: true
argument-hint: "[テーマ（曖昧可、空でもOK）] [--skip-research] [--skip-grounding] [--profile ...]"
allowed-tools:
  - Bash
  - Write
  - Read
  - WebSearch
  - WebFetch
  - AskUserQuestion
metadata:
  author: tomoda
  version: "1.2.0"
  parent-skill: consult
  depends-on:
    - research
    - ideate
---

# /auto-consult — 3ステップ全自動相談

## 目的

テーマ1つで、以下の4ステップを **自動順次実行** する：

0. **Step 0: テーマ決定**（必要時のみ）— 3つのモードから自動判定
   - モードA: 明確指定済み → 即 Step 1 へ
   - モードB: 部分指定あり → 欠けた項目だけ質問
   - **モードC: 完全おまかせ → Claude が Opus で企画候補5つを提案 → ユーザーが選択**
1. **Step 1: /research** — Webから事実を集めて仕様書化
2. **Step 2: /ideate**（ブラインド発散）— 仕様書を見ずに飛躍した発想を生成
3. **Step 3: /ideate --spec**（接地）— 発想と仕様書を突き合わせて3分類

**「新しいゲームを作って」だけでも、Claude自身が企画候補を生み出し、ユーザーは選ぶだけで済む**のが特徴。
「何を作るかもClaudeに考えてほしい」というニーズに応える設計。
中身は既存の `/research` と `/ideate` スキルをそのまま連携呼び出しするだけなので、
設計思想・ハルシネーション防御は両スキルから完全に継承される。

---

## 使い方

### パターン1: 自然言語で命令（推奨・曖昧OK）

普通に日本語で話しかけるだけ。Claudeがトリガーを検出して起動する：

```
新しいゲームを作って
新しいパズルゲームを考えて
難易度を上げるメカニクスを実装したい
このゲームに新しい要素を搭載したい
何か面白いゲームアイデアほしい
```

→ 情報が足りなければ Step 0 でジャンル・ターゲット等を質問される。
→ 答えるだけで、あとは自動で3ステップ進行。

### パターン2: 明示的なコマンド形式（具体的なテーマがある場合）

```
/auto-consult [テーマ]
```

例：

```
/auto-consult パズルゲームの難易度を上げる新メカニクス
/auto-consult モバイルゲームのリテンション改善
/auto-consult Next.js 15 の App Router 導入戦略
```

テーマが明確なので Step 0 はスキップ、即 Step 1 開始。

### 成果物（全パターン共通）

10〜20分で3ファイルが生成される：

- `docs/[slug]_SPEC.md` — 事実ベース仕様書（/research の出力）
- `docs/[slug]_WILD.md` — 飛躍アイデア5〜10個（/ideate Phase 1 の出力）
- `docs/[slug]_INSIGHT.md` — 3分類接地済みひらめき（/ideate Phase 2 の出力）

### オプション

| フラグ | 効果 |
|---|---|
| `--skip-research` | Step 1 を省略。既に仕様書がある場合に使う。`--spec` で仕様書パス指定も可能 |
| `--skip-grounding` | Step 3 を省略。発散だけで十分な場合 |
| `--profile light` | /research を安くする（R1/R2/R3 = haiku/sonnet/haiku、デフォルト） |
| `--profile standard` | /research を中品質にする（R1/R2/R3 = sonnet/sonnet/sonnet） |
| `--profile strict` | /research を最高品質にする（R1/R2/R3 = sonnet/opus/sonnet） |
| `--ideate-profile budget` | /ideate を安くする（Phase 1 を sonnet に降格） |
| `--ideate-profile pro` | /ideate を最高品質にする（Phase 2 も opus に昇格） |
| `--spec [パス]` | Step 1 をスキップして、既存仕様書を Step 3 に流し込む |

---

## 実装：Claude Code への実行指示

`/auto-consult` が呼び出されたら、**このスキルを読んだ外側のClaude（Claude Code本体）** は以下の手順で実行する：

### Step 0: テーマ決定（3モード自動判定）

ユーザーの命令を分析し、以下の3モードのいずれかで処理する。

#### モード判定ロジック

| ユーザーの入力例 | モード | 挙動 |
|---|---|---|
| 「パズルゲームの難易度を上げる新メカニクス」 | **A: 明確指定** | Step 0 スキップ、即 Step 1 |
| 「パズルゲームを作って」「モバイルゲームを考えて」 | **B: 部分指定** | 欠けた項目だけ AskUserQuestion で質問 |
| 「新しいゲームを作って」「何か面白いゲーム考えて」 | **C: 完全おまかせ** | Opus で企画候補5つ生成 → ユーザー選択 |

判定基準：
- **モード A**：テーマにジャンル・対象・機能/狙いが最低2つ含まれる
- **モード B**：ジャンル等が1つだけ明示（他は不明）
- **モード C**：「新しい」「面白い」「何か」などの抽象語のみ、またはジャンルすら未指定

---

#### モード A: 明確指定（Step 0 スキップ）

そのまま THEME = 入力文字列 として Step 1 に進む。

例：
- 入力: 「パズルゲームの難易度を上げる新メカニクス」
- THEME: "パズルゲームの難易度を上げる新メカニクス"

---

#### モード B: 部分指定（欠けた項目だけ質問）

明示されていない要素だけを AskUserQuestion で質問する（最大3問）。

質問対象：
- ジャンル、ターゲット層、プラットフォーム、重視要素 のうち、未指定のもの

例：
- 入力: 「パズルゲームを作って」（ジャンルだけ明示）
- 質問: ターゲット / プラットフォーム / 重視要素 の3つだけ
- 回答後: THEME = "モバイル向けカジュアルパズルゲームの難易度重視設計"（など）

---

#### モード C: 完全おまかせ（企画候補生成）

**ここが肝**。Claude自身がOpusで企画候補を5つ生成し、ユーザーは選ぶだけ。
「ひらめきもClaudeが担う」モード。

##### Step 0-C-1: 企画候補生成（Opus、ミニ発散）

サブClaude（Opus）を呼び出し、多様なゲーム企画を5つ生成する。
プロジェクトのコンテキスト（作業ディレクトリ名、既存ファイル等）を参考にしつつ、
**多様性**を確保して提案する。

```bash
# コンテキスト情報の収集
CWD_NAME=$(basename "$PWD")
EXISTING_FILES=$(ls -la *.md 2>/dev/null | head -20)

cat > "$WORK_DIR/p0c_prompt.txt" <<'EOF'
あなたはゲーム企画のプロデューサーです。
以下のコンテキストを踏まえ、**多様性のある新しいゲーム企画を5つ**提案してください。

【コンテキスト】
- 作業ディレクトリ名: CWD_PLACEHOLDER
- 既存のマークダウンファイル: FILES_PLACEHOLDER

【出力要件】
1. 企画を5つ出す
2. **5つは互いにジャンル・方向性が重複しないこと**（例：全部パズル、はダメ）
   - 最低3種類のジャンルを混ぜる（パズル / アクション / シミュレーション等）
   - ターゲット層も変化をつける（カジュアル / コア / 全年齢）
3. 各企画に以下のラベルを付ける：
   - [挑戦] 既存の市場にあまりない、差別化の強い企画
   - [堅実] 既存市場に実績があり、リスクの低い企画
   - [実験] 面白いが実現難度が高い、検証的な企画
   - ラベル比率目安: 挑戦2 / 堅実2 / 実験1

4. 各企画は以下のフォーマットで：

## 企画N: [タイトル（15文字以内）] [ラベル]
**一言で言うと**: [1文、30文字以内]
**ジャンル**: [パズル/アクション/RPG/シミュレーション/他]
**ターゲット**: [カジュアル/コア/全年齢/子供/シニア など]
**プラットフォーム**: [モバイル/PC/コンソール/Web]
**独自性**: [2〜3文で、他と違う点]
**想定される面白さ**: [2〜3文]
**リスク**: [1〜2文、実現上の懸念]

【厳守ルール】
- 実在ゲームの模倣・焼き直しを避ける（例：「Tetrisの◯◯版」はダメ）
- ただし**公知のジャンル定義の上に新しい組み合わせ**はOK
- 実現不可能なほど飛躍しすぎない（「脳直結VR」等は避ける）
- かつ、**当たり障りのない企画**も避ける（差別化ポイントが弱いものは却下）
- 各企画の独自性は必ず異なる角度から出すこと
EOF

# プレースホルダ置換
python3 -c "
with open('$WORK_DIR/p0c_prompt.txt', 'r') as f: tmpl = f.read()
out = tmpl.replace('CWD_PLACEHOLDER', '$CWD_NAME').replace('FILES_PLACEHOLDER', '''$EXISTING_FILES''')
with open('$WORK_DIR/p0c_prompt.txt', 'w') as f: f.write(out)
"

# Opusで実行（企画の質がスキル全体の印象を決めるので、ここもケチらない）
claude -p \
  --model opus \
  --no-session-persistence \
  --max-budget-usd 1.00 \
  < "$WORK_DIR/p0c_prompt.txt" \
  > "$WORK_DIR/p0c_candidates.md" 2>&1
```

##### Step 0-C-2: ユーザー選択（AskUserQuestion）

生成した5つの企画を、AskUserQuestion の options に展開する。
各 option の `preview` フィールドに企画の詳細を載せることで、ユーザーがホバーで中身を確認できる。

```
質問: Claude が5つの企画を考えました。どれで進めますか？

Option 1: [企画1タイトル] [ラベル]
  preview: 企画1の全文（一言で言うと〜想定される面白さまで）

Option 2: [企画2タイトル] [ラベル]
  preview: 企画2の全文

Option 3: [企画3タイトル] [ラベル]
  preview: 企画3の全文

Option 4: [企画4タイトル] [ラベル]  
  preview: 企画4の全文（※Claude Code の AskUserQuestion は最大4択なので、企画5と「おまかせ」を統合する）

Option 4': 🎲 Claude におまかせ（最有望な企画を自動選択）
  preview: 「挑戦」ラベルの中から Claude が最有力と判断したものを選ぶ
```

※ AskUserQuestion は options が2〜4個という制約があるため、企画5を表示しきれない場合は
「企画4 と 『おまかせ』」の2択に集約、または「もっと候補を見る」オプションで p0c_candidates.md を表示する。

##### Step 0-C-3: テーマ構築

ユーザーが選んだ企画から、THEME を構築する：

```
選ばれた企画の「タイトル + ジャンル + ターゲット + 独自性のキーワード」を組み合わせる
 ↓
THEME = "[タイトル]: [ジャンル] × [ターゲット] × [独自性キーワード]"

例:
企画: "ロジカル・ランチ" / パズル / カジュアル / 組み合わせ発想型
THEME = "ロジカル・ランチ: モバイル向けカジュアルパズル（組み合わせ発想メカニクス）"
```

「おまかせ」が選ばれた場合は、Claude が [挑戦] ラベルの中から最も多様性・実現性・面白さのバランスが取れたものを判定して自動選択する。

### 準備

```bash
# Step 0 を経た or 引数で明示されたテーマ
THEME="[明確化されたテーマ]"
SKIP_RESEARCH="[--skip-research があれば true]"
SKIP_GROUNDING="[--skip-grounding があれば true]"
PROFILE="[--profile の値、デフォルト: light]"
IDEATE_PROFILE="[--ideate-profile の値、デフォルト: standard]"
CUSTOM_SPEC="[--spec の値、任意]"

SLUG=$(echo "$THEME" | tr ' ' '_' | tr -cd '[:alnum:]_-' | cut -c1-50)
DOCS_DIR="docs"
mkdir -p "$DOCS_DIR"

echo "🚀 /auto-consult 開始: $THEME"
echo "   profile=$PROFILE, ideate-profile=$IDEATE_PROFILE"
echo ""
```

### Step 1: /research の実行

**--skip-research が指定されていない場合のみ実行**。

外側Claudeは `research/SKILL.md` を読み、そこに書かれた Round 1〜3 のBashコマンドを **$THEME と $PROFILE の値を埋め込んで** 実行する。

```bash
if [ "$SKIP_RESEARCH" != "true" ]; then
  echo "📚 Step 1/3: /research 実行中..."
  # research/SKILL.md の Round 1〜3 を $THEME, $PROFILE で実行
  # 出力: docs/${SLUG}_SPEC.md
  SPEC_PATH="$DOCS_DIR/${SLUG}_SPEC.md"
  echo "✅ Step 1 完了: $SPEC_PATH"
elif [ -n "$CUSTOM_SPEC" ]; then
  SPEC_PATH="$CUSTOM_SPEC"
  echo "⏭️  Step 1 スキップ（既存仕様書使用: $SPEC_PATH）"
else
  SPEC_PATH=""
  echo "⏭️  Step 1 スキップ（仕様書なし、接地なし）"
fi
echo ""
```

### Step 2: /ideate Phase 1（ブラインド発散）の実行

**必ず実行**。仕様書は絶対に渡さない。

外側Claudeは `ideate/SKILL.md` を読み、**Phase 1** のBashコマンドを **$THEME と $IDEATE_PROFILE の値を埋め込んで** 実行する。

```bash
echo "💡 Step 2/3: /ideate Phase 1（発散）実行中..."
# ideate/SKILL.md の Phase 1 を $THEME, $IDEATE_PROFILE で実行
# 仕様書は絶対に渡さない（アンカリング防止）
# 出力: docs/${SLUG}_WILD.md
WILD_PATH="$DOCS_DIR/${SLUG}_WILD.md"
echo "✅ Step 2 完了: $WILD_PATH"
echo ""
```

### Step 3: /ideate Phase 2（接地）の実行

**--skip-grounding が指定されていない、かつ $SPEC_PATH が存在する場合のみ実行**。

外側Claudeは `ideate/SKILL.md` を読み、**Phase 2** のBashコマンドを **$THEME, $SPEC_PATH, $IDEATE_PROFILE の値を埋め込んで** 実行する。

```bash
if [ "$SKIP_GROUNDING" != "true" ] && [ -n "$SPEC_PATH" ] && [ -f "$SPEC_PATH" ]; then
  echo "🎯 Step 3/3: /ideate Phase 2（接地）実行中..."
  # ideate/SKILL.md の Phase 2 を $THEME, $SPEC_PATH, $IDEATE_PROFILE で実行
  # 出力: docs/${SLUG}_INSIGHT.md
  INSIGHT_PATH="$DOCS_DIR/${SLUG}_INSIGHT.md"
  echo "✅ Step 3 完了: $INSIGHT_PATH"
else
  INSIGHT_PATH=""
  echo "⏭️  Step 3 スキップ（仕様書がない or --skip-grounding 指定）"
fi
echo ""
```

### 完了サマリー

```bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 /auto-consult 完了"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "成果物:"
[ -n "$SPEC_PATH" ] && [ -f "$SPEC_PATH" ] && echo "  📚 事実仕様書: $SPEC_PATH"
[ -n "$WILD_PATH" ] && [ -f "$WILD_PATH" ] && echo "  💡 発散アイデア: $WILD_PATH"
[ -n "$INSIGHT_PATH" ] && [ -f "$INSIGHT_PATH" ] && echo "  🎯 接地ひらめき: $INSIGHT_PATH"
echo ""
echo "推奨する読む順序:"
echo "  1. INSIGHT.md（結論・3分類）"
echo "  2. WILD.md（発想オリジナル）"
echo "  3. SPEC.md（事実根拠）"
echo ""
echo "⚠️ INSIGHT.md と SPEC.md の ⚠️要確認マークは目視確認推奨"
```

---

## エラー時の挙動

| エラー状況 | 挙動 |
|---|---|
| Step 1 が失敗 | Step 2, 3 は中断。エラー内容を表示 |
| Step 2 が失敗 | Step 3 は中断。ただし Step 1 の成果物は保持 |
| Step 3 が失敗 | Step 1, 2 の成果物は保持。Step 3 のみ手動再実行を促す |
| `--max-budget-usd` に達した | サブClaudeが停止。途中成果物は保持 |

**途中結果が残るので、失敗しても完全にやり直す必要はない**。失敗した Step だけ単独の `/research` や `/ideate` で再実行できる。

---

## ハルシネーション防御（継承）

このスキル自体には新しい防御ロジックは追加していない。
すべて `/research` と `/ideate` が持つ防御機構をそのまま使う：

- `/research`: Web独立裏取り、確実/高確率/推測の3ラベル、⚠️注意への隔離
- `/ideate`: 仕様書ブラインド発散、[根拠あり/推測/想像]ラベル、⚠️要確認保持

**追加ルール**：Step 2（発散）は **必ず Step 1 の仕様書を物理的に見ない** 状態で実行する。
Step 1 のあとに Step 2 を走らせるとき、**仕様書パスを Phase 1 のプロンプトに絶対に渡さない**。
これがアンカリング防止の生命線。

---

## /research や /ideate を単独で呼ぶべきとき

以下の場面では `/auto-consult` を使わず、単独スキルを直接呼ぶ：

| 場面 | 使うスキル |
|---|---|
| 事実だけ整理したい、発想不要 | `/research` 単独 |
| 既存仕様書をもう一度違う角度で発散したい | `/ideate --spec [パス]` 単独 |
| 別テーマで発散だけしたい | `/ideate` 単独 |
| 既に SPEC.md を作ってあり、ひらめきだけ新規に欲しい | `/auto-consult --skip-research --spec [パス]` |

`/auto-consult` はあくまで **3ステップ全部やりたいとき** のショートカット。

---

## ルール

1. **曖昧な命令には必ず Step 0 でモード判定** — 勝手にテーマを決めない
2. **モード C では企画候補を必ず5個生成** — 選択肢が少ないと自由度が下がる
3. **モード C の企画は多様性を確保** — 全部同じジャンルは却下
4. **モード C の企画は実在作品の模倣禁止** — 公知ジャンルの新しい組み合わせはOK
5. **明確なテーマ指定は Step 0 をスキップ** — 過度な確認はユーザー体験を損なう
6. **Step 2 は絶対に仕様書を見ない** — 継承ルールの徹底
7. **失敗時は次のStepに進まない** — 壊れた成果物の連鎖を防ぐ
8. **中間成果物は常に保持する** — 部分的な再実行が可能な状態にする
9. **プロファイル未指定時は `--profile light`** — デフォルトでMax枠節約
10. **全Step完了後は3ファイルのパスを明示** — ユーザーが迷わず読める
11. **`/research` と `/ideate` の SKILL.md を直接読んで実行** — 重複実装せず、元の設計思想を継承
12. **Step 0 の質問は4問まで** — 過剰な質問はユーザー体験を悪化させる
13. **「おまかせ」選択時は [挑戦] ラベルから自動選択** — 無難な企画を避けて差別化重視

---

## 典型ユースケース

### ケース1：完全おまかせ（モード C、ひらめきもClaudeに任せる）

**ユーザーの入力：**
```
新しいゲームを作って
```

**Claude の挙動：**
1. トリガー検出 → `/auto-consult` を自動起動
2. モード C（完全おまかせ）と判定
3. **Opus でゲーム企画候補5つを生成**（約1〜2分）
   - 企画1: [挑戦] ロジカル・ランチ（パズル / カジュアル / モバイル）
   - 企画2: [堅実] ダンジョン・シェフ（RPG / コア / PC）
   - 企画3: [挑戦] 通勤タイクーン（シミュレーション / 全年齢 / モバイル）
   - 企画4: [堅実] リズム・ガーデン（音ゲー / カジュアル / モバイル）
   - 企画5: [実験] 音声で進む脱出ゲーム（アドベンチャー / コア / スマートスピーカー）
4. AskUserQuestion で「どの企画で進めますか？」+「🎲 Claudeにおまかせ」
5. ユーザー選択 → THEME 構築
6. Step 1〜3 を自動実行

→ 20〜30分後に3ファイル完成。**自分で何を作るか決めなくても、企画から成果物まで一気通貫**。

### ケース2：部分指定（モード B）

**ユーザーの入力：**
```
パズルゲームを作って
```

**Claude の挙動：**
1. モード B と判定（ジャンルだけ明示）
2. 欠けている項目（ターゲット / プラットフォーム / 重視要素）だけ質問
3. 回答から THEME 構築 → Step 1〜3 実行

### ケース3：具体的に指示（モード A、Step 0 スキップ）

**ユーザーの入力：**
```
パズルゲームの難易度を上げる新メカニクスを考えて
```

**Claude の挙動：**
1. トリガー検出 → `/auto-consult` を自動起動
2. モード A と判定 → Step 0 スキップ
3. THEME = "パズルゲームの難易度を上げる新メカニクス"
4. Step 1〜3 を即実行

### ケース4：既に仕様書がある場合の再ブレスト

```
/auto-consult パズルゲーム --skip-research --spec docs/既存仕様書.md
```

→ Step 0, 1 をスキップし、既存仕様書に対して新たな発想を生成して接地。

### ケース5：明示的にフラグで起動

```
/auto-consult モバイルゲームのリテンション改善 --profile strict
```

→ 明示的な呼び出し。Step 0 スキップ、研究を strict プロファイル（Opus検証）で実行。

---

## 関連スキル

- `/research`: Step 1 の本体。単独呼び出し可
- `/ideate`: Step 2, 3 の本体。単独呼び出し可
