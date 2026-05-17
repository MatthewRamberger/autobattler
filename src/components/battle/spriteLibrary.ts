import { SpriteDef } from './spriteRenderer';
import { HeroClass } from '../../types';

// ----------------------------------------------------------------------------
// SPRITE LIBRARY
//
// Hand-authored 16×16 pixel-art portraits — one per named hero plus a
// catalogue of enemy creatures keyed by their unit icon (the emoji we
// previously rendered). All sprites face right; the renderer mirrors
// them for enemy-facing.
//
// Palette characters:
//   '.' = transparent. Single chars = palette entry. Keep palettes small;
//   the same key can mean different colors in different sprites.
// ----------------------------------------------------------------------------

// Common palette helpers used across many sprites.
const STEEL_LIGHT = '#cfd8e0';
const STEEL = '#8993a3';
const STEEL_DARK = '#3f4754';
const SKIN_LIGHT = '#f1c89a';
const SKIN = '#d49a6a';
const SKIN_DARK = '#8a5a39';
const LEATHER = '#7a4a1f';
const LEATHER_DARK = '#3d220b';
const GOLD = '#f4c542';
const GOLD_DARK = '#a87a14';
const BLOOD = '#a8202a';
const SHADOW = '#0c0d12';
const BONE = '#e8e0c5';
const BONE_DARK = '#9a906f';

// ---------------------------------------------------------------------------
// HERO SPRITES (keyed by hero id)
// ---------------------------------------------------------------------------

// warrior_1 Ironwall — heavy steel knight, sword + tower shield
export const SPRITE_IRONWALL: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': STEEL_DARK,    // outline / shadow
    'b': STEEL,         // armor mid
    'c': STEEL_LIGHT,   // armor highlight
    'd': SKIN,
    'e': '#222',        // eyes / inner slit
    'f': GOLD,          // accent
    'g': '#9c1f1f',     // cape inside
    'h': '#6a1212',     // cape outline
    'i': '#444',        // sword grip
    'j': '#bbb',        // blade
  },
  rows: [
    '....aaaaaa....',
    '...abbccbba...',
    '...abceecba...',
    '...abbeebba...',
    '..abbbddbbba..',
    '.ahbcbbbbcbga.',
    '.ahgbbfbbbgha.',
    '.ahggbfbbggha.',
    '.aghggfbgghga.',
    '..aghhfhhgaa..',
    '...abbjbba....',
    '...abbjbba....',
    '....aiiia.....',
    '....afffa.....',
    '....abba......',
    '...aaaaaa.....',
  ],
};

// warrior_2 Doomplate — black-iron juggernaut, horns on helm
export const SPRITE_DOOMPLATE: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a0c14',     // outline
    'b': '#2b2f3a',     // dark armor
    'c': '#494f60',     // mid armor
    'd': '#8a92a8',     // highlight
    'e': '#ff4a3c',     // glowing eyes
    'f': GOLD,          // trim
    'g': '#1b0808',     // horns/shadow
    'h': '#aa1c1c',     // cape inside
    'i': '#601010',     // cape outline
  },
  rows: [
    'g.aaaaaaaa..g.',
    'gaabcccccbaag.',
    '.abcdddddcba..',
    '.abceeeeecba..',
    '.abcdddddcba..',
    '.abccccccbba..',
    '.aifccccfiia..',
    '.aihccccfiia..',
    '.aiihhhhiiia..',
    '.iaiihhhiiai..',
    '..aibccccia...',
    '..aibccccia...',
    '...abccca.....',
    '...affffa.....',
    '...abccba.....',
    '..aaaaaaaa....',
  ],
};

// archer_1 Swiftshot — green hood, longbow drawn
export const SPRITE_SWIFTSHOT: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0c1a0c',     // outline
    'b': '#1f5a2c',     // hood dark
    'c': '#2f8a44',     // hood mid
    'd': '#4dd06a',     // hood highlight
    'e': SKIN_LIGHT,
    'f': '#1a1a1a',     // eyes
    'g': '#6b3a14',     // leather
    'h': '#a5651f',     // leather highlight
    'i': BONE,          // bow
    'j': '#5e361a',     // bow shadow
    'k': '#bbb',        // arrow shaft
    'l': GOLD,          // arrowhead
  },
  rows: [
    '...abbbcca....',
    '..abccddcca...',
    '..acdeeecca...',
    '..acefefcda...',
    '..acdeeedca...',
    '...adeefda....',
    '..agghhhgga.k.',
    '..agdhdhdga.k.',
    '..agdhddhgalk.',
    '..agdhdhdgaik.',
    '..aagdhdgaaiii',
    '....agdaalji..',
    '....agda..ji..',
    '....abba..ji..',
    '....abba..ji..',
    '...aaaaaaij...',
  ],
};

// archer_2 Stormcaller — lightning archer in stormy blues
export const SPRITE_STORMCALLER: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a0a18',
    'b': '#1a3b80',     // cloak dark
    'c': '#2e6ac0',     // cloak mid
    'd': '#5fa4ff',     // cloak hi
    'e': SKIN_LIGHT,
    'f': '#fafff0',     // glow eyes
    'g': '#2d2d40',     // leather
    'h': '#5b5e88',     // leather hi
    'i': '#e6f4ff',     // bow
    'j': '#7a96c2',     // bow shadow
    'k': GOLD,
    'l': '#f7e94a',     // lightning arrow
  },
  rows: [
    '...abbbccba...',
    '..abccdddcba..',
    '..acdeeeedca..',
    '..acefffefca..',
    '..acdeeeedca..',
    '...adeefdda...',
    '..agghhhggal.l',
    '..aghdhdhga.l.',
    '..aghdhhdgall.',
    '..aghdhdhga.la',
    '..aaghhhgaa.la',
    '....agdha.lla.',
    '....agda...la.',
    '....abba...la.',
    '....abba..la..',
    '...aaaaaala...',
  ],
};

// mage_1 Emberlash — fire mage, robe + tall hat + flaming staff
export const SPRITE_EMBERLASH: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#1a0606',
    'b': '#6a1313',     // hat/robe dark
    'c': '#a82424',     // robe mid
    'd': '#e3492c',     // robe highlight
    'e': SKIN_LIGHT,
    'f': '#260808',     // eyes
    'g': '#4a1a08',     // staff wood
    'h': '#f4c542',     // staff gem core
    'i': '#ff8a3a',     // flame
    'j': '#ffd148',     // flame hot
    'k': '#ffe8a8',     // flame core
  },
  rows: [
    '.....abca.....',
    '....abccca....',
    '...abccddca...',
    '..abccdddcca..',
    '..acdeeeedca..',
    '..acefefedca..',
    '..acdeeeedca..',
    '...adeefedaij',
    '..acccdccccaij',
    '..acdcdccdcaj.',
    '..acdcccccdaj.',
    '..acccdcccca..',
    '...aaccccaa...',
    '....agbga.....',
    '....agbga.....',
    '...aaaaaaaa...',
  ],
};

