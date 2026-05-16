import { BattleUnit, BattleLogEntry, BattleResult, GridPosition } from '../types';

function distance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function findTarget(attacker: BattleUnit, allUnits: BattleUnit[]): BattleUnit | null {
  const enemies = allUnits.filter((u) => u.isPlayer !== attacker.isPlayer && u.isAlive);
  if (enemies.length === 0) return null;

  // Ranged units prefer backline (furthest from enemy front)
  if (attacker.range >= 3) {
    const sorted = [...enemies].sort((a, b) => {
      // For player attackers, enemies are on right (higher col = back)
      // For enemy attackers, player is on left (lower col = back)
      if (attacker.isPlayer) return b.position.col - a.position.col;
      return a.position.col - b.position.col;
    });
    const furthest = sorted[0];
    const dist = distance(attacker.position, furthest.position);
    if (dist <= attacker.range) return furthest;
  }

  // Default: nearest enemy
  return enemies.reduce((nearest, enemy) => {
    const d = distance(attacker.position, enemy.position);
    const nd = distance(attacker.position, nearest.position);
    return d < nd ? enemy : nearest;
  });
}

function canAttack(attacker: BattleUnit, target: BattleUnit): boolean {
  return distance(attacker.position, target.position) <= attacker.range;
}

export function computeBattle(playerUnits: BattleUnit[], enemyUnits: BattleUnit[]): BattleResult {
  const units: BattleUnit[] = [
    ...playerUnits.map((u) => ({ ...u })),
    ...enemyUnits.map((u) => ({ ...u })),
  ];

  const log: BattleLogEntry[] = [];
  let tick = 0;
  const MAX_TICKS = 200;

  while (tick < MAX_TICKS) {
    const alive = units.filter((u) => u.isAlive);
    const playerAlive = alive.filter((u) => u.isPlayer);
    const enemyAlive = alive.filter((u) => !u.isPlayer);

    if (playerAlive.length === 0 || enemyAlive.length === 0) break;

    // Decrement attack cooldowns
    for (const unit of alive) {
      unit.ticksUntilAttack = Math.max(0, unit.ticksUntilAttack - 1);
    }

    // Sort by speed descending (faster units act more often)
    const actingUnits = alive.filter((u) => u.ticksUntilAttack === 0);
    actingUnits.sort((a, b) => b.speed - a.speed);

    for (const attacker of actingUnits) {
      if (!attacker.isAlive) continue;

      const target = findTarget(attacker, units);
      if (!target) continue;

      if (!canAttack(attacker, target)) {
        // Move toward target
        const dx = Math.sign(target.position.col - attacker.position.col);
        const dy = Math.sign(target.position.row - attacker.position.row);
        if (dx !== 0) attacker.position = { ...attacker.position, col: attacker.position.col + dx };
        else if (dy !== 0) attacker.position = { ...attacker.position, row: attacker.position.row + dy };
        attacker.ticksUntilAttack = Math.max(1, 10 - attacker.speed);
        continue;
      }

      const rawDamage = Math.max(1, attacker.attack - target.defense / 2);
      const variance = 0.85 + Math.random() * 0.3;
      const damage = Math.round(rawDamage * variance);

      target.hp = Math.max(0, target.hp - damage);

      log.push({
        tick,
        text: `${attacker.name} hits ${target.name} for ${damage} damage!`,
        type: 'attack',
        attackerId: attacker.id,
        targetId: target.id,
        damage,
      });

      if (target.hp === 0) {
        target.isAlive = false;
        log.push({
          tick,
          text: `${target.name} has been defeated!`,
          type: 'death',
          targetId: target.id,
        });
      }

      attacker.ticksUntilAttack = Math.max(1, 10 - attacker.speed);
    }

    tick++;
  }

  const finalPlayerAlive = units.filter((u) => u.isPlayer && u.isAlive);
  const won = finalPlayerAlive.length > 0;

  log.push({
    tick,
    text: won ? 'Victory! Your heroes prevail!' : 'Defeat! Better luck next time.',
    type: won ? 'victory' : 'defeat',
  });

  return {
    won,
    log,
    survivingPlayerUnits: finalPlayerAlive.map((u) => u.heroId),
    goldEarned: 0,
    expEarned: 0,
  };
}

export function buildPlayerUnit(
  heroId: string,
  name: string,
  heroClass: string,
  hp: number,
  attack: number,
  defense: number,
  speed: number,
  range: number,
  position: GridPosition,
  icon: string
): BattleUnit {
  return {
    id: `player_${heroId}_${Date.now()}_${Math.random()}`,
    heroId,
    name,
    heroClass: heroClass as BattleUnit['heroClass'],
    hp,
    maxHp: hp,
    attack,
    defense,
    speed,
    range,
    position,
    isPlayer: true,
    isAlive: true,
    ticksUntilAttack: 0,
    icon,
  };
}

export function buildEnemyUnit(
  name: string,
  heroClass: string,
  level: number,
  position: GridPosition,
  icon: string,
  index: number
): BattleUnit {
  const scaledHp = 80 + level * 40;
  const scaledAtk = 15 + level * 8;
  const scaledDef = 5 + level * 3;
  const rangeMap: Record<string, number> = {
    Archer: 3,
    Mage: 4,
    Warrior: 1,
    Paladin: 1,
    Rogue: 1,
    Berserker: 1,
  };

  return {
    id: `enemy_${index}_${Date.now()}`,
    heroId: `enemy_${index}`,
    name,
    heroClass: heroClass as BattleUnit['heroClass'],
    hp: scaledHp,
    maxHp: scaledHp,
    attack: scaledAtk,
    defense: scaledDef,
    speed: 3,
    range: rangeMap[heroClass] ?? 1,
    position,
    isPlayer: false,
    isAlive: true,
    ticksUntilAttack: 0,
    icon,
  };
}
