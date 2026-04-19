import { INTERSTITIAL_EVENT_NAME } from '../adEvents.js';
import { isRemoveAdsPurchased } from '../storage.js';

function defaultOnError(error) {
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('[ads]', error);
  }
}

export async function setupAdvertising({
  adManager,
  storage,
  eventTarget,
  isNative,
  onError = defaultOnError,
}) {
  if (!adManager || !storage || !eventTarget || typeof isNative !== 'function') {
    throw new Error('setupAdvertising: adManager, storage, eventTarget, isNative are required.');
  }

  if (!isNative()) {
    return { started: false, reason: 'not-native' };
  }

  if (isRemoveAdsPurchased(storage)) {
    return { started: false, reason: 'ads-removed' };
  }

  try {
    await adManager.initialize();
    await adManager.loadBanner();
  } catch (error) {
    onError(error);
  }

  const interstitialListener = () => {
    runInterstitial(adManager, onError);
  };

  eventTarget.addEventListener(INTERSTITIAL_EVENT_NAME, interstitialListener);

  return {
    started: true,
    reason: 'native',
    dispose: () => {
      eventTarget.removeEventListener(INTERSTITIAL_EVENT_NAME, interstitialListener);
    },
  };
}

async function runInterstitial(adManager, onError) {
  try {
    await adManager.loadInterstitial();
    await adManager.showInterstitial();
  } catch (error) {
    onError(error);
  }
}
