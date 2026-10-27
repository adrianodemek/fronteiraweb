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
    const previous = { x: unit.x, y: unit.y };
    unit.update(dt, units, structures);
    onStep?.(unit, elapsed, previous);
  }
}

{
  const unit = new Unit({
    team: 'player',
    lane: 0,
    x: 180,
    y: 640,
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
  let firstAvoidDistance = null;
  let minimumMovingStep = Infinity;
  let passedAt = null;

  simulate(unit, [unit], [ownHq, target], 9, (current, elapsed, previous) => {
    const distanceFromHq = Math.hypot(current.x - ownHq.x, current.y - ownHq.y);
    minimumDistance = Math.min(minimumDistance, distanceFromHq);

    if (firstAvoidDistance === null && Math.abs(current.x - ownHq.x) >= 3) {
      firstAvoidDistance = distanceFromHq;
    }

    if (passedAt === null) {
      const step = Math.hypot(current.x - previous.x, current.y - previous.y);
      minimumMovingStep = Math.min(minimumMovingStep, step);
    }

    if (passedAt === null && current.y < ownHq.y - clearance) {
      passedAt = elapsed;
    }
  });

  assert.ok(
    minimumDistance >= clearance - 0.05,
    `A unidade atravessou o QG: distância mínima ${minimumDistance}, necessária ${clearance}.`,
  );
  assert.ok(
    firstAvoidDistance !== null && firstAvoidDistance > clearance + 18,
    `A unidade começou a desviar tarde demais: distância ${firstAvoidDistance}.`,
  );
  assert.ok(
    minimumMovingStep > 0.7,
    `A unidade perdeu fluidez ao contornar a construção: menor passo ${minimumMovingStep}.`,
  );
  assert.ok(passedAt !== null && passedAt < 5.5, `A unidade demorou demais para passar pelo QG: ${passedAt}s.`);
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
