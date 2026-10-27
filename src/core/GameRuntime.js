import { Game as LegacyGame } from './Game.js?v=0.6.0';
import { Structure } from '../entities/Structure.js?v=0.6.23';
import { HeadquartersStructure } from '../entities/HeadquartersStructure.js?v=0.6.26';

// Mantemos a lógica das estruturas estável, mas os QGs usam uma classe visual
// dedicada. Isso fixa explicitamente player-hq na visão de costas e enemy-hq
// na visão frontal, sem alterar HP, alcance, colisão ou posição lógica.
export class Game extends LegacyGame {
  reset() {
    this.structures = this.config.structures.map((data) => {
      const StructureClass = data.kind === 'hq' ? HeadquartersStructure : Structure;
      return new StructureClass({ ...data });
    });
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
