import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GAME_CONFIG } from '../src/config.js';

class FakeImage {
  constructor() {
    this.complete = true;
    this.naturalWidth = 128;
    this.naturalHeight = 80;
    this.decoding = '';
    this._src = '';
  }

  set src(value) {
    this._src = value;
  }

  get src() {
    return this._src;
  }
}

globalThis.Image = FakeImage;
const { Structure, HQ_ASSET_PATHS, HQ_VISUAL_META } = await import('../src/entities/Structure.js?hq-visual-v0623');

delete globalThis.Image;

assert.equal(HQ_VISUAL_META.width, 140, 'O QG deve continuar claramente maior que as bases laterais sem dominar o mapa.');
assert.equal(HQ_VISUAL_META.height, 88, 'O QG deve ser um pouco menor que na v0.6.22.');
assert.ok(HQ_VISUAL_META.width >= 44 * 3, 'O QG deve ter pelo menos 3x a largura visual da base lateral.');
assert.equal(HQ_VISUAL_META.fieldInsetY, 15, 'A âncora visual deve respeitar o recuo de perspectiva do campo.');
assert.equal(HQ_VISUAL_META.sameVisualSizeBothTeams, true, 'Os dois QGs precisam ter exatamente o mesmo tamanho visual.');
assert.equal(HQ_VISUAL_META.mapPerspective, 'outward-from-center');
assert.equal(HQ_VISUAL_META.placementMode, 'team-outward-ground-anchor');
assert.equal(HQ_VISUAL_META.spriteBased, true);
assert.equal(HQ_VISUAL_META.assetDirectory, 'src/assets/structures/hq/');
assert.equal(HQ_VISUAL_META.enemyView, 'front', 'O inimigo deve mostrar a frente do QG voltada ao centro.');
assert.equal(HQ_VISUAL_META.playerView, 'back', 'O jogador deve mostrar as costas do QG voltado ao centro.');
assert.equal(HQ_VISUAL_META.frontAsset, 'hq_front.png');
assert.equal(HQ_VISUAL_META.backAsset, 'hq_back.png');
assert.equal(HQ_VISUAL_META.transparentBackground, true);
assert.equal(HQ_VISUAL_META.pixelArt, true);
assert.equal(HQ_VISUAL_META.imageSmoothing, false, 'Pixel art 16-bit não deve receber suavização do canvas.');
assert.equal(HQ_VISUAL_META.cannonMount, true, 'A plataforma superior deve ficar reservada ao canhão.');
assert.equal(HQ_VISUAL_META.separateCannonSprite, true, 'O canhão futuro precisa ser uma camada separada e rotacionável.');
assert.equal(HQ_VISUAL_META.cannonIncludedInSprite, false);
assert.equal(HQ_VISUAL_META.flagIncluded, false);
assert.equal(HQ_VISUAL_META.antennaIncluded, false);
assert.match(HQ_ASSET_PATHS.front, /assets\/structures\/hq\/hq_front\.png\?v=0\.6\.23$/);
assert.match(HQ_ASSET_PATHS.back, /assets\/structures\/hq\/hq_back\.png\?v=0\.6\.23$/);

function assertPngSupportsTransparency(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url);
  const buffer = readFileSync(fileURLToPath(fileUrl));
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(buffer.subarray(0, 8).equals(signature), `${relativePath} deve ser um PNG válido.`);

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

  assert.ok(
    colorType === 4 || colorType === 6 || hasTransparencyChunk,
    `${relativePath} precisa conter canal alfa/transparência real no PNG.`,
  );
}

assertPngSupportsTransparency('../src/assets/structures/hq/hq_front.png');
assertPngSupportsTransparency('../src/assets/structures/hq/hq_back.png');

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
    fillRect(...args) { calls.push({ type: 'fillRect', color: this.fillStyle, args }); },
    fillText(...args) { calls.push({ type: 'fillText', color: this.fillStyle, args }); },
    drawImage(...args) { calls.push({ type: 'drawImage', args }); },
    save() { calls.push({ type: 'save' }); },
    restore() { calls.push({ type: 'restore' }); },
  };
}

