import assert from 'node:assert/strict';
import { Battlefield } from '../src/world/Battlefield.js';
import { GroundRenderer } from '../src/world/GroundRenderer.js';
import { RiverRenderer, RIVER_SPRITE_META } from '../src/world/RiverRenderer.js';
import { WATER_SHEET } from '../src/assets/river/water/sheet.js';
import {
  TOP_BANK_ATLAS_URL,
  BANK_TILE_WIDTH,
  BANK_TILE_HEIGHT,
  BANK_TILE_COUNT,
} from '../src/assets/river/banks/top/manifest.js';
import { BOTTOM_BANK_ATLAS_URL } from '../src/assets/river/banks/bottom/manifest.js';
import { GAME_CONFIG } from '../src/config.js';

assert.ok(WATER_SHEET.startsWith('data:image/png;base64,'), 'A água deve continuar usando a animação PNG existente.');
assert.ok(TOP_BANK_ATLAS_URL.includes('bank_tiles.png'), 'A margem superior deve usar PNG real separado.');
assert.ok(BOTTOM_BANK_ATLAS_URL.includes('bank_tiles.png'), 'A margem inferior deve usar PNG real separado.');
assert.equal(BANK_TILE_COUNT, 6, 'Cada margem deve possuir 6 variações naturais.');
assert.equal(BANK_TILE_WIDTH, 128, 'Os novos trechos de margem devem ser largos para evitar repetição curta.');
assert.equal(BANK_TILE_HEIGHT, 32, 'A margem deve incluir pedra, terra e vegetação no mesmo sprite.');
assert.equal(RIVER_SPRITE_META.bankTiles, 6);
assert.equal(RIVER_SPRITE_META.bankTileWidth, 128);
assert.equal(RIVER_SPRITE_META.bankTileHeight, 32);
assert.equal(RIVER_SPRITE_META.bankOverlap, 8, 'A margem deve entrar 8 px no rio.');
assert.equal(RIVER_SPRITE_META.bankLandDepth, 24, 'A margem deve misturar 24 px dentro do gramado.');
assert.equal(RIVER_SPRITE_META.integratedBankBlend, true, 'A transição deve estar integrada ao sprite, sem overlays soltos.');
assert.equal(RIVER_SPRITE_META.waterFrameSeconds, 0.22);
assert.equal(RIVER_SPRITE_META.waterScrollSpeed, 3);

const renderer = new RiverRenderer(GAME_CONFIG);
assert.equal(renderer.getWaterFrameIndex(0), 0);
assert.equal(renderer.getWaterFrameIndex(0.23), 1);
assert.equal(renderer.getWaterFrameIndex(1.33), 0);

const drawCalls = [];
const ctx = {
  fillStyle: '',
  imageSmoothingEnabled: true,
  save() {},
  restore() {},
  fillRect(...args) { drawCalls.push(['fillRect', ...args]); },
  drawImage(...args) { drawCalls.push(['drawImage', ...args]); },
};

const groundRenderer = new GroundRenderer(GAME_CONFIG);
assert.doesNotThrow(() => groundRenderer.draw(ctx));
assert.ok(drawCalls.some(([type]) => type === 'fillRect'), 'O chão precisa manter fallback enquanto os PNGs carregam.');

drawCalls.length = 0;
assert.doesNotThrow(() => renderer.draw(ctx, 0.3));
assert.ok(drawCalls.some(([type]) => type === 'fillRect'), 'O rio deve manter fallback de água.');

renderer.water = { complete: true, naturalWidth: 768 };
renderer.topBank = { complete: true, naturalWidth: 768 };
renderer.bottomBank = { complete: true, naturalWidth: 768 };
drawCalls.length = 0;
assert.doesNotThrow(() => renderer.draw(ctx, 0.3));
assert.ok(
  drawCalls.filter(([type]) => type === 'drawImage').length >= 9,
  'O rio deve desenhar água e as duas margens contínuas usando sprites reais.',
);

const battlefield = new Battlefield(GAME_CONFIG);
drawCalls.length = 0;
assert.doesNotThrow(() => battlefield.draw(ctx, 0.5));
assert.ok(drawCalls.some(([type]) => type === 'fillRect'));

console.log('river-visual.test.js: PASS');
