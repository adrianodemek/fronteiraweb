import { BattleGame } from './core/BattleGame.js?v=0.6.34';
import { setupFullscreenButton } from './ui/fullscreen.js?v=0.6.32';

const canvas = document.querySelector('#game');
const gameShell = document.querySelector('#game-shell');
const fullscreenButton = document.querySelector('#fullscreen-toggle');

if (!canvas) {
  throw new Error('Canvas principal não encontrado.');
}

if (gameShell && fullscreenButton) {
  setupFullscreenButton(fullscreenButton, gameShell, document);
}

const game = new BattleGame(canvas);
game.start();
