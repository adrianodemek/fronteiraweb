import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { GAME_CONFIG } from '../src/config.js';

class FakeImage {
  constructor() {
    this.complete = true;
    this.naturalWidth = 64;
    this.naturalHeight = 40;
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
} = await import('../src/entities/SideBaseStructure.js?side-base-visual-v0628-svg');
delete globalThis.Image;

assert.equal(SIDE_BASE_VISUAL_META.width, 70);
assert.equal(SIDE_BASE_VISUAL_META.height, 44);
assert.equal(SIDE_BASE_VISUAL_META.sourceWidth, 64);
assert.equal(SIDE_BASE_VISUAL_META.sourceHeight, 40);
assert.equal(SIDE_BASE_VISUAL_META.enemyView, 'front');
assert.equal(SIDE_BASE_VISUAL_META.playerView, 'back');
assert.equal(SIDE_BASE_VISUAL_META.frontAsset, 'base_front.svg');
assert.equal(SIDE_BASE_VISUAL_META.backAsset, 'base_back.svg');
assert.equal(SIDE_BASE_VISUAL_META.embeddedPixelSprite, true);
assert.equal(SIDE_BASE_VISUAL_META.visiblePixelValidation, true);
assert.equal(SIDE_BASE_VISUAL_META.gameplayHitRadiusUnchanged, 22);
assert.match(SIDE_BASE_ASSET_PATHS.front, /base_front\.svg\?v=0\.6\.28$/);
assert.match(SIDE_BASE_ASSET_PATHS.back, /base_back\.svg\?v=0\.6\.28$/);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function extractEmbeddedPng(relativeSvgPath) {
  const svg = readFileSync(fileURLToPath(new URL(relativeSvgPath, import.meta.url)), 'utf8');
  assert.match(svg, /<svg[^>]+width="64"[^>]+height="40"/);
  const match = svg.match(/data:image\/png;base64,([^"']+)/);
  assert.ok(match, `${relativeSvgPath}: PNG embutido ausente.`);
  return Buffer.from(match[1], 'base64');
}

function assertPngHasVisiblePixels(buffer, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(buffer.subarray(0, 8).equals(signature), `${label}: PNG inválido.`);

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let transparency = null;
  const idat = [];

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    assert.ok(dataEnd + 4 <= buffer.length, `${label}: chunk truncado.`);

    if (type === 'IHDR') {
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8];
      colorType = buffer[dataStart + 9];
    } else if (type === 'tRNS') {
      transparency = buffer.subarray(dataStart, dataEnd);
    } else if (type === 'IDAT') {
      idat.push(buffer.subarray(dataStart, dataEnd));
    }

    offset = dataEnd + 4;
    if (type === 'IEND') break;
  }

  assert.equal(width, 64, `${label}: largura fonte incorreta.`);
  assert.equal(height, 40, `${label}: altura fonte incorreta.`);
  assert.equal(bitDepth, 8, `${label}: bit depth inesperado.`);
  assert.equal(colorType, 3, `${label}: o sprite deve ser PNG indexado.`);
  assert.ok(transparency, `${label}: transparência tRNS ausente.`);
  assert.ok(idat.length > 0, `${label}: IDAT ausente.`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width;
  const rows = [];
  let cursor = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[cursor++];
    const source = raw.subarray(cursor, cursor + stride);
    cursor += stride;
    const row = Buffer.alloc(stride);
    const previous = rows[y - 1] ?? Buffer.alloc(stride);

    for (let x = 0; x < stride; x += 1) {
      const left = x > 0 ? row[x - 1] : 0;
      const up = previous[x] ?? 0;
      const upperLeft = x > 0 ? previous[x - 1] : 0;
      const value = source[x];

      if (filter === 0) row[x] = value;
      else if (filter === 1) row[x] = (value + left) & 255;
      else if (filter === 2) row[x] = (value + up) & 255;
      else if (filter === 3) row[x] = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) row[x] = (value + paeth(left, up, upperLeft)) & 255;
      else assert.fail(`${label}: filtro PNG desconhecido ${filter}.`);
    }
    rows.push(row);
  }

  let visiblePixels = 0;
  let transparentPixels = 0;
  for (const row of rows) {
    for (const paletteIndex of row) {
      const alpha = paletteIndex < transparency.length ? transparency[paletteIndex] : 255;
      if (alpha > 0) visiblePixels += 1;
      else transparentPixels += 1;
    }
  }

  assert.ok(visiblePixels > 1500, `${label}: sprite precisa conter pixels visíveis reais.`);
  assert.ok(transparentPixels > 100, `${label}: fundo precisa continuar transparente.`);
}

assertPngHasVisiblePixels(
  extractEmbeddedPng('../src/assets/structures/side-base/base_front.svg'),
  'base_front.svg',
);
assertPngHasVisiblePixels(
  extractEmbeddedPng('../src/assets/structures/side-base/base_back.svg'),
  'base_back.svg',
);

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
  assert.ok(draw, `${base.id}: deve usar sprite.`);

  if (base.team === 'enemy') {
    assert.match(draw.args[0].src, /base_front\.svg\?v=0\.6\.28$/, `${base.id}: inimigo deve mostrar a frente.`);
  } else {
    assert.match(draw.args[0].src, /base_back\.svg\?v=0\.6\.28$/, `${base.id}: jogador deve mostrar as costas.`);
  }

  assert.equal(draw.args[3], 70);
  assert.equal(draw.args[4], 44);
  assert.equal(ctx.imageSmoothingEnabled, false);
}

console.log('side-base-visual.test.js: PASS');
