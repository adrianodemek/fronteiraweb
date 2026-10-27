import { Unit } from './Unit.js?v=0.6.2';
import { distance, moveToward } from '../utils/math.js?v=0.6.4';

export class BattleUnit extends Unit {
  constructor(options) {
    super(options);
    this.structureDetour = null;
  }

  getLineBlockingStructure(target, structures) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared <= 0.0001) return null;

    let blocker = null;
    let bestT = Infinity;

    for (const structure of structures) {
      if (structure === target) continue;

      const t = (
        (structure.x - this.x) * dx
        + (structure.y - this.y) * dy
      ) / lengthSquared;

      if (t <= 0.03 || t >= 0.97) continue;

      const closestX = this.x + dx * t;
      const closestY = this.y + dy * t;
      const structureRadius = structure.hitRadius ?? (structure.kind === 'hq' ? 28 : 22);
      const lineDistance = Math.hypot(
        structure.x - closestX,
        structure.y - closestY,
      );

      if (lineDistance <= structureRadius + 2 && t < bestT) {
        blocker = structure;
        bestT = t;
      }
    }

    return blocker;
  }

  beginStructureDetour(goal, structures, target) {
    if (this.structureDetour) return true;

    const blocker = this.findBlockingStructure(goal, structures, target);
    if (!blocker) return false;

    const dx = goal.x - this.x;
    const dy = goal.y - this.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = dx / length;
    const ny = dy / length;
    const px = -ny;
    const py = nx;
    const side = this.chooseAvoidanceSide(blocker, goal);
    const clearance = this.getStructureClearance(blocker);
    const lateral = clearance + 14;
    const approach = Math.max(9, clearance * 0.35);
    const exit = clearance + 20;

    this.structureDetour = {
      blocker,
      phase: 'side',
      nx,
      ny,
      sidePoint: {
        x: blocker.x + px * lateral * side - nx * approach,
        y: blocker.y + py * lateral * side - ny * approach,
      },
      exitPoint: {
        x: blocker.x + px * lateral * side + nx * exit,
        y: blocker.y + py * lateral * side + ny * exit,
      },
      exitProgress: exit,
    };

    return true;
  }

  continueStructureDetour(amount, structures) {
    const route = this.structureDetour;
    if (!route) return false;

    const waypoint = route.phase === 'side' ? route.sidePoint : route.exitPoint;
    moveToward(this, waypoint, amount);
    this.separateFromStructures(structures);

    if (route.phase === 'side') {
      const sideDistance = Math.hypot(this.x - route.sidePoint.x, this.y - route.sidePoint.y);
      if (sideDistance <= Math.max(3, amount * 2)) {
        route.phase = 'exit';
      }
      return true;
    }

    const forwardProgress = (
      (this.x - route.blocker.x) * route.nx
      + (this.y - route.blocker.y) * route.ny
    );
    const exitDistance = Math.hypot(this.x - route.exitPoint.x, this.y - route.exitPoint.y);

    if (forwardProgress >= route.exitProgress - 3 || exitDistance <= Math.max(3, amount * 2)) {
      this.structureDetour = null;
      this.avoidance = null;
    }

    return true;
  }

  moveWithStructureDetour(goal, structures, target, amount) {
    this.separateFromStructures(structures);

    if (!this.structureDetour) {
      this.beginStructureDetour(goal, structures, target);
    }

    if (this.structureDetour) {
      this.continueStructureDetour(amount, structures);
      return;
    }

    moveToward(this, goal, amount);
    this.separateFromStructures(structures);
  }

  update(dt, units, structures) {
    if (!this.alive) return;

    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.separateFromStructures(structures);

    const enemyUnit = this.getEnemyUnit(units);
    const target = enemyUnit ?? this.getEnemyStructure(structures);
    if (!target) return;

    // Uma vez iniciado o contorno, ele tem prioridade absoluta até a tropa
    // ultrapassar a construção. Isso evita o efeito de recalcular o alvo e
    // voltar para o centro da base a cada frame.
    if (this.structureDetour) {
      this.continueStructureDetour(this.speed * dt, structures);
      return;
    }

    const reach = this.attackRange + this.radius + (target.hitRadius ?? target.radius ?? 0);
    const d = distance(this, target);
    const lineBlocker = this.getLineBlockingStructure(target, structures);

    if (d <= reach && !lineBlocker) {
      if (this.cooldown <= 0) {
        this.attack(target, units);
        this.cooldown = this.attackDelay;
        this.flash = 0.1;
      }
      return;
    }

    const navigationPoint = this.getNavigationPoint(target);
    this.moveWithStructureDetour(navigationPoint, structures, target, this.speed * dt);
  }
}
