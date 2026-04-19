import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INTERSTITIAL_EVENT_NAME,
  dispatchInterstitialRequested,
} from '../src/adEvents.js';

test('dispatchInterstitialRequested fires the interstitial event on the target', () => {
  const target = new EventTarget();
  const received = [];
  target.addEventListener(INTERSTITIAL_EVENT_NAME, (event) => {
    received.push(event);
  });

  dispatchInterstitialRequested(target);

  assert.equal(received.length, 1);
  assert.equal(received[0].type, INTERSTITIAL_EVENT_NAME);
});

test('dispatchInterstitialRequested defaults reason to "puzzle-completed"', () => {
  const target = new EventTarget();
  let captured = null;
  target.addEventListener(INTERSTITIAL_EVENT_NAME, (event) => {
    captured = event.detail;
  });

  dispatchInterstitialRequested(target);

  assert.deepEqual(captured, { reason: 'puzzle-completed' });
});

test('dispatchInterstitialRequested forwards a custom reason', () => {
  const target = new EventTarget();
  let captured = null;
  target.addEventListener(INTERSTITIAL_EVENT_NAME, (event) => {
    captured = event.detail;
  });

  dispatchInterstitialRequested(target, 'debug-trigger');

  assert.deepEqual(captured, { reason: 'debug-trigger' });
});
