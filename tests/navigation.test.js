import assert from 'node:assert/strict';
import { Unit } from '../src/entities/Unit.js';
import { GAME_CONFIG } from '../src/config.js';

const stats = GAME_CONFIG.infantry;

function makeStructure(team, lane, x, y) {
  return {
    team,
    lane,
    x,
    y,
    kind: 'base',
    hp: 99999,
    hitRadius: 16,
    get alive() {
      return this.hp > 0;
    },
    takeDamage(amount) {
      this.hp -= amount;
    },
  };
}

function simulate(unit, units, structures, seconds) {
  const dt = 0.04;
  for (let elapsed = 0; elapsed < seconds; elapsed += dt) {
    unit.update(dt, units, structures);
  }
}

{
  const player = new Unit({
    team: 'player',
    lane: 0,
    x: 150,
    y: 450,
    stats,
    config: GAME_CONFIG,
  });
  const target = makeStructure('enemy', 0, 88, 154);

  simulate(player, [player], [target], 8);

  assert.ok(player.y < GAME_CONFIG.river.top, `Jogador não atravessou: y=${player.y}`);
  assert.ok(Math.abs(player.x - GAME_CONFIG.bridges[0]) < 3, `Jogador saiu da ponte: x=${player.x}`);
}

{
  const enemy = new Unit({
    team: 'enemy',
    lane: 1,
    x: 272,
    y: 218,
    stats,
    config: GAME_CONFIG,
  });
  const target = makeStructure('player', 1, 272, 486);

  simulate(enemy, [enemy], [target], 8);

  assert.ok(enemy.y > GAME_CONFIG.river.bottom, `Inimigo não atravessou: y=${enemy.y}`);
  assert.ok(Math.abs(enemy.x - GAME_CONFIG.bridges[1]) < 3, `Inimigo saiu da ponte: x=${enemy.x}`);
}

{
  const player = new Unit({
    team: 'player',
    lane: 0,
    x: 130,
    y: 390,
    stats,
    config: GAME_CONFIG,
  });
  const enemy = new Unit({
    team: 'enemy',
    lane: 0,
    x: 88,
    y: 278,
    stats,
    config: GAME_CONFIG,
  });
  const target = makeStructure('enemy', 0, 88, 154);

  enemy.takeDamage = () => {};

  for (let elapsed = 0; elapsed < 5; elapsed += 0.04) {
    player.update(0.04, [player, enemy], [target]);
    enemy.y += 0.18;
  }

  assert.ok(
    player.x > 66 && player.x < 110,
    `Troca de alvo tirou a unidade da ponte: x=${player.x}`,
  );
}

console.log('navigation.test.js: PASS');
