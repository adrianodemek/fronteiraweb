import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';

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
  const game = new Game(makeCanvas());

  assert.equal(
    game.tryDeployUnit('player', 80, 260),
    false,
    'Antes de destruir a base esquerda, o pocket deve estar bloqueado.',
  );
  assert.equal(game.units.length, 0, 'Nenhuma tropa deve nascer em pocket bloqueado.');

  const enemyLeft = game.structures.find((item) => item.id === 'enemy-left');
  enemyLeft.hp = 0;

  assert.equal(
    game.tryDeployUnit('player', 80, 260),
    true,
    'Depois de destruir a base esquerda, o Game deve aceitar deploy no pocket esquerdo.',
  );
  assert.equal(game.units.length, 1, 'Uma tropa deve nascer no pocket esquerdo liberado.');
  assert.equal(game.units[0].lane, 0, 'A tropa deve nascer na lane esquerda liberada.');

  assert.equal(
    game.tryDeployUnit('player', 80, 220),
    false,
    'Mesmo após destruir a base, área profunda do campo inimigo deve continuar bloqueada.',
  );

  assert.equal(
    game.tryDeployUnit('player', 280, 260),
    false,
    'O pocket direito continua bloqueado enquanto sua base estiver viva.',
  );

  const enemyRight = game.structures.find((item) => item.id === 'enemy-right');
  enemyRight.hp = 0;

  assert.equal(
    game.tryDeployUnit('player', 280, 260),
    true,
    'Depois de destruir a base direita, o Game deve aceitar deploy no pocket direito.',
  );
  assert.equal(game.units.length, 2, 'A segunda tropa deve nascer no pocket direito liberado.');
}

console.log('game-deployment.test.js: PASS');
