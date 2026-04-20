# ChromaFlow — 完全詳細仕様書

**策定日**: 2026-04-20  
**策定プロセス**: auto-consult（Opus企画生成 → Haiku/Sonnet調査 → Sonnet検証 → Opus発散 → Sonnet接地）  
**バージョン**: 1.0.0

---

## 0. エグゼクティブサマリー

**ChromaFlow** は WebGL2 の GPU 流体シミュレーションを核とした、  
「絵の具のような流体を操作してお題の絵柄に近づける」パズルゲームである。

| 軸 | 設計方針 |
|---|---|
| 素人への刺さり方 | 触れた瞬間に油絵のような流体が生まれる。説明ゼロで没入 |
| プロへの刺さり方 | Navier-Stokes を GPU で解き、60fps を維持するブラウザゲーム |
| ゲームとしての深さ | 「解けない」が存在しない。逆シミュで全ステージに解が保証される |
| 差別化 | 流体 × パズル × URL シェアで「遊んだ跡が絵になる」体験 |

---

## 1. ゲーム概要

### 1.1 コアループ

```
1. ステージ開始 — お題画像（目標の流体配色）が薄く重なって表示される
2. プレイヤー操作 — タップ/ドラッグで色付きの流体を注入・誘導する
3. リアルタイム採点 — 現在の流体分布と目標の類似度がスコアバーで可視化
4. クリア判定 — 類似度が閾値（難易度により 70〜95%）を超えると花が咲く
5. リプレイ生成 — 操作の軌跡がタイムラプス合成されて「1枚の絵」になる
6. URL シェア — 絵＋シード値が URL に圧縮格納。他人が逆再生できる
```

### 1.2 操作感イメージ

- **タップ**: 流体を 1 点注入（splat）。小さな渦が生まれる  
- **ドラッグ**: 注入しながら速度ベクトルを力場に変換。速く振ると大きな乱流  
- **長押し**: 吸引（負圧 splat）で流体を引き寄せる  
- **ピンチ**: 実装なし（スコープ外）

### 1.3 難易度システム

| 難易度 | クリア類似度 | 使える色数 | 制限時間 | 説明 |
|--------|------------|----------|---------|------|
| かんたん | 70% | 3 色 | 120 秒 | 目標が大まかでよい |
| ふつう | 80% | 4 色 | 90 秒 | 標準バランス |
| むずかしい | 88% | 5 色 | 75 秒 | 精度が問われる |
| 🔴 鬼 | 95% | 6 色 | 60 秒 | GPU 流体の美しさを引き出せる人だけ |

---

## 2. ゲームデザイン詳細

### 2.1 色モデル：pH + 温度の 2 スカラー場

標準的な RGB 3 チャンネルではなく、**化学的なメタファー**を採用する（発見候補アイデア3から採用）。

```
チャンネル R → 酸性度 (pH: 0.0=酸性, 1.0=アルカリ性)
チャンネル G → 温度   (0.0=冷, 1.0=熱)
チャンネル B → 未使用（将来拡張用）
チャンネル A → 染料濃度
```

**レンダリング変換（フラグメントシェーダ内）**:

```glsl
// pH × 温度 → 表示色のマッピング
vec3 phToColor(float pH, float temp) {
  // pH 低（酸性）: 暖色（赤→オレンジ）
  // pH 高（塩基）: 寒色（青→紫）
  // temp が高いと輝度 UP、彩度 UP
  vec3 cool = mix(vec3(0.1, 0.3, 0.9), vec3(0.6, 0.1, 0.8), pH);
  vec3 warm = mix(vec3(0.9, 0.5, 0.1), vec3(0.9, 0.1, 0.1), 1.0 - pH);
  vec3 base = mix(cool, warm, 1.0 - pH);
  return base * (0.6 + temp * 0.8); // 温度で輝度変調
}
```

**プレイヤーが選ぶ色 = pH × 温度の組み合わせ**:

| 表示名 | pH | 温度 | 見た目 |
|--------|-----|------|--------|
| フレイム | 0.1 | 0.9 | 燃えるような赤 |
| コーラル | 0.2 | 0.5 | サーモンピンク |
| ゴールド | 0.3 | 0.8 | 金色 |
| アクア | 0.7 | 0.3 | 透明感のある青緑 |
| インディゴ | 0.9 | 0.2 | 深い青紫 |
| ブリザード | 0.8 | 0.0 | 冷たい白銀 |

