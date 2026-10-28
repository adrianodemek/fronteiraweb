import { Game as LegacyGame } from './Game.js?v=0.6.0';
import { Structure } from '../entities/Structure.js?v=0.6.23';
import { HeadquartersStructure } from '../entities/HeadquartersStructure.js?v=0.6.26';
import { SideBaseStructure } from '../entities/SideBaseStructure.js?v=0.6.28';

// QGs e bases laterais usam classes visuais dedicadas, mantendo a lógica
// original de HP, alcance, colisão, dano, cadência e posição.
export class Game extends LegacyGame {
  reset() {
    this.structures = this.config.structures.map((data) => {
      const StructureClass = data.kind === 'hq'
        ? HeadquartersStructure
        : data.kind === 'base'
          ? SideBaseStructure
          : Structure;
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
