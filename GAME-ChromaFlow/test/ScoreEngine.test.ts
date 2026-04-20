import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encodeReplayToURL, decodeReplayFromURL } from '../src/ReplayEncoder.js';
import type { ReplayEvent } from '../src/InputController.js';

// ReplayEncoder tests run in Node (no WebGL needed)
describe('ReplayEncoder', () => {
  it('encodes and URL-encodes a replay', () => {
    const events: ReplayEvent[] = [
      { t: 1.5, x: 0.3, y: 0.7, vx: 0.1, vy: -0.2, colorIdx: 0, pressure: 1 },
      { t: 3.0, x: 0.6, y: 0.4, vx: -0.05, vy: 0.1, colorIdx: 2, pressure: 1 },
    ];
    const url = encodeReplayToURL(events, 'stage_001_sunset');
    assert.ok(url.startsWith('?stage=stage_001_sunset&replay='), 'URL prefix ok');
    assert.ok(!url.includes('+'), 'no + in URL-safe base64');
    assert.ok(!url.includes('/'), 'no / in URL-safe base64');
  });

  it('encoded replay is < 1KB for 10 events', () => {
    const events: ReplayEvent[] = Array.from({ length: 10 }, (_, i) => ({
      t: i * 1.0, x: 0.5, y: 0.5, vx: 0.1, vy: 0.1, colorIdx: 0, pressure: 1,
    }));
    const url = encodeReplayToURL(events, 'test');
    const replayPart = url.split('replay=')[1] ?? '';
    assert.ok(replayPart.length < 1024, `replay too long: ${replayPart.length}`);
  });
});