### 2.2 ステージ設計：逆シミュレーション方式

**「解けないステージ」を原理的に排除する**（アイデア7から採用）。

**ステージ生成アルゴリズム**:

```
1. ゴール状態を定義（例: 夕焼け空の色分布）
2. ゴール状態から流体シミュを「時間逆転」して 30 秒分逆再生
   - advection を負の dt で計算
   - 外力をゼロ（ゴール状態だけから初期状態を導く）
3. 逆再生後の状態 = プレイヤーが見る「初期状態」
4. ステージデータ = {ゴール分布, 初期シード, 操作ヒント（逆再生経路）}
```

**効果**: どんな操作をしても「ゴールに近づく方向」が常に存在する。
ヒント機能は逆再生の操作列を「おすすめの動かし方」として表示可能。

### 2.3 採点アルゴリズム

**Phase 1（リリース時）: ヒストグラム類似度（GPU計算）**

```glsl
// フラグメントシェーダで全ピクセルのヒストグラムバケットを加算
// 現在: WebGL2の atomicAdd が使えないため、
//       16x16のタイルに分割してtexture reductionで集計
uniform sampler2D u_current; // 現在の流体状態
uniform sampler2D u_target;  // 目標画像

// 各 64x64 タイルの色分布差を計算し、平均類似度を出す
float tileHistogramSimilarity(vec2 tileUV) {
  // ... タイルごとの bin 比較
}
```

**Phase 2（将来）: MSE → SSIM への移行**
- SSIM は 4〜6 パス必要。第 1 版では MSE で代替
- モバイルでの計算コストを確認後に移行判断

### 2.4 操作インタラクション設計

```javascript
// 入力イベント → GPU splat 変換
class InputController {
  constructor(canvas, fluidSim) {
    this.lastPos = null;
    this.canvas = canvas;
    canvas.addEventListener('pointermove', this.onMove.bind(this));
    canvas.addEventListener('pointerdown', this.onDown.bind(this));
    canvas.addEventListener('pointerup', () => { this.lastPos = null; });
  }

  onMove(e) {
    const pos = this.getUV(e);
    if (this.lastPos && e.pressure > 0) {
      const velocity = {
        x: (pos.x - this.lastPos.x) * 8.0, // 速度増幅係数
        y: (pos.y - this.lastPos.y) * 8.0,
      };
      // 現在選択色の pH/温度をスプラット
      this.fluidSim.splat(pos, velocity, this.selectedColor);
    }
    this.lastPos = pos;
  }

  onDown(e) {
    const pos = this.getUV(e);
    // 長押し判定（500ms）で吸引モード
    this.holdTimer = setTimeout(() => {
      this.fluidSim.splat(pos, {x:0,y:0}, this.selectedColor, -1.0); // 負圧
    }, 500);
  }
}
```

---

## 3. 技術アーキテクチャ

### 3.1 技術スタック（確定）

| レイヤー | 採用技術 | 理由 |
|---------|---------|------|
| GPU シェーダ | Raw WebGL2 | MRT の細粒度制御。Three.js v137+ でも可能だが直制御を優先 |
| GLSL 管理 | esbuild-plugin-glsl | `.glsl` ファイルを ES module として import 可能 |
| ビルド | esbuild | 既存 13 ゲームと統一 |
| 言語 | TypeScript | 型安全。GLSL Uniform 型もラッパーで型管理 |
| テスト | node:test | harness-check.js と統一 |

### 3.2 シェーダパイプライン全体図

```
毎フレームの GPU パス（Semi-Lagrangian + Jacobi 圧力ソルバ）

Pass 1: Advection
  input:  velocity_tex, dye_tex (pH+temp), dt
  output: velocity_tex_next, dye_tex_next
  shader: advect.glsl — セミラグランジュ移流

Pass 2: Divergence
  input:  velocity_tex_next
  output: divergence_tex
  shader: divergence.glsl — 速度場の発散を計算

Pass 3: Jacobi × 20 回（圧力ソルバ）
  input:  pressure_tex, divergence_tex
  output: pressure_tex (ping-pong)
  shader: jacobi.glsl — 圧力収束

Pass 4: Gradient Subtract
  input:  velocity_tex_next, pressure_tex
  output: velocity_tex (非圧縮速度場)
  shader: gradsubt.glsl — 圧力勾配で速度補正

Pass 5: Splat（ユーザ入力時のみ）
  input:  velocity_tex, dye_tex, pointer pos, velocity, color
  output: velocity_tex, dye_tex
  shader: splat.glsl — ガウシアンスプラット

Pass 6: Curl Noise 添加（毎フレーム微量）
  input:  velocity_tex
  output: velocity_tex
  shader: curl.glsl — 渦を常時揺らす

Pass 7: Render
  input:  dye_tex (pH + temp + density)
  output: canvas
  shader: render.glsl — false-color マッピングで最終描画

Pass 8: Score（非毎フレーム、100ms おき）
  input:  dye_tex, target_tex
  output: score_float
  shader: score.glsl — タイルヒストグラム類似度
```

