import { deflate, inflate } from 'pako';
import { ReplayEvent } from './InputController.js';

function serializeEvents(events: ReplayEvent[]): Uint8Array {
  // 1 event = 7 bytes:
  // [0-1] t: uint16 (×0.01s)
  // [2]   x: uint8 (×1/255)
  // [3]   y: uint8 (×1/255)
  // [4]   vx: int8 (×0.05)
  // [5]   vy: int8 (×0.05)
  // [6]   colorIdx(4bit) | pressure_sign(1bit) | pad(3bit)
  const buf = new Uint8Array(events.length * 7);
  const view = new DataView(buf.buffer);
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const off = i * 7;
    view.setUint16(off, Math.min(Math.round(e.t * 100), 65535), true);
    view.setUint8(off + 2, Math.round(Math.max(0, Math.min(1, e.x)) * 255));
    view.setUint8(off + 3, Math.round(Math.max(0, Math.min(1, e.y)) * 255));
    view.setInt8(off + 4, Math.max(-127, Math.min(127, Math.round(e.vx / 0.05))));
    view.setInt8(off + 5, Math.max(-127, Math.min(127, Math.round(e.vy / 0.05))));
    view.setUint8(off + 6, ((e.colorIdx & 0xf) << 4) | (e.pressure > 0 ? 1 : 0));
  }
  return buf;
}

function deserializeEvents(buf: Uint8Array): ReplayEvent[] {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const count = Math.floor(buf.length / 7);
  const events: ReplayEvent[] = [];
  for (let i = 0; i < count; i++) {
    const off = i * 7;
    const flags = view.getUint8(off + 6);
    events.push({
      t:         view.getUint16(off, true) * 0.01,
      x:         view.getUint8(off + 2) / 255,
      y:         view.getUint8(off + 3) / 255,
      vx:        view.getInt8(off + 4) * 0.05,
      vy:        view.getInt8(off + 5) * 0.05,
      colorIdx:  (flags >> 4) & 0xf,
      pressure:  (flags & 1) ? 1 : -1,
    });
  }
  return events;
}

export function encodeReplayToURL(events: ReplayEvent[], stageId: string): string {
  const binary = serializeEvents(events);
  const compressed = deflate(binary);
  // URL-safe base64
  let b64 = btoa(String.fromCharCode(...compressed));
  b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `?stage=${encodeURIComponent(stageId)}&replay=${b64}`;
}

export function decodeReplayFromURL(): { stageId: string; events: ReplayEvent[] } | null {
  const params = new URLSearchParams(window.location.search);
  const stageId = params.get('stage');
  const replayB64 = params.get('replay');
  if (!stageId || !replayB64) return null;

  try {
    const b64 = replayB64.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const decompressed = inflate(bytes);
    return { stageId, events: deserializeEvents(decompressed) };
  } catch {
    return null;
  }
}
