import assert from 'node:assert/strict';
import { Battlefield } from '../src/world/Battlefield.js';
import { RiverRenderer, RIVER_SPRITE_META } from '../src/world/RiverRenderer.js';
import { WATER_SHEET } from '../src/assets/river/water/sheet.js';
import { TOP_BANK_SHEET } from '../src/assets/river/banks/top/sheet.js';
import { BOTTOM_BANK_SHEET } from '../src/assets/river/banks/bottom/sheet.js';
import { GAME_CONFIG } from '../src/config.js';

assert.ok(WATER_SHEET.startsWith('data:image/png;base64,'), 'A água deve usar a folha PNG real em 16-bit.');
assert.ok(TOP_BANK_SHEET.startsWith('data:image/png;base64,'), 'A margem superior deve usar sprites reais.');
assert.ok(BOTTOM_BANK_SHEET.startsWith('data:image/png;base64,'), 'A margem inferior deve usar sprites reais.');
assert.equal(RIVER_SPRITE_META.waterFrames, 6, 'A animação da água deve possuir 6 frames.');
assert.equal(RIVER_SPRITE_META.bankTiles, 6, 'Cada margem deve possuir 6 variações fixas.');

const renderer = new RiverRenderer(GAME_CONFIG);
assert.equal(renderer.getWaterFrameIndex(0), 0, 'A água deve começar no primeiro frame.');
assert.equal(renderer.getWaterFrameIndex(0.13), 1, 'A água deve avançar para o segundo frame.');
assert.equal(renderer.getWaterFrameIndex(0.61), 5, 'A água deve alcançar o sexto frame.');
assert.equal(renderer.getWaterFrameIndex(0.73), 0, 'A animação deve voltar ao primeiro frame em loop.');

const drawCalls = [];
const ctx = {
  fillStyle: '',
  globalAlpha: 1,
  imageSmoothingEnabled: true,
  save() {},
  restore() {},
  fillRect(...args) { drawCalls.push(['fillRect', ...args]); },
  drawImage(...args) { drawCalls.push(['drawImage', ...args]); },
};

// Node não possui Image. O fallback precisa renderizar sem quebrar.
assert.doesNotThrow(() => renderer.draw(ctx, 0.3));
assert.ok(drawCalls.some(([type]) => type === 'fillRect'), 'O fallback do rio deve desenhar água enquanto os sprites carregam.');

// Simula as três folhas carregadas e garante que o caminho visual usa sprites.
renderer.water = { complete: true, naturalWidth: 384 };
renderer.topBank = { complete: true, naturalWidth: 192 };
renderer.bottomBank = { complete: true, naturalWidth: 192 };
drawCalls.length = 0;
assert.doesNotThrow(() => renderer.draw(ctx, 0.3));
assert.ok(
  drawCalls.filter(([type]) => type === 'drawImage').length >= 14,
  'O rio deve desenhar água animada e as duas margens usando sprites.',
);

const battlefield = new Battlefield(GAME_CONFIG);
drawCalls.length = 0;
assert.doesNotThrow(() => battlefield.draw(ctx, 0.5));

console.log('river-visual.test.js: PASS');
