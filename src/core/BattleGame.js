import { Game } from './GameRuntime.js?v=0.6.31';
import { GAME_CONFIG } from '../configRuntime.js?v=0.6.31';
import { Battlefield } from '../world/Battlefield.js?v=0.6.18';
import { BattleUnit } from '../entities/BattleUnit.js?v=0.6.11';
import { clamp } from '../utils/math.js?v=0.6.11';

export class BattleGame extends Game {
  constructor(canvas) {
    super(canvas);
    this.config = GAME_CONFIG;
    this.battlefield = new Battlefield(GAME_CONFIG);
    this.deployment.config = GAME_CONFIG;
    this.supplies.config = GAME_CONFIG;
    this.cards.config = GAME_CONFIG;
    this.reset();
  }

  spawnUnit(team, lane, x, y, unitType = 'rifleman') {
    if (this.units.length >= 70) return false;
    const unitTypes = this.config.unitTypes ?? {};
    const stats = unitTypes[unitType] ?? unitTypes.rifleman ?? this.config.infantry;
    if (!stats) return false;

    this.units.push(new BattleUnit({
      team,
      lane,
      x,
      y,
      type: unitType,
      stats,
      config: this.config,
    }));
    return true;
  }

  tryDeployUnit(team, x, y, cost = this.config.costs.infantry, unitType = 'rifleman') {
    if (this.state !== 'playing') return false;
    if (!this.deployment.isDeployAllowed(team, x, y, this.structures)) return false;

    if (!this.supplies.canSpend(team, cost)) {
      if (team === 'player') this.resourceDeniedFlash = 0.3;
      return false;
    }

    const lane = Math.abs(x - this.config.bridges[0]) <= Math.abs(x - this.config.bridges[1]) ? 0 : 1;
    const { edgeMargin } = this.config.deployment;
    const spawnX = clamp(x, edgeMargin, this.config.width - edgeMargin);
    const spawnY = clamp(y, this.config.battlefield.top + edgeMargin, this.config.battlefield.bottom - edgeMargin);

    const spawned = this.spawnUnit(team, lane, spawnX, spawnY, unitType);
    if (!spawned) return false;

    this.supplies.spend(team, cost);
    return true;
  }

  handlePointerDown(event) {
    event.preventDefault();

    if (this.state === 'finished') {
      this.reset();
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.config.width;
    const y = ((event.clientY - rect.top) / rect.height) * this.config.height;

    if (y >= this.config.hud.top) {
      const index = this.cards.getCardIndexAt(x, y);
      if (index >= 0) this.cards.select(index);
      return;
    }

    const card = this.cards.selectedCard;
    if (!card) return;

    const deployed = this.tryDeployUnit('player', x, y, card.cost, card.unitType ?? 'rifleman');
    if (deployed) this.cards.playSelected();
  }
}
