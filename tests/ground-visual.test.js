import assert from 'node:assert/strict';
import { GroundRenderer, GROUND_SPRITE_META } from '../src/world/GroundRenderer.js';
import {
  GROUND_TEXTURE_URL,
  GROUND_FRAME_WIDTH,
  GROUND_FRAME_HEIGHT,
  GROUND_FRAME_COUNT,
} from '../src/assets/ground/base/manifest.js';
import {
  GROUND_LANE_URL,
  LANE_FRAME_WIDTH,
  LANE_FRAME_HEIGHT,
  LANE_FRAME_COUNT,
} from '../src/assets/ground/lane/manifest.js';
import { GAME_CONFIG } from '../src/config.js';

assert.ok(GROUND_TEXTURE_URL.endsWith('/ground_sheet.png'), 'O chão deve usar PNG real e substituível.');
assert.ok(GROUND_LANE_URL.endsWith('/lane_sheet.png'), 'As trilhas devem usar PNG próprio e substituível.');
assert.equal(GROUND_FRAME_COUNT, 2, 'O chão deve alternar dois grandes quadros orgânicos.');
assert.equal(GROUND_FRAME_WIDTH, 180, 'Cada quadro deve ter 180 px e ser ampliado 2x no campo.');
assert.equal(GROUND_FRAME_HEIGHT, 128, 'Cada quadro deve ter 128 px e ser ampliado 2x no campo.');
assert.equal(LANE_FRAME_COUNT, 3, 'As lanes devem possuir 3 variações de terra.');
assert.equal(LANE_FRAME_WIDTH, 28);
assert.equal(LANE_FRAME_HEIGHT, 64);
assert.equal(GROUND_SPRITE_META.groundDrawWidth, 360);
assert.equal(GROUND_SPRITE_META.groundDrawHeight, 256);
assert.equal(GROUND_SPRITE_META.laneDrawWidth, 20, 'A trilha deve permanecer estreita para não competir com tropas/itens.');

const calls = [];
const ctx = {
  fillStyle: '',
  imageSmoothingEnabled: true,
  save() {},
  restore() {},
  fillRect(...args) { calls.push(['fillRect', ...args]); },
  drawImage(...args) { calls.push(['drawImage', ...args]); },
};

const renderer = new GroundRenderer(GAME_CONFIG);
assert.doesNotThrow(() => renderer.draw(ctx));
assert.ok(calls.some(([type]) => type === 'fillRect'), 'O chão deve ter fallback enquanto o PNG carrega.');

renderer.ground = { complete: true, naturalWidth: 360 };
renderer.lanes = { complete: true, naturalWidth: 84 };
calls.length = 0;
assert.doesNotThrow(() => renderer.draw(ctx));
assert.ok(calls.filter(([type]) => type === 'drawImage').length >= 15, 'O campo deve desenhar a textura rica e as lanes 16-bit.');
assert.equal(ctx.imageSmoothingEnabled, false, 'O chão deve preservar pixel art sem suavização.');

console.log('ground-visual.test.js: PASS');
