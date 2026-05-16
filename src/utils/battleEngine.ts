import {
  BattleUnit, BattleLogEntry, BattleResult, BattleEvent,
  GridPosition, Element, StatusEffectType, ActiveStatusEffect, AbilityDef,
} from '../types';
import { ABILITIES, CLASS_DEFAULT_ABILITY } from '../data/abilities';

const MAX_TICKS = 400;
const GRID_COLS = 10;

// ============================================================
// Helpers
// ============================================================
function distance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function chebyshev(a: GridPosition, b: GridPosition): number {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

function isStunned(u: BattleUnit): boolean {
  return u.statuses.some((s) => s.type === 'stun' || s.type === 'freeze');
}

function isSilenced(u: BattleUnit): boolean {
  return u.statuses.some((s) => s.type === 'silence');
}

function hasTaunt(u: BattleUnit): boolean {
  return u.statuses.some((s) => s.type === 'taunt');
}

function applyResistance(damage: number, target: BattleUnit, element: Element): number {
  const res = target.resistance[element] ?? 0;
  return Math.max(1, damage * (1 - res));
}

function findEnemies(attacker: BattleUnit, all: BattleUnit[]): BattleUnit[] {
  return all.filter((u) => u.isPlayer !== attacker.isPlayer && u.isAlive);
}

function findAllies(unit: BattleUnit, all: BattleUnit[]): BattleUnit[] {
  return all.filter((u) => u.isPlayer === unit.isPlayer && u.isAlive);
}

// Pick a target based on AI: ranged → backline; melee → nearest with taunt priority.
function pickTarget(attacker: BattleUnit, all: BattleUnit[]): BattleUnit | null {
  const enemies = findEnemies(attacker, all);
  if (enemies.length === 0) return null;

  const tauntingEnemies = enemies.filter(hasTaunt);
  if (tauntingEnemies.length > 0) {
    return tauntingEnemies.reduce((best, e) =>
      distance(attacker.position, e.position) < distance(attacker.position, best.position) ? e : best
    );
  }

  // Ranged: prefer backline (highest col for enemies of player; lowest col for player from enemy POV).
  if (attacker.range >= 3) {
    const sorted = [...enemies].sort((a, b) =>
      attacker.isPlayer ? b.position.col - a.position.col : a.position.col - b.position.col
    );
    for (const candidate of sorted) {
      if (distance(attacker.position, candidate.position) <= attacker.range) return candidate;
    }
  }

  // Default: nearest.
  return enemies.reduce((nearest, e) =>
    distance(attacker.position, e.position) < distance(attacker.position, nearest.position) ? e : nearest
  );
}

function findEmptyCell(all: BattleUnit[], near: GridPosition, isPlayerSide: boolean): GridPosition | null {
  // For shadow strike teleport behind enemy.
  const targetCol = isPlayerSide ? Math.min(GRID_COLS - 1, near.col + 1) : Math.max(0, near.col - 1);
  for (let row = 0; row < 3; row++) {
    const candidate = { col: targetCol, row };
    const occupied = all.some((u) => u.isAlive && u.position.col === candidate.col && u.position.row === candidate.row);
    if (!occupied) return candidate;
  }
  return null;
}

// ============================================================
// Damage application
// ============================================================
function applyDamage(
  target: BattleUnit, raw: number, element: Element, attacker: BattleUnit | null,
  events: BattleEvent[], log: BattleLogEntry[], tick: number,
  options?: { isCrit?: boolean; bypassDodge?: boolean; isAbility?: boolean }
) {
  // Dodge
  if (!options?.bypassDodge && Math.random() < target.dodge) {
    events.push({ tick, kind: 'dodge', sourceId: attacker?.id, targetId: target.id });
    log.push({
      tick, type: 'dodge',
      text: `${target.name} dodges ${attacker?.name ?? 'an attack'}!`,
      attackerId: attacker?.id, targetId: target.id,
    });
    return 0;
  }

  let dmg = applyResistance(raw, target, element);

  // Shield absorbs first
  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, dmg);
    target.shield -= absorbed;
    dmg -= absorbed;
    if (absorbed > 0) {
      events.push({ tick, kind: 'shield', targetId: target.id, value: absorbed });
    }
  }

  if (dmg > 0) {
    dmg = Math.round(dmg);
    target.hp = Math.max(0, target.hp - dmg);
    target.damageTaken += dmg;
    if (attacker) attacker.damageDealt += dmg;

    events.push({
      tick, kind: 'damage',
      sourceId: attacker?.id, targetId: target.id, value: dmg, element,
    });

    if (options?.isCrit) {
      events.push({ tick, kind: 'crit', sourceId: attacker?.id, targetId: target.id, value: dmg });
      log.push({
        tick, type: 'crit',
        text: `💥 CRITICAL! ${attacker?.name} smashes ${target.name} for ${dmg}!`,
        attackerId: attacker?.id, targetId: target.id, damage: dmg, element,
      });
    } else if (!options?.isAbility) {
      log.push({
        tick, type: 'attack',
        text: `${attacker?.name ?? 'Something'} hits ${target.name} for ${dmg}.`,
        attackerId: attacker?.id, targetId: target.id, damage: dmg, element,
      });
    }
  }

  if (target.hp === 0 && target.isAlive) {
    target.isAlive = false;
    if (attacker) attacker.killCount++;
    events.push({ tick, kind: 'death', targetId: target.id });
    log.push({
      tick, type: 'death',
      text: `${target.name} has fallen!`,
      targetId: target.id,
    });
  }

  return dmg;
}

