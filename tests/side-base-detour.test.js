import assert from 'node:assert/strict';
import { BattleUnit } from '../src/entities/BattleUnit.js';
import { GAME_CONFIG } from '../src/config.js';

const stats = GAME_CONFIG.infantry;

function makeBase(team, lane, x, y) {
  return {
    id: `${team}-${lane}-base-test`,
    team,
    lane,
    kind: 'base',
    x,
    y,
    hp: 99999,
    hitRadius: 22,
    get alive() {
      return this.hp > 0;
    },
    takeDamage(amount) {
      this.hp -= amount;
    },
  };
}

function makeEnemy(team, x, y) {
  return {
    team,
    x,
    y,
    radius: 7,
    hp: 99999,
    get alive() {
      return this.hp > 0;
    },
    takeDamage(amount) {
      this.hp -= amount;
    },
  };
}

function simulate(unit, units, structures, seconds, onStep) {
  const dt = 0.04;
  for (let elapsed = 0; elapsed < seconds; elapsed += dt) {
    unit.update(dt, units, structures);
    onStep?.(unit, elapsed);
  }
}

for (const lane of [0, 1]) {
  const x = GAME_CONFIG.bridges[lane];
  const base = makeBase('player', lane, x, 492);
  const enemy = makeEnemy('enemy', x, 456);
  const unit = new BattleUnit({
    team: 'player',
    lane,
    x,
    y: 526,
    stats,
    config: GAME_CONFIG,
  });

  const startY = unit.y;
  let maxLateral = 0;
  let crossedBase = false;
  let returnedBehindAfterCrossing = false;

  simulate(unit, [unit, enemy], [base], 5, (current) => {
    maxLateral = Math.max(maxLateral, Math.abs(current.x - base.x));

    if (current.y < base.y - 24) crossedBase = true;
    if (crossedBase && current.y > base.y + 8) returnedBehindAfterCrossing = true;
  });

  assert.ok(
    maxLateral >= 30,
    `Lane ${lane}: a tropa não abriu lateral suficiente para contornar a base: ${maxLateral}.`,
  );
  assert.ok(
    crossedBase,
    `Lane ${lane}: a tropa continuou presa atrás da base lateral (y inicial ${startY}, y final ${unit.y}).`,
  );
  assert.equal(
    returnedBehindAfterCrossing,
    false,
    `Lane ${lane}: a tropa ultrapassou a base, mas voltou para trás dela.`,
  );
}

for (const lane of [0, 1]) {
  const x = GAME_CONFIG.bridges[lane];
  const base = makeBase('enemy', lane, x, 186);
  const enemy = makeEnemy('player', x, 222);
  const unit = new BattleUnit({
    team: 'enemy',
    lane,
    x,
    y: 152,
    stats,
    config: GAME_CONFIG,
  });

  let maxLateral = 0;
  let crossedBase = false;

  simulate(unit, [unit, enemy], [base], 5, (current) => {
    maxLateral = Math.max(maxLateral, Math.abs(current.x - base.x));
    if (current.y > base.y + 24) crossedBase = true;
  });

  assert.ok(maxLateral >= 30, `Inimigo lane ${lane}: não abriu a rota lateral da base.`);
  assert.ok(crossedBase, `Inimigo lane ${lane}: ficou preso atrás da própria base.`);
}

console.log('side-base-detour.test.js: PASS');
