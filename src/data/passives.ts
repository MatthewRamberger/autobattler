import { BattleUnit, BattleEvent, BattleLogEntry } from '../types';

// Damage-modifier context used by passives that alter damage values.
export interface DmgContext {
  raw: number;          // computed damage before passives modify it
  isCrit: boolean;
  isAbility: boolean;
}

export interface PassiveHooks {
  onTickStart?: (unit: BattleUnit, all: BattleUnit[], events: BattleEvent[], log: BattleLogEntry[], tick: number) => void;
  onAllyDeath?: (unit: BattleUnit, deadAlly: BattleUnit) => void;
  modifyOutgoing?: (attacker: BattleUnit, target: BattleUnit, ctx: DmgContext) => void;
  modifyIncoming?: (target: BattleUnit, attacker: BattleUnit | null, ctx: DmgContext) => void;
  onDamageDealt?: (attacker: BattleUnit, target: BattleUnit, dmg: number, all: BattleUnit[], events: BattleEvent[], log: BattleLogEntry[], tick: number) => void;
  onWouldDie?: (unit: BattleUnit, all: BattleUnit[], events: BattleEvent[], log: BattleLogEntry[], tick: number) => boolean; // return true to cancel death
  onTurnStart?: (unit: BattleUnit) => void;  // mutates derived stats per action
}

// Tiny helpers used by multiple passives
function lowestHpAlly(unit: BattleUnit, all: BattleUnit[]): BattleUnit | null {
  const allies = all.filter((u) => u.isPlayer === unit.isPlayer && u.isAlive && u.id !== unit.id);
  if (allies.length === 0) return null;
  return allies.reduce((min, a) => (a.hp / a.maxHp < min.hp / min.maxHp ? a : min));
}

function distance(a: BattleUnit, b: BattleUnit): number {
  return Math.max(Math.abs(a.position.col - b.position.col), Math.abs(a.position.row - b.position.row));
}