function applyHeal(
  target: BattleUnit, amount: number, healer: BattleUnit | null,
  events: BattleEvent[], log: BattleLogEntry[], tick: number
) {
  if (!target.isAlive) return 0;
  amount = Math.round(amount);
  const beforeHp = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + amount);
  const actual = target.hp - beforeHp;
  if (actual > 0) {
    if (healer) healer.healingDone += actual;
    events.push({ tick, kind: 'heal', sourceId: healer?.id, targetId: target.id, value: actual });
    log.push({
      tick, type: 'heal',
      text: `${healer?.name ?? 'Magic'} heals ${target.name} for ${actual}.`,
      attackerId: healer?.id, targetId: target.id, heal: actual,
    });
  }
  return actual;
}

function applyStatus(
  target: BattleUnit, type: StatusEffectType, duration: number, power: number,
  source: BattleUnit | null, events: BattleEvent[], log: BattleLogEntry[], tick: number
) {
  // Refresh existing status of same type (max duration & power).
  const existing = target.statuses.find((s) => s.type === type);
  if (existing) {
    existing.ticksRemaining = Math.max(existing.ticksRemaining, duration);
    existing.power = Math.max(existing.power, power);
  } else {
    target.statuses.push({ type, ticksRemaining: duration, power, sourceId: source?.id });
  }
  if (type === 'shield') {
    target.shield = Math.max(target.shield, power);
  }
  events.push({ tick, kind: 'status_apply', sourceId: source?.id, targetId: target.id, status: type, value: power });
  log.push({
    tick, type: 'status',
    text: `${target.name} is afflicted with ${type.toUpperCase()} (${duration}t)!`,
    targetId: target.id, attackerId: source?.id,
  });
}

