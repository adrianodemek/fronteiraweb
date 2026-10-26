import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/config.js';
import { SupplySystem } from '../src/systems/Supply.js';
import { Game } from '../src/core/Game.js';

function approx(actual, expected, epsilon = 0.02) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Esperado ~${expected}, recebido ${actual}`);
}

function makeCanvas() {
  return {
    getContext() {
      return {};
    },
    addEventListener() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 360, height: 640 };
    },
  };
}

{
  const supplies = new SupplySystem(GAME_CONFIG);
  assert.equal(supplies.get('player'), 5, 'Jogador deve começar com 5 suprimentos.');
  assert.equal(supplies.get('enemy'), 5, 'Inimigo deve começar com 5 suprimentos.');
  assert.equal(supplies.spend('player', 3), true, 'Deve conseguir gastar 3 suprimentos.');
  assert.equal(supplies.get('player'), 2, 'Depois do gasto devem restar 2 suprimentos.');

  supplies.update(2.8, 120);
  approx(supplies.get('player'), 3);

  assert.equal(supplies.spend('player', 3), true);
  approx(supplies.get('player'), 0);

  supplies.update(2.8, 60);
  approx(supplies.get('player'), 2);

  supplies.add('player', 100);
  assert.equal(supplies.get('player'), 10, 'Suprimentos não podem ultrapassar 10.');
}

{
  const game = new Game(makeCanvas());
  assert.equal(game.tryDeployUnit('player', 120, 430), true, 'Primeira infantaria deve ser mobilizada.');
  assert.equal(game.supplies.get('player'), 2, 'A infantaria deve consumir 3 suprimentos.');

  assert.equal(
    game.tryDeployUnit('player', 120, 430),
    false,
    'Com apenas 2 suprimentos, uma segunda infantaria não pode ser mobilizada.',
  );
  assert.equal(game.units.length, 1, 'Tentativa sem recursos não pode criar nova unidade.');
  assert.ok(game.resourceDeniedFlash > 0, 'A HUD deve receber feedback de recurso insuficiente.');

  game.supplies.update(2.8, 120);
  assert.equal(game.tryDeployUnit('player', 120, 430), true, 'Após regenerar, a infantaria deve poder ser mobilizada.');
  assert.equal(game.units.length, 2);
}

console.log('supply.test.js: PASS');
