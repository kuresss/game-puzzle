export const INTERSTITIAL_EVENT_NAME = 'game1:interstitial-requested';

export function dispatchInterstitialRequested(target, reason = 'puzzle-completed') {
  target.dispatchEvent(
    new CustomEvent(INTERSTITIAL_EVENT_NAME, {
      detail: { reason },
    })
  );
}
