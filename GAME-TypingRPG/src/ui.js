// ---- シーン切り替え ----
export function setScene(name) {
  document.getElementById('game').dataset.scene = name;
  if (name === 'battle') {
    setTimeout(() => document.getElementById('typing-input')?.focus(), 80);
  }
}

// ---- HPバー ----
export function updateHpBar(id, current, max) {
  const bar = document.getElementById(id);
  if (bar) bar.style.width = `${Math.max(0, (current / max) * 100)}%`;
  const pct = current / max;
  if (bar) {
    bar.style.background = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ff9800' : '#f44336';
  }
}

export function updateMpBar(current, max) {
  const bar = document.getElementById('player-mp-bar');
  if (bar) bar.style.width = `${Math.max(0, (current / max) * 100)}%`;
}

export function updateExpBar(exp, needed) {
  const bar = document.getElementById('exp-fill');
  if (bar) bar.style.width = `${Math.min(100, (exp / needed) * 100)}%`;
}

export function updateStatusText(player) {
  const hp = document.getElementById('player-hp-text');
  const mp = document.getElementById('player-mp-text');
  const lv = document.getElementById('player-lv');
  if (hp) hp.textContent = `${player.hp}/${player.maxHp}`;
  if (mp) mp.textContent = `${player.mp}/${player.maxMp}`;
  if (lv) lv.textContent = `LV.${player.lv}`;
  updateHpBar('player-hp-bar', player.hp, player.maxHp);
  updateMpBar(player.mp, player.maxMp);
}

// ---- 敵情報 ----
export function updateEnemyUI(enemy) {
  const nameEl = document.getElementById('enemy-name');
  const sprite = document.getElementById('enemy-sprite');
  if (nameEl) nameEl.textContent = `${enemy.emoji} ${enemy.name}`;
  if (sprite) sprite.textContent = enemy.emoji;
  updateHpBar('enemy-hp-bar', enemy.currentHp, enemy.hp);
  const hpText = document.getElementById('enemy-hp-text');
  if (hpText) hpText.textContent = `${enemy.currentHp}/${enemy.hp}`;
  const statsEl = document.getElementById('enemy-stats');
  if (statsEl) statsEl.textContent = `⚔ ATK:${enemy.atk}  🛡 DEF:${enemy.def}`;
}

// ---- 単語表示 ----
export function renderWord(word, typedLen) {
  const container = document.getElementById('word-chars');
  if (!container) return;
  container.innerHTML = '';
  const text = word.display || word.input;
  const inputText = word.input;
  for (let i = 0; i < text.length; i++) {
    const span = document.createElement('span');
    span.className = 'wchar';
    span.textContent = text[i];
    if (i < typedLen) span.classList.add('done');
    else if (i === typedLen) span.classList.add('next');
    container.appendChild(span);
  }
  // For Japanese: also show romaji progress below
  if (word.display && word.display !== word.input) {
    const romaji = document.getElementById('romaji-hint');
    if (romaji) {
      romaji.innerHTML = inputText.split('').map((c, i) =>
        `<span class="rchar ${i < typedLen ? 'done' : i === typedLen ? 'next' : ''}">${c}</span>`
      ).join('');
    }
  } else {
    const romaji = document.getElementById('romaji-hint');
    if (romaji) romaji.innerHTML = '';
  }
}

export function flashWord(ok, spellKey = null) {
  const container = document.getElementById('word-area');
  if (!container) return;
  container.classList.remove('flash-ok', 'flash-err', 'flash-fire', 'flash-blizzard', 'flash-thunder', 'flash-heal');
  void container.offsetWidth;
  if (!ok) {
    container.classList.add('flash-err');
  } else if (spellKey) {
    container.classList.add(`flash-${spellKey}`);
  } else {
    container.classList.add('flash-ok');
  }
}

