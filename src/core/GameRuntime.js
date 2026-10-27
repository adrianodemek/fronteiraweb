import { Game as LegacyGame } from './Game.js?v=0.6.0';
import { Structure } from '../entities/Structure.js?v=0.6.20';

// Mantemos o Game base estável, mas recriamos as estruturas com a versão
// atual da classe. Isso evita que o navegador reutilize Structure.js de um
// cache antigo enquanto o restante da batalha já está em uma release nova.
export class Game extends LegacyGame {
  reset() {
    this.structures = this.config.structures.map((data) => new Structure({ ...data }));
    this.units = [];
    this.remaining = this.config.battleDuration;
    this.state = 'playing';
    this.result = '';
    this.enemySpawnClock = 1.8;
    this.enemyLane = 0;
    this.resourceDeniedFlash = 0;
    this.supplies.reset();
    this.cards.reset();
  }
}
