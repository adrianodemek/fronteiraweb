import assert from 'node:assert/strict';
import { GroundRenderer, GROUND_SPRITE_META } from '../src/world/GroundRenderer.js';
import {
  GRASS_ATLAS_URL,
  GRASS_TILE_WIDTH,
  GRASS_TILE_HEIGHT,
  GRASS_TILE_COUNT,
} from '../src/assets/ground/grass/manifest.js';
import {
  PATH_ATLAS_URL,
  PATH_TILE_WIDTH,
  PATH_TILE_HEIGHT,
  PATH_TILE_COUNT,
} from '../src/assets/ground/paths/manifest.js';
import {
  DETAIL_ATLAS_URL,
  DETAIL_TILE_WIDTH,
  DETAIL_TILE_HEIGHT,
  DETAIL_TILE_COUNT,
} from '../src/assets/ground/details/manifest.js';
import { GROUND_DETAIL_LAYOUT } from '../src/assets/ground/details/layout.js';
import { GAME_CONFIG } from '../src/config.js';

assert.ok(GRASS_ATLAS_URL.includes('/ground/grass/grass_tiles.png'), 'O gramado deve usar PNG próprio.');
assert.ok(PATH_ATLAS_URL.includes('/ground/paths/path_tiles.png'), 'A estrada deve usar PNG próprio.');
assert.ok(DETAIL_ATLAS_URL.includes('/ground/details/detail_tiles.png'), 'A vegetação deve usar PNG próprio.');
assert.equal(GRASS_TILE_COUNT, 18, 'O gramado deve ter 18 variações.');
assert.equal(GRASS_TILE_WIDTH, 32);
assert.equal(GRASS_TILE_HEIGHT, 32);
assert.equal(PATH_TILE_COUNT, 12, 'As estradas devem ter 12 variações.');
assert.equal(PATH_TILE_WIDTH, 24);
assert.equal(PATH_TILE_HEIGHT, 48);
assert.equal(DETAIL_TILE_COUNT, 17, 'A vegetação deve ter 17 variações.');
assert.equal(DETAIL_TILE_WIDTH, 36);
assert.equal(DETAIL_TILE_HEIGHT, 36);
assert.ok(GROUND_DETAIL_LAYOUT.length >= 10, 'O mapa deve possuir detalhes fixos suficientes sem poluir o campo.');
for (const detail of GROUND_DETAIL_LAYOUT) {
  assert.ok(detail.y < GAME_CONFIG.river.top || detail.y > GAME_CONFIG.river.bottom, 'Vegetação não deve nascer dentro do rio.');
}
assert.equal(GROUND_SPRITE_META.grassDrawSize, 64, 'Cada tile lógico 32-bit deve ampliar 2x para o visual 16-bit.');
assert.equal(GROUND_SPRITE_META.pathDrawWidth, 48, 'A estrada deve ser visível sem dominar o campo.');
assert.equal(GROUND_SPRITE_META.pathDrawHeight, 96);

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
assert.ok(calls.some(([type]) => type === 'fillRect'), 'O chão deve ter fallback enquanto os sprites carregam.');

renderer.grass = { complete: true, naturalWidth: 192 };
renderer.paths = { complete: true, naturalWidth: 144 };
renderer.details = { complete: true, naturalWidth: 216 };
calls.length = 0;
assert.doesNotThrow(() => renderer.draw(ctx));
assert.ok(calls.filter(([type]) => type === 'drawImage').length >= 80, 'O campo deve combinar gramado, estrada e vegetação com muitos sprites reais.');
assert.equal(ctx.imageSmoothingEnabled, false, 'O chão deve preservar pixel art sem suavização.');

console.log('ground-visual.test.js: PASS');
