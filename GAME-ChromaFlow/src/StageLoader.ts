import { ColorKey } from './colors.js';

export interface HintEvent {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: ColorKey;
  radius: number;
}

export interface StageData {
  id: string;
  title: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'oni';
  timeLimit: number;
  clearThreshold: number;
  availableColors: ColorKey[];
  targetDistribution: {
    encoding: string;
    width: number;
    height: number;
    data: string; // base64
  };
  initialSeed: number;
  hintSequence: HintEvent[];
  thumbnail?: string;
}

const DIFFICULTY_CONFIG = {
  easy:   { clearThreshold: 0.70, label: 'かんたん', timeLimit: 120 },
  normal: { clearThreshold: 0.80, label: 'ふつう',   timeLimit: 90 },
  hard:   { clearThreshold: 0.88, label: 'むずかしい', timeLimit: 75 },
  oni:    { clearThreshold: 0.95, label: '🔴鬼',     timeLimit: 60 },
};

export function getDifficultyLabel(diff: StageData['difficulty']): string {
  return DIFFICULTY_CONFIG[diff].label;
}

export async function loadStage(id: string): Promise<StageData> {
  const res = await fetch(`../stages/${id}.json`);
  if (!res.ok) throw new Error(`Stage not found: ${id}`);
  return res.json() as Promise<StageData>;
}

export function decodeTargetTexture(
  gl: WebGL2RenderingContext,
  stage: StageData
): WebGLTexture {
  const { width, height, data, encoding } = stage.targetDistribution;
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);

  if (encoding === 'procedural_sunset') {
    const floats = generateProceduralTarget('sunset', width, height);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, floats);
  } else if (encoding === 'base64_fp16_rg') {
    // Float16 RG encoding: decode base64 → ArrayBuffer → upload as RGBA32F
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const view = new DataView(bytes.buffer);
    const floats = new Float32Array(width * height * 4);
    // RG16F → RGBA32F (B=0, A=density from R channel)
    for (let i = 0; i < width * height; i++) {
      floats[i * 4 + 0] = fp16ToFloat32(view.getUint16(i * 4, true));     // pH
      floats[i * 4 + 1] = fp16ToFloat32(view.getUint16(i * 4 + 2, true)); // temp
      floats[i * 4 + 2] = 0;
      floats[i * 4 + 3] = floats[i * 4 + 0] > 0 || floats[i * 4 + 1] > 0 ? 1.0 : 0.0;
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, floats);
  } else {
    // Fallback: treat as a visual PNG target (loaded via Image)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]));
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function generateProceduralTarget(name: string, w: number, h: number): Float32Array {
  const data = new Float32Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);
      const v = y / (h - 1);
      let pH = 0, temp = 0, density = 0;

      if (name === 'sunset') {
        // Bottom: warm deep red (pH=0.05, temp=0.9)
        // Middle: orange/gold (pH=0.25, temp=0.7)
        // Top: cool purple twilight (pH=0.75, temp=0.2)
        const t = v; // 0=bottom, 1=top
        pH = 0.05 + t * 0.70;
        temp = 0.9 - t * 0.7;
        density = 0.8 + 0.2 * Math.sin(u * Math.PI);
      }

      const i = (y * w + x) * 4;
      data[i + 0] = pH;
      data[i + 1] = temp;
      data[i + 2] = 0;
      data[i + 3] = density;
    }
  }
  return data;
}

function fp16ToFloat32(h: number): number {
  const e = (h >> 10) & 0x1f;
  const m = h & 0x3ff;
  if (e === 0) return (m / 1024) * Math.pow(2, -14) * (h >> 15 ? -1 : 1);
  if (e === 31) return m ? NaN : Infinity * (h >> 15 ? -1 : 1);
  return (1 + m / 1024) * Math.pow(2, e - 15) * (h >> 15 ? -1 : 1);
}
