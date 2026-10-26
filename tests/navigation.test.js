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
    hitRadius: 22,
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

{
  const player = new Unit({
    team: 'player', lane: 0, x: 150, y: 450, stats, config: GAME_CONFIG,
  });
  const target = makeStructure('enemy', 0, GAME_CONFIG.bridges[0], 186);
  let enteredWater = false;

  simulate(player, [player], [target], 9, (unit) => {
    const insideRiver = unit.y >= GAME_CONFIG.river.top && unit.y <= GAME_CONFIG.river.bottom;
    if (insideRiver && !unit.isInsideBridge(unit.x)) enteredWater = true;
  });

  assert.equal(enteredWater, false, 'Jogador entrou na água fora da ponte.');
  assert.ok(player.y < GAME_CONFIG.river.top, `Jogador não chegou ao campo inimigo: y=${player.y}`);
}

{
  const enemy = new Unit({
    team: 'enemy', lane: 1, x: 240, y: 218, stats, config: GAME_CONFIG,
  });
  const target = makeStructure('player', 1, GAME_CONFIG.bridges[1], 492);
  let enteredWater = false;

  simulate(enemy, [enemy], [target], 9, (unit) => {
    const insideRiver = unit.y >= GAME_CONFIG.river.top && unit.y <= GAME_CONFIG.river.bottom;
    if (insideRiver && !unit.isInsideBridge(unit.x)) enteredWater = true;
  });

  assert.equal(enteredWater, false, 'Inimigo entrou na água fora da ponte.');
  assert.ok(enemy.y > GAME_CONFIG.river.bottom, `Inimigo não chegou ao campo do jogador: y=${enemy.y}`);
}

{
  // A ponte é terreno normal: a unidade pode combater sobre ela e depois continuar.
  const bridgeX = GAME_CONFIG.bridges[0];
  const riverMiddle = (GAME_CONFIG.river.top + GAME_CONFIG.river.bottom) / 2;
  const player = new Unit({
    team: 'player', lane: 0, x: bridgeX, y: GAME_CONFIG.river.bottom + 18, stats, config: GAME_CONFIG,
  });
  const enemyOnBridge = new Unit({
    team: 'enemy', lane: 0, x: bridgeX, y: riverMiddle, stats, config: GAME_CONFIG,
  });
  enemyOnBridge.hp = stats.damage;
  enemyOnBridge.maxHp = stats.damage;

  const target = makeStructure('enemy', 0, bridgeX, 186);
  let foughtOnBridge = false;

  simulate(player, [player, enemyOnBridge], [target], 5, (unit) => {
    const playerInRiver = unit.y >= GAME_CONFIG.river.top && unit.y <= GAME_CONFIG.river.bottom;
    if (playerInRiver && enemyOnBridge.hp < enemyOnBridge.maxHp) foughtOnBridge = true;
  });

  assert.equal(enemyOnBridge.alive, false, 'Inimigo sobre a ponte não foi derrotado.');
  assert.equal(foughtOnBridge, true, 'Não houve combate enquanto a tropa estava sobre a ponte.');
  assert.ok(player.y < GAME_CONFIG.river.top, `Jogador não continuou após lutar na ponte: y=${player.y}`);
}

console.log('navigation.test.js: PASS');
