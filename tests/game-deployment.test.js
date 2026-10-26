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
    game.tryDeployUnit('player', 80, 220),
    false,
    'Antes de destruir a base esquerda, o Game deve bloquear o deploy no campo inimigo.',
  );
  assert.equal(game.units.length, 0, 'Nenhuma tropa deve ser criada em área bloqueada.');

  const enemyLeft = game.structures.find((item) => item.id === 'enemy-left');
  enemyLeft.hp = 0;

  assert.equal(
    game.tryDeployUnit('player', 80, 220),
    true,
    'Depois de destruir a base esquerda, o Game deve aceitar o deploy na metade esquerda inimiga.',
  );
  assert.equal(game.units.length, 1, 'Uma tropa deve ser criada na zona avançada liberada.');
  assert.equal(game.units[0].lane, 0, 'A tropa deve nascer na lane esquerda liberada.');

  assert.equal(
    game.tryDeployUnit('player', 280, 220),
    false,
    'A metade direita inimiga deve continuar bloqueada enquanto sua base estiver viva.',
  );

  const enemyRight = game.structures.find((item) => item.id === 'enemy-right');
  enemyRight.hp = 0;

  assert.equal(
    game.tryDeployUnit('player', 280, 220),
    true,
    'Depois de destruir a base direita, o Game deve aceitar deploy também na metade direita inimiga.',
  );
  assert.equal(game.units.length, 2, 'A segunda tropa deve ser criada na zona direita liberada.');
}

console.log('game-deployment.test.js: PASS');
