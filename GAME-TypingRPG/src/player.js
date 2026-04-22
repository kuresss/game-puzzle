export function createPlayer() {
  return {
    hp: 100, maxHp: 100,
    mp: 60,  maxMp: 60,
    atk: 15, def: 5,
    lv: 1,   exp: 0,
    spells: ['fire', 'blizzard', 'thunder', 'heal'],
  };
}

export function expNeeded(lv) {
  return lv * 30;
}

// Returns true if leveled up
export function addExp(player, amount) {
  player.exp += amount;
  if (player.exp >= expNeeded(player.lv)) {
    player.exp -= expNeeded(player.lv);
    player.lv++;
    player.maxHp += 10;
    player.hp = player.maxHp;
    player.maxMp += 5;
    player.mp = Math.min(player.mp + 5, player.maxMp);
    player.atk += 2;
    player.def += 1;
    return true;
  }
  return false;
}

export function calcPlayerDamage(player, enemy, speedMult, comboMult) {
  const raw = player.atk * speedMult * comboMult;
  return Math.max(1, Math.floor(raw - enemy.def));
}

export function calcEnemyDamage(enemy, player) {
  return Math.max(1, enemy.atk - player.def);
}

export function getSpeedMult(timeSec, wordLength) {
  const refTime = wordLength * 0.35; // 350ms per char = ~170 WPM
  return Math.min(2.0, Math.max(1.0, refTime / timeSec));
}

export function getComboMult(combo) {
  if (combo >= 10) return 2.0;
  if (combo >= 5)  return 1.5;
  return 1.0;
}
