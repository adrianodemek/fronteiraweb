import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/config.js';
import { BattleGame } from '../src/core/BattleGame.js';
import { Unit } from '../src/entities/Unit.js';

function makeCanvas() {
  return {
    getContext() {
      return {};
    },
    addEventListener() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 360, height: 800 };
    },
  };
}

function pointer(x, y) {
  return {
    clientX: x,
    clientY: y,
    preventDefault() {},
  };
}

{
  const game = new BattleGame(makeCanvas());
  const first = game.cards.getCardRect(0);

  game.handlePointerDown(pointer(first.x + 10, first.y + 10));
  game.handlePointerDown(pointer(120, 430));

  assert.equal(game.units.length, 1, 'A primeira carta deve criar uma unidade.');
  assert.equal(game.units[0].type, 'rifleman', 'Fuzileiro deve criar o tipo rifleman.');
  assert.equal(game.units[0].speed, GAME_CONFIG.unitTypes.rifleman.speed);

  game.supplies.add('player', 10);
  const second = game.cards.getCardRect(1);
  game.handlePointerDown(pointer(second.x + 10, second.y + 10));
  game.handlePointerDown(pointer(145, 430));

  assert.equal(game.units.length, 2, 'A segunda carta testada deve criar outra unidade.');
  assert.equal(game.units[1].type, 'grenadier', 'Granadeiro deve criar o tipo grenadier.');
  assert.equal(game.units[1].splashRadius, GAME_CONFIG.unitTypes.grenadier.splashRadius);
}

{
  assert.ok(
    GAME_CONFIG.unitTypes.scout.speed > GAME_CONFIG.unitTypes.rifleman.speed,
    'Batedor deve ser mais rápido que o Fuzileiro.',
  );
  assert.ok(
    GAME_CONFIG.unitTypes.scout.hp < GAME_CONFIG.unitTypes.rifleman.hp,
    'Batedor deve ser mais frágil que o Fuzileiro.',
  );
  assert.ok(
    GAME_CONFIG.unitTypes.machinegun.hp > GAME_CONFIG.unitTypes.rifleman.hp,
    'Metralhador deve ser mais resistente que o Fuzileiro.',
  );
  assert.ok(
    GAME_CONFIG.unitTypes.machinegun.attackDelay < GAME_CONFIG.unitTypes.rifleman.attackDelay,
    'Metralhador deve disparar com maior cadência.',
  );
}

{
  const grenadier = new Unit({
    team: 'player',
    lane: 0,
    x: 100,
    y: 100,
    type: 'grenadier',
    stats: GAME_CONFIG.unitTypes.grenadier,
    config: GAME_CONFIG,
  });
  const enemyA = new Unit({
    team: 'enemy',
    lane: 0,
    x: 110,
    y: 100,
    type: 'rifleman',
    stats: GAME_CONFIG.unitTypes.rifleman,
    config: GAME_CONFIG,
  });
  const enemyB = new Unit({
    team: 'enemy',
    lane: 0,
    x: 122,
    y: 100,
    type: 'rifleman',
    stats: GAME_CONFIG.unitTypes.rifleman,
    config: GAME_CONFIG,
  });

  const hpA = enemyA.hp;
  const hpB = enemyB.hp;
  grenadier.update(0.04, [grenadier, enemyA, enemyB], []);

  assert.ok(enemyA.hp < hpA, 'O alvo direto do Granadeiro deve receber dano.');
  assert.ok(enemyB.hp < hpB, 'Uma segunda tropa próxima deve receber dano em área.');
}

console.log('unit-types.test.js: PASS');
