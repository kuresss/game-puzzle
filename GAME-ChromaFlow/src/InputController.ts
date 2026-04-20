import { FluidSim } from './FluidSim.js';
import { COLORS, ColorKey } from './colors.js';

export interface ReplayEvent {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  colorIdx: number;
  pressure: number; // 1=positive, -1=negative
}

export class InputController {
  private lastPos: { x: number; y: number } | null = null;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private startTime: number;
  private events: ReplayEvent[] = [];
  selectedColor: ColorKey = 'flame';

  constructor(
    private canvas: HTMLCanvasElement,
    private sim: FluidSim,
    private onSplat?: () => void
  ) {
    this.startTime = performance.now();
    canvas.addEventListener('pointermove', this.onMove.bind(this));
    canvas.addEventListener('pointerdown', this.onDown.bind(this));
    canvas.addEventListener('pointerup', this.onUp.bind(this));
    canvas.addEventListener('pointerleave', this.onUp.bind(this));
    canvas.style.touchAction = 'none';
  }

  getEvents(): ReplayEvent[] {
    return this.events;
  }

  resetEvents() {
    this.events = [];
    this.startTime = performance.now();
  }

  private getUV(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: 1.0 - (e.clientY - rect.top) / rect.height,
    };
  }

  private onDown(e: PointerEvent) {
    this.canvas.setPointerCapture(e.pointerId);
    this.lastPos = this.getUV(e);
    this.holdTimer = setTimeout(() => {
      if (this.lastPos) {
        this.doSplat(this.lastPos.x, this.lastPos.y, 0, 0, -1);
      }
    }, 500);
  }

  private onMove(e: PointerEvent) {
    if (e.pressure === 0 && e.pointerType !== 'mouse') return;
    const pos = this.getUV(e);
    if (this.lastPos) {
      const vx = (pos.x - this.lastPos.x) * 8.0;
      const vy = (pos.y - this.lastPos.y) * 8.0;
      this.doSplat(pos.x, pos.y, vx, vy, 1);
    }
    this.lastPos = pos;
  }

  private onUp() {
    this.lastPos = null;
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  private doSplat(x: number, y: number, vx: number, vy: number, pressureSign: number) {
    const color = COLORS[this.selectedColor];
    const density = 0.8 * pressureSign > 0 ? 0.8 : 0.0;
    this.sim.splat(x, y, vx * pressureSign, vy * pressureSign, {
      pH: color.pH,
      temp: color.temp,
      density,
    });

    const t = (performance.now() - this.startTime) / 1000;
    const colorIdx = Object.keys(COLORS).indexOf(this.selectedColor);
    this.events.push({ t, x, y, vx, vy, colorIdx, pressure: pressureSign });

    this.onSplat?.();
  }
}
