import assert from 'node:assert/strict';
import { BattleGame } from '../src/core/BattleGame.js';

function makeContext() {
  return {
    imageSmoothingEnabled: false,
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    lineWidth: 1,
    save() {},
    restore() {},
    fillRect() {},
    strokeRect() {},
    clearRect() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    arc() {},
    stroke() {},
    fill() {},
    fillText() {},
    setLineDash() {},
  };
}

function makeCanvas() {
  const ctx = makeContext();
  return {
    ctx,
    getContext() { return ctx; },
    addEventListener() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 360, height: 800 };
    },
  };
}

function pointer(x, y) {
  return {
    clientX: x,
    clientY: y,
    preventDefault() {},
  };
}

const game = new BattleGame(makeCanvas());
const first = game.cards.getCardRect(0);

assert.doesNotThrow(() => {
  game.handlePointerDown(pointer(first.x + 10, first.y + 10));
  game.handlePointerDown(pointer(120, 430));
  game.update(0.04);
  game.draw();
}, 'Selecionar uma carta e clicar no campo não pode interromper o loop do jogo.');

assert.equal(game.units.length >= 1, true, 'O clique deve criar uma unidade e manter o jogo executando.');

// Defesa contra cache antigo: se unitTypes faltar, o jogo deve cair para infantry,
// nunca lançar exceção e congelar o navegador.
const fallbackGame = new BattleGame(makeCanvas());
fallbackGame.config = { ...fallbackGame.config, unitTypes: undefined };
assert.doesNotThrow(() => fallbackGame.spawnUnit('player', 0, 100, 430, 'rifleman'));
assert.equal(fallbackGame.units.length, 1, 'Fallback deve criar a unidade mesmo com configuração antiga em cache.');

console.log('runtime-click.test.js: PASS');
