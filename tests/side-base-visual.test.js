import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GAME_CONFIG } from '../src/config.js';

class FakeImage {
  constructor() {
    this.complete = true;
    this.naturalWidth = 96;
    this.naturalHeight = 60;
    this.decoding = '';
    this._src = '';
  }
  set src(value) { this._src = value; }
  get src() { return this._src; }
}

globalThis.Image = FakeImage;
const {
  SideBaseStructure,
  SIDE_BASE_ASSET_PATHS,
  SIDE_BASE_VISUAL_META,
} = await import('../src/entities/SideBaseStructure.js?side-base-visual-v0627');
delete globalThis.Image;

assert.equal(SIDE_BASE_VISUAL_META.width, 70);
assert.equal(SIDE_BASE_VISUAL_META.height, 44);
assert.equal(SIDE_BASE_VISUAL_META.enemyView, 'front');
assert.equal(SIDE_BASE_VISUAL_META.playerView, 'back');
assert.equal(SIDE_BASE_VISUAL_META.frontAsset, 'base_front.png');
assert.equal(SIDE_BASE_VISUAL_META.backAsset, 'base_back.png');
assert.equal(SIDE_BASE_VISUAL_META.transparentBackground, true);
assert.equal(SIDE_BASE_VISUAL_META.pixelArt, true);
assert.equal(SIDE_BASE_VISUAL_META.imageSmoothing, false);
assert.equal(SIDE_BASE_VISUAL_META.gameplayHitRadiusUnchanged, 22);
assert.match(SIDE_BASE_ASSET_PATHS.front, /assets\/structures\/side-base\/base_front\.png\?v=0\.6\.27$/);
assert.match(SIDE_BASE_ASSET_PATHS.back, /assets\/structures\/side-base\/base_back\.png\?v=0\.6\.27$/);

function assertTransparentPng(relativePath) {
  const buffer = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)));
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(buffer.subarray(0, 8).equals(signature), `${relativePath} deve ser PNG válido.`);
  let offset = 8;
  let colorType = null;
  let hasTransparencyChunk = false;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    if (type === 'IHDR') colorType = buffer[dataStart + 9];
    else if (type === 'tRNS') hasTransparencyChunk = true;
    offset = dataStart + length + 4;
    if (type === 'IEND') break;
  }
  assert.ok(colorType === 4 || colorType === 6 || hasTransparencyChunk, `${relativePath} precisa ter transparência real.`);
}

assertTransparentPng('../src/assets/structures/side-base/base_front.png');
assertTransparentPng('../src/assets/structures/side-base/base_back.png');

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
    `${base.id}: a troca de sprite não pode alterar mecânicas.`,
  );

  const structure = new SideBaseStructure({ ...base });
  assert.equal(structure.hitRadius, 22, `${base.id}: colisão deve continuar em 22.`);
  const ctx = makeCtx();
  structure.draw(ctx, GAME_CONFIG.palette);
  const draw = ctx.calls.find(({ type }) => type === 'drawImage');
  assert.ok(draw, `${base.id}: deve usar sprite PNG.`);

  if (base.team === 'enemy') {
    assert.match(draw.args[0].src, /base_front\.png\?v=0\.6\.27$/, `${base.id}: inimigo deve mostrar a frente.`);
  } else {
    assert.match(draw.args[0].src, /base_back\.png\?v=0\.6\.27$/, `${base.id}: jogador deve mostrar as costas.`);
  }

  assert.equal(draw.args[3], 70, `${base.id}: largura visual deve ser 70.`);
  assert.equal(draw.args[4], 44, `${base.id}: altura visual deve ser 44.`);
  assert.equal(ctx.imageSmoothingEnabled, false, `${base.id}: pixel art sem suavização.`);
}

console.log('side-base-visual.test.js: PASS');
