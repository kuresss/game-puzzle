import { getRandomWord, WORDS } from './words.js';
import { calcPlayerDamage, calcEnemyDamage, getSpeedMult, getComboMult, addExp } from './player.js';
import { sounds } from './audio.js';
import {
  updateHpBar, updateStatusText, updateEnemyUI,
  renderWord, flashWord, showDamageNumber, battleLog,
  showCombo, updateEnemyTimer, shakeEnemy, enemyAttackAnim,
  playerHitAnim, showPhase2, updateSpellHints,
  showPauseOverlay, screenShake, shakeInput, showSpeedTelop,
} from './ui.js';

export class Battle {
  constructor(player, enemy, lang, onVictory, onDefeat) {
    this.player     = player;
    this.enemy      = enemy;
    this.lang       = lang;
    this.onVictory  = onVictory;
    this.onDefeat   = onDefeat;

    this.word        = null;
    this.typed       = '';
    this.wordStart   = 0;
    this.combo       = 0;
    this.score       = 0;
    this.finished    = false;
    this.paused      = false;
    this.phase       = 1;

    this._enemyTimerStart = 0;
    this._rafId = null;
    this._onKey = this._handleKey.bind(this);

    this._onPauseBtn = () => this._togglePause();

    this._startLoop();
    this._nextWord();
    this._setupInput();
  }

  // ---- Setup ----
  _setupInput() {
    const input = document.getElementById('typing-input');
    if (!input) return;
    input.value = '';
    input.addEventListener('keydown', this._onKey);
    input.focus();

    const btn = document.getElementById('btn-pause');
    if (btn) btn.addEventListener('click', this._onPauseBtn);
  }

  destroy() {
    const input = document.getElementById('typing-input');
    if (input) input.removeEventListener('keydown', this._onKey);
    const btn = document.getElementById('btn-pause');
    if (btn) btn.removeEventListener('click', this._onPauseBtn);
    if (this._rafId) cancelAnimationFrame(this._rafId);
    showPauseOverlay(false);
    this.finished = true;
  }

  _togglePause() {
    if (this.finished) return;
    this.paused = !this.paused;
    showPauseOverlay(this.paused);
    if (!this.paused) {
      this._resetEnemyTimer();
      document.getElementById('typing-input')?.focus();
    }
  }

  // ---- Word management ----
  _nextWord() {
    const difficulty = this._getWordDifficulty();
    this.word   = getRandomWord(difficulty, this.lang, this.player.spells);
    this.typed  = '';
    this.wordStart = performance.now();
    renderWord(this.word, 0);
    updateSpellHints(this.player.spells, this.player.mp);

    const input = document.getElementById('typing-input');
    if (input) { input.value = ''; input.focus(); }
  }

  _getWordDifficulty() {
    let diff = this.enemy.wordDifficulty;
    // Phase 2: bump difficulty up one level
    if (this.phase === 2) {
      if (diff === 'easy')   diff = 'normal';
      if (diff === 'normal') diff = 'hard';
    }
    return diff;
  }

  // ---- Key handler ----
  _handleKey(e) {
    if (this.finished) return;

    // Esc toggles pause
    if (e.key === 'Escape') {
      this._togglePause();
      return;
    }

    if (this.paused) return;
    if (e.key.length > 1) return;
    e.preventDefault();

    const expected = this.word.input[this.typed.length];
    if (e.key === expected) {
      this.typed += e.key;
      sounds.type();
      renderWord(this.word, this.typed.length);

      if (this.typed.length === this.word.input.length) {
        this._onWordComplete();
      }
    } else {
      // Wrong key: delete last char instead of full reset
      if (this.typed.length > 0) {
        this.typed = this.typed.slice(0, -1);
      } else {
        this.combo = 0;
        showCombo(0);
      }
      renderWord(this.word, this.typed.length);
      flashWord(false);
      shakeInput();
      sounds.miss();
      battleLog('ミスタイプ！');
    }
  }

  // ---- Word complete → attack ----
  _onWordComplete() {
    const timeSec  = (performance.now() - this.wordStart) / 1000;
    const speedMult = getSpeedMult(timeSec, this.word.input.length);
    this.combo++;
    const comboMult = getComboMult(this.combo);

    flashWord(true);
    showCombo(this.combo);
    if (this.combo >= 10) screenShake();
    if (this.combo >= 3) sounds.combo();

    // Spell?
    if (this.word.isSpell) {
      this._castSpell(this.word.spellKey, speedMult, comboMult);
    } else {
      this._normalAttack(speedMult, comboMult);
    }
  }