// ============================================================
// Ability execution
// ============================================================
function executeAbility(
  caster: BattleUnit, ability: AbilityDef, all: BattleUnit[],
  events: BattleEvent[], log: BattleLogEntry[], tick: number
) {
  caster.mana -= ability.manaCost;
  caster.ticksUntilAbility = ability.cooldownTicks;
  events.push({ tick, kind: 'ability', sourceId: caster.id, text: ability.name });
  log.push({
    tick, type: 'ability',
    text: `✦ ${caster.name} casts ${ability.name}!`,
    attackerId: caster.id, element: ability.element,
  });

  const { data } = ability;
  const power = data.power ?? 1;
  const enemies = findEnemies(caster, all);
  const allies = findAllies(caster, all);

  switch (ability.kind) {
    case 'aoe': {
      const primary = pickTarget(caster, all);
      if (!primary) break;
      const radius = data.radius ?? 1;
      const targets = enemies.filter((e) => chebyshev(e.position, primary.position) <= radius);
      for (const tgt of targets) {
        const dmg = caster.attack * power;
        applyDamage(tgt, dmg, ability.element, caster, events, log, tick, { isAbility: true });
        if (data.status && data.duration && data.status !== 'taunt') {
          applyStatus(tgt, data.status, data.duration, data.statusPower ?? 1, caster, events, log, tick);
        }
      }
      // Self-applied auras (e.g. Warrior taunts himself to draw fire after a whirlwind).
      if (data.status === 'taunt' && data.duration) {
        applyStatus(caster, 'taunt', data.duration, data.statusPower ?? 1, caster, events, log, tick);
      }
      break;
    }
    case 'multistrike': {
      const target = pickTarget(caster, all);
      if (!target) break;
      const hits = data.targets ?? 2;
      for (let i = 0; i < hits; i++) {
        if (!target.isAlive) break;
        const isCrit = Math.random() < caster.critRate;
        const dmg = caster.attack * power * (isCrit ? caster.critDamage : 1);
        applyDamage(target, dmg, ability.element, caster, events, log, tick, { isCrit, isAbility: true });
      }
      if (data.selfBuff && data.duration) {
        // We model temporary buffs by stat patching + an 'rage' status to count down.
        const buff = data.selfBuff;
        if (buff.attack) caster.attack += buff.attack;
        if (buff.defense) caster.defense += buff.defense;
        if (buff.speed) caster.speed += buff.speed;
        if (buff.critRate) caster.critRate += buff.critRate;
        caster.statuses.push({
          type: 'rage',
          ticksRemaining: data.duration,
          power: 0,
        });
      }
      break;
    }
    case 'heal': {
      if ((data.radius ?? 0) >= 99) {
        // Mass heal
        for (const ally of allies) {
          applyHeal(ally, caster.attack * power, caster, events, log, tick);
          // Cleanse harmful
          ally.statuses = ally.statuses.filter((s) =>
            !['poison', 'burn', 'bleed', 'slow', 'blind', 'silence'].includes(s.type)
          );
        }
      } else {
        const lowest = allies.reduce((min, a) => (a.hp / a.maxHp < min.hp / min.maxHp ? a : min), allies[0]);
        if (lowest) {
          applyHeal(lowest, caster.attack * power, caster, events, log, tick);
          if (data.status && data.duration) {
            applyStatus(lowest, data.status, data.duration, data.statusPower ?? 1, caster, events, log, tick);
          }
        }
      }
      break;
    }
    case 'execute': {
      // Shadow strike: teleport and crit.
      const target = pickTarget(caster, all);
      if (!target) break;
      const teleport = findEmptyCell(all, target.position, caster.isPlayer);
      if (teleport) {
        events.push({ tick, kind: 'move', sourceId: caster.id, fromPosition: caster.position, toPosition: teleport });
        caster.position = teleport;
      }
      const dmg = caster.attack * power * caster.critDamage;
      applyDamage(target, dmg, ability.element, caster, events, log, tick, { isCrit: true, isAbility: true });
      break;
    }
    case 'lifesteal': {
      const target = pickTarget(caster, all);
      if (!target) break;
      const dmg = caster.attack * power;
      const dealt = applyDamage(target, dmg, ability.element, caster, events, log, tick, { isAbility: true });
      if (dealt > 0) {
        applyHeal(caster, dealt, caster, events, log, tick);
      }
      break;
    }
    case 'chain': {
      const targets = data.targets ?? 3;
      // Pick N nearest enemies.
      const sorted = [...enemies].sort((a, b) =>
        distance(caster.position, a.position) - distance(caster.position, b.position)
      ).slice(0, targets);
      for (const tgt of sorted) {
        const dmg = caster.attack * power;
        applyDamage(tgt, dmg, ability.element, caster, events, log, tick, { isAbility: true });
        if (data.status && data.duration) {
          applyStatus(tgt, data.status, data.duration, data.statusPower ?? 1, caster, events, log, tick);
        }
      }
      break;
    }
    case 'taunt': {
      for (const e of enemies) {
        applyStatus(e, 'taunt', data.duration ?? 4, 1, caster, events, log, tick);
      }
      break;
    }
    case 'dot': {
      const target = pickTarget(caster, all);
      if (target && data.status && data.duration) {
        applyStatus(target, data.status, data.duration, data.statusPower ?? 1, caster, events, log, tick);
      }
      break;
    }
    case 'buff': {
      // Use as fallback
      break;
    }
  }
}

