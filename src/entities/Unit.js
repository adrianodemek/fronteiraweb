import { distance, moveToward } from '../utils/math.js?v=0.6.1';

export class Unit {
  constructor({ team, x, y, lane, stats, config, type = 'rifleman' }) {
    this.team = team;
    this.x = x;
    this.y = y;
    this.lane = lane;
    this.type = type;
    this.config = config;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.attackRange = stats.attackRange;
    this.attackDelay = stats.attackDelay;
    this.aggroRange = stats.aggroRange;
    this.radius = stats.radius;
    this.splashRadius = stats.splashRadius ?? 0;
    this.splashFactor = stats.splashFactor ?? 0.6;
    this.visual = stats.visual ?? type;
    this.cooldown = 0;
    this.flash = 0;
    this.avoidance = null;
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

    if (currentSide !== 0 && currentSide === targetSide) return target;

    if (currentSide === 0) {
      if (!this.isInsideLaneBridge(this.x)) {
        return { x: bridgeX, y: this.y };
      }

      if (targetSide < 0) return { x: bridgeX, y: river.top - bankGap };
      if (targetSide > 0) return { x: bridgeX, y: river.bottom + bankGap };
      return target;
    }

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

  getStructureClearance(structure) {
    const structureRadius = structure.hitRadius ?? (structure.kind === 'hq' ? 28 : 22);
    return structureRadius + this.radius + 3;
  }

  separateFromStructures(structures) {
    // Duas passagens resolvem inclusive casos raros em que duas áreas sólidas
    // se encostam. A unidade sempre termina fora do volume físico da construção.
    for (let pass = 0; pass < 2; pass += 1) {
      for (const structure of structures) {
        const clearance = this.getStructureClearance(structure);
        let dx = this.x - structure.x;
        let dy = this.y - structure.y;
        let d = Math.hypot(dx, dy);

        if (d >= clearance) continue;

        if (d < 0.001) {
          dx = this.lane === 0 ? -1 : 1;
          dy = this.team === 'player' ? 0.65 : -0.65;
          d = Math.hypot(dx, dy);
        }

        this.x = structure.x + (dx / d) * clearance;
        this.y = structure.y + (dy / d) * clearance;
      }
    }
  }

  distanceToSegment(point, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const lengthSquared = abx * abx + aby * aby;

    if (lengthSquared <= 0.0001) return Math.hypot(point.x - ax, point.y - ay);

    const t = Math.max(0, Math.min(1, (
      (point.x - ax) * abx + (point.y - ay) * aby
    ) / lengthSquared));
    const px = ax + abx * t;
    const py = ay + aby * t;
    return Math.hypot(point.x - px, point.y - py);
  }

  findBlockingStructure(goal, structures, target) {
    const dx = goal.x - this.x;
    const dy = goal.y - this.y;
    const length = Math.hypot(dx, dy);
    if (length <= 0.001) return null;

    const nx = dx / length;
    const ny = dy / length;
    const lookAhead = Math.min(length, Math.max(34, this.speed * 0.9));
    const endX = this.x + nx * lookAhead;
    const endY = this.y + ny * lookAhead;
    let blocker = null;
    let blockerForwardDistance = Infinity;

    for (const structure of structures) {
      // O alvo principal não deve ser contornado: a distância de ataque já
      // inclui o volume físico dele e impede que a unidade entre na construção.
      if (structure === target) continue;

      const toObstacleX = structure.x - this.x;
      const toObstacleY = structure.y - this.y;
      const forward = toObstacleX * nx + toObstacleY * ny;
      const clearance = this.getStructureClearance(structure);

      if (forward < -clearance || forward > lookAhead + clearance) continue;

      const pathDistance = this.distanceToSegment(
        structure,
        this.x,
        this.y,
        endX,
        endY,
      );

      if (pathDistance <= clearance + 2 && forward < blockerForwardDistance) {
        blocker = structure;
        blockerForwardDistance = forward;
      }
    }

    return blocker;
  }

  chooseAvoidanceSide(blocker, goal) {
    if (this.avoidance?.structure === blocker) return this.avoidance.side;

    const dx = goal.x - this.x;
    const dy = goal.y - this.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = dx / length;
    const ny = dy / length;
    const px = -ny;
    const py = nx;
    const clearance = this.getStructureClearance(blocker) + 7;
    const margin = this.config.deployment?.edgeMargin ?? 10;

    const scoreSide = (side) => {
      const x = blocker.x + px * clearance * side;
      const y = blocker.y + py * clearance * side;
      let score = Math.hypot(x - this.x, y - this.y) + Math.hypot(goal.x - x, goal.y - y);

      if (x < margin + this.radius || x > this.config.width - margin - this.radius) score += 1000;
      if (
        y >= this.config.river.top
        && y <= this.config.river.bottom
        && !this.isInsideBridge(x)
      ) score += 1000;

      return score;
    };

    const leftScore = scoreSide(1);
    const rightScore = scoreSide(-1);
    let side;

    if (Math.abs(leftScore - rightScore) < 0.01) {
      // Desempate estável por lane para impedir troca de lado a cada frame.
      side = this.lane === 0 ? -1 : 1;
    } else {
      side = leftScore < rightScore ? 1 : -1;
    }

    this.avoidance = { structure: blocker, side };
    return side;
  }

  getStructureAvoidancePoint(goal, structures, target) {
    const blocker = this.findBlockingStructure(goal, structures, target);
    if (!blocker) {
      this.avoidance = null;
      return goal;
    }

    const dx = goal.x - this.x;
    const dy = goal.y - this.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = dx / length;
    const ny = dy / length;
    const px = -ny;
    const py = nx;
    const side = this.chooseAvoidanceSide(blocker, goal);
    const clearance = this.getStructureClearance(blocker) + 7;

    return {
      x: blocker.x + px * clearance * side + nx * 9,
      y: blocker.y + py * clearance * side + ny * 9,
    };
  }

  moveAvoidingStructures(goal, structures, target, amount) {
    this.separateFromStructures(structures);
    const waypoint = this.getStructureAvoidancePoint(goal, structures, target);
    moveToward(this, waypoint, amount);
    this.separateFromStructures(structures);
  }

  attack(target, units) {
    target.takeDamage(this.damage);

    if (this.splashRadius <= 0) return;

    const splashDamage = Math.max(1, Math.round(this.damage * this.splashFactor));
    for (const unit of units) {
      if (!unit.alive || unit.team === this.team || unit === target) continue;
      if (distance(unit, target) <= this.splashRadius) {
        unit.takeDamage(splashDamage);
      }
    }
  }

  update(dt, units, structures) {
    if (!this.alive) return;

    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.separateFromStructures(structures);

    const enemyUnit = this.getEnemyUnit(units);
    const target = enemyUnit ?? this.getEnemyStructure(structures);
    if (!target) return;

    // O raio da própria unidade entra no alcance físico. Assim ela ataca da
    // borda da construção e nunca precisa invadir o volume sólido do alvo.
    const reach = this.attackRange + this.radius + (target.hitRadius ?? target.radius ?? 0);
    const d = distance(this, target);

    if (d <= reach) {
      if (this.cooldown <= 0) {
        this.attack(target, units);
        this.cooldown = this.attackDelay;
        this.flash = 0.1;
      }
      return;
    }

    const navigationPoint = this.getNavigationPoint(target);
    this.moveAvoidingStructures(navigationPoint, structures, target, this.speed * dt);
  }

  drawEquipment(ctx, px, py, up, body, light) {
    const direction = up ? 1 : -1;

    if (this.visual === 'grenadier') {
      ctx.fillStyle = '#4a4031';
      ctx.fillRect(px - 7, py - 1, 4, 7);
      ctx.fillStyle = '#756247';
      ctx.fillRect(px + 4, py - 1, 4, 4);
      return;
    }

    if (this.visual === 'machinegun') {
      ctx.fillStyle = '#332d24';
      ctx.fillRect(px + 4 * direction, py - 2 * direction, 13 * direction, 3);
      ctx.fillStyle = '#242820';
      ctx.fillRect(px + 13 * direction, py - 3, 3, 6);
      ctx.fillRect(px + 8 * direction, py + 3, 2, 5);
      return;
    }

    if (this.visual === 'scout') {
      ctx.fillStyle = '#3c3429';
      ctx.fillRect(px + 3 * direction, py - 2 * direction, 9 * direction, 2);
      ctx.fillStyle = light;
      ctx.fillRect(px - 3, py - 8, 6, 2);
      return;
    }

    if (this.visual === 'medic') {
      ctx.fillStyle = '#e7e2cf';
      ctx.fillRect(px - 3, py - 1, 6, 6);
      ctx.fillStyle = '#a24f47';
      ctx.fillRect(px - 1, py, 2, 4);
      ctx.fillRect(px - 2, py + 1, 4, 2);
      return;
    }

    if (this.visual === 'engineer') {
      ctx.fillStyle = '#6c5d43';
      ctx.fillRect(px - 7, py - 2, 4, 8);
      ctx.fillStyle = '#353027';
      ctx.fillRect(px + 4 * direction, py, 8 * direction, 2);
      return;
    }

    if (this.visual === 'mortar') {
      ctx.fillStyle = '#353a31';
      ctx.fillRect(px - 7, py - 3, 4, 10);
      ctx.fillRect(px - 8, py - 5, 6, 3);
      return;
    }

    if (this.visual === 'assault') {
      ctx.fillStyle = '#332b22';
      ctx.fillRect(px + 4 * direction, py - 1 * direction, 9 * direction, 3);
      ctx.fillStyle = body;
      ctx.fillRect(px - 6, py + 2, 3, 4);
      return;
    }

    ctx.fillStyle = '#3b3329';
    if (up) {
      ctx.fillRect(px + 4, py - 3, 8, 2);
      ctx.fillRect(px + 10, py - 5, 2, 4);
    } else {
      ctx.fillRect(px - 12, py + 1, 8, 2);
      ctx.fillRect(px - 12, py, 2, 4);
    }
  }

  draw(ctx, palette) {
    if (!this.alive) return;

    const px = Math.round(this.x);
    const py = Math.round(this.y);
    const up = this.team === 'player';
    const body = this.team === 'player' ? palette.player : palette.enemy;
    const light = this.team === 'player' ? palette.playerLight : palette.enemyLight;
    const wide = this.visual === 'machinegun' || this.visual === 'mortar';
    const bodyWidth = wide ? 10 : 8;
    const halfBody = Math.round(bodyWidth / 2);

    ctx.fillStyle = 'rgba(24, 28, 22, 0.35)';
    ctx.fillRect(px - 6, py + 5, 12, 4);

    ctx.fillStyle = palette.outline;
    ctx.fillRect(px - halfBody - 1, py - 4, bodyWidth + 2, 10);

    ctx.fillStyle = this.flash > 0 ? light : body;
    ctx.fillRect(px - halfBody, py - 3, bodyWidth, 8);

    ctx.fillStyle = light;
    ctx.fillRect(px - 4, py - 7, 8, 4);
    ctx.fillStyle = palette.outline;
    ctx.fillRect(px - 5, py - 7, 10, 2);

    ctx.fillStyle = '#2b3029';
    ctx.fillRect(px - 5, py + 5, 3, 3);
    ctx.fillRect(px + 2, py + 5, 3, 3);

    this.drawEquipment(ctx, px, py, up, body, light);

    const ratio = this.hp / this.maxHp;
    if (ratio < 1) {
      ctx.fillStyle = '#202820';
      ctx.fillRect(px - 7, py - 12, 14, 3);
      ctx.fillStyle = '#9fbd69';
      ctx.fillRect(px - 6, py - 11, Math.round(12 * ratio), 1);
    }
  }
}
