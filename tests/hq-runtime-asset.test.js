import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GAME_CONFIG } from '../src/config.js';

const assignedSources = [];

class FakeImage {
  constructor() {
    this.complete = true;
    this.naturalWidth = 128;
    this.naturalHeight = 78;
    this._src = '';
    this.onerror = null;
  }

  set src(value) {
    this._src = value;
    assignedSources.push(value);
    this.complete = true;
    this.naturalWidth = 128;
    this.naturalHeight = 78;
  }

  get src() {
    return this._src;
  }
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function validatePng(buffer, label) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.ok(buffer.subarray(0, 8).equals(signature), `${label}: assinatura PNG inválida.`);

  let offset = 8;
  let sawIHDR = false;
  let sawIDAT = false;
  let sawIEND = false;

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const crcOffset = dataEnd;
    const chunkEnd = crcOffset + 4;

    assert.ok(chunkEnd <= buffer.length, `${label}: chunk PNG truncado.`);

    const type = buffer.toString('ascii', typeStart, dataStart);
    const storedCrc = buffer.readUInt32BE(crcOffset);
    const calculatedCrc = crc32(buffer.subarray(typeStart, dataEnd));
    assert.equal(calculatedCrc, storedCrc, `${label}: CRC inválido no chunk ${type}.`);

    if (type === 'IHDR') {
      sawIHDR = true;
      assert.equal(length, 13, `${label}: IHDR deve ter 13 bytes.`);
      assert.equal(buffer.readUInt32BE(dataStart), 128, `${label}: largura deve ser 128 px.`);
      assert.equal(buffer.readUInt32BE(dataStart + 4), 78, `${label}: altura deve ser 78 px.`);
      assert.ok([3, 6].includes(buffer[dataStart + 9]), `${label}: sprite deve preservar transparência via paleta ou RGBA.`);
    }
    if (type === 'IDAT') sawIDAT = true;
    if (type === 'IEND') {
      sawIEND = true;
      offset = chunkEnd;
      break;
    }

    offset = chunkEnd;
  }

  assert.ok(sawIHDR, `${label}: IHDR ausente.`);
  assert.ok(sawIDAT, `${label}: IDAT ausente.`);
  assert.ok(sawIEND, `${label}: IEND ausente.`);
  assert.equal(offset, buffer.length, `${label}: bytes extras após IEND.`);
}

globalThis.Image = FakeImage;
const {
  HeadquartersStructure,
  HQ_RUNTIME_ASSET_PATHS,
  HQ_RUNTIME_ASSET_FALLBACKS,
  HQ_RUNTIME_META,
} = await import('../src/entities/HeadquartersStructure.js?hq-runtime-v0626');
delete globalThis.Image;

assert.match(HQ_RUNTIME_ASSET_PATHS.player, /assets\/structures\/hq_back\.png\?v=0\.6\.26&hq=player-back-restored$/);
assert.equal(HQ_RUNTIME_ASSET_FALLBACKS.player.length, 1);
assert.match(HQ_RUNTIME_ASSET_FALLBACKS.player[0], /assets\/structures\/hq\/hq_back\.png\?v=0\.6\.26&hq=player-back-restored-nested$/);
assert.equal(HQ_RUNTIME_META.playerView, 'back');
assert.equal(HQ_RUNTIME_META.restoredFromOriginalSheet, true);

const directBuffer = readFileSync(fileURLToPath(new URL('../src/assets/structures/hq_back.png', import.meta.url)));
const nestedBuffer = readFileSync(fileURLToPath(new URL('../src/assets/structures/hq/hq_back.png', import.meta.url)));

assert.ok(directBuffer.equals(nestedBuffer), 'As duas rotas devem apontar byte a byte para o mesmo sprite traseiro restaurado.');
validatePng(directBuffer, 'hq_back.png direto');
validatePng(nestedBuffer, 'hq_back.png canônico');

function makeCtx() {
  const calls = [];
  return {
    calls,
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    fillRect(...args) { calls.push({ type: 'fillRect', args }); },
    fillText(...args) { calls.push({ type: 'fillText', args }); },
    drawImage(...args) { calls.push({ type: 'drawImage', args }); },
    save() {},
    restore() {},
  };
}

const playerData = GAME_CONFIG.structures.find(({ id }) => id === 'player-hq');
const playerHq = new HeadquartersStructure({ ...playerData });
playerHq.active = true;

const ctx = makeCtx();
playerHq.draw(ctx, GAME_CONFIG.palette);
const draw = ctx.calls.find(({ type }) => type === 'drawImage');

assert.ok(draw, 'O QG do jogador deve ser desenhado pelo PNG restaurado.');
assert.match(draw.args[0].src, /hq_back\.png\?v=0\.6\.26&hq=player-back-restored$/);
assert.equal(ctx.imageSmoothingEnabled, false, 'O sprite traseiro deve continuar em pixel art sem suavização.');

console.log('hq-runtime-asset.test.js: PASS');