// mage_2 Frostweaver — ice mage, blue robes, frosty staff
export const SPRITE_FROSTWEAVER: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#06121e',
    'b': '#143a78',
    'c': '#2a76d2',
    'd': '#6fc8f5',
    'e': SKIN_LIGHT,
    'f': '#04243a',
    'g': '#3a2510',
    'h': '#a8e6ff',     // ice
    'i': '#ffffff',     // ice highlight
  },
  rows: [
    '.....abca.....',
    '....abccca....',
    '...abccddca...',
    '..abccdddcca..',
    '..acdeeeedca..',
    '..acefffedca..',
    '..acdeeeedca..',
    '...adeefedaih',
    '..acccdcccca.hi',
    '..acdcccccdah.h',
    '..acdcdcdcdah.h',
    '..acccdcccca..',
    '...aaccccaa...',
    '....agbga.....',
    '....agbga.....',
    '...aaaaaaaa...',
  ],
};

// paladin_1 Lightbringer — radiant paladin, gold + white armor
export const SPRITE_LIGHTBRINGER: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#2a2208',
    'b': GOLD_DARK,
    'c': GOLD,
    'd': '#fff7c2',
    'e': SKIN_LIGHT,
    'f': '#1a1a1a',
    'g': '#dde8ff',     // halo
    'h': '#6f8aff',     // banner blue
    'i': '#fff',        // emblem
    'j': '#888',        // hammer haft
    'k': '#cfd8e0',     // hammer head
  },
  rows: [
    '....gggggg....',
    '...gabbbbag...',
    '...abccccba...',
    '...abceecba...',
    '..abceffeeba..',
    '..acdeeedcaj..',
    '..acbdcdbcaj..',
    '..acbiiiibcakk',
    '..acbihiibcakk',
    '..acbiiiibcakk',
    '..acbhhhibcaj.',
    '..aacccccaaj..',
    '...aabbbaaj...',
    '....abbba.....',
    '...aabbbaa....',
    '..aaaaaaaaa...',
  ],
};

// paladin_2 Sunhammer — sun-themed paladin, blazing hammer
export const SPRITE_SUNHAMMER: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#2a1604',
    'b': '#b8801c',
    'c': '#f4c542',
    'd': '#fff7c2',
    'e': SKIN_LIGHT,
    'f': '#1a1a1a',
    'g': '#fff2a8',     // sun rays
    'h': '#ff8a14',     // hot sun
    'i': '#7a4a14',     // haft
    'j': '#ffe16a',     // hammer head
  },
  rows: [
    '.g..gggggg..g.',
    'gg.gabbbbag.gg',
    '.g.abccccba.g.',
    '...abceecba...',
    '..abceffeeba..',
    '..acdeeedca.ii',
    '..acbdcdbcahji',
    '..acbgggbcahji',
    '..acbghgbcajji',
    '..acbgggbcajji',
    '..acbhhhbca.ii',
    '..aacccccaa.i.',
    '...aabbbaa..i.',
    '....abbba...i.',
    '...aabbbaa..i.',
    '..aaaaaaaaaai.',
  ],
};

// rogue_1 Shadowstrike — hooded dagger rogue, gray + shadow
export const SPRITE_SHADOWSTRIKE: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#06070d',
    'b': '#1d1f2a',
    'c': '#33384a',
    'd': '#5a627a',
    'e': SKIN,
    'f': '#ffd84a',     // glowing eye slit
    'g': '#7a7a86',     // dagger blade
    'h': '#1a1a1a',     // hilt
    'i': '#9a9aa8',     // dagger hi
  },
  rows: [
    '...abbbbcaa...',
    '..abccccdcba..',
    '..acceeedcba..',
    '..acefefcdba..',
    '..acceeedcca..',
    '...aceeeca....',
    '..abbcccbba...',
    '..abbcbcbba.gi',
    '..abbcccbba.gi',
    '..abbcbcbbah.i',
    '..abbbbbbahh..',
    '...abbcbba.h..',
    '...abbcbba....',
    '....abcba.....',
    '....abcba.....',
    '...aaaaaaaa...',
  ],
};

// rogue_2 Nightveil — phantom ninja in dark purples
export const SPRITE_NIGHTVEIL: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#070409',
    'b': '#1f0d2a',
    'c': '#3a1855',
    'd': '#6a3290',
    'e': SKIN,
    'f': '#ff5ad8',     // glowing eyes
    'g': '#3a3a40',     // blade
    'h': '#8a8a96',     // blade hi
    'i': '#bd6cff',     // glow accent
  },
  rows: [
    '..aabbbcccba..',
    '.abcccddccba..',
    '.acdeeeedcba..',
    '.acefefefcca..',
    '.acceeeeecca..',
    '..aceeeeca....',
    '..abbcbcbba.gh',
    '..abbcccbba.gh',
    '..abbcbcbbagi.',
    '..abbcccbbaghh',
    '..abbbbbbai...',
    '...abbcbbai...',
    '...abbcbba....',
    '....abcba.....',
    '....abcba.....',
    '...aaaaaaaa...',
  ],
};

// berserker_1 Grimfang — bare-chested barbarian with greataxe
export const SPRITE_GRIMFANG: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#1a0808',
    'b': '#6a2818',     // hair
    'c': '#a04020',     // hair hi
    'd': SKIN_LIGHT,
    'e': SKIN,
    'f': '#222',        // eyes
    'g': BLOOD,         // warpaint
    'h': '#3a2a14',     // leather strap
    'i': '#777',        // axe blade
    'j': '#bbb',        // axe blade hi
    'k': '#6a3a14',     // axe haft
  },
  rows: [
    'b.abbbbcca.b..',
    'bcbcccddcba...',
    '.acddeefdba.jj',
    '.acdefdfdca.jj',
    '.acdedededajii',
    '..adgegegdaiii',
    '..ahhddddha.ik',
    '..ahdedededhaik',
    '..adedeededahik',
    '..adeedeeedaik',
    '..aaeeeeeaa.ik',
    '....aeeea...k.',
    '....adada...k.',
    '....adada...k.',
    '...aaeeeaa..k.',
    '..aaaaaaaaa.k.',
  ],
};

