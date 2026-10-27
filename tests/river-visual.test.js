import assert from 'node:assert/strict';
import { Battlefield } from '../src/world/Battlefield.js';
import { Ground16Renderer, GROUND_SPRITE_META } from '../src/world/Ground16Renderer.js';
import { RiverRenderer, RIVER_SPRITE_META } from '../src/world/RiverRenderer.js';
import { WATER_SHEET } from '../src/assets/river/water/sheet.js';
import { TOP_BANK_SHEET } from '../src/assets/river/banks/top/sheet.js';
import { BOTTOM_BANK_SHEET } from '../src/assets/river/banks/bottom/sheet.js';
import { ROCK_SHEET, ROCK_FRAME_WIDTH } from '../src/assets/river/rocks/sheet.js';
import { RIVER_ROCK_LAYOUT } from '../src/assets/river/rocks/layout.js';
import { GROUND_BASE_TILES } from '../src/assets/ground/v1/base/tiles.js';
import { RIVER_EDGE_TILES } from '../src/assets/ground/v1/transition/tiles.js';
import { GROUND_DETAIL_LAYOUT } from '../src/assets/ground/v1/details/layout.js';
import { GAME_CONFIG } from '../src/config.js';

assert.ok(WATER_SHEET.startsWith('data:image/png;base64,'), 'A água deve usar a folha PNG real em 16-bit.');
assert.ok(TOP_BANK_SHEET.startsWith('data:image/png;base64,'), 'A margem superior deve usar sprites reais.');
assert.ok(BOTTOM_BANK_SHEET.startsWith('data:image/png;base64,'), 'A margem inferior deve usar sprites reais.');
assert.ok(ROCK_SHEET.startsWith('data:image/png;base64,'), 'As pedras devem usar a folha PNG real em 16-bit.');
assert.equal(RIVER_SPRITE_META.waterFrames, 6, 'A animação da água deve possuir 6 frames.');
assert.equal(RIVER_SPRITE_META.waterFrameSeconds, 0.22, 'A animação da água deve permanecer suave.');
assert.equal(RIVER_SPRITE_META.waterScrollSpeed, 3, 'O reflexo da água deve se mover lentamente.');
assert.equal(RIVER_SPRITE_META.waterFrameWidth, 128, 'A água não pode ser esmagada horizontalmente em tiles pequenos.');
assert.equal(RIVER_SPRITE_META.waterFrameHeight, 24, 'O frame da água deve preservar toda a altura do rio.');
assert.equal(RIVER_SPRITE_META.bankTiles, 6, 'Cada margem deve possuir 6 variações fixas.');
assert.equal(RIVER_SPRITE_META.bankSourceWidth, 64, 'As margens devem usar recorte proporcional 64x16.');
assert.equal(RIVER_SPRITE_META.bankTileHeight, 16, 'A margem deve ser fina e não cobrir o centro do rio.');
assert.equal(RIVER_SPRITE_META.bankOverlap, 4, 'Cada margem deve avançar somente 4 px para dentro da água.');
assert.equal(RIVER_SPRITE_META.rockFrames, 4, 'A decoração deve possuir 4 sprites de pedra.');
assert.equal(RIVER_SPRITE_META.rockCount, RIVER_ROCK_LAYOUT.length, 'O renderer deve usar o layout de pedras separado.');
assert.ok(RIVER_ROCK_LAYOUT.length >= 8, 'O rio deve ter pedras fixas nas duas margens.');
assert.equal(RIVER_SPRITE_META.blendSprites, 18, 'As duas margens devem receber vegetação de transição irregular.');
assert.equal(RIVER_SPRITE_META.fringeStep, 8, 'A franja de grama/terra deve quebrar a linha reta da margem em passos curtos.');
assert.equal(RIVER_SPRITE_META.bridgeBlendPadding, 12, 'A transição deve manter folga visual ao redor das pontes.');

const riverHeight = GAME_CONFIG.river.bottom - GAME_CONFIG.river.top;
const visibleWaterHeight = riverHeight - RIVER_SPRITE_META.bankOverlap * 2;
assert.ok(visibleWaterHeight >= 16, 'A água animada precisa permanecer visível entre as duas margens.');