const playerData = GAME_CONFIG.structures.find(({ id }) => id === 'player-hq');
const enemyData = GAME_CONFIG.structures.find(({ id }) => id === 'enemy-hq');

assert.deepEqual(
  { x: playerData.x, y: playerData.y, hp: playerData.hp, range: playerData.range, damage: playerData.damage, attackDelay: playerData.attackDelay, startsActive: playerData.startsActive },
  { x: 180, y: 573, hp: 2200, range: 92, damage: 26, attackDelay: 0.9, startsActive: false },
  'A mudança visual não pode alterar posição lógica, HP, alcance, dano, cadência ou ativação do QG do jogador.',
);
assert.deepEqual(
  { x: enemyData.x, y: enemyData.y, hp: enemyData.hp, range: enemyData.range, damage: enemyData.damage, attackDelay: enemyData.attackDelay, startsActive: enemyData.startsActive },
  { x: 180, y: 135, hp: 2200, range: 92, damage: 26, attackDelay: 0.9, startsActive: false },
  'A mudança visual não pode alterar posição lógica, HP, alcance, dano, cadência ou ativação do QG inimigo.',
);

const playerHq = new Structure({ ...playerData });
const enemyHq = new Structure({ ...enemyData });
playerHq.active = true;
enemyHq.active = true;

assert.equal(playerHq.hitRadius, 28, 'A perspectiva visual não pode mudar a colisão do QG.');
assert.equal(enemyHq.hitRadius, 28, 'Os dois QGs devem manter a mesma colisão.');

const playerCtx = makeCtx();
const enemyCtx = makeCtx();
playerHq.draw(playerCtx, GAME_CONFIG.palette);
enemyHq.draw(enemyCtx, GAME_CONFIG.palette);

const playerDraw = playerCtx.calls.find(({ type }) => type === 'drawImage');
const enemyDraw = enemyCtx.calls.find(({ type }) => type === 'drawImage');
assert.ok(playerDraw, 'O QG do jogador deve ser efetivamente desenhado com PNG.');
assert.ok(enemyDraw, 'O QG inimigo deve ser desenhado com PNG.');
assert.match(playerDraw.args[0].src, /hq_back\.png\?v=0\.6\.23$/, 'Jogador deve usar hq_back.png.');
assert.match(enemyDraw.args[0].src, /hq_front\.png\?v=0\.6\.23$/, 'Inimigo deve usar hq_front.png.');

assert.equal(playerDraw.args[1], 110, 'O QG do jogador deve permanecer centralizado no eixo X.');
assert.equal(enemyDraw.args[1], 110, 'O QG inimigo deve permanecer centralizado no eixo X.');
assert.equal(playerDraw.args[2], 558, 'O QG do jogador deve ser deslocado para trás das bases inferiores.');
assert.equal(enemyDraw.args[2], 62, 'O QG inimigo deve ser deslocado para trás das bases superiores.');
assert.equal(playerDraw.args[3], 140, 'O QG do jogador deve ser desenhado com 140 px de largura.');
assert.equal(playerDraw.args[4], 88, 'O QG do jogador deve ser desenhado com 88 px de altura.');
assert.equal(enemyDraw.args[3], 140, 'O QG inimigo deve ter exatamente a mesma largura.');
assert.equal(enemyDraw.args[4], 88, 'O QG inimigo deve ter exatamente a mesma altura.');
assert.equal(playerCtx.imageSmoothingEnabled, false, 'O canvas deve manter pixels definidos no QG do jogador.');
assert.equal(enemyCtx.imageSmoothingEnabled, false, 'O canvas deve manter pixels definidos no QG inimigo.');

console.log('hq-visual.test.js: PASS');
