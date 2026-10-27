import assert from 'node:assert/strict';
import { Structure, HQ_VISUAL_META } from '../src/entities/Structure.js';
import { GAME_CONFIG } from '../src/config.js';

assert.equal(HQ_VISUAL_META.width, 64, 'O QG deve ficar mais largo que as bases laterais.');
assert.equal(HQ_VISUAL_META.height, 56, 'O QG deve manter proporção compacta de fortificação.');
assert.equal(HQ_VISUAL_META.roofHeight, 13, 'O telhado precisa ter leitura própria no sprite procedural.');
assert.equal(HQ_VISUAL_META.doorWidth, 14, 'A entrada frontal deve permanecer legível no mobile.');
assert.equal(HQ_VISUAL_META.fortified, true);
assert.equal(HQ_VISUAL_META.concreteBody, true);
assert.equal(HQ_VISUAL_META.sandbags, true);
assert.equal(HQ_VISUAL_META.radioMast, true);
assert.equal(HQ_VISUAL_META.terrainBlend, true);
assert.equal(HQ_VISUAL_META.factionAccentOnly, true);

function makeCtx() {
  const calls = [];
  return {
    calls,
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    fillRect(...args) { calls.push({ type: 'fillRect', color: this.fillStyle, args }); },
    fillText(...args) { calls.push({ type: 'fillText', color: this.fillStyle, args }); },
  };
}

const playerData = GAME_CONFIG.structures.find(({ id }) => id === 'player-hq');
const enemyData = GAME_CONFIG.structures.find(({ id }) => id === 'enemy-hq');
const playerHq = new Structure({ ...playerData });
const enemyHq = new Structure({ ...enemyData });
playerHq.active = true;
enemyHq.active = true;

assert.equal(playerHq.hitRadius, 28, 'O redesenho não pode mudar a colisão do QG.');
assert.equal(enemyHq.hitRadius, 28, 'Os dois QGs devem manter a mesma colisão.');

const playerCtx = makeCtx();
assert.doesNotThrow(() => playerHq.draw(playerCtx, GAME_CONFIG.palette));
assert.ok(playerCtx.calls.length > 65, 'O QG precisa ter detalhe visual suficiente para não parecer uma caixa simples.');
assert.ok(playerCtx.calls.some(({ color }) => color === '#77715f'), 'O corpo deve usar concreto envelhecido.');
assert.ok(playerCtx.calls.some(({ color }) => color === '#354032'), 'O QG do jogador deve ter cobertura militar escura.');
assert.ok(playerCtx.calls.some(({ color }) => color === GAME_CONFIG.palette.dirtDark), 'O QG deve se apoiar em solo batido.');
assert.ok(playerCtx.calls.some(({ color }) => color === GAME_CONFIG.palette.grassDark), 'A vegetação deve invadir discretamente a fundação.');
assert.ok(playerCtx.calls.some(({ color }) => color === GAME_CONFIG.palette.sandbag), 'A frente do QG deve ter sacos de areia.');
assert.ok(playerCtx.calls.some(({ color }) => color === GAME_CONFIG.palette.player), 'A facção do jogador deve aparecer nos detalhes de comando.');

const enemyCtx = makeCtx();
assert.doesNotThrow(() => enemyHq.draw(enemyCtx, GAME_CONFIG.palette));
assert.ok(enemyCtx.calls.some(({ color }) => color === '#3f3531'), 'O QG inimigo deve ter cobertura militar própria.');
assert.ok(enemyCtx.calls.some(({ color }) => color === GAME_CONFIG.palette.enemy), 'A facção inimiga deve aparecer nos detalhes de comando.');

console.log('hq-visual.test.js: PASS');
