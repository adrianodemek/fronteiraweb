import { Game } from './core/Game.js?v=0.1.3';

const canvas = document.querySelector('#game');

if (!canvas) {
  throw new Error('Canvas principal não encontrado.');
}

const game = new Game(canvas);
game.start();