// berserker_2 Bloodforge — armored warlord with massive cleaver
export const SPRITE_BLOODFORGE: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a0508',
    'b': '#2a0808',
    'c': '#8a1c1c',
    'd': '#d23232',
    'e': SKIN,
    'f': '#ffe24a',     // burning eyes
    'g': STEEL_DARK,
    'h': STEEL,
    'i': STEEL_LIGHT,   // cleaver hi
    'j': '#2c1808',     // haft
  },
  rows: [
    '...abbcccca...',
    '..abcccdcccba.',
    '..acdeeeedcba.',
    '..acefffefca.ii',
    '..acdeeeedcaiii',
    '..agghdhdgga.ih',
    '..aghciichgajh.',
    '..aghciichgajih',
    '..aghciichgaji.',
    '..aaghhhgaaaji.',
    '..agbcccbgaaji.',
    '..agbccccba.ji.',
    '...abccccba.ji.',
    '...aagccgaa.ji.',
    '....aggga...ji.',
    '..aaaaaaaa..j..',
  ],
};

// cleric_1 Aurelia — white-and-gold healer with staff + halo
export const SPRITE_AURELIA: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#2a1c08',
    'b': '#d4b96f',     // hair
    'c': '#fff2c2',     // halo / hair hi
    'd': SKIN_LIGHT,
    'e': '#333',
    'f': '#fff',        // robe hi
    'g': '#d8d8d8',     // robe mid
    'h': GOLD,
    'i': '#7a4a14',     // staff
    'j': '#fff0a4',     // staff radiance
  },
  rows: [
    '....cccccc....',
    '...cabbbbac...',
    '...abccccba...',
    '...abdddcba...',
    '..abdeeeedba..',
    '..acdeeeedca..',
    '..acdddddca.ij',
    '..afhhhhhfa.ij',
    '..affffffa.ijj',
    '..afhhhhha.ij.',
    '..afhfhfhfa.ij',
    '..agffffga..ij',
    '...agfffga..ij',
    '....aggga...ij',
    '...aaggaaa..i.',
    '..aaaaaaaaa.i.',
  ],
};

// cleric_2 Solaris — sunrise priestess in oranges and gold
export const SPRITE_SOLARIS: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#2a1404',
    'b': '#c47a1c',
    'c': '#ffd060',     // hair / sun
    'd': SKIN_LIGHT,
    'e': '#333',
    'f': '#ffe7a8',     // robe hi
    'g': '#f3c14a',     // robe mid
    'h': '#a87a14',     // robe dark
    'i': '#5a3014',     // staff
    'j': '#ffb14a',     // staff sun
  },
  rows: [
    'c.ccaccaccac.c',
    '.cabccccccba.c',
    'c.abddccddba..',
    '...abdeeedba..',
    '..abdeeeedba..',
    '..acdeeeedca..',
    '..ahddddddha.ij',
    '..afgggggfa.ijj',
    '..afgfgfgfa.ijj',
    '..afgggggfa.ij.',
    '..afgfgfgfa.ij.',
    '..agghhhgga..ij',
    '...aghhhga...ij',
    '....agcga....ij',
    '...aaccaa....i.',
    '..aaaaaaaaa..i.',
  ],
};

// druid_1 Verdara — antlered druid, mossy greens, twisted staff
export const SPRITE_VERDARA: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a1308',
    'b': '#214a18',     // robe dark
    'c': '#3f8a30',     // robe mid
    'd': '#6cd055',     // robe hi
    'e': SKIN_LIGHT,
    'f': '#222',
    'g': '#7a4a14',     // antlers / staff wood
    'h': '#caa57a',     // antler hi
    'i': '#a9e95c',     // leaf
  },
  rows: [
    'gh.ghghgh.hg..',
    '.ghhh..hhhg...',
    '..gh.aa.hg....',
    '...abccca.....',
    '..abdeeedba...',
    '..acefefeca...',
    '..acdeeeedca..',
    '...adeeefda.gi',
    '..acccddccca.gi',
    '..acdcdcdcca.gii',
    '..acdcccccdaii.',
    '..accccdccca.gi',
    '...aaccccaa..g.',
    '....abbba....g.',
    '...aabbbaa...g.',
    '..aaaaaaaaa..g.',
  ],
};

// druid_2 Stagheart — antlered stag-warrior, deep forest green
export const SPRITE_STAGHEART: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#080e08',
    'b': '#14361a',
    'c': '#2f7530',
    'd': '#65c25a',
    'e': SKIN,
    'f': '#ffe07a',     // glowing eyes
    'g': '#9a6a2c',     // antler
    'h': '#caa57a',
    'i': '#3f1e08',     // leather
    'j': '#f4ffa0',     // leaf glow
  },
  rows: [
    'gh.gh..gh.hg..',
    '.gh.h..h.hg...',
    '..ghh..hhg....',
    '...abccca.....',
    '..abdeeedba...',
    '..acefffeca...',
    '..acdeeeedca..',
    '...adeeefda.gj',
    '..aiiccccia.gj',
    '..acdcdcdca.gjj',
    '..acdcccdcajj..',
    '..accdcdccca.gj',
    '...aaccccaa..g.',
    '....abbba....g.',
    '...aabbbaa...g.',
    '..aaaaaaaaa..g.',
  ],
};

// necromancer_1 Mortimer — black robe, glowing eyes, skull staff
export const SPRITE_MORTIMER: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#04030a',
    'b': '#1a0a26',
    'c': '#37194d',
    'd': '#6f3aa5',
    'e': '#7f00ff',     // glowing eyes
    'f': SKIN_DARK,
    'g': '#3a2510',     // staff
    'h': BONE,          // skull
    'i': '#9a7aa8',     // pale skin
  },
  rows: [
    '....abbcba....',
    '...abccddca...',
    '...acddddca...',
    '..abciiiicba..',
    '..acieieeica..',
    '..acieeeeica..',
    '..aciieeiicah.h',
    '..acccddccaahhh',
    '..acdcdcdca.ahh',
    '..acdcccdca.gh.',
    '..acccdccca.g..',
    '..accdcdcca.g..',
    '...aacccaa..g..',
    '....abbba...g..',
    '...aabbbaa..g..',
    '..aaaaaaaaa.g..',
  ],
};

// necromancer_2 Lichlord — crowned lich king
export const SPRITE_LICHLORD: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#030208',
    'b': '#0e0816',
    'c': '#22153a',
    'd': '#4d2e80',
    'e': '#2af0d0',     // glowing eyes
    'f': BONE,
    'g': BONE_DARK,
    'h': GOLD,          // crown
    'i': GOLD_DARK,
    'j': '#5a1a1a',     // robe accent
  },
  rows: [
    '..h.hhh.hhh.h.',
    '..hahihihiha..',
    '..aiihhhhiia..',
    '..agffffffga..',
    '..afeeggeefa..',
    '..afggggggfa..',
    '..agfggggfgafg',
    '..accjdjccca.fg',
    '..acdcdcdcca.fg',
    '..acdcjdjcda.fg',
    '..acdcdcdcca.fg',
    '..acjjdjjcca.fg',
    '...aaccccaa..fg',
    '....abbba....fg',
    '...aabbbaa....g',
    '..aaaaaaaaa...g',
  ],
};

