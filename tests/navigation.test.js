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

  assert.ok(player.crossedRiver, `Jogador não marcou travessia concluída: y=${player.y}`);
  assert.ok(player.y <= GAME_CONFIG.river.top - 12, `Jogador não entrou no campo inimigo: y=${player.y}`);
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

  assert.ok(enemy.crossedRiver, `Inimigo não marcou travessia concluída: y=${enemy.y}`);
  assert.ok(enemy.y >= GAME_CONFIG.river.bottom + 12, `Inimigo não entrou no campo do jogador: y=${enemy.y}`);
  assert.ok(Math.abs(enemy.x - GAME_CONFIG.bridges[1]) < 3, `Inimigo saiu da ponte: x=${enemy.x}`);
}

{
  // Reproduz o bug visto no celular: a tropa detecta um inimigo perto da
  // saída da ponte. Mesmo que ele esteja dentro do alcance de ataque, a
  // travessia precisa terminar antes do combate.
  const player = new Unit({
    team: 'player',
    lane: 0,
    x: 88,
    y: 352,
    stats,
    config: GAME_CONFIG,
  });
  const enemyNearExit = new Unit({
    team: 'enemy',
    lane: 0,
    x: 88,
    y: 286,
    stats,
    config: GAME_CONFIG,
  });
  const target = makeStructure('enemy', 0, 88, 154);

  enemyNearExit.takeDamage = () => {};

  simulate(player, [player, enemyNearExit], [target], 4);

  assert.ok(player.crossedRiver, `Combate interrompeu a travessia: y=${player.y}`);
  assert.ok(
    player.y <= GAME_CONFIG.river.top - 12,
    `Jogador ficou preso na saída da ponte: y=${player.y}`,
  );
}

console.log('navigation.test.js: PASS');