for (const rock of RIVER_ROCK_LAYOUT) {
  assert.ok(rock.side === 'top' || rock.side === 'bottom', 'Cada pedra deve indicar a margem em que fica.');
  const halfWidth = (ROCK_FRAME_WIDTH * (rock.scale ?? 1)) / 2;
  for (const bridgeX of GAME_CONFIG.bridges) {
    const bridgeHalf = GAME_CONFIG.bridgeWidth / 2;
    assert.ok(
      Math.abs(rock.x - bridgeX) > bridgeHalf + halfWidth,
      `A pedra em x=${rock.x} invade visualmente a ponte em x=${bridgeX}.`,
    );
  }
}

assert.equal(GROUND_BASE_TILES.length, 4, 'O chão deve ter 4 variações discretas de grama.');
assert.equal(RIVER_EDGE_TILES.length, 4, 'A transição com o rio deve ter 4 variações.');
assert.equal(GROUND_SPRITE_META.baseTiles, 4, 'O renderer deve expor as 4 variações de chão.');
assert.equal(GROUND_SPRITE_META.baseTilePixels, 8, 'Os tiles do chão devem usar grade pixel-art 8x8.');
assert.equal(GROUND_SPRITE_META.baseTileRenderSize, 32, 'Cada tile deve ocupar 32 px no mapa.');
assert.equal(GROUND_SPRITE_META.transitionTiles, 4, 'O renderer deve usar as 4 transições do rio.');
assert.equal(GROUND_SPRITE_META.transitionHeight, 12, 'A transição deve ser estreita e discreta.');
assert.equal(GROUND_SPRITE_META.detailCount, GROUND_DETAIL_LAYOUT.length, 'Os detalhes devem vir de layout separado.');
assert.ok(GROUND_DETAIL_LAYOUT.length <= 12, 'O chão não deve ficar poluído com decoração.');

const renderer = new RiverRenderer(GAME_CONFIG);
assert.equal(renderer.getWaterFrameIndex(0), 0, 'A água deve começar no primeiro frame.');
assert.equal(renderer.getWaterFrameIndex(0.23), 1, 'A água deve avançar suavemente para o segundo frame.');
assert.equal(renderer.getWaterFrameIndex(1.11), 5, 'A água deve alcançar o sexto frame.');
assert.equal(renderer.getWaterFrameIndex(1.33), 0, 'A animação deve voltar ao primeiro frame em loop.');
for (const bridgeX of GAME_CONFIG.bridges) {
  assert.equal(renderer.isNearBridge(bridgeX), true, 'A área central da ponte deve permanecer livre de vegetação de transição.');
}
assert.equal(renderer.isNearBridge(180), false, 'A região central entre as pontes deve aceitar transição natural.');

const drawCalls = [];
const ctx = {
  fillStyle: '',
  globalAlpha: 1,
  imageSmoothingEnabled: true,
  save() {},
  restore() {},
  fillRect(...args) { drawCalls.push(['fillRect', ...args]); },
  drawImage(...args) { drawCalls.push(['drawImage', ...args]); },
};

const groundRenderer = new Ground16Renderer(GAME_CONFIG);
assert.doesNotThrow(() => groundRenderer.draw(ctx));
assert.ok(drawCalls.some(([type]) => type === 'fillRect'), 'O chão 16-bit deve desenhar tiles pixelados.');

drawCalls.length = 0;
assert.doesNotThrow(() => renderer.draw(ctx, 0.3));
assert.ok(drawCalls.some(([type]) => type === 'fillRect'), 'O fallback do rio deve desenhar água e franja enquanto os sprites carregam.');

renderer.water = { complete: true, naturalWidth: 768 };
renderer.topBank = { complete: true, naturalWidth: 384 };
renderer.bottomBank = { complete: true, naturalWidth: 384 };
renderer.rocks = { complete: true, naturalWidth: 112 };
renderer.groundDetails = { complete: true, naturalWidth: 216 };
drawCalls.length = 0;
assert.doesNotThrow(() => renderer.draw(ctx, 0.3));
assert.ok(
  drawCalls.filter(([type]) => type === 'drawImage').length >= 30,
  'O rio deve desenhar água, margens, pedras e vegetação de transição usando sprites reais.',
);

const battlefield = new Battlefield(GAME_CONFIG);
drawCalls.length = 0;
assert.doesNotThrow(() => battlefield.draw(ctx, 0.5));
assert.ok(drawCalls.some(([type]) => type === 'fillRect'), 'O campo deve incluir o chão 16-bit.');

console.log('river-visual.test.js: PASS');
