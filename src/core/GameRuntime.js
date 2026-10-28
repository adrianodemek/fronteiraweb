import { Game as LegacyGame } from './Game.js?v=0.6.0';
import { Structure } from '../entities/Structure.js?v=0.6.23';
import { HeadquartersStructure } from '../entities/HeadquartersStructure.js?v=0.6.29';
import { SideBaseStructure } from '../entities/SideBaseStructure.js?v=0.6.34';
import {
  SIDE_BASE_DESTRUCTION_FX,
  getSideBaseShakeOffset,
} from '../effects/sideBaseDestructionFx.js?v=0.6.34';

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
    this.sideBaseShakeRemaining = 0;
    this.sideBaseAliveState = new Map(
      this.structures
        .filter((structure) => structure.kind === 'base')
        .map((structure) => [structure.id, structure.alive]),
    );
    this.supplies.reset();
    this.cards.reset();
  }

  update(dt) {
    this.sideBaseShakeRemaining = Math.max(0, (this.sideBaseShakeRemaining ?? 0) - dt);

    const aliveBeforeUpdate = new Map(
      this.structures
        .filter((structure) => structure.kind === 'base')
        .map((structure) => [
          structure.id,
          this.sideBaseAliveState?.get(structure.id) ?? structure.alive,
        ]),
    );

    super.update(dt);

    for (const structure of this.structures) {
      if (structure.kind !== 'base') continue;

      const wasAlive = aliveBeforeUpdate.get(structure.id) ?? structure.alive;
      const destroyedNow = wasAlive && !structure.alive;
      const pendingPulse = typeof structure.consumeDestructionShake === 'function'
        ? structure.consumeDestructionShake()
        : false;

      if (destroyedNow || pendingPulse) {
        this.sideBaseShakeRemaining = SIDE_BASE_DESTRUCTION_FX.shakeDuration;
        structure.destroyedFxAge = 0;
      }

      this.sideBaseAliveState?.set(structure.id, structure.alive);
    }
  }

  draw() {
    const { ctx } = this;
    const { width, height, palette } = this.config;
    const shake = getSideBaseShakeOffset(this.elapsed, this.sideBaseShakeRemaining ?? 0);

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    if (typeof ctx.translate === 'function') {
      ctx.translate(Math.round(shake.x), Math.round(shake.y));
    }

    this.battlefield.draw(ctx, this.elapsed);

    if (this.state === 'playing') {
      this.drawDeploymentZones();
    }

    for (const structure of this.structures) {
      structure.draw(ctx, palette);
    }

    const orderedUnits = [...this.units].sort((a, b) => a.y - b.y);
    for (const unit of orderedUnits) {
      unit.draw(ctx, palette);
    }

    ctx.restore();

    // HUD fica estável: somente o campo de batalha recebe a tremida suave.
    this.drawTopHud();
    this.drawCardHud();

    if (this.state === 'finished') this.drawResultOverlay();
  }
}
