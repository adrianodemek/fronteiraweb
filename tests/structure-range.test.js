import assert from 'node:assert/strict';
import { Structure } from '../src/entities/Structure.js';
import { GAME_CONFIG } from '../src/config.js';

function makeUnit({ x, y, radius = 7 }) {
  return {
    team: 'player',
    x,
    y,
    radius,
    hp: 500,
    get alive() { return this.hp > 0; },
    takeDamage(amount) { this.hp -= amount; },
  };
}

const baseConfig = GAME_CONFIG.structures.find((item) => item.id === 'enemy-left');
const base = new Structure({ ...baseConfig });
base.cooldown = 0;

// MG42 consegue atacar a base a ~102 px centro-a-centro.
// Com cálculo borda-a-borda, a base também deve responder nesse ponto.
{
  const machinegun = makeUnit({
    x: base.x,
    y: base.y + 102,
    radius: GAME_CONFIG.unitTypes.machinegun.radius,
  });
  const before = machinegun.hp;
  base.cooldown = 0;
  base.update(0.04, [machinegun]);
  assert.ok(machinegun.hp < before, 'A base deve retaliar contra MG42 que esteja atacando dentro do alcance defensivo real.');
}

// O morteiro foi definido como artilharia de longo alcance e ainda pode
// manter uma pequena zona segura fora do alcance normal da base.
{
  const mortar = makeUnit({
    x: base.x,
    y: base.y + 122,
    radius: GAME_CONFIG.unitTypes.mortar.radius,
  });
  const before = mortar.hp;
  base.cooldown = 0;
  base.update(0.04, [mortar]);
  assert.equal(mortar.hp, before, 'O morteiro deve continuar podendo superar o alcance normal da base.');
}

console.log('structure-range.test.js: PASS');