// monk_1 Tenzin — bald monk in saffron robe
export const SPRITE_TENZIN: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#1a0a04',
    'b': '#8a5a1c',
    'c': '#d68a2a',
    'd': '#ffce6c',
    'e': SKIN_LIGHT,
    'f': SKIN_DARK,
    'g': '#222',
    'h': BLOOD,         // sash
    'i': '#3a2510',
  },
  rows: [
    '....afffffa...',
    '...afeeeefa...',
    '...aeeeeefa...',
    '...afegggea...',
    '..afeeeeefa...',
    '..afefefefa...',
    '..afeeeeefa...',
    '..ahhhhhhha...',
    '..abccdccba...',
    '..abdcdcdba...',
    '..abcdcdcba...',
    '..abdcdcdba...',
    '..ahhhhhha....',
    '..aibbbbia....',
    '..aibbbbia....',
    '..aaaaaaaa....',
  ],
};

// monk_2 Stormwalker — lightning monk with electric aura
export const SPRITE_STORMWALKER: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#040a14',
    'b': '#143a78',
    'c': '#2e6ac0',
    'd': '#5fa4ff',
    'e': SKIN_LIGHT,
    'f': '#fafff0',     // eyes
    'g': '#f7e94a',     // lightning
    'h': BLOOD,
    'i': '#3a2510',
  },
  rows: [
    'g...affaaa....',
    '.g.afeeeefa..g',
    '.g.afeeeefag..',
    '...afeggge.g..',
    '..afeeeeefag..',
    '..afefffefa...',
    '..afeeeeefa...',
    '..ahhhhhhhag..',
    '..abcccdcba.gg',
    '..abdcdcdba.g.',
    '..abcdcdcba.g.',
    '..abdcdcdba...',
    '..ahhhhhha....',
    '..aibbbbia....',
    '..aibbbbia....',
    '..aaaaaaaa....',
  ],
};

// ---------------------------------------------------------------------------
// ENEMY CREATURE SPRITES (keyed by unit icon)
// ---------------------------------------------------------------------------

// 👺 goblin scout/grunt — green, big ears, dagger
export const SPRITE_GOBLIN: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a1a08',
    'b': '#2a6a1c',
    'c': '#5da632',
    'd': '#9ed85a',
    'e': '#ff3a14',     // angry eyes
    'f': '#2a1808',
    'g': '#bbb',
    'h': '#3a2a10',
    'i': '#ff0',
  },
  rows: [
    'b..abcccba..b.',
    'bba.bcdcb.abb.',
    '.bba.bdb.abb..',
    '..abcccdccca..',
    '..acdcdcdcca..',
    '..acdeefedca..',
    '..acdefefdcag.',
    '..adceeeecdag.',
    '...adfififa.gg',
    '..acccccccca.g',
    '..acdccccdca.h',
    '..accccccccah.',
    '...aacccaa....',
    '....abbba.....',
    '...aabbbaa....',
    '..aaaaaaaaa...',
  ],
};

// 🦹 bandit — kerchief over face, leather, blade
export const SPRITE_BANDIT: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#1a0a08',
    'b': '#7a2a10',
    'c': '#b04020',
    'd': SKIN,
    'e': '#222',
    'f': '#4a2a10',
    'g': '#a87a14',
    'h': '#666',
    'i': '#bbb',
  },
  rows: [
    '...abbbbbca...',
    '..abccccccba..',
    '..acdddddcba..',
    '..acdeefedca..',
    '..acdeeeedca..',
    '..acbbbbbbca..',
    '..acbcccccca..',
    '..acbccccccah.',
    '..afgggggggahi',
    '..afgcgcgcga.hi',
    '..afgggggggah.i',
    '..afgcgcgcga.h.',
    '...aagggga....',
    '....afffa.....',
    '...aafffaa....',
    '..aaaaaaaaa...',
  ],
};

// 👹 troll/ogre — bulky green
export const SPRITE_TROLL: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a1408',
    'b': '#3a5a1c',
    'c': '#588a30',
    'd': '#7fb04a',
    'e': '#222',
    'f': '#f4c542',     // tusks
    'g': '#7a4a14',     // club
    'h': '#a87a3a',
  },
  rows: [
    '..abbbbbbcca..',
    '.abcccdcccdba.',
    '.acdcdcdcdcba.',
    '.acdcdcdcdcca.',
    '.acdedeededca.',
    '.acdedededdcahh',
    '.acdfdfdfdcahgg',
    '..adccccccda.hg',
    '..abcccdccba.hg',
    '..abdccdccda.hg',
    '..abccdccdca.hg',
    '..accccccccah.g',
    '..adcccccccdh.g',
    '...adddddda...g',
    '..aaddddaaa...g',
    '.aaaaaaaaaa...g',
  ],
};

// 🧚 dark sprite/fairy — small purple winged creature
export const SPRITE_SPRITE: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#08040c',
    'b': '#3a1c5a',
    'c': '#7a3aa8',
    'd': '#c060ee',
    'e': '#ff8aff',
    'f': '#fff',
    'g': '#180420',
  },
  rows: [
    '.dd.........dd',
    'dcd.aabbbba.dcd',
    'cdc.acccddca.cdc',
    '.dca.ccdffdc.acd',
    'dcdc.cdeffec.cdcd',
    'cdc..adccdca..cdc',
    'dc...accdcca...cd',
    '.....aaccaa.....',
    '......acca......',
    '......aaaa......',
    '......acca......',
    '......acca......',
    '......aaaa......',
    '......a..a......',
    '......a..a......',
    '.....aa..aa.....',
  ],
};

// 💀 skeleton — bony warrior with sword
export const SPRITE_SKELETON: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a0908',
    'b': '#3a3424',
    'c': '#9a9072',
    'd': BONE,
    'e': '#fff',
    'f': '#ff3a14',     // eye glow
    'g': '#555',
    'h': '#aaa',        // blade
    'i': '#bbb',
  },
  rows: [
    '...abcccca....',
    '..acdddddca...',
    '..acdfdfdca...',
    '..acdfffdca...',
    '..acddddddca..',
    '...accccca....',
    '..abdbdbdba.gh',
    '..acdcdcdca.gh',
    '..acdbdbdca.gh',
    '..acdcdcdca.gh',
    '..acdbdbdca.g.',
    '...abdbdba..g.',
    '...abcbcba..g.',
    '...abcbcba..g.',
    '..aabcbcbaa.g.',
    '..aaaaaaaa..g.',
  ],
};

