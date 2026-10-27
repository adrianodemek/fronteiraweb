import assert from 'node:assert/strict';
import { Battlefield } from '../src/world/Battlefield.js';
import { GAME_CONFIG } from '../src/config.js';

const battlefield = new Battlefield(GAME_CONFIG);

assert.equal(battlefield.getWaterFrameIndex(0), 0, 'A água deve começar no primeiro frame.');
assert.equal(battlefield.getWaterFrameIndex(0.17), 1, 'A animação deve avançar para o segundo frame.');
assert.equal(battlefield.getWaterFrameIndex(0.99), 5, 'A animação deve alcançar o sexto frame.');
assert.equal(battlefield.getWaterFrameIndex(1), 0, 'A animação deve voltar ao primeiro frame em loop.');

const rocks = battlefield.getRiverRockLayout();
assert.ok(rocks.length >= 8, 'O rio deve ter pedras fixas distribuídas pelas duas margens.');
assert.ok(rocks.some((rock) => rock.side === 'top'), 'A margem superior deve ter pedras.');
assert.ok(rocks.some((rock) => rock.side === 'bottom'), 'A margem inferior deve ter pedras.');

for (const rock of rocks) {
  for (const bridgeX of GAME_CONFIG.bridges) {
    const minimumDistance = GAME_CONFIG.bridgeWidth / 2 + rock.width / 2;
    assert.ok(
      Math.abs(rock.x - bridgeX) > minimumDistance,
      `A pedra em x=${rock.x} invade visualmente a ponte em x=${bridgeX}.`,
    );
  }
}

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

// Sem Image no Node, o fallback precisa continuar desenhando sem quebrar.
assert.doesNotThrow(() => battlefield.draw(ctx, 0.5));
assert.ok(drawCalls.some(([type]) => type === 'fillRect'), 'O fallback do rio deve desenhar pixels.');

// Simula o atlas carregado e garante que o caminho de sprites é utilizado.
battlefield.riverAtlas = {};
battlefield.riverAtlasReady = true;
drawCalls.length = 0;
assert.doesNotThrow(() => battlefield.drawRiver(ctx, 0.5));
assert.ok(
  drawCalls.filter(([type]) => type === 'drawImage').length >= 10,
  'O rio 16-bit deve usar sprites para água e pedras quando o atlas estiver carregado.',
);

console.log('river-visual.test.js: PASS');
