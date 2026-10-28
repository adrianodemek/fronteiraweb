import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/config.js';
import { SIDE_BASE_FRONT_SPRITE } from '../src/assets/structures/side-base/base_front.sprite.js';
import { SIDE_BASE_BACK_SPRITE } from '../src/assets/structures/side-base/base_back.sprite.js';
import { SIDE_BASE_FRONT_DESTROYED_SPRITE } from '../src/assets/structures/side-base/base_front_destroyed.sprite.js';
import { SIDE_BASE_BACK_DESTROYED_SPRITE } from '../src/assets/structures/side-base/base_back_destroyed.runtime.js';

const RUN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function decodeValue(char) {
  return RUN_ALPHABET.indexOf(char);
}

function validateSpriteDefinition(definition, label, expectedWidth, expectedHeight, minimumVisiblePixels) {
  assert.equal(definition.width, expectedWidth, `${label}: largura fonte inesperada.`);
  assert.equal(definition.height, expectedHeight, `${label}: altura fonte inesperada.`);
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

  assert.ok(visiblePixels > minimumVisiblePixels, `${label}: precisa conter pixels visíveis reais.`);
  assert.ok(visiblePixels < definition.width * definition.height, `${label}: precisa preservar transparência ao redor.`);
  return visiblePixels;
}

const frontVisible = validateSpriteDefinition(SIDE_BASE_FRONT_SPRITE, 'base_front.sprite.js', 64, 40, 1500);
const backVisible = validateSpriteDefinition(SIDE_BASE_BACK_SPRITE, 'base_back.sprite.js', 64, 40, 1500);
const frontDestroyedVisible = validateSpriteDefinition(SIDE_BASE_FRONT_DESTROYED_SPRITE, 'base_front_destroyed.sprite.js', 48, 30, 900);
const backDestroyedVisible = validateSpriteDefinition(SIDE_BASE_BACK_DESTROYED_SPRITE, 'base_back_destroyed.runtime.js', 48, 30, 900);

assert.equal(frontVisible, 2164, 'A frente normal deve preservar o sprite aprovado.');
assert.equal(backVisible, 2127, 'As costas normais devem preservar o sprite aprovado.');
assert.equal(frontDestroyedVisible, 1064, 'A frente destruída deve preservar os pixels do novo sprite.');
assert.equal(backDestroyedVisible, 1033, 'As costas destruídas devem preservar os pixels do novo sprite.');
assert.notEqual(SIDE_BASE_FRONT_DESTROYED_SPRITE.runs, SIDE_BASE_BACK_DESTROYED_SPRITE.runs, 'Frente e costas destruídas precisam ser artes diferentes.');

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
} = await import('../src/entities/SideBaseStructure.js?side-base-visual-v0630-destroyed');

delete globalThis.document;

assert.equal(offscreenCanvases.length, 4, 'Frente/costas normais e destruídas devem ser reconstruídas em canvases transparentes.');
assert.deepEqual(offscreenCanvases.map(({ width, height }) => [width, height]), [[64, 40], [64, 40], [48, 30], [48, 30]]);
assert.equal(offscreenCanvases[0].fills.reduce((sum, fill) => sum + fill.width, 0), 2164);
assert.equal(offscreenCanvases[1].fills.reduce((sum, fill) => sum + fill.width, 0), 2127);
assert.equal(offscreenCanvases[2].fills.reduce((sum, fill) => sum + fill.width, 0), 1064);
assert.equal(offscreenCanvases[3].fills.reduce((sum, fill) => sum + fill.width, 0), 1033);

assert.equal(SIDE_BASE_VISUAL_META.width, 70);
assert.equal(SIDE_BASE_VISUAL_META.height, 44);
assert.equal(SIDE_BASE_VISUAL_META.sourceWidth, 64);
assert.equal(SIDE_BASE_VISUAL_META.sourceHeight, 40);
assert.equal(SIDE_BASE_VISUAL_META.destroyedSourceWidth, 48);
assert.equal(SIDE_BASE_VISUAL_META.destroyedSourceHeight, 30);
assert.equal(SIDE_BASE_VISUAL_META.enemyView, 'front');
assert.equal(SIDE_BASE_VISUAL_META.playerView, 'back');
assert.equal(SIDE_BASE_VISUAL_META.enemyDestroyedAsset, 'base_front_destroyed.sprite.js');
assert.equal(SIDE_BASE_VISUAL_META.playerDestroyedAsset, 'base_back_destroyed.runtime.js');
assert.equal(SIDE_BASE_VISUAL_META.destroyedSwapCondition, 'hp<=0');
assert.equal(SIDE_BASE_VISUAL_META.destroyedUsesTeamPerspective, true);
assert.equal(SIDE_BASE_VISUAL_META.storageFormat, 'text-rle-pixel-sprite');
assert.equal(SIDE_BASE_VISUAL_META.imageSmoothing, false);
assert.equal(SIDE_BASE_VISUAL_META.gameplayHitRadiusUnchanged, 22);
assert.equal(SIDE_BASE_VISUAL_META.release, '0.6.30');

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

  const aliveCtx = makeCtx();
  structure.draw(aliveCtx, GAME_CONFIG.palette);
  const aliveDraw = aliveCtx.calls.find(({ type }) => type === 'drawImage');
  assert.ok(aliveDraw, `${base.id}: viva deve desenhar o sprite normal.`);
  const expectedAliveCanvas = base.team === 'enemy' ? offscreenCanvases[0] : offscreenCanvases[1];
  assert.equal(aliveDraw.args[0], expectedAliveCanvas, `${base.id}: viva deve usar ${base.team === 'enemy' ? 'frente' : 'costas'}.`);
  assert.equal(aliveDraw.args[3], 70);
  assert.equal(aliveDraw.args[4], 44);

  structure.hp = 0;
  assert.equal(structure.alive, false, `${base.id}: HP zero deve marcar a base como destruída.`);
  const destroyedCtx = makeCtx();
  structure.draw(destroyedCtx, GAME_CONFIG.palette);
  const destroyedDraw = destroyedCtx.calls.find(({ type }) => type === 'drawImage');
  assert.ok(destroyedDraw, `${base.id}: destruída deve desenhar o novo sprite destruído.`);
  const expectedDestroyedCanvas = base.team === 'enemy' ? offscreenCanvases[2] : offscreenCanvases[3];
  assert.equal(destroyedDraw.args[0], expectedDestroyedCanvas, `${base.id}: destruída deve manter a perspectiva da equipe.`);
  assert.equal(destroyedDraw.args[3], 70);
  assert.equal(destroyedDraw.args[4], 44);
  assert.equal(destroyedCtx.calls.some(({ type }) => type === 'fillText'), false, `${base.id}: destruída não deve exibir barra/texto de HP.`);
}

console.log('side-base-visual.test.js: PASS');