// 🧙 wizard — pointed hat, beard, staff
export const SPRITE_WIZARD: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a0612',
    'b': '#1f1a3a',
    'c': '#3a2f6a',
    'd': '#6555aa',
    'e': SKIN_LIGHT,
    'f': '#222',
    'g': BONE,          // beard
    'h': '#4a2510',     // staff
    'i': '#9be8ff',     // gem
  },
  rows: [
    '.....abca.....',
    '....abccba....',
    '...abccdcba...',
    '..abccdddcba..',
    '..acdeeeedca..',
    '..acefefedca..',
    '..acdgggddca..',
    '..adggggggdahi',
    '..accgggggca.hi',
    '..acdcgggcca.hi',
    '..acccgggdca.h.',
    '..acdccccdca.h.',
    '...aaccccaa..h.',
    '....abbba....h.',
    '...aabbbaa...h.',
    '..aaaaaaaaa..h.',
  ],
};

// 👻 ghost / ice wraith — pale floating spirit
export const SPRITE_GHOST: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a1820',
    'b': '#1f3a4a',
    'c': '#4a86a8',
    'd': '#a8e0ee',
    'e': '#fff',
    'f': '#0a1a24',
  },
  rows: [
    '.....abcca....',
    '....abcdcba...',
    '...abcdddcba..',
    '..abcdeeedcba.',
    '..acdeffeedca.',
    '..acdeeeeedca.',
    '..acdefffedca.',
    '..acdeeeeedca.',
    '..acdddddddca.',
    '..acccccccca..',
    '..acdcccdcca..',
    '.acdcdcdcdcca.',
    '.acdcccccccdca',
    '.acccacacacaca',
    '.aaa.a.a.a.a..',
    '......a.a.....',
  ],
};

// 🐺 wolf — gray quadruped
export const SPRITE_WOLF: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a0a0c',
    'b': '#3a3a44',
    'c': '#6a6a78',
    'd': '#9a9aa8',
    'e': '#ff5a14',     // eyes
    'f': '#fff',        // fangs
  },
  rows: [
    '..............',
    '..............',
    'ab............',
    'abc...........',
    'abca..........',
    '.abca.........',
    '..abca........',
    'aabcccca......',
    'abcdedddca....',
    'abcffdfdcba...',
    'abcccccdcba...',
    '.bccccccdcba..',
    '.bcdccccccba..',
    '.bccdccccdba..',
    '..bccaccba....',
    '..a.a.aa.a....',
  ],
};

// 🦣 yeti / mammoth — big white tusked beast
export const SPRITE_YETI: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#1a1818',
    'b': '#6a7080',
    'c': '#9aa0b0',
    'd': '#dde4ee',
    'e': '#ff7a14',
    'f': BONE,
  },
  rows: [
    '..abbcccbba...',
    '.abccddddcba..',
    '.acdddeedddca.',
    '.acdedffded.ca',
    '.acdddffeddca.',
    '..acdfdfdcca..',
    '.abdcccccccda.',
    '.acdcdcdcdcca.',
    'fcdcccccccdcaf',
    'fcccdcdcdcccaf',
    '.acdcccccdcca.',
    '.acccdcdccca..',
    '..aabddddaa...',
    '...aabbbaa....',
    '..aabbbbaa....',
    '..aa....aa....',
  ],
};

// 🧝 elf ranger — green-cloaked, pointy ears
export const SPRITE_ELF: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#08120a',
    'b': '#1f4a1f',
    'c': '#3f8a3a',
    'd': '#7ad06a',
    'e': SKIN_LIGHT,
    'f': '#222',
    'g': '#4a3014',
    'h': BONE,
    'i': '#fff',
  },
  rows: [
    '...abbcccba...',
    '..abccddccba..',
    '..acdcddcdca..',
    '..adeeeeeeda..',
    '..adefefefda..',
    '..adeeeeeeda..',
    '..adeefeeda...',
    '..agghhhgga.h.',
    '..agdhdhdgah.h',
    '..agdhddhgah.h',
    '..agdhdhdgah.h',
    '..aagdhdgaah.h',
    '....agdaa..h.h',
    '....agda....h.',
    '....abba....h.',
    '...aaaaaa...h.',
  ],
};

// 🥷 ninja/assassin — black-masked
export const SPRITE_NINJA: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#04050a',
    'b': '#0e1118',
    'c': '#1e2233',
    'd': '#393f55',
    'e': SKIN,
    'f': '#ff3a3a',     // eye band
    'g': '#bbb',        // blade
    'h': '#444',        // hilt
  },
  rows: [
    '...abbcccba...',
    '..abccddccba..',
    '..acdcddcdca..',
    '..acdeeeedca..',
    '..acfffffcca..',
    '..acdcdcdcca..',
    '..abcccccba.gg',
    '..abccccccba.gg',
    '..abccccccca.gh',
    '..abcccccca..gh',
    '..abccccccba..h',
    '..aabccccbaa..',
    '...abccccba...',
    '....abccba....',
    '...aabbbaa....',
    '..aaaaaaaaa...',
  ],
};

// 🐻 bear — brown four-legged
export const SPRITE_BEAR: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a0604',
    'b': '#3a2010',
    'c': '#6a3a18',
    'd': '#a85a24',
    'e': '#ff3a14',
    'f': '#fff',
  },
  rows: [
    '..............',
    '..............',
    '...abcca......',
    '..abcddcba....',
    '..acdeddca....',
    '..acdfdfdca...',
    '..adcccccca...',
    'aacccccccdcba.',
    'abcdcdcdcdcca.',
    'abcdccccccdca.',
    'abcdccdccdcba.',
    'abccdccccdcba.',
    'abcdcdccdcba..',
    '.bccacacabba..',
    '.aa.a.a.a.a...',
    '..............',
  ],
};

// 🦊 fox — orange
export const SPRITE_FOX: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a0604',
    'b': '#7a2a08',
    'c': '#d0541c',
    'd': '#f0843a',
    'e': '#fff',
    'f': '#222',
  },
  rows: [
    'a............a',
    'aba..........ab',
    'abca........abc',
    '.abca.......abc',
    '..abca......abc',
    '..abcdca...abcd',
    '..acdddca.acdcb',
    '..acdfdca.adccb',
    '..acdeeeca.dcb.',
    '..abccccca.cb..',
    '..abcccccdcb...',
    '..abcdccccdcba.',
    '..abccccccdcba.',
    '..abccdcccdba..',
    '...bccaaacba...',
    '...a.a.a.a.a..',
  ],
};

// 🦝 raccoon
export const SPRITE_RACCOON: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#080808',
    'b': '#2a2a32',
    'c': '#5a5a66',
    'd': '#9a9aa8',
    'e': '#fff',
    'f': '#222',
  },
  rows: [
    '..............',
    '..............',
    '..abccccba....',
    '..acdccccda...',
    '..adccfccda...',
    '..accdfdcca...',
    '..acdcccdcca..',
    '.acccccccccba.',
    'abccdcdcdccba.',
    'abccccccccdcba',
    'abccdcdcdccba.',
    'abcccccccccba.',
    'abcdccccccdba.',
    '.bccacacacba..',
    '.a.a.a.a.a.a..',
    '..............',
  ],
};

