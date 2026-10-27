import { Unit } from './Unit.js?v=0.6.2';
import { distance } from '../utils/math.js?v=0.6.3';

export class BattleUnit extends Unit {
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

      // Só estruturas realmente entre a unidade e o alvo bloqueiam a visão.
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

  update(dt, units, structures) {
    if (!this.alive) return;

    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.separateFromStructures(structures);

    const enemyUnit = this.getEnemyUnit(units);
    const target = enemyUnit ?? this.getEnemyStructure(structures);
    if (!target) return;

    const reach = this.attackRange + this.radius + (target.hitRadius ?? target.radius ?? 0);
    const d = distance(this, target);
    const lineBlocker = this.getLineBlockingStructure(target, structures);

    // Mesmo dentro do alcance, não é permitido atacar através de uma base/QG.
    // A unidade continua se movendo até conquistar uma linha de ataque livre.
    if (d <= reach && !lineBlocker) {
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
}
