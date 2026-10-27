import assert from 'node:assert/strict';
import { Unit } from '../src/entities/Unit.js';
import { GAME_CONFIG } from '../src/config.js';

const stats = GAME_CONFIG.infantry;

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

function simulate(unit, units, structures, seconds, onStep) {
  const dt = 0.04;
  for (let elapsed = 0; elapsed < seconds; elapsed += dt) {
    unit.update(dt, units, structures);
    onStep?.(unit, elapsed);
  }
}

{
  const unit = new Unit({
    team: 'player',
    lane: 0,
    x: 180,
    y: 620,
    stats,
    config: GAME_CONFIG,
  });

  const ownHq = makeStructure({
    id: 'own-hq',
    team: 'player',
    kind: 'hq',
    x: 180,
    y: 544,
  });
  const target = makeStructure({
    id: 'target',
    team: 'enemy',
    kind: 'base',
    lane: 0,
    x: 180,
    y: 400,
  });

  const clearance = ownHq.hitRadius + unit.radius + 3;
  let minimumDistance = Infinity;

  simulate(unit, [unit], [ownHq, target], 9, (current) => {
    minimumDistance = Math.min(
      minimumDistance,
      Math.hypot(current.x - ownHq.x, current.y - ownHq.y),
    );
  });

  assert.ok(
    minimumDistance >= clearance - 0.05,
    `A unidade atravessou o QG: distância mínima ${minimumDistance}, necessária ${clearance}.`,
  );
  assert.ok(unit.y < ownHq.y - 20, `A unidade ficou travada no QG: y=${unit.y}.`);
  assert.ok(target.hp < 99999, 'A unidade desviou, mas não retomou o caminho até o alvo.');
}

{
  const ownBase = makeStructure({
    id: 'own-base',
    team: 'player',
    kind: 'base',
    lane: 0,
    x: 120,
    y: 500,
  });
  const target = makeStructure({
    id: 'target-2',
    team: 'enemy',
    kind: 'base',
    lane: 0,
    x: 120,
    y: 400,
  });
  const unit = new Unit({
    team: 'player',
    lane: 0,
    x: ownBase.x,
    y: ownBase.y,
    stats,
    config: GAME_CONFIG,
  });

  unit.update(0.04, [unit], [ownBase, target]);

  const distanceFromBase = Math.hypot(unit.x - ownBase.x, unit.y - ownBase.y);
  const clearance = ownBase.hitRadius + unit.radius + 3;

  assert.ok(Number.isFinite(unit.x) && Number.isFinite(unit.y), 'A expulsão da construção gerou coordenadas inválidas.');
  assert.ok(
    distanceFromBase >= clearance - 0.05,
    'Uma unidade iniciada dentro da construção deve ser removida imediatamente do volume sólido.',
  );
}

console.log('structure-collision.test.js: PASS');
