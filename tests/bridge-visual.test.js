import assert from 'node:assert/strict';
import { Battlefield, BRIDGE_VISUAL_META } from '../src/world/Battlefield.js';
import { GAME_CONFIG } from '../src/config.js';

assert.equal(BRIDGE_VISUAL_META.landOverlap, 20, 'A ponte deve avançar mais sobre o terreno para parecer assentada.');
assert.equal(BRIDGE_VISUAL_META.plankHeight, 6, 'As tábuas devem permanecer legíveis no estilo 16-bit.');
assert.equal(BRIDGE_VISUAL_META.sideBeamWidth, 2, 'As longarinas laterais devem continuar finas.');
assert.equal(BRIDGE_VISUAL_META.anchorDepth, 7, 'As estacas precisam ter profundidade visual suficiente.');
assert.ok(BRIDGE_VISUAL_META.plankVariants >= 6, 'A madeira deve ter várias tonalidades envelhecidas.');
assert.equal(BRIDGE_VISUAL_META.agedWood, true);
assert.equal(BRIDGE_VISUAL_META.groundedAnchors, true);

const battlefield = new Battlefield(GAME_CONFIG);
const fillCalls = [];
const ctx = {
  fillStyle: '',
  imageSmoothingEnabled: true,
  save() {},
  restore() {},
  fillRect(...args) { fillCalls.push({ color: this.fillStyle, args }); },
  drawImage() {},
};

const centerX = GAME_CONFIG.bridges[0];
const top = GAME_CONFIG.river.top - BRIDGE_VISUAL_META.landOverlap;
const bottom = GAME_CONFIG.river.bottom + BRIDGE_VISUAL_META.landOverlap;

assert.doesNotThrow(() => battlefield.drawBridge(ctx, centerX, top, bottom, GAME_CONFIG.bridgeWidth));
assert.ok(fillCalls.length > 60, 'A ponte deve possuir detalhes suficientes de tábuas, pregos, rachaduras e apoios.');
assert.ok(fillCalls.some(({ color }) => color === GAME_CONFIG.palette.dirtDark), 'As cabeceiras devem integrar solo escuro.');
assert.ok(fillCalls.some(({ color }) => color === GAME_CONFIG.palette.dirt), 'As cabeceiras devem integrar solo batido.');
assert.ok(fillCalls.some(({ color }) => color === '#4a3524'), 'As estacas de fixação devem ser desenhadas.');
assert.ok(fillCalls.some(({ color }) => color === '#5b422b'), 'As longarinas laterais envelhecidas devem ser desenhadas.');

console.log('bridge-visual.test.js: PASS');