// ============================================================
// Status tick processing
// ============================================================
function processStatusTick(
  unit: BattleUnit, events: BattleEvent[], log: BattleLogEntry[], tick: number
) {
  if (!unit.isAlive) return;

  const newStatuses: ActiveStatusEffect[] = [];
  for (const s of unit.statuses) {
    // Apply tick effects
    switch (s.type) {
      case 'poison':
      case 'burn':
      case 'bleed': {
        const dmg = s.power;
        const elementForType: Record<string, Element> = {
          poison: 'nature', burn: 'fire', bleed: 'physical',
        };
        applyDamage(unit, dmg, elementForType[s.type], null, events, log, tick, { bypassDodge: true, isAbility: true });
        events.push({ tick, kind: 'status_tick', targetId: unit.id, status: s.type, value: dmg });
        break;
      }
      case 'regen': {
        applyHeal(unit, s.power, null, events, log, tick);
        break;
      }
    }

    s.ticksRemaining--;
    if (s.ticksRemaining > 0 && unit.isAlive) {
      newStatuses.push(s);
    } else {
      events.push({ tick, kind: 'status_expire', targetId: unit.id, status: s.type });
      // If rage expires, we don't roll back buffs (kept simple). Acceptable.
    }
  }
  unit.statuses = newStatuses;
}

