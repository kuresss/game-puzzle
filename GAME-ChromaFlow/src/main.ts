import { FluidSim } from './FluidSim.js';
import { Renderer } from './Renderer.js';
import { ScoreEngine } from './ScoreEngine.js';
import { InputController } from './InputController.js';
import { loadStage, decodeTargetTexture, getDifficultyLabel } from './StageLoader.js';
import { encodeReplayToURL } from './ReplayEncoder.js';
import { sounds } from './audio.js';
import { recordGame } from './storage.js';
import { COLORS, COLOR_KEYS, type ColorKey } from './colors.js';

interface GameState {
  status: 'playing' | 'cleared' | 'timeout';
  score: number;
  timeLeft: number;
  cleared: boolean;
}

let sim: FluidSim;
let renderer: Renderer;
let scoreEngine: ScoreEngine;
let input: InputController;
let state: GameState;
let lastTime = 0;
let scoreTimer = 0;
let currentStageId = 'stage_001_sunset';

async function init() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  // Resize canvas to square
  function resizeCanvas() {
    const size = Math.min(window.innerWidth, window.innerHeight, 700) * 0.92;
    canvas.width  = Math.round(size);
    canvas.height = Math.round(size);
    canvas.style.width  = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const gl = canvas.getContext('webgl2');
  if (!gl) {
    document.getElementById('no-webgl')!.style.display = 'block';
    canvas.style.display = 'none';
    return;
  }

  sim = new FluidSim(gl);
  renderer = new Renderer(gl);
  scoreEngine = new ScoreEngine(gl);

  state = { status: 'playing', score: 0, timeLeft: 90, cleared: false };

  input = new InputController(canvas, sim, () => {
    sounds.splat();
  });

  // Load first stage
  await loadGameStage(currentStageId);

  // Color palette
  setupColorPalette();

  // Controls
  setupControls();

  // Start loop
  requestAnimationFrame(loop);
}

async function loadGameStage(id: string) {
  const gl = (document.getElementById('canvas') as HTMLCanvasElement).getContext('webgl2')!;
  try {
    const stage = await loadStage(id);
    const targetTex = decodeTargetTexture(gl, stage);
    renderer.setTargetTexture(targetTex);
    scoreEngine.setTarget(targetTex);

    state = {
      status: 'playing',
      score: 0,
      timeLeft: stage.timeLimit,
      cleared: false,
    };

    const title = document.getElementById('stage-title')!;
    title.textContent = `${stage.title} — ${getDifficultyLabel(stage.difficulty)}`;

    // Apply available colors
    input.selectedColor = stage.availableColors[0] as ColorKey;
    setupColorPalette(stage.availableColors as ColorKey[]);

  } catch (e) {
    // No stage file yet: run in free-paint mode
    state = { status: 'playing', score: 0, timeLeft: 999, cleared: false };
    const title = document.getElementById('stage-title')!;
    title.textContent = 'フリーペイント';
    setupColorPalette();
  }

  input.resetEvents();
}

function setupColorPalette(available?: ColorKey[]) {
  const palette = document.getElementById('palette')!;
  palette.innerHTML = '';
  const keys = available ?? COLOR_KEYS;
  for (const key of keys) {
    const c = COLORS[key];
    const btn = document.createElement('button');
    btn.className = 'color-btn';
    btn.title = c.label;
    btn.style.background = c.cssColor;
    btn.dataset.key = key;
    btn.setAttribute('aria-label', c.label);
    if (key === input.selectedColor) btn.classList.add('active');
    btn.addEventListener('click', () => {
      input.selectedColor = key;
      palette.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    palette.appendChild(btn);
  }
}

function setupControls() {
  document.getElementById('btn-mute')?.addEventListener('click', () => {
    const muted = localStorage.getItem('global_mute') === '1';
    localStorage.setItem('global_mute', muted ? '0' : '1');
    const btn = document.getElementById('btn-mute')!;
    btn.textContent = muted ? '🔊' : '🔇';
  });

  document.getElementById('btn-pause')?.addEventListener('click', () => {
    state.status = state.status === 'playing' ? 'timeout' : 'playing';
    const btn = document.getElementById('btn-pause')!;
    btn.textContent = state.status === 'playing' ? '⏸' : '▶';
  });

  document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  document.getElementById('btn-hint')?.addEventListener('click', () => {
    renderer.targetAlpha = renderer.targetAlpha > 0.01 ? 0.0 : 0.3;
    const btn = document.getElementById('btn-hint')!;
    btn.textContent = renderer.targetAlpha > 0 ? 'ヒントON' : 'ヒント';
  });

  document.getElementById('btn-share')?.addEventListener('click', shareResult);
}

function shareResult() {
  const url = location.origin + location.pathname + encodeReplayToURL(input.getEvents(), currentStageId);
  const text = `🎨 ChromaFlow [${document.getElementById('stage-title')!.textContent}] スコア: ${Math.round(state.score * 100)}%\n${url}`;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-share')!;
    const orig = btn.textContent!;
    btn.textContent = 'コピーしました！';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
}

function loop(now: number) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (state.status === 'playing') {
    sim.step(dt);

    state.timeLeft -= dt;
    if (state.timeLeft <= 0 && !state.cleared) {
      state.timeLeft = 0;
      endGame(false);
    }

    // Score every 100ms
    scoreTimer += dt;
    if (scoreTimer > 0.1) {
      scoreTimer = 0;
      state.score = scoreEngine.compute(sim.getDyeTexture());
      updateScoreUI();

      if (state.score >= 0.8 && !state.cleared) {
        sounds.nearGoal();
      }
    }

    // Countdown ticks
    if (state.timeLeft <= 10 && Math.floor(state.timeLeft) !== Math.floor(state.timeLeft + dt)) {
      sounds.tick();
    }

    updateTimerUI();
  }

  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  renderer.render(sim.getDyeTexture(), canvas.width, canvas.height);

  requestAnimationFrame(loop);
}

function endGame(won: boolean) {
  state.status = won ? 'cleared' : 'timeout';
  state.cleared = true;

  const elapsed = (document.getElementById('stage-title') ? 90 : 0) - state.timeLeft;
  recordGame(won, state.score, elapsed, input.selectedColor);

  if (won) {
    sounds.clear();
    showClearModal();
  }
}

function showClearModal() {
  const modal = document.getElementById('modal-clear')!;
  modal.style.display = 'flex';
  document.getElementById('modal-score')!.textContent = `スコア: ${Math.round(state.score * 100)}%`;
}

function updateScoreUI() {
  const bar = document.getElementById('score-bar') as HTMLElement;
  const label = document.getElementById('score-label')!;
  if (bar) {
    bar.style.width = `${Math.round(state.score * 100)}%`;
    bar.style.background = state.score >= 0.8 ? '#4caf50' : state.score >= 0.6 ? '#ff9800' : '#2196f3';
  }
  if (label) label.textContent = `${Math.round(state.score * 100)}%`;
}

function updateTimerUI() {
  const el = document.getElementById('timer')!;
  if (el) {
    const t = Math.ceil(state.timeLeft);
    el.textContent = `残り: ${t}s`;
    el.style.color = t <= 10 ? '#f44' : '';
  }
}

init();
