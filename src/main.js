import { BattleGame } from './core/BattleGame.js?v=0.6.3';

const canvas = document.querySelector('#game');

if (!canvas) {
  throw new Error('Canvas principal não encontrado.');
}

const game = new BattleGame(canvas);
game.start();