// ============================================================
// Main battle loop
// ============================================================
export function computeBattle(playerUnits: BattleUnit[], enemyUnits: BattleUnit[]): BattleResult {
  const units: BattleUnit[] = [
    ...playerUnits.map(cloneUnit),
    ...enemyUnits.map(cloneUnit),
  ];

  const log: BattleLogEntry[] = [];
  const events: BattleEvent[] = [];
  let tick = 0;

  while (tick < MAX_TICKS) {
    const alive = units.filter((u) => u.isAlive);
    const playerAlive = alive.filter((u) => u.isPlayer);
    const enemyAlive = alive.filter((u) => !u.isPlayer);
    if (playerAlive.length === 0 || enemyAlive.length === 0) break;

    // 1) Status ticks
    for (const u of alive) processStatusTick(u, events, log, tick);

    // 2) Recompute alive after DoTs
    const alive2 = units.filter((u) => u.isAlive);

    // 3) Tick down cooldowns & regen mana
    for (const u of alive2) {
      u.ticksUntilAttack = Math.max(0, u.ticksUntilAttack - 1);
      u.ticksUntilAbility = Math.max(0, u.ticksUntilAbility - 1);
      u.mana = Math.min(u.maxMana, u.mana + u.manaRegen);
    }

    // 4) Acting units (not stunned/frozen)
    const acting = alive2.filter((u) => !isStunned(u));
    acting.sort((a, b) => b.speed - a.speed);

    for (const attacker of acting) {
      if (!attacker.isAlive) continue;

      // Try ability first
      if (
        attacker.abilityId &&
        attacker.ticksUntilAbility === 0 &&
        attacker.mana >= (ABILITIES[attacker.abilityId]?.manaCost ?? 0) &&
        !isSilenced(attacker)
      ) {
        const ability = ABILITIES[attacker.abilityId];
        if (ability) {
          executeAbility(attacker, ability, units, events, log, tick);
          attacker.ticksUntilAttack = Math.max(2, 10 - attacker.speed);
          continue;
        }
      }

      if (attacker.ticksUntilAttack > 0) continue;

      const target = pickTarget(attacker, units);
      if (!target) continue;

      const dist = distance(attacker.position, target.position);
      if (dist > attacker.range) {
        // Move toward target
        const dx = Math.sign(target.position.col - attacker.position.col);
        const dy = Math.sign(target.position.row - attacker.position.row);
        const before = attacker.position;
        let after = { ...before };
        if (dx !== 0) after = { ...before, col: before.col + dx };
        else if (dy !== 0) after = { ...before, row: before.row + dy };
        // Avoid collisions
        const collision = units.some((u) => u !== attacker && u.isAlive && u.position.col === after.col && u.position.row === after.row);
        if (!collision) {
          attacker.position = after;
          events.push({ tick, kind: 'move', sourceId: attacker.id, fromPosition: before, toPosition: after });
        }
        attacker.ticksUntilAttack = Math.max(1, 10 - attacker.speed);
        continue;
      }

      // Attack: roll crit + variance
      const isCrit = Math.random() < attacker.critRate;
      const variance = 0.9 + Math.random() * 0.2;
      const baseDmg = Math.max(1, attacker.attack - target.defense * 0.4);
      const dmg = baseDmg * variance * (isCrit ? attacker.critDamage : 1);

      // Projectile event for ranged
      if (attacker.range >= 2) {
        events.push({
          tick, kind: 'projectile',
          sourceId: attacker.id, targetId: target.id,
          element: attacker.element,
        });
      } else {
        events.push({ tick, kind: 'attack', sourceId: attacker.id, targetId: target.id });
      }

      applyDamage(target, dmg, attacker.element, attacker, events, log, tick, { isCrit });

      // Class passives on basic attack
      if (attacker.heroClass === 'Mage' && attacker.element === 'fire') {
        applyStatus(target, 'burn', 4, 5, attacker, events, log, tick);
      } else if (attacker.heroClass === 'Mage' && attacker.element === 'ice') {
        applyStatus(target, 'slow', 2, 1, attacker, events, log, tick);
      }

      attacker.ticksUntilAttack = Math.max(1, 10 - attacker.speed);
    }

    tick++;
  }

  const finalPlayerAlive = units.filter((u) => u.isPlayer && u.isAlive);
  const won = finalPlayerAlive.length > 0 && units.some((u) => !u.isPlayer && !u.isAlive);
  const allEnemiesDead = units.filter((u) => !u.isPlayer).every((u) => !u.isAlive);
  const truelyWon = allEnemiesDead && finalPlayerAlive.length > 0;

  events.push({ tick, kind: truelyWon ? 'victory' : 'defeat' });
  log.push({
    tick,
    text: truelyWon ? 'Victory! Your heroes prevail!' : 'Defeat! Your heroes have fallen.',
    type: truelyWon ? 'victory' : 'defeat',
  });

  return {
    won: truelyWon,
    log,
    events,
    finalUnits: units,
    survivingPlayerUnits: finalPlayerAlive.map((u) => u.heroId),
    goldEarned: 0,
    expEarned: 0,
    totalTicks: tick,
  };
}

function cloneUnit(u: BattleUnit): BattleUnit {
  return {
    ...u,
    statuses: u.statuses.map((s) => ({ ...s })),
    resistance: { ...u.resistance },
    position: { ...u.position },
  };
}

