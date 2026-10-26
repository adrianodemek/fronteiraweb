import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/config.js';
import { Structure } from '../src/entities/Structure.js';
import { DeploymentSystem } from '../src/systems/Deployment.js';

const makeStructures = () => GAME_CONFIG.structures.map((data) => new Structure({ ...data }));
const deployment = new DeploymentSystem(GAME_CONFIG);

{
  const structures = makeStructures();

  assert.equal(
    deployment.isDeployAllowed('player', 150, 410, structures),
    true,
    'O jogador deve poder mobilizar no próprio território.',
  );

  assert.equal(
    deployment.isDeployAllowed('player', 80, 260, structures),
    false,
    'O pocket inimigo deve estar bloqueado no início.',
  );

  const enemyLeft = structures.find((item) => item.id === 'enemy-left');
  enemyLeft.hp = 0;

  assert.equal(
    deployment.isDeployAllowed('player', 80, 260, structures),
    true,
    'Destruir a base esquerda deve liberar o pocket esquerdo junto ao rio.',
  );

  assert.equal(
    deployment.isDeployAllowed('player', 80, 220, structures),
    false,
    'Destruir a base não deve liberar toda a metade inimiga, apenas o pocket.',
  );

  assert.equal(
    deployment.isDeployAllowed('player', 280, 260, structures),
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
    deployment.isDeployAllowed('player', 280, 260, structures),
    true,
    'Destruir a base direita deve liberar o pocket direito.',
  );
}

{
  const structures = makeStructures();
  const playerLeft = structures.find((item) => item.id === 'player-left');
  playerLeft.hp = 0;

  assert.equal(
    deployment.isDeployAllowed('enemy', 80, 380, structures),
    true,
    'A regra de pocket deve funcionar simetricamente para o inimigo.',
  );

  assert.equal(
    deployment.isDeployAllowed('enemy', 80, 430, structures),
    false,
    'O inimigo também não deve liberar além da profundidade do pocket.',
  );
}

console.log('deployment.test.js: PASS');
