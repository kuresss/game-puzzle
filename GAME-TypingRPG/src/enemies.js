const ENEMY_DEFS = {
  slime: {
    id: 'slime', name: 'スライム', emoji: '🟢',
    hp: 40, atk: 8, def: 0, attackInterval: 4000,
    wordDifficulty: 'easy', reward: { exp: 20 },
  },
  goblin: {
    id: 'goblin', name: 'ゴブリン', emoji: '👺',
    hp: 55, atk: 10, def: 2, attackInterval: 3500,
    wordDifficulty: 'easy', reward: { exp: 28 },
  },
  wolf: {
    id: 'wolf', name: 'おおかみ', emoji: '🐺',
    hp: 65, atk: 12, def: 2, attackInterval: 3000,
    wordDifficulty: 'easy', reward: { exp: 35 },
  },
  forest_boss: {
    id: 'forest_boss', name: 'キングスライム', emoji: '💚',
    hp: 130, atk: 15, def: 3, attackInterval: 3000,
    wordDifficulty: 'easy', isBoss: true, phase2Threshold: 0.5,
    reward: { exp: 90 },
    phase2Message: '「ぬぐぐ…まだまだっ！」',
  },
  knight: {
    id: 'knight', name: 'ダークナイト', emoji: '🗡️',
    hp: 90, atk: 16, def: 6, attackInterval: 3000,
    wordDifficulty: 'normal', reward: { exp: 45 },
  },
  mage: {
    id: 'mage', name: 'くろまじゅつし', emoji: '🧙',
    hp: 75, atk: 20, def: 3, attackInterval: 2500,
    wordDifficulty: 'normal', reward: { exp: 50 },
  },
  golem: {
    id: 'golem', name: 'ストーンゴーレム', emoji: '🗿',
    hp: 115, atk: 14, def: 10, attackInterval: 3500,
    wordDifficulty: 'normal', reward: { exp: 55 },
  },
  castle_boss: {
    id: 'castle_boss', name: 'シャドウロード', emoji: '👁️',
    hp: 210, atk: 22, def: 8, attackInterval: 2500,
    wordDifficulty: 'normal', isBoss: true, phase2Threshold: 0.5,
    reward: { exp: 130 },
    phase2Message: '「ふふ…本気を見せてやろう！」',
  },
  dragon: {
    id: 'dragon', name: 'あかきりゅう', emoji: '🐉',
    hp: 155, atk: 23, def: 8, attackInterval: 2500,
    wordDifficulty: 'hard', reward: { exp: 75 },
  },
  demon: {
    id: 'demon', name: 'デーモン', emoji: '😈',
    hp: 140, atk: 26, def: 6, attackInterval: 2000,
    wordDifficulty: 'hard', reward: { exp: 80 },
  },
  lich: {
    id: 'lich', name: 'リッチキング', emoji: '💀',
    hp: 150, atk: 24, def: 12, attackInterval: 2200,
    wordDifficulty: 'hard', reward: { exp: 85 },
  },
  demon_lord: {
    id: 'demon_lord', name: 'だいまおう', emoji: '👿',
    hp: 320, atk: 30, def: 12, attackInterval: 2000,
    wordDifficulty: 'hard', isBoss: true, phase2Threshold: 0.5,
    reward: { exp: 220 },
    phase2Message: '「きさまごときに負けるか！真の力を解放する！」',
  },
};

export const STAGES = [
  { enemyId: 'slime',       area: '🌲 森の入口', title: '第1章: はじまりの戦い' },
  { enemyId: 'goblin',      area: '🌲 森の奥',   title: '第2章: みどりの悪魔' },
  { enemyId: 'wolf',        area: '🌲 森の深部', title: '第3章: 夜の狩人' },
  { enemyId: 'forest_boss', area: '🌲 古木の前', title: 'エリアボス！' },
  { enemyId: 'knight',      area: '🏰 城門',     title: '第5章: 鎧の騎士' },
  { enemyId: 'mage',        area: '🏰 城内回廊', title: '第6章: 闇の術士' },
  { enemyId: 'golem',       area: '🏰 地下牢',   title: '第7章: 石の番人' },
  { enemyId: 'castle_boss', area: '🏰 玉座の間', title: 'エリアボス！' },
  { enemyId: 'dragon',      area: '🔥 魔王城外壁', title: '第9章: 赤き竜' },
  { enemyId: 'demon',       area: '🔥 魔王城内部', title: '第10章: 闇の使者' },
  { enemyId: 'lich',        area: '🔥 魔王城地下', title: '第11章: 不死の王' },
  { enemyId: 'demon_lord',  area: '🔥 魔王の間',   title: '最終決戦！！' },
];

export function createEnemy(stageIndex) {
  const stage = STAGES[stageIndex];
  const def = ENEMY_DEFS[stage.enemyId];
  return {
    ...def,
    currentHp: def.hp,
    phase: 1,
    stage,
  };
}
