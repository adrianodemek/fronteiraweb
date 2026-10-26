import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/config.js';
import { Structure } from '../src/entities/Structure.js';
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
  const hqData = GAME_CONFIG.structures.find((item) => item.id === 'player-hq');
  const hq = new Structure({ ...hqData });
  const enemy = {
    team: 'enemy',
    x: hq.x,
    y: hq.y - 20,
    hp: 100,
    radius: 7,
    get alive() {
      return this.hp > 0;
    },
    takeDamage(amount) {
      this.hp = Math.max(0, this.hp - amount);
    },
  };

  hq.cooldown = 0;
  hq.update(1, [enemy]);
  assert.equal(hq.active, false, 'O QG deve iniciar inativo.');
  assert.equal(enemy.hp, 100, 'QG inativo não deve atacar tropas inimigas.');

  hq.takeDamage(1);
  assert.equal(hq.active, true, 'Receber dano deve ativar o QG imediatamente.');

  hq.cooldown = 0;
  hq.update(1, [enemy]);
  assert.equal(enemy.hp, 100 - hq.damage, 'QG ativo deve atacar inimigos em alcance.');
}

{
  const game = new Game(makeCanvas());
  const playerHq = game.structures.find((item) => item.id === 'player-hq');
  const playerLeft = game.structures.find((item) => item.id === 'player-left');

  assert.equal(playerHq.active, false, 'QG do jogador deve começar inativo.');
  playerLeft.hp = 0;
  game.syncHqActivation();
  assert.equal(playerHq.active, true, 'Perder uma base lateral deve ativar o QG do jogador.');
}

{
  const game = new Game(makeCanvas());
  const enemyHq = game.structures.find((item) => item.id === 'enemy-hq');
  const enemyRight = game.structures.find((item) => item.id === 'enemy-right');

  assert.equal(enemyHq.active, false, 'QG inimigo deve começar inativo.');
  enemyRight.hp = 0;
  game.syncHqActivation();
  assert.equal(enemyHq.active, true, 'Perder uma base lateral deve ativar o QG inimigo.');
}

console.log('hq-activation.test.js: PASS');