  _normalAttack(speedMult, comboMult) {
    const dmg = calcPlayerDamage(this.player, this.enemy, speedMult, comboMult);
    this._dealDamageToEnemy(dmg);
    sounds.attack();
    if (speedMult >= 1.8) showSpeedTelop();
    let msg = `⚔ ${dmg} ダメージ！`;
    if (comboMult >= 2.0) msg += ' 🔥COMBO×10！';
    else if (comboMult >= 1.5) msg += ` COMBO×${this.combo}！`;
    battleLog(msg);
    this.score += dmg;
    setTimeout(() => this._nextWord(), 300);
  }

  _castSpell(key, speedMult, comboMult) {
    const spell = WORDS.spells[key];
    if (!spell) { this._normalAttack(speedMult, comboMult); return; }

    if (key === 'heal') {
      if (this.player.mp < spell.mp) {
        battleLog('MP不足！ヒールできない！');
        this._normalAttack(speedMult, comboMult);
        return;
      }
      this.player.mp -= spell.mp;
      const restore = Math.min(spell.restore, this.player.maxHp - this.player.hp);
      this.player.hp += restore;
      flashWord(true, 'heal');
      if (speedMult >= 1.8) showSpeedTelop();
      sounds.heal();
      battleLog(`${spell.msg} HP +${restore}！`);
      showDamageNumber(`+${restore}HP`, 'heal');
      updateStatusText(this.player);
    } else {
      if (this.player.mp < spell.mp) {
        battleLog('MP不足！通常攻撃に切り替え');
        this._normalAttack(speedMult, comboMult);
        return;
      }
      this.player.mp -= spell.mp;
      const base = calcPlayerDamage(this.player, this.enemy, speedMult, comboMult);
      const dmg  = Math.floor(base * spell.dmgMult);
      this._dealDamageToEnemy(dmg);
      flashWord(true, key);
      if (speedMult >= 1.8) showSpeedTelop();
      sounds.magic();
      battleLog(`${spell.msg} ${dmg} ダメージ！`);
      this.score += dmg;
    }
    updateStatusText(this.player);
    setTimeout(() => this._nextWord(), 300);
  }

  _dealDamageToEnemy(dmg) {
    this.enemy.currentHp = Math.max(0, this.enemy.currentHp - dmg);
    shakeEnemy();
    showDamageNumber(`-${dmg}`, 'player');
    updateEnemyUI(this.enemy);

    // Phase 2 check
    if (
      this.enemy.isBoss &&
      this.phase === 1 &&
      this.enemy.currentHp / this.enemy.hp <= this.enemy.phase2Threshold
    ) {
      this._enterPhase2();
      return;
    }

    if (this.enemy.currentHp <= 0 && !this.finished) {
      this._victory();
    }
  }

  async _enterPhase2() {
    this.phase = 2;
    this.paused = true;
    sounds.phase2();
    await showPhase2(this.enemy.phase2Message || '「まだまだ！」');
    this.paused = false;
    this._resetEnemyTimer();
    battleLog('【フェーズ2突入】敵が強化された！');
    // Increase enemy speed
    this.enemy.attackInterval = Math.floor(this.enemy.attackInterval / 1.5);
  }

  // ---- Enemy attack loop (rAF-based for smooth timer bar) ----
  _startLoop() {
    this._resetEnemyTimer();
    const tick = () => {
      if (this.finished) return;
      if (!this.paused) {
        const elapsed = performance.now() - this._enemyTimerStart;
        const frac = elapsed / this.enemy.attackInterval;
        updateEnemyTimer(Math.min(frac, 1));
        if (frac >= 1) {
          this._enemyAttack();
          this._resetEnemyTimer();
        }
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  _resetEnemyTimer() {
    this._enemyTimerStart = performance.now();
  }

  _enemyAttack() {
    const dmg = calcEnemyDamage(this.enemy, this.player);
    this.player.hp = Math.max(0, this.player.hp - dmg);
    enemyAttackAnim();
    playerHitAnim();
    sounds.hit();
    showDamageNumber(`-${dmg}`, 'enemy');
    battleLog(`💥 ${this.enemy.name} の攻撃！ ${dmg} ダメージ！`);
    updateStatusText(this.player);

    if (this.player.hp <= 0 && !this.finished) {
      this._defeat();
    }
  }

  // ---- End states ----
  _victory() {
    this.finished = true;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    sounds.clear();
    battleLog(`🎉 ${this.enemy.name} を倒した！`);
    const leveled = addExp(this.player, this.enemy.reward.exp);
    setTimeout(() => this.onVictory(this.score, leveled), 900);
  }

  _defeat() {
    this.finished = true;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    sounds.gameover();
    battleLog('💀 やられた…');
    setTimeout(() => this.onDefeat(), 1200);
  }
}