// ============================================================
// Unit construction
// ============================================================
export function buildPlayerUnit(args: {
  heroId: string; name: string; heroClass: string;
  maxHp: number; attack: number; defense: number; speed: number; range: number;
  critRate: number; critDamage: number; dodge: number;
  maxMana: number; manaRegen: number;
  element: Element; resistance: Partial<Record<Element, number>>;
  abilityId?: string;
  position: GridPosition; icon: string; portraitSeed: number; stars: number;
}): BattleUnit {
  return {
    id: `player_${args.heroId}_${Date.now()}_${Math.random()}`,
    heroId: args.heroId,
    name: args.name,
    heroClass: args.heroClass as BattleUnit['heroClass'],
    hp: args.maxHp,
    maxHp: args.maxHp,
    attack: args.attack,
    defense: args.defense,
    speed: args.speed,
    range: args.range,
    critRate: args.critRate,
    critDamage: args.critDamage,
    dodge: args.dodge,
    mana: Math.floor(args.maxMana * 0.3),
    maxMana: args.maxMana,
    manaRegen: args.manaRegen,
    element: args.element,
    resistance: args.resistance,
    position: args.position,
    isPlayer: true,
    isAlive: true,
    ticksUntilAttack: 0,
    ticksUntilAbility: 4,
    icon: args.icon,
    portraitSeed: args.portraitSeed,
    abilityId: args.abilityId,
    statuses: [],
    shield: 0,
    damageDealt: 0,
    damageTaken: 0,
    healingDone: 0,
    killCount: 0,
    stars: args.stars,
  };
}

export function buildEnemyUnit(args: {
  name: string; heroClass: string; level: number;
  position: GridPosition; icon: string; index: number;
  element?: Element; stars?: number; abilityId?: string;
}): BattleUnit {
  const { name, heroClass, level, position, icon, index } = args;
  const stars = args.stars ?? 0;
  const tierMul = 1 + stars * 0.4;
  const scaledHp = Math.round((80 + level * 50) * tierMul);
  const scaledAtk = Math.round((14 + level * 7) * tierMul);
  const scaledDef = Math.round((5 + level * 3) * tierMul);
  const rangeMap: Record<string, number> = {
    Archer: 3, Mage: 4, Cleric: 3, Druid: 3, Necromancer: 4,
    Warrior: 1, Paladin: 1, Rogue: 1, Berserker: 1, Monk: 1,
  };
  const element = (args.element ?? 'physical') as Element;
  const seed = Math.abs(name.split('').reduce((s, c) => s * 31 + c.charCodeAt(0), 7) + index * 13);
  const ability = args.abilityId ?? CLASS_DEFAULT_ABILITY[heroClass];
  return {
    id: `enemy_${index}_${Date.now()}`,
    heroId: `enemy_${index}`,
    name,
    heroClass: heroClass as BattleUnit['heroClass'],
    hp: scaledHp,
    maxHp: scaledHp,
    attack: scaledAtk,
    defense: scaledDef,
    speed: 3 + (heroClass === 'Rogue' || heroClass === 'Monk' ? 2 : 0),
    range: rangeMap[heroClass] ?? 1,
    critRate: heroClass === 'Rogue' ? 0.2 : 0.05,
    critDamage: heroClass === 'Rogue' ? 1.8 : 1.5,
    dodge: heroClass === 'Rogue' ? 0.15 : heroClass === 'Monk' ? 0.18 : 0.04,
    mana: 0,
    maxMana: 100,
    manaRegen: 5,
    element,
    resistance: {},
    position,
    isPlayer: false,
    isAlive: true,
    ticksUntilAttack: 1,
    ticksUntilAbility: 6 + index,
    icon,
    portraitSeed: seed,
    abilityId: ability,
    statuses: [],
    shield: 0,
    damageDealt: 0,
    damageTaken: 0,
    healingDone: 0,
    killCount: 0,
    stars,
  };
}

// ============================================================
// Power score / team analysis helpers
// ============================================================
export function unitPower(u: { maxHp: number; attack: number; defense: number; speed: number }): number {
  return Math.round(u.maxHp * 0.4 + u.attack * 4 + u.defense * 3 + u.speed * 4);
}
