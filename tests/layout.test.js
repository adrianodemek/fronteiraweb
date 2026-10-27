import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/config.js';
import { BRIDGE_VISUAL_META } from '../src/world/Battlefield.js';

const { width, height, battlefield, river, bridges, hud, structures } = GAME_CONFIG;

assert.equal(width, 360, 'A largura lógica deve permanecer em 360 px.');
assert.equal(height, 800, 'O layout padrão deve permanecer na proporção 9:20.');
assert.equal(width / height, 9 / 20, 'A proporção do canvas deve ser exatamente 9:20.');
assert.equal(battlefield.bottom, 678, 'O HUD inferior deve começar em y=678.');
assert.equal(river.top, 342, 'O rio deve começar em y=342.');
assert.equal(river.bottom, 366, 'O rio deve terminar em y=366.');
assert.equal(river.bottom - river.top, 24, 'O rio deve manter 24 px de largura vertical.');
assert.deepEqual(bridges, [76, 284], 'As pontes devem manter as lanes abertas do layout de referência.');
assert.equal(BRIDGE_VISUAL_META.landOverlap, 14, 'A ponte deve entrar 14 px na terra em cada margem.');
assert.equal(
  (river.bottom - river.top) + BRIDGE_VISUAL_META.landOverlap * 2,
  52,
  'A ponte visual deve cobrir agua, barrancos e as duas ancoragens de terra.',
);

const enemyLeft = structures.find(({ id }) => id === 'enemy-left');
const enemyRight = structures.find(({ id }) => id === 'enemy-right');
const enemyHq = structures.find(({ id }) => id === 'enemy-hq');
const playerLeft = structures.find(({ id }) => id === 'player-left');
const playerRight = structures.find(({ id }) => id === 'player-right');
const playerHq = structures.find(({ id }) => id === 'player-hq');
const bridgeTop = river.top - BRIDGE_VISUAL_META.landOverlap;
const bridgeBottom = river.bottom + BRIDGE_VISUAL_META.landOverlap;

assert.equal(bridgeTop - enemyLeft.y, playerLeft.y - bridgeBottom, 'A base lateral esquerda deve ficar espelhada em relação à ponte.');
assert.equal(bridgeTop - enemyRight.y, playerRight.y - bridgeBottom, 'A base lateral direita deve ficar espelhada em relação à ponte.');
assert.equal(bridgeTop - enemyHq.y, playerHq.y - bridgeBottom, 'Os QGs devem ter a mesma distância da ponte nos dois lados.');
assert.equal(playerLeft.y, 522, 'As bases laterais do jogador devem ficar em y=522.');
assert.equal(playerRight.y, 522, 'As bases laterais do jogador devem ficar em y=522.');
assert.equal(playerHq.y, 573, 'O QG do jogador deve ficar em y=573.');

assert.equal(hud.cardTop, 696, 'As cartas devem iniciar em y=696.');
assert.equal(hud.supplyY, 774, 'A barra de Suprimentos deve ficar abaixo das cartas.');

const lastCardRight = hud.handStartX
  + 3 * (hud.cardWidth + hud.cardGap)
  + hud.cardWidth;
assert.ok(lastCardRight <= width, 'As quatro cartas precisam caber integralmente na tela.');
assert.ok(hud.top > river.bottom, 'O HUD nunca pode sobrepor o rio.');

console.log('layout.test.js: PASS');