### 3.3 バッファ定義

```typescript
interface FluidBuffers {
  // ping-pong ペアを各バッファで管理
  velocity: [WebGLTexture, WebGLTexture];  // RG: vx,vy (fp32)
  dye:      [WebGLTexture, WebGLTexture];  // RG: pH,temp  A: density (fp32)
  pressure: [WebGLTexture, WebGLTexture];  // R: pressure (fp32)
  divergence: WebGLTexture;               // R: div (fp32、ping-pong不要)
  curl:       WebGLTexture;               // R: curl magnitude (fp32)
  target:     WebGLTexture;               // RGBA: お題画像 (u8)
}
```

### 3.4 グリッドサイズとパフォーマンス設定

| 環境 | シムグリッド | 表示解像度 | Jacobi 回数 | 目標 FPS |
|------|-----------|----------|------------|---------|
| デスクトップ | 256 × 256 | 1024 × 1024 | 20 | 60 |
| モバイル（High） | 192 × 192 | 768 × 768 | 16 | 60 |
| モバイル（Mid） | 128 × 128 | 512 × 512 | 12 | 60 |
| モバイル（Low） | 96 × 96 | 384 × 384 | 10 | 30 |

**自動判定ロジック**:

```typescript
function detectPerformanceTier(): 'desktop' | 'high' | 'mid' | 'low' {
  const gl = getWebGL2Context();
  if (!gl) return 'low';
  // fp16 レンダリング対応確認
  const ext = gl.getExtension('EXT_color_buffer_half_float');
  // GPU ベンダー文字列でモバイル判定
  const renderer = gl.getParameter(gl.RENDERER) as string;
  const isMobile = /Mali|Adreno|PowerVR|Apple GPU/i.test(renderer);
  // 最大テクスチャサイズで推定
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  if (!isMobile) return 'desktop';
  if (maxTex >= 8192) return 'high';
  if (maxTex >= 4096) return 'mid';
  return 'low';
}
```

### 3.5 主要シェーダ実装

**advect.glsl（Semi-Lagrangian 移流）**:

```glsl
#version 300 es
precision highp float;

uniform sampler2D u_velocity;
uniform sampler2D u_source;   // 移流対象（velocity or dye）
uniform float u_dt;
uniform vec2 u_texelSize;     // 1/width, 1/height

in vec2 v_uv;
out vec4 fragColor;

vec4 bilerp(sampler2D tex, vec2 uv) {
  vec4 st = vec4(uv - 0.5 * u_texelSize, uv + 0.5 * u_texelSize);
  vec4 q11 = texture(tex, st.xy);
  vec4 q12 = texture(tex, st.xw);
  vec4 q21 = texture(tex, st.zy);
  vec4 q22 = texture(tex, st.zw);
  vec2 f = fract(uv / u_texelSize - 0.5);
  return mix(mix(q11, q21, f.x), mix(q12, q22, f.x), f.y);
}

void main() {
  vec2 vel = texture(u_velocity, v_uv).xy;
  // 上流点（現在位置を dt 秒前に遡った位置）
  vec2 prevUV = v_uv - vel * u_dt * u_texelSize;
  fragColor = bilerp(u_source, prevUV);
}
```

**jacobi.glsl（圧力ソルバ）**:

```glsl
#version 300 es
precision highp float;

uniform sampler2D u_pressure;
uniform sampler2D u_divergence;
uniform vec2 u_texelSize;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float L = texture(u_pressure, v_uv - vec2(u_texelSize.x, 0.0)).r;
  float R = texture(u_pressure, v_uv + vec2(u_texelSize.x, 0.0)).r;
  float T = texture(u_pressure, v_uv + vec2(0.0, u_texelSize.y)).r;
  float B = texture(u_pressure, v_uv - vec2(0.0, u_texelSize.y)).r;
  float div = texture(u_divergence, v_uv).r;
  fragColor = vec4((L + R + T + B - div) * 0.25, 0.0, 0.0, 1.0);
}
```