// Passive registry keyed by hero id (and reused for some enemy ids too).
export const PASSIVES: Record<string, PassiveHooks> = {
  // Warrior Ironwall — +2 defense per fallen ally.
  warrior_1: {
    onAllyDeath: (unit) => {
      unit.defense += 2;
    },
  },

  // Doomplate — incoming damage capped at 15% maxHP.
  warrior_2: {
    modifyIncoming: (target, _atk, ctx) => {
      const cap = Math.round(target.maxHp * 0.15);
      if (ctx.raw > cap) ctx.raw = cap;
    },
  },

  // Archer Swiftshot — +25% damage to backline (col >= 7 for player, col <= 2 for enemy POV).
  archer_1: {
    modifyOutgoing: (atk, tgt, ctx) => {
      const backline = atk.isPlayer ? tgt.position.col >= 7 : tgt.position.col <= 2;
      if (backline) ctx.raw *= 1.25;
    },
  },

  // Rogue Shadowstrike — +50% crit damage vs backline.
  rogue_1: {
    modifyOutgoing: (atk, tgt, ctx) => {
      const backline = atk.isPlayer ? tgt.position.col >= 7 : tgt.position.col <= 2;
      if (backline && ctx.isCrit) ctx.raw *= 1.5;
    },
  },

  // Paladin Lightbringer — allies regen 2 HP/tick.
  paladin_1: {
    onTickStart: (unit, all, events, log, tick) => {
      const allies = all.filter((u) => u.isPlayer === unit.isPlayer && u.isAlive);
      for (const a of allies) {
        if (a.hp < a.maxHp) {
          const heal = 2;
          a.hp = Math.min(a.maxHp, a.hp + heal);
          unit.healingDone += heal;
        }
      }
    },
  },

  // Berserker Grimfang — +1% attack per 1% missing HP (snapshot per attack).
  berserker_1: {
    onTurnStart: (unit) => {
      const missing = 1 - unit.hp / unit.maxHp;
      // Reset attack each turn; but we don't have a clean "base" stored.
      // Cheap version: temporary boost expressed via a status-like flag.
      // We use the unit.shield? No. Simplest: temporary buff applied within the action by
      // appending a multiplier. We hack: store on a custom field.
      (unit as any)._rageMul = 1 + missing;
    },
    modifyOutgoing: (atk, _tgt, ctx) => {
      const m = (atk as any)._rageMul as number | undefined;
      if (m) ctx.raw *= m;
    },
  },

  // Monk Tenzin — +5% dodge per 25% missing HP.
  monk_1: {
    onTurnStart: (unit) => {
      const missing = 1 - unit.hp / unit.maxHp;
      const bonus = Math.floor(missing / 0.25) * 0.05;
      (unit as any)._dodgeBonus = bonus;
    },
    modifyIncoming: (target, _atk, _ctx) => {
      // The engine's dodge check uses target.dodge directly; bump it temporarily.
      const b = (target as any)._dodgeBonus as number | undefined;
      if (b) target.dodge = Math.min(0.75, target.dodge + b);
    },
  },

  // Necromancer Mortimer — 20% lifesteal.
  necro_1: {
    onDamageDealt: (atk, _tgt, dmg) => {
      const heal = Math.round(dmg * 0.2);
      if (heal > 0) {
        atk.hp = Math.min(atk.maxHp, atk.hp + heal);
        atk.healingDone += heal;
      }
    },
  },

  // Druid Verdara — revives once per battle at 30% HP.
  druid_1: {
    onWouldDie: (unit, _all, events, log, tick) => {
      if ((unit as any)._revivedThisBattle) return false;
      (unit as any)._revivedThisBattle = true;
      unit.hp = Math.round(unit.maxHp * 0.3);
      unit.isAlive = true;
      log.push({
        tick,
        type: 'status',
        text: `🌿 ${unit.name} regrows from the earth!`,
        targetId: unit.id,
      });
      events.push({ tick, kind: 'status_apply', targetId: unit.id, status: 'regen', value: unit.hp });
      return true;
    },
  },

  // Cleric Aurelia — heals lowest-HP ally for 3% maxHP per tick.
  cleric_1: {
    onTickStart: (unit, all, events, log, tick) => {
      const ally = lowestHpAlly(unit, all);
      if (ally && ally.hp < ally.maxHp) {
        const heal = Math.round(ally.maxHp * 0.03);
        ally.hp = Math.min(ally.maxHp, ally.hp + heal);
        unit.healingDone += heal;
      }
    },
  },

  // Paladin Sunhammer — damage dealt heals nearby allies for 25%.
  paladin_2: {
    onDamageDealt: (atk, _tgt, dmg, all) => {
      const heal = Math.round(dmg * 0.25);
      const nearby = all.filter(
        (u) => u.isPlayer === atk.isPlayer && u.isAlive && u.id !== atk.id && distance(u, atk) <= 2
      );
      for (const a of nearby) {
        a.hp = Math.min(a.maxHp, a.hp + heal);
        atk.healingDone += heal;
      }
    },
  },

  // Frostweaver — already handled by class+element check in engine.
  mage_2: {},

  // Emberlash — already handled by class+element check in engine.
  mage_1: {},

  // Stormcaller — basic attacks splash 30% lightning to nearby enemies.
  archer_2: {
    onDamageDealt: (atk, tgt, dmg, all, events, log, tick) => {
      // Avoid recursion: only on direct hits where dmg matches roughly.
      if ((atk as any)._splashing) return;
      const nearby = all.filter(
        (u) => !u.isAlive ? false : u.isPlayer !== atk.isPlayer && u.id !== tgt.id && distance(u, tgt) <= 1
      );
      if (nearby.length === 0) return;
      (atk as any)._splashing = true;
      for (const n of nearby) {
        const splash = Math.max(1, Math.round(dmg * 0.3));
        n.hp = Math.max(0, n.hp - splash);
        atk.damageDealt += splash;
        events.push({ tick, kind: 'damage', sourceId: atk.id, targetId: n.id, value: splash, element: 'lightning' });
        if (n.hp === 0 && n.isAlive) {
          n.isAlive = false;
          atk.killCount++;
          events.push({ tick, kind: 'death', targetId: n.id });
          log.push({ tick, type: 'death', text: `${n.name} is electrocuted!`, targetId: n.id });
        }
      }
      (atk as any)._splashing = false;
    },
  },

  // Nightveil — one-shot 30% dodge buff after surviving lethal damage.
  rogue_2: {
    onWouldDie: (unit, _all, events, log, tick) => {
      if ((unit as any)._vanished) return false;
      (unit as any)._vanished = true;
      unit.hp = Math.max(1, Math.round(unit.maxHp * 0.15));
      unit.isAlive = true;
      unit.dodge = Math.min(0.85, unit.dodge + 0.3);
      log.push({
        tick, type: 'status',
        text: `🌫 ${unit.name} vanishes from sight!`,
        targetId: unit.id,
      });
      events.push({ tick, kind: 'status_apply', targetId: unit.id, status: 'shield', value: unit.hp });
      return true;
    },
  },

  // Bloodforge — kills restore 15% maxHP and grant +5 attack permanently.
  berserker_2: {
    onDamageDealt: (atk, tgt) => {
      if (tgt.hp === 0 && !tgt.isAlive) {
        atk.hp = Math.min(atk.maxHp, atk.hp + Math.round(atk.maxHp * 0.15));
        atk.attack += 5;
      }
    },
  },

  // Solaris — overflow healing becomes a shield for the ally.
  // Implemented by patching applyHeal via a hook approach won't work without
  // refactor; instead we mimic it via onTickStart: if any allies near max HP
  // and Solaris recently healed, grant a tiny shield each tick.
  cleric_2: {
    onTickStart: (unit, all) => {
      const allies = all.filter((u) => u.isPlayer === unit.isPlayer && u.isAlive && u.id !== unit.id);
      for (const a of allies) {
        if (a.hp >= a.maxHp - 1 && a.shield < a.maxHp * 0.4) {
          a.shield = Math.min(a.maxHp * 0.4, a.shield + 4);
        }
      }
    },
  },
};

export function getPassive(heroId: string | undefined): PassiveHooks | null {
  if (!heroId) return null;
  return PASSIVES[heroId] ?? null;
}
