import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob';
import { TEST_AD_UNIT_IDS } from '../config/adIds.js';

/**
 * Thin wrapper around @capacitor-community/admob.
 */
export class AdManager {
  constructor({ adUnitIds = TEST_AD_UNIT_IDS, plugin = AdMob } = {}) {
    this.adUnitIds = adUnitIds;
    this.plugin = plugin;
    this.isInitialized = false;
    this.bannerLoaded = false;
    this.interstitialLoaded = false;
  }

  async initialize(options = { initializeForTesting: true }) {
    await this.plugin.initialize(options);
    this.isInitialized = true;
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  async loadBanner({
    adSize = BannerAdSize.BANNER,
    position = BannerAdPosition.BOTTOM_CENTER,
    margin = 0,
    isTesting = true,
    onError = null,
  } = {}) {
    await this.ensureInitialized();
    try {
      await this.plugin.showBanner({
        adId: this.adUnitIds.banner,
        adSize,
        position,
        margin,
        isTesting,
      });
      this.bannerLoaded = true;
    } catch (err) {
      if (typeof onError === 'function') onError(err);
    }
  }

  async loadInterstitial({ isTesting = true, onError = null } = {}) {
    await this.ensureInitialized();
    try {
      await this.plugin.prepareInterstitial({
        adId: this.adUnitIds.interstitial,
        isTesting,
      });
      this.interstitialLoaded = true;
    } catch (err) {
      if (typeof onError === 'function') onError(err);
    }
  }

  async showInterstitial() {
    if (!this.interstitialLoaded) return false;

    await this.plugin.showInterstitial();
    this.interstitialLoaded = false;
    return true;
  }

  async removeBanner() {
    await this.ensureInitialized();
    await this.plugin.removeBanner();
    this.bannerLoaded = false;
  }

  async hideBanner() {
    await this.removeBanner();
  }
}
