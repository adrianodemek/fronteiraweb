import { distance } from '../utils/math.js';

export class Structure {
  constructor(data) {
    Object.assign(this, data);
    this.maxHp = data.hp;
    this.cooldown = Math.random() * 0.25;
    this.flash = 0;
    this.hitRadius = data.kind === 'hq' ? 28 : 22;
    this.active = data.startsActive ?? data.kind !== 'hq';
  }

  get alive() {
    return this.hp > 0;
  }

  activate() {
    if (this.alive) this.active = true;
  }

  takeDamage(amount) {
    if (amount <= 0 || !this.alive) return;
    if (this.kind === 'hq') this.activate();
    this.hp = Math.max(0, this.hp - amount);
    this.flash = 0.08;
  }

  getSurfaceDistanceTo(unit) {
    const centerDistance = distance(this, unit);
    const targetRadius = unit.radius ?? 0;
    return Math.max(0, centerDistance - this.hitRadius - targetRadius);
  }

  update(dt, units) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flash = Math.max(0, this.flash - dt);
    if (!this.alive || this.cooldown > 0) return;
    if (this.kind === 'hq' && !this.active) return;

    let target = null;
    let bestSurfaceDistance = Infinity;

    for (const unit of units) {
      if (!unit.alive || unit.team === this.team) continue;

      // O alcance das construções agora usa a mesma referência das tropas:
      // distância útil entre as bordas, não apenas centro a centro.
      const surfaceDistance = this.getSurfaceDistanceTo(unit);
      if (surfaceDistance <= this.range && surfaceDistance < bestSurfaceDistance) {
        bestSurfaceDistance = surfaceDistance;
        target = unit;
      }
    }

    if (target) {
      target.takeDamage(this.damage);
      this.cooldown = this.attackDelay;
      this.flash = 0.12;
    }
  }

  draw(ctx, palette) {
    const isHq = this.kind === 'hq';
    const w = isHq ? 56 : 44;
    const h = isHq ? 54 : 46;
    const x = Math.round(this.x - w / 2);
    const y = Math.round(this.y - h / 2);

    if (!this.alive) {
      ctx.fillStyle = '#3b3a31';
      ctx.fillRect(x + 4, Math.round(this.y - 8), w - 8, 16);
      ctx.fillStyle = '#252821';
      ctx.fillRect(x + 9, Math.round(this.y - 4), 13, 6);
      ctx.fillRect(x + w - 20, Math.round(this.y - 7), 12, 9);
      return;
    }

    const isPlayer = this.team === 'player';
    const body = isPlayer ? palette.player : palette.enemy;
    const light = isPlayer ? palette.playerLight : palette.enemyLight;

    ctx.fillStyle = 'rgba(20, 24, 19, 0.30)';
    ctx.fillRect(x + 3, y + h - 3, w, 7);

    ctx.fillStyle = palette.outline;
    ctx.fillRect(x - 2, y + 3, w + 4, h - 1);

    ctx.fillStyle = '#b8b3a0';
    ctx.fillRect(x, y, w, 8);
    ctx.fillRect(x, y + 8, 7, h - 16);
    ctx.fillRect(x + w - 7, y + 8, 7, h - 16);

    ctx.fillStyle = this.flash > 0 ? light : body;
    ctx.fillRect(x + 7, y + 8, w - 14, h - 15);

    ctx.fillStyle = light;
    ctx.fillRect(x + 10, y + 12, w - 20, 6);

    ctx.fillStyle = palette.outline;
    ctx.fillRect(Math.round(this.x - 5), y + 17, 10, 9);

    ctx.fillStyle = palette.sandbag;
    for (let i = 4; i < w - 4; i += 9) {
      ctx.fillRect(x + i, y + h - 7, 8, 5);
    }

    if (isHq) {
      ctx.fillStyle = palette.outline;
      ctx.fillRect(Math.round(this.x - 2), y - 11, 3, 12);
      ctx.fillStyle = this.active ? body : '#454d43';
      ctx.fillRect(Math.round(this.x + 1), y - 11, 13, 7);
    }

    if (!isHq || this.hp < this.maxHp) {
      this.drawHpBar(ctx, palette, x, y, w, isPlayer);
    }
  }

  drawHpBar(ctx, palette, x, y, w, isPlayer) {
    const ratio = this.hp / this.maxHp;
    const barWidth = w + 8;
    const barX = x - 4;
    const barY = y - 11;

    ctx.fillStyle = '#202820';
    ctx.fillRect(barX, barY, barWidth, 7);

    ctx.fillStyle = isPlayer ? '#3b9cce' : '#c95a66';
    ctx.fillRect(barX + 1, barY + 1, Math.max(0, Math.round((barWidth - 2) * ratio)), 5);

    ctx.fillStyle = '#f3ead1';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.ceil(this.hp)}`, this.x, barY + 3.5);
  }
}
