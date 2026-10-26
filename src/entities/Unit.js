import { distance, moveToward } from '../utils/math.js?v=0.1.3';

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
    this.crossingRiver = false;
    this.crossedRiver = this.hasReachedEnemySide();
  }

  get alive() {
    return this.hp > 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.flash = 0.08;
  }

  hasReachedEnemySide() {
    const { river } = this.config;
    const margin = 12;

    return this.team === 'player'
      ? this.y <= river.top - margin
      : this.y >= river.bottom + margin;
  }

  targetIsOnHomeSide(target) {
    const { river } = this.config;

    return this.team === 'player'
      ? target.y > river.bottom
      : target.y < river.top;
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

  getBridgeRoute(target) {
    const { river, bridges } = this.config;
    const bridgeX = bridges[this.lane];
    const approachGap = 6;
    const exitGap = 12;

    if (this.crossedRiver) return null;

    if (this.hasReachedEnemySide()) {
      this.crossedRiver = true;
      this.crossingRiver = false;
      return null;
    }

    // Enquanto ainda está no próprio território, a unidade pode defender
    // contra um inimigo que já tenha atravessado. Fora desse caso, ela deve
    // obrigatoriamente usar a ponte da lane.
    if (!this.crossingRiver && this.targetIsOnHomeSide(target)) {
      return null;
    }

    const entry = this.team === 'player'
      ? { x: bridgeX, y: river.bottom + approachGap }
      : { x: bridgeX, y: river.top - approachGap };

    // A saída fica de fato dentro do campo adversário, e não apenas na borda
    // visual da ponte. A unidade só volta a procurar combate depois de chegar aqui.
    const exit = this.team === 'player'
      ? { x: bridgeX, y: river.top - exitGap }
      : { x: bridgeX, y: river.bottom + exitGap };

    if (!this.crossingRiver) {
      if (distance(this, entry) <= 2) {
        this.crossingRiver = true;
        return exit;
      }
      return entry;
    }

    return exit;
  }

  update(dt, units, structures) {
    if (!this.alive) return;

    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flash = Math.max(0, this.flash - dt);

    const enemyUnit = this.getEnemyUnit(units);
    const target = enemyUnit ?? this.getEnemyStructure(structures);
    if (!target) return;

    // Navegação pela ponte tem prioridade absoluta sobre combate. Isso evita
    // a tropa parar na borda do rio ao detectar um inimigo dentro do alcance.
    const bridgeRoute = this.getBridgeRoute(target);
    if (bridgeRoute) {
      moveToward(this, bridgeRoute, this.speed * dt);
      return;
    }

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

    moveToward(this, target, this.speed * dt);
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
