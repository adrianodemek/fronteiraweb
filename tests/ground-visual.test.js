import assert from 'node:assert/strict';
import { GroundRenderer, GROUND_SPRITE_META } from '../src/world/GroundRenderer.js';
import { GROUND_BASE_SHEET } from '../src/assets/ground/base/sheet.js';
import { GROUND_TOP_TRANSITION_SHEET } from '../src/assets/ground/transition/top/sheet.js';
import { GROUND_BOTTOM_TRANSITION_SHEET } from '../src/assets/ground/transition/bottom/sheet.js';
import { GAME_CONFIG } from '../src/config.js';

assert.ok(GROUND_BASE_SHEET.startsWith('data:image/png;base64,'), 'O chão deve usar folha PNG 16-bit real.');
assert.ok(GROUND_TOP_TRANSITION_SHEET.startsWith('data:image/png;base64,'), 'A transição superior deve usar sprite real.');
assert.ok(GROUND_BOTTOM_TRANSITION_SHEET.startsWith('data:image/png;base64,'), 'A transição inferior deve usar sprite real.');
assert.equal(GROUND_SPRITE_META.tiles, 6, 'O chão deve possuir 6 variações de tile.');
assert.equal(GROUND_SPRITE_META.tileWidth, 64, 'Os tiles do chão devem preservar 64 px de largura.');
assert.equal(GROUND_SPRITE_META.tileHeight, 64, 'Os tiles do chão devem preservar 64 px de altura.');
assert.equal(GROUND_SPRITE_META.transitionTiles, 6, 'A borda do rio deve possuir 6 variações.');
assert.equal(GROUND_SPRITE_META.transitionHeight, 16, 'A transição com o rio deve ser discreta, com 16 px.');

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

renderer.base = { complete: true, naturalWidth: 384 };
renderer.topTransition = { complete: true, naturalWidth: 384 };
renderer.bottomTransition = { complete: true, naturalWidth: 384 };
calls.length = 0;
assert.doesNotThrow(() => renderer.draw(ctx));
assert.ok(calls.filter(([type]) => type === 'drawImage').length > 50, 'O campo deve ser coberto por tiles 16-bit reais.');
assert.equal(ctx.imageSmoothingEnabled, false, 'O chão deve ser renderizado sem suavização para preservar pixel art.');

console.log('ground-visual.test.js: PASS');