**render.glsl（false-color 最終描画）**:

```glsl
#version 300 es
precision highp float;

uniform sampler2D u_dye;
in vec2 v_uv;
out vec4 fragColor;

vec3 phTempToColor(float pH, float temp) {
  // pH 0=酸性(赤系) 1=塩基(青系)
  vec3 acidWarm  = mix(vec3(0.95, 0.45, 0.10), vec3(0.90, 0.20, 0.10), pH * 2.0);
  vec3 baseCool  = mix(vec3(0.15, 0.55, 0.95), vec3(0.50, 0.10, 0.85), (pH - 0.5) * 2.0);
  vec3 baseColor = pH < 0.5 ? acidWarm : baseColor;
  // 温度で輝度・彩度変調
  float brightness = 0.55 + temp * 0.55;
  float saturation = 0.7 + temp * 0.35;
  vec3 gray = vec3(dot(baseColor, vec3(0.299, 0.587, 0.114)));
  return mix(gray, baseColor * brightness, saturation);
}

void main() {
  vec4 dye = texture(u_dye, v_uv);
  float pH   = dye.r;
  float temp = dye.g;
  float density = dye.a;

  vec3 color = phTempToColor(pH, temp);
  // 密度ゼロの部分は暗い背景色に
  vec3 bg = vec3(0.05, 0.05, 0.08);
  fragColor = vec4(mix(bg, color, clamp(density * 2.5, 0.0, 1.0)), 1.0);
}
```

---

## 4. ディレクトリ構造

```
GAME-ChromaFlow/
├── index.html
├── styles.css
├── script.js          ← エントリポイント（esbuild target）
├── manifest.json      ← PWA
├── sw.js              ← Service Worker
├── package.json
├── package-lock.json
│
├── src/
│   ├── main.ts               ← ゲームループ・初期化
│   ├── FluidSim.ts           ← WebGL2 流体シミュレーション本体
│   ├── Renderer.ts           ← 最終描画・エフェクト
│   ├── ScoreEngine.ts        ← 採点パイプライン
│   ├── StageLoader.ts        ← ステージデータ読み込み
│   ├── InputController.ts    ← タッチ/マウス → GPU splat 変換
│   ├── ReplayEncoder.ts      ← 操作列の圧縮・URL 格納
│   ├── audio.ts              ← Web Audio API 効果音
│   ├── storage.ts            ← localStorage 統計
│   └── shaders/
│       ├── advect.glsl
│       ├── divergence.glsl
│       ├── jacobi.glsl
│       ├── gradsubt.glsl
│       ├── splat.glsl
│       ├── curl.glsl
│       ├── render.glsl
│       └── score.glsl
│
├── stages/
│   ├── stage_001_sunset.json
│   ├── stage_002_ocean.json
│   ├── stage_003_forest.json
│   └── ... （20 ステージ）
│
├── scripts/
│   ├── build-web-assets.js   ← esbuild バンドル
│   ├── harness-check.js      ← 自動品質チェック
│   └── generate-stages.js    ← 逆シミュでステージ自動生成
│
├── www/
│   └── script.js             ← ビルド成果物
│
└── test/
    ├── FluidSim.test.ts
    ├── ScoreEngine.test.ts
    └── StageLoader.test.ts
```

---

## 5. ステージデータ形式

```json
{
  "id": "stage_001_sunset",
  "title": "夕焼け",
  "difficulty": "normal",
  "timeLimit": 90,
  "clearThreshold": 0.80,
  "availableColors": ["flame", "coral", "gold", "aqua"],
  "targetDistribution": {
    "encoding": "base64_fp16_rg",
    "width": 64,
    "height": 64,
    "data": "...base64..."
  },
  "initialSeed": 42,
  "hintSequence": [
    { "t": 0.0, "x": 0.3, "y": 0.7, "vx": 0.2, "vy": -0.1, "color": "flame", "radius": 0.08 },
    { "t": 2.5, "x": 0.6, "y": 0.5, "vx": -0.1, "vy": 0.3, "color": "gold",  "radius": 0.06 }
  ],
  "thumbnail": "stages/thumbnails/stage_001_sunset.png"
}
```

---

## 6. リプレイ & URL シェア（アイデア4から採用）

