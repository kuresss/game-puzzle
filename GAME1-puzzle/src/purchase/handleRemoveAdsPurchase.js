import { STORAGE_KEYS } from '../storage.js';

/**
 * Integration point: call this when "remove ads" purchase succeeds.
 */
export async function handleRemoveAdsPurchaseSuccess(adManager, storage = globalThis.localStorage) {
  storage?.setItem(STORAGE_KEYS.removeAdsPurchased, 'true');

  if (adManager?.removeBanner) {
    await adManager.removeBanner();
  }
}