// 🦬 buffalo / 🦏 rhino — armored beast
export const SPRITE_BUFFALO: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#080608',
    'b': '#3a2412',
    'c': '#5a3818',
    'd': '#8a5824',
    'e': '#ff3a14',
    'f': BONE,
  },
  rows: [
    '..............',
    '...f......f...',
    '..ffabbbbaff..',
    '..fabcdcdcbaf.',
    '...acdeeedca..',
    '...adcfedfdca.',
    '..aaccccccca..',
    'aaccdcdcdcdcba',
    'abcdccccccdcba',
    'abcdccdccddcba',
    'abccdccdccdcba',
    'abccdcdccccdba',
    '.bcaacacacacba',
    '.a.a.a.a.a.a..',
    '..............',
    '..............',
  ],
};

// 🐯 tiger
export const SPRITE_TIGER: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#080404',
    'b': '#a85020',
    'c': '#f08a2a',
    'd': '#ffce4a',
    'e': '#222',
    'f': '#fff',
  },
  rows: [
    '..............',
    '..abca....abca',
    '..acda....acda',
    '..acdacccacda.',
    '..acdcdedcdca.',
    '..acdeffedeca.',
    '..acdcdfdcdca.',
    'aaccccdcdcccaa',
    'abcdadcdadcdba',
    'abcdcdcdcdcdba',
    'abcdadcdadcdba',
    'abccccdcdcccba',
    'abcdadcdadcdba',
    '.bcaa.aaa.acba',
    '.a.a.a.a.a.a..',
    '..............',
  ],
};

// 😈 imp / fire imp
export const SPRITE_IMP: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#1a0408',
    'b': '#7a1414',
    'c': '#c83020',
    'd': '#f06030',
    'e': '#ffe04a',     // eyes
    'f': '#222',
    'g': '#fff8',       // teeth
  },
  rows: [
    '..b........b..',
    '.bb........bb.',
    '.bba......abb.',
    '..acccddccca..',
    '..acdcdcdcca..',
    '..acdeefedca..',
    '..acdefefdca..',
    '..acdeeeedcab.',
    '..adggggggda.b',
    '..acccdcccca.b',
    '..acdcccdcca.b',
    '..accdcdccca.b',
    '...aaccccaa..b',
    '....abbba...bb',
    '...aabbbaa.bb.',
    '..aaaaaaaa.b..',
  ],
};

// 🔥 magma brute — fire elemental
export const SPRITE_FIRE_ELE: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#2a0404',
    'b': '#7a1c08',
    'c': '#c8401c',
    'd': '#f4823a',
    'e': '#ffe04a',
    'f': '#fff',
  },
  rows: [
    '..a..a..a..a..',
    '.aab.b.a.b.ba.',
    'abbccbabacbcba',
    'abccdccccdccba',
    'acdedddddedca.',
    'acdeefffeedca.',
    'acdefefefedca.',
    'acdeeeeeedca..',
    '.adcccccccda..',
    '.acdcdcdcdca..',
    '.acdcccccdca..',
    '.acccdcdccca..',
    '..aaccccaaa...',
    '...abbba......',
    '..aabbbaa.....',
    '.aaaaaaaaa....',
  ],
};

// 🦎 salamander / lizard
export const SPRITE_LIZARD: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a1a04',
    'b': '#3a6a14',
    'c': '#6aa820',
    'd': '#a8d840',
    'e': '#ff3a14',
    'f': '#fff',
  },
  rows: [
    '..............',
    '..............',
    '...abcccba....',
    '..acdddddca...',
    '..acdedfdca...',
    '..acddddddcaa.',
    '.abcccccccccba',
    'abcdcdcdcdcdba',
    'abcdcccccdccba',
    'abcdccdcdccdba',
    'abccdcdcdcdcba',
    '.bccccccdcccba',
    '.bcacacaccacba',
    '.a.a.a.a.a.a..',
    '..............',
    '..............',
  ],
};

// 🌑 shadow figure — generic dark assassin
export const SPRITE_SHADOW: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#020205',
    'b': '#0a0c14',
    'c': '#1a1a26',
    'd': '#2a2a3a',
    'e': '#9a3aff',     // glowing eyes
    'f': '#440a4a',
  },
  rows: [
    '...abbbbba....',
    '..abcdddcba...',
    '..acddccdca...',
    '..acdcffcdca..',
    '..acdcffcdca..',
    '..aacddddcaa..',
    '..abccccccba..',
    '..abcccccccba.',
    '..abcccccccba.',
    '..abccccccba..',
    '..abccdccdba..',
    '..abcdccccba..',
    '..aabccccaa...',
    '....abbba.....',
    '...aabbbaa....',
    '..aaaaaaaaa...',
  ],
};

// 👼 angel / seraph
export const SPRITE_ANGEL: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#2a1c08',
    'b': '#d4b96f',
    'c': '#fff7c2',
    'd': SKIN_LIGHT,
    'e': '#222',
    'f': '#fff',
    'g': '#dde8ff',     // wings
    'h': '#7a9fff',
    'i': GOLD,
  },
  rows: [
    'g..ccccccc..g.',
    'ggcabbbbbacgg.',
    'ghabcccccbahg.',
    'ghadddddddahg.',
    'ghadeeeeedahg.',
    'ghadefefedahg.',
    'ghaddddddda hg',
    '.ghaffffffah.g',
    '.ghaifffiaha.g',
    '.gghafffigha.g',
    '..ghaiiiiaag..',
    '...aafffaa....',
    '....abbba.....',
    '...aabbbaa....',
    '..aaaaaaaaa...',
    '..............',
  ],
};

// 🕊️ dove / seraph priest — small white winged figure
export const SPRITE_DOVE: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#2a1c08',
    'b': '#dde0e8',
    'c': '#fff',
    'd': '#888',
    'e': GOLD,
  },
  rows: [
    '..............',
    '......abca....',
    '.....abccca...',
    '.bcaabcccccaa.',
    'bcccbcccccccbc',
    '.bcccccccccccb',
    '..bccccdcccca.',
    '..acccccccca..',
    '..abccccccba..',
    '..abcccccba...',
    '....aabaae....',
    '....aabbe.....',
    '.....aae......',
    '.....aae......',
    '....aaaa......',
    '..............',
  ],
};

// 🧘 monk (sitting) / generic monk fallback
export const SPRITE_MONK_NPC = SPRITE_TENZIN;

