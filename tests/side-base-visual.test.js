import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/config.js';
import { SIDE_BASE_FRONT_SPRITE } from '../src/assets/structures/side-base/base_front.sprite.js';
import { SIDE_BASE_BACK_SPRITE } from '../src/assets/structures/side-base/base_back.sprite.js';

const RUN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function decodeValue(char) {
  return RUN_ALPHABET.indexOf(char);
}

function validateSpriteDefinition(definition, label) {
  assert.equal(definition.width, 64, `${label}: largura fonte deve ser 64.`);
  assert.equal(definition.height, 40, `${label}: altura fonte deve ser 40.`);
  assert.equal(definition.palette.length % 6, 0, `${label}: paleta hexadecimal inválida.`);
  assert.ok(definition.palette.length / 6 <= 64, `${label}: paleta não pode ultrapassar 64 cores.`);
  assert.equal(definition.runs.length % 4, 0, `${label}: dados RLE incompletos.`);

  let visiblePixels = 0;
  for (let i = 0; i < definition.runs.length; i += 4) {
    const colorIndex = decodeValue(definition.runs[i]);
    const x = decodeValue(definition.runs[i + 1]);
    const y = decodeValue(definition.runs[i + 2]);
    const length = decodeValue(definition.runs[i + 3]) + 1;

    assert.ok(colorIndex >= 0 && colorIndex < definition.palette.length / 6, `${label}: índice de cor inválido.`);
    assert.ok(x >= 0 && x < definition.width, `${label}: coordenada X inválida.`);
    assert.ok(y >= 0 && y < definition.height, `${label}: coordenada Y inválida.`);
    assert.ok(length >= 1 && x + length <= definition.width, `${label}: run ultrapassa a largura.`);
    visiblePixels += length;
  }

  assert.ok(visiblePixels > 1500, `${label}: precisa conter pixels visíveis reais.`);
  assert.ok(visiblePixels < definition.width * definition.height - 100, `${label}: precisa preservar área transparente ao redor.`);
  return visiblePixels;
}

const frontVisible = validateSpriteDefinition(SIDE_BASE_FRONT_SPRITE, 'base_front.sprite.js');
const backVisible = validateSpriteDefinition(SIDE_BASE_BACK_SPRITE, 'base_back.sprite.js');
assert.equal(frontVisible, 2164, 'A frente deve preservar exatamente os pixels visíveis do sprite aprovado.');
assert.equal(backVisible, 2127, 'As costas devem preservar exatamente os pixels visíveis do sprite aprovado.');
assert.notEqual(SIDE_BASE_FRONT_SPRITE.runs, SIDE_BASE_BACK_SPRITE.runs, 'Frente e costas precisam ser artes diferentes.');

const offscreenCanvases = [];
globalThis.document = {
  createElement(tagName) {
    assert.equal(tagName, 'canvas');
    const fills = [];
    const context = {
      fillStyle: '',
      imageSmoothingEnabled: true,
      fillRect(x, y, width, height) {
        fills.push({ color: this.fillStyle, x, y, width, height });
      },
    };
    const canvas = {
      width: 0,
      height: 0,
      fills,
      getContext(kind) {
        assert.equal(kind, '2d');
        return context;
      },
    };
    offscreenCanvases.push(canvas);
    return canvas;
  },
};

const {
  SideBaseStructure,
  SIDE_BASE_VISUAL_META,
} = await import('../src/entities/SideBaseStructure.js?side-base-visual-v0628-rle');

delete globalThis.document;

assert.equal(offscreenCanvases.length, 2, 'Frente e costas devem ser reconstruídas uma vez em canvases transparentes.');
assert.equal(offscreenCanvases[0].width, 64);
assert.equal(offscreenCanvases[0].height, 40);
assert.equal(offscreenCanvases[1].width, 64);
assert.equal(offscreenCanvases[1].height, 40);
assert.equal(offscreenCanvases[0].fills.reduce((sum, fill) => sum + fill.width, 0), 2164);
assert.equal(offscreenCanvases[1].fills.reduce((sum, fill) => sum + fill.width, 0), 2127);

assert.equal(SIDE_BASE_VISUAL_META.width, 70);
assert.equal(SIDE_BASE_VISUAL_META.height, 44);
assert.equal(SIDE_BASE_VISUAL_META.sourceWidth, 64);
assert.equal(SIDE_BASE_VISUAL_META.sourceHeight, 40);
assert.equal(SIDE_BASE_VISUAL_META.enemyView, 'front');
assert.equal(SIDE_BASE_VISUAL_META.playerView, 'back');
assert.equal(SIDE_BASE_VISUAL_META.frontAsset, 'base_front.sprite.js');
assert.equal(SIDE_BASE_VISUAL_META.backAsset, 'base_back.sprite.js');
assert.equal(SIDE_BASE_VISUAL_META.storageFormat, 'text-rle-pixel-sprite');
assert.equal(SIDE_BASE_VISUAL_META.transparentBackground, true);
assert.equal(SIDE_BASE_VISUAL_META.visiblePixelValidation, true);
assert.equal(SIDE_BASE_VISUAL_META.imageSmoothing, false);
assert.equal(SIDE_BASE_VISUAL_META.gameplayHitRadiusUnchanged, 22);
assert.equal(SIDE_BASE_VISUAL_META.release, '0.6.28');

function makeCtx() {
  const calls = [];
  return {
    calls,
    fillStyle: '', font: '', textAlign: '', textBaseline: '', globalAlpha: 1,
    imageSmoothingEnabled: true,
    fillRect(...args) { calls.push({ type: 'fillRect', args }); },
    fillText(...args) { calls.push({ type: 'fillText', args }); },
    drawImage(...args) { calls.push({ type: 'drawImage', args }); },
    save() {}, restore() {},
  };
}

const bases = GAME_CONFIG.structures.filter(({ kind }) => kind === 'base');
assert.equal(bases.length, 4);
for (const base of bases) {
  assert.deepEqual(
    { hp: base.hp, range: base.range, damage: base.damage, attackDelay: base.attackDelay, startsActive: base.startsActive },
    { hp: 1200, range: 82, damage: 20, attackDelay: 0.95, startsActive: true },
    `${base.id}: a troca visual não pode alterar as mecânicas.`,
  );

  const structure = new SideBaseStructure({ ...base });
  assert.equal(structure.hitRadius, 22, `${base.id}: colisão deve continuar em 22.`);
  const ctx = makeCtx();
  structure.draw(ctx, GAME_CONFIG.palette);
  const draw = ctx.calls.find(({ type }) => type === 'drawImage');
  assert.ok(draw, `${base.id}: deve desenhar o sprite reconstruído.`);

  const expectedCanvas = base.team === 'enemy' ? offscreenCanvases[0] : offscreenCanvases[1];
  assert.equal(draw.args[0], expectedCanvas, `${base.id}: deve usar ${base.team === 'enemy' ? 'frente' : 'costas'}.`);
  assert.equal(draw.args[3], 70);
  assert.equal(draw.args[4], 44);
  assert.equal(ctx.imageSmoothingEnabled, false);
}

console.log('side-base-visual.test.js: PASS');
