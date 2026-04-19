import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRemoveAdsPurchaseSuccess } from '../src/purchase/handleRemoveAdsPurchase.js';
import { STORAGE_KEYS } from '../src/storage.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

test('handleRemoveAdsPurchaseSuccess stores "true" under remove_ads_purchased', async () => {
  const storage = createMemoryStorage();
  await handleRemoveAdsPurchaseSuccess(null, storage);
  assert.equal(storage.getItem(STORAGE_KEYS.removeAdsPurchased), 'true');
});

test('handleRemoveAdsPurchaseSuccess calls AdManager.removeBanner when provided', async () => {
  const storage = createMemoryStorage();
  let removeBannerCalled = 0;
  const adManager = {
    async removeBanner() {
      removeBannerCalled += 1;
    },
  };

  await handleRemoveAdsPurchaseSuccess(adManager, storage);

  assert.equal(removeBannerCalled, 1);
  assert.equal(storage.getItem(STORAGE_KEYS.removeAdsPurchased), 'true');
});

test('handleRemoveAdsPurchaseSuccess does not throw when AdManager is absent', async () => {
  const storage = createMemoryStorage();
  await assert.doesNotReject(() => handleRemoveAdsPurchaseSuccess(null, storage));
  assert.equal(storage.getItem(STORAGE_KEYS.removeAdsPurchased), 'true');
});