// ---- ダメージ数字 ----
export function showDamageNumber(text, type = 'player') {
  const area = document.getElementById('damage-area');
  if (!area) return;
  const el = document.createElement('div');
  el.className = `dmg-num dmg-${type}`;
  el.textContent = text;
  el.style.left = (30 + Math.random() * 40) + '%';
  area.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ---- バトルログ ----
export function battleLog(msg) {
  const log = document.getElementById('battle-log');
  if (!log) return;
  const line = document.createElement('div');
  line.className = 'log-line';
  line.textContent = msg;
  log.prepend(line);
  while (log.children.length > 4) log.lastChild.remove();
}

// ---- コンボ表示 ----
export function showCombo(combo) {
  const el = document.getElementById('combo-display');
  if (!el) return;
  if (combo >= 3) {
    el.textContent = `COMBO × ${combo}`;
    el.className = `combo-show ${combo >= 10 ? 'combo-max' : combo >= 5 ? 'combo-hi' : ''}`;
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}

// ---- 敵攻撃タイマーバー ----
export function updateEnemyTimer(fraction) {
  const bar = document.getElementById('enemy-timer-fill');
  if (bar) {
    bar.style.width = `${fraction * 100}%`;
    bar.style.background = fraction > 0.75 ? '#f44' : fraction > 0.5 ? '#ff9800' : '#4caf50';
  }
}

// ---- 敵揺れアニメ ----
export function shakeEnemy() {
  const sprite = document.getElementById('enemy-sprite');
  if (!sprite) return;
  sprite.classList.remove('shake');
  void sprite.offsetWidth;
  sprite.classList.add('shake');
}

export function enemyAttackAnim() {
  const sprite = document.getElementById('enemy-sprite');
  if (!sprite) return;
  sprite.classList.remove('attack-anim');
  void sprite.offsetWidth;
  sprite.classList.add('attack-anim');
}

export function playerHitAnim() {
  const el = document.getElementById('player-status');
  if (!el) return;
  el.classList.remove('hit-flash');
  void el.offsetWidth;
  el.classList.add('hit-flash');
}

// ---- フェーズ2演出 ----
export function showPhase2(message) {
  return new Promise(resolve => {
    const overlay = document.getElementById('phase2-overlay');
    const msg = document.getElementById('phase2-msg');
    if (!overlay || !msg) return resolve();
    msg.textContent = message;
    overlay.style.display = 'flex';
    setTimeout(() => {
      overlay.style.display = 'none';
      resolve();
    }, 2200);
  });
}

// ---- スペルヒント ----
export function updateSpellHints(spells, playerMp) {
  const el = document.getElementById('spell-list');
  if (!el) return;
  const spellData = { fire: { mp: 10, icon: '🔥' }, blizzard: { mp: 20, icon: '❄️' }, thunder: { mp: 15, icon: '⚡' }, heal: { mp: 25, icon: '💚' } };
  el.innerHTML = spells.map(s => {
    const sd = spellData[s];
    const canCast = playerMp >= sd.mp;
    return `<span class="spell-hint ${canCast ? '' : 'spell-disabled'}">${sd.icon}${s}(MP:${sd.mp})</span>`;
  }).join(' ');
}

// ---- ポーズオーバーレイ ----
export function showPauseOverlay(paused) {
  const overlay = document.getElementById('pause-overlay');
  if (overlay) overlay.style.display = paused ? 'flex' : 'none';
  const btn = document.getElementById('btn-pause');
  if (btn) btn.textContent = paused ? '▶' : '⏸';
}

// ---- 画面揺れ（コンボ10以上） ----
export function screenShake() {
  const el = document.getElementById('scene-battle');
  if (!el) return;
  el.classList.remove('screen-shake');
  void el.offsetWidth;
  el.classList.add('screen-shake');
}

// ---- 入力欄シェイク ----
export function shakeInput() {
  const el = document.getElementById('typing-input');
  if (!el) return;
  el.classList.remove('input-shake');
  void el.offsetWidth;
  el.classList.add('input-shake');
}

// ---- 超高速テロップ ----
export function showSpeedTelop() {
  const existing = document.getElementById('speed-telop');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'speed-telop';
  el.textContent = '⚡ 超高速！';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ---- ステージ情報 ----
export function updateStageHeader(stage, player) {
  const name = document.getElementById('stage-name');
  if (name) name.textContent = `${stage.area} — ${stage.title}`;
  const { expNeeded } = window.__rpgUtils || {};
  if (expNeeded) updateExpBar(player.exp, expNeeded(player.lv));
}
