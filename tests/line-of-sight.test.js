import assert from 'node:assert/strict';
import { BattleUnit } from '../src/entities/BattleUnit.js';
import { GAME_CONFIG } from '../src/config.js';

function makeStructure({ id, team, kind = 'base', lane = 0, x, y, hitRadius }) {
  return {
    id,
    team,
    kind,
    lane,
    x,
    y,
    hp: 99999,
    hitRadius: hitRadius ?? (kind === 'hq' ? 28 : 22),
    get alive() {
      return this.hp > 0;
    },
    takeDamage(amount) {
      this.hp -= amount;
    },
  };
}

function makeEnemy(x, y) {
  return {
    team: 'enemy',
    x,
    y,
    radius: 7,
    hp: 500,
    get alive() {
      return this.hp > 0;
    },
    takeDamage(amount) {
      this.hp -= amount;
    },
  };
}

{
  // Reproduz o print: tropa atrás da própria base e inimigo logo à frente.
  // A distância já permite ataque, mas a construção está exatamente no meio.
  const unit = new BattleUnit({
    team: 'player',
    lane: 0,
    x: 76,
    y: 526,
    stats: GAME_CONFIG.infantry,
    config: GAME_CONFIG,
  });
  const ownBase = makeStructure({
    id: 'player-left',
    team: 'player',
    lane: 0,
    x: 76,
    y: 492,
  });
  const enemy = makeEnemy(76, 460);
  const startingEnemyHp = enemy.hp;
  const startingX = unit.x;
  let movedSideways = false;

  for (let i = 0; i < 100; i += 1) {
    unit.update(0.04, [unit, enemy], [ownBase]);
    if (Math.abs(unit.x - startingX) > 4) movedSideways = true;
  }

  assert.equal(
    movedSideways,
    true,
    'Com uma construção bloqueando o tiro, a unidade deve sair pela lateral em vez de ficar parada atrás dela.',
  );
  assert.ok(
    enemy.hp < startingEnemyHp,
    'Depois de contornar a construção e recuperar linha livre, a unidade deve voltar a atacar o inimigo.',
  );
  assert.ok(
    Math.hypot(unit.x - ownBase.x, unit.y - ownBase.y) >= ownBase.hitRadius + unit.radius + 3 - 0.05,
    'A unidade não pode atravessar a construção durante o desvio.',
  );
}

console.log('line-of-sight.test.js: PASS');
