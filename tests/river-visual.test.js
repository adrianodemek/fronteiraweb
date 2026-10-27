import assert from 'node:assert/strict';
import { Battlefield } from '../src/world/Battlefield.js';
import { RiverRenderer, RIVER_SPRITE_META } from '../src/world/RiverRenderer.js';
import { WATER_SHEET } from '../src/assets/river/water/sheet.js';
import { TOP_BANK_SHEET } from '../src/assets/river/banks/top/sheet.js';
import { BOTTOM_BANK_SHEET } from '../src/assets/river/banks/bottom/sheet.js';
import { ROCK_SHEET, ROCK_FRAME_WIDTH } from '../src/assets/river/rocks/sheet.js';
import { RIVER_ROCK_LAYOUT } from '../src/assets/river/rocks/layout.js';
import { GAME_CONFIG } from '../src/config.js';

assert.ok(WATER_SHEET.startsWith('data:image/png;base64,'), 'A água deve usar a folha PNG real em 16-bit.');
assert.ok(TOP_BANK_SHEET.startsWith('data:image/png;base64,'), 'A margem superior deve usar sprites reais.');
assert.ok(BOTTOM_BANK_SHEET.startsWith('data:image/png;base64,'), 'A margem inferior deve usar sprites reais.');
assert.ok(ROCK_SHEET.startsWith('data:image/png;base64,'), 'As pedras devem usar a folha PNG real em 16-bit.');
assert.equal(RIVER_SPRITE_META.waterFrames, 6, 'A animação da água deve possuir 6 frames.');
assert.equal(RIVER_SPRITE_META.waterFrameWidth, 128, 'A água não pode ser esmagada horizontalmente em tiles pequenos.');
assert.equal(RIVER_SPRITE_META.waterFrameHeight, 24, 'O frame da água deve preservar toda a altura do rio.');
assert.equal(RIVER_SPRITE_META.bankTiles, 6, 'Cada margem deve possuir 6 variações fixas.');
assert.equal(RIVER_SPRITE_META.bankSourceWidth, 64, 'As margens devem usar recorte proporcional 64x16.');
assert.equal(RIVER_SPRITE_META.bankTileHeight, 16, 'A margem deve ser fina e não cobrir o centro do rio.');
assert.equal(RIVER_SPRITE_META.bankOverlap, 4, 'Cada margem deve avançar somente 4 px para dentro da água.');
assert.equal(RIVER_SPRITE_META.rockFrames, 4, 'A decoração deve possuir 4 sprites de pedra.');
assert.equal(RIVER_SPRITE_META.rockCount, RIVER_ROCK_LAYOUT.length, 'O renderer deve usar o layout de pedras separado.');
assert.ok(RIVER_ROCK_LAYOUT.length >= 8, 'O rio deve ter pedras fixas nas duas margens.');

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

const renderer = new RiverRenderer(GAME_CONFIG);
assert.equal(renderer.getWaterFrameIndex(0), 0, 'A água deve começar no primeiro frame.');
assert.equal(renderer.getWaterFrameIndex(0.13), 1, 'A água deve avançar para o segundo frame.');
assert.equal(renderer.getWaterFrameIndex(0.61), 5, 'A água deve alcançar o sexto frame.');
assert.equal(renderer.getWaterFrameIndex(0.73), 0, 'A animação deve voltar ao primeiro frame em loop.');

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

assert.doesNotThrow(() => renderer.draw(ctx, 0.3));
assert.ok(drawCalls.some(([type]) => type === 'fillRect'), 'O fallback do rio deve desenhar água enquanto os sprites carregam.');

renderer.water = { complete: true, naturalWidth: 768 };
renderer.topBank = { complete: true, naturalWidth: 384 };
renderer.bottomBank = { complete: true, naturalWidth: 384 };
renderer.rocks = { complete: true, naturalWidth: 112 };
drawCalls.length = 0;
assert.doesNotThrow(() => renderer.draw(ctx, 0.3));
assert.ok(
  drawCalls.filter(([type]) => type === 'drawImage').length >= 20,
  'O rio deve desenhar água animada, margens e pedras usando sprites reais.',
);

const battlefield = new Battlefield(GAME_CONFIG);
drawCalls.length = 0;
assert.doesNotThrow(() => battlefield.draw(ctx, 0.5));

console.log('river-visual.test.js: PASS');
