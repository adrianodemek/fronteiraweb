import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/config.js';
import { HQ_FRONT_PERSPECTIVE_SPRITE } from '../src/assets/structures/hq/hq_front_perspective.sprite.js';
import { HQ_BACK_PERSPECTIVE_SPRITE } from '../src/assets/structures/hq/hq_back_perspective.sprite.js';

const createdSpriteCanvases = [];

globalThis.document = {
  createElement(tag) {
    assert.equal(tag, 'canvas');
    const paintCalls = [];
    const spriteCanvas = {
      width: 0,
      height: 0,
      __hqView: '',
      paintCalls,
      getContext() {
        return {
          fillStyle: '',
          imageSmoothingEnabled: true,
          fillRect(...args) { paintCalls.push({ color: this.fillStyle, args }); },
        };
      },
    };
    createdSpriteCanvases.push(spriteCanvas);
    return spriteCanvas;
  },
};

const {
  HeadquartersStructure,
  HQ_RUNTIME_META,
  createHqSpriteCanvas,
} = await import('../src/entities/HeadquartersStructure.js?hq-runtime-v0629');

delete globalThis.document;

for (const [name, sprite] of [
  ['frontal', HQ_FRONT_PERSPECTIVE_SPRITE],
  ['traseiro', HQ_BACK_PERSPECTIVE_SPRITE],
]) {
  assert.equal(sprite.width, 96, `Sprite ${name} deve ter 96 px de largura.`);
  assert.equal(sprite.height, 60, `Sprite ${name} deve ter 60 px de altura.`);
  assert.equal(sprite.pixels.length, 96 * 60, `Sprite ${name} deve ter uma célula por pixel.`);
  assert.equal(sprite.palette.length % 6, 0, `Paleta do sprite ${name} deve estar íntegra.`);
  assert.ok(sprite.visiblePixelCount > 4000, `Sprite ${name} precisa ter mais de 4000 pixels visíveis.`);
  assert.equal(sprite.perspective, 'map-top-down-corrected');
  assert.equal(sprite.storageFormat, 'text-palette-grid');
}

assert.equal(HQ_RUNTIME_META.enemyView, 'front');
assert.equal(HQ_RUNTIME_META.playerView, 'back');
assert.equal(HQ_RUNTIME_META.sourceWidth, 96);
assert.equal(HQ_RUNTIME_META.sourceHeight, 60);
assert.equal(HQ_RUNTIME_META.renderWidth, 140);
assert.equal(HQ_RUNTIME_META.renderHeight, 88);
assert.equal(HQ_RUNTIME_META.perspective, 'map-top-down-corrected');
assert.equal(HQ_RUNTIME_META.gameplayUnchanged, true);
assert.equal(HQ_RUNTIME_META.release, '0.6.29');

const validationCanvas = (() => {
  globalThis.document = {
    createElement() {
      const paintCalls = [];
      return {
        width: 0,
        height: 0,
        paintCalls,
        getContext() {
          return {
            fillStyle: '',
            imageSmoothingEnabled: true,
            fillRect(...args) { paintCalls.push({ color: this.fillStyle, args }); },
          };
        },
      };
    },
  };
  const result = createHqSpriteCanvas(HQ_FRONT_PERSPECTIVE_SPRITE, 'front-validation');
  delete globalThis.document;
  return result;
})();
assert.ok(validationCanvas.paintCalls.length > 1500, 'A arte frontal precisa reconstruir muitos trechos reais de pixels.');

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
const enemyData = GAME_CONFIG.structures.find(({ id }) => id === 'enemy-hq');

assert.deepEqual(
  { x: playerData.x, y: playerData.y, hp: playerData.hp, range: playerData.range, damage: playerData.damage, attackDelay: playerData.attackDelay, startsActive: playerData.startsActive },
  { x: 180, y: 573, hp: 2200, range: 92, damage: 26, attackDelay: 0.9, startsActive: false },
);
assert.deepEqual(
  { x: enemyData.x, y: enemyData.y, hp: enemyData.hp, range: enemyData.range, damage: enemyData.damage, attackDelay: enemyData.attackDelay, startsActive: enemyData.startsActive },
  { x: 180, y: 135, hp: 2200, range: 92, damage: 26, attackDelay: 0.9, startsActive: false },
);

const playerHq = new HeadquartersStructure({ ...playerData });
const enemyHq = new HeadquartersStructure({ ...enemyData });
playerHq.active = true;
enemyHq.active = true;

assert.equal(playerHq.hitRadius, 28);
assert.equal(enemyHq.hitRadius, 28);

const playerCtx = makeCtx();
const enemyCtx = makeCtx();
playerHq.draw(playerCtx, GAME_CONFIG.palette);
enemyHq.draw(enemyCtx, GAME_CONFIG.palette);

const playerDraw = playerCtx.calls.find(({ type }) => type === 'drawImage');
const enemyDraw = enemyCtx.calls.find(({ type }) => type === 'drawImage');

assert.ok(playerDraw, 'QG do jogador deve usar o novo sprite.');
assert.ok(enemyDraw, 'QG inimigo deve usar o novo sprite.');
assert.equal(playerDraw.args[0].__hqView, 'back', 'Jogador deve mostrar as costas do QG.');
assert.equal(enemyDraw.args[0].__hqView, 'front', 'Inimigo deve mostrar a frente do QG.');
assert.deepEqual(playerDraw.args.slice(1), [110, 558, 140, 88]);
assert.deepEqual(enemyDraw.args.slice(1), [110, 62, 140, 88]);
assert.equal(playerCtx.imageSmoothingEnabled, false);
assert.equal(enemyCtx.imageSmoothingEnabled, false);

console.log('hq-runtime-asset.test.js: PASS');
