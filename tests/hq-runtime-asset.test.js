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

    // Simula exatamente o problema observado no Android/Pages:
    // a rota direta falha e o carregador deve cair automaticamente
    // para a cópia aninhada do MESMO sprite traseiro.
    if (value.includes('hq_back.png') && value.includes('player-back-direct')) {
      this.complete = true;
      this.naturalWidth = 0;
      this.naturalHeight = 0;
      this.onerror?.(new Error('primary route failed'));
      return;
    }

    this.complete = true;
    this.naturalWidth = 128;
    this.naturalHeight = 78;
  }

  get src() {
    return this._src;
  }
}

globalThis.Image = FakeImage;
const {
  HeadquartersStructure,
  HQ_RUNTIME_ASSET_PATHS,
  HQ_RUNTIME_ASSET_FALLBACKS,
  HQ_RUNTIME_META,
} = await import('../src/entities/HeadquartersStructure.js?hq-runtime-v0625');
delete globalThis.Image;

assert.match(HQ_RUNTIME_ASSET_PATHS.player, /assets\/structures\/hq_back\.png\?v=0\.6\.25&hq=player-back-direct$/);
assert.equal(HQ_RUNTIME_ASSET_FALLBACKS.player.length, 1);
assert.match(HQ_RUNTIME_ASSET_FALLBACKS.player[0], /assets\/structures\/hq\/hq_back\.png\?v=0\.6\.25&hq=player-back-nested$/);
assert.equal(HQ_RUNTIME_META.playerView, 'back');
assert.equal(HQ_RUNTIME_META.dualPathPlayerAsset, true);

assert.ok(
  assignedSources.some((src) => src.includes('player-back-direct')),
  'O carregador deve tentar primeiro a rota direta do sprite traseiro.',
);
assert.ok(
  assignedSources.some((src) => src.includes('player-back-nested')),
  'Se a rota direta falhar, o carregador deve tentar a rota aninhada automaticamente.',
);

const directBuffer = readFileSync(fileURLToPath(new URL('../src/assets/structures/hq_back.png', import.meta.url)));
const nestedBuffer = readFileSync(fileURLToPath(new URL('../src/assets/structures/hq/hq_back.png', import.meta.url)));
assert.ok(directBuffer.equals(nestedBuffer), 'As duas rotas devem apontar byte a byte para o mesmo sprite traseiro escolhido.');

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

assert.ok(draw, 'O QG do jogador deve ser desenhado por PNG após o fallback.');
assert.match(draw.args[0].src, /hq_back\.png\?v=0\.6\.25&hq=player-back-nested$/);
assert.equal(ctx.imageSmoothingEnabled, false, 'O sprite traseiro deve continuar em pixel art sem suavização.');

console.log('hq-runtime-asset.test.js: PASS');
