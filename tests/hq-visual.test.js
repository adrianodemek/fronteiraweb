import assert from 'node:assert/strict';
import { Structure, HQ_ASSET_PATHS, HQ_VISUAL_META } from '../src/entities/Structure.js';
import { GAME_CONFIG } from '../src/config.js';

assert.equal(HQ_VISUAL_META.width, 84, 'O QG deve ficar claramente maior que as bases laterais.');
assert.equal(HQ_VISUAL_META.height, 52, 'O sprite do QG deve manter a proporção horizontal selecionada.');
assert.equal(HQ_VISUAL_META.spriteBased, true);
assert.equal(HQ_VISUAL_META.enemyView, 'front', 'O inimigo deve mostrar a frente do QG ao jogador.');
assert.equal(HQ_VISUAL_META.playerView, 'back', 'O QG do jogador deve mostrar as costas.');
assert.equal(HQ_VISUAL_META.frontAsset, 'hq_front.png');
assert.equal(HQ_VISUAL_META.backAsset, 'hq_back.png');
assert.equal(HQ_VISUAL_META.cannonMount, true, 'A plataforma superior deve ficar reservada ao canhão.');
assert.equal(HQ_VISUAL_META.separateCannonSprite, true, 'O canhão futuro precisa ser uma camada separada e rotacionável.');
assert.equal(HQ_VISUAL_META.cannonMountOffsetY, -10, 'O ponto do canhão deve ficar sobre a plataforma superior.');
assert.match(HQ_ASSET_PATHS.front, /hq_front\.png/);
assert.match(HQ_ASSET_PATHS.back, /hq_back\.png/);

function makeCtx() {
  const calls = [];
  return {
    calls,
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    globalAlpha: 1,
    imageSmoothingEnabled: false,
    fillRect(...args) { calls.push({ type: 'fillRect', color: this.fillStyle, args }); },
    fillText(...args) { calls.push({ type: 'fillText', color: this.fillStyle, args }); },
    drawImage(...args) { calls.push({ type: 'drawImage', args }); },
    save() {},
    restore() {},
  };
}

const playerData = GAME_CONFIG.structures.find(({ id }) => id === 'player-hq');
const enemyData = GAME_CONFIG.structures.find(({ id }) => id === 'enemy-hq');
const playerHq = new Structure({ ...playerData });
const enemyHq = new Structure({ ...enemyData });
playerHq.active = true;
enemyHq.active = true;

assert.equal(playerHq.hitRadius, 28, 'O sprite novo não pode mudar a colisão do QG.');
assert.equal(enemyHq.hitRadius, 28, 'Os dois QGs devem manter a mesma colisão.');

const playerCtx = makeCtx();
const enemyCtx = makeCtx();
assert.doesNotThrow(() => playerHq.draw(playerCtx, GAME_CONFIG.palette));
assert.doesNotThrow(() => enemyHq.draw(enemyCtx, GAME_CONFIG.palette));
assert.ok(playerCtx.calls.length > 0, 'Deve existir fallback de desenho antes do PNG carregar.');
assert.ok(enemyCtx.calls.length > 0, 'Deve existir fallback de desenho antes do PNG carregar.');

console.log('hq-visual.test.js: PASS');
