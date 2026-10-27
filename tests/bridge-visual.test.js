import assert from 'node:assert/strict';
import { Battlefield, BRIDGE_VISUAL_META } from '../src/world/Battlefield.js';
import { GAME_CONFIG } from '../src/config.js';

assert.equal(BRIDGE_VISUAL_META.landOverlap, 20, 'A ponte deve continuar avançando sobre o terreno.');
assert.equal(BRIDGE_VISUAL_META.plankHeight, 5, 'As tábuas devem ficar mais naturais e menos largas.');
assert.equal(BRIDGE_VISUAL_META.sideBeamWidth, 2, 'As longarinas laterais devem continuar finas.');
assert.equal(BRIDGE_VISUAL_META.anchorDepth, 8, 'As estacas devem permanecer enterradas visualmente.');
assert.ok(BRIDGE_VISUAL_META.plankVariants >= 8, 'A madeira deve ter várias tonalidades opacas e envelhecidas.');
assert.equal(BRIDGE_VISUAL_META.agedWood, true);
assert.equal(BRIDGE_VISUAL_META.groundedAnchors, true);
assert.equal(BRIDGE_VISUAL_META.scenarioBlend, true, 'A ponte deve se misturar ao cenário.');
assert.equal(BRIDGE_VISUAL_META.mossDetails, true, 'A madeira deve possuir musgo compatível com a margem úmida.');
assert.equal(BRIDGE_VISUAL_META.irregularPlanks, true, 'As bordas das tábuas não devem formar um bloco perfeito.');
assert.equal(BRIDGE_VISUAL_META.terrainShoulders, true, 'As cabeceiras precisam continuar o caminho de terra e a grama.');

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
assert.ok(fillCalls.length > 95, 'A ponte deve ter detalhes de desgaste suficientes para se integrar ao cenário.');
assert.ok(fillCalls.some(({ color }) => color === GAME_CONFIG.palette.dirtDark), 'As cabeceiras devem integrar terra escura.');
assert.ok(fillCalls.some(({ color }) => color === GAME_CONFIG.palette.dirt), 'As cabeceiras devem integrar terra batida.');
assert.ok(fillCalls.some(({ color }) => color === GAME_CONFIG.palette.grassDark), 'A grama deve invadir as laterais das cabeceiras.');
assert.ok(fillCalls.some(({ color }) => color === '#68724b'), 'A madeira deve receber musgo discreto.');
assert.ok(fillCalls.some(({ color }) => color === '#5d634b'), 'Pedras da cabeceira devem harmonizar com a margem do rio.');

console.log('bridge-visual.test.js: PASS');