### 6.1 リプレイエンコード

```typescript
interface ReplayEvent {
  t: number;      // 経過時間（秒、uint16 × 0.01）
  x: number;      // UV x (uint8 × 1/255)
  y: number;      // UV y (uint8 × 1/255)
  vx: number;     // velocity x (int8 × 0.05)
  vy: number;     // velocity y (int8 × 0.05)
  color: number;  // 色 index (uint4)
  pressure: number; // 圧力符号 (1bit: 正/負)
}
// 1イベント = 7 バイト → 90秒 × 10fps = 900イベント → 6.3KB
```

**URL 格納**:

```typescript
function encodeReplayToURL(events: ReplayEvent[], stageId: string): string {
  const binary = serializeEvents(events); // Uint8Array
  const compressed = pako.deflate(binary); // pako.js で zlib 圧縮
  const b64 = btoa(String.fromCharCode(...compressed))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''); // URL-safe base64
  return `?stage=${stageId}&replay=${b64}`;
}
```

### 6.2 OGP 画像自動生成

```typescript
async function generateOGPImage(finalFrameTexture: WebGLTexture): Promise<string> {
  // readPixels で GPU → CPU に転送
  const pixels = new Uint8Array(256 * 256 * 4);
  gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  // OffscreenCanvas でテキストを合成
  const canvas = new OffscreenCanvas(1200, 630);
  const ctx = canvas.getContext('2d')!;

  // 流体画像を左半分に
  const imgData = new ImageData(new Uint8ClampedArray(pixels), 256, 256);
  ctx.putImageData(imgData, 0, 0);

  // タイトル・スコアを右半分に
  ctx.fillStyle = '#0d1b2a';
  ctx.fillRect(630, 0, 570, 630);
  ctx.fillStyle = '#00bcd4';
  ctx.font = 'bold 60px sans-serif';
  ctx.fillText('ChromaFlow', 650, 120);

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return URL.createObjectURL(blob);
}
```

---

## 7. UI / UX 設計

### 7.1 画面レイアウト

```
┌─────────────────────────────────────────┐
│  ChromaFlow        [⏸] [🔊] [🌓] [⛶]  │  ← ヘッダー
│  夕焼け - ふつう   残り: 72s            │
│  ████████████░░░░  82% / 80% まであと少し│  ← スコアバー
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────────────────────────┐   │
│   │                                 │   │
│   │    WebGL2 Canvas (流体表示)     │   │  ← メインキャンバス
│   │    + 半透明オーバーレイ          │   │    （正方形、max 90vw）
│   │    （目標画像のうっすら表示）    │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
│  ●フレイム  ○コーラル  ○ゴールド  ○アクア │  ← カラーパレット
│                      [ヒント] [クリア]   │
└─────────────────────────────────────────┘
```

### 7.2 クリア演出

1. 類似度が閾値を超えると Canvas 全体に **花びらパーティクル**が舞う（CSS animation）
2. BGM が流体の渦度から生成した音が変調してクライマックスに（将来機能）
3. **「あなたの作品」** モーダルが表示：
   - 流体のタイムラプス GIF アニメ（最大 3 秒）
   - URL コピーボタン（`📋 シェアする`）
   - ギャラリーへの追加

### 7.3 ヒントシステム

```typescript
function showHint(stage: Stage, currentTime: number) {
  // hintSequence からタイムスタンプ順に次のヒントを取り出す
  const next = stage.hintSequence.find(h => h.t > currentTime);
  if (!next) return;

  // 半透明の矢印アニメーションをキャンバス上に表示
  drawHintArrow(next.x, next.y, next.vx, next.vy, next.color);
  // 3 秒後に消える
  setTimeout(clearHint, 3000);
}
```

---

## 8. 効果音設計（Web Audio API）

```typescript
export const sounds = {
  splat:   () => playTone(880, 0.08, 'sine',     0.15), // 注入
  swirl:   () => playTone(440, 0.15, 'triangle', 0.10), // 渦発生
  nearGoal:() => playTone(660, 0.20, 'sine',     0.20), // 80%近づいたとき
  clear:   () => playChord([523, 659, 784], 0.8),       // ドミソ和音でクリア
  tick:    () => playTone(200, 0.05, 'square',   0.05), // 残り10秒カウント
};
```

---

## 9. 統計画面