// 🧟 zombie
export const SPRITE_ZOMBIE: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a1208',
    'b': '#1a3018',
    'c': '#3a6028',
    'd': '#6aa040',
    'e': '#ffe24a',
    'f': '#222',
    'g': BONE,
    'h': '#5a2010',
  },
  rows: [
    '...abbccba....',
    '..abcccdcba...',
    '..acdcdcdcba..',
    '..acdfedfdca..',
    '..acdeeeedca..',
    '..acdgggdcca..',
    '...adfffda....',
    '..abccccccba..',
    '..acdcdcdcca..',
    '..acdcdhdcca..',
    '..acdhdcdcca..',
    '..acdcdcdcca..',
    '...aaccccaa...',
    '....abbba.....',
    '...aabbbaa....',
    '..aaaaaaaaa...',
  ],
};

// 🐲 / 🐉 dragon wyrm
export const SPRITE_DRAGON: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a0204',
    'b': '#5a1414',
    'c': '#a82828',
    'd': '#e84a2a',
    'e': '#ffce4a',
    'f': '#fff',
    'g': '#222',
  },
  rows: [
    '..b...b...b...',
    '.b.b.b.b.b....',
    '.abbabbabba...',
    '.acccdcccca...',
    '.acdcdedcda...',
    '.acdeegfedcaa.',
    '.acdeefffedcba',
    '.adcdddddccdba',
    'abccccdcdccdba',
    'abcdcccccdcdba',
    'abcdcdccdccdba',
    'abccccdcdcccba',
    '.bcdccccccdba.',
    '.acccccccccba.',
    '..aacacaccaa..',
    '..............',
  ],
};

// 🦖 drake whelp
export const SPRITE_DRAKE: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#0a0a04',
    'b': '#3a2810',
    'c': '#7a5820',
    'd': '#c89830',
    'e': '#ff5a14',
    'f': '#fff',
  },
  rows: [
    '..............',
    '..............',
    '..a...........',
    '..ab.....abca.',
    '..abca..abdca.',
    '..abccaaacddca',
    '..abccccdedcba',
    '..acccdfedccba',
    '..acdccccccdba',
    '..acdccdccccba',
    '..accdccdcccba',
    '..acccccccccba',
    '..acccccccdba.',
    '..ababababaa..',
    '..............',
    '..............',
  ],
};

// 🦑 eldritch spawn — squid
export const SPRITE_SQUID: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#06040a',
    'b': '#26104a',
    'c': '#5a28a0',
    'd': '#a050e0',
    'e': '#ff5add',
    'f': '#fff',
  },
  rows: [
    '...abccccba...',
    '..abcddddcba..',
    '..acdddddca...',
    '..acdedfedca..',
    '..acdeeeedca..',
    '..acdddddca...',
    '...accdddca...',
    '..acccdccca...',
    '.abccacaccba..',
    'abccaacaaccba.',
    'aba.a.aa.a.aba',
    '..a.a.a.a.a.a.',
    '...a.a..a.a...',
    '....a....a....',
    '..............',
    '..............',
  ],
};

// 🔮 orb / crystal mage — floating crystal
export const SPRITE_ORB: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#06040c',
    'b': '#1f1a3a',
    'c': '#3a2f6a',
    'd': '#6555aa',
    'e': '#aa90ee',
    'f': '#fff',
    'g': BONE_DARK,
    'h': BONE,
  },
  rows: [
    '....aabbaa....',
    '...abcddcba...',
    '..abcdeefcba..',
    '..abdefffdba..',
    '..abdefefdba..',
    '..abcdefdcba..',
    '...abcddcba...',
    '....aabbaa....',
    '.......a......',
    '.....abhba....',
    '....abhhhba...',
    '....agghhga...',
    '....abhhhba...',
    '....abhhhba...',
    '....abbbba....',
    '....aaaaaa....',
  ],
};

// 👑 crowned shadow knight / shadow lord
export const SPRITE_CROWNED_KNIGHT: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#04030a',
    'b': '#0e0816',
    'c': '#22153a',
    'd': '#4d2e80',
    'e': '#ff5a3a',     // eye glow
    'f': BONE,
    'g': GOLD,          // crown
    'h': GOLD_DARK,
    'i': '#7a1c1c',     // cape
  },
  rows: [
    '..g.ggg.ggg.g.',
    '..gagahagagga.',
    '..ahhggggghha.',
    '..abccccccba..',
    '..acdeeeeedca.',
    '..acdcdcdcdca.',
    '..acccfffccca.',
    '..abccddccba.i',
    '..abcdddccba.i',
    '..abcdcdccba.ii',
    '..abccdcdcba.i.',
    '..abcdcccdba.i.',
    '...abccccba..i.',
    '...abbbbba...i.',
    '..aabbbbbaa..i.',
    '..aaaaaaaa...i.',
  ],
};

// 👿 shadow lord boss
export const SPRITE_SHADOW_LORD: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#000000',
    'b': '#0a0810',
    'c': '#1a142a',
    'd': '#2e2348',
    'e': '#ff2a2a',
    'f': '#7a0a0a',
    'g': '#220a26',
  },
  rows: [
    'gg..g.gg.g..gg',
    'gcg.g.gg.g.gcg',
    '.acgaabbbaagca',
    '..abccdddcba..',
    '..acdeeeeedca.',
    '..acdefefedca.',
    '..acdeeeeedca.',
    '..acdddddddca.',
    '..agccffccga..',
    '..agccfdccga..',
    '..agcdcdcdga..',
    '..agccffccga..',
    '...aacccaaa...',
    '....abbba.....',
    '...aabbbaa....',
    '..aaaaaaaaa...',
  ],
};

// 🌋 worldbreaker — colossal stone titan with magma cracks
export const SPRITE_TITAN: SpriteDef = {
  w: 16, h: 16,
  palette: {
    'a': '#080404',
    'b': '#2a1e10',
    'c': '#4a3818',
    'd': '#6a4818',
    'e': '#ff4a14',
    'f': '#ffe04a',
    'g': '#222',
  },
  rows: [
    '..abccccccba..',
    '.abcdcdcdcdba.',
    '.acdedcdedcda.',
    '.acdcefefcdca.',
    '.acdeeggeedca.',
    '.acdeefeefdca.',
    '.acdeeeeeedca.',
    '.acdcdcdcdcca.',
    '.aaccdcdcdcaa.',
    'abccdcccccdcba',
    'abccecdcdceccba',
    'abccdeeeeedcba',
    '.bccdccccdcba.',
    '.aacccccccaa..',
    '...adddda.....',
    '..aaddddaa....',
  ],
};

