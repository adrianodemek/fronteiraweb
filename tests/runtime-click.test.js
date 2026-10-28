import assert from 'node:assert/strict';
import { BattleGame } from '../src/core/BattleGame.js';
import { SIDE_BASE_DESTRUCTION_FX } from '../src/effects/sideBaseDestructionFx.js';

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
    translate() {},
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

// O tremor precisa depender da transição real viva -> destruída, e não somente
// de takeDamage(). Isto cobre qualquer caminho de dano que deixe o HP em zero.
const destructionGame = new BattleGame(makeCanvas());
const sideBase = destructionGame.structures.find(({ kind }) => kind === 'base');
assert.ok(sideBase?.alive, 'O teste precisa iniciar com uma base lateral viva.');
assert.equal(destructionGame.sideBaseShakeRemaining, 0);

sideBase.hp = 0;
destructionGame.update(0.04);

assert.equal(sideBase.alive, false, 'A base deve estar destruída após zerar o HP.');
assert.equal(
  destructionGame.sideBaseShakeRemaining,
  SIDE_BASE_DESTRUCTION_FX.shakeDuration,
  'O runtime deve disparar o tremor mesmo quando o HP chega a zero fora de takeDamage().',
);
assert.equal(sideBase.destroyedFxAge, 0, 'A fumaça deve iniciar no instante da destruição detectada pelo runtime.');
assert.doesNotThrow(() => destructionGame.draw(), 'O frame da destruição com tremor/fumaça não pode quebrar o render.');

destructionGame.update(0.08);
assert.ok(sideBase.destroyedFxAge > 0, 'A fumaça deve continuar animando nos frames seguintes.');
assert.ok(destructionGame.sideBaseShakeRemaining < SIDE_BASE_DESTRUCTION_FX.shakeDuration, 'O tremor deve decair após o impacto inicial.');

console.log('runtime-click.test.js: PASS');
