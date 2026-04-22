export const WORDS = {
  en: {
    easy: [
      'fire','rock','run','hit','jump','bash','kick','blow','burn','cast',
      'dash','grab','slam','push','land','axe','bow','ice','gem','war',
      'zap','cut','jab','ward','rage','bolt','bane','claw','fang','gust',
      'hail','lash','mist','nova','orb','pyre','rend','sear','vex','warp',
    ],
    normal: [
      'flame','shield','potion','wizard','castle','knight','goblin','dragon',
      'battle','attack','defend','poison','archer','forest','mystic','scroll',
      'spirit','strike','thrust','temple','vanish','weapon','wraith','shadow',
      'crystal','blaze','curse','exile','forge','gleam','haven','invoke',
    ],
    hard: [
      'blizzard','fortress','skeleton','werewolf','lightning','alliance',
      'crescent','darkness','guardian','immortal','nightfall','obsidian',
      'prophecy','sorcerer','spectral','twilight','thousand','thunderbolt',
      'phantom','warlock','dungeon','banshee','conjure','devastate',
    ],
  },
  ja: {
    easy: [
      { display: 'すらいむ',   input: 'suraimu'   },
      { display: 'まほう',     input: 'mahou'     },
      { display: 'かぜ',       input: 'kaze'      },
      { display: 'みず',       input: 'mizu'      },
      { display: 'ひかり',     input: 'hikari'    },
      { display: 'やいば',     input: 'yaiba'     },
      { display: 'ほのお',     input: 'honoo'     },
      { display: 'こおり',     input: 'koori'     },
      { display: 'ゆうき',     input: 'yuuki'     },
      { display: 'まじん',     input: 'majin'     },
      { display: 'ようせい',   input: 'yousei'    },
      { display: 'りゅう',     input: 'ryuu'      },
      { display: 'きし',       input: 'kishi'     },
      { display: 'まおう',     input: 'maou'      },
      { display: 'つるぎ',     input: 'tsurugi'   },
      { display: 'てつ',       input: 'tetsu'     },
      { display: 'ゆき',       input: 'yuki'      },
      { display: 'ほし',       input: 'hoshi'     },
      { display: 'かみ',       input: 'kami'      },
      { display: 'やみ',       input: 'yami'      },
    ],
    normal: [
      { display: 'まほうつかい', input: 'mahoutsukai' },
      { display: 'ゆうしゃ',     input: 'yuusha'      },
      { display: 'くらやみ',     input: 'kurayami'    },
      { display: 'てんくう',     input: 'tenkuu'      },
      { display: 'あんこく',     input: 'ankoku'      },
      { display: 'ほしぞら',     input: 'hoshizora'   },
      { display: 'まほうじん',   input: 'mahoujin'    },
      { display: 'でんせつ',     input: 'densetsu'    },
      { display: 'こんじょう',   input: 'konjou'      },
      { display: 'かがやき',     input: 'kagayaki'    },
      { display: 'おにがしま',   input: 'onigashima'  },
      { display: 'まほうびん',   input: 'mahoubin'    },
      { display: 'ひゅうが',     input: 'hyuuga'      },
      { display: 'ふうらい',     input: 'fuurai'      },
      { display: 'らいじん',     input: 'raijin'      },
      { display: 'ふうじん',     input: 'fuujin'      },
    ],
    hard: [
      { display: 'だいまおう',       input: 'daimaou'         },
      { display: 'でんせつのゆうしゃ', input: 'densetsunoyuusha' },
      { display: 'まほうのつるぎ',   input: 'mahounotsurugi'  },
      { display: 'あまのじゃく',     input: 'amanojaku'       },
      { display: 'ふうまのまほう',   input: 'fuumannomahou'   },
      { display: 'りゅうのきし',     input: 'ryuunokishi'     },
      { display: 'しんやのまおう',   input: 'shinyannomaou'   },
      { display: 'こくやみのりゅう', input: 'kokuyaminoryuu'  },
      { display: 'いかずちのかみ',   input: 'ikazuchinnokami' },
      { display: 'てんちむよう',     input: 'tenchimunyou'    },
    ],
  },
  spells: {
    fire:     { mp: 10, dmgMult: 2.0, msg: '🔥 ファイア！',    color: '#ff6600' },
    blizzard: { mp: 20, dmgMult: 2.5, msg: '❄️ ブリザード！',  color: '#66ccff' },
    thunder:  { mp: 15, dmgMult: 2.2, msg: '⚡ サンダー！',    color: '#ffee00' },
    heal:     { mp: 25, restore: 30,  msg: '💚 ヒール！',       color: '#66ff66' },
  },
};

export function getRandomWord(difficulty, lang, playerSpells) {
  const spellNames = Object.keys(WORDS.spells);
  // 20% chance to include a spell word if player has MP > 10
  if (Math.random() < 0.2 && playerSpells && playerSpells.length > 0) {
    const spell = spellNames[Math.floor(Math.random() * spellNames.length)];
    if (lang === 'en') return { input: spell, display: spell, isSpell: true, spellKey: spell };
    // In Japanese mode, spells still use English input but show description
    return { input: spell, display: spell, isSpell: true, spellKey: spell };
  }
  const pool = WORDS[lang][difficulty];
  const word = pool[Math.floor(Math.random() * pool.length)];
  if (typeof word === 'string') return { input: word, display: word };
  return { ...word };
}