// 🎯 sniper (bullseye) — leaning archer
export const SPRITE_SNIPER = SPRITE_SWIFTSHOT;
// 🌅 sunrise — fallback to Solaris
export const SPRITE_SUNRISE = SPRITE_SOLARIS;
// ⚔️ blade
export const SPRITE_BLADEMASTER = SPRITE_NINJA;
// ⚒️ smith / forge
export const SPRITE_FORGEHAMMER = SPRITE_DOOMPLATE;
// 🏰 castle / elite knight
export const SPRITE_CASTLE_KNIGHT = SPRITE_IRONWALL;
// 🛡️ shieldbearer
export const SPRITE_SHIELD = SPRITE_IRONWALL;
// 🌳 treant / tree
export const SPRITE_TREANT = SPRITE_VERDARA;
// 🦌 stag fallback
export const SPRITE_STAG = SPRITE_STAGHEART;
// 🤖 robot
export const SPRITE_ROBOT = SPRITE_STORMCALLER;
// 🤺 fencer
export const SPRITE_FENCER = SPRITE_IRONWALL;
// ❄️ ice elemental
export const SPRITE_ICE_ELE = SPRITE_FROSTWEAVER;
// 😇 cherub
export const SPRITE_CHERUB = SPRITE_ANGEL;
// 👤 generic
export const SPRITE_GENERIC = SPRITE_BANDIT;

// ---------------------------------------------------------------------------
// LOOKUP TABLES
// ---------------------------------------------------------------------------

// Per-hero sprite (by hero id from data/heroes.ts)
export const HERO_SPRITES: Record<string, SpriteDef> = {
  warrior_1: SPRITE_IRONWALL,
  warrior_2: SPRITE_DOOMPLATE,
  archer_1: SPRITE_SWIFTSHOT,
  archer_2: SPRITE_STORMCALLER,
  mage_1: SPRITE_EMBERLASH,
  mage_2: SPRITE_FROSTWEAVER,
  paladin_1: SPRITE_LIGHTBRINGER,
  paladin_2: SPRITE_SUNHAMMER,
  rogue_1: SPRITE_SHADOWSTRIKE,
  rogue_2: SPRITE_NIGHTVEIL,
  berserker_1: SPRITE_GRIMFANG,
  berserker_2: SPRITE_BLOODFORGE,
  cleric_1: SPRITE_AURELIA,
  cleric_2: SPRITE_SOLARIS,
  druid_1: SPRITE_VERDARA,
  druid_2: SPRITE_STAGHEART,
  necro_1: SPRITE_MORTIMER,
  necro_2: SPRITE_LICHLORD,
  monk_1: SPRITE_TENZIN,
  monk_2: SPRITE_STORMWALKER,
};

// Per-icon sprite for enemies. Falls back to class sprite if no icon match.
export const ICON_SPRITES: Record<string, SpriteDef> = {
  '👺': SPRITE_GOBLIN,
  '🦹': SPRITE_BANDIT,
  '👹': SPRITE_TROLL,
  '🧚': SPRITE_SPRITE,
  '💀': SPRITE_SKELETON,
  '🧙': SPRITE_WIZARD,
  '👻': SPRITE_GHOST,
  '🐺': SPRITE_WOLF,
  '🦣': SPRITE_YETI,
  '🧝': SPRITE_ELF,
  '🥷': SPRITE_NINJA,
  '🦊': SPRITE_FOX,
  '🦝': SPRITE_RACCOON,
  '🦬': SPRITE_BUFFALO,
  '🦏': SPRITE_BUFFALO,
  '🐯': SPRITE_TIGER,
  '😈': SPRITE_IMP,
  '🔥': SPRITE_FIRE_ELE,
  '🦎': SPRITE_LIZARD,
  '🌑': SPRITE_SHADOW,
  '👼': SPRITE_ANGEL,
  '🕊️': SPRITE_DOVE,
  '🧘': SPRITE_MONK_NPC,
  '🧟': SPRITE_ZOMBIE,
  '🐲': SPRITE_DRAGON,
  '🐉': SPRITE_DRAGON,
  '🦖': SPRITE_DRAKE,
  '🦑': SPRITE_SQUID,
  '🔮': SPRITE_ORB,
  '👁️': SPRITE_ORB,
  '👑': SPRITE_CROWNED_KNIGHT,
  '👿': SPRITE_SHADOW_LORD,
  '🌋': SPRITE_TITAN,
  '🎯': SPRITE_SNIPER,
  '🌅': SPRITE_SUNRISE,
  '⚔️': SPRITE_BLADEMASTER,
  '⚒️': SPRITE_FORGEHAMMER,
  '🏰': SPRITE_CASTLE_KNIGHT,
  '🛡️': SPRITE_SHIELD,
  '🌳': SPRITE_TREANT,
  '🦌': SPRITE_STAG,
  '🤖': SPRITE_ROBOT,
  '🤺': SPRITE_FENCER,
  '❄️': SPRITE_ICE_ELE,
  '😇': SPRITE_CHERUB,
  '👤': SPRITE_GENERIC,
  '🏹': SPRITE_SWIFTSHOT,
  '⚡': SPRITE_STORMCALLER,
  '☀️': SPRITE_SUNHAMMER,
  '🌩️': SPRITE_STORMWALKER,
  '🥋': SPRITE_TENZIN,
  '🌿': SPRITE_VERDARA,
  '✨': SPRITE_LIGHTBRINGER,
  '🪓': SPRITE_GRIMFANG,
  '🗡️': SPRITE_SHADOWSTRIKE,
  '🛡': SPRITE_IRONWALL,
};

// Class fallback (for enemies whose icon isn't in ICON_SPRITES).
export const CLASS_SPRITES: Record<HeroClass, SpriteDef> = {
  Warrior: SPRITE_IRONWALL,
  Archer: SPRITE_SWIFTSHOT,
  Mage: SPRITE_EMBERLASH,
  Paladin: SPRITE_LIGHTBRINGER,
  Rogue: SPRITE_SHADOWSTRIKE,
  Berserker: SPRITE_GRIMFANG,
  Cleric: SPRITE_AURELIA,
  Druid: SPRITE_VERDARA,
  Necromancer: SPRITE_MORTIMER,
  Monk: SPRITE_TENZIN,
};

export function spriteFor(args: {
  heroId?: string;
  icon?: string;
  heroClass: HeroClass;
  isPlayer: boolean;
}): SpriteDef {
  // Players: prefer per-hero sprite, fall back to class sprite.
  if (args.isPlayer && args.heroId && HERO_SPRITES[args.heroId]) {
    return HERO_SPRITES[args.heroId];
  }
  // Enemies: per-icon catalogue first, then class sprite.
  if (!args.isPlayer && args.icon && ICON_SPRITES[args.icon]) {
    return ICON_SPRITES[args.icon];
  }
  // Final fallback: class sprite.
  return CLASS_SPRITES[args.heroClass] ?? SPRITE_GENERIC;
}
