import test from 'node:test';
import assert from 'node:assert/strict';
import { setupAdvertising } from '../src/ads/setupAdvertising.js';
import {
  INTERSTITIAL_EVENT_NAME,
  dispatchInterstitialRequested,
} from '../src/adEvents.js';

function createMemoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
}

function createFakeAdManager() {
  const calls = {
    initialize: 0,
    loadBanner: 0,
    loadInterstitial: 0,
    showInterstitial: 0,
    removeBanner: 0,
  };
  return {
    calls,
    async initialize() {
      calls.initialize += 1;
    },
    async loadBanner() {
      calls.loadBanner += 1;
    },
    async loadInterstitial() {
      calls.loadInterstitial += 1;
    },
    async showInterstitial() {
      calls.showInterstitial += 1;
      return true;
    },
    async removeBanner() {
      calls.removeBanner += 1;
    },
  };
}

test('setupAdvertising skips initialization when platform is not native', async () => {
  const adManager = createFakeAdManager();
  const result = await setupAdvertising({
    adManager,
    storage: createMemoryStorage(),
    eventTarget: new EventTarget(),
    isNative: () => false,
  });

  assert.equal(result.started, false);
  assert.equal(result.reason, 'not-native');
  assert.equal(adManager.calls.initialize, 0);
  assert.equal(adManager.calls.loadBanner, 0);
});

test('setupAdvertising skips when ads are already removed', async () => {
  const adManager = createFakeAdManager();
  const result = await setupAdvertising({
    adManager,
    storage: createMemoryStorage({ remove_ads_purchased: 'true' }),
    eventTarget: new EventTarget(),
    isNative: () => true,
  });

  assert.equal(result.started, false);
  assert.equal(result.reason, 'ads-removed');
  assert.equal(adManager.calls.initialize, 0);
});

test('setupAdvertising initializes and loads banner on native when ads are active', async () => {
  const adManager = createFakeAdManager();
  const result = await setupAdvertising({
    adManager,
    storage: createMemoryStorage(),
    eventTarget: new EventTarget(),
    isNative: () => true,
  });

  assert.equal(result.started, true);
  assert.equal(result.reason, 'native');
  assert.equal(adManager.calls.initialize, 1);
  assert.equal(adManager.calls.loadBanner, 1);
});

test('setupAdvertising registers an interstitial listener that loads and shows', async () => {
  const adManager = createFakeAdManager();
  const eventTarget = new EventTarget();

  await setupAdvertising({
    adManager,
    storage: createMemoryStorage(),
    eventTarget,
    isNative: () => true,
  });

  dispatchInterstitialRequested(eventTarget);

  // Give the async listener a chance to resolve
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(adManager.calls.loadInterstitial, 1);
  assert.equal(adManager.calls.showInterstitial, 1);
});

test('setupAdvertising routes init errors to onError instead of throwing', async () => {
  const errors = [];
  const failingAdManager = {
    async initialize() {
      throw new Error('init failed');
    },
    async loadBanner() {},
    async loadInterstitial() {},
    async showInterstitial() {},
  };

  await assert.doesNotReject(() =>
    setupAdvertising({
      adManager: failingAdManager,
      storage: createMemoryStorage(),
      eventTarget: new EventTarget(),
      isNative: () => true,
      onError: (error) => errors.push(error.message),
    })
  );

  assert.deepEqual(errors, ['init failed']);
});

test('setupAdvertising routes interstitial errors to onError', async () => {
  const errors = [];
  const flakyAdManager = {
    ...createFakeAdManager(),
    async loadInterstitial() {
      throw new Error('load interstitial failed');
    },
  };
  const eventTarget = new EventTarget();

  await setupAdvertising({
    adManager: flakyAdManager,
    storage: createMemoryStorage(),
    eventTarget,
    isNative: () => true,
    onError: (error) => errors.push(error.message),
  });

  dispatchInterstitialRequested(eventTarget);
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(errors, ['load interstitial failed']);
});

test('setupAdvertising throws when required deps are missing', async () => {
  await assert.rejects(
    () => setupAdvertising({ storage: {}, eventTarget: new EventTarget(), isNative: () => true }),
    /required/
  );
});

test('dispose() unregisters the interstitial listener', async () => {
  const adManager = createFakeAdManager();
  const eventTarget = new EventTarget();

  const result = await setupAdvertising({
    adManager,
    storage: createMemoryStorage(),
    eventTarget,
    isNative: () => true,
  });

  result.dispose();
  dispatchInterstitialRequested(eventTarget);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(adManager.calls.loadInterstitial, 0);
  assert.equal(adManager.calls.showInterstitial, 0);
});
