import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/config.js';
import { Structure } from '../src/entities/Structure.js';
import { DeploymentSystem } from '../src/systems/Deployment.js';

const makeStructures = () => GAME_CONFIG.structures.map((data) => new Structure({ ...data }));
const deployment = new DeploymentSystem(GAME_CONFIG);

{
  const pocket = deployment.getPocketRect('player', 0);
  assert.equal(GAME_CONFIG.arenaGrid.columns, 18, 'A arena deve manter 18 tiles de largura.');
  assert.equal(GAME_CONFIG.arenaGrid.rows, 32, 'A arena deve manter 32 tiles de altura.');
  assert.equal(GAME_CONFIG.arenaGrid.tileSize, 20, 'Na resolução atual, cada tile deve medir 20 px.');
  assert.equal(pocket.width, 180, 'Cada pocket deve ocupar exatamente 9 tiles de largura.');
  assert.equal(pocket.height, 80, 'Cada pocket deve ocupar exatamente 4 tiles de profundidade.');
  assert.equal(pocket.y, GAME_CONFIG.river.top - 80, 'O pocket deve começar 4 tiles além do rio.');
}

{
  const structures = makeStructures();

  assert.equal(
    deployment.isDeployAllowed('player', 150, GAME_CONFIG.river.bottom + 1, structures),
    true,
    'O território normal deve encostar no barranco do rio, como no Clash Royale.',
  );

  assert.equal(
    deployment.isDeployAllowed('player', 80, 220, structures),
    false,
    'O pocket inimigo deve estar bloqueado no início.',
  );

  const enemyLeft = structures.find((item) => item.id === 'enemy-left');
  enemyLeft.hp = 0;

  assert.equal(
    deployment.isDeployAllowed('player', 80, 220, structures),
    true,
    'Destruir a base esquerda deve liberar quatro tiles no pocket esquerdo.',
  );

  assert.equal(
    deployment.isDeployAllowed('player', 80, 200, structures),
    false,
    'Destruir a base não deve liberar além dos 4 tiles do pocket.',
  );

  assert.equal(
    deployment.isDeployAllowed('player', 280, 220, structures),
    false,
    'O pocket direito deve continuar bloqueado enquanto a base direita estiver viva.',
  );

  assert.equal(
    deployment.isDeployAllowed('player', 88, 320, structures),
    false,
    'O rio continua proibido para mobilização.',
  );

  const enemyRight = structures.find((item) => item.id === 'enemy-right');
  enemyRight.hp = 0;

  assert.equal(
    deployment.isDeployAllowed('player', 280, 220, structures),
    true,
    'Destruir a base direita deve liberar quatro tiles no pocket direito.',
  );
}

{
  const structures = makeStructures();
  const playerLeft = structures.find((item) => item.id === 'player-left');
  playerLeft.hp = 0;

  assert.equal(
    deployment.isDeployAllowed('enemy', 80, 420, structures),
    true,
    'A regra de pocket deve funcionar simetricamente para o inimigo.',
  );

  assert.equal(
    deployment.isDeployAllowed('enemy', 80, 430, structures),
    false,
    'O inimigo também não deve liberar além da profundidade de 4 tiles.',
  );
}

console.log('deployment.test.js: PASS');