```typescript
interface ChromaFlowStats {
  gamesPlayed: number;
  wins: number;
  bestScore: number;        // 最高類似度 (%)
  bestTime: number;         // 最短クリア時間 (秒)
  favoriteColor: string;    // 最も使った色
  totalPaintArea: number;   // 累計塗布面積 (UV 単位)
  winStreak: number;
  bestStreak: number;
}
```

---

## 10. PWA 設定

```json
{
  "name": "ChromaFlow",
  "short_name": "ChromaFlow",
  "description": "流体を操作して絵を描くパズルゲーム",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#0d1b2a",
  "theme_color": "#0d1b2a",
  "lang": "ja",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 11. 開発フェーズ

### Phase 1 — コア流体エンジン（2〜3 週）

**目標**: WebGL2 流体が動き、スプラットで色が入る

- [ ] WebGL2 コンテキスト・バッファ初期化
- [ ] advect.glsl / divergence.glsl / jacobi.glsl / gradsubt.glsl 実装
- [ ] splat.glsl + InputController 実装
- [ ] render.glsl（false-color）実装
- [ ] パフォーマンステスト（デスクトップ 60fps 確認）

**判定基準**: Canvas に流体が滑らかに流れ、ドラッグで渦が生まれること

### Phase 2 — パズルシステム（1〜2 週）

**目標**: ステージが成立し、採点できる

- [ ] score.glsl（ヒストグラム類似度）実装
- [ ] ステージデータ形式定義 + StageLoader 実装
- [ ] generate-stages.js（逆シミュでステージ自動生成）実装
- [ ] クリア判定・演出実装
- [ ] ヒントシステム実装

**判定基準**: 3 ステージをエンドツーエンドでクリアできること

### Phase 3 — UX 完成（1 週）

**目標**: ポータルに組み込める品質

- [ ] モバイル対応（パフォーマンスティア自動判定）
- [ ] リプレイエンコード + URL シェア実装
- [ ] OGP 画像生成実装
- [ ] 統計画面・テーマ切替・PWA 対応
- [ ] 20 ステージのデータ作成

**判定基準**: iPhone SE でも 30fps 以上。ステージ 1 をクリアした人の 80% がもう 1 ステージ遊ぶ

### Phase 4 — 磨き（随時）

- [ ] curl.glsl 微調整（渦の美しさ最大化）
- [ ] 色モデル（pH/温度）のバランス調整
- [ ] 効果音チューニング
- [ ] 採点アルゴリズムを MSE に移行後、SSIM 検討

---

## 12. ⚠️ 要確認・推測事項（削除禁止）

| 項目 | 根拠 | 確認方法 |
|------|------|---------|
| Three.js r137+ の MRT サポート実績 | Three.js changelog 要確認 | 公式 changelog 確認 + 簡易ベンチ |
| Snapdragon 7xx系で 192×192 グリッド 60fps | モバイルベンチなし | 実機テスト（Galaxy A54 等）必須 |
| SSIM の WebGL2 ゲームスコアリング実績 | 学術実装は存在するが、ゲームでの使用未確認 | OSS 調査、または自作後ベンチ |
| タイルヒストグラム類似度が MSE より知覚品質高い | 理論上はそう言えるが未検証 | A/B テスト（ユーザー評価で確認） |
| pako.js での圧縮後リプレイ URL が 2KB 以内に収まる | 90秒×10fps=900イベント×7byte=6.3KB → zlib → 推定 2KB 前後 | 実測必要 |
| 逆シミュで生成したステージが「難しいが解ける」バランスになる | 理論的には解があるが難易度感は未知 | プレイテスト 10 人以上 |

---

## 13. 参照実装・文献

| リソース | URL | 用途 |
|---------|-----|------|
| Pavel Dobryakov WebGL Fluid | github.com/PavelDoGreat/WebGL-Fluid-Simulation | 主参考実装（MIT）|
| Jamie Wong Fluid Tutorial | jamie-wong.com/2016/08/05/webgl-fluid-simulation/ | 理論解説 |
| Jos Stam "Real-Time Fluid Dynamics" | graphics.cs.cmu.edu/nsp/course/15-464/Fall09/papers/StamFluidUnreal.pdf | 元論文 |
| WebGL2 Fundamentals | webgl2fundamentals.org | GLSL/API リファレンス |
| esbuild-plugin-glsl | github.com/vanruesc/esbuild-plugin-glsl | ビルドプラグイン |
| Can I Use WebGL2 | caniuse.com/webgl2 | ブラウザ対応確認 |
