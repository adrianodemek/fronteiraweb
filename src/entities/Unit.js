import { distance, moveToward } from '../utils/math.js?v=0.1.5';

export class Unit {
  constructor({ team, x, y, lane, stats, config }) {
    this.team = team;
    this.x = x;
    this.y = y;
    this.lane = lane;
    this.config = config;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.attackRange = stats.attackRange;
    this.attackDelay = stats.attackDelay;
    this.aggroRange = stats.aggroRange;
    this.radius = stats.radius;
    this.cooldown = 0;
    this.flash = 0;
  }

  get alive() {
    return this.hp > 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.flash = 0.08;
  }

  getEnemyUnit(units) {
    let target = null;
    let best = Infinity;

    for (const unit of units) {
      if (!unit.alive || unit.team === this.team) continue;
      const d = distance(this, unit);
      if (d <= this.aggroRange && d < best) {
        best = d;
        target = unit;
      }
    }

    return target;
  }

  getEnemyStructure(structures) {
    const enemies = structures.filter((item) => item.alive && item.team !== this.team);
    if (!enemies.length) return null;

    const laneBase = enemies.find((item) => item.kind === 'base' && item.lane === this.lane);
    if (laneBase) return laneBase;

    const hq = enemies.find((item) => item.kind === 'hq');
    if (hq) return hq;

    return enemies.sort((a, b) => distance(this, a) - distance(this, b))[0];
  }

  getRiverSide(y) {
    const { river } = this.config;
    if (y < river.top) return -1;
    if (y > river.bottom) return 1;
    return 0;
  }

  getBridgeX() {
    return this.config.bridges[this.lane] ?? this.config.bridges[0];
  }

  isInsideBridge(x) {
    const halfWalkable = this.config.bridgeWidth / 2 - this.radius - 2;
    return this.config.bridges.some((bridgeX) => Math.abs(x - bridgeX) <= halfWalkable);
  }

  isInsideLaneBridge(x) {
    const halfWalkable = this.config.bridgeWidth / 2 - this.radius - 2;
    return Math.abs(x - this.getBridgeX()) <= halfWalkable;
  }

  getNavigationPoint(target) {
    const { river } = this.config;
    const bridgeX = this.getBridgeX();
    const currentSide = this.getRiverSide(this.y);
    const targetSide = this.getRiverSide(target.y);
    const bankGap = 7;

    // Mesmo lado: não há rio no caminho.
    if (currentSide !== 0 && currentSide === targetSide) return target;

    // Sobre a ponte: ela é terreno normal. Apenas mantemos a rota dentro da
    // abertura para que a unidade não tente cortar diagonalmente pela água.
    if (currentSide === 0) {
      if (!this.isInsideLaneBridge(this.x)) {
        return { x: bridgeX, y: this.y };
      }

      if (targetSide < 0) return { x: bridgeX, y: river.top - bankGap };
      if (targetSide > 0) return { x: bridgeX, y: river.bottom + bankGap };
      return target;
    }

    // De baixo para cima. Primeiro alinha horizontalmente com a ponte.
    // Depois de alcançar o barranco, continua sempre em frente — sem oscilar.
    if (currentSide > 0 && targetSide <= 0) {
      if (!this.isInsideLaneBridge(this.x)) {
        return { x: bridgeX, y: Math.max(this.y, river.bottom + bankGap) };
      }

      if (this.y > river.bottom + bankGap) {
        return { x: bridgeX, y: river.bottom + bankGap };
      }

      return targetSide === 0
        ? target
        : { x: bridgeX, y: river.top - bankGap };
    }

    // De cima para baixo, regra espelhada.
    if (currentSide < 0 && targetSide >= 0) {
      if (!this.isInsideLaneBridge(this.x)) {
        return { x: bridgeX, y: Math.min(this.y, river.top - bankGap) };
      }

      if (this.y < river.top - bankGap) {
        return { x: bridgeX, y: river.top - bankGap };
      }

      return targetSide === 0
        ? target
        : { x: bridgeX, y: river.bottom + bankGap };
    }

    return target;
  }

  update(dt, units, structures) {
    if (!this.alive) return;

    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flash = Math.max(0, this.flash - dt);

    const enemyUnit = this.getEnemyUnit(units);
    const target = enemyUnit ?? this.getEnemyStructure(structures);
    if (!target) return;

    // A ponte é chão comum: combate pode acontecer nela ou nas bordas.
    const reach = this.attackRange + (target.hitRadius ?? target.radius ?? 0);
    const d = distance(this, target);

    if (d <= reach) {
      if (this.cooldown <= 0) {
        target.takeDamage(this.damage);
        this.cooldown = this.attackDelay;
        this.flash = 0.1;
      }
      return;
    }

    const point = this.getNavigationPoint(target);
    moveToward(this, point, this.speed * dt);
  }

  draw(ctx, palette) {
    if (!this.alive) return;

    const px = Math.round(this.x);
    const py = Math.round(this.y);
    const up = this.team === 'player';
    const body = this.team === 'player' ? palette.player : palette.enemy;
    const light = this.team === 'player' ? palette.playerLight : palette.enemyLight;

    ctx.fillStyle = 'rgba(24, 28, 22, 0.35)';
    ctx.fillRect(px - 6, py + 5, 12, 4);

    ctx.fillStyle = palette.outline;
    ctx.fillRect(px - 5, py - 4, 10, 10);

    ctx.fillStyle = this.flash > 0 ? light : body;
    ctx.fillRect(px - 4, py - 3, 8, 8);

    ctx.fillStyle = light;
    ctx.fillRect(px - 4, py - 7, 8, 4);
    ctx.fillStyle = palette.outline;
    ctx.fillRect(px - 5, py - 7, 10, 2);

    ctx.fillStyle = '#2b3029';
    ctx.fillRect(px - 5, py + 5, 3, 3);
    ctx.fillRect(px + 2, py + 5, 3, 3);

    ctx.fillStyle = '#3b3329';
    if (up) {
      ctx.fillRect(px + 4, py - 3, 8, 2);
      ctx.fillRect(px + 10, py - 5, 2, 4);
    } else {
      ctx.fillRect(px - 12, py + 1, 8, 2);
      ctx.fillRect(px - 12, py, 2, 4);
    }

    const ratio = this.hp / this.maxHp;
    if (ratio < 1) {
      ctx.fillStyle = '#202820';
      ctx.fillRect(px - 7, py - 12, 14, 3);
      ctx.fillStyle = '#9fbd69';
      ctx.fillRect(px - 6, py - 11, Math.round(12 * ratio), 1);
    }
  }
}
