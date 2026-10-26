import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/config.js';
import { CardSystem } from '../src/systems/Cards.js';
import { Game } from '../src/core/Game.js';

function makeCanvas() {
  return {
    getContext() {
      return {};
    },
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

{
  const cards = new CardSystem(GAME_CONFIG);
  assert.equal(cards.hand.length, 4, 'A mão deve ter quatro cartas.');
  assert.equal(cards.hand[0].id, 'rifleman');
  assert.equal(cards.nextCard.id, 'medic', 'A quinta carta deve aparecer como Próxima.');

  assert.equal(cards.select(0), true);
  assert.equal(cards.selectedCard.id, 'rifleman');
  const played = cards.playSelected();
  assert.equal(played.id, 'rifleman');
  assert.equal(cards.hand[0].id, 'medic', 'A próxima carta deve entrar na posição usada.');
  assert.equal(cards.nextCard.id, 'engineer', 'A fila deve avançar após o uso.');
  assert.equal(cards.selectedCard, null, 'A seleção deve limpar após jogar uma carta.');
}

{
  const game = new Game(makeCanvas());
  const firstRect = game.cards.getCardRect(0);

  game.handlePointerDown(pointer(firstRect.x + 10, firstRect.y + 10));
  assert.equal(game.cards.selectedIndex, 0, 'Tocar na primeira carta deve selecioná-la.');

  game.handlePointerDown(pointer(120, 430));
  assert.equal(game.units.length, 1, 'Tocar no campo com carta selecionada deve mobilizar a tropa.');
  assert.equal(game.cards.selectedIndex, null, 'Após mobilizar, nenhuma carta deve permanecer selecionada.');
  assert.equal(game.cards.hand[0].id, 'medic', 'A mão deve rotacionar depois do deploy.');
}

console.log('cards.test.js: PASS');
