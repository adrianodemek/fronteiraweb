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
    deployment.isDeployAllowed('player', 80, 220, structures),
    false,
    'O território inimigo não pode estar liberado no início.',
  );

  const enemyLeft = structures.find((item) => item.id === 'enemy-left');
  enemyLeft.hp = 0;

  assert.equal(
    deployment.isDeployAllowed('player', 80, 220, structures),
    true,
    'Destruir a base esquerda deve liberar a metade esquerda inimiga.',
  );

  assert.equal(
    deployment.isDeployAllowed('player', 280, 220, structures),
    false,
    'A metade direita deve continuar bloqueada enquanto a base direita estiver viva.',
  );

  assert.equal(
    deployment.isDeployAllowed('player', 88, 320, structures),
    false,
    'O rio continua proibido para mobilização.',
  );

  assert.equal(
    deployment.isDeployAllowed('player', 170, 95, structures),
    false,
    'Não deve ser possível mobilizar sobre uma estrutura inimiga viva.',
  );

  const enemyRight = structures.find((item) => item.id === 'enemy-right');
  enemyRight.hp = 0;

  assert.equal(
    deployment.isDeployAllowed('player', 280, 220, structures),
    true,
    'Destruir a base direita deve liberar também a metade direita inimiga.',
  );
}

{
  // A mesma regra já fica pronta para o futuro adversário/multiplayer.
  const structures = makeStructures();
  const playerLeft = structures.find((item) => item.id === 'player-left');
  playerLeft.hp = 0;

  assert.equal(
    deployment.isDeployAllowed('enemy', 80, 420, structures),
    true,
    'A regra de território avançado deve funcionar simetricamente para o inimigo.',
  );
}

console.log('deployment.test.js: PASS');
